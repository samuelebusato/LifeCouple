-- =============================================================================
-- 0021 — Una partita si può abbandonare
--
-- 🔴 IL DIFETTO CHE QUESTA MIGRAZIONE CHIUDE, e come è stato trovato.
--
-- `partita` aveva, dal 2026-08-12, una policy di `select` e una di `insert`.
-- **Nessuna di `update`.** Con la RLS attiva questo significa che *nessuno*
-- può modificare una partita passando dal client — e la conseguenza è che
-- `abbandona()` nell'app, e la pulizia in coda a `tests/partita.mjs`, non
-- facevano **niente**.
--
-- 🔑 E non lo dicevano. **Un UPDATE negato dalla RLS non è un errore**: la
-- query torna «riuscita» con zero righe toccate. Chi la scrive vede
-- `error: null` e va avanti convinto. È il modo peggiore in cui un permesso
-- può mancare — non fallisce, tace.
--
-- Perché i 41 test passavano lo stesso: tutte le scritture che contano —
-- `segna_pronto`, `chiudi_round`, `rivela_telepatia` — passano da funzioni
-- `security definer`, che la RLS la scavalcano per costruzione. L'unica
-- scrittura diretta era la pulizia, e **nessuna asserzione la verificava**.
-- Una pulizia non verificata è una pulizia che non sta avvenendo, ed è
-- esattamente la forma di B-21: la stessa lezione, ripetuta mentre si
-- dichiarava di averla imparata.
--
-- Trovato perché l'utente ha chiesto di fermare le partite attive e la
-- pulizia, eseguita e poi **ricontrollata**, ha lasciato quattro partite vive.
-- Senza quel secondo controllo il difetto sarebbe rimasto invisibile.
-- =============================================================================

-- Chi è della coppia può aggiornare le sue partite. In pratica serve a una cosa
-- sola — abbandonarle — ma scrivere una policy per singolo valore di `stato`
-- sarebbe un vincolo di dominio travestito da permesso: il dominio lo dice già
-- il `check` della colonna, e duplicarlo qui vorrebbe dire due posti da tenere
-- allineati.
drop policy if exists partita_update on public.partita;
create policy partita_update on public.partita
  for update using (public.e_membro_attivo(coppia_id))
  with check (public.e_membro_attivo(coppia_id));

-- ⚠️ **Nessuna policy di `delete`, ed è voluto.** Una partita conclusa è il
-- punteggio della coppia: è ciò che alimenta «Intesa» e «Sintonia» nell'hub.
-- Poterla cancellare vorrebbe dire poter riscrivere il passato condiviso — e
-- da un solo lato, per giunta. Le partite non si cancellano: si abbandonano, e
-- restano.
