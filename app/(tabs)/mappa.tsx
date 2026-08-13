import * as React from 'react';
import { View, ScrollView, Modal, Platform, ActivityIndicator, Pressable, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Crosshair, MapPin, Trash2 } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RigaEvento } from '@/components/riga-evento';
import { MappaVera, MAPPA_DISPONIBILE } from '@/components/mappa-vera';
import { useAuth } from '@/lib/auth';
import { useCoppia } from '@/lib/coppia';
import { useLuoghi, type Luogo } from '@/lib/luoghi';
import { useEventiDelLuogo } from '@/lib/evento-dettaglio';
import { t } from '@/lib/i18n';

/**
 * La mappa: gli stessi eventi del calendario, guardati **nello spazio** (D-33).
 *
 * Toccando un posto si aprono i suoi eventi, e da li' si entra nella pagina
 * dell'evento — la stessa a cui portano il calendario e il recap.
 *
 * ⚠️ D-05, la decisione che vale piu' di ogni funzione: **nessun tracciamento**.
 * Un posto entra qui con un tocco lungo sulla mappa o con un "segna dove sono
 * adesso" premuto apposta; la posizione non viene mai letta da sola, e nessuno
 * dei due puo' sapere dove si trova l'altro in questo momento.
 */

/** Gli eventi di un posto: e' l'ingresso dalla mappa alla pagina dell'evento. */
function EventiDelLuogo({ luogo, onChiudi }: { luogo: Luogo; onChiudi: () => void }) {
  const router = useRouter();
  const { session } = useAuth();
  const { eventi, loading } = useEventiDelLuogo(luogo.id);

  return (
    <View className="max-h-[70%] gap-3 rounded-t-3xl bg-background p-6">
      <Text className="font-serif-bold text-2xl text-foreground">{luogo.nome}</Text>
      <Text className="text-xs uppercase tracking-wide text-muted-foreground">
        {luogo.stato === 'visitato' ? t.mappa.visitato : t.mappa.daVisitare}
      </Text>
      {!!luogo.nota && <Text className="text-base text-muted-foreground">{luogo.nota}</Text>}

      {loading ? (
        <ActivityIndicator color="#bf5333" />
      ) : (
        <ScrollView contentContainerClassName="gap-3">
          {eventi.length === 0 ? (
            <Text className="py-4 text-base text-muted-foreground">{t.mappa.nessunEvento}</Text>
          ) : (
            eventi.map((e) => (
              <RigaEvento
                key={e.id}
                e={e}
                mio={e.autore_id === session?.user.id}
                onPress={() => {
                  onChiudi();
                  router.push({ pathname: '/evento/[id]', params: { id: e.id } });
                }}
              />
            ))
          )}
        </ScrollView>
      )}

      <Button variant="ghost" onPress={onChiudi}>
        <Text>{t.calendario.chiudi}</Text>
      </Button>
    </View>
  );
}

