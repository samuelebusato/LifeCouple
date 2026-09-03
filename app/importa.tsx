import * as React from 'react';
import { View, ScrollView, ActivityIndicator, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Square } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { BottoneVetro } from '@/components/ui/vetro';
import { Fondo } from '@/components/schermata';
import { cn } from '@/lib/utils';
import { useTema } from '@/lib/tema';
import { useCoppia } from '@/lib/coppia';
import { assicuraCoppia } from '@/lib/invito';
import { TIPI, type TipoEvento } from '@/lib/eventi';
import {
  chiediPermesso,
  leggiCandidati,
  giaImportati,
  importa,
  perCategoria,
  type Candidato,
} from '@/lib/importa';
import { lingua, t } from '@/lib/i18n';

/**
 * Scelta di cosa importare dal calendario del telefono.
 *
 * Le voci sono raggruppate per **categoria**, che nel telefono coincide col
 * calendario di provenienza: festivita', compleanni, casa, lavoro, famiglia.
 * Si puo' prendere una categoria intera in un tocco — resta una scelta
 * consapevole, perche' la categoria la nomini tu — oppure spuntare voce per
 * voce.
 *
 * Nessuna spunta e' attiva all'apertura: si parte da zero e si aggiunge, non si
 * parte da tutto e si toglie. La differenza non e' estetica — su un calendario
 * condiviso (D-21) una spunta dimenticata mostra al partner una cosa che non
 * avresti mostrato.
 */
