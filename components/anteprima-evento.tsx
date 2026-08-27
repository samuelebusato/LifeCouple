import * as React from 'react';
import { View, Pressable, Image, StyleSheet } from 'react-native';
import Riani, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { ChevronLeft, ChevronRight, MapPin, MoreHorizontal, X } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { CartaVetro } from '@/components/ui/vetro';
import { Premibile } from '@/components/ui/premibile';
import { molla, durata } from '@/lib/movimento';
import { aspetto } from '@/components/riga-evento';
import type { Evento } from '@/lib/eventi';
import { useTema } from '@/lib/tema';
import { lingua, t } from '@/lib/i18n';

/**
 * L'**anteprima di un evento in sovraimpressione**: la carta che compare sulla
 * mappa quando si tocca un pin (chiesta dall'utente il 2026-08-27).
 *
 * Prende il posto del foglio a tutta larghezza che si apriva prima. Perche' il
 * cambio conta: un foglio modale **copre la mappa**, cioe' toglie il contesto
 * proprio nel momento in cui il contesto e' il motivo per cui si sta guardando
 * la mappa. Una carta che galleggia sopra lascia vedere dove si trova quel
 * posto rispetto agli altri, e da li' si decide se aprirlo davvero.
 *
 * Un posto puo' avere **piu' eventi**: le frecce scorrono fra loro senza
 * chiudere niente, e il contatore dice quanti sono. Aprire un foglio per
 * scoprire che gli eventi erano tre era un passaggio in piu' per
 * un'informazione che sta in sei caratteri.
 *
 * ⚠️ **Non e' un `Modal`.** Un modale su iOS prende tutto lo schermo e blocca i
 * gesti della mappa sotto: la carta e' una vista assoluta, e la mappa continua
 * a rispondere al dito attorno a lei.
 *
 * ## Chi anima cosa (2026-08-27)
 *
 * **L'entrata e l'uscita non sono piu' qui**: le possiede `Comparsa`, in
 * `components/ui/comparsa.tsx`, che e' anche l'unica in grado di ritardare lo
 * smontaggio — cosa che questo componente, che sparisce insieme al suo stato,
 * non puo' fare da solo. Prima l'entrata era qui e l'uscita non esisteva
 * affatto: la carta arrivava con una molla e se ne andava tagliata.
 *
 * Quello che resta qui e' l'unico movimento che **solo questo componente** puo'
 * conoscere: il **guizzo al cambio di contenuto**. Succede due volte — toccando
 * un altro pin mentre la carta e' gia' aperta, e scorrendo fra piu' serate
 * dello stesso posto con le frecce. In entrambi i casi la carta resta dov'e' e
 * cambia solo cio' che dice: senza un segnale, il testo si sostituisce e
 * basta, e a colpo d'occhio non si distingue da un testo che non e' cambiato —
 * che sulle frecce vuol dire non sapere se il tocco e' arrivato.
 *
 * ⚠️ **Non al primo render.** Se il guizzo partisse anche alla comparsa, si
 * sommerebbe all'entrata di `Comparsa` e la carta arriverebbe con due
 * movimenti sovrapposti — che non si legge come piu' ricco, si legge come
 * sfasato.
 */
