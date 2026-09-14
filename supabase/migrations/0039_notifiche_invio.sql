-- =============================================================================
-- LifeCouple — 0039: l'invio delle notifiche — la coda, il trigger, la lingua
--
-- 🔴 NON ANCORA APPLICATA. Va letta prima di eseguirla.
--
-- La 0038 ha creato dove vivono i token e i consensi. Qui c'e' cio' che
-- **fa partire** una notifica. L'invio vero — la chiamata al servizio push di
-- Expo — resta fuori dal database, nella Edge Function `invia-notifiche`.
--
-- ## La decisione che regge tutto il resto: una CODA, non una chiamata
--
-- Il backlog lo chiedeva per nome: il trigger su `luogo` **non** deve chiamare
-- la rete. Se lo facesse, segnare un posto come visitato smetterebbe di
-- riuscire ogni volta che il servizio push e' lento o irraggiungibile — cioe'
-- un dato della coppia andrebbe perso per colpa di una cortesia.
--
-- 🔑 Quindi il trigger scrive **una riga in una tabella**, che e' l'unica cosa
--    che sa fare bene e in transazione. Un lavoro periodico la svuota. Fra i
--    due c'e' `notifica_in_coda`, e i vantaggi non sono solo di disaccoppiamento:
--    - un invio fallito si **ritenta**, invece di sparire;
--    - il consenso si verifica **al momento dell'invio**, non a quello
--      dell'evento (vedi sotto: e' una differenza giuridica, non tecnica);
--    - lo scioglimento avvenuto **fra** l'evento e l'invio fa tacere la
--      notifica, che e' precisamente cio' che D-128 ha deciso.
--
-- ⚠️ **Il consenso si guarda quando si spedisce, non quando si accoda.** Se una
--    persona spegne `luogo_del_partner` dopo che il partner ha segnato un posto
--    ma prima che il lavoro periodico giri, quella notifica **non deve partire**.
--    Il consenso vale nel momento in cui si tratta il dato, e il trattamento
--    qui e' l'invio. Accodare e' solo prepararsi a chiederselo.
--
-- ## La lingua, che mancava e non si vedeva
--
-- Il testo di una notifica lo scrive il **server**, perche' l'app non e' in
-- esecuzione quando arriva. Ma finora la lingua viveva solo nel telefono
-- (`lib/i18n.ts` legge il locale di sistema): il server non aveva modo di
-- sapere in che lingua parlare, e avrebbe scritto in inglese a tutti.
--
-- 🔑 La lingua si attacca al **dispositivo**, non alla persona: un token e'
--    un'installazione su un telefono, e il locale e' una proprieta' di quel
--    telefono. La stessa persona con due telefoni impostati diversamente
--    riceve ciascuno nella sua lingua, che e' il comportamento giusto e viene
--    gratis da dove si mette la colonna.
-- =============================================================================


-- --- La lingua del dispositivo -----------------------------------------------
-- Default 'en' e non 'it': se un giorno arrivasse un token senza lingua,
-- l'inglese e' la scelta che sbaglia con meno persone — ed e' gia' la lingua
-- ufficiale dei documenti (D-123).
alter table public.dispositivo
  add column if not exists lingua text not null default 'en'
    check (lingua in ('it', 'en'));

comment on column public.dispositivo.lingua is
  'Lingua in cui scrivere le notifiche a QUESTO telefono. Sta sul dispositivo e non sulla persona perche'' il locale e'' del telefono (0039).';


