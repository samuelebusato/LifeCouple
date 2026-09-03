import * as React from 'react';
import {
  Alert,
  View,
  Image,
  ActivityIndicator,
  Pressable,
  Platform,
  Modal,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  FolderPlus,
  ImagePlus,
  Plus,
  Trash2,
  FolderInput,
} from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { VisoreFoto } from '@/components/visore-foto';
import { Input } from '@/components/ui/input';
import { Vetro, CartaVetro, TondoVetro, BottoneVetro } from '@/components/ui/vetro';
import { Fondo, ScorrevoleSchermata } from '@/components/schermata';
import { SOPRA_BARRA } from '@/components/barra-volante';
import { useAuth } from '@/lib/auth';
import { useCoppia } from '@/lib/coppia';
import { assicuraCoppia } from '@/lib/invito';
import { supabase } from '@/lib/supabase';
import { caricaFoto, cancellaFoto, indirizziFirmati, scegliFoto } from '@/lib/foto';
import {
  cancellaCartella,
  creaCartella,
  elencaCartelle,
  spostaFoto,
  type Cartella,
} from '@/lib/cartelle';
import { useTema } from '@/lib/tema';
import { chiediConferma } from '@/lib/conferma';
import { t } from '@/lib/i18n';

type Scatto = {
  id: string;
  chiave_storage: string;
  autore_id: string;
  creato_il: string;
  cartella_id: string | null;
};

/**
 * La galleria condivisa (D-06/D-21/D-22), rifatta il 2026-08-13 nello stile
 * dell'app Foto: griglia fitta a foto grandi, con **zoom** e una sezione
 * **Cartelle** (migrazione 0011).
 *
 * Le scelte che contano:
 *
 * * **Griglia senza margini fra le foto.** Le miniature arrotondate e
 *   distanziate di prima erano sei francobolli in fila; le foto si guardano, e
 *   guardare vuol dire togliere di mezzo tutto il resto. Il vetro qui non entra:
 *   sopra le immagini sporcherebbe. Il vetro sta sui **comandi** che galleggiano.
 * * **Lo zoom e' l'unico modo onesto di dire "piu' grandi"**: quanto grande
 *   dipende da cosa si sta guardando, non da una scelta nostra fatta una volta.
 * * Si vede tutto in due, si cancella solo il proprio. Le immagini si aprono con
 *   indirizzi **firmati e temporanei**: il bucket e' privato, e nessuna foto ha
 *   un indirizzo pubblico da poter girare per sbaglio.
 */
