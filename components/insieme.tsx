import * as React from 'react';
import { View, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Svg, { Path } from 'react-native-svg';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import type { StatoCoppia } from '@/lib/coppia';
import { lingua, t } from '@/lib/i18n';
import { C } from '@/lib/tema';

/**
 * **Il cuoricino dei giorni passati insieme**, disegnato dal calendario su ogni
 * giorno dentro la vostra storia (vedi `dentroLaStoria` in `lib/date.ts`).
 *
 * ## ⚠️ Perché è tenue, e perché deve restarlo
 *
 * Questo segno compare su **ogni singolo giorno** dal fidanzamento in poi:
 * dopo un anno sono trecentosessantacinque cuori, dopo cinque anni quasi
 * duemila. Un segno ripetuto su *tutto* smette di essere un'informazione e
 * diventa la carta da parati — e se è marcato, diventa carta da parati che
 * copre le pillole degli eventi, cioè l'unica cosa che in quella cella si deve
 * leggere davvero.
 *
 * Quindi: contenuto, in un angolo che le pillole non usano, e a opacità ridotta.
 * ⚠️ **Ritarato il 2026-09-04**: la prima misura (9 punti, opacità 0,4) è stata
 * giudicata troppo timida sul telefono — la prudenza contro il rumore visivo
 * era andata oltre, e il segno spariva anche quando lo si cercava. Va
 * notato **scorrendo indietro** — dove i cuori finiscono, comincia la vostra
 * storia — non guardando il mese corrente.
 *
 * 🔑 È la stessa regola che il progetto applica ai colori delle pillole: si
 * distingue *a colpo d'occhio*, non *leggendo*. Qui il colpo d'occhio è il
 * confine, non il singolo giorno.
 */
export function CuoreGiorno({
  size = 13,
  colore,
  opacita = 0.55,
}: {
  size?: number;
  colore?: string;
  opacita?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" opacity={opacita}>
      <Path
        d="M12 20s-7-4.6-7-9.4A4.1 4.1 0 0112 8.6 4.1 4.1 0 0119 10.6C19 15.4 12 20 12 20z"
        fill={colore ?? C.accento}
      />
    </Svg>
  );
}

/**
 * La data scritta per esteso nella lingua dell'app («14 giugno 2020»).
 *
 * Esportata perche' la leggono in due — il riquadro in home e le impostazioni —
 * e due `toLocaleDateString` scritte a mano diventano due formati leggermente
 * diversi per la stessa data.
 */
export function dataLunga(giorno: string): string {
  const [a, m, g] = giorno.split('-').map(Number);
  return new Date(a, m - 1, g).toLocaleDateString(lingua, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Giorni pieni fra due date, contati sui giorni civili e non sulle ore. */
export function giorniInsieme(insiemeDal: string, oggi = new Date()) {
  const [a, m, g] = insiemeDal.split('-').map(Number);
  const da = new Date(a, m - 1, g);
  const a_oggi = new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate());
  return Math.max(0, Math.round((a_oggi.getTime() - da.getTime()) / 86_400_000));
}

/**
 * **Il selettore della data, da solo.** Estratto dal riquadro il 2026-09-04
 * perche' ora ha due chiamanti: la home quando la data non c'e' ancora, e le
 * impostazioni quando c'e' e va corretta.
 *
 * 🔑 **La correzione non ha richiesto niente di nuovo lato database**, ed e' il
 * motivo per cui questo pezzo costa poco: `imposta_insieme_dal` (migrazione
 * 0005) fa gia' `on conflict … do update` sull'evento del calendario, e il suo
 * commento lo dice a lettere — *«permette di ritrovarlo e spostarlo se la data
 * viene corretta»*. Era stata scritta prevedendo questo caso. Chiamarla una
 * seconda volta **sposta** il segno sul calendario invece di aggiungerne uno.
 *
 * ⚠️ `iniziale` esiste per la sola ragione che conta: chi apre per **correggere**
 * deve trovare la data che ha oggi, non la data di oggi. Un selettore che si
 * apre su "adesso" invita a salvare per inerzia un valore che nessuno ha
 * scelto — e qui il valore salvato finisce anche sul calendario dell'altro.
 */
export function SceltaInsiemeDal({
  iniziale,
  ricarica,
  etichettaSalva,
  suFatto,
}: {
  iniziale: string | null;
  ricarica: () => Promise<StatoCoppia>;
  etichettaSalva?: string;
  /** Chiamata dopo un salvataggio riuscito: serve a chi mostra un pannello che va richiuso. */
  suFatto?: () => void;
}) {
  const partenza = React.useMemo(() => (iniziale ? daCampo(iniziale) : null) ?? new Date(), [iniziale]);
  const [scelta, setScelta] = React.useState(partenza);
  const [testo, setTesto] = React.useState(() => perCampo(partenza));
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
    // ⚠️ Si rilegge invece di fidarsi dell'assenza di errore: e' la lezione di
    // B-23, e qui varrebbe doppio — una data non salvata lascerebbe a schermo
    // il conteggio vecchio, che e' esattamente cio' che si stava correggendo.
    await ricarica();
    suFatto?.();
  }

  return (
    <>
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
        <Text>{attesa ? t.onboarding.attesa : (etichettaSalva ?? t.insieme.salva)}</Text>
      </Button>
    </>
  );
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
  if (!insiemeDal) {
    return (
      <View className="w-full gap-3 rounded-3xl bg-card p-6">
        <Text className="font-serif-bold text-2xl text-foreground">{t.insieme.chiediTitolo}</Text>
        <Text className="text-base text-muted-foreground">{t.insieme.chiediTesto}</Text>
        <SceltaInsiemeDal iniziale={null} ricarica={ricarica} />
      </View>
    );
  }

  const n = giorniInsieme(insiemeDal);
  const data = dataLunga(insiemeDal);

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
