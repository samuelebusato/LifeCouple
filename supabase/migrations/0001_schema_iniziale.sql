-- =============================================================================
-- LifeCouple — migrazione iniziale
-- Fonte: docs/Architecture.md §4. Tutte le tabelle nascono insieme (D-11),
-- creatura e giochi inclusi; le funzioni di gioco (rivela_partita) arrivano
-- coi giochi. RLS attiva su OGNI tabella: senza un backend nostro, le policy
-- sono l'unico strato di autorizzazione (§7 debito 1).
--
-- Regole che questo file impone e che non vanno allentate:
--   D-04/D-21  autore_id su ogni contenuto; modifica/cancellazione solo autore
--   D-12       invio_sigillato leggibile SOLO dall'autore, in ogni fase
--   D-14       appaiamento via funzioni (nessun insert diretto su coppia/membri)
--   D-15       punti solo alla transizione desiderato→fatto, una sola volta
--   D-22       tetto foto per coppia, imposto qui e non solo mostrato
-- =============================================================================

-- =============================================================================
-- IDENTITA' E LEGAME
-- =============================================================================

create table public.coppia (
  id              uuid primary key default gen_random_uuid(),
  stato           text not null default 'attiva' check (stato in ('attiva', 'sciolta')),
  creata_il       timestamptz not null default now(),
  sciolta_il      timestamptz,
  byte_foto_usati bigint not null default 0 check (byte_foto_usati >= 0)
);

create table public.membro_coppia (
  coppia_id  uuid not null references public.coppia (id) on delete cascade,
  utente_id  uuid not null references auth.users (id) on delete cascade,
  entrato_il timestamptz not null default now(),
  uscito_il  timestamptz, -- l'appartenenza e' un INTERVALLO, non un fatto permanente (D-04)
  primary key (coppia_id, utente_id)
);

create table public.invito (
  id         uuid primary key default gen_random_uuid(),
  coppia_id  uuid not null references public.coppia (id) on delete cascade,
  creato_da  uuid not null references auth.users (id),
  token_hash text not null unique, -- l'impronta, mai il token: un dump del DB non apre inviti
  stato      text not null default 'emesso'
             check (stato in ('emesso', 'aperto_in_attesa_conferma', 'accettato', 'scaduto', 'revocato')),
  scade_il   timestamptz not null,
  usato_il   timestamptz,
  aperto_da  uuid references auth.users (id)
);

-- -----------------------------------------------------------------------------
-- Funzione di appartenenza: il mattone di quasi tutte le policy.
-- SECURITY DEFINER per evitare la ricorsione RLS su membro_coppia.
-- Definita DOPO le tabelle che interroga: i corpi delle funzioni "language sql"
-- sono validati alla creazione, e prima di membro_coppia fallirebbe (42P01).
-- -----------------------------------------------------------------------------
create or replace function public.e_membro_attivo(cid uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from membro_coppia m
    where m.coppia_id = cid
      and m.utente_id = auth.uid()
      and m.uscito_il is null
  );
$$;

-- =============================================================================
-- CONTENUTI — tutti con coppia_id e autore_id; autore_id imposto dal database
-- =============================================================================

create table public.evento (
  id             uuid primary key default gen_random_uuid(),
  coppia_id      uuid not null references public.coppia (id) on delete cascade,
  autore_id      uuid not null default auth.uid() references auth.users (id),
  titolo         text not null,
  inizio         timestamptz not null,
  fine           timestamptz,
  tutto_il_giorno boolean not null default false,
  nota           text,
  creato_il      timestamptz not null default now()
);

create table public.luogo (
  id          uuid primary key default gen_random_uuid(),
  coppia_id   uuid not null references public.coppia (id) on delete cascade,
  autore_id   uuid not null default auth.uid() references auth.users (id),
  nome        text not null,
  lat         double precision not null,
  lng         double precision not null,
  stato       text not null default 'desiderato' check (stato in ('desiderato', 'visitato')),
  visitato_il timestamptz, -- la transizione ha una data: e' cio' che genera i punti (D-15)
  nota        text,
  creato_il   timestamptz not null default now()
);

create table public.elemento_lista (
  id        uuid primary key default gen_random_uuid(),
  coppia_id uuid not null references public.coppia (id) on delete cascade,
  autore_id uuid not null default auth.uid() references auth.users (id),
  tipo      text not null check (tipo in ('film', 'ristorante')),
  titolo    text not null,
  stato     text not null default 'desiderato' check (stato in ('desiderato', 'fatto')),
  fatto_il  timestamptz,
  creato_il timestamptz not null default now()
);

