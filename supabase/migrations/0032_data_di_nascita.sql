-- =============================================================================
-- LifeCouple — 0032: la data di nascita, e il compleanno sul calendario
--
-- Chiesta dall'utente il 2026-09-04: si domanda alla registrazione, e il giorno
-- del compleanno il calendario mostra una torta accanto al cuore.
--
-- ## 🔑 Chiude un buco di conformita' che era gia' aperto
--
-- L'informativa dichiara da sempre che *«il servizio e' riservato a chi ha
-- compiuto 14 anni»* (art. 8 GDPR, soglia italiana) — ma **non esisteva nessun
-- modo di verificarlo**: era una promessa senza meccanismo. Ora la data c'e', e
-- la registrazione puo' rifiutare chi dichiara meno di 14 anni.
--
-- ⚠️ Resta una **dichiarazione**, non una verifica: chiunque puo' scrivere una
-- data falsa, e nessuna app di questo tipo fa di piu'. Ma la differenza fra
-- "non chiediamo" e "chiediamo e rifiutiamo" e' quella fra una promessa e un
-- controllo, e va detta per quello che e'.
--
-- ## Perche' una tabella e non un evento nel calendario
--
-- La tentazione era creare un evento «compleanno» come si fa per «Il nostro
-- inizio» (0005). 🔴 **Non regge**: quello e' un giorno **solo**, il compleanno
-- **torna ogni anno**. Servirebbe un evento per anno — creati quando? fino a
-- quando? e chi li cancella se la data viene corretta? — cioe' una collezione
-- che cresce per sempre e va tenuta in sincronia con un dato che sta altrove.
--
-- La data si salva **una volta**, e il calendario disegna la torta **calcolando
-- al volo** se giorno e mese coincidono. Cosi' funziona per gli anni passati e
-- per quelli futuri senza che nessuno crei niente, e correggere la data corregge
-- ogni anno insieme. E' lo stesso principio del cuoricino, che non e' un evento
-- ma un confronto fra date.
--
-- ## Le regole di accesso
--
-- 🔑 **Il partner deve poterla leggere** — altrimenti la torta non comparirebbe
-- sul suo calendario, che e' tutto lo scopo. Ma **solo il diretto interessato
-- puo' scriverla**: la data di nascita di una persona non la decide l'altra.
-- =============================================================================

create table if not exists public.profilo_utente (
  utente_id uuid primary key references auth.users (id) on delete cascade,
  data_nascita date,
  aggiornato_il timestamptz not null default now()
);

comment on table public.profilo_utente is
  'Dati della singola persona (non della coppia). `data_nascita` serve al compleanno sul calendario e alla verifica dell''eta'' minima di 14 anni (art. 8 GDPR). Leggibile dal partner, scrivibile solo dall''interessato.';

alter table public.profilo_utente enable row level security;

-- --- Lettura: se stessi, e i membri attivi della propria coppia -------------
--
-- ⚠️ La condizione della coppia passa da `membro_coppia` due volte — una per
-- trovare le proprie coppie, una per verificare che l'altro ne faccia parte. E'
-- il prezzo di tenere il profilo **fuori** dalla coppia: la data di nascita
-- appartiene alla persona e le sopravvive (D-04), quindi non poteva stare su una
-- tabella che muore con la relazione.
drop policy if exists profilo_utente_select on public.profilo_utente;
create policy profilo_utente_select on public.profilo_utente
  for select
  using (
    utente_id = auth.uid()
    or exists (
      select 1
      from public.membro_coppia mio
      join public.membro_coppia altro on altro.coppia_id = mio.coppia_id
      where mio.utente_id = auth.uid()
        and mio.uscito_il is null
        and altro.utente_id = profilo_utente.utente_id
        and altro.uscito_il is null
    )
  );

-- --- Scrittura: solo la propria ---------------------------------------------
drop policy if exists profilo_utente_insert on public.profilo_utente;
create policy profilo_utente_insert on public.profilo_utente
  for insert
  with check (utente_id = auth.uid());

drop policy if exists profilo_utente_update on public.profilo_utente;
create policy profilo_utente_update on public.profilo_utente
  for update
  using (utente_id = auth.uid())
  with check (utente_id = auth.uid());

-- ⚠️ **Nessuna policy di DELETE**, e non e' una dimenticanza: la riga muore con
-- l'account (`on delete cascade`). Per togliere la data basta un update a
-- `null` — che e' la revoca vera, senza lasciare un caso in cui la riga sparisce
-- ma l'account resta.

-- --- Lo scioglimento --------------------------------------------------------
--
-- 🔑 **Non serve nessun trigger**, a differenza della posizione (0031). La
-- policy di lettura richiede che **entrambi** siano membri attivi: appena uno
-- esce, `uscito_il` smette di essere null e l'altro non legge piu' niente. Il
-- dato resta della persona, come dev'essere — non e' un contenuto della coppia
-- e non va distrutto con essa (D-04).
