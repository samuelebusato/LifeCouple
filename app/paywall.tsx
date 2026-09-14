// =============================================================================
// Il paywall di «Insieme» — costruito nell'app, non su RevenueCat
//
// 🔑 **Perché costruito qui e non preso dal loro pannello.** L'utente lo vuole
//    coerente con la grafica dell'app, e i template remoti somigliano senza
//    coincidere: qui si usano `Fondo`, `Emblema`, `Premibile`, `Comparsa` e i
//    colori del tema — lo stesso linguaggio del resto dell'app.
//
// ⚠️ **Il costo della scelta, dichiarato**: prezzi e testi si cambiano solo
//    con una nuova versione sullo store. Il paywall remoto di RevenueCat resta
//    disponibile come **rete** per i punti d'ingresso secondari
//    (`apriPaywall()` in lib/acquisti.ts).
//
// ## Cosa NON fa questa schermata
//
// 🔑 **Non concede niente.** Un acquisto riuscito qui non sblocca nulla da
//    solo: il diritto lo scrive il webhook e lo legge `coppia_ha_insieme()`
//    dal database (0041, threat-model §4-ter). Questa schermata vende, poi
//    aspetta che il database confermi.
//
// ⚠️ **I prezzi non sono scritti nel codice**, mai: vengono da `getOfferings()`
//    e sono già formattati nella valuta di chi guarda. Scriverli a mano
//    significherebbe mostrare «€7,99» a chi paga in dollari.
//
// ## Il movimento, e perché è misurato
//
// Tutto passa dai primitivi di `lib/movimento.ts`: `Comparsa` per le entrate,
// `cascata()` per il ritardo fra le righe, `ciclo.respiro` per l'emblema,
// `tatto()` per il polpastrello. ⚠️ **E `useMovimentoRidotto()` è rispettato**:
// chi ha chiesto meno movimento nelle impostazioni di sistema vede tutto
// comparire subito, senza respiro e senza cascata. Un paywall che ignora
// quell'impostazione la ignora **proprio mentre chiede dei soldi**.
// =============================================================================

import * as React from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Riani, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Heart, Image, ListChecks, Map, Sparkles, X } from 'lucide-react-native';
import Purchases, { type PurchasesPackage, PACKAGE_TYPE } from 'react-native-purchases';
import { Emblema } from '@/components/emblema';
import { Text } from '@/components/ui/text';
import { Premibile } from '@/components/ui/premibile';
import { Comparsa } from '@/components/ui/comparsa';
import { Fondo } from '@/components/schermata';
import { C } from '@/lib/tema';
import { cascata, ciclo, molla, tatto, useMovimentoRidotto } from '@/lib/movimento';
import { t } from '@/lib/i18n';
import { useInsieme, ripristinaAcquisti } from '@/lib/acquisti';

/**
 * Un'icona per funzione, **le stesse della barra in basso**: chi legge lega la
 * riga alla scheda che si apre, invece di vedere cinque spunte identiche.
 *
 * ⚠️ L'ordine segue `t.abbonamento.incluso` — mappa, liste, Philippe, foto,
 * giochi. Se cambia lì, va cambiato qui: nessun controllo confronta i due.
 */
const ICONE = [Map, ListChecks, Heart, Image, Sparkles];

/** Giorni di prova, quando l'offerta introduttiva c'è. Letto dall'offerta, non
 *  supposto: se un domani diventasse di 14 giorni, il testo lo segue da sé. */
function giorniDiProva(p: PurchasesPackage | null): number | null {
  const intro = p?.product?.introPrice;
  if (!intro) return null;
  const unita = intro.periodUnit;
  const n = intro.periodNumberOfUnits;
  if (unita === 'DAY') return n;
  if (unita === 'WEEK') return n * 7;
  if (unita === 'MONTH') return n * 30;
  return null;
}

