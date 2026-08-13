import { supabase } from '@/lib/supabase';

/**
 * Le cartelle della galleria (migrazione 0011).
 *
 * Sono **organizzazione condivisa**: le vedono e le riempiono entrambi, le
 * rinomina e le cancella solo chi le ha create. Cancellarne una non tocca le
 * foto — tornano semplicemente "senza cartella".
 *
 * Il controllo vero e' nelle policy, non qui: queste funzioni evitano di
 * *offrire* gesti che finirebbero in errore, non li impediscono.
 */

export type Cartella = {
  id: string;
  nome: string;
  autore_id: string;
  creato_il: string;
};

/** Una cartella con quante foto contiene e la copertina (la piu' recente). */
export type CartellaConCopertina = Cartella & {
  quante: number;
  copertina?: string;
};

export async function elencaCartelle(coppiaId: string) {
  const { data, error } = await supabase
    .from('cartella')
    .select('id, nome, autore_id, creato_il')
    .eq('coppia_id', coppiaId)
    .order('creato_il', { ascending: false });
  return { cartelle: (data ?? []) as Cartella[], errore: error?.message ?? null };
}

export async function creaCartella(coppiaId: string, nome: string) {
  const pulito = nome.trim();
  if (!pulito) return { errore: 'nome vuoto' as string | null, id: null as string | null };
  const { data, error } = await supabase
    .from('cartella')
    .insert({ coppia_id: coppiaId, nome: pulito })
    .select('id')
    .single();
  return { id: data?.id ?? null, errore: error?.message ?? null };
}

export async function rinominaCartella(id: string, nome: string) {
  const pulito = nome.trim();
  if (!pulito) return 'nome vuoto';
  const { error } = await supabase.from('cartella').update({ nome: pulito }).eq('id', id);
  return error?.message ?? null;
}

/** Le foto dentro non si toccano: la colonna torna a null (`on delete set null`). */
export async function cancellaCartella(id: string) {
  const { error } = await supabase.from('cartella').delete().eq('id', id);
  return error?.message ?? null;
}

/**
 * Sposta una foto in una cartella, o la toglie da tutte (`null`).
 *
 * ⚠️ **Solo le proprie**: la policy `foto_update` (0001) e' solo-autore, e
 * l'aggiornamento sulle foto dell'altro non fallirebbe — filtrerebbe zero
 * righe, in silenzio. Il conteggio esplicito trasforma quel silenzio in una
 * risposta. Se un giorno si vorra' "riordiniamo insieme", la strada e' una
 * policy dedicata alla sola colonna `cartella_id`, non un update che finge.
 */
export async function spostaFoto(fotoId: string, cartellaId: string | null) {
  const { error, count } = await supabase
    .from('foto')
    .update({ cartella_id: cartellaId }, { count: 'exact' })
    .eq('id', fotoId);
  if (error) return error.message;
  if (count === 0) return 'solo-autore';
  return null;
}
