# LifeCouple — Conformità legale prima della distribuzione

> Scritto il **2026-08-29**, dopo la decisione di pubblicare **con gli abbonamenti attivi** ([`monetizzazione.md`](../../../Marketing/LifeCouple/monetizzazione.md) §0-bis). Companion di [`pubblicazione.md`](pubblicazione.md), che copre il *come si pubblica*: qui c'è il *cosa deve essere vero perché si possa*.
>
> 🔴 **Non è consulenza legale.** [`Rule/legale-beta.md`](../../../Rule/legale-beta.md) si apre con questa stessa frase, e vale identica qui: *«è la mappa dei temi da coprire, da far validare a un avvocato prima del lancio commerciale»*. Finché LifeCouple era gratuito, partire dai modelli era ragionevole. **Dal momento in cui incassa**, il documento del brain dice che serve la validazione di un legale — e non è una cautela aggiunta oggi, è una regola già scritta.
>
> **Titolare del trattamento**: F.R. di Busato Fausto.

---

## 0. Perché questo documento non duplica il threat model

[`threat-model.md`](threat-model.md) §1 ha già classificato **quali dati esistono** e quanto pesano, ed è la fonte da cui si compilano sia l'informativa sia le dichiarazioni negli store. Qui non si ricopia quella tabella: si dice **cosa manca perché ciò che dovrà essere dichiarato sia vero**.

🔑 Il vincolo che tiene insieme le due cose è già in [`Rule/regole-sviluppo-sicuro.md`](../../../Rule/regole-sviluppo-sicuro.md) §13: **retention dichiarata = retention praticata**. Ogni riga scritta in un'informativa deve avere, da qualche parte, del codice che la rende vera.

---

## 1. Lo stato del codice al 2026-08-29

| | stato |
|---|---|
| Cancellazione account **dall'app** (Apple 5.1.1(v)) | ✅ costruita — schermata, funzione SQL, Edge Function |
| Scioglimento della coppia (D-04/D-21) | ✅ costruito — la funzione esisteva dal 2026-08-12, l'interfaccia dal 2026-08-29 |
| **Cancellazione dei file dallo Storage** (art. 17) | ✅ chiusa il 2026-08-29 — vedi §2 |
| **Portabilità dei dati** (art. 20) | ✅ costruita il 2026-08-29 — vedi §3 |
| Blocco del partner (Apple, contenuti condivisi) | ✅ è lo scioglimento |
| Conservazione a termine | 🔴 **non esiste** — vedi §4 |
| Avviso sulle domande personalizzate (D-19) | ⚠️ la funzione non esiste ancora; l'avviso va scritto **con** lei |
| Registro append-only delle azioni distruttive | ⚠️ parziale — `sciogli_coppia()` scrive in `registro_azioni`, il resto no |

🔴 **E su tutto quanto sopra vale un avvertimento che non va perso**: è **costruito e non verificato**. Nessuna cancellazione vera è mai stata eseguita, e la prova che conta è una sola — creare un account di prova, riempirlo, cancellarlo, e **ricontrollare il database e il bucket**. Non la schermata che dice di sì.

---

## 2. ✅ Art. 17 — la catena di cancellazione, chiusa

**Il difetto**, che il threat model §2 chiamava già per nome: *«si cancellano le righe indice ma i file restano nello storage → dati che dovevano sparire restano, e nessuna query li trova più: violazione dell'art. 17 GDPR **invisibile**»*.

**La catena, oggi, in ordine** — ed è l'ordine imposto da [`Rule/catena-cancellazione.md`](../../../Rule/catena-cancellazione.md), *prima i file, poi le righe*:

1. la Edge Function legge `foto.chiave_storage` **dell'utente che chiede** (solo di cui è autore: le foto non si duplicano allo scioglimento, D-21);
2. rimuove i binari dal bucket, a blocchi di 100;
3. chiama `prepara_cancellazione_account()`, che scioglie la coppia — e quindi applica D-04, D-21 e D-16;
4. cancella la riga da `auth.users`: la cascata della migrazione **0026** porta via tutte le righe di cui era autore;
5. con le righe di `foto` scatta il trigger `foto_pulisci_storage` (0009), che ripulisce eventuali `storage.objects` rimasti;
6. **rilegge** e fallisce esplicitamente se l'utente esiste ancora.

🔑 **Perché il passo 2 non era rimpiazzabile dal trigger.** Il trigger della 0009 toglie la riga da `storage.objects`, il che rende il file **irraggiungibile** — non lo cancella. Il binario resta finché Supabase non fa pulizia degli orfani. La 0009 lo scriveva e rimandava esplicitamente: *«il resto lo farà la cancellazione dell'account»*. Questo è il resto.

⚠️ **Il puntatore vive dentro la riga.** Cancellando prima le righe si perdono i nomi dei file, e i binari diventano impossibili da nominare — cioè lo stato peggiore dei due, perché da fuori sembra riuscito.

---

## 3. ✅ Art. 20 — portabilità

Era nel backlog sotto **«Dopo l'MVP, non prima»**, accanto alle notifiche push. ⚠️ **Ma non è una funzione: è un diritto**, esercitabile in qualunque momento, e «arriverà in una versione futura» non è una risposta ammessa.

Costruita in [`lib/esporta.ts`](../lib/esporta.ts) + un comando in Impostazioni. Produce un JSON — *formato strutturato, di uso comune e leggibile da dispositivo automatico*, che è la formula dell'articolo.

