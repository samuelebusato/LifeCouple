-- =============================================================================
-- 0036 — Le liste di partenza che non erano marcate come tali (B-57)
--
-- 🔴 **Il difetto**: su una coppia reale le tre liste di partenza hanno
-- `predefinita = false`. Da lì discende tutto, e in tre punti diversi:
--
--   1. l'interfaccia mostra «Elimina» (lo nasconde solo se `predefinita`);
--   2. il trigger di `0025` **non blocca** la cancellazione (controlla
--      `old.predefinita`), quindi le tre liste erano davvero cancellabili;
--   3. il riempimento della `0035` filtra `where predefinita`, quindi non le ha
--      toccate: `chiave` è rimasta `null` e i nomi non si traducevano.
--
-- 🔑 **Una causa sola, tre sintomi in tre strati diversi** — e per settimane
-- nessuno dei tre si è manifestato come un errore. La protezione scritta in
-- `0025` esisteva, era applicata, ed era **inerte**: il trigger c'era e la
-- condizione che lo attiva non era mai vera. *Una guardia che non ha mai avuto
-- occasione di dire di no è indistinguibile da una guardia che funziona.*
--
-- ## Perché il riempimento di `0025` non è bastato
--
-- Diceva `where nome in ('Film','Viaggi','Ristoranti')`. Su queste righe non ha
-- trovato nulla — o perché i nomi non combaciano esattamente (una rinomina, uno
-- spazio, una maiuscola), o perché lo statement non è stato eseguito quando la
-- migrazione fu applicata a mano. **Non serve sapere quale delle due**: serve un
-- riconoscimento che non dipenda dal nome, ed è il motivo per cui questa
-- migrazione non lo usa come segnale principale.
--
-- ## Il segnale giusto è `tipo`, e regge meglio del nome
--
-- `crea` in `lib/liste.ts` inserisce **senza `tipo`**, quindi ogni lista creata
-- dalla coppia nasce `voce`. Ne segue che:
--
--   - `tipo = 'film'`  ⇒ è **per forza** la lista Film di partenza;
--   - `tipo = 'luogo'` ⇒ è per forza una delle due liste di luoghi.
--
-- Fra Viaggi e Ristoranti distingue il `pastello` seminato (`vacanza` contro
-- `speciale`), col nome come conferma. ⚠️ *Il nome resta nell'espressione ma in
-- seconda battuta: qui serve a riconoscere, non a decidere da solo.*
-- =============================================================================

with candidata as (
  select
    id,
    coppia_id,
    creata_il,
    case
      when tipo = 'film'                              then 'film'
      when nome = 'Viaggi'                            then 'viaggi'
      when nome = 'Ristoranti'                        then 'ristoranti'
      when tipo = 'luogo' and pastello = 'vacanza'    then 'viaggi'
      when tipo = 'luogo' and pastello = 'speciale'   then 'ristoranti'
    end as k
  from public.lista
  where chiave is null
),
-- ⚠️ **Una sola riga per coppia e per chiave**, la più vecchia. Se una coppia
-- avesse due liste che rispondono allo stesso segnale, marcarle entrambe
-- violerebbe l'indice unico di `0035` e farebbe fallire tutta la migrazione. La
-- più vecchia è quella seminata: le altre sono venute dopo.
scelta as (
  select distinct on (coppia_id, k) id, coppia_id, k
  from candidata
  where k is not null
  order by coppia_id, k, creata_il asc
)
update public.lista l
set predefinita = true,
    chiave      = s.k
from scelta s
where l.id = s.id
  -- E non si tocca una coppia che quella chiave ce l'ha già: questa migrazione
  -- deve poter girare due volte senza fare danni.
  and not exists (
    select 1 from public.lista x
    where x.coppia_id = s.coppia_id and x.chiave = s.k
  );

-- --- Come si verifica che abbia funzionato -----------------------------------
--
-- ⚠️ **Non basta guardare l'app**: senza `chiave` i nomi restano italiani, che è
-- esattamente ciò che si vede anche quando tutto è a posto e il telefono è in
-- italiano. Il controllo che distingue i due casi è questo, e deve dare tre
-- righe con `predefinita = true` e `chiave` piena:
--
--   select nome, tipo, pastello, predefinita, chiave
--   from lista
--   order by creata_il;
--
-- 🔑 *Il sintomo di questo difetto è identico al funzionamento corretto visto
-- dalla lingua sbagliata.* È la ragione per cui è sopravvissuto tanto.
