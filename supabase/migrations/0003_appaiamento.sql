-- =============================================================================
-- LifeCouple — 0003: appaiamento via link (D-14)
--
-- Le quattro condizioni di D-14, tutte imposte qui e non nel client:
--   token a entropia sufficiente  -> gen_random_bytes(24) = 192 bit
--   scadenza breve                -> 72 ore
--   monouso                       -> stato dell'invito, non riutilizzabile
--   conferma di chi ha invitato   -> due passi separati: apri_invito (l'ospite)
--                                    poi conferma_invito (chi ha invitato)
--
-- Il token viaggia su WhatsApp: si inoltra, si legge da una notifica, resta in
-- una chat di gruppo. Le prime tre condizioni riducono la probabilita' che un
-- estraneo entri; SOLO la conferma la INTERROMPE. Per questo aprire un invito
-- NON appaia: mette l'invito "in attesa di conferma", e chi ha invitato deve
-- dire di si'.
--
-- Nel DB si salva solo l'IMPRONTA del token (sha256): un dump non apre inviti.
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

-- Guardia riusata: sei gia' in una coppia attiva?
create or replace function public.ha_coppia_attiva(uid uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from membro_coppia
    where utente_id = uid and uscito_il is null
  );
$$;

-- Quanti membri attivi ha la coppia (una coppia e' "completa" a 2).
create or replace function public.n_membri_attivi(cid uuid)
returns integer
language sql stable security definer
set search_path = public
as $$
  select count(*)::int from membro_coppia
  where coppia_id = cid and uscito_il is null;
$$;

-- -----------------------------------------------------------------------------
-- crea_invito: chi e' gia' in una coppia non ancora completa genera un link.
-- Restituisce il token IN CHIARO una sola volta (nel DB resta solo l'hash).
-- Scade eventuali inviti pendenti precedenti della stessa coppia: un solo
-- invito vivo alla volta, cosi' "monouso" e' anche "uno solo".
-- -----------------------------------------------------------------------------
create or replace function public.crea_invito()
returns text
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_coppia uuid;
  v_token  text;
begin
  select coppia_id into v_coppia
  from membro_coppia
  where utente_id = auth.uid() and uscito_il is null
  limit 1;

  if v_coppia is null then
    raise exception 'non sei in una coppia: creane una prima di invitare';
  end if;
  if n_membri_attivi(v_coppia) >= 2 then
    raise exception 'la coppia e'' gia'' completa';
  end if;

  update invito set stato = 'scaduto'
  where coppia_id = v_coppia and stato in ('emesso', 'aperto_in_attesa_conferma');

  v_token := encode(gen_random_bytes(24), 'hex');
  insert into invito (coppia_id, creato_da, token_hash, scade_il)
  values (v_coppia, auth.uid(), encode(digest(v_token, 'sha256'), 'hex'), now() + interval '72 hours');

  return v_token;
end;
$$;

-- -----------------------------------------------------------------------------
-- apri_invito: l'ospite apre il link. NON lo fa entrare: mette l'invito in
-- attesa di conferma e registra chi ha aperto. Ritorna l'id dell'invito.
-- -----------------------------------------------------------------------------
create or replace function public.apri_invito(p_token text)
returns uuid
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_inv invito%rowtype;
begin
  if auth.uid() is null then
    raise exception 'non autenticato';
  end if;

  select * into v_inv from invito
  where token_hash = encode(digest(p_token, 'sha256'), 'hex')
  for update;

  if not found then
    raise exception 'invito non valido';
  end if;
  if v_inv.scade_il < now() then
    update invito set stato = 'scaduto' where id = v_inv.id and stato = 'emesso';
    raise exception 'invito scaduto';
  end if;
  if v_inv.stato <> 'emesso' then
    raise exception 'invito non piu'' disponibile';
  end if;
  if v_inv.creato_da = auth.uid() then
    raise exception 'non puoi aprire un invito che hai creato tu';
  end if;
  if ha_coppia_attiva(auth.uid()) then
    raise exception 'sei gia'' in una coppia attiva';
  end if;

  update invito
  set stato = 'aperto_in_attesa_conferma', aperto_da = auth.uid()
  where id = v_inv.id;

  return v_inv.id;
end;
$$;

-- -----------------------------------------------------------------------------
-- conferma_invito: SOLO chi ha invitato, e solo dopo che qualcuno ha aperto.
-- E' il passo che interrompe l'ingresso di un estraneo (D-14). Qui l'ospite
-- entra davvero nella coppia.
-- -----------------------------------------------------------------------------
create or replace function public.conferma_invito(p_invito_id uuid)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_inv invito%rowtype;
begin
  select * into v_inv from invito where id = p_invito_id for update;

  if not found or v_inv.creato_da <> auth.uid() then
    raise exception 'solo chi ha invitato puo'' confermare';
  end if;
  if v_inv.stato <> 'aperto_in_attesa_conferma' then
    raise exception 'nessuna apertura da confermare';
  end if;
  if n_membri_attivi(v_inv.coppia_id) >= 2 then
    raise exception 'la coppia e'' gia'' completa';
  end if;
  -- l'ospite potrebbe essere entrato in un'altra coppia tra apertura e conferma
  if ha_coppia_attiva(v_inv.aperto_da) then
    raise exception 'la persona invitata e'' gia'' in un''altra coppia';
  end if;

  insert into membro_coppia (coppia_id, utente_id) values (v_inv.coppia_id, v_inv.aperto_da);
  update invito set stato = 'accettato', usato_il = now() where id = v_inv.id;

  return v_inv.coppia_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- revoca_invito: chi ha invitato annulla un link non ancora accettato.
-- -----------------------------------------------------------------------------
create or replace function public.revoca_invito(p_invito_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_inv invito%rowtype;
begin
  select * into v_inv from invito where id = p_invito_id for update;
  if not found or v_inv.creato_da <> auth.uid() then
    raise exception 'solo chi ha invitato puo'' revocare';
  end if;
  if v_inv.stato not in ('emesso', 'aperto_in_attesa_conferma') then
    raise exception 'questo invito non e'' revocabile';
  end if;
  update invito set stato = 'revocato' where id = v_inv.id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Permessi: lezione di B-01 applicata. revoke from public (non da anon),
-- poi grant al solo authenticated. Le funzioni di sola lettura interne
-- (ha_coppia_attiva, n_membri_attivi) le chiamano solo le altre funzioni.
-- -----------------------------------------------------------------------------
revoke execute on function public.crea_invito()          from public;
revoke execute on function public.apri_invito(text)      from public;
revoke execute on function public.conferma_invito(uuid)  from public;
revoke execute on function public.revoca_invito(uuid)    from public;
revoke execute on function public.ha_coppia_attiva(uuid) from public;
revoke execute on function public.n_membri_attivi(uuid)  from public;

grant execute on function public.crea_invito()         to authenticated;
grant execute on function public.apri_invito(text)     to authenticated;
grant execute on function public.conferma_invito(uuid) to authenticated;
grant execute on function public.revoca_invito(uuid)   to authenticated;
