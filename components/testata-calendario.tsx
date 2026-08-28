import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Riani, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Premibile } from '@/components/ui/premibile';
import { molla, durata } from '@/lib/movimento';
import { FONDO_TESTATA, SU_TESTATA, SU_TESTATA_TENUE } from '@/lib/tema';

/**
 * La **testata del calendario**: un blocco sfumato che si arrotonda sul bianco
 * del contenuto (riferimento: lo shot Exyte portato dall'utente il 2026-08-27).
 *
 * Cosa fa che la vecchia intestazione non faceva: da' al mese un *posto*.
 * Prima titolo, frecce, selettore di vista e iniziali dei giorni erano quattro
 * righe che galleggiavano sullo stesso bianco del contenuto, e la griglia
 * cominciava senza che niente dicesse dove. Il blocco colorato e' il bordo
 * superiore della griglia: sotto di lui comincia il calendario, sopra di lui
 * ci sono i comandi.
 *
 * Gli angoli inferiori arrotondati non sono un vezzo — sono cio' che impedisce
 * al blocco di leggersi come "un'altra schermata attaccata in alto".
 *
 * I bottoni tondi (sinistra/destra) li passa chi la usa: la testata non sa
 * cosa vogliano dire, sa solo dove vanno.
 *
 * ## Il titolo **arriva dal lato giusto** (2026-08-27)
 *
 * Cambiando periodo, il contenuto sotto scivola gia' — quello lo fa la
 * schermata — mentre il titolo si sostituiva sul posto: due elementi che
 * raccontano lo stesso movimento, uno in movimento e uno fermo. Ora il titolo
 * esce dalla parte da cui stai andando ed entra dall'altra, come il contenuto.
 *
 * ⚠️ **L'animazione e' legata alla stringa, non al gesto.** Scorrendo un giorno
 * per volta nella vista agenda il titolo dice l'intervallo della *settimana*,
 * che per sei giorni su sette **non cambia**: se il movimento seguisse il gesto,
 * il titolo si agiterebbe per non dire niente di nuovo. Reagendo al testo, si
 * muove solo quando c'e' davvero qualcosa di diverso da leggere.
 */
export function TestataCalendario({
  titolo,
  capitalizza = true,
  verso = 0,
  onIndietro,
  onAvanti,
  onTitolo,
  sinistra,
  destra,
  children,
}: {
  titolo: string;
  /** Da che parte si sta andando: 1 avanti, -1 indietro, 0 salto secco. */
  verso?: number;
  /**
   * `capitalize` su un titolo di piu' parole maiuscola **ogni** parola: "agosto
   * 2026" diventa giustamente "Agosto 2026", ma "tutti gli eventi" diventava
   * "Tutti Gli Eventi", che in italiano non si scrive. Serve sui nomi di mese,
   * non sulle frasi.
   */
  capitalizza?: boolean;
  /** Se mancano, le frecce non compaiono (la vista "eventi" non ha periodi). */
  onIndietro?: () => void;
  onAvanti?: () => void;
  /** Toccare il titolo: torna a oggi. Il chevron lo suggerisce. */
  onTitolo?: () => void;
  sinistra?: React.ReactNode;
  destra?: React.ReactNode;
  /** Cio' che sta in fondo al blocco: iniziali dei giorni, o striscia dei giorni. */
  children?: React.ReactNode;
}) {
  /** 1 = fermo al suo posto. Sotto 1: sta cambiando. */
  const cambio = useSharedValue(1);
  /**
   * Il verso **al momento del cambio**: -1 indietro, +1 avanti, 0 nessuna
   * direzione (il «torna a oggi», o un cambio di vista).
   *
   * ⚠️ **Un `useSharedValue`, non un `React.useRef`** — ed è la correzione di
   * B-17. Questo valore viene scritto sul thread JS (nell'effetto qui sotto) e
   * **letto dentro un worklet** (`stileTitolo`). Reanimated, quando un worklet
   * cattura un oggetto normale, ne serializza una copia: il worklet leggeva
   * quindi una `direzione` che non era quella che l'effetto aggiornava, e
   * poteva essere **vecchia**. Conseguenza visibile: il titolo che entra dal
   * lato sbagliato — cioè proprio la funzione per cui questo valore esiste.
   *
   * 🔑 Il commento che stava qui diceva *«letto qui, non nello stile animato»*,
   * che è la descrizione corretta di ciò che il codice **doveva** fare, scritta
   * accanto al codice che faceva l'opposto. Una rilettura si ferma davanti a
   * una spiegazione plausibile: **il commento faceva da scudo all'errore.** È
   * la stessa forma del difetto chiuso da D-60 in `cerca-luogo.tsx`.
   *
   * Un valore condiviso è fatto per essere letto e scritto dai due lati: il
   * worklet ne vede sempre il valore corrente, e l'avviso
   * «Tried to modify key `current` of an object which has been already passed
   * to a worklet» sparisce insieme alla causa.
   */
  const direzione = useSharedValue(0);
  const primo = React.useRef(true);

  React.useEffect(() => {
    if (primo.current) {
      primo.current = false;
      return;
    }
    direzione.value = verso;
    cambio.value = withSequence(
      withTiming(0, { duration: durata.lampo }),
      withSpring(1, molla.entrata)
    );
    // Volutamente **senza `verso`** fra le dipendenze: il verso e' un contorno
    // del cambio, non una sua causa. Con lui, cambiare direzione senza cambiare
    // titolo farebbe ripartire l'animazione a vuoto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titolo, cambio]);

  const stileTitolo = useAnimatedStyle(() => ({
    opacity: cambio.value,
    transform: [
      // Esce verso il lato da cui si viene e rientra al centro. A verso 0 —
      // "torna a oggi", cambio di vista — resta una dissolvenza sul posto:
      // non c'e' nessuna direzione da raccontare.
      { translateX: (1 - cambio.value) * 22 * direzione.value },
    ],
  }));

  return (
    <LinearGradient
      colors={FONDO_TESTATA}
      locations={[0, 0.55, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        // Angoli piu' ampi e aria dentro: la prima versione era **angusta** —
        // titolo, selettore e iniziali dei giorni si toccavano, e il gradiente
        // finiva addosso alla griglia. Un blocco che deve leggersi come "qui
        // stanno i comandi" ha bisogno di margine attorno, o si legge come una
        // barra compressa.
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
        overflow: 'hidden',
      }}
    >
      <SafeAreaView edges={['top']}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 12,
            paddingTop: 10,
            paddingBottom: 6,
            gap: 8,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 76 }}>
            {sinistra}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, flexShrink: 1 }}>
            {onIndietro && (
              <Premibile onPress={onIndietro} hitSlop={10} scala={0.8} aptico="scelta">
                <ChevronLeft color={SU_TESTATA_TENUE} size={22} />
              </Premibile>
            )}
            <Premibile
              onPress={onTitolo}
              hitSlop={8}
              scala={0.94}
              style={{ flexShrink: 1 }}
            >
              <Riani.View
                style={[{ flexDirection: 'row', alignItems: 'center', gap: 2 }, stileTitolo]}
              >
                <Text
                  numberOfLines={1}
                  className="font-serif-bold"
                  style={{
                    fontSize: 22,
                    color: SU_TESTATA,
                    textTransform: capitalizza ? 'capitalize' : 'none',
                  }}
                >
                  {titolo}
                </Text>
                {!!onTitolo && <ChevronDown color={SU_TESTATA_TENUE} size={16} />}
              </Riani.View>
            </Premibile>
            {onAvanti && (
              <Premibile onPress={onAvanti} hitSlop={10} scala={0.8} aptico="scelta">
                <ChevronRight color={SU_TESTATA_TENUE} size={22} />
              </Premibile>
            )}
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              minWidth: 76,
              justifyContent: 'flex-end',
            }}
          >
            {destra}
          </View>
        </View>

        {children}
        {/* Aria in fondo al blocco.
            Nelle viste "Eventi" e "Anno" non ci sono ne' iniziali dei giorni ne'
            striscia, quindi il gradiente finiva **a filo del selettore** e il
            blocco sembrava tagliato. Con i figli presenti sono 6 punti in piu';
            senza, sono i 18 che gli danno un fondo. */}
        <View style={{ height: children ? 6 : 18 }} />
      </SafeAreaView>
    </LinearGradient>
  );
}

