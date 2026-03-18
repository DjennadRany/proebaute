import * as React from 'react';
import { cn } from './ui/utils';

type AppCardProps = React.ComponentPropsWithoutRef<'div'> & {
  as?: React.ElementType;
  tone?: 'default' | 'elevated' | 'premium' | 'dark';
};

export function AppCard({
  as,
  className,
  tone = 'default',
  ...props
}: AppCardProps) {
  const Component = as ?? 'div';
  const toneClasses =
    tone === 'premium'
      ? 'bg-white/92 backdrop-blur border-white/50 shadow-[0_24px_80px_rgba(17,17,23,0.12)]'
      : tone === 'elevated'
      ? 'bg-card border-border shadow-[0_16px_40px_rgba(17,17,23,0.08)]'
      : tone === 'dark'
      ? 'bg-slate-950 text-white border-white/10 shadow-[0_16px_40px_rgba(2,6,23,0.4)]'
      : 'bg-card border-border shadow-sm';

  return (
    <Component
      className={cn(
        'rounded-[28px] border p-5 sm:p-6',
        toneClasses,
        className,
      )}
      {...props}
    />
  );
}

