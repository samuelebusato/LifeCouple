import * as React from 'react';
import { View } from 'react-native';
import Riani, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { C, pastelli } from '@/lib/tema';
import { molla, durata, cascata } from '@/lib/movimento';

/**
 * **Le illustrazioni delle pagine di spiegazione.** Una per funzione: il
 * calendario, la mappa, i giochi, i ricordi.
 *
 * ## Tre regole che valgono per tutte e quattro
 *
 * 1. **Si animano all'arrivo, non in loop.** Un'animazione infinita su una
 *    pagina che si legge tira l'occhio via dal testo che sta spiegando qualcosa,
 *    e su quattro pagine di fila diventa rumore. Ognuna riceve `attiva` e parte
 *    quando la pagina è davvero quella guardata — poi si ferma.
 * 2. **Nessuna anima un attributo SVG.** Le forme sono statiche e si muovono
 *    dentro `Riani.View` con `transform`/`opacity`: animare un `Path` richiede
 *    `createAnimatedComponent` e un worklet per ogni proprietà, che è tanta
 *    fragilità per un movimento che si vede tre secondi.
 * 3. 🔑 **Mostrano il meccanismo, non l'interfaccia.** Non sono screenshot in
 *    miniatura: uno screenshot invecchia al primo ritocco della schermata vera e
 *    comincia a mentire. Queste dicono *cosa succede* — i giorni che si
 *    riempiono, i posti che si posano, le due carte che si scoprono insieme — e
 *    restano vere anche quando la schermata cambia.
 */

/** Quanto è alta la scena di ogni illustrazione. Una sola, così le quattro pagine non ballano. */
export const ALTEZZA_SCENA = 200;

function Scena({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ height: ALTEZZA_SCENA, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </View>
  );
}

/**
 * Un elemento che **entra** quando la pagina diventa attiva, con un ritardo
 * proprio: è ciò che fa la cascata. Estratto perché tutte e quattro le
 * illustrazioni fanno la stessa cosa con forme diverse.
 */
function Entra({
  attiva,
  indice,
  children,
  da = 14,
  style,
}: {
  attiva: boolean;
  indice: number;
  children: React.ReactNode;
  /** Di quanto sale entrando, in punti. */
  da?: number;
  style?: any;
}) {
  const v = useSharedValue(0);
  React.useEffect(() => {
    if (attiva) {
      v.value = withDelay(cascata(indice), withSpring(1, molla.entrata));
    } else {
      // Si azzera **senza** animazione visibile: la pagina non è a schermo, e
      // un ritorno animato di nascosto è lavoro che nessuno vede.
      v.value = withTiming(0, { duration: durata.lampo });
    }
  }, [attiva, indice, v]);

  const stile = useAnimatedStyle(() => ({
    opacity: v.value,
    transform: [{ translateY: (1 - v.value) * da }, { scale: 0.92 + v.value * 0.08 }],
  }));

  return <Riani.View style={[style, stile]}>{children}</Riani.View>;
}

/**
 * **Il diario**: le esperienze che si posano una sotto l'altra, in ordine di
 * tempo, e una che porta con sé una foto.
 *
 * 🔑 **Sostituisce la griglia del calendario** (2026-09-04, seconda revisione).
 * La griglia disegnava un *mese*, cioè un contenitore vuoto da riempire; il
 * diario disegna **cose già vissute**, che è ciò che l'utente ha chiesto di
 * mettere al centro. La differenza non è estetica: un mese vuoto dice *«qui
 * dovrai organizzarti»*, un elenco di voci dice *«qui resta quello che avete
 * fatto»* — e la seconda è la promessa del prodotto.
 *
 * La voce con la miniatura non è decorazione: la vista Diario mostra davvero le
 * anteprime delle foto attaccate agli eventi (`anteprimePerEvento`). Disegnare
 * una foto lì è dire una cosa vera.
 */
