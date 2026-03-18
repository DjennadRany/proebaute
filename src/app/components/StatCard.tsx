import { LucideIcon } from 'lucide-react';
import { AppCard } from './AppCard';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  onClick?: () => void;
}

export function StatCard({ title, value, icon: Icon, description, trend, onClick }: StatCardProps) {
  const Component = onClick ? 'button' : 'div';
  
  return (
    <AppCard
      as={Component as never}
      onClick={onClick}
      tone="elevated"
      className={onClick ? 'cursor-pointer hover:-translate-y-0.5 transition-transform' : ''}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
              trend.isPositive
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-rose-50 text-rose-700'
            }`}
          >
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>

      <div>
        <p className="mb-1 text-sm text-muted-foreground">{title}</p>
        <p className="mb-1 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </AppCard>
  );
}
