# La scheda App Store — testi pronti, nelle due lingue

> Scritta il **2026-09-15 (3)**. È la voce **E3** della corsia E di [`pubblicazione.md`](pubblicazione.md) §7-ter, che §6 dello stesso documento chiama *«la voce più sistematicamente sottostimata del piano»* — ed era, fino a oggi, l'unica cosa richiesta dal modulo di invio che **non esisteva da nessuna parte**.
>
> Qui c'è il **testo**. Gli screenshot sono un lavoro a parte e vengono dopo (E3), perché dipendono da un'app che gira su un telefono.

---

## 0. Le due regole che questo documento non può violare

🔑 **Non dichiarare gratuito ciò che si paga.** È l'errore **B-69**, trovato il 2026-09-15 nei termini d'uso: §7 prometteva gratis mappa, luoghi, liste e creatura, che **D-135 aveva messo a pagamento** il giorno prima. ⚠️ *Un documento commerciale che dice il falso sul prezzo non è un refuso: è la cosa che un'autorità guarda per prima, e su cui Apple rifiuta.* Il confine vero è imposto da [`0042_confine_gratis.sql`](../supabase/migrations/0042_confine_gratis.sql), e **quella migrazione è la fonte**, non questo file.

🔑 **Nessun riferimento ad Android, Google Play o al Play Store.** Cade con **D-132**. Un rimando a un negozio dove l'app non esiste è una promessa non mantenuta, e si scrive per abitudine.

⚠️ **E una terza, che vale per il testo commerciale come per quello legale**: il tetto di **1 GB per coppia** (**D-22**, imposto da un trigger in `0001_schema_iniziale.sql`) **vale anche con «Insieme»**. Scrivere *«tutte le foto che volete»* sarebbe B-69 una seconda volta, sullo stesso dato.

---

## 0-bis. 🔴 Una decisione che questo documento NON ha il diritto di prendere

**Questi testi esistono in due lingue, e `pubblicazione.md` §6 avverte contro esattamente questo.** **D-123** (2026-09-10) stabilisce che la documentazione ufficiale è in inglese, landing compresa; §6 aggiunge: *«se le schede escono anche in italiano mentre l'informativa collegata è solo in inglese, l'incoerenza la vede il revisore prima dell'utente»*.

⚠️ **Sono state scritte entrambe lo stesso**, e la ragione va detta invece che nascosta: l'interfaccia dell'app **è già bilingue** (D-18: la lingua la decide il telefono) e il mercato è l'Italia. Una scheda in solo inglese per un'app che si apre in italiano è un problema di conversione reale.

🔑 **Ma la scelta è dell'utente, non mia, e le tre strade stanno in `pubblicazione.md` §6.** Finché non è presa: **pubblicare la sola versione inglese è la strada coerente con le decisioni in vigore**, e quella italiana resta scritta e pronta.

*Il rischio dell'informativa in inglese è già accettato e firmato (`History.md` §5, 2026-09-09). La scheda italiana non lo crea: cambia solo quanto è facile accorgersene.*

---

## 1. I campi del modulo, e cosa ci va

| Campo (App Store Connect) | Limite | Stato |
|---|---|---|
| **App Name** | 30 | ✅ `LifeCouple` |
| **Subtitle** | 30 | ✅ §2 / §3 |
| **Promotional Text** | 170 | ✅ §2 / §3 — *modificabile senza revisione* |
| **Keywords** | 100 | ✅ §2 / §3 — separate da virgola, **senza spazi dopo la virgola** |
| **Description** | 4000 | ✅ §2 / §3 |
| **Support URL** | — | ✅ `https://lifecouple.heleox.it` |
| **Marketing URL** | — | ✅ `https://lifecouple.heleox.it` |
| **Privacy Policy URL** | — | ✅ `https://lifecouple.heleox.it/privacy-policy.html` |
| **Copyright** | — | ✅ `2026 Samuele Busato` |
| **Primary Category** | — | ✅ *Lifestyle* |
| **Secondary Category** | — | ✅ *Social Networking* |
| **Age Rating** | — | ⟳ §5 |
| **App Review Information** | — | ⟳ §6 |
| **Screenshots** | — | 🔴 **E3, non fatto**: dipende da un'app che gira su un telefono |
| **App Privacy** | — | ⟳ [`app-privacy.md`](app-privacy.md) — una riga attende **A6** |

