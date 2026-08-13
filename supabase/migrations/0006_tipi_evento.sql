-- =============================================================================
-- LifeCouple — 0006: che cosa e' un evento, e da dove arriva
--
-- Tre tipi, chiesti dall'utente il 2026-08-13:
--   impegno   — la cosa da fare, il default
--   romantico — la sera che conta, quella che si vuole ritrovare
--   vacanza   — ha una data di andata e una di ritorno: occupa giorni, non un
--               istante, ed e' l'unico tipo che usa `fine`
--
-- `fine` esiste dallo schema iniziale: non serve una colonna nuova per la
-- vacanza, serve dargli un significato. Il tipo e' un `check` e non una tabella
-- perche' sono tre valori decisi da noi, non un elenco che gli utenti estendono.
--
-- `origine_esterna` tiene l'identificativo dell'evento nel calendario del
-- telefono da cui e' stato importato: e' cio' che rende l'importazione
-- **ripetibile senza doppioni** — reimportare lo stesso compleanno aggiorna la
-- riga invece di crearne una seconda.
-- =============================================================================

alter table public.evento
  add column if not exists tipo text not null default 'impegno'
  check (tipo in ('impegno', 'romantico', 'vacanza'));

alter table public.evento
  add column if not exists origine_esterna text;

-- Unico per coppia, non per autore: se entrambi importano lo stesso compleanno
-- dai rispettivi telefoni, resta un evento solo — sul calendario condiviso il
-- doppione e' rumore, non ricchezza.
create unique index if not exists evento_origine_esterna_unica
  on public.evento (coppia_id, origine_esterna)
  where origine_esterna is not null;

-- Una vacanza che finisce prima di cominciare e' un errore di inserimento, non
-- un dato: si ferma qui invece di comparire storta nel calendario.
alter table public.evento
  drop constraint if exists evento_fine_dopo_inizio;
alter table public.evento
  add constraint evento_fine_dopo_inizio check (fine is null or fine >= inizio);
