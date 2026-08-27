import * as React from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';
import { PillolaEvento } from '@/components/pillola-evento';
import { aspetto } from '@/components/riga-evento';
import { useTema } from '@/lib/tema';
import { stessoGiorno } from '@/lib/date';
import type { Evento } from '@/lib/eventi';
import { lingua, t } from '@/lib/i18n';

/**
 * L'**agenda di un giorno**: la giornata come fascia oraria, con gli impegni
 * messi dove cadono davvero (riferimento: lo shot Exyte, il fotogramma con la
 * colonna delle ore e le carte colorate).
 *
 * Sostituisce l'elenco piatto che c'era prima nella vista "giorni". Un elenco
 * dice *cosa* c'e'; una fascia oraria dice **quando**, e soprattutto dice cosa
 * c'e' **in mezzo** — i buchi liberi del pomeriggio sono un'informazione che
 * un elenco non puo' dare, ed e' la domanda che due persone si fanno davvero
 * guardando un calendario condiviso.
 *
 * ## Le tre cose che non erano ovvie
 *
 * 1. **Cio' che non ha un'ora non sta nella fascia.** Vacanze e "tutto il
 *    giorno" non hanno un punto sull'asse: metterli alle 00:00 sarebbe una
 *    bugia leggibile. Stanno in una striscia sopra la griglia, come su ogni
 *    calendario serio.
 * 2. **Gli impegni sovrapposti si dividono la larghezza.** Senza, due cose
 *    alle 20:00 si coprono a vicenda e una delle due semplicemente non esiste
 *    a schermo. Il calcolo e' per *grappoli*: si dividono la larghezza solo
 *    gli eventi che si toccano davvero, non tutti quelli del giorno.
 * 3. **La riga dell'ora corrente c'e' solo se il giorno e' oggi.** Una riga
 *    rossa su un giorno di marzo dell'anno prossimo non vuol dire niente.
 */

/** Altezza di un'ora. Sotto i ~50 punti due eventi di seguito si toccano. */
const ORA = 58;
/** Larghezza della colonna delle ore, a sinistra. */
const BINARIO = 52;
/** Durata assunta per un impegno senza fine dichiarata (il caso normale). */
const DURATA_PREDEFINITA = 60;

type Posato = {
  e: Evento;
  /** Minuti dall'inizio del giorno. */
  da: number;
  a: number;
  /** Corsia occupata e quante corsie ha il suo grappolo. */
  corsia: number;
  corsie: number;
};

/**
 * Assegna a ogni evento una corsia, per grappoli di eventi che si toccano.
 *
 * Greedy sulla partenza: si prende la prima corsia libera; quando nessun
 * evento del grappolo e' piu' aperto, il grappolo si chiude e tutti i suoi
 * membri prendono lo stesso numero di corsie — cosi' le carte di uno stesso
 * grappolo sono larghe uguali e restano allineate.
 */
function disponi(eventi: Evento[]): Posato[] {
  const grezzi = eventi
    .map((e) => {
      const d = new Date(e.inizio);
      const da = d.getHours() * 60 + d.getMinutes();
      const fine = e.fine ? new Date(e.fine) : null;
      // La fine si usa solo se cade nello stesso giorno: una vacanza non
      // finisce alle 23:59 di oggi, e non passa comunque di qui.
      const a =
        fine && stessoGiorno(fine, d)
          ? fine.getHours() * 60 + fine.getMinutes()
          : da + DURATA_PREDEFINITA;
      return { e, da, a: Math.max(a, da + 20) };
    })
    .sort((x, y) => x.da - y.da || x.a - y.a);

  const fuori: Posato[] = [];
  let grappolo: Posato[] = [];
  /** Fine di ogni corsia aperta nel grappolo corrente. */
  let fini: number[] = [];

  const chiudi = () => {
    const n = Math.max(1, fini.length);
    for (const p of grappolo) fuori.push({ ...p, corsie: n });
    grappolo = [];
    fini = [];
  };

  for (const g of grezzi) {
    // Nessuna corsia ancora aperta oltre questo inizio → grappolo finito.
    if (grappolo.length > 0 && fini.every((f) => f <= g.da)) chiudi();
    let corsia = fini.findIndex((f) => f <= g.da);
    if (corsia === -1) {
      corsia = fini.length;
      fini.push(g.a);
    } else {
      fini[corsia] = g.a;
    }
    grappolo.push({ ...g, corsia, corsie: 1 });
  }
  if (grappolo.length > 0) chiudi();
  return fuori;
}

