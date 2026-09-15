# App Privacy — la dichiarazione da compilare su App Store Connect

> **Scritto il 2026-09-15** (voce **E4** di [`pubblicazione.md`](pubblicazione.md) §7-ter).
>
> 🔑 **Questo file non è una fonte: è una traduzione.** I fatti vivono in
> [`legal/registro-trattamenti.md`](legal/registro-trattamenti.md) (Parte A e Parte C),
> in [`legal/en/privacy-policy.md`](legal/en/privacy-policy.md) §3 e in
> [`threat-model.md`](threat-model.md) §1. Qui sono solo rimappati sulle **categorie
> di Apple**, che sono diverse dalle categorie del GDPR e non si sovrappongono
> pulitamente. ⚠️ *In caso di divergenza vince il registro, e questo file si
> riallinea — mai il contrario.*
>
> ⚠️ **Da rifare se cambiano i destinatari.** Questa versione è già la seconda:
> la prima era stata pensata prima del 2026-09-14, e quel giorno **notifiche
> push** (D-129) e **RevenueCat** (D-133) hanno aggiunto destinatari e un
> identificativo di dispositivo che prima non uscivano da nessuna parte.

---

## 0. La risposta che vale per tutte le righe: **nessun tracciamento**

Apple chiama *Tracking* il collegare i dati di una persona con dati di terzi
per pubblicità mirata, o il cederli a un data broker. **LifeCouple non fa né
l'uno né l'altro**, e non ha niente con cui potrebbe farlo: nel `package.json`
non c'è nessun SDK pubblicitario, nessun *analytics* di terze parti, nessun
*crash reporter*.

Quindi: **«Used for Tracking» = No** su ogni singola riga di questo documento,
e la domanda *«Does this app use the App Tracking Transparency framework?»* si
risponde **No**.

---

## 1. Dati raccolti — la tabella da ricopiare

«Linked» = collegato all'identità dell'utente. Lo è quasi tutto, perché questo
prodotto **è** un diario personale: negarlo sarebbe falso.

| Categoria Apple | Cosa, nel nostro caso | Linked | Tracking | Scopo dichiarato |
|---|---|---|---|---|
| **Contact Info → Email Address** | L'email dell'account. È obbligatoria: senza non esiste account | Sì | No | App Functionality |
| **User Content → Photos or Videos** | Le fotografie caricate dalla coppia | Sì | No | App Functionality |
| **User Content → Gameplay Content** | Le risposte ai giochi di affinità | Sì | No | App Functionality |
| **User Content → Other User Content** | Eventi del calendario, luoghi inseriti a mano, voci di lista, recensioni e voti, il legame di coppia e le sue date | Sì | No | App Functionality |
| **Location → Precise Location** | Solo se l'utente **accende** la condivisione col partner. Si conserva il **valore corrente**, mai uno storico | Sì | No | App Functionality |
| **Identifiers → User ID** | L'identificativo dell'account | Sì | No | App Functionality |
| **Identifiers → Device ID** | Il **token di notifica**, solo se l'utente accende le notifiche | Sì | No | App Functionality |
| **Purchases → Purchase History** | Stato e scadenza dell'abbonamento, normalizzati da RevenueCat | Sì | No | App Functionality |
| **Other Data → Date of Birth** | Due usi insieme: il compleanno sul calendario condiviso, e la verifica dei **14 anni** (art. 8 GDPR) | Sì | No | App Functionality |
| **Usage Data → Other** | ⚠️ Solo il **questionario facoltativo** su chi usa l'app (canale di scoperta, fascia d'età, situazione abitativa, interesse prevalente). È a **consenso**, revocabile, e la revoca **cancella** le risposte | Sì | No | **Analytics** |

### Cosa NON si dichiara, e perché — le righe che è facile sbagliare

- **Financial Info / Payment Info**: ❌ **non raccolti.** La carta la vede
  Apple, mai noi. A noi arriva *«questa coppia ha diritto»*, non un mezzo di
  pagamento. 🔑 *Dichiararli sarebbe falso in eccesso, e un'inesattezza in
  eccesso è comunque un'inesattezza.*
- **Health & Fitness**: ❌ non raccolti. Il ciclo mestruale è **rimandato**
  (D-07, P-02) proprio per stare fuori dall'art. 9. ⚠️ *Il giorno in cui
  quella funzione arrivasse, questa riga cambia — ed è la prima da rileggere.*
