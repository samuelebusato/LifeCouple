import * as React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
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
 */
export function TestataCalendario({
  titolo,
  capitalizza = true,
  onIndietro,
  onAvanti,
  onTitolo,
  sinistra,
  destra,
  children,
}: {
  titolo: string;
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
              <Pressable onPress={onIndietro} hitSlop={10}>
                <ChevronLeft color={SU_TESTATA_TENUE} size={22} />
              </Pressable>
            )}
            <Pressable
              onPress={onTitolo}
              hitSlop={8}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
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
            </Pressable>
            {onAvanti && (
              <Pressable onPress={onAvanti} hitSlop={10}>
                <ChevronRight color={SU_TESTATA_TENUE} size={22} />
              </Pressable>
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
  const [premuto, setPremuto] = React.useState(false);
  return (
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
        opacity: premuto ? 0.6 : 1,
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => setPremuto(true)}
        onPressOut={() => setPremuto(false)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={attivo ? { selected: true } : {}}
        hitSlop={10}
      >
        <View style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }}>
          {children}
        </View>
      </Pressable>
    </View>
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
