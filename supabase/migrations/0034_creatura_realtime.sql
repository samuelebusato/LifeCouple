-- =============================================================================
-- LifeCouple — 0034: la creatura in tempo reale
--
-- Aggiunge `creatura` alla pubblicazione realtime. Nessuna tabella nuova,
-- nessuna colonna, nessuna policy: solo la riga della creatura che arriva sul
-- telefono quando cambia invece che alla prossima apertura.
--
-- ## Perche' serve, e non e' per la creatura in se'
--
-- Il punteggio cambia per **due** ragioni: qualcosa che fai tu, e qualcosa che
-- fa il partner. La prima si potrebbe scoprire ricaricando dopo l'azione; la
-- seconda no — succede su un altro telefono.
--
-- 🔑 Ed e' la seconda che porta la proprieta' che rende la creatura quello che
-- e' (D-102): **se e' il partner a segnare un luogo, la festa la vedi tu**. E'
-- l'unico punto del prodotto in cui l'azione dell'altro arriva come un fatto
-- emotivo invece che come una riga in un elenco. Senza realtime quella cosa
-- funziona lo stesso, ma con il ritardo di un'apertura — e una reazione che
-- arriva tre ore dopo non e' una reazione.
--
-- ⚠️ **E serve al ritorno a casa dell'evoluzione** (D-115): per riportare a
-- casa qualcuno che sta guardando la mappa bisogna accorgersi del cambio di
-- stadio **mentre e' sulla mappa**. Senza un canale aperto lo si scoprirebbe
-- solo tornando in casa da soli, cioe' esattamente quando il ritorno non serve
-- piu'.
--
-- ## Cosa NON cambia
--
-- La RLS. Il realtime di Supabase applica le stesse policy della lettura
-- normale: `creatura_select` (0001) consente la riga solo ai membri attivi
-- della coppia, e il canale non la consegna a nessun altro. Non si sta aprendo
-- un accesso, si sta cambiando il **momento** in cui arriva un dato che quella
-- persona poteva gia' leggere.
--
-- ⚠️ **`punti_evento` resta fuori dalla pubblicazione, ed e' deliberato.** La
-- festa si accorge di un evento nuovo confrontando il punteggio, non leggendo
-- l'elenco: bastano i punti. Aggiungere una seconda tabella al canale
-- significherebbe consegnare al telefono ogni singola riga di punteggio per
-- una cosa che il totale dice gia'.
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
         and tablename = 'creatura'
    ) then
      execute 'alter publication supabase_realtime add table public.creatura';
    end if;
  end if;
end $$;

-- ⚠️ `replica identity` resta quella di default (la chiave primaria). Alla
-- creatura serve sapere **che il punteggio e' cambiato**, non quale fosse
-- prima: il nuovo valore arriva comunque nel payload, e `full` farebbe
-- viaggiare la riga vecchia a ogni punto assegnato per niente.
