-- =============================================================================
-- LifeCouple — 0033: i giochi alimentano la creatura, e le soglie tornano tre
--
-- Deciso dall'utente il 2026-09-06: **partita 5, voce di lista 10, luogo 20**.
-- D-104.
--
-- ## 🔴 Cosa si sta riparando: il carburante non era collegato al serbatoio
--
-- **D-15** dice, dal 2026-08-12: *«un luogo visitato da' punti; un film visto
-- da' punti; i giochi danno punti in base al risultato»*. E **P-03** e' a
-- verbale come **«il carburante di P-01»** — non una terza funzione, ma cio'
-- che rende sostenibile il costo della creatura.
--
-- Verificando lo schema il 2026-09-06 e' risultato che i giochi **non hanno mai
-- dato un punto**: `assegna_punti` era chiamata da **due soli trigger**, quello
-- del luogo e quello dell'elemento di lista. `chiudi_round` (0020) accumula in
-- `partita.punti`, che e' una colonna di `partita` e non tocca mai `creatura`.
--
-- 🔑 **Il pezzo che unisce due funzioni non compare in nessuna delle due se le
-- si guarda una per volta.** Il gioco funzionava, la creatura funzionava, il
-- backlog dava per fatta la composizione — e la composizione era precisamente
-- la sola cosa che nessun concorrente fa (FurTwo ha la creatura senza le liste,
-- gli altri hanno i quiz senza la creatura). Mancava il tubo.
--
-- ## Perche' un trigger sulla transizione, e non una riga dentro `chiudi_round`
--
-- Perche' e' cio' che **D-15 prescrive**: *«il punto si assegna alla
-- transizione, non alla presenza»*. Ed e' come sono fatti gli altri due, il che
-- vale piu' dell'eleganza: chi cerchera' fra un anno perche' una partita ha
-- dato punti guardera' dove ha gia' trovato gli altri due.
--
-- ⚠️ E un trigger copre **ogni** strada che concluda una partita, mentre una
-- riga dentro `chiudi_round` copre solo quella funzione. Oggi `chiudi_round` e'
-- l'unico punto che scrive `stato = 'conclusa'` — ma «oggi e' l'unico» e'
-- esattamente il genere di premessa che la prossima migrazione invalida senza
-- accorgersene. Vedi la guardia delle liste in 0023, scritta per un caso
-- *«oggi impossibile ma domani chissa'»*: domani e' arrivato il 2026-09-05.
--
-- ## Perche' `after` e non `before` come gli altri due
--
-- Gli altri due sono `before` per una ragione precisa: **devono scrivere una
-- data** su `new` (`visitato_il`, `fatto_il`) prima che la riga sia salvata.
-- Qui no — `conclusa_il` la scrive gia' `chiudi_round`. Un `before` che non ha
-- bisogno di modificare `new` e' un trigger che **puo'** modificarlo per
-- sbaglio; `after` toglie di mezzo la possibilita'. La divergenza dal modello
-- e' voluta, ed e' scritta qui perche' non venga "uniformata" per coerenza.
--
-- ## La partita vale 5, e la scala e' il messaggio
--
-- 🔑 Non e' una taratura, e' una **dichiarazione di cosa premia il prodotto**.
-- Luoghi e voci di lista sono scarsi per natura: quanti posti nuovi visita una
-- coppia in un mese? Le partite no — si gioca quanto si vuole. A punti pari, la
-- crescita diventerebbe una macinata e la creatura smetterebbe di dire
-- *«abbiamo chiuso il cerchio fra intenzione e realta'»* — che e' il cuore di
-- D-15 — per dire *«abbiamo giocato molto»*.
--
-- Con 5 · 10 · 20 e' la scala stessa a dirlo: **la realta' batte l'app**, e un
-- posto dove siete andati davvero vale quattro partite. Nessuna schermata deve
-- spiegarlo.
--
-- ⚠️ **Nessun tetto giornaliero**, ed e' una scelta. Un tetto avrebbe richiesto
-- una chiave temporale dentro `punti_evento`, cioe' un secondo meccanismo
-- accanto a quello che c'e'. Il rapporto 1:4 fa gia' il lavoro, e se l'uso
-- reale dovesse smentirlo si cambia il **valore**, che e' un numero solo.
--
-- ## La guardia anti-fabbricazione funziona gia', e per la ragione giusta
--
-- `punti_evento` ha `unique (coppia_id, tipo, riferimento_id)` (D-15). Con
-- `riferimento_id = partita.id` una partita non puo' premiare due volte,
-- nemmeno se la si concludesse due volte.
--
-- 🔑 **E rigiocare da' punti nuovi, correttamente**: una nuova partita e' una
-- riga nuova con un id nuovo, quindi punti legittimi — a differenza del
-- togliere-e-rimettere un elemento in lista, che e' lo stesso id e la guardia
-- respinge. La stessa chiave produce due comportamenti opposti perche' i due
-- casi *sono* opposti: rigiocare e' un gesto in piu', ri-spuntare no.
--
-- ## Le soglie tornano tre (D-96), e i vecchi numeri erano diventati assurdi
--
-- `stadio_soglia` era seminata con **sei** righe (0/100/300/700/1500/3000),
-- tarate quando D-09 prevedeva ~5-6 stadi. Gli stadi sono **tre** dal
-- 2026-09-04 (D-96), quindi tre righe delle sei non avrebbero mai potuto
-- corrispondere a niente — e 3000 punti, coi due soli ingressi di allora,
-- volevano dire **150 luoghi visitati**.
--
-- ⚠️ **I nuovi numeri sono una stima dichiarata, non una misura**, e vanno
-- lasciati falsificabili: l'ipotesi e' che una coppia attiva produca
-- **~130 punti al mese** (qualche partita a settimana, una manciata di voci di
-- lista, un paio di posti). Su quell'ipotesi:
--   - stadio 2 a **250** arriva in circa **due mesi**;
--   - stadio 3 a **1200** arriva verso il **nono mese**.
--
-- 🔑 La prima soglia e' bassa apposta, e non e' generosita': **e' la
-- transizione che insegna che la creatura cresce**. Se il primo cambiamento
-- arrivasse a otto mesi, quasi nessuno ne vedrebbe mai uno e la meccanica
-- verrebbe letta come un'immagine ferma — cioe' due dei tre stadi sarebbero
-- stati disegnati per niente (`docs/mascotte.md` §2).
--
-- La tabella esiste **apposta** per essere ritarata senza migrazione (commento
-- in 0001): quando ci saranno dati d'uso, si confronta la produzione reale con
-- i ~130/mese ipotizzati qui e si correggono i due numeri, non lo schema.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. La partita conclusa da' punti alla creatura (D-15, D-104)
-- -----------------------------------------------------------------------------