> ⚠️ **Le categorie sono una proposta, non una verifica.** *Lifestyle* e *Social Networking* discendono da cosa fa l'app; se Apple la ricolloca, non è un difetto. 🔑 *Da non scegliere*: **Health & Fitness**, che tirerebbe dentro obblighi che questo prodotto ha passato un mese a evitare (**D-07**, **D-08**).

---

## 2. 🇮🇹 Italiano

### Subtitle
```
Per voi due, e nessun altro
```

### Promotional Text
```
Il calendario, i ricordi, la mappa dei vostri posti e i giochi che da soli non si possono fare. Tutto raggiunge una persona sola: quella che avete invitato voi.
```

### Keywords
```
coppia,calendario condiviso,ricordi,foto,anniversario,mappa,viaggi,lista,gioco,amore,diario
```

### Description
```
LifeCouple è lo spazio di una coppia sola: la vostra.

Non è un social. Non c'è un pubblico, non c'è un feed, non ci sono sconosciuti. Tutto quello che ci mettete raggiunge una persona sola — quella che avete invitato voi.

IL CALENDARIO CHE AVETE IN DUE
Le serate, gli anniversari, le cose da non dimenticare. Potete portare dentro quello che c'è già sul telefono, spuntando soltanto le voci che scegliete: LifeCouple non importa niente da sé.

I RICORDI, ATTACCATI AL GIORNO IN CUI SONO SUCCESSI
Le foto non finiscono in un mucchio. Stanno sull'evento a cui appartengono: aprite una sera di marzo, e dentro ci trovate quella sera di marzo.

LA MAPPA DEI POSTI VOSTRI
Dove siete stati, dove andrete, dove vi piacerebbe andare. Tre segni diversi, così la mappa si legge in un colpo d'occhio. E se volete, per il tempo che volete, potete far vedere all'altro dove siete adesso — lo accendete voi, e si spegne quando chiudete l'app.

LE LISTE
Film, ristoranti, viaggi, e qualunque altra lista vi serva. Ognuno scrive la sua recensione e legge quella dell'altro, senza poterla cambiare.

I GIOCHI, CHE DA SOLI NON SI POSSONO FARE
Quiz sulle preferenze, Telepatia, Indovina il disegno, Obbligo o verità. Nessuno dei due vince contro l'altro: il punteggio è della coppia, ed è l'unico che c'è.

PHILIPPE
Una creatura che cresce con voi e con quello che fate insieme. Non vi dà un voto e non vi confronta con nessuno.

—

COSA C'È SENZA PAGARE
Il calendario e tutti i vostri eventi, una foto per ogni evento, e una partita al giorno.

COSA AGGIUNGE INSIEME
La mappa e i luoghi, le liste, Philippe, le foto oltre la prima di ogni evento, e i giochi oltre il primo della giornata. Le foto stanno dentro 1 GB per coppia, che è lo spazio di tutti.

Un abbonamento vale per due: se lo attiva uno, ce l'hanno tutti e due.

• Insieme mensile — 7,99 € al mese
• Insieme annuale — 39,99 € all'anno

Il pagamento è addebitato sul vostro account App Store alla conferma. L'abbonamento si rinnova da sé se non lo disdite almeno 24 ore prima della fine del periodo in corso, e l'addebito del rinnovo avviene entro le 24 ore precedenti. Potete gestirlo e disdirlo dalle impostazioni del vostro account App Store, non da dentro l'app.

—

SE VI LASCIATE
Lo spazio si scioglie quando lo chiede uno dei due, e l'altro riceve un avviso. Le foto e le recensioni di ciascuno restano a chi le ha scritte; eventi, luoghi e liste diventano una copia per ciascuno. Non si torna indietro, ed è scritto prima di farlo.

Privacy: https://lifecouple.heleox.it/privacy-policy.html
Termini d'uso: https://lifecouple.heleox.it/terms-of-use.html
```

---

## 3. 🇬🇧 English

### Subtitle
```
Just for the two of you
```

