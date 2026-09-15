-- =============================================================================
-- LifeCouple — 0049: lo scioglimento si annuncia, invece di farsi scoprire
--
-- 🔴 NON ANCORA APPLICATA. Si applica dal pannello Supabase (SQL Editor).
--
-- ## Il difetto, che era dichiarato e non costruito
--
-- `threat-model.md` TB-2, categoria **T**, riga «Scioglimento»:
--
--   minaccia      un partner scioglie la coppia da solo e l'altro perde tutto
--                 senza saperlo
--   mitigazione   «lo scioglimento revoca, non cancella; **notifica esplicita
--                 a entrambi**; ciascuno conserva cio' di cui e' autore»
--   stato         **parziale** — la revoca e la conservazione sono verificate,
--                 🔴 *la notifica esplicita a entrambi non esiste*
--
-- ⚠️ **Oggi chi subisce lo scioglimento se ne accorge trovando l'app vuota**:
--    mappa, liste e creatura spariscono, i contenuti condivisi non si aprono
--    piu', e nessuno gli dice perche'. E' *esattamente* cio' che quella riga
--    del modello voleva evitare, rimasto scritto per un mese.
--
-- ## Perche' a ENTRAMBI, e non solo a chi la subisce
--
-- Chi scioglie ha appena premuto un pulsante: sembra rumore avvisarlo. Ma la
-- notifica raggiunge **tutti i dispositivi registrati di quella persona**, non
-- quello da cui e' partito il comando.
--
-- 🔑 *Se qualcuno scioglie la coppia da una sessione che non e' sua* — il
--    telefono lasciato aperto, un accesso non revocato — **la ricevuta arriva
--    sull'altro dispositivo del legittimo proprietario**, che e' l'unico modo
--    in cui potrebbe accorgersene. E' la stessa ragione per cui le banche
--    mandano l'avviso di un bonifico a chi l'ha appena disposto.
--
-- ## Il consenso: questo tipo ha il suo, ed e' acceso di default
--
-- ⚠️ **Non ignora le preferenze, e la ragione e' documentale.** L'informativa
--    pubblicata dichiara: *«le notifiche arrivano solo se le accendi, e le
--    spegni quando vuoi con un tocco»*. Un tipo che parte comunque renderebbe
--    **falsa una dichiarazione resa agli utenti** — la stessa forma di B-60,
--    B-62 e B-79, tre volte gia' viste in questo progetto.
--
-- 🔑 *La difesa di chi le tiene spente non e' una notifica che non puo'
--    spegnere: e' che l'app glielo dica quando la apre.* Quella e' una
--    schermata, non una notifica, ed e' il complemento dichiarato di questa
--    migrazione (backlog §6).
--
-- ## L'ordine dentro sciogli_coppia(), da cui questa migrazione dipende
--
-- La 0004 fa tre cose in fila, e questa migrazione si appoggia a **tutte e tre
-- nell'ordine in cui stanno**:
--
--   1. `insert into registro_azioni` ...............  l'atto, mentre si e' membri
--   2. `update membro_coppia set uscito_il = now()` .  i due escono
--   3. `update coppia set stato = 'sciolta'` ........  lo stato cambia  <-- qui
--
-- 🔴 **Il trigger sta sul passo 3 e legge cio' che il passo 2 ha appena
--    scritto.** Se quei due venissero invertiti, il filtro `uscito_il >=
--    sciolta_il` non troverebbe nessuno **e nessun errore lo direbbe**:
--    `sciogli_coppia()` continuerebbe a rispondere che e' andato tutto bene,
--    con la coda vuota.
--
-- ✅ Per questo la dipendenza e' **misurata**, non sperata: vedi §3.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Il tipo nuovo, nel vincolo della coda
-- ---------------------------------------------------------------------------
alter table public.notifica_in_coda
  drop constraint if exists notifica_in_coda_tipo_check;

alter table public.notifica_in_coda
  add constraint notifica_in_coda_tipo_check
  check (tipo in ('luogo_del_partner', 'ricordi', 'inviti_a_tornare', 'scioglimento'));

-- ---------------------------------------------------------------------------
-- 2. Il consenso, acceso di default
--
-- ⚠️ `default true` a differenza di `inviti_a_tornare` (default false): quello
--    e' ingaggio — si chiede il permesso — questo e' una comunicazione di
--    servizio su un fatto che riguarda i propri dati. Chi non la vuole la
--    spegne, ma non deve doverla accendere per essere avvisato.
-- ---------------------------------------------------------------------------
alter table public.preferenze_notifiche
  add column if not exists scioglimento boolean not null default true;

comment on column public.preferenze_notifiche.scioglimento is
  'Avviso quando la coppia viene sciolta. Acceso di default: e'' una comunicazione di servizio, non ingaggio (0049).';

