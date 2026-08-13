-- =============================================================================
-- LifeCouple — 0011: le cartelle della galleria
--
-- Una cartella e' **organizzazione condivisa**, non contenuto: e' un modo di
-- guardare le foto, non una cosa che qualcuno possiede. Per questo:
--
--   * la vedono e la riempiono entrambi (come luoghi ed eventi);
--   * la cancella e la rinomina solo chi l'ha creata — stessa regola di eventi
--     e luoghi, cosi' non ci sono due modelli di permesso da ricordare;
--   * **cancellare una cartella non cancella le foto**. E' il punto che conta:
--     se cancellare un raccoglitore distruggesse gli scatti dell'altro, un
--     gesto di riordino diventerebbe un gesto irreversibile su cose altrui.
--     `on delete set null` — le foto tornano semplicemente "senza cartella".
--
-- La sorte allo scioglimento segue D-21 e la forma gia' usata in 0008 per
-- luoghi, eventi ed elementi: **una copia a ciascuno**, e le foto di chi la
-- riceve vengono ricucite sulla propria copia. Senza questo passo, dopo la
-- rottura ognuno vedrebbe le proprie foto appese a una cartella creata
-- dall'altro — cioe' a una riga che non gli appartiene e che non puo' toccare.
-- =============================================================================

create table if not exists public.cartella (
  id         uuid primary key default gen_random_uuid(),
  coppia_id  uuid not null references public.coppia(id) on delete cascade,
  autore_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome       text not null check (length(btrim(nome)) between 1 and 60),
  creato_il  timestamptz not null default now()
);

create index if not exists cartella_coppia_idx on public.cartella (coppia_id, creato_il desc);

-- Due cartelle con lo stesso nome nella stessa coppia sono solo confusione.
create unique index if not exists cartella_nome_unico
  on public.cartella (coppia_id, lower(btrim(nome)));

alter table public.foto
  add column if not exists cartella_id uuid references public.cartella(id) on delete set null;

create index if not exists foto_cartella_idx on public.foto (cartella_id);

-- -----------------------------------------------------------------------------
-- La copertina di film e ristoranti.
--
-- I preferiti non avevano immagini: la locandina di un film o la sala di un
-- ristorante non esistevano da nessuna parte, e "ingrandire l'immagine" non
-- aveva un'immagine da ingrandire.
--
-- **Si riusa `foto`** invece di aggiungere una colonna con un percorso: e' la
-- stessa scelta di D-33 — una sola entita' e piu' proiezioni. Cosi' la
-- copertina eredita gratis il bucket privato, gli indirizzi firmati, il tetto
-- di 1 GB, la regola "ciascuno cancella le proprie" e la catena di
-- cancellazione. Una colonna `copertina_url` avrebbe scavalcato tutte e cinque.
-- -----------------------------------------------------------------------------
alter table public.foto
  add column if not exists elemento_id uuid references public.elemento_lista(id) on delete set null;

create index if not exists foto_elemento_idx on public.foto (elemento_id);

alter table public.cartella enable row level security;

drop policy if exists cartella_leggi on public.cartella;
create policy cartella_leggi on public.cartella
  for select to authenticated
  using (public.e_membro_attivo(coppia_id));

drop policy if exists cartella_crea on public.cartella;
create policy cartella_crea on public.cartella
  for insert to authenticated
  with check (public.e_membro_attivo(coppia_id) and autore_id = auth.uid());

-- Rinomina e cancellazione: solo l'autore. La `using` sulla update impedisce di
-- toccare le altrui; la `with check` impedisce di **regalarle** a un altro
-- utente o di spostarle in un'altra coppia riscrivendo le chiavi.
drop policy if exists cartella_modifica on public.cartella;
create policy cartella_modifica on public.cartella
  for update to authenticated
  using (public.e_membro_attivo(coppia_id) and autore_id = auth.uid())
  with check (public.e_membro_attivo(coppia_id) and autore_id = auth.uid());

drop policy if exists cartella_cancella on public.cartella;
create policy cartella_cancella on public.cartella
  for delete to authenticated
  using (public.e_membro_attivo(coppia_id) and autore_id = auth.uid());

-- =============================================================================
-- Scioglimento: la stessa forma di 0008, con le cartelle aggiunte.
--
-- ⚠️ Riscritta per intero e non "modificata": una funzione di questa portata
-- riscritta a pezzi diverge dalla precedente senza che si veda nel diff.
-- L'unica differenza rispetto a 0008 e' il blocco CARTELLE e il fatto che gli
-- insiemi ora includono `v_cartelle`.
-- =============================================================================
create or replace function public.sciogli_coppia()
returns void
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_coppia    uuid;
  v_membri    uuid[];
  v_eventi    uuid[];
  v_luoghi    uuid[];
  v_elementi  uuid[];
  v_cartelle  uuid[];
  m           uuid;
  r           record;
  v_nuovo     uuid;
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
  select array_agg(id) into v_cartelle from cartella       where coppia_id = v_coppia;

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

    -- ELEMENTI (condivisi): copia a ciascuno, con la propria recensione e la
    -- propria copertina (0011: le foto possono essere legate a un elemento).
    for r in select * from elemento_lista where id = any(coalesce(v_elementi, array[]::uuid[])) and autore_id <> m loop
      insert into elemento_lista (coppia_id, autore_id, tipo, titolo, stato, fatto_il, creato_il)
      values (r.coppia_id, m, r.tipo, r.titolo, r.stato, r.fatto_il, r.creato_il)
      returning id into v_nuovo;
      update recensione set elemento_id = v_nuovo where elemento_id = r.id and autore_id = m;
      update foto       set elemento_id = v_nuovo where elemento_id = r.id and autore_id = m;
    end loop;

    -- CARTELLE (condivise, 0011): copia a ciascuno, e le foto di chi la riceve
    -- passano alla propria. Il nome puo' collidere con l'indice unico solo se
    -- l'altro ne aveva gia' una uguale — impossibile, perche' l'indice e' per
    -- coppia e la coppia e' la stessa: le due copie hanno autori diversi ma lo
    -- stesso nome. Per questo la copia prende un suffisso invisibile solo se
    -- serve, invece di far fallire l'intero scioglimento.
    for r in select * from cartella where id = any(coalesce(v_cartelle, array[]::uuid[])) and autore_id <> m loop
      insert into cartella (coppia_id, autore_id, nome, creato_il)
      values (
        r.coppia_id, m,
        case
          when exists (
            select 1 from cartella c
            where c.coppia_id = r.coppia_id
              and lower(btrim(c.nome)) = lower(btrim(r.nome))
              and c.autore_id = m
          ) then r.nome || ' ·'
          else r.nome
        end,
        r.creato_il
      )
      returning id into v_nuovo;
      update foto set cartella_id = v_nuovo where cartella_id = r.id and autore_id = m;
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
