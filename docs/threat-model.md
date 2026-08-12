# LifeCouple — Threat model (STRIDE)

Metodo e struttura obbligatoria: [`Rule/regole-sviluppo-sicuro.md`](../../../Rule/regole-sviluppo-sicuro.md) §1.3 e §5. Una riga per minaccia, minacce **concrete** mai astratte, e per ogni mitigazione lo **stato reale** (esistente / parziale / da fare) e **come è stata verificata**.

> **Stato al 2026-08-12**: threat model fatto **prima del codice**, come prescrive il principio 1. Di conseguenza **nessuna mitigazione è "verificata"**: sono tutte *da fare*, e questo documento è la specifica di cosa dovrà essere vero. Dichiararlo è obbligatorio (principio 7: nessun gap silenzioso).

---

## 1. Classificazione dei dati (passo 2 del framework)

| Dato | Sensibilità | Perché | Protezione richiesta |
|---|---|---|---|
| **Fotografie della coppia** | **Massima** | Materiale privato e potenzialmente intimo. Una violazione qui non è un disagio: è un danno personale irreversibile | Accesso ristretto per riga, URL non indovinabili e non permanenti, cancellazione verificata |
| **Cronologia dei luoghi visitati** | **Alta** | Un elenco di luoghi con date **rivela l'abitazione, gli orari e le abitudini** di due persone. Su una relazione non sana è uno strumento di sorveglianza | Nessuna posizione automatica (D-05), accesso ristretto, cancellabile |
| Calendario condiviso | Media-Alta | Rivela presenze, assenze e **quando la casa è vuota** | Accesso ristretto |
| Recensioni di film e ristoranti | Bassa-Media | Preferenze personali; poco sensibili isolate, più parlanti in aggregato | Accesso ristretto |
| Email e credenziali | Alta (PII) | Recupero dell'account | Gestite da Supabase Auth, mai nel nostro database, mai nei log |
| Legame fra i due utenti | **Alta** | Il solo fatto che due persone siano una coppia **è un dato personale di entrambi** — e in alcuni contesti è la cosa più sensibile dell'intero sistema | Non deducibile da un utente esterno |
| **Risposte ai giochi di affinità** (P-03) | **Alta** | Sono confidenze scritte, non preferenze. E se il banco domande non è filtrato scivolano in **art. 9** (vita sessuale, salute, religione, opinioni politiche) senza sembrarlo | **D-08: il banco esclude le categorie art. 9.** Accesso ristretto come ogni contenuto; autore e regola di scioglimento come D-04 |
| **Domande personalizzate scritte dagli utenti** (D-19) | **Alta**, e ⚠️ **non controllabile per costruzione** | Le persone scriveranno domande su sesso, salute e religione: **le stesse categorie art. 9** per cui il ciclo mestruale è stato rimandato. La differenza che regge è che **non le chiediamo noi** — un campo libero non è un trattamento *progettato* per raccoglierle — ma i dati arrivano lo stesso sui nostri server | Restano **private della coppia**: mai riusate nel banco comune, mai suggerite ad altri, mai aggregate · **nessuna analisi del contenuto** · avviso al primo uso · dentro la catena di cancellazione e in D-04 · **da fare** |
| **Dati del ciclo mestruale** (funzione P-02, **rimandata dopo la prima pubblicazione** — D-07) | 🔴 **Categoria particolare — art. 9 GDPR** | Dato **sanitario**. Il trattamento è **vietato** salvo eccezione: qui l'unica praticabile è il **consenso esplicito**, separato e revocabile | Consenso esplicito dedicato · **privato per impostazione predefinita** · condivisione col partner come interruttore separato e spento · **revoca silenziosa** · nessuna analitica di terze parti · linguaggio mai fertilità/contraccezione (§3-bis) |

---

## 2. TB-1 — Utente ↔ backend

