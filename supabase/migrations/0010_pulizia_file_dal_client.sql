-- =============================================================================
-- LifeCouple — 0010: il file si cancella dall'API, non da un trigger
--
-- La 0009 cancellava l'oggetto con un trigger (`delete from storage.objects`).
-- Sembrava la strada piu' solida — il file segue la riga, sempre, chiunque
-- cancelli — ma **Supabase la vieta**: "Direct deletion from storage tables is
-- not allowed. Use the Storage API instead." Il risultato era che nessuno
-- riusciva piu' a cancellare una foto: il trigger faceva fallire l'intera
-- transazione.
--
-- Trovato dai test avversariali, non leggendo il codice: il caso che e' andato
-- rosso e' proprio quello dell'art. 17 — "dopo la rottura si puo' ancora
-- cancellare il proprio". Una funzione scritta per proteggere la catena di
-- cancellazione la stava spezzando.
--
-- Ora la riga si cancella dal database e il file **subito prima** dallo Storage
-- API, lato client (`lib/foto.ts`).
-- ⚠️ Limite accettato e dichiarato: se l'app muore fra le due operazioni resta
-- un file orfano — invisibile (il bucket e' privato e nessuna riga lo indica) ma
-- occupa spazio. E' il male minore rispetto a una riga che punta a un file che
-- non c'e' piu', e si chiude davvero con la cancellazione dell'account, dove il
-- bucket della coppia si svuota per intero.
-- =============================================================================

drop trigger if exists foto_pulisci_storage on public.foto;
drop function if exists public.foto_cancella_file();
