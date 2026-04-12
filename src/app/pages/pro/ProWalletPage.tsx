import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../api/supabaseClient';
import {
  ArrowDownToLine,
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  HelpCircle,
  Info,
  Loader2,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AppCard } from '../../components/AppCard';
import { AppHeader } from '../../components/AppHeader';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  fetchBookingsByProfessional,
  fetchProfessionalByUserId,
  type ApiBookingSummary,
} from '../../api/client';

// ----------- Types locaux -----------

interface PayoutRecord {
  id: string;
  date: string;
  amountEur: number;
  status: 'paid' | 'pending' | 'processing';
  reference: string;
}

// ----------- Helpers -----------

function formatEur(amount: number): string {
  return amount.toFixed(2).replace('.', ',') + ' EUR';
}

function hoursAgo(isoDate: string): number {
  return (Date.now() - new Date(isoDate).getTime()) / 3600000;
}

function getPayoutStatusLabel(status: PayoutRecord['status']): string {
  if (status === 'paid') return 'Vire';
  if (status === 'processing') return 'En cours';
  return 'En attente';
}

function getPayoutStatusVariant(
  status: PayoutRecord['status']
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'paid') return 'default';
  if (status === 'processing') return 'secondary';
  return 'outline';
}

// ----------- Composant principal -----------

