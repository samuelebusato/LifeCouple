import * as React from 'react';
import { AppState, View } from 'react-native';
import { useFocusEffect, usePathname, useRouter } from 'expo-router';
import { Creatura, type Umore } from '@/components/creatura';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/auth';
import { useCreatura } from '@/lib/creatura';
import { useTema } from '@/lib/tema';
import { t } from '@/lib/i18n';

/**
 * **La creatura nella schermata di casa** (D-114): il disegno, la barra di
 * crescita, e chi decide quando succedono le cose.
 *
 * ## Perche' e' separato dal disegno
 *
 * `components/creatura.tsx` sa disegnare e muovere; questo sa **quando**. Il
 * confine e' quello di D-09 e non e' un vezzo di struttura: e' cio' che
 * permette di cambiare il disegno — forme geometriche, poi una lontra, un
 * giorno forse Lottie — senza toccare una riga di questa logica.
 *
 * ## Sta in testa, non fra i riquadri
 *
 * ⚠️ La creatura e' l'**unica funzione non-commodity** del prodotto (P-01):
 * calendario, mappa, foto e liste esistono identiche in dieci app per singoli.
 * Metterla in griglia con loro la renderebbe decorativa proprio mentre e' la
 * cosa che distingue l'app.
 */

/** Di notte dorme. Nessuna impostazione: e' l'ora del telefono. */
function eNotte(d = new Date()) {
  const ora = d.getHours();
  return ora >= 22 || ora < 7;
}

/** Quanto resta in festa prima di tornare alla quiete. */
const FESTA_MS = 2200;

