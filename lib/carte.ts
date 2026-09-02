import * as React from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { CodiceGioco } from '@/lib/giochi';
import type { Database } from '@/lib/database.types';
import { lingua } from '@/lib/i18n';

/**
 * **Le carte scritte dalla coppia** per una partita personalizzata (D-19).
 *
 * ## Perché stanno nella tabella `domanda`, che era vuota da sempre
 *
 * `domanda` esiste dalla 0001 con una colonna `coppia_id` che può essere NULL, e
 * il commento accanto dice cosa aspettava: *NULL = banco comune scritto da noi,
 * valorizzato = contenuto della coppia*. Il banco comune non ci è mai finito —
 * vive in `lib/parole.ts`, perché è bilingue e immutabile — quindi qui dentro
 * entrano **solo** le righe scritte dai due.
 *
 * ## ⚠️ `partita_id`: una decisione rimandata, non una dimenticanza
 *
 * L'utente ha chiesto (2026-09-02) di **salvarle sul server** ma di usarle *come
 * se* valessero solo per quella partita, lasciando aperta per il futuro la
 * scelta se debbano accumularsi in un banco della coppia. Le letture di questo
 * modulo filtrano quindi per `partita_id`, sempre. Il giorno che si decidesse
 * per il banco che cresce, si toglie il filtro e le righe scritte finora sono
 * già lì — mentre la strada opposta non si recupera, perché una riga senza
 * `partita_id` non saprebbe più da quale partita viene.
 *
 * ## Cosa NON c'è, di proposito: il sigillo
 *
 * Le carte dell'altro sono **leggibili** (la policy `domanda_select` le mostra a
 * entrambi i membri). Non è una dimenticanza di D-12: lì il segreto è ciò che
 * rende il gioco un gioco — leggere la risposta dell'altro *è* barare — mentre
 * qui le carte le vedranno comunque tutte e due, una per round. Nascondere in
 * anticipo qualcosa che si mostrerà fra due minuti costerebbe una funzione
 * Postgres per proteggere una sorpresa, non un'informazione.
 *
 * ⚠️ La schermata di preparazione mostra comunque **solo i conteggi**: sapere
 * *quante* ne ha scritte l'altro è ciò che serve a capire chi si sta aspettando;
 * leggerle prima toglie solo il gusto.
 */
export type Carta = Database['public']['Tables']['domanda']['Row'];
export type TipoCarta = 'obbligo' | 'verita';

/** Una richiesta di scrittura: quante carte, e di che tipo. */
export type Richiesta = { tipo: TipoCarta | null; quante: number };

/**
 * **Quante carte scrive ciascuno**, gioco per gioco (chiesto dall'utente il
 * 2026-09-02).
 *
 * 🔑 I numeri non sono arrotondati a caso, e il vincolo è lo stesso per tutti e
 * due: **il set deve bastare alla partita**. Il quiz fa dieci round e ognuno
 * scrive cinque domande — dieci in tutto, una per round, nessuna avanza e
 * nessuna si ripete. Obbligo o verità fa dieci round con **venti** carte, e
 * l'abbondanza è voluta: chi ha il turno sceglie *obbligo* o *verità*, quindi
 * senza carte in più una delle due colonne si esaurirebbe a seconda di come
 * scelgono, e il gioco finirebbe per costringere alla scelta che avanza.
 *
 * ⚠️ Il disegno non compare: lì non c'è niente da preparare. La parola la
 * dichiara chi disegna **all'inizio del proprio turno**, quindi non esiste un
 * momento in cui scriverla in anticipo — ed è il motivo per cui è l'unico dei
 * tre a non avere una schermata di preparazione.
 */
export const CARTE_A_TESTA: Partial<Record<CodiceGioco, readonly Richiesta[]>> = {
  quiz_preferenze: [{ tipo: null, quante: 5 }],
  obbligo_verita: [
    { tipo: 'obbligo', quante: 5 },
    { tipo: 'verita', quante: 5 },
  ],
};

/** Quante carte in tutto deve avere scritto una persona, per poter cominciare. */
export function quanteServono(gioco: CodiceGioco): number {
  return (CARTE_A_TESTA[gioco] ?? []).reduce((n, r) => n + r.quante, 0);
}

