-- =============================================================================
-- LifeCouple — 0037: le foto restano leggibili dal loro autore anche dopo lo
--                    scioglimento della coppia (B-62)
--
-- ✅ APPLICATA il 2026-09-10 dall'utente, dopo averla letta.
-- 🔴 APPLICATA NON VUOL DIRE VERIFICATA: la prova descritta in fondo non e'
--    ancora stata eseguita. Vedi B-62 in History.md.
--
-- ## Il difetto, in una riga
--
-- I documenti legali promettono che «ciascuno conserva cio' di cui e' autore»
-- (informativa privacy §6, termini d'uso §5, D-04). Per le RIGHE della tabella
-- `foto` e' vero — la policy dice `e_membro_attivo(coppia_id) or autore_id =
-- auth.uid()`, come per `evento` e `luogo`. Per i FILE no: `foto_leggi` sullo
-- storage (migrazione 0009) si ferma a `e_membro_attivo`, e quella clausola
-- diventa falsa per entrambi nel momento in cui la coppia si scioglie.
--
-- 🔴 **Il risultato e' peggiore di una cancellazione**: il dato non e' cancellato,
--    e' irraggiungibile — e i METADATI restano visibili. La persona vede che la
--    fotografia esiste, con la sua data e il suo luogo, e non riesce ad aprirla.
--    ⚠️ *E l'esportazione non fa da rete*: `lib/esporta.ts` dichiara di non
--    includere le immagini e rimanda «alla galleria dell'app», che dopo lo
--    scioglimento non riesce piu' a firmare gli URL.
--
-- 🔑 **Perche' era sfuggito**: la frase e' vera nel posto in cui e' scritta (le
--    tabelle) ed e' resa falsa da una policy che sta in un altro file, scritta
--    per un altro oggetto. E' la stessa forma di B-60 — una promessa corretta
--    quando e' stata scritta e smentita altrove.
--
-- ## Cosa cambia
--
-- Solo `foto_leggi`. Il criterio nuovo ricalca **parola per parola** quello che
-- la tabella `foto` gia' applica, cosi' le due non possono divergere di nuovo:
-- e' membro attivo della coppia proprietaria della cartella, **oppure** e'
-- l'autore della riga `foto` che punta a quel file.
--
-- ⚠️ **Non tocca ne' il caricamento ne' la cancellazione.** `foto_carica` resta
--    riservato ai membri attivi — dopo lo scioglimento in quella cartella non
--    carica piu' nessuno, ed e' voluto. `foto_cancella` resta com'e': cancellare
--    e' dell'autore, e lo era gia'.
--
-- ## Il confine che questa migrazione NON sposta
--
-- 🔑 Dopo lo scioglimento **ciascuno vede le proprie foto, non quelle dell'altro**:
--    il criterio e' l'autore della riga, non la cartella. La cartella resta una
--    sola (`<coppia_id>/`) perche' e' il percorso su cui poggiano tutte le policy
--    dello storage, ma la leggibilita' e' per riga. *Non c'e' nessun caso in cui
--    questa modifica dia a un ex-partner qualcosa che prima non aveva.*
--
-- ⚠️ **Verifica dopo l'applicazione** (non deducibile, va eseguita): su una coppia
--    di prova sciolta, l'autore ottiene un URL firmato per una propria foto e
--    **non** lo ottiene per una foto dell'altro. Il posto dove aggiungerla e'
--    `tests/rls.avversariali.mjs`, che gia' esercita questo confine sulle tabelle.
-- =============================================================================

drop policy if exists foto_leggi on storage.objects;
create policy foto_leggi on storage.objects
  for select to authenticated
  using (
    bucket_id = 'foto'
    and (
      public.e_membro_attivo(((storage.foldername(name))[1])::uuid)
      or exists (
        select 1
        from public.foto f
        where f.chiave_storage = storage.objects.name
          and f.autore_id = auth.uid()
      )
    )
  );
