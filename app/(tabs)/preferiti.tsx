import * as React from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CalendarDays, Check, ImagePlus, MapPin, Star, Trash2, X } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { CartaVetro, Vetro, BottoneVetro, TondoVetro } from '@/components/ui/vetro';
import { Fondo } from '@/components/schermata';
import { SPAZIO_BARRA } from '@/components/barra-volante';
import { CercaLuogo } from '@/components/cerca-luogo';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useCoppia } from '@/lib/coppia';
import { assicuraCoppia } from '@/lib/invito';
import { caricaFoto, copertinePerElemento, scegliFoto } from '@/lib/foto';
import { supabase } from '@/lib/supabase';
import type { Evento } from '@/lib/eventi';
import { usePreferiti, type Elemento, type TipoElemento } from '@/lib/preferiti';
import { urlFotoGoogle } from '@/lib/ricerca-luoghi';
import { useTastiera } from '@/lib/tastiera';
import { useTema } from '@/lib/tema';
import { Modal } from 'react-native';
import { t } from '@/lib/i18n';

const TIPI: TipoElemento[] = ['film', 'ristorante'];

/** Cinque stelle: toccabili quando sono le proprie, ferme quando sono dell'altro. */
function Stelle({ voto, onVoto }: { voto: number; onVoto?: (v: number) => void }) {
  const { c } = useTema();
  return (
    <View className="flex-row gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} disabled={!onVoto} onPress={() => onVoto?.(n)} hitSlop={4}>
          <Star
            color={c.accento}
            fill={n <= voto ? c.accento : 'transparent'}
            size={onVoto ? 24 : 16}
          />
        </Pressable>
      ))}
    </View>
  );
}

/**
 * La scheda di un film o di un ristorante, con la **copertina in testa**.
 *
 * La copertina e' una riga di `foto` legata all'elemento (0011): eredita cosi'
 * bucket privato, indirizzi firmati, tetto di 1 GB e "ciascuno cancella le
 * proprie", che una colonna con un indirizzo avrebbe scavalcato tutti.
 *
 * Senza copertina non resta un buco: una fascia sfumata col titolo. *Perche' non
 * lasciare la scheda piatta*: in un elenco misto, una scheda con foto e una
 * senza sembrerebbero due componenti diversi. La fascia costa nulla e tiene il
 * ritmo dell'elenco.
 */