-- --- La coda -----------------------------------------------------------------
create table if not exists public.notifica_in_coda (
  id uuid primary key default gen_random_uuid(),

  /** A chi. Sempre una PERSONA: le notifiche non si mandano a una coppia. */
  destinatario_id uuid not null references auth.users (id) on delete cascade,

  tipo text not null check (tipo in ('luogo_del_partner', 'ricordi', 'inviti_a_tornare')),

  /** La coppia da cui nasce, quando ce n'e' una. Serve a TACERE se nel
      frattempo si e' sciolta: e' la meta' meccanica della decisione D-128. */
  coppia_id uuid references public.coppia (id) on delete cascade,

  /** I pezzi variabili del testo — il nome del luogo, gli anni, il titolo
      dell'evento. ⚠️ Il testo FINITO non si scrive qui: dipende dalla lingua
      del dispositivo, e un telefono puo' cambiarla fra l'accodamento e
      l'invio. Qui stanno i dati, la frase la compone chi spedisce. */
  dati jsonb not null default '{}'::jsonb,

  /**
   * La guardia contro i doppioni, e serve davvero: il lavoro periodico gira
   * piu' volte al giorno e ricalcolerebbe gli stessi ricordi ogni volta.
   * Forma: `<tipo>:<oggetto>:<periodo>` — vedi le funzioni qui sotto.
   */
  chiave_dedup text not null,

  creata_il     timestamptz not null default now(),
  da_inviare_il timestamptz not null default now(),
  inviata_il    timestamptz,

  /**
   * 🔑 «Scartata» NON e' «inviata», e tenerle separate non e' pignoleria.
   *
   * Una notifica si scarta quando al momento dell'invio il consenso non c'era
   * piu', la coppia si era sciolta, o la persona non ha nessun dispositivo.
   * Segnarla come inviata sarebbe comodo — esce dalla coda lo stesso — ma
   * renderebbe la tabella **bugiarda proprio sul dato che conta**: se un domani
   * si dovesse dimostrare di non aver mandato promozioni a chi non le voleva,
   * questa colonna e' la prova, e `inviata_il` valorizzato direbbe il contrario.
   */
  scartata_il   timestamptz,
  motivo_scarto text,

  /** Quante volte ci si e' provati, e cosa e' andato storto l'ultima volta.
      ⚠️ Senza questi due campi un invio che fallisce sempre e' indistinguibile
      da uno che non e' ancora partito. */
  tentativi     integer not null default 0,
  ultimo_errore text,

  constraint notifica_non_inviata_e_scartata
    check (inviata_il is null or scartata_il is null)
);

create unique index if not exists notifica_dedup_unica
  on public.notifica_in_coda (chiave_dedup);

-- L'indice su cui gira la query del lavoro periodico: solo quelle ancora aperte.
create index if not exists notifica_da_inviare
  on public.notifica_in_coda (da_inviare_il)
  where inviata_il is null and scartata_il is null;

comment on table public.notifica_in_coda is
  'Outbox delle notifiche push. Il trigger accoda, la Edge Function `invia-notifiche` svuota. Nessun client la legge MAI: RLS attiva senza policy (0039).';

-- 🔴 RLS attiva e NESSUNA policy: e' deliberato, non una dimenticanza.
--
-- Questa tabella contiene, in chiaro, il nome di un luogo che una persona ha
-- visitato e l'identita' di chi deve saperlo. Nessun client ha motivo di
-- leggerla: la notifica si riceve dal telefono, non si consulta in coda.
-- Senza policy, `authenticated` e `anon` non vedono e non scrivono nulla;
-- passano soltanto il `service_role` della Edge Function e le funzioni
-- `security definer` qui sotto, che sono di proprieta' di `postgres`.
--
-- ⚠️ Una tabella con RLS attiva e zero policy e' silenziosamente vuota per
--    tutti: se un giorno servisse leggerla dall'app, la select tornera' `[]`
--    e non un errore. E' la trappola di B-03 — *«0 significa sia non ci sono
--    sia non li vedo»* — e va ricordata prima di dare la colpa alla query.
alter table public.notifica_in_coda enable row level security;


-- =============================================================================
-- 1. «Il partner ha segnato un posto» — il trigger
--
-- Scatta sulla TRANSIZIONE a `visitato`, non sullo stato. Un aggiornamento che
-- tocca la nota di un luogo gia' visitato non e' una notizia, e notificarlo
-- sarebbe rumore che insegna a ignorare le notifiche.
-- =============================================================================
create or replace function public.accoda_luogo_del_partner()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_partner uuid;
  v_attiva  boolean;
begin
  -- La coppia dev'essere viva: su una sciolta non si notifica nessuno (D-128).
  select stato = 'attiva' into v_attiva from coppia where id = new.coppia_id;
  if not coalesce(v_attiva, false) then
    return new;
  end if;

  -- L'altro membro ancora attivo. ⚠️ Se non c'e' (spazio creato da soli, D-26)
  -- non si accoda niente e non e' un errore: e' il caso normale di chi non si
  -- e' ancora appaiato.
  select utente_id into v_partner
  from membro_coppia
  where coppia_id = new.coppia_id
    and uscito_il is null
    and utente_id <> new.autore_id
  limit 1;

  if v_partner is null then
    return new;
  end if;

  -- 🔑 Una notifica per luogo e per destinatario, per sempre. Se il luogo
  -- tornasse `desiderato` e poi di nuovo `visitato`, la chiave e' la stessa e
  -- la seconda notifica non parte: un posto si scopre una volta.
  insert into notifica_in_coda (destinatario_id, tipo, coppia_id, dati, chiave_dedup)
  values (
    v_partner,
    'luogo_del_partner',
    new.coppia_id,
    jsonb_build_object('luogo', new.nome, 'luogo_id', new.id),
    'luogo:' || new.id::text || ':' || v_partner::text
  )
  on conflict (chiave_dedup) do nothing;

  return new;
