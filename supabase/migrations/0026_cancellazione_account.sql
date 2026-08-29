-- =============================================================================
-- 0026 — Cancellare il proprio account
--
-- Apple lo impone: un'app che permette di CREARE un account deve permettere di
-- cancellarlo **dall'app**. Google chiede la stessa cosa nel modulo Data
-- safety. Senza questa migrazione la funzione non è scrivibile, e senza la
-- funzione l'app non è pubblicabile.
--
-- 🔴 IL VINCOLO CHE DECIDE TUTTO IL FILE, verificato il 2026-08-29.
--
-- `auth.admin.deleteUser()` **fallisce con violazione di chiave esterna** non
-- appena l'utente ha scritto qualcosa. Delle 17 chiavi esterne verso
-- `auth.users` presenti nello schema, **solo due** — `membro_coppia.utente_id`
-- (0001) e `cartella.autore_id` (0011) — hanno `on delete cascade`. Le altre
-- quindici no: eventi, luoghi, liste, recensioni, foto, partite, inviti,
-- sigilli, registro azioni. Con una sola riga scritta, la cancellazione muore.
--
-- 🔑 LA SCELTA: la regola sta nello SCHEMA, non in una funzione che cancella
-- tabella per tabella.
--
-- Una funzione con dentro l'elenco delle tabelle sarebbe più esplicita da
-- leggere, e sbagliata per la ragione che questo progetto ha già incontrato tre
-- volte in due giorni (D-60, B-24, B-28): **è una regola affidata alla memoria
-- di chi scriverà la prossima tabella**. La tabella `lista` è nata il
-- 2026-08-28 e ha un `autore_id`; la sedicesima nascerà fra un mese, e nessuno
-- tornerà ad aggiornare l'elenco. Un `on delete cascade` sulla colonna non si
-- dimentica: è attaccato al dato.
--
-- Le due regole applicate, e non ce ne sono altre:
--   colonna NOT NULL  -> on delete cascade   (la riga è di quell'utente e muore con lui)
--   colonna NULLABLE  -> on delete set null  (la riga sopravvive, perde il riferimento)
--
-- ⚠️ Perché il set null è giusto e non pigrizia: le tre colonne nullable sono
-- `invito.aperto_da`, `partita.turno_di` e `partita_round.disegnatore_id`.
-- Nessuna delle tre *appartiene* a chi vi è indicato — dicono chi ha fatto una
-- cosa, non di chi è la riga. Cancellare un round perché chi disegnava se n'è
-- andato distruggerebbe la partita dell'altro.
--
-- ⚠️ **Nessuna riga viene cancellata da questa migrazione**: cambia solo cosa
-- succederà in futuro. Applicarla su un database pieno non tocca un dato.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Le chiavi esterne verso auth.users, riscritte per regola
--
-- Dinamico e non a mano, di proposito (vedi sopra). Rieseguibile: rifà lo
-- stesso lavoro trovando i vincoli già a posto e riscrivendoli identici.
-- Ogni modifica viene annunciata: chi applica la migrazione deve poter LEGGERE
-- cosa è stato cambiato, invece di fidarsi che sia successo.
-- -----------------------------------------------------------------------------
do $$
declare
  r          record;
  v_azione   text;
  v_nullable boolean;
  v_fatti    integer := 0;
begin
  for r in
    select
      c.conname                          as vincolo,
      n.nspname                          as schema_tab,
      t.relname                          as tabella,
      a.attname                          as colonna,
      a.attnotnull                       as non_nulla,
      c.confdeltype                      as su_cancellazione
    from pg_constraint c
    join pg_class      t on t.oid = c.conrelid
    join pg_namespace  n on n.oid = t.relnamespace
    join pg_class      rt on rt.oid = c.confrelid
    join pg_namespace  rn on rn.oid = rt.relnamespace
    join pg_attribute  a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
    where c.contype = 'f'
      and n.nspname = 'public'
      and rn.nspname = 'auth'
      and rt.relname = 'users'
      and array_length(c.conkey, 1) = 1   -- solo chiavi a colonna singola
  loop
    v_nullable := not r.non_nulla;
    v_azione := case when v_nullable then 'set null' else 'cascade' end;

    -- Già a posto? ('c' = cascade, 'n' = set null). Si salta e lo si dice.
    if (r.su_cancellazione = 'c' and not v_nullable)
       or (r.su_cancellazione = 'n' and v_nullable) then
      raise notice 'ok   %.% (%) — già "% on delete"', r.tabella, r.colonna, r.vincolo, v_azione;
      continue;
    end if;

    execute format('alter table %I.%I drop constraint %I', r.schema_tab, r.tabella, r.vincolo);
    execute format(
      'alter table %I.%I add constraint %I foreign key (%I) references auth.users (id) on delete %s',
      r.schema_tab, r.tabella, r.vincolo, r.colonna, v_azione
    );
    v_fatti := v_fatti + 1;
    raise notice 'CAMBIATO %.% (%) -> on delete %', r.tabella, r.colonna, r.vincolo, v_azione;
  end loop;

  raise notice '--- vincoli riscritti: % ---', v_fatti;
end $$;

-- -----------------------------------------------------------------------------
-- 2. La preparazione alla cancellazione, che gira COME L'UTENTE
--
-- Perché una funzione separata invece di fare tutto nella Edge Function: la
-- Edge Function ha la chiave `service_role`, cioè può fare qualunque cosa a
-- chiunque. Meno cose le si fanno fare, meglio è (least privilege,
-- `regole-sviluppo-sicuro.md`). Qui dentro sta tutto ciò che l'utente può fare
-- **da sé**, con i suoi permessi; alla Edge Function resta un solo potere che
-- l'utente non ha: togliere la riga da `auth.users`.
--
-- 🔑 E lo scioglimento non è riscritto: si CHIAMA `sciogli_coppia()`. Quella
-- funzione porta con sé D-04, D-21 e D-16 — i contenuti condivisi duplicati uno
-- a testa, le foto e le recensioni che restano al loro autore, la creatura che
-- sparisce per entrambi. Riscrivere quella logica qui vorrebbe dire due
-- versioni della stessa regola che divergono al primo ritocco.
--
-- ⚠️ **L'ordine è obbligato, e non è simmetrico**: prima si scioglie, poi si
-- cancella. Sciogliendo, il partner riceve la **sua copia** dei contenuti
-- condivisi; solo dopo la cancellazione porta via le nostre. Invertendo,
-- l'utente che se ne va si porterebbe dietro anche i ricordi dell'altro.
-- -----------------------------------------------------------------------------
create or replace function public.prepara_cancellazione_account()
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_coppia uuid;
begin
  if auth.uid() is null then
    raise exception 'non autenticato';
  end if;

  select coppia_id into v_coppia
  from membro_coppia
  where utente_id = auth.uid() and uscito_il is null
  limit 1;

  -- Se non è in nessuna coppia non c'è niente da sciogliere, e non è un errore:
  -- si può cancellare l'account anche essendo entrati e non avendo mai invitato
  -- nessuno (D-25 lo permette esplicitamente).
  if v_coppia is not null then
    perform public.sciogli_coppia();
  end if;
end;
$$;

revoke all on function public.prepara_cancellazione_account() from public, anon;
grant execute on function public.prepara_cancellazione_account() to authenticated;
