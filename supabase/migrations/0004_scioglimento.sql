-- =============================================================================
-- LifeCouple — 0004: scioglimento della coppia (D-04, D-16, D-21)
--
-- E' la funzione piu' delicata dell'impianto: e' il momento in cui due diritti
-- reali si scontrano (art. 17 di chi vuole cancellare, memoria di chi vuole
-- conservare) e in cui l'unita' di autorizzazione dell'app — la coppia —
-- cessa di esistere mentre i dati restano.
--
-- Le tre regole che la governano, gia' decise:
--   D-04  lo scioglimento REVOCA L'ACCESSO, non cancella. Ciascuno conserva
--         cio' che ha caricato; cio' che ha caricato l'altro sparisce.
--   D-21  la sorte segue la SENSIBILITA', non la condivisione:
--           personale (foto, recensione)            -> resta solo all'autore
--           condiviso (evento, luogo, elemento)     -> duplicato, una copia a
--                                                      ciascuno, legame reciso
--   D-16  la creatura sparisce per entrambi.
--
-- Come regge dopo lo scioglimento, senza toccare una sola policy: le policy di
-- lettura dei contenuti sono gia' `e_membro_attivo(coppia_id) OR autore_id =
-- auth.uid()`, e quelle di modifica/cancellazione solo `autore_id =
-- auth.uid()`. Quindi appena `uscito_il` viene valorizzato, ciascuno smette di
-- vedere le righe altrui e continua a vedere — e a poter cancellare — le
-- proprie. L'insert resta legato a `e_membro_attivo`: a una storia finita non
-- si aggiunge nulla.
--
-- SCELTA REGISTRATA — lo scioglimento e' UNILATERALE: non serve il consenso
-- dell'altro, e non c'e' modo per l'altro di impedirlo. Il contrario
-- intrappolerebbe chi ha piu' bisogno di uscire, che e' esattamente lo
-- scenario del confine di fiducia TB-2 (partner contro partner).
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
  -- troverebbe nell'elenco anche le copie appena fatte per il primo, e ogni
  -- giro raddoppierebbe il precedente.
  select array_agg(id) into v_eventi   from evento         where coppia_id = v_coppia;
  select array_agg(id) into v_luoghi   from luogo          where coppia_id = v_coppia;
  select array_agg(id) into v_elementi from elemento_lista where coppia_id = v_coppia;

  -- ---------------------------------------------------------------------
  -- D-21: i contenuti condivisi, duplicati una copia a ciascuno.
  -- Si copia solo cio' di cui il membro NON e' gia' autore: l'originale e'
  -- gia' la sua copia. A fine giro ogni contenuto esiste due volte, una per
  -- persona, e le due righe non si conoscono piu'.
  -- Riga per riga invece che in blocco: servono gli id nuovi per ricucire
  -- foto e recensioni. A scala di coppia il costo e' irrilevante.
  -- ---------------------------------------------------------------------
  foreach m in array coalesce(v_membri, array[]::uuid[]) loop

    for r in select * from evento where id = any(coalesce(v_eventi, array[]::uuid[])) and autore_id <> m loop
      insert into evento (coppia_id, autore_id, titolo, inizio, fine, tutto_il_giorno, nota, creato_il)
      values (r.coppia_id, m, r.titolo, r.inizio, r.fine, r.tutto_il_giorno, r.nota, r.creato_il);
    end loop;

    for r in select * from luogo where id = any(coalesce(v_luoghi, array[]::uuid[])) and autore_id <> m loop
      insert into luogo (coppia_id, autore_id, nome, lat, lng, stato, visitato_il, nota, creato_il)
      values (r.coppia_id, m, r.nome, r.lat, r.lng, r.stato, r.visitato_il, r.nota, r.creato_il)
      returning id into v_nuovo;
      -- Le foto restano all'autore (sono personali), ma quelle legate a un
      -- luogo altrui devono puntare alla copia propria: altrimenti resterebbero
      -- appese a una riga che il loro autore non vede piu'.
      update foto set luogo_id = v_nuovo where luogo_id = r.id and autore_id = m;
    end loop;

    for r in select * from elemento_lista where id = any(coalesce(v_elementi, array[]::uuid[])) and autore_id <> m loop
      insert into elemento_lista (coppia_id, autore_id, tipo, titolo, stato, fatto_il, creato_il)
      values (r.coppia_id, m, r.tipo, r.titolo, r.stato, r.fatto_il, r.creato_il)
      returning id into v_nuovo;
      -- Stessa cura per la recensione, che e' personale: segue il suo autore
      -- sulla copia di cui e' proprietario. Il vincolo unique(elemento, autore)
      -- non puo' scattare: la copia e' appena nata.
      update recensione set elemento_id = v_nuovo where elemento_id = r.id and autore_id = m;
    end loop;

  end loop;

  -- ---------------------------------------------------------------------
  -- D-16: la creatura sparisce per entrambi, e con lei il punteggio che la
  -- alimentava. Con la creatura se ne vanno anche le partite (cascata su
  -- invio_sigillato e partita_risultato) e le domande personalizzate.
  --
  -- Perche' cancellare invece di lasciare invisibile: dopo lo scioglimento
  -- nessuno e' piu' membro attivo, quindi nessuno potrebbe piu' leggere né
  -- cancellare quelle righe — sarebbero dati orfani che sopravvivono a chi
  -- li ha generati, il contrario di quanto vuole la catena di cancellazione.
  -- I ricordi (contenuti) hanno un autore che li conserva; una partita no.
  -- ---------------------------------------------------------------------
  delete from partita      where coppia_id = v_coppia;
  delete from domanda      where coppia_id = v_coppia;
  delete from punti_evento where coppia_id = v_coppia;
  delete from creatura     where coppia_id = v_coppia;

  -- Un invito ancora vivo aprirebbe una porta su una coppia che non c'e' piu'.
  update invito set stato = 'revocato'
  where coppia_id = v_coppia and stato in ('emesso', 'aperto_in_attesa_conferma');

  -- Traccia dell'atto, finche' si e' ancora membri (la policy di scrittura del
  -- registro lo richiede, e questa funzione non deve essere l'eccezione).
  insert into registro_azioni (coppia_id, autore_id, azione, oggetto)
  values (v_coppia, auth.uid(), 'scioglimento', jsonb_build_object('membri', v_membri));

  update membro_coppia set uscito_il = now()
  where coppia_id = v_coppia and uscito_il is null;

  update coppia set stato = 'sciolta', sciolta_il = now()
  where id = v_coppia;
end;
$$;

-- Permessi chiusi con la lezione di B-01: revoke FROM PUBLIC, non solo da anon.
revoke execute on function public.sciogli_coppia() from public, anon;
grant execute on function public.sciogli_coppia() to authenticated;
