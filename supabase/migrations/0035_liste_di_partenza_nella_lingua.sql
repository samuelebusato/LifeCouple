-- =============================================================================
-- 0035 — Le liste di partenza parlano la lingua del telefono
--
-- «Film», «Viaggi» e «Ristoranti» nascono dal trigger di 0025 con un nome
-- italiano **scritto nel database**. L'app è bilingue da D-18 e prende la lingua
-- dal dispositivo invece che da un selettore (D-24), ma queste tre stringhe non
-- passavano da `lib/i18n.ts` per una ragione che sembrava ovvia: non sono testo
-- dell'interfaccia, sono **dati**.
--
-- 🔑 Il risultato era il caso peggiore di tutti: chi ha il telefono in inglese
-- vedeva l'app intera in inglese e **tre carte in italiano**. Non un errore —
-- niente falliva, niente compariva nei log — solo un pezzo di prodotto che
-- diceva «questa app non è stata pensata per te». *Una stringa che vive nel
-- database esce dal perimetro della traduzione senza che nessuno decida che
-- debba uscirne.*
--
-- ## Perché una colonna nuova e non il `tipo` che c'è già
--
-- `tipo` vale `film` | `voce` | `luogo`, e **non distingue Viaggi da
-- Ristoranti**: sono tutte e due `luogo` (0024). Tradurre a partire da `tipo`
-- avrebbe dato lo stesso nome a due carte diverse — cioè avrebbe sostituito un
-- difetto visibile con uno che sembra funzionare.
--
-- ## E perché non tradurre a partire dal nome
--
-- È esattamente la trappola che 0025 ha già descritto per la protezione, e vale
-- identica qui: **il nome è dell'utente**. Riconoscerle da
-- `nome in ('Film','Viaggi','Ristoranti')` vorrebbe dire che una lista creata a
-- mano e chiamata «Viaggi» si tradurrebbe da sola in «Travel», e che una lista
-- di partenza rinominata smetterebbe di essere riconosciuta.
--
-- Il dato si **dichiara** (D-60): `chiave` dice *quale* delle tre è una lista, e
-- sopravvive a qualunque cosa succeda al suo nome.
-- =============================================================================

alter table public.lista
  add column if not exists chiave text
  check (chiave is null or chiave in ('film', 'viaggi', 'ristoranti'));

-- --- Le tre che ci sono già --------------------------------------------------
--
-- ⚠️ **Questo riempimento riconosce le righe dal nome**, cioè fa la cosa che il
-- commento qui sopra ha appena vietato. La contraddizione è solo apparente, e la
-- differenza è fra una regola *permanente* e un riempimento *una tantum*:
--
--   - queste righe le ha seminate il **nostro** trigger (0025), non un utente;
--   - `rinomina` esiste in `lib/liste.ts` ma **non è collegata a nessun comando
--     dell'interfaccia**, quindi ad oggi nessuna lista di partenza può avere un
--     nome diverso da quello seminato;
--   - e il filtro richiede anche `predefinita`, che una lista creata a mano non
--     ha.
--
-- 🔑 Dopo questo `update` il nome non serve più a riconoscere niente: da qui in
-- avanti risponde `chiave`. *Un riempimento può appoggiarsi a un indizio che una
-- regola non deve usare, purché smetta di servire subito dopo.*
update public.lista
set chiave = case nome
               when 'Film' then 'film'
               when 'Viaggi' then 'viaggi'
               when 'Ristoranti' then 'ristoranti'
             end
where predefinita
  and chiave is null
  and nome in ('Film', 'Viaggi', 'Ristoranti');

-- --- E quelle che nasceranno -------------------------------------------------
create or replace function public.crea_liste_default()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  insert into lista (coppia_id, autore_id, nome, pastello, tipo, predefinita, chiave) values
    (new.id, auth.uid(), 'Film',       'romantico', 'film',  true, 'film'),
    (new.id, auth.uid(), 'Viaggi',     'vacanza',   'luogo', true, 'viaggi'),
    (new.id, auth.uid(), 'Ristoranti', 'speciale',  'luogo', true, 'ristoranti');
  return new;
end;
$$;

-- --- Una sola per tipo, per coppia -------------------------------------------
--
-- Non è una raffinatezza: `chiave` serve a **scegliere una traduzione**, e due
-- righe con la stessa chiave nella stessa coppia darebbero due carte con lo
-- stesso nome — di nuovo un difetto che non fallisce, si guarda soltanto. Il
-- vincolo è parziale perché le liste della coppia hanno `chiave is null` e
-- devono poter essere quante si vuole.
create unique index if not exists lista_chiave_unica_per_coppia
  on public.lista (coppia_id, chiave)
  where chiave is not null;

-- --- Cosa NON cambia ---------------------------------------------------------
--
-- ⚠️ **Il nome nel database resta italiano, e non si traduce mai alla scrittura.**
-- La traduzione avviene solo al momento di **mostrare** (`nomeLista` in
-- `lib/liste.ts`). Scriverla nel database vorrebbe dire che due partner con il
-- telefono in due lingue diverse si contendono la stessa riga: chi apre per
-- ultimo riscrive il nome all'altro. *La lingua è di chi guarda, non del dato.*
--
-- ⚠️ **Rinominare resta permesso** (0025). Una lista di partenza che ha ricevuto
-- un nome scelto dalla coppia mostra quello, in tutte le lingue: `nomeLista`
-- traduce solo finché il nome è ancora quello seminato.