export function IllustrazioneDiario({ attiva }: { attiva: boolean }) {
  const voci = [
    { largo: 96, foto: false, tinta: pastelli.romantico },
    { largo: 118, foto: true, tinta: pastelli.vacanza },
    { largo: 84, foto: false, tinta: pastelli.impegno },
  ];
  return (
    <Scena>
      <View style={{ width: 232, gap: 10 }}>
        {voci.map((v, i) => (
          <Entra key={i} attiva={attiva} indice={i * 2} da={16}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                borderRadius: 16,
                backgroundColor: '#ffffff',
                borderWidth: 1,
                borderColor: C.linea,
                padding: 10,
              }}
            >
              {/* Il filo del tempo: un punto per voce, tutti allineati. */}
              <View
                style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: v.tinta.barra }}
              />
              {/* ⚠️ Le due righe **non** usano `C.linea`, che era la scelta
                  ovvia e sbagliata: su carta bianca sparisce, e in preview le
                  voci si leggevano come tre rettangoli vuoti. La riga alta usa
                  la barra della tinta (è il titolo della voce), la bassa il suo
                  fondo — così ogni voce ha un colore riconoscibile, che è anche
                  ciò che fa il calendario vero coi tipi di evento. */}
              <View style={{ flex: 1, gap: 5 }}>
                <View style={{ height: 7, width: v.largo, borderRadius: 4, backgroundColor: v.tinta.barra }} />
                <View style={{ height: 6, width: v.largo * 0.6, borderRadius: 4, backgroundColor: v.tinta.fondo }} />
              </View>
              {v.foto && (
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    backgroundColor: v.tinta.fondo,
                    borderWidth: 1,
                    borderColor: v.tinta.barra,
                  }}
                />
              )}
            </View>
          </Entra>
        ))}
      </View>
    </Scena>
  );
}

/** Il segnaposto della mappa: goccia piena con il foro chiaro, come su ogni mappa. */
function Pin({ colore, size = 34 }: { colore: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2c-4 0-7 3-7 7 0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z"
        fill={colore}
      />
      <Path d="M12 6.5a2.6 2.6 0 100 5.2 2.6 2.6 0 000-5.2z" fill="#ffffff" />
    </Svg>
  );
}

/**
 * **La mappa**: tre segnaposti che si posano uno dopo l'altro su una traccia.
 * Due dell'accento (ci siete stati) e uno ambra (il ristorante), che è la
 * distinzione di colore che l'app fa davvero.
 */
export function IllustrazioneMappa({ attiva }: { attiva: boolean }) {
  return (
    <Scena>
      <View style={{ width: 240, height: 150, justifyContent: 'center' }}>
        {/* La traccia: sta sotto e non si anima, è il terreno su cui cadono i pin. */}
        <Svg width={240} height={150} style={{ position: 'absolute' }}>
          <Path
            d="M18 118 C 70 118, 62 52, 118 52 S 186 96, 224 60"
            stroke={C.linea}
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
            strokeDasharray="1 9"
          />
        </Svg>
        <Entra attiva={attiva} indice={0} da={26} style={{ position: 'absolute', left: 2, top: 84 }}>
          <Pin colore={C.accento} />
        </Entra>
        <Entra attiva={attiva} indice={2} da={26} style={{ position: 'absolute', left: 100, top: 18 }}>
          <Pin colore={C.ambra} size={38} />
        </Entra>
        <Entra attiva={attiva} indice={4} da={26} style={{ position: 'absolute', left: 204, top: 26 }}>
          <Pin colore={C.accento} size={30} />
        </Entra>
      </View>
    </Scena>
  );
}

/**
 * **I giochi**: due carte che si scoprono insieme, e qualcosa che cresce sotto.
 *
 * ## Cosa disegna, e perché è cambiata (2026-09-04, seconda revisione)
 *
 * Prima disegnava **solo** il sigillo di D-12 — *ognuno risponde in segreto, si
 * rivela quando hanno risposto entrambi*. Su richiesta dell'utente il centro si
 * è spostato sul **perché si gioca**: crescere come coppia. Il sigillo resta
 * (le due carte si alzano allo stesso istante, e il contemporaneo *è*
 * l'informazione), ma accanto compaiono i tre segni che si accendono: le
 * partite portate a termine, cioè la cosa che si accumula giocando.
 *
 * ## 🔴 Il vincolo che ha deciso come disegnarla: P-03
 *
 * P-03 vieta che il punteggio diventi un **verdetto sulla relazione**, ed è la
 * ragione per cui qui **non c'è una barra che si riempie**. Una barra ha un
 * pieno e un vuoto, e su un'app di coppia si legge inevitabilmente come *«siete
 * al 60%»* — cioè una pagella. Tre segni che si accendono uno dopo l'altro
 * dicono **quante volte l'avete fatto**, che è un risultato ottenuto insieme e
 * non una misura di quanto valete.
 *
 * Per lo stesso motivo il cuore in mezzo **cresce** invece di illuminarsi a
 * metà: cresce e basta, come la creatura di P-01 — non deperisce e non
 * rimprovera.
 */
