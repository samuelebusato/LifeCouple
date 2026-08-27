import * as React from 'react';
import {
  Alert,
  View,
  ActivityIndicator,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
  Animated,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  CalendarDays,
  ChevronLeft,
  Clock,
  ImagePlus,
  MapPin,
  Pencil,
  Settings,
  ImageMinus,
  Check,
  Tag,
  Trash2,
  UserRound,
  X,
} from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BottoneVetro, CartaVetro, TondoVetro, Vetro } from '@/components/ui/vetro';
import { Premibile } from '@/components/ui/premibile';
import { Comparsa } from '@/components/ui/comparsa';
import { Fondo } from '@/components/schermata';
import { CercaLuogo } from '@/components/cerca-luogo';
import { aspetto } from '@/components/riga-evento';
import { VisoreFoto, type AzioneVisore } from '@/components/visore-foto';
import { useTema } from '@/lib/tema';
import { useAuth } from '@/lib/auth';
import { useCoppia } from '@/lib/coppia';
import { usePreferiti } from '@/lib/preferiti';
import { useEventoDettaglio } from '@/lib/evento-dettaglio';
import { caricaFoto, cancellaFoto, indirizziFirmati, scegliFoto, staccaDaEvento } from '@/lib/foto';
import { TIPI, type TipoEvento } from '@/lib/eventi';
import { cascata } from '@/lib/movimento';
import { lingua, t } from '@/lib/i18n';

/**
 * La pagina di un evento: **il centro del modello** (0008/0012).
 *
 * Calendario, mappa, recap e ora anche i ristoranti sono strade che portano
 * qui — e qui c'e' tutto quello che di quel momento e' rimasto: quando, dove,
 * con che ristorante, le foto, le parole.
 *
 * **Rifatta il 2026-08-13 (D-35)** sullo stile chiesto dall'utente: immagine
 * grande in testa, righe di dettaglio con le icone, e un **ingranaggio** in
 * basso a destra che apre le azioni — aggiungi foto, aggiungi descrizione,
 * elimina, cambia data, cambia luogo. Ogni azione e' un foglio piccolo che
 * tocca UN campo: il form completo resta nel calendario, cosi' i due non
 * divergono (la ragione di "la modifica vive in un posto solo" era quella).
 *
 * Le azioni che scrivono l'evento sono **solo dell'autore** (policy di 0001):
 * al partner l'ingranaggio mostra solo "aggiungi foto", che e' sua di diritto.
 */
/**
 * Quante miniature entrano nella striscia prima che l'ultima diventi il conto
 * di quelle rimaste. Quattro e' quanto ci sta su uno schermo da 375 punti con
 * riquadri da 82: la quinta si vedrebbe a meta' e sembrerebbe tagliata.
 */
const MINIATURE = 4;