export function AgendaGiorno({
  giorno,
  eventi,
  onEvento,
  spazioFondo = 0,
}: {
  giorno: Date;
  eventi: Evento[];
  onEvento?: (e: Evento) => void;
  spazioFondo?: number;
}) {
  const { c } = useTema();
  const scorrevole = React.useRef<ScrollView>(null);

  const senzaOra = eventi.filter((e) => e.tutto_il_giorno || e.fine);
  const conOra = eventi.filter((e) => !e.tutto_il_giorno && !e.fine);
  const posati = React.useMemo(() => disponi(conOra), [conOra]);

  const oggi = stessoGiorno(giorno, new Date());
  const [adesso, setAdesso] = React.useState(() => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  });

  // La riga dell'ora si aggiorna da sola: al minuto, non al secondo — muovere
  // una riga di un pixel ogni secondo e' lavoro sprecato che si vede solo come
  // consumo di batteria.
  React.useEffect(() => {
    if (!oggi) return;
    const id = setInterval(() => {
      const n = new Date();
      setAdesso(n.getHours() * 60 + n.getMinutes());
    }, 60_000);
    return () => clearInterval(id);
  }, [oggi]);

  // All'apertura si va dove **succedono le cose**: sul primo impegno del
  // giorno, o sull'ora corrente se e' oggi, o sulle 8 di mattina. Aprire
  // un'agenda a mezzanotte costringe a scorrere ogni volta.
  const primoMinuto = posati.length > 0 ? posati[0].da : oggi ? adesso : 8 * 60;
  const chiavePosizione = `${giorno.toDateString()}|${primoMinuto}`;
  React.useEffect(() => {
    const y = Math.max(0, (primoMinuto / 60) * ORA - ORA);
    scorrevole.current?.scrollTo({ y, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chiavePosizione]);

  return (
    <View style={{ flex: 1 }}>
      {/* --- cio' che non ha un'ora: sopra, fuori dalla fascia -------------- */}
      {senzaOra.length > 0 && (
        <View
          style={{
            paddingHorizontal: 14,
            paddingTop: 8,
            paddingBottom: 10,
            gap: 4,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: c.linea,
          }}
        >
          <Text style={{ fontSize: 10, textTransform: 'uppercase', color: c.tenue, letterSpacing: 0.6 }}>
            {t.calendario.senzaOrario}
          </Text>
          {senzaOra.map((e) => (
            <PillolaEvento
              key={e.id}
              e={e}
              compatta={false}
              onPress={onEvento && (() => onEvento(e))}
            />
          ))}
        </View>
      )}

      <ScrollView
        ref={scorrevole}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spazioFondo }}
      >
        <View style={{ height: 24 * ORA }}>
          {/* --- il reticolo delle ore ---------------------------------- */}
          {Array.from({ length: 24 }, (_, h) => (
            <View
              key={h}
              style={{
                position: 'absolute',
                top: h * ORA,
                left: 0,
                right: 0,
                height: ORA,
                flexDirection: 'row',
              }}
            >
              <Text
                style={{
                  width: BINARIO,
                  textAlign: 'right',
                  paddingRight: 10,
                  marginTop: -7,
                  fontSize: 11,
                  color: c.tenue,
                }}
              >
                {String(h).padStart(2, '0')}:00
              </Text>
              <View
                style={{
                  flex: 1,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: c.linea,
                }}
              />
            </View>
          ))}

          {/* --- gli impegni, dove cadono -------------------------------
              Vivono dentro una corsia-madre larga quanto la fascia: cosi' le
              percentuali delle corsie si risolvono su di lei e non serve
              misurare niente. Con `left`/`right` sul singolo evento le
              frazioni non avrebbero avuto un riferimento. */}
          <View
            pointerEvents="box-none"
            style={{ position: 'absolute', left: BINARIO + 4, right: 12, top: 0, bottom: 0 }}
          >
            {posati.map(({ e, da, a, corsia, corsie }) => {
              const { pastello } = aspetto(e);
              const inizio = new Date(e.inizio);
              return (
                <Pressable
                  key={e.id}
                  onPress={onEvento && (() => onEvento(e))}
                  style={{
                    position: 'absolute',
                    top: (da / 60) * ORA,
                    height: Math.max(30, ((a - da) / 60) * ORA - 3),
                    left: `${(corsia * 100) / corsie}%`,
                    width: `${100 / corsie}%`,
                    paddingRight: 4,
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: pastello.fondo,
                      borderRadius: 14,
                      borderLeftWidth: 3,
                      borderLeftColor: pastello.barra,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      overflow: 'hidden',
                    }}
                  >
                    <Text
                      numberOfLines={2}
                      style={{ fontSize: 13, fontWeight: '700', color: pastello.testo }}
                    >
                      {e.titolo}
                    </Text>
                    <Text style={{ fontSize: 11, color: pastello.testo, opacity: 0.75 }}>
                      {inizio.toLocaleTimeString(lingua, { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* --- adesso ------------------------------------------------- */}
          {oggi && (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: (adesso / 60) * ORA,
                left: BINARIO - 4,
                right: 12,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: c.adesso,
                }}
              />
              <View style={{ flex: 1, height: 1.5, backgroundColor: c.adesso }} />
            </View>
          )}
        </View>
      </ScrollView>

      {eventi.length === 0 && (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: 0, right: 0, top: 20, alignItems: 'center' }}
        >
          <Text style={{ fontSize: 13, color: c.tenue }}>{t.calendario.agendaVuota}</Text>
        </View>
      )}
    </View>
  );
}