export function IllustrazioneGiochi({ attiva }: { attiva: boolean }) {
  const g = useSharedValue(0);
  React.useEffect(() => {
    g.value = attiva
      ? withDelay(320, withSpring(1, molla.entrata))
      : withTiming(0, { duration: durata.lampo });
  }, [attiva, g]);

  // Le due carte si inclinano in direzioni opposte scoprendosi: stesso istante,
  // stessa quantità, versi speculari.
  const sinistra = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${-g.value * 13}deg` }, { translateX: -g.value * 10 }],
  }));
  const destra = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${g.value * 13}deg` }, { translateX: g.value * 10 }],
  }));
  const cuore = useAnimatedStyle(() => ({
    opacity: g.value,
    transform: [{ scale: 0.6 + g.value * 0.4 }],
  }));

  const carta = {
    width: 76,
    height: 104,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: C.linea,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
  };
  const riga = { height: 7, borderRadius: 4, backgroundColor: C.linea };

  return (
    <Scena>
      <View style={{ alignItems: 'center', gap: 22 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <Entra attiva={attiva} indice={0} da={16}>
            <Riani.View style={[carta, sinistra]}>
              <View style={[riga, { width: 40 }]} />
              <View style={[riga, { width: 30 }]} />
            </Riani.View>
          </Entra>

          <Riani.View style={[{ width: 44, alignItems: 'center' }, cuore]}>
            <Svg width={34} height={34} viewBox="0 0 24 24">
              <Path
                d="M12 20s-7-4.6-7-9.4A4.1 4.1 0 0112 8.6 4.1 4.1 0 0119 10.6C19 15.4 12 20 12 20z"
                fill={C.accento}
              />
            </Svg>
          </Riani.View>

          <Entra attiva={attiva} indice={1} da={16}>
            <Riani.View style={[carta, destra]}>
              <View style={[riga, { width: 40 }]} />
              <View style={[riga, { width: 30 }]} />
            </Riani.View>
          </Entra>
        </View>

        {/* I tre segni che si accendono: le partite portate a termine insieme.
            Si accendono **dopo** che le carte si sono scoperte — prima si gioca,
            poi si accumula — e uno alla volta, perché è il conteggio a essere
            l'informazione. Vedi il commento in testa sul perché non è una barra. */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Entra key={i} attiva={attiva} indice={i + 5} da={8}>
              <Svg width={20} height={20} viewBox="0 0 24 24">
                <Path
                  d="M12 20s-7-4.6-7-9.4A4.1 4.1 0 0112 8.6 4.1 4.1 0 0119 10.6C19 15.4 12 20 12 20z"
                  fill={i === 2 ? C.accento : pastelli.romantico.barra}
                />
              </Svg>
            </Entra>
          ))}
        </View>
      </View>
    </Scena>
  );
}

/**
 * **I ricordi**: tre riquadri impilati che si sventagliano — le foto, le liste,
 * i film. Il mazzo che si apre dice "ce n'è più di uno e stanno insieme", che è
 * la promessa della galleria.
 */
export function IllustrazioneRicordi({ attiva }: { attiva: boolean }) {
  const v = useSharedValue(0);
  React.useEffect(() => {
    v.value = attiva
      ? withDelay(220, withSpring(1, molla.entrata))
      : withTiming(0, { duration: durata.lampo });
  }, [attiva, v]);

  // ⚠️ Tre `useAnimatedStyle` scritti per esteso invece di una funzione che li
  // fabbrica: un hook dentro un helper e' una violazione delle regole degli
  // hook che qui funzionerebbe per caso (tre chiamate, sempre nello stesso
  // ordine) e si romperebbe al primo foglio reso condizionale. La ripetizione
  // e' il prezzo di non lasciare una trappola.
  const sx = useAnimatedStyle(() => ({
    transform: [
      { rotateZ: `${-v.value * 11}deg` },
      { translateX: -v.value * 34 },
      { translateY: v.value * 6 },
    ],
  }));
  const dx = useAnimatedStyle(() => ({
    transform: [
      { rotateZ: `${v.value * 11}deg` },
      { translateX: v.value * 34 },
      { translateY: v.value * 6 },
    ],
  }));

  const base = {
    position: 'absolute' as const,
    width: 104,
    height: 128,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.linea,
  };

  return (
    <Scena>
      <Entra attiva={attiva} indice={0} da={18}>
        <View style={{ width: 200, height: 140, alignItems: 'center', justifyContent: 'center' }}>
          <Riani.View style={[base, { backgroundColor: pastelli.vacanza.fondo }, sx]} />
          <Riani.View style={[base, { backgroundColor: pastelli.impegno.fondo }, dx]} />
          <Riani.View style={[base, { backgroundColor: '#ffffff' }]}>
            <View style={{ flex: 1, margin: 12, borderRadius: 10, backgroundColor: pastelli.romantico.fondo }} />
          </Riani.View>
        </View>
      </Entra>
    </Scena>
  );
}
