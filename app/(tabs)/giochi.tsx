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
import { useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Fondo } from '@/components/schermata';
import { SPAZIO_BARRA } from '@/components/barra-volante';
import { BottoneVetro, BottonePieno, CartaVetro } from '@/components/ui/vetro';
import { Premibile } from '@/components/ui/premibile';
import { Foglio } from '@/components/foglio';
import { CartaGioco } from '@/components/carta-gioco';
import { ServePartner } from '@/components/serve-partner';
import { GIOCHI, type CodiceGioco, type ModoGioco } from '@/lib/giochi';
import { supabase } from '@/lib/supabase';
import { useCoppia } from '@/lib/coppia';
import { useTema } from '@/lib/tema';
import { molla } from '@/lib/movimento';
import { t } from '@/lib/i18n';

/**
 * **L'hub dei giochi**: si sceglie il gioco scorrendo, e sotto ci sono i due
 * soli comandi che servono — «Classifica» e «Gioca».
 *
 * ## Perche' un carosello e non una griglia
 *
 * Una griglia di tre icone era la soluzione ovvia e piu' corta da scrivere. Il
 * carosello vince per una ragione che non e' estetica: i giochi qui sono
 * **tre**, e resteranno pochi anche dopo (P-04 ne propone altri quattro, non
 * altri quaranta). Con pochi elementi la griglia spreca lo schermo e li mostra
 * tutti alla stessa distanza dall'occhio, mentre il carosello ne **sceglie uno
 * alla volta** e quindi puo' permettersi di dire, di ognuno, cosa e': un disegno
 * grande e una frase intera, invece di un'etichetta di due parole sotto
 * un'icona.
 *
 * ⚠️ I due comandi restano **due, sempre gli stessi, fermi in fondo**. E' la
 * parte del riferimento che valeva la pena prendere: la carta cambia, i comandi
 * no. Se ogni carta avesse i suoi bottoni, cambiare gioco sposterebbe anche i
 * comandi, e ogni scorrimento costringerebbe a ritrovarli.
 *
 * ## Cosa NON c'e', di proposito
 *
 * Le partite non esistono ancora: manca la voce 8 del backlog, il meccanismo di
 * invio sigillato (D-12). Questo hub quindi **non finge**. I due comandi si
 * aprono davvero e mostrano cio' che mostreranno, e dicono anche cosa manca
 * perche' facciano qualcosa. E' la regola di `SezioneInArrivo` — *nessun gap
 * silenzioso* vale anche verso chi usa l'app — applicata a una schermata che
 * ormai e' troppo piena per essere un cartellino.
 */
