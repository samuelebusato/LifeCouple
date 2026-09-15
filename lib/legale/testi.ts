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

export type ChiaveDocumento = 'privacy' | 'cookie' | 'termini';

export const DOCUMENTI_LEGALI: Record<ChiaveDocumento, { titolo: string; testo: string }> = {
  'privacy': {
    titolo: "Privacy Policy — LifeCouple",
    testo: `# Privacy Policy — LifeCouple

**Version \`app-1.2\` — last updated 15 September 2026.** Provided under Articles 13–14 of Regulation (EU) 2016/679 (GDPR).

---

## 1. Who is responsible for your data

**Samuele Busato**, a natural person resident in Italy — the developer and operator of LifeCouple.

- Contact, support and **exercising your rights**: **info@heleox.it**

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

Data is **never sold or traded**. It is processed on our behalf by the suppliers listed below. Each of them acts as a **processor under Article 28 GDPR** and is bound by the data processing terms of its own contract with us:

| Supplier | What it receives | Location |
|---|---|---|
| **Supabase** | Accounts, content, photographs — the entire database | Region **eu-central-1 (Frankfurt, Germany)** — **European Union** |
| **Google (Places)** | The text of place searches, and the places you select | United States — see section 5 |
| **TMDB** *(The Movie Database)* | The text of film searches | United States — see section 5 |
| **Expo** *(push notification service)* | Your device token and the text of the notification, only when a notification is actually sent to you | United States — see section 5 |
| **RevenueCat** *(subscription management)* | Your user identifier and the data of your purchases — never your content, your photographs or your email address | United States — see section 5 |
| **Apple** and **Google** | Data relating to purchases and subscriptions, and — through APNs and FCM — the text of the notifications delivered to your phone | See section 5 |
| **Amazon Web Services** *(hosting of our public pages)* | Nothing you enter in the app. It serves the pages anyone can open without an account — this policy, the cookie policy, the home page — so it receives **the request itself**: the IP address it comes from and the address requested. ⚠️ **One case is worth naming**: if you open an invitation link **without having the app installed**, that address contains the invitation code | Edge locations in **Europe and North America** |

**We do not use behavioural analytics, advertising or profiling tools**, neither third-party nor our own.

Data may be disclosed to competent authorities where required by law.

## 5. Transfers outside the European Union

**The database and the photographs reside in the European Union** (Frankfurt, Germany). They do not leave the European Economic Area.

Four things may travel outside the European Union. They are listed one by one because a partial list would be worse than none — and the fourth is different in kind from the first three, so it is marked as such rather than blended in.

1. **Place and film searches.** These services receive only **the text you type into the search box** — not your content, not your photographs, not your account.
2. **Push notifications, and only if you switch them on.** The text of the notification and your device token pass through **Expo**, and then through **Apple (APNs)** or **Google (FCM)** to reach your phone. ⚠️ One kind of notification carries a piece of your own content: the **anniversary reminder** includes the **title of the event** it refers to. The notification telling you that your partner has marked a new place as visited deliberately **does not name the place** — you open the app to see it — because that one would show where you have just been to anyone glancing at a locked phone. Notifications never carry photographs, notes, the content of your diary, or your location. If you would rather nothing travelled at all, notifications can be turned off in Settings — and then nothing is sent.
3. **Purchases and subscriptions.** The payment itself is handled by **Apple** (and, if the app is published there, Google): we never see your card, your bank details or your billing address, and no payment data is stored in our systems. **RevenueCat** sits between them and us, to normalise the receipts and to tell our servers when a subscription begins, renews or ends; it receives **your user identifier** and the data of the purchase — not your content, not your photographs, not your email address.

4. **Opening one of our public web pages — not a transfer of your content, but of your request.** The pages that anyone can open without an account are served by a content delivery network with locations in **Europe and North America**. Which one answers you depends on where you are: someone opening the page from Italy is normally served from Europe. What reaches it is the request — your IP address and the address you asked for — and **nothing you have entered in the app**. ⬜ *We do not enable access logs on this service*, so no record of who opened which page is collected on our behalf.

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

**Deleting your account does not cancel your subscription.** Subscriptions are managed by Apple, not by us: they must be cancelled from your phone's settings, otherwise renewal continues even though the account no longer exists.

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

Subscriptions in progress are managed by Apple: automatic renewal is switched off and the service remains available **until the end of the period already paid for**.

## 11. Minimum age

The service is reserved for people who have reached the age of **14**, the age set by Italian law under Article 8 GDPR.

Your date of birth is requested at registration, and anyone who turns out to be under 14 **cannot create an account**. This remains a declaration by the person concerned rather than a documentary check — anyone can enter a false date, and no app of this kind does more — but it is the difference between a rule written down and a rule applied.

## 12. Changes

Changes to this policy are published with an updated version number and date. Substantial changes are communicated inside the app.`,
  },
  'cookie': {
    titolo: "Cookie Policy and Local Storage — LifeCouple",
    testo: `# Cookie Policy and Local Storage — LifeCouple

**Version \`cookie-1.2\` — last updated 15 September 2026.** Written in accordance with the Italian Data Protection Authority's *Guidelines on cookies and other tracking tools* (measure of 10 June 2021) and **Article 122 of the Italian Privacy Code** (Legislative Decree 196/2003).

---

## Who is responsible

**Samuele Busato**, a natural person resident in Italy — **info@heleox.it**

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
| **An invitation you have opened but not yet used** | When someone invites you to share their space, the invitation link almost always reaches you **before you have an account**. The invitation is kept on your phone so that it is still there once you have signed up, instead of being lost between the two steps | Until the invitation is used, or until you uninstall the app or clear its data |
| **Temporary working data** (cache of images already downloaded) | Avoiding re-downloading the same photographs every time: speed and data usage | Managed by the operating system |

The second, third and fourth items are stored **per user**: different people can sign in on the same phone, and one person's choices are not the other's. **The invitation is the exception, and necessarily so**: it is saved before you have an account, so there is no user it could belong to yet.

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
  'termini': {
    titolo: "Terms of Use — LifeCouple",
    testo: `# Terms of Use — LifeCouple

**Version \`terms-1.3\` — 15 September 2026.**

> **What changed on 15 September 2026**: the provider is now **Samuele Busato**, a natural person; sections 7 and 8 were rewritten because they described a free/paid boundary that **the service no longer applies** — checked against migration \`0042\`, not against the decision log; the seller clause was settled; references to Google Play were removed, the app being released on iPhone only; and these Terms became reachable from registration, from Settings and from the purchase screen, as section 2 requires.

---

## 1. Who provides the service

LifeCouple is offered by **Samuele Busato**, a natural person resident in Italy.

- Email: **info@heleox.it**

On the app stores the publisher appears as **"Samuele Busato"**, the same person named above, who is also the controller of your personal data — see section 1 of the Privacy Policy.

## 2. What you accept, and when

By creating an account you accept these Terms and confirm that you have read the **Privacy Policy**. If you do not accept them, you cannot use the service.

Both documents are reachable **before** you create your account, on the registration screen, and at any time afterwards in Settings.

## 3. What LifeCouple is

LifeCouple is the private diary of **two people**: a shared calendar, places, photographs, lists, games, and a creature that grows with you.

**The unit of the service is the couple, not the individual**, and nearly every rule below follows from that. The service assumes **two linked accounts**: on your own, the app does not produce what it exists for.

## 4. Who can use it

- You must be **14 or older**, the age set by Italian law for information society services (Art. 8 GDPR, Art. 2-*quinquies* of the Italian Privacy Code). Your date of birth is requested at registration, and anyone who declares an age below 14 cannot create an account.
- The date you declare must be **truthful**. This is a declaration, not a documentary check: we have no way of verifying it, and we do not claim to.
- **One account per person.** Your account is personal: credentials are not to be shared, not even with your partner. You are responsible for what happens from your account.
- **A limit it is only honest to state here as well as in the Privacy Policy**: no technical measure protects against someone who knows your credentials or uses your unlocked phone. Protect your device with a screen lock.

## 5. The couple: how it forms, what the other person sees, what happens if it ends

**It forms** through an invitation you generate and the other person opens. A couple has **two** members: there are no groups.

**While you are a couple**, your partner sees the shared content — calendar, places, photographs, lists, game results, and your date of birth as a birthday. **They see your current location only if you turn sharing on**, and it stays off until you do. The details are in sections 3.1 and 6 of the Privacy Policy, and should be read before you turn it on.

**Each of you remains the author of what you uploaded**: only the person who added something can change or delete it. Your partner cannot delete your photographs or your content. This is enforced by the database, not merely by the interface, which makes retaliation structurally impossible rather than only forbidden.

**If the couple is dissolved**, mutual access is **revoked**: neither of you sees the other's content any more. Dissolving does **not** delete data — each of you keeps what you authored. Both of you are notified.

**Dissolving the couple and deleting your account are two different acts**, with different consequences: the first can be undone (you can link again), the second cannot. Dissolving is not enough to delete your data — see section 11.

## 6. Your content

**It stays yours.** We acquire no ownership of what you upload and use it for no purpose other than providing the service: we do not publish it, do not sell it, do not analyse it, and do not use it to train any system. You authorise us only to store it and to show it **to you and your partner**, which is what the service does.

**What you may not upload**: unlawful content, material depicting people who have not consented, content infringing the rights of others, and in particular **any material involving minors in a sexual context**. We do not pre-moderate the private content of a couple — and for that very reason responsibility for what you upload is **entirely yours**.

**Be mindful of what you write in free text fields.** Reviews, notes and custom questions reach our servers. We never ask you for special category data under Article 9 GDPR and we do not analyse what you write, but if you choose to write such information it is still stored.

**Reporting content.** If something in your shared space should not be there — unlawful material, or content that infringes someone's rights — write to **info@heleox.it**, saying what you saw and where. We read every report and reply without undue delay, and unlawful content is dealt with as a priority.

**Blocking does not require us**: dissolving the couple revokes mutual access immediately, and only you can do it. Because content here reaches **one person you chose** and never an audience, these two routes together are the blocking and reporting mechanisms for this service.

## 7. What is free and what is paid

**Free**: the shared calendar and its events, **one photograph on each event**, and **one complete game per day** for the couple.

**Included in the "Insieme" subscription** (*insieme* is Italian for *together*): the map and your places, the lists, the creature, further photographs beyond the first on each event, photographs added straight to the gallery, and games beyond the first each day.

**Photo storage is capped at 1 GB per couple on every plan**, subscription included. It is a limit on space, not a paid feature.

**What never depends on paying**: reading, exporting and deleting your own content. If a subscription ends, nothing you have already added is removed, altered or made unreadable — the limits above apply to *adding* new content, never to what is already there. Your rights of access and portability under Articles 15 and 20 GDPR are available on every plan.

## 8. The "Insieme" subscription

- **Price**: **€7.99 per month** or **€39.99 per year**. The prices shown in the stores at the time of purchase are the ones that apply, VAT included.
- **One payment, both of you covered.** The subscription belongs to **the couple**; the store, however, registers it to the person who pays, because a subscription cannot be held by two accounts.
- **One free week, the first time.** A new subscription begins with **seven days at no cost**. If you cancel before the end of those seven days you are **charged nothing**; if you do not, the subscription starts automatically at the price above and renews from there. ⚠️ The free period is offered **once per person and per subscription group**, by the store's own rule and not by ours: someone who has already used it — including through Family Sharing — subscribes at the full price. Whether the free period is available at all is shown in the app **before** you confirm, because it is the store that grants it.
- **Automatic renewal** on expiry, unless cancelled. Cancellation is done **from your phone's settings** (App Store), not from the app: we cannot cancel on your behalf. To avoid being charged for the next period — including the first one after a free week — cancellation must happen **at least 24 hours before** the current period ends, as the stores require.
- **When you cancel**, the service remains available **until the end of the period already paid for**, and no longer.
- **Restoring purchases**: if you change or reinstall your phone, you can restore the subscription from within the app.
- **Who sells to you.** The subscription is purchased **through the App Store**, and under Apple's Paid Applications Agreement Apple is the seller towards you in the European Union. This means **Apple issues the purchase receipt** and **refunds are requested from Apple**, not from us. We can help you, but we cannot issue a refund on Apple's behalf.
- **If the couple is dissolved, the subscription stays with the person who paid for it.** It belongs to that person and not to the couple: while you are a couple its benefits reach both of you, and when the couple ends they stop reaching the other person. Nobody is charged for something they did not buy, and nobody keeps a benefit they never paid for.
- **Nothing you uploaded is ever deleted to make room.** The 1 GB limit stops new uploads once it is reached; it never removes what is already there. That holds at every moment, dissolution included: if you are over the limit, you free space by deleting your own content or by subscribing. We do not choose for you which memories to lose.

## 9. Right of withdrawal

You are a **consumer**: you have the right to withdraw within **14 days** of purchase, without giving a reason, under the Italian Consumer Code (Legislative Decree 206/2005).

**For digital content the right lapses** if performance begins immediately, and it does begin immediately by design: the moment the subscription activates, the service is already supplied. For that lapse to be valid, two things are required together, at the time of purchase: your **express consent** to immediate performance and your **acknowledgement** that you lose the right of withdrawal. The purchase screen states both **before** the button that pays; without them, the right remains exercisable for fourteen days.

Where it applies, withdrawal is exercised with **Apple**, which made the sale — see section 8.

## 10. Conformity of the service, and liability

The service is provided with due care, but **we do not guarantee continuous, uninterrupted availability**: it depends on third-party suppliers, on the network and on your device.

**Your mandatory consumer rights remain intact**, including the guarantee of conformity for digital content and services. Nothing in this document limits them, and in the event of conflict **they prevail over these clauses**.

To the extent permitted by law, we are not liable for indirect damage or for loss of data attributable to causes outside our control. Liability for wilful misconduct or gross negligence **cannot be excluded, and we do not exclude it**, nor can liability for personal injury.

**And something that deserves to be said plainly rather than buried in a disclaimer**: LifeCouple keeps memories, and memories have no copy elsewhere unless you make one. You can **export your data at any time** from Settings. Do it.

## 11. Deleting your account

You can delete your account **from the app**, in Settings. Deletion is **immediate and permanent**: there is no cooling-off period. It covers your photographs, the content you authored, and your account.

**Accounting and tax data** is an exception, kept for 10 years as the law requires.

**Deleting your account does not cancel your subscription.** Subscriptions are managed by Apple: they must be cancelled from your phone's settings, otherwise renewal continues even though the account no longer exists.

Details and limits are in section 7 of the Privacy Policy.

## 12. Proper use and suspension

You may not use the service for unlawful purposes, attempt to reach other people's accounts or content, circumvent technical limits, or interfere with the operation of the system.

In the event of a serious breach we may suspend or close the account, **giving notice** and — where the breach does not prevent it — **the opportunity to export your data** before closure.

## 13. Intellectual property

The app, its name, its graphics and the creature **Philippe** belong to us or to their respective owners. A subscription gives you the right to **use** the service, not to acquire its contents.

**Third-party services used for searches:**

- **Google Places**, for searching places;
- **TMDB** *(The Movie Database)*, for searching films. Their attribution is shown next to the results, in the form their terms require.

## 14. Changes

We may change these Terms for technical, legal or service reasons. **Substantial** changes are communicated inside the app **before** they take effect, and you may cancel your subscription if you do not accept them.

## 15. If the service were to close

You would receive **advance notice** inside the app and at your account's email address, with a definite date, and before that date you would be able to **export your data**. On closure, data is deleted in accordance with section 11.

Subscriptions in progress: automatic renewal is switched off and the service remains available **until the end of the period already paid for**.

**The notice is at least 60 days**, and the closing date is **never earlier than the end of a subscription period you have already paid for**. If you hold an annual subscription, the service stays available to you until that year runs out, whatever date is announced.

## 16. Support, complaints, applicable law

- For support and complaints, write to the contacts in section 1.
- **Applicable law**: Italian law. Any more favourable mandatory provisions of the law of the country where you habitually reside remain unaffected, if you are a consumer resident in another Member State of the European Union.
- **Jurisdiction**: the courts of the consumer's place of residence or domicile, if in Italy. This **cannot be varied** by this document.
- **No referral to the European ODR platform.** That clause appears in almost every set of terms in circulation, but the platform **ceased operating in 2025**: pointing you to it would mean naming a remedy that does not exist. If an out-of-court route is to be offered, a **real ADR body** will be named here.`,
  },
};

export const ORDINE_DOCUMENTI: ChiaveDocumento[] = ['privacy', 'cookie', 'termini'];
