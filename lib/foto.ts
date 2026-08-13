import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '@/lib/supabase';

/**
 * Le foto: scelta, compressione, caricamento, indirizzo firmato.
 *
 * **Si comprime prima di caricare** (D-06): l'originale resta sul telefono,
 * dove gia' e'. E' l'unica funzione a costo non limitato del progetto, e il
 * tetto di 1 GB per coppia lo impone un trigger sul database (D-22) — non un
 * controllo qui, che si potrebbe aggirare.
 *
 * Il percorso e' `<coppia_id>/<uuid>.jpg`: la prima cartella e' il confine su
 * cui poggiano le policy dello storage (0009), le stesse di `e_membro_attivo`.
 */

const LATO_MAX = 1600;
const QUALITA = 0.7;

export async function scegliFoto() {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return { negato: true, immagini: [] as ImagePicker.ImagePickerAsset[] };
  const r = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: 10,
    quality: 1,
  });
  return { negato: false, immagini: r.canceled ? [] : r.assets };
}

/** Ridimensiona e comprime: quello che si carica non e' l'originale. */
async function comprimi(uri: string) {
  const ctx = ImageManipulator.ImageManipulator.manipulate(uri);
  ctx.resize({ width: LATO_MAX });
  const reso = await ctx.renderAsync();
  return reso.saveAsync({ compress: QUALITA, format: ImageManipulator.SaveFormat.JPEG });
}

export async function caricaFoto(
  coppiaId: string,
  immagini: { uri: string }[],
  legami?: { eventoId?: string | null; luogoId?: string | null }
): Promise<{ caricate: number; errore: string | null }> {
  let caricate = 0;
  for (const img of immagini) {
    try {
      const piccola = await comprimi(img.uri);
      const risposta = await fetch(piccola.uri);
      const dati = await risposta.arrayBuffer();
      const chiave = `${coppiaId}/${Date.now()}-${Math.round(dati.byteLength)}.jpg`;

      const su = await supabase.storage
        .from('foto')
        .upload(chiave, dati, { contentType: 'image/jpeg', upsert: false });
      if (su.error) return { caricate, errore: su.error.message };

      // La riga arriva **dopo** il file: se fallisse l'inserimento (per esempio
      // per il tetto di 1 GB) resterebbe un file orfano, che e' meno grave di
      // una riga che punta a un file inesistente.
      const { error } = await supabase.from('foto').insert({
        coppia_id: coppiaId,
        chiave_storage: chiave,
        byte: dati.byteLength,
        evento_id: legami?.eventoId ?? null,
        luogo_id: legami?.luogoId ?? null,
      });
      if (error) {
        await supabase.storage.from('foto').remove([chiave]);
        return { caricate, errore: error.message };
      }
      caricate++;
    } catch (e) {
      return { caricate, errore: String(e) };
    }
  }
  return { caricate, errore: null };
}

/**
 * Indirizzi firmati e temporanei: un'ora, poi non aprono piu' niente. Un
 * indirizzo che non scade e' una foto pubblica con un nome difficile.
 */
export async function indirizziFirmati(chiavi: string[]) {
  if (chiavi.length === 0) return {} as Record<string, string>;
  const { data } = await supabase.storage.from('foto').createSignedUrls(chiavi, 3600);
  const m: Record<string, string> = {};
  for (const r of data ?? []) if (r.path && r.signedUrl) m[r.path] = r.signedUrl;
  return m;
}

/**
 * Cancella prima il file, poi la riga.
 *
 * In quest'ordine perche' Supabase **vieta** di toccare `storage.objects` da un
 * trigger (lo si e' scoperto con un test rosso, non leggendo il codice: la
 * cancellazione falliva del tutto). Se l'app muore fra i due passi resta un
 * file orfano — invisibile, perche' il bucket e' privato e nessuna riga lo
 * indica — che e' il male minore rispetto a una riga che punta al vuoto.
 */
export async function cancellaFoto(id: string, chiave?: string) {
  if (chiave) await supabase.storage.from('foto').remove([chiave]);
  const { error } = await supabase.from('foto').delete().eq('id', id);
  return error?.message ?? null;
}
