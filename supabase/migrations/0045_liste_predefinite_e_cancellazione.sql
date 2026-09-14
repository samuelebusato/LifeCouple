-- =============================================================================
-- LifeCouple — 0045: due protezioni si bloccavano a vicenda, e vinceva la peggiore
--
-- ✅ APPLICATA il 2026-09-14 (4) con `supabase db query`. È la correzione che fa
--    funzionare la cancellazione account, e `npm run test:cancellazione` la prova.
--
-- ## Come è saltato fuori
--
-- Il 2026-09-14 (3), alla prima esecuzione vera del protocollo di
-- `docs/legal/catena-cancellazione.md` (`tests/cancellazione.mjs`), la Edge
-- Function ha risposto:
--
--     HTTP 500  {"errore":"Database error deleting user","fase":"cancellazione"}
--
-- Il messaggio di GoTrue non dice **perché**. La stessa `delete` eseguita a mano
-- in SQL lo dice:
--
--     ERROR: lista-predefinita
--     HINT:  Le liste di partenza non si eliminano.
--     CONTEXT: funzione vieta_cancellazione_lista_predefinita()
--              SQL statement "DELETE FROM ONLY public.lista WHERE $1 = autore_id"
--
-- ## Due regole giuste che si escludono
--
-- - la **0025** vieta di cancellare le tre liste di partenza: senza, una
--   persona può svuotare per sbaglio ciò che nasce con la coppia;
-- - la **0026** fa sì che, cancellando l'account, sparisca tutto ciò di cui si
--   è autori — ed è l'art. 17 GDPR.
--
-- 🔑 **Nessuna delle due è sbagliata: è sbagliato che non si conoscano.** Il
--    trigger della 0025 non distingue *chi* sta cancellando, quindi ferma anche
--    la cascata dell'account — e l'effetto è che **cancellare l'account non
--    funzionava affatto**, mentre l'informativa §7 promette agli utenti una
--    cancellazione «immediata e definitiva».
--
-- ⚠️ **Ed è rimasto invisibile per due settimane e mezzo** (la 0025 è del
--    2026-08-28) perché l'unico modo di accorgersene era cancellare un account
--    davvero: la schermata dice «fatto» comunque. È la lezione di B-23, e il
--    motivo per cui il protocollo esisteva.
--
-- ## La correzione, e perché `pg_trigger_depth()`
--
-- Il discriminante non è *chi* cancella ma **da dove arriva la cancellazione**:
--
--   - una `delete` che parte dal client è profondità **1** — è il caso che la
--     0025 vuole fermare, e resta fermato;
--   - una `delete` prodotta da una **cascata** (la riga di `auth.users` che se
--     ne va, o la coppia che viene rimossa) gira **dentro** il trigger di
--     integrità referenziale, quindi a profondità **≥ 2** — ed è il caso che
--     deve passare.
--
-- *Alternativa scartata*: togliere il `cascade` da `lista.autore_id` e metterlo
-- a `set null`. Costo: una lista senza autore sopravvivrebbe alla persona che
-- l'ha creata, e l'art. 17 chiede il contrario. La colonna è per giunta NOT
-- NULL, quindi non era nemmeno esprimibile.
--
-- *Alternativa scartata*: far cancellare le liste alla funzione di preparazione
-- che gira come l'utente (0026 §2), prima della cascata. Costo: sposta la
-- regola in un secondo posto, e il giorno che qualcuno cancella un account per
-- un'altra strada il difetto torna. 🔑 *La guardia deve stare dove sta il
-- divieto, non dove sta il chiamante di turno.*
-- =============================================================================

create or replace function public.vieta_cancellazione_lista_predefinita()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- 🔑 Profondità > 1 significa «questa delete non l'ha chiesta un client: è la
  --    conseguenza di un'altra». Le cascate della cancellazione account (0026) e
  --    della rimozione di una coppia passano di qui, e devono passare.
  if pg_trigger_depth() > 1 then
    return old;
  end if;

  if old.predefinita then
    raise exception 'lista-predefinita'
      using hint = 'Le liste di partenza non si eliminano.';
  end if;

  return old;
end;
$$;

comment on function public.vieta_cancellazione_lista_predefinita() is
  'Le tre liste di partenza non si cancellano da un client (0025). '
  'Dal 2026-09-14 la guardia si ferma sulle CASCATE (pg_trigger_depth > 1): '
  'bloccavano la cancellazione account, che e un obbligo di legge (art. 17).';

-- =============================================================================
-- ## Come si verifica
--
-- 1. `npm run test:cancellazione` arriva in fondo verde. Prima di questa
--    migrazione fallisce su «la Edge Function risponde».
-- 2. Il divieto vero regge ancora: dall'app, provare a eliminare una delle tre
--    liste di partenza deve continuare a rifiutarsi con lo stesso messaggio.
--    ⚠️ *È la metà che si dimentica di riprovare dopo una correzione come
--    questa* — una guardia allentata troppo non fallisce nessun test.
-- =============================================================================
