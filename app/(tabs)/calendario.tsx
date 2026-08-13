import * as React from 'react';
import {
  View,
  ScrollView,
  FlatList,
  Modal,
  Switch,
  Platform,
  ActivityIndicator,
  Pressable,
  KeyboardAvoidingView,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarPlus, ChevronLeft, ChevronRight, Plus } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RigaEvento, aspetto } from '@/components/riga-evento';
import { CercaLuogo } from '@/components/cerca-luogo';
import { BottoneVetro, CartaVetro, TondoVetro, Vetro } from '@/components/ui/vetro';
import { Fondo } from '@/components/schermata';
import { SPAZIO_BARRA } from '@/components/barra-volante';
import { useTastiera } from '@/lib/tastiera';
import { useTema } from '@/lib/tema';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useCoppia } from '@/lib/coppia';
import { useLuoghi } from '@/lib/luoghi';
import { usePreferiti } from '@/lib/preferiti';
import { anteprimePerEvento } from '@/lib/foto';
import {
  useEventi,
  eventiDelGiorno,
  eventiDelMese,
  TIPI,
  type Evento,
  type TipoEvento,
} from '@/lib/eventi';
import {
  grigliaMese,
  iniziali,
  inizioGiorno,
  inizioSettimana,
  aggiungiGiorni,
  giorniDaOggi,
  mesiDellAnno,
  scorri,
  stessoGiorno,
  stessoMese,
  titoloPeriodo,
  type Vista,
} from '@/lib/date';
import { lingua, t } from '@/lib/i18n';

const VISTE: Vista[] = ['giorni', 'mese', 'anno', 'eventi'];

/** "oggi", "domani", "fra 4 giorni", "2 giorni fa": il conto che serve davvero. */
function contatoreGiorni(e: Evento) {
  const n = giorniDaOggi(new Date(e.inizio));
  if (n === 0) return t.calendario.conto.oggi;
  if (n === 1) return t.calendario.conto.domani;
  if (n === -1) return t.calendario.conto.ieri;
  return n > 0 ? t.calendario.conto.fra(n) : t.calendario.conto.fa(-n);
}
const LARGHEZZA = Dimensions.get('window').width;
/** Oltre questo trascinamento (o questa velocita') il periodo cambia davvero. */
const SOGLIA = LARGHEZZA / 4;
const VELOCITA = 0.4;
/** Giorni disegnati a destra e a sinistra nella striscia. Un anno per lato:
 *  la FlatList monta solo cio' che si vede, quindi 730 celle costano quanto 10. */
const RAGGIO_STRISCIA = 365;
const LARGHEZZA_CELLA = LARGHEZZA / 7;

/** Una cella della griglia: numero, e i pallini di cio' che succede quel giorno. */
function Cella({
  giorno,
  selezionato,
  oggi,
  fuori,
  eventi,
  onPress,
}: {
  giorno: Date;
  selezionato: boolean;
  oggi: boolean;
  fuori: boolean;
  eventi: Evento[];
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="flex-1 items-center py-1.5">
      <View
        className={cn(
          'h-9 w-9 items-center justify-center rounded-full',
          selezionato && 'bg-primary',
          !selezionato && oggi && 'border border-primary'
        )}
      >
        <Text
          className={cn(
            'text-base',
            selezionato
              ? 'text-primary-foreground'
              : fuori
                ? 'text-muted-foreground/40'
                : 'text-foreground'
          )}
        >
          {giorno.getDate()}
        </Text>
      </View>
      {/* Un pallino per evento, fino a tre: il colore dice gia' di che si tratta. */}
      <View className="mt-1 h-1.5 flex-row gap-0.5">
        {eventi.slice(0, 3).map((e) => (
          <View
            key={e.id}
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: selezionato ? 'transparent' : aspetto(e).colore }}
          />
        ))}
      </View>
    </Pressable>
  );
}

