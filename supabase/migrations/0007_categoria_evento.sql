-- =============================================================================
-- LifeCouple — 0007: da quale calendario viene un evento importato
--
-- Nel telefono le "categorie" (festivita', compleanni, casa, lavoro, famiglia)
-- non sono un'etichetta dentro l'evento: sono **calendari distinti** dentro
-- l'account. Importare per categoria significa quindi importare per calendario,
-- e conservarne il nome e' cio' che permette di ritrovarli dopo — altrimenti in
-- mezzo agli impegni resterebbero venti compleanni indistinguibili.
--
-- Testo libero e non un elenco chiuso: i nomi dei calendari li decide chi li ha
-- creati, e cambiano da telefono a telefono e da lingua a lingua.
-- Vale solo per cio' che arriva da fuori: gli eventi scritti nell'app hanno il
-- **tipo** (D-30), che e' un'altra cosa e resta la classificazione nostra.
-- =============================================================================

alter table public.evento
  add column if not exists categoria text;
