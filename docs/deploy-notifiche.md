# Accendere le notifiche push — i quattro gesti, in ordine

> Scritto il 2026-09-14 insieme a **D-129**. Il codice dell'invio è completo; questo documento è **ciò che manca perché una notifica parta davvero**, ed è tutto lavoro che richiede credenziali — quindi lo fa una persona, non l'agente.

⚠️ **Fino a quando questi quattro passi non sono fatti, gli interruttori nelle impostazioni dell'app accendono qualcosa che non parte.** È lo stato in cui il progetto si trova dal 2026-09-10, e il motivo per cui `History.md` lo elencava come primo difetto da chiudere.

---

## 1. Applicare la migrazione `0039`

Dal pannello SQL di Supabase, incollando [`supabase/migrations/0039_notifiche_invio.sql`](../supabase/migrations/0039_notifiche_invio.sql) **dopo averla letta**.

Introduce: la colonna `lingua` su `dispositivo`, la tabella `notifica_in_coda`, il trigger su `luogo` e le due funzioni periodiche.

✅ **Come si verifica, e non è guardare l'app**: dopo l'applicazione,

```bash
npm run test:rls
```

Le quattro asserzioni che oggi dicono *«0039 non applicata»* devono diventare verdi. 🔑 **Sono state scritte prima della migrazione proprio per poterle vedere fallire**: un test che nasce verde non dimostra niente.

## 2. Pubblicare la Edge Function

```bash
npx supabase functions deploy invia-notifiche
```

## 3. Il segreto con cui si chiama

La funzione **non** si accontenta del JWT che Supabase verifica di suo: quel token è di *un utente qualunque*, e far girare il lavoro a comando significherebbe poter spedire notifiche a terzi. Serve un segreto dedicato.

```bash
npx supabase secrets set NOTIFICHE_CRON_SECRET="$(openssl rand -hex 32)"
```

⚠️ **Deliberatamente NON la chiave `service_role`**: chi pianifica il lavoro non ha nessun motivo di possedere la chiave che può fare tutto. Se il segreto trapela, si spediscono notifiche di troppo; se trapelasse la `service_role`, si perde il database.

🔴 **Annotare il valore in un gestore di password prima di incollarlo**: `supabase secrets set` non lo rimostra.

## 4. Pianificare l'esecuzione

Da **Integrations → Cron** nel pannello Supabase, un lavoro che chiama la funzione. Cadenza consigliata: **ogni ora**.

| Campo | Valore |
|---|---|
| Schedule | `0 * * * *` |
| Tipo | HTTP Request → POST |
| URL | `https://<progetto>.supabase.co/functions/v1/invia-notifiche` |
| Header | `x-cron-secret: <il segreto del passo 3>` |

⚠️ **Perché un'ora e non cinque minuti.** I «ricordi» si calcolano sul giorno, non sul minuto, e il trigger dei luoghi accoda comunque in tempo reale: girare più spesso non anticipa nulla di percepibile e moltiplica le chiamate. ⚠️ **E perché non una volta al giorno**: un invio fallito aspetterebbe 24 ore per il secondo tentativo.

🔑 **Il fuso orario è quello che decide a che ora arriva «N anni fa».** Il calcolo del giorno avviene in **UTC** (non esiste nessun fuso memorizzato, vedi la 0039), quindi conviene far girare il lavoro in un'ora in cui la notifica arriva a un orario civile per l'Italia.

---

## Come si capisce che funziona

La funzione risponde con un riepilogo, e **i numeri vanno letti insieme**:

```json
{ "ok": true, "accodate": { "ricordi": 0, "inviti": 0 },
  "lette": 3, "inviate": 2, "scartate": 1, "dispositivi_rimossi": 0 }
```

| Cosa vedi | Cosa significa |
|---|---|
| `lette: 0` | la coda era vuota — normale la maggior parte delle ore |
| `scartate` > 0 | qualcosa **non doveva** partire: consenso spento, coppia sciolta, o nessun dispositivo. Il motivo è in `notifica_in_coda.motivo_scarto` |
| `inviate` < `lette` − `scartate` | qualche invio è fallito e **resta in coda**: `ultimo_errore` dice perché, `da_inviare_il` quando si riproverà |
| `dispositivi_rimossi` > 0 | qualcuno ha disinstallato o revocato il permesso: il token è stato tolto, ed è il comportamento giusto |

⚠️ **`scartate` non è un errore e non va «sistemato».** È la colonna che dimostra di non aver spedito promozioni a chi non le voleva: se un domani servisse provarlo, è lì che si guarda.

## Le due cose che restano fuori da questo documento

- 🔴 **La capability *Push Notifications* sull'App ID e la chiave APNs su EAS.** Senza, su iOS non arriva niente. Richiedono l'account Apple Developer, che il progetto non ha ancora.
- ⚠️ **Una prova vera su un telefono.** In Expo Go il token si ottiene, ma il comportamento non è quello della build finale: è la stessa decisione sul prebuild ferma da **B-20**.
