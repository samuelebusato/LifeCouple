-- =============================================================================
-- 0025 — Le tre liste di partenza non si cancellano
--
-- «Film», «Viaggi» e «Ristoranti» non sono liste come le altre: sono **la
-- struttura** su cui poggiano due schermate. La mappa mostra i posti visitati e
-- dà per scontato che quelli desiderati abbiano una casa; la ricerca dei film
-- esiste perché esiste una lista di tipo `film`. Cancellarne una non toglie una
-- lista: toglie il **posto dove finiscono le cose**, e le funzioni che ci
-- puntano restano senza appoggio.
--
-- ## ⚠️ Questo contraddice una nota scritta in 0023, e va detto
--
-- In 0023 avevo scritto: *«La lista Film non è protetta dalla cancellazione, e
-- non è una dimenticanza… una lista che non si può togliere è un pezzo di
-- arredamento, non una cosa della coppia»*. Il ragionamento era coerente ma
-- **partiva da un prodotto diverso**: allora «Film» era l'unico default e i
-- luoghi vivevano ancora sulla mappa. Con D-70 le liste di partenza sono
-- diventate l'unico ingresso per i desideri, e una porta che si può murare non
-- è più una scelta di gusto.
--
-- 🔑 La lezione non è «avevo torto»: è che **una decisione giusta smette di
-- esserlo quando cambia ciò su cui poggiava**, e il modo di accorgersene è
-- rileggere le note vecchie invece di fidarsene. Quella nota resta in 0023 con
-- il rimando qui: cancellarla nasconderebbe il cambio di idea, che è
-- l'informazione più utile delle due.
--
-- ## Perché una colonna e non il nome
--
-- Riconoscerle da `nome in ('Film','Viaggi','Ristoranti')` sarebbe stato più
-- corto e sbagliato allo stesso modo di sempre: il nome è dell'utente, e una
-- lista rinominata perderebbe la protezione — oppure, peggio, una lista creata
-- a mano e chiamata «Viaggi» la guadagnerebbe. Il dato si **dichiara** (D-60).
-- =============================================================================

alter table public.lista
  add column if not exists predefinita boolean not null default false;

-- Le tre che ci sono già.
update public.lista
set predefinita = true
where nome in ('Film', 'Viaggi', 'Ristoranti') and predefinita = false;

-- E quelle che nasceranno.
create or replace function public.crea_liste_default()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  insert into lista (coppia_id, autore_id, nome, pastello, tipo, predefinita) values
    (new.id, auth.uid(), 'Film',       'romantico', 'film',  true),
    (new.id, auth.uid(), 'Viaggi',     'vacanza',   'luogo', true),
    (new.id, auth.uid(), 'Ristoranti', 'speciale',  'luogo', true);
  return new;
end;
$$;

-- --- Il divieto sta nel database, non nell'interfaccia ---------------------
--
-- 🔑 Nascondere il bottone «Elimina» **non è una protezione**: è un
-- suggerimento. Chiunque parli all'API con un token valido può cancellare la
-- riga lo stesso, ed è precisamente il modello di attaccante che il threat
-- model descrive (TB-1: *il telefono è ostile per definizione*). Il bottone si
-- toglie perché è giusto per chi usa l'app; la regola vive qui.
--
-- ⚠️ **Un trigger e non una policy.** Una policy di `delete` più stretta
-- filtrerebbe la riga in silenzio — zero righe toccate, `error: null` — che è
-- esattamente il difetto di B-23: l'app direbbe «fatto» e la lista resterebbe.
-- Un'eccezione invece **arriva al client come errore**, con un messaggio che si
-- può tradurre in una frase. *Quando il rifiuto va spiegato, non va nascosto in
-- un filtro.*
create or replace function public.vieta_cancellazione_lista_predefinita()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.predefinita then
    raise exception 'lista-predefinita'
      using hint = 'Le liste di partenza non si eliminano.';
  end if;
  return old;
end;
$$;

drop trigger if exists lista_no_delete_predefinita on public.lista;
create trigger lista_no_delete_predefinita
  before delete on public.lista
  for each row execute function public.vieta_cancellazione_lista_predefinita();

-- --- Cosa NON si fa ---------------------------------------------------------
--
-- ⚠️ **Non si vieta di rinominarle.** «Ristoranti» può diventare «Dove mangiare
-- bene» senza che niente si rompa: la protezione è su `predefinita`, che il
-- nome non tocca. Vietare anche la rinomina sarebbe stato irrigidire due cose
-- avendo bisogno di irrigidirne una.
--
-- ⚠️ **Non si vieta di svuotarle.** Le voci dentro restano cancellabili una per
-- una: è la lista a essere struttura, non il suo contenuto.