create table public.recensione (
  id          uuid primary key default gen_random_uuid(),
  coppia_id   uuid not null references public.coppia (id) on delete cascade,
  elemento_id uuid not null references public.elemento_lista (id) on delete cascade,
  autore_id   uuid not null default auth.uid() references auth.users (id),
  voto        smallint not null check (voto between 1 and 5),
  testo       text,
  creato_il   timestamptz not null default now(),
  unique (elemento_id, autore_id) -- una recensione per membro: due persone, due opinioni
);

create table public.foto (
  id             uuid primary key default gen_random_uuid(),
  coppia_id      uuid not null references public.coppia (id) on delete cascade,
  autore_id      uuid not null default auth.uid() references auth.users (id),
  chiave_storage text not null unique,
  luogo_id       uuid references public.luogo (id) on delete set null, -- la foto sopravvive al luogo
  byte           bigint not null check (byte > 0 and byte <= 10 * 1024 * 1024),
  scattata_il    timestamptz,
  creato_il      timestamptz not null default now()
);

-- =============================================================================
-- CREATURA E PUNTEGGIO (D-15, D-16)
-- =============================================================================

create table public.creatura (
  coppia_id uuid primary key references public.coppia (id) on delete cascade,
  punti     bigint not null default 0 check (punti >= 0),
  creata_il timestamptz not null default now()
  -- NESSUN autore_id: e' l'unico oggetto senza autore, per questo allo
  -- scioglimento si cancella invece di essere revocata (D-16)
);

create table public.stadio_soglia (
  stadio       smallint primary key,
  punti_minimi bigint not null unique
);

-- Taratura PROVVISORIA: le soglie stanno in tabella proprio per poterle
-- cambiare senza migrazione quando ci saranno dati d'uso reali (D-09/§4.1).
insert into public.stadio_soglia (stadio, punti_minimi) values
  (1, 0), (2, 100), (3, 300), (4, 700), (5, 1500), (6, 3000);

create table public.punti_evento (
  id             uuid primary key default gen_random_uuid(),
  coppia_id      uuid not null references public.coppia (id) on delete cascade,
  tipo           text not null,
  riferimento_id uuid not null,
  punti          integer not null check (punti > 0),
  creato_il      timestamptz not null default now(),
  -- la guardia anti-fabbricazione: togliere e rimettere lo stesso elemento
  -- non produce nuovi punti (D-15)
  unique (coppia_id, tipo, riferimento_id)
);

-- =============================================================================
-- GIOCHI (D-12, D-19)
-- =============================================================================

create table public.domanda (
  id        uuid primary key default gen_random_uuid(),
  -- NULL = banco comune scritto da noi (D-08 garantito);
  -- valorizzato = domanda personalizzata della coppia (D-19, contenuto non controllabile)
  coppia_id uuid references public.coppia (id) on delete cascade,
  gioco     text not null check (gioco in ('quiz_preferenze', 'obbligo_verita', 'telepatia')),
  lingua    text not null check (lingua in ('it', 'en')),
  testo     text not null,
  creato_il timestamptz not null default now()
);

create table public.partita (
  id        uuid primary key default gen_random_uuid(),
  coppia_id uuid not null references public.coppia (id) on delete cascade,
  creata_da uuid not null default auth.uid() references auth.users (id),
  gioco     text not null check (gioco in ('quiz_preferenze', 'obbligo_verita', 'telepatia')),
  stato     text not null default 'invito'
            check (stato in ('invito', 'deposito', 'tentativi', 'conclusa')),
  turno_di  uuid references auth.users (id),
  creata_il timestamptz not null default now()
);

create table public.invio_sigillato (
  id         uuid primary key default gen_random_uuid(),
  partita_id uuid not null references public.partita (id) on delete cascade,
  round      integer not null default 1,
  autore_id  uuid not null default auth.uid() references auth.users (id),
  natura     text not null check (natura in ('verita', 'tentativo', 'scelta')),
  domanda_id uuid references public.domanda (id),
  contenuto  jsonb not null,
  creato_il  timestamptz not null default now(),
  unique (partita_id, round, autore_id, natura)
);

create table public.partita_risultato (
  partita_id      uuid primary key references public.partita (id) on delete cascade,
  esito           jsonb not null,
  punti_assegnati integer not null default 0,
  rivelato_il     timestamptz not null default now()
);

create table public.registro_azioni (
  id        uuid primary key default gen_random_uuid(),
  coppia_id uuid not null references public.coppia (id) on delete cascade,
  autore_id uuid not null default auth.uid() references auth.users (id),
  azione    text not null,
  oggetto   jsonb,
  creato_il timestamptz not null default now()
);

-- =============================================================================
-- FUNZIONI CHE IL CLIENT NON PUO' SOSTITUIRE
-- =============================================================================

