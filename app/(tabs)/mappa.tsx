import * as React from 'react';
import {
  View,
  ScrollView,
  Modal,
  Platform,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Riani, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { MapPin, Trash2, UtensilsCrossed } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { BottoneVetro, CartaVetro, Vetro } from '@/components/ui/vetro';
import { Premibile } from '@/components/ui/premibile';
import { Comparsa } from '@/components/ui/comparsa';
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
import { molla, durata } from '@/lib/movimento';
import { chiediConferma } from '@/lib/conferma';
import { t } from '@/lib/i18n';

/**
 * La mappa: gli stessi eventi del calendario, guardati **nello spazio** (D-33).
 *
 * ⚠️ D-05, la decisione che vale piu' di ogni funzione: **nessun tracciamento**.
 * Un posto entra qui con un "segna dove sono adesso" premuto apposta, oppure
 * cercandolo per nome dall'elenco; la posizione non viene mai letta da sola, e
 * nessuno dei due puo' sapere dove si trova l'altro in questo momento.
 *
 * ⚠️ **Il tocco lungo non aggiunge piu' niente** (2026-08-27, richiesta
 * dell'utente). Era l'unico gesto dell'app che andava spiegato con un
 * cartellino permanente sopra la mappa — e un gesto che ha bisogno di
 * un'istruzione fissa accanto non e' scoperto, e' tollerato. Il perche'
 * tecnico (il tocco lungo litiga col trascinamento della mappa) sta in
 * components/mappa-vera.native.tsx.
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

/**
 * La geometria dell'interruttore Mappa/Elenco, **decisa e non misurata**.
 *
 * 92 punti tengono comodamente sia "Elenco" sia "List" a corpo 14 in grassetto,
 * con l'aria attorno che serve perche' la pillola non sembri una fascetta
 * stretta sul testo.
 */
const VOCE_VISTA = 92;
const ALTEZZA_VISTA = 32;

/** Cosa e' stato toccato: un posto della coppia, o un ristorante. */
type Toccato =
  | { tipo: 'luogo'; luogo: Luogo }
  | { tipo: 'ristorante'; ristorante: RistoranteSuMappa };

export default function Mappa() {
  const router = useRouter();
  const { coppiaId } = useCoppia();
  const {
    luoghi,
    loading,
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
  /**
   * L'**ultimo** pin toccato, che sopravvive alla chiusura.
   *
   * ⚠️ Serve perche' l'anteprima ora **esce** invece di sparire, e per i ~150ms
   * dell'uscita deve avere ancora qualcosa da disegnare: leggendo `toccato`,
   * gia' tornato `null`, la carta si svuoterebbe di colpo e poi svanirebbe
   * vuota — peggio del taglio secco che si voleva togliere.
   */
  const [mostrato, setMostrato] = React.useState<Toccato | null>(null);
  React.useEffect(() => {
    if (toccato) setMostrato(toccato);
  }, [toccato]);
  /** Il foglio delle azioni sul posto, dietro il "…" dell'anteprima. */
  const [dettagli, setDettagli] = React.useState<Luogo | null>(null);

  /**
   * Il foglio «aggiungi un posto» — **lo stesso di Liste** (2026-08-28).
   *
   * ⚠️ Qui prima c'erano tre stati (`nuovo`, `nome`, `visitato`), un pannello
   * scritto a mano e una funzione di salvataggio tutta sua. Un posto nasceva in
   * due modi diversi a seconda della porta da cui entravi, e i due risultati
   * non erano la stessa riga (B-19). Ora la porta e' una: si cerca, si sceglie,
   * nasce. Il perche' per esteso sta in
   * `components/foglio-aggiungi-luogo.tsx`.
   */
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
   * Chi ha **almeno una serata futura** (D-72), per luogo e per ristorante.
   *
   * ⚠️ Non si ricava dal conteggio degli eventi: quel numero comprende anche le
   * serate passate, e un posto dove siete già stati tre volte avrebbe lo stesso
   * conto di uno dove andrete domani. È la differenza fra *ci è successo
   * qualcosa* e *ci succederà qualcosa*, e sulla mappa sono due icone diverse.
   *
   * ⚠️ Il confronto è con l'istante del render, non con la mezzanotte: un
   * evento di stasera alle 20 è «in programma» fino alle 20, e diventa passato
   * dopo. Arrotondare al giorno avrebbe fatto sparire l'icona bianca la mattina
   * stessa della serata, cioè proprio quando serve.
   */
  const futuri = React.useCallback((evs: Evento[] | undefined) => {
    if (!evs?.length) return false;
    const ora = Date.now();
    return evs.some((e) => new Date(e.inizio).getTime() > ora);
  }, []);

  const programmatiLuogo = React.useMemo(
    () => Object.fromEntries(Object.entries(perLuogo).map(([k, v]) => [k, futuri(v)])),
    [perLuogo, futuri]
  );
  const programmatiRistorante = React.useMemo(
    () => Object.fromEntries(Object.entries(perRistorante).map(([k, v]) => [k, futuri(v)])),
    [perRistorante, futuri]
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
   * ⚠️ **Il permesso si chiede** (D-59, scelta dell'utente il 2026-08-27).
   * Prima non si chiedeva: si usava la posizione solo se il permesso era gia'
   * stato concesso da «segna dove sono adesso». Il risultato era che per chi
   * quel bottone non l'aveva mai premuto la funzione **non esisteva**, e non
   * c'era modo di accorgersene — la mappa si apriva a Milano come se andasse
   * bene cosi'.
   *
   * 🔑 **E si richiede a ogni apertura, non una volta sola.** Il permesso puo'
   * essere negato e concesso **dopo, dalle Impostazioni di iOS**: e' un dato
   * che una *cosa fuori dall'app* puo' cambiare mentre la schermata resta
   * montata. E' esattamente la forma di B-09/B-13 — *due copie dello stesso
   * stato, di cui una non viene aggiornata* — con iOS al posto dell'altra
   * schermata. Da cui `useFocusEffect`: si rilegge lo stato vero al focus,
   * cosi' il ritorno dalle Impostazioni funziona da solo, senza riavviare.
   *
   * ⚠️ **`canAskAgain` decide se mostrare il dialogo, e non e' una rifinitura**:
   * su iOS il dialogo di sistema si presenta **una volta sola**. Dopo un
   * rifiuto `requestForegroundPermissionsAsync` ritorna subito negato senza
   * mostrare niente — chiamarlo a ogni apertura non riproverebbe, girerebbe
   * a vuoto.
   */
  const centrataQui = React.useRef(false);
  useFocusEffect(
    React.useCallback(() => {
      let vivo = true;
      (async () => {
        // Solo la prima volta per sessione di schermata: dopo, la telecamera
        // e' dove l'utente l'ha lasciata e riportarla addosso sarebbe uno
        // strappo, non un aiuto.
        if (centrataQui.current) return;

        let stato = await Location.getForegroundPermissionsAsync();
        if (!stato.granted && stato.canAskAgain) {
          stato = await Location.requestForegroundPermissionsAsync();
        }
        if (!vivo || !stato.granted) return;

        try {
          const dove = await Location.getLastKnownPositionAsync();
          const usa = dove ?? (await Location.getCurrentPositionAsync({}));
          if (!vivo || !usa) return;
          centrataQui.current = true;
          setCentro({ latitude: usa.coords.latitude, longitude: usa.coords.longitude });
        } catch {
          // Nessuna posizione disponibile: la mappa parte dove partiva prima.
        }
      })();
      return () => {
        vivo = false;
      };
    }, [])
  );

  /** Un gesto esplicito, una lettura sola: nessuna posizione in background. */
  /**
   * Il centro della mappa, col suo ripiego: la posizione se c'e', altrimenti il
   * primo posto salvato, altrimenti Milano.
   */
  const centroMappa =
    centro ??
    (luoghi[0]
      ? { latitude: luoghi[0].lat, longitude: luoghi[0].lng }
      : { latitude: 45.4642, longitude: 9.19 });

  // ⚠️ Da `mostrato` e non da `toccato`: durante l'uscita dell'anteprima il
  // secondo e' gia' `null`, e la carta si svuoterebbe prima di sparire.
  const eventiMostrati = !mostrato
    ? []
    : mostrato.tipo === 'luogo'
      ? (perLuogo[mostrato.luogo.id] ?? [])
      : (perRistorante[mostrato.ristorante.id] ?? []);

  /**
   * ## Il movimento di questa schermata
   *
   * **La pillola dell'interruttore scivola** invece di riaccendersi dall'altra
   * parte. E' la stessa idea della lente nella barra volante, e per lo stesso
   * motivo: un fondo che si spegne qui e si accende li' sono due eventi
   * separati, e sta a chi guarda dedurre che siano lo stesso oggetto; uno che
   * scorre *e'* lo stesso oggetto, e non c'e' niente da dedurre.
   *
   * ⚠️ **Larghezza fissa, niente `onLayout`.** E' la lezione gia' pagata dalla
   * barra volante: li' la misura tornava un numero che sul telefono non era
   * quello vero, e la correzione e' stata togliere la misura, non aggiustarla.
   * Qui la geometria e' nota — due voci di larghezza decisa — quindi la pillola
   * e le voci leggono **lo stesso numero**, e disallinearsi e' impossibile
   * invece che improbabile.
   */
  const scivoloVista = useSharedValue(vista === 'mappa' ? 0 : 1);
  React.useEffect(() => {
    scivoloVista.value = withSpring(vista === 'mappa' ? 0 : 1, molla.scivolo);
  }, [vista, scivoloVista]);
  const stilePillola = useAnimatedStyle(() => ({
    transform: [{ translateX: scivoloVista.value * VOCE_VISTA }],
  }));

  /**
   * Il contenuto che **entra** quando si cambia vista: una dissolvenza, e
   * nient'altro.
   *
   * ⚠️ **Il contenitore non si sposta**, ed e' una scelta contro l'istinto —
   * far scorrere lateralmente le due viste sembra la cosa ovvia da fare su un
   * interruttore. Non lo e', qui, per due motivi diversi che portano allo
   * stesso posto:
   *
   * - **la mappa e' una vista nativa**, e traslare il contenitore di una vista
   *   nativa e' il tipo di cosa che si comporta in un modo su iOS e in un altro
   *   su Android;
   * - **l'elenco ha gia' il suo movimento**: le schede entrano a onda dal basso
   *   (vedi `components/elenco-elementi.tsx`). Un contenitore che scivola da
   *   destra mentre il suo contenuto sale dal basso sono due direzioni diverse
   *   nello stesso momento, e il risultato non si legge come piu' ricco: si
   *   legge come confuso.
   *
   * Il movimento c'e' comunque, e sta dove serve: la pillola che scorre e le
   * schede che salgono. La dissolvenza e' solo il cambio di scena fra i due.
   */
  const entrata = useSharedValue(1);
  /**
   * ⚠️ **Solo sui cambi, non al montaggio** (2026-08-28). Prima l'effetto girava
   * anche al primo giro: la schermata partiva sbattendo a opacita' 0 per poi
   * risalire. Due danni, uno visibile e uno no.
   *
   * - Visibile: all'avvio non c'e' nessuna scena *precedente* da cui
   *   dissolvere. Una dissolvenza in entrata senza un "da dove" e' solo un
   *   lampo di vuoto.
   * - Invisibile, ed e' meta' del difetto riferito: il vetro di sistema creato
   *   dentro un livello a opacita' 0 non cattura il suo sfondo e **non si
   *   ripresenta** quando l'opacita' torna. E' il «+» senza il suo tondo appena
   *   avviata l'app; l'altra meta' sta in `components/ui/comparsa.tsx`.
   */
  const primoGiro = React.useRef(true);
  React.useEffect(() => {
    if (primoGiro.current) {
      primoGiro.current = false;
      return;
    }
    entrata.value = 0;
    entrata.value = withTiming(1, { duration: durata.media });
  }, [vista, entrata]);
  const stileVista = useAnimatedStyle(() => ({ opacity: entrata.value }));

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
            <View style={{ flexDirection: 'row', padding: 4 }}>
              {/* La pillola sta **sotto** le due voci e si sposta: e' l'unico
                  elemento che si muove, e le voci restano ferme dove sono. */}
              <Riani.View
                pointerEvents="none"
                style={[
                  {
                    position: 'absolute',
                    left: 4,
                    top: 4,
                    width: VOCE_VISTA,
                    height: ALTEZZA_VISTA,
                    borderRadius: 16,
                    backgroundColor: c.aloneForte,
                  },
                  stilePillola,
                ]}
              />
              {(['mappa', 'elenco'] as const).map((v) => (
                <Premibile
                  key={v}
                  onPress={() => setVista(v)}
                  // "Scelta" e non "tocco": e' il tatto dei selettori di
                  // sistema, piu' secco, e dice *ho cambiato* invece di
                  // *ho premuto*.
                  aptico="scelta"
                  scala={0.94}
                  style={{ width: VOCE_VISTA }}
                >
                  <View
                    style={{
                      height: ALTEZZA_VISTA,
                      alignItems: 'center',
                      justifyContent: 'center',
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
                  </View>
                </Premibile>
              ))}
            </View>
          </Vetro>
        </SafeAreaView>
      )}

      {MAPPA_DISPONIBILE && vista === 'elenco' ? (
        <Riani.View style={[{ flex: 1 }, stileVista]}>
          <SafeAreaView className="flex-1" edges={['top']}>
            {/* Lo spazio in cima lascia passare l'interruttore, che galleggia. */}
            <View style={{ height: 52 }} />
            <ElencoElementi tipo="luogo" />
          </SafeAreaView>
        </Riani.View>
      ) : !MAPPA_DISPONIBILE ? (
        // react-native-maps non esiste sul web: li' resta l'elenco, che e'
        // comunque il modo in cui si arriva agli eventi di un posto.
        <SafeAreaView className="flex-1" edges={['top']}>
          <View className="flex-1 gap-3 px-5 pt-2">
            <Text className="font-serif-bold text-3xl text-foreground">{t.tab.mappa}</Text>
            <Text className="text-sm text-muted-foreground">
              {Platform.OS === 'web' ? t.mappa.soloTelefono : t.mappa.senzaComponente}
            </Text>

            {/* ⚠️ **Qui c'era il secondo «aggiungi un posto»**, per quando il
                componente mappa non c'è (web). Tolto con D-70 insieme al «+»:
                era la stessa porta, su un'altra parete.

                🔑 È anche il motivo per cui vale la pena cercare la **forma** e
                non il difetto: togliere solo il «+» avrebbe lasciato aperta
                esattamente la strada che si voleva chiudere, e per giunta sul
                web — dove nessuno prova, quindi dove sarebbe sopravvissuta. */}

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
        <Riani.View style={[{ flex: 1 }, stileVista]}>
          <MappaVera
            centro={centroMappa}
            luoghi={luoghiSoli}
            ristoranti={ristoranti}
            eventiPerLuogo={contiLuogo}
            programmatiLuogo={programmatiLuogo}
            programmatiRistorante={programmatiRistorante}
            eventiPerRistorante={contiRistorante}
            // Quando l'anteprima e' aperta la mappa "utile" e' piu' corta: senza,
            // il pin scelto puo' finire proprio sotto la carta appena comparsa.
            spazioSotto={SPAZIO_BARRA - 20 + (toccato ? 110 : 0)}
            onLuogo={(l) => setToccato({ tipo: 'luogo', luogo: l })}
            onRistorante={(r) => setToccato({ tipo: 'ristorante', ristorante: r })}
          />

          {/* ⚠️ **Niente barra di ricerca fissa sopra la mappa** (2026-08-27,
              e resta vero). Un campo di testo permanente addosso a una
              schermata che di spazio ne ha bisogno tutto e' un costo che si
              paga a ogni sguardo, per un gesto che si fa una volta ogni tanto.
              La ricerca c'e', ma sta **dentro il foglio** che si apre col «+». */}

          {/* ⚠️ Un **«+»**, non un mirino (2026-08-27).
              Il tondo in basso a destra fa la stessa cosa in tutte le schermate
              — calendario, galleria, Liste — e in tutte e' un «+». Qui era un
              mirino perche' faceva una cosa sola: «segna dove sono».

              ⚠️ **E dal 2026-08-28 non fa piu' nemmeno quella**: apre lo stesso
              foglio di Liste, si cerca un posto e si sceglie. Il «segna dove
              sono» e' sparito insieme al pannello che chiedeva «come lo
              chiamate?», per richiesta esplicita dell'utente di **normalizzare**
              l'aggiunta di un luogo su quella dell'elenco.
              Cio' che si perde e' scritto senza sconti in
              `components/foglio-aggiungi-luogo.tsx`: non si puo' piu' segnare un
              punto che su Google non esiste. Cio' che si guadagna e' che un
              posto nasce **uguale** da qualunque porta entri — che era il
              difetto B-19, non un capriccio. */}
          {/* ⚠️ Il «+» **esce invece di sparire**: se ne va verso il basso
              proprio mentre l'anteprima arriva da li'. Prima era un
              `{condizione && …}` secco, cioe' un fotogramma tagliato nel punto
              esatto in cui l'occhio si trova — perche' e' li' che il dito ha
              appena toccato il pin. */}
          {/* ⚠️ `entraAlMontaggio={false}` (2026-08-28): il «+» c'e' gia' quando
              la mappa compare, quindi non ha nulla da cui entrare — e
              soprattutto il suo vetro non deve nascere dentro un livello a
              opacita' zero, che e' cio' che lo lasciava **senza tondo** appena
              avviata l'app. Il perche' per esteso sta in `components/ui/comparsa.tsx`.
              L'entrata che si vede davvero resta: e' il rientro dopo che
              l'anteprima del pin si chiude. */}
          {/*
            ⚠️ **Qui c'era il «+» per aggiungere un posto, tolto il 2026-08-28
            con D-70.** Non è stato nascosto: è stato **rimosso**, insieme al
            foglio che apriva.

            🔑 La mappa non è più un posto dove si *dichiara* di voler andare
            da qualche parte — è il registro di dove siete stati. Un desiderio
            si scrive nelle wishlist «Viaggi» e «Ristoranti»; un posto arriva
            qui **essendoci andati**, cioè spuntandolo o legandolo a una serata.

            E lasciare il bottone «tanto poi filtriamo» avrebbe ricreato
            esattamente le due strade che D-64 aveva appena finito di
            cancellare: una porta che nessuno usa non viene aggiornata quando
            cambia lo schema, e chi la trova fra sei mesi la ricollega
            credendola equivalente.
          */}
        </Riani.View>
      )}

      {/* --- l'anteprima in sovraimpressione -------------------------------
          Entra e **esce** dal basso: `Comparsa` la tiene montata finche' l'uscita
          non e' finita, e il contenuto lo legge da `mostrato` — che sopravvive
          alla chiusura — invece che da `toccato`, che e' gia' `null`. */}
      <Comparsa
        visibile={!!toccato}
        scarto={24}
        style={{ position: 'absolute', left: 14, right: 14, bottom: SOPRA_BARRA }}
      >
        {mostrato && (
          <AnteprimaEvento
            titoloLuogo={
              mostrato.tipo === 'luogo' ? mostrato.luogo.nome : mostrato.ristorante.titolo
            }
            eventi={eventiMostrati}
            copertine={copertine}
            onApri={(e) => apriEvento(e.id)}
            // Il "…" c'e' solo sui posti: un ristorante non si segna visitato e
            // non si elimina da qui — vive nei preferiti, e sarebbe un secondo
            // posto da cui cancellarlo.
            onDettagli={
              mostrato.tipo === 'luogo'
                ? ((posto) => () => setDettagli(posto))(mostrato.luogo)
                : undefined
            }
            onChiudi={() => setToccato(null)}
          />
        )}
      </Comparsa>

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
            <CartaVetro raggio={30} fondo="pieno" style={{ margin: 8 }}>
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
                      onPress={() =>
                        chiediConferma({
                          titolo: t.conferma.luogoTitolo(dettagli.nome),
                          nota: t.conferma.luogoNota,
                          onConferma: async () => {
                            const err = await elimina(dettagli.id);
                            setDettagli(null);
                            setToccato(null);
                            return err;
                          },
                        })
                      }
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

      {/* ⚠️ **Un solo modo di aggiungere un posto** (2026-08-28): lo stesso
          componente che usa Liste, con la stessa funzione dietro. Qui c'era un
          pannello con «Come lo chiamate?», l'interruttore «ci siamo gia' stati»
          e un salvataggio tutto suo — cioe' una seconda strada che creava la
          stessa cosa in modo diverso. */}

    </View>
  );
}
