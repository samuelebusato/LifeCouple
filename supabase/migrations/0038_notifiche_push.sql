-- =============================================================================
-- LifeCouple — 0038: le notifiche push — dispositivi e consensi
--
-- 🔴 NON ANCORA APPLICATA. Va letta prima di eseguirla.
--
-- ## Cosa introduce, e cosa NON introduce
--
-- Due tabelle: dove vivono i token dei dispositivi, e quali notifiche ogni
-- persona ha accettato di ricevere. L'invio non sta qui — lo fa una Edge
-- Function, perche' chiamare un servizio esterno da un trigger Postgres
-- legherebbe la scrittura di un luogo alla raggiungibilita' della rete.
--
-- ⚠️ **Nessuna delle tre notifiche usa la posizione.** La notifica «il partner
--    ha segnato un posto» nasce da una RIGA SCRITTA da una persona, non dal
--    telefono che si accorge di essere da qualche parte. La differenza non e'
--    di implementazione: `threat-model.md` §3 (TB-2) elenca *«niente posizione
--    in background, niente cronologia automatica»* fra le mitigazioni
--    **implementate**, contro una minaccia che nomina per esteso —
--    *intimate partner surveillance*. Il geofencing la ribalterebbe, e sarebbe
--    una decisione da prendere in quel documento, non qui.
--
-- ## Le tre notifiche che queste tabelle abilitano
--
-- | Tipo | Cos'e' | Consenso |
-- |---|---|---|
-- | `luogo_del_partner` | l'altro ha segnato un posto come visitato | servizio, acceso |
-- | `ricordi` | «dov'eravate N anni fa», su eventi con la stessa data | servizio, acceso |
-- | `inviti_a_tornare` | sollecito a inserire nuovi viaggi | 🔴 **marketing, SPENTO** |
--
-- 🔑 **Perche' il terzo nasce spento e gli altri no, ed e' la riga che conta.**
--    I primi due raccontano qualcosa che la coppia ha *fatto*: sono
--    comunicazioni di servizio. Il terzo e' un sollecito a usare il prodotto —
--    promozionale a tutti gli effetti, quindi vuole un **consenso espresso**,
--    non un consenso presunto da revocare. ⚠️ Le linee guida di Apple vietano
--    il push promozionale senza consenso esplicito e revocabile, e la cookie
--    policy dichiara *«no profiling [...] nothing follows you»*: un sollecito
--    basato sull'inattivita' e' la cosa piu' vicina alla profilazione che
--    questa app avra' mai, e va acceso da chi lo riceve.
-- =============================================================================


-- --- I dispositivi -----------------------------------------------------------
-- Un token push identifica **un'installazione su un telefono**, non una
-- persona: la stessa persona con due telefoni ha due righe, e reinstallando
-- l'app ne ottiene una nuova.
create table if not exists public.dispositivo (
  id uuid primary key default gen_random_uuid(),

  utente_id uuid not null references auth.users (id) on delete cascade,

  /** Il token di Expo. Unico: se lo stesso telefono si ripresenta, la riga si
      aggiorna invece di duplicarsi (vedi `dispositivo_utente_token`). */
  token text not null,

  piattaforma text not null check (piattaforma in ('ios', 'android')),

  creato_il timestamptz not null default now(),
  /** Aggiornato a ogni avvio: serve a potare i dispositivi spariti, e a
      distinguere «non ha il permesso» da «non apre l'app da mesi». */
  visto_il timestamptz not null default now(),

  -- Lo stesso token non puo' appartenere a due utenti: se un telefono cambia
  -- proprietario e la vecchia riga restasse, le notifiche di una persona
  -- arriverebbero a un'altra. ⚠️ Non e' un caso di scuola: succede rivendendo
  -- o prestando il telefono, ed e' esattamente il genere di perdita che TB-2
  -- considera grave.
  constraint dispositivo_token_unico unique (token)
);

comment on table public.dispositivo is
  'Token push, uno per installazione. Appartiene a una PERSONA e non a una coppia: sciogliendo la coppia il telefono resta suo. Il partner non lo vede mai (0038).';

create index if not exists dispositivo_per_utente on public.dispositivo (utente_id);

alter table public.dispositivo enable row level security;