-- Creazione atomica coppia + primo membro. Niente insert diretti dal client:
-- l'unico modo di entrare in una coppia e' questa funzione o l'invito (D-14).
create or replace function public.crea_coppia()
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  nuova_id uuid;
begin
  if auth.uid() is null then
    raise exception 'non autenticato';
  end if;
  -- una persona sola per coppia attiva: chi e' gia' in una coppia non ne crea un'altra
  if exists (
    select 1 from membro_coppia
    where utente_id = auth.uid() and uscito_il is null
  ) then
    raise exception 'sei gia'' in una coppia attiva';
  end if;
  insert into coppia default values returning id into nuova_id;
  insert into membro_coppia (coppia_id, utente_id) values (nuova_id, auth.uid());
  return nuova_id;
end;
$$;

-- La creatura nasce con la coppia: mai una coppia senza creatura.
create or replace function public.crea_creatura()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into creatura (coppia_id) values (new.id);
  return new;
end;
$$;

create trigger coppia_crea_creatura
  after insert on public.coppia
  for each row execute function public.crea_creatura();

-- Assegnazione punti: chiamata SOLO dai trigger sulla transizione (D-15).
-- Il vincolo unico su punti_evento fa da guardia; on conflict = gia' premiato.
create or replace function public.assegna_punti(cid uuid, tipo_evento text, rif uuid, n integer)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  insert into punti_evento (coppia_id, tipo, riferimento_id, punti)
  values (cid, tipo_evento, rif, n)
  on conflict (coppia_id, tipo, riferimento_id) do nothing;
  if found then
    update creatura set punti = punti + n where coppia_id = cid;
  end if;
end;
$$;

-- Valori punti PROVVISORI, da tarare con l'uso reale.
create or replace function public.punti_su_transizione_luogo()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if old.stato = 'desiderato' and new.stato = 'visitato' then
    new.visitato_il := coalesce(new.visitato_il, now());
    perform assegna_punti(new.coppia_id, 'luogo_visitato', new.id, 20);
  end if;
  return new;
end;
$$;

create trigger luogo_transizione
  before update of stato on public.luogo
  for each row execute function public.punti_su_transizione_luogo();

create or replace function public.punti_su_transizione_elemento()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if old.stato = 'desiderato' and new.stato = 'fatto' then
    new.fatto_il := coalesce(new.fatto_il, now());
    perform assegna_punti(new.coppia_id, 'elemento_fatto', new.id, 10);
  end if;
  return new;
end;
$$;

create trigger elemento_transizione
  before update of stato on public.elemento_lista
  for each row execute function public.punti_su_transizione_elemento();

-- Tetto foto (D-22): imposto, non solo mostrato. 1 GB per coppia.
-- Nota dichiarata: sotto concorrenza estrema due upload simultanei possono
-- sforare di un file — accettabile a scala di coppia, il tetto e' una guardia.
create or replace function public.aggiorna_byte_foto()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  usati bigint;
begin
  if tg_op = 'INSERT' then
    select byte_foto_usati into usati from coppia where id = new.coppia_id;
    if usati + new.byte > 1073741824 then
      raise exception 'tetto foto della coppia superato (1 GB)';
    end if;
    update coppia set byte_foto_usati = byte_foto_usati + new.byte where id = new.coppia_id;
    return new;
  elsif tg_op = 'DELETE' then
    update coppia set byte_foto_usati = greatest(0, byte_foto_usati - old.byte) where id = old.coppia_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger foto_byte
  before insert or delete on public.foto
  for each row execute function public.aggiorna_byte_foto();

-- =============================================================================
-- ROW LEVEL SECURITY — nessuna tabella senza RLS (regola di progetto)
-- =============================================================================

alter table public.coppia            enable row level security;
alter table public.membro_coppia     enable row level security;
alter table public.invito            enable row level security;
alter table public.evento            enable row level security;
alter table public.luogo             enable row level security;
alter table public.elemento_lista    enable row level security;
alter table public.recensione        enable row level security;
alter table public.foto              enable row level security;
alter table public.creatura          enable row level security;
alter table public.stadio_soglia     enable row level security;
alter table public.punti_evento      enable row level security;
alter table public.domanda           enable row level security;
alter table public.partita           enable row level security;
alter table public.invio_sigillato   enable row level security;
alter table public.partita_risultato enable row level security;
alter table public.registro_azioni   enable row level security;

-- Identita' e legame: lettura ai membri; NESSUNA policy di scrittura =
-- scritture solo via funzioni security definer (crea_coppia, e in futuro
-- accetta_invito e sciogli_coppia).
create policy coppia_select on public.coppia
  for select using (e_membro_attivo(id));

create policy membro_select on public.membro_coppia
  for select using (utente_id = auth.uid() or e_membro_attivo(coppia_id));

create policy invito_select on public.invito
  for select using (e_membro_attivo(coppia_id));

