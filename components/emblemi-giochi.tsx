import type { CodiceGioco } from '@/lib/giochi';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

/**
 * Gli emblemi dei tre giochi, in stile **toon**.
 *
 * ## Cos'e' "toon", qui, in concreto
 *
 * Il riferimento portato dall'utente e' fatto di oggetti 3D paffuti su fondi
 * viola. Copiarlo alla lettera avrebbe messo in casa una seconda direzione
 * visiva accanto a "Quarzo rosa", che e' il modo piu' rapido per far sembrare
 * un'app due app. Quello che si e' preso e' la **grammatica**, non la tavolozza:
 *
 * - **forme piene e grasse**, senza line-art sottile — l'opposto di
 *   `components/emblema.tsx`, che e' un tratto da diario ed e' giusto che resti
 *   diverso: quello e' la firma dell'app, questi sono giocattoli;
 * - **niente spigoli**: ogni terminazione e' tonda;
 * - **un riflesso bianco** in alto a sinistra su ogni volume. E' il singolo
 *   dettaglio che fa leggere una forma piatta come un oggetto gonfio, ed e'
 *   cio' che nel riferimento fa il rendering 3D;
 * - **una sfumatura per volume**, dal chiaro allo scuro della stessa famiglia.
 *
 * ⚠️ **I colori arrivano da fuori**, dai pastelli di `lib/tema.ts` — gli stessi
 * dei tipi di evento del calendario. Non e' pigrizia: e' la ragione per cui
 * questi disegni non introducono una tavolozza nuova. Un gioco e' riconoscibile
 * dal colore prima che dal titolo, esattamente come lo e' un tipo di evento.
 */
export type ProprietaEmblema = {
  size?: number;
  /** Il colore pieno del volume (il `barra` del pastello). */
  colore: string;
  /** Il colore profondo per l'ombra propria (il `testo` del pastello). */
  scuro: string;
};

/** Il riflesso: sempre in alto a sinistra, sempre lo stesso, su ogni emblema. */
function Riflesso({ cx, cy, rx, ry, rot = -25 }: { cx: number; cy: number; rx: number; ry: number; rot?: number }) {
  return (
    <Ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill="#ffffff"
      opacity={0.55}
      transform={`rotate(${rot} ${cx} ${cy})`}
    />
  );
}

/**
 * **Quiz sulle preferenze** — due fumetti che si sovrappongono, con un cuore
 * dentro quello davanti. Il gioco e' "so cosa risponderesti": due voci, e una
 * che parla dell'altra.
 */
export function EmblemaQuiz({ size = 96, colore, scuro }: ProprietaEmblema) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Defs>
        <LinearGradient id="quizA" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ffffff" stopOpacity={0.95} />
          <Stop offset="1" stopColor={colore} stopOpacity={0.55} />
        </LinearGradient>
        <LinearGradient id="quizB" x1="0.2" y1="0" x2="0.8" y2="1">
          <Stop offset="0" stopColor={colore} />
          <Stop offset="1" stopColor={scuro} />
        </LinearGradient>
      </Defs>

      {/* Il fumetto dietro: piu' piccolo, piu' chiaro, gia' meta' fuori scena. */}
      <Path
        d="M20 20h38a12 12 0 0 1 12 12v16a12 12 0 0 1-12 12H36l-11 9v-9h-5a12 12 0 0 1-12-12V32a12 12 0 0 1 12-12Z"
        fill="url(#quizA)"
      />
      {/* Il fumetto davanti, pieno. */}
      <Path
        d="M46 40h30a12 12 0 0 1 12 12v18a12 12 0 0 1-12 12h-4l-10 9v-9H46a12 12 0 0 1-12-12V52a12 12 0 0 1 12-12Z"
        fill="url(#quizB)"
      />
      {/* Il cuore: la domanda e' sempre sull'altro. */}
      <Path
        d="M61 76c-7-5-13-9-13-15a7 7 0 0 1 13-4 7 7 0 0 1 13 4c0 6-6 10-13 15Z"
        fill="#ffffff"
        opacity={0.92}
      />
      <Riflesso cx={50} cy={50} rx={9} ry={4.5} />
    </Svg>
  );
}

/**
 * **Obbligo o verita'** — la bottiglia che gira. E' l'immagine che tutti
 * riconoscono senza didascalia, ed e' la ragione per cui vince su un dado o su
 * un punto interrogativo: quelli dicono "caso", questa dice *questo gioco*.
 */
