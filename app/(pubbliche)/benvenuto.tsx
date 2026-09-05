import * as React from 'react';
import { View, ScrollView, useWindowDimensions, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Riani, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Emblema } from '@/components/emblema';
import { Text } from '@/components/ui/text';
import { Premibile } from '@/components/ui/premibile';
import { BottoneVetro } from '@/components/ui/vetro';
import { FondoIngresso, FRAZIONE_SALUTO } from '@/components/ingresso-fondo';
import {
  IllustrazioneDiario,
  IllustrazioneGiochi,
  IllustrazioneMappa,
  IllustrazioneRicordi,
} from '@/components/ingresso-illustrazioni';
import { durata } from '@/lib/movimento';
import { SU_TESTATA, SU_TESTATA_TENUE, C } from '@/lib/tema';
import { t } from '@/lib/i18n';

/**
 * **L'ingresso**: il saluto, e poi le pagine che spiegano come funziona l'app.
 *
 * ## Perché è una schermata sola con due fasi (2026-09-04)
 *
 * Prima era solo il saluto: emblema, nome, due bottoni. Ora sono due momenti —
 * il saluto e la spiegazione — ma **restano una route**, ed è una scelta
 * obbligata dal movimento richiesto: lo sfondo colorato deve *riempire* lo
 * schermo partendo da dov'è già, e un colore che si smonta con la schermata e
 * ricompare nella successiva non sta crescendo, sta lampeggiando. Il ragionamento
 * per esteso sta in `components/ingresso-fondo.tsx`.
 *
 * ## 🔑 Il testo sopra il colore è prugna, non bianco
 *
 * Sembra un dettaglio e invece è la lezione già pagata in `lib/tema.ts`: su
 * questi pastelli il bianco dà **circa 2:1** di contrasto, sotto il minimo perfino
 * per il testo grande. Il riferimento che ci ha ispirati ha il testo chiaro
 * perché il suo arancione è molto più scuro del nostro gradiente. Si è tenuta la
 * **struttura** del riferimento — blocco colorato in alto, curva che monta sul
 * chiaro, mascotte grande, un bottone pieno in fondo — e si è cambiato ciò che
 * su questa palette non avrebbe funzionato.
 *
 * ## ⚠️ La mascotte disegnata qui è ancora l'emblema
 *
 * Il riferimento ha al centro la sua mascotte, e LifeCouple ne ha una decisa
 * **oggi stesso** (D-95: la lontra). Non è ancora utilizzabile: `assets/mascotte/`
 * contiene solo `riferimento.jpg`, un JPEG su fondo chiaro, che sopra il
 * gradiente si vedrebbe come un rettangolo bianco. Serve il PNG ritagliato di
 * `docs/mascotte.md`. Fino ad allora sta l'emblema, che è vettoriale e
 * trasparente: **il posto è già suo**, si sostituisce un componente.
 */

type Fase = 'saluto' | 'spiegazione';

