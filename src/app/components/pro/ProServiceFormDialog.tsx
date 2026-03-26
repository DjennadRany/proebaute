import { useEffect, useState } from 'react';
import type { ApiService } from '../../api/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

export type ProServiceFormValues = {
  title: string;
  description: string;
  category: string;
  price: string;
  duration: string;
  imageUrl: string;
};

const emptyValues: ProServiceFormValues = {
  title: '',
  description: '',
  category: '',
  price: '',
  duration: '',
  imageUrl: '',
};

function serviceToValues(s: ApiService): ProServiceFormValues {
  return {
    title: s.title,
    description: s.description,
    category: s.category,
    price: String(s.price),
    duration: String(s.duration),
    imageUrl: s.media?.[0] && !s.media[0].includes('via.placeholder.com') ? s.media[0] : '',
  };
}

type ProServiceFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  service: ApiService | null;
  onSubmit: (values: ProServiceFormValues) => Promise<void>;
};

export function ProServiceFormDialog({
  open,
  onOpenChange,
  mode,
  service,
  onSubmit,
}: ProServiceFormDialogProps) {
  const [values, setValues] = useState<ProServiceFormValues>(emptyValues);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!open) return;
    setLocalError('');
    if (mode === 'edit' && service) {
      setValues(serviceToValues(service));
    } else {
      setValues(emptyValues);
    }
  }, [open, mode, service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (!values.title.trim()) {
      setLocalError('Le titre est obligatoire.');
      return;
    }
    const price = Number(values.price.replace(',', '.'));
    const duration = Number(values.duration);
    if (!Number.isFinite(price) || price < 0) {
      setLocalError('Prix invalide.');
      return;
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      setLocalError('Durée invalide (minutes).');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90dvh,720px)] overflow-y-auto sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{mode === 'create' ? 'Nouveau service' : 'Modifier le service'}</DialogTitle>
            <DialogDescription>
              Ces informations sont visibles sur votre fiche publique et dans les résultats de recherche.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {localError && (
              <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {localError}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="pro-svc-title">Titre</Label>
              <Input
                id="pro-svc-title"
                value={values.title}
                onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
                placeholder="Ex. Coupe femme"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pro-svc-category">Catégorie</Label>
              <Input
                id="pro-svc-category"
                value={values.category}
                onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))}
                placeholder="Ex. Coiffure"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="pro-svc-price">Prix (€)</Label>
                <Input
                  id="pro-svc-price"
                  type="text"
                  inputMode="decimal"
                  value={values.price}
                  onChange={(e) => setValues((v) => ({ ...v, price: e.target.value }))}
                  placeholder="45"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pro-svc-duration">Durée (min)</Label>
                <Input
                  id="pro-svc-duration"
                  type="text"
                  inputMode="numeric"
                  value={values.duration}
                  onChange={(e) => setValues((v) => ({ ...v, duration: e.target.value }))}
                  placeholder="60"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pro-svc-desc">Description</Label>
              <Textarea
                id="pro-svc-desc"
                value={values.description}
                onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
                placeholder="Détaillez la prestation, les produits, le déroulé…"
                rows={4}
                className="resize-y"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pro-svc-img">URL image (optionnel)</Label>
              <Input
                id="pro-svc-img"
                type="url"
                value={values.imageUrl}
                onChange={(e) => setValues((v) => ({ ...v, imageUrl: e.target.value }))}
                placeholder="https://…"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Enregistrement…' : mode === 'create' ? 'Créer' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
