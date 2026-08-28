import * as React from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useTema } from '@/lib/tema';

/**
 * Un tratto: una sequenza di punti **normalizzati fra 0 e 1**.
 *
 * 🔑 Normalizzati, e non in punti-schermo, ed è la decisione che rende il gioco
 * giocabile fra due telefoni diversi. La tela di chi disegna e quella di chi
 * guarda non hanno la stessa larghezza — un iPhone SE e un Pro Max differiscono
 * di un terzo — e mandare coordinate assolute vorrebbe dire che il disegno
 * arriva **tagliato o rimpicciolito in un angolo**. In frazioni di tela, invece,
 * la stessa casa è la stessa casa su qualunque schermo.
 */
export type Tratto = number[];

/** Ciò che viaggia nel canale broadcast. Volutamente corto: si manda spesso. */
export type MessaggioTela =
  | { t: 'tratto'; p: Tratto }
  | { t: 'parziale'; p: Tratto }
  | { t: 'pulisci' };

/** Da punti normalizzati a un path SVG, alla larghezza che ha questa tela. */
export function aPath(t: Tratto, larghezza: number, altezza: number): string {
  if (t.length < 4) {
    // Un tocco solo: un punto non ha un "da qui a lì", quindi si disegna come
    // un segmento di lunghezza zero — che con `strokeLinecap="round"` diventa
    // il pallino che chi ha toccato si aspetta di vedere.
    if (t.length < 2) return '';
    const x = t[0] * larghezza;
    const y = t[1] * altezza;
    return `M${x} ${y} L${x} ${y}`;
  }
  let d = `M${t[0] * larghezza} ${t[1] * altezza}`;
  for (let i = 2; i < t.length; i += 2) {
    d += ` L${t[i] * larghezza} ${t[i + 1] * altezza}`;
  }
  return d;
}

/**
 * La tela: si disegna col dito, oppure si guarda disegnare l'altro.
 *
 * ## Un componente solo per i due ruoli
 *
 * Chi disegna e chi indovina vedono **la stessa tela**, e cambia solo se i
 * gesti sono attivi (`attiva`). È voluto: due componenti — uno che disegna e uno
 * che guarda — avrebbero due modi di trasformare i punti in tracciato, e la
 * prima volta che divergono il disegno arriva **diverso da come è stato fatto**,
 * che in questo gioco vuol dire perdere un round senza capire perché.
 *
 * ## Il tratto in corso viaggia mentre si traccia
 *
 * `onParziale` scatta durante il gesto, `onTratto` alla fine. Serve la prima:
 * senza, chi indovina vedrebbe comparire il disegno **a tratti finiti**, cioè a
 * scatti, e soprattutto non vedrebbe *l'ordine* in cui le cose vengono
 * disegnate — che è metà dell'informazione. Il tetto dei fotogrammi lo mette
 * chi usa il componente, non questo file.
 */
export function TelaDisegno({
  attiva,
  tratti,
  parziale,
  onTratto,
  onParziale,
}: {
  /** I gesti sono attivi? Vero solo per chi disegna. */
  attiva: boolean;
  /** I tratti già chiusi, di chi disegna. */
  tratti: Tratto[];
  /** Il tratto ancora in corso, se c'è. */
  parziale?: Tratto | null;
  onTratto?: (t: Tratto) => void;
  onParziale?: (t: Tratto) => void;
}) {
  const { c } = useTema();
  const [misura, setMisura] = React.useState({ larghezza: 0, altezza: 0 });
  const [inCorso, setInCorso] = React.useState<Tratto | null>(null);

  const alLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setMisura({ larghezza: width, altezza: height });
  };

  /**
   * ⚠️ I punti si accumulano in un **ref** e non in uno stato, e lo stato serve
   * solo a ridisegnare. Con un `setState` per ogni movimento del dito — che su
   * iOS sono sessanta al secondo — React rifarebbe il render dell'intera tela a
   * ogni punto, e il tratto resterebbe indietro rispetto al dito. Il ref tiene
   * la verità, lo stato tiene la copia che si guarda.
   */
  const punti = React.useRef<Tratto>([]);

  const aggiungi = React.useCallback(
    (x: number, y: number) => {
      if (misura.larghezza === 0 || misura.altezza === 0) return;
      // Fuori dai bordi si taglia invece di rifiutare: il dito che esce dalla
      // tela mentre traccia è normale, e interrompere il tratto lì sarebbe
      // peggio che schiacciarlo sul bordo.
      const nx = Math.min(1, Math.max(0, x / misura.larghezza));
      const ny = Math.min(1, Math.max(0, y / misura.altezza));
      punti.current.push(nx, ny);
      setInCorso([...punti.current]);
    },
    [misura]
  );

  const chiudiTratto = React.useCallback(() => {
    const t = punti.current;
    punti.current = [];
    setInCorso(null);
    if (t.length >= 2) onTratto?.(t);
  }, [onTratto]);

  const mandaParziale = React.useCallback(() => {
    if (punti.current.length >= 2) onParziale?.([...punti.current]);
  }, [onParziale]);

  const gesto = React.useMemo(
    () =>
      Gesture.Pan()
        // ⚠️ Senza questo il tratto comincia solo dopo che il dito si è mosso di
        // qualche punto, e un puntino singolo — l'occhio, il naso — non si può
        // fare affatto.
        .minDistance(0)
        .maxPointers(1)
        .enabled(attiva)
        .onBegin((e) => {
          runOnJS(aggiungi)(e.x, e.y);
        })
        .onUpdate((e) => {
          runOnJS(aggiungi)(e.x, e.y);
        })
        .onEnd(() => {
          runOnJS(chiudiTratto)();
        })
        .onFinalize(() => {
          runOnJS(chiudiTratto)();
        }),
    [attiva, aggiungi, chiudiTratto]
  );

  // Il parziale si manda a intervalli, non a ogni punto: sessanta messaggi al
  // secondo per dito saturerebbero il canale senza che l'occhio veda differenza.
  React.useEffect(() => {
    if (!attiva || !onParziale) return;
    const id = setInterval(mandaParziale, 90);
    return () => clearInterval(id);
  }, [attiva, onParziale, mandaParziale]);

  const tuttiITratti = React.useMemo(() => {
    const fuori = [...tratti];
    // Il proprio tratto in corso per chi disegna, quello dell'altro per chi
    // guarda: non capitano mai insieme, quindi una riga sola li copre entrambi.
    const vivo = attiva ? inCorso : parziale;
    if (vivo && vivo.length >= 2) fuori.push(vivo);
    return fuori;
  }, [tratti, inCorso, parziale, attiva]);

  return (
    <GestureDetector gesture={gesto}>
      <View
        onLayout={alLayout}
        style={{
          flex: 1,
          borderRadius: 28,
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          borderWidth: 1,
          borderColor: c.linea,
        }}
      >
        {misura.larghezza > 0 && (
          <Svg width="100%" height="100%">
            {tuttiITratti.map((t, i) => (
              <Path
                key={i}
                d={aPath(t, misura.larghezza, misura.altezza)}
                stroke={c.testo}
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}
          </Svg>
        )}
      </View>
    </GestureDetector>
  );
}