export function CreaturaCasa({ coppiaId }: { coppiaId: string | null }) {
  const { session } = useAuth();
  const { c } = useTema();
  const router = useRouter();
  const percorso = usePathname();

  const cr = useCreatura(coppiaId, session?.user?.id);
  const [umore, setUmore] = React.useState<Umore>(() => (eNotte() ? 'sonno' : 'quiete'));
  const [inFuoco, setInFuoco] = React.useState(false);
  const [appAttiva, setAppAttiva] = React.useState(AppState.currentState === 'active');

  /**
   * ⚠️ **Due condizioni, non una.** `useFocusEffect` dice se la scheda e'
   * quella scelta; `AppState` dice se l'app e' davanti. Un'app in secondo
   * piano con la home selezionata soddisfa la prima e non la seconda, e il
   * respiro continuerebbe a girare a schermo spento.
   */
  useFocusEffect(
    React.useCallback(() => {
      setInFuoco(true);
      return () => setInFuoco(false);
    }, [])
  );

  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setAppAttiva(s === 'active'));
    return () => sub.remove();
  }, []);

  const guarda = inFuoco && appAttiva;

  /** ------------------------------------------------------------------ notte */
  React.useEffect(() => {
    if (!guarda) return;
    // Si ricontrolla al ritorno in primo piano invece che con un timer: chi
    // tiene l'app aperta alle 21:59 non ha bisogno che si addormenti sotto i
    // suoi occhi, e un intervallo che gira tutta la notte per un cambio
    // d'immagine e' un costo senza destinatario.
    setUmore((u) => (u === 'festa' ? u : eNotte() ? 'sonno' : 'quiete'));
  }, [guarda]);

  /** ------------------------------------------------------------------ festa */
  const { festaInSospeso, segnaFestaVista } = cr;
  React.useEffect(() => {
    if (!festaInSospeso || !guarda) return;
    // ⚠️ Si segna come vista **subito**, non a fine animazione: se si esce
    // dalla schermata a meta' festa il momento e' stato comunque consegnato, e
    // rifarlo alla prossima apertura lo trasformerebbe in un promemoria.
    segnaFestaVista();
    setUmore('festa');
  }, [festaInSospeso, guarda, segnaFestaVista]);

  /**
   * La carezza (D-113): stessa festa, **nessun punto**.
   *
   * 🔑 E' il confine che la rende ammissibile. D-15 vuole che la crescita si
   * nutra della chiusura del cerchio fra intenzione e realta'; se accarezzarla
   * desse punti si potrebbe far crescere a colpi di dito. Ma l'umore **non e'**
   * il punteggio: D-102 dice che l'umore e' una reazione, e reagire a una
   * carezza e' la reazione piu' naturale che un animale abbia.
   */
  const carezza = React.useCallback(() => {
    setUmore('festa');
  }, []);

  /** Il ritorno alla quiete, unico per la festa e per la carezza. */
  React.useEffect(() => {
    if (umore !== 'festa') return;
    const id = setTimeout(() => {
      setUmore(eNotte() ? 'sonno' : 'quiete');
    }, FESTA_MS);
    return () => clearTimeout(id);
  }, [umore]);

  /** ------------------------------------------------------------- evoluzione */
  const { evoluzioneInSospeso, mostraEvoluzione, segnaEvoluzioneVista } = cr;

  /**
   * 🔴 **Il ritorno a casa** (D-115), e la sua unica eccezione.
   *
   * Il cambio di stadio succede **due volte in tutta la vita** della creatura:
   * un momento cosi' non puo' aspettare che qualcuno passi di qui per caso.
   *
   * ⚠️ **Tranne che giocando.** I punti si assegnano anche a fine partita
   * (D-104), quindi la soglia puo' cadere proprio mentre si gioca — e i giochi
   * sono a due telefoni sincronizzati. Strappare via chi ha appena chiuso il
   * round interromperebbe la partita **anche all'altro**, che non ha fatto
   * niente. E fra la fine della partita e l'uscita c'e' l'anello del punteggio
   * finale, la cui lentezza e' deliberata (`components/punteggio-finale.tsx`):
   * troncarlo distruggerebbe un momento per mostrarne un altro.
   *
   * 🔑 Due momenti non si sovrappongono: si mettono in fila. L'attesa finisce
   * da se', perche' questo effetto si rivaluta a ogni cambio di percorso.
   */
  const nelGioco = percorso.startsWith('/gioco');
  React.useEffect(() => {
    if (!evoluzioneInSospeso || nelGioco) return;
    if (!inFuoco) router.navigate('/home');
  }, [evoluzioneInSospeso, nelGioco, inFuoco, router]);

  /** Arrivata a casa e con gli occhi addosso: adesso il disegno puo' cambiare. */
  React.useEffect(() => {
    if (!evoluzioneInSospeso || !guarda) return;
    mostraEvoluzione();
  }, [evoluzioneInSospeso, guarda, mostraEvoluzione]);

  if (!coppiaId) return null;

  /**
   * ⚠️ **Non si disegna niente finche' non si sa cosa disegnare.** Uno stadio
   * 1 mostrato durante il caricamento verrebbe sostituito un istante dopo
   * dallo stadio vero, e la sostituzione partirebbe come un'evoluzione: la
   * creatura sembrerebbe crescere a ogni apertura dell'app.
   */
  if (cr.loading) return <View style={{ height: 232 }} />;

  // Non lo sappiamo: si tace, non si inventa uno stadio 1 (B-03). La creatura
  // non e' un dato che valga una schermata d'errore in cima alla home.
  if (cr.errore) return null;

  const mancano = cr.sogliaProssima === null ? 0 : Math.max(0, cr.sogliaProssima - cr.punti);

  return (
    <View className="w-full items-center gap-3 pb-1">
      <Creatura
        stadio={cr.stadioVisto}
        umore={umore}
        attiva={guarda}
        onCarezza={carezza}
        onEvoluzioneFinita={segnaEvoluzioneVista}
        size={180}
      />

      <View className="w-full max-w-[280px] gap-1.5">
        {/* La barra: la crescita quotidiana non puo' venire dagli stadi, che
            scattano due volte in tutta la vita (D-102). Viene dalla reazione,
            e da qui — l'unico posto in cui il progresso e' un numero. */}
        <View
          className="h-1.5 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: c.linea }}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: Math.round(cr.quota * 100) }}
        >
          <View
            style={{
              width: `${Math.round(cr.quota * 100)}%`,
              height: '100%',
              backgroundColor: c.accento,
              borderRadius: 999,
            }}
          />
        </View>
        <Text className="text-center text-xs text-muted-foreground">
          {cr.sogliaProssima === null
            ? t.creatura.cresciutaDelTutto
            : t.creatura.mancano(mancano)}
        </Text>
      </View>
    </View>
  );
}