export default function PaginaEvento() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const { coppiaId, ricarica: ricaricaCoppia } = useCoppia();
  const { elementi, aggiungiLuogoPreferito } = usePreferiti(coppiaId);
  /** I luoghi della lista: la stessa fila di pillole del form del nuovo evento. */
  const luoghiLista = React.useMemo(
    () => elementi.filter((x) => x.tipo === 'luogo'),
    [elementi]
  );
  const {
    evento,
    luogo,
    foto,
    commenti,
    loading,
    errore,
    ricarica,
    commenta,
    cancellaCommento,
    aggiorna,
    eliminaEvento,
  } = useEventoDettaglio(id);

  const tema = useTema();
  const insets = useSafeAreaInsets();
  const [url, setUrl] = React.useState<Record<string, string>>({});
  const [caricando, setCaricando] = React.useState(false);
  /** Il commento che si sta scrivendo, e l'attesa del suo invio. */
  const [testo, setTesto] = React.useState('');
  const [attesa, setAttesa] = React.useState(false);
  const [erroreForm, setErroreForm] = React.useState<string | null>(null);

  // --- l'ingranaggio e i suoi fogli -----------------------------------------
  const [ventaglio, setVentaglio] = React.useState(false);
  const [foglio, setFoglio] = React.useState<
    null | 'descrizione' | 'data' | 'luogo' | 'tipo' | 'elimina'
  >(null);
  const [bozzaNota, setBozzaNota] = React.useState('');
  const [bozzaData, setBozzaData] = React.useState(new Date());
  const [bozzaFine, setBozzaFine] = React.useState(new Date());
  const [testoData, setTestoData] = React.useState('');
  /** Indice della foto aperta a schermo pieno (null = visore chiuso). */
  const [visore, setVisore] = React.useState<number | null>(null);
  const { height: altezzaSchermo } = useWindowDimensions();

  // L'immagine di testa si **allarga tirando verso il basso**: la scala segue
  // lo scorrimento negativo. Nativo (useNativeDriver): niente ponte JS a ogni
  // fotogramma, che su un gesto continuo si vede tutto.
  const scorrimento = React.useRef(new Animated.Value(0)).current;
  // Due comportamenti in una scala sola (riferimento: lo screenshot yacht):
  // tirando GIU' l'immagine si stira (fino a 1.9), scorrendo la pagina VERSO
  // IL BASSO si ingrandisce "un po'" (fino a 1.12) — dentro la card ritagliata,
  // quindi cresce senza uscire dai suoi angoli.
  const scalaTesta = scorrimento.interpolate({
    inputRange: [-320, 0, 320],
    outputRange: [1.9, 1, 1.12],
    extrapolate: 'clamp',
  });
  const spostaTesta = scorrimento.interpolate({
    inputRange: [-320, 0],
    outputRange: [-160, 0],
    extrapolateRight: 'clamp',
  });

  const mio = evento?.autore_id === session?.user.id;

  const chiavi = foto.map((f) => f.chiave_storage).join(',');
  React.useEffect(() => {
    if (!chiavi) return setUrl({});
    indirizziFirmati(chiavi.split(',')).then(setUrl);
  }, [chiavi]);

  async function aggiungiFoto() {
    if (!evento) return;
    setErroreForm(null);
    const scelta = await scegliFoto();
    if (scelta.negato) return setErroreForm(t.galleria.permessoNegato);
    if (scelta.immagini.length === 0) return;
    setCaricando(true);
    const r = await caricaFoto(evento.coppia_id, scelta.immagini, {
      eventoId: evento.id,
      luogoId: evento.luogo_id,
    });
    setCaricando(false);
    if (r.errore) setErroreForm(r.errore);
    await ricarica();
  }

  /**
   * Le azioni del visore, **dentro un evento**.
   *
   * Sono due e vanno tenute distinte, perche' distinguono due intenzioni che
   * si somigliano solo a parole (decisione dell'utente, 2026-08-27):
   *
   *   «togli dall'evento» → la foto resta in galleria. E' riordinare.
   *   «elimina foto»      → sparisce da tutto. E' buttare via.
   *
   * Se ce ne fosse una sola dovrebbe essere la prima, perche' l'errore in quella
   * direzione si corregge e nell'altra no: non c'e' cestino.
   *
   * Entrambe sono `soloAutore`: le policy lo impongono comunque (D-21), e
   * offrire un gesto destinato a fallire e' peggio che non offrirlo.
   */
  const azioniFoto: AzioneVisore[] = [
    {
      chiave: 'stacca',
      etichetta: t.evento.togliDallEvento,
      Icona: ImageMinus,
      soloAutore: true,
      fai: (f) =>
        Alert.alert(t.evento.togliDallEvento, t.evento.confermaTogli, [
          { text: t.calendario.annulla, style: 'cancel' },
          {
            text: t.evento.togliDallEvento,
            onPress: async () => {
              setVisore(null);
              const err = await staccaDaEvento(f.id);
              if (err) setErroreForm(err);
              await ricarica();
            },
          },
        ]),
    },
    {
      chiave: 'elimina',
      etichetta: t.evento.eliminaFoto,
      Icona: Trash2,
      distruttiva: true,
      soloAutore: true,
      fai: (f) =>
        Alert.alert(t.evento.eliminaFoto, t.evento.confermaEliminaFoto, [
          { text: t.calendario.annulla, style: 'cancel' },
          {
            text: t.calendario.elimina,
            style: 'destructive',
            onPress: async () => {
              setVisore(null);
              const err = await cancellaFoto(f.id, f.chiave_storage);
              if (err) setErroreForm(err);
              await ricarica();
            },
          },
        ]),
    },
  ];

  /** Traduce l'errore-sentinella della policy in una frase per persone. */
  const perPersone = (err: string | null) =>
    err === 'solo-autore' ? t.evento.soloAutore : err;

  if (loading) {
    return (
      <View className="flex-1">
        <Fondo />
        <SafeAreaView className="flex-1 items-center justify-center">
          <ActivityIndicator color={tema.c.accento} />
        </SafeAreaView>
      </View>
    );
  }

  if (!evento) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-3 bg-background px-8">
        <Text className="font-serif text-xl text-foreground">{t.evento.sparito}</Text>
        {!!errore && <Text className="text-sm text-destructive">{errore}</Text>}
        <Button variant="ghost" onPress={() => router.back()}>
          <Text>{t.calendario.chiudi}</Text>
        </Button>
      </SafeAreaView>
    );
  }

  const { Icona, pastello } = aspetto(evento);
  const da = new Date(evento.inizio);
  const dataEstesa = da.toLocaleDateString(lingua, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const oraEstesa = evento.fine
    ? `${da.toLocaleDateString(lingua, { day: 'numeric', month: 'short' })} → ${new Date(evento.fine).toLocaleDateString(lingua, { day: 'numeric', month: 'short' })}`
    : evento.tutto_il_giorno
      ? t.calendario.tuttoIlGiorno
      : da.toLocaleTimeString(lingua, { hour: '2-digit', minute: '2-digit' });

  const copertina = foto[0] ? url[foto[0].chiave_storage] : undefined;

  /**
   * Manda il commento.
   *
   * ⚠️ Il campo si svuota **solo se l'invio e' andato a buon fine**. Svuotarlo
   * comunque perderebbe cio' che era stato scritto proprio nel caso in cui
   * serve di piu' — quando la rete non c'e' — e non c'e' nessun modo di
   * riaverlo.
   */
  async function invia() {
    setErroreForm(null);
    setAttesa(true);
    const err = await commenta(testo);
    setAttesa(false);
    if (err) return setErroreForm(err);
    setTesto('');
  }

  /** Le voci del ventaglio: etichetta, icona, gesto. Foto per tutti, il resto all'autore. */
  const azioni: { chiave: string; etichetta: string; Icona: typeof Pencil; fai: () => void }[] = [
    {
      chiave: 'foto',
      etichetta: t.evento.aggiungiFoto,
      Icona: ImagePlus,
      fai: () => {
        setVentaglio(false);
        aggiungiFoto();
      },
    },
    ...(mio
      ? [
          {
            chiave: 'descrizione',
            etichetta: t.evento.aggiungiDescrizione,
            Icona: Pencil,
            fai: () => {
              setBozzaNota(evento?.nota ?? '');
              setVentaglio(false);
              setFoglio('descrizione');
            },
          },
          {
            chiave: 'data',
            etichetta: t.evento.cambiaData,
            Icona: CalendarDays,
            fai: () => {
              const base = evento ? new Date(evento.inizio) : new Date();
              setBozzaData(base);
              setBozzaFine(evento?.fine ? new Date(evento.fine) : base);
              setTestoData(
                `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-${String(base.getDate()).padStart(2, '0')} ${String(base.getHours()).padStart(2, '0')}:${String(base.getMinutes()).padStart(2, '0')}`
              );
              setVentaglio(false);
              setFoglio('data');
            },
          },
          {
            chiave: 'luogo',
            etichetta: t.evento.cambiaLuogo,
            Icona: MapPin,
            fai: () => {
              setVentaglio(false);
              setFoglio('luogo');
            },
          },
          {
            chiave: 'tipo',
            etichetta: t.evento.cambiaTipo,
            Icona: Tag,
            fai: () => {
              setVentaglio(false);
              setFoglio('tipo');
            },
          },
          {
            chiave: 'elimina',
            etichetta: t.calendario.elimina,
            Icona: Trash2,
            fai: () => {
              setVentaglio(false);
              setFoglio('elimina');
            },
          },
        ]
      : []),
  ];

  return (
    <View className="flex-1">
      <Fondo />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <Animated.ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          // ⚠️ Fondo **bianco sullo scorrimento**, non sul foglio.
          //
          // Il difetto visto sull'iPhone: sotto l'ultimo elemento il foglio
          // finiva e ricompariva la sfumatura rosa della pagina — «sembra
          // tagliato, non c'e' continuita'». Un `minHeight` sul foglio non lo
          // risolve davvero: indovina un'altezza, e sbaglia su ogni telefono di
          // taglia diversa. Colorare lo **scorrimento** invece lo risolve per
          // costruzione: qualunque cosa avanzi sotto il contenuto e' bianca,
          // che e' esattamente il colore del foglio.
          style={{ backgroundColor: '#ffffff' }}
          contentContainerStyle={{ paddingBottom: 130 }}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scorrimento } } }],
            { useNativeDriver: true }
          )}
        >
          {/* --- LA TESTA: immagine a tutto schermo -------------------------
              ⚠️ Questo **rovescia meta' di D-38**, che aveva messo l'hero
              dentro una card arrotondata coi margini (riferimento: lo yacht).
              Il riferimento nuovo — lo shot "Hotel Booking" del 2026-08-27 —
              fa l'opposto: l'immagine arriva ai bordi e sotto le sale addosso
              un foglio bianco arrotondato che la taglia.
              Perche' e' meglio *qui*: l'immagine di un evento e' un ricordo, e
              un ricordo dentro una cornice con i margini si legge come una
              figurina. A tutto schermo si legge come "eri li'". La card resta
              giusta dove l'elemento e' **uno fra tanti** in un elenco (le
              schede dei preferiti, le righe evento) — li' non si tocca. */}
          {/* Altezza in **proporzione allo schermo**, non 360 fissi: su un
              telefono grande 360 punti erano una striscia, e l'immagine
              sembrava non riempire niente. 44% lascia al foglio poco piu' della
              meta', che e' il rapporto dello shot di riferimento. */}
          <Pressable
            disabled={foto.length === 0}
            onPress={() => setVisore(0)}
            style={{
              height: Math.round(altezzaSchermo * (copertina ? 0.44 : 0.28)),
              overflow: 'hidden',
            }}
          >
            <Animated.View
              style={{
                width: '100%',
                height: '100%',
                transform: [{ translateY: spostaTesta }, { scale: scalaTesta }],
              }}
            >
              {copertina ? (
                <Image
                  source={{ uri: copertina }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient colors={['#f7b8dd', '#ffe4ec']} style={{ flex: 1 }} />
              )}
            </Animated.View>
            {/* Velatura solo in alto: serve al bottone di ritorno, che altrimenti
                su un cielo chiaro sparisce. In basso non serve piu' — il testo
                non sta piu' sull'immagine, sta sul foglio bianco. */}
            <LinearGradient
              colors={['rgba(12,4,9,0.38)', 'rgba(0,0,0,0)']}
              locations={[0, 0.45]}
              style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 160 }}
            />

            {/* Il tondo bianco galleggiante dello shot di riferimento.
                ⚠️ Il cerchio sta sulla `View`, non sul `Pressable`: con lo
                stile-funzione non compariva affatto (vedi `barra-volante.tsx`). */}
            <View
              style={{
                position: 'absolute',
                left: 16,
                top: insets.top + 6,
                width: 42,
                height: 42,
                borderRadius: 21,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ffffff',
                shadowColor: 'rgba(20,6,12,0.35)',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 1,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel={t.calendario.chiudi}
                hitSlop={10}
              >
                <View
                  style={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}
                >
                  <ChevronLeft color={tema.c.testo} size={22} />
                </View>
              </Pressable>
            </View>
          </Pressable>

          {/* --- IL FOGLIO: sale sopra l'immagine e la taglia ---------------- */}
          <View
            style={{
              marginTop: -30,
              backgroundColor: '#ffffff',
              borderTopLeftRadius: 34,
              borderTopRightRadius: 34,
              paddingTop: 10,
              paddingHorizontal: 20,
              gap: 18,
            }}
          >
            {/* La maniglia: due punti di altezza che dicono "questo e' un
                foglio", ed e' l'unico segnale che nel riferimento distingue il
                pannello dall'immagine senza aggiungere un bordo. */}
            <View
              style={{
                alignSelf: 'center',
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: tema.c.linea,
              }}
            />

            {/* --- titolo, tipo, luogo -------------------------------------- */}
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <Text className="flex-1 font-serif-bold text-3xl text-foreground">
                  {evento.titolo}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    backgroundColor: pastello.fondo,
                    borderRadius: 12,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    marginTop: 4,
                  }}
                >
                  <Icona color={pastello.testo} size={13} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: pastello.testo }}>
                    {t.calendario.tipi[(evento.tipo as TipoEvento) ?? 'impegno']}
                  </Text>
                </View>
              </View>

              {luogo ? (
                <Pressable
                  onPress={() => router.push('/mappa')}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
                >
                  <MapPin color={tema.c.tenue} size={14} />
                  <Text className="text-base text-muted-foreground">{luogo.nome}</Text>
                </Pressable>
              ) : (
                <Text className="text-base text-muted-foreground">{dataEstesa}</Text>
              )}
            </View>

            {/* --- LE FOTO: la striscia dello shot di riferimento -------------
                Non piu' la griglia a due colonne. Su una pagina che ha gia'
                un'immagine grande in testa, una seconda griglia di immagini
                raddoppia il peso visivo senza aggiungere informazione: la
                striscia dice **quante ce ne sono** e come sono, e il visore a
                schermo pieno resta a un tocco.

                ⚠️ La striscia dichiara **altezza fissa** e `flexGrow: 0`.
                Senza, la lista orizzontale contende lo spazio verticale al
                contenitore e si prende molto piu' dei suoi 82 punti:
                sull'iPhone si vedeva un buco enorme fra le miniature e
                "DETTAGLI". E' lo stesso inciampo gia' registrato per la
                striscia dei giorni del calendario — la seconda volta, quindi
                vale come regola: una lista orizzontale dentro una colonna
                dichiara la sua altezza. */}
            {foto.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ height: 82, flexGrow: 0 }}
                contentContainerStyle={{ gap: 8, paddingRight: 4 }}
              >
                {foto.slice(0, MINIATURE).map((f, indice) => (
                  <Pressable
                    key={f.id}
                    onPress={() => url[f.chiave_storage] && setVisore(indice)}
                    style={{ width: 82, height: 82, borderRadius: 16, overflow: 'hidden' }}
                  >
                    {url[f.chiave_storage] ? (
                      <Image
                        source={{ uri: url[f.chiave_storage] }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="flex-1 items-center justify-center bg-muted">
                        <ActivityIndicator color={tema.c.accento} />
                      </View>
                    )}
                    {/* L'ultima miniatura porta il conto di quelle che non si
                        vedono, velata — e' il riquadro "48 more" del riferimento. */}
                    {indice === MINIATURE - 1 && foto.length > MINIATURE && (
                      <View
                        style={{
                          ...StyleSheet.absoluteFillObject,
                          backgroundColor: 'rgba(18,7,11,0.58)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '700' }}>
                          {t.evento.altreFoto(foto.length - MINIATURE)}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            )}
            {caricando && <ActivityIndicator color={tema.c.accento} />}

            {/* --- I FATTI: pillole con bordo, come nel riferimento ---------- */}
            <View style={{ gap: 8 }}>
              <Text className="text-xs uppercase tracking-wide text-muted-foreground">
                {t.evento.dettagli}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <Fatto Icona={CalendarDays} testo={dataEstesa} />
                <Fatto Icona={Clock} testo={oraEstesa} />
                {/* ⚠️ **Niente pillola del posto qui** (2026-08-27, richiesta
                    dell'utente). Il posto sta gia' **sotto il titolo**, in
                    cima alla pagina, con la sua icona e il tocco che porta
                    alla mappa. Ripeterlo trenta righe piu' in basso non
                    aggiungeva niente: costringeva solo a chiedersi se i due
                    dicessero la stessa cosa. Dicevano la stessa cosa. */}
                {!!evento.categoria && <Fatto Icona={Tag} testo={evento.categoria} />}
                <Fatto
                  Icona={UserRound}
                  testo={mio ? t.calendario.daTe : t.calendario.dalPartner}
                />
              </View>
            </View>

            {!!evento.nota && (
              <Text className="text-base leading-relaxed text-foreground">{evento.nota}</Text>
            )}

            {!!erroreForm && (
              <Text className="text-sm text-destructive">{perPersone(erroreForm)}</Text>
            )}


            {/* --- I COMMENTI --------------------------------------------------
                Chiesti dall'utente il 2026-08-27: *«agli eventi voglio che ci
                sia la possibilita' di lasciare dei commenti da parte di
                entrambi i partner»*.

                ⚠️ **E' la stessa sezione che poche ore prima si chiamava
                «Parole» ed era stata tolta.** Il nome era il problema: "Parole"
                non diceva che quello fosse il posto dove ci si scrive, e
                toglierla significava togliere i commenti senza che si vedesse
                che erano commenti. Ora si chiama con il suo nome.

                ⚠️ **Entrambi possono scrivere, e non e' una gentilezza di
                questa schermata: e' il database.** La policy `commento_insert`
                (migrazione 0008) chiede `e_membro_attivo(coppia_id)` — cioe'
                *un* membro della coppia, non l'autore dell'evento — e
                `autore_id = auth.uid()`, che rende impossibile scrivere a nome
                dell'altro. E' la differenza esplicita fra l'evento e i suoi
                commenti: **l'evento e' di chi l'ha scritto, i commenti sono di
                tutti e due.** Cancellare, invece, resta solo i propri
                (`commento_delete`), e qui il cestino compare di conseguenza —
                non per nascondere un errore, ma per non offrire un gesto che
                il database rifiuterebbe. */}
            <View className="gap-2">
              <Text className="text-xs uppercase tracking-wide text-muted-foreground">
                {t.evento.commenti}
              </Text>

              {commenti.length === 0 && (
                <Text className="text-sm text-muted-foreground">{t.evento.nessunCommento}</Text>
              )}

              {/* Su un foglio bianco il vetro non ha niente da lasciar
                  trasparire: qui i commenti sono carte tenui col bordo, che e'
                  cio' che il riferimento usa per i blocchi secondari.

                  Entrano **a onda** come ogni altro elenco dell'app (D-53): il
                  ritardo ha gia' il suo tetto dentro `cascata`, quindi un filo
                  di trenta commenti non diventa un'attesa. */}
              {commenti.map((commento, n) => {
                const mioCommento = commento.autore_id === session?.user.id;
                return (
                  <Comparsa key={commento.id} visibile ritardo={cascata(n)} scarto={12} scala={0.98}>
                    <View
                      style={{
                        backgroundColor: '#fdf7fb',
                        borderRadius: 20,
                        borderWidth: StyleSheet.hairlineWidth * 2,
                        borderColor: tema.c.linea,
                      }}
                    >
                      <View className="gap-1 p-4">
                        <Text className="text-base text-foreground">{commento.testo}</Text>
                        <View className="flex-row items-center justify-between">
                          <Text className="text-xs text-muted-foreground">
                            {mioCommento ? t.calendario.daTe : t.calendario.dalPartner}
                            {' · '}
                            {new Date(commento.creato_il).toLocaleDateString(lingua, {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </Text>
                          {mioCommento && (
                            <Premibile
                              onPress={() => cancellaCommento(commento.id)}
                              hitSlop={8}
                              scala={0.82}
                            >
                              <Trash2 color={tema.c.pericolo} size={16} />
                            </Premibile>
                          )}
                        </View>
                      </View>
                    </View>
                  </Comparsa>
                );
              })}

              <View className="flex-row items-center gap-2 pt-1">
                <Input
                  className="flex-1"
                  value={testo}
                  onChangeText={setTesto}
                  placeholder={t.evento.scrivi}
                  onSubmitEditing={invia}
                  returnKeyType="send"
                  accessibilityLabel={t.evento.scrivi}
                />
                <TondoVetro
                  lato={52}
                  onPress={invia}
                  disabled={attesa || testo.trim().length === 0}
                >
                  {attesa ? (
                    <ActivityIndicator color={tema.c.accento} />
                  ) : (
                    <Text style={{ color: tema.c.accento, fontSize: 24, lineHeight: 28 }}>→</Text>
                  )}
                </TondoVetro>
              </View>
            </View>
          </View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>

      {/* --- L'INGRANAGGIO: il ventaglio delle azioni ----------------------- */}
      <SafeAreaView
        edges={['bottom']}
        pointerEvents="box-none"
        style={{ position: 'absolute', right: 20, bottom: 10, alignItems: 'flex-end' }}
      >
        {ventaglio && (
          <View className="items-end gap-2 pb-3">
            {azioni.map((a) => (
              <Pressable key={a.chiave} onPress={a.fai}>
                <Vetro raggio={22} tinto={a.chiave === 'elimina' ? false : true}>
                  <View className="flex-row items-center gap-2 px-4" style={{ height: 44 }}>
                    <a.Icona
                      color={a.chiave === 'elimina' ? tema.c.pericolo : tema.c.accento}
                      size={17}
                    />
                    <Text
                      className="text-sm font-medium"
                      style={{
                        color: a.chiave === 'elimina' ? tema.c.pericolo : tema.c.testo,
                      }}
                    >
                      {a.etichetta}
                    </Text>
                  </View>
                </Vetro>
              </Pressable>
            ))}
          </View>
        )}
        <TondoVetro lato={58} onPress={() => setVentaglio((v) => !v)}>
          {ventaglio ? (
            <X color={tema.c.accento} size={24} />
          ) : (
            <Settings color={tema.c.accento} size={24} />
          )}
        </TondoVetro>
      </SafeAreaView>

      {/* --- IL VISORE ------------------------------------------------------
          Non e' piu' costruito qui: sta in `components/visore-foto.tsx` ed e'
          lo stesso della galleria. Ne esistevano due, e si comportavano
          diversamente — uno sfogliava, l'altro no. «La galleria deve essere
          coerente con la visualizzazione foto degli eventi» si risolve
          tenendone uno, non riallineandone due a ogni modifica. */}
      <VisoreFoto
        foto={foto}
        url={url}
        indice={visore}
        mioId={session?.user.id}
        azioni={azioniFoto}
        onChiudi={() => setVisore(null)}
      />

      {/* --- i fogli delle azioni ------------------------------------------- */}
      <Modal
        visible={foglio !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setFoglio(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(20,8,14,0.4)' }}
        >
          {/* `fondo="pieno"`: sotto c'e' la velatura scura del modale, e senza
              base il vetro la sfoca e si legge «in ombra». */}
          <CartaVetro raggio={30} fondo="pieno" style={{ margin: 8 }}>
            <SafeAreaView edges={['bottom']}>
              <View className="gap-4 p-6">
                {foglio === 'descrizione' && (
                  <>
                    <Text className="font-serif-bold text-2xl text-foreground">
                      {t.evento.aggiungiDescrizione}
                    </Text>
                    <Input
                      value={bozzaNota}
                      onChangeText={setBozzaNota}
                      placeholder={t.calendario.placeholderNota}
                      multiline
                      className="h-28"
                      style={{ textAlignVertical: 'top', paddingTop: 12 }}
                      autoFocus
                    />
                    <BottoneVetro
                      variante="accento"
                      onPress={async () => {
                        const err = await aggiorna({ nota: bozzaNota.trim() || null });
                        if (err) return setErroreForm(err);
                        setFoglio(null);
                      }}
                    >
                      <Text>{t.calendario.salva}</Text>
                    </BottoneVetro>
                  </>
                )}

                {foglio === 'data' && (
                  <>
                    <Text className="font-serif-bold text-2xl text-foreground">
                      {t.evento.cambiaData}
                    </Text>
                    {Platform.OS === 'web' ? (
                      <Input value={testoData} onChangeText={setTestoData} autoCapitalize="none" />
                    ) : (
                      <View className="items-start">
                        <DateTimePicker
                          value={bozzaData}
                          mode={evento.tutto_il_giorno ? 'date' : 'datetime'}
                          display="compact"
                          onChange={(_, d) => d && setBozzaData(d)}
                        />
                        {evento.fine && (
                          <>
                            <Text className="pt-2 text-sm text-muted-foreground">
                              {t.calendario.ritorno}
                            </Text>
                            <DateTimePicker
                              value={bozzaFine}
                              mode="date"
                              display="compact"
                              minimumDate={bozzaData}
                              onChange={(_, d) => d && setBozzaFine(d)}
                            />
                          </>
                        )}
                      </View>
                    )}
                    <BottoneVetro
                      variante="accento"
                      onPress={async () => {
                        let quando = bozzaData;
                        if (Platform.OS === 'web') {
                          const p = new Date(testoData.replace(' ', 'T'));
                          if (isNaN(p.getTime()))
                            return setErroreForm(t.calendario.dataNonValida);
                          quando = p;
                        }
                        const err = await aggiorna({
                          inizio: quando.toISOString(),
                          ...(evento.fine ? { fine: bozzaFine.toISOString() } : {}),
                        });
                        if (err) return setErroreForm(err);
                        setFoglio(null);
                      }}
                    >
                      <Text>{t.calendario.salva}</Text>
                    </BottoneVetro>
                  </>
                )}

                {foglio === 'tipo' && (
                  <>
                    <Text className="font-serif-bold text-2xl text-foreground">
                      {t.evento.cambiaTipo}
                    </Text>
                    {/* Ogni tag col **suo** colore e la **sua** icona, presi da
                        `aspetto()` invece che riscritti qui: e' la stessa
                        funzione che colora le pillole del calendario e i pin,
                        quindi il verde della vacanza e' un verde solo in tutta
                        l'app. Una seconda tabella di colori qui sarebbe
                        divergente al primo ritocco. */}
                    <View style={{ gap: 10 }}>
                      {TIPI.map((x) => {
                        const suo = aspetto({ ...evento, tipo: x, speciale: null });
                        const scelto = (evento.tipo ?? 'impegno') === x;
                        return (
                          <Premibile
                            key={x}
                            scala={0.975}
                            onPress={async () => {
                              if (scelto) return setFoglio(null);
                              /**
                               * ⚠️ **La vacanza ha una forma diversa**: e' un
                               * intervallo a giornate intere, non un istante
                               * (vedi `salva()` in `app/(tabs)/calendario.tsx`).
                               * Passando a vacanza si porta dietro il minimo
                               * che la rende coerente — una fine, che in
                               * mancanza d'altro e' il giorno stesso, e le
                               * giornate intere. La data di ritorno vera si
                               * mette poi con «Cambia data».
                               *
                               * ⚠️ Uscendo da vacanza **non si cancella
                               * niente**: la fine resta dov'e'. Azzerarla
                               * sarebbe distruggere una data che l'utente
                               * aveva scelto, per un cambio di tag — e
                               * ricambiare idea non la riporterebbe indietro.
                               */
                              const extra =
                                x === 'vacanza'
                                  ? {
                                      fine: evento.fine ?? evento.inizio,
                                      tutto_il_giorno: true,
                                    }
                                  : {};
                              const err = await aggiorna({ tipo: x, ...extra });
                              if (err) return setErroreForm(err);
                              setFoglio(null);
                            }}
                          >
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 12,
                                padding: 14,
                                borderRadius: 18,
                                backgroundColor: suo.pastello.fondo,
                                borderWidth: scelto ? 2 : StyleSheet.hairlineWidth * 2,
                                borderColor: scelto ? suo.pastello.testo : 'transparent',
                              }}
                            >
                              <suo.Icona color={suo.pastello.testo} size={20} />
                              <Text
                                style={{
                                  flex: 1,
                                  fontSize: 16,
                                  fontWeight: scelto ? '700' : '500',
                                  color: suo.pastello.testo,
                                }}
                              >
                                {t.calendario.tipi[x]}
                              </Text>
                              {scelto && <Check color={suo.pastello.testo} size={18} />}
                            </View>
                          </Premibile>
                        );
                      })}
                    </View>
                    <BottoneVetro altezza={48} onPress={() => setFoglio(null)}>
                      <Text>{t.calendario.annulla}</Text>
                    </BottoneVetro>
                  </>
                )}

                {foglio === 'luogo' && (
                  <>
                    <Text className="font-serif-bold text-2xl text-foreground">
                      {t.evento.cambiaLuogo}
                    </Text>
                    {/* ⚠️ Imposta **entrambi** i legami, `luogo_id` e
                        `elemento_id`, e sceglie dalla stessa lista del form del
                        nuovo evento.

                        Prima creava un `luogo` nudo e scriveva solo `luogo_id`:
                        due difetti che altrove erano gia' stati chiusi e qui
                        erano rimasti. Il primo lasciava un posto senza scheda in
                        lista (B-11); il secondo produceva eventi legati al posto
                        per un verso solo — quelli che poi non comparivano
                        toccando il luogo (B-12). */}
                    <CercaLuogo
                      dentroUnFoglio
                      onScegli={async (trovato) => {
                        const gia = trovato.placeId
                          ? luoghiLista.find((l) => l.google_place_id === trovato.placeId)
                          : undefined;
                        if (gia) {
                          const err = await aggiorna({
                            luogo_id: gia.luogo_id,
                            elemento_id: gia.id,
                          });
                          if (err) return setErroreForm(err);
                          setFoglio(null);
                          return;
                        }
                        const esito = await aggiungiLuogoPreferito(trovato, ricaricaCoppia);
                        if (esito.errore) return setErroreForm(esito.errore);
                        const err = await aggiorna({
                          luogo_id: esito.luogoId ?? null,
                          elemento_id: esito.elementoId ?? null,
                        });
                        if (err) return setErroreForm(err);
                        setFoglio(null);
                      }}
                    />
                    <View className="flex-row flex-wrap gap-2">
                      <Pressable
                        onPress={async () => {
                          const err = await aggiorna({ luogo_id: null, elemento_id: null });
                          if (err) return setErroreForm(err);
                          setFoglio(null);
                        }}
                        className="rounded-full bg-card px-3 py-2"
                      >
                        <Text className="text-xs text-muted-foreground">
                          {t.calendario.nessunPosto}
                        </Text>
                      </Pressable>
                      {luoghiLista.map((l) => (
                        <Pressable
                          key={l.id}
                          onPress={async () => {
                            const err = await aggiorna({
                              luogo_id: l.luogo_id,
                              elemento_id: l.id,
                            });
                            if (err) return setErroreForm(err);
                            setFoglio(null);
                          }}
                          className="rounded-full bg-card px-3 py-2"
                        >
                          <Text className="text-xs text-foreground">{l.titolo}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </>
                )}

                {foglio === 'elimina' && (
                  <>
                    <Text className="font-serif-bold text-2xl text-foreground">
                      {t.calendario.elimina}
                    </Text>
                    <Text className="text-base text-muted-foreground">
                      {t.evento.confermaElimina}
                    </Text>
                    <BottoneVetro
                      variante="pericolo"
                      onPress={async () => {
                        const err = await eliminaEvento();
                        if (err) {
                          setErroreForm(err);
                          setFoglio(null);
                          return;
                        }
                        setFoglio(null);
                        router.back();
                      }}
                    >
                      <Text>{t.calendario.elimina}</Text>
                    </BottoneVetro>
                  </>
                )}

                <BottoneVetro altezza={46} onPress={() => setFoglio(null)}>
                  <Text>{t.calendario.annulla}</Text>
                </BottoneVetro>
              </View>
            </SafeAreaView>
          </CartaVetro>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

/**
 * Un **fatto** dell'evento: pillola col bordo, icona e testo — la forma dei
 * chip "150 m² · 4 guests · 1 bath" dello shot di riferimento.
 *
 * Sostituisce le righe icona+testo impilate che c'erano prima. Il motivo non e'
 * estetico: le righe occupavano una riga a testa e spingevano le foto e i
 * commenti sotto la piega, mentre i fatti di un evento sono quattro parole
 * ciascuno e stanno comodamente su due righe in tutto. Meno spazio speso per
 * dire le stesse cose.
 */
function Fatto({
  Icona,
  testo,
  colore,
}: {
  Icona: React.ComponentType<{ color?: string; size?: number }>;
  testo: string;
  colore?: string;
}) {
  const { c } = useTema();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth * 2,
        borderColor: c.linea,
        backgroundColor: '#fdf7fb',
        maxWidth: '100%',
      }}
    >
      <Icona color={colore ?? c.tenue} size={15} />
      <Text numberOfLines={1} style={{ fontSize: 13, color: c.testo, flexShrink: 1 }}>
        {testo}
      </Text>
    </View>
  );
}
