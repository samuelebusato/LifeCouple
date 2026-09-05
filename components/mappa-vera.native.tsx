import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Bookmark, CalendarHeart } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { C } from '@/lib/tema';
import type { Luogo } from '@/lib/luoghi';

/**
 * Un **luogo dei preferiti** con le coordinate del suo posto.
 *
 * Si chiamava `RistoranteSuMappa` finche' in lista ci finivano solo i
 * ristoranti (0012); da 0016 e' qualunque posto, e `genere` — il tipo primario
 * di Google — dice che cosa sia, quindi che pin disegnargli.
 */
export type RistoranteSuMappa = {
  id: string;
  titolo: string;
  lat: number;
  lng: number;
  genere?: string | null;
  /** La riga `luogo` collegata: serve a non disegnare due pin sullo stesso posto. */
  luogoId?: string | null;
};

/**
 * Il componente mappa **solo per il nativo**.
 *
 * Sta in un file `.native.tsx` e non dentro un `if (Platform.OS !== 'web')`
 * perche' Metro risolve gli import **staticamente**: un `require` dentro un
 * ramo mai eseguito finisce lo stesso nel bundle, e `react-native-maps` importa
 * internals di React Native che sul web non esistono — rompendo l'intero
 * bundle, non solo la mappa. Con l'estensione di piattaforma il web non vede
 * mai questo file.
 *
 * ## I pin disegnati da noi (2026-08-27)
 *
 * Prima erano i puntine standard di sistema, distinte solo dal colore. Ora
 * ognuna dice **cosa e'** e **se ci e' successo qualcosa**: un posto con eventi
 * porta il numero addosso, uno senza resta vuoto. E' la richiesta dell'utente —
 * "i luoghi associati a un evento pinnati" — e cambia il lavoro della mappa: da
 * elenco di coordinate a mappa di cose accadute.
 *
 * ## Niente tocco lungo (2026-08-27)
 *
 * La mappa **non aggiunge piu' un posto** quando ci si tiene premuto sopra.
 * Era un gesto invisibile — l'unico modo di scoprirlo era il cartellino che lo
 * spiegava, cioe' un'istruzione permanente addosso alla mappa per una funzione
 * che nessuno avrebbe indovinato — e per di piu' **collideva col mezzo**: su
 * una mappa il dito ci resta sopra di continuo, per trascinare e per zumare, e
 * un tocco fermo un attimo di troppo apriva un foglio che nessuno aveva
 * chiesto. Restano i due ingressi espliciti: il «+», che aggiunge il punto in
 * cui sei, e la ricerca per nome nell'elenco.
 *
 * ⚠️ **`tracksViewChanges` va spento**, ma non subito. Con i marker disegnati
 * da noi, react-native-maps ridisegna la texture del pin a **ogni fotogramma**
 * finche' e' acceso: con dieci pin la mappa diventa scattosa. Spegnerlo al
 * primo render pero' rischia il pin vuoto, perche' la texture viene presa
 * prima che icone e testo abbiano misurato. Si lascia acceso un attimo e poi si
 * spegne: e' il compromesso noto di questa libreria.
 */

function Pin({
  colore,
  pieno,
  conto,
  children,
}: {
  colore: string;
  /** Pieno = ci e' successo qualcosa; vuoto = segnato e basta. */
  pieno: boolean;
  conto?: number;
  children?: React.ReactNode;
}) {
  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pieno ? colore : '#ffffff',
          borderWidth: 2.5,
          borderColor: pieno ? '#ffffff' : colore,
          shadowColor: 'rgba(20,6,12,0.45)',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 5,
          elevation: 5,
        }}
      >
        {children}
      </View>
      {/* La punta: un quadratino ruotato sotto il tondo. Sono tre righe di
          stile invece di un'immagine, e restano nitide a ogni densita'. */}
      <View
        style={{
          width: 9,
          height: 9,
          marginTop: -5,
          transform: [{ rotate: '45deg' }],
          backgroundColor: pieno ? colore : '#ffffff',
          borderRightWidth: 2.5,
          borderBottomWidth: 2.5,
          borderColor: pieno ? colore : colore,
        }}
      />
      {!!conto && conto > 1 && (
        <View
          style={{
            position: 'absolute',
            top: -4,
            right: -6,
            minWidth: 18,
            height: 18,
            paddingHorizontal: 4,
            borderRadius: 9,
            backgroundColor: '#ffffff',
            borderWidth: StyleSheet.hairlineWidth * 2,
            borderColor: colore,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: '700', color: colore }}>{conto}</Text>
        </View>
      )}
    </View>
  );
}

