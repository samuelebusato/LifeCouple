-- =============================================================================
-- 0028 — La versione personalizzata: il contenuto lo scrive la coppia (D-19)
-- =============================================================================
--
-- Chiesta dall'utente il 2026-09-02, gioco per gioco:
--
--   • **indovina il disegno** — chi disegna *dichiara la parola* all'inizio del
--     proprio turno, poi si procede col gioco normale;
--   • **quiz sulle preferenze** — all'inizio ognuno scrive **5 domande**, e
--     quelle dieci sono il set della partita. Niente quattro opzioni: chi ha il
--     turno scrive la propria risposta, l'altro scrive quella che crede giusta,
--     e le due si confrontano;
--   • **obbligo o verità** — all'inizio ognuno scrive **5 obblighi e 5 verità**,
--     e quelle venti carte sono il set della partita;
--   • **telepatia** — *per il momento niente versione personalizzata*.
--
-- ## Perché serve una colonna sulla partita, e non basta ricordarlo nell'app
--
-- 🔑 **Il modo è una proprietà della partita, non di chi la guarda.** I due
-- telefoni non si accordano: chi arriva secondo **si aggancia** alla partita
-- viva invece di crearne un'altra (`partita_una_viva`, 0020), quindi deve poter
-- leggere in che modo si sta giocando da un dato che c'è già. Tenerlo nello
-- stato dell'app vorrebbe dire che chi ha premuto «personalizzata» gioca a un
-- gioco e chi ha premuto «ufficiale» a un altro, sulla stessa partita.
--
-- Conseguenza voluta: **il modo lo decide chi apre la partita**, e l'altro lo
-- trova scelto. Una negoziazione fra i due sarebbe un meccanismo intero — con
-- una sua attesa, un suo annullamento e un suo stato — per una decisione che
-- non ha bisogno di essere contesa: la partita si abbandona e si riapre.

-- -----------------------------------------------------------------------------
-- 1. Il modo della partita
-- -----------------------------------------------------------------------------

-- `default 'ufficiale'` e non `not null` senza default: le partite già in corso
-- e tutte quelle concluse sono ufficiali per costruzione — nel momento in cui
-- sono nate la versione personalizzata non esisteva.
alter table public.partita
  add column if not exists modo text not null default 'ufficiale';

alter table public.partita drop constraint if exists partita_modo_check;
alter table public.partita add constraint partita_modo_check
  check (modo in ('ufficiale', 'personalizzata'));

-- -----------------------------------------------------------------------------
-- 2. `domanda` diventa il set di una partita
-- -----------------------------------------------------------------------------
--
-- La tabella esiste **vuota dalla 0001**, nata per questo: `coppia_id` NULL è il
-- banco comune scritto da noi, valorizzato è il contenuto della coppia (D-19).
-- Il banco comune non ci è mai finito dentro — vive in `lib/parole.ts`, perché
-- è bilingue e immutabile — quindi qui entrano **solo** le righe della coppia.
--
-- ⚠️ **`partita_id` è la decisione rimandata, resa visibile nello schema.**
-- L'utente ha chiesto di salvare le carte sul server ma di usarle *come se*
-- valessero solo per quella partita, lasciando aperta per il futuro la scelta
-- se debbano accumularsi in un banco della coppia. Con la colonna qui:
--   • **oggi** una partita legge le righe col proprio `partita_id` e nient'altro;
--   • **domani**, se si decide per il banco che cresce, la si ignora nella
--     lettura — e le righe scritte finora sono già lì, non si perde niente.
-- Il contrario (decidere oggi per il banco e volerlo per-partita domani) non si
-- recupera: le righe non saprebbero da quale partita vengono.
alter table public.domanda
  add column if not exists partita_id uuid references public.partita (id) on delete cascade;

-- Chi l'ha scritta. Serve a due cose: contare *quante ne ha scritte l'altro*
-- durante la preparazione, e impedire di cancellare le carte del partner.
alter table public.domanda
  add column if not exists autore_id uuid default auth.uid() references auth.users (id);

-- Obbligo o verità: quale delle due. NULL per il quiz, dove la distinzione non
-- esiste — una colonna che vale per un gioco solo si lascia NULL per gli altri
-- invece di inventare un terzo valore che vorrebbe dire «non si applica».
alter table public.domanda drop constraint if exists domanda_tipo_check;
alter table public.domanda
  add column if not exists tipo text;
alter table public.domanda add constraint domanda_tipo_check
  check (tipo is null or tipo in ('obbligo', 'verita'));

-- Il vincolo sul gioco non conosceva `indovina_disegno` (arrivato dopo, 0020).
-- Qui non serve — il disegno non scrive righe, la parola sta in `round_segreto`
-- — ma un vincolo che elenca tre giochi su quattro è una trappola per il primo
-- che proverà a scriverci.
alter table public.domanda drop constraint if exists domanda_gioco_check;
alter table public.domanda add constraint domanda_gioco_check
  check (gioco in ('quiz_preferenze', 'obbligo_verita', 'telepatia', 'indovina_disegno'));

create index if not exists domanda_partita on public.domanda (partita_id);

-- -----------------------------------------------------------------------------
-- 3. Le policy: si scrive solo per sé, si legge in due
-- -----------------------------------------------------------------------------

-- La lettura resta quella della 0001 (banco comune + il proprio), e si rifà qui
-- soltanto per averla sotto gli occhi accanto alle altre due che cambiano.
drop policy if exists domanda_select on public.domanda;
create policy domanda_select on public.domanda
  for select using (coppia_id is null or public.e_membro_attivo(coppia_id));

