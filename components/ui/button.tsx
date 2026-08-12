import * as React from 'react';
import { Pressable } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'group flex flex-row items-center justify-center rounded-xl active:opacity-90',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        secondary: 'bg-secondary',
        outline: 'border border-border bg-background',
        ghost: '',
        destructive: 'bg-destructive',
      },
      size: {
        default: 'h-12 px-5',
        sm: 'h-9 px-3',
        lg: 'h-14 px-8',
        icon: 'h-12 w-12',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

const buttonTextVariants = cva('text-base font-medium', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      outline: 'text-foreground',
      ghost: 'text-foreground',
      destructive: 'text-destructive-foreground',
    },
    size: { default: '', sm: 'text-sm', lg: 'text-lg', icon: '' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

type ButtonProps = React.ComponentProps<typeof Pressable> &
  VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        className={cn(
          buttonVariants({ variant, size }),
          props.disabled && 'opacity-50',
          className
        )}
        {...props}
      />
    </TextClassContext.Provider>
  );
}

export { Button, buttonVariants, buttonTextVariants };