export function MappaVera({
  centro,
  luoghi,
  ristoranti = [],
  eventiPerLuogo = {},
  programmatiLuogo = {},
  programmatiRistorante = {},
  eventiPerRistorante = {},
  spazioSotto = 0,
  noi,
  onLuogo,
  onRistorante,
}: {
  centro: { latitude: number; longitude: number };
  luoghi: Luogo[];
  /**
   * Le due posizioni di adesso, quando ci sono entrambe (D-100). `null` sta per
   * «non disponibile», e comprende deliberatamente casi diversi fra loro:
   * condivisione spenta, GPS spento, app chiusa, posizione scaduta. La mappa
   * **non deve saperlo**, perche' se lo sapesse potrebbe dirlo — e la 0031
   * chiede che spegnere sia indistinguibile dal resto.
   */
  noi?: {
    mia: { lat: number; lon: number } | null;
    altro: { lat: number; lon: number } | null;
    distanza: string | null;
  } | null;
  ristoranti?: RistoranteSuMappa[];
  /** Quanti eventi ha ogni posto: decide pin pieno/vuoto e il numerino. */
  eventiPerLuogo?: Record<string, number>;
  /**
   * Chi ha **almeno una serata futura** (D-72). Non si deduce dal conteggio:
   * quel numero comprende anche le serate passate, e un posto dove siete già
   * stati tre volte avrebbe lo stesso conto di uno dove andrete domani.
   */
  programmatiLuogo?: Record<string, boolean>;
  programmatiRistorante?: Record<string, boolean>;
  eventiPerRistorante?: Record<string, number>;
  /** Quanto della mappa e' coperto in basso (barra volante e anteprima): logo
   *  Apple, callout e bussola si spostano sopra, invece di finire sotto. */
  spazioSotto?: number;
  onLuogo: (l: Luogo) => void;
  onRistorante?: (r: RistoranteSuMappa) => void;
}) {
  /**
   * 🔴 **Si riaccende a ogni cambio, non solo si rimanda lo spegnimento**
   * (B-38, 2026-09-01 — difetto riferito: *«su Android appena apro
   * l'applicazione non carica i pin sulla mappa»*).
   *
   * Qui c'era solo il `setTimeout`. La dipendenza sul numero dei luoghi faceva
   * credere che il conto tornasse, ma **rimandare lo spegnimento non è
   * riaccendere**: all'apertura dell'app la mappa monta con zero luoghi — i dati
   * stanno ancora arrivando dal database — i 900 ms scadono sul vuoto, e quando
   * i luoghi arrivano i marker nascono con la cattura **già spenta**. Senza
   * `tracksViewChanges` react-native-maps non prende mai la texture del pin
   * disegnato da noi, e su Android il pin non si disegna affatto.
   *
   * 🔑 **Perché solo su Android, e perché non si è visto prima.** Su iOS la view
   * del marker viene renderizzata comunque, quindi lo stesso identico bug non
   * produce nessun sintomo: il difetto era in questo file dal 2026-08-27 e i
   * giri di verifica lo hanno attraversato tutti senza vederlo, perché sono
   * stati fatti su un iPhone. *Una correzione provata su un solo sistema è
   * provata a metà* — la variante nuova di una classe che questo progetto
   * conosce già bene.
   *
   * ⚠️ Resta il compromesso di sempre: acceso costa un ridisegno per fotogramma,
   * spento troppo presto costa il pin vuoto. Non cambia la cura, cambia che ora
   * la finestra dei 900 ms si apre **quando i pin ci sono davvero**.
   */
  /**
   * ⚠️ **E si riaccende anche quando cambia l'*aspetto* dei pin, non solo il
   * loro numero.** Il conteggio degli eventi e «ha una serata futura» decidono
   * il disegno del pin (pieno/chiaro, calendario/segnalibro, il numerino), ma
   * non spostano `luoghi.length`: segnando come visitato un posto già sulla
   * mappa, su Android sarebbe rimasta la texture vecchia. È lo stesso difetto
   * di sopra travestito da «il pin non si aggiorna» invece che «il pin non c'è».
   *
   * 🔑 **Una firma-stringa e non gli oggetti**: `eventiPerLuogo` &c. sono
   * ricreati dal genitore a ogni render, e metterli fra le dipendenze
   * riaccenderebbe la cattura di continuo — cioè il ridisegno per fotogramma che
   * lo spegnimento esiste per evitare. È la lezione di B-32, applicata prima che
   * faccia danni invece che dopo.
   */
  const firmaPin = React.useMemo(
    () =>
      [
        luoghi.length,
        ristoranti.length,
        Object.values(eventiPerLuogo).reduce((s, n) => s + n, 0),
        Object.values(eventiPerRistorante).reduce((s, n) => s + n, 0),
        Object.values(programmatiLuogo).filter(Boolean).length,
        Object.values(programmatiRistorante).filter(Boolean).length,
      ].join('·'),
    [
      luoghi.length,
      ristoranti.length,
      eventiPerLuogo,
      eventiPerRistorante,
      programmatiLuogo,
      programmatiRistorante,
    ]
  );

  const [traccia, setTraccia] = React.useState(true);
  React.useEffect(() => {
    setTraccia(true);
    const id = setTimeout(() => setTraccia(false), 900);
    return () => clearTimeout(id);
  }, [firmaPin]);

  return (
    <MapView
      style={{ flex: 1 }}
      mapPadding={{ top: 0, left: 0, right: 0, bottom: spazioSotto }}
      initialRegion={{ ...centro, latitudeDelta: 0.5, longitudeDelta: 0.5 }}
      // `region` controllata renderebbe la mappa un pendolo che torna sempre al
      // centro; per "vai al risultato cercato" basta la key sul centro (sotto).
      key={`${centro.latitude.toFixed(4)},${centro.longitude.toFixed(4)}`}
    >
      {/* --- Noi due, e la distanza fra noi (D-100) ---------------------- */}
      {/* ⚠️ Si disegna **solo se ci sono entrambe** le posizioni. Una sola non
          serve a niente qui — dove sono io lo so — e soprattutto una linea che
          parte e non arriva chiederebbe di spiegare perche', cioe' di dire
          qualcosa sull'altro che la 0031 vieta di dire. */}
      {/* I due tondi si disegnano **ognuno per conto suo**: pieno il mio,
          contornato quello dell'altro. La differenza non e' decorativa — su una
          mappa con due puntini uguali la prima domanda che uno si fa e' quale
          sia il proprio.

          ⚠️ **Correzione del 2026-09-05**: prima erano dentro la stessa
          condizione della linea (`mia && altro`), e la conseguenza era che con
          un solo dispositivo attivo **non compariva niente**, nemmeno il
          proprio tondo. Il motivo per cui la linea vuole entrambe le posizioni
          — una linea che parte e non arriva chiede di spiegare perche', cioe'
          di dire qualcosa sull'altro — **non vale per il proprio puntino**, che
          non rivela niente di nessuno. */}
      {noi?.mia && (
        <Marker
          coordinate={{ latitude: noi.mia.lat, longitude: noi.mia.lon }}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
        >
          <View style={stiliNoi.tondoMio} />
        </Marker>
      )}
      {noi?.altro && (
        <Marker
          coordinate={{ latitude: noi.altro.lat, longitude: noi.altro.lon }}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
        >
          <View style={stiliNoi.tondoAltro} />
        </Marker>
      )}

      {/* La linea e la distanza invece **vogliono entrambe** le posizioni. */}
      {noi?.mia && noi?.altro && (
        <>
          <Polyline
            coordinates={[
              { latitude: noi.mia.lat, longitude: noi.mia.lon },
              { latitude: noi.altro.lat, longitude: noi.altro.lon },
            ]}
            strokeColor={C.accento}
            strokeWidth={2.5}
            // Tratteggiata e non piena: una linea continua fra due punti su una
            // mappa si legge come un **percorso** — la strada da fare — mentre
            // qui e' solo un legame fra due posti. Il tratteggio dice "relazione",
            // non "itinerario".
            lineDashPattern={[6, 6]}
          />

          {/* L'etichetta della distanza sta a meta' strada, ed e' un Marker
              senza pin: `anchor` centrato e nessuna immagine, cosi' la scritta
              galleggia sulla linea invece di penzolare da una goccia. */}
          {!!noi.distanza && (
            <Marker
              coordinate={{
                latitude: (noi.mia.lat + noi.altro.lat) / 2,
                longitude: (noi.mia.lon + noi.altro.lon) / 2,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
              pointerEvents="none"
            >
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 999,
                  backgroundColor: '#ffffff',
                  borderWidth: 1,
                  borderColor: C.accento,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: C.accento }}>
                  {noi.distanza}
                </Text>
              </View>
            </Marker>
          )}
        </>
      )}

      {luoghi.map((l) => {
        const n = eventiPerLuogo[l.id] ?? 0;
        const programmato = programmatiLuogo[l.id] === true;
        return (
          <Marker
            key={l.id}
            coordinate={{ latitude: l.lat, longitude: l.lng }}
            tracksViewChanges={traccia}
            // Niente `title`: il callout di sistema aprirebbe una nuvoletta
            // sopra il pin, e sotto c'e' gia' l'anteprima nostra — due cose che
            // dicono la stessa cosa in due modi diversi.
            onPress={() => onLuogo(l)}
          >
            {/*
              ## ⚠️ Tre stati, e l'ordine fra loro è una decisione (D-72)
              1. **visitato** → calendario **bianco** su pin **pieno**: ci siete
                 stati, ed è un fatto compiuto;
              2. **in programma** (una serata **futura**) → calendario **rosa**
                 su pin **chiaro**: c'è, ma non è ancora successo;
              3. **desiderato** → **segnalibro** grigio: messo da parte, senza
                 una data.

              ⚠️ **Colore dell'icona e riempimento del pin non sono due scelte,
              sono una sola.** Un'icona bianca ha bisogno di un fondo pieno e una
              rosa di un fondo chiaro: invertirne una senza l'altra produce
              bianco-su-bianco o rosa-su-rosa, cioè un pin vuoto. Chi cambia
              questi rami deve cambiarli a coppie.

              🔑 E la scala che ne esce si legge da sé: **pieno = è successo**,
              **contornato = non ancora**, **grigio = nemmeno in programma**. Il
              peso visivo segue la certezza del fatto, non la sua urgenza — che
              è la lettura giusta per una mappa che è prima di tutto un
              registro.

              🔑 **`visitato` vince su «in programma»**, quando un posto è
              entrambi (ci tornate). Perché la mappa è prima di tutto il
              registro di dov'è stata la coppia, e «ci siamo stati» è un fatto
              mentre «ci andremo» è un'intenzione. Se un giorno servisse il
              contrario, è l'ordine di questi tre rami a cambiare — non altro.

              ⚠️ E il **segnalibro** non è un `MapPin`: dentro un pin, un'icona
              a forma di pin è una ripetizione che non dice niente. Dice invece
              *messo da parte*, che è esattamente lo stato.
            */}
            <Pin
              colore={l.stato === 'visitato' || programmato ? C.accento : '#8b7480'}
              pieno={l.stato === 'visitato'}
              conto={n}
            >
              {l.stato === 'visitato' ? (
                <CalendarHeart color="#ffffff" size={17} />
              ) : programmato ? (
                <CalendarHeart color={C.accento} size={17} />
              ) : (
                <Bookmark color="#8b7480" size={17} />
              )}
            </Pin>
          </Marker>
        );
      })}

      {/* I luoghi della lista.
          ⚠️ **Un pin solo per tutti** (richiesta dell'utente, 2026-08-27). Per
          qualche ora il colore e l'icona seguivano il genere di Google — ambra
          e posate dove si mangia, magenta e stella altrove. Distingueva, ma
          spezzava la mappa in categorie che nessuno aveva chiesto: quello che
          conta guardando la mappa e' *dove siete stati*, non se in quel posto
          si mangiasse. Il genere resta nel dato, e chi vuole distinguere lo fa
          in lista.
          Cio' che il pin continua a dire e' l'unica cosa che cambia il modo di
          leggerlo: **se li' e' successo qualcosa** — pieno col numero delle
          serate, vuoto se ancora no. */}
      {ristoranti.map((r) => {
        const n = eventiPerRistorante[r.id] ?? 0;
        const programmato = programmatiRistorante[r.id] === true;
        // ⚠️ Un ristorante «visitato» si riconosce dall'avere serate **passate**
        // e nessuna futura: la riga `RistoranteSuMappa` non porta lo `stato`.
        const visitato = n > 0 && !programmato;
        return (
          <Marker
            key={`rist-${r.id}`}
            coordinate={{ latitude: r.lat, longitude: r.lng }}
            tracksViewChanges={traccia}
            onPress={() => onRistorante?.(r)}
          >
            {/* Stessa regola dei luoghi: un ristorante è un luogo, e due
                vocabolari visivi per la stessa cosa sono due cose da imparare
                invece di una. */}
            <Pin
              colore={visitato || programmato ? C.accento : '#8b7480'}
              pieno={visitato}
              conto={n}
            >
              {visitato ? (
                <CalendarHeart color="#ffffff" size={17} />
              ) : programmato ? (
                <CalendarHeart color={C.accento} size={17} />
              ) : (
                <Bookmark color="#8b7480" size={17} />
              )}
            </Pin>
          </Marker>
        );
      })}
    </MapView>
  );
}

/** Sul nativo il componente c'e': la schermata puo' disegnare la mappa. */
export const MAPPA_DISPONIBILE = true;

const stiliNoi = StyleSheet.create({
  tondoMio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.accento,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  tondoAltro: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: C.accento,
  },
});