| Componente | STRIDE | Minaccia concreta | Conseguenza | Mitigazione |
|---|---|---|---|---|
| API dati | **S** | Un utente riusa un token scaduto o alterato per chiamare l'API | Accesso a dati altrui | Validazione del token da Supabase Auth · **da fare** |
| API dati | **T** | Il client invia `autore_id` di un altro utente creando un contenuto attribuito a lui | Attribuzione falsa, e con essa l'aggiramento della regola "solo l'autore cancella" | `autore_id` **imposto dal database** (default `auth.uid()`), mai accettato dal client · **da fare** |
| Storage foto | **I** | Un URL di una foto viene indovinato o resta valido dopo la revoca dell'accesso | Esposizione del dato a sensibilità massima | Chiavi non indovinabili + URL firmati **a scadenza breve**, mai file pubblici · **da fare** |
| Storage foto | **D** | Caricamento massivo per far esplodere il piano gratuito | Costo, o servizio sospeso | Compressione lato client + **tetto per coppia** + limite di frequenza · **da fare** (tetto ancora `—`) |
| Cancellazione account | **I** | Si cancellano le righe indice ma i file restano nello storage | Dati che dovevano sparire restano, e nessuna query li trova più: violazione dell'art. 17 GDPR **invisibile** | Ordine deliberato: **prima i file, poi le righe**, con prova end-to-end che nulla resti orfano (`Rule/catena-cancellazione.md`) · **da fare** |

---

## 3. TB-2 — Partner ↔ partner ⚠️ (il confine caratteristico di questo prodotto)

> **L'attaccante più probabile di un'app di coppia non è uno sconosciuto: è l'altro membro della coppia.** Conosce l'email, spesso la password, e ha accesso fisico al telefono. Un threat model che tratta i due partner come un'unica entità di fiducia **non modella la minaccia reale**.

| Componente | STRIDE | Minaccia concreta | Conseguenza | Mitigazione |
|---|---|---|---|---|
| Account | **S** | Il partner accede all'account dell'altro conoscendone la password, o dal telefono lasciato sbloccato | Controllo totale sui contenuti dell'altro | Fuori dalla portata tecnica dell'app. **Gap dichiarato**: si mitiga solo parzialmente con notifica di nuovo accesso e blocco biometrico locale · **da fare** |
| Qualunque contenuto | **T** | Un partner cancella foto, recensioni, luoghi o elementi caricati dall'altro, per ritorsione | Perdita irreversibile di dati altrui | **Solo l'autore modifica o cancella — per ogni tipo di contenuto** (D-21). La ritorsione è **strutturalmente impossibile**: si può svuotare solo ciò che si è caricato · **da fare** |
| Contenuti condivisi | **R** | *"Non sono stato io a cancellarle"* | Nessun modo di stabilire cosa è successo | Registro append-only delle azioni distruttive, con autore e data · **da fare** |
| Mappa | **I** | La cronologia dei luoghi viene usata per ricostruire dove l'altro è stato e quando | **Sorveglianza del partner** — le app di coppia sono un vettore documentato di *intimate partner surveillance* | **D-05: nessuna posizione in tempo reale né automatica.** Ogni luogo è inserito volontariamente e a posteriori dal suo autore · **decisa, da implementare** |
| Giochi (invio sigillato) | **I** | Il partner interroga direttamente l'API col **proprio token valido** e legge la risposta dell'altro **prima** della rivelazione | Il gioco è rotto in silenzio, e chi bara non lascia traccia. Non basta nasconderla nell'interfaccia | Le risposte stanno in una tabella che l'altro **non può leggere in nessun caso**; il confronto avviene in una **funzione Postgres** che restituisce il risultato solo quando entrambi hanno inviato (D-12) · **da fare** |
| Obbligo o verità | **E** | La meccanica *"chi passa di più perde"* diventa uno strumento per insistere su un contenuto che l'altro non vuole affrontare | L'app si schiera dalla parte della pressione, proprio sul confine che dovrebbe presidiare | La mitigazione è **sul contenuto**, non sulla meccanica: banco filtrato per D-08, più nessun obbligo con atti fisici e nessuna verità su relazioni precedenti (D-13) · **da fare** |
| Coppia sciolta | **E** | Dopo la rottura l'ex-partner continua a vedere foto e luoghi dell'altro | Il caso peggiore dell'intero sistema: accesso permanente a materiale intimo di chi non lo vuole più concedere | `uscito_il` su `membro_coppia` e policy RLS che leggono l'**appartenenza attiva**, non l'appartenenza storica (D-04) · **da fare** |
| Scioglimento | **T** | Un partner scioglie la coppia da solo e l'altro perde tutto senza saperlo | Perdita di accesso non annunciata | Lo scioglimento **revoca, non cancella**; notifica esplicita a entrambi; ciascuno conserva ciò di cui è autore · **da fare** |