function Scheda({
  e,
  mioId,
  copertina,
  eventi = [],
  onFatto,
  onRecensisci,
  onElimina,
  onCopertina,
  onPosto,
  onEvento,
}: {
  e: Elemento;
  mioId: string | undefined;
  copertina?: string;
  /** Le serate legate a questo ristorante (0012): toccarle apre l'evento. */
  eventi?: Evento[];
  onFatto: (fatto: boolean) => void;
  onRecensisci: (voto: number, testo: string) => void;
  onElimina: () => void;
  onCopertina: () => void;
  onPosto?: () => void;
  onEvento?: (id: string) => void;
}) {
  const { c, scuro } = useTema();
  const mia = e.recensioni.find((r) => r.autore_id === mioId) ?? null;
  const altrui = e.recensioni.filter((r) => r.autore_id !== mioId);
  const [apertaRecensione, setAperta] = React.useState(false);
  const [voto, setVoto] = React.useState(mia?.voto ?? 0);
  const [testo, setTesto] = React.useState(mia?.testo ?? '');

  const fatto = e.stato === 'fatto';

  return (
    <CartaVetro raggio={26}>
      <View style={{ borderRadius: 26, overflow: 'hidden' }}>
        {/* --- la testa: copertina o fascia --------------------------------- */}
        <View style={{ height: copertina ? 180 : 92, width: '100%' }}>
          {copertina ? (
            <Image
              source={{ uri: copertina }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={
                scuro
                  ? ['#3a1d29', '#2a141d']
                  : ['#ffd9e5', '#ffeef4']
              }
              style={{ flex: 1 }}
            />
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0)', copertina ? 'rgba(20,6,12,0.80)' : 'rgba(20,6,12,0.30)']}
            locations={[0.3, 1]}
            style={{ position: 'absolute', inset: 0 }}
          />
          <View className="absolute inset-x-0 bottom-0 flex-row items-end justify-between gap-3 p-4">
            <View className="flex-1">
              <Text
                className={cn('font-serif-bold text-2xl', fatto && 'line-through')}
                style={{ color: copertina ? '#ffffff' : c.testo }}
                numberOfLines={2}
              >
                {e.titolo}
              </Text>
              <Text
                className="text-xs"
                style={{ color: copertina ? 'rgba(255,255,255,0.78)' : c.tenue }}
              >
                {fatto ? t.preferiti.fatto : t.preferiti.daFare}
              </Text>
            </View>

            {/* Spuntare "fatto" e' il gesto piu' frequente: sta sull'immagine,
                grande, invece che in un angolo della scheda. */}
            <Pressable onPress={() => onFatto(!fatto)} hitSlop={8}>
              <View
                className="h-9 w-9 items-center justify-center rounded-full border"
                style={{
                  backgroundColor: fatto ? c.accento : 'rgba(255,255,255,0.22)',
                  borderColor: fatto ? c.accento : 'rgba(255,255,255,0.55)',
                }}
              >
                {fatto && <Check color={c.suAccento} size={18} />}
              </View>
            </Pressable>
          </View>
        </View>

        {/* --- il corpo ----------------------------------------------------- */}
        <View className="gap-3 p-4">
          <View className="flex-row items-center justify-between">
            {Platform.OS !== 'web' ? (
              <Pressable onPress={onCopertina} hitSlop={6} className="flex-row items-center gap-1.5">
                <ImagePlus color={c.tenue} size={14} />
                <Text className="text-xs text-muted-foreground">
                  {copertina ? t.preferiti.cambiaCopertina : t.preferiti.aggiungiCopertina}
                </Text>
              </Pressable>
            ) : (
              <View />
            )}
            {e.autore_id === mioId && (
              <Pressable onPress={onElimina} hitSlop={8}>
                <Trash2 color={c.pericolo} size={16} />
              </Pressable>
            )}
          </View>

          {/* Il posto del ristorante (0012): e' cio' che lo porta sulla mappa.
              Lo aggancia solo chi l'ha aggiunto (policy solo-autore). */}
          {e.tipo === 'ristorante' && (
            <View className="gap-2">
              {e.luogo ? (
                <View className="flex-row items-center gap-1.5">
                  <MapPin color="#d98e2b" size={14} />
                  <Text className="text-xs text-muted-foreground">{e.luogo.nome}</Text>
                </View>
              ) : e.autore_id === mioId && onPosto ? (
                <Pressable onPress={onPosto} hitSlop={6} className="flex-row items-center gap-1.5">
                  <MapPin color={c.tenue} size={14} />
                  <Text className="text-xs text-primary">{t.preferiti.aggiungiPosto}</Text>
                </Pressable>
              ) : null}

              {/* Le serate: da qui si arriva ai dettagli dell'evento. */}
              {eventi.length > 0 && (
                <View className="flex-row flex-wrap gap-2">
                  {eventi.map((ev) => (
                    <Pressable
                      key={ev.id}
                      onPress={() => onEvento?.(ev.id)}
                      className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
                      style={{ backgroundColor: c.alone }}
                    >
                      <CalendarDays color={c.accento} size={12} />
                      <Text className="text-xs font-medium" style={{ color: c.accento }}>
                        {ev.titolo}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Le recensioni compaiono quando la cosa e' stata fatta: prima non c'e'
              niente da recensire, e chiederlo sarebbe rumore. */}
          {fatto && (
            <View className="gap-2 border-t border-border/40 pt-3">
              {altrui.map((r) => (
                <View key={r.id} className="gap-1">
                  <View className="flex-row items-center gap-2">
                    <Stelle voto={r.voto} />
                    <Text className="text-xs text-muted-foreground">{t.preferiti.delPartner}</Text>
                  </View>
                  {!!r.testo && <Text className="text-sm text-muted-foreground">{r.testo}</Text>}
                </View>
              ))}

              {mia && !apertaRecensione ? (
                <Pressable onPress={() => setAperta(true)} className="gap-1">
                  <View className="flex-row items-center gap-2">
                    <Stelle voto={mia.voto} />
                    <Text className="text-xs text-muted-foreground">{t.preferiti.tua}</Text>
                  </View>
                  {!!mia.testo && <Text className="text-sm text-muted-foreground">{mia.testo}</Text>}
                </Pressable>
              ) : !apertaRecensione ? (
                <Pressable onPress={() => setAperta(true)}>
                  <Text className="text-sm text-primary">{t.preferiti.recensisci}</Text>
                </Pressable>
              ) : (
                <View className="gap-2">
                  <Stelle voto={voto} onVoto={setVoto} />
                  <Input
                    value={testo}
                    onChangeText={setTesto}
                    placeholder={t.preferiti.placeholderRecensione}
                  />
                  <View className="flex-row gap-2">
                    <BottoneVetro
                      style={{ flex: 1 }}
                      altezza={46}
                      variante="accento"
                      disabled={voto === 0}
                      onPress={() => {
                        onRecensisci(voto, testo);
                        setAperta(false);
                      }}
                    >
                      <Text>{t.calendario.salva}</Text>
                    </BottoneVetro>
                    <BottoneVetro altezza={46} onPress={() => setAperta(false)}>
                      <Text>{t.calendario.annulla}</Text>
                    </BottoneVetro>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </CartaVetro>
  );
}

export default function Preferiti() {
  const router = useRouter();
  const { session } = useAuth();
  const { coppiaId, ricarica: ricaricaCoppia } = useCoppia();
  const {
    elementi,
    loading,
    errore,
    aggiungi,
    segnaFatto,
    recensisci,
    elimina,
    collegaPosto,
    aggiungiRistorante,
  } = usePreferiti(coppiaId);
  const { c } = useTema();
  const { aperta: tastieraAperta } = useTastiera();

  const [tipo, setTipo] = React.useState<TipoElemento>('film');
  const [nuovo, setNuovo] = React.useState('');
  const [attesa, setAttesa] = React.useState(false);
  const [erroreForm, setErroreForm] = React.useState<string | null>(null);
  const [copertine, setCopertine] = React.useState<Record<string, string>>({});
  /** Il ristorante a cui si sta agganciando un posto (foglio con la ricerca). */
  const [postoPer, setPostoPer] = React.useState<Elemento | null>(null);
  /** Il foglio "cerca un ristorante vero" (D-37): niente testo libero. */
  const [cercaRist, setCercaRist] = React.useState(false);
  /** Le serate per ristorante: i legami evento→elemento (0012), in blocco. */
  const [eventiPer, setEventiPer] = React.useState<Record<string, Evento[]>>({});

  React.useEffect(() => {
    (async () => {
      if (!coppiaId) return setEventiPer({});
      const { data } = await supabase
        .from('evento')
        .select('*')
        .eq('coppia_id', coppiaId)
        .not('elemento_id', 'is', null)
        .order('inizio', { ascending: false });
      const mappa: Record<string, Evento[]> = {};
      for (const e of (data ?? []) as Evento[]) {
        if (!e.elemento_id) continue;
        (mappa[e.elemento_id] ??= []).push(e);
      }
      setEventiPer(mappa);
    })();
  }, [coppiaId, elementi]);

  const suoi = elementi.filter((e) => e.tipo === tipo);
  const daFare = suoi.filter((e) => e.stato !== 'fatto');
  const fatti = suoi.filter((e) => e.stato === 'fatto');

  // Le copertine si chiedono in blocco per tutto l'elenco: una richiesta per
  // scheda sarebbero N attese su una schermata che si scorre.
  const caricaCopertine = React.useCallback(async () => {
    if (elementi.length === 0) return setCopertine({});
    setCopertine(await copertinePerElemento(elementi.map((e) => e.id)));
  }, [elementi]);

  useFocusEffect(
    React.useCallback(() => {
      caricaCopertine();
    }, [caricaCopertine])
  );

  async function salva() {
    if (nuovo.trim().length === 0) return;
    setErroreForm(null);
    setAttesa(true);
    const err = await aggiungi(tipo, nuovo, ricaricaCoppia);
    setAttesa(false);
    if (err) return setErroreForm(err);
    setNuovo('');
  }

  async function copertinaPer(elementoId: string) {
    setErroreForm(null);
    const scelta = await scegliFoto();
    if (scelta.negato) return setErroreForm(t.galleria.permessoNegato);
    if (scelta.immagini.length === 0) return;
    const esito = await assicuraCoppia(coppiaId, ricaricaCoppia);
    if (!esito.coppiaId) return setErroreForm(esito.errore);
    // Una sola immagine: la copertina e' una, e caricarne cinque per poi
    // mostrarne una sarebbe spazio consumato dal tetto senza motivo.
    const r = await caricaFoto(esito.coppiaId, [scelta.immagini[0]], { elementoId });
    if (r.errore) return setErroreForm(r.errore);
    await caricaCopertine();
  }

  return (
    <View className="flex-1">
      <Fondo />
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-5 pb-3 pt-1">
          <Text className="font-serif-bold text-3xl text-foreground">{t.tab.preferiti}</Text>
        </View>

        <View className="px-5 pb-3">
          <Vetro raggio={20} ombra={false}>
            <View className="flex-row p-1">
              {TIPI.map((x) => (
                <Pressable
                  key={x}
                  onPress={() => setTipo(x)}
                  className="flex-1 items-center py-2"
                  style={{
                    borderRadius: 16,
                    backgroundColor: tipo === x ? c.aloneForte : 'transparent',
                  }}
                >
                  <Text
                    className="text-sm"
                    style={{
                      color: tipo === x ? c.accento : c.tenue,
                      fontWeight: tipo === x ? '700' : '500',
                    }}
                  >
                    {t.preferiti.tipi[x]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Vetro>
        </View>

        {/*
         * La riga di aggiunta **non e' piu' in posizione assoluta**.
         *
         * Prima stava incollata al fondo dentro un `KeyboardAvoidingView`: un
         * figlio assoluto non partecipa al flusso, quindi il contenitore non
         * poteva spostarlo e la tastiera lo copriva per intero — si scriveva
         * alla cieca. Ora e' l'ultima riga di una colonna: quando la tastiera
         * sale, sale con lei.
         */}
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color={c.accento} />
            </View>
          ) : (
            <ScrollView
              className="flex-1"
              contentContainerClassName="gap-3 px-5 pb-4"
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator={false}
            >
              {errore && <Text className="text-sm text-destructive">{errore}</Text>}

              {suoi.length === 0 && (
                <View className="items-center gap-2 py-10">
                  <Text className="font-serif text-lg text-foreground">
                    {t.preferiti.vuoto[tipo]}
                  </Text>
                </View>
              )}

              {daFare.length > 0 && (
                <Text className="pt-1 text-xs uppercase tracking-wide text-muted-foreground">
                  {t.preferiti.daFare}
                </Text>
              )}
              {daFare.map((e) => (
                <Scheda
                  key={e.id}
                  e={e}
                  mioId={session?.user.id}
                  copertina={
                    copertine[e.id] ??
                    (e.foto_google ? urlFotoGoogle(e.foto_google) : undefined)
                  }
                  eventi={eventiPer[e.id]}
                  onFatto={(f) => segnaFatto(e.id, f)}
                  onRecensisci={(v, txt) => recensisci(e, v, txt)}
                  onElimina={() => elimina(e.id)}
                  onCopertina={() => copertinaPer(e.id)}
                  onPosto={() => setPostoPer(e)}
                  onEvento={(idE) => router.push({ pathname: '/evento/[id]', params: { id: idE } })}
                />
              ))}

              {fatti.length > 0 && (
                <Text className="pt-3 text-xs uppercase tracking-wide text-muted-foreground">
                  {t.preferiti.fatti}
                </Text>
              )}
              {fatti.map((e) => (
                <Scheda
                  key={e.id}
                  e={e}
                  mioId={session?.user.id}
                  copertina={
                    copertine[e.id] ??
                    (e.foto_google ? urlFotoGoogle(e.foto_google) : undefined)
                  }
                  eventi={eventiPer[e.id]}
                  onFatto={(f) => segnaFatto(e.id, f)}
                  onRecensisci={(v, txt) => recensisci(e, v, txt)}
                  onElimina={() => elimina(e.id)}
                  onCopertina={() => copertinaPer(e.id)}
                  onPosto={() => setPostoPer(e)}
                  onEvento={(idE) => router.push({ pathname: '/evento/[id]', params: { id: idE } })}
                />
              ))}
            </ScrollView>
          )}

          {/* Lo spazio sotto serve alla barra volante — ma la barra sparisce a
              tastiera aperta, e tenerlo lascerebbe un buco sopra i tasti.
              I FILM si scrivono; i RISTORANTI si SCELGONO fra quelli veri
              (D-37): il testo libero per un posto che deve stare su una mappa
              produce solo posti che non esistono. */}
          <View
            className="gap-2 px-5 pt-2"
            style={{ paddingBottom: tastieraAperta ? 10 : SPAZIO_BARRA - 40 }}
          >
            {erroreForm && <Text className="text-sm text-destructive">{erroreForm}</Text>}
            {tipo === 'film' ? (
              <View className="flex-row items-center gap-2">
                <Input
                  className="flex-1"
                  value={nuovo}
                  onChangeText={setNuovo}
                  placeholder={t.preferiti.placeholder.film}
                  onSubmitEditing={salva}
                  returnKeyType="done"
                />
                <TondoVetro
                  lato={54}
                  onPress={salva}
                  disabled={attesa || nuovo.trim().length === 0}
                >
                  {attesa ? (
                    <ActivityIndicator color={c.accento} />
                  ) : (
                    <Text style={{ color: c.accento, fontSize: 26, lineHeight: 30 }}>+</Text>
                  )}
                </TondoVetro>
              </View>
            ) : (
              <BottoneVetro variante="accento" onPress={() => setCercaRist(true)}>
                <Text>{t.preferiti.cercaRistorante}</Text>
              </BottoneVetro>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Il foglio "cerca un ristorante vero": selezione, non invenzione. */}
      <Modal
        visible={cercaRist}
        transparent
        animationType="slide"
        onRequestClose={() => setCercaRist(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(20,8,14,0.4)' }}
        >
          <CartaVetro raggio={32} style={{ margin: 8 }}>
            <SafeAreaView edges={['bottom']}>
              <View className="gap-4 p-6">
                <View className="flex-row items-center justify-between">
                  <Text className="font-serif-bold text-2xl text-foreground">
                    {t.preferiti.cercaRistorante}
                  </Text>
                  <Pressable onPress={() => setCercaRist(false)} hitSlop={8}>
                    <X color={c.tenue} size={20} />
                  </Pressable>
                </View>
                <CercaLuogo
                  autoFocus
                  soloRistoranti
                  placeholder={t.preferiti.placeholder.ristorante}
                  onScegli={async (trovato) => {
                    setCercaRist(false);
                    const err = await aggiungiRistorante(trovato, ricaricaCoppia);
                    if (err) setErroreForm(err);
                  }}
                />
              </View>
            </SafeAreaView>
          </CartaVetro>
        </KeyboardAvoidingView>
      </Modal>

      {/* Il foglio "aggiungi il posto": la stessa ricerca della mappa. */}
      <Modal
        visible={postoPer !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setPostoPer(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(20,8,14,0.4)' }}
        >
          <CartaVetro raggio={30} style={{ margin: 8 }}>
            <SafeAreaView edges={['bottom']}>
              <View className="gap-4 p-6">
                <View className="flex-row items-center justify-between">
                  <Text className="font-serif-bold text-2xl text-foreground" numberOfLines={1}>
                    {postoPer?.titolo}
                  </Text>
                  <Pressable onPress={() => setPostoPer(null)} hitSlop={8}>
                    <X color={c.tenue} size={20} />
                  </Pressable>
                </View>
                <Text className="text-sm text-muted-foreground">{t.mappa.cercaNota}</Text>
                <CercaLuogo
                  autoFocus
                  onScegli={async (trovato) => {
                    if (!postoPer) return;
                    const err = await collegaPosto(postoPer, trovato);
                    if (err)
                      setErroreForm(err === 'solo-autore' ? t.evento.soloAutore : err);
                    setPostoPer(null);
                  }}
                />
              </View>
            </SafeAreaView>
          </CartaVetro>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
