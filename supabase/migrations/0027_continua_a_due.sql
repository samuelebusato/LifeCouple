-- =============================================================================
-- 0027 — «Continua» premuto da tutti e due, round per round
-- =============================================================================
--
-- Chiesto dall'utente il 2026-09-01, dopo la prima partita giocata su due
-- telefoni veri: *«le animazioni sono troppo veloci: potremmo risolvere con un
-- pop-up che dice se la risposta è corretta o errata e un pulsante Continua»*.
--
-- ## Perché serve una tabella e non bastava un timer più lungo
--
-- Fino a oggi fra un round e il successivo passava `PAUSA_FRA_ROUND` — tre
-- secondi, uguali per tutti. Un timer risolve il sintomo per **chi l'ha
-- tarato**: chi legge più lentamente resta indietro comunque, e chi ha già
-- capito aspetta. Soprattutto, tre secondi sono la stessa attesa sia che
-- l'altro stia ancora guardando lo schermo sia che abbia posato il telefono.
--
-- 🔑 Il round successivo non deve partire **dopo un tempo**: deve partire
-- **quando sono pronti in due**. È la stessa forma di `partita_pronto`, che già
-- fa esattamente questo per l'inizio della partita — qui applicata a ogni round.
-- Da lì viene la struttura, le policy e il modo di attivare il realtime: un
-- meccanismo che esiste già e funziona è preferibile a uno nuovo che gli somiglia.
--
-- ## Perché per round e non per partita
--
-- `partita_pronto` ha chiave `(partita_id, utente_id)`: dice «sono pronto a
-- giocare», una volta sola. Qui serve «sono pronto ad **andare avanti**», e la
-- risposta cambia a ogni round — quindi la chiave è `(round_id, utente_id)`.
-- Riusare la tabella esistente avrebbe voluto dire cancellarne le righe a ogni
-- round, cioè distruggere l'informazione che fa partire la partita.

-- -----------------------------------------------------------------------------
-- 1. La tabella
-- -----------------------------------------------------------------------------

create table if not exists public.round_pronto (
  -- `round_id` e non `(partita_id, numero)`: la riga del round ha già una
  -- chiave sua, e il `cascade` che cancella tutto quando la partita sparisce
  -- passa da lì senza che questa tabella debba saperne niente.
  round_id  uuid not null references public.partita_round (id) on delete cascade,
  utente_id uuid not null default auth.uid() references auth.users (id),
  pronto_il timestamptz not null default now(),
  primary key (round_id, utente_id)
);

-- -----------------------------------------------------------------------------
-- 2. Le policy — identiche a quelle di `partita_pronto`, un salto più in là
-- -----------------------------------------------------------------------------

alter table public.round_pronto enable row level security;

-- Si vede la propria riga **e quella del partner**: sapere che l'altro ha
-- premuto è il segnale che fa ripartire il gioco, quindi dev'essere leggibile.
-- ⚠️ Qui non c'è niente da nascondere fra i due, al contrario di
-- `invio_sigillato`: «sono pronto ad andare avanti» non è un pezzo del gioco.
drop policy if exists round_pronto_select on public.round_pronto;
create policy round_pronto_select on public.round_pronto
  for select using (
    exists (select 1
              from public.partita_round r
              join public.partita p on p.id = r.partita_id
             where r.id = round_id and public.e_membro_attivo(p.coppia_id))
  );

-- Ma si dichiara pronti **solo per sé**: senza questa riga un telefono potrebbe
-- premere «continua» al posto dell'altro, che è esattamente ciò che il
-- meccanismo esiste per impedire.
drop policy if exists round_pronto_insert on public.round_pronto;
create policy round_pronto_insert on public.round_pronto
  for insert with check (
    utente_id = auth.uid()
    and exists (select 1
                  from public.partita_round r
                  join public.partita p on p.id = r.partita_id
                 where r.id = round_id and public.e_membro_attivo(p.coppia_id))
  );

-- Ci si ripensa solo per sé. Serve poco, ma un `insert` senza `delete` lascia
-- uno stato da cui non si torna indietro, e quelli vanno decisi, non subiti.
drop policy if exists round_pronto_delete on public.round_pronto;
create policy round_pronto_delete on public.round_pronto
  for delete using (utente_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 3. Il realtime
-- -----------------------------------------------------------------------------
--
-- Stessa cautela di 0020, e per la stessa ragione: se la publication non esiste
-- si **dice**, invece di fallire in silenzio e lasciare il realtime spento senza
-- che nessuno lo sappia. Un meccanismo di sincronizzazione che non sincronizza
-- e non protesta è il difetto peggiore che questa migrazione possa avere — chi
-- preme «continua» aspetterebbe per sempre credendo che tocchi all'altro.

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    raise notice 'publication supabase_realtime assente: il realtime NON e'' stato attivato';
    return;
  end if;

  begin
    execute 'alter publication supabase_realtime add table public.round_pronto';
  exception
    when duplicate_object then
      raise notice 'round_pronto era gia'' nella publication: nessuna modifica';
  end;
end;
$$;

-- -----------------------------------------------------------------------------
-- 4. Verifica — da eseguire a mano dopo aver applicato la migrazione
-- -----------------------------------------------------------------------------
--
-- ⚠️ **Non basta che la migrazione non dia errore.** In questo progetto una
-- migrazione applicata e mai riletta ha già lasciato credere per giorni uno
-- stato che non esisteva. Attese: 3 policy, e una riga nella publication.
--
--   select policyname from pg_policies
--    where tablename = 'round_pronto' order by policyname;
--   -- atteso: round_pronto_delete, round_pronto_insert, round_pronto_select
--
--   select count(*) from pg_publication_tables
--    where pubname = 'supabase_realtime' and tablename = 'round_pronto';
--   -- atteso: 1
