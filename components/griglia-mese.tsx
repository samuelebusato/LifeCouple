import * as React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';
import { PillolaEvento } from '@/components/pillola-evento';
import { useTema } from '@/lib/tema';
import { stessoGiorno, stessoMese } from '@/lib/date';
import type { Evento } from '@/lib/eventi';
import { t } from '@/lib/i18n';

/**
 * La griglia del mese (riferimento: lo shot Exyte).
 *
 * **Cosa cambia rispetto a prima**: le celle non mostrano piu' tre pallini
 * colorati ma le **pillole** con il titolo, e la griglia occupa tutta
 * l'altezza disponibile invece di stare stretta sopra a un elenco che ripeteva
 * le stesse informazioni. Un mese si legge scorrendolo con gli occhi; l'elenco
 * sotto costringeva a toccare un giorno per volta per sapere cosa c'era.
 *
 * ## Le righe si misurano, non si indovinano
 *
 * Quante pillole ci stanno in una cella dipende da quanto e' alto lo schermo,
 * che non si sa a priori. La griglia si **misura** (`onLayout`) e da li'
 * ricava l'altezza di riga e quante pillole entrano; se ne avanzano, l'ultima
 * riga diventa "+N". Un numero fisso avrebbe tagliato su un telefono piccolo e
 * lasciato buchi su uno grande.
 *
 * Le separazioni fra le settimane sono **righe sottili**, non spazi: e' cio'
 * che nel riferimento tiene insieme la griglia quando le celle hanno contenuti
 * di altezze diverse.
 */

/** Quanto occupa il numero del giorno in cima alla cella. */
const TESTA = 30;
/** Altezza di una pillola piu' il suo margine. */
const PILLOLA = 17;

export function GrigliaMese({
  griglia,
  mese,
  giorno,
  oggi,
  eventiDi,
  onTocca,
  onEvento,
}: {
  /** Le 42 date da disegnare (6 righe da 7). */
  griglia: Date[];
  /** Il mese di riferimento: serve a sbiadire i giorni che ne stanno fuori. */
  mese: Date;
  giorno: Date;
  oggi: Date;
  eventiDi: (d: Date) => Evento[];
  onTocca: (d: Date) => void;
  onEvento?: (e: Evento) => void;
}) {
  const { c } = useTema();
  const [altezza, setAltezza] = React.useState(0);

  const rigaH = altezza > 0 ? altezza / 6 : 0;
  // `-2` di aria in fondo: senza, l'ultima pillola tocca la riga di
  // separazione e la cella sembra tagliata invece che piena.
  const quante = rigaH > 0 ? Math.max(1, Math.floor((rigaH - TESTA - 2) / PILLOLA)) : 0;

  return (
    <View style={{ flex: 1 }} onLayout={(e) => setAltezza(e.nativeEvent.layout.height)}>
      {Array.from({ length: 6 }, (_, r) => (
        <View
          key={r}
          style={{
            flex: 1,
            flexDirection: 'row',
            borderTopWidth: r === 0 ? 0 : StyleSheet.hairlineWidth,
            borderTopColor: c.linea,
          }}
        >
          {griglia.slice(r * 7, r * 7 + 7).map((d) => {
            const suoi = eventiDi(d);
            const selezionato = stessoGiorno(d, giorno);
            const eOggi = stessoGiorno(d, oggi);
            const fuori = !stessoMese(d, mese);
            const mostrate = suoi.slice(0, quante);
            const avanzo = suoi.length - mostrate.length;

            return (
              <Pressable
                key={d.toISOString()}
                onPress={() => onTocca(d)}
                style={{ flex: 1, minWidth: 0, paddingHorizontal: 2, paddingTop: 3 }}
              >
                <View style={{ height: TESTA - 6, alignItems: 'center', justifyContent: 'center' }}>
                  <View
                    style={{
                      height: 26,
                      minWidth: 26,
                      paddingHorizontal: 4,
                      borderRadius: 13,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: selezionato ? c.accento : 'transparent',
                      borderWidth: !selezionato && eOggi ? 1.5 : 0,
                      borderColor: c.accento,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: selezionato || eOggi ? '700' : '500',
                        color: selezionato
                          ? c.suAccento
                          : fuori
                            ? 'rgba(129,110,123,0.45)'
                            : c.testo,
                      }}
                    >
                      {d.getDate()}
                    </Text>
                  </View>
                </View>

                <View style={{ gap: 2, opacity: fuori ? 0.45 : 1 }}>
                  {mostrate.map((e) => (
                    <PillolaEvento key={e.id} e={e} onPress={onEvento && (() => onEvento(e))} />
                  ))}
                  {avanzo > 0 && (
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: '600',
                        textAlign: 'center',
                        color: c.tenue,
                      }}
                    >
                      {t.calendario.altri(avanzo)}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
