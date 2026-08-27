import { View, Pressable, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CalendarCheck, Clock, Heart, MapPin, Palmtree, Sparkles, Tag } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { CartaVetro } from '@/components/ui/vetro';
import { cn } from '@/lib/utils';
import type { Evento } from '@/lib/eventi';
import { C, pastelli, useTema } from '@/lib/tema';
import { lingua, t } from '@/lib/i18n';

/**
 * Colore, icona e **pastello** di un evento: il tipo si riconosce prima di
 * leggere, perche' il calendario si scorre, non si studia.
 *
 * Una funzione sola, senza hook, e senza il parametro `scuro` (D-39: la
 * modalita' e' una). Il pastello serve alle pillole della griglia del mese e
 * alle carte dell'agenda: fondo tenue + testo scuro + barretta satura, dalla
 * tabella in `lib/tema.ts`.
 */
export const aspetto = (e: Evento) => {
  if (e.speciale) return { Icona: Sparkles, colore: C.accento, pastello: pastelli.speciale };
  if (e.tipo === 'romantico') return { Icona: Heart, colore: C.accento, pastello: pastelli.romantico };
  if (e.tipo === 'vacanza') return { Icona: Palmtree, colore: '#4f7a5f', pastello: pastelli.vacanza };
  return { Icona: CalendarCheck, colore: C.tenue, pastello: pastelli.impegno };
};

/** Alias storico: c'erano due funzioni identiche, una con hook e una senza. */
export const useAspetto = aspetto;

function quando(e: Evento) {
  const da = new Date(e.inizio);
  const f = (d: Date) => d.toLocaleDateString(lingua, { day: 'numeric', month: 'short' });
  if (e.tipo === 'vacanza' && e.fine) return `${f(da)} → ${f(new Date(e.fine))}`;
  if (e.tutto_il_giorno) return t.calendario.tuttoIlGiorno;
  return da.toLocaleTimeString(lingua, { hour: '2-digit', minute: '2-digit' });
}

/**
 * La scheda di un evento, in **due forme**.
 *
 * * **Con foto**: immagine grande in testa, a tutta larghezza, con il titolo
 *   scritto sopra su una velatura scura. E' la forma dello screenshot chiesto
 *   dall'utente, ed e' giusta perche' quando una foto c'e' e' lei a dire di
 *   cosa si trattava — molto meglio di qualunque icona.
 * * **Senza foto**: riga compatta. *Perche' non la stessa forma per tutti*: la
 *   maggioranza degli eventi non ha foto (i compleanni importati, gli impegni),
 *   e dare a ciascuno 180 punti di altezza trasformerebbe un mese di calendario
 *   in un rotolo da scorrere per minuti. Una scheda grande **vuota** non e'
 *   piu' bella: e' solo piu' grande.
 */
