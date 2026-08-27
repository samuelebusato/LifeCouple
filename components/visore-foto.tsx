import * as React from 'react';
import {
  View,
  Modal,
  Image,
  FlatList,
  ScrollView,
  Pressable,
  Animated,
  ActivityIndicator,
  Platform,
  StyleSheet,
  LayoutAnimation,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Riani, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { lingua } from '@/lib/i18n';

/**
 * Il visore delle foto a schermo pieno, **uno solo per tutta l'app** — lo usano
 * la pagina evento e la galleria.
 *
 * Riferimento: il video di Foto di iPhone portato dall'utente il 2026-08-27.
 *
 * ## ⚠️ Niente stili-funzione su `Pressable`, mai, in questo progetto
 *
 * La prima versione usava `style={({ pressed }) => ({ ... })}` sui bottoni. In
 * questo progetto **quello stile non viene applicato**: i tondi scuri sotto le
 * icone sparivano, e restavano glifi nudi grandi venti punti, impossibili da
 * centrare col dito. Lo stesso difetto ha tenuto le voci della barra in basso
 * ammassate — e poi impilate in colonna — per tre tentativi di seguito, perche'
 * senza stile un contenitore React Native torna a `flexDirection: 'column'`.
 *
 * La regola che ne esce, e che vale per tutto il repo: **la geometria e
 * l'aspetto stanno su una `View` con uno stile-oggetto**; il `Pressable` sta
 * dentro e non porta stile. Il riscontro del tocco si fa con `onPressIn` /
 * `onPressOut` e uno stato, non con la funzione.
 *
 * ## Cosa prende da Foto, e perche'
 *
 * - **Nero pieno e immagine a tutto schermo**: le tacche si scavalcano, e sono
 *   i *comandi* a stare nell'area sicura, non l'immagine.
 * - **L'immagine e' centrata fra le due barre**, non nello schermo intero:
 *   altrimenti meta' foto finisce dietro la filmstrip e sembra "riempire male".
 * - **Pizzica per ingrandire**, con la `ScrollView` di sistema (`zoomScale`):
 *   su iOS lo zoom di una ScrollView **e' quello di Foto**, con lo stesso
 *   rimbalzo e la stessa inerzia. Una libreria di gesti avrebbe aggiunto peso
 *   per riscrivere peggio cio' che il sistema fa gia'.
 * - **Filmstrip** in basso: dice quante altre ce ne sono e permette di saltare.
 * - **Trascina giu' per chiudere**, con l'immagine che rimpicciolisce mentre
 *   scende. E' il gesto che chi usa un iPhone prova per primo.
 *
 * ## Perche' il gesto di chiusura gira su Reanimated
 *
 * La prima versione usava `PanResponder` + `Animated`, e per forza con
 * `useNativeDriver: false`: un valore mosso da `setValue` in JavaScript non
 * puo' essere guidato dal driver nativo. Risultato — ogni fotogramma del
 * trascinamento attraversava il ponte JS, e su una vista a schermo pieno si
 * vedeva: il gesto funzionava ma era legnoso.
 *
 * Con `Gesture.Pan` di gesture-handler e i valori condivisi di Reanimated il
 * gesto **non passa mai da JavaScript**: dito, trasformazione e molla finale
 * vivono tutti sul thread della UI. Sul ponte torna una cosa sola, alla fine:
 * la chiamata che chiude il visore.
 *
 * Le **azioni** le passa chi lo usa: la galleria offre "sposta" ed "elimina",
 * l'evento offre "togli dall'evento" ed "elimina". Il visore non sa cosa
 * significhino, sa solo disegnarle — cosi' resta uno.
 */

export type FotoVisibile = {
  id: string;
  chiave_storage: string;
  autore_id: string;
  creato_il?: string;
};

export type AzioneVisore = {
  chiave: string;
  etichetta: string;
  Icona: React.ComponentType<{ color?: string; size?: number }>;
  /** Rosso per cio' che distrugge. */
  distruttiva?: boolean;
  /** Solo l'autore: le policy lo impongono comunque (D-21), qui si evita di
   *  offrire un gesto destinato a fallire. */
  soloAutore?: boolean;
  fai: (f: FotoVisibile) => void;
};

/** Oltre questo trascinamento (o questa velocita', in punti/s) si chiude. */
const SOGLIA = 130;
const MINIATURA = 52;
/** Ingombro delle due barre: servono a **sottrarre** spazio all'immagine. */
const BARRA_ALTA = 46;
const RIGA_AZIONI = 62;

export function VisoreFoto({
  foto,
  url,
  indice,
  mioId,
  azioni = [],
  onChiudi,
}: {
  foto: FotoVisibile[];
  /** Indirizzi firmati, per chiave di storage. */
  url: Record<string, string>;
  /** Da quale partire; `null` = chiuso. */
  indice: number | null;
  mioId?: string;
  azioni?: AzioneVisore[];
  onChiudi: () => void;
}) {
  const { width: larghezza, height: altezza } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [inVista, setInVista] = React.useState(0);
  /** Quando si e' ingranditi, sfogliare e chiudere col dito vanno spenti. */
  const [ingrandito, setIngrandito] = React.useState(false);
  /**
   * Barre visibili o no: un tocco sulla foto le fa sparire e la porta a
   * riempire tutto lo schermo, un altro le riporta. E' cio' che fa Foto, ed e'
   * il motivo per cui la si guarda a schermo pieno senza doverci pensare.
   */
  const [chrome, setChrome] = React.useState(true);
  const opacitaChrome = React.useRef(new Animated.Value(1)).current;
  const pagine = React.useRef<FlatList<FotoVisibile>>(null);
  const striscia = React.useRef<FlatList<FotoVisibile>>(null);

  const aperto = indice !== null;
  const conStriscia = foto.length > 1;

  /**
   * Lo spazio che resta all'immagine, fra la barra alta e quella bassa —
   * **oppure tutto**, se le barre sono nascoste.
   */
  const altoChrome = chrome ? insets.top + BARRA_ALTA : 0;
  const bassoChrome = chrome
    ? insets.bottom + (conStriscia ? MINIATURA + 18 : 0) + (azioni.length > 0 ? RIGA_AZIONI : 0)
    : 0;
  const altezzaUtile = Math.max(120, altezza - altoChrome - bassoChrome);

  /**
   * Il passaggio a schermo pieno.
   *
   * L'opacita' delle barre e' `Animated` (col driver nativo), mentre il
   * **ridimensionamento** dell'immagine lo fa `LayoutAnimation`: animare
   * un'altezza con `Animated` obbliga a rinunciare al driver nativo e a far
   * passare ogni fotogramma dal ponte JavaScript. `LayoutAnimation` lo fa fare
   * al sistema, che e' anche cio' che rende la transizione identica a quella di
   * Foto invece che somigliante.
   */
  const alternaChrome = React.useCallback(() => {
    const prossimo = !chrome;
    LayoutAnimation.configureNext({
      duration: 240,
      update: { type: LayoutAnimation.Types.easeInEaseOut },
    });
    setChrome(prossimo);
    Animated.timing(opacitaChrome, {
      toValue: prossimo ? 1 : 0,
      duration: 170,
      useNativeDriver: true,
    }).start();
  }, [chrome, opacitaChrome]);

  /** Quanto e' sceso il dito, e quanto e' andato di lato. Sul thread della UI. */
  const giu = useSharedValue(0);
  const lato = useSharedValue(0);
  /** 1 mentre si sta trascinando: nasconde le barre e arrotonda gli angoli. */
  const inChiusura = useSharedValue(0);
  /** 0 → 1 durante la chiusura definitiva: e' cio' che ritira la carta. */
  const ritiro = useSharedValue(0);

  React.useEffect(() => {
    if (aperto) {
      setInVista(indice ?? 0);
      setIngrandito(false);
      setChrome(true);
      opacitaChrome.setValue(1);
      giu.value = 0;
      lato.value = 0;
      inChiusura.value = 0;
      ritiro.value = 0;
    }
  }, [aperto, indice, giu, lato, inChiusura, ritiro, opacitaChrome]);

  /**
   * La chiusura: la foto **rimpicciolisce e sfuma**, non scivola via.
   *
   * Riferimento: il video di Foto portato dall'utente il 2026-08-27. La'
   * l'immagine si ritira verso la sua miniatura nella griglia; qui la posizione
   * esatta della miniatura non la conosciamo, ma la parte che si legge — la
   * carta che si rimpicciolisce mentre lo sfondo riappare — si riproduce.
   * Farla uscire dal bordo inferiore, come prima, raccontava "se ne va" invece
   * di "torna al suo posto".
   */
  const chiudi = React.useCallback(() => {
    inChiusura.value = withTiming(1, { duration: 120 });
    giu.value = withTiming(altezza * 0.22, { duration: 220 });
    ritiro.value = withTiming(1, { duration: 220 }, (finita) => {
      if (finita) runOnJS(onChiudi)();
    });
  }, [giu, ritiro, inChiusura, altezza, onChiudi]);

  const pan = React.useMemo(
    () =>
      Gesture.Pan()
        // Si attiva **solo verso il basso** (oltre 12 punti) e fallisce appena
        // il dito va in orizzontale piu' di 20: cosi' sfogliare da una foto
        // all'altra resta della lista, e trascinare in giu' resta del visore.
        // A zoom > 1 il gesto e' spento del tutto: li' il trascinamento serve a
        // muoversi dentro la foto.
        .enabled(!ingrandito)
        .activeOffsetY([-10_000, 12])
        .failOffsetX([-20, 20])
        .onStart(() => {
          inChiusura.value = withTiming(1, { duration: 120 });
        })
        .onUpdate((e) => {
          if (e.translationY > 0) giu.value = e.translationY;
          // ⚠️ Segue il dito **anche di lato**. Nel video la foto si sposta in
          // diagonale mentre rimpicciolisce: senza la componente orizzontale il
          // gesto si sente "su un binario", e si nota subito.
          lato.value = e.translationX;
        })
        .onEnd((e) => {
          if (e.translationY > SOGLIA || e.velocityY > 900) {
            giu.value = withTiming(altezza * 0.22, { duration: 220 });
            ritiro.value = withTiming(1, { duration: 220 }, (finita) => {
              if (finita) runOnJS(onChiudi)();
            });
          } else {
            // Molla, non `timing`: il ritorno deve avere un peso, come quando in
            // Foto si lascia andare la foto a meta' strada.
            giu.value = withSpring(0, { damping: 22, stiffness: 260, mass: 0.7 });
            lato.value = withSpring(0, { damping: 22, stiffness: 260, mass: 0.7 });
            inChiusura.value = withTiming(0, { duration: 160 });
          }
        }),
    [ingrandito, giu, lato, ritiro, inChiusura, altezza, onChiudi]
  );

  // Mentre scende rimpicciolisce e il nero si dirada: e' cio' che fa leggere il
  // gesto come "sto rimettendo la foto al suo posto". Entrambi calcolati sul
  // thread della UI, quindi seguono il dito senza un fotogramma di ritardo.
  const stileFoglio = useAnimatedStyle(() => {
    // Due contributi alla scala: il trascinamento (fino a 0.72) e il ritiro
    // finale (fino a 0.32). Moltiplicati, non sommati, cosi' il ritiro riparte
    // da dove il dito ha lasciato invece di saltare.
    const daDito = interpolate(giu.value, [0, altezza], [1, 0.72], Extrapolation.CLAMP);
    const daRitiro = interpolate(ritiro.value, [0, 1], [1, 0.44], Extrapolation.CLAMP);
    return {
      transform: [
        { translateY: giu.value },
        { translateX: lato.value },
        { scale: daDito * daRitiro },
      ],
      // Gli angoli si arrotondano mentre rimpicciolisce: e' il dettaglio che
      // trasforma "una schermata che scivola" in "una foto che torna a essere
      // una miniatura". Nel video di riferimento e' la cosa piu' evidente.
      borderRadius: interpolate(inChiusura.value, [0, 1], [0, 28], Extrapolation.CLAMP),
      overflow: 'hidden' as const,
      opacity: interpolate(ritiro.value, [0, 1], [1, 0], Extrapolation.CLAMP),
    };
  });
  // Il nero si dirada **presto**: quello che deve comparire dietro e' la
  // schermata da cui si e' arrivati, non un fondo scuro che resta li'.
  const stileVelo = useAnimatedStyle(() => ({
    opacity: interpolate(giu.value, [0, altezza * 0.4], [1, 0], Extrapolation.CLAMP),
  }));
  // Le barre spariscono appena il gesto comincia: durante la chiusura sono
  // rumore, e in Foto infatti non ci sono.
  const stileBarre = useAnimatedStyle(() => ({
    opacity: (1 - inChiusura.value) * 1,
  }));

  const corrente = foto[inVista];
  const quando = corrente?.creato_il
    ? new Date(corrente.creato_il).toLocaleDateString(lingua, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  const vaA = (i: number) => {
    setInVista(i);
    pagine.current?.scrollToIndex({ index: i, animated: false });
  };

  // La filmstrip segue la foto aperta: senza, dopo tre scorrimenti la miniatura
  // attiva e' fuori schermo e la striscia smette di orientare.
  React.useEffect(() => {
    if (!aperto || !conStriscia) return;
    striscia.current?.scrollToIndex({ index: inVista, animated: true, viewPosition: 0.5 });
  }, [inVista, aperto, conStriscia]);

  const visibili = azioni.filter((a) => !a.soloAutore || corrente?.autore_id === mioId);

  return (
    <Modal visible={aperto} animationType="fade" statusBarTranslucent onRequestClose={chiudi}>
      <Riani.View style={[{ flex: 1, backgroundColor: '#000000' }, stileVelo]}>
        <GestureDetector gesture={pan}>
        <Riani.View style={[{ flex: 1 }, stileFoglio]}>
          <FlatList
            ref={pagine}
            data={foto}
            horizontal
            pagingEnabled
            scrollEnabled={!ingrandito}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(f) => f.id}
            initialScrollIndex={indice ?? 0}
            getItemLayout={(_, i) => ({ length: larghezza, offset: i * larghezza, index: i })}
            onMomentumScrollEnd={(e) =>
              setInVista(Math.round(e.nativeEvent.contentOffset.x / larghezza))
            }
            renderItem={({ item: f }) => (
              // Altezza esplicita: dentro una lista orizzontale la cella non
              // eredita l'altezza del contenitore.
              <View style={{ width: larghezza, height: altezza, paddingTop: altoChrome }}>
                {url[f.chiave_storage] ? (
                  <ScrollView
                    style={{ width: larghezza, height: altezzaUtile }}
                    contentContainerStyle={{
                      width: larghezza,
                      height: altezzaUtile,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    // ⚠️ Scorre **solo da ingranditi**. A zoom 1 non ha niente da
                    // scorrere, ma reclamerebbe comunque il trascinamento e lo
                    // toglierebbe al gesto di chiusura. Il pizzico resta attivo
                    // lo stesso: e' un riconoscitore a parte.
                    scrollEnabled={ingrandito}
                    // Lo zoom di sistema: su iOS e' esattamente quello di Foto.
                    maximumZoomScale={4}
                    minimumZoomScale={1}
                    bouncesZoom
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    scrollEventThrottle={16}
                    onScroll={(e) => {
                      const z = e.nativeEvent.zoomScale ?? 1;
                      setIngrandito(z > 1.02);
                    }}
                  >
                    {/* Il tocco alterna schermo pieno e barre. Sta qui dentro,
                        sopra l'immagine, cosi' non ruba niente allo zoom: un
                        `Pressable` reagisce al tocco *finito*, la ScrollView ai
                        movimenti — non si contendono lo stesso gesto. */}
                    <Pressable onPress={alternaChrome} accessibilityRole="imagebutton">
                      <Image
                        source={{ uri: url[f.chiave_storage] }}
                        style={{ width: larghezza, height: altezzaUtile }}
                        // `contain`: una foto verticale non si taglia per riempire.
                        resizeMode="contain"
                      />
                    </Pressable>
                  </ScrollView>
                ) : (
                  <View
                    style={{
                      width: larghezza,
                      height: altezzaUtile,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ActivityIndicator color="#ffffff" />
                  </View>
                )}
              </View>
            )}
          />
        </Riani.View>
        </GestureDetector>

        {/* --- barra in alto: contatore, data, chiusura ------------------- */}
        {/* ⚠️ Il contenitore delle barre deve riempire lo schermo
            (`absoluteFill`): le due barre dentro sono posizionate in assoluto, e
            un genitore senza dimensioni le avrebbe schiacciate nell'angolo in
            alto a sinistra invece di lasciarle dove stanno. */}
        <Riani.View
          pointerEvents="box-none"
          style={[StyleSheet.absoluteFill, stileBarre]}
        >
        <Animated.View
          pointerEvents={chrome ? 'box-none' : 'none'}
          style={{
            opacity: opacitaChrome,
            position: 'absolute',
            left: 0,
            right: 0,
            top: insets.top,
            height: BARRA_ALTA,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 14,
          }}
        >
          <View style={{ width: 90 }}>
            {conStriscia && (
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' }}>
                {inVista + 1} / {foto.length}
              </Text>
            )}
          </View>
          {!!quando && (
            <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '600' }}>{quando}</Text>
          )}
          <View style={{ width: 90, alignItems: 'flex-end' }}>
            <Tondo onPress={chiudi} etichetta="Chiudi">
              <X color="#ffffff" size={22} />
            </Tondo>
          </View>
        </Animated.View>

        {/* --- in basso: filmstrip e azioni ------------------------------- */}
        <Animated.View
          pointerEvents={chrome ? 'box-none' : 'none'}
          style={{
            opacity: opacitaChrome,
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingBottom: insets.bottom,
          }}
        >
          {conStriscia && (
            // ⚠️ Altezza dichiarata: una lista orizzontale dentro una colonna
            // che non la dichiara si prende spazio che non le spetta.
            <FlatList
              ref={striscia}
              data={foto}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(f) => `mini-${f.id}`}
              style={{ height: MINIATURA + 18, flexGrow: 0 }}
              contentContainerStyle={{ paddingHorizontal: 14, gap: 6, alignItems: 'center' }}
              getItemLayout={(_, i) => ({
                length: MINIATURA + 6,
                offset: i * (MINIATURA + 6),
                index: i,
              })}
              onScrollToIndexFailed={() => {}}
              renderItem={({ item: f, index: i }) => (
                <Pressable onPress={() => vaA(i)}>
                  <View
                    style={{
                      width: MINIATURA,
                      height: MINIATURA,
                      borderRadius: 9,
                      overflow: 'hidden',
                      borderWidth: i === inVista ? 2.5 : 0,
                      borderColor: '#ffffff',
                      opacity: i === inVista ? 1 : 0.5,
                    }}
                  >
                    {url[f.chiave_storage] && (
                      <Image
                        source={{ uri: url[f.chiave_storage] }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    )}
                  </View>
                </Pressable>
              )}
            />
          )}

          {visibili.length > 0 && (
            <View
              style={{
                height: RIGA_AZIONI,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 26,
              }}
            >
              {visibili.map((a) => (
                <Tondo
                  key={a.chiave}
                  etichetta={a.etichetta}
                  onPress={() => corrente && a.fai(corrente)}
                >
                  <a.Icona color={a.distruttiva ? '#ff6b6b' : '#ffffff'} size={22} />
                </Tondo>
              ))}
            </View>
          )}
        </Animated.View>
        </Riani.View>
      </Riani.View>
    </Modal>
  );
}

/**
 * Bottone tondo scuro: su una foto chiara un tondo chiaro sparisce.
 *
 * ⚠️ Il tondo e' una **`View` con stile-oggetto**, e il `Pressable` ci sta
 * dentro **senza stile**. Al primo giro era il contrario — `Pressable` con
 * stile-funzione — e in questo progetto quello stile non viene applicato:
 * restava l'icona nuda, senza cerchio e senza area da premere. E' il difetto
 * che l'utente ha descritto come "i pulsanti sono troppo piccoli e non si
 * riescono a premere".
 */
function Tondo({
  children,
  onPress,
  etichetta,
}: {
  children?: React.ReactNode;
  onPress?: () => void;
  etichetta?: string;
}) {
  const [premuto, setPremuto] = React.useState(false);
  return (
    <View
      style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.16)',
        opacity: premuto ? 0.6 : 1,
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => setPremuto(true)}
        onPressOut={() => setPremuto(false)}
        accessibilityRole="button"
        accessibilityLabel={etichetta}
        hitSlop={12}
      >
        <View style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
          {children}
        </View>
      </Pressable>
    </View>
  );
}

/** Android non ha lo zoom della ScrollView: la` si resta a zoom 1. Dichiarato. */
export const ZOOM_DISPONIBILE = Platform.OS === 'ios';
