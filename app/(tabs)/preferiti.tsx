import * as React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Riani, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { useFocusEffect, useRouter } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Fondo } from '@/components/schermata';
import { SPAZIO_BARRA } from '@/components/barra-volante';
import { BottoneVetro, BottonePieno, CartaVetro } from '@/components/ui/vetro';
import { Foglio } from '@/components/foglio';
import { CartaLista } from '@/components/carta-lista';
import { useListe } from '@/lib/liste';
import { useCoppia } from '@/lib/coppia';
import { useTema } from '@/lib/tema';
import { molla } from '@/lib/movimento';
import { t } from '@/lib/i18n';

/**
 * **L'hub delle liste dei desideri.**
 *
 * Era la sezione «Preferiti» e poi «Liste» con dentro *un* elenco fisso — i
 * film — rimasto solo dopo che D-51 aveva portato i luoghi nella mappa. Un
 * elenco solo non è una sezione: è una schermata che si chiama al plurale per
 * un motivo storico. Ora le liste le crea la coppia.
 *
 * ## Perché lo stesso carosello dei giochi, e non una lista di righe
 *
 * Perché è lo **stesso problema**: pochi elementi di pari rango, che si devono
 * distinguere a colpo d'occhio. È la stessa ragione per cui `lib/giochi.ts`
 * riusa i pastelli del calendario. Una schermata di righe avrebbe funzionato,
 * ma avrebbe reso questa sezione l'unica dell'app in cui una raccolta di cose
 * fra cui scegliere si presenta in un modo diverso — e le eccezioni di forma
 * si pagano ogni volta che si apre l'app, non una volta sola quando si scrive.
 *
 * ## ⚠️ Il nodo vero: cosa fanno i due comandi sulla carta «+»
 *
 * L'hub dei giochi poggia su una regola — *i comandi restano due, sempre gli
 * stessi, fermi in fondo* — e qui una carta del mazzo non è una lista: è il
 * gesto per crearne una. «Elimina» su quella carta non vuol dire niente.
 *
 * La regola però parla di **posizione**, non di etichetta: ciò che non deve
 * accadere è che scorrendo si spostino i comandi e li si debba ritrovare. Per
 * questo sulla carta «+» la riga resta **nello stesso posto e della stessa
 * altezza**, e contiene un solo comando a tutta larghezza. Cambia cosa si può
 * fare, non dove si preme.
 *
 * 🔑 **E la carta non è toccabile**, come nessuna carta di nessuno dei due
 * caroselli. Sarebbe stato naturale rendere il «+» premibile — ed è proprio
 * l'errore di D-64: due strade per lo stesso gesto. Una strada, quella in
 * fondo, dove stanno tutte le azioni di questa schermata.
 */
