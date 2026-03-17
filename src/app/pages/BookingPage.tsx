import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router';
import { Calendar as CalendarIcon, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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
          window.location.href = '/reservations';
        }, 1500);
      })
      .catch((e) => {
        console.error('Erreur création réservation', e);
      });
  };

  const canBook = selectedService && selectedDate && selectedTime;

  if (bookingConfirmed) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-card rounded-2xl p-12 text-center border border-border">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Réservation confirmée ! 🎉
          </h2>
          <p className="text-muted-foreground mb-6">
            Vous allez être redirigé vers votre tableau de bord...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Réserver un rendez-vous
        </h1>
        <p className="text-muted-foreground">
          Choisissez votre service, date et heure
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Booking Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Selection */}
          <div className="bg-card rounded-xl p-6 border border-border">
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
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-medium text-foreground mb-1">{service.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                    <Badge variant="secondary">{service.category}</Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-foreground">{service.price}€</div>
                    <div className="text-sm text-muted-foreground">{service.duration} min</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Date Selection */}
          <div className="bg-card rounded-xl p-6 border border-border">
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
          </div>

          {/* Time Selection */}
          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                3
              </span>
              Choisir un créneau horaire
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  disabled={!selectedDate}
                  className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all ${
                    selectedTime === time
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-foreground border-border hover:border-primary hover:bg-accent'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

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
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="font-semibold text-foreground mb-4">Récapitulatif</h3>
              
              <div className="space-y-4 mb-6">
                {professional && (
                  <div className="pb-4 border-b border-border">
                    <p className="text-xs text-muted-foreground mb-1">Professionnel</p>
                    <p className="font-medium text-foreground">{professional.professionalName}</p>
                    <p className="text-sm text-muted-foreground">{professional.location}</p>
                  </div>
                )}

                {service && (
                  <div className="pb-4 border-b border-border">
                    <p className="text-xs text-muted-foreground mb-1">Service</p>
                    <p className="font-medium text-foreground">{service.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{service.duration} minutes</span>
                    </div>
                  </div>
                )}

                {selectedDate && (
                  <div className="pb-4 border-b border-border">
                    <p className="text-xs text-muted-foreground mb-1">Date</p>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                      <p className="font-medium text-foreground">
                        {new Intl.DateTimeFormat('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }).format(selectedDate)}
                      </p>
                    </div>
                  </div>
                )}

                {selectedTime && (
                  <div className="pb-4 border-b border-border">
                    <p className="text-xs text-muted-foreground mb-1">Heure</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <p className="font-medium text-foreground">{selectedTime}</p>
                    </div>
                  </div>
                )}

                {service && (
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Prix</span>
                      <span className="text-2xl font-bold text-foreground">{service.price}€</span>
                    </div>
                  </div>
                )}
              </div>

              <Button
                className="w-full"
                size="lg"
                disabled={!canBook}
                onClick={handleBooking}
              >
                Confirmer la réservation
              </Button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
