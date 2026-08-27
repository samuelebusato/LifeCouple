import * as React from 'react';
import { View, Pressable, Image, Animated, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight, MapPin, MoreHorizontal, X } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { CartaVetro } from '@/components/ui/vetro';
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
  const salita = React.useRef(new Animated.Value(0)).current;

  // La carta cambia contenuto quando si tocca un altro pin: l'indice torna a
  // zero, altrimenti si aprirebbe sul terzo evento di un posto che ne ha uno.
  const chiave = eventi.map((e) => e.id).join(',') + titoloLuogo;
  React.useEffect(() => {
    setI(0);
    salita.setValue(0);
    Animated.spring(salita, {
      toValue: 1,
      useNativeDriver: true,
      damping: 18,
      stiffness: 200,
    }).start();
  }, [chiave, salita]);

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
    <Animated.View
      style={[
        {
          opacity: salita,
          transform: [
            { translateY: salita.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
          ],
        },
        style,
      ]}
    >
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

          <View style={{ alignItems: 'center', gap: 6 }}>
            <Pressable onPress={onChiudi} hitSlop={10} accessibilityLabel={t.calendario.chiudi}>
              <X color={c.tenue} size={18} />
            </Pressable>
            {!!onDettagli && (
              <Pressable onPress={onDettagli} hitSlop={10} accessibilityLabel={t.mappa.azioniPosto}>
                <MoreHorizontal color={c.tenue} size={18} />
              </Pressable>
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
            <Pressable
              onPress={() => setI((x) => (x - 1 + eventi.length) % eventi.length)}
              hitSlop={10}
            >
              <ChevronLeft color={c.accento} size={20} />
            </Pressable>
            <Text style={{ fontSize: 12, color: c.tenue }}>
              {i + 1} / {eventi.length}
            </Text>
            <Pressable onPress={() => setI((x) => (x + 1) % eventi.length)} hitSlop={10}>
              <ChevronRight color={c.accento} size={20} />
            </Pressable>
          </View>
        )}
      </CartaVetro>
    </Animated.View>
  );
}
