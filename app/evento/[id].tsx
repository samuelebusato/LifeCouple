import * as React from 'react';
import {
  View,
  ActivityIndicator,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
  Animated,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  Trash2,
  UtensilsCrossed,
  X,
} from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BottoneVetro, CartaVetro, TondoVetro, Vetro } from '@/components/ui/vetro';
import { Fondo } from '@/components/schermata';
import { CercaLuogo } from '@/components/cerca-luogo';
import { aspetto } from '@/components/riga-evento';
import { useTema } from '@/lib/tema';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useCoppia } from '@/lib/coppia';
import { useLuoghi } from '@/lib/luoghi';
import { useEventoDettaglio } from '@/lib/evento-dettaglio';
import { caricaFoto, indirizziFirmati, scegliFoto } from '@/lib/foto';
import type { TipoEvento } from '@/lib/eventi';
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
export default function PaginaEvento() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const { coppiaId, ricarica: ricaricaCoppia } = useCoppia();
  const { luoghi } = useLuoghi(coppiaId);
  const {
    evento,
    luogo,
    ristorante,
    commenti,
    foto,
    loading,
    errore,
    ricarica,
    commenta,
    cancellaCommento,
    aggiorna,
    eliminaEvento,
  } = useEventoDettaglio(id);

  const tema = useTema();
  const [testo, setTesto] = React.useState('');
  const [url, setUrl] = React.useState<Record<string, string>>({});
  const [caricando, setCaricando] = React.useState(false);
  const [attesa, setAttesa] = React.useState(false);
  const [erroreForm, setErroreForm] = React.useState<string | null>(null);

  // --- l'ingranaggio e i suoi fogli -----------------------------------------
  const [ventaglio, setVentaglio] = React.useState(false);
  const [foglio, setFoglio] = React.useState<null | 'descrizione' | 'data' | 'luogo' | 'elimina'>(null);
  const [bozzaNota, setBozzaNota] = React.useState('');
  const [bozzaData, setBozzaData] = React.useState(new Date());
  const [bozzaFine, setBozzaFine] = React.useState(new Date());
  const [testoData, setTestoData] = React.useState('');
  /** Indice della foto aperta a schermo pieno (null = visore chiuso). */
  const [visore, setVisore] = React.useState<number | null>(null);
  const { width: larghezzaSchermo } = useWindowDimensions();

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

  const { Icona, colore } = aspetto(evento, tema.scuro);
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
          contentContainerStyle={{ paddingBottom: 130 }}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scorrimento } } }],
            { useNativeDriver: true }
          )}
        >
          {/* --- la testa: una CARD arrotondata coi margini, come lo yacht
              dello screenshot — non piu' a tutto schermo. Si tocca per aprire
              il visore; si allarga tirando giu' e un po' anche scorrendo. */}
          <SafeAreaView edges={['top']} className="px-3 pt-1">
          <Pressable
            disabled={foto.length === 0}
            onPress={() => setVisore(0)}
            style={{ height: copertina ? 330 : 190, overflow: 'hidden', borderRadius: 40 }}
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
                <LinearGradient
                  colors={tema.scuro ? ['#2b1d21', '#1b1315'] : ['#ffe4ec', '#fff8fa']}
                  style={{ flex: 1 }}
                />
              )}
            </Animated.View>
            <LinearGradient
              colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0)', copertina ? 'rgba(18,7,11,0.82)' : 'rgba(18,7,11,0.25)']}
              locations={[0, 0.4, 1]}
              style={{ position: 'absolute', inset: 0 }}
            />

            {/* La card sta gia' sotto la status bar: il back vive DENTRO
                l'immagine, in alto a sinistra, come nello screenshot. */}
            <View style={{ position: 'absolute', left: 14, top: 14 }}>
              <TondoVetro lato={42} tinto={false} onPress={() => router.back()}>
                <ChevronLeft color={tema.c.testo} size={22} />
              </TondoVetro>
            </View>

            <View className="absolute inset-x-0 bottom-0 gap-1 p-5">
              <View className="flex-row items-center gap-1.5">
                <Icona color="#ffffff" size={14} />
                <Text
                  className="text-xs uppercase tracking-wide"
                  style={{ color: 'rgba(255,255,255,0.9)' }}
                >
                  {t.calendario.tipi[(evento.tipo as TipoEvento) ?? 'impegno']}
                </Text>
              </View>
              <Text
                className="font-serif-bold text-3xl"
                style={{ color: copertina || tema.scuro ? '#ffffff' : tema.c.testo }}
              >
                {evento.titolo}
              </Text>
            </View>
          </Pressable>
          </SafeAreaView>

          {/* --- le righe di dettaglio, come nello screenshot ---------------- */}
          <View className="gap-4 px-5 pt-4">
            <CartaVetro raggio={24}>
              <View className="gap-3 p-4">
                <RigaDettaglio Icona={CalendarDays} testo={dataEstesa} colore={tema.c.accento} />
                <RigaDettaglio Icona={Clock} testo={oraEstesa} colore={tema.c.accento} />
                {luogo && (
                  <Pressable onPress={() => router.push('/mappa')}>
                    <RigaDettaglio Icona={MapPin} testo={luogo.nome} colore={tema.c.accento} />
                  </Pressable>
                )}
                {ristorante && (
                  <RigaDettaglio
                    Icona={UtensilsCrossed}
                    testo={ristorante.titolo}
                    colore="#d98e2b"
                  />
                )}
                {!!evento.categoria && (
                  <Text className="text-xs uppercase tracking-wide text-muted-foreground">
                    {evento.categoria}
                  </Text>
                )}
                {!!evento.nota && (
                  <Text className="text-base leading-relaxed text-foreground">{evento.nota}</Text>
                )}
                <Text className="text-xs text-muted-foreground">
                  {mio ? t.calendario.daTe : t.calendario.dalPartner}
                </Text>
              </View>
            </CartaVetro>

            {!!erroreForm && (
              <Text className="text-sm text-destructive">{perPersone(erroreForm)}</Text>
            )}

            {/* --- LE FOTO: toccare = allargare ------------------------------ */}
            <View className="gap-2">
              <Text className="text-xs uppercase tracking-wide text-muted-foreground">
                {t.evento.foto}
              </Text>
              {foto.length === 0 && (
                <Text className="text-sm text-muted-foreground">{t.evento.fotoInArrivo}</Text>
              )}
              <View className="flex-row flex-wrap">
                {foto.map((f, indice) => (
                  <View key={f.id} className="w-1/2 p-1">
                    <Pressable onPress={() => url[f.chiave_storage] && setVisore(indice)}>
                      <View className="aspect-[4/3] overflow-hidden rounded-4xl bg-card">
                        {url[f.chiave_storage] ? (
                          <Image
                            source={{ uri: url[f.chiave_storage] }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="flex-1 items-center justify-center">
                            <ActivityIndicator color={tema.c.accento} />
                          </View>
                        )}
                      </View>
                    </Pressable>
                  </View>
                ))}
              </View>
              {caricando && <ActivityIndicator color={tema.c.accento} />}
            </View>

            {/* --- LE PAROLE -------------------------------------------------- */}
            <View className="gap-2">
              <Text className="text-xs uppercase tracking-wide text-muted-foreground">
                {t.evento.commenti}
              </Text>

              {commenti.length === 0 && (
                <Text className="text-sm text-muted-foreground">{t.evento.nessunCommento}</Text>
              )}

              {commenti.map((c) => (
                <CartaVetro key={c.id} raggio={20} ombra={false}>
                  <View className="gap-1 p-4">
                    <Text className="text-base text-foreground">{c.testo}</Text>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs text-muted-foreground">
                        {c.autore_id === session?.user.id
                          ? t.calendario.daTe
                          : t.calendario.dalPartner}
                        {' · '}
                        {new Date(c.creato_il).toLocaleDateString(lingua, {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </Text>
                      {c.autore_id === session?.user.id && (
                        <Pressable onPress={() => cancellaCommento(c.id)} hitSlop={8}>
                          <Trash2 color={tema.c.pericolo} size={16} />
                        </Pressable>
                      )}
                    </View>
                  </View>
                </CartaVetro>
              ))}

              <View className="flex-row items-center gap-2 pt-1">
                <Input
                  className="flex-1"
                  value={testo}
                  onChangeText={setTesto}
                  placeholder={t.evento.scrivi}
                  onSubmitEditing={invia}
                  returnKeyType="send"
                />
                <TondoVetro lato={52} onPress={invia} disabled={attesa || testo.trim().length === 0}>
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

      {/* --- il visore: schermo pieno, e col dito si scorrono le altre ------- */}
      <Modal
        visible={visore !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setVisore(null)}
      >
        <View className="flex-1" style={{ backgroundColor: 'rgba(12,6,9,0.96)' }}>
          <SafeAreaView className="flex-1">
            <FlatList
              data={foto}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(f) => f.id}
              initialScrollIndex={visore ?? 0}
              getItemLayout={(_, i) => ({
                length: larghezzaSchermo,
                offset: i * larghezzaSchermo,
                index: i,
              })}
              renderItem={({ item: f }) => (
                <View style={{ width: larghezzaSchermo }}>
                  {url[f.chiave_storage] ? (
                    <Image
                      source={{ uri: url[f.chiave_storage] }}
                      style={{ flex: 1, width: '100%' }}
                      resizeMode="contain"
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <ActivityIndicator color={tema.c.accento} />
                    </View>
                  )}
                </View>
              )}
            />
            <View className="items-start px-5 pb-3">
              <TondoVetro lato={48} tinto={false} onPress={() => setVisore(null)}>
                <X color={tema.c.testo} size={20} />
              </TondoVetro>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

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
          <CartaVetro raggio={30} style={{ margin: 8 }}>
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

                {foglio === 'luogo' && (
                  <>
                    <Text className="font-serif-bold text-2xl text-foreground">
                      {t.evento.cambiaLuogo}
                    </Text>
                    <CercaLuogo
                      onScegli={async (trovato) => {
                        // Il posto cercato prima si crea, poi si aggancia: due
                        // scritture, un solo gesto per chi guarda.
                        const { data, error } = await supabase
                          .from('luogo')
                          .insert({
                            coppia_id: evento.coppia_id,
                            nome: trovato.nome,
                            lat: trovato.lat,
                            lng: trovato.lng,
                            stato: 'desiderato',
                          })
                          .select('id')
                          .single();
                        if (error) return setErroreForm(error.message);
                        const err = await aggiorna({ luogo_id: data.id });
                        if (err) return setErroreForm(err);
                        setFoglio(null);
                      }}
                    />
                    <View className="flex-row flex-wrap gap-2">
                      <Pressable
                        onPress={async () => {
                          const err = await aggiorna({ luogo_id: null });
                          if (err) return setErroreForm(err);
                          setFoglio(null);
                        }}
                        className="rounded-full bg-card px-3 py-2"
                      >
                        <Text className="text-xs text-muted-foreground">
                          {t.calendario.nessunPosto}
                        </Text>
                      </Pressable>
                      {luoghi.map((l) => (
                        <Pressable
                          key={l.id}
                          onPress={async () => {
                            const err = await aggiorna({ luogo_id: l.id });
                            if (err) return setErroreForm(err);
                            setFoglio(null);
                          }}
                          className="rounded-full bg-card px-3 py-2"
                        >
                          <Text className="text-xs text-foreground">{l.nome}</Text>
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

/** Una riga icona+testo del blocco dettagli: la forma dello screenshot. */
function RigaDettaglio({
  Icona,
  testo,
  colore,
}: {
  Icona: React.ComponentType<{ color?: string; size?: number }>;
  testo: string;
  colore: string;
}) {
  const { c } = useTema();
  return (
    <View className="flex-row items-center gap-3">
      <View
        className="h-8 w-8 items-center justify-center rounded-xl"
        style={{ backgroundColor: c.alone }}
      >
        <Icona color={colore} size={16} />
      </View>
      <Text className="flex-1 text-base text-foreground">{testo}</Text>
    </View>
  );
}
