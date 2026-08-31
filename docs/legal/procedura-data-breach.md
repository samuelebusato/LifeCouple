# Procedura di gestione delle violazioni di dati personali — LifeCouple

> Documento **interno**, del 2026-08-31. Artt. 33-34 GDPR. Adattato da [`Rule/procedura-data-breach.md`](../../../../Rule/procedura-data-breach.md).
>
> ⚠️ **Esiste per essere letto in un momento in cui non si ragiona bene.** Va tenuto dove si trova in fretta, non dove è ordinato.

---

## Il vincolo, in una riga

**72 ore dal momento in cui vieni a conoscenza della violazione**, per notificare al Garante. Il cronometro parte dalla *conoscenza*, non dalla *certezza*: un sospetto ragionevole lo fa partire. Se si notifica oltre le 72 ore, va motivato il ritardo.

🔴 **E per questo prodotto c'è un aggravante da tenere presente fin d'ora**: i dati in gioco sono **fotografie private di coppie** e **cronologie di luoghi**. Una violazione qui non è un disagio amministrativo — è un danno personale potenzialmente irreversibile. La soglia per considerare il rischio «elevato» (§Fase 3) è quindi **più bassa** che in un servizio ordinario.

---

## Fase 0 — Cosa conta come violazione

Non solo l'attacco esterno. Contano:

- accesso non autorizzato a fotografie o contenuti di una coppia da parte di terzi;
- 🔴 **un difetto delle regole di isolamento (RLS) che rende visibili a una coppia i dati di un'altra** — è la violazione più probabile di questo sistema, e la più silenziosa;
- **URL di fotografie diventati pubblici o permanenti** (il caso che le firme a scadenza esistono per evitare);
- perdita irreversibile di dati (cancellazione accidentale senza backup ripristinabile);
- 🔴 **una cancellazione account che non ha cancellato davvero** — i file restano nello storage mentre l'utente crede di essere sparito: è violazione dell'art. 17, ed è **invisibile** finché non si guarda il bucket;
- credenziali o chiavi finite in un posto sbagliato (repository, log, bundle dell'app);
- violazione presso un fornitore che tratta i nostri dati (Supabase in primo luogo).

⚠️ **Non conta come violazione**: il partner che accede all'account dell'altro conoscendone la password. È un **gap dichiarato** del threat model (TB-2), fuori dalla portata tecnica dell'app — ma se emerge come fenomeno ricorrente va riconsiderato.

---

## Fase 1 — Contenere (subito, prima di documentare)

Nell'ordine, senza aspettare di aver capito tutto:

1. **Fermare l'emorragia**: revocare le chiavi compromesse, disattivare l'accesso, sospendere la funzione difettosa. Meglio un servizio interrotto che dati che continuano a uscire.
2. **Non cancellare le prove.** Non azzerare log, non ricreare risorse: servono per capire l'estensione, ed è la prima cosa che il Garante chiede.
3. **Annotare l'ora** in cui sei venuto a conoscenza del fatto. È l'inizio del cronometro e va scritto subito, prima che diventi ricostruzione a memoria.
4. Se sono coinvolte fotografie: verificare **se gli URL firmati siano ancora validi** e, se necessario, invalidarli.

---

## Fase 2 — Registrare (sempre, anche se non si notifica)

L'art. 33.5 impone di documentare **ogni** violazione, anche quelle che non si notificano. Il registro è in fondo a questo documento.

Per ciascuna: data e ora della conoscenza · descrizione · categorie e numero approssimativo di interessati · categorie e numero approssimativo di record · conseguenze probabili · misure adottate · decisione se notificare, **con la motivazione**.

---

## Fase 3 — Valutare il rischio

| Rischio | Quando | Cosa fare |
|---|---|---|
| **Improbabile** | Dato cifrato e chiave non compromessa; nessun accesso effettivo dimostrabile | Registrare, non notificare — **motivando** |
| **Presente** | Accesso possibile a dati personali comuni | **Notificare al Garante** entro 72 ore |
| 🔴 **Elevato** | **Fotografie**, cronologie di luoghi, legame di coppia, risposte ai giochi | **Notificare al Garante E comunicare agli interessati** |

🔑 **Per questo prodotto, tre categorie portano quasi automaticamente al rischio elevato**: le fotografie (danno personale irreversibile), la cronologia dei luoghi (rivela abitazione e abitudini di due persone, e su una relazione non sana diventa strumento di sorveglianza), e **il legame di coppia in sé** — che per certi utenti può rivelare l'orientamento sessuale.

⚠️ Nel dubbio fra «presente» ed «elevato», su questo prodotto **si sceglie elevato**.

---

## Fase 4 — Notificare al Garante (entro 72 ore)

Modulo online sul sito del Garante (www.garanteprivacy.it), a firma del titolare.

Contenuto minimo (art. 33.3): natura della violazione, categorie e numero approssimativo di interessati e di record; contatto per informazioni; conseguenze probabili; misure adottate o proposte.

⚠️ **Se non hai tutti i dati, notifica lo stesso entro le 72 ore** e integra dopo: l'art. 33.4 lo consente esplicitamente. Il ritardo è più grave dell'incompletezza.

---

## Fase 5 — Comunicare agli interessati (solo se rischio elevato)

**Senza ingiustificato ritardo**, in **linguaggio semplice e chiaro** — non giuridico.

Deve dire: cosa è successo, quali dati sono coinvolti, quali sono le conseguenze possibili, cosa stiamo facendo, cosa può fare l'utente, e a chi scrivere.

Canale: **email agli indirizzi degli account coinvolti** e, se la violazione è estesa, avviso in evidenza dentro l'applicazione.

⚠️ **Un'attenzione specifica di questo prodotto**: la comunicazione arriva a **due persone legate fra loro**. Va scritta in modo che non riveli all'uno contenuti dell'altro che non conosceva, e che non presupponga che la coppia esista ancora.

---

## Fase 6 — Dopo

- **Correggere la causa**, non solo il sintomo.
- **Aggiornare** [`threat-model.md`](../threat-model.md): una violazione reale è una minaccia che il modello non aveva previsto, o aveva previsto e non mitigato. In entrambi i casi il documento va corretto.
- **Registrare in [`History.md`](../../History.md)** cosa è successo e perché, col metodo del progetto: il difetto, come è stato trovato, come è stato verificato il rimedio.

---

## Se la violazione avviene presso un fornitore

Supabase è **responsabile del trattamento**: deve informarci **senza ingiustificato ritardo**, e da quel momento parte **il nostro** cronometro di 72 ore verso il Garante. La notifica al Garante resta un obbligo **nostro**, non suo.

⚠️ Vale lo stesso per gli altri fornitori. Verificare che i rispettivi DPA prevedano l'obbligo di informarci — è uno dei punti `[DA FARE]` del [registro dei trattamenti](registro-trattamenti.md) Parte C.

---

## Registro delle violazioni (art. 33.5)

| Data conoscenza | Descrizione | Interessati | Record | Rischio | Notificato? | Motivazione | Misure |
|---|---|---|---|---|---|---|---|
| *(nessuna violazione registrata al 2026-08-31)* | | | | | | | |