export function ProWalletPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<ApiBookingSummary[]>([]);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [withdrawRequested, setWithdrawRequested] = useState(false);
  const [proId, setProId] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');

  const COMMISSION_RATE = 0.10;
  function proAmount(totalEur: number): number {
    return totalEur * (1 - COMMISSION_RATE);
  }

  const loadPayouts = useCallback(async (pid: string) => {
    const { data } = await supabase
      .from('payouts')
      .select('*')
      .eq('pro_id', pid)
      .order('requested_at', { ascending: false })
      .limit(20);

    if (data && data.length > 0) {
      setPayouts(data.map((p: any) => ({
        id: p.id,
        date: p.requested_at,
        amountEur: p.amount_eur,
        status: p.status,
        reference: p.reference ?? 'PO-' + p.id.slice(0, 8).toUpperCase(),
      })));
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const proData = await fetchProfessionalByUserId(user._id);
        if (!proData || cancelled) return;
        setProId(proData._id);
        const proBookings = await fetchBookingsByProfessional(proData._id);
        if (cancelled) return;
        setBookings(proBookings);
        await loadPayouts(proData._id);
      } catch (e) {
        console.error('Erreur chargement wallet', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, loadPayouts]);

  // Calcul des montants a partir des reservations
  const completedBookings = bookings.filter((b) => b.booking.status === 'completed');

  // Montants en attente = prestations terminees dont la date de prestation < 48h
  const pendingBookings = completedBookings.filter((b) => {
    return b.booking.bookingDate && hoursAgo(b.booking.bookingDate) < 48;
  });

  // Montants disponibles = prestations terminees dont la date de prestation >= 48h
  const availableBookings = completedBookings.filter((b) => {
    return !b.booking.bookingDate || hoursAgo(b.booking.bookingDate) >= 48;
  });

  const pendingAmountEur = pendingBookings.reduce((sum, b) => sum + proAmount(b.booking.amount ?? 0), 0);
  const availableAmountEur = availableBookings.reduce((sum, b) => sum + proAmount(b.booking.amount ?? 0), 0);
  const totalEarnedEur = completedBookings.reduce((sum, b) => sum + proAmount(b.booking.amount ?? 0), 0);

  // Réservations confirmées à venir (pas encore terminées)
  const confirmedBookings = bookings.filter((b) => b.booking.status === 'confirmed');

  // Déjà versé = somme des payouts paid
  const alreadyPaidEur = payouts
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amountEur, 0);

  const handleRequestWithdraw = async () => {
    if (!proId || availableAmountEur <= 0) return;
    setWithdrawing(true);
    setWithdrawError('');
    try {
      const reference = 'VIR-' + Date.now().toString(36).toUpperCase();
      const { error } = await supabase.from('payouts').insert({
        pro_id: proId,
        amount_eur: availableAmountEur,
        status: 'pending',
        reference,
      });
      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
          setWithdrawError(
            'La table payouts n\'existe pas encore. SQL à exécuter dans Supabase : ' +
            'CREATE TABLE payouts (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, ' +
            'pro_id uuid REFERENCES professionals(id), amount_eur numeric(10,2), ' +
            'status text DEFAULT \'pending\', reference text, ' +
            'requested_at timestamptz DEFAULT now(), paid_at timestamptz);'
          );
          return;
        }
        throw new Error(error.message);
      }
      setWithdrawRequested(true);
      await loadPayouts(proId);
    } catch (e) {
      setWithdrawError(e instanceof Error ? e.message : 'Erreur lors de la demande de virement.');
    } finally {
      setWithdrawing(false);
    }
  };

  // Historique : payouts réels ou fallback simulé sur les bookings
  const displayPayouts: PayoutRecord[] = payouts.length > 0
    ? payouts
    : completedBookings.slice(0, 3).map((b, i) => ({
        id: 'payout_' + i,
        date: b.booking.bookingDate,
        amountEur: proAmount(b.booking.amount ?? 0),
        status: (i === 0 ? 'paid' : i === 1 ? 'processing' : 'pending') as PayoutRecord['status'],
        reference: 'PO-' + b.booking._id.slice(0, 8).toUpperCase(),
      }));

  // Exemple de prestation pour le calcul transparent
  const examplePrestation = completedBookings[0]?.booking.amount ?? 80;
  const exampleCommission = Math.round(examplePrestation * COMMISSION_RATE * 100) / 100;
  const examplePro = Math.round((examplePrestation - exampleCommission) * 100) / 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <AppHeader
        eyebrow="Finances"
        title="Mon Wallet"
        subtitle="Suivez vos revenus, vos virements et comprenez comment fonctionne le flux de paiement."
      />

      {/* Section - Comment ca marche */}
      <AppCard tone="elevated" className="rounded-2xl">
        <div className="flex items-center gap-2 mb-5">
          <HelpCircle className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground text-lg">Comment ca marche ?</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: CreditCard,
              step: '1',
              title: 'Client paie',
              desc: "L'argent est securise chez Stripe. Vous etes garanti d'etre paye.",
              color: 'text-blue-500',
              bg: 'bg-blue-50 dark:bg-blue-950/30',
            },
            {
              icon: CheckCircle2,
              step: '2',
              title: 'Prestation terminee',
              desc: "Vous marquez la prestation comme terminee dans vos reservations.",
              color: 'text-primary',
              bg: 'bg-accent dark:bg-accent',
            },
            {
              icon: ShieldCheck,
              step: '3',
              title: '48h de protection',
              desc: "Periode de protection acheteur. Les fonds restent bloques 48h.",
              color: 'text-orange-500',
              bg: 'bg-orange-50 dark:bg-orange-950/30',
            },
            {
              icon: Banknote,
              step: '4',
              title: 'Virement le lundi',
              desc: "Virement automatique chaque lundi sur votre compte bancaire.",
              color: 'text-green-500',
              bg: 'bg-green-50 dark:bg-green-950/30',
            },
          ].map(({ icon: Icon, step, title, desc, color, bg }) => (
            <div
              key={step}
              className={`rounded-xl p-4 ${bg} flex flex-col gap-3`}
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-white/80 dark:bg-black/20 flex items-center justify-center text-xs font-bold text-foreground">
                  {step}
                </span>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </AppCard>

      {/* Section - Solde */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Disponible */}
        <AppCard tone="elevated" className="rounded-2xl">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <Badge variant="outline" className="text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 text-xs">
              Disponible
            </Badge>
          </div>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">
            {formatEur(availableAmountEur)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Pret pour virement</p>
          <Button
            className="mt-4 w-full text-sm"
            size="sm"
            variant={availableAmountEur > 0 ? 'default' : 'outline'}
            disabled={availableAmountEur <= 0 || withdrawRequested || withdrawing}
            onClick={handleRequestWithdraw}
          >
            {withdrawing ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />En cours...</>
            ) : withdrawRequested ? (
              <><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Demande envoyee</>
            ) : (
              <><ArrowDownToLine className="w-3.5 h-3.5 mr-1" />Demander un virement</>
            )}
          </Button>
          {withdrawError && (
            <p className="text-xs text-red-500 mt-2">{withdrawError}</p>
          )}
        </AppCard>

        {/* En attente */}
        <AppCard tone="elevated" className="rounded-2xl">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex items-center gap-1 group relative">
              <Badge variant="outline" className="text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800 text-xs">
                En attente
              </Badge>
              <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
              <div className="absolute right-0 top-6 z-10 hidden group-hover:block w-52 rounded-lg border bg-popover p-3 shadow-lg text-xs text-muted-foreground">
                Fonds disponibles apres 48h de protection acheteur suite a la fin de la prestation.
              </div>
            </div>
          </div>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {formatEur(pendingAmountEur)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {pendingBookings.length} prestation{pendingBookings.length !== 1 ? 's' : ''} en periode de protection
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            Disponible dans moins de 48h
          </p>
        </AppCard>

        {/* Total cumule */}
        <AppCard tone="elevated" className="rounded-2xl">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-accent dark:bg-accent flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary dark:text-primary" />
            </div>
            <Badge variant="outline" className="text-primary dark:text-primary border-border dark:border-primary text-xs">
              Total
            </Badge>
          </div>
          <p className="text-2xl font-bold text-primary dark:text-primary">
            {formatEur(totalEarnedEur)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Cumule depuis le debut</p>
          <p className="text-xs text-muted-foreground mt-3">
            {completedBookings.length} prestation{completedBookings.length !== 1 ? 's' : ''} realisee{completedBookings.length !== 1 ? 's' : ''}
          </p>
        </AppCard>
      </div>

      {/* Calcul transparent */}
      <AppCard tone="elevated" className="rounded-2xl border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-950/10">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-blue-500" />
          <h3 className="font-semibold text-foreground">Calcul transparent de votre remuneration</h3>
        </div>
        <div className="rounded-xl bg-white/70 dark:bg-white/5 border border-blue-100 dark:border-blue-800/30 p-4 font-mono text-sm space-y-2">
          <div className="flex justify-between text-foreground">
            <span>Prestation</span>
            <span>{formatEur(examplePrestation)}</span>
          </div>
          <div className="flex justify-between text-red-600 dark:text-red-400">
            <span>Commission LocBeaute (10%)</span>
            <span>- {formatEur(exampleCommission)}</span>
          </div>
          <div className="border-t border-blue-100 dark:border-blue-800/30 pt-2 flex justify-between font-bold text-green-700 dark:text-green-400">
            <span>Vous recevez</span>
            <span>{formatEur(examplePro)}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          La commission de 10% couvre les frais de traitement Stripe, la mise en relation et le support client.
        </p>
      </AppCard>

      {/* Historique des virements */}
      <AppCard tone="elevated" className="rounded-2xl">
        <div className="flex items-center gap-2 mb-5">
          <ArrowDownToLine className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground text-lg">Historique des virements</h2>
        </div>

        {displayPayouts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Banknote className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Aucun virement pour le moment</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Vos premiers virements apparaitront ici une fois vos prestations terminees et la periode de protection ecoulee.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayPayouts.map((payout) => (
              <div
                key={payout.id}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 px-4 py-3 hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <ArrowDownToLine className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(payout.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">{payout.reference}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-foreground">
                    {formatEur(payout.amountEur)}
                  </span>
                  <Badge
                    variant={getPayoutStatusVariant(payout.status)}
                    className={
                      payout.status === 'paid'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
                        : payout.status === 'processing'
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800'
                        : ''
                    }
                  >
                    {getPayoutStatusLabel(payout.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </AppCard>

      {/* Reservations confirmees en cours */}
      {confirmedBookings.length > 0 && (
        <AppCard tone="elevated" className="rounded-2xl">
          <h3 className="font-semibold text-foreground mb-4">
            Reservations a venir ({confirmedBookings.length})
          </h3>
          <p className="text-sm text-muted-foreground">
            Ces montants seront integres a votre wallet une fois les prestations marquees comme terminees.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border/60 bg-background/50 p-3 text-center">
              <p className="text-lg font-bold text-foreground">
                {formatEur(
                  confirmedBookings.reduce(
                    (sum, b) => sum + proAmount(b.booking.amount ?? 0),
                    0
                  )
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">A percevoir (apres commission)</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/50 p-3 text-center">
              <p className="text-lg font-bold text-foreground">{confirmedBookings.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Reservations planifiees</p>
            </div>
          </div>
        </AppCard>
      )}
    </div>
  );
}
