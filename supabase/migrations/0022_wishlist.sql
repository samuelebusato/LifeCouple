-- =============================================================================
-- 0022 — Le liste dei desideri diventano cose che si creano
--
-- Fino a oggi «Liste» conteneva **un elenco solo e fisso**: i film. I luoghi
-- se n'erano già andati nella mappa con D-51, e quel che restava era una
-- categoria decisa da noi, non dalla coppia.
--
-- Da qui una coppia crea le **proprie** liste — «Film da vedere», «Ristoranti
-- di Padova», «Regali», «Viaggi 2027» — e ci mette dentro quello che vuole.
--
-- ## Perché `lista_id` sta su `elemento_lista` e non su una tabella nuova
--
-- La tentazione era una tabella `voce_wishlist` pulita, separata dal resto.
-- Sarebbe stato **l'errore di B-19 fatto in schema**: `elemento_lista` ha già
-- la transizione `desiderato → fatto`, ed è quella transizione che alimenta
-- la creatura (D-15, trigger `punti_su_transizione_elemento`). Una seconda
-- tabella avrebbe richiesto un secondo trigger, cioè **due strade per guadagnare
-- punti** — e due strade che fanno la stessa cosa non restano uguali: divergono
-- al primo ritocco. Stessa ragione per le recensioni, che pendono già di qui
-- (`recensione.elemento_id`) con il vincolo «una per persona».
--
-- ⚠️ **`lista_id` è NULLABLE, e il null ha un significato preciso**: la riga
-- non sta in nessuna wishlist perché **è un luogo della mappa** (D-46: ogni
-- posto della mappa è anche una riga di lista). Non è un dato mancante da
-- riempire un giorno — è l'altra metà della tabella, e va lasciato in pace.
--
-- ## L'ordine delle mosse, che è la lezione di B-21
--
-- I film esistenti sono **dati veri di una coppia vera**. Aggiungere la colonna
-- e basta li lascerebbe senza casa: visibili in nessuna lista, cioè spariti
-- dall'app pur essendo ancora nel database — il modo peggiore di perdere dei
-- dati, perché non se ne accorge nessuno.
--
-- Quindi: **crea la colonna, sistema i dati, e solo allora hanno tutti una
-- casa.** Per ogni coppia che ha almeno un film si crea una lista «Film» e ci
-- si attaccano i suoi film. L'autore della lista è l'autore del film più
-- vecchio: qualcuno deve esserlo, e inventare un autore diverso da chi c'era
-- sarebbe peggio che sceglierne uno vero.
--
-- ⚠️ **Ed è ripetibile**: se questa migrazione fallisce a metà, rieseguirla
-- non deve morire su una policy già creata né duplicare le liste «Film».
-- `create policy` in Postgres non ha `if not exists` (è ciò che ha morso in
-- B-21), quindi ogni policy si butta prima di rifarla, e l'inserimento delle
-- liste è condizionato a `not exists`.
-- =============================================================================

-- --- La tabella ------------------------------------------------------------

create table if not exists public.lista (
  id        uuid primary key default gen_random_uuid(),
  coppia_id uuid not null references public.coppia (id) on delete cascade,
  autore_id uuid not null default auth.uid() references auth.users (id),
  nome      text not null check (length(btrim(nome)) between 1 and 60),
  -- Il colore della carta nell'hub. Sta qui e non nell'app perché è una scelta
  -- della coppia: se vivesse nel client, la stessa lista sarebbe di due colori
  -- diversi sui due telefoni, e il colore è precisamente ciò che serve a
  -- riconoscerla senza leggere.
  pastello  text not null default 'romantico'
              check (pastello in ('impegno', 'romantico', 'vacanza', 'speciale')),
  creata_il timestamptz not null default now()
);

create index if not exists lista_coppia_idx on public.lista (coppia_id, creata_il);

alter table public.lista enable row level security;

