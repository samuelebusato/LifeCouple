-- =============================================================================
-- LifeCouple — 0005: la data da cui si sta insieme
--
-- Si chiede appena la coppia si forma (il partner ha accettato l'invito) e
-- serve a due cose: il riquadro in home che conta i giorni passati insieme, e
-- un segno fisso sul calendario.
--
-- Perche' una funzione e non una scrittura diretta: `coppia` non ha policy di
-- INSERT/UPDATE, quindi dal client e' **impossibile** scriverci — e resta cosi'.
-- E' la stessa regola che tiene in piedi tutto l'impianto di autorizzazione
-- (nessun insert diretto su coppia e membro_coppia, D-14/D-25): l'unica via
-- e' una funzione che verifica l'appartenenza.
-- =============================================================================

alter table public.coppia
  add column if not exists insieme_dal date;

-- Marcatore dell'evento generato dall'app: permette di ritrovarlo e spostarlo
-- se la data viene corretta, invece di lasciare in giro doppioni.
alter table public.evento
  add column if not exists speciale text
  check (speciale is null or speciale in ('insieme_dal'));

create unique index if not exists evento_speciale_unico
  on public.evento (coppia_id, speciale)
  where speciale is not null;

-- Il titolo arriva dal client perche' e' l'unico a sapere in che lingua sta
-- parlando l'utente (D-24: la lingua la decide il dispositivo, il database non
-- la conosce). Resta scritto nella lingua di chi lo imposta: e' un contenuto,
-- come tutti gli altri.
create or replace function public.imposta_insieme_dal(p_data date, p_titolo text)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_coppia uuid;
begin
  if auth.uid() is null then
    raise exception 'non autenticato';
  end if;
  if p_data is null then
    raise exception 'data mancante';
  end if;
  if p_data > current_date then
    raise exception 'la data di inizio non puo'' essere nel futuro';
  end if;

  select coppia_id into v_coppia
  from membro_coppia
  where utente_id = auth.uid() and uscito_il is null
  limit 1;

  if v_coppia is null then
    raise exception 'non sei in una coppia';
  end if;

  update coppia set insieme_dal = p_data where id = v_coppia;

  -- Mezzogiorno invece che mezzanotte: l'ora non si vede (l'evento dura tutto
  -- il giorno) ma tiene il giorno giusto in ogni fuso, mentre una mezzanotte
  -- UTC diventerebbe il giorno prima per chi sta a ovest.
  insert into evento (coppia_id, autore_id, titolo, inizio, tutto_il_giorno, speciale)
  values (v_coppia, auth.uid(), p_titolo, (p_data + time '12:00')::timestamptz, true, 'insieme_dal')
  on conflict (coppia_id, speciale) where speciale is not null
  do update set inizio = excluded.inizio, titolo = excluded.titolo;
end;
$$;

revoke execute on function public.imposta_insieme_dal(date, text) from public, anon;
grant execute on function public.imposta_insieme_dal(date, text) to authenticated;

-- Limite accettato e dichiarato: un client puo' comunque inserire per conto suo
-- un evento con `speciale = 'insieme_dal'` (le policy guardano la coppia e
-- l'autore, non le singole colonne). Il danno si ferma al proprio calendario —
-- nessun confine di coppia viene toccato — e l'indice unico impedisce che ne
-- esistano due. Un trigger che azzeri la colonna sugli inserimenti diretti si
-- puo' aggiungere se un giorno la colonna significhera' qualcosa di piu'.
