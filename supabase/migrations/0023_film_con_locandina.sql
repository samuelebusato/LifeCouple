-- =============================================================================
-- 0023 — La lista «Film» c'è sempre, e i film hanno una locandina
--
-- Due cose che 0022 aveva lasciato indietro, e una che non è mai esistita.
--
-- ## 1. «Film» era una lista di migrazione, non una lista di default
--
-- 0022 creava la lista «Film» **solo per le coppie che avevano già dei film**:
-- serviva a dare una casa ai dati esistenti, non a garantire che quella lista
-- ci fosse. Conseguenza: una coppia **nuova** apriva Liste e trovava il vuoto.
--
-- 🔑 La forma giusta ce l'aveva già lo schema, scritta il 2026-08-12 per la
-- creatura: *«La creatura nasce con la coppia: mai una coppia senza creatura»*,
-- un trigger su `coppia`. Qui vale identico — *mai una coppia senza la lista
-- Film* — e per la stessa ragione: una cosa che deve esistere sempre non si
-- crea dal client, perché il client può dimenticarsene, fallire a metà, o non
-- essere ancora stato scritto.
--
-- ⚠️ **Il trigger non basta da solo.** Copre le coppie future; quelle che
-- esistono già sono nate prima che il trigger esistesse. Serve anche il
-- riempimento all'indietro — ed è lo stesso errore che 0022 ha evitato per i
-- film e che qui si evita per le liste: *la regola nuova vale da adesso, i dati
-- vengono dal passato.*
--
-- ## 2. La locandina: due colonne nuove, non due riusate
--
-- La tentazione era mettere l'identità TMDB dentro `google_place_id` e il
-- percorso della locandina dentro `foto_google`: sono già lì, sono già testo, e
-- per un film non servono. Sarebbe stata la stessa bugia nello schema che 0022
-- ha rifiutato di scrivere per `tipo`, e con lo stesso costo — chi legge
-- `foto_google` fra sei mesi si aspetta un nome-risorsa di Google Places e
-- trova il percorso di un poster TMDB.
--
-- ⚠️ **Perché la locandina è un percorso e non un file.** Salvare l'immagine
-- nello storage consumerebbe il tetto di 1 GB (D-22) per una figura che TMDB
-- serve già da CDN, gratis e in cinque formati. Si salva la stringa e l'URL si
-- ricompone al momento di mostrarla — esattamente come `foto_google` per i
-- luoghi. Il costo dichiarato: se TMDB cambia i percorsi, le locandine si
-- rompono tutte insieme. È accettabile perché **non è un ricordo della coppia**
-- — è la copertina di un film, e si può sempre ripescare.
-- =============================================================================

-- --- 1. Le due colonne -----------------------------------------------------

alter table public.elemento_lista
  add column if not exists tmdb_id integer,
  -- Il `poster_path` di TMDB, es. `/qJ2tW6WMUDux911r6m7haRef0WH.jpg`.
  add column if not exists locandina text;

-- --- 2. Una lista dichiara cosa contiene ------------------------------------
--
-- Serve perché **la schermata di una lista aperta deve sapere come si aggiunge
-- una voce**: scrivendo (una cosa da fare) oppure scegliendo da una tendina con
-- le locandine (un film). Senza questo dato l'unica alternativa sarebbe
-- indovinarlo dal **nome** — «se si chiama Film allora è di film» — che si
-- rompe con «Filmoni», con la lingua inglese, e nel momento in cui qualcuno la
-- rinomina.
--
-- 🔑 È la stessa scelta di D-60 riportata allo schema: *se il dato serve, lo si
-- dichiara, non lo si deduce da un indizio che può cambiare.*
--
-- ⚠️ Default `voce`: le liste create a mano contengono cose scritte. Solo la
-- lista «Film» automatica nasce `film`. **Oggi non si può creare una seconda
-- lista di film**, ed è una limitazione dichiarata, non una svista — il foglio
-- di creazione non chiede il tipo. La colonna però c'è, quindi aggiungere quella
-- scelta domani è una riga di interfaccia e non una migrazione.
alter table public.lista
  add column if not exists tipo text not null default 'voce'
    check (tipo in ('voce', 'film'));

