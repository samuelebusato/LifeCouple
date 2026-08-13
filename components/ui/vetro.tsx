import * as React from 'react';
import { View, Pressable, StyleSheet, Platform, type ViewStyle, type StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { TextClassContext } from '@/components/ui/text';
import { useTema } from '@/lib/tema';

/**
 * Il vetro liquido: superficie, bottone, carta.
 *
 * **Due strade, scelte a runtime:**
 *
 * 1. **iOS 26+ → Liquid Glass nativo** (`expo-glass-effect`): e' il materiale
 *    vero del sistema — rifrazione, riflessi che seguono il movimento — non
 *    un'imitazione. Quando c'e', si usa quello e basta: sovrapporgli velature
 *    nostre lo ucciderebbe.
 * 2. **Altrove → i tre strati**: sfocatura + velatura sfumata + bordo
 *    luminoso. Il velo e' volutamente leggero: la prima taratura (0.74) copriva
 *    tutto e "non si vedeva nessun effetto" — un vetro che non lascia intuire
 *    cio' che ha sotto e' plastica.
 *
 * Il quarto ingrediente e' fuori di qui ed e' il **fondo**: un vetro sopra una
 * tinta piatta non ha niente da lasciar trasparire. Per questo le schermate
 * usano `Fondo` (lib/tema.ts) invece di `bg-background`.
 */

// La scelta nativo/fallback vive in `vetro-nativo(.native).ts`: file per
// piattaforma, perche' Metro risolve i require staticamente e il pacchetto
// del Liquid Glass sul web non esiste (avrebbe rotto — ha rotto — il bundle).
import { GlassView, VETRO_NATIVO as vetroNativo } from '@/components/ui/vetro-nativo';

type VetroProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Raggio degli angoli: il vetro senza angoli morbidi sembra una lastra rotta. */
  raggio?: number;
  /** Quanto sfoca (solo fallback). Piu' alto = piu' opaco. */
  intensita?: number;
  /** L'ombra stacca il vetro dal fondo. Si toglie quando il vetro e' incassato. */
  ombra?: boolean;
  /** Velatura rosa invece che neutra: per le superfici che devono farsi notare. */
  tinto?: boolean;
};

export function Vetro({
  children,
  style,
  raggio = 32,
  intensita,
  ombra = true,
  tinto = false,
}: VetroProps) {
  const { vetro, scuro, c } = useTema();

  // L'ombra non puo' stare sulla stessa vista che ritaglia (`overflow: hidden`):
  // su iOS verrebbe ritagliata insieme al contenuto. Quindi due viste annidate.
  const stileOmbra = ombra
    ? {
        shadowColor: vetro.ombra,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 1,
        shadowRadius: 24,
        elevation: 12,
      }
    : null;

  if (vetroNativo && GlassView) {
    return (
      <View style={[stileOmbra, { borderRadius: raggio }, style]}>
        {/* width 100% ESPLICITO: GlassView e' una vista nativa e non sempre
            partecipa allo stretch di Yoga — era una delle cause della barra
            con le voci ammassate su un lato. */}
        <GlassView
          style={{ borderRadius: raggio, overflow: 'hidden' as const, width: '100%' as const }}
          glassEffectStyle="regular"
          tintColor={tinto ? (scuro ? 'rgba(232,125,146,0.35)' : 'rgba(214,67,96,0.30)') : undefined}
        >
          {children}
        </GlassView>
      </View>
    );
  }

  return (
    <View style={[stileOmbra, { borderRadius: raggio }, style]}>
      <View style={{ borderRadius: raggio, overflow: 'hidden', width: '100%' }}>
        <BlurView
          intensity={intensita ?? vetro.intensita}
          tint={vetro.tinta}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={
            tinto
              ? scuro
                ? ['rgba(236,121,142,0.30)', 'rgba(236,121,142,0.12)']
                : ['rgba(255,255,255,0.62)', 'rgba(255,214,225,0.48)']
              : (vetro.velo as unknown as [string, string])
          }
          style={StyleSheet.absoluteFill}
        />
        {/* Il riflesso vive solo nella meta' alta: e' luce che cade dall'alto,
            e se coprisse tutto smetterebbe di sembrare luce. */}
        <LinearGradient
          colors={vetro.riflesso as unknown as [string, string]}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '55%' }}
        />
        {children}
        {/* Bordo per ultimo, sopra tutto, e non cliccabile. */}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            { borderRadius: raggio, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: vetro.bordo },
          ]}
        />
      </View>
    </View>
  );
}

/** C'e' il Liquid Glass di sistema? Esposto per chi deve adattare i contrasti. */
export { VETRO_NATIVO } from '@/components/ui/vetro-nativo';

/**
 * Il bottone di vetro.
 *
 * `accento` e' il bottone d'azione: resta vetro, ma tinto di rosa — cosi' si
 * distingue da quelli neutri **senza** diventare un rettangolo pieno. Col
 * vetro nativo tinto il testo passa al bianco: sul materiale colorato di
 * sistema il rosa-su-rosa non regge il contrasto.
 */
export function BottoneVetro({
  children,
  onPress,
  disabled,
  variante = 'neutro',
  raggio = 26,
  style,
  altezza = 54,
}: {
  children?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  variante?: 'neutro' | 'accento' | 'pericolo';
  raggio?: number;
  style?: StyleProp<ViewStyle>;
  altezza?: number;
}) {
  const testo =
    variante === 'accento'
      ? vetroNativo
        ? 'text-base font-semibold text-white'
        : 'text-base font-semibold text-primary'
      : variante === 'pericolo'
        ? 'text-base font-medium text-destructive'
        : 'text-base font-medium text-foreground';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        { opacity: disabled ? 0.45 : pressed ? 0.82 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] },
        style,
      ]}
    >
      <Vetro raggio={raggio} tinto={variante === 'accento'} ombra={!disabled}>
        <TextClassContext.Provider value={testo}>
          <View
            style={{
              height: altezza,
              paddingHorizontal: 22,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
            }}
          >
            {children}
          </View>
        </TextClassContext.Provider>
      </Vetro>
    </Pressable>
  );
}

/** Bottone tondo di vetro: per le azioni che stanno sopra il contenuto. */
export function TondoVetro({
  children,
  onPress,
  disabled,
  lato = 56,
  style,
  tinto = true,
}: {
  children?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  lato?: number;
  style?: StyleProp<ViewStyle>;
  tinto?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        { opacity: disabled ? 0.45 : pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.94 : 1 }] },
        style,
      ]}
    >
      <Vetro raggio={lato / 2} tinto={tinto}>
        <View style={{ width: lato, height: lato, alignItems: 'center', justifyContent: 'center' }}>
          {children}
        </View>
      </Vetro>
    </Pressable>
  );
}

/**
 * La carta di vetro: contenitore per i blocchi di contenuto.
 *
 * Sfoca meno di un bottone: una superficie grande con la stessa sfocatura di
 * un bottone diventa una parete opaca e il fondo sparisce.
 */
export function CartaVetro({
  children,
  style,
  raggio = 30,
  ombra = true,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  raggio?: number;
  ombra?: boolean;
}) {
  return (
    <Vetro raggio={raggio} intensita={Platform.OS === 'ios' ? 34 : 44} ombra={ombra} style={style}>
      {children}
    </Vetro>
  );
}
