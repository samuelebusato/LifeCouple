-- =============================================================================
-- LifeCouple — 0002: chiusura dei permessi di esecuzione sulle funzioni
--
-- BUG trovato con verifica dall'esterno (2026-08-12): assegna_punti era
-- chiamabile via /rest/v1/rpc/ da chiunque, anon compreso — la chiamata di
-- prova e' arrivata fino al vincolo di chiave esterna. Con un coppia_id reale,
-- un utente poteva auto-assegnarsi punti saltando i trigger (viola D-15).
--
-- Causa: Postgres concede EXECUTE a PUBLIC su ogni funzione nuova; il
-- "revoke from anon" di 0001 non rimuove il grant a PUBLIC, e anon lo
-- eredita da li'. La revoca giusta e' FROM PUBLIC.
-- =============================================================================

-- assegna_punti: la chiamano SOLO i trigger. I trigger continuano a
-- funzionare: il privilegio EXECUTE e' verificato alla creazione del
-- trigger, non a ogni scatto.
revoke execute on function public.assegna_punti(uuid, text, uuid, integer) from public, anon, authenticated;

-- crea_coppia: la guardia interna "non autenticato" ha retto anche per anon,
-- ma la difesa non deve dipendere da un solo strato (principio 5).
revoke execute on function public.crea_coppia() from public, anon;
grant execute on function public.crea_coppia() to authenticated;

-- e_membro_attivo resta eseguibile da anon E authenticated, di proposito:
-- le policy RLS la invocano col ruolo del chiamante, e revocarla ad anon
-- trasformerebbe ogni SELECT anonima in un errore di permesso invece che
-- in zero righe. Per anon restituisce sempre false (auth.uid() e' null).

-- Le funzioni trigger (crea_creatura, punti_su_transizione_*, aggiorna_byte_foto)
-- restituiscono "trigger": Postgres stesso ne vieta la chiamata diretta,
-- non sono esposte via RPC.
