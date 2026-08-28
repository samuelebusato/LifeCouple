-- =============================================================================
-- 0020 — Le partite dei giochi: «telepatia» e «indovina il disegno»
--
-- Lo schema del 2026-08-12 aveva previsto i giochi, ma tarati su **D-12**: il
-- sigillo, cioè «ognuno manda in segreto, si rivela quando hanno mandato
-- entrambi». Gli stati erano `invito → deposito → tentativi → conclusa`, che
-- descrivono una partita a domande, non una partita a round con i ruoli che si
-- invertono.
--
-- Questa migrazione tiene tutto ciò che di D-12 serve ancora — `invio_sigillato`
-- e la sua policy, che è **esattamente** ciò che serve alla telepatia — e
-- aggiunge il resto.
--
-- 🔑 LA DECISIONE CHE REGGE TUTTO IL FILE: **il banco delle parole non è qui.**
-- Le 1000 voci stanno in `lib/parole.ts`, e nel database viaggiano **solo le
-- chiavi** (`dog`, `red`, …), che sono neutre rispetto alla lingua. È ciò che
-- permette a due partner con il telefono in lingue diverse di giocare la stessa
-- partita vedendo ognuno la propria. Il database non sa cosa significhi `dog`,
-- e non ha bisogno di saperlo.
--
-- Conseguenza: **è il client di turno a pescare la parola**, non una funzione
-- Postgres. Chi disegna pesca la propria parola; chi avvia il round di telepatia
-- pesca il tema e le quattro opzioni. Non è un rilassamento della regola «la
-- autorizzazione sta nel database»: quella regola esiste per D-12, dove c'è
-- qualcosa da nascondere **a un avversario**. Qui non c'è un avversario — il
-- punteggio è della coppia, non di uno dei due — e l'unica cosa che va davvero
-- protetta è che chi indovina non legga la parola. Quella sì, sta nel database.
--
-- ⚠️ **Ripetibile.** Il primo tentativo è fallito a metà, e una migrazione che
-- fallisce a metà va poi rieseguita su un database che ne ha già digerito un
-- pezzo. Tutto qui dentro regge una seconda esecuzione: i vincoli si tolgono
-- prima di rimetterli, le tabelle e gli indici hanno `if not exists`, e le
-- policy — che in Postgres **non** hanno un `if not exists` — si buttano prima
-- di ricrearle. È l'unico punto in cui il file era ripetibile solo per metà.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. La partita: nuovi giochi, nuovo ciclo di vita
-- -----------------------------------------------------------------------------

-- ⚠️ **Prima di toccare il vincolo, le righe che ci sono già.**
--
-- Il primo tentativo di applicare questa migrazione è fallito con
-- `check constraint "partita_stato_check" ... is violated by some row`: la
-- tabella `partita` **non era vuota**. Le righe sono residui di
-- `tests/rls.avversariali.mjs`, che per provare il sigillo di D-12 crea una
-- partita (e ne crea una a ogni esecuzione, senza mai ripulirla).
--
-- 🔑 La lezione, che vale oltre questo file: **una migrazione che stringe un
-- vincolo deve prima sistemare i dati che il vincolo nuovo non accetta.** Il
-- vincolo descrive il futuro; le righe vengono dal passato, e nessuno le
-- aggiorna da solo.
--
-- Perché `abbandonata` e non `attesa`: quelle partite erano nel vecchio ciclo
-- di vita (`invito → deposito → tentativi`), che non esiste più. Non hanno
-- round, non hanno righe di prontezza, e **non c'è modo di riprenderle** col
-- ciclo nuovo. Dire che sono in attesa sarebbe falso: sono state abbandonate
-- quando il modello sotto è cambiato.
--
-- ⚠️ **Nessuna riga viene cancellata.** Sono dati di prova e verrebbe la
-- tentazione di buttarli, ma una migrazione che cancella righe è una migrazione
-- che un giorno cancella le righe sbagliate su un database che qualcuno crede
-- di conoscere.
-- 🔑 **E l'ordine è la cosa che conta**, non l'`update` in sé.
--
-- Al secondo tentativo questa migrazione è fallita di nuovo, e per il motivo
-- opposto a quello che sembra: l'`update` stava **prima** di togliere il vincolo
-- vecchio, quindi era *il vincolo vecchio* a rifiutare il valore nuovo —
-- `new row for relation "partita" violates check constraint` su una riga che
-- conteneva `abbandonata`. Scrivere `abbandonata` era esattamente ciò che il
-- vincolo ancora in vigore vietava.
--
-- La sequenza giusta è **togli, sistema, rimetti**: senza il vincolo di mezzo
-- non c'è niente che possa rifiutare il passaggio. Un vincolo protegge lo stato
-- finale, non le mosse che servono per arrivarci.
alter table public.partita drop constraint if exists partita_stato_check;