/** Lo sconto dell'annuale sul mensile, calcolato sui prezzi veri. */
function scontoAnnuale(mensile: PurchasesPackage | null, annuale: PurchasesPackage | null) {
  const m = mensile?.product?.price;
  const a = annuale?.product?.price;
  if (!m || !a || m <= 0) return null;
  const pieno = m * 12;
  if (a >= pieno) return null;
  return Math.round((1 - a / pieno) * 100);
}

/**
 * L'emblema che respira.
 *
 * 🔑 È lo **stesso respiro della creatura** (`ciclo.respiro`, 2600 ms): non un
 * ritmo nuovo inventato per questa schermata. Un'app che si muove con due
 * tempi diversi sembra fatta da due persone.
 */
function EmblemaCheRespira({ fermo }: { fermo: boolean }) {
  const scala = useSharedValue(1);

  React.useEffect(() => {
    if (fermo) {
      scala.value = 1;
      return;
    }
    scala.value = withRepeat(
      withSequence(
        withTiming(1.045, { duration: ciclo.respiro / 2 }),
        withTiming(1, { duration: ciclo.respiro / 2 })
      ),
      -1,
      false
    );
  }, [fermo, scala]);

  const stile = useAnimatedStyle(() => ({ transform: [{ scale: scala.value }] }));

  return (
    <Riani.View style={stile}>
      <Emblema size={84} />
    </Riani.View>
  );
}

/**
 * Una carta del listino. La scelta si sente col dito e si vede col corpo: la
 * carta scelta **cresce appena**, invece di cambiare solo il bordo.
 */
function Carta({
  pacchetto,
  attivo,
  sconto,
  equivalenteMensile,
  fermo,
  onScegli,
}: {
  pacchetto: PurchasesPackage;
  attivo: boolean;
  sconto: number | null;
  equivalenteMensile: string | null;
  fermo: boolean;
  onScegli: () => void;
}) {
  const eAnnuale = pacchetto.packageType === PACKAGE_TYPE.ANNUAL;
  const cresci = useSharedValue(attivo ? 1 : 0.985);

  React.useEffect(() => {
    cresci.value = fermo ? (attivo ? 1 : 0.985) : withSpring(attivo ? 1 : 0.985, molla.scivolo);
  }, [attivo, fermo, cresci]);

  const stile = useAnimatedStyle(() => ({ transform: [{ scale: cresci.value }] }));

  return (
    <Riani.View style={stile}>
      <Premibile
        onPress={() => {
          // Il polpastrello conferma prima degli occhi: è il primitivo che
          // l'app usa già per ogni scelta.
          tatto('scelta');
          onScegli();
        }}
        scala={0.99}
      >
        <View
          className="relative rounded-3xl border px-5 py-4"
          style={{
            borderColor: attivo ? C.accento : 'rgba(0,0,0,0.10)',
            borderWidth: attivo ? 2 : 1,
            backgroundColor: attivo ? '#ffffff' : 'rgba(255,255,255,0.7)',
          }}
        >
          {/* La pillola sta SOPRA il bordo: è l'unica cosa che deve saltare
              all'occhio prima del prezzo. */}
          {eAnnuale && sconto !== null && (
            <View
              className="absolute -top-3 right-4 rounded-full px-3 py-1"
              style={{ backgroundColor: C.accento }}
            >
              <Text style={{ color: '#ffffff', fontSize: 12 }}>
                {t.abbonamento.risparmio.replace('{sconto}', String(sconto))}
              </Text>
            </View>
          )}

          <View className="flex-row items-center gap-3">
            {/* ⚠️ Un indicatore esplicito, non solo il bordo: su fondo colorato
                la differenza fra bordo sottile e spesso non si legge a colpo
                d'occhio. */}
            <View
              className="h-5 w-5 items-center justify-center rounded-full border-2"
              style={{ borderColor: attivo ? C.accento : 'rgba(0,0,0,0.22)' }}
            >
              {attivo && (
                <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: C.accento }} />
              )}
            </View>

            <View className="flex-1">
              <Text className="font-serif text-lg text-foreground">
                {eAnnuale ? t.abbonamento.annuale : t.abbonamento.mensile}
              </Text>
              {eAnnuale && equivalenteMensile && (
                <Text className="text-sm text-muted-foreground">
                  {t.abbonamento.alMese.replace('{prezzo}', equivalenteMensile)}
                </Text>
              )}
            </View>

            <Text className="text-lg text-foreground">{pacchetto.product.priceString}</Text>
          </View>
        </View>
      </Premibile>
    </Riani.View>
  );
}

