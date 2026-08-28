import * as React from 'react';
import { View, StyleSheet, Platform, type ViewStyle, type StyleProp } from 'react-native';
import Riani, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { TextClassContext } from '@/components/ui/text';
import { Premibile } from '@/components/ui/premibile';
import { useTema } from '@/lib/tema';
import { durata } from '@/lib/movimento';

/**
 * Il vetro liquido: superficie, bottone, carta.
 *
 * **Due strade, scelte a runtime:**
 *
 * 1. **iOS 26+ → Liquid Glass nativo** (`expo-glass-effect`): e' il materiale
 *    vero del sistema — rifrazione, riflessi che seguono il movimento — non
 *    un'imitazione. Quando c'e', si usa quello e basta: sovrapporgli velature
 *    nostre lo ucciderebbe.
 * 2. **Altrove → i tre strati**: sfocatura + velatura sfumata + bordo
 *    luminoso. Il velo e' volutamente leggero: la prima taratura (0.74) copriva
 *    tutto e "non si vedeva nessun effetto" — un vetro che non lascia intuire
 *    cio' che ha sotto e' plastica.
 *
 * Il quarto ingrediente e' fuori di qui ed e' il **fondo**: un vetro sopra una
 * tinta piatta non ha niente da lasciar trasparire. Per questo le schermate
 * usano `Fondo` (lib/tema.ts) invece di `bg-background`.
 *
 * ## La base sotto il vetro (`fondo`, 2026-08-27)
 *
 * Il vetro mostra **cio' che ha sotto**. E' la sua ragione d'essere, ed e'
 * anche il suo modo di rompersi, in due forme che sembrano diverse e sono la
 * stessa:
 *
 * 1. **«Sembra in ombra».** Dentro un foglio modale sotto il vetro non c'e'
 *    contenuto: c'e' la **velatura scura** del modale (`rgba(20,8,14,0.4)`).
 *    La sfocatura mescola quel buio, e una superficie pensata chiara si legge
 *    sporca. Non e' un bug della sfocatura: e' vetro messo dove non c'era
 *    niente di bello da guardarci attraverso.
 * 2. **«E' sparito il riquadro, restano le icone».** Se il materiale di sistema
 *    non viene disegnato — e su iOS il vetro e' una vista **nativa**, che ha
 *    i suoi motivi per non disegnarsi — sotto non resta nulla, perche' non
 *    c'era nulla. Gli elementi sopra restano, la superficie no.
 *
 * `fondo` mette **qualcosa sotto**, e decide come il vetro fallisce invece di
 * scoprirlo: `'pieno'` per il vetro dentro un foglio (base chiara opaca, il
 * buio non arriva piu'), `'sicuro'` per il vetro che galleggia sul contenuto
 * (una velatura appena percettibile: invisibile quando il materiale c'e', ed
 * e' tutto cio' che resta quando non c'e').
 */

// La scelta nativo/fallback vive in `vetro-nativo(.native).ts`: file per
// piattaforma, perche' Metro risolve i require staticamente e il pacchetto
// del Liquid Glass sul web non esiste (avrebbe rotto — ha rotto — il bundle).
import { GlassView, VETRO_NATIVO as vetroNativo } from '@/components/ui/vetro-nativo';

/**
 * **Sotto, da qui in giu', non c'e' niente da guardare.**
 *
 * ## Perche' esiste (2026-08-28)
 *
 * Il 2026-08-27 la regola era «vetro dentro un foglio ⇒ `fondo="pieno"`», e
 * doveva ricordarsela chi scriveva la schermata. Nel commento di
 * `cerca-luogo.tsx` c'era scritto anche il perche' non poteva essere
 * altrimenti: *«un componente non sa in che albero e' stato montato»*.
 *
 * **Era falso**, ed e' costato il difetto: il contesto di React e' esattamente
 * il modo in cui un componente sa in che albero e' stato montato. Con cento
 * punti che usano il vetro, la disciplina al punto di chiamata non regge — e
 * infatti non ha retto: il pannello del posto nuovo aveva la sua base, ma i
 * **bottoni dentro** no, ed erano loro a leggersi in ombra.
 *
 * Chi mette una velatura scura lo dichiara **una volta**, e ogni vetro sotto di
 * lui si adegua da solo. Un `Vetro` lo dichiara ai propri figli senza che
 * nessuno debba dirglielo: sotto un vetro c'e' il vetro, non il contenuto.
 *
 * ## E fa la seconda meta' del lavoro: **niente vetro dentro il vetro**
 *
 * Su iOS 26 il Liquid Glass e' una vista **nativa** che campiona cio' che ha
 * dietro *nella finestra*. Annidarne uno dentro un altro non lo fa campionare
 * il vetro che lo contiene: gli fa campionare lo sfondo di tutti e due — cioe'
 * la velatura scura del modale. Il bottone dentro il foglio diventa **scuro**,
 * ed e' il difetto riferito. Quando siamo dentro, quindi, si usano i tre
 * strati: sopra una base chiara opaca danno la stessa superficie chiara, senza
 * chiedere al sistema una composizione che non supporta.
 */