### Promotional Text
```
Your calendar, your memories, the map of your places, and the games you cannot play alone. Everything you put in reaches one person: the one you invited.
```

### Keywords
```
couple,shared calendar,memories,photos,anniversary,map,travel,list,game,love,together,journal
```

### Description
```
LifeCouple is a space for one couple: yours.

It is not a social network. There is no audience, no feed, no strangers. Everything you put in reaches one person — the one you invited.

THE CALENDAR YOU KEEP TOGETHER
Evenings, anniversaries, the things you don't want to forget. You can bring in what is already on your phone by ticking only the entries you choose: LifeCouple never imports anything on its own.

MEMORIES, ATTACHED TO THE DAY THEY HAPPENED
Photos don't end up in a pile. They live on the event they belong to: open an evening in March, and that evening in March is inside.

THE MAP OF YOUR PLACES
Where you have been, where you are going, where you would like to go. Three different marks, so the map reads at a glance. And if you want, for as long as you want, you can let the other see where you are right now — you turn it on, and it goes off when you close the app.

LISTS
Films, restaurants, trips, and any other list you need. Each of you writes your own review and reads the other's, without being able to change it.

THE GAMES YOU CANNOT PLAY ALONE
Preference quizzes, Telepathy, Guess the Drawing, Truth or Dare. Neither of you wins against the other: the score belongs to the couple, and it is the only one there is.

PHILIPPE
A creature that grows with you, and with what you do together. It does not grade you and does not compare you to anyone.

—

WHAT YOU GET WITHOUT PAYING
The calendar and all your events, one photo per event, and one game a day.

WHAT INSIEME ADDS
The map and places, the lists, Philippe, photos beyond the first on each event, and games beyond the first of the day. Photos live within 1 GB per couple, which is everyone's storage.

One subscription covers two people: if one of you turns it on, you both have it.

• Insieme Monthly — EUR 7.99 per month
• Insieme Yearly — EUR 39.99 per year

Payment is charged to your App Store account at confirmation. The subscription renews automatically unless you cancel at least 24 hours before the end of the current period, and renewal is charged within the 24 hours before it. You can manage and cancel it in your App Store account settings, not inside the app.

—

IF YOU BREAK UP
The space is dissolved when either of you asks for it, and the other is notified. Each person's photos and reviews stay with whoever wrote them; events, places and lists become one copy each. There is no going back, and that is written before you do it.

Privacy: https://lifecouple.heleox.it/privacy-policy.html
Terms of Use: https://lifecouple.heleox.it/terms-of-use.html
```

---

## 4. Perché il testo è scritto così

**Apre dicendo cosa NON è.** *«Non è un social. Non c'è un pubblico, non c'è un feed.»* 🔑 Non è una civetteria: è l'argomento da portare al revisore se chiede la moderazione dei contenuti generati dagli utenti — [`conformita.md`](conformita.md) §8 lo dice per esteso, e *«il contenuto raggiunge una sola persona scelta dall'utente, mai un pubblico»* è la ragione per cui questo prodotto non ha un pulsante «segnala» accanto a ogni foto. **Scriverlo nella scheda mette la stessa frase sotto gli occhi di chi decide.**

**Il confine gratis/pagamento sta dentro la descrizione, non in fondo in piccolo.** ⚠️ Un'app che scopre il prezzo dopo l'installazione raccoglie le recensioni a una stella che §9 di `pubblicazione.md` dice di voler evitare — e su un abbonamento raccoglie anche le richieste di rimborso.

**Le condizioni dell'abbonamento sono nella descrizione perché Apple le vuole lì**, non per abbondanza: durata, prezzo, rinnovo automatico, come si disdice, e i due link. Sono le stesse quattro cose che **B-66** ha imposto sopra il pulsante che paga, e dirle in due posti diversi con parole diverse è il modo più semplice di renderne una falsa.

**«Se vi lasciate» sta nella scheda dello store.** 🔑 *È il paragrafo che un'app di coppia non scrive mai*, ed è esattamente per questo che ci sta: è la funzione che **D-139** ha reso annunciata invece che silenziosa, ed è ciò che distingue un prodotto che ha pensato alla fine da uno che ha pensato solo all'inizio.

---

