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
//    solo: il diritto lo scrive il webhook e lo legge `ho_insieme()`
//    dal database (0047, threat-model §4-ter). Questa schermata vende, poi
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
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Heart, Image, ListChecks, Map, Sparkles, Users, X } from 'lucide-react-native';
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
import { useCoppia } from '@/lib/coppia';

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
  /** L'alone respira **in controfase e più ampio**: l'emblema resta fermo al
   *  centro mentre la luce intorno si allarga. Un alone che pulsa all'unisono
   *  con la sagoma sembra un ingrandimento, non un respiro. */
  const alone = useSharedValue(1);

  React.useEffect(() => {
    if (fermo) {
      scala.value = 1;
      alone.value = 1;
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
    alone.value = withRepeat(
      withSequence(
        withTiming(1.14, { duration: ciclo.respiro / 2 }),
        withTiming(1, { duration: ciclo.respiro / 2 })
      ),
      -1,
      false
    );
  }, [fermo, scala, alone]);

  const stile = useAnimatedStyle(() => ({ transform: [{ scale: scala.value }] }));
  const stileAlone = useAnimatedStyle(() => ({
    transform: [{ scale: alone.value }],
    opacity: 1.16 - alone.value,
  }));

  return (
    <View className="items-center justify-center">
      {/* I due aloni concentrici. ⚠️ `pointerEvents="none"`: sono decorazione
          sotto un elemento che non si preme, ma stanno in posizione assoluta e
          senza questo intercetterebbero il tocco delle righe vicine. */}
      <Riani.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            height: 168,
            width: 168,
            borderRadius: 84,
            backgroundColor: C.alone,
          },
          stileAlone,
        ]}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          height: 120,
          width: 120,
          borderRadius: 60,
          backgroundColor: C.alone,
        }}
      />
      <Riani.View style={stile}>
        <Emblema size={84} />
      </Riani.View>
    </View>
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
  prezzoPieno,
  fermo,
  onScegli,
}: {
  pacchetto: PurchasesPackage;
  attivo: boolean;
  sconto: number | null;
  equivalenteMensile: string | null;
  /** Il mensile × 12, formattato: il termine di paragone dell'annuale. Si
   *  mostra **barrato**, e solo quando c'è davvero uno sconto da mostrare. */
  prezzoPieno: string | null;
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
            backgroundColor: attivo ? '#ffffff' : 'rgba(255,255,255,0.72)',
            // 🔑 L'ombra è **dell'accento, non nera**: alza la carta scelta dal
            //    fondo senza sporcarlo di grigio. Su un fondo rosa pallido
            //    un'ombra neutra si legge come una macchia.
            shadowColor: C.accento,
            shadowOpacity: attivo ? 0.18 : 0,
            shadowRadius: attivo ? 16 : 0,
            shadowOffset: { width: 0, height: 6 },
            elevation: attivo ? 4 : 0,
          }}
        >
          {/* La pillola sta SOPRA il bordo: è l'unica cosa che deve saltare
              all'occhio prima del prezzo. ⚠️ Nessun `overflow: hidden` lungo
              questa catena, altrimenti sparirebbe: è sovrapposta di proposito. */}
          {eAnnuale && sconto !== null && (
            <View
              className="absolute -top-3 right-4 flex-row items-center gap-1 rounded-full px-3 py-1"
              style={{
                backgroundColor: C.accento,
                shadowColor: C.accento,
                shadowOpacity: 0.3,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 3 },
                elevation: 3,
              }}
            >
              <Sparkles size={12} color="#ffffff" strokeWidth={2.4} />
              <Text style={{ color: '#ffffff', fontSize: 12 }}>
                {t.abbonamento.risparmio.replace('{sconto}', String(sconto))}
              </Text>
            </View>
          )}

          <View className="flex-row items-center gap-3">
            {/* ⚠️ Un indicatore esplicito, non solo il bordo: su fondo colorato
                la differenza fra bordo sottile e spesso non si legge a colpo
                d'occhio. 🔑 Da scelto porta una **spunta**, non un pallino: dice
                «questo» invece di «acceso», che è ciò che si sta scegliendo. */}
            <View
              className="h-6 w-6 items-center justify-center rounded-full border-2"
              style={{
                borderColor: attivo ? C.accento : 'rgba(0,0,0,0.20)',
                backgroundColor: attivo ? C.accento : 'transparent',
              }}
            >
              {attivo && <Check size={14} color="#ffffff" strokeWidth={3} />}
            </View>

            <View className="flex-1">
              <Text className="font-serif text-lg text-foreground">
                {eAnnuale ? t.abbonamento.annuale : t.abbonamento.mensile}
              </Text>
              {eAnnuale && equivalenteMensile && (
                // 🔑 L'equivalente mensile è **in accento**: è il numero che
                //    rende confrontabili le due carte, e prima si perdeva in
                //    grigio sotto il nome del piano.
                <Text className="text-sm" style={{ color: C.accento }}>
                  {t.abbonamento.alMese.replace('{prezzo}', equivalenteMensile)}
                </Text>
              )}
            </View>

            <View className="items-end">
              <Text className="font-serif-bold text-2xl leading-tight text-foreground">
                {pacchetto.product.priceString}
              </Text>
              {/* Il prezzo pieno barrato: **calcolato sul mensile vero × 12**,
                  mai scritto a mano. ⚠️ Compare solo se uno sconto esiste — un
                  barrato senza risparmio dietro è pubblicità ingannevole, e su
                  una schermata che incassa è esattamente il tipo di riga che
                  un'autorità contesta. */}
              {eAnnuale && prezzoPieno && (
                <Text
                  className="text-sm text-muted-foreground"
                  style={{ textDecorationLine: 'line-through' }}
                >
                  {prezzoPieno}
                </Text>
              )}
            </View>
          </View>
        </View>
      </Premibile>
    </Riani.View>
  );
}