export default function Liste() {
  const router = useRouter();
  const { c } = useTema();
  const { width, height } = useWindowDimensions();
  const { coppiaId, ricarica: ricaricaCoppia } = useCoppia();
  const { liste, loading, crea, elimina, ricarica } = useListe(coppiaId);

  /**
   * ## 🔴 Rileggere al focus, che è la regola del 2026-08-27 e non l'avevo applicata
   *
   * Difetto riferito: *«quando apro una lista e inserisco una voce poi chiudo la
   * card il numero sulla card non si aggiorna»*.
   *
   * Le carte mostrano quante voci contiene ogni lista, e quel numero viene
   * caricato **al montaggio**. Tornando indietro dalla lista, la schermata a tab
   * non si rimonta — quindi il conto resta quello di prima, mentre il database
   * ne ha uno nuovo.
   *
   * 🔑 È **la forma di B-09/B-13 per la terza volta**: *due copie dello stesso
   * stato, di cui una non viene aggiornata*. La regola era già scritta il
   * 2026-08-27 — *se una schermata legge dati che un'altra può scrivere, deve
   * rileggere al focus* — ed è la stessa che D-59 ha poi applicato ai permessi.
   * Sapere una regola non la applica: questa schermata è nata ieri e non ce
   * l'aveva.
   */
  useFocusEffect(
    React.useCallback(() => {
      ricarica();
    }, [ricarica])
  );

  const [foglio, setFoglio] = React.useState<null | 'crea' | 'elimina'>(null);
  const [nome, setNome] = React.useState('');
  const [attesa, setAttesa] = React.useState(false);
  const [erroreForm, setErroreForm] = React.useState<string | null>(null);
  const [scelto, setScelto] = React.useState(0);

  /**
   * Le carte sono le liste **più una**: l'ultima è il «+».
   *
   * Tenere il «+» dentro lo stesso mazzo invece che come bottone a parte è ciò
   * che rende la creazione raggiungibile con lo stesso gesto con cui si guarda
   * il resto — si scorre fino in fondo e c'è. Un bottone «nuova lista» in cima
   * sarebbe stato un secondo posto da guardare.
   */
  const carte = React.useMemo(() => [...liste, null], [liste]);
  const suNuova = scelto === carte.length - 1;
  const listaScelta = suNuova ? null : (liste[scelto] ?? null);


  // Gli stessi numeri dell'hub dei giochi: se cambiano lì devono cambiare qui,
  // e il modo di accorgersene è che i due caroselli si muovano diversamente.
  const CARTA = Math.min(width * 0.74, 330);
  const SPAZIO = 16;
  const PAGINA = CARTA + SPAZIO;
  const ALTEZZA = Math.max(280, Math.min(height * 0.42, 390));
  const PISTA = ALTEZZA + 48;

  const x = useSharedValue(0);
  const zoom = useSharedValue(1);
  const alloScorrimento = useAnimatedScrollHandler((e) => {
    x.value = e.contentOffset.x;
  });

  /**
   * ## 🔴 Qual è **davvero** la carta al centro
   *
   * Difetto riferito: *«a volte apro una card ma mi apre un'altra lista»*.
   *
   * `scelto` si aggiornava **solo** in `onMomentumScrollEnd`, che scatta quando
   * il carosello si ferma **per inerzia**. Se si trascina piano e si lascia — o
   * si accompagna la carta fino in fondo col dito — quell'evento **non arriva
   * mai**: la carta al centro è cambiata, lo stato no, e «Apri» apre la
   * precedente.
   *
   * 🔑 La correzione non è aggiungere il secondo evento e sperare di averli
   * presi tutti: è **smettere di dedurre una posizione da una sequenza di
   * eventi**. Lo scorrimento vero sta in `x`, che è aggiornato a ogni
   * fotogramma; al momento di premere si legge quello. È la stessa cura di B-25
   * — *il pezzo che sa il dato lo usa, invece di ricostruirlo*.
   *
   * ⚠️ `onScrollEndDrag` si aggiunge lo stesso, ma per un'altra ragione: serve a
   * far cambiare **i bottoni** (una lista di partenza non mostra «Elimina»)
   * mentre si scorre. Quello è aspetto, e può permettersi di essere un
   * aggiornamento di stato; l'**azione** no.
   */
  const indiceVero = React.useCallback(() => {
    const i = Math.round(x.value / PAGINA);
    return Math.max(0, Math.min(carte.length - 1, i));
    // `x.value` NON va fra le dipendenze, ed e' il punto di tutta la
    // correzione: cambia sessanta volte al secondo, e metterlo qui
    // ricostruirebbe la funzione a ogni fotogramma per poi leggerne comunque
    // il valore al momento del tocco. Si legge quando serve, non si osserva.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carte.length, PAGINA]);

  function apri(quale: 'crea' | 'elimina') {
    setErroreForm(null);
    zoom.value = withSpring(1.07, molla.entrata);
    setFoglio(quale);
  }
  function chiudi() {
    zoom.value = withSpring(1, molla.scivolo);
    setFoglio(null);
    setNome('');
  }

  /**
   * Apre la lista che è **davvero** al centro adesso.
   *
   * 🔑 Rilegge `x` invece di fidarsi di `scelto`: è la correzione di B-28. Se i
   * due divergono — perché lo scorrimento è finito senza inerzia — vince lo
   * scorrimento, che è il dato, mentre lo stato è una sua copia in ritardo.
   */
  function apriScelta() {
    const i = indiceVero();
    const l = liste[i];
    if (!l) return;
    // Allinea anche lo stato: se erano diversi, tornando indietro i bottoni
    // devono già riferirsi alla lista giusta.
    setScelto(i);
    router.push({ pathname: '/lista/[id]', params: { id: l.id } });
  }

  async function confermaCrea() {
    setAttesa(true);
    const errore = await crea(nome, ricaricaCoppia);
    setAttesa(false);
    if (errore) {
      setErroreForm(errore === 'nome-vuoto' ? t.liste.nomeVuoto : errore);
      return;
    }
    chiudi();
  }

  async function confermaElimina() {
    // ⚠️ Stessa ragione di `apriScelta`: cancellare la lista sbagliata è molto
    // peggio che aprirla, quindi qui la rilettura conta il doppio.
    const bersaglio = liste[indiceVero()] ?? listaScelta;
    if (!bersaglio) return;
    setAttesa(true);
    const errore = await elimina(bersaglio.id);
    setAttesa(false);
    if (errore) {
      // 🔑 `solo-autore` non è un guasto: è la policy che ha filtrato zero
      // righe senza dirlo (B-23). Se non lo si traducesse in una frase, qui
      // comparirebbe «fatto» e la lista resterebbe al suo posto.
      setErroreForm(
        errore === 'solo-autore'
          ? t.liste.soloAutore
          : errore === 'predefinita'
            ? t.liste.predefinitaNota
            : errore
      );
      return;
    }
    // Dopo una cancellazione l'indice può puntare oltre la fine del mazzo.
    setScelto((i) => Math.max(0, i - 1));
    chiudi();
  }

  return (
    <View className="flex-1">
      <Fondo />
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="gap-1 px-6 pb-2 pt-2">
          <Text className="font-serif-bold text-3xl text-foreground">{t.liste.titolo}</Text>
          <Text className="text-sm text-muted-foreground">{t.liste.sottotitolo}</Text>
        </View>

        <View className="flex-1 justify-center">
          <Riani.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={alloScorrimento}
            scrollEventThrottle={16}
            style={{ height: PISTA, flexGrow: 0 }}
            snapToInterval={PAGINA}
            disableIntervalMomentum
            decelerationRate="fast"
            onScrollEndDrag={() => setScelto(indiceVero())}
            onMomentumScrollEnd={() => setScelto(indiceVero())}
            contentContainerStyle={{
              paddingHorizontal: (width - CARTA) / 2,
              gap: SPAZIO,
              alignItems: 'center',
            }}
          >
            {carte.map((l, i) => (
              <CartaLista
                key={l?.id ?? 'nuova'}
                lista={l}
                indice={i}
                x={x}
                pagina={PAGINA}
                larghezza={CARTA}
                altezza={ALTEZZA}
                zoom={zoom}
              />
            ))}
          </Riani.ScrollView>

          <View className="mt-2 flex-row justify-center gap-2">
            {carte.map((l, i) => (
              <Puntino
                key={l?.id ?? 'nuova'}
                indice={i}
                x={x}
                pagina={PAGINA}
                colore={c.accento}
              />
            ))}
          </View>
        </View>

        {/* Stessa spaziatura dell'hub dei giochi: `SPAZIO_BARRA` è il minimo per
            non finire sotto la barra, non la distanza a cui una riga smette di
            sembrarle addosso. */}
        <View className="gap-5 px-6" style={{ paddingTop: 18, paddingBottom: SPAZIO_BARRA + 26 }}>
          {suNuova || listaScelta?.predefinita ? (
            /* Un comando solo, a tutta larghezza, **nella stessa riga e della
               stessa altezza** dei due: vedi la nota in testa al file.
               ⚠️ Vale in **due** casi, e per la stessa ragione: sulla carta «+»
               non c'è niente da aprire né da eliminare, e su una lista di
               partenza (0025) non c'è niente da eliminare. In entrambi i casi la
               riga resta dov'è e cambia solo cosa si può fare. */
            <BottonePieno
              altezza={54}
              testo={suNuova ? t.liste.crea : t.liste.apri}
              onPress={() => (suNuova ? apri('crea') : apriScelta())}
            />
          ) : (
            <View className="flex-row gap-3">
              {/* ⚠️ «Elimina» è di vetro e «Apri» è pieno, e non è un dettaglio:
                  l'azione primaria di questa schermata è aprire. Il pieno lo
                  prende il comando che si usa cento volte, non quello che si usa
                  una volta e fa danni — e il vetro, dopo B-22, si usa solo dove
                  *non* è l'azione principale. */}
              <BottoneVetro
                style={{ flex: 1 }}
                onPress={() => apri('elimina')}
                disabled={!listaScelta}
              >
                <Trash2 color={c.testo} size={18} />
                <Text>{t.liste.elimina}</Text>
              </BottoneVetro>
              <BottonePieno
                style={{ flex: 1 }}
                altezza={54}
                testo={t.liste.apri}
                disabled={!listaScelta}
                onPress={apriScelta}
              />
            </View>
          )}

          {/* ⚠️ La frase spiega **perché** manca «Elimina», invece di lasciare
              che chi guarda si chieda se l'ha persa. Un comando che sparisce
              senza motivo è indistinguibile da un guasto. */}
          {!suNuova && listaScelta?.predefinita && (
            <Text className="text-center text-xs text-muted-foreground/80">
              {t.liste.predefinitaNota}
            </Text>
          )}

          {!loading && liste.length === 0 && (
            <Text className="text-center text-xs text-muted-foreground/80">
              {t.liste.nessunaNota}
            </Text>
          )}
        </View>
      </SafeAreaView>

      {/* --- Crea ------------------------------------------------------------ */}
      <Foglio visibile={foglio === 'crea'} onChiudi={chiudi}>
        <CartaVetro raggio={30} style={{ margin: 8 }}>
          <SafeAreaView edges={['bottom']}>
            <View className="gap-4 p-6">
              <View className="gap-1">
                <Text className="font-serif-bold text-2xl text-foreground">
                  {t.liste.creaTitolo}
                </Text>
                <Text className="text-sm text-muted-foreground">{t.liste.creaNota}</Text>
              </View>
              <Input
                value={nome}
                onChangeText={(v) => {
                  setNome(v);
                  setErroreForm(null);
                }}
                placeholder={t.liste.creaPlaceholder}
                autoFocus
                maxLength={60}
                returnKeyType="done"
                onSubmitEditing={() => void confermaCrea()}
              />
              {erroreForm && (
                <Text className="text-sm" style={{ color: c.pericolo }}>
                  {erroreForm}
                </Text>
              )}
              <BottonePieno
                altezza={54}
                testo={t.liste.creaConferma}
                disabled={attesa || !nome.trim()}
                onPress={() => void confermaCrea()}
              />
              <BottoneVetro altezza={46} onPress={chiudi}>
                <Text>{t.liste.annulla}</Text>
              </BottoneVetro>
            </View>
          </SafeAreaView>
        </CartaVetro>
      </Foglio>

      {/* --- Elimina --------------------------------------------------------- */}
      <Foglio visibile={foglio === 'elimina'} onChiudi={chiudi}>
        <CartaVetro raggio={30} style={{ margin: 8 }}>
          <SafeAreaView edges={['bottom']}>
            <View className="gap-4 p-6">
              <View className="gap-1">
                <Text className="font-serif-bold text-2xl text-foreground">
                  {listaScelta ? t.liste.eliminaTitolo(listaScelta.nome) : ''}
                </Text>
                {/* ⚠️ La conferma dice **quante voci** si porta via, e che
                    possono essere del partner. «Sei sicuro?» non è una domanda:
                    non aggiunge niente a quello che chi preme già sa. Il numero
                    sì — è l'unica cosa che può fargli cambiare idea. */}
                <Text className="text-sm text-muted-foreground">
                  {listaScelta ? t.liste.eliminaNota(listaScelta.voci) : ''}
                </Text>
              </View>
              {erroreForm && (
                <Text className="text-sm" style={{ color: c.pericolo }}>
                  {erroreForm}
                </Text>
              )}
              {/* L'azione distruttiva **non** è il bottone pieno: il pieno è
                  quello che il pollice trova per primo, e qui deve trovare
                  «Annulla». */}
              <BottoneVetro
                altezza={54}
                disabled={attesa}
                onPress={() => void confermaElimina()}
              >
                <Trash2 color={c.pericolo} size={18} />
                <Text style={{ color: c.pericolo }}>{t.liste.eliminaConferma}</Text>
              </BottoneVetro>
              <BottonePieno altezza={54} testo={t.liste.annulla} onPress={chiudi} />
            </View>
          </SafeAreaView>
        </CartaVetro>
      </Foglio>
    </View>
  );
}

/** Come nell'hub dei giochi: si allunga invece di cambiare colore. */
function Puntino({
  indice,
  x,
  pagina,
  colore,
}: {
  indice: number;
  x: SharedValue<number>;
  pagina: number;
  colore: string;
}) {
  const stile = useAnimatedStyle(() => {
    const d = Math.abs(x.value / pagina - indice);
    return {
      width: interpolate(d, [0, 1], [26, 8], Extrapolation.CLAMP),
      opacity: interpolate(d, [0, 1], [1, 0.3], Extrapolation.CLAMP),
    };
  });
  return <Riani.View style={[{ height: 8, borderRadius: 4, backgroundColor: colore }, stile]} />;
}
