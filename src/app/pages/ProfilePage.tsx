import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Mail, Phone, Calendar, Edit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppCard } from '../components/AppCard';
import { AppHeader } from '../components/AppHeader';
import { EmptyState } from '../components/EmptyState';
import { EntityAvatar } from '../components/EntityAvatar';
import { StatusBadge } from '../components/StatusBadge';
import {
  fetchUserProfile,
  fetchBookingsByClient,
  fetchReviewsByClient,
  fetchFavorites,
} from '../api/client';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ phone?: string } | null>(null);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [bookings, setBookings] = useState<Array<{ booking: { _id: string; status: string; bookingDate: string; timeSlot: string; serviceId: string }; service: { title: string } | null }>>([]);
  const [reviews, setReviews] = useState<Array<{ comment: string; rating: number; createdAt: string | null }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [prof, bookingsRes, reviewsRes, favs] = await Promise.all([
          fetchUserProfile(user._id).catch(() => null),
          fetchBookingsByClient(user._id),
          fetchReviewsByClient(user._id),
          fetchFavorites(user._id),
        ]);
        setProfile(prof ?? null);
        setBookingsCount(bookingsRes.length);
        setCompletedCount(bookingsRes.filter((b) => b.booking.status === 'completed').length);
        setReviewsCount(reviewsRes.length);
        setFavoritesCount(favs.length);
        setBookings(bookingsRes);
        setReviews(reviewsRes.map((r) => ({ comment: r.comment, rating: r.rating, createdAt: r.createdAt })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user._id]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-16 text-center text-muted-foreground">
        Chargement du profil...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <AppHeader
        eyebrow="Compte"
        title="Mon profil"
        subtitle="Retrouvez vos informations, votre activité et vos préférences depuis un espace plus clair et plus premium."
      />

      <AppCard tone="premium" className="mb-8 rounded-[32px] bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20">
        <div className="flex flex-col items-start gap-6 sm:flex-row">
          <EntityAvatar name={`${user.firstName} ${user.lastName}`} size="lg" />
          <div className="flex-1">
            <div className="mb-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  {user.firstName} {user.lastName}
                </h2>
                <div className="mb-3">
                  <StatusBadge status="online" className="text-[11px]" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  {(profile?.phone ?? user.phone) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">{profile?.phone ?? user.phone}</span>
                    </div>
                  )}
                </div>
              </div>
              <Button variant="outline" className="w-full sm:w-auto">
                <Edit2 className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            </div>
          </div>
        </div>
      </AppCard>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <AppCard tone="elevated" className="rounded-2xl p-6 text-center">
          <div className="text-3xl font-bold text-foreground mb-1">{bookingsCount}</div>
          <p className="text-sm text-muted-foreground">Réservations</p>
        </AppCard>
        <AppCard tone="elevated" className="rounded-2xl p-6 text-center">
          <div className="text-3xl font-bold text-foreground mb-1">{completedCount}</div>
          <p className="text-sm text-muted-foreground">Terminées</p>
        </AppCard>
        <AppCard tone="elevated" className="rounded-2xl p-6 text-center">
          <div className="text-3xl font-bold text-foreground mb-1">{reviewsCount}</div>
          <p className="text-sm text-muted-foreground">Avis donnés</p>
        </AppCard>
        <AppCard tone="elevated" className="rounded-2xl p-6 text-center">
          <div className="text-3xl font-bold text-foreground mb-1">{favoritesCount}</div>
          <p className="text-sm text-muted-foreground">Favoris</p>
        </AppCard>
      </div>

      <Tabs defaultValue="bookings" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-1 sm:grid-cols-3">
          <TabsTrigger value="bookings">Réservations</TabsTrigger>
          <TabsTrigger value="reviews">Avis</TabsTrigger>
          <TabsTrigger value="info">Informations</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings">
          <AppCard tone="elevated" className="rounded-2xl border border-border overflow-hidden p-0">
            <div className="p-6 border-b border-border">
              <h3 className="font-semibold text-foreground">Historique des réservations</h3>
            </div>
            <div className="divide-y divide-border">
              {bookings.length > 0 ? (
                bookings.map((b) => (
                  <div key={b.booking._id} className="p-6 hover:bg-accent transition-colors">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Badge
                            variant={
                              b.booking.status === 'confirmed'
                                ? 'default'
                                : b.booking.status === 'completed'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {b.booking.status === 'confirmed'
                              ? 'Confirmé'
                              : b.booking.status === 'completed'
                              ? 'Terminé'
                              : b.booking.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(b.booking.bookingDate).toLocaleDateString('fr-FR')} à{' '}
                            {b.booking.timeSlot}
                          </span>
                        </div>
                        <p className="font-medium text-foreground">
                          {b.service?.title ?? 'Service'}
                        </p>
                      </div>
                      <Link to={`/reservations/${b.booking._id}`} className="w-full sm:w-auto">
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                          Voir détails
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6">
                  <EmptyState
                    icon={Calendar}
                    title="Aucune réservation"
                    description="Votre historique de rendez-vous apparaîtra ici dès que vous réserverez un premier service."
                  />
                </div>
              )}
            </div>
          </AppCard>
        </TabsContent>

        <TabsContent value="reviews">
          <AppCard tone="elevated" className="rounded-2xl border border-border overflow-hidden p-0">
            <div className="p-6 border-b border-border">
              <h3 className="font-semibold text-foreground">Mes avis</h3>
            </div>
            <div className="divide-y divide-border">
              {reviews.length > 0 ? (
                reviews.map((r, i) => (
                  <div key={i} className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {Array.from({ length: r.rating }).map((_, j) => (
                              <span key={j} className="text-yellow-400">
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {r.createdAt
                              ? new Date(r.createdAt).toLocaleDateString('fr-FR')
                              : '—'}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{r.comment}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6">
                  <EmptyState
                    icon={Edit2}
                    title="Aucun avis"
                    description="Vos avis clients apparaîtront ici après vos prochaines prestations."
                  />
                </div>
              )}
            </div>
          </AppCard>
        </TabsContent>

        <TabsContent value="info">
          <AppCard tone="elevated" className="rounded-2xl">
            <h3 className="font-semibold text-foreground mb-6">Informations personnelles</h3>
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground mb-1">Email</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              {(profile?.phone ?? user.phone) && (
                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground mb-1">Téléphone</p>
                    <p className="text-sm text-muted-foreground">{profile?.phone ?? user.phone}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground mb-1">Membre depuis</p>
                  <p className="text-sm text-muted-foreground">BeautyHub</p>
                </div>
              </div>
            </div>
          </AppCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
