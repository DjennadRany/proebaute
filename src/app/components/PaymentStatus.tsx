import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

interface PaymentStatusProps {
  mode: 'loading' | 'success' | 'error';
  errorMessage?: string;
  onRetry?: () => void;
  onViewReservation?: () => void;
  serviceName?: string;
  totalLabel?: string;
  date?: string;
  time?: string;
}

export function PaymentStatus({
  mode,
  errorMessage,
  onRetry,
  onViewReservation,
  serviceName,
  totalLabel,
  date,
  time,
}: PaymentStatusProps) {
  if (mode === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-16 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-accent dark:bg-accent flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary dark:text-primary animate-spin" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">Traitement en cours...</h3>
          <p className="text-sm text-muted-foreground">
            Veuillez ne pas fermer cette page.
          </p>
        </div>
      </div>
    );
  }

  if (mode === 'success') {
    return (
      <div className="flex flex-col items-center gap-6 py-12 px-6 text-center">
        {/* Icone animee */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center animate-[scale-in_0.4s_ease-out]">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <div className="absolute inset-0 rounded-full bg-green-200/50 dark:bg-green-800/20 animate-ping" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground">Paiement confirme !</h3>
          <p className="text-sm text-muted-foreground">
            Votre reservation a ete enregistree avec succes.
          </p>
        </div>

        {/* Recap */}
        {(serviceName || totalLabel || date || time) && (
          <div className="w-full rounded-xl border border-green-100 dark:border-green-800/30 bg-green-50/60 dark:bg-green-950/20 p-4 text-left space-y-2">
            {serviceName && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Service</span>
                <span className="font-medium text-foreground">{serviceName}</span>
              </div>
            )}
            {date && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium text-foreground">{date}</span>
              </div>
            )}
            {time && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Heure</span>
                <span className="font-medium text-foreground">{time}</span>
              </div>
            )}
            {totalLabel && (
              <div className="flex justify-between text-sm font-bold border-t border-green-100 dark:border-green-800/30 pt-2 mt-2">
                <span className="text-foreground">Total paye</span>
                <span className="text-green-700 dark:text-green-400">{totalLabel}</span>
              </div>
            )}
          </div>
        )}

        {onViewReservation && (
          <Button
            onClick={onViewReservation}
            className="w-full bg-gradient-to-r from-[#8B6914] to-[#C9A84C] hover:from-[#7A5C12] hover:to-[#B8943E] text-white"
          >
            Voir ma reservation
          </Button>
        )}

        <p className="text-xs text-muted-foreground">
          Vous allez etre redirige automatiquement...
        </p>
      </div>
    );
  }

  // mode === 'error'
  return (
    <div className="flex flex-col items-center gap-6 py-12 px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-bold text-foreground">Paiement echoue</h3>
        <p className="text-sm text-muted-foreground">
          {errorMessage || 'Une erreur est survenue lors du traitement de votre paiement.'}
        </p>
      </div>

      {onRetry && (
        <Button
          onClick={onRetry}
          className="w-full bg-gradient-to-r from-[#8B6914] to-[#C9A84C] hover:from-[#7A5C12] hover:to-[#B8943E] text-white"
        >
          Reessayer
        </Button>
      )}
    </div>
  );
}
