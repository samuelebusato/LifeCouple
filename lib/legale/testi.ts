/* FILE GENERATO — non modificarlo a mano.
 *
 * Sorgente: docs/legal/en/*.md
 * Rigenera: node tools/genera-legale.mjs
 *
 * I documenti sono in inglese soltanto, per decisione dell'utente del 2026-09-09
 * (D-121), confermata e allargata il 2026-09-10 (D-123): l'inglese è la lingua
 * ufficiale della documentazione, landing compresa. Le etichette dell'interfaccia
 * restano bilingui: è il testo legale a non esserlo.
 */

export type ChiaveDocumento = 'privacy' | 'cookie';

export const DOCUMENTI_LEGALI: Record<ChiaveDocumento, { titolo: string; testo: string }> = {
  'privacy': {
    titolo: "Privacy Policy — LifeCouple",
    testo: `# Privacy Policy — LifeCouple

**Version \`app-1.0\` — last updated 9 September 2026.** Provided under Articles 13–14 of Regulation (EU) 2016/679 (GDPR).

---

## 1. Who is responsible for your data

**F.R. di Busato Fausto**, owner **Fausto Busato**, Novellara (RE), Italy — VAT no. **01878620358**, REA **RE 232527**.

- Contact, support and **exercising your rights**: **info@heleox.it**
- Certified email (PEC): **fr-busato@pec.fr-busato.it**

No Data Protection Officer has been appointed. The service does not involve systematic large-scale monitoring, but it does handle data that is particularly sensitive when combined; this assessment is kept under review.

## 2. What this app does, in one line

LifeCouple is the private diary of **two people**: a shared calendar, places, photographs, lists and games between the two members of a couple. **The unit of the service is the couple**, not the individual — and that has consequences for your data, described in section 6.

## 3. What data we process, why, and on what legal basis

| Data | Purpose | Legal basis | Retention |
|---|---|---|---|
| **Account**: email address, user identifier | Creating and managing your account, access to the service | Performance of the contract (Art. 6.1.b) | For as long as the account exists |
| **Couple link**: the association between two accounts, start date and any end date | Providing a service that exists only between two people | Performance of the contract (Art. 6.1.b) | For as long as the account exists |
| **Photographs** uploaded by users | Keeping shared memories | Performance of the contract (Art. 6.1.b) | For as long as the account exists |
| **Places** entered manually (wished for and visited), with an optional date | Shared map and lists | Performance of the contract (Art. 6.1.b) | For as long as the account exists |
| **Calendar events** created in the app | Shared calendar | Performance of the contract (Art. 6.1.b) | For as long as the account exists |
| **List entries** (films, trips, restaurants and lists you create), with ratings and reviews | Shared lists | Performance of the contract (Art. 6.1.b) | For as long as the account exists |
| **Answers to the affinity games** | Game mechanics and the couple's score | Performance of the contract (Art. 6.1.b) | For as long as the account exists |
| **Subscription data** (status, expiry) | Providing paid features | Performance of the contract (Art. 6.1.b) | For as long as the account exists |
| **Accounting and tax data** relating to purchases | Legal obligations | Legal obligation (Art. 6.1.c) | 10 years |
| **Date of birth** | Two things at once: showing your birthday on the calendar you share with your partner, and checking that you meet the minimum age for the service | Performance of the contract (Art. 6.1.b) for the birthday; **legal obligation** (Art. 6.1.c, in relation to Art. 8 GDPR) for the age check | For as long as the account exists |
| **Current location**, if you choose to share it with your partner | Letting you see where each other are, and the distance between you | **Consent (Art. 6.1.a)** | Only the **current** value: each update replaces the previous one and **no history is kept**. It disappears when you turn sharing off, or when the couple is dissolved |
| **Push notification token** (an identifier for the app installed on one phone), the phone's language, and your notification preferences — only if you turn notifications on | Delivering the notifications you have chosen | Performance of the contract (Art. 6.1.b) for the two service notifications — your partner marking a place as visited, and anniversaries of your own events; **consent (Art. 6.1.a)** for the reminder to add somewhere new, which stays off unless you switch it on | Until you remove that device, uninstall the app, or delete your account |

Providing an email address is **required**: without it an account cannot be created.

### 3.1 Data the app reads from your device but does **not** collect

This section exists because the difference is a real one, and it should be stated rather than hidden.

| | What actually happens |
|---|---|
| **Location** *(while sharing is **off**)* | It is read **once**, when you open the map, and **only if you have already granted permission**, for the sole purpose of centring the map where you are. **It is not recorded, not transmitted to us, does not leave your phone and is not visible to your partner.** If you **turn on** location sharing, this no longer applies: your location is then transmitted and shown to your partner — see section 6. In neither case is there any background tracking or automatic history. |
| **Device calendar** | Read **only when you choose to import**, and only the entries you tick are imported. |
| **Device photographs** | Accessible **only** for the images you choose to add. |

**How location sharing works, exactly:**

- **Sharing is yours and only you can turn it on**, from the map. It is not reciprocal: you can see your partner without being seen, and the other way round.
- **You can turn it off whenever you want, with one tap, from the same screen.** **When you turn it off your partner receives no notification**: for them the result is identical to a flat battery, a closed app or a disabled GPS. Nowhere in the system is there any information saying that you stopped sharing — and that is a design decision, not an oversight.
- **We keep no history of your movements.** There is a single location per person, the current one, and each update replaces the previous one. Neither we nor your partner can reconstruct where you have been.
- **A location older than fifteen minutes is not shown**, because it would no longer say where you are.
- **If you dissolve the couple, locations are deleted**, not hidden.

### 3.2 Text you write freely

Some features let you write free text (reviews, notes, and — when the feature becomes available — custom questions for the games).

**We never ask you for special category data** under Article 9 GDPR (health, sex life, religious or political beliefs), and the built-in game questions are **filtered** to exclude them. If you choose to write such information into a free text field, it stays **private to your couple**: we do not reuse it, do not suggest it to others, do not aggregate it and **do not analyse its content**.

**Menstrual cycle tracking is not present in this version** of the app, and no health data is processed.

## 4. Who we share data with

Data is **never sold or traded**. It is processed by suppliers appointed as processors under Article 28 GDPR:

| Supplier | What it receives | Location |
|---|---|---|
| **Supabase** | Accounts, content, photographs — the entire database | Region **eu-central-1 (Frankfurt, Germany)** — **European Union** |
| **Google (Places)** | The text of place searches, and the places you select | United States — see section 5 |
| **TMDB** *(The Movie Database)* | The text of film searches | United States — see section 5 |
| **Expo** *(push notification service)* | Your device token and the text of the notification, only when a notification is actually sent to you | United States — see section 5 |
| **Apple** and **Google** | Data relating to purchases and subscriptions, and — through APNs and FCM — the text of the notifications delivered to your phone | See section 5 |

**We do not use behavioural analytics, advertising or profiling tools**, neither third-party nor our own.

Data may be disclosed to competent authorities where required by law.

## 5. Transfers outside the European Union

**The database and the photographs reside in the European Union** (Frankfurt, Germany). They do not leave the European Economic Area.

Three things travel to the United States. They are listed one by one because a partial list would be worse than none.

1. **Place and film searches.** These services receive only **the text you type into the search box** — not your content, not your photographs, not your account.
2. **Push notifications, and only if you switch them on.** The text of the notification and your device token pass through **Expo**, and then through **Apple (APNs)** or **Google (FCM)** to reach your phone. ⚠️ This is the one case in which a piece of your own content leaves the European Union: the notification telling you that your partner has marked somewhere as visited **contains the name of that place**. It never contains photographs, notes, the content of your diary, or your location. If you would rather nothing travelled at all, notifications can be turned off in Settings — and then nothing is sent.
3. **Purchases and subscriptions**, handled by Apple and Google.

The transfer is based on **standard contractual clauses approved by the European Commission**, or on equivalent mechanisms such as adherence to the Data Privacy Framework where applicable.

A copy of the safeguards adopted can be requested at the contact address in section 1.

## 6. The couple: what your partner sees, and what happens if you break up

This section describes the most important aspect of the service, and it is written to be read **before** you start.

**While you are a couple**, your partner sees the shared content: calendar, places, photographs, lists, game results, and your date of birth, which appears as a birthday on the calendar you share. They **cannot** read your answers to a game before you have both answered.

**Your current location is the only thing that depends on an action of yours**: your partner sees it **only if you turn sharing on**, and it stays off until you do. The exact conditions — no history, a fifteen-minute expiry, no notification when you switch it off — are described in **section 3.1**, and should be read before you turn it on.

**Each of you remains the author of what you uploaded**: only the person who added something can change or delete it. Your partner cannot delete your photographs or your content.

**If the couple is dissolved**, mutual access is **revoked**: neither of you will be able to see the other's content any more. Dissolving the couple does **not** delete data — each of you keeps what you authored, and shared content follows the rules shown in the app at the moment of dissolution. Both of you are notified.

**Dissolving the couple is not enough to delete your data: you must delete your account** (section 7). They are two different actions with different consequences.

## 7. Deleting your account

You can delete your account **directly from the app**, in Settings.

**Deletion is immediate and permanent**, and covers — in this order — your **stored photographs**, all content you authored, and finally your account. There is no cooling-off period: **once you confirm, the data is deleted**.

**Deleting your account does not cancel your subscription.** Subscriptions are managed by Apple and Google, not by us: they must be cancelled from your phone's settings, otherwise renewal continues even though the account no longer exists.

**Accounting and tax data** relating to purchases is an exception, kept for 10 years as required by law.

**A limit worth stating plainly**: the service hosting the database keeps continuity copies so that data can be restored after an incident. Deleted data may persist in those copies for a limited period set by our hosting provider's backup policy, after which it disappears permanently. Those copies are not accessible in day-to-day operation.

## 8. How long we keep your data

**For as long as the relationship lasts**, that is, for as long as your account exists. **There is no automatic deletion for inactivity**: your memories stay for as long as you want them to, and disappear when you delete your account.

## 9. Security

Technical and organisational measures are in place under **Article 32 GDPR**, including: encryption of data in transit and at rest; **row-level data isolation** (each couple can reach only its own data); access to photographs through **temporary, unguessable links** rather than public files; least privilege, with a single server function holding elevated rights and limited to account deletion alone; a log of state-changing actions; and a documented threat analysis that is reviewed periodically.

**One limit it is only honest to state**: no technical measure protects against someone who knows your credentials or uses your unlocked phone. Protect your device with a screen lock.

## 10. Your rights

Under **Articles 15–22 GDPR** you have the right to obtain access to your data, rectification, erasure, restriction of processing, **portability**, and to object to processing based on legitimate interest.

**Erasure and portability are available directly in the app**, in Settings, without having to write to us.

For the other rights, write to the contact address in section 1: we reply within **30 days**.

You have the right to lodge a **complaint with the Italian Data Protection Authority** (www.garanteprivacy.it) or with the supervisory authority of the country where you live.

## 10-bis. If the service were to close

If LifeCouple were one day to stop being offered, you would receive **at least 60 days' advance notice** inside the app and at your account's email address, with a definite date. The closing date is **never earlier than the end of a subscription period you have already paid for**.

Before that date you would be able to **export your data** from the app, a feature already available today in Settings. On closure, data is deleted in accordance with section 7, with the sole exception of the accounting and tax data the law requires us to keep.

Subscriptions in progress are managed by Apple and Google: automatic renewal is switched off and the service remains available **until the end of the period already paid for**.

## 11. Minimum age

The service is reserved for people who have reached the age of **14**, the age set by Italian law under Article 8 GDPR.

Your date of birth is requested at registration, and anyone who turns out to be under 14 **cannot create an account**. This remains a declaration by the person concerned rather than a documentary check — anyone can enter a false date, and no app of this kind does more — but it is the difference between a rule written down and a rule applied.

## 12. Changes

Changes to this policy are published with an updated version number and date. Substantial changes are communicated inside the app.`,
  },
  'cookie': {
    titolo: "Cookie Policy and Local Storage — LifeCouple",
    testo: `# Cookie Policy and Local Storage — LifeCouple

**Version \`cookie-1.0\` — last updated 9 September 2026.** Written in accordance with the Italian Data Protection Authority's *Guidelines on cookies and other tracking tools* (measure of 10 June 2021) and **Article 122 of the Italian Privacy Code** (Legislative Decree 196/2003).

---

## Who is responsible

**F.R. di Busato Fausto**, Novellara (RE), Italy — VAT no. 01878620358 — **info@heleox.it**

## In short

LifeCouple is a phone application. **It does not use cookies**, because it is not a website. It uses the **local storage facilities of your device**, and it uses them **only for technical purposes** necessary to make the app work.

**It uses no profiling, analytics, advertising or tracking tools whatsoever**, neither its own nor third-party ones. Nothing follows you, inside or outside the app.

For this reason **no consent banner is shown**: Article 122 of the Privacy Code does not require one for technical tools, which do no more than deliver the service you explicitly asked for.

## What is stored on your device

| Item | Purpose | Duration |
|---|---|---|
| **Session and authentication tokens** | Keeping you signed in between one launch and the next, so you do not have to log in every time. Without them the app cannot be used | Until the session expires or you sign out |
| **Whether you turned location sharing on** | Remembering, on your phone, whether sharing is on or off, so you find it as you left it. If local storage does not respond, the app starts from **off**: the cautious value is not "same as last time" | Until you uninstall the app or clear its data |
| **What this phone has already shown you** of the creature that grows with you (the last stage and points seen) | Showing the evolution **to each of you on your own phone**: if the record lived on the server, whoever opened the app first would consume it for the other as well, who would never see theirs | Until you uninstall the app or clear its data |
| **Your choice to continue without creating the couple space yet** | Not showing you a screen you have already been through every time you open the app | Until you uninstall the app or clear its data |
| **Temporary working data** (cache of images already downloaded) | Avoiding re-downloading the same photographs every time: speed and data usage | Managed by the operating system |

The three middle items are stored **per user**: different people can sign in on the same phone, and one person's choices are not the other's.

**Language does not appear in this table because it is not stored**: the app reads the language set on your phone every time it starts and keeps no language preference.

None of these items lets anyone follow you across other apps or websites, or build a profile of you.

## How to remove them

You can delete the data stored by the app at any time:

- by **signing out** of the app — this removes the session tokens;
- from your **phone's settings**, under the app's entry, by clearing the app's data;
- by **uninstalling** the app.

**None of these actions deletes your account or your content from our servers.** For that there is the **"Delete account"** feature inside the app — see section 7 of the Privacy Policy.

## Third-party services

The app queries two external services **only when you search for something**:

- **Google Places**, when you search for a place;
- **TMDB**, when you search for a film.

They receive **the text you type into the search box**, not your content and not your identity. They do not set tracking tools on your device through our app. Details and safeguards on transfers are in sections 4 and 5 of the Privacy Policy.

## If anything changes

If analytics, measurement or third-party tools were introduced in future, this policy would be updated **before** they were switched on and, where necessary, **prior consent** would be requested, with those tools blocked until then.

## References

For the processing of personal data, please see the **Privacy Policy**.`,
  },
};

export const ORDINE_DOCUMENTI: ChiaveDocumento[] = ['privacy', 'cookie'];
