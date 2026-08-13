import * as React from 'react';
import { View, ScrollView, Modal, Platform, ActivityIndicator, Pressable, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Crosshair, MapPin, Trash2 } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { BottoneVetro, CartaVetro, TondoVetro, Vetro } from '@/components/ui/vetro';
import { CercaLuogo } from '@/components/cerca-luogo';
import { Fondo } from '@/components/schermata';
import { SPAZIO_BARRA } from '@/components/barra-volante';
import { RigaEvento } from '@/components/riga-evento';
import { MappaVera, MAPPA_DISPONIBILE, type RistoranteSuMappa } from '@/components/mappa-vera';
import { useAuth } from '@/lib/auth';
import { useCoppia } from '@/lib/coppia';
import { useLuoghi, type Luogo } from '@/lib/luoghi';
import { useEventiDelLuogo } from '@/lib/evento-dettaglio';
import { supabase } from '@/lib/supabase';
import type { Evento } from '@/lib/eventi';
import { useTastiera } from '@/lib/tastiera';
import { useTema } from '@/lib/tema';
import { t } from '@/lib/i18n';

/**
 * La mappa: gli stessi eventi del calendario, guardati **nello spazio** (D-33).
 *
 * Toccando un posto si aprono i suoi eventi, e da li' si entra nella pagina
 * dell'evento — la stessa a cui portano il calendario e il recap.
 *
 * ⚠️ D-05, la decisione che vale piu' di ogni funzione: **nessun tracciamento**.
 * Un posto entra qui con un tocco lungo sulla mappa, con un "segna dove sono
 * adesso" premuto apposta, oppure cercandolo per nome; la posizione non viene
 * mai letta da sola, e nessuno dei due puo' sapere dove si trova l'altro in
 * questo momento.
 *
 * La **ricerca** (2026-08-13) non intacca questa regola: manda a OpenStreetMap
 * il testo digitato e nient'altro — nemmeno per ordinare i risultati per
 * vicinanza, che pure li migliorerebbe. Vedi `lib/ricerca-luoghi.ts`.
 */

