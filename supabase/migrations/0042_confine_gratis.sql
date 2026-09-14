-- =============================================================================
-- LifeCouple — 0042: il confine gratis/a pagamento, IMPOSTO (D-135)
--
-- 🔴 NON ANCORA APPLICATA. Va letta prima di eseguirla.
--
-- ## Perche' questi limiti stanno qui e non nell'interfaccia
--
-- 🔑 **Un limite disegnato e non imposto e' una porta chiusa con un cartello.**
--    L'app puo' nascondere il bottone «aggiungi un'altra foto»; chi parla
--    direttamente all'API non vede nessun bottone. E' la stessa lezione del
--    tetto foto (D-22) e di `assegna_punti` (D-15), che sono trigger e non
--    controlli nel client — e il motivo per cui questo progetto non ha un
--    backend proprio: l'autorizzazione vive nel database.
--
-- ⚠️ L'interfaccia dovra' comunque raccontarli bene. Ma raccontarli e imporli
--    sono due lavori diversi, e questo e' il secondo.
--
-- ## Il confine (D-135, decisione dell'utente del 2026-09-14)
--
--   GRATIS      calendario ed eventi · UNA foto per evento · UNA partita al
--               giorno, per coppia
--   A PAGAMENTO mappa e luoghi · liste · creatura · foto oltre la prima ·
--               foto sciolte in galleria · giochi oltre il primo del giorno
--
-- ⚠️ **«Le foto sciolte sono a pagamento» e' un'assunzione dichiarata**, non
--    una parola dell'utente: senza di essa il limite per evento si scavalca
--    caricando dalla galleria, che e' una seconda via (`galleria.tsx`). Se
--    l'intenzione era diversa, si cambia la condizione di `foto_entro_il_piano`
--    e basta.
--
-- ## Cosa questa migrazione NON tocca, e non e' una dimenticanza
--
-- ✅ **Mappa, liste e creatura non hanno nessun trigger qui.** Non sono limiti
--    di quantita': sono schermate. Si chiudono nell'app, e cio' che il
--    database gia' garantisce (RLS per coppia) resta identico. 🔑 *Mettere un
--    muro sulla LETTURA dei propri luoghi significherebbe rendere illeggibili
--    dati gia' inseriti da chi ha smesso di pagare — e quello, a differenza
--    del resto, e' tenere in ostaggio i ricordi di qualcuno.*
--
-- ✅ **Nessun limite tocca la cancellazione, la lettura o l'esportazione.**
--    Sono un obbligo (artt. 15 e 20 GDPR) e `esportaMieiDati` esiste gia'.
-- =============================================================================

-- --- 1. Una foto per evento, e nessuna foto sciolta ---------------------------
create or replace function public.foto_entro_il_piano()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  quante integer;
begin
  -- Chi ha «Insieme» non incontra nessun limite qui: resta solo il tetto di
  -- spazio della D-22, che vale per tutti ed e' un'altra cosa.
  if coppia_ha_insieme(new.coppia_id) then
    return new;
  end if;

  if new.evento_id is null then
    raise exception 'Con il piano gratuito le foto si aggiungono a un evento.'
      using errcode = 'check_violation';
  end if;

  select count(*) into quante
  from foto
  where evento_id = new.evento_id;

  if quante >= 1 then
    raise exception 'Con il piano gratuito ogni evento tiene una foto.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists foto_piano on public.foto;
create trigger foto_piano
  before insert on public.foto
  for each row execute function public.foto_entro_il_piano();

comment on function public.foto_entro_il_piano() is
  'D-135: nel piano gratuito una foto per evento, e nessuna foto senza evento. '
  'Imposto qui e non nell app perche un limite solo disegnato si scavalca '
  'parlando direttamente all API.';

-- --- 2. Una partita al giorno, PER COPPIA -------------------------------------
-- 🔑 **Per coppia e non per persona** (decisione dell'utente, 2026-09-14): le
--    partite sono a due, quindi un limite per persona ne darebbe due alla
--    coppia — e «un pagamento vale per due» vale anche al contrario.
create or replace function public.partita_entro_il_piano()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  quante integer;
begin
  if coppia_ha_insieme(new.coppia_id) then
    return new;
  end if;

  -- ⚠️ Il giorno e' quello UTC, come per i ricordi «N anni fa» (0039): nessun
  --    fuso e' memorizzato. Chi vive molto a est o a ovest vede la partita
  --    gratuita rinnovarsi a un'ora che non e' mezzanotte sua. E' un difetto
  --    noto e dichiarato, non una svista — e si chiude con la stessa colonna
  --    `fuso` che oggi nessuna schermata sa chiedere.
  select count(*) into quante
  from partita
  where coppia_id = new.coppia_id
    and creata_il >= date_trunc('day', now());

  if quante >= 1 then
    raise exception 'Con il piano gratuito c e una partita al giorno.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists partita_piano on public.partita;
create trigger partita_piano
  before insert on public.partita
  for each row execute function public.partita_entro_il_piano();

comment on function public.partita_entro_il_piano() is
  'D-135: nel piano gratuito una partita al giorno PER COPPIA (non per '
  'persona: le partite sono a due). Giorno in UTC, come i ricordi della 0039.';

-- =============================================================================
-- ## Come si verifica — tests/confine.mjs
--
--   1. Senza «Insieme»: la PRIMA foto di un evento entra.
--   2. Senza «Insieme»: la SECONDA foto dello stesso evento e' rifiutata.
--   3. Senza «Insieme»: una foto SENZA evento e' rifiutata.
--   4. Senza «Insieme»: la PRIMA partita del giorno entra.
--   5. Senza «Insieme»: la SECONDA partita dello stesso giorno e' rifiutata.
--   6. 🔑 Con «Insieme» attivo, tutte e cinque le cose sopra sono permesse —
--      ed e' l'asserzione che dimostra che il muro ha una porta, non solo un
--      muro. Richiede la Edge Function del webhook per accendere il diritto.
--
-- ⚠️ Il punto 6 e' l'unico che non si puo' esercitare con la sola chiave
--    publishable: serve scrivere `abbonamento`, e nessun client puo' (0041).
--    Si prova insieme al webhook, come si e' fatto il 2026-09-14.
-- =============================================================================