const ContestoNienteSotto = React.createContext(false);

/**
 * Dichiara che da qui in giu' sotto il vetro c'e' una velatura di modale e non
 * del contenuto. Da mettere in cima a ogni foglio (`components/foglio.tsx` lo
 * fa da se'); i `Modal` costruiti a mano lo ereditano dalla loro carta.
 */
export function NienteSotto({ children }: { children?: React.ReactNode }) {
  return <ContestoNienteSotto.Provider value={true}>{children}</ContestoNienteSotto.Provider>;
}

type VetroProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Raggio degli angoli: il vetro senza angoli morbidi sembra una lastra rotta. */
  raggio?: number;
  /** Quanto sfoca (solo fallback). Piu' alto = piu' opaco. */
  intensita?: number;
  /** L'ombra stacca il vetro dal fondo. Si toglie quando il vetro e' incassato. */
  ombra?: boolean;
  /** Velatura rosa invece che neutra: per le superfici che devono farsi notare. */
  tinto?: boolean;
  /**
   * Cosa c'e' **sotto** gli strati di vetro. Vedi il commento in testa al file.
   *
   * - `'niente'` (predefinito): nulla. Il vetro e' davvero trasparente.
   * - `'sicuro'`: una velatura chiarissima. Non cambia l'aspetto quando il
   *   materiale viene disegnato; e' la superficie di riserva quando non lo e'.
   * - `'pieno'`: base chiara **opaca**. Per il vetro **dentro un foglio**, dove
   *   sotto c'e' solo la velatura scura del modale.
   */
  fondo?: 'niente' | 'sicuro' | 'pieno';
  /**
   * Il vetro di sistema reagisce al tocco (solo iOS 26). Si accende sulle
   * superfici che SONO un comando — la barra, i bottoni — non sulle carte:
   * una carta che si deforma sotto il dito sembra rotta, non viva.
   */
  interattivo?: boolean;
};