export function EmblemaObbligo({ size = 96, colore, scuro }: ProprietaEmblema) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Defs>
        <LinearGradient id="botA" x1="0.15" y1="0" x2="0.85" y2="1">
          <Stop offset="0" stopColor={colore} />
          <Stop offset="1" stopColor={scuro} />
        </LinearGradient>
      </Defs>

      {/* L'alone del giro: dice che l'oggetto sta ruotando, senza animarlo. */}
      <Circle cx={50} cy={54} r={34} fill={colore} opacity={0.16} />
      <Path
        d="M20 40a34 20 0 0 1 26-13"
        stroke={colore}
        strokeWidth={5}
        strokeLinecap="round"
        opacity={0.45}
      />

      {/* Corpo + collo, in un tratto solo con terminazioni tonde. */}
      <Path
        d="M45 20h10a4 4 0 0 1 4 4v11c0 4 2 6 5 9 5 5 8 10 8 17v9a10 10 0 0 1-10 10H38a10 10 0 0 1-10-10v-9c0-7 3-12 8-17 3-3 5-5 5-9V24a4 4 0 0 1 4-4Z"
        fill="url(#botA)"
      />
      {/* Etichetta: e' cio' che rende la sagoma una bottiglia e non un birillo. */}
      <Path d="M32 58h36v13H32z" fill="#ffffff" opacity={0.85} />
      <Riflesso cx={41} cy={38} rx={4} ry={11} rot={0} />
    </Svg>
  );
}

/**
 * **Telepatia** — due teste tonde e una scintilla che le tocca entrambe. Le due
 * forme sono **identiche e simmetriche** di proposito: e' l'unico dei tre in cui
 * nessuno dei due indovina l'altro, si arriva insieme o non si arriva.
 */
export function EmblemaTelepatia({ size = 96, colore, scuro }: ProprietaEmblema) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Defs>
        <LinearGradient id="telA" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colore} />
          <Stop offset="1" stopColor={scuro} />
        </LinearGradient>
      </Defs>

      <Circle cx={30} cy={52} r={22} fill="url(#telA)" />
      <Circle cx={70} cy={52} r={22} fill="url(#telA)" />

      {/* Le due onde: il pensiero che attraversa. */}
      <Path d="M46 44c4 5 4 11 0 16" stroke="#ffffff" strokeWidth={4} strokeLinecap="round" opacity={0.75} />
      <Path d="M54 44c-4 5-4 11 0 16" stroke="#ffffff" strokeWidth={4} strokeLinecap="round" opacity={0.75} />

      {/* La scintilla al centro: il momento in cui coincidono. */}
      <Path
        d="M50 18l4.5 11.5L66 34l-11.5 4.5L50 50l-4.5-11.5L34 34l11.5-4.5L50 18Z"
        fill={colore}
      />
      <Riflesso cx={22} cy={44} rx={7} ry={4} />
      <Riflesso cx={62} cy={44} rx={7} ry={4} />
    </Svg>
  );
}

/** Sceglie l'emblema dal codice del gioco. */
export function EmblemaGioco({
  gioco,
  ...resto
}: ProprietaEmblema & { gioco: CodiceGioco }) {
  if (gioco === 'quiz_preferenze') return <EmblemaQuiz {...resto} />;
  if (gioco === 'obbligo_verita') return <EmblemaObbligo {...resto} />;
  if (gioco === 'telepatia') return <EmblemaTelepatia {...resto} />;
  return <EmblemaDisegno {...resto} />;
}

/**
 * **Indovina il disegno** — il foglio e la matita.
 *
 * ⚠️ E' l'unico dei quattro che **non** e' il sigillo D-12: gli altri tre sono
 * "ognuno manda in segreto, si rivela quando hanno mandato entrambi", questo e'
 * *uno produce, l'altro indovina* (P-04, proposta 1). L'emblema lo dice: gli
 * altri tre mostrano **due** cose simmetriche — due fumetti, due teste, una
 * bottiglia che gira in mezzo — questo ne mostra **una sola**, il foglio di chi
 * sta disegnando. Chi guarda non ha ancora niente da vedere.
 */
export function EmblemaDisegno({ size = 96, colore, scuro }: ProprietaEmblema) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Defs>
        <LinearGradient id="disA" x1="0.1" y1="0" x2="0.9" y2="1">
          <Stop offset="0" stopColor={colore} />
          <Stop offset="1" stopColor={scuro} />
        </LinearGradient>
      </Defs>

      {/* Il foglio, appena storto: dritto sembrerebbe un riquadro d'interfaccia. */}
      <Path
        d="M22 16h44a10 10 0 0 1 10 10v48a10 10 0 0 1-10 10H22a10 10 0 0 1-10-10V26a10 10 0 0 1 10-10Z"
        fill="url(#disA)"
        transform="rotate(-5 44 50)"
      />
      {/* Lo scarabocchio: due tratti soli, perche' un disegno riconoscibile
          direbbe *cosa* si disegna, e il gioco e' che non si sa. */}
      <Path
        d="M25 60c6-14 12-20 18-14s6 16 14 12"
        stroke="#ffffff"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.92}
        transform="rotate(-5 44 50)"
      />
      <Path
        d="M28 72c8 3 18 3 26 0"
        stroke="#ffffff"
        strokeWidth={5}
        strokeLinecap="round"
        opacity={0.55}
        transform="rotate(-5 44 50)"
      />

      {/* La matita, con la punta che tocca il foglio. */}
      <Path
        d="M92 22 74 40l-4 12 12-4 18-18a5.7 5.7 0 0 0-8-8Z"
        fill={scuro}
      />
      <Path d="M70 52l4-12 8 8-12 4Z" fill="#ffffff" opacity={0.9} />

      <Riflesso cx={30} cy={30} rx={8} ry={4} />
    </Svg>
  );
}
