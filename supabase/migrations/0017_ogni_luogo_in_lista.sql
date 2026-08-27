-- =============================================================================
-- LifeCouple — 0017: ogni posto della mappa è anche un luogo in lista
--
-- Chiesto dall'utente il 2026-08-27: «nei luoghi voglio visualizzare tutti i
-- luoghi, non solo i ristoranti».
--
-- ## Il disallineamento
--
-- Un posto poteva nascere in due modi, e i due non producevano la stessa cosa:
--
--   dal campo "dove" di un evento  →  riga in `luogo` **e** in `elemento_lista`
--   dalla mappa (tocco lungo, «segna dove sono», ricerca)  →  solo `luogo`
--
-- Finché la lista si chiamava "ristoranti" la differenza aveva un senso: un
-- punto segnato sulla mappa non era un ristorante. Da 0016 la lista è dei
-- **luoghi**, e allora un posto che sta sulla mappa ma non in lista è
-- semplicemente un posto che manca — senza copertina, senza recensioni, senza
-- "da fare / fatto".
--
-- ## Uno a uno, da qui in avanti
--
-- Dopo questa migrazione ogni `luogo` ha esattamente un `elemento_lista` che lo
-- rappresenta. Le due tabelle restano distinte perché contengono cose diverse —
-- `luogo` le coordinate e lo stato sulla mappa, `elemento_lista` la vita in
-- lista (copertina, recensioni, identità Google) — ma non esistono più posti
-- che stanno solo di qua o solo di là.
--
-- ⚠️ Il codice deve stare al passo: `useLuoghi.aggiungi` crea ora **entrambe**
-- le righe. Se un domani qualcuno aggiunge un terzo percorso di creazione e ne
-- scrive una sola, il posto torna invisibile in lista — ed è esattamente il
-- difetto che questa migrazione ripara.
--
-- ## Perché una funzione e non un semplice INSERT … SELECT
--
-- `autore_id` ha `default auth.uid()`, che dentro una migrazione eseguita dal
-- dashboard è **nullo**: un insert diretto violerebbe il `not null`. La
-- funzione copia invece l'autore dalla riga `luogo`, che è l'attribuzione
-- giusta — il posto resta di chi l'ha segnato, e le policy solo-autore
-- continuano a valere per la persona che se le aspetta.
-- =============================================================================

do $$
declare
  r record;
begin
  for r in
    select l.id, l.coppia_id, l.autore_id, l.nome, l.stato, l.visitato_il, l.creato_il
      from luogo l
     where not exists (
       select 1 from elemento_lista el
        where el.luogo_id = l.id and el.tipo = 'luogo'
     )
  loop
    insert into elemento_lista
      (coppia_id, autore_id, tipo, titolo, stato, fatto_il, creato_il, luogo_id)
    values (
      r.coppia_id,
      r.autore_id,
      'luogo',
      r.nome,
      -- «visitato» sulla mappa e «fatto» in lista sono lo stesso fatto detto in
      -- due posti (0012): qui si allineano invece di partire già discordi.
      case when r.stato = 'visitato' then 'fatto' else 'desiderato' end,
      case when r.stato = 'visitato' then coalesce(r.visitato_il, r.creato_il) else null end,
      r.creato_il,
      r.id
    );
  end loop;
end;
$$;
