import * as React from 'react';
import { View, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import type { StatoCoppia } from '@/lib/coppia';
import { lingua, t } from '@/lib/i18n';

/** Giorni pieni fra due date, contati sui giorni civili e non sulle ore. */
export function giorniInsieme(insiemeDal: string, oggi = new Date()) {
  const [a, m, g] = insiemeDal.split('-').map(Number);
  const da = new Date(a, m - 1, g);
  const a_oggi = new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate());
  return Math.max(0, Math.round((a_oggi.getTime() - da.getTime()) / 86_400_000));
}

/**
 * Il riquadro grande della home: da quanti giorni si sta insieme.
 *
 * Ha due facce. Se la data non c'e' ancora — cioe' appena il partner ha
 * accettato l'invito — chiede di sceglierla; altrimenti conta. La stessa
 * funzione che la salva **segna anche il giorno sul calendario**, cosi' la
 * data non vive solo dentro un contatore.
 */
export function Insieme({
  insiemeDal,
  ricarica,
}: {
  insiemeDal: string | null;
  ricarica: () => Promise<StatoCoppia>;
}) {
  const [scelta, setScelta] = React.useState(() => new Date());
  const [testo, setTesto] = React.useState(() => perCampo(new Date()));
  const [attesa, setAttesa] = React.useState(false);
  const [errore, setErrore] = React.useState<string | null>(null);

  async function salva() {
    setErrore(null);
    const d = Platform.OS === 'web' ? daCampo(testo) : scelta;
    if (!d) return setErrore(t.insieme.dataNonValida);
    if (d > new Date()) return setErrore(t.insieme.futuro);
    setAttesa(true);
    const { error } = await supabase.rpc('imposta_insieme_dal', {
      p_data: perCampo(d),
      p_titolo: t.insieme.eventoTitolo,
    });
    setAttesa(false);
    if (error) return setErrore(error.message);
    await ricarica();
  }

  if (!insiemeDal) {
    return (
      <View className="w-full gap-3 rounded-3xl bg-card p-6">
        <Text className="font-serif-bold text-2xl text-foreground">{t.insieme.chiediTitolo}</Text>
        <Text className="text-base text-muted-foreground">{t.insieme.chiediTesto}</Text>
        {Platform.OS === 'web' ? (
          <Input value={testo} onChangeText={setTesto} placeholder="2020-06-14" autoCapitalize="none" />
        ) : (
          <DateTimePicker
            value={scelta}
            mode="date"
            display="compact"
            maximumDate={new Date()}
            onChange={(_, d) => d && setScelta(d)}
          />
        )}
        {errore && <Text className="text-sm text-destructive">{errore}</Text>}
        <Button disabled={attesa} onPress={salva}>
          <Text>{attesa ? t.onboarding.attesa : t.insieme.salva}</Text>
        </Button>
      </View>
    );
  }

  const n = giorniInsieme(insiemeDal);
  const [a, m, g] = insiemeDal.split('-').map(Number);
  const data = new Date(a, m - 1, g).toLocaleDateString(lingua, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <View className="w-full items-center gap-1 rounded-3xl bg-card px-6 py-8">
      <Text className="text-sm uppercase tracking-widest text-muted-foreground">
        {t.insieme.etichetta}
      </Text>
      <Text className="font-serif-bold text-6xl text-primary">{n}</Text>
      <Text className="font-serif text-2xl text-foreground">{t.insieme.giorni(n)}</Text>
      <Text className="pt-1 text-sm text-muted-foreground">{t.insieme.dal(data)}</Text>
    </View>
  );
}

const perCampo = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

function daCampo(s: string): Date | null {
  const m = s.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return isNaN(d.getTime()) ? null : d;
}
