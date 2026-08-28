-- =============================================================================
-- 0024 — Un posto entra sulla mappa **essendoci stati**, non decidendolo
--
-- ## Il cambio, in una riga
--
-- Prima la mappa era **due cose insieme**: i posti dove siete stati e quelli
-- dove vorreste andare, distinti da un `stato` e da un pin di colore diverso.
-- Da qui in poi la mappa è **il registro di dove siete stati**, e i desideri
-- vivono nelle wishlist «Viaggi» e «Ristoranti».
--
-- 🔑 **Perché è meglio, e non è solo una riorganizzazione.** Un posto desiderato
-- e un posto visitato hanno **due cicli di vita diversi**: il primo si aggiunge,
-- si rimanda, a volte si cancella; il secondo non cambia più — ci siete stati, e
-- resta. Tenerli nello stesso elenco obbligava ogni schermata a filtrare, e ogni
-- filtro dimenticato mostrava desideri fra i ricordi. Ora il confine lo dice il
-- **posto in cui la riga vive**, non un campo che qualcuno deve ricordarsi di
-- controllare — che è di nuovo D-60: *se il dato è deducibile dalla posizione,
-- si deduce.*
--
-- ⚠️ **E il passaggio fra i due mondi esisteva già**, il che è il segno che il
-- confine è nel posto giusto: spuntare «fatto» su una riga di lista **scrive
-- anche `luogo.stato`** (lo fa `segnaFatto` da 0012), e la funzione
-- `aggiorna_ristoranti_visitati` (0015/0016) spunta da sola i posti la cui
-- serata è passata. Non serve inventare una promozione: c'era, e adesso ha un
-- significato visibile.
--
-- ## Cosa NON si perde
--
-- Nessuna riga viene cancellata e nessun posto sparisce dal database. Un posto
-- «desiderato» che oggi sta sulla mappa domani sta in una wishlist: **cambia
-- dove lo si vede**, non se esiste.
-- =============================================================================

-- --- 1. Una lista può contenere anche luoghi -------------------------------

alter table public.lista
  drop constraint if exists lista_tipo_check;

alter table public.lista
  add constraint lista_tipo_check check (tipo in ('voce', 'film', 'luogo'));

-- --- 2. Tre liste di default, e tre colori che non si toccano --------------
--
-- ⚠️ **I colori sono assegnati qui e sono diversi fra loro**, non lasciati al
-- default: le tre liste nascono insieme e finirebbero adiacenti nel carosello.
-- Tre carte uguali di fila sono esattamente ciò che il colore doveva evitare —
-- riconoscere una lista **senza leggerne il nome**.
create or replace function public.crea_liste_default()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  insert into lista (coppia_id, autore_id, nome, pastello, tipo) values
    (new.id, auth.uid(), 'Film',        'romantico', 'film'),
    (new.id, auth.uid(), 'Viaggi',      'vacanza',   'luogo'),
    (new.id, auth.uid(), 'Ristoranti',  'speciale',  'luogo');
  return new;
end;
$$;

-- Sostituisce quello di 0023, che creava la sola «Film».
drop trigger if exists coppia_crea_lista_film on public.coppia;
drop trigger if exists coppia_crea_liste_default on public.coppia;
create trigger coppia_crea_liste_default
  after insert on public.coppia
  for each row execute function public.crea_liste_default();

drop function if exists public.crea_lista_film();

-- --- 3. Le coppie che esistono già -----------------------------------------

-- Le due liste nuove per chi non ce le ha. Stessa forma ripetibile di 0022/0023.
insert into public.lista (coppia_id, autore_id, nome, pastello, tipo)
select c.id, m.utente_id, v.nome, v.pastello, 'luogo'
from public.coppia c
join lateral (
  select utente_id from public.membro_coppia
  where coppia_id = c.id order by entrato_il asc limit 1
) m on true
cross join (values ('Viaggi', 'vacanza'), ('Ristoranti', 'speciale')) as v(nome, pastello)
where not exists (
  select 1 from public.lista l where l.coppia_id = c.id and l.nome = v.nome
);

-- E la «Film» esistente prende il suo colore, così le tre non si toccano.
update public.lista set pastello = 'romantico' where nome = 'Film' and tipo = 'film';

-- --- 4. I luoghi che c'erano trovano la loro lista -------------------------
--
-- ⚠️ **Tutti**, visitati compresi — non solo i desiderati. Una wishlist mostra
-- «da fare» e «già fatti» in due sezioni: un posto visitato che non stesse in
-- nessuna lista sarebbe visibile **solo** sulla mappa, e la sua scheda con le
-- recensioni diventerebbe irraggiungibile. Si sposta dove si guarda, non cosa
-- esiste.
--
-- I ristoranti vanno in «Ristoranti», tutto il resto in «Viaggi». La condizione
-- ricalca `eRistorante()` di `lib/ricerca-luoghi.ts`, che accetta l'intera
-- famiglia e non il solo `restaurant` — perché sono i `bar` e i `cafe` i casi
-- più comuni di una serata.
--
-- 🔑 ⚠️ **Le due `update` NON si possono invertire né fondere**: la seconda
-- prende «tutto il resto», e il resto è definito da *ciò che la prima ha già
-- sistemato*. Fonderle in una `case` sarebbe stato più corto e avrebbe funzionato;
-- invertirle avrebbe messo i ristoranti in «Viaggi» e poi non li avrebbe più
-- trovati. L'ordine è il significato.
update public.elemento_lista e
set lista_id = l.id
from public.lista l
where e.tipo = 'luogo'
  and e.lista_id is null
  and l.coppia_id = e.coppia_id
  and l.nome = 'Ristoranti'
  and (
    e.genere ilike '%restaurant%'
    or e.genere in ('bar', 'cafe', 'coffee_shop', 'bakery', 'pub', 'wine_bar',
                    'food_court', 'ice_cream_shop', 'meal_takeaway', 'meal_delivery')
  );

update public.elemento_lista e
set lista_id = l.id
from public.lista l
where e.tipo = 'luogo'
  and e.lista_id is null
  and l.coppia_id = e.coppia_id
  and l.nome = 'Viaggi';

-- --- Cosa NON si fa, e perché ----------------------------------------------
--
-- ⚠️ **Non si tocca `luogo.stato`.** La distinzione desiderato/visitato resta
-- dov'era: è il dato che decide se un posto compare sulla mappa, ed è anche ciò
-- che il trigger dei punti (D-15) guarda per far crescere la creatura. Cambiare
-- *dove si aggiunge un posto* non è una buona ragione per toccare *cosa
-- significa esserci stati*.
--
-- ⚠️ **`lista_id` resta nullable** anche dopo questa migrazione. Adesso quasi
-- tutti i luoghi ne hanno uno, quindi la tentazione di stringere torna — ma un
-- posto può ancora nascere **da un evento** (D-44: il ristorante si collega da
-- solo alla serata) senza passare da nessuna lista. Il vincolo lo romperebbe
-- proprio nel caso automatico, cioè quello che nessuno prova a mano.
