import * as React from 'react';
import { View, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';

/**
 * **Un selettore di data, e basta.** Non sa cosa sta scegliendo né dove finirà:
 * chi lo usa riceve una stringa `AAAA-MM-GG` e ci fa quello che vuole.
 *
 * Esiste perché ora le date da scegliere sono due — quella d'inizio della coppia
 * e la data di nascita — e `SceltaInsiemeDal` non era riusabile: sa salvare
 * sulla coppia, cioè fa **due** lavori. Qui c'è solo il primo.
 *
 * ⚠️ La doppia strada web/nativo non è un ripiego: `DateTimePicker` su web
 * renderizza un controllo che su alcuni browser non si apre, e un campo di testo
 * su un telefono è un modo penoso di scrivere una data. Ognuno dei due è la cosa
 * giusta dove sta.
 */
export function SceltaData({
  valore,
  onCambia,
  etichetta,
  massimo,
  minimo,
}: {
  /** `AAAA-MM-GG`, oppure `null` se non è ancora stata scelta. */
  valore: string | null;
  onCambia: (v: string | null) => void;
  etichetta?: string;
  massimo?: Date;
  minimo?: Date;
}) {
  const [testo, setTesto] = React.useState(valore ?? '');

  // Il picker nativo vuole un `Date` e non tollera `null`: quando la scelta non
  // c'è ancora si parte da una data qualunque, ma **non la si comunica** —
  // `onCambia` scatta solo quando l'utente tocca davvero il selettore. Senza
  // questa distinzione, aprire la schermata equivarrebbe ad aver scelto.
  const partenza = React.useMemo(() => daStringa(valore) ?? massimo ?? new Date(), [valore, massimo]);

  return (
    <View className="gap-2">
      {!!etichetta && <Text className="text-sm text-muted-foreground">{etichetta}</Text>}
      {Platform.OS === 'web' ? (
        <Input
          value={testo}
          onChangeText={(v) => {
            setTesto(v);
            // Si comunica **solo una data completa e valida**: mentre si scrive
            // «2003-1» il valore intermedio non è una data, e propagarlo
            // farebbe lampeggiare errori a ogni tasto.
            onCambia(/^\d{4}-\d{2}-\d{2}$/.test(v.trim()) && daStringa(v.trim()) ? v.trim() : null);
          }}
          placeholder="2003-10-28"
          autoCapitalize="none"
        />
      ) : (
        <DateTimePicker
          value={partenza}
          mode="date"
          display="compact"
          maximumDate={massimo}
          minimumDate={minimo}
          onChange={(_, d) => d && onCambia(aStringa(d))}
        />
      )}
    </View>
  );
}

const aStringa = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

function daStringa(s: string | null): Date | null {
  if (!s) return null;
  const m = s.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  // ⚠️ `new Date(2003, 1, 31)` non fallisce: diventa il 3 marzo. Si ricontrolla
  // che i pezzi siano rimasti quelli, altrimenti «31 febbraio» passerebbe.
  if (d.getFullYear() !== +m[1] || d.getMonth() !== +m[2] - 1 || d.getDate() !== +m[3]) return null;
  return d;
}
