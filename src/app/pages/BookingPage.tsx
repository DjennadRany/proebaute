import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { Calendar as CalendarIcon, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppCard } from '../components/AppCard';
import { AppHeader } from '../components/AppHeader';
import { BookingSummary } from '../components/BookingSummary';
import { ApiProfessional, ApiService, createBooking, fetchServiceDetails, fetchServices } from '../api/client';
import { Button } from '../components/ui/button';
import { Calendar } from '../components/ui/calendar';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30',
];

export function BookingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { serviceId } = useParams();
  const location = useLocation();
  const search = new URLSearchParams(location.search);
  const professionalIdFromQuery = search.get('professionalId') || undefined;
  const [selectedService, setSelectedService] = useState(serviceId || '');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [service, setService] = useState<ApiService | null>(null);
  const [professional, setProfessional] = useState<ApiProfessional | null>(null);
  const [allServices, setAllServices] = useState<ApiService[]>([]);

  useEffect(() => {
    async function load() {
      // Cas 1 : on a un service précis (depuis une card)
      if (selectedService) {
        try {
          const detail = await fetchServiceDetails(selectedService);
          setService(detail.service);
          setProfessional(detail.professional);
          // Si on connaît le pro, on pourrait plus tard charger tous ses services ici
          setAllServices([detail.service]);
        } catch (e) {
          console.error('Erreur chargement service pour booking', e);
        }
        return;
      }

      // Cas 2 : on vient d'un profil pro sans serviceId => afficher tous ses services
      if (professionalIdFromQuery) {
        try {
          const servicesForPro = await fetchServices(professionalIdFromQuery);
          if (servicesForPro.length > 0) {
            setAllServices(servicesForPro);
            setSelectedService(servicesForPro[0]._id);
            setService(servicesForPro[0]);
          }
        } catch (e) {
          console.error('Erreur chargement services du professionnel', e);
        }
      }
    }
    load();
  }, [selectedService, professionalIdFromQuery]);

  const handleBooking = () => {
    if (!selectedDate || !selectedTime || !service || !professional) return;

    const bookingDate = selectedDate.toISOString().slice(0, 10); // YYYY-MM-DD

    createBooking({
      clientId: user._id,
      professionalId: professional._id,
      serviceId: service._id,
      bookingDate,
      timeSlot: selectedTime,
      amount: service.price,
    })
      .then(() => {
        setBookingConfirmed(true);
        setTimeout(() => {
          navigate('/reservations', { replace: true });
        }, 1500);
      })
      .catch((e) => {
        console.error('Erreur création réservation', e);
      });
  };

  const canBook = selectedService && selectedDate && selectedTime;
  const formattedSelectedDate = selectedDate
    ? new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(selectedDate)
    : null;

  if (bookingConfirmed) {
    return (
      <div className="max-w-2xl mx-auto">
        <AppCard tone="premium" className="items-center p-12 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Réservation confirmée ! 🎉
          </h2>
          <p className="text-muted-foreground mb-6">
            Vous allez être redirigé vers vos réservations...
          </p>
        </AppCard>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <AppHeader
        eyebrow="Réservation guidée"
        title="Réserver un rendez-vous"
        subtitle="Choisissez la prestation, la date et le créneau qui vous conviennent le mieux."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Booking Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Selection */}
          <AppCard tone="elevated" className="rounded-2xl">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                1
              </span>
              Choisir un service
            </h3>
            
            {(professional || allServices.length > 0) ? (
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un service" />
                </SelectTrigger>
                <SelectContent>
                  {allServices.map((svc) => (
                    <SelectItem key={svc._id} value={svc._id}>
                      {svc.title} - {svc.price}€ ({svc.duration}min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">
                Veuillez d'abord sélectionner un service depuis la page des services
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
                    <div className="text-xl font-bold text-foreground">{service.price}€</div>
                    <div className="text-sm text-muted-foreground">{service.duration} min</div>
                  </div>
                </div>
              </div>
            )}
          </AppCard>

          {/* Date Selection */}
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
                disabled={(date) => date < new Date()}
                className="rounded-md border"
              />
            </div>
          </AppCard>

          {/* Time Selection */}
          <AppCard tone="elevated" className="rounded-2xl">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                3
              </span>
              Choisir un créneau horaire
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  disabled={!selectedDate}
                  className={`rounded-lg border px-3 py-3 text-sm font-medium transition-all ${
                    selectedTime === time
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-foreground border-border hover:border-primary hover:bg-accent'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {time}
                </button>
              ))}
            </div>
          </AppCard>

          {/* Cancellation Policy */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Politique d'annulation:</strong> Annulation gratuite jusqu'à 48h avant le rendez-vous.
              Au-delà, des frais de 50% du montant seront appliqués.
            </AlertDescription>
          </Alert>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <BookingSummary
              title="Récapitulatif"
              serviceName={service?.title ?? null}
              professionalName={professional?.professionalName ?? null}
              location={professional?.location ?? null}
              dateLabel={formattedSelectedDate}
              timeLabel={selectedTime || null}
              durationLabel={service ? `${service.duration} minutes` : null}
              totalLabel={service ? `${service.price}€` : null}
            />
            <AppCard tone="dark" className="mt-4 rounded-2xl">
              <p className="text-xs uppercase tracking-[0.18em] text-white/60">Validation</p>
              <p className="mt-2 text-sm text-white/80">
                Vous confirmez votre service, votre horaire et votre professionnel avant validation.
              </p>
              <Button
                className="mt-5 w-full"
                size="lg"
                disabled={!canBook}
                onClick={handleBooking}
              >
                Confirmer la réservation
              </Button>
            </AppCard>

          </div>
        </div>
      </div>
    </div>
  );
}
