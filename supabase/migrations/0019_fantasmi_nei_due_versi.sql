-- =============================================================================
-- LifeCouple — 0019: i fantasmi, nei due versi
--
-- `0018` ha ripulito **un** verso: righe di lista rimaste senza posto. Ne
-- restavano due categorie, ed è la ragione per cui l'utente ne vedeva ancora.
--
-- ## 1. Le righe che 0018 aveva risparmiato
--
-- 0018 escludeva chi avesse un `google_place_id`, per prudenza: sembrava
-- l'indizio di un posto vero, quindi da tenere. Era il ragionamento sbagliato.
-- Con il flusso attuale **ogni posto scelto da Google crea anche la sua riga
-- `luogo`**: se quella riga non c'è più, il posto è stato cancellato dalla
-- mappa — ed è un fantasma esattamente come gli altri, anzi più
-- riconoscibile. L'id di Google diceva "questo posto esiste nel mondo", non
-- "questo posto esiste ancora nella vostra app".
--
-- ## 2. I posti senza scheda (il verso opposto)
--
-- Prima della correzione di B-11, cancellare dalla **lista** lasciava vivo il
-- `luogo`: un pin sulla mappa che in lista non compare. Qui non si cancella —
-- **si ricostruisce la scheda**, come faceva 0017. Un posto ha coordinate e una
-- storia di eventi: buttarlo perché gli manca la scheda sarebbe distruggere il
-- dato più prezioso dei due per riparare il meno prezioso.
--
-- 🔴 **La prima parte cancella e non si torna indietro.** In fondo al file c'è
-- la stessa condizione in sola lettura: guarda prima.
-- =============================================================================

-- --- 1. via le righe di lista senza posto (criterio allargato) ---------------
delete from public.elemento_lista el
 where el.tipo = 'luogo'
   and el.luogo_id is null
   and not exists (select 1 from public.evento ev where ev.elemento_id = el.id)
   and not exists (select 1 from public.recensione r where r.elemento_id = el.id)
   and not exists (select 1 from public.foto f where f.elemento_id = el.id);

-- --- 2. e la scheda ricostruita per i posti che ne sono rimasti senza --------
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
      r.coppia_id, r.autore_id, 'luogo', r.nome,
      case when r.stato = 'visitato' then 'fatto' else 'desiderato' end,
      case when r.stato = 'visitato' then coalesce(r.visitato_il, r.creato_il) else null end,
      r.creato_il, r.id
    );
  end loop;
end;
$$;

-- =============================================================================
-- DA ESEGUIRE PRIMA, per vedere cosa sparirebbe con il punto 1:
--
--   select el.id, el.titolo, el.stato, el.google_place_id, el.creato_il
--     from public.elemento_lista el
--    where el.tipo = 'luogo'
--      and el.luogo_id is null
--      and not exists (select 1 from public.evento ev where ev.elemento_id = el.id)
--      and not exists (select 1 from public.recensione r where r.elemento_id = el.id)
--      and not exists (select 1 from public.foto f where f.elemento_id = el.id)
--    order by el.creato_il;
-- =============================================================================