/** Gli eventi di un posto: e' l'ingresso dalla mappa alla pagina dell'evento. */
function EventiDelLuogo({ luogo, onChiudi }: { luogo: Luogo; onChiudi: () => void }) {
  const router = useRouter();
  const { session } = useAuth();
  const { c } = useTema();
  const { eventi, loading } = useEventiDelLuogo(luogo.id);

  return (
    <View className="max-h-[70%] gap-3 p-6">
      <Text className="font-serif-bold text-2xl text-foreground">{luogo.nome}</Text>
      <Text className="text-xs uppercase tracking-wide text-muted-foreground">
        {luogo.stato === 'visitato' ? t.mappa.visitato : t.mappa.daVisitare}
      </Text>
      {!!luogo.nota && <Text className="text-base text-muted-foreground">{luogo.nota}</Text>}

      {loading ? (
        <ActivityIndicator color={c.accento} />
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

      <BottoneVetro onPress={onChiudi} altezza={48}>
        <Text>{t.calendario.chiudi}</Text>
      </BottoneVetro>
    </View>
  );
}

/**
 * Gli eventi di un ristorante: il pin ambra porta qui, e da qui alla pagina
 * dell'evento — "se premo su un ristorante collegato a un evento devo vedere
 * i dettagli dell'evento" (richiesta del 2026-08-13).
 */
function EventiDelRistorante({
  ristorante,
  eventi,
  onChiudi,
}: {
  ristorante: RistoranteSuMappa;
  eventi: Evento[];
  onChiudi: () => void;
}) {
  const router = useRouter();
  const { session } = useAuth();

  return (
    <View className="max-h-[70%] gap-3 p-6">
      <Text className="font-serif-bold text-2xl text-foreground">{ristorante.titolo}</Text>
      <Text className="text-xs uppercase tracking-wide text-muted-foreground">
        {t.preferiti.tipi.ristorante}
      </Text>

      <ScrollView contentContainerClassName="gap-3">
        {eventi.length === 0 ? (
          <Text className="py-4 text-base text-muted-foreground">
            {t.mappa.nessunEventoRistorante}
          </Text>
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

      <BottoneVetro onPress={onChiudi} altezza={48}>
        <Text>{t.calendario.chiudi}</Text>
      </BottoneVetro>
    </View>
  );
}

export default function Mappa() {
  const { coppiaId, ricarica: ricaricaCoppia } = useCoppia();
  const { luoghi, loading, aggiungi, segnaVisitato, elimina } = useLuoghi(coppiaId);
  const { session } = useAuth();
  const { c } = useTema();
  const { aperta: tastieraAperta } = useTastiera();

  const [scelto, setScelto] = React.useState<Luogo | null>(null);
  const [nuovo, setNuovo] = React.useState<{ lat: number; lng: number } | null>(null);
  const [nome, setNome] = React.useState('');
  const [visitato, setVisitato] = React.useState(true);
  const [attesa, setAttesa] = React.useState(false);
  const [errore, setErrore] = React.useState<string | null>(null);
  /** Dove guarda la mappa: cambia quando si sceglie un risultato di ricerca. */
  const [centro, setCentro] = React.useState<{ latitude: number; longitude: number } | null>(null);

  // --- i ristoranti sulla mappa (0012) --------------------------------------
  // Un ristorante si disegna solo se ha un posto; i suoi eventi arrivano dal
  // legame evento.elemento_id. Due letture in blocco, non una per pin.
  const [ristoranti, setRistoranti] = React.useState<RistoranteSuMappa[]>([]);
  const [eventiPerRistorante, setEventiPerRistorante] = React.useState<Record<string, Evento[]>>({});
  const [ristoranteAperto, setRistoranteAperto] = React.useState<RistoranteSuMappa | null>(null);

  React.useEffect(() => {
    (async () => {
      if (!coppiaId) {
        setRistoranti([]);
        setEventiPerRistorante({});
        return;
      }
      const [ris, evs] = await Promise.all([
        supabase
          .from('elemento_lista')
          .select('id, titolo, luogo:luogo_id(lat, lng)')
          .eq('coppia_id', coppiaId)
          .eq('tipo', 'ristorante')
          .not('luogo_id', 'is', null),
        supabase
          .from('evento')
          .select('*')
          .eq('coppia_id', coppiaId)
          .not('elemento_id', 'is', null)
          .order('inizio', { ascending: false }),
      ]);
      const righe = (ris.data ?? []) as unknown as {
        id: string;
        titolo: string;
        luogo: { lat: number; lng: number } | null;
      }[];
      setRistoranti(
        righe
          .filter((r) => r.luogo)
          .map((r) => ({ id: r.id, titolo: r.titolo, lat: r.luogo!.lat, lng: r.luogo!.lng }))
      );
      const mappa: Record<string, Evento[]> = {};
      for (const e of (evs.data ?? []) as Evento[]) {
        if (!e.elemento_id) continue;
        (mappa[e.elemento_id] ??= []).push(e);
      }
      setEventiPerRistorante(mappa);
    })();
  }, [coppiaId, luoghi]);

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

  const centroMappa =
    centro ??
    (luoghi[0]
      ? { latitude: luoghi[0].lat, longitude: luoghi[0].lng }
      : { latitude: 45.4642, longitude: 9.19 });

  return (
    <View className="flex-1">
      <Fondo />
      {!MAPPA_DISPONIBILE ? (
        // react-native-maps non esiste sul web: li' resta l'elenco, che e'
        // comunque il modo in cui si arriva agli eventi di un posto.
        <SafeAreaView className="flex-1" edges={['top']}>
          <View className="flex-1 gap-3 px-5 pt-2">
            <Text className="font-serif-bold text-3xl text-foreground">{t.tab.mappa}</Text>
            <Text className="text-sm text-muted-foreground">
              {Platform.OS === 'web' ? t.mappa.soloTelefono : t.mappa.senzaComponente}
            </Text>

            {/* La ricerca funziona anche senza componente mappa: senza mappa si
                puo' comunque cercare un posto e aggiungerlo all'elenco. */}
            <CercaLuogo
              onScegli={(l) => {
                setNuovo({ lat: l.lat, lng: l.lng });
                setNome(l.nome);
                setVisitato(false);
              }}
            />

            {Platform.OS !== 'web' && (
              <BottoneVetro onPress={segnaDoveSono} variante="accento">
                <Text>{t.mappa.segnaDoveSono}</Text>
              </BottoneVetro>
            )}

            <ScrollView
              contentContainerClassName="gap-2"
              contentContainerStyle={{ paddingBottom: SPAZIO_BARRA }}
              keyboardShouldPersistTaps="handled"
            >
              {luoghi.map((l) => (
                <Pressable key={l.id} onPress={() => setScelto(l)}>
                  <CartaVetro raggio={20}>
                    <View className="flex-row items-center gap-3 p-4">
                      <MapPin color={l.stato === 'visitato' ? c.accento : c.tenue} size={20} />
                      <Text className="flex-1 font-serif text-lg text-foreground">{l.nome}</Text>
                    </View>
                  </CartaVetro>
                </Pressable>
              ))}
              {/* Anche senza mappa i ristoranti col posto restano raggiungibili. */}
              {ristoranti.map((r) => (
                <Pressable key={`rist-${r.id}`} onPress={() => setRistoranteAperto(r)}>
                  <CartaVetro raggio={20}>
                    <View className="flex-row items-center gap-3 p-4">
                      <MapPin color="#d98e2b" size={20} />
                      <Text className="flex-1 font-serif text-lg text-foreground">{r.titolo}</Text>
                      <Text className="text-xs text-muted-foreground">
                        {t.preferiti.tipi.ristorante}
                      </Text>
                    </View>
                  </CartaVetro>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      ) : (
        <View className="flex-1">
          <MappaVera
            centro={centroMappa}
            luoghi={luoghi}
            ristoranti={ristoranti}
            onLuogo={(l) => setScelto(l)}
            onRistorante={(r) => setRistoranteAperto(r)}
            onPuntoNuovo={(p) => {
              setNuovo(p);
              setNome('');
              setVisitato(true);
            }}
          />

          {/* La ricerca galleggia sopra la mappa, come ci si aspetta. */}
          <SafeAreaView edges={['top']} style={{ position: 'absolute', left: 14, right: 14 }}>
            <CercaLuogo
              onScegli={(l) => {
                setCentro({ latitude: l.lat, longitude: l.lng });
                setNuovo({ lat: l.lat, lng: l.lng });
                setNome(l.nome);
                setVisitato(false);
              }}
            />
            {!tastieraAperta && (
              <Vetro raggio={16} ombra={false} style={{ marginTop: 8, alignSelf: 'center' }}>
                <Text className="px-3 py-1.5 text-[11px] text-muted-foreground">
                  {t.mappa.comeSiAggiunge}
                </Text>
              </Vetro>
            )}
          </SafeAreaView>

          {!tastieraAperta && (
            <View style={{ position: 'absolute', right: 20, bottom: SPAZIO_BARRA - 8 }}>
              <TondoVetro lato={58} onPress={segnaDoveSono}>
                <Crosshair color={c.accento} size={24} />
              </TondoVetro>
            </View>
          )}
        </View>
      )}

      {loading && (
        <View className="absolute inset-x-0 top-1/2 items-center">
          <ActivityIndicator color={c.accento} />
        </View>
      )}

      {/* Il posto scelto, con i suoi eventi */}
      <Modal
        visible={scelto !== null}
        animationType={Platform.OS === 'web' ? 'none' : 'slide'}
        transparent
        onRequestClose={() => setScelto(null)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(20,8,14,0.4)' }}>
          {scelto && (
            <CartaVetro raggio={30} style={{ margin: 8 }}>
              <SafeAreaView edges={['bottom']}>
                <EventiDelLuogo luogo={scelto} onChiudi={() => setScelto(null)} />
                {scelto.autore_id === session?.user.id && (
                  <View className="flex-row gap-2 px-6 pb-4">
                    <BottoneVetro
                      style={{ flex: 1 }}
                      altezza={48}
                      onPress={() => {
                        segnaVisitato(scelto.id, scelto.stato !== 'visitato');
                        setScelto(null);
                      }}
                    >
                      <Text>
                        {scelto.stato === 'visitato'
                          ? t.mappa.segnaDaVisitare
                          : t.mappa.segnaVisitato}
                      </Text>
                    </BottoneVetro>
                    <BottoneVetro
                      altezza={48}
                      variante="pericolo"
                      onPress={() => {
                        elimina(scelto.id);
                        setScelto(null);
                      }}
                    >
                      <Trash2 color={c.pericolo} size={18} />
                    </BottoneVetro>
                  </View>
                )}
              </SafeAreaView>
            </CartaVetro>
          )}
        </View>
      </Modal>

      {/* Il ristorante toccato: i suoi eventi, e da li' la pagina */}
      <Modal
        visible={ristoranteAperto !== null}
        animationType={Platform.OS === 'web' ? 'none' : 'slide'}
        transparent
        onRequestClose={() => setRistoranteAperto(null)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(20,8,14,0.4)' }}>
          {ristoranteAperto && (
            <CartaVetro raggio={30} style={{ margin: 8 }}>
              <SafeAreaView edges={['bottom']}>
                <EventiDelRistorante
                  ristorante={ristoranteAperto}
                  eventi={eventiPerRistorante[ristoranteAperto.id] ?? []}
                  onChiudi={() => setRistoranteAperto(null)}
                />
              </SafeAreaView>
            </CartaVetro>
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
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(20,8,14,0.4)' }}>
          <CartaVetro raggio={30} style={{ margin: 8 }}>
            <SafeAreaView edges={['bottom']}>
              <View className="gap-4 p-6">
                <Text className="font-serif-bold text-2xl text-foreground">
                  {t.mappa.nuovoTitolo}
                </Text>
                <Input
                  value={nome}
                  onChangeText={setNome}
                  placeholder={t.mappa.placeholderNome}
                  autoFocus
                />
                <View className="flex-row items-center justify-between">
                  <Text className="text-base text-foreground">{t.mappa.ciSiamoStati}</Text>
                  <Switch
                    value={visitato}
                    onValueChange={setVisitato}
                    trackColor={{ true: c.accento, false: undefined }}
                  />
                </View>
                {errore && <Text className="text-sm text-destructive">{errore}</Text>}
                <BottoneVetro
                  variante="accento"
                  disabled={attesa || nome.trim().length === 0}
                  onPress={salvaLuogo}
                >
                  <Text>{attesa ? t.onboarding.attesa : t.calendario.salva}</Text>
                </BottoneVetro>
                <BottoneVetro altezza={46} onPress={() => setNuovo(null)}>
                  <Text>{t.calendario.annulla}</Text>
                </BottoneVetro>
              </View>
            </SafeAreaView>
          </CartaVetro>
        </View>
      </Modal>

      {errore && !nuovo && (
        <Text className="absolute bottom-40 left-6 right-6 text-center text-sm text-destructive">
          {errore}
        </Text>
      )}
    </View>
  );
}