export function RigaEvento({
  e,
  mio,
  onElimina,
  onPress,
  contatore,
  anteprima,
}: {
  e: Evento;
  mio: boolean;
  onElimina?: () => void;
  /** Toccare la riga apre l'evento: e' da li' che si modifica. */
  onPress?: () => void;
  /** "fra 4 giorni", "2 giorni fa": usato dalla vista dei soli eventi. */
  contatore?: string;
  /** Indirizzo firmato della prima foto dell'evento, se ne ha una. */
  anteprima?: string;
}) {
  const { Icona, colore } = useAspetto(e);
  const { c } = useTema();
  const Contenitore: any = onPress ? Pressable : View;

  // ---------------------------------------------------------------- con foto
  if (anteprima) {
    return (
      <Contenitore onPress={onPress} className="w-full">
        <CartaVetro raggio={26}>
          <View className="overflow-hidden" style={{ borderRadius: 26 }}>
            <View style={{ height: 190, width: '100%' }}>
              <Image
                source={{ uri: anteprima }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
              {/* La velatura serve al testo, non alla foto: senza, un titolo
                  chiaro su un cielo chiaro non si legge. Parte da meta' altezza
                  cosi' la foto resta foto nella parte alta. */}
              <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(20,6,12,0.78)']}
                locations={[0.35, 1]}
                style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 0 }}
              />
              <View className="absolute inset-x-0 bottom-0 gap-1 p-4">
                <View className="flex-row items-center gap-1.5">
                  <Icona color="#ffffff" size={13} />
                  <Text
                    className="text-xs uppercase tracking-wide"
                    style={{ color: 'rgba(255,255,255,0.92)' }}
                  >
                    {quando(e)}
                  </Text>
                  {!!contatore && (
                    <Text className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      · {contatore}
                    </Text>
                  )}
                </View>
                <Text className="font-serif-bold text-2xl" style={{ color: '#ffffff' }}>
                  {e.titolo}
                </Text>
              </View>
            </View>

            <View className="gap-2 p-4">
              {!!e.nota && <Text className="text-base text-muted-foreground">{e.nota}</Text>}
              <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1">
                {!!e.categoria && (
                  <View className="flex-row items-center gap-1.5">
                    <Tag color={c.tenue} size={13} />
                    <Text className="text-xs text-muted-foreground">{e.categoria}</Text>
                  </View>
                )}
                <View className="flex-row items-center gap-1.5">
                  <Clock color={c.tenue} size={13} />
                  <Text className="text-xs text-muted-foreground">
                    {mio ? t.calendario.daTe : t.calendario.dalPartner}
                  </Text>
                </View>
              </View>
              {mio && onElimina && (
                <Pressable onPress={onElimina} hitSlop={8} className="pt-1">
                  <Text className="text-xs text-destructive">{t.calendario.elimina}</Text>
                </Pressable>
              )}
            </View>
          </View>
        </CartaVetro>
      </Contenitore>
    );
  }

  // -------------------------------------------------------------- senza foto
  return (
    <Contenitore onPress={onPress} className="w-full">
      <CartaVetro raggio={22}>
        <View className="flex-row gap-3 p-4">
          <View
            className="h-11 w-11 items-center justify-center rounded-2xl"
            style={{ backgroundColor: c.alone }}
          >
            <Icona color={colore} size={20} />
          </View>
          <View className="flex-1 gap-1">
            <View className="flex-row items-center justify-between">
              <Text className={cn('text-xs uppercase tracking-wide')} style={{ color: colore }}>
                {quando(e)}
              </Text>
              {!!contatore && <Text className="text-xs text-muted-foreground">{contatore}</Text>}
            </View>
            <Text className="font-serif text-xl text-foreground">{e.titolo}</Text>
            {!!e.nota && <Text className="text-base text-muted-foreground">{e.nota}</Text>}
            {/* Da quale calendario e' arrivato: senza, venti compleanni importati
                sono venti impegni indistinguibili (0007). */}
            {!!e.categoria && (
              <View className="flex-row items-center gap-1.5 pt-0.5">
                <Tag color={c.tenue} size={12} />
                <Text className="text-xs text-muted-foreground">{e.categoria}</Text>
              </View>
            )}
            <View className="flex-row items-center justify-between pt-1">
              <Text className="text-xs text-muted-foreground">
                {mio ? t.calendario.daTe : t.calendario.dalPartner}
              </Text>
              {/* Solo l'autore cancella (D-21): la policy lo impone comunque, qui
                  si evita di offrire un gesto che finirebbe in errore. */}
              {mio && onElimina && (
                <Pressable onPress={onElimina} hitSlop={8}>
                  <Text className="text-xs text-destructive">{t.calendario.elimina}</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </CartaVetro>
    </Contenitore>
  );
}

/** Riga con luogo, usata dove serve mostrare il posto insieme all'evento. */
export function RigaLuogo({ nome }: { nome: string }) {
  const { c } = useTema();
  return (
    <View className="flex-row items-center gap-1.5">
      <MapPin color={c.tenue} size={13} />
      <Text className="text-xs text-muted-foreground">{nome}</Text>
    </View>
  );
}
