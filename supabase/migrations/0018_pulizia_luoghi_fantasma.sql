-- =============================================================================
-- LifeCouple — 0018: via i "luoghi che non esistono"
--
-- Chiesto dall'utente il 2026-08-27: «elimina i luoghi che non esistono».
--
-- ## Come si sono formati
--
-- `elemento_lista.luogo_id` ha `on delete set null`. Cancellando un posto dalla
-- **mappa**, la riga in lista non spariva: le si azzerava il riferimento e
-- restava lì. Il risultato era un luogo ancora elencato fra i preferiti che
-- sulla mappa non c'era più — non un dato sbagliato, un dato **sopravvissuto**.
--
-- Il difetto è chiuso nel codice (`useLuoghi.elimina` e `usePreferiti.elimina`
-- tolgono ora entrambe le righe). Questa migrazione ripulisce ciò che le
-- cancellazioni di prima hanno lasciato indietro.
--
-- ## 🔴 Cancella dati, e non si torna indietro
--
-- Il criterio è **volutamente stretto**: se ne toglie di meno del necessario
-- piuttosto che una riga in più. Va via solo un luogo che ha, insieme:
--
--   * `tipo = 'luogo'`             — i film non si toccano;
--   * `luogo_id is null`           — non ha un posto sulla mappa;
--   * nessun **evento** collegato  — non è mai stato una serata;
--   * nessuna **recensione**       — nessuno ci ha scritto niente;
--   * nessuna **foto**             — non ha immagini proprie;
--   * nessun `google_place_id`     — non è un posto vero scelto da Google.
--
-- Cioè: una riga con dentro **solo un nome**, e nient'altro al mondo che la
-- riguardi. Un posto scritto a mano e mai collegato alla mappa *sopravvive*
-- solo se ha almeno una di quelle cose; altrimenti è indistinguibile da un
-- residuo, e questa è la ragione per cui il criterio è così lungo.
--
-- ⚠️ **Guarda prima di applicare.** La stessa condizione, in sola lettura, è in
-- fondo al file: eseguila da sola e controlla che i nomi che escono siano
-- davvero roba da buttare.
-- =============================================================================

delete from public.elemento_lista el
 where el.tipo = 'luogo'
   and el.luogo_id is null
   and el.google_place_id is null
   and not exists (select 1 from public.evento ev where ev.elemento_id = el.id)
   and not exists (select 1 from public.recensione r where r.elemento_id = el.id)
   and not exists (select 1 from public.foto f where f.elemento_id = el.id);

-- =============================================================================
-- DA ESEGUIRE PRIMA, per vedere cosa sparirebbe:
--
--   select el.id, el.titolo, el.stato, el.creato_il
--     from public.elemento_lista el
--    where el.tipo = 'luogo'
--      and el.luogo_id is null
--      and el.google_place_id is null
--      and not exists (select 1 from public.evento ev where ev.elemento_id = el.id)
--      and not exists (select 1 from public.recensione r where r.elemento_id = el.id)
--      and not exists (select 1 from public.foto f where f.elemento_id = el.id)
--    order by el.creato_il;
-- =============================================================================