export default function Importa() {
  const router = useRouter();
  const { coppiaId, ricarica } = useCoppia();

  const [stato, setStato] = React.useState<'attesa' | 'negato' | 'pronto' | 'nonSupportato'>(
    'attesa'
  );
  const [candidati, setCandidati] = React.useState<Candidato[]>([]);
  const [scelti, setScelti] = React.useState<Record<string, TipoEvento>>({});
  const [errore, setErrore] = React.useState<string | null>(null);
  const [salvando, setSalvando] = React.useState(false);
  const [fatti, setFatti] = React.useState<number | null>(null);

  React.useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') return setStato('nonSupportato');
      // 🔴 **Il permesso sta DENTRO il `try`** (2026-09-03, B-49). Era fuori, e
      // quando `chiediPermesso` ha cominciato a lanciare — l'API di calendario
      // spostata in `legacy` da SDK 57 — l'eccezione non la prendeva nessuno:
      // lo stato restava `'attesa'` e la schermata **caricava per sempre**.
      // 🔑 Un errore non gestito non produce un errore visibile: produce una
      // schermata che non finisce mai, che è il sintomo più difficile da capire.
      try {
        if (!(await chiediPermesso())) return setStato('negato');
        const tutti = await leggiCandidati();
        const gia = coppiaId ? await giaImportati(coppiaId) : new Set<string>();
        setCandidati(tutti.filter((c) => !gia.has(c.id)));
        setStato('pronto');
      } catch (e) {
        setErrore(e instanceof Error ? e.message : String(e));
        setStato('pronto');
      }
    })();
  }, [coppiaId]);

  // `tema` e non `{ c }`: in questa schermata `c` e' gia' il candidato.
  const tema = useTema();
  const conta = Object.keys(scelti).length;

  function spunta(c: Candidato) {
    setScelti((s) => {
      const copia = { ...s };
      if (copia[c.id]) delete copia[c.id];
      else copia[c.id] = c.tipo;
      return copia;
    });
  }

  /** Un'intera categoria in un tocco: festivita', compleanni, famiglia. */
  function spuntaCategoria(voci: Candidato[], giaTutte: boolean) {
    setScelti((s) => {
      const copia = { ...s };
      for (const c of voci) {
        if (giaTutte) delete copia[c.id];
        else copia[c.id] = c.tipo;
      }
      return copia;
    });
  }

  async function conferma() {
    setErrore(null);
    setSalvando(true);
    const esito = await assicuraCoppia(coppiaId, ricarica);
    if (!esito.coppiaId) {
      setSalvando(false);
      return setErrore(esito.errore);
    }
    const lista = candidati.filter((c) => scelti[c.id]).map((c) => ({ ...c, tipo: scelti[c.id] }));
    const r = await importa(esito.coppiaId, lista);
    setSalvando(false);
    if (r.errore) return setErrore(r.errore);
    setFatti(r.entrati);
    setCandidati((cs) => cs.filter((c) => !scelti[c.id]));
    setScelti({});
  }

  function Voce({ c }: { c: Candidato }) {
    const attivo = !!scelti[c.id];
    return (
      <View className="gap-2 rounded-2xl bg-card p-4">
        <Pressable className="flex-row items-start gap-3" onPress={() => spunta(c)}>
          {attivo ? (
            <Check color={tema.c.accento} size={22} />
          ) : (
            <Square color={tema.c.tenue} size={22} />
          )}
          <View className="flex-1">
            <Text className="font-serif text-lg text-foreground">{c.titolo}</Text>
            <Text className="text-xs text-muted-foreground">
              {c.inizio.toLocaleDateString(lingua, {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              {c.ricorrente ? ` · ${t.importa.ricorrente}` : ''}
            </Text>
          </View>
        </Pressable>

        {/* Il tipo indovinato resta modificabile: la macchina propone, la
            persona decide. */}
        {attivo && (
          <View className="flex-row gap-2 pl-8">
            {TIPI.map((x) => (
              <Pressable
                key={x}
                onPress={() => setScelti((s) => ({ ...s, [c.id]: x }))}
                className={cn(
                  'flex-1 items-center rounded-full py-1.5',
                  scelti[c.id] === x ? 'bg-primary' : 'bg-background'
                )}
              >
                <Text
                  className={cn(
                    'text-xs',
                    scelti[c.id] === x ? 'text-primary-foreground' : 'text-muted-foreground'
                  )}
                >
                  {t.calendario.tipi[x]}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    );
  }

  return (
    <View className="flex-1">
      <Fondo />
      <SafeAreaView className="flex-1">
      <View className="flex-row items-center justify-between px-6 pb-2 pt-4">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text className="text-base text-muted-foreground">{t.calendario.chiudi}</Text>
        </Pressable>
        <Text className="font-serif-bold text-2xl text-foreground">{t.importa.titolo}</Text>
        <View style={{ width: 56 }} />
      </View>

      {stato === 'attesa' && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={tema.c.accento} />
        </View>
      )}

      {stato === 'nonSupportato' && (
        <View className="flex-1 items-center justify-center gap-2 px-8">
          <Text className="font-serif text-xl text-foreground">{t.importa.soloTelefono}</Text>
        </View>
      )}

      {stato === 'negato' && (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Text className="font-serif text-xl text-foreground">{t.importa.negatoTitolo}</Text>
          <Text className="text-center text-base text-muted-foreground">
            {t.importa.negatoTesto}
          </Text>
        </View>
      )}

      {stato === 'pronto' && (
        <>
          <Text className="px-6 pb-2 text-sm text-muted-foreground">{t.importa.avviso}</Text>

          <ScrollView contentContainerClassName="gap-2 px-6 pb-40">
            {errore && <Text className="text-sm text-destructive">{errore}</Text>}
            {fatti !== null && (
              <Text className="text-sm text-primary">{t.importa.importati(fatti)}</Text>
            )}
            {candidati.length === 0 && (
              <Text className="py-10 text-center text-base text-muted-foreground">
                {t.importa.niente}
              </Text>
            )}

            {perCategoria(candidati).map(([categoria, voci]) => {
              const tutte = voci.every((c) => scelti[c.id]);
              return (
                <View key={categoria} className="gap-2 pt-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs uppercase tracking-wide text-muted-foreground">
                      {categoria} · {voci.length}
                    </Text>
                    <Pressable onPress={() => spuntaCategoria(voci, tutte)} hitSlop={8}>
                      <Text className="text-sm text-primary">
                        {tutte ? t.importa.nessuno : t.importa.tutti}
                      </Text>
                    </Pressable>
                  </View>
                  {voci.map((c) => (
                    <Voce key={c.id} c={c} />
                  ))}
                </View>
              );
            })}
          </ScrollView>

          <View className="absolute inset-x-0 bottom-0 gap-2 px-6 pb-8 pt-3">
            <BottoneVetro
              variante="accento"
              altezza={58}
              disabled={conta === 0 || salvando}
              onPress={conferma}
            >
              <Text>{salvando ? t.onboarding.attesa : t.importa.importa(conta)}</Text>
            </BottoneVetro>
          </View>
        </>
      )}
      </SafeAreaView>
    </View>
  );
}