## 5. Classificazione per età

⟳ **Proposta, da confermare rispondendo al questionario in App Store Connect** — non si decide qui, si risponde lì.

| Domanda | Risposta attesa | Perché |
|---|---|---|
| Contenuti sessuali o nudità | **Nessuno** | «Obbligo o verità» è filtrato: il banco domande è stato ripulito da **D-08** proprio per stare fuori dall'art. 9 e da questa casella |
| Violenza (realistica o fantastica) | **Nessuna** | — |
| Riferimenti a droghe, alcol, tabacco | **Nessuno** | — |
| Gioco d'azzardo | **No** | Il punteggio non è una posta e non si vince niente |
| Contenuti generati dagli utenti | **Sì** | Foto, recensioni, obblighi scritti a mano e disegni. ⚠️ *Da dichiarare, non da nascondere* — e da spiegare come in §4 |
| Accesso web non filtrato | **No** | L'app apre solo i propri documenti legali |
| Localizzazione condivisa con altri | **Sì** | È la posizione in tempo reale, che l'utente accende e che si spegne da sé |

🔴 **Attesa: 12+**, per i contenuti generati dagli utenti e per la posizione condivisa. ⚠️ *Non 4+*: dichiarare 4+ un'app dove due persone si scambiano foto e si vedono sulla mappa è il tipo di dichiarazione che si paga con una rimozione, non con una correzione.

⚠️ **E un vincolo che viene da fuori Apple**: i termini d'uso fissano l'età minima a **14 anni** (art. 8 GDPR, soglia italiana — `conformita.md` §8). La classificazione dello store e i termini **devono poter coesistere**: 12+ è la fascia di Apple, 14 è il nostro limite contrattuale, e il secondo è più restrittivo del primo. *Se si dichiarasse 4+ i due documenti si contraddirebbero a vista.*

---

## 6. Note per la revisione

**L'account demo non si scrive qui.** Lo produce [`tools/semina-demo.mjs`](../tools/semina-demo.mjs), che stampa email e password già formattate da incollare — e la password vive in `.env.demo.local`, che `.gitignore` copre. 🔑 *È la correzione di **B-65**, e vale anche per questo documento*: un segreto scritto in un file versionato resta lì per sempre, anche dopo che lo si toglie.

```bash
npm run semina:demo
```

⚠️ **Da rieseguire poco prima dell'invio**, non settimane prima: lo script ricrea la coppia da zero, e gli eventi sono posizionati rispetto a *oggi* (uno è nel futuro, ed è quello che dimostra il calendario).

**Le tre cose da dire ad Apple nelle note**, oltre alle credenziali:

1. **L'app è per due persone.** Un account non appaiato mostra la schermata d'invito e nient'altro (**D-25**). L'account consegnato è **già appaiato**.
2. **L'account NON ha «Insieme»**, di proposito: così il revisore può percorrere l'acquisto in sandbox, che è quello che Apple vuole vedere.
3. **Le fotografie della demo sono illustrazioni generate**, non foto di persone. ⬜ *Restano comunque meglio 3-4 foto vere caricate dall'app* — vedi [`tools/foto-demo.mjs`](../tools/foto-demo.mjs).

---

## 7. Cosa manca ancora, e di chi è

| | Cosa | Chi |
|---|---|---|
| 🔴 | **Screenshot** (E3) — nelle due lingue, dalle misure che Apple chiede | io + tu, su un telefono |
| 🔴 | **La riga «Sensitive Info»** del modulo App Privacy | attende **A6**, l'avvocato |
| 🔴 | **Indirizzo e telefono del professionista** (A3) — non sono di questa scheda ma **dello stesso invio**, e senza di essi il modulo *trader* non si chiude | attende **A8**, il commercialista |
| ⬜ | **Rileggere i due testi a voce alta** prima di incollarli | tu |

> 🔑 **Un avvertimento sul campo Promotional Text**: è l'unico che si cambia **senza una nuova revisione**. ⚠️ *Il che lo rende anche l'unico in cui una promessa sbagliata può entrare senza che nessuno la guardi* — non metterci mai il prezzo né il confine del piano gratuito, che stanno nella descrizione proprio perché passano da una revisione.
