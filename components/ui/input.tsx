import * as React from 'react';
import { TextInput } from 'react-native';
import { cn } from '@/lib/utils';
import { useTema } from '@/lib/tema';

/**
 * Il campo di testo della direzione "Quarzo rosa": bianco su fondo rosato,
 * bordo tenue, angoli ampi come il resto.
 *
 * Il colore del segnaposto arriva da `lib/tema.ts` e non e' piu' scritto a mano:
 * `placeholderTextColor` e' una prop nativa e non accetta una classe, quindi era
 * l'unico colore dell'app rimasto fuori dal sistema — e infatti era ancora
 * quello della vecchia direzione "Diario intimo" (marroncino), che su rosa
 * stonava.
 */
const Input = React.forwardRef<
  React.ComponentRef<typeof TextInput>,
  React.ComponentProps<typeof TextInput>
>(({ className, ...props }, ref) => {
  const { c } = useTema();
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={c.tenue}
      className={cn(
        'h-14 rounded-2xl border border-border bg-card/80 px-4 text-lg text-foreground',
        className
      )}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