-- 🔴 Solo il proprietario, e **il partner NON e' incluso**.
-- Ovunque in questo schema le policy dicono `e_membro_attivo(coppia_id)`; qui
-- no, ed e' deliberato. Un token e' un identificativo di dispositivo: farlo
-- vedere all'altro membro darebbe alla coppia una capacita' che il prodotto
-- non ha — sapere quanti telefoni ha l'altro, e quando li ha usati l'ultima
-- volta (`visto_il`). E' il confine TB-2, applicato a un dato tecnico.
create policy dispositivo_proprio_leggi on public.dispositivo
  for select using (utente_id = auth.uid());

create policy dispositivo_proprio_scrivi on public.dispositivo
  for insert with check (utente_id = auth.uid());

create policy dispositivo_proprio_aggiorna on public.dispositivo
  for update using (utente_id = auth.uid()) with check (utente_id = auth.uid());

-- Togliere il proprio dispositivo e' un diritto, non un'operazione di sistema:
-- e' il modo di dire «su questo telefono basta» senza spegnere tutto.
create policy dispositivo_proprio_cancella on public.dispositivo
  for delete using (utente_id = auth.uid());


-- --- I consensi --------------------------------------------------------------
-- Una riga per persona. La riga puo' non esistere: chi non l'ha mai toccata
-- prende i valori di default, ed e' il motivo per cui i default qui sotto sono
-- una decisione e non una comodita'.
create table if not exists public.preferenze_notifiche (
  utente_id uuid primary key references auth.users (id) on delete cascade,

  /** Servizio: l'altro ha segnato un posto come visitato. */
  luogo_del_partner boolean not null default true,

  /** Servizio: «dov'eravate N anni fa». */
  ricordi boolean not null default true,

  /** 🔴 MARKETING: nasce SPENTO e si accende solo con un gesto esplicito.
      Vedi la nota in testa: un consenso presunto qui non sarebbe valido. */
  inviti_a_tornare boolean not null default false,

  aggiornate_il timestamptz not null default now()
);

comment on table public.preferenze_notifiche is
  'Quali notifiche una persona accetta. I due tipi di servizio nascono accesi, il sollecito promozionale nasce SPENTO: e'' un consenso che va dato, non revocato (0038).';

alter table public.preferenze_notifiche enable row level security;

-- Stesso confine dei dispositivi: sono scelte personali, non della coppia.
create policy preferenze_proprie_leggi on public.preferenze_notifiche
  for select using (utente_id = auth.uid());

create policy preferenze_proprie_scrivi on public.preferenze_notifiche
  for insert with check (utente_id = auth.uid());

create policy preferenze_proprie_aggiorna on public.preferenze_notifiche
  for update using (utente_id = auth.uid()) with check (utente_id = auth.uid());


-- --- La cancellazione dell'account -------------------------------------------
-- ✅ Entrambe le tabelle pendono da `auth.users` con `on delete cascade`:
-- cancellando l'utente spariscono da sole, e la Edge Function `cancella-account`
-- non va toccata.
--
-- ⚠️ Ma `Rule/catena-cancellazione.md` VA aggiornato lo stesso. Quel documento
--    e' l'inventario che si esibisce per dimostrare l'art. 17: se elenca foto,
--    file e contenuti e tace sui token, la prova e' incompleta anche quando il
--    codice fa la cosa giusta. Un inventario che non nomina un dato personale
--    e' il posto piu' tranquillo dove nasconderlo.
--
-- 🔑 Lo SCIOGLIMENTO invece non tocca niente qui, ed e' corretto: il telefono
--    resta di chi ce l'ha. Le notifiche che riguardano l'altro smettono da se',
--    perche' chi le manda legge l'appartenenza attiva.


-- --- La prova ----------------------------------------------------------------
-- Da aggiungere a `tests/rls.avversariali.mjs`, e da fare fallire prima di
-- crederci (e' la lezione di B-62, dove un test verde copriva una promessa
-- rotta perche' misurava le righe e non i file):
--
--   1. A registra un dispositivo. B, partner attivo di A, NON deve vederlo.
--   2. B non deve poter aggiornare ne' cancellare la riga di A.
--   3. Dopo lo scioglimento, nessuno dei due vede i dispositivi dell'altro
--      (deve valere gia' al punto 1, ma il caso va esercitato lo stesso).
--   4. `inviti_a_tornare` di una riga appena creata deve risultare FALSE.