export default function Calendario() {
  const router = useRouter();
  const { session } = useAuth();
  const { coppiaId, ricarica: ricaricaCoppia } = useCoppia();
  const { eventi, loading, errore, ricarica, aggiungi, aggiorna, elimina } = useEventi(coppiaId);
  // I posti servono qui per legare un evento a un luogo: e' cio' che lo fa
  // comparire anche sulla mappa (D-33). `aggiungi` serve alla ricerca: un posto
  // scelto fra i risultati va prima creato, poi legato.
  const { luoghi, aggiungi: aggiungiLuogo } = useLuoghi(coppiaId);
  // I ristoranti dei preferiti: un evento puo' averne uno (0012).
  const { elementi } = usePreferiti(coppiaId);
  const ristoranti = React.useMemo(
    () => elementi.filter((e) => e.tipo === 'ristorante'),
    [elementi]
  );

  // Si torna qui dalla pagina dell'evento quando si vuole modificarlo: il
  // foglio di modifica e' uno solo, e vive dove si creano gli eventi.
  const { modifica } = useLocalSearchParams<{ modifica?: string }>();

  const [vista, setVista] = React.useState<Vista>('mese');
  const [giorno, setGiorno] = React.useState(() => inizioGiorno(new Date()));
  const [dettaglio, setDettaglio] = React.useState<Date | null>(null);
  /** L'evento che si sta modificando: il foglio e' lo stesso della creazione. */
  const [inModifica, setInModifica] = React.useState<Evento | null>(null);

  const [aperto, setAperto] = React.useState(false);
  const [titolo, setTitolo] = React.useState('');
  const [tipo, setTipo] = React.useState<TipoEvento>('impegno');
  const [quandoNuovo, setQuandoNuovo] = React.useState(() => new Date());
  const [ritorno, setRitorno] = React.useState(() => new Date());
  const [testoData, setTestoData] = React.useState('');
  const [testoRitorno, setTestoRitorno] = React.useState('');
  const [tuttoIlGiorno, setTuttoIlGiorno] = React.useState(false);
  const [nota, setNota] = React.useState('');
  const [luogoId, setLuogoId] = React.useState<string | null>(null);
  const [elementoId, setElementoId] = React.useState<string | null>(null);
  /** Nome del posto appena creato dalla ricerca: serve solo a dirlo a schermo. */
  const [luogoCercato, setLuogoCercato] = React.useState<string | null>(null);
  const tema = useTema();
  const { aperta: tastieraAperta } = useTastiera();
  const [attesa, setAttesa] = React.useState(false);
  const [erroreForm, setErroreForm] = React.useState<string | null>(null);

  const oggi = inizioGiorno(new Date());
  const delGiorno = React.useMemo(() => eventiDelGiorno(eventi, giorno), [eventi, giorno]);

  // Per la vista dei soli eventi: cio' che deve venire in ordine di arrivo, e
  // cio' che e' passato dal piu' recente. Una vacanza si considera "in arrivo"
  // finche' non e' finita, non finche' non e' cominciata.
  const inArrivo = React.useMemo(
    () =>
      eventi
        .filter((e) => giorniDaOggi(new Date(e.fine ?? e.inizio)) >= 0)
        .sort((a, b) => new Date(a.inizio).getTime() - new Date(b.inizio).getTime()),
    [eventi]
  );
  const passati = React.useMemo(
    () =>
      eventi
        .filter((e) => giorniDaOggi(new Date(e.fine ?? e.inizio)) < 0)
        .sort((a, b) => new Date(b.inizio).getTime() - new Date(a.inizio).getTime()),
    [eventi]
  );
  const delDettaglio = React.useMemo(
    () => (dettaglio ? eventiDelGiorno(eventi, dettaglio) : []),
    [eventi, dettaglio]
  );

  // La striscia e' ancorata a **oggi**, non al giorno scelto: cosi' non si
  // ricostruisce a ogni tocco e la posizione non salta sotto il dito.
  const partenzaStriscia = React.useMemo(
    () => aggiungiGiorni(inizioSettimana(inizioGiorno(new Date())), -RAGGIO_STRISCIA),
    []
  );
  const settimana = React.useMemo(
    () => Array.from({ length: RAGGIO_STRISCIA * 2 }, (_, i) => aggiungiGiorni(partenzaStriscia, i)),
    [partenzaStriscia]
  );
  const striscia = React.useRef<FlatList<Date>>(null);

  /** Indice del giorno scelto dentro la striscia. */
  const indiceGiorno = React.useMemo(
    () =>
      Math.round((inizioGiorno(giorno).getTime() - partenzaStriscia.getTime()) / 86_400_000),
    [giorno, partenzaStriscia]
  );

  // Portare la striscia sul giorno scelto quando cambia **da fuori** (frecce,
  // salvataggio). B-06: con lo ScrollView era uno scrollTo a timeout zero, che
  // sul telefono partiva PRIMA che la striscia fosse misurata: non faceva
  // nulla, e la striscia restava ferma a 60 giorni fa — "i giorni nascosti".
  // La FlatList con getItemLayout sa le posizioni SENZA misurare: lo scroll e'
  // deterministico anche al primo fotogramma.
  React.useEffect(() => {
    if (vista !== 'giorni') return;
    striscia.current?.scrollToIndex({
      index: Math.max(0, indiceGiorno),
      viewOffset: 3 * LARGHEZZA_CELLA,
      animated: false,
    });
  }, [vista, indiceGiorno]);
  const apertoDaParametro = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!modifica || apertoDaParametro.current === modifica) return;
    const e = eventi.find((x) => x.id === modifica);
    if (!e) return;
    apertoDaParametro.current = modifica;
    apriForm(e);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modifica, eventi]);

  // Le anteprime servono solo alla vista "eventi", ed e' li' che si chiedono:
  // altrove sarebbero richieste di rete per immagini che nessuno guarda.
  const [anteprime, setAnteprime] = React.useState<Record<string, string>>({});
  const idsElenco = vista === 'eventi' ? eventi.map((e) => e.id).join(',') : '';
  React.useEffect(() => {
    if (!idsElenco) return;
    anteprimePerEvento(idsElenco.split(',')).then(setAnteprime);
  }, [idsElenco]);

  const griglia = React.useMemo(() => grigliaMese(giorno), [giorno]);
  const etichette = React.useMemo(() => iniziali(lingua), []);

  // --- scorrimento col dito -------------------------------------------------
  // Su un telefono le frecce sono il ripiego, non il gesto naturale: si passa
  // da un mese all'altro trascinando. PanResponder e Animated stanno gia'
  // dentro React Native: nessuna libreria in piu' per Expo Go (D-23).
  const spostamento = React.useRef(new Animated.Value(0)).current;

  /**
   * Il periodo cambia **subito**; l'animazione fa solo entrare il contenuto
   * nuovo dal lato giusto. L'avevo scritta al contrario — cambio dentro la
   * callback di fine animazione — e le frecce smettevano di funzionare ovunque
   * l'animazione non completasse. **Lo stato non deve mai dipendere dal
   * completamento di un'animazione**, che puo' essere interrotta o disattivata.
   */
  const vai = React.useCallback(
    (verso: 1 | -1) => {
      setGiorno((g) => scorri(g, vista, verso));
      spostamento.setValue(verso * LARGHEZZA * 0.35);
      Animated.timing(spostamento, {
        toValue: 0,
        duration: 170,
        useNativeDriver: true,
      }).start();
    },
    [spostamento, vista]
  );

  // Nella settimana si scorre a mano lungo la striscia dei giorni: il gesto
  // orizzontale appartiene a lei, non al cambio di periodo.
  const pan = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          vista !== 'giorni' &&
          Math.abs(g.dx) > 12 &&
          Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderMove: (_, g) => spostamento.setValue(g.dx),
        onPanResponderRelease: (_, g) => {
          if (g.dx < -SOGLIA || g.vx < -VELOCITA) vai(1);
          else if (g.dx > SOGLIA || g.vx > VELOCITA) vai(-1);
          else Animated.spring(spostamento, { toValue: 0, useNativeDriver: true }).start();
        },
        onPanResponderTerminate: () =>
          Animated.spring(spostamento, { toValue: 0, useNativeDriver: true }).start(),
      }),
    [spostamento, vai, vista]
  );

  /** Primo tocco sceglie il giorno, secondo tocco lo apre: come sui calendari veri. */
  function tocca(d: Date) {
    if (stessoGiorno(d, giorno)) setDettaglio(d);
    else setGiorno(d);
  }

  /** Lo stesso foglio serve a creare e a modificare: cambia solo cosa contiene. */
  function apriForm(e?: Evento) {
    const base = e ? new Date(e.inizio) : new Date(giorno);
    if (!e) base.setHours(new Date().getHours() + 1, 0, 0, 0);
    const dopo = e?.fine ? new Date(e.fine) : aggiungiGiorni(base, 7);

    setInModifica(e ?? null);
    setTitolo(e?.titolo ?? '');
    setNota(e?.nota ?? '');
    setTipo((e?.tipo as TipoEvento) ?? 'impegno');
    setLuogoId(e?.luogo_id ?? null);
    setElementoId(e?.elemento_id ?? null);
    setTuttoIlGiorno(e?.tutto_il_giorno ?? false);
    setQuandoNuovo(base);
    setRitorno(dopo);
    setTestoData(perCampoTesto(base));
    setTestoRitorno(perCampoTesto(dopo));
    setErroreForm(null);
    setAperto(true);
  }

  async function salva() {
    setErroreForm(null);
    const data = Platform.OS === 'web' ? daCampoTesto(testoData) : quandoNuovo;
    if (!data) return setErroreForm(t.calendario.dataNonValida);

    let fine: Date | null = null;
    if (tipo === 'vacanza') {
      fine = Platform.OS === 'web' ? daCampoTesto(testoRitorno) : ritorno;
      if (!fine) return setErroreForm(t.calendario.dataNonValida);
      if (fine < data) return setErroreForm(t.calendario.ritornoPrima);
    }

    const dati = {
      titolo,
      inizio: data,
      fine,
      tuttoIlGiorno: tipo === 'vacanza' || tuttoIlGiorno,
      tipo,
      nota,
      luogoId,
      elementoId,
    };

    setAttesa(true);
    const err = inModifica
      ? await aggiorna(inModifica.id, dati)
      : await aggiungi(dati, ricaricaCoppia);
    setAttesa(false);
    if (err) return setErroreForm(err);
    setGiorno(inizioGiorno(data)); // si va a vedere dove e' finito
    setAperto(false);
    setInModifica(null);
  }

  return (
    <View className="flex-1">
      <Fondo />
      <SafeAreaView className="flex-1" edges={['top']}>
      <View className="flex-row items-center justify-end px-6 pt-2">
        <Pressable
          onPress={() => router.push('/importa')}
          hitSlop={8}
          className="flex-row items-center gap-2"
        >
          <CalendarPlus color={tema.c.tenue} size={20} />
          <Text className="text-sm text-muted-foreground">{t.importa.apri}</Text>
        </Pressable>
      </View>

      {/* Il selettore della vista sta fuori dallo scorrimento: e' un comando,
          non contenuto, e non deve scappare via col dito. */}
      <View className="flex-row gap-2 px-6 pb-1 pt-2">
        {VISTE.map((v) => (
          <Pressable
            key={v}
            onPress={() => setVista(v)}
            className={cn(
              'flex-1 items-center rounded-full py-2',
              vista === v ? 'bg-primary' : 'bg-card'
            )}
          >
            <Text
              className={cn(
                'text-sm',
                vista === v ? 'text-primary-foreground' : 'text-muted-foreground'
              )}
            >
              {t.calendario.viste[v]}
            </Text>
          </Pressable>
        ))}
      </View>

      <Animated.View
        {...pan.panHandlers}
        style={{ transform: [{ translateX: spostamento }] }}
        className="pb-1"
      >
        {/* Nella vista dei soli eventi non c'e' un periodo da scorrere: le
            frecce sparirebbero comunque senza niente da fare. */}
        {vista === 'eventi' ? (
          <View className="items-center px-6 py-2">
            <Text className="font-serif-bold text-2xl text-foreground">
              {t.calendario.tuttiGliEventi}
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center justify-between px-6 py-2">
            <Pressable onPress={() => vai(-1)} hitSlop={12}>
              <ChevronLeft color={tema.c.tenue} size={26} />
            </Pressable>
            <Pressable onPress={() => setGiorno(oggi)}>
              <Text className="font-serif-bold text-2xl capitalize text-foreground">
                {titoloPeriodo(giorno, vista, lingua)}
              </Text>
            </Pressable>
            <Pressable onPress={() => vai(1)} hitSlop={12}>
              <ChevronRight color={tema.c.tenue} size={26} />
            </Pressable>
          </View>
        )}

        {vista === 'giorni' && (
          /* Striscia continua: si scorre di quanto si vuole, non di sette in
             sette — le frecce saltano la settimana, il dito va dove gli pare.
             Qui nessun giorno e' "fuori": sbiadire gli altri mesi ha senso in
             una griglia mensile, in una striscia che li attraversa tutti
             renderebbe illeggibile meta' dei numeri. */
          <FlatList
            ref={striscia}
            data={settimana}
            horizontal
            showsHorizontalScrollIndicator={false}
            // Altezza FISSA: senza, su iOS la lista orizzontale contendeva lo
            // spazio verticale con l'elenco sottostante e i numeri finivano
            // coperti. Un'altezza dichiarata non ha niente da negoziare.
            style={{ height: 84, flexGrow: 0 }}
            contentContainerStyle={{ alignItems: 'flex-start' }}
            keyExtractor={(d) => d.toISOString()}
            getItemLayout={(_, i) => ({
              length: LARGHEZZA_CELLA,
              offset: i * LARGHEZZA_CELLA,
              index: i,
            })}
            initialScrollIndex={Math.max(0, indiceGiorno - 3)}
            initialNumToRender={9}
            windowSize={5}
            snapToInterval={LARGHEZZA_CELLA}
            decelerationRate="normal"
            onScrollToIndexFailed={() => {}}
            renderItem={({ item: d }) => (
              <View style={{ width: LARGHEZZA_CELLA }}>
                <Text className="text-center text-xs uppercase text-muted-foreground">
                  {d.getDate() === 1
                    ? d.toLocaleDateString(lingua, { month: 'short' })
                    : d.toLocaleDateString(lingua, { weekday: 'short' })}
                </Text>
                <Cella
                  giorno={d}
                  selezionato={stessoGiorno(d, giorno)}
                  oggi={stessoGiorno(d, oggi)}
                  fuori={false}
                  eventi={eventiDelGiorno(eventi, d)}
                  /* Nella striscia si **naviga fra i giorni**: toccarne uno lo
                     sceglie e il suo programma compare qui sotto, nella stessa
                     schermata. Un foglio che si apre sarebbe un passaggio di
                     troppo per un gesto che si ripete decine di volte. */
                  onPress={() => setGiorno(d)}
                />
              </View>
            )}
          />
        )}

        {vista === 'anno' && (
          /* L'anno serve a **ritrovare**: dove stanno le vacanze, in che mese
             cadeva quella cosa. Non serve il dettaglio dei giorni, serve il
             peso di ogni mese — quante cose, e di che colore. */
          <View className="flex-row flex-wrap px-3">
            {mesiDellAnno(giorno).map((m) => {
              const suoi = eventiDelMese(eventi, m);
              return (
                <Pressable
                  key={m.toISOString()}
                  className="w-1/3 p-1.5"
                  onPress={() => {
                    setGiorno(m);
                    setVista('mese');
                  }}
                >
                  <View
                    className={cn(
                      'items-center gap-1 rounded-2xl bg-card p-3',
                      stessoMese(m, oggi) && 'border border-primary'
                    )}
                  >
                    <Text className="font-serif text-base capitalize text-foreground">
                      {m.toLocaleDateString(lingua, { month: 'long' })}
                    </Text>
                    <Text className="text-[10px] text-muted-foreground">
                      {suoi.length === 0
                        ? t.calendario.nessunImpegno
                        : suoi.length === 1
                          ? t.calendario.unImpegno
                          : t.calendario.impegni(suoi.length)}
                    </Text>
                    <View className="h-1.5 flex-row gap-0.5">
                      {suoi.slice(0, 5).map((e) => (
                        <View
                          key={e.id}
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: aspetto(e).colore }}
                        />
                      ))}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {vista === 'mese' && (
          <View className="px-4">
            <View className="flex-row">
              {etichette.map((g) => (
                <Text
                  key={g}
                  className="flex-1 text-center text-xs uppercase text-muted-foreground"
                >
                  {g}
                </Text>
              ))}
            </View>
            {Array.from({ length: 6 }, (_, r) => (
              <View key={r} className="flex-row">
                {griglia.slice(r * 7, r * 7 + 7).map((d) => (
                  <Cella
                    key={d.toISOString()}
                    giorno={d}
                    selezionato={stessoGiorno(d, giorno)}
                    oggi={stessoGiorno(d, oggi)}
                    fuori={!stessoMese(d, giorno)}
                    eventi={eventiDelGiorno(eventi, d)}
                    onPress={() => tocca(d)}
                  />
                ))}
              </View>
            ))}
          </View>
        )}

        {vista !== 'eventi' && (
          <Pressable onPress={() => setDettaglio(giorno)}>
            <Text className="px-6 pb-2 pt-4 text-xs uppercase tracking-wide text-muted-foreground">
              {giorno.toLocaleDateString(lingua, { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </Pressable>
        )}
      </Animated.View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={tema.c.accento} />
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-3 px-6 pb-32">
          {errore && (
            <View className="w-full gap-2 rounded-2xl bg-card p-4">
              <Text className="text-sm text-destructive">{errore}</Text>
              <Button variant="outline" onPress={() => ricarica()}>
                <Text>{t.home.riprova}</Text>
              </Button>
            </View>
          )}

          {!errore && (vista === 'eventi' ? eventi.length === 0 : delGiorno.length === 0) && (
            <View className="items-center gap-2 py-10">
              <Text className="font-serif text-lg text-foreground">{t.calendario.vuotoTitolo}</Text>
              <Text className="max-w-xs text-center text-sm text-muted-foreground">
                {t.calendario.vuotoTesto}
              </Text>
            </View>
          )}

          {/* Vista "eventi": niente giorni, solo le cose — quelle che devono
              venire in ordine di arrivo, quelle passate dalla piu' recente.
              Ognuna dice **quanto manca** o **quanto e' passata**, che e' la
              domanda vera quando si guarda un elenco cosi'. */}
          {vista === 'eventi'
            ? [...inArrivo, ...passati].map((e, i) => (
                <View key={e.id} className="gap-2">
                  {i === 0 && inArrivo.length > 0 && (
                    <Text className="pt-2 text-xs uppercase tracking-wide text-muted-foreground">
                      {t.calendario.inArrivo}
                    </Text>
                  )}
                  {i === inArrivo.length && passati.length > 0 && (
                    <Text className="pt-4 text-xs uppercase tracking-wide text-muted-foreground">
                      {t.calendario.passati}
                    </Text>
                  )}
                  <RigaEvento
                    e={e}
                    mio={e.autore_id === session?.user.id}
                    onElimina={() => elimina(e.id)}
                    onPress={() => router.push({ pathname: '/evento/[id]', params: { id: e.id } })}
                    contatore={contatoreGiorni(e)}
                    anteprima={anteprime[e.id]}
                  />
                </View>
              ))
            : delGiorno.map((e) => (
                <RigaEvento
                  key={e.id}
                  e={e}
                  mio={e.autore_id === session?.user.id}
                  onElimina={() => elimina(e.id)}
                  onPress={() => router.push({ pathname: '/evento/[id]', params: { id: e.id } })}
                />
              ))}
        </ScrollView>
      )}

      {!tastieraAperta && (
        <View style={{ position: 'absolute', right: 20, bottom: SPAZIO_BARRA - 8 }}>
          <TondoVetro lato={58} onPress={() => apriForm()}>
            <Plus color={tema.c.accento} size={26} />
          </TondoVetro>
        </View>
      )}

      {/* Il giorno aperto: tutto quello che succede, con spazio per leggerlo. */}
      <Modal
        visible={dettaglio !== null}
        animationType={Platform.OS === 'web' ? 'none' : 'slide'}
        transparent
        onRequestClose={() => setDettaglio(null)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(20,8,14,0.4)' }}>
          <View className="max-h-[80%] rounded-t-3xl bg-card">
            <ScrollView contentContainerClassName="gap-3 p-6">
              <Text className="font-serif-bold text-2xl capitalize text-foreground">
                {dettaglio?.toLocaleDateString(lingua, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
              {delDettaglio.length === 0 ? (
                <Text className="text-base text-muted-foreground">{t.calendario.vuotoTesto}</Text>
              ) : (
                delDettaglio.map((e) => (
                  <RigaEvento
                    key={e.id}
                    e={e}
                    mio={e.autore_id === session?.user.id}
                    onElimina={() => elimina(e.id)}
                    onPress={() => {
                      setDettaglio(null);
                      router.push({ pathname: '/evento/[id]', params: { id: e.id } });
                    }}
                  />
                ))
              )}
              <Button
                onPress={() => {
                  if (dettaglio) setGiorno(dettaglio);
                  setDettaglio(null);
                  apriForm();
                }}
              >
                <Text>{t.calendario.aggiungi}</Text>
              </Button>
              <Button variant="ghost" onPress={() => setDettaglio(null)}>
                <Text>{t.calendario.chiudi}</Text>
              </Button>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Lo scorrimento dal basso e' giusto sul telefono. Sul web resta senza
          animazione: li' e' preview di sviluppo, e un'animazione che dipende da
          requestAnimationFrame rende la chiusura non verificabile in una scheda
          che non compone frame. */}
      <Modal
        visible={aperto}
        animationType={Platform.OS === 'web' ? 'none' : 'slide'}
        transparent
        onRequestClose={() => setAperto(false)}
      >
        {/* La tastiera copriva il form: il foglio sale con lei, e il contenuto
            scorre, cosi' la nota resta visibile mentre la si scrive. */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(20,8,14,0.4)' }}
        >
          <View className="max-h-[88%] rounded-t-3xl bg-card">
            <ScrollView
              contentContainerClassName="gap-4 p-6"
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator={false}
            >
              <Text className="font-serif-bold text-2xl text-foreground">{t.calendario.nuovo}</Text>

              <Input
                value={titolo}
                onChangeText={setTitolo}
                placeholder={t.calendario.placeholderTitolo}
                autoFocus
              />

              {/* Che cos'e': cambia l'icona, il colore e — per la vacanza — la
                  forma stessa dell'evento, che da istante diventa intervallo. */}
              <View className="flex-row gap-2">
                {TIPI.map((x) => (
                  <Pressable
                    key={x}
                    onPress={() => setTipo(x)}
                    className={cn(
                      'flex-1 items-center rounded-full py-2',
                      tipo === x ? 'bg-primary' : 'bg-card'
                    )}
                  >
                    <Text
                      className={cn(
                        'text-sm',
                        tipo === x ? 'text-primary-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {t.calendario.tipi[x]}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text className="text-sm text-muted-foreground">
                {tipo === 'vacanza' ? t.calendario.andata : t.calendario.quando}
              </Text>
              {Platform.OS === 'web' ? (
                <Input
                  value={testoData}
                  onChangeText={setTestoData}
                  placeholder="2026-09-01 20:00"
                  autoCapitalize="none"
                />
              ) : (
                <DateTimePicker
                  value={quandoNuovo}
                  mode={tipo === 'vacanza' || tuttoIlGiorno ? 'date' : 'datetime'}
                  display="compact"
                  onChange={(_, d) => d && setQuandoNuovo(d)}
                />
              )}

              {tipo === 'vacanza' && (
                <>
                  <Text className="text-sm text-muted-foreground">{t.calendario.ritorno}</Text>
                  {Platform.OS === 'web' ? (
                    <Input
                      value={testoRitorno}
                      onChangeText={setTestoRitorno}
                      placeholder="2026-09-08 18:00"
                      autoCapitalize="none"
                    />
                  ) : (
                    <DateTimePicker
                      value={ritorno}
                      mode="date"
                      display="compact"
                      minimumDate={quandoNuovo}
                      onChange={(_, d) => d && setRitorno(d)}
                    />
                  )}
                </>
              )}

              {tipo !== 'vacanza' && (
                <View className="flex-row items-center justify-between">
                  <Text className="text-base text-foreground">{t.calendario.tuttoIlGiorno}</Text>
                  <Switch value={tuttoIlGiorno} onValueChange={setTuttoIlGiorno} />
                </View>
              )}

              {/* Dove: si sceglie fra i posti gia' segnati **oppure si cerca**.
               *
               * ⚠️ Questo **cambia** la regola scritta in D-34 ("non si creano
               * posti da qui: un luogo nasce dove lo si tocca, non da un campo
               * di testo che non sa dov'e'"). La ragione di quella regola era
               * esattamente che il campo di testo non aveva coordinate; con la
               * ricerca (2026-08-13) le ha, perche' arrivano dal risultato
               * scelto. La regola cade insieme al motivo che la reggeva — il
               * tocco lungo sulla mappa resta, e resta il modo migliore per i
               * posti che un indirizzo non ce l'hanno. */}
              <View className="gap-2">
                <Text className="text-sm text-muted-foreground">{t.evento.dove}</Text>
                <CercaLuogo
                  onScegli={async (trovato) => {
                    const err = await aggiungiLuogo(
                      { lat: trovato.lat, lng: trovato.lng, nome: trovato.nome, visitato: false },
                      ricaricaCoppia
                    );
                    if (err) return setErroreForm(err);
                    // Il posto appena creato non e' ancora nell'elenco locale:
                    // lo si ritrova al giro seguente, e intanto lo si segna
                    // come scelto per nome — l'utente ha appena detto che e' li'.
                    setLuogoCercato(trovato.nome);
                  }}
                />
                {!!luogoCercato && (
                  <Text className="text-xs text-primary">
                    {t.calendario.postoAggiunto(luogoCercato)}
                  </Text>
                )}
                {luoghi.length > 0 && (
                  <View className="flex-row flex-wrap gap-2">
                    <Pressable
                      onPress={() => setLuogoId(null)}
                      className={cn(
                        'rounded-full px-3 py-2',
                        luogoId === null ? 'bg-primary' : 'bg-card'
                      )}
                    >
                      <Text
                        className={cn(
                          'text-xs',
                          luogoId === null ? 'text-primary-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {t.calendario.nessunPosto}
                      </Text>
                    </Pressable>
                    {luoghi.map((l) => (
                      <Pressable
                        key={l.id}
                        onPress={() => setLuogoId(l.id)}
                        className={cn(
                          'rounded-full px-3 py-2',
                          luogoId === l.id ? 'bg-primary' : 'bg-card'
                        )}
                      >
                        <Text
                          className={cn(
                            'text-xs',
                            luogoId === l.id ? 'text-primary-foreground' : 'text-muted-foreground'
                          )}
                        >
                          {l.nome}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              {/* Il ristorante della serata (0012): si sceglie fra quelli dei
                  preferiti. Toccarlo dalla mappa o dai preferiti riportera'
                  qui — l'evento resta il centro (D-33). */}
              {ristoranti.length > 0 && (
                <View className="gap-2">
                  <Text className="text-sm text-muted-foreground">{t.calendario.ristorante}</Text>
                  <View className="flex-row flex-wrap gap-2">
                    <Pressable
                      onPress={() => setElementoId(null)}
                      className={cn(
                        'rounded-full px-3 py-2',
                        elementoId === null ? 'bg-primary' : 'bg-card'
                      )}
                    >
                      <Text
                        className={cn(
                          'text-xs',
                          elementoId === null ? 'text-primary-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {t.calendario.nessunRistorante}
                      </Text>
                    </Pressable>
                    {ristoranti.map((r) => (
                      <Pressable
                        key={r.id}
                        onPress={() => setElementoId(r.id)}
                        className={cn(
                          'rounded-full px-3 py-2',
                          elementoId === r.id ? 'bg-primary' : 'bg-card'
                        )}
                      >
                        <Text
                          className={cn(
                            'text-xs',
                            elementoId === r.id
                              ? 'text-primary-foreground'
                              : 'text-muted-foreground'
                          )}
                        >
                          {r.titolo}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              <Input value={nota} onChangeText={setNota} placeholder={t.calendario.placeholderNota} />

              {erroreForm && <Text className="text-sm text-destructive">{erroreForm}</Text>}

              <BottoneVetro
                variante="accento"
                altezza={58}
                disabled={attesa || titolo.trim().length === 0}
                onPress={salva}
              >
                <Text>{attesa ? t.onboarding.attesa : t.calendario.salva}</Text>
              </BottoneVetro>
              <BottoneVetro altezza={48} onPress={() => setAperto(false)}>
                <Text>{t.calendario.annulla}</Text>
              </BottoneVetro>
              {/* Un po' d'aria in fondo: senza, l'ultimo bottone resta incollato
                  al bordo del foglio quando la tastiera e' aperta. */}
              <View style={{ height: 8 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      </SafeAreaView>
    </View>
  );
}

/** Data e ora per esteso nel pop-up: qui c'e' spazio, e serve chiarezza. */
function quandoPerEsteso(e: Evento) {
  const da = new Date(e.inizio);
  const f = (d: Date) =>
    d.toLocaleDateString(lingua, { weekday: 'long', day: 'numeric', month: 'long' });
  if (e.fine) return `${f(da)} → ${f(new Date(e.fine))}`;
  if (e.tutto_il_giorno) return `${f(da)} · ${t.calendario.tuttoIlGiorno}`;
  return `${f(da)} · ${da.toLocaleTimeString(lingua, { hour: '2-digit', minute: '2-digit' })}`;
}

/** `AAAA-MM-GG HH:MM` — formato del campo testo usato solo sul web. */
function perCampoTesto(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function daCampoTesto(s: string): Date | null {
  const m = s.trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  return isNaN(d.getTime()) ? null : d;
}
