import * as React from 'react';
import { supabase } from '@/lib/supabase';

/**
 * I numeri della home, letti in una volta sola.
 *
 * Ogni voce puo' essere **assente**, e l'assenza si mostra per quello che e':
 * un riquadro che dice "ancora niente" invece di uno zero o di un dato finto.
 * Su una schermata che si guarda ogni giorno, un numero inventato e' peggio di
 * un vuoto onesto (stessa regola di B-03: *non lo so* non e' *non c'e'*).
 */
export type Riepilogo = {
  postiVisitati: number;
  ultimoFilm: { titolo: string; quando: string | null } | null;
  ultimaPartita: { gioco: string; punti: number; quando: string } | null;
  prossimoEvento: { titolo: string; inizio: string; tutto_il_giorno: boolean } | null;
  fotoACaso: { chiave: string } | null;
};

const vuoto: Riepilogo = {
  postiVisitati: 0,
  ultimoFilm: null,
  ultimaPartita: null,
  prossimoEvento: null,
  fotoACaso: null,
};

export function useRiepilogo(coppiaId: string | null) {
  const [dati, setDati] = React.useState<Riepilogo>(vuoto);
  const [loading, setLoading] = React.useState(true);

  const ricarica = React.useCallback(async () => {
    if (!coppiaId) {
      setDati(vuoto);
      setLoading(false);
      return;
    }

    const adesso = new Date().toISOString();
    const [luoghi, film, partite, eventi, foto] = await Promise.all([
      supabase
        .from('luogo')
        .select('id', { count: 'exact', head: true })
        .eq('coppia_id', coppiaId)
        .eq('stato', 'visitato'),
      supabase
        .from('elemento_lista')
        .select('titolo, fatto_il')
        .eq('coppia_id', coppiaId)
        .eq('tipo', 'film')
        .eq('stato', 'fatto')
        .order('fatto_il', { ascending: false })
        .limit(1),
      supabase
        .from('partita')
        .select('gioco, partita_risultato(punti_assegnati, rivelato_il)')
        .eq('coppia_id', coppiaId)
        .eq('stato', 'conclusa')
        .order('creata_il', { ascending: false })
        .limit(1),
      supabase
        .from('evento')
        .select('titolo, inizio, tutto_il_giorno')
        .eq('coppia_id', coppiaId)
        .gte('inizio', adesso)
        .order('inizio', { ascending: true })
        .limit(1),
      supabase.from('foto').select('chiave_storage').eq('coppia_id', coppiaId).limit(30),
    ]);

    const p = partite.data?.[0] as
      | { gioco: string; partita_risultato: { punti_assegnati: number; rivelato_il: string }[] }
      | undefined;
    const risultato = p?.partita_risultato?.[0];
    const scatti = foto.data ?? [];

    setDati({
      postiVisitati: luoghi.count ?? 0,
      ultimoFilm: film.data?.[0]
        ? { titolo: film.data[0].titolo, quando: film.data[0].fatto_il }
        : null,
      ultimaPartita:
        p && risultato
          ? { gioco: p.gioco, punti: risultato.punti_assegnati, quando: risultato.rivelato_il }
          : null,
      prossimoEvento: eventi.data?.[0] ?? null,
      // A caso davvero, ma pescata fra le ultime trenta: scaricare l'intera
      // galleria per sceglierne una sola sarebbe uno spreco a ogni apertura.
      fotoACaso: scatti.length
        ? { chiave: scatti[Math.floor(Math.random() * scatti.length)].chiave_storage }
        : null,
    });
    setLoading(false);
  }, [coppiaId]);

  React.useEffect(() => {
    ricarica();
  }, [ricarica]);

  return { ...dati, loading, ricarica };
}
