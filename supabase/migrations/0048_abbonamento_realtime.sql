-- =============================================================================
-- LifeCouple — 0048: i muri cadono quando il webhook scrive (B-77)
--
-- 🔴 NON ANCORA APPLICATA. Si applica dal pannello Supabase (SQL Editor).
--
-- ## Il difetto, visto succedere il 2026-09-15
--
-- Dopo un acquisto riuscito `app/paywall.tsx` chiama
-- `ricarica({ insistendo: true })`, che interroga il database **6 volte in ~9
-- secondi** e poi **si arrende in silenzio**: torna indietro coi muri su,
-- esattamente come se il pagamento non fosse mai avvenuto.
--
-- 🔑 **Nove secondi bastano quasi sempre, ed e' il problema.** La mattina del
--    2026-09-15 il webhook ha impiegato **un secondo**; il pomeriggio, sullo
--    stesso impianto, molto di piu'. *Una finestra che regge nel caso normale
--    e cede in quello lento produce un difetto che non si riproduce a comando
--    e colpisce chi ha la rete peggiore.*
--
-- ⚠️ **E il modo di fallire e' il peggiore di tutti**: chi ha pagato vede lo
--    schermo identico a chi non ha pagato. Nessun errore, nessuna attesa
--    dichiarata, nessun invito a riprovare. *Per un cliente vero significa
--    credere di aver buttato dei soldi.*
--
-- ## Cosa fa questa migrazione
--
-- Mette `abbonamento` nella pubblicazione realtime, come la `0034` fece per
-- `creatura`. Da li' il client non deve piu' **indovinare quando** chiedere:
-- viene svegliato nell'istante in cui il webhook scrive.
--
-- 🔑 **Non sostituisce il controllo, lo anticipa.** `useInsieme` continua a
--    leggere `ho_insieme()` — il realtime dice *«qualcosa e' cambiato»*, mai
--    *«hai diritto»*. ⚠️ *Un payload di realtime che concedesse un diritto
--    sarebbe lo stesso errore dell'SDK di RevenueCat: una fonte che il
--    telefono puo' vedere non e' una fonte che decide.*
--
-- ## ⚠️ Cosa questo NON copre, e va detto
--
-- Il client vede in realtime **solo la propria riga**: la `0041` non gli lascia
-- leggere quella del partner, e il realtime rispetta la RLS. Quindi *«il mio
-- partner ha appena comprato»* non arriva istantaneo — arriva al montaggio
-- successivo, dalla lettura normale.
--
-- ✅ **Ed e' il compromesso giusto**: il caso che lascia una persona davanti a
--    un muro dopo aver pagato **di tasca propria** e' quello coperto qui. Chi
--    aspetta il partner non ha appena premuto un pulsante e non sta guardando.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    raise notice 'publication supabase_realtime assente: il realtime NON e'' stato attivato';
  else
    if not exists (
      select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'abbonamento'
    ) then
      execute 'alter publication supabase_realtime add table public.abbonamento';
    end if;
  end if;
end $$;

-- ⚠️ `replica identity` resta quella di default, come per `creatura` (0034):
--    serve sapere **che la riga e' cambiata**, non com'era prima. `full`
--    farebbe viaggiare la riga vecchia a ogni rinnovo per niente — e in
--    sandbox i rinnovi arrivano ogni cinque minuti.

-- =============================================================================
-- ## Come si verifica
--
--   1. Con l'app aperta sul paywall, concedere il diritto da fuori:
--        node tools/concedi-insieme.mjs <id-utente>
--   2. 🔑 I muri devono cadere **senza toccare niente e senza ricaricare**, nel
--      secondo in cui il comando risponde. Se cadono solo riaprendo l'app, la
--      pubblicazione non e' passata: e' il sintomo esatto di questa migrazione
--      non applicata, e non assomiglia a nient'altro.
--   3. `node tools/revoca-insieme.mjs <id-utente>` deve rialzarli, sempre dal
--      vivo: la stessa strada in senso opposto.
-- =============================================================================