export function Vetro({
  children,
  style,
  raggio = 32,
  intensita,
  ombra = true,
  tinto = false,
  fondo,
  interattivo = false,
}: VetroProps) {
  const { vetro } = useTema();
  /**
   * Il valore passato **vince sempre**: il contesto e' il default giusto, non
   * un'imposizione. Chi ha un caso che il contesto non prevede lo dichiara.
   */
  const nienteSotto = React.useContext(ContestoNienteSotto);
  const fondoVero = fondo ?? (nienteSotto ? 'pieno' : 'niente');

  /**
   * ⚠️ **Bianco, non il colore della carta.** Sotto una velatura gia' chiara
   * (0.52) e un riflesso, qualunque tinta si smorza: il compito di questa vista
   * non e' dare un colore, e' impedire che passi il buio.
   */
  const colorePiano =
    fondoVero === 'pieno'
      ? 'rgba(255,255,255,0.94)'
      : fondoVero === 'sicuro'
        ? 'rgba(255,255,255,0.22)'
        : null;
  const piano = colorePiano ? (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, { backgroundColor: colorePiano }]}
    />
  ) : null;

  // L'ombra non puo' stare sulla stessa vista che ritaglia (`overflow: hidden`):
  // su iOS verrebbe ritagliata insieme al contenuto. Quindi due viste annidate.
  const stileOmbra = ombra
    ? {
        shadowColor: vetro.ombra,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 1,
        shadowRadius: 24,
        elevation: 12,
      }
    : null;

  /**
   * Il materiale di sistema si usa **solo dove ha davvero qualcosa da mostrare**.
   * Due esclusioni, e sono le due facce dello stesso difetto:
   *
   * - `nienteSotto`: vetro di sistema **dentro** vetro di sistema non campiona
   *   il vetro che lo contiene, campiona lo sfondo di entrambi — cioe' la
   *   velatura scura del modale. E' cosi' che il bottone dentro il foglio
   *   diventava scuro.
   * - `fondoVero === 'pieno'`: sotto c'e' una base **opaca**. Non c'e' niente da
   *   attraversare, quindi non c'e' niente da guadagnare — e resta solo il
   *   rischio che il materiale campioni il buio invece della base. Un vetro a
   *   cui si e' tolto il "attraverso" non e' piu' vetro: e' una superficie
   *   chiara, ed e' meglio disegnarla noi che chiederla al sistema.
   *
   * ⚠️ La seconda copre il caso che il 2026-08-27 si era dato per risolto: il
   * pannello del posto nuovo *aveva* `fondo="pieno"`, e all'utente si leggeva
   * ancora in ombra. Cosi' l'esito non dipende piu' da quale dei due strati
   * fosse il colpevole.
   */
  if (vetroNativo && GlassView && !nienteSotto && fondoVero !== 'pieno') {
    return (
      <View style={[stileOmbra, { borderRadius: raggio }, style]}>
        {/* ⚠️ Il piano sta **fuori** dal `GlassView` e dietro di lui, non
            dentro: dentro sarebbe un figlio *sopra* il materiale e lo
            coprirebbe: qui deve stare sotto, perche' e' cio' che il vetro
            guarda — e cio' che resta se il vetro non viene disegnato. */}
        {colorePiano && (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              { borderRadius: raggio, backgroundColor: colorePiano },
            ]}
          />
        )}
        {/* width 100% ESPLICITO: GlassView e' una vista nativa e non sempre
            partecipa allo stretch di Yoga — era una delle cause della barra
            con le voci ammassate su un lato. */}
        <GlassView
          style={{ borderRadius: raggio, overflow: 'hidden' as const, width: '100%' as const }}
          glassEffectStyle="regular"
          // ⚠️ `colorScheme` FISSO a chiaro (D-39): senza, su un telefono in
          // modalita' notte iOS 26 renderebbe vetro scuro sotto un'interfaccia
          // chiara — l'app ha una modalita' sola, il vetro deve saperlo.
          colorScheme="light"
          isInteractive={interattivo}
          tintColor={tinto ? 'rgba(228,37,158,0.28)' : undefined}
        >
          <NienteSotto>{children}</NienteSotto>
        </GlassView>
      </View>
    );
  }

  return (
    <View style={[stileOmbra, { borderRadius: raggio }, style]}>
      <View style={{ borderRadius: raggio, overflow: 'hidden', width: '100%' }}>
        {piano}
        {/* ⚠️ Con la base **opaca** la sfocatura non ha piu' niente da sfocare:
            si salta, ed e' una vista nativa in meno per ogni foglio aperto. */}
        {fondoVero !== 'pieno' && (
          <BlurView
            intensity={intensita ?? vetro.intensita}
            tint={vetro.tinta}
            style={StyleSheet.absoluteFill}
          />
        )}
        <LinearGradient
          colors={
            tinto
              ? ['rgba(255,255,255,0.62)', 'rgba(252,205,233,0.48)']
              : (vetro.velo as unknown as [string, string])
          }
          style={StyleSheet.absoluteFill}
        />
        {/* Il riflesso vive solo nella meta' alta: e' luce che cade dall'alto,
            e se coprisse tutto smetterebbe di sembrare luce. */}
        <LinearGradient
          colors={vetro.riflesso as unknown as [string, string]}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '55%' }}
        />
        <NienteSotto>{children}</NienteSotto>
        {/* Bordo per ultimo, sopra tutto, e non cliccabile. */}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            { borderRadius: raggio, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: vetro.bordo },
          ]}
        />
      </View>
    </View>
  );
}

/** C'e' il Liquid Glass di sistema? Esposto per chi deve adattare i contrasti. */
export { VETRO_NATIVO, GlassView, GlassContainer } from '@/components/ui/vetro-nativo';

/**
 * Il bottone di vetro.
 *
 * `accento` e' il bottone d'azione: resta vetro, ma tinto di rosa — cosi' si
 * distingue da quelli neutri **senza** diventare un rettangolo pieno. Col
 * vetro nativo tinto il testo passa al bianco: sul materiale colorato di
 * sistema il rosa-su-rosa non regge il contrasto.
 */
