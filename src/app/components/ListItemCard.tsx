import * as React from 'react';
import { AppCard } from './AppCard';
import { cn } from './ui/utils';

type ListItemCardProps = React.ComponentProps<'div'> & {
  actionable?: boolean;
};

export function ListItemCard({
  actionable = false,
  className,
  ...props
}: ListItemCardProps) {
  return (
    <AppCard
      className={cn(
        'gap-4 rounded-2xl p-4 sm:p-5',
        actionable && 'transition-shadow hover:shadow-[0_16px_40px_rgba(17,17,23,0.08)]',
        className,
      )}
      {...props}
    />
  );
}

