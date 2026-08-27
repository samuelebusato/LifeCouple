-- =============================================================================
-- LifeCouple — 0016: la lista dei "ristoranti" diventa la lista dei **luoghi**
--
-- Chiesto dall'utente il 2026-08-27: «vorrei che non fosse solo legato ai
-- ristoranti ma che diventasse luoghi».
--
-- ## Cosa cambia, e perche' e' un allargamento e non una sostituzione
--
-- Il modello aveva una lista di cose desiderate con due tipi: `film` e
-- `ristorante`. Il secondo era troppo stretto: la stessa struttura — un posto
-- scelto da Google, con la sua identita', la sua copertina, il suo "da fare /
-- fatto" e le recensioni di entrambi — serve identica per un museo, un parco,
-- un teatro. L'unica cosa che cambiava era l'etichetta.
--
-- Quindi `ristorante` **diventa** `luogo`, e non gli si affianca: due tipi che
-- si comportano allo stesso modo sono un tipo solo con un attributo diverso, e
-- tenerli separati avrebbe voluto dire due elenchi, due schede, due percorsi di
-- aggiunta che divergono alla prima modifica.
--
-- ## L'attributo che resta: `genere`
--
-- Perdere del tutto l'informazione "questo e' un ristorante" sarebbe stato un
-- passo indietro: sulla mappa i posti dove si mangia hanno un pin diverso, e
-- nella lista un'icona diversa aiuta a scorrere. Si conserva quindi il **tipo
-- di Google** (`restaurant`, `city_park`, `museum`…) in `genere`, che e' un
-- dato piu' ricco di quello che si perde — prima "ristorante o no", ora la
-- categoria vera.
--
-- Per le righe che esistono gia' `genere` resta nullo: erano tutte ristoranti,
-- e lo dice l'aggiornamento qui sotto.
-- =============================================================================

-- --- 1. il nuovo tipo entra nel vincolo --------------------------------------
alter table public.elemento_lista
  drop constraint if exists elemento_lista_tipo_check;

alter table public.elemento_lista
  add constraint elemento_lista_tipo_check
  check (tipo in ('film', 'ristorante', 'luogo'));

-- --- 2. il genere, dal tipo primario di Google -------------------------------
alter table public.elemento_lista
  add column if not exists genere text;

-- --- 3. le righe esistenti diventano luoghi ----------------------------------
-- Erano tutte ristoranti per costruzione: il `genere` lo dice, cosi' l'icona e
-- il pin sulla mappa restano quelli di prima invece di diventare generici.
update public.elemento_lista
   set tipo = 'luogo',
       genere = coalesce(genere, 'restaurant')
 where tipo = 'ristorante';

-- --- 4. e ora `ristorante` non e' piu' un valore ammesso ---------------------
-- Si stringe **dopo** aver convertito: farlo prima avrebbe rifiutato le righe
-- che stavamo per aggiornare.
alter table public.elemento_lista
  drop constraint elemento_lista_tipo_check;

alter table public.elemento_lista
  add constraint elemento_lista_tipo_check
  check (tipo in ('film', 'luogo'));

-- --- 5. la passata automatica guarda i luoghi, non i ristoranti --------------
-- Stessa funzione di 0015, con il tipo aggiornato. Il resto — perche' e' una
-- funzione e non un trigger, perche' e' `security definer`, perche' scrive due
-- tabelle e perche' non torna mai indietro — sta scritto in 0015 e non si
-- ricopia qui.
create or replace function public.aggiorna_ristoranti_visitati()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coppia uuid;
  v_quanti integer := 0;
begin
  select coppia_id into v_coppia
  from membro_coppia
  where utente_id = auth.uid() and uscito_il is null
  limit 1;

  if v_coppia is null then
    return 0;
  end if;

  with da_segnare as (
    select el.id,
           el.luogo_id,
           max(coalesce(ev.fine, ev.inizio)) as ultima
    from elemento_lista el
    join evento ev on ev.elemento_id = el.id
    where el.coppia_id = v_coppia
      and el.tipo = 'luogo'
      and el.fatto_il is null
      and coalesce(ev.fine, ev.inizio) < now()
    group by el.id, el.luogo_id
  ),
  segnati as (
    update elemento_lista el
       set stato = 'fatto',
           fatto_il = d.ultima
      from da_segnare d
     where el.id = d.id
    returning d.luogo_id
  )
  update luogo l
     set stato = 'visitato',
         visitato_il = coalesce(l.visitato_il, now())
    from segnati s
   where l.id = s.luogo_id
     and l.stato is distinct from 'visitato';

  get diagnostics v_quanti = row_count;
  return v_quanti;
end;
$$;

revoke execute on function public.aggiorna_ristoranti_visitati() from public, anon;
grant  execute on function public.aggiorna_ristoranti_visitati() to authenticated;