/**
 * Il set della partita, letto e tenuto aggiornato mentre i due lo scrivono.
 *
 * 🔴 **Rilegge quando il canale è davvero attivo** (B-43): la preparazione è il
 * momento in cui i due telefoni scrivono *insieme*, cioè quello in cui perdere
 * un evento significa aspettarsi a vicenda per sempre. La lezione appena
 * imparata si applica qui prima ancora che altrove.
 */
export function useCarte(coppiaId: string | null, partitaId: string | null, gioco: CodiceGioco) {
  const [carte, setCarte] = React.useState<Carta[]>([]);
  const [caricando, setCaricando] = React.useState(true);
  const [errore, setErrore] = React.useState<string | null>(null);

  const leggi = React.useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('domanda')
      .select('*')
      .eq('partita_id', id)
      .order('creato_il', { ascending: true });
    if (error) setErrore(error.message);
    else setCarte(data ?? []);
    setCaricando(false);
  }, []);

  React.useEffect(() => {
    if (!partitaId) {
      setCarte([]);
      setCaricando(false);
      return;
    }
    setCaricando(true);
    leggi(partitaId);
    const canale: RealtimeChannel = supabase
      .channel(`carte:${partitaId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'domanda', filter: `partita_id=eq.${partitaId}` },
        () => leggi(partitaId)
      )
      .subscribe((stato) => {
        if (stato === 'SUBSCRIBED') leggi(partitaId);
      });
    return () => {
      supabase.removeChannel(canale);
    };
  }, [partitaId, leggi]);

  /**
   * Scrive una carta.
   *
   * ⚠️ **Si guarda l'esito** (B-35): una scrittura di cui non si controlla il
   * ritorno è una scrittura che si spera sia avvenuta, e qui il costo è l'altro
   * fermo ad aspettare una carta che non arriverà.
   */
  const scrivi = React.useCallback(
    async (testo: string, tipo: TipoCarta | null) => {
      if (!coppiaId || !partitaId) return false;
      const pulito = testo.trim();
      if (!pulito) return false;
      setErrore(null);
      const { error } = await supabase
        .from('domanda')
        .insert({ coppia_id: coppiaId, partita_id: partitaId, gioco, tipo, lingua, testo: pulito });
      if (error) {
        setErrore(error.message);
        return false;
      }
      await leggi(partitaId);
      return true;
    },
    [coppiaId, partitaId, gioco, leggi]
  );

  /** Toglie una carta scritta da sé (la policy non lascia togliere quelle altrui). */
  const cancella = React.useCallback(
    async (id: string) => {
      if (!partitaId) return;
      setErrore(null);
      const { error } = await supabase.from('domanda').delete().eq('id', id);
      if (error) return setErrore(error.message);
      await leggi(partitaId);
    },
    [partitaId, leggi]
  );

  return { carte, caricando, errore, scrivi, cancella, ricarica: leggi };
}

/** Le carte scritte da una persona, eventualmente di un tipo solo. */
export function mieCarte(carte: Carta[], io: string | null, tipo?: TipoCarta | null): Carta[] {
  return carte.filter((c) => c.autore_id === io && (tipo === undefined || c.tipo === tipo));
}

/**
 * Ha finito di scrivere?
 *
 * ⚠️ Si conta **per tipo**, non in totale: dieci carte tutte «obbligo» sono dieci
 * carte, e non sono il set che il gioco chiede.
 */
export function haFinito(carte: Carta[], io: string | null, gioco: CodiceGioco): boolean {
  const richieste = CARTE_A_TESTA[gioco] ?? [];
  return richieste.every((r) => mieCarte(carte, io, r.tipo).length >= r.quante);
}

/**
 * Pesca una carta del set che la partita non ha ancora usato.
 *
 * ⚠️ Se fossero finite si ricomincia da tutte, come nei banchi comuni: ripetere
 * è meglio che non avere un round. Con i numeri di `CARTE_A_TESTA` non può
 * capitare — ma il modo in cui un caso impossibile fallisce va deciso, non
 * scoperto.
 */
export function pescaCarta(
  carte: Carta[],
  usate: Set<string>,
  tipo: TipoCarta | null = null
): Carta | null {
  const dellaSpecie = carte.filter((c) => c.tipo === tipo);
  if (dellaSpecie.length === 0) return null;
  const libere = dellaSpecie.filter((c) => !usate.has(c.id));
  const banco = libere.length > 0 ? libere : dellaSpecie;
  return banco[Math.floor(Math.random() * banco.length)];
}
