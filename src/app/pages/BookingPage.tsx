import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppCard } from '../components/AppCard';
import { AppHeader } from '../components/AppHeader';
import { BookingSummary } from '../components/BookingSummary';
import { PaymentSummary } from '../components/PaymentSummary';
import { PaymentStatus } from '../components/PaymentStatus';
import {
  ApiProfessional,
  ApiService,
  createBooking,
  fetchAvailableBookingTimeSlots,
  fetchProfessionalById,
  fetchServiceDetails,
} from '../api/client';
import {
  calculateAmounts,
  confirmPayment,
  createPaymentIntent,
} from '../api/stripeApi';
import { Button } from '../components/ui/button';
import { Calendar } from '../components/ui/calendar';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

type BookingStep = 'form' | 'payment' | 'processing' | 'success' | 'error';

function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfToday(): Date {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

export function BookingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { serviceId } = useParams();
  const location = useLocation();
  const search = new URLSearchParams(location.search);
  const professionalIdFromQuery = search.get('professionalId') || undefined;

  const [step, setStep] = useState<BookingStep>('form');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  const [selectedService, setSelectedService] = useState(serviceId || '');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [service, setService] = useState<ApiService | null>(null);
  const [professional, setProfessional] = useState<ApiProfessional | null>(null);
  const [allServices, setAllServices] = useState<ApiService[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (selectedService) {
        try {
          const detail = await fetchServiceDetails(selectedService);
          if (cancelled) return;
          setService(detail.service);
          setProfessional(detail.professional);
          setAllServices([detail.service]);
        } catch (e) {
          console.error('Erreur chargement service pour booking', e);
        }
        return;
      }

      if (professionalIdFromQuery) {
        try {
          const { professional: pro, services } = await fetchProfessionalById(professionalIdFromQuery);
          if (cancelled) return;
          setProfessional(pro);
          setAllServices(services);
          if (services.length > 0) {
            setSelectedService(services[0]!._id);
            setService(services[0]!);
          } else {
            setService(null);
          }
        } catch (e) {
          console.error('Erreur chargement services du professionnel', e);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedService, professionalIdFromQuery]);

  useEffect(() => {
    if (!professional?._id || !service || !selectedDate) {
      setAvailableSlots([]);
      setSlotsError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setSlotsLoading(true);
      setSlotsError(null);
      try {
        const dateStr = toLocalISODate(selectedDate);
        const slots = await fetchAvailableBookingTimeSlots({
          professionalId: professional._id,
          bookingDate: dateStr,
          serviceDurationMinutes: service.duration,
        });
        if (cancelled) return;
        setAvailableSlots(slots);
        setSelectedTime((prev) => (prev && slots.includes(prev) ? prev : ''));
      } catch (e) {
        if (cancelled) return;
        console.error(e);
        setAvailableSlots([]);
        setSlotsError(e instanceof Error ? e.message : 'Impossible de charger les creneaux');
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [professional?._id, service?._id, service?.duration, selectedDate]);

  const formattedSelectedDate = selectedDate
    ? new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(selectedDate)
    : null;

  // Passe a l'etape paiement
  const handleProceedToPayment = () => {
    if (!user) {
      const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
      navigate(`/login?role=client&redirect=${redirect}`);
      return;
    }
    if (!selectedDate || !selectedTime || !service || !professional) return;
    setStep('payment');
  };

  // Lance le flux de paiement complet
  const handleConfirmPayment = async () => {
    if (!user || !selectedDate || !selectedTime || !service || !professional) return;

    const bookingDate = toLocalISODate(selectedDate);
    const amountCents = Math.round(service.price * 100);
    const amounts = calculateAmounts(amountCents);
    // La commission (amounts.platformFeeCents) est utilisee cote backend - pas affichee au client

    setStep('processing');
    setPaymentError(null);

    try {
      // 1. Creer la reservation en base
      const booking = await createBooking({
        clientId: user._id,
        professionalId: professional._id,
        serviceId: service._id,
        bookingDate,
        timeSlot: selectedTime,
        amount: service.price,
      });

      const bookingId: string = (booking as any)?._id ?? 'booking_' + Date.now();
      setCreatedBookingId(bookingId);

      // 2. Creer le PaymentIntent (simulation ou Edge Function en prod)
      const { clientSecret } = await createPaymentIntent({
        bookingId,
        amountCents: amounts.totalCents,
        proId: professional._id,
        clientId: user._id,
        serviceDescription: service.title,
      });

      // 3. Confirmer le paiement
      const result = await confirmPayment(clientSecret);

      if (result.success) {
        setStep('success');
        setTimeout(() => {
          navigate('/reservations', { replace: true });
        }, 3000);
      } else {
        setPaymentError(result.error || 'Le paiement a echoue. Veuillez reessayer.');
        setStep('error');
      }
    } catch (e) {
      console.error('Erreur flux de paiement', e);
      setPaymentError(
        e instanceof Error ? e.message : 'Une erreur inattendue est survenue.'
      );
      setStep('error');
    }
  };

  const handleRetry = () => {
    setPaymentError(null);
    setStep('payment');
  };

  const canProceed = Boolean(selectedService && selectedDate && selectedTime && service && professional);

  // --- Etape traitement ---
  if (step === 'processing') {
    return (
      <div className="max-w-2xl mx-auto">
        <AppCard tone="premium" className="p-0 overflow-hidden">
          <PaymentStatus mode="loading" />
        </AppCard>
      </div>
    );
  }

  // --- Etape succes ---
  if (step === 'success') {
    return (
      <div className="max-w-2xl mx-auto">
        <AppCard tone="premium" className="p-0 overflow-hidden">
          <PaymentStatus
            mode="success"
            serviceName={service?.title}
            totalLabel={service ? `${service.price.toFixed(2).replace('.', ',')} EUR` : undefined}
            date={formattedSelectedDate ?? undefined}
            time={selectedTime || undefined}
            onViewReservation={() => navigate('/reservations', { replace: true })}
          />
        </AppCard>
      </div>
    );
  }

  // --- Etape erreur ---
  if (step === 'error') {
    return (
      <div className="max-w-2xl mx-auto">
        <AppCard tone="premium" className="p-0 overflow-hidden">
          <PaymentStatus
            mode="error"
            errorMessage={paymentError ?? undefined}
            onRetry={handleRetry}
          />
        </AppCard>
      </div>
    );
  }

  // --- Etape paiement ---
  if (step === 'payment' && service && professional && formattedSelectedDate) {
    return (
      <div className="max-w-2xl mx-auto">
        <AppHeader
          eyebrow="Etape 4 sur 4"
          title="Confirmer le paiement"
          subtitle="Verifiez les details de votre reservation avant de payer."
        />
        <PaymentSummary
          serviceName={service.title}
          servicePrice={service.price}
          proName={professional.professionalName}
          date={formattedSelectedDate}
          time={selectedTime}
          isHomeService={false}
          onConfirm={handleConfirmPayment}
          onCancel={() => setStep('form')}
          isLoading={false}
        />
      </div>
    );
  }

  // --- Etape formulaire (defaut) ---
  return (
    <div className="max-w-6xl mx-auto">
      <AppHeader
        eyebrow="Reservation guidee"
        title="Reserver un rendez-vous"
        subtitle="Choisissez la prestation, la date et le creneau qui vous conviennent le mieux."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <AppCard tone="elevated" className="rounded-2xl">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                1
              </span>
              Choisir un service
            </h3>

            {professional || allServices.length > 0 ? (
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectionnez un service" />
                </SelectTrigger>
                <SelectContent>
                  {allServices.map((svc) => (
                    <SelectItem key={svc._id} value={svc._id}>
                      {svc.title} - {svc.price}EUR ({svc.duration}min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">
                Veuillez d&apos;abord selectionner un service depuis la page des services
              </p>
            )}

            {service && (
              <div className="mt-4 rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 className="font-medium text-foreground mb-1">{service.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                    <Badge variant="secondary">{service.category}</Badge>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-xl font-bold text-foreground">{service.price}EUR</div>
                    <div className="text-sm text-muted-foreground">{service.duration} min</div>
                  </div>
                </div>
              </div>
            )}
          </AppCard>

          <AppCard tone="elevated" className="rounded-2xl">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                2
              </span>
              Choisir une date
            </h3>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => {
                  const day = new Date(date);
                  day.setHours(0, 0, 0, 0);
                  return day < startOfToday();
                }}
                className="rounded-md border"
              />
            </div>
          </AppCard>

          <AppCard tone="elevated" className="rounded-2xl">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                3
              </span>
              Choisir un creneau horaire
            </h3>

            {!selectedDate ? (
              <p className="text-sm text-muted-foreground">Selectionnez d&apos;abord une date.</p>
            ) : slotsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Calcul des creneaux disponibles...
              </div>
            ) : slotsError ? (
              <Alert variant="destructive">
                <AlertDescription>{slotsError}</AlertDescription>
              </Alert>
            ) : availableSlots.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun creneau libre ce jour-la pour cette prestation. Choisissez une autre date ou un autre service.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {availableSlots.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={`rounded-lg border px-3 py-3 text-sm font-medium transition-all ${
                      selectedTime === time
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-foreground border-border hover:border-primary hover:bg-accent'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}
          </AppCard>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Politique d&apos;annulation :</strong> Annulation gratuite jusqu&apos;a 48h avant le rendez-vous.
              Au-dela, des frais de 50% du montant seront appliques.
            </AlertDescription>
          </Alert>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <BookingSummary
              title="Recapitulatif"
              serviceName={service?.title ?? null}
              professionalName={professional?.professionalName ?? null}
              location={professional?.location ?? null}
              dateLabel={formattedSelectedDate}
              timeLabel={selectedTime || null}
              durationLabel={service ? `${service.duration} minutes` : null}
              totalLabel={service ? `${service.price}EUR` : null}
            />
            <AppCard tone="dark" className="mt-4 rounded-2xl">
              <p className="text-xs uppercase tracking-[0.18em] text-white/60">Etape 4 - Paiement</p>
              <p className="mt-2 text-sm text-white/80">
                Apres avoir choisi votre service, date et creneau, vous serez invite a confirmer le paiement securise.
              </p>
              {!user ? (
                <p className="mt-3 text-xs text-amber-200/90">
                  Connectez-vous pour finaliser la reservation.
                </p>
              ) : null}
              <Button
                className="mt-5 w-full bg-gradient-to-r from-[#8B6914] to-[#C9A84C] hover:from-[#7A5C12] hover:to-[#B8943E] text-white border-0"
                size="lg"
                disabled={!canProceed || slotsLoading}
                onClick={handleProceedToPayment}
              >
                {user ? 'Continuer vers le paiement' : 'Se connecter pour reserver'}
              </Button>
            </AppCard>
          </div>
        </div>
      </div>
    </div>
  );
}
