import * as React from 'react';
import { Text as RNText } from 'react-native';
import * as Slot from '@rn-primitives/slot';
import { cn } from '@/lib/utils';

/**
 * Pattern React Native Reusables: il contesto permette a un contenitore
 * (es. Button) di stilizzare il testo dei figli senza prop drilling.
 */
const TextClassContext = React.createContext<string | undefined>(undefined);

function Text({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<typeof RNText> & { asChild?: boolean }) {
  const textClass = React.useContext(TextClassContext);
  const Component = asChild ? Slot.Text : RNText;
  return (
    <Component
      className={cn('text-base text-foreground', textClass, className)}
      {...props}
    />
  );
}

export { Text, TextClassContext };
