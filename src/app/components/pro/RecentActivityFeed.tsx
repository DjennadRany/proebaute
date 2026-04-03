import { MessageCircle, Star, CalendarX } from 'lucide-react';
import { AppCard } from '../AppCard';
import { Skeleton } from '../ui/skeleton';

export type ActivityItem = {
  id: string;
  label: string;
  detail: string;
  tone: 'message' | 'review' | 'booking';
  at: string;
};

type RecentActivityFeedProps = {
  items: ActivityItem[];
  loading: boolean;
  error: string | null;
};

function iconFor(tone: ActivityItem['tone']) {
  switch (tone) {
    case 'message':
      return MessageCircle;
    case 'review':
      return Star;
    default:
      return CalendarX;
  }
}

export function RecentActivityFeed({ items, loading, error }: RecentActivityFeedProps) {
  if (loading) {
    return (
      <AppCard tone="elevated" className="rounded-2xl">
        <Skeleton className="mb-4 h-5 w-36" />
        <div className="space-y-2">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </AppCard>
    );
  }

  if (error) {
    return (
      <AppCard tone="elevated" className="rounded-2xl border-destructive/30">
        <p className="text-sm text-destructive">{error}</p>
      </AppCard>
    );
  }

  return (
    <AppCard tone="elevated" className="rounded-2xl">
      <p className="mb-4 text-sm font-semibold text-foreground">Activité récente</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Messages, avis et mouvements de réservation s'afficheront ici.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const Icon = iconFor(item.tone);
            return (
              <li
                key={item.id}
                className="flex gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground">{item.at}</span>
              </li>
            );
          })}
        </ul>
      )}
    </AppCard>
  );
}