-- Contenuti: lettura ai membri attivi O all'autore (dopo lo scioglimento
-- ciascuno conserva cio' di cui e' autore — D-04); creazione solo come se
-- stessi dentro la propria coppia; modifica e cancellazione SOLO autore (D-21).
create policy evento_select on public.evento
  for select using (e_membro_attivo(coppia_id) or autore_id = auth.uid());
create policy evento_insert on public.evento
  for insert with check (e_membro_attivo(coppia_id) and autore_id = auth.uid());
create policy evento_update on public.evento
  for update using (autore_id = auth.uid()) with check (autore_id = auth.uid());
create policy evento_delete on public.evento
  for delete using (autore_id = auth.uid());

create policy luogo_select on public.luogo
  for select using (e_membro_attivo(coppia_id) or autore_id = auth.uid());
create policy luogo_insert on public.luogo
  for insert with check (e_membro_attivo(coppia_id) and autore_id = auth.uid());
create policy luogo_update on public.luogo
  for update using (autore_id = auth.uid()) with check (autore_id = auth.uid());
create policy luogo_delete on public.luogo
  for delete using (autore_id = auth.uid());

create policy elemento_select on public.elemento_lista
  for select using (e_membro_attivo(coppia_id) or autore_id = auth.uid());
create policy elemento_insert on public.elemento_lista
  for insert with check (e_membro_attivo(coppia_id) and autore_id = auth.uid());
create policy elemento_update on public.elemento_lista
  for update using (autore_id = auth.uid()) with check (autore_id = auth.uid());
create policy elemento_delete on public.elemento_lista
  for delete using (autore_id = auth.uid());

create policy recensione_select on public.recensione
  for select using (e_membro_attivo(coppia_id) or autore_id = auth.uid());
create policy recensione_insert on public.recensione
  for insert with check (e_membro_attivo(coppia_id) and autore_id = auth.uid());
create policy recensione_update on public.recensione
  for update using (autore_id = auth.uid()) with check (autore_id = auth.uid());
create policy recensione_delete on public.recensione
  for delete using (autore_id = auth.uid());

create policy foto_select on public.foto
  for select using (e_membro_attivo(coppia_id) or autore_id = auth.uid());
create policy foto_insert on public.foto
  for insert with check (e_membro_attivo(coppia_id) and autore_id = auth.uid());
create policy foto_update on public.foto
  for update using (autore_id = auth.uid()) with check (autore_id = auth.uid());
create policy foto_delete on public.foto
  for delete using (autore_id = auth.uid());

-- Creatura e punteggio: sola lettura per i membri; le scritture passano dai
-- trigger e da assegna_punti (security definer).
create policy creatura_select on public.creatura
  for select using (e_membro_attivo(coppia_id));

create policy stadio_select on public.stadio_soglia
  for select using (auth.uid() is not null);

create policy punti_select on public.punti_evento
  for select using (e_membro_attivo(coppia_id));

-- Giochi.
create policy domanda_select on public.domanda
  for select using (coppia_id is null or e_membro_attivo(coppia_id));
create policy domanda_insert on public.domanda
  for insert with check (coppia_id is not null and e_membro_attivo(coppia_id));
create policy domanda_delete on public.domanda
  for delete using (coppia_id is not null and e_membro_attivo(coppia_id));

create policy partita_select on public.partita
  for select using (e_membro_attivo(coppia_id));
create policy partita_insert on public.partita
  for insert with check (e_membro_attivo(coppia_id) and creata_da = auth.uid());

-- D-12, la riga che non si tocca: l'altro NON legge mai, in nessuna fase.
-- Il confronto avviene in rivela_partita() (arrivera' coi giochi), che
-- restituisce il risultato solo quando entrambi hanno inviato.
create policy sigillato_select on public.invio_sigillato
  for select using (autore_id = auth.uid());
create policy sigillato_insert on public.invio_sigillato
  for insert with check (
    autore_id = auth.uid()
    and exists (
      select 1 from partita p
      where p.id = partita_id and e_membro_attivo(p.coppia_id)
    )
  );

create policy risultato_select on public.partita_risultato
  for select using (
    exists (
      select 1 from partita p
      where p.id = partita_id and e_membro_attivo(p.coppia_id)
    )
  );

-- Registro: solo-append. Niente policy di update/delete = impossibili.
create policy registro_select on public.registro_azioni
  for select using (e_membro_attivo(coppia_id));
create policy registro_insert on public.registro_azioni
  for insert with check (e_membro_attivo(coppia_id) and autore_id = auth.uid());

-- =============================================================================
-- PERMESSI DI ESECUZIONE
-- =============================================================================
revoke execute on function public.crea_coppia() from anon;
grant execute on function public.crea_coppia() to authenticated;
grant execute on function public.e_membro_attivo(uuid) to authenticated;