export default function Paywall() {
  const router = useRouter();
  const bordi = useSafeAreaInsets();
  const { insieme, ricarica } = useInsieme();

  /**
   * 🔴 **`GO_BACK was not handled by any navigator`** — l'errore visto il
   * 2026-09-15.
   *
   * `router.back()` presuppone che sotto ci sia qualcosa. Ma a questa
   * schermata si arriva anche **come prima schermata**: dal muro dopo un link
   * d'invito, o a fine onboarding. Lì lo stack è vuoto e `back()` non ha
   * nessuno che lo gestisca.
   *
   * ⚠️ *In sviluppo è un riquadro rosso; in produzione è peggio — non si vede
   * niente e **la schermata non si chiude**, lasciando chi ha appena pagato
   * davanti al listino.*
   */
  const chiudi = React.useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/home');
  }, [router]);

  /**
   * **La schermata si chiude quando il diritto arriva, non quando l'app lo
   * scopre** (B-77).
   *
   * Se il webhook tarda, `compra()` resta qui e mostra *«stiamo registrando
   * l'acquisto»*. Il realtime della `0048` sveglia `useInsieme`, `insieme`
   * diventa vero, e questo effetto chiude. 🔑 *Nessuna finestra, nessun
   * numero di tentativi: arriva quando arriva.*
   */
  React.useEffect(() => {
    if (insieme) chiudi();
  }, [insieme, chiudi]);

  /**
   * 🔴 **B-74 — il paywall vendeva a chi non poteva ricevere niente.**
   *
   * Fino alla `0047` il cancello era `coppia_ha_insieme(cid)`, una proiezione
   * **sulla coppia**: *«esiste un
   * membro attivo con un diritto valido?»*. Chi non è in nessuna coppia non
   * può soddisfarla, **mai**, qualunque cosa abbia comprato.
   *
   * ⚠️ Fino al 2026-09-15 questa schermata non lo guardava: mostrava i prezzi,
   * accettava l'acquisto, incassava — e i muri restavano su. 🔑 *Non è un caso
   * di laboratorio: è successo davvero, su un account senza partner, e ha
   * consumato ore di diagnosi perché il sintomo («ho pagato e non si sblocca»)
   * punta ai pagamenti, dove non c'era niente di rotto.*
   *
   * 🔑 **E per un cliente vero sarebbe stato un addebito senza contropartita.**
   * D-124 dice che il diritto è della persona e si *proietta* sulla coppia:
   * comprare prima di avere un partner non è assurdo in sé — ma venderlo senza
   * dirlo lo è. Qui si dice, e non si vende.
   */
  const { coppiaId, loading: coppiaInCaricamento } = useCoppia();
  const senzaCoppia = !coppiaInCaricamento && !coppiaId;

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

  /**
   * Quanto costerebbe un anno **pagato mese per mese**: è il termine di
   * paragone barrato accanto al prezzo dell'annuale.
   *
   * 🔑 **Si ricava dal mensile vero × 12, e solo quando c'è uno sconto** —
   * `sconto` è già null se l'annuale non conviene. ⚠️ *Un prezzo barrato che
   * non corrisponde a un prezzo realmente praticato è pubblicità ingannevole*,
   * e qui il prezzo barrato è praticato davvero: è l'altra carta, visibile
   * nella stessa schermata.
   */
  const prezzoPieno = React.useMemo(() => {
    const m = mensile?.product;
    if (!m?.price || sconto === null) return null;
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: m.currencyCode,
      }).format(m.price * 12);
    } catch {
      return null;
    }
  }, [mensile, sconto]);

  async function compra() {
    if (!scelto) return;

    // ⚠️ **Non si blocca l'acquisto a chi non ha ancora una coppia**, e la
    // prima stesura di B-74 sbagliava proprio qui. **D-124**: il diritto è
    // della **persona** e si *proietta* sulla coppia — comprare prima di avere
    // un partner è legittimo, e il diritto resta acquisito. Quello che non si
    // può fare è **tacerlo**: vedi l'avviso sopra il pulsante.
    setErrore(null);
    setInCorso(true);
    try {
      await Purchases.purchasePackage(scelto);
      tatto('fatto');
      // ⚠️ Non si chiude subito: il webhook è asincrono, e uscire qui
      // mostrerebbe per qualche secondo un'app ancora bloccata a chi ha
      // appena pagato. Si aspetta il database, che è l'unico che decide.
      const arrivato = await ricarica({ insistendo: true });

      // 🔴 **B-77 — qui si chiudeva comunque, e in silenzio.**
      //
      // `ricarica({ insistendo })` prova 6 volte in ~9 secondi e poi si
      // arrende. Fino al 2026-09-15 l'esito non veniva nemmeno guardato: si
      // usciva lo stesso, coi muri su, **senza dire niente**. ⚠️ *Chi aveva
      // pagato vedeva lo schermo identico a chi non aveva pagato* — e il
      // 2026-09-15 è successo davvero, perché il webhook quel pomeriggio ci ha
      // messo più di nove secondi.
      //
      // 🔑 **Ora se tarda si resta qui e lo si dice.** Non è un errore: è
      // un'attesa, e ha un testo suo (`arrivoInCorso`) che esisteva già e da
      // questa strada non veniva mai mostrato. La schermata si chiude da sé
      // appena il diritto arriva — se ne occupa il realtime della `0048`,
      // tramite l'effetto qui sotto.
      if (!arrivato) {
        setErrore(t.abbonamento.arrivoInCorso);
        return;
      }
      chiudi();
    } catch (e) {
      // `userCancelled` non è un errore: è una risposta. Dirgli «qualcosa è
      // andato storto» a chi ha semplicemente cambiato idea è una bugia.
      const err = e as {
        userCancelled?: boolean;
        code?: string | number;
        readableErrorCode?: string;
        underlyingErrorMessage?: string;
        message?: string;
      };
      const annullato = err?.userCancelled;

      // 🔴 **B-72 — l'unica riga che spiegava il guasto veniva buttata via.**
      //
      // Il 2026-09-15 un acquisto sandbox è fallito con «Purchase was
      // cancelled» *senza che nessuno avesse annullato*, e non c'era modo di
      // sapere perché: questo `catch` teneva `userCancelled` e il solo
      // `message`, scartando **`code`, `readableErrorCode` e soprattutto
      // `underlyingErrorMessage`** — che è dove StoreKit scrive la causa vera
      // (account sandbox assente, prodotto non servibile, transazione non
      // finalizzabile).
      //
      // 🔑 *La distinzione che conta: `userCancelled` dice COSA ha risposto lo
      // store, mai PERCHÉ.* StoreKit restituisce `userCancelled` anche quando
      // è lui ad abortire — quindi quel booleano da solo racconta una scelta
      // dell'utente che può non esserci stata mai.
      //
      // ⚠️ Va in console e non sullo schermo: a chi paga non si mostra un
      // codice di errore. Ma senza, chi diagnostica non ha niente.
      console.warn(
        '[paywall] acquisto non riuscito —',
        JSON.stringify(
          {
            userCancelled: err?.userCancelled ?? null,
            code: err?.code ?? null,
            readableErrorCode: err?.readableErrorCode ?? null,
            underlyingErrorMessage: err?.underlyingErrorMessage ?? null,
            message: err?.message ?? String(e),
            pacchetto: scelto?.identifier ?? null,
            prodotto: scelto?.product?.identifier ?? null,
          },
          null,
          2
        )
      );

      setErrore(annullato ? t.abbonamento.annullato : String(err?.message ?? e));
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
          <Premibile onPress={chiudi} scala={0.9}>
            {/* ⚠️ Un tondo tenue sotto la croce, non la croce nuda: sul fondo
                sfumato un glifo sottile senza superficie sotto **non si legge
                come un bottone**, e l'uscita da un paywall deve leggersi al
                primo colpo d'occhio. */}
            <View
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.66)' }}
            >
              <X size={20} color={C.tenue} strokeWidth={2.2} />
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

              {/* L'occhiello della prova gratuita, **sopra** il titolo.
                  🔑 `provaGiorni` esisteva già e non veniva mostrata da nessuna
                  parte: la sola menzione della prova era il «poi €39,99» sotto
                  il pulsante, cioè *dopo* la decisione. ⚠️ Il numero viene
                  dall'offerta (`giorniDiProva`), mai scritto a mano: se un
                  domani diventa di 14 giorni, questa riga lo segue da sé. */}
              {giorni !== null && (
                <View
                  className="mt-4 flex-row items-center gap-1.5 rounded-full px-3.5 py-1.5"
                  style={{ backgroundColor: C.aloneForte }}
                >
                  <Sparkles size={13} color={C.accento} strokeWidth={2.4} />
                  <Text style={{ color: C.accento, fontSize: 13 }}>
                    {t.abbonamento.provaGiorni.replace('{giorni}', String(giorni))}
                  </Text>
                </View>
              )}

              <Text
                className="text-center font-serif-bold text-4xl leading-tight text-foreground"
                style={{ marginTop: giorni !== null ? 12 : 16 }}
              >
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
          {/* 🔑 **Le cinque righe stanno ora dentro una carta, e non è
              decorazione**: su un fondo sfumato un elenco senza superficie
              sotto galleggia, e il testo scuro perde contrasto proprio dove il
              rosa si fa più saturo. La carta è la stessa superficie delle due
              del listino — così la schermata ha *due* blocchi, «cosa ottieni» e
              «quanto costa», invece di sette elementi in fila. */}
          <View className="mt-7 px-6">
            <View
              className="rounded-3xl px-5 py-5"
              style={{
                backgroundColor: 'rgba(255,255,255,0.72)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.9)',
              }}
            >
              <View className="gap-3.5">
                {t.abbonamento.incluso.map((riga, i) => {
                  const Icona = ICONE[i] ?? Heart;
                  return (
                    <Comparsa key={riga} visibile ritardo={fermo ? 0 : cascata(i + 1)} scarto={10}>
                      <View className="flex-row items-center gap-3.5">
                        {/* Il tondo con l'alone dell'accento: lo stesso
                            trattamento che la barra in basso dà alla scheda
                            attiva. */}
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
            </View>
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
                      prezzoPieno={prezzoPieno}
                      fermo={fermo}
                      onScegli={() => setScelto(pacchetto)}
                    />
                  </Comparsa>
                );
              })}
            </View>
          )}

        </ScrollView>

        {/* --- Il blocco d'acquisto, FUORI dallo scorrimento ---------------- */}
        {/* ⚠️ Stava dentro lo ScrollView, e su 375px finiva sotto la piega:
            chi non scorreva non trovava come pagare. E le condizioni, che per
            legge vanno lette PRIMA del pulsante, finivano sotto di esso. */}
        {pronto && (
          <Comparsa visibile ritardo={fermo ? 0 : cascata(8)}>
            <View
              className="gap-1 px-6 pt-2"
              style={{
                paddingBottom: bordi.bottom + 8,
                backgroundColor: 'rgba(255,255,255,0.82)',
              }}
            >
              {/* La dissolvenza sopra il pannello. 🔑 Senza, l'elenco che scorre
                  viene **tagliato di netto** dal bordo del blocco fisso, e la
                  schermata sembra finire dove invece continua. ⚠️ Sta in
                  posizione assoluta sopra il proprio contenitore e non deve
                  intercettare tocchi. */}
              <LinearGradient
                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.82)']}
                style={{ position: 'absolute', left: 0, right: 0, top: -28, height: 28 }}
                pointerEvents="none"
              />

              {/* 🔴 **B-74 — se non c'è ancora una coppia, lo si dice PRIMA.**
                  Comprare senza partner è legittimo (D-124: il diritto è della
                  persona e si proietta sulla coppia), ma `ho_insieme()` non
                  apre nulla finché la coppia non esiste — quindi le funzioni
                  restano chiuse anche dopo aver pagato.
                  ⚠️ *È accaduto davvero il 2026-09-15*: muri su dopo l'acquisto,
                  e ore passate a cercare il guasto nei pagamenti, dove non
                  c'era.
                  ⟳ **Spostato in cima al blocco e reso visibile il 2026-09-15
                  (5), e sono due correzioni in una.** Era un testo grigio di 12
                  punti *identico* alle due righe legali, incastrato **fra
                  quelle e il pulsante**: 🔑 si perdeva fra righe che gli
                  somigliavano — ed è l'unica delle tre che parla di questo
                  utente qui — e per giunta **allontanava dal pulsante la presa
                  d'atto del recesso**, che invece deve stargli adiacente. Ora
                  ha una superficie sua, un'icona, e sta sopra. */}
              {senzaCoppia && (
                <View
                  className="mb-2 flex-row items-start gap-2.5 rounded-2xl px-3.5 py-3"
                  style={{ backgroundColor: C.alone }}
                >
                  <Users size={16} color={C.accento} strokeWidth={2.2} style={{ marginTop: 1 }} />
                  <Text className="flex-1 text-xs leading-relaxed text-foreground">
                    {t.abbonamento.serveLaCoppia}
                  </Text>
                </View>
              )}

              {/* 🔴 Obbligo, non stile: rinnovo automatico, come disdire, e che
                  durante la prova non si paga. */}
              <Text className="px-2 text-center text-xs leading-relaxed text-muted-foreground">
                {t.abbonamento.condizioni}
              </Text>

              {/* 🔴 **Le due frasi che fanno decadere il recesso** (B-66, art.
                  59.1.o Codice del Consumo): la richiesta espressa che
                  l'esecuzione cominci subito, e la presa d'atto di perderlo.
                  ⚠️ *Stanno SOPRA il pulsante e non sotto, ed è la metà che si
                  sbaglia*: una presa d'atto letta dopo aver pagato non è una
                  presa d'atto. 🔑 L'atto espresso è il tocco sul pulsante, e
                  questo testo dice cosa significa toccarlo. In attesa della
                  revisione dell'avvocato. */}
              <Text className="px-2 pt-1 text-center text-xs leading-relaxed text-muted-foreground">
                {t.abbonamento.recesso}
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
                {/* ➳ **I termini, dal 2026-09-15**, e qui sono il link che
                    contava di piu': §3.1 di `pubblicazione.md` elenca «mancano
                    i link a termini e privacy» fra i rifiuti banali e
                    frequentissimi in revisione. 🔑 *E' anche la schermata dove
                    si conclude il contratto a pagamento*, quindi è dove le
                    condizioni devono essere raggiungibili senza uscire. */}
                <Text
                  className="text-xs text-muted-foreground underline"
                  onPress={() => router.push('/legale/termini')}
                >
                  {t.legale.terminiTitolo}
                </Text>
              </View>

              {/* 🔴 **L'esito dell'acquisto era dentro lo ScrollView, e questa
                  è la seconda volta che lo stesso errore capita su questa
                  schermata.** Il blocco d'acquisto è stato portato fuori dallo
                  scorrimento proprio perché su 375 px finiva sotto la piega —
                  ma il messaggio che *risponde al pulsante* era rimasto dentro,
                  cioè sopra l'elenco, fuori dallo schermo di chi ha appena
                  premuto.
                  ⚠️ **E il messaggio che ci finiva più spesso è il peggiore da
                  perdere**: `arrivoInCorso`, la rete di sicurezza di **B-77**.
                  Chi paga e vede il webhook tardare deve leggere *«stiamo
                  registrando l'acquisto»* — se quel testo è fuori schermo, per
                  lui non è mai stato scritto, e siamo di nuovo al silenzio che
                  B-77 doveva togliere. 🔑 *Una rete di sicurezza fuori dal campo
                  visivo non è una rete.*
                  ⬜ Il riquadro distingue **attesa** da **errore**: l'attesa
                  porta l'accento e una rotella, l'errore no. Non è colore
                  decorativo — dice se c'è qualcosa da fare o solo da
                  aspettare. */}
              {!!errore && (
                <Comparsa visibile>
                  <View
                    className="mb-2 flex-row items-start gap-2.5 rounded-2xl px-3.5 py-3"
                    style={{
                      backgroundColor: errore === t.abbonamento.arrivoInCorso ? C.alone : '#ffffff',
                      borderWidth: 1,
                      borderColor:
                        errore === t.abbonamento.arrivoInCorso ? C.aloneForte : 'rgba(0,0,0,0.10)',
                    }}
                  >
                    {errore === t.abbonamento.arrivoInCorso && (
                      <ActivityIndicator color={C.accento} size="small" />
                    )}
                    <Text className="flex-1 text-sm leading-relaxed text-foreground">{errore}</Text>
                  </View>
                </Comparsa>
              )}

              <Premibile onPress={compra} scala={0.98} disabled={inCorso || !scelto}>
                {/* Il pulsante è ora **sfumato e con un'ombra del proprio
                    colore**, non una pastiglia piatta: è l'unico elemento della
                    schermata che deve sembrare sollevato dal foglio.
                    ⚠️ *La sfumatura resta stretta* — due tinte vicine sulla
                    stessa famiglia — perché un pulsante che cambia troppo
                    colore da un capo all'altro si legge come un'immagine, e le
                    immagini non si premono.
                    ⬜ `inCorso` spegne l'ombra oltre a velare il fondo: un
                    pulsante in attesa che resta in rilievo invita a premerlo
                    una seconda volta. */}
                <View
                  className="mt-2 items-center justify-center overflow-hidden rounded-full"
                  style={{
                    opacity: inCorso ? 0.6 : 1,
                    shadowColor: C.accento,
                    shadowOpacity: inCorso ? 0 : 0.35,
                    shadowRadius: 14,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: inCorso ? 0 : 5,
                  }}
                >
                  <LinearGradient
                    colors={[C.accentoChiaro, C.accento]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ width: '100%', alignItems: 'center', paddingVertical: 16 }}
                  >
                    <View className="flex-row items-center gap-2">
                      {inCorso && <ActivityIndicator color="#ffffff" size="small" />}
                      <Text style={{ color: '#ffffff', fontSize: 17 }}>
                        {giorni !== null ? t.abbonamento.inizia : t.abbonamento.acquista}
                      </Text>
                    </View>
                    {/* «poi €39,99»: il prezzo dopo la prova, accanto al
                        pulsante che la avvia. Evita la sorpresa all'ottavo
                        giorno, ed è ciò che Apple chiede di rendere chiaro. */}
                    {giorni !== null && !!scelto && (
                      <Text style={{ color: 'rgba(255,255,255,0.86)', fontSize: 13, marginTop: 2 }}>
                        {t.abbonamento.poi.replace('{prezzo}', scelto.product.priceString)}
                      </Text>
                    )}
                  </LinearGradient>
                </View>
              </Premibile>

              <View className="flex-row items-center justify-center gap-6">
                <Premibile onPress={chiudi} scala={0.98}>
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
