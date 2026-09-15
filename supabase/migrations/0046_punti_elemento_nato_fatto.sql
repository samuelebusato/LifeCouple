-- =============================================================================
-- LifeCouple — 0046: un elemento di lista creato gia' «fatto» non vale punti
--
-- ✅ APPLICATA il 2026-09-15 dall'utente, dal pannello Supabase.
--    **Verificata misurando, non sulla parola**: `npm run test:punti` e' passato
--    da 9/10 a **10/10** nello stesso minuto, e l'asserzione che e' cambiata di
--    colore e' esattamente quella che nomina questa migrazione.
--    🔑 Tengono anche le due guardie, che sono la parte che conta: il giro
--    desiderato -> fatto -> desiderato -> fatto **non fabbrica punti** (il
--    rischio introdotto DA questa correzione), e la partita nata «conclusa»
--    **continua a non valerne** (la simmetria che NON andava applicata).
--
-- ## B-70 — trovato il 2026-09-15 misurando, non leggendo
--
-- E' **la terza volta che questo difetto compare**, sempre nella stessa forma:
--
--   B-64  luogo    `before update of stato`  ->  un posto nato «visitato» non
--                                                riceveva i suoi 20 punti
--   B-70  elemento `before update of stato`  ->  un elemento nato «fatto» non
--                                                riceve i suoi 10 punti
--
-- 🔑 **Un trigger `update of stato` misura una TRANSIZIONE, e un INSERT non e'
--    una transizione**: la riga nasce gia' nello stato premiato, non ci passa.
--    La 0040 ha chiuso il caso del luogo; questa chiude quello dell'elemento,
--    ed e' la stessa correzione parola per parola.
--
-- ## ⚠️ Perche' lo chiudiamo se oggi nessuno lo incontra
--
-- Nessun percorso dell'app crea un elemento gia' «fatto»: `lib/preferiti.ts`
-- inserisce sempre senza `stato`, quindi 'desiderato'. **Il buco e' latente.**
--
-- 🔑 Ma B-64 era latente esattamente cosi' — finche' `collegaPosto` non ha
--    cominciato a creare luoghi gia' visitati, e da quel momento i punti sono
--    spariti **in silenzio**, per settimane, senza un errore da nessuna parte.
--    *La latenza non e' una difesa: e' solo il tempo che passa fra il difetto
--    e il primo che ci cammina sopra.* «Aggiungi un film che ho gia' visto» e'
--    la prima funzione che lo sveglierebbe, ed e' plausibile.
--
-- ## ✅ Cosa NON si chiude qui, e non e' una dimenticanza
--
-- Una **partita** creata gia' «conclusa» non riceve i suoi 5 punti, e **resta
-- cosi' di proposito**. La stessa forma, ma il trattamento giusto e' opposto:
-- premiarla significherebbe far comparire punti per una partita **mai
-- giocata**, cioe' regalare a un client la possibilita' di fabbricarsi punti
-- inserendo partite finte. 🔑 *La 0033 lo dice gia': il punto premia «la
-- chiusura del cerchio, non il tempo passato dentro l'app»* — e un cerchio che
-- nasce chiuso non e' mai stato percorso. `tests/punti.mjs` lo **asserisce**
-- in positivo, cosi' che se un domani qualcuno "correggesse" anche quello, il
-- test lo fermi.
-- =============================================================================

create or replace function public.punti_su_elemento_nato_fatto()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.stato = 'fatto' then
    -- Come nella 0001: la data si mette se chi inserisce non l'ha messa.
    new.fatto_il := coalesce(new.fatto_il, now());
    -- `assegna_punti` scrive prima in `punti_evento`, che ha
    -- `unique (coppia_id, tipo, riferimento_id)`: la doppia premiazione e'
    -- impedita dal vincolo, non dalla nostra attenzione (D-15).
    perform assegna_punti(new.coppia_id, 'elemento_fatto', new.id, 10);
  end if;
  return new;
end;
$$;

-- ⚠️ `before insert`, come la 0040 e per la stessa ragione: `new.fatto_il` va
--    scritto sulla riga che sta per essere inserita, e un `after` non puo'.
drop trigger if exists elemento_nato_fatto on public.elemento_lista;
create trigger elemento_nato_fatto
  before insert on public.elemento_lista
  for each row execute function public.punti_su_elemento_nato_fatto();

comment on function public.punti_su_elemento_nato_fatto() is
  'B-70: i 10 punti per un elemento creato direttamente con stato = fatto. Il '
  'trigger della 0001 copre solo la transizione desiderato -> fatto, quindi le '
  'voci nate gia fatte non ne ricevevano nessuno. Gemella della 0040.';

-- =============================================================================
-- ## Come si verifica
--
--   npm run test:punti
--
-- L'asserzione e' «B-64 sugli elementi: uno creato GIA "fatto" riceve i suoi
-- 10 punti». Prima di questa migrazione FALLISCE con `prima=N dopo=N`; dopo,
-- passa con `dopo = prima + 10`. Nello stesso file resta verde l'asserzione
-- che il giro desiderato -> fatto -> desiderato -> fatto non fabbrica punti,
-- che e' il rischio introdotto DA questa correzione e non quello corretto.
-- =============================================================================
