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

I cinque modelli in [`Rule/`](../../../Rule/) sono scritti **per HeleoX**: vanno riadattati, non riusati. ⚠️ **E i modelli non esauriscono i documenti necessari** — i termini d'uso non ne hanno uno, ed è il motivo per cui sono mancati fino al 2026-09-09 (vedi la nota sotto la tabella).

> ✅ **Scritti tutti e cinque il 2026-08-31** in [`docs/legal/`](legal/) — vedi **D-80**; il sesto il 2026-09-09. Sono **bozze non ancora in vigore**. ⟳ *Aggiornato il 2026-09-10*: dei punti aperti si sono chiusi l'**email per i diritti** (`info@heleox.it`) e le **quattro decisioni di prodotto** dei termini (**D-124**). 🔴 **Restano**: i **dati del professionista per il DSA** — telefono e indirizzo, che nel brain non esistono da nessuna parte e vanno **chiesti** · la **retention dei backup** Supabase, da **leggere** nel pannello · la **conservazione a termine** · **chi è il venditore** verso l'utente finale · la **valutazione professionale sull'art. 9**, §9 qui sotto.
>
> 🔑 **La decisione che li attraversa**: sulla conservazione a termine si dichiara **che non c'è**, perché è ciò che il sistema fa davvero. Dichiarare un termine senza la configurazione che lo applica non è un'imprecisione, è una dichiarazione falsa — quindi se un termine si vuole, **prima si costruisce e poi si scrive**.

| Documento | Base | Dove vive | Stato |
|---|---|---|---|
| Informativa privacy (artt. 13-14) | `Rule/informativa-privacy-app.md` | ✅ **dentro l'app** (2026-09-09) + ⟳ **URL pubblico**, obbligatorio su entrambi gli store | ✅ [`legal/en/privacy-policy.md`](legal/en/privacy-policy.md) — **è il testo ufficiale** (EN) · [`legal/informativa-privacy.md`](legal/informativa-privacy.md) (IT, **documento di lavoro, non reso**) · ✅ pagina pronta in `landing/privacy-policy.html` — ⬜ resta da **pubblicare la landing** |
| Registro dei trattamenti (art. 30) | `Rule/registro-trattamenti.md` | interno, si esibisce al Garante | ✅ [`legal/registro-trattamenti.md`](legal/registro-trattamenti.md) — **in italiano di proposito** (D-123) |
| Catena di cancellazione | `Rule/catena-cancellazione.md` | interno — **§2 qui sopra è ciò che deve descrivere** | ✅ [`legal/catena-cancellazione.md`](legal/catena-cancellazione.md) — contiene il **protocollo di prova**; **in italiano di proposito** (D-123) |
| Procedura data breach (artt. 33-34) | `Rule/procedura-data-breach.md` | interno, cronometro di 72 ore | ✅ [`legal/procedura-data-breach.md`](legal/procedura-data-breach.md) — **in italiano di proposito** (D-123) |
| Cookie policy | `Rule/cookie-policy-app.md` | ⟳ **dentro l'app** (2026-09-09) + sul sito che ospita l'informativa | ✅ [`legal/en/cookie-policy.md`](legal/en/cookie-policy.md) — **è il testo ufficiale** (EN) · [`legal/cookie-policy.md`](legal/cookie-policy.md) (IT, **documento di lavoro, non reso**) · ✅ pagina pronta in `landing/cookie-policy.html` — ⬜ resta da **pubblicare la landing** |
| **Termini d'uso** | 🔑 **nessun modello in `Rule/`** — scritti da zero | 🔴 **URL pubblico** + link dentro l'app | ✅ [`legal/en/terms-of-use.md`](legal/en/terms-of-use.md) *(2026-09-10)* — **testo ufficiale, bozza NON in vigore** · [`legal/termini-uso.md`](legal/termini-uso.md) (IT, di lavoro) — 🔴 **non reso e non pubblicato**: porta ancora i `[TO BE DECIDED]`, e il generatore si rifiuta di costruirlo |

