import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { aspetto } from '@/components/riga-evento';
import type { Evento } from '@/lib/eventi';
import { lingua } from '@/lib/i18n';

/**
 * La **pillola** di un evento: il modo in cui un impegno compare dentro una
 * cella di calendario (riferimento: lo shot Exyte).
 *
 * Perche' una pillola e non un pallino — che e' quello che c'era prima: un
 * pallino dice *che c'e' qualcosa*, una pillola dice **cosa**. Su un mese
 * intero e' la differenza fra dover toccare quindici giorni per ricordarsi
 * cosa c'era e leggerlo scorrendo. Il fondo pastello arriva dal tipo
 * dell'evento (`lib/tema.ts`), quindi il colore resta un'informazione, non una
 * decorazione.
 *
 * Il testo va **su una riga sola e troncato**: una pillola che manda a capo
 * fa saltare l'altezza della riga della griglia, e una griglia con righe di
 * altezze diverse non si legge piu' come griglia.
 */
export function PillolaEvento({
  e,
  onPress,
  ora = false,
  compatta = true,
}: {
  e: Evento;
  onPress?: () => void;
  /** Anteporre l'orario al titolo: serve nell'agenda, non nella griglia. */
  ora?: boolean;
  /** Nella griglia del mese si sta stretti; nell'agenda c'e' aria. */
  compatta?: boolean;
}) {
  const { pastello } = aspetto(e);
  const Contenitore: typeof View | typeof Pressable = onPress ? Pressable : View;

  const inizio = new Date(e.inizio);
  const etichetta =
    ora && !e.tutto_il_giorno && !e.fine
      ? `${inizio.toLocaleTimeString(lingua, { hour: '2-digit', minute: '2-digit' })} ${e.titolo}`
      : e.titolo;

  return (
    <Contenitore
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: pastello.fondo,
        borderRadius: compatta ? 6 : 10,
        paddingLeft: compatta ? 5 : 8,
        paddingRight: compatta ? 4 : 8,
        paddingVertical: compatta ? 2 : 5,
        overflow: 'hidden',
      }}
    >
      {/* La barretta satura a sinistra: e' quello che rende leggibile il tipo
          anche quando la pillola e' larga trenta punti e il testo sparisce. */}
      <View
        style={{
          width: 2.5,
          alignSelf: 'stretch',
          minHeight: compatta ? 10 : 14,
          borderRadius: 2,
          backgroundColor: pastello.barra,
          marginRight: compatta ? 4 : 6,
        }}
      />
      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          color: pastello.testo,
          fontSize: compatta ? 10 : 13,
          lineHeight: compatta ? 13 : 17,
          fontWeight: '600',
        }}
      >
        {etichetta}
      </Text>
    </Contenitore>
  );
}
