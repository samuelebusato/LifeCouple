-- =============================================================================
-- LifeCouple — 0031: la posizione condivisa fra i due membri
--
-- 🔴 QUESTA MIGRAZIONE RIBALTA D-05, ed è la decisione più delicata del
-- progetto. Va letta prima di toccarla.
--
-- D-05 diceva: *«nessuno dei due può sapere dove si trova l'altro adesso»*, e
-- la sua motivazione era esplicita — **è la mitigazione che rende questa app non
-- utilizzabile come strumento di sorveglianza del partner**. L'alternativa che
-- scartava (*«geolocalizzazione automatica con check-in»*) è precisamente ciò
-- che questa migrazione introduce, su decisione esplicita dell'utente del
-- 2026-09-04, presa dopo che il conflitto gli è stato messo davanti.
--
-- La decisione è sua e legittima: le app di coppia che condividono la posizione
-- esistono e sono diffuse. Ma il threat model nominava questo caso come
-- **intimate partner surveillance**, e quel rischio non sparisce perché la
-- funzione è stata richiesta: si progetta perché faccia meno danno possibile.
-- Da qui le quattro regole qui sotto, che **non sono rifiniture**.
--
-- ## 1. Una riga per persona, sovrascritta. MAI una cronologia.
--
-- 🔑 È la regola più importante del file. `posizione_membro` ha `utente_id` come
-- chiave primaria: ogni aggiornamento **sovrascrive** il precedente. Non esiste
-- storico, non esiste "dove sei stato ieri", non esiste una tabella da cui
-- ricostruire i movimenti di qualcuno.
--
-- La differenza fra *«dove sei adesso»* e *«dove sei stato»* è la differenza fra
-- una comodità e uno strumento di controllo — ed è anche ciò che il registro dei
-- trattamenti già dichiarava come rischio **alto** per la cronologia dei luoghi:
-- *«un elenco di luoghi con date rivela l'abitazione, gli orari e le abitudini»*.
-- Quel rischio qui non si aggiunge, perché lo storico non esiste.
--
-- ## 2. La riga È il consenso, e spegnere significa cancellarla
--
-- Nessuna colonna `condivide boolean`. Chi non condivide **non ha una riga**.
-- Come per il questionario (0029), questo rende irrappresentabile lo stato
-- «riga presente, consenso revocato, dato ancora dentro».
--
-- ## 3. 🔴 Spegnere non avvisa nessuno, e l'assenza è ambigua per costruzione
--
-- Quando la riga sparisce, il partner vede *«posizione non disponibile»* — che è
-- **indistinguibile** da GPS spento, app chiusa, batteria scarica, permesso
-- negato o rete assente. Non c'è nessun segnale che dica *«ha smesso di
-- condividere con te»*.
--
-- ⚠️ Questo non è un dettaglio di interfaccia: **è la tutela centrale**. Una
-- funzione che annuncia all'altro che l'hai spenta non è spegnibile davvero —
-- in una relazione che si sta guastando, disattivarla diventa un atto ostile da
-- giustificare, e chi ne avrebbe più bisogno è chi meno può permetterselo. Per
-- questo il database **non registra** né quando la condivisione si spegne né
-- che sia mai stata attiva.
--
-- ## 4. Una posizione vecchia non è una posizione
--
-- `aggiornata_il` esiste perché l'app possa **rifiutarsi di mostrare** un punto
-- stantio invece di spacciarlo per attuale. Un puntino di tre giorni fa disegnato
-- come «è qui adesso» è peggio di nessun puntino: è un'informazione falsa su cui
-- qualcuno può litigare.
-- =============================================================================

create table if not exists public.posizione_membro (
  -- Chiave primaria sull'utente: **una riga sola per persona, sempre**.
  -- È questo vincolo, non una politica di cancellazione, a rendere impossibile
  -- accumulare una cronologia.
  utente_id uuid primary key references auth.users (id) on delete cascade,
  coppia_id uuid not null references public.coppia (id) on delete cascade,

  lat double precision not null,
  lon double precision not null,
  /** Raggio di incertezza in metri, come lo dà il dispositivo. */
  precisione double precision,

  aggiornata_il timestamptz not null default now()
);

comment on table public.posizione_membro is
  'Posizione corrente di un membro, condivisa col partner. UNA riga per persona, sovrascritta: nessuna cronologia, mai. La riga esiste solo se la persona ha scelto di condividere; spegnere significa cancellarla, e la cancellazione non e'' notificata a nessuno (0031, D-100).';

alter table public.posizione_membro enable row level security;

-- --- Le policy --------------------------------------------------------------

-- Si legge la posizione dei membri **attivi della propria coppia**: la propria e
-- quella del partner.
-- ⚠️ `uscito_il is null` conta: dopo uno scioglimento (D-04) l'ex non deve
-- vedere piu' niente, e senza questa condizione la riga resterebbe leggibile
-- finche' non viene cancellata.
drop policy if exists posizione_select on public.posizione_membro;
create policy posizione_select on public.posizione_membro
  for select
  using (public.e_membro_attivo(coppia_id));

-- 🔑 Si scrive **solo la propria**, e questa e' la policy che impedisce il
-- guasto peggiore: senza `utente_id = auth.uid()`, un client potrebbe scrivere
-- la posizione **del partner**, cioe' mentire su dove si trova l'altro.
drop policy if exists posizione_insert on public.posizione_membro;
create policy posizione_insert on public.posizione_membro
  for insert
  with check (utente_id = auth.uid() and public.e_membro_attivo(coppia_id));

drop policy if exists posizione_update on public.posizione_membro;
create policy posizione_update on public.posizione_membro
  for update
  using (utente_id = auth.uid())
  with check (utente_id = auth.uid());

-- La cancellazione e' la revoca del consenso: dev'essere sempre possibile, e
-- solo sulla propria riga.
drop policy if exists posizione_delete on public.posizione_membro;
create policy posizione_delete on public.posizione_membro
  for delete
  using (utente_id = auth.uid());

-- --- Lo scioglimento --------------------------------------------------------
--
-- 🔴 Allo scioglimento le posizioni si **distruggono**, non si nascondono.
-- E' la seconda eccezione a D-04 dopo la creatura, e per una ragione piu' forte:
-- D-04 conserva a ciascuno cio' che ha caricato lui, ma una posizione non e' un
-- ricordo da tenere — e' un dato vivo che non deve sopravvivere alla relazione
-- che lo giustificava. Il `on delete cascade` su `coppia_id` copre la
-- cancellazione della coppia; questo trigger copre lo scioglimento, che lascia
-- la coppia in piedi.
create or replace function public.pulisci_posizioni_allo_scioglimento()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.uscito_il is not null and old.uscito_il is null then
    delete from posizione_membro where coppia_id = new.coppia_id;
  end if;
  return new;
end;
$$;

drop trigger if exists posizioni_via_allo_scioglimento on public.membro_coppia;
create trigger posizioni_via_allo_scioglimento
  after update on public.membro_coppia
  for each row
  execute function public.pulisci_posizioni_allo_scioglimento();

-- ⚠️ Nota per l'esportazione (art. 20, `lib/esporta.ts`): la posizione corrente
-- e' un dato personale di chi esporta e va nel file. Non c'e' storico da
-- esportare, ed e' esattamente il punto.