export default function Paywall() {
  const router = useRouter();
  const bordi = useSafeAreaInsets();
  const { ricarica } = useInsieme();
  const fermo = useMovimentoRidotto();

  const [pacchetti, setPacchetti] = React.useState<PurchasesPackage[] | null>(null);
  const [scelto, setScelto] = React.useState<PurchasesPackage | null>(null);
  const [errore, setErrore] = React.useState<string | null>(null);
  const [inCorso, setInCorso] = React.useState(false);

  const caricaOfferte = React.useCallback(async () => {
    setPacchetti(null);
    try {
      const offerte = await Purchases.getOfferings();
      const disponibili = offerte.current?.availablePackages ?? [];
      setPacchetti(disponibili);
      // L'annuale è preselezionato: è la scelta che il piano marketing
      // chiama «la più importante delle due» (monetizzazione.md §4).
      const annuale = disponibili.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL);
      setScelto(annuale ?? disponibili[0] ?? null);
    } catch {
      setPacchetti([]);
    }
  }, []);

  React.useEffect(() => {
    void caricaOfferte();
  }, [caricaOfferte]);

  const mensile = pacchetti?.find((p) => p.packageType === PACKAGE_TYPE.MONTHLY) ?? null;
  const annuale = pacchetti?.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL) ?? null;
  const sconto = scontoAnnuale(mensile, annuale);
  const giorni = giorniDiProva(scelto) ?? giorniDiProva(annuale) ?? giorniDiProva(mensile);

  /**
   * L'annuale diviso dodici, nella valuta di chi guarda.
   *
   * 🔑 **È il numero che rende confrontabili le due carte**: «€39,99 all'anno»
   * e «€7,99 al mese» non si paragonano a mente, «€3,33 al mese» sì. Si ricava
   * dal prezzo vero e dal codice valuta dell'offerta — mai scritto a mano.
   */
  const equivalenteMensile = React.useMemo(() => {
    const p = annuale?.product;
    if (!p?.price) return null;
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: p.currencyCode,
      }).format(p.price / 12);
    } catch {
      return null;
    }
  }, [annuale]);

  async function compra() {
    if (!scelto) return;
    setErrore(null);
    setInCorso(true);
    try {
      await Purchases.purchasePackage(scelto);
      tatto('fatto');
      // ⚠️ Non si chiude subito: il webhook è asincrono, e uscire qui
      // mostrerebbe per qualche secondo un'app ancora bloccata a chi ha
      // appena pagato. Si aspetta il database, che è l'unico che decide.
      await ricarica({ insistendo: true });
      router.back();
    } catch (e) {
      // `userCancelled` non è un errore: è una risposta. Dirgli «qualcosa è
      // andato storto» a chi ha semplicemente cambiato idea è una bugia.
      const annullato = (e as { userCancelled?: boolean })?.userCancelled;
      setErrore(annullato ? t.abbonamento.annullato : String((e as Error)?.message ?? e));
    } finally {
      setInCorso(false);
    }
  }

  const caricando = pacchetti === null;
  const vuoto = pacchetti !== null && pacchetti.length === 0;
  const pronto = !caricando && !vuoto;

  return (
    <View className="flex-1 bg-background">
      {/* 🔑 Lo sfondo del RESTO dell'app, non quello d'ingresso. Il gradiente
          di `benvenuto.tsx` è tarato per una schermata quasi vuota: sotto un
          elenco, due carte e un pulsante diventa pesante, e il rosa saturo in
          fondo si mangia il testo delle condizioni. `Fondo` è lo stesso che
          vede chi usa l'app — ed è il punto: il paywall non è una porta
          d'ingresso, è una stanza dell'app. */}
      <Fondo />
      <SafeAreaView className="flex-1">
        <View className="flex-row justify-end px-5 pt-1">
          {/* Chiudere dev'essere possibile e visibile: un paywall senza uscita
              è un motivo di rifiuto in revisione, oltre che sgarbato. */}
          <Premibile onPress={() => router.back()} scala={0.9}>
            <View className="h-10 w-10 items-center justify-center rounded-full">
              <X size={22} color={C.tenue} />
            </View>
          </Premibile>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <Comparsa visibile da="ferma" scala={0.94}>
            <View className="items-center px-8">
              <EmblemaCheRespira fermo={fermo} />
              <Text className="mt-4 text-center font-serif-bold text-4xl leading-tight text-foreground">
                {t.abbonamento.titolo}
              </Text>
              <Text className="mt-2 text-center text-base text-muted-foreground">
                {t.abbonamento.sottotitolo}
              </Text>
            </View>
          </Comparsa>

          {/* L'elenco entra a cascata. ⚠️ `cascata()` ha un tetto: oltre sei
              righe il ritardo si ferma, così la coda non si accende sotto il
              dito di chi sta già scorrendo. */}
          <View className="mt-7 gap-3.5 px-8">
            {t.abbonamento.incluso.map((riga, i) => {
              const Icona = ICONE[i] ?? Heart;
              return (
                <Comparsa key={riga} visibile ritardo={fermo ? 0 : cascata(i + 1)} scarto={10}>
                  <View className="flex-row items-center gap-3.5">
                    {/* Il tondo con l'alone dell'accento: lo stesso trattamento
                        che la barra in basso dà alla scheda attiva. */}
                    <View
                      className="h-9 w-9 items-center justify-center rounded-full"
                      style={{ backgroundColor: C.alone }}
                    >
                      <Icona size={18} color={C.accento} strokeWidth={2} />
                    </View>
                    <Text className="flex-1 text-base text-foreground">{riga}</Text>
                  </View>
                </Comparsa>
              );
            })}
          </View>

          {caricando && (
            <View className="mt-10 items-center gap-3">
              <ActivityIndicator color={C.accento} />
              <Text className="text-sm text-muted-foreground">{t.abbonamento.caricamento}</Text>
            </View>
          )}

          {vuoto && (
            <Comparsa visibile>
              <View className="mt-10 items-center gap-3 px-8">
                <Text className="text-center text-base text-muted-foreground">
                  {t.abbonamento.nessunaOfferta}
                </Text>
                {/* ⚠️ Senza questo, chi incontra un errore di rete resta in un
                    vicolo cieco e deve chiudere e riaprire l'app. */}
                <Premibile onPress={caricaOfferte} scala={0.98}>
                  <View className="rounded-full border border-border px-5 py-2">
                    <Text className="text-foreground">{t.abbonamento.riprova}</Text>
                  </View>
                </Premibile>
              </View>
            </Comparsa>
          )}

          {pronto && (
            <View className="mt-7 gap-3 px-6">
              {[annuale, mensile].filter(Boolean).map((p, i) => {
                const pacchetto = p as PurchasesPackage;
                return (
                  <Comparsa key={pacchetto.identifier} visibile ritardo={fermo ? 0 : cascata(i + 6)}>
                    <Carta
                      pacchetto={pacchetto}
                      attivo={scelto?.identifier === pacchetto.identifier}
                      sconto={sconto}
                      equivalenteMensile={equivalenteMensile}
                      fermo={fermo}
                      onScegli={() => setScelto(pacchetto)}
                    />
                  </Comparsa>
                );
              })}
            </View>
          )}

          {!!errore && (
            <Comparsa visibile>
              <Text className="mt-4 px-8 text-center text-sm text-foreground">{errore}</Text>
            </Comparsa>
          )}
        </ScrollView>

        {/* --- Il blocco d'acquisto, FUORI dallo scorrimento ---------------- */}
        {/* ⚠️ Stava dentro lo ScrollView, e su 375px finiva sotto la piega:
            chi non scorreva non trovava come pagare. E le condizioni, che per
            legge vanno lette PRIMA del pulsante, finivano sotto di esso. */}
        {pronto && (
          <Comparsa visibile ritardo={fermo ? 0 : cascata(8)}>
            <View className="gap-1 px-6 pt-2" style={{ paddingBottom: bordi.bottom + 8 }}>
              {/* 🔴 Obbligo, non stile: rinnovo automatico, come disdire, e che
                  durante la prova non si paga. */}
              <Text className="px-2 text-center text-xs leading-relaxed text-muted-foreground">
                {t.abbonamento.condizioni}
              </Text>

              {/* 🔴 **Il terzo aggancio ai documenti legali** (D-121, B-66).
                  Gli altri due sono la registrazione e le Impostazioni; questo
                  mancava, ed è quello che conta di più: è la schermata in cui
                  si paga. ⚠️ *Sono collegamenti, non caselle da spuntare* —
                  stessa forma di `registrati.tsx`, e per la stessa ragione:
                  la base giuridica è l'esecuzione del contratto (art. 6.1.b).
                  🔑 La rotta sta in `(pubbliche)`, ma `GuardiaSessione`
                  rimanda indietro solo chi NON ha sessione: da qui, che è
                  dentro l'app, si apre. */}
              <View className="mt-1 flex-row flex-wrap justify-center gap-x-5">
                <Text
                  className="text-xs text-muted-foreground underline"
                  onPress={() => router.push('/legale/privacy')}
                >
                  {t.legale.privacyTitolo}
                </Text>
                <Text
                  className="text-xs text-muted-foreground underline"
                  onPress={() => router.push('/legale/cookie')}
                >
                  {t.legale.cookieTitolo}
                </Text>
              </View>

              <Premibile onPress={compra} scala={0.98} disabled={inCorso || !scelto}>
                <View
                  className="mt-2 items-center justify-center rounded-full py-4"
                  style={{ backgroundColor: C.accento, opacity: inCorso ? 0.6 : 1 }}
                >
                  <Text style={{ color: '#ffffff', fontSize: 17 }}>
                    {giorni !== null ? t.abbonamento.inizia : t.abbonamento.acquista}
                  </Text>
                  {/* «poi €39,99»: il prezzo dopo la prova, accanto al pulsante
                      che la avvia. Evita la sorpresa all'ottavo giorno, ed è
                      ciò che Apple chiede di rendere chiaro. */}
                  {giorni !== null && !!scelto && (
                    <Text style={{ color: 'rgba(255,255,255,0.86)', fontSize: 13, marginTop: 2 }}>
                      {t.abbonamento.poi.replace('{prezzo}', scelto.product.priceString)}
                    </Text>
                  )}
                </View>
              </Premibile>

              <View className="flex-row items-center justify-center gap-6">
                <Premibile onPress={() => router.back()} scala={0.98}>
                  <View className="py-3">
                    <Text className="text-sm text-muted-foreground">
                      {t.abbonamento.continuaSenza}
                    </Text>
                  </View>
                </Premibile>
                <Premibile onPress={async () => await ripristinaAcquisti()} scala={0.98}>
                  <View className="py-3">
                    <Text className="text-sm text-muted-foreground">
                      {t.abbonamento.ripristina}
                    </Text>
                  </View>
                </Premibile>
              </View>
            </View>
          </Comparsa>
        )}
      </SafeAreaView>
    </View>
  );
}
