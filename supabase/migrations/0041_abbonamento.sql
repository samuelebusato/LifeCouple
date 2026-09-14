-- =============================================================================
-- LifeCouple — 0041: il diritto a pagamento — sull'utente, proiettato sulla coppia
--
-- ✅ APPLICATA il 2026-09-14. (Questa riga ha detto «NON ANCORA APPLICATA»
--    fino al 2026-09-14 (3), a migrazione gia' viva da ore.) La prova che e'
--    passata non e' un messaggio di successo: e' che le coppie di prova di
--    tests/rls.avversariali.mjs ottengono «Insieme» SOLO passando dal webhook,
--    perche' nessun client riesce a scrivere questa tabella.
--
-- Prepara lo schema per D-133 (RevenueCat). ⚠️ Non introduce nessuna funzione
-- a pagamento e non concede niente a nessuno: crea il posto dove il diritto
-- vivra' e le regole che lo proteggono, PRIMA che esista il codice che lo
-- scrive. Il threat model della superficie e' in docs/threat-model.md §4-ter,
-- scritto anch'esso prima — e' la stessa disciplina della 0039.
--
-- ## Il verso e' una decisione, ed e' D-124
--
-- «L'abbonamento resta a chi l'ha pagato»: quindi il diritto si scrive
-- **sull'utente** e si proietta sulla coppia in **lettura**, mai il contrario.
--
-- 🔑 **Se stesse su `coppia` sarebbe piu' semplice e sbagliato.** Sciogliendo,
--    il diritto sparirebbe per entrambi — anche per chi ha pagato, e per un
--    periodo gia' pagato. E' la stessa domanda che D-16 ha sciolto per la
--    creatura, con risposta opposta perche' opposto e' l'oggetto: la creatura
--    e' DELLA coppia e non le sopravvive; l'abbonamento e' DI UNA PERSONA e le
--    sopravvive.
--
-- ## La proiezione e' calcolata, mai memorizzata
--
-- ⚠️ Una colonna `ha_insieme` su `coppia` sarebbe una copia, e una copia
--    diverge dal suo originale al primo scioglimento: resterebbe accesa dopo
--    che chi pagava e' uscito, e nessun errore comparirebbe. Quindi non esiste:
--    c'e' una funzione che la calcola ogni volta.
-- =============================================================================

-- --- 1. Dove vive il diritto --------------------------------------------------
create table if not exists public.abbonamento (
  utente_id     uuid primary key references auth.users (id) on delete cascade,
  attivo        boolean not null default false,
  prodotto      text,
  scade_il      timestamptz,
  -- Idempotenza e ordinamento degli eventi: un webhook puo' consegnare due
  -- volte, o fuori ordine (il rinnovo prima dell'acquisto). Si scrive solo se
  -- l'evento e' piu' recente di quello gia' registrato. E' lo stesso problema
  -- che `chiudi_round` (0020) ha gia' dovuto risolvere una volta.
  evento_id     text,
  evento_il     timestamptz,
  aggiornato_il timestamptz not null default now()
);

comment on table public.abbonamento is
  'Il diritto a «Insieme», intestato alla PERSONA che ha pagato (D-124). '
  'La scrive solo la Edge Function del webhook con service_role: il client la '
  'legge e non la tocca mai. La proiezione sulla coppia e coppia_ha_insieme().';

alter table public.abbonamento enable row level security;

-- --- 2. Le regole di accesso --------------------------------------------------
-- 🔑 UNA SOLA policy, ed e' di lettura. Non e' una dimenticanza: e' la riga
--    piu' importante della migrazione.
--
--    Con RLS attiva, cio' che nessuna policy permette e' vietato. Nessuna
--    policy di insert/update/delete significa che **il client non puo' in
--    nessun modo concedersi il diritto**, nemmeno con un token valido — e
--    l'unico che scrive resta il service_role, che scavalca la RLS per
--    costruzione. E' la stessa forma di `notifica_in_coda` (0039), dove zero
--    policy sono la mitigazione e non un buco.
create policy abbonamento_proprio_leggi on public.abbonamento
  for select using (utente_id = auth.uid());

-- ⚠️ Il partner NON legge l'abbonamento dell'altro. Sapere se e quando l'altro
--    paga non serve a nessuna schermata: cio' che serve e' se la COPPIA ha
--    «Insieme», ed e' la funzione qui sotto a dirlo — senza rivelare chi paga,
--    quanto scade, o se l'altro ha disdetto. E' TB-2 applicato al denaro.

-- --- 3. La proiezione sulla coppia --------------------------------------------
create or replace function public.coppia_ha_insieme(cid uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select
    -- Primo cancello: si puo' chiedere solo della PROPRIA coppia. Senza questa
    -- riga la funzione, essendo security definer, direbbe a chiunque se una
    -- coppia qualunque e' abbonata — un oracolo su dati altrui (TB-3).
    case when not e_membro_attivo(cid) then false
    else exists (
      select 1
      from membro_coppia m
      join abbonamento a on a.utente_id = m.utente_id
      where m.coppia_id = cid
        and m.uscito_il is null            -- solo membri ATTIVI: chi e' uscito
        and a.attivo                       -- non porta piu' il suo diritto qui
        and (a.scade_il is null or a.scade_il > now())
    )
    end;
$$;

comment on function public.coppia_ha_insieme(uuid) is
  'Vero se almeno un membro ATTIVO della coppia ha un abbonamento valido. '
  'Calcolata a ogni chiamata e mai memorizzata: una copia resterebbe accesa '
  'dopo che chi pagava e uscito, in silenzio.';

revoke execute on function public.coppia_ha_insieme(uuid) from public, anon;
grant execute on function public.coppia_ha_insieme(uuid) to authenticated;

-- =============================================================================
-- ## Come si verifica che sia passata — tests/abbonamento.mjs
--
--   1. Un client NON puo' inserire una riga in `abbonamento`, nemmeno la
--      propria: la insert deve essere fermata dalla RLS.
--   2. Un client NON puo' aggiornare la propria riga per mettersi `attivo`.
--   3. Un client non vede la riga del PARTNER (zero righe, non un errore).
--   4. `coppia_ha_insieme` su una coppia ALTRUI torna false, sempre — anche se
--      quella coppia e' davvero abbonata: e' il cancello di TB-3.
--   5. Con un abbonamento scaduto la funzione torna false.
--   6. 🔑 Con l'abbonato USCITO dalla coppia, la funzione torna false per chi
--      resta — ed e' l'asserzione che giustifica l'intera forma di questa
--      migrazione: e' il caso che una colonna memorizzata sbaglierebbe.
--
-- ⚠️ I punti 1, 2 e 6 non sono provabili finche' nessuno puo' scrivere la
--    tabella. Servira' la service_role, che NON entra in questo repo: la parte
--    che il client puo' esercitare si prova qui, il resto si prova dal
--    dashboard o dalla Edge Function, che dal 2026-09-14 esiste:
--    tests/webhook-abbonamento.mjs percorre proprio quella strada. Dichiarato,
--    non taciuto.
-- =============================================================================
