-- =============================================================================
-- LifeCouple — 0044: la passata della 0026, rifatta sulle tabelle nate dopo
--
-- ✅ APPLICATA il 2026-09-14 (4) con `supabase db query`, ed e' una CORREZIONE DI
--    DIFETTO, non una pulizia. Verificata: zero chiavi verso auth.users senza
--    azione di cancellazione.
--
-- ## Come e' saltato fuori
--
-- Il 2026-09-14 (3) la prova end-to-end della catena di cancellazione e' stata
-- eseguita per la prima volta (`tests/cancellazione.mjs`, protocollo in
-- docs/legal/catena-cancellazione.md). La Edge Function ha risposto:
--
--     HTTP 500  {"errore":"Database error deleting user","fase":"cancellazione"}
--
-- 🔑 **Cioe' cancellare un account NON funzionava**, e nessuno poteva saperlo:
--    la schermata dice «fatto» — e' la lezione di B-23 applicata al posto piu'
--    pericoloso in cui potesse servire.
--
-- ## Perche'
--
-- La 0026 aveva riscritto **tutte** le chiavi esterne verso `auth.users` per
-- regola: `on delete cascade` dove la colonna e' NOT NULL, `set null` dove e'
-- nullable. Una passata generica, non un elenco a mano — ed era la scelta
-- giusta.
--
-- ⚠️ **Ma una passata vale per le tabelle che esistono quando gira.** Dopo la
--    0026 ne sono nate altre due con una chiave verso `auth.users` dichiarata
--    senza azione:
--
--      0027 — round_pronto.utente_id   (not null -> vuole cascade)
--      0028 — domanda.autore_id        (nullable -> vuole set null)
--
--    e da quel momento `auth.admin.deleteUser` falliva, perche' Postgres non
--    puo' togliere una riga a cui qualcosa punta ancora.
--
-- 🔑 **La forma del difetto e' quella che questo progetto insegue da giorni**:
--    una garanzia vera quando e' stata scritta, resa falsa da un lavoro fatto
--    altrove — e invisibile, perche' l'unico modo di accorgersene era cancellare
--    un account davvero.
--
-- ## Cosa fa questa migrazione
--
-- Riesegue **lo stesso blocco della 0026, alla lettera**. E' rieseguibile per
-- costruzione: trova i vincoli gia' a posto, lo dice e li salta.
--
-- ⚠️ *Non e' stato scritto un `alter table` per le due tabelle note*, e la
--    ragione e' la stessa per cui la 0026 non lo aveva fatto: un elenco a mano
--    e' giusto il giorno in cui lo scrivi. La passata copre anche le tabelle di
--    domani — e il test `npm run test:copertura` avverte comunque il giorno in
--    cui qualcuno ne dichiara una senza azione.
-- =============================================================================

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

-- =============================================================================
-- ## Come si verifica che sia passata
--
-- 1. `node tests/cancellazione.mjs` deve arrivare in fondo verde: prima di
--    questa migrazione fallisce su «la Edge Function risponde» e su «l'utente
--    non riesce piu' ad autenticarsi».
-- 2. Oppure, dal dashboard:
--
--      select t.relname, a.attname, c.confdeltype
--      from pg_constraint c
--      join pg_class t on t.oid = c.conrelid
--      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
--      join pg_class rt on rt.oid = c.confrelid
--      where c.contype = 'f' and rt.relname = 'users'
--      order by 1;
--
--    Nessuna riga deve avere `confdeltype = 'a'` (nessuna azione).
-- =============================================================================
