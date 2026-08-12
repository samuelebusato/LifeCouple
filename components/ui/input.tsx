import * as React from 'react';
import { TextInput } from 'react-native';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<
  React.ComponentRef<typeof TextInput>,
  React.ComponentProps<typeof TextInput>
>(({ className, ...props }, ref) => {
  return (
    <TextInput
      ref={ref}
      placeholderTextColor="#9a8b7d"
      className={cn(
        'h-14 rounded-xl border border-input bg-card px-4 text-lg text-foreground',
        className
      )}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