export default function Benvenuto() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const bordi = useSafeAreaInsets();
  const [fase, setFase] = React.useState<Fase>('saluto');
  const [pagina, setPagina] = React.useState(0);
  const scorrevole = React.useRef<ScrollView>(null);

  /**
   * L'ordine **è** una gerarchia: la prima pagina è quella che si vede per
   * certo, l'ultima quella che molti non raggiungono. Il diario sta per primo
   * perché è la promessa del prodotto — *tutto quello che vivete insieme resta
   * qui* — e ci è arrivato su richiesta dell'utente il 2026-09-05, prendendo il
   * posto della griglia del calendario, che disegnava un contenitore vuoto
   * invece di cose vissute.
   */
  const PAGINE = React.useMemo(
    () => [
      { chiave: 'diario', Illustrazione: IllustrazioneDiario },
      { chiave: 'mappa', Illustrazione: IllustrazioneMappa },
      { chiave: 'giochi', Illustrazione: IllustrazioneGiochi },
      { chiave: 'ricordi', Illustrazione: IllustrazioneRicordi },
    ] as const,
    []
  );

  // Le due fasi si incrociano in dissolvenza **mentre** il fondo cresce: il
  // saluto se ne va, la spiegazione arriva, e il colore che si allarga fa da
  // filo fra i due. Se il contenuto cambiasse di scatto, il riempimento
  // sembrerebbe una transizione di pagina mascherata.
  const q = useSharedValue(0);
  React.useEffect(() => {
    q.value = withTiming(fase === 'spiegazione' ? 1 : 0, { duration: durata.media });
  }, [fase, q]);

  const stileSaluto = useAnimatedStyle(() => ({ opacity: 1 - q.value }));
  const stileSpiegazione = useAnimatedStyle(() => ({ opacity: q.value }));

  /**
   * ⚠️ La pagina corrente sta **anche** in un ref: `setPagina` non e' sincrono,
   * quindi un secondo tocco che arriva prima del render successivo leggerebbe
   * dalla chiusura una pagina gia' vecchia e calcolerebbe il bersaglio
   * sbagliato. Il ref e' l'unico valore gia' aggiornato quando quel tocco
   * arriva, e non cambia niente nel disegno: e' solo la memoria del salto.
   */
  const paginaRef = React.useRef(0);

  function avanti() {
    const n = paginaRef.current + 1;
    if (n < PAGINE.length) {
      paginaRef.current = n;
      setPagina(n);
      scorrevole.current?.scrollTo({ x: n * width, animated: true });
    } else {
      router.push('/registrati');
    }
  }

  return (
    <View className="flex-1 bg-background">
      <FondoIngresso pieno={fase === 'spiegazione'} />

      {/* ---------------------------------------------------------------- */}
      {/* Il saluto                                                        */}
      {/* ---------------------------------------------------------------- */}
      {fase === 'saluto' && (
        <Riani.View style={[StyleSheet.absoluteFill, stileSaluto]}>
          <View className="flex-1">
            {/* ⚠️ Altezza in punti e **non** `flex`, e fuori dall'area sicura:
                è l'unico modo perché questo blocco finisca esattamente dove
                finisce il colore. Con `flex` le due frazioni si calcolano su
                spazi diversi — lo schermo per il fondo, lo spazio interno
                all'area sicura per il contenuto — e il testo cade sopra il
                colore. Il margine di sistema si recupera qui dentro. */}
            <View
              style={{ height: height * FRAZIONE_SALUTO, paddingTop: bordi.top }}
              className="items-center justify-center"
            >
              <Emblema size={132} color={SU_TESTATA} />
            </View>

            <View className="flex-1 items-center justify-center px-8">
              <Text className="text-center font-serif-bold text-4xl text-foreground">
                {t.benvenuto.saluto}
              </Text>
              <Text className="mt-3 max-w-xs text-center text-lg leading-relaxed text-muted-foreground">
                {t.benvenuto.sottotitolo}
              </Text>
            </View>

            {/* ⚠️ **Due strade dichiarate, non una che indovina** (2026-08-29).
                Prima c'era un solo bottone «Iniziamo» e il database decideva da
                sé se stavi nascendo o rientrando. Su un'app che custodisce
                ricordi la differenza fra *«sto creando il mio spazio»* e *«sto
                tornando nel mio»* è la prima cosa che l'utente vuole sapere — e
                la seconda è la sola che può andare storta in modo spaventoso.
                🔑 Chi rientra **salta la spiegazione**: già sa come funziona, e
                fargliela rivedere sarebbe un pedaggio su ogni reinstallazione. */}
            <View className="gap-3 px-8" style={{ paddingBottom: bordi.bottom + 16 }}>
              <Premibile onPress={() => setFase('spiegazione')} scala={0.98}>
                <View style={stiliLocali.bottonePieno}>
                  <Text style={{ color: '#ffffff', fontSize: 17 }}>{t.benvenuto.inizia}</Text>
                </View>
              </Premibile>
              <BottoneVetro altezza={52} onPress={() => router.push('/accedi')}>
                <Text>{t.benvenuto.haiGiaAccount}</Text>
              </BottoneVetro>
              <Text className="mt-1 text-center text-sm text-muted-foreground">
                {t.benvenuto.nota}
              </Text>
            </View>
          </View>
        </Riani.View>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* La spiegazione                                                   */}
      {/* ---------------------------------------------------------------- */}
      {fase === 'spiegazione' && (
        <Riani.View style={[StyleSheet.absoluteFill, stileSpiegazione]}>
          <SafeAreaView className="flex-1">
            {/* «Salta» è una promessa di uscita: senza, quattro pagine
                obbligatorie fra l'utente e l'app sono un cancello — la stessa
                cosa che D-26 aveva tolto dall'onboarding. */}
            <View className="flex-row justify-end px-6 pt-1">
              <Premibile onPress={() => router.push('/registrati')} hitSlop={12} aptico="scelta">
                <Text style={{ color: SU_TESTATA_TENUE, fontSize: 15 }}>{t.benvenuto.salta}</Text>
              </Premibile>
            </View>

            <ScrollView
              ref={scorrevole}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              // ⚠️ `onScroll` e non solo `onMomentumScrollEnd`: su web il
              // secondo non scatta sempre (uno scorrimento senza inerzia non
              // ne ha), e i pallini resterebbero indietro rispetto a ciò che
              // si sta guardando. Qui si aggiorna solo quando la pagina
              // **cambia davvero**, così non si rende a ogni pixel.
              // ⚠️ `onScroll` **oltre** a `onMomentumScrollEnd`, non al posto suo.
              // Diagnosi del 2026-09-05 (B-50): il secondo scatta solo quando lo
              // scorrimento ha **inerzia**, e uno che non ne ha — trascinare e
              // lasciare fermi, o uno spostamento programmatico — non lo fa
              // scattare mai. Lo stato `pagina` restava indietro, e siccome è lui
              // a dire a ogni illustrazione se è quella guardata, il sintomo non
              // era solo un pallino sbagliato: **l'illustrazione non si animava
              // affatto**, cioè restava invisibile. Si aggiorna solo quando la
              // pagina cambia davvero, così non si rende a ogni pixel.
              scrollEventThrottle={32}
              onScroll={(e) => {
                const n = Math.round(e.nativeEvent.contentOffset.x / width);
                if (n !== paginaRef.current) {
                  paginaRef.current = n;
                  setPagina(n);
                }
              }}
              onMomentumScrollEnd={(e) => {
                const n = Math.round(e.nativeEvent.contentOffset.x / width);
                paginaRef.current = n;
                setPagina(n);
              }}
              // ⚠️ `flexGrow` sul contenitore **e** `flex-1` sulle pagine: senza
              // il primo il contenitore di uno scorrimento orizzontale è alto
              // quanto il suo contenuto, e `justify-center` non ha niente da
              // centrare — il testo resta appeso in alto con un vuoto sotto.
              contentContainerStyle={{ flexGrow: 1 }}
              className="flex-1"
            >
              {PAGINE.map(({ chiave, Illustrazione }, i) => (
                <View
                  key={chiave}
                  style={{ width }}
                  className="flex-1 items-center justify-center px-9"
                >
                  <Illustrazione attiva={pagina === i} />
                  <Text
                    className="mt-6 text-center font-serif-bold text-3xl"
                    style={{ color: SU_TESTATA }}
                  >
                    {t.benvenuto.pagine[chiave].titolo}
                  </Text>
                  <Text
                    className="mt-3 max-w-sm text-center text-base leading-relaxed"
                    style={{ color: SU_TESTATA_TENUE }}
                  >
                    {t.benvenuto.pagine[chiave].testo}
                  </Text>
                </View>
              ))}
            </ScrollView>

            {/* I pallini: dicono quante ne restano, che è l'unica cosa che
                rende sopportabile una sequenza di pagine. */}
            <View className="flex-row justify-center gap-2 pb-5">
              {PAGINE.map(({ chiave }, i) => (
                <View
                  key={chiave}
                  style={{
                    width: i === pagina ? 22 : 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: i === pagina ? SU_TESTATA : SU_TESTATA_TENUE,
                    opacity: i === pagina ? 1 : 0.45,
                  }}
                />
              ))}
            </View>

            <View className="px-8 pb-4">
              <Premibile onPress={avanti} scala={0.98}>
                <View style={stiliLocali.bottonePieno}>
                  <Text style={{ color: '#ffffff', fontSize: 17 }}>
                    {pagina === PAGINE.length - 1 ? t.benvenuto.inizia : t.benvenuto.avanti}
                  </Text>
                </View>
              </Premibile>
            </View>
          </SafeAreaView>
        </Riani.View>
      )}
    </View>
  );
}

const stiliLocali = StyleSheet.create({
  /**
   * Il bottone pieno scuro del riferimento.
   *
   * ⚠️ Non è `BottoneVetro`: il vetro prende quello che ha sotto, e qui sotto
   * c'è un pastello: il pannello si legge come una macchia chiara su una tinta
   * chiara. Serve un pieno scuro, e la prugna è già il colore che questa palette
   * usa sopra il gradiente.
   */
  bottonePieno: {
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SU_TESTATA,
    shadowColor: C.testo,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
});