export default function Galleria() {
  const { session } = useAuth();
  const { coppiaId, ricarica: ricaricaCoppia } = useCoppia();
  const { c } = useTema();
  const { width } = useWindowDimensions();

  const [vista, setVista] = React.useState<'foto' | 'cartelle'>('foto');
  const [colonne, setColonne] = React.useState(3);
  const [scatti, setScatti] = React.useState<Scatto[]>([]);
  const [cartelle, setCartelle] = React.useState<Cartella[]>([]);
  const [dentro, setDentro] = React.useState<Cartella | null>(null);
  const [url, setUrl] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(true);
  const [attesa, setAttesa] = React.useState(false);
  const [errore, setErrore] = React.useState<string | null>(null);
  const [creando, setCreando] = React.useState(false);
  const [nome, setNome] = React.useState('');
  /**
   * Quale foto e' aperta, come **indice** e non come oggetto.
   *
   * Prima era lo scatto singolo, e il visore mostrava quello e basta: dalla
   * galleria non si poteva sfogliare, dall'evento si'. Erano due visori
   * diversi. Ora e' uno solo (`components/visore-foto.tsx`) e vuole sapere da
   * dove partire dentro l'elenco.
   */
  const [aperta, setAperta] = React.useState<number | null>(null);
  const [spostando, setSpostando] = React.useState<Scatto | null>(null);

  const ricarica = React.useCallback(async () => {
    if (!coppiaId) {
      setScatti([]);
      setCartelle([]);
      setLoading(false);
      return;
    }
    const [foto, cart] = await Promise.all([
      supabase
        .from('foto')
        .select('id, chiave_storage, autore_id, creato_il, cartella_id')
        .eq('coppia_id', coppiaId)
        .order('creato_il', { ascending: false }),
      elencaCartelle(coppiaId),
    ]);
    setErrore(foto.error?.message ?? cart.errore);
    const righe = (foto.data ?? []) as Scatto[];
    setScatti(righe);
    setCartelle(cart.cartelle);
    // Un solo giro di firme per tutte le foto: su una schermata che si scorre,
    // una richiesta per riga sono N attese.
    setUrl(await indirizziFirmati(righe.map((r) => r.chiave_storage)));
    setLoading(false);
  }, [coppiaId]);

  // Le schede restano montate: senza questo, tornando sulla galleria si
  // vedrebbero le foto di quando l'app e' stata avviata (la lezione di D-32).
  useFocusEffect(
    React.useCallback(() => {
      ricarica();
    }, [ricarica])
  );

  const visibili = dentro ? scatti.filter((s) => s.cartella_id === dentro.id) : scatti;
  const lato = Math.floor((width - (colonne - 1) * 2) / colonne);

  async function aggiungi() {
    setErrore(null);
    const scelta = await scegliFoto();
    if (scelta.negato) return setErrore(t.galleria.permessoNegato);
    if (scelta.immagini.length === 0) return;

    setAttesa(true);
    const esito = await assicuraCoppia(coppiaId, ricaricaCoppia);
    if (!esito.coppiaId) {
      setAttesa(false);
      return setErrore(esito.errore);
    }
    const r = await caricaFoto(esito.coppiaId, scelta.immagini, { cartellaId: dentro?.id ?? null });
    setAttesa(false);
    if (r.errore) setErrore(r.errore);
    await ricarica();
  }

  async function nuovaCartella() {
    const esito = await assicuraCoppia(coppiaId, ricaricaCoppia);
    if (!esito.coppiaId) return setErrore(esito.errore);
    const r = await creaCartella(esito.coppiaId, nome);
    if (r.errore) setErrore(r.errore);
    setNome('');
    setCreando(false);
    await ricarica();
  }

  const copertina = (cartellaId: string) => {
    const prima = scatti.find((s) => s.cartella_id === cartellaId);
    return prima ? url[prima.chiave_storage] : undefined;
  };
  const quante = (cartellaId: string) =>
    scatti.filter((s) => s.cartella_id === cartellaId).length;

  return (
    <View className="flex-1">
      <Fondo />
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* --- intestazione ------------------------------------------------ */}
        <View className="flex-row items-center gap-3 px-5 pb-3 pt-1">
          {dentro && (
            <TondoVetro lato={38} tinto={false} onPress={() => setDentro(null)}>
              <ChevronLeft color={c.testo} size={20} />
            </TondoVetro>
          )}
          <View className="flex-1">
            <Text className="font-serif-bold text-3xl text-foreground" numberOfLines={1}>
              {dentro ? dentro.nome : t.tab.galleria}
            </Text>
            <Text className="pt-0.5 text-xs text-muted-foreground">
              {dentro
                ? t.galleria.nFoto(visibili.length)
                : `${t.galleria.nFoto(scatti.length)} · ${t.galleria.tetto}`}
            </Text>
          </View>
        </View>

        {/* --- Foto / Cartelle, e lo zoom ---------------------------------- */}
        {!dentro && (
          <View className="flex-row items-center justify-between gap-3 px-5 pb-3">
            <Vetro raggio={18} ombra={false}>
              <View className="flex-row p-1">
                {(['foto', 'cartelle'] as const).map((v) => (
                  <Pressable
                    key={v}
                    onPress={() => setVista(v)}
                    className="rounded-2xl px-4 py-1.5"
                    style={{
                      backgroundColor:
                        vista === v ? c.aloneForte : 'transparent',
                      borderRadius: 14,
                    }}
                  >
                    <Text
                      className="text-sm"
                      style={{
                        color: vista === v ? c.accento : c.tenue,
                        fontWeight: vista === v ? '700' : '500',
                      }}
                    >
                      {v === 'foto' ? t.galleria.foto : t.galleria.cartelle}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Vetro>

            {vista === 'foto' && (
              <Vetro raggio={18} ombra={false}>
                <View className="flex-row p-1">
                  {[2, 3, 5].map((n) => (
                    <Pressable
                      key={n}
                      onPress={() => setColonne(n)}
                      className="px-3 py-1.5"
                      style={{
                        backgroundColor: colonne === n ? c.aloneForte : 'transparent',
                        borderRadius: 14,
                      }}
                    >
                      {/* Il numero di quadretti dice la densita' meglio di una cifra. */}
                      <View style={{ flexDirection: 'row', gap: 2 }}>
                        {Array.from({ length: n === 5 ? 3 : n }).map((_, i) => (
                          <View
                            key={i}
                            style={{
                              width: n === 2 ? 7 : n === 3 ? 5 : 3,
                              height: n === 2 ? 7 : n === 3 ? 5 : 3,
                              borderRadius: 1,
                              backgroundColor: colonne === n ? c.accento : c.tenue,
                            }}
                          />
                        ))}
                      </View>
                    </Pressable>
                  ))}
                </View>
              </Vetro>
            )}
          </View>
        )}

        {!!errore && <Text className="px-5 pb-2 text-sm text-destructive">{errore}</Text>}

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={c.accento} />
          </View>
        ) : vista === 'cartelle' && !dentro ? (
          /* --- le cartelle ----------------------------------------------- */
          <ScorrevoleSchermata contentContainerStyle={{ paddingHorizontal: 14, gap: 12 }}>
            <Pressable onPress={() => setCreando(true)}>
              <CartaVetro>
                <View className="flex-row items-center gap-3 p-4">
                  <View
                    className="h-11 w-11 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: c.alone }}
                  >
                    <FolderPlus color={c.accento} size={20} />
                  </View>
                  <Text className="text-base font-semibold text-foreground">
                    {t.galleria.nuovaCartella}
                  </Text>
                </View>
              </CartaVetro>
            </Pressable>

            {cartelle.length === 0 && (
              <View className="items-center gap-2 px-6 py-10">
                <Text className="font-serif text-xl text-foreground">
                  {t.galleria.nessunaCartella}
                </Text>
                <Text className="max-w-xs text-center text-sm text-muted-foreground">
                  {t.galleria.nessunaCartellaTesto}
                </Text>
              </View>
            )}

            <View className="flex-row flex-wrap">
              {cartelle.map((cart) => {
                const cop = copertina(cart.id);
                return (
                  <View key={cart.id} className="w-1/2 p-1.5">
                    <Pressable
                      onPress={() => {
                        setDentro(cart);
                        setVista('foto');
                      }}
                    >
                      <View
                        className="aspect-square overflow-hidden rounded-3xl"
                        style={{ backgroundColor: c.alone }}
                      >
                        {cop ? (
                          <Image
                            source={{ uri: cop }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="flex-1 items-center justify-center">
                            <Text className="text-xs text-muted-foreground">
                              {t.galleria.cartellaVuota}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View className="flex-row items-center justify-between px-1 pt-2">
                        <View className="flex-1">
                          <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                            {cart.nome}
                          </Text>
                          <Text className="text-xs text-muted-foreground">
                            {t.galleria.nFoto(quante(cart.id))}
                          </Text>
                        </View>
                        {cart.autore_id === session?.user.id && (
                          <Pressable
                            hitSlop={10}
                            onPress={() =>
                              chiediConferma({
                                titolo: t.conferma.cartellaTitolo(cart.nome),
                                nota: t.conferma.cartellaNota,
                                onConferma: async () => {
                                  const err = await cancellaCartella(cart.id);
                                  await ricarica();
                                  return err;
                                },
                              })
                            }
                          >
                            <Trash2 color={c.pericolo} size={15} />
                          </Pressable>
                        )}
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {cartelle.length > 0 && (
              <Text className="px-3 pt-1 text-xs text-muted-foreground">
                {t.galleria.tolteDaCartella}
              </Text>
            )}
          </ScorrevoleSchermata>
        ) : (
          /* --- la griglia delle foto -------------------------------------- */
          <ScorrevoleSchermata contentContainerStyle={{ gap: 2 }}>
            {visibili.length === 0 && (
              <View className="items-center gap-2 px-6 py-16">
                <Text className="font-serif text-xl text-foreground">
                  {t.galleria.vuotoTitolo}
                </Text>
                <Text className="max-w-xs text-center text-sm text-muted-foreground">
                  {t.galleria.vuotoTesto}
                </Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
              {visibili.map((s, i) => (
                <Pressable key={s.id} onPress={() => setAperta(i)}>
                  <View style={{ width: lato, height: lato, backgroundColor: 'rgba(0,0,0,0.05)' }}>
                    {url[s.chiave_storage] ? (
                      <Image
                        source={{ uri: url[s.chiave_storage] }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="flex-1 items-center justify-center">
                        <ActivityIndicator color={c.accento} />
                      </View>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          </ScorrevoleSchermata>
        )}

        {/* --- aggiungi: vetro, sopra la barra volante ---------------------- */}
        {Platform.OS !== 'web' && (
          <View style={{ position: 'absolute', right: 20, bottom: SOPRA_BARRA }}>
            <TondoVetro lato={58} onPress={aggiungi} disabled={attesa}>
              {attesa ? (
                <ActivityIndicator color={c.accento} />
              ) : vista === 'cartelle' && !dentro ? (
                <Plus color={c.accento} size={26} />
              ) : (
                <ImagePlus color={c.accento} size={24} />
              )}
            </TondoVetro>
          </View>
        )}
      </SafeAreaView>

      {/* --- foglio: nuova cartella --------------------------------------- */}
      <Modal visible={creando} transparent animationType="fade" onRequestClose={() => setCreando(false)}>
        <Pressable
          className="flex-1 justify-center px-6"
          style={{ backgroundColor: 'rgba(20,8,14,0.35)' }}
          onPress={() => setCreando(false)}
        >
          {/* Il tocco dentro al foglio non deve chiuderlo. */}
          <Pressable onPress={() => {}}>
            <CartaVetro>
              <View className="gap-4 p-5">
                <Text className="font-serif text-xl text-foreground">
                  {t.galleria.nuovaCartella}
                </Text>
                <Input
                  value={nome}
                  onChangeText={setNome}
                  placeholder={t.galleria.nomeCartella}
                  autoFocus
                  maxLength={60}
                  returnKeyType="done"
                  onSubmitEditing={nuovaCartella}
                />
                <View className="flex-row gap-3">
                  <BottoneVetro
                    style={{ flex: 1 }}
                    altezza={48}
                    onPress={() => {
                      setNome('');
                      setCreando(false);
                    }}
                  >
                    <Text>{t.galleria.annulla}</Text>
                  </BottoneVetro>
                  <BottoneVetro
                    style={{ flex: 1 }}
                    altezza={48}
                    variante="accento"
                    disabled={!nome.trim()}
                    onPress={nuovaCartella}
                  >
                    <Text>{t.galleria.crea}</Text>
                  </BottoneVetro>
                </View>
              </View>
            </CartaVetro>
          </Pressable>
        </Pressable>
      </Modal>

      {/* --- la foto a schermo pieno -------------------------------------- */}
      {/* --- IL VISORE: lo stesso della pagina evento --------------------
          Le azioni cambiano — qui si sposta e si elimina, li' si stacca
          dall'evento e si elimina — ma il visore e' il medesimo, ed e' cio' che
          rende le due schermate coerenti senza doverle riallineare a mano.

          ⚠️ **Qui "elimina" elimina davvero**, anche dagli eventi: la galleria
          e' il posto dove la foto vive. Dentro un evento la stessa icona non
          farebbe la stessa cosa, e per questo li' ce ne sono due. */}
      <VisoreFoto
        foto={visibili}
        url={url}
        indice={aperta}
        mioId={session?.user.id}
        azioni={[
          {
            chiave: 'sposta',
            etichetta: t.galleria.spostaIn,
            Icona: FolderInput,
            soloAutore: true,
            fai: (f) => {
              const scatto = visibili.find((x) => x.id === f.id) ?? null;
              setAperta(null);
              setSpostando(scatto);
            },
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
                    setAperta(null);
                    await cancellaFoto(f.id, f.chiave_storage);
                    await ricarica();
                  },
                },
              ]),
          },
        ]}
        onChiudi={() => setAperta(null)}
      />

      {/* --- foglio: sposta in una cartella -------------------------------- */}
      <Modal
        visible={!!spostando}
        transparent
        animationType="slide"
        onRequestClose={() => setSpostando(null)}
      >
        <Pressable
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(20,8,14,0.35)' }}
          onPress={() => setSpostando(null)}
        >
          <Pressable onPress={() => {}}>
            <CartaVetro raggio={30} style={{ margin: 10 }}>
              <SafeAreaView edges={['bottom']}>
                <View className="gap-2 p-5">
                  <Text className="font-serif text-xl text-foreground">{t.galleria.spostaIn}</Text>
                  <ScrollView style={{ maxHeight: 320 }}>
                    <Pressable
                      className="py-3"
                      onPress={async () => {
                        if (spostando) await spostaFoto(spostando.id, null);
                        setSpostando(null);
                        await ricarica();
                      }}
                    >
                      <Text className="text-base text-muted-foreground">
                        {t.galleria.senzaCartella}
                      </Text>
                    </Pressable>
                    {cartelle.map((cart) => (
                      <Pressable
                        key={cart.id}
                        className="py-3"
                        onPress={async () => {
                          if (spostando) await spostaFoto(spostando.id, cart.id);
                          setSpostando(null);
                          await ricarica();
                        }}
                      >
                        <Text className="text-base text-foreground">{cart.nome}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              </SafeAreaView>
            </CartaVetro>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
