import * as React from 'react';
import {
  View,
  Image,
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarPlus, ImagePlus, Plus, X } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RigaEvento, aspetto } from '@/components/riga-evento';
import {
  TestataCalendario,
  TondoTestata,
  InizialiGiorni,
} from '@/components/testata-calendario';
import { GrigliaMese } from '@/components/griglia-mese';
import { Foglio } from '@/components/foglio';
import { AgendaGiorno } from '@/components/agenda-giorno';
import { CercaLuogo } from '@/components/cerca-luogo';
import { BottoneVetro, BottonePieno, TondoVetro } from '@/components/ui/vetro';
import { Fondo } from '@/components/schermata';
import { SPAZIO_BARRA, SOPRA_BARRA } from '@/components/barra-volante';
import { useTastiera } from '@/lib/tastiera';
import { useTema, SU_TESTATA, SU_TESTATA_TENUE } from '@/lib/tema';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useCoppia } from '@/lib/coppia';
import { usePreferiti } from '@/lib/preferiti';
import { anteprimePerEvento, caricaFoto, scegliFoto } from '@/lib/foto';
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

/**
 * Una cella della **striscia dei giorni**, quella che vive dentro la testata
 * sfumata nella vista agenda.
 *
 * Non e' piu' la stessa cella della griglia del mese: quella e' andata in
 * `components/griglia-mese.tsx` e mostra le pillole, questa sta sopra un fondo
 * colorato e deve restare minuscola. Tenerle separate evita il componente
 * "cella" pieno di `if` che serviva due posti e nessuno dei due bene.
 */
function CellaStriscia({
  giorno,
  selezionato,
  oggi,
  eventi,
  onPress,
}: {
  giorno: Date;
  selezionato: boolean;
  oggi: boolean;
  eventi: Evento[];
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={{ alignItems: 'center', paddingVertical: 2 }}>
      <Text
        style={{
          fontSize: 10,
          textTransform: 'uppercase',
          color: SU_TESTATA_TENUE,
          marginBottom: 2,
        }}
      >
        {giorno.getDate() === 1
          ? giorno.toLocaleDateString(lingua, { month: 'short' })
          : giorno.toLocaleDateString(lingua, { weekday: 'short' })}
      </Text>
      <View
        style={{
          height: 34,
          width: 34,
          borderRadius: 17,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: selezionato ? '#ffffff' : 'transparent',
          borderWidth: !selezionato && oggi ? 1.5 : 0,
          borderColor: SU_TESTATA,
        }}
      >
        <Text
          style={{
            fontSize: 15,
            fontWeight: selezionato || oggi ? '700' : '500',
            color: selezionato ? '#c2157f' : SU_TESTATA,
          }}
        >
          {giorno.getDate()}
        </Text>
      </View>
      {/* Sotto la striscia restano i pallini: qui non c'e' spazio per le
          pillole, e comunque il programma completo sta subito sotto. */}
      <View style={{ height: 6, flexDirection: 'row', gap: 2, marginTop: 3 }}>
        {eventi.slice(0, 3).map((e) => (
          <View
            key={e.id}
            style={{
              height: 4,
              width: 4,
              borderRadius: 2,
              backgroundColor: selezionato ? 'rgba(255,255,255,0.9)' : aspetto(e).pastello.barra,
            }}
          />
        ))}
      </View>
    </Pressable>
  );
}

/**
 * Il selettore delle quattro viste, dentro la testata.
 *
 * ⚠️ **Etichette, non icone.** Il riferimento usa tondini con simboli, e qui
 * non funzionerebbe: "mese" e "anno" sono due griglie, e due icone di griglia
 * una accanto all'altra non si distinguono. Le quattro parole occupano una
 * riga e non lasciano dubbi — e' lo stesso ragionamento fatto al contrario per
 * la barra in basso, dove le voci sono sei e le parole diventavano rumore.
 */
