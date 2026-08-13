-- =============================================================================
-- LifeCouple — 0012: il ristorante entra nel modello dell'evento
--
-- Due legami nuovi, chiesti il 2026-08-13:
--
--   * `evento.elemento_id` — un evento puo' avere un **ristorante** (la cena da
--     qualche parte). Toccando il ristorante si arriva all'evento: e' D-33
--     esteso — l'evento resta il centro, il ristorante e' un'altra strada.
--   * `elemento_lista.luogo_id` — un ristorante puo' avere un **posto**: e' cio'
--     che lo fa comparire sulla mappa. Senza coordinate un ristorante e' solo
--     una riga di testo, e la mappa non puo' disegnare testo.
--
-- E una correzione: B-05 (vedi sotto, nella funzione).
-- =============================================================================

alter table public.evento
  add column if not exists elemento_id uuid references public.elemento_lista(id) on delete set null;
create index if not exists evento_elemento_idx on public.evento (elemento_id);

alter table public.elemento_lista
  add column if not exists luogo_id uuid references public.luogo(id) on delete set null;
create index if not exists elemento_luogo_idx on public.elemento_lista (luogo_id);

-- =============================================================================
-- Scioglimento, riscritto con le **tabelle di mappatura** (B-05).
--
-- 🔴 Il difetto che questa riscrittura corregge, presente da 0008: quando si
-- copiava un evento per il membro m, il suo `luogo_id` restava quello
-- ORIGINALE. Se quel luogo era dell'altro membro, m ne riceveva si' una copia,
-- ma l'evento copiato continuava a puntare all'originale — che dopo la rottura
-- m non puo' piu' leggere. Risultato: eventi copiati con il posto "sparito".
-- Nessun test lo copriva, perche' i test di scioglimento verificavano la
-- visibilita' delle righe, non la raggiungibilita' dei loro riferimenti.
--
-- La cura: durante la copia si tiene la mappa vecchio → nuovo (tabelle
-- temporanee, svuotate per ogni membro), e ogni copia che punta a una riga
-- copiata viene ricucita sulla copia. L'ordine dei blocchi ora conta:
-- luoghi → elementi (usano la mappa dei luoghi) → eventi (usano entrambe).
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

  -- Le mappe vecchio → nuovo. Temporanee e svuotate per membro: la copia di m1
  -- non deve mai finire agganciata alla copia di m2.
  drop table if exists _mappa_luogo;
  drop table if exists _mappa_elemento;
  create temp table _mappa_luogo    (vecchio uuid primary key, nuovo uuid not null) on commit drop;
  create temp table _mappa_elemento (vecchio uuid primary key, nuovo uuid not null) on commit drop;

  -- Gli insiemi si fissano PRIMA di duplicare: senza questo, il secondo membro
  -- troverebbe nell'elenco anche le copie appena fatte per il primo.
  select array_agg(id) into v_eventi   from evento         where coppia_id = v_coppia;
  select array_agg(id) into v_luoghi   from luogo          where coppia_id = v_coppia;
  select array_agg(id) into v_elementi from elemento_lista where coppia_id = v_coppia;
  select array_agg(id) into v_cartelle from cartella       where coppia_id = v_coppia;

  foreach m in array coalesce(v_membri, array[]::uuid[]) loop
    truncate _mappa_luogo;
    truncate _mappa_elemento;

    -- LUOGHI (condivisi): copia a ciascuno. I riferimenti dei contenuti che m
    -- possiede GIA' vengono spostati subito; quelli delle copie che nasceranno
    -- dopo passano dalla mappa.
    for r in select * from luogo where id = any(coalesce(v_luoghi, array[]::uuid[])) and autore_id <> m loop
      insert into luogo (coppia_id, autore_id, nome, lat, lng, stato, visitato_il, nota, creato_il)
      values (r.coppia_id, m, r.nome, r.lat, r.lng, r.stato, r.visitato_il, r.nota, r.creato_il)
      returning id into v_nuovo;
      insert into _mappa_luogo values (r.id, v_nuovo);
      update foto           set luogo_id = v_nuovo where luogo_id = r.id and autore_id = m;
      update evento         set luogo_id = v_nuovo where luogo_id = r.id and autore_id = m;
      update elemento_lista set luogo_id = v_nuovo where luogo_id = r.id and autore_id = m;
    end loop;

    -- ELEMENTI (condivisi): copia a ciascuno, con la propria recensione, la
    -- propria copertina, e il posto ricucito sulla propria copia.
    for r in select * from elemento_lista where id = any(coalesce(v_elementi, array[]::uuid[])) and autore_id <> m loop
      insert into elemento_lista (coppia_id, autore_id, tipo, titolo, stato, fatto_il, creato_il, luogo_id)
      values (r.coppia_id, m, r.tipo, r.titolo, r.stato, r.fatto_il, r.creato_il,
              coalesce((select nuovo from _mappa_luogo where vecchio = r.luogo_id), r.luogo_id))
      returning id into v_nuovo;
      insert into _mappa_elemento values (r.id, v_nuovo);
      update recensione set elemento_id = v_nuovo where elemento_id = r.id and autore_id = m;
      update foto       set elemento_id = v_nuovo where elemento_id = r.id and autore_id = m;
      update evento     set elemento_id = v_nuovo where elemento_id = r.id and autore_id = m;
    end loop;

    -- EVENTI (condivisi): copia a ciascuno. Luogo e ristorante della copia
    -- passano dalle mappe: e' il punto in cui B-05 viveva.
    for r in select * from evento where id = any(coalesce(v_eventi, array[]::uuid[])) and autore_id <> m loop
      insert into evento (coppia_id, autore_id, titolo, inizio, fine, tutto_il_giorno, nota,
                          tipo, categoria, origine_esterna, luogo_id, elemento_id, creato_il)
      values (r.coppia_id, m, r.titolo, r.inizio, r.fine, r.tutto_il_giorno, r.nota,
              r.tipo, r.categoria,
              -- l'origine esterna e' unica per coppia: la copia non la porta
              null,
              coalesce((select nuovo from _mappa_luogo    where vecchio = r.luogo_id),    r.luogo_id),
              coalesce((select nuovo from _mappa_elemento where vecchio = r.elemento_id), r.elemento_id),
              r.creato_il)
      returning id into v_nuovo;
      update foto     set evento_id = v_nuovo where evento_id = r.id and autore_id = m;
      update commento set evento_id = v_nuovo where evento_id = r.id and autore_id = m;
    end loop;

    -- CARTELLE (condivise, 0011): copia a ciascuno, e le foto di chi la riceve
    -- passano alla propria. Suffisso solo in caso di collisione di nome.
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
