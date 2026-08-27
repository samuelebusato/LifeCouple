-- =============================================================================
-- LifeCouple — 0014: chiusura dei permessi sulle funzioni di appaiamento (B-07)
--
-- ## Il difetto
--
-- La 0003 chiudeva le quattro funzioni dell'invito così:
--
--     revoke execute on function public.crea_invito() from public;
--     grant  execute on function public.crea_invito() to authenticated;
--
-- e il commento diceva «lezione di B-01 applicata: revoke from public (non da
-- anon)». La lezione era giusta, ma è stata applicata **alla forma sbagliata**.
--
-- B-01 era: *«revoke from anon senza revoke from public non revoca niente»*,
-- perché Postgres concede EXECUTE a PUBLIC su ogni funzione nuova e anon lo
-- eredita da lì.
--
-- Questo è il caso **speculare**: Supabase, oltre al grant implicito a PUBLIC,
-- imposta `alter default privileges in schema public grant all on functions to
-- anon, authenticated, service_role`. Quindi ogni funzione nuova riceve anche
-- un grant **diretto** ad anon — e `revoke from public` non lo tocca.
--
-- Risultato misurato contro il progetto reale il 2026-08-27, con la sola chiave
-- pubblicabile e nessun utente: le quattro funzioni **entravano** (rispondevano
-- `P0001`, cioè il loro raise interno) invece di essere fermate ai permessi
-- (`42501`). Le due funzioni di lettura andavano oltre: rispondevano il valore.
--
-- ## Perché conta, visto che le guardie interne reggevano
--
-- Perché la guardia interna non deve **mai** essere l'unico strato: è il
-- principio scritto in `Rule/regole-sviluppo-sicuro.md` e ripetuto nella
-- chiusura di B-01. Una guardia è una riga di codice che un domani si riscrive;
-- un permesso negato è una proprietà del database.
--
-- E su due funzioni non reggeva affatto:
--
--   ha_coppia_attiva(uid)  -> «questa persona sta in una coppia?»
--   n_membri_attivi(cid)   -> «quanti membri ha questa coppia?»
--
-- Sono `security definer`, quindi **scavalcano la RLS per costruzione**, e
-- rispondevano a un chiamante anonimo. Non è un'escalation — servono un uuid
-- di utente o di coppia validi, che non si indovinano — ma è comunque una
-- lettura non autenticata di dati che la RLS esiste per proteggere. Un
-- `utente_id` non è un segreto come un token: compare negli `autore_id` dei
-- contenuti condivisi.
--
-- ## La correzione
--
-- Revoca **esplicita da anon**, non solo da public. E le due funzioni di
-- lettura si revocano anche ad `authenticated`: le chiamano soltanto le altre
-- funzioni, che essendo `security definer` girano coi privilegi del proprietario
-- e non hanno bisogno del grant del chiamante. Il client non le ha mai chiamate
-- (verificato: compaiono solo in `lib/database.types.ts`, generato).
--
-- ## Come si verifica che ha funzionato
--
-- Con la sola chiave pubblicabile, senza utente:
--
--   POST /rest/v1/rpc/apri_invito  {"p_token":"x"}
--     prima:  P0001 «non autenticato»      (era entrata)
--     dopo:   42501 permission denied      (fermata ai permessi)
--
--   POST /rest/v1/rpc/n_membri_attivi  {"cid":"<uuid>"}
--     prima:  0                            (rispondeva)
--     dopo:   42501 permission denied
--
-- I test avversariali coprivano `crea_coppia` da anon (che infatti era chiusa
-- bene, perché la 0002 revocava esplicitamente `from public, anon`) ma non
-- queste sei: la lacuna è chiusa in `tests/rls.avversariali.mjs`.
-- =============================================================================

-- --- le quattro dell'invito: solo authenticated -------------------------------
revoke execute on function public.crea_invito()          from public, anon;
revoke execute on function public.apri_invito(text)      from public, anon;
revoke execute on function public.conferma_invito(uuid)  from public, anon;
revoke execute on function public.revoca_invito(uuid)    from public, anon;

grant execute on function public.crea_invito()         to authenticated;
grant execute on function public.apri_invito(text)     to authenticated;
grant execute on function public.conferma_invito(uuid) to authenticated;
grant execute on function public.revoca_invito(uuid)   to authenticated;

-- --- le due di lettura: nessuno, dall'esterno ---------------------------------
-- Le invocano solo altre funzioni `security definer`, che girano coi privilegi
-- del proprietario: togliere il grant al chiamante non le rompe.
revoke execute on function public.ha_coppia_attiva(uuid) from public, anon, authenticated;
revoke execute on function public.n_membri_attivi(uuid)  from public, anon, authenticated;

-- --- e_membro_attivo NON si tocca, ed è deliberato ----------------------------
-- Resta eseguibile da tutti perché **le policy RLS la invocano col ruolo del
-- chiamante**: revocarla spegnerebbe la RLS invece di rafforzarla. Non è un
-- oracolo come le due qui sopra: risponde solo sul chiamante (`auth.uid()`),
-- quindi a un anonimo risponde sempre `false`, che non è un'informazione.
-- È la stessa nota già scritta nella chiusura di B-01.

-- --- la stessa trappola, per il futuro ----------------------------------------
-- ⚠️ Ogni funzione **nuova** in `public` nasce con il grant diretto ad anon e a
-- authenticated, per via delle default privileges di Supabase. Quindi la regola
-- da applicare d'ora in poi, su ogni funzione che si crea:
--
--     revoke execute on function public.<nome>(<args>) from public, anon, authenticated;
--     grant  execute on function public.<nome>(<args>) to <solo chi serve>;
--
-- Revocare da uno dei due soltanto lascia l'altra porta aperta: è stato B-01 in
-- un verso e B-07 nell'altro.