function SelettoreVista({
  vista,
  onVista,
}: {
  vista: Vista;
  onVista: (v: Vista) => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        marginHorizontal: 14,
        marginTop: 8,
        padding: 4,
        borderRadius: 17,
        backgroundColor: 'rgba(255,255,255,0.30)',
      }}
    >
      {VISTE.map((v) => (
        <Pressable
          key={v}
          onPress={() => onVista(v)}
          style={{
            flex: 1,
            alignItems: 'center',
            paddingVertical: 7,
            borderRadius: 13,
            backgroundColor: vista === v ? 'rgba(255,255,255,0.92)' : 'transparent',
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: vista === v ? '700' : '500',
              color: vista === v ? '#c2157f' : SU_TESTATA_TENUE,
            }}
          >
            {t.calendario.viste[v]}
          </Text>
        </Pressable>
      ))}
    </View>
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
  // I ristoranti dei preferiti: un evento puo' averne uno (0012).
  const { elementi, aggiungiLuogoPreferito } = usePreferiti(coppiaId);
  const ristoranti = React.useMemo(
    () => elementi.filter((e) => e.tipo === 'luogo'),
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
  /** Idem, ma quando il posto scelto era un ristorante ed e' entrato nei preferiti. */
  const [ristoranteAggiunto, setRistoranteAggiunto] = React.useState<string | null>(null);
  /**
   * Le foto scelte **prima** che l'evento esista.
   *
   * Restano qui finche' non si salva: una foto si attacca a un evento, e
   * l'evento prima dev'essere creato. Caricarle subito significherebbe o
   * lasciarle orfane se poi si annulla, o creare l'evento appena si sceglie la
   * prima immagine — cioe' decidere al posto di chi sta ancora compilando.
   */
  const [fotoNuove, setFotoNuove] = React.useState<{ uri: string }[]>([]);
  /** "3 di 10" durante il caricamento: un'attesa muta sembra un blocco. */
  const [caricamento, setCaricamento] = React.useState<string | null>(null);
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
    setLuogoCercato(null);
    setRistoranteAggiunto(null);
    setFotoNuove([]);
    setCaricamento(null);
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
    let idEvento = inModifica?.id;
    if (inModifica) {
      const err = await aggiorna(inModifica.id, dati);
      if (err) {
        setAttesa(false);
        return setErroreForm(err);
      }
    } else {
      const esito = await aggiungi(dati, ricaricaCoppia);
      if (esito.errore) {
        setAttesa(false);
        return setErroreForm(esito.errore);
      }
      idEvento = esito.id;
    }

    // Le foto **dopo** l'evento: prima deve esistere qualcosa a cui attaccarle.
    // Se il caricamento fallisce l'evento resta — meta' del lavoro salvata e'
    // meglio di niente, e le foto si riaggiungono dalla sua pagina.
    if (fotoNuove.length > 0 && idEvento && coppiaId) {
      const esito = await caricaFoto(
        coppiaId,
        fotoNuove,
        { eventoId: idEvento, luogoId: luogoId ?? null, elementoId: elementoId ?? null },
        (fatte, totale) => setCaricamento(t.calendario.caricamentoFoto(fatte, totale))
      );
      setCaricamento(null);
      if (esito.errore) {
        setAttesa(false);
        return setErroreForm(esito.errore);
      }
    }

    setAttesa(false);
    setGiorno(inizioGiorno(data)); // si va a vedere dove e' finito
    setAperto(false);
    setInModifica(null);
    setFotoNuove([]);
  }

  return (
    <View className="flex-1">
      <Fondo />

      {/* --- la testata sfumata: comandi sopra, calendario sotto ----------- */}
      <TestataCalendario
        titolo={
          vista === 'eventi' ? t.calendario.tuttiGliEventi : titoloPeriodo(giorno, vista, lingua)
        }
        // Il nome del mese si maiuscola, la frase "tutti gli eventi" no.
        capitalizza={vista !== 'eventi'}
        onIndietro={vista === 'eventi' ? undefined : () => vai(-1)}
        onAvanti={vista === 'eventi' ? undefined : () => vai(1)}
        onTitolo={vista === 'eventi' ? undefined : () => setGiorno(oggi)}
        sinistra={
          <TondoTestata onPress={() => router.push('/importa')} accessibilityLabel={t.importa.apri}>
            <CalendarPlus color={SU_TESTATA} size={17} />
          </TondoTestata>
        }
        destra={
          // Il numero di oggi come bottone: e' il gesto che si cerca piu'
          // spesso in un calendario, e scriverlo invece di disegnarlo dice
          // anche **che giorno e'** senza spendere una riga in piu'.
          <TondoTestata
            onPress={() => {
              setGiorno(oggi);
              if (vista === 'anno' || vista === 'eventi') setVista('mese');
            }}
            accessibilityLabel={t.calendario.conto.oggi}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: SU_TESTATA }}>
              {oggi.getDate()}
            </Text>
          </TondoTestata>
        }
      >
        <SelettoreVista vista={vista} onVista={setVista} />

        {vista === 'mese' && <InizialiGiorni etichette={etichette} />}

        {vista === 'giorni' && (
          /* Striscia continua: si scorre di quanto si vuole, non di sette in
             sette — le frecce saltano la settimana, il dito va dove gli pare.
             B-06: con lo ScrollView era uno scrollTo a timeout zero, che sul
             telefono partiva PRIMA che la striscia fosse misurata. La FlatList
             con getItemLayout sa le posizioni SENZA misurare. */
          <FlatList
            ref={striscia}
            data={settimana}
            horizontal
            showsHorizontalScrollIndicator={false}
            // Altezza FISSA: senza, su iOS la lista orizzontale contendeva lo
            // spazio verticale col contenuto sotto e i numeri finivano coperti.
            style={{ height: 76, flexGrow: 0, marginTop: 6 }}
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
                <CellaStriscia
                  giorno={d}
                  selezionato={stessoGiorno(d, giorno)}
                  oggi={stessoGiorno(d, oggi)}
                  eventi={eventiDelGiorno(eventi, d)}
                  /* Nella striscia si **naviga fra i giorni**: toccarne uno lo
                     sceglie e la sua agenda compare qui sotto. Un foglio che si
                     apre sarebbe un passaggio di troppo per un gesto che si
                     ripete decine di volte. */
                  onPress={() => setGiorno(d)}
                />
              </View>
            )}
          />
        )}
      </TestataCalendario>

      {/* --- il corpo ------------------------------------------------------ */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={tema.c.accento} />
        </View>
      ) : (
        <Animated.View
          {...pan.panHandlers}
          style={{ flex: 1, transform: [{ translateX: spostamento }] }}
        >
          {errore && (
            <View className="mx-5 mt-3 gap-2 rounded-2xl bg-card p-4">
              <Text className="text-sm text-destructive">{errore}</Text>
              <Button variant="outline" onPress={() => ricarica()}>
                <Text>{t.home.riprova}</Text>
              </Button>
            </View>
          )}

          {vista === 'mese' && (
            // ⚠️ Lo spazio della barra va riservato **qui**, non dentro la
            // griglia: `GrigliaMese` divide per sei l'altezza che riceve, e se
            // riceve anche la fascia coperta dalla pillola le righe vengono
            // troppo alte E l'ultima settimana finisce sotto il vetro. Sul
            // telefono si vedeva esattamente cosi': righe enormi e il 31
            // nascosto.
            <View style={{ flex: 1, paddingBottom: SPAZIO_BARRA }}>
            <GrigliaMese
              griglia={griglia}
              mese={giorno}
              giorno={giorno}
              oggi={oggi}
              eventiDi={(d) => eventiDelGiorno(eventi, d)}
              onTocca={tocca}
              onEvento={(e) => router.push({ pathname: '/evento/[id]', params: { id: e.id } })}
            />
            </View>
          )}

          {vista === 'giorni' && (
            <AgendaGiorno
              giorno={giorno}
              eventi={delGiorno}
              spazioFondo={SPAZIO_BARRA}
              onEvento={(e) => router.push({ pathname: '/evento/[id]', params: { id: e.id } })}
            />
          )}

          {vista === 'anno' && (
            /* L'anno serve a **ritrovare**: dove stanno le vacanze, in che mese
               cadeva quella cosa. Non serve il dettaglio dei giorni, serve il
               peso di ogni mese — quante cose, e di che colore. */
            <ScrollView contentContainerStyle={{ paddingBottom: SPAZIO_BARRA, paddingTop: 8 }}>
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
                              style={{ backgroundColor: aspetto(e).pastello.barra }}
                            />
                          ))}
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {vista === 'eventi' && (
            /* Niente giorni, solo le cose — quelle che devono venire in ordine
               di arrivo, quelle passate dalla piu' recente. Ognuna dice
               **quanto manca** o **quanto e' passata**, che e' la domanda vera
               quando si guarda un elenco cosi'. */
            <ScrollView
              contentContainerClassName="gap-3 px-5 pt-3"
              contentContainerStyle={{ paddingBottom: SPAZIO_BARRA }}
            >
              {eventi.length === 0 && (
                <View className="items-center gap-2 py-10">
                  <Text className="font-serif text-lg text-foreground">
                    {t.calendario.vuotoTitolo}
                  </Text>
                  <Text className="max-w-xs text-center text-sm text-muted-foreground">
                    {t.calendario.vuotoTesto}
                  </Text>
                </View>
              )}
              {[...inArrivo, ...passati].map((e, i) => (
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
              ))}
            </ScrollView>
          )}
        </Animated.View>
      )}


      {!tastieraAperta && (
        <View style={{ position: 'absolute', right: 20, bottom: SOPRA_BARRA }}>
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

      {/* Il foglio del nuovo evento.
          Usa `Foglio` invece di `animationType="slide"`: il Modal di sistema
          animava **anche la velatura scura**, che quindi scivolava su insieme al
          pannello come un blocco unico. Ora la velatura sfuma sul posto e il
          pannello sale con una molla — le due cose separate, come su ogni foglio
          di sistema. Dettagli in `components/foglio.tsx`. */}
      <Foglio visibile={aperto} onChiudi={() => setAperto(false)}>
        {/* La tastiera copriva il form: il foglio sale con lei, e il contenuto
            scorre, cosi' la nota resta visibile mentre la si scrive. */}
        {/* ⚠️ `flex-1` deve restare: il pannello sotto usa `max-h-[88%]`, e una
            percentuale ha bisogno di un genitore con un'altezza definita. Senza,
            il tetto dell'88% non si applica e un form lungo esce dallo schermo. */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end"
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
                {/* Scegliere un posto qui puo' voler dire **tre cose diverse**,
                    e distinguerle e' cio' che evita all'utente di rifare a mano
                    altrove un lavoro gia' fatto (richiesta del 2026-08-27).

                    1. E' un posto **gia' fra i vostri luoghi** → si seleziona e
                       basta. Riconosciuto per `google_place_id`, che e'
                       l'identita' vera del posto: due locali possono chiamarsi
                       uguale, e lo stesso locale puo' essere stato salvato con
                       un nome leggermente diverso.
                    2. E' un posto **nuovo** → entra da solo fra i luoghi, con la
                       sua foto di Google come copertina, e resta selezionato.
                       Prima bisognava aprire i preferiti e cercarlo una seconda
                       volta.

                    ⚠️ Con 0016 **non c'e' piu' un terzo caso**. Prima solo i
                    ristoranti entravano in lista e tutto il resto diventava un
                    luogo muto sulla mappa; ora ogni posto scelto e' un luogo a
                    pieno titolo, con copertina e recensioni. Il tipo di Google
                    resta in `genere` e serve all'icona, non a decidere chi
                    merita di stare in lista. */}
                <CercaLuogo
                  onScegli={async (trovato) => {
                    setErroreForm(null);

                    // (1) gia' fra i preferiti?
                    const gia = trovato.placeId
                      ? ristoranti.find((r) => r.google_place_id === trovato.placeId)
                      : undefined;
                    if (gia) {
                      setElementoId(gia.id);
                      if (gia.luogo_id) setLuogoId(gia.luogo_id);
                      setLuogoCercato(null);
                      setRistoranteAggiunto(null);
                      return;
                    }

                    // (2) posto nuovo: entra nei luoghi, con la sua copertina
                    const esito = await aggiungiLuogoPreferito(trovato, ricaricaCoppia);
                    if (esito.errore) return setErroreForm(esito.errore);
                    if (esito.elementoId) setElementoId(esito.elementoId);
                    if (esito.luogoId) setLuogoId(esito.luogoId);
                    setLuogoCercato(null);
                    setRistoranteAggiunto(trovato.nome);
                  }}
                />
                {!!ristoranteAggiunto && (
                  <Text className="text-xs text-primary">
                    {t.calendario.ristoranteAggiunto(ristoranteAggiunto)}
                  </Text>
                )}
                {!!luogoCercato && (
                  <Text className="text-xs text-primary">
                    {t.calendario.postoAggiunto(luogoCercato)}
                  </Text>
                )}
                {/* --- l'elenco dei luoghi già vostri -------------------------
                    ⚠️ **Uno solo.** Fino a poco fa qui c'erano *due* file di
                    pillole: i "posti" (dalla mappa) e i "ristoranti" (dalla
                    lista). Erano due elenchi della stessa cosa, e dopo 0017 —
                    che rende luogo e riga di lista uno a uno — erano proprio gli
                    stessi posti scritti due volte, con due selezioni separate
                    che potevano perfino contraddirsi.
                    Ora la fila è una, viene dalla lista, e sceglierne uno
                    imposta **entrambi** i legami dell'evento: `elemento_id`
                    (la scheda) e `luogo_id` (la mappa). */}
                {ristoranti.length > 0 && (
                  <View className="flex-row flex-wrap gap-2">
                    <Pressable
                      onPress={() => {
                        setElementoId(null);
                        setLuogoId(null);
                      }}
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
                        {t.calendario.nessunPosto}
                      </Text>
                    </Pressable>
                    {ristoranti.map((r) => (
                      <Pressable
                        key={r.id}
                        onPress={() => {
                          setElementoId(r.id);
                          setLuogoId(r.luogo_id ?? null);
                        }}
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
                )}
              </View>


              {/* --- le foto della serata ------------------------------------
                  Si scelgono qui e si caricano al salvataggio: chi crea un
                  evento passato — una cena di ieri, un viaggio — ha le foto in
                  mano in quel momento, e costringerlo ad aprire l'evento appena
                  creato per aggiungerle era un passaggio che nessuno chiedeva. */}
              {Platform.OS !== 'web' && (
                <View className="gap-2">
                  <Text className="text-sm text-muted-foreground">{t.evento.foto}</Text>
                  <Pressable
                    onPress={async () => {
                      const scelta = await scegliFoto();
                      if (scelta.negato) return setErroreForm(t.galleria.permessoNegato);
                      if (scelta.immagini.length > 0) {
                        setFotoNuove((f) => [...f, ...scelta.immagini.map((i) => ({ uri: i.uri }))]);
                      }
                    }}
                    className="flex-row items-center gap-2 rounded-2xl px-3 py-3"
                    style={{ backgroundColor: tema.c.alone }}
                  >
                    <ImagePlus color={tema.c.accento} size={18} />
                    <Text className="text-sm font-medium" style={{ color: tema.c.accento }}>
                      {fotoNuove.length === 0
                        ? t.evento.aggiungiFoto
                        : t.calendario.fotoScelte(fotoNuove.length)}
                    </Text>
                  </Pressable>
                  {fotoNuove.length > 0 && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      // Altezza dichiarata: una lista orizzontale dentro una
                      // colonna che non la dichiara si prende spazio in piu'.
                      style={{ height: 76, flexGrow: 0 }}
                      contentContainerStyle={{ gap: 6, alignItems: 'center' }}
                    >
                      {fotoNuove.map((f, i) => (
                        <Pressable
                          key={`${f.uri}-${i}`}
                          onPress={() => setFotoNuove((v) => v.filter((_, j) => j !== i))}
                        >
                          <View
                            style={{ width: 64, height: 64, borderRadius: 14, overflow: 'hidden' }}
                          >
                            <Image
                              source={{ uri: f.uri }}
                              style={{ width: '100%', height: '100%' }}
                              resizeMode="cover"
                            />
                            {/* Toccare una miniatura la toglie: e' il gesto
                                atteso, e prima del salvataggio non c'e' niente
                                da confermare — non e' ancora stato caricato. */}
                            <View
                              style={{
                                position: 'absolute',
                                right: 3,
                                top: 3,
                                width: 18,
                                height: 18,
                                borderRadius: 9,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'rgba(0,0,0,0.55)',
                              }}
                            >
                              <X color="#ffffff" size={12} />
                            </View>
                          </View>
                        </Pressable>
                      ))}
                    </ScrollView>
                  )}
                  {!!caricamento && (
                    <Text className="text-xs text-primary">{caricamento}</Text>
                  )}
                </View>
              )}

              <Input value={nota} onChangeText={setNota} placeholder={t.calendario.placeholderNota} />

              {erroreForm && <Text className="text-sm text-destructive">{erroreForm}</Text>}

              {/* ⚠️ **Pieno quando si puo' salvare, vetro quando no.**
                  Da vetro tinto il bottone restava chiaro in entrambi gli stati
                  e l'unica differenza era un filo di opacita': non si capiva se
                  mancasse qualcosa. Il magenta pieno dice "adesso si puo'"
                  prima ancora di leggere l'etichetta, e il grigio dice
                  altrettanto chiaramente il contrario. */}
              <BottonePieno
                testo={attesa ? t.onboarding.attesa : t.calendario.salva}
                disabled={attesa || titolo.trim().length === 0}
                onPress={salva}
              />
              <BottoneVetro altezza={48} onPress={() => setAperto(false)}>
                <Text>{t.calendario.annulla}</Text>
              </BottoneVetro>
              {/* Un po' d'aria in fondo: senza, l'ultimo bottone resta incollato
                  al bordo del foglio quando la tastiera e' aperta. */}
              <View style={{ height: 8 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Foglio>
    </View>
  );
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