end;
$$;

drop trigger if exists luogo_notifica_partner_ins on public.luogo;
create trigger luogo_notifica_partner_ins
  after insert on public.luogo
  for each row
  when (new.stato = 'visitato')
  execute function public.accoda_luogo_del_partner();

drop trigger if exists luogo_notifica_partner_upd on public.luogo;
create trigger luogo_notifica_partner_upd
  after update on public.luogo
  for each row
  when (old.stato is distinct from 'visitato' and new.stato = 'visitato')
  execute function public.accoda_luogo_del_partner();


-- =============================================================================
-- 2. «Dov'eravate N anni fa» — il calcolo periodico
--
-- Lo chiama la Edge Function, non un trigger: non nasce da un gesto di
-- nessuno, nasce dal passare del tempo.
--
-- ⚠️ **Il giorno si calcola in UTC**, e va saputo. Non esiste nessun fuso
--    orario memorizzato — ne' della coppia ne' della persona — quindi per chi
--    vive molto a est o a ovest il ricordo puo' arrivare il giorno prima o
--    dopo rispetto al proprio calendario. E' un limite accettato e non un
--    difetto nascosto: correggerlo richiede una colonna `fuso` che oggi
--    nessuna schermata sa chiedere. Sta nel backlog.
--
-- 🔴 **Solo coppie attive.** D-128: dopo lo scioglimento «N anni fa» non arriva
--    a nessuno, perche' quel ricordo puo' puntare a fotografie che la persona
--    non riesce piu' ad aprire — era B-62, e la 0037 ha corretto le policy, non
--    la natura della cosa.
-- =============================================================================
create or replace function public.accoda_ricordi()
returns integer
language plpgsql security definer
set search_path = public
as $$
declare
  v_accodate integer := 0;
  r          record;
begin
  for r in
    select
      e.id            as evento_id,
      e.titolo        as titolo,
      e.coppia_id     as coppia_id,
      m.utente_id     as destinatario_id,
      (date_part('year', current_date) - date_part('year', e.inizio at time zone 'UTC'))::int as anni
    from evento e
    join coppia c        on c.id = e.coppia_id and c.stato = 'attiva'
    join membro_coppia m on m.coppia_id = e.coppia_id and m.uscito_il is null
    where date_part('month', e.inizio at time zone 'UTC') = date_part('month', current_date)
      and date_part('day',   e.inizio at time zone 'UTC') = date_part('day',   current_date)
      and date_part('year',  e.inizio at time zone 'UTC') < date_part('year',  current_date)
  loop
    insert into notifica_in_coda (destinatario_id, tipo, coppia_id, dati, chiave_dedup)
    values (
      r.destinatario_id,
      'ricordi',
      r.coppia_id,
      jsonb_build_object('titolo', r.titolo, 'anni', r.anni, 'evento_id', r.evento_id),
      'ricordi:' || r.evento_id::text || ':' || r.destinatario_id::text
        || ':' || to_char(current_date, 'YYYY')
    )
    on conflict (chiave_dedup) do nothing;

    -- ⚠️ Si conta cio' che e' stato davvero inserito, non i giri del ciclo:
    -- con `do nothing` le due cose divergono a ogni riesecuzione, e un
    -- contatore che cresce senza che parta niente e' peggio di nessun contatore.
    if found then
      v_accodate := v_accodate + 1;
    end if;
  end loop;

  return v_accodate;
end;
$$;


-- =============================================================================
-- 3. «Inviti a tornare» — il sollecito, e le tre guardie che lo tengono onesto
--
-- 🔴 E' l'unica notifica PROMOZIONALE del prodotto, e nasce spenta (0038).
--    Qui si accoda **solo** per chi l'ha accesa con un gesto: nessun default,
--    nessuna riga mancante che valga come consenso.
-- =============================================================================
create or replace function public.accoda_inviti_a_tornare(p_giorni_inattivita integer default 30)
returns integer
language plpgsql security definer
set search_path = public
as $$
declare
  v_accodate integer := 0;
  r          record;
