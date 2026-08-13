-- =============================================================================
-- LifeCouple — 0008: l'evento diventa il centro
--
-- Deciso con l'utente il 2026-08-13: calendario, mappa e recap non sono tre
-- funzioni, sono **tre viste della stessa cosa**. Il calendario la guarda nel
-- tempo, la mappa nello spazio, il recap in elenco. Quello che si guarda e'
-- sempre l'evento, e un evento puo' avere un luogo, delle foto e dei commenti.
--
-- Cosa cambia nello schema:
--   evento.luogo_id  — dove e' successo (facoltativo: non tutto ha un posto)
--   foto.evento_id   — a quale evento appartiene uno scatto (facoltativo: una
--                      foto puo' vivere anche da sola nella galleria)
--   commento         — le parole che si aggiungono a un evento, dopo
--
-- Perche' facoltativi entrambi: un impegno di lavoro non ha un luogo da
-- ricordare, una foto puo' non appartenere a niente. Renderli obbligatori
-- costringerebbe a inventare dati per far entrare la realta' nello schema.
-- =============================================================================

alter table public.evento
  add column if not exists luogo_id uuid references public.luogo (id) on delete set null;

alter table public.foto
  add column if not exists evento_id uuid references public.evento (id) on delete set null;

-- -----------------------------------------------------------------------------
-- I commenti a un evento.
--
-- Stessa forma di ogni altro contenuto: `coppia_id` per il confine, `autore_id`
-- imposto dal database, lettura ai membri attivi **o** all'autore (che continua
-- a vedere i propri anche dopo lo scioglimento), scrittura e cancellazione solo
-- all'autore. Nessuna modifica del testo altrui, mai.
-- -----------------------------------------------------------------------------
create table if not exists public.commento (
  id         uuid primary key default gen_random_uuid(),
  coppia_id  uuid not null references public.coppia (id) on delete cascade,
  evento_id  uuid not null references public.evento (id) on delete cascade,
  autore_id  uuid not null default auth.uid() references auth.users (id),
  testo      text not null check (length(trim(testo)) > 0),
  creato_il  timestamptz not null default now()
);

alter table public.commento enable row level security;

drop policy if exists commento_select on public.commento;
create policy commento_select on public.commento
  for select using (e_membro_attivo(coppia_id) or autore_id = auth.uid());

drop policy if exists commento_insert on public.commento;
create policy commento_insert on public.commento
  for insert with check (e_membro_attivo(coppia_id) and autore_id = auth.uid());

drop policy if exists commento_update on public.commento;
create policy commento_update on public.commento
  for update using (autore_id = auth.uid()) with check (autore_id = auth.uid());

drop policy if exists commento_delete on public.commento;
create policy commento_delete on public.commento
  for delete using (autore_id = auth.uid());

create index if not exists commento_per_evento on public.commento (evento_id);
create index if not exists foto_per_evento on public.foto (evento_id);
create index if not exists evento_per_luogo on public.evento (luogo_id);

-- =============================================================================
-- SCIOGLIMENTO: i legami nuovi vanno ricuciti come gli altri (D-21/D-27)
--
-- Senza questo aggiornamento, dopo la rottura: le foto di un evento altrui
-- resterebbero appese a una riga che il loro autore non vede piu', e i commenti
-- — che sono **personali**, perche' sono le parole di chi li ha scritti —
-- resterebbero attaccati alla copia sbagliata.
--
-- ⚠️ Il commento segue la regola di D-21: **la sorte segue la sensibilita'**.
-- Un commento e' il pensiero di una persona su un momento: resta a chi l'ha
-- scritto, come le foto e le recensioni. Non si duplica.
-- =============================================================================
create or replace function public.sciogli_coppia()
returns void
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_coppia   uuid;
  v_membri   uuid[];
  v_eventi   uuid[];
  v_luoghi   uuid[];
  v_elementi uuid[];
  m          uuid;
  r          record;
  v_nuovo    uuid;