update public.partita
   set stato = 'abbandonata'
 where stato not in ('attesa', 'in_corso', 'conclusa', 'abbandonata');

-- ⚠️ Gli stati vecchi (`invito`, `deposito`, `tentativi`) descrivevano il flusso
-- di D-12. Il nuovo è più corto perché la partita **comincia quando entrambi
-- premono avvia**: non c'è una fase di invito e una di accettazione, c'è
-- un'attesa che finisce da sola quando la seconda persona è pronta.
alter table public.partita alter column stato set default 'attesa';
alter table public.partita add constraint partita_stato_check
  check (stato in ('attesa', 'in_corso', 'conclusa', 'abbandonata'));

alter table public.partita drop constraint if exists partita_gioco_check;
alter table public.partita add constraint partita_gioco_check
  check (gioco in ('quiz_preferenze', 'obbligo_verita', 'telepatia', 'indovina_disegno'));

alter table public.partita add column if not exists round_totali integer not null default 5
  check (round_totali between 1 and 50);
alter table public.partita add column if not exists round_corrente integer not null default 0;
alter table public.partita add column if not exists punti integer not null default 0;
alter table public.partita add column if not exists conclusa_il timestamptz;

-- Una partita viva per coppia e per gioco: due partite aperte dello stesso gioco
-- vorrebbero dire due schermate che si contendono lo stesso canale realtime.
create unique index if not exists partita_una_viva
  on public.partita (coppia_id, gioco)
  where stato in ('attesa', 'in_corso');

-- -----------------------------------------------------------------------------
-- 2. «Entrambi premono avvia»
-- -----------------------------------------------------------------------------

-- Perché una tabella e non due colonne booleane sulla partita: con due colonne
-- servirebbe una policy che dica «puoi scrivere solo la TUA colonna», che in RLS
-- si esprime male. Con una riga per persona la regola è la solita e si legge da
-- sola: `utente_id = auth.uid()`.
create table if not exists public.partita_pronto (
  partita_id uuid not null references public.partita (id) on delete cascade,
  utente_id  uuid not null default auth.uid() references auth.users (id),
  pronto_il  timestamptz not null default now(),
  primary key (partita_id, utente_id)
);

-- -----------------------------------------------------------------------------
-- 3. I round
-- -----------------------------------------------------------------------------

create table if not exists public.partita_round (
  id             uuid primary key default gen_random_uuid(),
  partita_id     uuid not null references public.partita (id) on delete cascade,
  numero         integer not null check (numero >= 1),
  -- Chi disegna, in «indovina il disegno». NULL per la telepatia, dove i due
  -- ruoli non esistono: si sceglie insieme.
  disegnatore_id uuid references auth.users (id),
  -- Telepatia: il tema e le quattro opzioni, come chiavi. Visibile a entrambi —
  -- è il punto del gioco che vedano le stesse quattro.
  opzioni        jsonb,
  -- Disegno: la parola, **scritta solo a round finito**. Prima di allora vive in
  -- `round_segreto`, che chi indovina non può leggere.
  chiave_rivelata text,
  esito          text not null default 'in_corso'
                 check (esito in ('in_corso', 'vinto', 'perso', 'scaduto')),
  punti          integer not null default 0,
  iniziato_il    timestamptz not null default now(),
  finito_il      timestamptz,
  unique (partita_id, numero)
);