-- --- 3. La lista «Film» nasce con la coppia --------------------------------

create or replace function public.crea_lista_film()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  -- ⚠️ `auth.uid()` e non un utente inventato: la lista ha un autore, e
  -- l'autore è chi ha creato la coppia. È anche l'unico che potrà cancellarla,
  -- coerentemente con la policy solo-autore di 0022.
  --
  -- ⚠️ E se `auth.uid()` fosse null — cioè se una coppia nascesse da un
  -- contesto senza utente, oggi impossibile ma domani chissà — non si inserisce
  -- niente invece di fallire: una coppia senza lista è recuperabile, una coppia
  -- che non si crea no.
  if auth.uid() is not null then
    insert into lista (coppia_id, autore_id, nome, pastello, tipo)
    values (new.id, auth.uid(), 'Film', 'romantico', 'film');
  end if;
  return new;
end;
$$;

drop trigger if exists coppia_crea_lista_film on public.coppia;
create trigger coppia_crea_lista_film
  after insert on public.coppia
  for each row execute function public.crea_lista_film();

-- --- 4. Le coppie che esistono già -----------------------------------------

-- Una lista «Film» per ogni coppia che non ce l'ha. L'autore è il **primo
-- membro entrato**: qualcuno deve esserlo, e chi c'era prima è la scelta meno
-- arbitraria fra quelle disponibili.
--
-- ⚠️ `not exists` la rende ripetibile, come in 0022: rieseguire la migrazione
-- non deve produrre una seconda lista «Film» per nessuno.
insert into public.lista (coppia_id, autore_id, nome, pastello, tipo)
select c.id, m.utente_id, 'Film', 'romantico', 'film'
from public.coppia c
join lateral (
  select utente_id
  from public.membro_coppia
  where coppia_id = c.id
  order by entrato_il asc
  limit 1
) m on true
where not exists (
  select 1 from public.lista l where l.coppia_id = c.id and l.nome = 'Film'
);

-- ⚠️ E le liste «Film» nate da **0022** sono `voce`, perché la colonna non
-- esisteva ancora: vanno promosse, altrimenti le coppie che avevano già dei
-- film sono precisamente quelle che **non** vedrebbero la ricerca. Sarebbe il
-- difetto più beffardo dei due: funziona per chi non ha dati, non per chi ne ha.
update public.lista set tipo = 'film' where nome = 'Film' and tipo <> 'film';

-- --- Cosa NON si fa, e perché ----------------------------------------------
--
-- 🔴 **QUESTA NOTA È STATA SUPERATA DA 0025 — si legge, non si applica.**
--
-- Diceva: *«La lista Film non è protetta dalla cancellazione, e non è una
-- dimenticanza. Se qualcuno la elimina, il trigger non la ricrea e resterà
-- senza — ed è giusto così: una lista che non si può togliere è un pezzo di
-- arredamento, non una cosa della coppia. Il default serve a non partire dal
-- vuoto, non a imporre una categoria per sempre.»*
--
-- Il ragionamento era coerente ma **partiva da un prodotto diverso**: allora
-- «Film» era l'unico default e i luoghi vivevano ancora sulla mappa. Con D-70
-- le liste di partenza sono diventate **l'unico ingresso per i desideri**, e
-- **0025** le protegge con un trigger.
--
-- 🔑 Resta scritta apposta: cancellarla nasconderebbe il cambio di idea, che è
-- l'informazione più utile delle due. *Una decisione giusta smette di esserlo
-- quando cambia ciò su cui poggiava, e il modo di accorgersene è rileggere le
-- note vecchie invece di fidarsene.*
--
-- ⚠️ **`tmdb_id` non ha un vincolo di unicità.** Lo stesso film può stare in
-- due liste della stessa coppia — «Da vedere» e «I nostri preferiti» — e sono
-- due righe diverse con due stati diversi. Un unique su (coppia, tmdb_id)
-- sembrerebbe pulizia e sarebbe una regola di prodotto mai decisa da nessuno.
