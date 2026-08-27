import * as React from 'react';
import {
  View,
  ScrollView,
  Modal,
  Platform,
  ActivityIndicator,
  Pressable,
  Switch,
  KeyboardAvoidingView,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { MapPin, Plus, Trash2, UtensilsCrossed } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { BottoneVetro, CartaVetro, TondoVetro, Vetro } from '@/components/ui/vetro';
import { CercaLuogo } from '@/components/cerca-luogo';
import { Fondo } from '@/components/schermata';
import { SPAZIO_BARRA, SOPRA_BARRA } from '@/components/barra-volante';
import { AnteprimaEvento } from '@/components/anteprima-evento';
import { ElencoElementi } from '@/components/elenco-elementi';
import { MappaVera, MAPPA_DISPONIBILE, type RistoranteSuMappa } from '@/components/mappa-vera';
import { useAuth } from '@/lib/auth';
import { useCoppia } from '@/lib/coppia';
import { useLuoghi, type Luogo } from '@/lib/luoghi';
import { supabase } from '@/lib/supabase';
import { anteprimePerEvento } from '@/lib/foto';
import type { Evento } from '@/lib/eventi';
import { useTastiera } from '@/lib/tastiera';
import { useTema } from '@/lib/tema';
import { t } from '@/lib/i18n';

/**
 * La mappa: gli stessi eventi del calendario, guardati **nello spazio** (D-33).
 *
 * ⚠️ D-05, la decisione che vale piu' di ogni funzione: **nessun tracciamento**.
 * Un posto entra qui con un tocco lungo sulla mappa, con un "segna dove sono
 * adesso" premuto apposta, oppure cercandolo per nome; la posizione non viene
 * mai letta da sola, e nessuno dei due puo' sapere dove si trova l'altro in
 * questo momento.
 *
 * La **ricerca** non intacca questa regola: manda a Google il testo digitato e
 * nient'altro — nemmeno per ordinare i risultati per vicinanza, che pure li
 * migliorerebbe. Vedi `lib/ricerca-luoghi.ts`.
 *
 * ## L'anteprima al posto del foglio (2026-08-27)
 *
 * Toccando un pin non si apre piu' un foglio a tutta larghezza ma una **carta
 * in sovraimpressione** (`components/anteprima-evento.tsx`), che lascia vedere
 * la mappa sotto. Il foglio resta, ma solo dietro il tocco su "…" — perche'
 * contiene le azioni sul posto (segna visitato, elimina), che sono un'altra
 * cosa dal guardare cosa ci e' successo.
 *
 * ## Una lettura sola per tutti i pin
 *
 * Gli eventi di **tutti** i posti si leggono in blocco all'apertura, non un
 * posto per volta quando lo si tocca. Serve comunque: i pin devono sapere
 * *prima* se hanno eventi, perche' e' quello che li fa pieni invece che vuoti.
 * Chiedere al tocco avrebbe voluto dire pin tutti uguali piu' un'attesa a ogni
 * apertura.
 */

/** Il foglio del posto: quello che resta dietro il "…" dell'anteprima. */
function DettagliLuogo({
  luogo,
  eventi,
  onEvento,
  onChiudi,
}: {
  luogo: Luogo;
  eventi: Evento[];
  onEvento: (id: string) => void;
  onChiudi: () => void;
}) {
  const { c } = useTema();
  return (
    <View className="max-h-[70%] gap-3 p-6">
      <Text className="font-serif-bold text-2xl text-foreground">{luogo.nome}</Text>
      <Text className="text-xs uppercase tracking-wide text-muted-foreground">
        {luogo.stato === 'visitato' ? t.mappa.visitato : t.mappa.daVisitare}
      </Text>
      {!!luogo.nota && <Text className="text-base text-muted-foreground">{luogo.nota}</Text>}

      <ScrollView contentContainerClassName="gap-2">
        {eventi.length === 0 ? (
          <Text className="py-4 text-base text-muted-foreground">{t.mappa.nessunEvento}</Text>
        ) : (
          eventi.map((e) => (
            <Pressable
              key={e.id}
              onPress={() => onEvento(e.id)}
              className="flex-row items-center gap-3 rounded-2xl bg-muted p-3"
            >
              <MapPin color={c.accento} size={16} />
              <Text className="flex-1 font-serif text-base text-foreground">{e.titolo}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>

      <BottoneVetro onPress={onChiudi} altezza={48}>
        <Text>{t.calendario.chiudi}</Text>
      </BottoneVetro>
    </View>
  );
}

/** Cosa e' stato toccato: un posto della coppia, o un ristorante. */
type Toccato =
  | { tipo: 'luogo'; luogo: Luogo }
  | { tipo: 'ristorante'; ristorante: RistoranteSuMappa };

export default function Mappa() {
  const router = useRouter();
  const { coppiaId, ricarica: ricaricaCoppia } = useCoppia();
  const {
    luoghi,
    loading,
    aggiungi,
    segnaVisitato,
    elimina,
    ricarica: ricaricaLuoghi,
  } = useLuoghi(coppiaId);
  const { session } = useAuth();
  const { c } = useTema();
  const { aperta: tastieraAperta } = useTastiera();

  /**
   * Mappa o elenco.
   *
   * ⚠️ **L'elenco dei luoghi era in Liste** e da oggi vive qui (D-51). Un
   * elenco di posti e una mappa di posti sono due modi di guardare **la stessa
   * cosa**: tenerli in due sezioni diverse obbligava a ricordare in quale delle
   * due si fosse messo un posto, e a spostarsi fra le sezioni per una domanda
   * sola («dove siamo stati?»). Ora e' un interruttore.
   */
  const [vista, setVista] = React.useState<'mappa' | 'elenco'>('mappa');

  /** Il pin toccato: apre l'anteprima in sovraimpressione. */
  const [toccato, setToccato] = React.useState<Toccato | null>(null);
  /** Il foglio delle azioni sul posto, dietro il "…" dell'anteprima. */
  const [dettagli, setDettagli] = React.useState<Luogo | null>(null);

  const [nuovo, setNuovo] = React.useState<{ lat: number; lng: number } | null>(null);
  const [nome, setNome] = React.useState('');
  const [visitato, setVisitato] = React.useState(true);
  const [attesa, setAttesa] = React.useState(false);
  const [errore, setErrore] = React.useState<string | null>(null);
  /** Dove guarda la mappa: cambia quando si sceglie un risultato di ricerca. */
  const [centro, setCentro] = React.useState<{ latitude: number; longitude: number } | null>(null);

  // --- cosa e' successo, e dove --------------------------------------------
  const [ristoranti, setRistoranti] = React.useState<RistoranteSuMappa[]>([]);
  const [perLuogo, setPerLuogo] = React.useState<Record<string, Evento[]>>({});
  const [perRistorante, setPerRistorante] = React.useState<Record<string, Evento[]>>({});
  const [copertine, setCopertine] = React.useState<Record<string, string>>({});

  /**
   * ⚠️ **Rileggere all'apertura della schermata.**
   *
   * In un navigatore a tab le schermate restano montate, e questa ha la **sua**
   * copia di `useLuoghi`: cancellando un posto dalle Liste — che ora toglie
   * anche la riga `luogo` (B-11) — la mappa continuava a disegnare il pin,
   * perche' non aveva motivo di rileggere. Stessa forma del difetto B-09, in
   * un'altra schermata.
   *
   * `ricaricaLuoghi` dipende solo da `coppiaId`, quindi e' stabile e non
   * innesca il ciclo che ha prodotto B-10.
   */
  useFocusEffect(
    React.useCallback(() => {
      ricaricaLuoghi();
    }, [ricaricaLuoghi])
  );

  React.useEffect(() => {
    (async () => {
      if (!coppiaId) {
        setRistoranti([]);
        setPerLuogo({});
        setPerRistorante({});
        setCopertine({});
        return;
      }
      const [ris, evs] = await Promise.all([
        supabase
          .from('elemento_lista')
          .select('id, titolo, genere, luogo_id, luogo:luogo_id(lat, lng)')
          .eq('coppia_id', coppiaId)
          .eq('tipo', 'luogo')
          .not('luogo_id', 'is', null),
        // Tutti gli eventi che stanno **da qualche parte**: o hanno un posto, o
        // hanno un ristorante. Sono gli unici che la mappa puo' disegnare.
        supabase
          .from('evento')
          .select('*')
          .eq('coppia_id', coppiaId)
          .or('luogo_id.not.is.null,elemento_id.not.is.null')
          .order('inizio', { ascending: false }),
      ]);

      const righe = (ris.data ?? []) as unknown as {
        id: string;
        titolo: string;
        genere: string | null;
        luogo_id: string | null;
        luogo: { lat: number; lng: number } | null;
      }[];
      setRistoranti(
        righe
          .filter((r) => r.luogo)
          .map((r) => ({
            id: r.id,
            titolo: r.titolo,
            lat: r.luogo!.lat,
            lng: r.luogo!.lng,
            genere: r.genere,
            luogoId: r.luogo_id,
          }))
      );

      // ⚠️ Un evento puo' puntare al posto con `elemento_id` **o** con
      // `luogo_id`: quelli creati prima che il campo "dove" impostasse entrambi
      // hanno solo il secondo. La mappa disegna un pin per **luogo della
      // lista**, quindi le serate di quel pin sono l'unione dei due legami —
      // senza, un posto con tre serate mostrava un pin vuoto.
      const perPosto = new Map<string, string>();
      for (const r of righe) if (r.luogo_id) perPosto.set(r.luogo_id, r.id);

      const daLuogo: Record<string, Evento[]> = {};
      const daRistorante: Record<string, Evento[]> = {};
      for (const e of (evs.data ?? []) as Evento[]) {
        if (e.luogo_id) (daLuogo[e.luogo_id] ??= []).push(e);
        const idLista = e.elemento_id ?? (e.luogo_id ? perPosto.get(e.luogo_id) : undefined);
        if (idLista) (daRistorante[idLista] ??= []).push(e);
      }
      setPerLuogo(daLuogo);
      setPerRistorante(daRistorante);

      // Le copertine servono all'anteprima: una richiesta sola per tutti.
      const ids = (evs.data ?? []).map((e) => (e as Evento).id);
      setCopertine(await anteprimePerEvento(ids));
    })();
  }, [coppiaId, luoghi]);

  const contiLuogo = React.useMemo(
    () => Object.fromEntries(Object.entries(perLuogo).map(([k, v]) => [k, v.length])),
    [perLuogo]
  );
  const contiRistorante = React.useMemo(
    () => Object.fromEntries(Object.entries(perRistorante).map(([k, v]) => [k, v.length])),
    [perRistorante]
  );

  /**
   * I posti da disegnare come pin "semplici": quelli che **non** sono gia'
   * disegnati come luogo dei preferiti.
   *
   * ⚠️ Serve da 0016. Un posto scelto da Google crea due righe — una in `luogo`
   * (per la mappa) e una in `elemento_lista` (per la lista) — e finche' solo i
   * ristoranti finivano in lista la sovrapposizione era l'eccezione. Ora e' la
   * regola: senza questo filtro **ogni posto avrebbe due pin sovrapposti**, uno
   * col conto degli eventi e uno senza.
   */
  const luoghiSoli = React.useMemo(() => {
    const gia = new Set(ristoranti.map((r) => r.luogoId).filter(Boolean));
    return luoghi.filter((l) => !gia.has(l.id));
  }, [luoghi, ristoranti]);

  /**
   * All'apertura la mappa si mette **dove sei adesso**.
   *
   * ⚠️ Questo tocca **D-05**, che dice «la posizione non viene mai letta da
   * sola». La regola nasceva per una cosa precisa: impedire che uno dei due
   * possa sapere dove si trova l'altro. Qui non succede niente del genere —
   * la posizione **non viene scritta da nessuna parte, non viene mandata a
   * nessuno, non esce dal telefono**: serve solo a decidere dove puntare la
   * telecamera della mappa, e muore con la schermata.
   *
   * La sostanza di D-05 resta intatta: nessun tracciamento, nessuna posizione
   * in background, nessuna posizione condivisa. Quello che cambia e' la lettera
   * — «mai letta da sola» diventa «mai *registrata* o *condivisa* da sola» — ed
   * e' registrato come decisione invece che fatto di soppiatto.
   *
   * ⚠️ **Non si chiede il permesso solo per questo.** Si guarda se e' gia'
   * stato concesso (per «segna dove sono adesso»): se non lo e', la mappa parte
   * dove partiva prima. Un'app che chiede la posizione appena apri una
   * schermata, senza che tu abbia chiesto niente, insegna a negare il permesso.
   */
  const [partenzaFatta, setPartenzaFatta] = React.useState(false);
  React.useEffect(() => {
    if (partenzaFatta || centro) return;
    (async () => {
      setPartenzaFatta(true);
      const p = await Location.getForegroundPermissionsAsync();
      if (!p.granted) return;
      try {
        const dove = await Location.getLastKnownPositionAsync();
        const usa = dove ?? (await Location.getCurrentPositionAsync({}));
        if (usa) setCentro({ latitude: usa.coords.latitude, longitude: usa.coords.longitude });
      } catch {
        // Nessuna posizione disponibile: la mappa parte dove partiva prima.
      }
    })();
  }, [partenzaFatta, centro]);

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

  const eventiToccati = !toccato
    ? []
    : toccato.tipo === 'luogo'
      ? (perLuogo[toccato.luogo.id] ?? [])
      : (perRistorante[toccato.ristorante.id] ?? []);

  const apriEvento = (id: string) => {
    setToccato(null);
    setDettagli(null);
    router.push({ pathname: '/evento/[id]', params: { id } });
  };

  return (
    <View className="flex-1">
      <Fondo />
      {/* --- l'interruttore fra le due viste ------------------------------
          Sta in alto, di vetro, sopra la mappa: e' un comando, e i comandi di
          questa schermata galleggiano tutti. */}
      {MAPPA_DISPONIBILE && !tastieraAperta && (
        <SafeAreaView
          edges={['top']}
          pointerEvents="box-none"
          style={{ position: 'absolute', left: 0, right: 0, top: 0, zIndex: 20 }}
        >
          <Vetro raggio={20} style={{ alignSelf: 'center', marginTop: 4 }}>
            <View className="flex-row p-1">
              {(['mappa', 'elenco'] as const).map((v) => (
                <Pressable
                  key={v}
                  onPress={() => setVista(v)}
                  style={{
                    paddingHorizontal: 18,
                    paddingVertical: 7,
                    borderRadius: 16,
                    backgroundColor: vista === v ? c.aloneForte : 'transparent',
                  }}
                >
                  <Text
                    className="text-sm"
                    style={{
                      color: vista === v ? c.accento : c.tenue,
                      fontWeight: vista === v ? '700' : '500',
                    }}
                  >
                    {t.mappa.viste[v]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Vetro>
        </SafeAreaView>
      )}

      {MAPPA_DISPONIBILE && vista === 'elenco' ? (
        <SafeAreaView className="flex-1" edges={['top']}>
          {/* Lo spazio in cima lascia passare l'interruttore, che galleggia. */}
          <View style={{ height: 52 }} />
          <ElencoElementi tipo="luogo" />
        </SafeAreaView>
      ) : !MAPPA_DISPONIBILE ? (
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
              contentContainerStyle={{ paddingBottom: SPAZIO_BARRA + 100 }}
              keyboardShouldPersistTaps="handled"
            >
              {luoghi.map((l) => (
                <Pressable key={l.id} onPress={() => setToccato({ tipo: 'luogo', luogo: l })}>
                  <CartaVetro raggio={20}>
                    <View className="flex-row items-center gap-3 p-4">
                      <MapPin color={l.stato === 'visitato' ? c.accento : c.tenue} size={20} />
                      <Text className="flex-1 font-serif text-lg text-foreground">{l.nome}</Text>
                      {(contiLuogo[l.id] ?? 0) > 0 && (
                        <Text className="text-xs text-muted-foreground">{contiLuogo[l.id]}</Text>
                      )}
                    </View>
                  </CartaVetro>
                </Pressable>
              ))}
              {/* Anche senza mappa i ristoranti col posto restano raggiungibili. */}
              {ristoranti.map((r) => (
                <Pressable
                  key={`rist-${r.id}`}
                  onPress={() => setToccato({ tipo: 'ristorante', ristorante: r })}
                >
                  <CartaVetro raggio={20}>
                    <View className="flex-row items-center gap-3 p-4">
                      <UtensilsCrossed color={c.ambra} size={20} />
                      <Text className="flex-1 font-serif text-lg text-foreground">{r.titolo}</Text>
                      {(contiRistorante[r.id] ?? 0) > 0 && (
                        <Text className="text-xs text-muted-foreground">
                          {contiRistorante[r.id]}
                        </Text>
                      )}
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
            luoghi={luoghiSoli}
            ristoranti={ristoranti}
            eventiPerLuogo={contiLuogo}
            eventiPerRistorante={contiRistorante}
            // Quando l'anteprima e' aperta la mappa "utile" e' piu' corta: senza,
            // il pin scelto puo' finire proprio sotto la carta appena comparsa.
            spazioSotto={SPAZIO_BARRA - 20 + (toccato ? 110 : 0)}
            onLuogo={(l) => setToccato({ tipo: 'luogo', luogo: l })}
            onRistorante={(r) => setToccato({ tipo: 'ristorante', ristorante: r })}
            onPuntoNuovo={(p) => {
              setNuovo(p);
              setNome('');
              setVisitato(true);
            }}
          />

          {/* ⚠️ **Niente barra di ricerca qui** (2026-08-27).
              Cercare un posto per nome e' un'azione da *lista*, e in Liste c'e'
              ora il suo "+". Tenerne una copia anche qui significava due
              ingressi per la stessa cosa, e soprattutto un campo di testo
              permanente addosso alla mappa — che di spazio ne ha bisogno tutto.
              Sulla mappa restano i due gesti che solo qui hanno senso, perche'
              parlano di *questo punto*: il tocco lungo e «segna dove sono». */}
          <SafeAreaView edges={['top']} style={{ position: 'absolute', left: 14, right: 14 }}>
            {!tastieraAperta && !toccato && (
              <Vetro raggio={16} ombra={false} style={{ alignSelf: 'center' }}>
                <Text className="px-3 py-1.5 text-[11px] text-muted-foreground">
                  {t.mappa.comeSiAggiunge}
                </Text>
              </Vetro>
            )}
          </SafeAreaView>

          {/* ⚠️ Un **«+»**, non un mirino (2026-08-27).
              Il tondo in basso a destra fa la stessa cosa in tutte le schermate
              — calendario, galleria, Liste — e in tutte e' un «+». Qui era un
              mirino perche' faceva una cosa sola: «segna dove sono». Ma il
              gesto che l'utente cerca in quell'angolo e' *aggiungere*, non
              *localizzare*, e un'icona diversa per lo stesso posto e lo stesso
              scopo costringe a ricordare che qui e' un'eccezione.
              Cosa aggiunge resta la stessa cosa di prima: il posto in cui sei
              adesso — e' l'unico modo di aggiungere che abbia senso *sulla
              mappa*, perche' parla di questo punto. Per nome si aggiunge
              dall'elenco, che e' a un tocco da qui. */}
          {!tastieraAperta && !toccato && (
            <View style={{ position: 'absolute', right: 20, bottom: SOPRA_BARRA }}>
              <TondoVetro lato={58} onPress={segnaDoveSono}>
                <Plus color={c.accento} size={26} />
              </TondoVetro>
            </View>
          )}
        </View>
      )}

      {/* --- l'anteprima in sovraimpressione ------------------------------- */}
      {toccato && (
        <AnteprimaEvento
          titoloLuogo={toccato.tipo === 'luogo' ? toccato.luogo.nome : toccato.ristorante.titolo}
          eventi={eventiToccati}
          copertine={copertine}
          onApri={(e) => apriEvento(e.id)}
          // Il "…" c'e' solo sui posti: un ristorante non si segna visitato e
          // non si elimina da qui — vive nei preferiti, e sarebbe un secondo
          // posto da cui cancellarlo.
          onDettagli={
            toccato.tipo === 'luogo'
              ? ((posto) => () => setDettagli(posto))(toccato.luogo)
              : undefined
          }
          onChiudi={() => setToccato(null)}
          style={{ position: 'absolute', left: 14, right: 14, bottom: SOPRA_BARRA }}
        />
      )}

      {loading && (
        <View className="absolute inset-x-0 top-1/2 items-center">
          <ActivityIndicator color={c.accento} />
        </View>
      )}

      {/* Il foglio del posto: elenco completo e azioni. */}
      <Modal
        visible={dettagli !== null}
        animationType={Platform.OS === 'web' ? 'none' : 'slide'}
        transparent
        onRequestClose={() => setDettagli(null)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(20,8,14,0.4)' }}>
          {dettagli && (
            <CartaVetro raggio={30} style={{ margin: 8 }}>
              <SafeAreaView edges={['bottom']}>
                <DettagliLuogo
                  luogo={dettagli}
                  eventi={perLuogo[dettagli.id] ?? []}
                  onEvento={apriEvento}
                  onChiudi={() => setDettagli(null)}
                />
                {dettagli.autore_id === session?.user.id && (
                  <View className="flex-row gap-2 px-6 pb-4">
                    <BottoneVetro
                      style={{ flex: 1 }}
                      altezza={48}
                      onPress={() => {
                        segnaVisitato(dettagli.id, dettagli.stato !== 'visitato');
                        setDettagli(null);
                        setToccato(null);
                      }}
                    >
                      <Text>
                        {dettagli.stato === 'visitato'
                          ? t.mappa.segnaDaVisitare
                          : t.mappa.segnaVisitato}
                      </Text>
                    </BottoneVetro>
                    <BottoneVetro
                      altezza={48}
                      variante="pericolo"
                      onPress={() => {
                        elimina(dettagli.id);
                        setDettagli(null);
                        setToccato(null);
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

      {/* Il posto nuovo: nome e se ci siete gia' stati */}
      <Modal
        visible={nuovo !== null}
        animationType={Platform.OS === 'web' ? 'none' : 'slide'}
        transparent
        onRequestClose={() => setNuovo(null)}
      >
        {/* ⚠️ `KeyboardAvoidingView`, che qui mancava: il campo del nome apre
            la tastiera da solo (`autoFocus`), e senza questo i tasti coprivano
            l'interruttore «ci siamo stati» e i due bottoni — cioe' tutto quello
            che serve per finire. Il foglio sale con la tastiera invece di
            restare fermo sotto. */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(20,8,14,0.4)' }}
        >
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
        </KeyboardAvoidingView>
      </Modal>

      {errore && !nuovo && (
        <Text className="absolute bottom-40 left-6 right-6 text-center text-sm text-destructive">
          {errore}
        </Text>
      )}
    </View>
  );
}