-- 🔴 **`autore_id = auth.uid()` è la riga nuova.** Senza, un telefono potrebbe
-- scrivere carte **a nome dell'altro**: la preparazione finirebbe da sola e il
-- partner si troverebbe in partita con dieci carte che non ha scritto. È la
-- stessa forma di `round_pronto_insert` (0027) — *si dichiara solo per sé*.
drop policy if exists domanda_insert on public.domanda;
create policy domanda_insert on public.domanda
  for insert with check (
    coppia_id is not null
    and public.e_membro_attivo(coppia_id)
    and autore_id = auth.uid()
  );

-- E si cancella solo ciò che si è scritto. Serve durante la preparazione (un
-- refuso si toglie e si riscrive) e non deve diventare il modo di svuotare il
-- set dell'altro a partita cominciata.
drop policy if exists domanda_delete on public.domanda;
create policy domanda_delete on public.domanda
  for delete using (
    coppia_id is not null
    and public.e_membro_attivo(coppia_id)
    and autore_id = auth.uid()
  );

-- ⚠️ **Nessuna policy di update, e non è una dimenticanza.** Una carta scritta
-- si cancella e si riscrive: correggerla *dopo* che è stata giocata cambierebbe
-- il passato di una partita, e il round che l'ha usata non se ne accorgerebbe.

-- -----------------------------------------------------------------------------
-- 4. `rivela_telepatia` impara le risposte scritte a mano
-- -----------------------------------------------------------------------------
--
-- Nel quiz personalizzato la risposta non è una **chiave** del banco: è un testo
-- che una persona ha scritto. Le due cose stanno in `contenuto` sotto due nomi
-- diversi, e la funzione ne prende quella che c'è.
--
-- 🔑 **Perché non riusare `chiave` anche per il testo libero**, che avrebbe
-- risparmiato questa modifica: `chiave` in tutto il progetto vuol dire *la
-- chiave neutra rispetto alla lingua* — è ciò che permette a due partner con il
-- telefono in lingue diverse di giocare la stessa partita. Una frase scritta a
-- mano non è neutra rispetto a niente, e infilarla lì renderebbe la colonna
-- ambigua nel punto esatto in cui l'app decide cosa mostrare a chi.
--
-- ⚠️ Il nome della funzione resta `rivela_telepatia` anche se ormai la usano tre
-- giochi. Rinominarla vorrebbe dire una `drop function` e un `grant` nuovo per
-- un miglioramento di sola lettura, mentre le app installate chiamano questo
-- nome: si rinomina quando ci sarà un motivo che non sia l'eleganza.
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

  -- Resta la riga che conta: **niente** finché non hanno inviato tutti e due.
  if quante < 2 then
    return;
  end if;

  return query
    select s.autore_id, coalesce(s.contenuto ->> 'chiave', s.contenuto ->> 'testo')
      from public.invio_sigillato s
     where s.partita_id = p_partita and s.round = p_round and s.natura = 'scelta';
end;
$$;

revoke all on function public.rivela_telepatia(uuid, integer) from public;
grant execute on function public.rivela_telepatia(uuid, integer) to authenticated;

-- -----------------------------------------------------------------------------
-- 5. Il realtime sulla preparazione
-- -----------------------------------------------------------------------------
--
-- Durante la preparazione ogni telefono deve vedere **quante carte ha scritto
-- l'altro**, o l'unica informazione che conta in quel momento — *stiamo
-- aspettando me o lui?* — resta senza risposta, che è il difetto che
-- `attesa-partita.tsx` esiste per togliere.
--
-- Stessa cautela di 0020 e 0027: se la publication non esiste si **dice**,
-- invece di far morire la migrazione all'ultimo passo o di lasciare il realtime
-- spento in silenzio.
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    raise notice 'publication supabase_realtime assente: il realtime NON e'' stato attivato';
    return;
  end if;

  begin
    execute 'alter publication supabase_realtime add table public.domanda';
  exception
    when duplicate_object then
      raise notice 'domanda era gia'' nella publication: nessuna modifica';
  end;
end;
$$;

-- -----------------------------------------------------------------------------
-- 6. Verifica — da eseguire a mano dopo aver applicato la migrazione
-- -----------------------------------------------------------------------------
--
-- ⚠️ **Non basta che la migrazione non dia errore.** In questo progetto una
-- migrazione applicata e mai riletta ha già lasciato credere per giorni uno
-- stato che non esisteva (2026-08-31), e la publication della 0027 è rimasta
-- non verificata per un giorno intero.
--
--   -- (a) la colonna del modo, col suo vincolo
--   select column_name, column_default, is_nullable
--     from information_schema.columns
--    where table_name = 'partita' and column_name = 'modo';
--   -- atteso: una riga, default 'ufficiale'::text, NO
--
--   -- (b) le tre colonne nuove di `domanda`
--   select column_name from information_schema.columns
--    where table_name = 'domanda' and column_name in ('partita_id','autore_id','tipo')
--    order by column_name;
--   -- atteso: autore_id, partita_id, tipo
--
--   -- (c) le tre policy
--   select policyname from pg_policies
--    where tablename = 'domanda' order by policyname;
--   -- atteso: domanda_delete, domanda_insert, domanda_select
--
--   -- (d) la publication
--   select count(*) from pg_publication_tables
--    where pubname = 'supabase_realtime' and tablename = 'domanda';
--   -- atteso: 1
--
-- ✅ La (d) la verifica anche `npm run test:partita` da sola, e meglio: fa
-- arrivare l'evento a un secondo client invece di leggere il catalogo.
