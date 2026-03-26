import { Copy, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import type { ApiService } from '../../api/client';
import { AppCard } from '../AppCard';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ImageWithFallback } from '../figma/ImageWithFallback';

type ProManagedServiceCardProps = {
  service: ApiService;
  onEdit: (service: ApiService) => void;
  onDuplicate: (service: ApiService) => void;
  onDelete: (service: ApiService) => void;
  busy?: boolean;
};

export function ProManagedServiceCard({
  service,
  onEdit,
  onDuplicate,
  onDelete,
  busy,
}: ProManagedServiceCardProps) {
  const img =
    service.media?.[0] && !service.media[0].includes('via.placeholder.com')
      ? service.media[0]
      : 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800';

  return (
    <AppCard tone="elevated" className="overflow-hidden rounded-2xl p-0">
      <div className="flex flex-col sm:flex-row">
        <div className="relative h-44 w-full shrink-0 sm:h-auto sm:w-48">
          <ImageWithFallback src={img} alt={service.title} className="h-full w-full object-cover" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-4 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{service.category}</Badge>
                <span className="text-xs text-muted-foreground">
                  {service.ratingAverage?.toFixed(1) ?? '—'} ★ · {service.reviewsCount ?? 0} avis
                </span>
              </div>
              <h2 className="text-lg font-semibold text-foreground">{service.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{service.description}</p>
            </div>
            <div className="shrink-0 text-left sm:text-right">
              <p className="text-2xl font-bold text-foreground">{service.price} €</p>
              <p className="text-sm text-muted-foreground">{service.duration} min</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
            <Button asChild variant="outline" size="sm" className="gap-1.5" disabled={busy}>
              <Link to={`/services/${service._id}`} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                Fiche publique
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" disabled={busy} onClick={() => onEdit(service)}>
              <Pencil className="h-3.5 w-3.5" />
              Modifier
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" disabled={busy} onClick={() => onDuplicate(service)}>
              <Copy className="h-3.5 w-3.5" />
              Dupliquer
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive hover:bg-destructive/10"
              disabled={busy}
              onClick={() => onDelete(service)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Supprimer
            </Button>
          </div>
        </div>
      </div>
    </AppCard>
  );
}