-- 🔑 **La riga che chi indovina non deve poter leggere.**
--
-- Sta in una tabella a parte e non in una colonna di `partita_round` per una
-- ragione tecnica precisa: la RLS di Postgres decide **quali righe** si leggono,
-- non quali colonne. Con la parola dentro `partita_round`, chi indovina o legge
-- tutta la riga o nessuna — e la riga gli serve, perché contiene il numero del
-- round e chi disegna. Una tabella a parte è l'unico modo di dire «questa cosa
-- sì e quella no» con lo strumento che c'è.
create table if not exists public.round_segreto (
  round_id uuid primary key references public.partita_round (id) on delete cascade,
  chiave   text not null,
  creato_il timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 4. RLS
-- -----------------------------------------------------------------------------

alter table public.partita_pronto enable row level security;
alter table public.partita_round  enable row level security;
alter table public.round_segreto  enable row level security;

-- Si vede la propria riga e quella del partner: sapere che l'altro è pronto è
-- **il segnale che fa partire la partita**, quindi dev'essere leggibile.
drop policy if exists pronto_select on public.partita_pronto;
create policy pronto_select on public.partita_pronto
  for select using (
    exists (select 1 from public.partita p
            where p.id = partita_id and public.e_membro_attivo(p.coppia_id))
  );
-- Ma si dichiara pronti **solo per sé**.
drop policy if exists pronto_insert on public.partita_pronto;
create policy pronto_insert on public.partita_pronto
  for insert with check (
    utente_id = auth.uid()
    and exists (select 1 from public.partita p
                where p.id = partita_id and public.e_membro_attivo(p.coppia_id))
  );
drop policy if exists pronto_delete on public.partita_pronto;
create policy pronto_delete on public.partita_pronto
  for delete using (utente_id = auth.uid());

drop policy if exists round_select on public.partita_round;
create policy round_select on public.partita_round
  for select using (
    exists (select 1 from public.partita p
            where p.id = partita_id and public.e_membro_attivo(p.coppia_id))
  );
drop policy if exists round_insert on public.partita_round;
create policy round_insert on public.partita_round
  for insert with check (
    exists (select 1 from public.partita p
            where p.id = partita_id and public.e_membro_attivo(p.coppia_id))
  );
drop policy if exists round_update on public.partita_round;
create policy round_update on public.partita_round
  for update using (
    exists (select 1 from public.partita p
            where p.id = partita_id and public.e_membro_attivo(p.coppia_id))
  );

-- ⚠️ **La policy per cui esiste questa tabella**: la parola la legge solo chi
-- disegna. Chi indovina non la vede nemmeno interrogando l'API con il proprio
-- token — che è la lezione di D-12: non basta non mostrarla nell'interfaccia.
drop policy if exists segreto_select on public.round_segreto;
create policy segreto_select on public.round_segreto
  for select using (
    exists (select 1 from public.partita_round r
            where r.id = round_id and r.disegnatore_id = auth.uid())
  );
drop policy if exists segreto_insert on public.round_segreto;
create policy segreto_insert on public.round_segreto
  for insert with check (
    exists (select 1 from public.partita_round r
            where r.id = round_id and r.disegnatore_id = auth.uid())
  );

-- -----------------------------------------------------------------------------
-- 5. Avvio: la partita comincia quando la seconda persona è pronta
-- -----------------------------------------------------------------------------

-- `security definer` perché deve **leggere le righe di pronto di entrambi** e
-- aggiornare la partita: due cose che con i soli permessi di chi chiama
-- funzionerebbero a metà.
create or replace function public.segna_pronto(p_partita uuid)
returns public.partita
language plpgsql security definer
set search_path = public
as $$
declare
  p public.partita;
  quanti integer;
begin
  select * into p from public.partita where id = p_partita;
  if p.id is null then
    raise exception 'partita inesistente';
  end if;
  if not public.e_membro_attivo(p.coppia_id) then
    raise exception 'non sei di questa coppia';
  end if;
  if p.stato <> 'attesa' then
    -- Non è un errore: chi arriva secondo su una partita già avviata deve
    -- semplicemente trovarla avviata.
    return p;
  end if;

  insert into public.partita_pronto (partita_id, utente_id)
  values (p_partita, auth.uid())
  on conflict do nothing;

  select count(*) into quanti from public.partita_pronto where partita_id = p_partita;

  -- ⚠️ Due e non «tutti»: una coppia è due persone per costruzione (D-14), e
  -- scrivere `= 2` invece di contare i membri rende esplicito che questo
  -- meccanismo **non** regge a un gruppo. Se un giorno servisse, questo è il
  -- punto in cui il codice lo dirà invece di sbagliare in silenzio.
  if quanti >= 2 then
    update public.partita
       set stato = 'in_corso', round_corrente = 0
     where id = p_partita
    returning * into p;
  end if;

  return p;
end;
$$;

-- B-01, la lezione che non si ripete: i permessi si chiudono e si riaprono a
-- mano. `security definer` più `execute to public` è una porta aperta.
revoke all on function public.segna_pronto(uuid) from public;
grant execute on function public.segna_pronto(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- 6. Chiusura di un round e della partita
-- -----------------------------------------------------------------------------

create or replace function public.chiudi_round(
  p_round uuid,
  p_esito text,
  p_punti integer,
  p_chiave text default null
)
returns public.partita
language plpgsql security definer
set search_path = public
as $$
declare
  r public.partita_round;
  p public.partita;
begin
  select * into r from public.partita_round where id = p_round;
  if r.id is null then
    raise exception 'round inesistente';
  end if;
  select * into p from public.partita where id = r.partita_id;
  if not public.e_membro_attivo(p.coppia_id) then
    raise exception 'non sei di questa coppia';
  end if;
  if r.esito <> 'in_corso' then
    -- Già chiuso: succede quando entrambi i telefoni chiudono lo stesso round
    -- (chi indovina manda il tentativo giusto, chi disegna vede che è giusto).
    -- Chiudere due volte raddoppierebbe il punteggio.
    return p;
  end if;

  update public.partita_round
     set esito = p_esito,
         punti = greatest(p_punti, 0),
         chiave_rivelata = coalesce(p_chiave, chiave_rivelata),
         finito_il = now()
   where id = p_round;

  update public.partita
     set punti = punti + greatest(p_punti, 0),
         round_corrente = r.numero,
         stato = case when r.numero >= round_totali then 'conclusa' else stato end,
         conclusa_il = case when r.numero >= round_totali then now() else conclusa_il end
   where id = r.partita_id
  returning * into p;

  return p;
end;
$$;

revoke all on function public.chiudi_round(uuid, text, integer, text) from public;
grant execute on function public.chiudi_round(uuid, text, integer, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 7. La telepatia: si rivela solo quando hanno scelto entrambi (D-12)
-- -----------------------------------------------------------------------------

-- È la funzione che il commento di `sigillato_select` prometteva il 2026-08-12:
-- «il confronto avviene in rivela_partita(), che arriverà coi giochi».
--
-- ⚠️ Restituisce **niente** finché manca una delle due scelte. Non «la tua sì e
-- la sua no»: niente. Se rispondesse a metà, un client potrebbe interrogarla in
-- un ciclo e sapere *quando* l'altro ha scelto — che è già un'informazione di
-- troppo in un gioco in cui si deve scegliere senza sapersi.
create or replace function public.rivela_telepatia(p_partita uuid, p_round integer)
returns table (utente_id uuid, scelta text)
language plpgsql security definer
set search_path = public
as $$
declare
  p public.partita;
  quante integer;
begin
  select * into p from public.partita where id = p_partita;
  if p.id is null or not public.e_membro_attivo(p.coppia_id) then
    raise exception 'partita non tua';
  end if;

  select count(*) into quante
    from public.invio_sigillato s
   where s.partita_id = p_partita and s.round = p_round and s.natura = 'scelta';

  if quante < 2 then
    return;
  end if;

  return query
    select s.autore_id, s.contenuto ->> 'chiave'
      from public.invio_sigillato s
     where s.partita_id = p_partita and s.round = p_round and s.natura = 'scelta';
end;
$$;

revoke all on function public.rivela_telepatia(uuid, integer) from public;
grant execute on function public.rivela_telepatia(uuid, integer) to authenticated;

-- -----------------------------------------------------------------------------
-- 8. Realtime
-- -----------------------------------------------------------------------------

-- Le partite si guardano **mentre** succedono: senza questo, ogni telefono
-- saprebbe dell'altro solo ricaricando. I tratti del disegno non passano di qui
-- — viaggiano nel canale broadcast e non si salvano da nessuna parte (vedi la
-- decisione sui disegni effimeri) — ma il cambio di stato, il round e il
-- punteggio sì.
-- ⚠️ Due difese, e nessuna delle due è paranoia:
--
-- 1. **Se la publication non esiste**, `alter publication` solleva
--    `undefined_object`, che il gestore di `duplicate_object` non prende: la
--    migrazione morirebbe qui, all'ultimo passo, per una cosa che non è un
--    errore nostro. Si controlla prima e si dice a voce cosa manca.
-- 2. **Se la tabella c'è già** nella publication, `duplicate_object`: quello sì
--    è normale alla seconda esecuzione, e si ignora.
--
-- 🔑 Ciò che NON si fa è un `exception when others then null`, che avrebbe
-- coperto entrambi i casi in una riga. Coprirebbe anche il terzo caso, quello
-- vero, e il realtime resterebbe spento **senza che nessuno lo sappia** — che è
-- il modo peggiore in cui una funzione può fallire: in silenzio.
do $$
declare
  t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    raise notice 'publication supabase_realtime assente: il realtime NON e'' stato attivato';
    return;
  end if;

  foreach t in array array['partita', 'partita_pronto', 'partita_round'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then
      null;  -- gia' pubblicata: e' il caso della seconda esecuzione
    end;
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 9. Indici
-- -----------------------------------------------------------------------------

create index if not exists partita_coppia_stato on public.partita (coppia_id, stato);
create index if not exists round_partita_numero on public.partita_round (partita_id, numero);