> **La domanda che ha generato metà di queste righe**, e che vale la pena riusare su ogni app multi-utente: *cosa succede quando l'unità di autorizzazione smette di esistere, ma i dati no?*

### 3-bis. Se entra la funzione ciclo mestruale (P-02) — righe aggiuntive su TB-2

> ✅ **La funzione è stata rimandata dopo la prima pubblicazione (D-07, 2026-08-12).** Queste righe **non decadono**: si applicheranno quando entrerà, e sono qui perché la decisione di rimandarla è stata presa conoscendole.
>
> ⚠️ **Corollario da presidiare nel frattempo (D-08)**: rimandare il ciclo per motivi di art. 9 e poi far entrare le stesse categorie tramite le domande dei giochi di affinità annullerebbe la decisione **senza che nessuno se ne accorga**, perché un quiz non si presenta come una funzione sanitaria.

| Componente | STRIDE | Minaccia concreta | Conseguenza | Mitigazione |
|---|---|---|---|---|
| Ciclo | **I** | Il partner vede i dati del ciclo senza che sia stata una scelta consapevole e separata — perché erano "nel calendario condiviso" | Divulgazione di **dato sanitario art. 9** a un terzo, senza base giuridica valida | **Privato per impostazione predefinita**; condivisione come interruttore **separato e spento**; consenso esplicito dedicato · **da fare** |
| Ciclo | **E** | Il partner insiste perché la condivisione resti attiva, e chi la subisce non la revoca per timore della reazione | Il consenso non è **libero** ex art. 4(11): la base giuridica dell'intero trattamento cade | ⚠️ **La revoca deve essere silenziosa**: nessuna notifica al partner, nessun indicatore "non condivide più". Una notifica aggiunta "per trasparenza" **distrugge** la mitigazione · **da fare** |
| Ciclo | **I** | I dati del ciclo finiscono in strumenti di analitica o di diagnostica dei crash | Dato art. 9 verso terzi non previsti | **Nessuna analitica di terze parti** sulle schermate del ciclo · **da fare** |
| Ciclo | **T** | Il testo dell'app parla di *fertilità*, *ovulazione* o *giorni sicuri* | La finalità diventa **diagnostica/contraccettiva** e l'app scivola sotto la MDR (è il motivo per cui **Natural Cycles** è un dispositivo certificato) | Vincolo lessicale scritto: solo linguaggio **informativo** sulla previsione della prossima mestruazione · **da fare** |
| Ciclo | **I** | Cancellazione account: restano righe di ciclo orfane | Dato art. 9 che doveva sparire e resta | La catena di cancellazione include **esplicitamente** questa tabella, verificata end-to-end · **da fare** |

---

## 4. TB-3 — Coppia ↔ coppia

| Componente | STRIDE | Minaccia concreta | Conseguenza | Mitigazione |
|---|---|---|---|---|
| Ogni tabella | **I** | Una query senza filtro su `coppia_id` restituisce righe di altre coppie | Esposizione trasversale: il guasto peggiore possibile | **RLS su ogni tabella**, in lettura **e** in scrittura. Con RLS attiva una query dimenticata restituisce zero righe, non le righe altrui · **da fare** |
| Appaiamento via **link condiviso** (D-14) | **S** | Il link viaggia su WhatsApp o messaggi: si inoltra, si legge da una notifica su schermo bloccato, resta in una chat di gruppo. **Chi lo apre per primo entra nella coppia** | Un estraneo dentro i dati più sensibili del sistema, con accesso a foto e luoghi | Token a entropia sufficiente · **scadenza breve** · **monouso** · **conferma esplicita di chi ha invitato** prima che il legame sia effettivo · revoca di un link non usato · **da fare**. ⚠️ Le prime tre riducono la probabilità: **solo la conferma interrompe l'ingresso** |
| Nuova tabella futura | **I** | Si aggiunge una tabella e si dimentica la policy RLS | Esposizione silenziosa che nessun test funzionale rileva | Regola di progetto: **nessuna tabella senza RLS**, verificata con un test che fallisce se una tabella non ha policy · **da fare** |