export default function Mappa() {
  const { coppiaId, ricarica: ricaricaCoppia } = useCoppia();
  const { luoghi, loading, aggiungi, segnaVisitato, elimina } = useLuoghi(coppiaId);
  const { session } = useAuth();

  const [scelto, setScelto] = React.useState<Luogo | null>(null);
  const [nuovo, setNuovo] = React.useState<{ lat: number; lng: number } | null>(null);
  const [nome, setNome] = React.useState('');
  const [visitato, setVisitato] = React.useState(true);
  const [attesa, setAttesa] = React.useState(false);
  const [errore, setErrore] = React.useState<string | null>(null);

  /** Un gesto esplicito, una lettura sola: nessuna posizione in background. */
  async function segnaDoveSono() {
    setErrore(null);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return setErrore(t.mappa.permessoNegato);
    const p = await Location.getCurrentPositionAsync({});
    setNuovo({ lat: p.coords.latitude, lng: p.coords.longitude });
    setNome('');
    setVisitato(true);
  }

  async function salvaLuogo() {
    if (!nuovo || nome.trim().length === 0) return;
    setErrore(null);
    setAttesa(true);
    const err = await aggiungi({ ...nuovo, nome, visitato }, ricaricaCoppia);
    setAttesa(false);
    if (err) return setErrore(err);
    setNuovo(null);
    setNome('');
  }

  const centro = luoghi[0]
    ? { latitude: luoghi[0].lat, longitude: luoghi[0].lng }
    : { latitude: 45.4642, longitude: 9.19 };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {!MAPPA_DISPONIBILE ? (
        // react-native-maps non esiste sul web: li' resta l'elenco, che e'
        // comunque il modo in cui si arriva agli eventi di un posto.
        <View className="flex-1 gap-3 px-6 pt-4">
          <Text className="font-serif-bold text-2xl text-foreground">{t.tab.mappa}</Text>
          <Text className="text-sm text-muted-foreground">
            {Platform.OS === 'web' ? t.mappa.soloTelefono : t.mappa.senzaComponente}
          </Text>
          {Platform.OS !== 'web' && (
            <Button onPress={segnaDoveSono}>
              <Text>{t.mappa.segnaDoveSono}</Text>
            </Button>
          )}
          <ScrollView contentContainerClassName="gap-3 pb-32">
            {luoghi.map((l) => (
              <Pressable
                key={l.id}
                className="flex-row items-center gap-3 rounded-2xl bg-card p-4"
                onPress={() => setScelto(l)}
              >
                <MapPin color={l.stato === 'visitato' ? '#bf5333' : '#9a8b7d'} size={20} />
                <Text className="flex-1 font-serif text-lg text-foreground">{l.nome}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : (
        <View className="flex-1">
          <MappaVera
            centro={centro}
            luoghi={luoghi}
            onLuogo={(l) => setScelto(l)}
            onPuntoNuovo={(p) => {
              setNuovo(p);
              setNome('');
              setVisitato(true);
            }}
          />

          <View className="absolute left-6 right-6 top-4 gap-2">
            <Text className="rounded-full bg-background/90 px-4 py-2 text-center text-xs text-muted-foreground">
              {t.mappa.comeSiAggiunge}
            </Text>
          </View>

          <Pressable
            onPress={segnaDoveSono}
            className="absolute bottom-24 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg"
          >
            <Crosshair color="#fdfaf5" size={26} />
          </Pressable>
        </View>
      )}

      {loading && (
        <View className="absolute inset-x-0 top-1/2 items-center">
          <ActivityIndicator color="#bf5333" />
        </View>
      )}

      {/* Il posto scelto, con i suoi eventi */}
      <Modal
        visible={scelto !== null}
        animationType={Platform.OS === 'web' ? 'none' : 'slide'}
        transparent
        onRequestClose={() => setScelto(null)}
      >
        <View className="flex-1 justify-end bg-black/40">
          {scelto && (
            <View>
              <EventiDelLuogo luogo={scelto} onChiudi={() => setScelto(null)} />
              {scelto.autore_id === session?.user.id && (
                <View className="flex-row gap-2 bg-background px-6 pb-8">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onPress={() => {
                      segnaVisitato(scelto.id, scelto.stato !== 'visitato');
                      setScelto(null);
                    }}
                  >
                    <Text>
                      {scelto.stato === 'visitato' ? t.mappa.segnaDaVisitare : t.mappa.segnaVisitato}
                    </Text>
                  </Button>
                  <Button
                    variant="ghost"
                    onPress={() => {
                      elimina(scelto.id);
                      setScelto(null);
                    }}
                  >
                    <Trash2 color="#b3261e" size={18} />
                  </Button>
                </View>
              )}
            </View>
          )}
        </View>
      </Modal>

      {/* Il posto nuovo: nome e se ci siete gia' stati */}
      <Modal
        visible={nuovo !== null}
        animationType={Platform.OS === 'web' ? 'none' : 'slide'}
        transparent
        onRequestClose={() => setNuovo(null)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="gap-4 rounded-t-3xl bg-background p-6">
            <Text className="font-serif-bold text-2xl text-foreground">{t.mappa.nuovoTitolo}</Text>
            <Input value={nome} onChangeText={setNome} placeholder={t.mappa.placeholderNome} autoFocus />
            <View className="flex-row items-center justify-between">
              <Text className="text-base text-foreground">{t.mappa.ciSiamoStati}</Text>
              <Switch value={visitato} onValueChange={setVisitato} />
            </View>
            {errore && <Text className="text-sm text-destructive">{errore}</Text>}
            <Button size="lg" disabled={attesa || nome.trim().length === 0} onPress={salvaLuogo}>
              <Text>{attesa ? t.onboarding.attesa : t.calendario.salva}</Text>
            </Button>
            <Button variant="ghost" onPress={() => setNuovo(null)}>
              <Text>{t.calendario.annulla}</Text>
            </Button>
          </View>
        </View>
      </Modal>

      {errore && !nuovo && (
        <Text className="absolute bottom-40 left-6 right-6 text-center text-sm text-destructive">
          {errore}
        </Text>
      )}
    </SafeAreaView>
  );
}