begin
  if auth.uid() is null then
    raise exception 'non autenticato';
  end if;

  select coppia_id into v_coppia
  from membro_coppia
  where utente_id = auth.uid() and uscito_il is null
  limit 1;

  if v_coppia is null then
    raise exception 'non sei in una coppia';
  end if;

  select array_agg(utente_id) into v_membri
  from membro_coppia
  where coppia_id = v_coppia and uscito_il is null;

  -- Gli insiemi si fissano PRIMA di duplicare: senza questo, il secondo membro
  -- troverebbe nell'elenco anche le copie appena fatte per il primo.
  select array_agg(id) into v_eventi   from evento         where coppia_id = v_coppia;
  select array_agg(id) into v_luoghi   from luogo          where coppia_id = v_coppia;
  select array_agg(id) into v_elementi from elemento_lista where coppia_id = v_coppia;

  foreach m in array coalesce(v_membri, array[]::uuid[]) loop

    -- LUOGHI (condivisi): copia a ciascuno, e i legami di chi la riceve
    -- vengono spostati sulla propria.
    for r in select * from luogo where id = any(coalesce(v_luoghi, array[]::uuid[])) and autore_id <> m loop
      insert into luogo (coppia_id, autore_id, nome, lat, lng, stato, visitato_il, nota, creato_il)
      values (r.coppia_id, m, r.nome, r.lat, r.lng, r.stato, r.visitato_il, r.nota, r.creato_il)
      returning id into v_nuovo;
      update foto   set luogo_id = v_nuovo where luogo_id = r.id and autore_id = m;
      update evento set luogo_id = v_nuovo where luogo_id = r.id and autore_id = m;
    end loop;

    -- EVENTI (condivisi): copia a ciascuno. Foto e commenti di chi la riceve
    -- la seguono: sono suoi, e devono restare raggiungibili.
    for r in select * from evento where id = any(coalesce(v_eventi, array[]::uuid[])) and autore_id <> m loop
      insert into evento (coppia_id, autore_id, titolo, inizio, fine, tutto_il_giorno, nota,
                          tipo, categoria, origine_esterna, luogo_id, creato_il)
      values (r.coppia_id, m, r.titolo, r.inizio, r.fine, r.tutto_il_giorno, r.nota,
              r.tipo, r.categoria,
              -- l'origine esterna e' unica per coppia: la copia non la porta
              null,
              r.luogo_id, r.creato_il)
      returning id into v_nuovo;
      update foto     set evento_id = v_nuovo where evento_id = r.id and autore_id = m;
      update commento set evento_id = v_nuovo where evento_id = r.id and autore_id = m;
    end loop;

    -- ELEMENTI (condivisi): copia a ciascuno, con la propria recensione.
    for r in select * from elemento_lista where id = any(coalesce(v_elementi, array[]::uuid[])) and autore_id <> m loop
      insert into elemento_lista (coppia_id, autore_id, tipo, titolo, stato, fatto_il, creato_il)
      values (r.coppia_id, m, r.tipo, r.titolo, r.stato, r.fatto_il, r.creato_il)
      returning id into v_nuovo;
      update recensione set elemento_id = v_nuovo where elemento_id = r.id and autore_id = m;
    end loop;

  end loop;

  -- D-16: la creatura sparisce per entrambi, e con lei il punteggio. Con lei se
  -- ne vanno partite (cascata su sigillati e risultati) e domande della coppia:
  -- righe che nessuno potrebbe piu' leggere ne' cancellare (D-27).
  delete from partita      where coppia_id = v_coppia;
  delete from domanda      where coppia_id = v_coppia;
  delete from punti_evento where coppia_id = v_coppia;
  delete from creatura     where coppia_id = v_coppia;

  update invito set stato = 'revocato'
  where coppia_id = v_coppia and stato in ('emesso', 'aperto_in_attesa_conferma');

  insert into registro_azioni (coppia_id, autore_id, azione, oggetto)
  values (v_coppia, auth.uid(), 'scioglimento', jsonb_build_object('membri', v_membri));

  update membro_coppia set uscito_il = now()
  where coppia_id = v_coppia and uscito_il is null;

  update coppia set stato = 'sciolta', sciolta_il = now()
  where id = v_coppia;
end;
$$;

revoke execute on function public.sciogli_coppia() from public, anon;
grant execute on function public.sciogli_coppia() to authenticated;