export default function Giochi() {
  const router = useRouter();
  const { c } = useTema();
  const { width, height } = useWindowDimensions();
  const { coppiaId, completa, ricarica } = useCoppia();

  /** Quale foglio e' aperto. Uno solo alla volta: sono due strade diverse. */
  const [foglio, setFoglio] = React.useState<null | 'gioca' | 'classifica'>(null);
  /**
   * Il gioco al centro.
   *
   * ⚠️ Vive in uno stato React e **non** nella `x` di Reanimated, ed e' voluto:
   * la `x` cambia sessanta volte al secondo e serve al movimento, questo cambia
   * una volta per scorrimento e serve a **scrivere un nome**. Tenerli separati
   * evita di far ridisegnare tre carte a ogni fotogramma per aggiornare un
   * titolo che nessuno sta guardando mentre scorre.
   *
   * Serve perche' senza, i due fogli parlerebbero di «un gioco» generico: una
   * domanda come «come volete giocare?» senza dire *a cosa* e' la stessa
   * ambiguita' che rende inutile meta' dei menu.
   */
  const [scelto, setScelto] = React.useState(0);

  /**
   * I due punteggi della coppia, sommati sulle partite concluse.
   *
   * 🔑 Sono **della coppia**, non di uno contro l'altro, ed è la ragione per cui
   * qui non c'è una classifica: P-03 vieta che il punteggio diventi un verdetto
   * sulla relazione, e una graduatoria fra due persone lo sarebbe. Un totale
   * condiviso non lo è — non c'è nessuno che vince contro nessuno.
   */
  const [punteggi, setPunteggi] = React.useState<Record<string, number>>({});
  React.useEffect(() => {
    if (!coppiaId) return;
    supabase
      .from('partita')
      .select('gioco, punti')
      .eq('coppia_id', coppiaId)
      .eq('stato', 'conclusa')
      .then(({ data }) => {
        const somma: Record<string, number> = {};
        for (const r of data ?? []) somma[r.gioco] = (somma[r.gioco] ?? 0) + r.punti;
        setPunteggi(somma);
      });
  }, [coppiaId, foglio]);

  /**
   * ⚠️ La carta e' larga il **74%** dello schermo, non il 100%: le due vicine
   * devono sporgere. Un carosello a pagina piena non si legge come un mazzo —
   * si legge come una schermata che ogni tanto cambia contenuto, e nessuno prova
   * a scorrerla perche' niente dice che ci sia dell'altro.
   */
  const CARTA = Math.min(width * 0.74, 330);
  const SPAZIO = 16;
  const PAGINA = CARTA + SPAZIO;
  const ALTEZZA = Math.max(280, Math.min(height * 0.42, 390));
  /**
   * ⚠️ **L'altezza del carosello la decido io** (2026-08-28).
   *
   * Prima la \`ScrollView\` non aveva altezza e se la prendeva dal contenuto: il
   * risultato sul telefono e' stato un vuoto largo sopra i puntini e tutto il
   * resto — puntini, comandi, riga di stato e barra — schiacciato in fondo, che
   * e' il difetto riferito dall'utente. Con un'altezza esplicita lo spazio si
   * distribuisce dove decido, invece che dove avanza.
   *
   * I 48 punti in piu' della carta non sono aria: sono il posto in cui la carta
   * puo' **ingrandirsi con lo zoom** (1,07 su 390 sono 27 punti) e in cui la
   * sua ombra puo' cadere. Una \`ScrollView\` ritaglia ai propri bordi: senza
   * questo margine, premere «Gioca» taglierebbe la carta sopra e sotto proprio
   * mentre la si sta guardando venire avanti.
   */
  const PISTA = ALTEZZA + 48;

  const x = useSharedValue(0);
  const zoom = useSharedValue(1);
  const alloScorrimento = useAnimatedScrollHandler((e) => {
    x.value = e.contentOffset.x;
  });

  /**
   * Lo **zoom del comando**, la seconda animazione chiesta.
   *
   * Resta su finche' il foglio e' aperto, invece di essere un lampo: cosi' non
   * e' un effetto sul bottone, e' la carta che **viene avanti** perche' il
   * foglio parla di lei. Alla chiusura torna con la molla dello scivolo, meno
   * viva di quella d'entrata — sta tornando al suo posto, non arrivando.
   */
  function apri(quale: 'gioca' | 'classifica') {
    zoom.value = withSpring(1.07, molla.entrata);
    setFoglio(quale);
  }
  function chiudi() {
    zoom.value = withSpring(1, molla.scivolo);
    setFoglio(null);
  }

  return (
    <View className="flex-1">
      <Fondo />
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="gap-1 px-6 pb-2 pt-2">
          <Text className="font-serif-bold text-3xl text-foreground">{t.hubGiochi.titolo}</Text>
          <Text className="text-sm text-muted-foreground">{t.hubGiochi.sottotitolo}</Text>
        </View>

        <View className="flex-1 justify-center">
          <Riani.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={alloScorrimento}
            scrollEventThrottle={16}
            // `flexGrow: 0` insieme all'altezza: dentro una colonna `flex-1`
            // una ScrollView senza freno si allunga, ed e' cosi' che nasceva
            // il vuoto sopra i puntini.
            style={{ height: PISTA, flexGrow: 0 }}
            // `snapToInterval` e non `pagingEnabled`: la pagina qui non e' larga
            // quanto lo schermo, ed e' esattamente il punto — vedi CARTA.
            snapToInterval={PAGINA}
            disableIntervalMomentum
            decelerationRate="fast"
            onMomentumScrollEnd={(e) => {
              const i = Math.round(e.nativeEvent.contentOffset.x / PAGINA);
              setScelto(Math.max(0, Math.min(GIOCHI.length - 1, i)));
            }}
            contentContainerStyle={{
              paddingHorizontal: (width - CARTA) / 2,
              gap: SPAZIO,
              alignItems: 'center',
            }}
          >
            {GIOCHI.map((g, i) => (
              <CartaGioco
                key={g.codice}
                gioco={g}
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
            {GIOCHI.map((g, i) => (
              <Puntino key={g.codice} indice={i} x={x} pagina={PAGINA} colore={c.accento} />
            ))}
          </View>
        </View>

        {/*
          ⚠️ **Lo spazio in fondo e' `SPAZIO_BARRA + 26`, non `SPAZIO_BARRA`**
          (2026-08-28). Quella costante misura quanto serve perche' il contenuto
          non finisca **sotto** la barra volante — cioe' il minimo per non
          sparire, non la distanza a cui una riga di testo smette di sembrarle
          addosso. Qui sotto i comandi c'e' anche la riga di stato, e con il solo
          minimo le tre cose si toccavano.
          `paddingTop` e `gap-5` fanno la stessa cosa dall'alto: i puntini sono
          l'indicatore del carosello, non l'etichetta dei bottoni, e devono
          stare piu' vicini a cio' che indicano che a cio' che li segue.
        */}
        <View
          className="gap-5 px-6"
          style={{ paddingTop: 18, paddingBottom: SPAZIO_BARRA + 26 }}
        >
          {/*
            ⚠️ Il cartellino sostituisce i **comandi**, non la schermata (D-25 e
            la scelta del 2026-08-13: si blocca cio' che senza due persone non
            esiste, non cio' che senza due persone e' solo meno bello). Chi e'
            ancora solo vede lo stesso i tre giochi e capisce cosa lo aspetta;
            quello che non puo' fare e' avviarli — una partita da soli non e' una
            partita meno bella, non e' niente.
          */}
          {completa ? (
            <View className="flex-row gap-3">
              <BottoneVetro style={{ flex: 1 }} onPress={() => apri('classifica')}>
                <Sparkles color={c.testo} size={18} />
                <Text>{t.hubGiochi.classifica}</Text>
              </BottoneVetro>
              {/* ⚠️ Pieno e non vetro tinto: vedi il commento in
                  `components/attesa-partita.tsx`. Sopra lo sfondo chiaro il
                  vetro accento si legge **spento**, ed era il difetto riferito.
                  Qui si perde l'icona — `BottonePieno` prende solo testo — e va
                  bene: fra un'azione riconoscibile e un'icona, in fondo a una
                  schermata con due soli comandi, l'icona è quella che si può
                  perdere. */}
              <BottonePieno
                style={{ flex: 1 }}
                altezza={54}
                testo={t.hubGiochi.gioca}
                onPress={() => apri('gioca')}
              />
            </View>
          ) : (
            <ServePartner coppiaId={coppiaId} ricarica={ricarica} />
          )}

          {!PRONTI.includes(GIOCHI[scelto].codice) && (
            <Text className="text-center text-xs text-muted-foreground/80">
              {t.hubGiochi.inArrivo}
            </Text>
          )}
        </View>
      </SafeAreaView>

      {/* --- «Gioca»: le due sorgenti di domande (D-19, backlog 11-bis) ------ */}
      <Foglio visibile={foglio === 'gioca'} onChiudi={chiudi}>
        <CartaVetro raggio={30} style={{ margin: 8 }}>
          <SafeAreaView edges={['bottom']}>
            <View className="gap-4 p-6">
              <View className="gap-1">
                <Text className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t.giochi[GIOCHI[scelto].codice]}
                </Text>
                <Text className="font-serif-bold text-2xl text-foreground">
                  {t.hubGiochi.modoTitolo}
                </Text>
              </View>
<Scelta
                titolo={t.hubGiochi.ufficiale}
                nota={t.hubGiochi.ufficialeNota}
                modo="ufficiale"
                // ⚠️ Solo due giochi su quattro hanno una partita dietro. Gli
                // altri due restano toccabili e **dicono** che manca il sigillo,
                // invece di essere spenti senza spiegazione.
                pronto={PRONTI.includes(GIOCHI[scelto].codice)}
                onPress={() => {
                  const rotta = ROTTE[GIOCHI[scelto].codice];
                  if (!rotta) return;
                  chiudi();
                  router.push(rotta);
                }}
              />
              <Scelta
                titolo={t.hubGiochi.personalizzata}
                nota={t.hubGiochi.personalizzataNota}
                modo="personalizzata"
              />
              {!PRONTI.includes(GIOCHI[scelto].codice) && (
                <Text className="text-center text-xs text-muted-foreground">
                  {t.hubGiochi.inArrivo}
                </Text>
              )}
              <BottoneVetro altezza={46} onPress={chiudi}>
                <Text>{t.hubGiochi.chiudi}</Text>
              </BottoneVetro>
            </View>
          </SafeAreaView>
        </CartaVetro>
      </Foglio>

      {/* --- «Classifica» ---------------------------------------------------- */}
      <Foglio visibile={foglio === 'classifica'} onChiudi={chiudi}>
        <CartaVetro raggio={30} style={{ margin: 8 }}>
          <SafeAreaView edges={['bottom']}>
            <View className="gap-4 p-6">
              <View className="gap-1">
                <Text className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t.giochi[GIOCHI[scelto].codice]}
                </Text>
                <Text className="font-serif-bold text-2xl text-foreground">
                  {t.hubGiochi.classificaTitolo}
                </Text>
              </View>
              {/*
                ⚠️ **C'e' un nodo da sciogliere prima di riempire questa
                schermata di numeri**, e non nasce in questa sessione: History.md
                (P-03, e l'avvertenza su P-04) dice che il punteggio non deve
                diventare *un verdetto che resta sulla relazione*. Una graduatoria
                di partite vinte fra le due persone e' esattamente una classifica
                persistente fra loro. Il conteggio chiesto dall'utente si fa;
                **come** lo si formula — vittorie dell'ultima partita o totale di
                sempre, per gioco o complessivo — e' cio' che separa un gioco da
                una pagella, e va deciso quando le partite esisteranno davvero.
              */}
              {(punteggi.telepatia ?? 0) + (punteggi.indovina_disegno ?? 0) === 0 ? (
                <Text className="text-base text-muted-foreground">
                  {t.hubGiochi.classificaVuota}
                </Text>
              ) : (
                <View className="gap-3">
                  <Punteggio
                    nome={t.gioco.sintonia}
                    valore={punteggi.telepatia ?? 0}
                    nota={t.hubGiochi.notaSintonia}
                  />
                  <Punteggio
                    nome={t.gioco.intesa}
                    valore={punteggi.indovina_disegno ?? 0}
                    nota={t.hubGiochi.notaIntesa}
                  />
                </View>
              )}
              <BottoneVetro altezza={46} onPress={chiudi}>
                <Text>{t.hubGiochi.chiudi}</Text>
              </BottoneVetro>
            </View>
          </SafeAreaView>
        </CartaVetro>
      </Foglio>
    </View>
  );
}

/** I giochi che una partita ce l'hanno davvero, e le loro rotte. */
const ROTTE: Partial<Record<CodiceGioco, '/gioco/disegno' | '/gioco/telepatia'>> = {
  indovina_disegno: '/gioco/disegno',
  telepatia: '/gioco/telepatia',
};
const PRONTI = Object.keys(ROTTE) as CodiceGioco[];

/** Una riga del foglio dei punteggi. */
function Punteggio({ nome, valore, nota }: { nome: string; valore: number; nota: string }) {
  const { c } = useTema();
  return (
    <View className="flex-row items-center gap-4 rounded-3xl border border-border/60 p-4">
      <Text className="font-serif-bold text-4xl" style={{ color: c.accento, minWidth: 56 }}>
        {valore}
      </Text>
      <View className="flex-1">
        <Text className="font-serif text-lg text-foreground">{nome}</Text>
        <Text className="text-sm text-muted-foreground">{nota}</Text>
      </View>
    </View>
  );
}

/**
 * Il puntino sotto il carosello. Si **allunga** invece di cambiare colore: fra
 * tre elementi la posizione si legge meglio da una lunghezza che da una tinta,
 * e resta leggibile anche a chi i colori li distingue male.
 */
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

/**
 * Una delle due sorgenti di domande. Non avvia niente — la partita non esiste
 * ancora — ma **cede sotto il dito** come tutto il resto: un comando che non
 * risponde al tocco si legge come un'app rotta, non come una funzione in arrivo
 * (e' la lezione di `components/ui/premibile.tsx`).
 */
function Scelta({
  titolo,
  nota,
  modo,
  pronto = false,
  onPress,
}: {
  titolo: string;
  nota: string;
  modo: ModoGioco;
  /** C'è davvero una partita dietro? Solo allora il tocco promette qualcosa. */
  pronto?: boolean;
  onPress?: () => void;
}) {
  return (
    <Premibile
      accessibilityLabel={titolo}
      // ⚠️ Il riscontro tattile **solo se accade qualcosa**: il tatto conferma un
      // fatto, e su una riga che non avvia niente prometterebbe una partita.
      aptico={pronto ? 'tocco' : false}
      scala={0.98}
      onPress={pronto ? onPress : () => {}}
    >
      <View
        className="gap-1 rounded-3xl border border-border/60 p-4"
        // `modo` non serve al disegno: sta qui perche' questa riga diventera'
        // l'avvio della partita con quella sorgente, ed e' l'unico punto in cui
        // la scelta e' gia' nelle mani di chi la scrivera'.
        testID={`modo-${modo}`}
      >
        <Text className="font-serif text-lg text-foreground">{titolo}</Text>
        <Text className="text-sm text-muted-foreground">{nota}</Text>
      </View>
    </Premibile>
  );
}