/**
 * Un bottone tondo **sulla testata**: vetro chiaro appena accennato, come i
 * tondini dello shot di riferimento. Non usa `TondoVetro` di proposito —
 * quello porta ombra e velatura rosa, che sopra una superficie gia' colorata
 * si impastano invece di staccare.
 *
 * ⚠️ Il cerchio sta su una **`View` con stile-oggetto**, non sul `Pressable`.
 * Con lo stile-funzione il tondo semplicemente **non compariva**: negli
 * screenshot del 2026-08-27 il "27" e l'icona di importazione erano glifi nudi
 * sulla sfumatura. E' lo stesso difetto che ha tenuto storta la barra in basso
 * per tre stesure — vedi `components/barra-volante.tsx`.
 *
 * Il riscontro del tocco era un'opacita' fatta a mano con uno stato locale;
 * ora e' `Premibile`, come ogni altro comando dell'app. Non e' pulizia fine a
 * se stessa: due comandi che cedono in modo diverso a un centimetro di distanza
 * si notano, e questo sta accanto al selettore delle viste.
 */
export function TondoTestata({
  children,
  onPress,
  attivo = false,
  accessibilityLabel,
}: {
  children?: React.ReactNode;
  onPress?: () => void;
  attivo?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <Premibile onPress={onPress} hitSlop={10} scala={0.86} accessibilityLabel={accessibilityLabel}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: attivo ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.30)',
          borderWidth: StyleSheet.hairlineWidth * 2,
          borderColor: 'rgba(255,255,255,0.55)',
        }}
      >
        {children}
      </View>
    </Premibile>
  );
}

/** Le iniziali dei sette giorni, in fondo alla testata. */
export function InizialiGiorni({ etichette }: { etichette: string[] }) {
  return (
    <View style={{ flexDirection: 'row', paddingHorizontal: 4, paddingBottom: 14, paddingTop: 10 }}>
      {etichette.map((g) => (
        <Text
          key={g}
          style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 11,
            fontWeight: '600',
            textTransform: 'capitalize',
            color: SU_TESTATA_TENUE,
          }}
        >
          {g}
        </Text>
      ))}
    </View>
  );
}