> 🔴 **Il sesto documento, aggiunto il 2026-09-09: i termini d'uso.** La tabella qui sopra ne elencava cinque, e per nove giorni la loro assenza non è stata contata come lacuna perché **nessuna riga la nominava** — mentre tre documenti diversi li davano per esistenti: l'informativa §10-bis (*«va scritta qui e nei termini d'uso»*), il §8 qui sotto (Apple può chiederli per i contenuti generati dagli utenti) e [`pubblicazione.md`](pubblicazione.md) §3.1, che elenca *«mancano i link a termini e privacy»* fra i rifiuti frequenti.
>
> 🔑 **La lezione è la stessa del progetto applicata alla documentazione invece che al codice**: *un elenco di cose da fare non segnala ciò che non contiene*. I cinque erano completi rispetto ai modelli disponibili in `Rule/`, e la completezza rispetto ai modelli era stata scambiata per completezza rispetto al bisogno.
>
> ⚠️ **E il documento nuovo ha una natura diversa dagli altri cinque**: quattro dei suoi punti aperti non sono scelte di testo ma **decisioni di prodotto** già ferme nel backlog (sorte dell'abbonamento e dello spazio foto allo scioglimento, durata del preavviso, un modo di segnalare). Finché non si decidono, i termini non possono entrare in vigore — e nessuna riscrittura del testo lo cambia.

> ⟳ **Aggiornamento del 2026-09-09 (D-121): due documenti sono ora resi dentro l'app**, e la riga *«sul sito, non nell'app»* della cookie policy è superata. Informativa e cookie policy si leggono da **registrazione** e **Impostazioni**, come schermate interne — l'art. 13 vuole l'informativa nel momento della raccolta, e quel momento è la registrazione.
>
> 🔴 **Ma il testo reso è quello INGLESE, e solo quello.** Decisione dell'utente, col rischio sollevato prima e accettato: vedi [`History.md`](../History.md) §5. Le versioni italiane in `legal/` restano **documenti di lavoro** — contengono note editoriali e segnaposto `[DA DECIDERE]` — e **non sono rese a nessuno**.
>
> ⟳ **Aggiornamento del 2026-09-10 (D-123) — la divergenza fra le due lingue è chiusa, e non riportando l'italiano in pari.** L'utente ha stabilito che **la documentazione ufficiale è in inglese**, landing compresa. Da qui discendono tre cose, e sono verificabili:
>
> 1. i tre documenti italiani *user-facing* portano in testa un blocco che dice **«DOCUMENTO DI LAVORO — non è il testo ufficiale»**, con la regola di conflitto scritta dentro: *in caso di divergenza vince l'inglese, si corregge la copia italiana e mai il contrario*;
> 2. i tre documenti **interni** (registro art. 30, procedura breach, catena di cancellazione) **restano in italiano di proposito** — non li vede nessun utente, si esibiscono al **Garante**, e tradurli renderebbe più difficile un'ispezione senza nessun vantaggio. È scritto in testa a ciascuno perché non sembri una dimenticanza;
> 3. 🔑 **la guardia dei segnaposto di `tools/genera-legale.mjs` ora riconosce anche `[TO BE DECIDED]` e `[TO BE VERIFIED]`.** ⚠️ *Cercava solo le forme italiane: da quando i documenti ufficiali si scrivono in inglese, era cieca esattamente su ciò che doveva proteggere — e non avrebbe fallito, avrebbe generato.* Provata facendola fallire con un segnaposto inglese inserito apposta: exit 1, nomina la riga, non scrive niente.
>
> ⬜ **Restano fuori**: i **termini d'uso** (aspettano i quattro `[DA DECIDERE]` di prodotto e i dati DSA) e la **schermata d'acquisto**, che non esiste ancora.

⟳ **Dove vive l'URL pubblico — rivisto il 2026-09-10.** Le pagine ci sono: `landing/privacy-policy.html` e `landing/cookie-policy.html`, **generate dalla stessa fonte inglese** che entra nell'app (`tools/genera-legale.mjs`), linkate dal piede della landing. 🔑 *Generarle invece di scriverle è la sola difesa contro il caso in cui la versione pubblicata e quella resa nell'app dicano cose diverse — e una versione pubblicata che contraddice quella resa non è un disallineamento tecnico: è la prova documentale che la trasparenza non c'è.*

🔴 **Ma l'URL non esiste ancora, perché la landing non è pubblicata**: `landing/` sta nel repo e non è online da nessuna parte — nessun deploy, nessun dominio — verificato il 2026-09-09 e ancora vero il 2026-09-10. ⚠️ *Gli store chiedono un indirizzo raggiungibile, non un file nel repository.* Restano disponibili anche `fr-busato` e `heleox-landing`, se si preferisce ospitarli lì invece di pubblicare questa landing.

---

## 6. I terzi — la parte più sottovalutata

Ognuno riceve dati personali, va **nominato nell'informativa e nel registro**, e vuole un accordo di trattamento firmato.

| Terzo | Cosa riceve | Nota |
|---|---|---|
| **Supabase** | tutto: account, contenuti, foto | ✅ **`eu-central-1` (Francoforte) — verificato il 2026-08-31** con `supabase projects list`. Il backlog aperto dal 2026-08-12 è chiuso: **nessun trasferimento verso paese terzo**, niente clausole contrattuali standard da adottare per lui. ⬜ Resta da accettare e archiviare il **DPA art. 28** |
| **Google Places** | testo delle ricerche, luoghi | trasferimento USA |
| **TMDB** | ricerche film | trasferimento USA + 🔴 licenza non commerciale (vedi `pubblicazione.md` §1.2) |
| **Apple / Google** | dati di pagamento | e RevenueCat, se adottato |

---

## 7. Quando si incassa: diritto dei consumatori

> ✅ **Dal 2026-09-09 questi tre punti hanno una casa**: sono redatti in [`legal/termini-uso.md`](legal/termini-uso.md) §8, §9 e §16. Qui restano come **mappa dei temi**, che è il ruolo di questo documento; il testo contrattuale sta lì e non si duplica.

- **Recesso di 14 giorni** per i contenuti digitali, e le condizioni precise a cui decade (esecuzione immediata con consenso espresso e presa d'atto).
- **Informazioni precontrattuali** prima dell'acquisto: prezzo, durata, **rinnovo automatico**, come disdire. 🔑 È insieme obbligo di legge e regola Apple: si scrive una volta e vale per due.
- ⚠️ **Chi è il venditore verso l'utente finale** — Apple e Google agiscono da rivenditori nella UE, e questo determina **chi versa l'IVA**. Va verificato, non assunto: cambia gli obblighi fiscali dell'impresa.

---

## 8. Tre cose che sfuggono quasi sempre

- 🔴 **DSA — dati del professionista.** Chi vende nella UE deve fornire agli store e **mostrare** nome, indirizzo, telefono ed email del professionista. Riguarda F.R. di Busato Fausto direttamente, ed è **bloccante** sulla pubblicazione.
- ⚠️ **Minori.** L'art. 8 GDPR fissa in Italia a **14 anni** l'età del consenso: serve un'età minima nei termini, coerente con la classificazione dichiarata negli store.
- ✅ **Contenuti condivisi con un'altra persona — chiuso il 2026-09-10 (D-124).** L'invito fa sì che i contenuti raggiungano un altro utente: Apple può trattarla come app con contenuti generati dagli utenti e chiedere termini d'uso, un modo di **segnalare** e uno di **bloccare**. Il «bloccare» esisteva ed è lo **scioglimento della coppia**; il «segnalare» ora è **`info@heleox.it`**, scritto nei termini §6. 🔑 *L'argomento da portare al revisore, se lo chiede*: qui il contenuto raggiunge **una sola persona scelta dall'utente**, mai un pubblico — un pulsante «segnala» accanto a ogni foto del proprio partner risponderebbe a un problema che questo prodotto non ha. ⬜ **Ripiego pronto**: una voce «Segnala un contenuto» in Impostazioni che apra la stessa email.

---

## 9. E una domanda da porre all'avvocato, non da decidere qui

Il threat model §1 dice che **il legame fra i due utenti** è *«un dato personale di entrambi, e in alcuni contesti è la cosa più sensibile dell'intero sistema»*.

⚠️ La conseguenza da far valutare: un'app che per definizione registra **l'esistenza di una relazione sentimentale fra due persone** può, per certi utenti, rivelare l'**orientamento sessuale** — che è categoria particolare ai sensi dell'**art. 9**. Non è un dato che si chiede: è un dato che si **deduce dalla struttura del prodotto**, che è precisamente il tipo di caso su cui una valutazione va chiesta a chi risponde professionalmente.

🔑 Il progetto ha già dimostrato di saper trattare questa classe di problemi — D-07 e D-08 hanno rimandato il ciclo mestruale e filtrato il banco domande proprio per stare fuori dall'art. 9. Questa è la stessa domanda applicata alla premessa del prodotto invece che a una sua funzione, e per questo non si risolve togliendo una funzione.
