import { Calendar, Clock, MapPin } from 'lucide-react';
import { AppCard } from './AppCard';

type BookingSummaryProps = {
  title: string;
  serviceName?: string | null;
  professionalName?: string | null;
  location?: string | null;
  dateLabel?: string | null;
  timeLabel?: string | null;
  durationLabel?: string | null;
  totalLabel?: string | null;
};

export function BookingSummary({
  title,
  serviceName,
  professionalName,
  location,
  dateLabel,
  timeLabel,
  durationLabel,
  totalLabel,
}: BookingSummaryProps) {
  return (
    <AppCard tone="elevated" className="rounded-2xl">
      <p className="text-[11px] uppercase tracking-[0.18em] text-primary">{title}</p>
      <div className="space-y-4">
        {serviceName && (
          <div>
            <p className="text-xs text-muted-foreground">Prestation</p>
            <p className="font-semibold text-foreground">{serviceName}</p>
            {professionalName && (
              <p className="text-sm text-muted-foreground">avec {professionalName}</p>
            )}
          </div>
        )}

        {dateLabel && (
          <div className="flex items-start gap-3 text-sm">
            <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-medium text-foreground">{dateLabel}</p>
            </div>
          </div>
        )}

        {timeLabel && (
          <div className="flex items-start gap-3 text-sm">
            <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Créneau</p>
              <p className="font-medium text-foreground">{timeLabel}</p>
            </div>
          </div>
        )}

        {location && (
          <div className="flex items-start gap-3 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Lieu</p>
              <p className="font-medium text-foreground">{location}</p>
            </div>
          </div>
        )}

        {(durationLabel || totalLabel) && (
          <div className="grid gap-3 sm:grid-cols-2">
            {durationLabel && (
              <div className="rounded-2xl bg-background/80 px-4 py-3">
                <p className="text-xs text-muted-foreground">Durée</p>
                <p className="text-lg font-semibold text-foreground">{durationLabel}</p>
              </div>
            )}
            {totalLabel && (
              <div className="rounded-2xl bg-background/80 px-4 py-3">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-semibold text-foreground">{totalLabel}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppCard>
  );
}

