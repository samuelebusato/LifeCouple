-- =============================================================================
-- LifeCouple — 0013: i ristoranti sono posti veri (Google Places)
--
-- Deciso il 2026-08-13 (sera): un ristorante non si scrive a mano libera — si
-- SCEGLIE fra quelli che esistono, e la sua foto su Google diventa la
-- copertina in app. Due colonne:
--
--   * `google_place_id` — l'identificativo del posto su Google: e' cio' che
--     rende il ristorante "vero" e ritrovabile.
--   * `foto_google` — il nome-risorsa della foto Places. Si salva il NOME, non
--     l'immagine: le condizioni d'uso di Places prevedono che le foto si
--     chiedano a Google al momento di mostrarle, non che se ne tengano copie.
-- =============================================================================

alter table public.elemento_lista
  add column if not exists google_place_id text,
  add column if not exists foto_google text;

-- Lo scioglimento copia anche i due campi nuovi: senza, la copia dell'ex
-- perderebbe copertina e identita' del posto — perdita silenziosa alla prima
-- rottura, la specie di buco che B-05 insegna a chiudere nello stesso commit.
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

  drop table if exists _mappa_luogo;
  drop table if exists _mappa_elemento;
  create temp table _mappa_luogo    (vecchio uuid primary key, nuovo uuid not null) on commit drop;
  create temp table _mappa_elemento (vecchio uuid primary key, nuovo uuid not null) on commit drop;

  select array_agg(id) into v_eventi   from evento         where coppia_id = v_coppia;
  select array_agg(id) into v_luoghi   from luogo          where coppia_id = v_coppia;
  select array_agg(id) into v_elementi from elemento_lista where coppia_id = v_coppia;
  select array_agg(id) into v_cartelle from cartella       where coppia_id = v_coppia;

  foreach m in array coalesce(v_membri, array[]::uuid[]) loop
    truncate _mappa_luogo;
    truncate _mappa_elemento;

    for r in select * from luogo where id = any(coalesce(v_luoghi, array[]::uuid[])) and autore_id <> m loop
      insert into luogo (coppia_id, autore_id, nome, lat, lng, stato, visitato_il, nota, creato_il)
      values (r.coppia_id, m, r.nome, r.lat, r.lng, r.stato, r.visitato_il, r.nota, r.creato_il)
      returning id into v_nuovo;
      insert into _mappa_luogo values (r.id, v_nuovo);
      update foto           set luogo_id = v_nuovo where luogo_id = r.id and autore_id = m;
      update evento         set luogo_id = v_nuovo where luogo_id = r.id and autore_id = m;
      update elemento_lista set luogo_id = v_nuovo where luogo_id = r.id and autore_id = m;
    end loop;

    for r in select * from elemento_lista where id = any(coalesce(v_elementi, array[]::uuid[])) and autore_id <> m loop
      insert into elemento_lista (coppia_id, autore_id, tipo, titolo, stato, fatto_il, creato_il,
                                  luogo_id, google_place_id, foto_google)
      values (r.coppia_id, m, r.tipo, r.titolo, r.stato, r.fatto_il, r.creato_il,
              coalesce((select nuovo from _mappa_luogo where vecchio = r.luogo_id), r.luogo_id),
              r.google_place_id, r.foto_google)
      returning id into v_nuovo;
      insert into _mappa_elemento values (r.id, v_nuovo);
      update recensione set elemento_id = v_nuovo where elemento_id = r.id and autore_id = m;
      update foto       set elemento_id = v_nuovo where elemento_id = r.id and autore_id = m;
      update evento     set elemento_id = v_nuovo where elemento_id = r.id and autore_id = m;
    end loop;

    for r in select * from evento where id = any(coalesce(v_eventi, array[]::uuid[])) and autore_id <> m loop
      insert into evento (coppia_id, autore_id, titolo, inizio, fine, tutto_il_giorno, nota,
                          tipo, categoria, origine_esterna, luogo_id, elemento_id, creato_il)
      values (r.coppia_id, m, r.titolo, r.inizio, r.fine, r.tutto_il_giorno, r.nota,
              r.tipo, r.categoria, null,
              coalesce((select nuovo from _mappa_luogo    where vecchio = r.luogo_id),    r.luogo_id),
              coalesce((select nuovo from _mappa_elemento where vecchio = r.elemento_id), r.elemento_id),
              r.creato_il)
      returning id into v_nuovo;
      update foto     set evento_id = v_nuovo where evento_id = r.id and autore_id = m;
      update commento set evento_id = v_nuovo where evento_id = r.id and autore_id = m;
    end loop;

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