begin
  for r in
    select m.utente_id as destinatario_id, m.coppia_id as coppia_id
    from membro_coppia m
    join coppia c                on c.id = m.coppia_id and c.stato = 'attiva'
    -- 🔑 Consenso ESPRESSO: si parte da `preferenze_notifiche`, non da
    -- `membro_coppia`. Chi non ha mai toccato la schermata non ha la riga, il
    -- join lo esclude, e il default `false` della 0038 non viene mai letto come
    -- un si'. *Un consenso presunto qui non sarebbe valido.*
    join preferenze_notifiche p  on p.utente_id = m.utente_id and p.inviti_a_tornare = true
    where m.uscito_il is null
      -- Inattivita' vera: nessun luogo e nessun evento nuovo nella finestra.
      and not exists (
        select 1 from luogo l
        where l.coppia_id = m.coppia_id
          and l.creato_il > now() - make_interval(days => p_giorni_inattivita)
      )
      and not exists (
        select 1 from evento e
        where e.coppia_id = m.coppia_id
          and e.creato_il > now() - make_interval(days => p_giorni_inattivita)
      )
  loop
    -- Al massimo uno al mese, per costruzione: la chiave porta l'anno-mese.
    insert into notifica_in_coda (destinatario_id, tipo, coppia_id, dati, chiave_dedup)
    values (
      r.destinatario_id,
      'inviti_a_tornare',
      r.coppia_id,
      '{}'::jsonb,
      'inviti:' || r.destinatario_id::text || ':' || to_char(current_date, 'YYYY-MM')
    )
    on conflict (chiave_dedup) do nothing;

    if found then
      v_accodate := v_accodate + 1;
    end if;
  end loop;

  return v_accodate;
end;
$$;


-- --- Permessi -----------------------------------------------------------------
-- 🔴 Nessuna delle tre e' chiamabile da un client. Le prime due non hanno
-- nulla da offrire a un utente; la terza, chiamata a ripetizione, sarebbe un
-- modo di spedire notifiche promozionali a se stessi e — peggio — di misurare
-- l'inattivita' altrui. Le chiama solo il `service_role` della Edge Function.
--
-- ⚠️ `revoke ... from public` e non solo `from anon`: e' la lezione di B-01 e
--    di B-07, dove funzioni chiuse al solo `anon` restavano aperte a chiunque
--    avesse un account.
revoke execute on function public.accoda_ricordi() from public, anon, authenticated;
revoke execute on function public.accoda_inviti_a_tornare(integer) from public, anon, authenticated;

-- ⚠️ E subito dopo il grant a chi deve eseguirle, che NON e' pleonastico: in
--    Postgres `execute` e' concesso a `public` per default, e revocandolo lo si
--    toglie **anche** al `service_role`. Senza queste due righe la Edge
--    Function riceverebbe 42501 e il lavoro periodico non partirebbe mai —
--    fallendo in silenzio, perche' nessuno guarda i log di un cron che nessuno
--    ha ancora visto funzionare.
grant execute on function public.accoda_ricordi() to service_role;
grant execute on function public.accoda_inviti_a_tornare(integer) to service_role;

-- Stessa cura sulla coda: il `service_role` scavalca la RLS, ma i GRANT di
-- tabella sono un'altra cosa e vanno dati comunque.
grant select, insert, update, delete on public.notifica_in_coda to service_role;


-- =============================================================================
-- LA PROVA — da aggiungere a `tests/rls.avversariali.mjs` e da far fallire
-- prima di crederci. Le prime quattro erano gia' chieste in fondo alla 0038.
--
--   1. A registra un dispositivo. B, partner attivo di A, NON deve vederlo.
--   2. B non deve poter aggiornare ne' cancellare la riga di A.
--   3. Dopo lo scioglimento, nessuno dei due vede i dispositivi dell'altro.
--   4. `inviti_a_tornare` di una riga appena creata deve risultare FALSE.
--   5. 🔴 `notifica_in_coda` non e' leggibile da nessun client, nemmeno dal
--      destinatario della notifica.
--   6. 🔴 `accoda_ricordi` e `accoda_inviti_a_tornare` devono essere fermate
--      ai PERMESSI (42501) per un utente autenticato, non dalla guardia
--      interna: un errore diverso significherebbe che la funzione e' stata
--      eseguita e si e' fermata per conto suo.
-- =============================================================================
