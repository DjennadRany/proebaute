import { Lock, MapPin, Calendar, Clock, Scissors } from 'lucide-react';
import { Button } from './ui/button';

interface PaymentSummaryProps {
  serviceName: string;
  servicePrice: number; // en euros (pas en centimes)
  proName: string;
  date: string;
  time: string;
  isHomeService: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function PaymentSummary({
  serviceName,
  servicePrice,
  proName,
  date,
  time,
  isHomeService,
  onConfirm,
  onCancel,
  isLoading,
}: PaymentSummaryProps) {
  const totalEur = servicePrice.toFixed(2).replace('.', ',');

  return (
    <div className="rounded-2xl border border-violet-100 dark:border-violet-900/30 bg-gradient-to-br from-violet-50/60 to-fuchsia-50/40 dark:from-violet-950/20 dark:to-fuchsia-950/10 p-6 space-y-5">
      <h3 className="text-lg font-bold text-foreground">
        Recapitulatif du paiement
      </h3>

      {/* Details de la prestation */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Scissors className="w-4 h-4 mt-0.5 text-violet-500 shrink-0" />
          <div className="flex-1 flex justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-foreground">{serviceName}</p>
              <p className="text-xs text-muted-foreground">avec {proName}</p>
            </div>
            <span className="text-sm font-semibold text-foreground whitespace-nowrap">
              {totalEur} EUR
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-violet-500 shrink-0" />
          <span className="text-sm text-foreground">{date}</span>
        </div>

        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-violet-500 shrink-0" />
          <span className="text-sm text-foreground">{time}</span>
        </div>

        <div className="flex items-center gap-3">
          <MapPin className="w-4 h-4 text-violet-500 shrink-0" />
          <span className="text-sm text-foreground">
            {isHomeService ? 'A votre domicile' : 'En salon'}
          </span>
        </div>
      </div>

      {/* Separateur */}
      <div className="border-t border-violet-100 dark:border-violet-800/30" />

      {/* Recapitulatif financier */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Sous-total</span>
          <span>{totalEur} EUR</span>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            Frais de service{' '}
            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded px-1 py-0.5">
              inclus
            </span>
          </span>
          <span>0,00 EUR</span>
        </div>
        <div className="flex justify-between text-base font-bold text-foreground pt-1">
          <span>Total</span>
          <span className="text-violet-700 dark:text-violet-400">{totalEur} EUR</span>
        </div>
      </div>

      {/* Note securite */}
      <div className="rounded-xl bg-white/70 dark:bg-white/5 border border-violet-100 dark:border-violet-800/20 px-4 py-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Paiement securise par Stripe. Votre carte ne sera debitee qu&apos;apres
          confirmation du professionnel.
        </p>
      </div>

      {/* Badge securite */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Lock className="w-3.5 h-3.5 text-green-500" />
        <span>Paiement 100% securise</span>
      </div>

      {/* Boutons */}
      <div className="space-y-3 pt-1">
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 text-sm transition-all shadow-md hover:shadow-lg"
        >
          {isLoading ? 'Traitement...' : `Confirmer et payer ${totalEur} EUR`}
        </button>

        <Button
          type="button"
          variant="ghost"
          className="w-full text-muted-foreground hover:text-foreground"
          onClick={onCancel}
          disabled={isLoading}
        >
          Annuler
        </Button>
      </div>
    </div>
  );
}