**Due confini dichiarati, e scritti dentro il file stesso** (perché il file sopravvive alla schermata che l'ha prodotto):

- **Solo ciò di cui l'utente è autore**, non tutto ciò che vede. È il confine di D-21, e non è formalismo: esportare anche i contenuti del partner permetterebbe di portarsi via i ricordi dell'altro con un bottone — cioè la ritorsione che **TB-2** esiste per impedire.
- **Le foto come metadati, non come immagini.** Un JSON con dentro un gigabyte di binari non è portabilità: è un file che non si apre.

---

## 4. 🔴 Quello che resta aperto nel prodotto

- **Nessuna conservazione a termine.** Lo scioglimento **revoca l'accesso, non cancella** (D-04): i dati restano indefinitamente. Se l'informativa dichiara un periodo, serve una configurazione che lo applichi — §13 delle regole. ⚠️ **Va deciso prima di scrivere l'informativa**, non dopo: è una decisione di prodotto travestita da riga legale.
- **Domande personalizzate (D-19).** Il threat model è esplicito: le persone ci scriveranno dentro sesso, salute e religione, cioè le categorie art. 9 per cui il ciclo mestruale è stato rimandato. La difesa che regge è *«non le chiediamo noi»* — un campo libero non è un trattamento *progettato* per raccoglierle. Le mitigazioni dichiarate (avviso al primo uso, mai riusate, nessuna analisi del contenuto) vanno costruite **insieme** alla funzione, non dopo.
- **Registro append-only delle azioni distruttive** (TB-2, *«non sono stato io a cancellarle»*): è accountability, art. 5(2). Oggi `registro_azioni` riceve solo lo scioglimento.

---

## 5. I documenti da produrre

I cinque modelli in [`Rule/`](../../../Rule/) sono scritti **per HeleoX**: vanno riadattati, non riusati.

| Documento | Base | Dove vive |
|---|---|---|
| Informativa privacy (artt. 13-14) | `Rule/informativa-privacy-app.md` | 🔴 **URL pubblico** — obbligatorio su entrambi gli store |
| Registro dei trattamenti (art. 30) | `Rule/registro-trattamenti.md` | interno, si esibisce al Garante |
| Catena di cancellazione | `Rule/catena-cancellazione.md` | interno — **§2 qui sopra è ciò che deve descrivere** |
| Procedura data breach (artt. 33-34) | `Rule/procedura-data-breach.md` | interno, cronometro di 72 ore |
| Cookie policy | `Rule/cookie-policy-app.md` | sul **sito** che ospita l'informativa, non nell'app |

✅ Per ospitare l'informativa esistono già due siti nel brain: `fr-busato` e `heleox-landing`.

---

## 6. I terzi — la parte più sottovalutata

Ognuno riceve dati personali, va **nominato nell'informativa e nel registro**, e vuole un accordo di trattamento firmato.

| Terzo | Cosa riceve | Nota |
|---|---|---|
| **Supabase** | tutto: account, contenuti, foto | 🔴 **regione UE mai verificata** — backlog aperto dal 2026-08-12. Fuori UE è trasferimento verso paese terzo: servono clausole contrattuali standard **e** va dichiarato |
| **Google Places** | testo delle ricerche, luoghi | trasferimento USA |
| **TMDB** | ricerche film | trasferimento USA + 🔴 licenza non commerciale (vedi `pubblicazione.md` §1.2) |
| **Apple / Google** | dati di pagamento | e RevenueCat, se adottato |

---

## 7. Quando si incassa: diritto dei consumatori

- **Recesso di 14 giorni** per i contenuti digitali, e le condizioni precise a cui decade (esecuzione immediata con consenso espresso e presa d'atto).
- **Informazioni precontrattuali** prima dell'acquisto: prezzo, durata, **rinnovo automatico**, come disdire. 🔑 È insieme obbligo di legge e regola Apple: si scrive una volta e vale per due.
- ⚠️ **Chi è il venditore verso l'utente finale** — Apple e Google agiscono da rivenditori nella UE, e questo determina **chi versa l'IVA**. Va verificato, non assunto: cambia gli obblighi fiscali dell'impresa.

---

## 8. Tre cose che sfuggono quasi sempre

- 🔴 **DSA — dati del professionista.** Chi vende nella UE deve fornire agli store e **mostrare** nome, indirizzo, telefono ed email del professionista. Riguarda F.R. di Busato Fausto direttamente, ed è **bloccante** sulla pubblicazione.
- ⚠️ **Minori.** L'art. 8 GDPR fissa in Italia a **14 anni** l'età del consenso: serve un'età minima nei termini, coerente con la classificazione dichiarata negli store.
- ⚠️ **Contenuti condivisi con un'altra persona.** L'invito fa sì che i contenuti raggiungano un altro utente: Apple può trattarla come app con contenuti generati dagli utenti e chiedere termini d'uso, un modo di segnalare e uno di bloccare. ✅ Il «bloccare» esiste — è lo scioglimento.

---

## 9. E una domanda da porre all'avvocato, non da decidere qui

Il threat model §1 dice che **il legame fra i due utenti** è *«un dato personale di entrambi, e in alcuni contesti è la cosa più sensibile dell'intero sistema»*.

⚠️ La conseguenza da far valutare: un'app che per definizione registra **l'esistenza di una relazione sentimentale fra due persone** può, per certi utenti, rivelare l'**orientamento sessuale** — che è categoria particolare ai sensi dell'**art. 9**. Non è un dato che si chiede: è un dato che si **deduce dalla struttura del prodotto**, che è precisamente il tipo di caso su cui una valutazione va chiesta a chi risponde professionalmente.

🔑 Il progetto ha già dimostrato di saper trattare questa classe di problemi — D-07 e D-08 hanno rimandato il ciclo mestruale e filtrato il banco domande proprio per stare fuori dall'art. 9. Questa è la stessa domanda applicata alla premessa del prodotto invece che a una sua funzione, e per questo non si risolve togliendo una funzione.