-- Le quattro policy, sullo stesso modello di `elemento_lista`.
--
-- ⚠️ **`update` e `delete` sono solo-autore**, ed è una scelta ereditata, non
-- una svista: chi ha creato la lista è l'unico che può cancellarla. Il costo è
-- lo stesso già accettato per i singoli elementi (se uno sbaglia, l'altro non
-- corregge); il beneficio qui è più grande, perché una lista è un **contenitore
-- che riempiono in due** — e cancellarla porta via anche ciò che ha messo
-- l'altro. Fra «chiunque può cancellare il lavoro di entrambi» e «solo chi l'ha
-- creata può», la seconda sbaglia dalla parte giusta.
drop policy if exists lista_select on public.lista;
create policy lista_select on public.lista
  for select using (public.e_membro_attivo(coppia_id) or autore_id = auth.uid());

drop policy if exists lista_insert on public.lista;
create policy lista_insert on public.lista
  for insert with check (public.e_membro_attivo(coppia_id) and autore_id = auth.uid());

drop policy if exists lista_update on public.lista;
create policy lista_update on public.lista
  for update using (autore_id = auth.uid()) with check (autore_id = auth.uid());

drop policy if exists lista_delete on public.lista;
create policy lista_delete on public.lista
  for delete using (autore_id = auth.uid());

-- --- Un tipo per le voci che non sono né film né luoghi ---------------------
--
-- Una lista dei desideri contiene quello che vuole la coppia: «prendere il
-- passaporto», «provare il ramen del posto nuovo», «regalo per mia sorella».
-- Non sono film e non sono luoghi, e chiamarle `film` per non aggiungere un
-- valore sarebbe una bugia scritta nello schema — quella che poi fa filtrare
-- male qualcun altro fra sei mesi.
--
-- ⚠️ **È un allargamento, non una stretta**, quindi non ha il problema di
-- B-21: nessuna riga esistente viola il vincolo nuovo, perché il vincolo nuovo
-- ammette tutto quello che ammetteva il vecchio più un valore. Le strette sono
-- quelle che vanno precedute dalla sistemazione dei dati; gli allargamenti no.
alter table public.elemento_lista
  drop constraint if exists elemento_lista_tipo_check;

alter table public.elemento_lista
  add constraint elemento_lista_tipo_check
  check (tipo in ('film', 'luogo', 'voce'));

-- --- Il legame -------------------------------------------------------------

alter table public.elemento_lista
  add column if not exists lista_id uuid references public.lista (id) on delete cascade;

create index if not exists elemento_lista_lista_idx on public.elemento_lista (lista_id);

-- --- I dati che c'erano prima ----------------------------------------------

-- Una lista «Film» per ogni coppia che ha almeno un film senza casa.
-- `not exists` la rende ripetibile: alla seconda esecuzione non ne nasce una
-- seconda.
insert into public.lista (coppia_id, autore_id, nome, pastello)
select
  e.coppia_id,
  -- L'autore del film più vecchio della coppia: `distinct on` + `order by`
  -- prende la prima riga per coppia secondo quell'ordine.
  e.autore_id,
  'Film',
  'romantico'
from (
  select distinct on (coppia_id) coppia_id, autore_id
  from public.elemento_lista
  where tipo = 'film' and lista_id is null
  order by coppia_id, creato_il asc
) e
where not exists (
  select 1 from public.lista l
  where l.coppia_id = e.coppia_id and l.nome = 'Film'
);

-- E ci si attaccano i film.
update public.elemento_lista e
set lista_id = l.id
from public.lista l
where e.tipo = 'film'
  and e.lista_id is null
  and l.coppia_id = e.coppia_id
  and l.nome = 'Film';

-- --- Cosa NON si fa, e perché ----------------------------------------------
--
-- ⚠️ **Non si mette `lista_id not null`.** Sarebbe la stretta ovvia dopo aver
-- sistemato i dati, e sarebbe sbagliata: i luoghi della mappa vivono in questa
-- tabella con `lista_id is null` per costruzione (vedi in testa). Un vincolo
-- che rende illegale metà della tabella non è una stretta, è un guasto.
--
-- ⚠️ **Non si tocca il trigger dei punti.** Continua a scattare sulla
-- transizione di `stato`, che è dove è sempre stato: una voce di wishlist
-- spuntata alimenta la creatura esattamente come un film già visto, senza che
-- una riga di codice nuova debba saperlo. È il motivo per cui si è riusato
-- `elemento_lista` invece di creare una tabella.
