import * as React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  type ScrollViewProps,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { SPAZIO_BARRA } from '@/components/barra-volante';
import { Text } from '@/components/ui/text';
import { FONDO } from '@/lib/tema';

/**
 * Il fondo di ogni schermata: bianco in alto, rosa appena percettibile in basso.
 *
 * Non e' decorazione. Il vetro **prende quello che ha sotto**: su un colore
 * piatto la sfocatura non ha niente da mescolare e il pannello si legge come
 * grigio sporco. La sfumatura e' cio' che fa esistere il vetro.
 */
export function Fondo() {
  return (
    <LinearGradient
      colors={FONDO}
      locations={[0, 0.5, 1]}
      // Diagonale, come lo sfondo dello screenshot Barbie: azzurro che entra
      // dall'alto a sinistra, rosa che esce in basso a destra.
      start={{ x: 0, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  );
}

/** Schermata piena: fondo sfumato + area sicura. Il contenuto lo dispone chi la usa. */
export function Schermata({
  children,
  style,
  bordi = true,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** A `false` il contenuto arriva fino ai bordi (mappa, galleria a pieno schermo). */
  bordi?: boolean;
}) {
  const Contenitore: any = bordi ? SafeAreaView : View;
  return (
    <View style={{ flex: 1 }}>
      <Fondo />
      <Contenitore style={[{ flex: 1 }, style]}>{children}</Contenitore>
    </View>
  );
}

/**
 * Contenuto scorrevole che **non si fa coprire dalla tastiera**.
 *
 * Tre accorgimenti, e servono tutti:
 * 1. `automaticallyAdjustKeyboardInsets` — iOS aggiunge da solo lo spazio dei
 *    tasti in fondo allo scorrimento, quindi il campo a fuoco resta visibile
 *    anche se sta in fondo alla pagina;
 * 2. `KeyboardAvoidingView` — su Android, dove il punto 1 non esiste;
 * 3. `keyboardShouldPersistTaps="handled"` — senza, il **primo** tocco a
 *    tastiera aperta serve solo a chiuderla e il bottone sotto le dita non
 *    reagisce. E' il difetto che fa sembrare rotto un form che funziona.
 *
 * Lo spazio in fondo tiene conto della barra volante: `SPAZIO_BARRA` sta in un
 * posto solo, cosi' se la barra cambia altezza non restano schermate col
 * fondo tagliato.
 */
export function ScorrevoleSchermata({
  children,
  contentContainerStyle,
  spazioFondo = SPAZIO_BARRA,
  ...resto
}: ScrollViewProps & { children?: React.ReactNode; spazioFondo?: number }) {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      // Su iOS ci pensa gia' `automaticallyAdjustKeyboardInsets`: sommare i due
      // effetti farebbe saltare il contenuto due volte.
      enabled={Platform.OS === 'android'}
    >
      <ScrollView
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[{ paddingBottom: spazioFondo }, contentContainerStyle]}
        {...resto}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/**
 * Titolo di schermata: serif grande, con un sottotitolo tenue.
 * Sta qui e non in ogni schermata perche' un titolo scritto sei volte diventa
 * sei titoli leggermente diversi.
 */
export function TitoloSchermata({
  titolo,
  nota,
  destra,
}: {
  titolo: string;
  nota?: string;
  destra?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-end justify-between px-6 pb-3 pt-2">
      <View className="flex-1">
        <Text className="font-serif-bold text-3xl text-foreground">{titolo}</Text>
        {!!nota && <Text className="pt-0.5 text-xs text-muted-foreground">{nota}</Text>}
      </View>
      {destra}
    </View>
  );
}
