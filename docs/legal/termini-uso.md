# Termini d'uso — LifeCouple

> 🔴 **DOCUMENTO DI LAVORO — NON È IL TESTO UFFICIALE.** Dal **2026-09-10** la documentazione ufficiale di LifeCouple è **in inglese** (**D-123**): il testo di riferimento è [`en/terms-of-use.md`](en/terms-of-use.md), scritto lo stesso giorno. ⚠️ **Nessuno dei due è in vigore** — restano le decisioni di prodotto elencate in fondo — ma quando lo saranno sarà **l'inglese** a esserlo. In caso di divergenza vince l'inglese, sempre: si corregge questo file, mai quello.
>
> **Versione `termini-1.2` — in vigore dal 2026-09-15.** ⚠️ **Questo file è il documento DI LAVORO**: il testo ufficiale è [`en/terms-of-use.md`](en/terms-of-use.md) (**D-123**), ed è quello reso dentro l'app e pubblicato su `terms-of-use.html`. In caso di divergenza vince l'inglese.
>
> ➳ **Dal 2026-09-15 il documento è RESO, e lo è con due segnaposto dentro** — `[indirizzo]` e `[numero di telefono]`, l'obbligo DSA. 🔑 *È una decisione esplicita dell'utente*, presa sapendo che finiscono anche su una pagina pubblica: i due dati esistono come decisione ma non ancora come valori, e verranno sostituiti. ⚠️ **Il rischio non è legale ma di memoria** — l'app non è pubblicata, quindi l'obbligo DSA non è ancora attivo verso nessuno — e per questo `tools/genera-legale.mjs` **chiude ogni esecuzione** con il conto dei segnaposto rimasti, invece di un silenzioso «fatto».
>
> 🔴 **Non è consulenza legale.** Vale la stessa frase con cui si apre [`conformita.md`](../conformita.md): *dal momento in cui il servizio incassa, serve la validazione di un avvocato prima del lancio commerciale*. Questo documento è la mappa dei temi da coprire e il testo su cui farla, non il testo definitivo.
>
> 🔑 **A differenza degli altri cinque documenti di [`legal/`](.), questo non è l'adattamento di un modello: in [`Rule/`](../../../../Rule/) non esiste un modello di termini d'uso.** Gli unici termini scritti nel brain sono [`Projects/HeleoX/docs/legal/condizioni-beta.md`](../../../HeleoX/docs/legal/condizioni-beta.md), che regolano una **beta B2B** con clausole di autorizzazione alla scansione: struttura riusabile, contenuto no. LifeCouple è **B2C puro con abbonamento**, ed è un altro contratto.
>
> ⟳ **Ne restano TRE**, e nessuno è più una decisione di prodotto: **telefono** e **indirizzo** del professionista (obbligo DSA, vanno chiesti — non si stimano) e **chi è il venditore verso l'utente finale** (da verificare sui contratti Apple/Google). *(Erano otto il 2026-09-09 e il documento ne dichiarava sette. Il 2026-09-10 si è chiusa l'email, poi le **quattro decisioni di prodotto** — **D-124**. Ricontati: tre.)*
>
> 🔴 **E una condizione che precede il documento: nell'applicazione non esiste il punto in cui QUESTI termini vengono accettati.** ⟳ *Rivisto il 2026-09-10*: dal 2026-09-09 [`app/(pubbliche)/registrati.tsx`](../../app/(pubbliche)/registrati.tsx) mostra i link all'**informativa privacy** e alla **cookie policy** prima del pulsante che crea l'account (**D-121**) — ma **non ai termini d'uso**, che nell'app non entrano finché portano segnaposto. Un contratto che nessuno accetta non è in vigore, per quanto ben scritto sia. Vedi §2.

---

## 1. Chi eroga il servizio

LifeCouple è offerta da **Samuele Busato**, persona fisica residente in Italia.

