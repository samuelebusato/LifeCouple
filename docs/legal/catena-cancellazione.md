# Catena di cancellazione dei dati — LifeCouple

> Documento **interno**, del 2026-08-31. Adattato da [`Rule/catena-cancellazione.md`](../../../../Rule/catena-cancellazione.md), che è scritta per HeleoX.
>
> 🔴 **La catena descritta qui è COSTRUITA e DEPLOYATA, ma NON ANCORA VERIFICATA end-to-end.** Nessuna cancellazione reale è mai stata eseguita. Finché non lo è, questo documento descrive un'intenzione del codice, non un fatto misurato. Il protocollo di prova è alla fine.

---

## Perché esiste questo documento

Perché l'art. 17 GDPR si viola più facilmente **per omissione parziale** che per rifiuto: si cancellano le righe indice, i file binari restano nello storage, nessuna query li trova più — e da fuori sembra tutto a posto. È il difetto che [`threat-model.md`](../threat-model.md) §2 chiamava già per nome: *«violazione dell'art. 17 GDPR **invisibile**»*.

Questo documento scrive **l'ordine** in cui la cancellazione deve avvenire, e perché quell'ordine non è arbitrario.

## Tre eventi distinti, tre effetti distinti

La confusione fra i tre è il rischio principale: un utente che preme «cancella account» credendo di sciogliere la coppia compie un atto **irreversibile** al posto di uno **reversibile**.

### 1. L'utente elimina un singolo CONTENUTO

| Cosa | Effetto |
|---|---|
| Il contenuto (foto, luogo, evento, voce di lista) | **Eliminato** |
| Il file binario associato, se è una foto | **Eliminato** dallo storage |
| Tutto il resto | Invariato |

**Solo l'autore può eliminare ciò che ha caricato** (D-21). Il partner non può cancellare i contenuti altrui: la ritorsione è strutturalmente impossibile, non solo vietata.

### 2. La coppia si SCIOGLIE (D-04)

| Cosa | Effetto |
|---|---|
| Accesso reciproco ai contenuti | 🔑 **REVOCATO** — le policy leggono l'appartenenza **attiva** (`uscito_il`), non quella storica |
| I dati | **NON cancellati** — ciascuno conserva ciò di cui è autore |
| Contenuti condivisi | Duplicati secondo D-21 |
| La creatura | Secondo D-16 |
| Registro | ✅ `sciogli_coppia()` scrive in `registro_azioni` |
| Notifica | A entrambi i membri |

⚠️ **Lo scioglimento revoca, non cancella.** È deliberato: i ricordi di una persona non spariscono perché l'altra ha premuto un pulsante.

### 3. L'utente CANCELLA L'ACCOUNT (art. 17)

🔑 **L'ordine è: prima i file, poi le righe.** E la ragione è meccanica, non formale: il nome del file vive **dentro la riga** (`foto.chiave_storage`). Cancellando prima le righe si perdono i puntatori, e i file diventano **irraggiungibili invece che cancellati** — che è esattamente lo stato che l'art. 17 vieta, con l'aggravante che da fuori sembra tutto a posto.

| # | Passo | Chi lo esegue |
|---|---|---|
| 1 | Legge `foto.chiave_storage` dell'utente richiedente, **solo di cui è autore** (le foto non si duplicano allo scioglimento, D-21) | Edge Function `cancella-account` |
| 2 | **Rimuove i binari dal bucket**, a blocchi di 100 | Edge Function |
| 3 | Chiama `prepara_cancellazione_account()`, che scioglie la coppia applicando D-04, D-21 e D-16 | Funzione Postgres, coi permessi dell'utente |
| 4 | Cancella la riga da `auth.users`; la cascata della migrazione **0026** porta via tutte le righe di cui era autore | Edge Function (`service_role`) |
| 5 | Il trigger `foto_pulisci_storage` (migrazione 0009) ripulisce eventuali `storage.objects` rimasti | Database |
| 6 | **Rilegge e fallisce esplicitamente** se l'utente esiste ancora | Edge Function |

🔑 **Perché il passo 2 non è rimpiazzabile dal trigger del passo 5.** Il trigger toglie la riga da `storage.objects`, il che rende il file **irraggiungibile** — non lo cancella. Il binario resta finché il fornitore non fa pulizia degli orfani. La migrazione 0009 lo scriveva e rimandava esplicitamente: *«il resto lo farà la cancellazione dell'account»*. Il passo 2 **è** quel resto.

