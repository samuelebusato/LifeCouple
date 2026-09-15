# Verifica sul telefono — la lista voce per voce

> **Scritta il 2026-09-15** — è la voce **D4** di [`pubblicazione.md`](pubblicazione.md)
> §7-ter, cioè la traduzione operativa della **§9**: *«l'app non è verificata»*,
> la condizione che sta sopra all'intero piano di pubblicazione.
>
> 🔑 **Perché una lista e non «prova l'app».** Il 2026-09-14 l'app **è** stata
> percorsa a mano su un iPhone, con esito positivo. Quella è stata *una
> passata*, non una spunta: una passata dice «non ho incontrato niente di
> rotto», che è un'affermazione su **il percorso di chi guarda**, non sul
> prodotto. ⚠️ *La prima partita vera fece uscire **sette difetti in un colpo**
> (B-30 → B-36), e non erano nascosti: erano semplicemente fuori dal percorso
> che qualcuno aveva fatto fino ad allora.*
>
> **Come si usa**: si spunta **solo ciò che si è visto succedere**. Una voce non
> provata resta vuota — non si deduce dal fatto che «funzionava ieri».
> Un ✗ vuole una riga di cosa è successo, e diventa un B-**nn** in `History.md`.

---

## Prima di cominciare

- [ ] **Development build installata** (non Expo Go): notifiche, acquisti,
      `expo-store-review` e le icone **non esistono** in Expo Go.
- [ ] **Due telefoni, o un telefono e un simulatore**, con i due account della
      coppia. 🔑 *D-25: senza partner questa app non fa niente, e metà delle
      voci qui sotto non è collaudabile da soli.*
- [ ] Un account **fresco** per il primo blocco: l'onboarding si vede una volta.

---

## 1. Entrare, e il primo avvio

- [ ] `benvenuto` → `registrati`: si crea un account con email e password
- [ ] Il **codice OTP** arriva davvero, e il campo accetta **tutte** le cifre
      *(fu un difetto d'uso il 2026-08-13: il campo era fisso a 6 e il codice
      poteva esserne più lungo)*
- [ ] `recupera`: la mail di reimpostazione arriva
- [ ] **Si entra senza creare lo spazio di coppia** (D-26), e l'app non si
      blocca in un vicolo cieco
- [ ] `onboarding`: si sceglie la data di inizio, e **il paywall compare una
      volta sola per persona** alla fine — riaprendo l'app non ricompare
- [ ] **Data di nascita**: inserendone una sotto i **14 anni** la registrazione
      viene **rifiutata** (art. 8 GDPR). ⚠️ *È un meccanismo aggiunto da poco:
      prima l'età era dichiarata nell'informativa e non applicata da niente.*
- [ ] L'**invito al partner** raggiunge l'altro telefono e la coppia si forma

## 2. Home e creatura (Philippe)

- [ ] I cinque riquadri arrivano **a onda** e restano **larghi metà schermo**
- [ ] Il riquadro «giorni insieme» conta il numero giusto
- [ ] La creatura **cresce** al passare delle soglie
      *(i punti ora hanno una misura: `npm run test:punti`. Qui si guarda che
      ciò che i punti dicono arrivi davvero **sullo schermo**)*
- [ ] 🔴 **La creatura è dietro il muro** nel piano gratuito (D-135), e il muro
      porta al paywall — non a un errore tecnico

## 3. Calendario

- [ ] Le tre viste — **giorno · settimana · mese** — e la quarta, **Diario**
- [ ] La pillola del selettore **scivola** e si ferma allineata; il titolo entra
      dal lato giusto cambiando mese
- [ ] Nella vista Giorni il **trascinamento orizzontale sposta di un giorno** e
      la striscia lo segue
- [ ] La **capienza delle celle del mese** con più impegni nello stesso giorno
- [ ] L'**agenda a fasce orarie** con **due impegni sovrapposti**
- [ ] Nuovo evento: con la tastiera aperta, **«Crea» e «Annulla» restano sopra
      la tastiera** (B-24)
- [ ] `importa`: importazione selettiva dal calendario del telefono
- [ ] Il **compleanno** compare sul calendario condiviso

## 4. Evento