- **Contacts**: ❌ mai letta la rubrica.
- **Browsing History**: ❌ non esiste navigazione.
- **Diagnostics / Crash Data**: ❌ nessun SDK di diagnostica. *Se un domani si
  aggiungesse un crash reporter, questa riga si accende nello stesso giro in
  cui si aggiunge, non dopo.*
- **Search History**: ⬜ **non dichiarata, e la ragione va scritta perché non è
  ovvia.** Il testo digitato nella ricerca di luoghi **viene trasmesso** a
  Google Places, ma **non viene conservato da noi**: non c'è nessuna tabella di
  cronologia delle ricerche. Apple chiede cosa si *raccoglie*, e noi non lo
  raccogliamo. ⚠️ *Che venga trasmesso a un terzo è comunque un fatto, ed è
  dichiarato dove va dichiarato: nell'informativa §3.1 e nella Parte C del
  registro.*

---

## 2. 🔴 La domanda aperta che va risolta prima di compilare

**«Sensitive Info»** nella tassonomia di Apple comprende, alla lettera,
l'**orientamento sessuale**.

⚠️ Questo prodotto **non chiede** l'orientamento sessuale di nessuno. Ma
[`conformita.md`](conformita.md) §9 pone il problema in modo che non si può
ignorare qui: un'app che registra per definizione **l'esistenza di una
relazione sentimentale fra due persone** può, per certi utenti, **rivelarlo per
deduzione dalla struttura del prodotto**.

🔑 **La domanda non è se lo chiediamo — è se Apple consideri «raccolta» una
deduzione strutturale.** È la stessa domanda dell'art. 9 GDPR, posta a un
questionario invece che a un regolamento, e ha la stessa risposta o
l'opposta a seconda di chi la legge.

> **Va posta all'avvocato insieme a quella di `conformita.md` §9** — sono la
> stessa domanda in due sedi, e farne una sola telefonata costa quanto farne
> zero. ⚠️ *Finché non ha risposta, questa riga resta l'unica del documento
> senza un valore*, e il questionario non si invia: una dichiarazione App
> Privacy sbagliata è un motivo di rifiuto, e correggerla dopo la
> pubblicazione lascia traccia.

---

## 3. I destinatari, che Apple non chiede ma il revisore può

Non fanno parte del questionario, ma stanno qui perché è la stessa
conversazione e la Parte C del registro è la fonte:

| Chi | Cosa riceve | Dove |
|---|---|---|
| **Supabase** | Tutto: database, autenticazione, storage, funzioni | 🇩🇪 **eu-central-1**, UE |
| **Apple** | Dati dell'acquisto · consegna delle notifiche (APNs) | — |
| **RevenueCat** | Identificativo utente, stato abbonamento | 🇺🇸 USA |
| **Expo** | Token del dispositivo, lingua del telefono, **testo della notifica** | 🇺🇸 USA |
| **Google (Places)** | Solo il testo digitato nella ricerca e il luogo scelto | 🇺🇸 USA |

🔴 **Un contenuto della coppia esce dall'UE, ed è una riga sola**: il ricordo
«N anni fa» porta con sé **il titolo dell'evento**, che passa da Expo e poi da
Apple. ✅ *La notifica sul posto appena segnato invece non nomina il luogo* —
esce il solo identificativo (decisione dell'utente, 2026-09-14).

✅ **E si può azzerare**: chi spegne le notifiche non fa uscire niente, perché
la coda scarta prima di spedire e nessun testo raggiunge Expo.

---

## 4. Prima di inviare — la lista

- [ ] 🔴 Risolta la domanda **«Sensitive Info»** della §2, con l'avvocato.
- [ ] Le dieci righe della §1 ricopiate, con **Tracking = No** su tutte.
- [ ] «Does this app use ATT?» → **No**.
- [ ] L'URL dell'informativa nella scheda: <https://lifecouple.heleox.it/privacy-policy.html> ✅ *online e verificato il 2026-09-15*.
- [ ] ⚠️ Riletto il registro Parte C: se nel frattempo è comparso un
      destinatario nuovo, **questo file è già vecchio**. *È successo il
      2026-09-14 con notifiche e RevenueCat, e non se n'era accorto nessuno
      fino a che non si è riletto apposta.*
