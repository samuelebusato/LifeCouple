-- =============================================================================
-- LifeCouple — 0015: un ristorante con una serata passata diventa "fatto"
--
-- Chiesto dall'utente il 2026-08-27: «quando l'evento con associato un
-- ristorante viene superato, allora il ristorante passa in automatico a
-- visitato».
--
-- ## Perche' una funzione, e non un trigger
--
-- Un trigger scatta su una **scrittura**. Qui non scrive nessuno: e' il *tempo*
-- che passa. Al momento in cui l'evento diventa passato non succede niente nel
-- database, quindi non c'e' niente da intercettare.
--
-- Restavano due strade: un lavoro pianificato (pg_cron) oppure una passata
-- fatta quando qualcuno guarda. Si e' scelta la seconda, perche' il risultato
-- si vede solo se qualcuno lo guarda: aggiornare la riga alle 3 di notte non
-- ha alcun valore in piu' rispetto ad aggiornarla un istante prima che venga
-- letta, e costa un pezzo di infrastruttura in piu' da mantenere.
--
-- ## Perche' `security definer`
--
-- La policy di `elemento_lista` consente l'update **al solo autore** (0001).
-- Ma la serata la puo' aver messa in calendario il partner: se la passata
-- girasse coi privilegi del chiamante, il ristorante si aggiornerebbe solo
-- quando apre l'app chi l'ha aggiunto — cioe' a volte si' e a volte no, senza
-- che l'utente possa capire perche'. La funzione gira coi privilegi del
-- proprietario, ma **solo sulla coppia di chi chiama**: e' `e_membro_attivo`
-- a delimitarla, ed e' il primo controllo che fa.
--
-- ## Due tabelle, un fatto solo
--
-- Lo stesso fatto vive in due posti — `elemento_lista.stato = 'fatto'` per i
-- preferiti e `luogo.stato = 'visitato'` per la mappa — ed e' cosi' da 0012.
-- La funzione li scrive **entrambi**: lasciarne indietro uno vorrebbe dire un
-- ristorante segnato come provato nella lista e ancora "da visitare" sulla
-- mappa, cioe' la contraddizione piu' visibile che questo modello permetta.
--
-- ## Cosa NON fa
--
-- Non torna mai indietro. Se qualcuno rimette a mano un ristorante su "da
-- provare", la passata successiva **non** lo rimette su "fatto": la condizione
-- guarda `fatto_il`, che a quel punto e' gia' valorizzato. Una correzione
-- manuale che viene disfatta da sola sarebbe peggio del problema che risolve.
-- =============================================================================

create or replace function public.aggiorna_ristoranti_visitati()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coppia uuid;
  v_quanti integer := 0;
begin
  -- La coppia attiva di chi chiama. Fuori da qui la funzione non tocca niente.
  select coppia_id into v_coppia
  from membro_coppia
  where utente_id = auth.uid() and uscito_il is null
  limit 1;

  if v_coppia is null then
    return 0;
  end if;

  -- I ristoranti con almeno una serata gia' passata, non ancora segnati.
  with da_segnare as (
    select el.id,
           el.luogo_id,
           max(coalesce(ev.fine, ev.inizio)) as ultima
    from elemento_lista el
    join evento ev on ev.elemento_id = el.id
    where el.coppia_id = v_coppia
      and el.tipo = 'ristorante'
      and el.fatto_il is null
      and coalesce(ev.fine, ev.inizio) < now()
    group by el.id, el.luogo_id
  ),
  segnati as (
    update elemento_lista el
       set stato = 'fatto',
           -- La data e' quella della **serata**, non di adesso: e' quando ci
           -- siete stati, ed e' l'informazione che poi si legge nella lista.
           fatto_il = d.ultima
      from da_segnare d
     where el.id = d.id
    returning d.luogo_id
  )
  update luogo l
     set stato = 'visitato',
         visitato_il = coalesce(l.visitato_il, now())
    from segnati s
   where l.id = s.luogo_id
     and l.stato is distinct from 'visitato';

  get diagnostics v_quanti = row_count;
  return v_quanti;
end;
$$;

-- --- permessi: la lezione di B-07 applicata in partenza -----------------------
-- Revoca da **public E anon** (non da uno solo dei due: e' stato B-01 in un
-- verso e B-07 nell'altro), poi grant al solo `authenticated`.
revoke execute on function public.aggiorna_ristoranti_visitati() from public, anon;
grant  execute on function public.aggiorna_ristoranti_visitati() to authenticated;
