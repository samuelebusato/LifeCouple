import { View, Pressable } from 'react-native';
import { CalendarCheck, Heart, Palmtree, Sparkles } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { Evento } from '@/lib/eventi';
import { lingua, t } from '@/lib/i18n';

/** Colore e icona dicono il tipo prima di leggere: il calendario si scorre, non si studia. */
export const aspetto = (e: Evento) => {
  if (e.speciale) return { Icona: Sparkles, colore: '#bf5333' };
  if (e.tipo === 'romantico') return { Icona: Heart, colore: '#bf5333' };
  if (e.tipo === 'vacanza') return { Icona: Palmtree, colore: '#4f7a5f' };
  return { Icona: CalendarCheck, colore: '#8a7563' };
};

function quando(e: Evento) {
  const da = new Date(e.inizio);
  const f = (d: Date) => d.toLocaleDateString(lingua, { day: 'numeric', month: 'short' });
  if (e.tipo === 'vacanza' && e.fine) return `${f(da)} → ${f(new Date(e.fine))}`;
  if (e.tutto_il_giorno) return t.calendario.tuttoIlGiorno;
  return da.toLocaleTimeString(lingua, { hour: '2-digit', minute: '2-digit' });
}

export function RigaEvento({
  e,
  mio,
  onElimina,
  onPress,
  contatore,
}: {
  e: Evento;
  mio: boolean;
  onElimina?: () => void;
  /** Toccare la riga apre l'evento: e' da li' che si modifica. */
  onPress?: () => void;
  /** "fra 4 giorni", "2 giorni fa": usato dalla vista dei soli eventi. */
  contatore?: string;
}) {
  const { Icona, colore } = aspetto(e);
  const Contenitore: any = onPress ? Pressable : View;
  return (
    <Contenitore
      onPress={onPress}
      className="w-full flex-row gap-3 rounded-2xl bg-card p-4"
    >
      <View className="pt-1">
        <Icona color={colore} size={22} />
      </View>
      <View className="flex-1 gap-1">
        <View className="flex-row items-center justify-between">
          <Text className={cn('text-xs uppercase tracking-wide')} style={{ color: colore }}>
            {quando(e)}
          </Text>
          {!!contatore && (
            <Text className="text-xs text-muted-foreground">{contatore}</Text>
          )}
        </View>
        <Text className="font-serif text-xl text-foreground">{e.titolo}</Text>
        {!!e.nota && <Text className="text-base text-muted-foreground">{e.nota}</Text>}
        {/* Da quale calendario e' arrivato: senza, venti compleanni importati
            sono venti impegni indistinguibili (0007). */}
        {!!e.categoria && (
          <Text className="text-xs uppercase tracking-wide text-muted-foreground">
            {e.categoria}
          </Text>
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
    </Contenitore>
  );
}
