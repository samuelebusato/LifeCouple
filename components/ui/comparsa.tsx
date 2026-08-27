import * as React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Riani, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { molla, durata } from '@/lib/movimento';

/**
 * Qualcosa che **entra e — soprattutto — esce**.
 *
 * ## L'uscita e' la meta' che manca sempre
 *
 * In quasi tutta l'app l'entrata c'era gia' in qualche forma (`{condizione &&
 * <Cosa/>}` con una molla dentro il figlio), e l'uscita **no**: al giro
 * successivo la condizione diventa falsa, React smonta, e l'elemento
 * semplicemente non c'e' piu'. Il risultato e' un movimento asimmetrico —
 * entra con un peso, sparisce come un fotogramma tagliato — che si legge come
 * un salto, e nel caso peggiore come un errore ("e' sparito? l'ho chiuso io?").
 *
 * Il pezzo che serve non e' l'animazione: e' **smontare dopo invece che prima**.
 * Finche' l'uscita non e' finita il figlio resta montato; solo alla fine
 * `setMontato(false)` lo toglie. E' la stessa struttura di
 * `components/foglio.tsx`, estratta perche' serviva gia' in tre punti.
 *
 * ⚠️ **L'uscita e' piu' corta dell'entrata, ed e' senza molla.** Una cosa che
 * entra ha un peso da mostrare; una che esce sta solo togliendosi di mezzo, e
 * chi l'ha chiusa sta gia' guardando altrove. Una molla in uscita fa
 * "rimbalzare via" l'oggetto: sembra scherzoso su una carta che si chiude, ed
 * e' il classico dettaglio che fa sembrare un'app poco seria.
 *
 * ⚠️ **`pointerEvents` si spegne all'inizio dell'uscita, non alla fine.** Per i
 * ~150ms in cui l'elemento e' ancora li' a svanire, e' un fantasma
 * semitrasparente sopra a cio' che sta sotto: se restasse toccabile, il tocco
 * subito dopo la chiusura finirebbe su un comando che l'utente vede sparire.
 */
export function Comparsa({
  visibile,
  children,
  style,
  /** Da dove arriva: sotto (il default), sopra, o da nessuna parte (solo dissolve). */
  da = 'sotto',
  /** Di quanto si sposta entrando, in punti. */
  scarto = 14,
  /** Ritardo dell'entrata: e' cio' che fa la cascata di un elenco. */
  ritardo = 0,
  /** Quanto e' piccola all'inizio. 1 = non rimpicciolisce. */
  scala = 0.96,
}: {
  visibile: boolean;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  da?: 'sotto' | 'sopra' | 'ferma';
  scarto?: number;
  ritardo?: number;
  scala?: number;
}) {
  const [montato, setMontato] = React.useState(visibile);
  /** 0 = assente, 1 = del tutto presente. */
  const p = useSharedValue(0);

  /**
   * ⚠️ Il verso **precedente**, in un ref.
   *
   * Senza, `setMontato(true)` fa ripartire l'effetto (dipende da `montato`) e
   * l'entrata si riavvia da capo un fotogramma dopo essere cominciata: con un
   * `ritardo` in gioco — cioe' in ogni cascata — il ritardo verrebbe contato
   * due volte, e le schede entrerebbero a scatti invece che a onda.
   */
  const verso = React.useRef<boolean | null>(null);

  React.useEffect(() => {
    if (verso.current === visibile) return;
    verso.current = visibile;

    if (visibile) {
      setMontato(true);
      p.value = withDelay(ritardo, withSpring(1, molla.entrata));
    } else if (montato) {
      p.value = withTiming(0, { duration: durata.uscita }, (finita) => {
        if (finita) runOnJS(setMontato)(false);
      });
    }
  }, [visibile, montato, p, ritardo]);

  /**
   * ⚠️ **Un'animazione non puo' nascondere il contenuto.** Rete di sicurezza.
   *
   * Questo componente parte da opacita' zero: se per qualunque ragione
   * l'animazione d'entrata non partisse, cio' che avvolge resterebbe
   * **invisibile per sempre** — e non e' un'ipotesi di scuola, e' esattamente
   * la forma di B-14 (`History.md`), dove un foglio non compariva e la causa
   * non e' mai stata trovata. Con la cascata della home il danno sarebbe
   * l'intera schermata principale in bianco.
   *
   * Trascorso abbondantemente il tempo dell'entrata, se il valore non e'
   * arrivato a 1 ci arriva **di colpo**: si perde l'animazione, non il
   * contenuto. La molla d'entrata si assesta ben prima di 1,2s, quindi in
   * condizioni normali questo controllo non fa mai niente — e' il fallimento
   * ad avere un esito prevedibile, non il funzionamento ad avere uno scatto.
   *
   * La regola generale, che vale oltre questo file: **il modo in cui una
   * decorazione fallisce va deciso, non scoperto.**
   */
  React.useEffect(() => {
    if (!visibile) return;
    const id = setTimeout(() => {
      if (p.value < 1) p.value = 1;
    }, ritardo + 1200);
    return () => clearTimeout(id);
  }, [visibile, ritardo, p]);

  const stile = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [
      { translateY: da === 'ferma' ? 0 : (1 - p.value) * (da === 'sotto' ? scarto : -scarto) },
      { scale: scala + (1 - scala) * p.value },
    ],
  }));

  if (!montato) return null;

  return (
    <Riani.View pointerEvents={visibile ? 'box-none' : 'none'} style={[stile, style]}>
      {children}
    </Riani.View>
  );
}