-- ---------------------------------------------------------------------------
-- 3. Dove ci si aggancia, e perche' NON al registro delle azioni
--
-- 🔴 **La prima stesura di questa migrazione metteva il trigger su
--    `registro_azioni`, ed era un BUCO.** La 0004 scrive li' l'atto prima di
--    far uscire i membri, quindi sembrava il punto perfetto. Ma la policy
--    `registro_insert` (0001) dice:
--
--      for insert with check (e_membro_attivo(coppia_id) and autore_id = auth.uid())
--
--    ⚠️ *Cioe' *qualunque membro attivo* puo' scrivere una riga nel registro.*
--    Con il trigger li' sopra, bastava un insert a mano con
--    `azione: 'scioglimento'` per far arrivare al partner **«lo spazio
--    condiviso e' stato sciolto» mentre la coppia e' viva** — e per lasciare
--    nel registro append-only la traccia di uno scioglimento mai avvenuto.
--
-- 🔑 **E' TB-2 in forma pura**: non fa perdere dati a nessuno, fa arrivare a
--    una persona un messaggio angosciante su una cosa che non e' successa.
--    *Un trigger e' sicuro quanto la tabella che lo innesca, e quella tabella
--    e' scrivibile dall'utente per progetto — e' un registro, non uno stato.*
--
-- ✅ **Si scatta invece su `coppia`, quando lo stato passa a «sciolta».**
--    `coppia` ha **una sola policy, di `select`** (0001): nessun client puo'
--    inserirla, aggiornarla o cancellarla. Con RLS attiva l'assenza di policy
--    e' un divieto, quindi quello stato **puo' cambiarlo solo
--    `sciogli_coppia()`**, che e' `security definer`. *Il fatto che innesca la
--    notifica diventa impossibile da fabbricare dal telefono.*
--
-- ⚠️ **Cambia anche chi sono i destinatari, e va detto**: qui i membri sono
--    gia' usciti — `sciogli_coppia()` imposta `uscito_il` **prima** di marcare
--    la coppia. Quindi non si cercano i membri *attivi* ma quelli **usciti con
--    questo scioglimento** (`uscito_il >= sciolta_il`). 🔑 *Il filtro non e'
--    un dettaglio: senza, un ex membro uscito mesi prima riceverebbe l'avviso
--    della fine di una coppia che aveva gia' lasciato.*
-- ---------------------------------------------------------------------------
create or replace function public.accoda_scioglimento(cid uuid, quando timestamptz, chi_ha_sciolto uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  m record;
begin
  -- 🔑 Un giro su chi e' uscito **con questo** scioglimento: chi lo subisce e
  --    chi l'ha fatto. I due leggono testi diversi, e a distinguerli e' `autore`.
  for m in
    select utente_id
    from membro_coppia
    where coppia_id = cid
      and uscito_il is not null
      and uscito_il >= quando
  loop
    insert into notifica_in_coda (destinatario_id, tipo, coppia_id, dati, chiave_dedup)
    values (
      m.utente_id,
      'scioglimento',
      cid,
      jsonb_build_object('autore', (m.utente_id = chi_ha_sciolto)),
      -- ⚠️ Una coppia si scioglie **una volta sola**, ma la chiave include
      --    comunque il destinatario: senza, il secondo insert del giro
      --    colliderebbe col primo e uno dei due non riceverebbe niente.
      'scioglimento:' || cid::text || ':' || m.utente_id::text
    )
    on conflict (chiave_dedup) do nothing;
  end loop;
end;
$$;

revoke execute on function public.accoda_scioglimento(uuid, timestamptz, uuid) from public, anon, authenticated;

comment on function public.accoda_scioglimento(uuid, timestamptz, uuid) is
  'Accoda l''avviso di scioglimento a chi e'' uscito con quello scioglimento. Chiamata solo dal trigger su coppia (0049).';

create or replace function public.notifica_scioglimento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- ⚠️ `auth.uid()` e' ancora quello di chi ha chiamato `sciogli_coppia()`:
  --    `security definer` cambia i privilegi, non l'identita' del JWT. Se un
  --    domani lo scioglimento partisse da un lavoro di servizio senza utente,
  --    `auth.uid()` sarebbe nullo e **nessuno dei due risulterebbe autore** —
  --    cioe' entrambi riceverebbero il testo di chi lo subisce, che e' il
  --    modo giusto di sbagliare.
  perform public.accoda_scioglimento(new.id, new.sciolta_il, auth.uid());
  return new;
end;
$$;

drop trigger if exists registro_notifica_scioglimento on public.registro_azioni;
drop trigger if exists coppia_notifica_scioglimento on public.coppia;

-- 🔑 `when` nella dichiarazione e non un `if` nel corpo: la condizione la
--    valuta Postgres prima di chiamare la funzione, e resta visibile in
--    `\d+ coppia` a chi guarda la tabella invece del file.
create trigger coppia_notifica_scioglimento
  after update of stato on public.coppia
  for each row
  when (new.stato = 'sciolta' and old.stato is distinct from 'sciolta')
  execute function public.notifica_scioglimento();

comment on function public.notifica_scioglimento() is
  'Accoda l''avviso di scioglimento quando coppia.stato passa a «sciolta». Si scatta su coppia e non su registro_azioni perche'' coppia ha la sola policy di select: quello stato lo cambia solo sciogli_coppia(). Misurato da tests/notifica-scioglimento.mjs (0049).';
