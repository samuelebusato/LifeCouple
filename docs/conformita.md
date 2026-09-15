# LifeCouple — Conformità legale prima della distribuzione

> Scritto il **2026-08-29**, dopo la decisione di pubblicare **con gli abbonamenti attivi** ([`monetizzazione.md`](../../../Marketing/LifeCouple/monetizzazione.md) §0-bis). Companion di [`pubblicazione.md`](pubblicazione.md), che copre il *come si pubblica*: qui c'è il *cosa deve essere vero perché si possa*.
>
> 🔴 **Non è consulenza legale.** [`Rule/legale-beta.md`](../../../Rule/legale-beta.md) si apre con questa stessa frase, e vale identica qui: *«è la mappa dei temi da coprire, da far validare a un avvocato prima del lancio commerciale»*. Finché LifeCouple era gratuito, partire dai modelli era ragionevole. **Dal momento in cui incassa**, il documento del brain dice che serve la validazione di un legale — e non è una cautela aggiunta oggi, è una regola già scritta.
>
> **Titolare del trattamento**: **Samuele Busato**, persona fisica.
>
> 🔴 **Questa riga ha detto «F.R. di Busato Fausto» fino al 2026-09-15 (7), cioè per un giorno dopo D-136** — la decisione che ha cambiato il soggetto. ⚠️ *Era sfuggita alla passata di A10 perché quella aveva cercato il soggetto vecchio nei documenti **legali** (`docs/legal/`, `landing/`, i derivati), e questo è un documento **interno**: nomina il titolare senza essere reso a nessuno.* 🔑 **Ed è il posto peggiore dove sbagliarlo**: è il file che dice *cosa deve essere vero perché si possa pubblicare*, quindi chi lo apre per controllare la conformità leggeva il titolare sbagliato proprio mentre verificava.

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

~~🔴 **E su tutto quanto sopra vale un avvertimento che non va perso**: è **costruito e non verificato**.~~ ✅ **L'avvertimento è caduto il 2026-09-14 (3): la prova è stata eseguita**, ed è stata esattamente quella che questa riga chiedeva — account di prova creato, riempito, cancellato, database **e bucket** ricontrollati. Esito nella tabella di [`legal/catena-cancellazione.md`](legal/catena-cancellazione.md).

🔴 **E aveva ragione a esserci: al primo giro la cancellazione NON ha funzionato.** Due difetti sovrapposti (**B-68**), nessuno visibile dall'app — chiavi esterne nate *dopo* la passata della `0026`, e il trigger della `0025` che fermava anche la cascata dell'account. 🔑 *Si credeva che «Elimina account» cancellasse **male**; in realtà **falliva del tutto**.* Corretti da `0044` e `0045`. ⚠️ **Questa riga è rimasta rossa per un giorno dopo la prova**, come §7.3 del threat model e il backlog di `History.md` §6: corrette insieme il 2026-09-15 (5).

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
| **Termini d'uso** | 🔑 **nessun modello in `Rule/`** — scritti da zero | ✅ **URL pubblico** (`terms-of-use.html`) **+ link dentro l'app** — registrazione, Impostazioni e paywall, dal 2026-09-15 | ✅ [`legal/en/terms-of-use.md`](legal/en/terms-of-use.md) *(2026-09-10)* — **testo ufficiale, bozza NON in vigore** · [`legal/termini-uso.md`](legal/termini-uso.md) (IT, di lavoro) — 🔴 **non reso e non pubblicato**: porta ancora i `[TO BE DECIDED]`, e il generatore si rifiuta di costruirlo |

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

✅ **E dal 2026-09-10 l'URL esiste: <https://d2ehd6ideoltsh.cloudfront.net>.** La landing è pubblicata su S3 + CloudFront nell'account AWS di HeleoX (infrastruttura in [`infra/`](../infra/), procedura in [`deploy-landing.md`](deploy-landing.md), disegno in `History.md` **D-125**). Le due pagine rispondono a `/privacy-policy.html` e `/cookie-policy.html`, verificate a 200 sulla distribuzione reale. *Nessun dominio, per ora: agli store serve un indirizzo raggiungibile, non un bel nome.*

🔑 **Pubblicare ha però richiesto di chiudere prima una cosa**: la landing caricava i font da `fonts.googleapis.com`, e il piede di quella pagina linka **questa** cookie policy — il documento che dice «nothing follows you, inside or outside the app». ⚠️ *Finché il file stava in un repo privato non mandava l'IP di nessuno a nessuno; pubblicarlo è l'atto che avrebbe reso la dichiarazione falsa.* I font sono ora auto-ospitati, e `font-src 'self'` nella CSP fa bloccare dal browser qualunque reintroduzione.

⚠️ **Il deploy è manuale**: chi rigenera un documento legale deve anche **caricarlo**, o resta online una versione diversa da quella resa nell'app. Automazione nel backlog di `History.md` §6.

---

## 6. I terzi — la parte più sottovalutata

