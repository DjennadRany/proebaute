import { Link } from 'react-router';
import { AlertCircle, Sparkles } from 'lucide-react';
import { AppCard } from '../AppCard';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';

type ProDashboardHeaderProps = {
  firstName: string;
  completionPercent: number;
  showSetupCta: boolean;
};

export function ProDashboardHeader({
  firstName,
  completionPercent,
  showSetupCta,
}: ProDashboardHeaderProps) {
  return (
    <AppCard
      tone="premium"
      className="mb-6 border-primary/15 bg-gradient-to-br from-slate-950/[0.03] via-background to-primary/5"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            Espace professionnel
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Bonjour, {firstName}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Pilotez votre activité : rendez-vous, demandes et messages sont centralisés ici.
          </p>
        </div>

        <div className="w-full max-w-md space-y-3 rounded-2xl border border-border/80 bg-background/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-foreground">Complétion du profil</span>
            <span className="text-sm font-semibold tabular-nums text-primary">{completionPercent}%</span>
          </div>
          <Progress value={completionPercent} className="h-2" />
          {showSetupCta && (
            <div className="flex flex-col gap-2 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2 text-sm text-foreground">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <span>Finalisez votre fiche et vos services pour être visible et recevoir des réservations.</span>
              </div>
              <Button asChild size="sm" className="shrink-0 gap-1.5">
                <Link to="/pro/profile">
                  <Sparkles className="h-4 w-4" />
                  Compléter
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppCard>
  );
}