export function BottoneVetro({
  children,
  onPress,
  disabled,
  variante = 'neutro',
  raggio = 26,
  style,
  altezza = 54,
}: {
  children?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  variante?: 'neutro' | 'accento' | 'pericolo';
  raggio?: number;
  style?: StyleProp<ViewStyle>;
  altezza?: number;
}) {
  /**
   * ⚠️ **Non `vetroNativo` da solo** (2026-08-28). Quel flag dice se il sistema
   * ha il Liquid Glass, non se **questo** bottone lo sta usando: dentro un
   * foglio non lo usa (vedi `ContestoNienteSotto`), e il bianco pensato per il
   * vetro tinto di sistema finirebbe su una velatura rosa chiara — bianco su
   * rosa chiaro, cioe' un'etichetta illeggibile. La domanda giusta non e'
   * «il sistema ha il vetro?» ma «che superficie ho sotto i piedi io?».
   */
  // L'hook si chiama sempre e per primo: dietro un `&&` che cortocircuita
  // sarebbe una chiamata condizionale, cioe' un ordine degli hook variabile.
  const nienteSotto = React.useContext(ContestoNienteSotto);
  const nativoQui = !!(vetroNativo && GlassView) && !nienteSotto;
  const testo =
    variante === 'accento'
      ? nativoQui
        ? 'text-base font-semibold text-white'
        : 'text-base font-semibold text-primary'
      : variante === 'pericolo'
        ? 'text-base font-medium text-destructive'
        : 'text-base font-medium text-foreground';

  return (
    <Premibile
      onPress={onPress}
      disabled={disabled}
      // Un bottone a piena larghezza che cede del 4% si deforma in modo
      // vistoso: piu' l'oggetto e' largo, piu' la stessa percentuale diventa
      // spostamento in punti. Qui bastano due punti e mezzo per farlo sentire.
      scala={0.975}
      style={[{ opacity: disabled ? 0.45 : 1 }, style]}
    >
      <Vetro raggio={raggio} tinto={variante === 'accento'} ombra={!disabled}>
        <TextClassContext.Provider value={testo}>
          <View
            style={{
              height: altezza,
              paddingHorizontal: 22,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
            }}
          >
            {children}
          </View>
        </TextClassContext.Provider>
      </Vetro>
    </Premibile>
  );
}

/**
 * Il bottone **pieno**: per l'azione principale di un foglio, quella che si
 * puo' fare o non si puo' fare.
 *
 * Perche' non basta `BottoneVetro variante="accento"`: quello resta vetro
 * chiaro in entrambi gli stati, e fra attivo e disattivo cambia solo un filo di
 * opacita'. Su un form dove il salvataggio dipende da un campo compilato,
 * quella differenza non si legge — e non si capisce che manca qualcosa.
 * Qui il colore **e' lo stato**: magenta pieno quando si puo' agire, grigio
 * chiaro quando no.
 *
 * ## Il colore ci **arriva**, non ci salta (2026-08-27)
 *
 * Il passaggio grigio→magenta e' sfumato invece che istantaneo, ed e' l'unica
 * animazione di questa libreria che non serve a dare riscontro a un tocco ma a
 * **farsi notare senza essere guardata**. Chi compila il titolo di un evento
 * sta guardando il campo di testo, non il bottone in fondo: un colore che
 * cambia di scatto fuori dal punto in cui hai gli occhi non lo vedi, un colore
 * che si accende nell'arco di due decimi lo prendi con la coda dell'occhio. E'
 * il momento in cui il foglio smette di dire "manca qualcosa".
 *
 * Sfumano insieme fondo, ombra e **colore del testo**: far virare il fondo
 * lasciando che l'etichetta scatti da grigia a bianca a meta' strada e' peggio
 * di non animare niente — si nota la giuntura invece della transizione.
 */
export function BottonePieno({
  testo,
  onPress,
  disabled,
  altezza = 58,
  style,
}: {
  testo: string;
  onPress?: () => void;
  disabled?: boolean;
  altezza?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTema();

  /** 0 = spento (non si puo' agire), 1 = acceso. */
  const acceso = useSharedValue(disabled ? 0 : 1);
  React.useEffect(() => {
    acceso.value = withTiming(disabled ? 0 : 1, { duration: durata.media });
  }, [disabled, acceso]);

  const stileFondo = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(acceso.value, [0, 1], ['#efe6ec', c.accento]),
    // L'ombra e' meta' del "pieno": un rettangolo magenta senza stacco dal
    // foglio sembra un'etichetta, non un bottone.
    shadowOpacity: acceso.value,
    elevation: acceso.value * 6,
  }));
  const stileTesto = useAnimatedStyle(() => ({
    color: interpolateColor(acceso.value, [0, 1], [c.tenue, c.suAccento]),
  }));

  return (
    <Premibile
      onPress={onPress}
      disabled={disabled}
      // Come il bottone di vetro: e' largo quanto il foglio, e una scala
      // vistosa su un oggetto largo si legge come una deformazione.
      scala={0.975}
      style={style}
    >
      <Riani.View
        style={[
          {
            height: altezza,
            borderRadius: 26,
            paddingHorizontal: 24,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: 'rgba(180,20,120,0.35)',
            shadowOffset: { width: 0, height: 6 },
            shadowRadius: 14,
          },
          stileFondo,
        ]}
      >
        {/* ⚠️ `Riani.Text` e non il `Text` dell'app: il colore va animato sul
            thread della UI, e qui non si perde niente — le uniche classi che il
            nostro `Text` avrebbe messo (`text-base text-foreground`) sono gia'
            entrambe soprascritte dallo stile esplicito. */}
        <Riani.Text style={[{ fontSize: 16, fontWeight: '700' }, stileTesto]}>{testo}</Riani.Text>
      </Riani.View>
    </Premibile>
  );
}