- [ ] L'immagine a tutto schermo col **foglio bianco che la taglia**
- [ ] I **commenti** in fondo accettano scrittura **da tutti e due**
      *(è l'unica scrittura che passa da una policy diversa dalle solite)*
- [ ] L'ingranaggio → **«Cambia tag»** coi tre tag colorati
- [ ] Il passaggio **a vacanza** su un evento **senza fine**: diventa a giornate
      intere senza rompersi
- [ ] 🔴 **Una foto per evento** nel piano gratuito: la **seconda** viene
      rifiutata **col messaggio del piano**, non con un errore tecnico

## 5. Mappa e luoghi

- [ ] 🔴 **Dietro il muro** nel piano gratuito, e il muro porta al paywall
- [ ] Con «Insieme»: i **pin dicono quanti eventi hanno**, e l'anteprima appare
      **in sovraimpressione** invece che in un foglio
- [ ] L'interruttore **Mappa / Elenco** e l'elenco **dentro** la mappa
- [ ] La ricerca luoghi trova qualcosa *(chiave Google Places nel `.env`: su un
      dispositivo nuovo va rimessa a mano e **Metro riavviato**)*
- [ ] Segnare un posto come **visitato** → **il partner riceve la notifica**, e
      ⚠️ **la notifica NON nomina il luogo** (decisione del 2026-09-14): dice
      che c'è qualcosa di nuovo, il nome si legge aprendo l'app

## 6. Liste

> ⚠️ **Il blocco con più punti mai visti girare.** §9 lo dice per nome: *«le
> Liste hanno decine di punti mai visti girare»*.

- [ ] 🔴 **Dietro il muro** nel piano gratuito
- [ ] Il **carosello** si apre e le liste di partenza ci sono
- [ ] La **carta «+»** è l'ultima del mazzo, e il comando sotto diventa **uno
      solo a tutta larghezza**; scorrendo avanti e indietro i comandi **non si
      spostano** — cambia cosa dicono, non dove stanno
- [ ] Creare una lista: compare **col colore successivo del ciclo**
- [ ] Segnare una voce come **fatta**: la creatura guadagna **10 punti**
- [ ] ⬜ **Aggiungere una voce già «fatta»**, se l'app lo permette da qualche
      percorso: deve valere 10 punti. *È **B-70**, e si chiude con la migrazione
      `0046` — se non è ancora applicata, questa voce fallisce ed è previsto*
- [ ] Voto e **recensione** su una voce
- [ ] ⏸️ **Film**: la lista è spenta in attesa di TMDB (D-127). Non si prova

## 7. Giochi

> 🔴 **Sei difetti su sette erano corretti e mai riprovati** al 2026-08-29.
> Ogni gioco va **concluso**, non solo aperto.

- [ ] `quiz` — quiz preferenze, fino alla **conclusione**
- [ ] `obbligo` — obbligo o verità, fino alla conclusione
- [ ] `telepatia` — fino alla conclusione
- [ ] `disegno`
- [ ] Ogni partita conclusa dà **5 punti** alla creatura
- [ ] Una partita **abbandonata** non ne dà *(premia la chiusura del cerchio,
      non il tempo passato nell'app)*
- [ ] 🔴 **Una partita al giorno** nel piano gratuito: la **seconda**, anche con
      un gioco **diverso**, viene rifiutata **col messaggio del piano** — e non
      col messaggio «c'è già una partita viva», che è un'altra cosa
- [ ] L'attesa del partner si risolve **da sola** quando l'altro è pronto

## 8. Galleria

- [ ] Le **cartelle** stile Foto
- [ ] 🔴 Nel piano gratuito **non si aggiungono foto sciolte**: vanno su un
      evento. ⚠️ *È l'unica regola del confine che nasce da un'assunzione
      dichiarata e non da una parola dell'utente* — se l'intenzione era
      diversa, si cambia una condizione in `0042` e basta
- [ ] Il tetto di **1 GB** vale su **ogni piano**, abbonamento compreso

## 9. Pagamenti e muri

- [ ] `paywall`: i **prezzi arrivano** — €7,99/mese e €39,99/anno
      *(erano il difetto risolto il 2026-09-14: mancavano le localizzazioni e
      la disponibilità era 0 paesi)*
- [ ] I **link ai documenti legali** nel paywall si aprono
- [ ] Le **due frasi del recesso** stanno **sopra il pulsante** che paga
- [ ] La **prova di una settimana** è annunciata **prima** di confermare
- [ ] 🔴 **L'acquisto vero in sandbox** (voce **B2**): si compra, e poi
      `ho_insieme()` **si accende** *(era `coppia_ha_insieme()` fino alla `0047`)*. ⚠️ *Prima verifica che App Store
      Server Notifications sia collegato a **Sandbox oltre che a Production**
      (**B3**), altrimenti non arriva niente al database e sembra un difetto
      del codice*
- [ ] **Dopo l'acquisto**: mappa, liste e creatura si aprono; le foto oltre la
      prima entrano; la seconda partita del giorno entra
- [ ] **Ripristina acquisti** dopo una reinstallazione

### 9-bis. Il paywall rifatto — aggiunte il 2026-09-15 (6)

> ⟳ L'aspetto è cambiato: testata con aloni, elenco dentro una carta, listino
> con spunta e prezzo barrato, pulsante sfumato. Le voci qui sopra restano
> valide; queste tre riguardano **ciò che prima non c'era**.

- [ ] Il **prezzo barrato** accanto all'annuale corrisponde al **mensile × 12**
      *(con €7,99 → `€95,88`)*. ⚠️ **E se un giorno l'annuale smettesse di
      convenire, NON deve comparire affatto**: un barrato senza risparmio
      dietro è pubblicità ingannevole
- [ ] L'**occhiello «7 giorni gratis»** sopra il titolo c'è **solo** se
      l'offerta ha davvero un periodo introduttivo — il numero viene da
      `introPrice`, non dal codice
- [ ] 🔴 **Il riquadro d'attesa si vede senza scorrere** (**B-80**): dopo un
      acquisto in cui il webhook tarda, *«stiamo registrando l'acquisto»* deve
      comparire **sopra il pulsante**, con la rotella. 🔑 *È l'unica voce di
      questa sezione che non si prova per caso*: serve un webhook lento, quindi
      o si ha fortuna o si ritarda apposta la Edge Function. ⚠️ *Prima di
      oggi quel testo compariva sopra l'elenco, cioè fuori dallo schermo di chi
      aveva appena premuto*
- [ ] Se l'account **non ha ancora un partner**: l'avviso con l'icona sta in
      **cima** al blocco, ha un fondo suo, e l'acquisto **resta possibile**
      (D-124 — comprare senza partner è legittimo, tacerlo no)
- [ ] 🔴 **B-81** — con un account che **ha comprato ma non ha ancora un
      partner**: al primo ingresso dopo l'onboarding il paywall **non deve
      riaprirsi**. 🔑 *Prima si riapriva, e proponeva di comprare ciò che era già
      stato comprato* — in contraddizione con l'avviso della voce qui sopra

## 10. Notifiche

- [ ] Il **permesso** viene chiesto, e il testo è **nella lingua del telefono**
      *(i tre testi sono bilingui dal 2026-09-15; vederli in inglese richiede
      di cambiare lingua al telefono e **ricostruire**)*
- [ ] Arrivano davvero a telefono **bloccato**
- [ ] Il **ricordo «N anni fa»** mostra il **titolo** dell'evento
- [ ] Il **posto appena segnato** non nomina il luogo
- [ ] Spegnendole dalle impostazioni **non arriva più niente**
- [ ] ⬜ **Il giorno di «N anni fa» è calcolato in UTC**: chi vive molto a est o
      a ovest può riceverlo sfasato. *Difetto noto e dichiarato — si guarda che
      arrivi, non che arrivi all'ora giusta*

## 11. Impostazioni, diritti e uscita

- [ ] I **documenti legali** si leggono **dentro l'app** (`legale/[doc]`)
- [ ] **Esporta i miei dati** produce qualcosa di leggibile (art. 20)
- [ ] **Scioglimento della coppia**: l'altro perde l'accesso ai contenuti, e
      **niente viene cancellato**
- [ ] Dopo lo scioglimento, l'abbonamento **resta a chi l'ha pagato**
- [ ] 🔴 **Cancellazione dell'account**, sull'account usa e getta e **mai su
      quello vero**: la schermata dice «fatto» **e l'account è davvero sparito**
      ⚠️ *Il 2026-09-14 questa identica voce rispondeva `500` e la schermata
      diceva comunque «fatto» — **B-68**, e non funzionava da due settimane e
      mezzo. È la voce che più merita di essere rifatta a mano*
- [ ] Dopo la cancellazione, l'app **avvisa che l'abbonamento resta attivo** e
      va disdetto dalle impostazioni di sistema

## 12. Traverso — da guardare **mentre** si fa tutto il resto

- [ ] I bottoni **cedono** sotto il dito, e la vibrazione arriva **una volta
      sola sull'azione** — mai scorrendo un elenco
- [ ] Nessun pannello **sembra in ombra** (B-15 e dintorni)
- [ ] Niente **compare vuoto o invisibile**. ⚠️ *Se accade, il primo sospetto è
      `components/ui/comparsa.tsx`: ha una rete che forza l'opacità a 1 dopo
      1,2 s, quindi il sintomo sarebbe «compare in ritardo e di colpo», non
      «non compare mai». Il secondo sospetto è B-14, mai spiegato*
- [ ] Le **icone dell'app** non sono più quelle del template Expo
- [ ] **La domanda su cui devi pronunciarti tu**: le sei icone della barra,
      senza etichetta, **si capiscono?** *(D-40 dice come rimetterle)*

---

## Le tre voci che questa lista **non può** contenere

Non sono dimenticanze: sono impossibili per costruzione, e stanno qui perché
una lista che le omette sembra completa e non lo è.

| | Perché |
|---|---|
| **La posizione condivisa** | Vuole **due telefoni in due posti diversi**, e due persone che li tengano |
| **B-50** — dito contro bottone | Si distingue **solo su iOS**, e solo osservando la differenza fra i due gesti |
| **Il confine del giorno UTC** | Vuole un telefono in un fuso molto a est o a ovest, o l'orologio spostato |

🔑 **Quando tutte le caselle sopra sono spuntate, §9 non è ancora caduta** — è
caduta la parte di §9 che si poteva far cadere. *E questo è il massimo che una
lista possa fare: rendere esplicito ciò che resta scoperto, invece di lasciar
credere che non ci sia niente.*
