import * as React from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Check } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Premibile } from '@/components/ui/premibile';
import { Fondo } from '@/components/schermata';
import { TondoVetro } from '@/components/ui/vetro';
import { useAuth } from '@/lib/auth';
import { useCoppia } from '@/lib/coppia';
import {
  DOMANDE,
  OPZIONI,
  salvaProfilo,
  useProfilo,
  useQuestionarioRimandato,
  type Domanda,
  type Profilo,
} from '@/lib/profilo';
import { useTema } from '@/lib/tema';
import { t } from '@/lib/i18n';

/**
 * **Il questionario di ingresso**: quattro domande facoltative sulla coppia.
 *
 * ## 🔴 Questa schermata chiede dati che non servono a chi li dà
 *
 * È l'unica del progetto in cui succede, e il modo in cui è scritta discende
 * tutto da lì (il ragionamento completo è nella migrazione `0029`):
 *
 * - **Dice a cosa serve, in prima riga e senza girarci intorno.** Non «aiutaci a
 *   personalizzare la tua esperienza», che è la formula con cui di solito si
 *   chiede questo — e che qui sarebbe **falsa**, perché nessuna risposta cambia
 *   niente nell'app. Un consenso ottenuto lasciando credere a un beneficio che
 *   non c'è non è informato, e quindi non è un consenso.
 * - **Si può uscire da ogni punto** e non si perde niente: nessuna domanda è
 *   obbligatoria, e chiudere senza inviare non salva. Un consenso che serve a
 *   passare oltre non è libero.
 * - **Si salva una volta sola, alla fine**, con un gesto esplicito. Niente
 *   salvataggio a ogni tocco: chi risponde a due domande e poi ci ripensa deve
 *   poter chiudere senza aver lasciato niente.
 *
 * ⚠️ **La fascia d'età parte da 14 anni** e non da 18, perché 14 è l'età minima
 * dichiarata nell'informativa (§11, art. 8 GDPR nell'ordinamento italiano).
 * Metterne una diversa qui avrebbe fatto divergere due documenti che devono
 * dire la stessa cosa.
 */
export default function Questionario() {
  const router = useRouter();
  const { c } = useTema();
  const { session } = useAuth();
  const { completa } = useCoppia();
  const { profilo, loading } = useProfilo();
  const { rimanda } = useQuestionarioRimandato(session?.user.id);

  const [risposte, setRisposte] = React.useState<Partial<Profilo>>({});
  const [attesa, setAttesa] = React.useState(false);
  const [errore, setErrore] = React.useState<string | null>(null);

  // Le risposte già date si ripresentano selezionate: si arriva qui anche dalle
  // impostazioni per **cambiare** una risposta, e un modulo che si riapre vuoto
  // farebbe credere che le risposte siano andate perse.
  React.useEffect(() => {
    if (profilo) setRisposte(profilo);
  }, [profilo]);

  const campo: Record<Domanda, keyof Profilo> = {
    conosciutoDa: 'conosciutoDa',
    fasciaEta: 'fasciaEta',
    convivenza: 'convivenza',
    interesse: 'interesse',
  };

  const almenoUna = DOMANDE.some((d) => !!risposte[campo[d]]);

  /**
   * L'etichetta di un'opzione.
   *
   * ⚠️ Il cast serve perché TypeScript non riesce a correlare la domanda con le
   * sue opzioni: `domande[d].opzioni` è l'unione di quattro oggetti con chiavi
   * diverse, e l'indice è calcolato. È sicuro finché `OPZIONI` e le chiavi del
   * dizionario restano allineate — lo stesso vincolo che già lega `OPZIONI` ai
   * `check` della migrazione 0029.
   *
   * Il `?? opzione` è la rete: una traduzione mancante mostra la chiave grezza
   * invece di `undefined`, che a schermo si legge come un difetto dell'app.
   */
  const etichetta = (d: Domanda, opzione: string) =>
    (t.questionario.domande[d].opzioni as Record<string, string>)[opzione] ?? opzione;

  async function invia() {
    setErrore(null);
    setAttesa(true);
    const e = await salvaProfilo(risposte);
    setAttesa(false);
    if (e) return setErrore(e);
    router.back();
  }

  async function nonAdesso() {
    await rimanda();
    router.back();
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={c.accento} />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <Fondo />
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-row items-center justify-between px-6 pb-1 pt-1">
          <Text className="font-serif-bold text-3xl text-foreground">
            {t.questionario.titolo}
          </Text>
          <TondoVetro lato={40} tinto={false} onPress={() => router.back()}>
            <X color={c.tenue} size={18} />
          </TondoVetro>
        </View>

        <ScrollView contentContainerClassName="gap-7 px-6 pb-10 pt-3">
          {/* La spiegazione onesta: a chi serve, e cosa cambia se non rispondi. */}
          <View className="gap-2">
            <Text className="text-base leading-relaxed text-foreground">
              {t.questionario.spiegazione}
            </Text>
            <Text className="text-sm text-muted-foreground">{t.questionario.facoltativo}</Text>
          </View>

          {!completa && (
            <Text className="text-sm text-muted-foreground">{t.questionario.servePartner}</Text>
          )}

          {DOMANDE.map((d) => (
            <View key={d} className="gap-3">
              <Text className="font-serif text-lg text-foreground">
                {t.questionario.domande[d].titolo}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {OPZIONI[d].map((opzione) => {
                  const scelta = risposte[campo[d]] === opzione;
                  return (
                    <Premibile
                      key={opzione}
                      scala={0.97}
                      aptico="scelta"
                      onPress={() =>
                        setRisposte((r) => ({
                          ...r,
                          // Ritoccare la stessa opzione la **toglie**: senza,
                          // una risposta data per sbaglio non si potrebbe più
                          // ritirare, e su un questionario facoltativo sarebbe
                          // un dato dato controvoglia.
                          [campo[d]]: scelta ? null : opzione,
                        }))
                      }
                    >
                      <View
                        className="flex-row items-center gap-2 rounded-full px-4 py-2.5"
                        style={{
                          backgroundColor: scelta ? c.accento : c.carta,
                          borderWidth: 1,
                          borderColor: scelta ? c.accento : c.linea,
                        }}
                      >
                        {scelta && <Check color={c.suAccento} size={15} />}
                        <Text
                          className="text-base"
                          style={{ color: scelta ? c.suAccento : c.testo }}
                        >
                          {etichetta(d, opzione)}
                        </Text>
                      </View>
                    </Premibile>
                  );
                })}
              </View>
            </View>
          ))}

          {!!errore && <Text className="text-sm text-destructive">{errore}</Text>}

          <View className="gap-2 pt-2">
            {/* ⚠️ Il testo del consenso sta **attaccato al bottone che lo
                presta**, non in cima alla pagina dove si legge prima di sapere
                cosa si sta per mandare. */}
            <Text className="text-xs leading-relaxed text-muted-foreground">
              {t.questionario.consenso}
            </Text>
            <Button disabled={attesa || !almenoUna} onPress={invia}>
              <Text>{attesa ? t.questionario.invio : t.questionario.invia}</Text>
            </Button>
            <Button variant="ghost" onPress={nonAdesso}>
              <Text>{t.questionario.nonAdesso}</Text>
            </Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