---

## 5. Conformità (se e quando va sullo store)

L'app è dichiarata *una prova*, ma **con utenti terzi non esiste alcuna esenzione**. L'esenzione domestica (art. 2(2)(c) GDPR) copre l'uso personale, **non** chi pubblica un servizio usato da altri.

| Adempimento | Stato | Nota |
|---|---|---|
| Informativa privacy resa **alla raccolta** | **da fare** | Modello adattabile: `Rule/informativa-privacy-app.md` |
| Cookie policy | **da fare** | `Rule/cookie-policy-app.md` |
| Registro dei trattamenti (art. 30) | **da fare** | `Rule/registro-trattamenti.md` |
| **DPA con il fornitore** (art. 28) + regione UE | **da fare** | Il fornitore è responsabile del trattamento: l'accordo va archiviato, non solo accettato |
| Procedura data breach (artt. 33-34) | **da fare** | `Rule/procedura-data-breach.md`. Notifica entro **72 ore** |
| Catena di cancellazione verificata | **da fare** | `Rule/catena-cancellazione.md` |
| Cancellazione account **in-app** | **da fare** | Requisito di Apple, non solo del GDPR |
| Retention dichiarata **e imposta** | **da fare** | Ogni scadenza scritta nell'informativa deve avere una configurazione che la applica |
| Etichette privacy degli store | **da fare** | Devono corrispondere a ciò che l'app fa davvero |
| Classificazione per età | **da fare** | Un'app per coppie con foto private non è un'app per minori: va dichiarato |
| **Se entra P-02 (ciclo)**: consenso esplicito art. 9, separato | **da fare** | Non è il consenso generale all'uso dell'app. Circa l'**80% delle app FemTech risulta inadempiente** proprio su questo |
| **Se entra P-02**: valutazione d'impatto (DPIA, art. 35) | **da valutare** | Dati di categoria particolare trattati sistematicamente più condivisione con un terzo: va almeno documentata la valutazione se si conclude che non serve |
| **Se entra P-02**: etichette privacy degli store | **da fare** | Le due piattaforme hanno categorie dedicate ai dati sanitari, e dichiararle male è un problema di per sé |

---

## 6. Rischi non mitigati, accettati per iscritto

| Rischio | Perché accettato | Quando cade l'accettazione |
|---|---|---|
| **Nessuna cifratura end-to-end delle foto** — chi amministra il backend può tecnicamente accedervi | Complessità sproporzionata a un esperimento (gestione chiavi su due dispositivi, recupero dopo cambio telefono) | Se il progetto smette di essere un esperimento. **È il primo upgrade di sicurezza da fare** |
| **Accesso del partner al telefono sbloccato** | Fuori dalla portata tecnica di qualunque app | — |
| **Nessuna moderazione dei contenuti** | Nessun utente oltre la cerchia ristretta | Alla prima segnalazione, o all'apertura al pubblico |
| **Nessun monitoraggio né allarme** | Nessun utente, nessun ricavo | Ai primi utenti reali |
| **Nessuna revisione legale professionale** dei testi | I documenti si adattano da quelli di HeleoX, rivisti da persona non legale | Prima della pubblicazione pubblica |

---

## 7. Come si verificherà (quando ci sarà codice)

Verifica **contro la realtà**, non contro l'assenza di errori (principio 4):

1. **Due coppie di prova reali** e la verifica esplicita che l'utente A non legga **nessuna** riga della coppia B, tabella per tabella.
2. **Scenario di rottura eseguito davvero**: si scioglie una coppia di prova e si verifica che l'ex-membro non acceda più ai contenuti dell'altro — **né via app, né chiamando direttamente l'API con il proprio token valido**.
3. **Cancellazione account end-to-end**: si cancella un account di prova e si verifica che **nessun file resti** nello storage. È l'errore già trovato su HeleoX e non va ripetuto.
4. **Test che fallisce se una tabella non ha policy RLS**, così l'aggiunta futura di una tabella non può passare in silenzio.
