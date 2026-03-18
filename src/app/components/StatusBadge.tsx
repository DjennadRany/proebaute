import { Badge } from './ui/badge';

type StatusBadgeProps = {
  status: string;
  className?: string;
};

const statusMap: Record<
  string,
  { label: string; className: string }
> = {
  pending: {
    label: 'En attente',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  confirmed: {
    label: 'Confirmé',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  completed: {
    label: 'Terminé',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  cancelled: {
    label: 'Annulé',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  declined: {
    label: 'Refusé',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  live: {
    label: 'LIVE',
    className: 'bg-rose-600 text-white border-rose-600',
  },
  online: {
    label: 'En ligne',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  en_route: {
    label: 'En route',
    className: 'bg-sky-50 text-sky-700 border-sky-200',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status.toLowerCase();
  const config = statusMap[normalized] ?? {
    label: status,
    className: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <Badge
      variant="outline"
      className={`${config.className} ${className ?? ''}`.trim()}
    >
      {config.label}
    </Badge>
  );
}

