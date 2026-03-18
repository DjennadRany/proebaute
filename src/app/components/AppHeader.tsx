import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from './ui/utils';

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  backTo?: string;
  action?: React.ReactNode;
  className?: string;
};

export function AppHeader({
  title,
  subtitle,
  eyebrow,
  backTo,
  action,
  className,
}: AppHeaderProps) {
  return (
    <div className={cn('mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className="min-w-0">
        {backTo && (
          <Link
            to={backTo}
            className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Retour</span>
          </Link>
        )}
        {eyebrow && (
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="w-full sm:w-auto">{action}</div>}
    </div>
  );
}