### La divisione dei privilegi, e perché è questa

L'Edge Function possiede la chiave `service_role`: può fare qualsiasi cosa a chiunque, e la RLS non la ferma. **È l'unico punto dell'intero progetto con quel potere.** Il privilegio minimo (`Rule/regole-sviluppo-sicuro.md`) non dice di evitarlo — dice di **restringerlo a ciò che solo lui può fare**: qui, una riga di `auth.users`, di un utente che ha appena dimostrato di essere sé stesso presentando il proprio token.

Tutto il resto gira con i permessi dell'utente, dentro le regole ordinarie.

## Cosa NON viene cancellato, e perché

| Dato | Motivo | Base |
|---|---|---|
| **Dati contabili e fiscali** degli acquisti | Conservazione imposta dalla normativa fiscale | Obbligo legale (art. 6.1.c), 10 anni — dichiarato in informativa §7 |
| **Registro delle azioni distruttive** | Registra chi ha fatto cosa, inclusa la cancellazione. Un registro cancellabile da chi vi compare non è un registro | Legittimo interesse alla prova (art. 5.2, accountability). ⚠️ Oggi **parziale**: solo lo scioglimento vi scrive |
| **L'abbonamento** | 🔴 Non è nostro: è di Apple/Google. **Cancellare l'account non lo disdice.** Va detto all'utente nel momento in cui cancella | Fuori dal nostro controllo |

## Il limite dei backup, dichiarato e non nascosto

Il fornitore della base dati mantiene copie di continuità per il ripristino in caso di incidente. Un dato cancellato può persistere in tali copie fino allo scadere della loro retention.

⚠️ **[DA VERIFICARE]** — la retention effettiva del piano Supabase in uso. Va **letta nel pannello**, non stimata: il numero finisce nell'informativa privacy §7, e un numero sbagliato lì è una dichiarazione falsa.

## 🔴 Protocollo di prova — da eseguire prima della pubblicazione

Nessuna cancellazione reale è mai stata eseguita. **La schermata che dice «fatto» non è una prova** — è la lezione di B-23 applicata al posto più pericoloso in cui potesse servire.

**Mai sull'account vero.** La prova richiede un account creato apposta:

1. **Registrare** un account di prova e appaiarlo a un secondo account di prova.
2. **Riempirlo davvero**: almeno 3 fotografie (che vanno nel bucket), 2 luoghi, 1 evento, 1 voce di lista, 1 partita conclusa.
3. **Annotare prima**: il numero di righe per tabella e il numero di oggetti nel bucket riferiti a quell'utente.
4. **Cancellare l'account** dall'app.
5. 🔑 **Ricontrollare database e bucket direttamente**, non dall'app:
   - `auth.users` — la riga non c'è più;
   - le tabelle dei contenuti — nessuna riga con quell'`autore_id`;
   - **il bucket** — nessun oggetto con la chiave annotata al passo 3. *Questo è il controllo che conta*: è quello che il difetto invisibile supererebbe se guardassimo solo il database.
6. **Verificare l'effetto sul partner**: il secondo account deve vedere la coppia sciolta, conservare i propri contenuti, e non vedere più quelli cancellati.
7. **Annotare l'esito qui sotto**, con la data. Finché questa sezione è vuota, la catena è costruita e non provata.

### Esito della prova

| | Prima | Dopo |
|---|---|---|
| *(da compilare)* | — | — |

---

## Stato del deploy

| | |
|---|---|
| Edge Function `cancella-account` | ✅ **deployata il 2026-08-31** — `status ACTIVE`, `verify_jwt true` |
| Versione | **1** — ⚠️ era la **prima** volta: prima di oggi sul progetto non esisteva **nessuna** Edge Function, contrariamente a quanto risultava scritto |
| Variabili d'ambiente | Nessun secret da impostare: `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` sono iniettate dalla piattaforma |
| Prova end-to-end | 🔴 **mai eseguita** |

## Collegamenti

- Regola generale: [`Rule/catena-cancellazione.md`](../../../../Rule/catena-cancellazione.md)
- Stato della conformità: [`conformita.md`](../conformita.md) §2
- Minaccia originaria: [`threat-model.md`](../threat-model.md) §2
- Informativa resa agli utenti: [`informativa-privacy.md`](informativa-privacy.md) §7
