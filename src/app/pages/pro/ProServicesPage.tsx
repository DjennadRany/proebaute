import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Plus, Scissors } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  createProService,
  deleteProService,
  fetchProfessionalByUserId,
  fetchServices,
  updateProService,
  type ApiService,
} from '../../api/client';
import { AppHeader } from '../../components/AppHeader';
import { AppCard } from '../../components/AppCard';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { ProManagedServiceCard } from '../../components/pro/ProManagedServiceCard';
import { ProServiceFormDialog, type ProServiceFormValues } from '../../components/pro/ProServiceFormDialog';

export function ProServicesPage() {
  const { user } = useAuth();
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [services, setServices] = useState<ApiService[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingService, setEditingService] = useState<ApiService | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<ApiService | null>(null);

  const reload = useCallback(async () => {
    const pro = await fetchProfessionalByUserId(user._id);
    if (!pro) {
      setProfessionalId(null);
      setServices([]);
      return;
    }
    setProfessionalId(pro._id);
    const list = await fetchServices(pro._id);
    setServices(list);
  }, [user._id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        await reload();
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setLoadError('Impossible de charger vos services.');
          setServices([]);
          setProfessionalId(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const openCreate = () => {
    setFormMode('create');
    setEditingService(null);
    setFormOpen(true);
  };

  const openEdit = (s: ApiService) => {
    setFormMode('edit');
    setEditingService(s);
    setFormOpen(true);
  };

  const handleFormSubmit = async (values: ProServiceFormValues) => {
    if (!professionalId) {
      throw new Error('Fiche professionnelle introuvable. Reconnectez-vous ou exécutez les scripts RLS Supabase.');
    }
    const price = Number(values.price.replace(',', '.'));
    const duration = Number(values.duration);
    const media = values.imageUrl.trim() ? [values.imageUrl.trim()] : [];

    if (formMode === 'create') {
      await createProService({
        professionalId,
        title: values.title,
        description: values.description,
        category: values.category,
        price,
        duration,
        media,
      });
    } else if (editingService) {
      await updateProService(editingService._id, {
        title: values.title,
        description: values.description,
        category: values.category,
        price,
        duration,
        media,
      });
    }
    setBusy(true);
    try {
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const handleDuplicate = async (s: ApiService) => {
    if (!professionalId) return;
    setBusy(true);
    try {
      await createProService({
        professionalId,
        title: `${s.title} (copie)`,
        description: s.description,
        category: s.category,
        price: s.price,
        duration: s.duration,
        media: s.media?.length ? [...s.media] : [],
      });
      await reload();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Duplication impossible (vérifiez les droits RLS sur services).');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await deleteProService(deleteTarget._id);
      await reload();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Suppression impossible (vérifiez les droits RLS sur services).');
    } finally {
      setBusy(false);
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!professionalId) {
    return (
      <div className="mx-auto max-w-2xl">
        <AppHeader
          eyebrow="Catalogue"
          title="Mes services"
          subtitle="Associez d'abord une fiche professionnelle à votre compte."
        />
        <EmptyState
          icon={Scissors}
          title="Fiche pro introuvable"
          description="Sans ligne dans public.professionals, vous ne pouvez pas gérer de services. Vérifiez l'inscription et les scripts RLS."
          action={
            <Button asChild variant="outline">
              <Link to="/login?role=pro">Connexion</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <AppHeader
        eyebrow="Catalogue"
        title="Mes services"
        subtitle="Créez, modifiez ou dupliquez vos prestations. Elles apparaissent dans le catalogue client dès publication."
        action={
          <Button className="gap-2" onClick={openCreate} disabled={busy}>
            <Plus className="h-4 w-4" />
            Ajouter un service
          </Button>
        }
      />

      {loadError && (
        <AppCard tone="elevated" className="mb-6 border-destructive/30 text-sm text-destructive">
          {loadError}
        </AppCard>
      )}

      <AppCard tone="premium" className="mb-6 border-primary/15 bg-primary/[0.04] text-sm text-muted-foreground">
        <p>
          <strong className="text-foreground">Sécurité Supabase :</strong> si création / modification / suppression
          échoue avec une erreur de permission, exécutez{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">scripts/supabase-rls-services.sql</code> dans le SQL
          Editor (en plus du script users/professionals).
        </p>
      </AppCard>

      {services.length === 0 ? (
        <EmptyState
          icon={Scissors}
          title="Aucun service"
          description="Ajoutez votre première prestation : titre, prix, durée et description aident les clientes à réserver en confiance."
          action={
            <Button onClick={openCreate} disabled={busy} className="gap-2">
              <Plus className="h-4 w-4" />
              Créer un service
            </Button>
          }
        />
      ) : (
        <ul className="space-y-4">
          {services.map((s) => (
            <li key={s._id}>
              <ProManagedServiceCard
                service={s}
                busy={busy}
                onEdit={openEdit}
                onDuplicate={handleDuplicate}
                onDelete={setDeleteTarget}
              />
            </li>
          ))}
        </ul>
      )}

      <ProServiceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        service={editingService}
        professionalId={professionalId}
        onSubmit={handleFormSubmit}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce service ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? (
                <>
                  « {deleteTarget.title} » sera retiré du catalogue. Les réservations passées ne sont pas annulées
                  automatiquement.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