export function AnteprimaEvento({
  titoloLuogo,
  eventi,
  copertine,
  onApri,
  onDettagli,
  onChiudi,
  style,
}: {
  /** Il nome del posto o del ristorante toccato. */
  titoloLuogo: string;
  /** Gli eventi di quel posto. Vuoto = il posto non ne ha ancora. */
  eventi: Evento[];
  /** Indirizzi firmati delle copertine, per id evento. */
  copertine: Record<string, string>;
  onApri: (e: Evento) => void;
  /** Le azioni sul posto (visitato, elimina): restano dietro un tocco. */
  onDettagli?: () => void;
  onChiudi: () => void;
  style?: object;
}) {
  const { c } = useTema();
  const [i, setI] = React.useState(0);

  // La carta cambia contenuto quando si tocca un altro pin: l'indice torna a
  // zero, altrimenti si aprirebbe sul terzo evento di un posto che ne ha uno.
  const chiave = eventi.map((e) => e.id).join(',') + titoloLuogo;
  React.useEffect(() => {
    setI(0);
  }, [chiave]);

  /** Il guizzo: 1 = a riposo, sotto 1 = sta cambiando. */
  const guizzo = useSharedValue(1);
  /** Il primo giro non guizza: li' l'entrata la fa `Comparsa`. */
  const primo = React.useRef(true);
  React.useEffect(() => {
    if (primo.current) {
      primo.current = false;
      return;
    }
    // Prima si sgonfia in fretta, poi torna con una molla: e' il verso giusto —
    // il vecchio contenuto se ne va, il nuovo arriva. Al contrario sembrerebbe
    // un rimbalzo senza causa.
    guizzo.value = withSequence(
      withTiming(0, { duration: durata.lampo }),
      withSpring(1, molla.entrata)
    );
  }, [chiave, i, guizzo]);

  const stileGuizzo = useAnimatedStyle(() => ({
    opacity: 0.35 + 0.65 * guizzo.value,
    transform: [{ scale: 0.97 + 0.03 * guizzo.value }],
  }));

  const e = eventi[i];
  const copertina = e ? copertine[e.id] : undefined;
  const pastello = e ? aspetto(e).pastello : null;

  const quando = e
    ? (() => {
        const da = new Date(e.inizio);
        const g = da.toLocaleDateString(lingua, { weekday: 'short', day: 'numeric', month: 'short' });
        if (e.fine)
          return `${g} → ${new Date(e.fine).toLocaleDateString(lingua, { day: 'numeric', month: 'short' })}`;
        if (e.tutto_il_giorno) return `${g} · ${t.calendario.tuttoIlGiorno}`;
        return `${g} · ${da.toLocaleTimeString(lingua, { hour: '2-digit', minute: '2-digit' })}`;
      })()
    : null;

  return (
    <Riani.View style={[stileGuizzo, style]}>
      <CartaVetro raggio={26}>
        <Pressable
          disabled={!e}
          onPress={() => e && onApri(e)}
          style={{ flexDirection: 'row', gap: 12, padding: 12, alignItems: 'center' }}
        >
          {/* La miniatura: la foto dell'evento se c'e', altrimenti un riquadro
              col colore del tipo — che e' comunque un'informazione, non un
              segnaposto grigio. */}
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              overflow: 'hidden',
              backgroundColor: pastello?.fondo ?? c.alone,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {copertina ? (
              <Image
                source={{ uri: copertina }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <MapPin color={pastello?.barra ?? c.accento} size={22} />
            )}
          </View>

          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text numberOfLines={1} style={{ fontSize: 11, color: c.tenue }}>
              {titoloLuogo}
            </Text>
            <Text numberOfLines={1} className="font-serif text-lg text-foreground">
              {e ? e.titolo : t.mappa.nessunEvento}
            </Text>
            {!!quando && (
              <Text numberOfLines={1} style={{ fontSize: 12, color: c.tenue }}>
                {quando}
              </Text>
            )}
          </View>

          {/* ⚠️ Icone nude di 18 punti dentro una carta che si tocca tutta:
              senza un cedimento sotto il dito, l'unico modo per sapere di aver
              preso la "x" e non la carta era il fatto che qualcosa fosse
              successo — cioe' dopo. Qui la scala e' generosa (0.82) proprio
              perche' l'oggetto e' minuscolo. */}
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Premibile
              onPress={onChiudi}
              hitSlop={10}
              scala={0.82}
              accessibilityLabel={t.calendario.chiudi}
            >
              <X color={c.tenue} size={18} />
            </Premibile>
            {!!onDettagli && (
              <Premibile
                onPress={onDettagli}
                hitSlop={10}
                scala={0.82}
                accessibilityLabel={t.mappa.azioniPosto}
              >
                <MoreHorizontal color={c.tenue} size={18} />
              </Premibile>
            )}
          </View>
        </Pressable>

        {/* --- piu' eventi nello stesso posto ---------------------------- */}
        {eventi.length > 1 && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 14,
              paddingBottom: 10,
              paddingTop: 2,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: 'rgba(129,110,123,0.18)',
            }}
          >
            {/* Le frecce cambiano il contenuto **restando ferme**: il tatto
                "scelta" e il guizzo della carta sono, insieme, tutto cio' che
                dice che il tocco e' arrivato. */}
            <Premibile
              onPress={() => setI((x) => (x - 1 + eventi.length) % eventi.length)}
              hitSlop={10}
              scala={0.82}
              aptico="scelta"
            >
              <ChevronLeft color={c.accento} size={20} />
            </Premibile>
            <Text style={{ fontSize: 12, color: c.tenue }}>
              {i + 1} / {eventi.length}
            </Text>
            <Premibile
              onPress={() => setI((x) => (x + 1) % eventi.length)}
              hitSlop={10}
              scala={0.82}
              aptico="scelta"
            >
              <ChevronRight color={c.accento} size={20} />
            </Premibile>
          </View>
        )}
      </CartaVetro>
    </Riani.View>
  );
}