Ognuno riceve dati personali, va **nominato nell'informativa e nel registro**, e vuole un accordo di trattamento (art. 28).

> ⟳ **Precisato il 2026-09-15, perché la formulazione precedente sbagliava bersaglio.** Dire *«nessun accordo art. 28 accettato»* era impreciso: per **Apple** l'accordo vive dentro l'*Apple Developer Program License Agreement* già firmato, e per **Google** dentro i *Data Processing Terms* delle API. Per **Supabase**, **Expo** e **RevenueCat** le condizioni sul trattamento fanno parte dei termini di servizio che si accettano usando il prodotto.

> 🔑 **Quel che manca davvero non è l'accordo: è la COPIA ARCHIVIATA.** L'art. 5(2) chiede di poter *dimostrare* la conformità, e una clausola che vive dentro i termini di qualcun altro non si esibisce: serve un PDF in una cartella. ⚠️ *È una differenza che cambia il lavoro da fare* — non si tratta di negoziare cinque contratti, ma di scaricarne le copie.

> **Da fare, uno per fornitore:** scaricare il DPA di **Supabase** dal pannello (sezione legale dell'organizzazione); conservare copia del **Developer Program License Agreement** di Apple; accettare e salvare i **Data Processing Terms** di Google per il progetto API; chiedere copia del DPA a **Expo** e a **RevenueCat**.

> ⚠️ **E la conseguenza sull'informativa, corretta lo stesso giorno**: §4 diceva che i fornitori sono *«nominati»* responsabili — una parola che promette un atto formale nostro. Ora dice che ciascuno **agisce** come responsabile ed **è vincolato** dalle condizioni del proprio contratto, che è esattamente ciò che è vero oggi. 🔑 *L'archiviazione è un obbligo di accountability interno: non doveva stare in un documento rivolto agli utenti, e infatti non ci sta più.*

| Terzo | Cosa riceve | Nota |
|---|---|---|
| **Supabase** | tutto: account, contenuti, foto | ✅ **`eu-central-1` (Francoforte) — verificato il 2026-08-31** con `supabase projects list`. Il backlog aperto dal 2026-08-12 è chiuso: **nessun trasferimento verso paese terzo**, niente clausole contrattuali standard da adottare per lui. ⬜ Resta da accettare e archiviare il **DPA art. 28** |
| **Google Places** | testo delle ricerche, luoghi | trasferimento USA |
| **TMDB** | ricerche film | trasferimento USA + 🔴 licenza non commerciale (vedi `pubblicazione.md` §1.2) |
| **Apple / Google** | dati di pagamento | trasferimento USA. ⚠️ *Il denaro non passa da noi: incassa lo store* |
| **RevenueCat** | l'identificativo dell'utente e i dati d'acquisto | ⟳ **adottato il 2026-09-14** (D-133) — questa riga diceva *«se adottato»* fino al 2026-09-14 (3). Trasferimento USA; ✅ nominato nell'informativa §3/§4/§5 e nel registro art. 30 · 🔴 **DPA art. 28 da accettare e archiviare** |
| **Expo** (notifiche push) | il **testo** della notifica, e con esso un contenuto della coppia | ⟳ **dal 2026-09-14** (D-129): è il primo contenuto che esce dall'UE, e chi tiene spente le notifiche non ne fa uscire nessuno · 🔴 **DPA art. 28 da accettare e archiviare** |
| ⟳ **AWS** (S3 + CloudFront) | **niente di ciò che si inserisce nell'app**: la richiesta HTTP delle pagine pubbliche — IP e indirizzo richiesto. ⚠️ Dal 2026-09-15 quell'indirizzo può contenere il **token d'invito** | 🔴 **Aggiunto il 2026-09-15 (5), e la lacuna è del 2026-09-10**: la landing è pubblica da allora. ✅ *Log di accesso non attivi* e `PriceClass_100` (Europa + Nord America), entrambi verificati in `infra/main.tf` · 🔴 **DPA da archiviare — è il sesto, non il quinto** |

---

## 7. Quando si incassa: diritto dei consumatori

> ✅ **Dal 2026-09-09 questi tre punti hanno una casa**: sono redatti in [`legal/termini-uso.md`](legal/termini-uso.md) §8, §9 e §16. Qui restano come **mappa dei temi**, che è il ruolo di questo documento; il testo contrattuale sta lì e non si duplica.

- **Recesso di 14 giorni** per i contenuti digitali, e le condizioni precise a cui decade (esecuzione immediata con consenso espresso e presa d'atto).
- **Informazioni precontrattuali** prima dell'acquisto: prezzo, durata, **rinnovo automatico**, come disdire. 🔑 È insieme obbligo di legge e regola Apple: si scrive una volta e vale per due.
- ⚠️ **Chi è il venditore verso l'utente finale** — Apple e Google agiscono da rivenditori nella UE, e questo determina **chi versa l'IVA**. Va verificato, non assunto: cambia gli obblighi fiscali dell'impresa.

---

## 8. Tre cose che sfuggono quasi sempre

- 🔴 **DSA — dati del professionista.** Chi vende nella UE deve fornire agli store e **mostrare** nome, indirizzo, telefono ed email del professionista. È **bloccante** sulla pubblicazione.
  - 🔴 **RISCRITTO il 2026-09-15 (D-136): il soggetto non è più F.R. di Busato Fausto ma Samuele Busato**, persona fisica. ⚠️ *Questa riga diceva «riguarda F.R. di Busato Fausto direttamente», e con essa cadeva anche il problema* — perché quel soggetto la partita IVA, la sede e la PEC ce le aveva già. **Adesso non esistono.**
  - 🔑 **E «professionista» non si decide dal regime fiscale, ma dall'attività.** Codice del Consumo art. 3 e «trader» del DSA guardano se si agisce nell'esercizio di un'attività commerciale: **vendere abbonamenti lo è**. Non avere partita IVA non rende consumatori — quindi la domanda vera non è *«posso evitare i dati?»* ma *«con quale forma si vende?»*, ed è per il **commercialista**. L'unica strada che eviterebbe davvero l'obbligo è **non vendere niente**: app gratuita, nessun acquisto — il che però annulla D-133, D-134, D-135 e tutto l'impianto dei pagamenti.
  - ⟳ **La domanda posta dall'utente il 2026-09-14 (3): «bisogna per forza mettere anche la via?»** Sì: l'obbligo è un **indirizzo geografico**, non il solo comune — il Codice del Consumo (art. 49) lo chiede nelle informazioni precontrattuali, e Apple lo raccoglie come *trader* e lo **espone sulla scheda pubblica** dell'app. Oggi l'informativa porta solo «Novellara (RE)», P.IVA e REA: non basta.
  - 🔑 **Ma non deve essere l'abitazione.** L'obbligo è che l'indirizzo sia **reale e raggiungibile**, non che sia dove si dorme: una **domiciliazione** (dal commercialista o presso un servizio di sede operativa) produce un indirizzo pubblicabile diverso. Stessa cosa per il telefono, che può essere un numero dedicato e non quello personale.
  - ⚠️ **Va confermato col commercialista, non con l'avvocato**, ed è lui il professionista competente — costa meno e risponde prima. *Quel che non si può fare è pubblicare un indirizzo dove nessuno riceve la posta.* ⟳ **La motivazione è cambiata il 2026-09-15 e la conclusione no**: prima era la variazione camerale di una ditta individuale; ora è che **la forma stessa con cui si vende è da decidere** (D-136, Q1) — e da quella discende quale indirizzo esista da esporre.
  - ⚠️ **E i due posti devono coincidere**: ciò che si dichiara ad Apple come *trader* e ciò che sta nei termini d'uso §1 sono lo stesso dato — una divergenza è visibile a chiunque confronti la scheda dello store col documento.
- ⚠️ **Minori.** L'art. 8 GDPR fissa in Italia a **14 anni** l'età del consenso: serve un'età minima nei termini, coerente con la classificazione dichiarata negli store.
- ✅ **Contenuti condivisi con un'altra persona — chiuso il 2026-09-10 (D-124).** L'invito fa sì che i contenuti raggiungano un altro utente: Apple può trattarla come app con contenuti generati dagli utenti e chiedere termini d'uso, un modo di **segnalare** e uno di **bloccare**. Il «bloccare» esisteva ed è lo **scioglimento della coppia**; il «segnalare» ora è **`info@heleox.it`**, scritto nei termini §6. 🔑 *L'argomento da portare al revisore, se lo chiede*: qui il contenuto raggiunge **una sola persona scelta dall'utente**, mai un pubblico — un pulsante «segnala» accanto a ogni foto del proprio partner risponderebbe a un problema che questo prodotto non ha. ⬜ **Ripiego pronto**: una voce «Segnala un contenuto» in Impostazioni che apra la stessa email.

---

## 9. E una domanda da porre all'avvocato, non da decidere qui

Il threat model §1 dice che **il legame fra i due utenti** è *«un dato personale di entrambi, e in alcuni contesti è la cosa più sensibile dell'intero sistema»*.

⚠️ La conseguenza da far valutare: un'app che per definizione registra **l'esistenza di una relazione sentimentale fra due persone** può, per certi utenti, rivelare l'**orientamento sessuale** — che è categoria particolare ai sensi dell'**art. 9**. Non è un dato che si chiede: è un dato che si **deduce dalla struttura del prodotto**, che è precisamente il tipo di caso su cui una valutazione va chiesta a chi risponde professionalmente.

🔑 Il progetto ha già dimostrato di saper trattare questa classe di problemi — D-07 e D-08 hanno rimandato il ciclo mestruale e filtrato il banco domande proprio per stare fuori dall'art. 9. Questa è la stessa domanda applicata alla premessa del prodotto invece che a una sua funzione, e per questo non si risolve togliendo una funzione.
