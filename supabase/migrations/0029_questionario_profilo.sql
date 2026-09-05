-- =============================================================================
-- LifeCouple — 0029: il questionario di profilo della coppia
--
-- Si propone **alla formazione della coppia**, subito dopo che il partner ha
-- accettato l'invito, ed e' facoltativo.
--
-- ## 🔴 Perche' questa tabella e' diversa da tutte le altre del progetto
--
-- Ogni altro dato di LifeCouple sta qui perche' **serve a far funzionare il
-- servizio**: le foto, i luoghi, gli eventi, le risposte dei giochi hanno tutti
-- base giuridica "esecuzione del contratto" (art. 6.1.b), perche' senza di essi
-- l'app non fa quello che promette.
--
-- Questa no. Queste risposte **non servono all'utente**: servono a chi sviluppa
-- l'app per capire chi la usa. E' la prima raccolta di dati del progetto che
-- l'interessato non riceve indietro come funzione, e questo cambia tre cose:
--
--   1. **La base giuridica e' il CONSENSO** (art. 6.1.a), non il contratto.
--      Deve essere libero, specifico, informato e **revocabile con la stessa
--      facilita' con cui e' stato dato** (art. 7.3) — da cui
--      `cancella_profilo_coppia()` piu' sotto, che non e' una cortesia.
--   2. **Nessuna risposta e' obbligatoria** e saltare non deve costare niente:
--      un consenso che sblocca l'ingresso non e' libero, e quindi non e' un
--      consenso valido. Ogni colonna e' quindi `null`.
--   3. 🔴 **Contraddice cio' che i documenti legali dichiaravano.** Il registro
--      dei trattamenti diceva «Profilazione, analytics, pubblicita' — nessuno
--      strumento, ne' proprio ne' di terze parti». Con questa migrazione non e'
--      piu' vero, e i due documenti sono stati aggiornati nello stesso giro
--      (A7 nel registro, riga nuova in §3 dell'informativa). Una tabella che
--      raccoglie dati che l'informativa nega e' peggio di nessuna tabella.
--
-- ## Il consenso e' la riga stessa
--
-- Non c'e' una colonna `ha_acconsentito boolean`: **la riga esiste solo se la
-- coppia ha acconsentito**, e revocare significa cancellarla. Un booleano
-- avrebbe permesso lo stato "riga presente, consenso falso, risposte dentro",
-- che e' esattamente il dato che non deve poter esistere.
--
-- ## Perche' sulla coppia e non sull'utente
--
-- L'unita' di misura del prodotto e' la coppia: l'abbonamento e' della coppia,
-- il punteggio dei giochi e' della coppia. Un profilo per utente avrebbe
-- prodotto due riposte per la stessa realta' ("convivete?" ha una risposta
-- sola) e avrebbe posto un problema che qui non si pone: che ne e' del profilo
-- di chi resta, quando la coppia si scioglie. Cosi' la riga muore con la
-- coppia, per `on delete cascade`, senza nessuna regola speciale.
-- =============================================================================

create table if not exists public.profilo_coppia (
  coppia_id uuid primary key references public.coppia(id) on delete cascade,

  -- ⚠️ Tutte le risposte sono `text` con un vincolo di dominio invece che un
  -- enum: un enum va migrato con una ALTER TYPE ogni volta che si aggiunge una
  -- risposta possibile, e queste opzioni cambieranno di sicuro. Il vincolo
  -- controlla lo stesso che non entri testo libero.
  conosciuto_da text check (conosciuto_da in ('store', 'amici', 'social', 'ricerca', 'altro')),
  fascia_eta    text check (fascia_eta in ('14-17', '18-24', '25-34', '35-44', '45+')),
  convivenza    text check (convivenza in ('insieme', 'separati', 'distanza')),
  interesse     text check (interesse in ('ricordi', 'organizzarsi', 'giocare')),

  -- Quando il consenso e' stato prestato. Obbligatorio: e' l'unica prova che
  -- questa riga puo' esistere.
  consenso_il timestamptz not null default now(),
  aggiornato_il timestamptz not null default now()
);

