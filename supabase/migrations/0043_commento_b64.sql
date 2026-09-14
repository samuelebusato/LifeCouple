-- =============================================================================
-- LifeCouple — 0043: il commento della 0040 dice «B-63», e il difetto e' B-64
--
-- ✅ APPLICATA il 2026-09-14 (4) con `supabase db query`. Una riga, e non cambia
--    nessun comportamento. Verificata: il commento comincia con «B-64:».
--
-- ## Perche' esiste una migrazione per un commento
--
-- La 0040 e' stata applicata il 2026-09-14 **prima** che ci si accorgesse che
-- il numero B-63 era gia' occupato dalla pagina 404 della landing. Il file e'
-- stato corretto subito dopo; il database no, perche' un `comment on function`
-- gia' eseguito non si riscrive da se'.
--
-- 🔑 **Quindi repo e database dicono due cose diverse sulla stessa funzione**,
--    ed e' l'unica divergenza nota fra i due. Costa una riga chiuderla, e
--    lasciarla aperta costa a chi un domani cerchera' «B-63» nel registro e
--    trovera' una pagina 404 che non c'entra niente coi punti della creatura.
--
-- ⚠️ Non e' pedanteria di numerazione: il commento di una funzione e' la sola
--    documentazione che viaggia **dentro** il database, ed e' quella che legge
--    chi ci arriva senza il repository davanti.
-- =============================================================================

comment on function public.punti_su_luogo_nato_visitato() is
  'B-64: i 20 punti per un luogo creato direttamente con stato = visitato. Il '
  'trigger della 0001 copre solo la transizione desiderato -> visitato, quindi '
  'i posti nati gia visitati non ne ricevevano nessuno.';

-- =============================================================================
-- ## Come si verifica
--
--   select obj_description('public.punti_su_luogo_nato_visitato()'::regprocedure);
--
-- Deve cominciare con «B-64:». Prima di questa migrazione comincia con «B-63:».
-- =============================================================================