/**
 * Bottone tondo di vetro: per le azioni che stanno sopra il contenuto.
 *
 * ⚠️ Stile-**oggetto**, non funzione: in questo progetto uno stile passato come
 * funzione a `Pressable` non viene applicato (la storia sta in
 * `components/barra-volante.tsx`). Qui il danno era invisibile — si perdeva
 * solo il riscontro del tocco — ma un difetto invisibile che si propaga per
 * copia e' peggio di uno che si vede.
 */
export function TondoVetro({
  children,
  onPress,
  disabled,
  lato = 56,
  style,
  tinto = true,
  fondo,
}: {
  children?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  lato?: number;
  style?: StyleProp<ViewStyle>;
  tinto?: boolean;
  fondo?: 'niente' | 'sicuro' | 'pieno';
}) {
  /**
   * ⚠️ **`'sicuro'` di default** (2026-08-28), ed e' il difetto riferito
   * dall'utente: all'avvio dell'app il «+» della mappa mostrava **l'icona senza
   * il tondo**. Questo bottone galleggia sopra il contenuto e non ha niente
   * sotto di se': quando il materiale nativo non viene disegnato, non resta
   * nulla — e' il modo di rompersi n. 2 descritto in testa al file.
   *
   * `'sicuro'` era stato scritto ieri **proprio per questo caso** e non era mai
   * stato messo su nessun componente: una rete di sicurezza progettata e non
   * collegata e' esattamente come non averla. Ora la si paga qui, una volta, per
   * tutti i tondi dell'app — che sono il «+» di ogni schermata.
   */
  const nienteSotto = React.useContext(ContestoNienteSotto);
  return (
    <Premibile
      onPress={onPress}
      disabled={disabled}
      // Il tondo e' piccolo e sta da solo sopra il contenuto: qui il cedimento
      // puo' essere pieno, ed e' l'unico modo che ha per dire "toccato" —
      // sotto non c'e' nessuna schermata che cambia all'istante.
      scala={0.9}
      style={[{ opacity: disabled ? 0.45 : 1 }, style]}
    >
      <Vetro raggio={lato / 2} tinto={tinto} fondo={fondo ?? (nienteSotto ? 'pieno' : 'sicuro')}>
        <View style={{ width: lato, height: lato, alignItems: 'center', justifyContent: 'center' }}>
          {children}
        </View>
      </Vetro>
    </Premibile>
  );
}

/**
 * La carta di vetro: contenitore per i blocchi di contenuto.
 *
 * Sfoca meno di un bottone: una superficie grande con la stessa sfocatura di
 * un bottone diventa una parete opaca e il fondo sparisce.
 *
 * ⚠️ **Dentro un foglio serve una base chiara**, o la carta sfoca il buio della
 * velatura e si legge «in ombra». Dal 2026-08-28 **non c'e' piu' niente da
 * ricordare**: `ContestoNienteSotto` lo deduce dall'albero, e `fondo="pieno"`
 * esplicito resta solo dove si vuole dirlo a voce alta. La versione a carico di
 * chi chiamava e' durata un giorno e ha lasciato scoperti i bottoni interni.
 */
export function CartaVetro({
  children,
  style,
  raggio = 30,
  ombra = true,
  fondo,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  raggio?: number;
  ombra?: boolean;
  fondo?: 'niente' | 'sicuro' | 'pieno';
}) {
  return (
    <Vetro
      raggio={raggio}
      intensita={Platform.OS === 'ios' ? 34 : 44}
      ombra={ombra}
      fondo={fondo}
      style={style}
    >
      {children}
    </Vetro>
  );
}