comment on table public.profilo_coppia is
  'Risposte facoltative del questionario di ingresso. Base giuridica: consenso (art. 6.1.a). La riga esiste solo se il consenso e'' stato prestato; revocarlo significa cancellarla.';

alter table public.profilo_coppia enable row level security;

-- ⚠️ Sola **lettura** da policy, e solo ai membri attivi della propria coppia:
-- serve a mostrare alla coppia cosa ha risposto (art. 15, diritto di accesso) e
-- a sapere se il questionario e' gia' stato fatto. La scrittura resta fuori
-- dalle policy e passa dalla funzione, come per `coppia` e `membro_coppia`:
-- e' la regola che tiene in piedi l'impianto di autorizzazione (D-14/D-25).
drop policy if exists profilo_coppia_select on public.profilo_coppia;
create policy profilo_coppia_select on public.profilo_coppia
  for select
  using (public.e_membro_attivo(coppia_id));

/**
 * Salva (o aggiorna) le risposte. Chiamarla **e'** l'atto di consenso: l'app
 * non deve chiamarla se l'utente non ha spuntato la casella.
 *
 * Ogni parametro puo' essere null — si puo' rispondere a una domanda sola.
 */
create or replace function public.salva_profilo_coppia(
  p_conosciuto_da text default null,
  p_fascia_eta    text default null,
  p_convivenza    text default null,
  p_interesse     text default null
)
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

  select coppia_id into v_coppia
  from membro_coppia
  where utente_id = auth.uid() and uscito_il is null
  limit 1;

  if v_coppia is null then
    raise exception 'non sei in una coppia';
  end if;

  insert into profilo_coppia as p (coppia_id, conosciuto_da, fascia_eta, convivenza, interesse)
  values (v_coppia, p_conosciuto_da, p_fascia_eta, p_convivenza, p_interesse)
  on conflict (coppia_id) do update
    -- ⚠️ `coalesce` con il valore **gia' presente**: chi ricompila una domanda
    -- sola non deve cancellare le risposte dell'altro membro. Senza questo, il
    -- secondo salvataggio azzererebbe tutto cio' che non e' stato ripassato.
    set conosciuto_da = coalesce(excluded.conosciuto_da, p.conosciuto_da),
        fascia_eta    = coalesce(excluded.fascia_eta,    p.fascia_eta),
        convivenza    = coalesce(excluded.convivenza,    p.convivenza),
        interesse     = coalesce(excluded.interesse,     p.interesse),
        aggiornato_il = now();
end;
$$;

/**
 * **La revoca del consenso** (art. 7.3): cancella la riga, cioe' tutte le
 * risposte. Deve essere facile quanto darlo — sta nelle impostazioni, accanto
 * alle risposte stesse.
 *
 * Non chiede conferma a livello di database: e' l'interfaccia a doverlo fare,
 * e comunque cancellare qui non distrugge niente di irrecuperabile (le
 * risposte si possono ridare in un minuto). Non e' una "cosa senza ritorno".
 */
create or replace function public.cancella_profilo_coppia()
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

  select coppia_id into v_coppia
  from membro_coppia
  where utente_id = auth.uid() and uscito_il is null
  limit 1;

  if v_coppia is null then
    raise exception 'non sei in una coppia';
  end if;

  delete from profilo_coppia where coppia_id = v_coppia;
end;
$$;

revoke execute on function public.salva_profilo_coppia(text, text, text, text) from public, anon;
revoke execute on function public.cancella_profilo_coppia() from public, anon;
grant execute on function public.salva_profilo_coppia(text, text, text, text) to authenticated;
grant execute on function public.cancella_profilo_coppia() to authenticated;

-- ⚠️ Nota per l'esportazione dei dati (art. 20, `lib/esporta.ts`): queste
-- risposte sono dati personali della coppia e vanno nel file esportato. Se il
-- file non le contiene, l'export e' incompleto.