- Email: **info@heleox.it** *(scelta il 2026-09-10, D-121 — la stessa della §1 dell'[informativa privacy](informativa-privacy.md), come doveva essere: una sola)*
- Telefono: **[numero di telefono]**
- Indirizzo: **[indirizzo]**

Sugli store l'editore risulta **«Samuele Busato»**, la stessa persona indicata sopra, che è anche il titolare del trattamento dei dati — vedi l'[informativa privacy](informativa-privacy.md) §1.

🔴 **Dati del professionista ai sensi del DSA — obbligo bloccante.** Chi vende nella UE deve fornire agli store e **rendere visibili** nome, indirizzo, telefono ed email. Finché indirizzo e telefono non sono decisi, questo documento non è pubblicabile: non è una formalità redazionale, è il motivo per cui la scheda store può essere rifiutata.

⚠️ **La forma con cui si vende resta da confermare, e il documento non la dichiara** (D-136, Q1 · `pubblicazione.md` **A8**). Il soggetto è una **persona fisica senza partita IVA** e il servizio ha **piani a pagamento** (D-134). 🔑 *Il testo qui sopra è comunque veritiero — dice chi eroga il servizio, e quello è un fatto* — ma il contratto non è la sede in cui quel nodo si scioglie: è una questione per il **commercialista**, e resta aperta anche quando questo documento sarà pubblicabile.

> 🔑 **Perché il segnaposto sulla forma è stato tolto il 2026-09-15**, dopo essere stato aggiunto poche ore prima: un segnaposto dichiara *un dato che manca al testo*, e alla §1 non manca nulla — il venditore è nominato per intero. ⚠️ *Ciò che manca non è una riga del contratto, è una verifica fuori dal contratto*, e tenerla dentro come `[DA DECIDERE]` confondeva le due cose. Vive ora dove gli altri rischi accettati vivono: in `History.md` e nel piano.

## 2. Cosa si accetta, e quando

Creando un account accetti questi termini e dichiari di aver letto l'[informativa privacy](informativa-privacy.md). Se non li accetti, non puoi usare il servizio.

⟳ **Questo punto era scritto e non costruito. Dal 2026-09-09 lo è a metà** (**D-121**). Perché la frase qui sopra sia vera servono, dentro l'applicazione:

1. ✅ nella schermata di registrazione, i link **all'informativa e alla cookie policy**, prima del pulsante che crea l'account — fatti, `app/(pubbliche)/registrati.tsx`. È anche il momento in cui l'art. 13 GDPR vuole che l'informativa sia resa, cioè *al momento della raccolta*;
2. ✅ gli stessi link **permanenti** in Impostazioni — fatti, `app/impostazioni.tsx`;
3. ✅ **i link a QUESTI termini — fatti il 2026-09-15**, in registrazione (`app/(pubbliche)/registrati.tsx`, prima del pulsante che crea l'account) e in Impostazioni. ➳ *Questa riga è stata rossa fino a oggi per una ragione precisa*: il documento non entrava nell'app finché portava segnaposto, e il generatore si rifiutava di costruirlo. Ora è reso con i due segnaposto dei dati di contatto, per decisione dell'utente;
4. ✅ i medesimi link **dentro la schermata di acquisto — fatti il 2026-09-15**: `app/paywall.tsx` porta tutti e tre. Sono un requisito degli store prima ancora che della legge ([`pubblicazione.md`](../pubblicazione.md) §3.1 li elenca fra i tre rifiuti banali e frequentissimi).

✅ **Quindi il «punto di accettazione» ESISTE, dal 2026-09-15**: creando l'account si accettano questi termini, e sono **conoscibili prima** — che è ciò che rende vera la prima frase di questa sezione. ⚠️ *Restano dentro i due segnaposto dei dati di contatto*, e restano dovute la revisione dell'avvocato e la conferma del commercialista.

⚠️ **Non serve una casella da spuntare**: per un contratto a distanza è sufficiente che i termini siano conoscibili prima di concludere, e un'accettazione per spunta obbligatoria non aggiunge validità. Serve invece che i link **ci siano** — e per i termini d'uso, oggi, non ce n'è nessuno.

## 3. Cos'è LifeCouple

LifeCouple è il diario privato di **due persone**: calendario, luoghi, fotografie, liste, giochi e una creatura che cresce con voi.

🔑 **L'unità del servizio è la coppia, non l'individuo**, e da questo discendono quasi tutte le regole che seguono. Il servizio presuppone **due account collegati**: da soli, l'applicazione non produce ciò per cui esiste.

## 4. Chi può usarlo

- Devi aver compiuto **14 anni**, età fissata dall'ordinamento italiano per i servizi della società dell'informazione (art. 8 GDPR, art. 2-*quinquies* del Codice Privacy). La data di nascita è richiesta alla registrazione e chi dichiara meno di 14 anni non può creare l'account.
- La data che dichiari deve essere **veritiera**. ⚠️ È una dichiarazione, non una verifica documentale: non abbiamo modo di controllarla, e non pretendiamo di averlo.
- **Un account per persona.** L'account è personale: le credenziali non si condividono, nemmeno col partner. Sei responsabile di ciò che avviene dal tuo account.
- 🔴 **Un limite che è onesto dichiarare qui e non solo nell'informativa**: nessuna misura tecnica protegge dall'accesso di chi conosce le tue credenziali o usa il tuo telefono sbloccato. Proteggi il dispositivo con un blocco schermo.

## 5. La coppia: come si forma, cosa vede l'altro, cosa succede se finisce

**Si forma** con un invito che tu generi e l'altra persona apre. Una coppia è composta da **due** membri: non esistono gruppi.

**Durante la coppia** il partner vede i contenuti condivisi — calendario, luoghi, fotografie, liste, risultati dei giochi, e la data di nascita come compleanno. **Vede la tua posizione attuale solo se sei tu ad accendere la condivisione**, spenta finché non la accendi. I dettagli sono nell'[informativa privacy](informativa-privacy.md) §3.1 e §6, e vanno letti prima di accendere.

**Ciascuno resta autore di ciò che ha caricato**: solo chi ha inserito un contenuto può modificarlo o cancellarlo. Il partner non può cancellare le tue fotografie né i tuoi contenuti. 🔑 *Non è una cortesia dell'interfaccia: è imposto dal database, quindi la ritorsione è strutturalmente impossibile e non solo vietata.*

**Se la coppia si scioglie**, l'accesso reciproco viene **revocato**: nessuno dei due vede più i contenuti dell'altro. Lo scioglimento **non cancella** i dati — ciascuno conserva ciò di cui è autore. Entrambi ricevono notifica.

⚠️ **Sciogliere la coppia e cancellare l'account sono due atti diversi**, con conseguenze diverse: il primo è reversibile (potete ricollegarvi), il secondo no. Per cancellare i tuoi dati non basta sciogliere: vedi §11.

## 6. I tuoi contenuti

**Restano tuoi.** Non acquisiamo la proprietà di ciò che carichi e non lo usiamo per nessuno scopo diverso dall'erogazione del servizio: non lo pubblichiamo, non lo cediamo, non lo analizziamo, non lo usiamo per addestrare alcun sistema. Ci autorizzi soltanto a conservarlo e a mostrarlo **a te e al tuo partner**, che è ciò che il servizio fa.

**Cosa non puoi caricare**: contenuti illeciti, materiale che ritrae persone che non hanno acconsentito, contenuti che violano diritti altrui, e in particolare **qualunque materiale che coinvolga minori in contesto sessuale**. Non facciamo moderazione preventiva dei contenuti privati di una coppia — e proprio per questo la responsabilità di ciò che carichi è **interamente tua**.

⚠️ **Attenzione a cosa scrivi nei campi liberi.** Recensioni, note e domande personalizzate arrivano sui nostri server. Non ti chiediamo mai dati particolari ai sensi dell'art. 9 GDPR e non analizziamo ciò che scrivi, ma se scegli di scriverli spontaneamente restano comunque memorizzati.

✅ **Segnalare i contenuti — deciso dall'utente il 2026-09-10 (D-124): si scrive a `info@heleox.it`.** Ogni segnalazione viene letta, si risponde senza ritardo ingiustificato, e i contenuti illeciti hanno priorità.

🔑 **Bloccare non richiede noi** ed esiste già: lo scioglimento della coppia revoca l'accesso reciproco, e lo può fare solo l'interessato. ⚠️ *L'argomento da portare al revisore, se lo chiede*: qui il contenuto raggiunge **una sola persona scelta dall'utente**, mai un pubblico — quindi i due meccanismi che le linee guida chiedono ci sono entrambi, in una forma proporzionata al prodotto. **Se il revisore non lo accetta**, il ripiego è una voce «Segnala un contenuto» dentro l'app che apra la stessa email: costa poco e si aggiunge in un giro.

## 7. Cosa è gratuito e cosa si paga

> 🔴 **RISCRITTA il 2026-09-15, e la riverifica che questa nota chiedeva è stata fatta — contro `0042_confine_gratis.sql`, non contro il registro delle decisioni.** L'esito: **questa sezione diceva il falso su quattro punti**. Mappa, luoghi, liste e creatura erano dichiarati gratuiti e **sono a pagamento** da **D-135** (2026-09-14); il gratuito sulle foto non è «1 GB» ma **una foto per evento**.
>
> ⚠️ **E il quarto punto era una promessa, non una descrizione**: *«la crescita della creatura non è e non sarà a pagamento»*. Quella riga è stata **rimossa**, perché D-135 l'ha contraddetta. 🔑 *La nota che stava qui aveva ragione a esistere e ha funzionato*: diceva «questo è il punto del documento in cui è più facile che accada», e infatti è accaduto — nel senso opposto a quello temuto, cioè il prodotto che si stringe sotto un testo che era rimasto largo.
>
> 🔑 **La ragione per cui nessuno se n'era accorto è sempre la stessa di questo progetto**: D-135 è stata presa in un altro file, in un'altra sessione, e *non contiene la parola «termini»*. Una frase corretta quando è stata scritta non resta corretta da sola.

**Gratuito**: calendario ed eventi, **una fotografia su ciascun evento**, e **una partita completa al giorno** per la coppia.

**Compreso nell'abbonamento «Insieme»**: mappa e luoghi, liste, creatura, fotografie oltre la prima su ogni evento, fotografie aggiunte direttamente in galleria, e partite oltre la prima di ogni giorno.

**Il tetto di 1 GB per coppia vale su ogni piano**, abbonamento compreso: è un limite di spazio (D-22), non una funzione a pagamento.

🔑 **Cosa non dipende mai dal pagare**: leggere, esportare e cancellare i propri contenuti. Se un abbonamento finisce, **nulla di ciò che hai già inserito viene rimosso, alterato o reso illeggibile** — i limiti valgono sull'*aggiungere*, mai su ciò che c'è già. ⚠️ *Non è una cortesia: è la ragione scritta in `0042` per cui mappa e liste non hanno un muro sulla lettura* — chiudere la lettura dei propri luoghi sarebbe tenere in ostaggio i ricordi di qualcuno. Gli artt. 15 e 20 GDPR valgono su ogni piano.

## 8. L'abbonamento «Insieme»

- **Prezzo**: **€7,99 al mese** oppure **€39,99 all'anno**. I prezzi indicati negli store al momento dell'acquisto sono quelli che fanno fede, IVA inclusa.
- 🔑 **Un solo pagamento, valete in due.** L'abbonamento è **della coppia**: lo store lo intesta però alla persona che paga, perché non esiste un abbonamento intestato a due account.
- **Una settimana gratis, la prima volta.** Un abbonamento nuovo comincia con **sette giorni senza costi**. Se disdici prima della fine di quei sette giorni **non paghi nulla**; se non lo fai, l'abbonamento parte da solo al prezzo indicato sopra e si rinnova da lì. ⚠️ Il periodo gratuito è offerto **una volta per persona e per gruppo di abbonamento**, per regola dello store e non nostra: chi l'ha già usato — anche tramite l'In Famiglia — si abbona al prezzo pieno. Se il periodo gratuito sia disponibile o no te lo dice l'applicazione **prima** che tu confermi, perché è lo store a concederlo.
- **Rinnovo automatico** alla scadenza, salvo disdetta. La disdetta si effettua **dalle impostazioni del tuo telefono** (App Store), non dall'applicazione: noi non possiamo disdire al posto tuo. Per non pagare il periodo successivo — compreso il primo dopo una settimana gratuita — la disdetta deve avvenire **almeno 24 ore prima** della fine del periodo in corso, come gli store richiedono.
- **Momento della disdetta**: se disdici, il servizio resta disponibile **fino alla fine del periodo già pagato**, e non oltre.
- **Ripristino acquisti**: se cambi o reinstalli, puoi ripristinare l'abbonamento dall'applicazione.
- ✅ **Chi è il venditore verso di te — chiuso il 2026-09-15.** L'abbonamento si acquista **tramite App Store**, e in forza del *Paid Applications Agreement* di Apple è **Apple** il venditore verso di te nella UE: **Apple emette la ricevuta** e **il rimborso si chiede ad Apple**, non a noi. Possiamo assisterti, non possiamo rimborsare al posto suo. ⚠️ *Google non compare più in questa clausola*: con **D-132** si pubblica su iPhone soltanto.
- ✅ **L'abbonamento resta a chi l'ha pagato** — deciso dall'utente il 2026-09-10 (**D-124**). 🔑 **La conseguenza tecnica è la parte che conta**: il diritto si scrive **sull'utente**, non sulla coppia, e mentre la coppia esiste si *proietta* su entrambi. Allo scioglimento finisce la proiezione, non il diritto. Va costruito così quando si costruiranno i pagamenti.
- ✅ **Non si cancella mai niente per fare spazio** — deciso il 2026-09-10 (**D-124**), e **non è una scelta nuova: è ciò che il codice già fa.** Il tetto è un trigger `BEFORE INSERT` che solleva un'eccezione (`0001_schema_iniziale.sql:330`); non esiste nessuna potatura. ⚠️ *E lo scenario temuto non è raggiungibile*: dopo lo scioglimento `foto_insert` richiede `e_membro_attivo`, quindi in quella cartella non carica più nessuno, e una coppia nuova nasce col contatore a zero.

## 9. Diritto di recesso

Sei un **consumatore**: hai diritto di recedere entro **14 giorni** dall'acquisto, senza motivazione, ai sensi del Codice del Consumo (D.lgs. 206/2005).

⚠️ **Ma per i contenuti digitali il diritto decade** se l'esecuzione inizia subito, e inizia subito per costruzione: nel momento in cui l'abbonamento si attiva, il servizio è già fornito. Perché la decadenza sia valida servono **due cose insieme**, al momento dell'acquisto: il tuo **consenso espresso** all'esecuzione immediata e la tua **presa d'atto** di perdere il recesso.

🔑 **Tradotto in una voce di lavoro, non in una clausola**: la schermata di acquisto deve dire queste due cose **prima** del pulsante che paga. Senza, la decadenza non opera e il recesso resta esercitabile per quattordici giorni.

Il recesso, dove spetta, si esercita presso **Apple**, che ha venduto (vedi §8).

## 10. Conformità del servizio e responsabilità

Il servizio è fornito con la diligenza dovuta, ma **non garantiamo disponibilità continua e priva di interruzioni**: dipende da fornitori terzi, dalla rete e dal tuo dispositivo.

✅ **Restano integri i tuoi diritti inderogabili di consumatore**, fra cui la garanzia di conformità dei contenuti e servizi digitali. Nulla in questo documento li limita, e in caso di contrasto **prevalgono su queste clausole**.

Nei limiti consentiti dalla legge, non rispondiamo dei danni indiretti né della perdita di dati imputabile a cause fuori dal nostro controllo. ⚠️ **Non è escludibile — e non escludiamo — la responsabilità per dolo o colpa grave**, né quella per danni alla persona.

🔴 **E una cosa che va detta invece che nascosta in una clausola di esonero**: LifeCouple custodisce ricordi, e i ricordi non hanno una copia altrove se non te la fai tu. Puoi **esportare i tuoi dati in qualsiasi momento** da Impostazioni. Fallo.

## 11. Cancellazione dell'account

Puoi cancellare il tuo account **dall'applicazione**, da Impostazioni. La cancellazione è **immediata e definitiva**: non c'è periodo di ripensamento. Comprende le tue fotografie, i contenuti di cui sei autore e l'account.

Fanno eccezione i **dati contabili e fiscali**, che la legge impone di conservare per 10 anni.

🔴 **Cancellare l'account non disdice l'abbonamento.** Gli abbonamenti sono gestiti da Apple: vanno disdetti dalle impostazioni del telefono, altrimenti il rinnovo prosegue anche se l'account non esiste più. ⚠️ *Va detto anche dentro l'app, nel momento in cui si preme «cancella account», non solo qui.*

Dettagli e limiti nell'[informativa privacy](informativa-privacy.md) §7.

## 12. Uso corretto e sospensione

Non puoi usare il servizio per fini illeciti, tentare di accedere ad account o contenuti altrui, aggirare i limiti tecnici, o interferire con il funzionamento del sistema.

In caso di violazione grave possiamo sospendere o chiudere l'account, **dandone comunicazione** e — quando la violazione non lo impedisce — **la possibilità di esportare i dati** prima della chiusura.

## 13. Proprietà intellettuale

L'applicazione, il nome, la grafica e la creatura **Philippe** sono nostri o dei rispettivi titolari. L'abbonamento dà diritto a **usare** il servizio, non ad acquisirne i contenuti.

**Servizi di terzi utilizzati per le ricerche:**

- **Google Places**, per la ricerca dei luoghi;
- **TMDB** *(The Movie Database)*, per la ricerca dei film. ⚠️ La loro attribuzione va **mostrata accanto ai risultati** — è una condizione delle loro condizioni d'uso, non una cortesia — nella formula richiesta da TMDB, da riverificare sul loro testo al momento della pubblicazione.

🔴 **La posizione su TMDB è tuttora aperta ed è un blocco alla pubblicazione**, non una nota: la chiave gratuita copre il solo uso **non commerciale**, e con gli abbonamenti l'uso è commerciale dal primo giorno. Le tre mosse rimaste sono nel backlog di [`History.md`](../../History.md).

## 14. Modifiche

Possiamo modificare questi termini per ragioni tecniche, normative o di evoluzione del servizio. Le modifiche **sostanziali** ti saranno comunicate dentro l'applicazione **prima** che abbiano effetto, e potrai disdire l'abbonamento se non le accetti.

## 15. Se il servizio dovesse chiudere

Riceverai un **preavviso** dentro l'applicazione e all'indirizzo email del tuo account, con una data certa, e prima di quella data potrai **esportare i tuoi dati**. Alla chiusura i dati sono cancellati secondo la §11.

Gli abbonamenti in corso: il rinnovo automatico viene disattivato e il servizio resta disponibile **fino alla scadenza del periodo già pagato**.

> ✅ **Preavviso: almeno 60 giorni, e mai prima della fine di un periodo già pagato** — deciso il 2026-09-10 (**D-124**). Lo stesso numero è nell'[informativa privacy](informativa-privacy.md) §10-bis.
>
> 🔑 **Perché la seconda metà, e non un rimborso pro-rata.** «Non chiudo prima che scada quello che hai pagato» è una promessa mantenibile **senza costruire niente**: basta non spegnere. Il rimborso del non goduto invece **su iOS non lo puoi emettere tu** — lo emette Apple — quindi sarebbe una promessa la cui esecuzione dipende da un terzo. ⚠️ *Il costo di questa scelta è dichiarato: con un annuale venduto il giorno prima dell'annuncio, il servizio resta in piedi fino a dodici mesi.* Si limita smettendo di vendere abbonamenti nel momento dell'annuncio.

## 16. Assistenza, reclami, legge applicabile

- Per assistenza e reclami scrivi ai contatti della §1.
- **Legge applicabile**: legge italiana. ✅ Restano ferme le disposizioni imperative più favorevoli previste dalla legge del paese in cui risiedi abitualmente, se sei consumatore residente in un altro Stato dell'Unione.
- **Foro competente**: quello del luogo di residenza o domicilio del consumatore, se in Italia — è **inderogabile** e non può essere spostato da questo documento.
- ⚠️ **Nessun rinvio alla piattaforma ODR europea.** È una clausola presente in quasi tutti i termini in circolazione, ma quella piattaforma **ha cessato di operare nel 2025**: rinviarci significherebbe indicare al consumatore uno strumento che non esiste. Se si vuole indicare una via stragiudiziale va nominato un **organismo ADR reale**, e la scelta va fatta al momento della pubblicazione perché è materia che cambia.

---

## ⚠️ Da chiudere prima di mandare in vigore

Non sono dettagli redazionali. I primi quattro **non sono decisioni di testo**: sono decisioni di prodotto già aperte nel backlog, e finché non si prendono il documento non può dire il vero.

| # | Cosa | Dove è già aperta |
|---|---|---|
| 1 | ⟳ **I link dentro l'app** — ✅ informativa e cookie policy in registrazione e Impostazioni dal 2026-09-09 (**D-121**); 🔴 **i termini d'uso no**, e la schermata d'acquisto non esiste | §2 di questo documento |
| 2 | ✅ **Sorte dell'abbonamento e dello spazio foto allo scioglimento** — **chiuse il 2026-09-10** (**D-124**): l'abbonamento resta a chi paga; per lo spazio non si cancella mai niente | **D-124** |
| 3 | ✅ **Durata del preavviso di chiusura** — **chiusa il 2026-09-10**: **60 giorni**, mai prima della fine di un periodo pagato. Scritto in entrambi i documenti | **D-124** |
| 4 | ✅ **Un modo di segnalare** — **chiusa il 2026-09-10**: email a `info@heleox.it`. ⬜ *Resta l'eventuale voce in-app, se il revisore la chiede* | **D-124** |
| 5 | 🔴 **Indirizzo e telefono del professionista** — obbligo DSA, bloccante | `conformita.md` §8 |
| 6 | ✅ **Email di contatto** — **chiusa il 2026-09-10**: `info@heleox.it`, una sola, condivisa con l'informativa | `informativa-privacy.md` §1 |
| 7 | ⚠️ **Chi è il venditore verso l'utente finale** (Apple/Google) | `conformita.md` §7 |
| 8 | ⚠️ **Consenso espresso + presa d'atto** nella schermata d'acquisto, o il recesso non decade | §9 |
| 9 | ⚠️ **Riverificare §7 e §8 contro il prodotto costruito** — oggi non esiste codice di pagamento | §7 |
| 10 | ✅ **Versione inglese** — **scritta il 2026-09-10** in [`en/terms-of-use.md`](en/terms-of-use.md), ed è **quella ufficiale** (**D-123**). I segnaposto di questa tabella sono gli stessi, tradotti: si chiudono una volta e si riportano nei due file | **D-123** |
| 11 | 🔴 **Pubblicazione a un URL** insieme all'informativa e alla cookie policy | `conformita.md` §5 |
| 12 | 🔴 **Revisione professionale** dell'intero documento prima del lancio commerciale | `Rule/legale-beta.md` |

## Fonti di questo documento

- Offerta commerciale, listino e confine gratis/pagamento: [`Marketing/LifeCouple/monetizzazione.md`](../../../../Marketing/LifeCouple/monetizzazione.md) §1, §3, §4, §5
- Diritti del consumatore e obblighi DSA: [`conformita.md`](../conformita.md) §7 e §8
- Identità dell'editore e strada «individuo»: [`pubblicazione.md`](../pubblicazione.md) §2.1
- Regole della coppia, dell'autore e dello scioglimento: **D-04**, **D-21**, **D-16** in [`History.md`](../../History.md)
- Trattamento dei dati: [`informativa-privacy.md`](informativa-privacy.md) — questo documento **non** lo duplica e vi rinvia
- Struttura riusata: [`Projects/HeleoX/docs/legal/condizioni-beta.md`](../../../HeleoX/docs/legal/condizioni-beta.md)
