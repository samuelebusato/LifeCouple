-- =============================================================================
-- LifeCouple — 0047: il diritto è della PERSONA, non della coppia (B-75)
--
-- 🔴 NON ANCORA APPLICATA. Si applica dal pannello Supabase (SQL Editor).
--
-- ## Cosa era sbagliato
--
-- `coppia_ha_insieme(cid)` (0041) risponde alla domanda *«questa coppia ha
-- Insieme?»*, e l'app la usava come **unico** cancello. Ma **D-124** dice
-- un'altra cosa: il diritto è della **persona** e si *proietta* sulla coppia.
--
-- 🔴 **Conseguenza, incontrata davvero il 2026-09-15**: chi paga senza avere
--    ancora un partner non sblocca niente. L'abbonamento è suo, valido,
--    registrato — e le funzioni restano chiuse, perché la domanda che l'app
--    faceva non lo riguardava.
--
-- ⚠️ *E il modo di fallire era il peggiore*: `coppia_ha_insieme` vuole un
--    `cid`, quindi senza coppia l'app non chiamava il database **nemmeno una
--    volta**. Nessun errore, nessun log, solo un muro che non se ne va. Ci
--    sono volute due sonde per vederlo.
--
-- ## Cosa fa questa funzione
--
-- Risponde a *«**io** ho Insieme?»*, ed è vera in due casi:
--   1. chi chiama ha un abbonamento proprio, valido;
--   2. oppure è in una coppia dove **un membro attivo** ce l'ha (la proiezione
--      di D-124, che è ciò che fa valere un pagamento per due).
--
-- 🔑 **Non prende argomenti, e questo la rende più sicura della precedente.**
--    `coppia_ha_insieme(cid)` è `security definer` e aveva bisogno di un
--    cancello esplicito (`e_membro_attivo`) per non diventare un oracolo sugli
--    abbonamenti altrui (TB-3). Qui non c'è niente da chiedere su qualcun
--    altro: il soggetto è sempre `auth.uid()`.
--
-- ## Cosa NON cambia
--
-- ✅ `coppia_ha_insieme(uuid)` resta, intatta e col suo cancello: la usano i
--    trigger della `0042` per decidere i limiti del piano gratuito, e lì la
--    domanda giusta **è** quella sulla coppia — il tetto delle foto vale per
--    l'album condiviso, non per chi lo carica.
-- =============================================================================

create or replace function public.ho_insieme()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    -- 1. Il diritto proprio: vale anche senza nessuna coppia (D-124).
    select 1
    from abbonamento a
    where a.utente_id = auth.uid()
      and a.attivo
      and (a.scade_il is null or a.scade_il > now())
  ) or exists (
    -- 2. La proiezione: un membro attivo della mia coppia ce l'ha.
    --    ⚠️ Doppio giro su `membro_coppia` di proposito: il primo trova le MIE
    --    coppie attive, il secondo i loro membri attivi. Senza il vincolo
    --    `uscito_il is null` su entrambi, chi è uscito continuerebbe a portare
    --    il suo diritto dentro una coppia che ha lasciato.
    select 1
    from membro_coppia mio
    join membro_coppia altro on altro.coppia_id = mio.coppia_id
    join abbonamento a on a.utente_id = altro.utente_id
    where mio.utente_id = auth.uid()
      and mio.uscito_il is null
      and altro.uscito_il is null
      and a.attivo
      and (a.scade_il is null or a.scade_il > now())
  );
$$;

comment on function public.ho_insieme() is
  'B-75 / D-124: vero se CHI CHIAMA ha Insieme — per diritto proprio, oppure '
  'per proiezione da un membro attivo della sua coppia. Sostituisce '
  'coppia_ha_insieme() come cancello dell''app: quella resta per i limiti '
  'del piano gratuito (0042), dove la domanda giusta e'' sulla coppia.';

revoke execute on function public.ho_insieme() from public, anon;
grant execute on function public.ho_insieme() to authenticated;

-- =============================================================================
-- ## Come si verifica
--
--   1. Un utente SENZA coppia e SENZA abbonamento: false.
--   2. Lo stesso utente dopo che il webhook gli concede il diritto: **true**,
--      ed e' il caso che la 0041 non copriva.
--   3. Un utente senza abbonamento proprio, ma in coppia con chi ce l'ha: true.
--   4. Dopo lo scioglimento, chi resta senza aver pagato: false.
--   5. Con abbonamento scaduto: false.
--
-- ⚠️ Chiamata fuori da una sessione utente `auth.uid()` e' null, e la funzione
--    torna false: non e' un difetto, e' l'unico comportamento sensato.
-- =============================================================================