create or replace function public.punti_su_partita_conclusa()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  -- La transizione, non lo stato: una partita gia' conclusa che venisse
  -- riscritta per qualunque motivo non deve premiare una seconda volta.
  -- (La chiave unica di punti_evento lo impedirebbe comunque: questa e' la
  -- prima delle due difese, non l'unica.)
  if old.stato is distinct from 'conclusa' and new.stato = 'conclusa' then
    perform assegna_punti(new.coppia_id, 'partita_conclusa', new.id, 5);
  end if;
  -- `after` trigger: il valore di ritorno viene ignorato.
  return null;
end;
$$;

-- ⚠️ `abbandonata` NON da' punti, ed e' coerente con D-15: il punto premia la
-- **chiusura del cerchio**, non il tempo passato dentro l'app. Una partita
-- lasciata a meta' e' un cerchio non chiuso.
drop trigger if exists partita_conclusa_punti on public.partita;
create trigger partita_conclusa_punti
  after update of stato on public.partita
  for each row execute function public.punti_su_partita_conclusa();

-- -----------------------------------------------------------------------------
-- 2. Le soglie tornano tre (D-96, D-104)
-- -----------------------------------------------------------------------------

-- Si cancella tutto e si reinserisce invece di aggiornare riga per riga:
-- `punti_minimi` ha un vincolo `unique`, e un update in ordine sbagliato
-- (100 → 250 mentre 300 esiste ancora, o peggio) collide. Nessuna tabella
-- referenzia `stadio_soglia`, quindi la cancellazione non ha conseguenze.
delete from public.stadio_soglia;

insert into public.stadio_soglia (stadio, punti_minimi) values
  (1, 0),      -- cucciolo, col ciuccio
  (2, 250),    -- intermedio: e' `riferimento.jpg`
  (3, 1200);   -- adulta

-- -----------------------------------------------------------------------------
-- 3. Permessi
-- -----------------------------------------------------------------------------

-- Niente da concedere: `punti_su_partita_conclusa` restituisce `trigger`, e
-- Postgres stesso ne vieta la chiamata diretta — non e' esposta via RPC. E'
-- la stessa nota gia' scritta in 0002 per gli altri `punti_su_transizione_*`.
