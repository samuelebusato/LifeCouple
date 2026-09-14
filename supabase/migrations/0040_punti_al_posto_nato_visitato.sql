-- =============================================================================
-- LifeCouple — 0040: i punti di un posto che nasce gia' visitato (B-64)
--
-- 🔴 NON ANCORA APPLICATA. Va letta prima di eseguirla.
--
-- ## Il difetto, riferito da un utente e non da un test
--
-- «Ho visitato un posto nuovo ma la mascotte non ha preso punti.» Ed era vero:
-- i 20 punti di un luogo li assegnava **un solo trigger**, `luogo_transizione`
-- della 0001, che e' un `before update of stato` e premia la condizione
-- `old.stato = 'desiderato' and new.stato = 'visitato'`.
--
-- ⚠️ **Ma un posto puo' nascere gia' visitato, e allora non c'e' nessun
--    UPDATE**: c'e' un INSERT, e un trigger `before update` non lo vede.
--    Succede da `collegaPosto` (lib/preferiti.ts): quando si aggancia un posto
--    a un elemento **gia' segnato come fatto**, la riga viene creata
--    direttamente con `stato = 'visitato'`.
--
-- 🔑 **La riga non e' sbagliata: e' il premio a non essere mai arrivato.** Il
--    posto risulta visitato, la mappa e' giusta, la lista e' giusta — manca
--    solo la riga in `punti_evento`, e quindi i punti. Un difetto che non
--    produce niente di visibile se non un numero che non sale, ed e' il motivo
--    per cui e' sopravvissuto: `tests/creatura.mjs` prova `derivaStadio`, cioe'
--    la funzione che **traduce** i punti, e nessun test prova che i punti
--    **arrivino**.
--
-- ## Perche' si corregge qui e non nel client
--
-- Cambiare `collegaPosto` perche' scriva `desiderato` e poi faccia l'UPDATE
-- sarebbe piu' rapido e sbagliato: correggerebbe **un chiamante**, lasciando la
-- regola dove non e'. Il commento di `lib/luoghi.ts` dice gia' la cosa giusta —
-- *«i punti li assegna un trigger sul database, non il client»* — e questa
-- migrazione la rende vera anche per la via dell'insert. Un domani un altro
-- punto del codice potra' creare un luogo gia' visitato senza doversene
-- ricordare.
--
-- ## Perche' non si possono fabbricare punti doppi
--
-- `assegna_punti` scrive prima in `punti_evento`, che ha `unique (coppia_id,
-- tipo, riferimento_id)`, e incrementa la creatura **solo se quella riga e'
-- entrata davvero**. E' la guardia anti-fabbricazione della D-15: per lo stesso
-- posto il premio esiste una volta sola, che ci si arrivi per INSERT o per
-- UPDATE, e togliere e rimettere la spunta non produce niente.
-- =============================================================================

-- --- 1. Il trigger che mancava ------------------------------------------------
-- `before insert` e non `after`, per la stessa ragione del gemello sull'update:
-- deve poter riempire `visitato_il`. Il valore di `new.id` e' gia' disponibile,
-- perche' i default di colonna sono applicati prima dei trigger BEFORE; e
-- scrivere in `punti_evento` prima che la riga di `luogo` esista non viola
-- nulla, perche' `riferimento_id` **non ha una foreign key** (punta a tabelle
-- diverse secondo il `tipo`) e le due scritture stanno nella stessa
-- transazione.
create or replace function public.punti_su_luogo_nato_visitato()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.stato = 'visitato' then
    -- ⚠️ La data la mette il database, come fa gia' la transizione: un posto
    -- nato visitato senza `visitato_il` sarebbe un posto visitato "mai", e
    -- nessuna schermata saprebbe dire quando.
    new.visitato_il := coalesce(new.visitato_il, now());
    perform assegna_punti(new.coppia_id, 'luogo_visitato', new.id, 20);
  end if;
  return new;
end;
$$;

drop trigger if exists luogo_nato_visitato on public.luogo;
create trigger luogo_nato_visitato
  before insert on public.luogo
  for each row execute function public.punti_su_luogo_nato_visitato();

comment on function public.punti_su_luogo_nato_visitato() is
  'B-64: i 20 punti per un luogo creato direttamente con stato = visitato. Il '
  'trigger della 0001 copre solo la transizione desiderato -> visitato, quindi '
  'i posti nati gia visitati non ne ricevevano nessuno.';

-- --- 2. I punti mai assegnati finora ------------------------------------------
-- 🔑 **Senza questo blocco la correzione varrebbe solo per il futuro**, e i
-- posti gia' nati visitati resterebbero senza premio per sempre: un gap noto e
-- lasciato aperto, che le regole di progetto non ammettono.
--
-- Il `returning` e' la parte che rende il recupero esatto: restituisce **solo**
-- le righe davvero inserite, quindi i posti gia' premiati per la via normale
-- non contano due volte. Se non c'e' niente da recuperare, non cambia niente.
with recuperati as (
  insert into public.punti_evento (coppia_id, tipo, riferimento_id, punti)
  select l.coppia_id, 'luogo_visitato', l.id, 20
  from public.luogo l
  where l.stato = 'visitato'
  on conflict (coppia_id, tipo, riferimento_id) do nothing
  returning coppia_id, punti
),
per_coppia as (
  select coppia_id, sum(punti)::integer as punti
  from recuperati
  group by coppia_id
)
update public.creatura c
set punti = c.punti + p.punti
from per_coppia p
where c.coppia_id = p.coppia_id;

-- --- 3. Le date mancanti ------------------------------------------------------
-- ⚠️ Non e' una stima e non e' un dato inventato: per un posto **creato gia'
-- visitato**, il momento in cui e' stato creato **e'** il momento in cui e'
-- stato segnato come visitato. Per i posti passati dalla transizione la data
-- c'e' gia', e questa riga non li tocca.
update public.luogo
set visitato_il = creato_il
where stato = 'visitato' and visitato_il is null;

-- =============================================================================
-- ## Come si verifica che sia passata — e non e' guardare la mascotte
--
--   1. Creare un luogo con `stato = 'visitato'` e controllare che in
--      `punti_evento` compaia la riga `luogo_visitato` per quel `riferimento_id`
--      e che `creatura.punti` sia salito di 20.
--   2. Crearne un altro e poi rimetterlo a `desiderato` e di nuovo a
--      `visitato`: i punti devono restare **quelli di una volta sola**. E' la
--      guardia della D-15, ed e' il caso che un trigger in piu' potrebbe rompere.
--   3. Un luogo creato con `stato = 'desiderato'` non deve dare nessun punto
--      finche' non viene visitato: il trigger nuovo non deve premiare l'insert
--      normale.
--   4. `visitato_il` non deve mai restare null su un luogo visitato.
-- =============================================================================
