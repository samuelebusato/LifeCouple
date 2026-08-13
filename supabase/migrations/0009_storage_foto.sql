-- =============================================================================
-- LifeCouple — 0009: lo spazio dove vivono le foto
--
-- Bucket **privato**: nessuna foto e' raggiungibile con un indirizzo pubblico,
-- nemmeno per sbaglio, nemmeno da chi indovina il nome del file. Si guardano
-- solo con un indirizzo firmato che scade — e la firma la ottiene solo chi e'
-- membro attivo di quella coppia.
--
-- Il confine passa dal **percorso**: ogni file sta in `<coppia_id>/<file>`, e
-- le policy leggono la prima cartella. E' lo stesso confine delle tabelle
-- (`e_membro_attivo`), applicato ai file: se cambiasse la regola di
-- appartenenza, cambierebbe in un posto solo.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('foto', 'foto', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do update
  set public = false,
      file_size_limit = 10485760,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

-- Lettura: i membri attivi della coppia proprietaria della cartella.
drop policy if exists foto_leggi on storage.objects;
create policy foto_leggi on storage.objects
  for select to authenticated
  using (
    bucket_id = 'foto'
    and public.e_membro_attivo(((storage.foldername(name))[1])::uuid)
  );

-- Caricamento: idem. Il tetto di 1 GB per coppia lo impone il trigger sulla
-- tabella `foto` (D-22): qui si controlla **chi**, li' si controlla **quanto**.
drop policy if exists foto_carica on storage.objects;
create policy foto_carica on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'foto'
    and public.e_membro_attivo(((storage.foldername(name))[1])::uuid)
  );

-- Cancellazione: **solo l'autore**, e lo si stabilisce guardando la riga in
-- `foto`. Senza questo controllo un membro potrebbe cancellare i file
-- dell'altro pur non potendone cancellare le righe — il contrario di D-21, e
-- il tipo di incoerenza che si scopre solo quando il danno e' fatto.
drop policy if exists foto_cancella on storage.objects;
create policy foto_cancella on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'foto'
    and exists (
      select 1 from public.foto f
      where f.chiave_storage = storage.objects.name
        and f.autore_id = auth.uid()
    )
  );

-- =============================================================================
-- Il file segue la riga: cancellata la foto dal database, il file va tolto
-- dallo storage. Senza, resterebbero file che nessuno puo' piu' vedere ne'
-- cancellare — e che continuerebbero a occupare spazio e a esistere in un
-- backup (Rule/catena-cancellazione.md).
--
-- Il trigger cancella l'oggetto direttamente da storage.objects: il file resta
-- nell'archivio finche' Supabase non fa pulizia degli orfani, ma smette di
-- essere raggiungibile da qualunque firma. E' l'unica strada che non richiede
-- un servizio nostro; il resto lo fara' la cancellazione dell'account.
-- =============================================================================
create or replace function public.foto_cancella_file()
returns trigger
language plpgsql security definer
set search_path = public, storage
as $$
begin
  delete from storage.objects
  where bucket_id = 'foto' and name = old.chiave_storage;
  return old;
end;
$$;

drop trigger if exists foto_pulisci_storage on public.foto;
create trigger foto_pulisci_storage
  after delete on public.foto
  for each row execute function public.foto_cancella_file();
