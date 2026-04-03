import { useEffect, useMemo, useState } from 'react';
import { Bell, Calendar, MessageCircle, Star } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import {
  fetchBookingsByClient,
  fetchConversations,
  fetchReviewsByClient,
} from '../api/client';
import { AppHeader } from '../components/AppHeader';
import { AppCard } from '../components/AppCard';
import { EmptyState } from '../components/EmptyState';
import { StatusBadge } from '../components/StatusBadge';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  category: 'all' | 'booking' | 'message' | 'review';
  unread: boolean;
  typeLabel?: string;
  href?: string;
  imageSrc?: string | null;
};

const tabs = [
  { id: 'all', label: 'Toutes' },
  { id: 'booking', label: 'Réservations' },
  { id: 'message', label: 'Messages' },
  { id: 'review', label: 'Avis' },
] as const;

export function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<(typeof tabs)[number]['id']>('all');
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;

      try {
        const [bookings, conversations, reviews] = await Promise.all([
          fetchBookingsByClient(user._id).catch(() => []),
          fetchConversations(user._id).catch(() => []),
          fetchReviewsByClient(user._id).catch(() => []),
        ]);

        const bookingItems: NotificationItem[] = bookings.slice(0, 5).map(({ booking, service }) => {
          const primaryMedia = service?.media?.[0];
          const imageSrc = service
            ? primaryMedia && !primaryMedia.includes('via.placeholder.com')
              ? primaryMedia
              : 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800'
            : null;

          return {
            id: `booking-${booking._id}`,
            title:
              booking.status === 'confirmed'
                ? 'Réservation confirmée'
                : booking.status === 'pending'
                ? 'Réservation en attente'
                : 'Mise à jour de réservation',
            body: `${service?.title ?? 'Votre service'} · ${new Date(
              booking.bookingDate,
            ).toLocaleDateString('fr-FR')} à ${booking.timeSlot}`,
            time: booking.bookingDate,
            category: 'booking',
            unread: booking.status === 'pending',
            typeLabel: booking.status,
            href: `/reservations/${booking._id}`,
            imageSrc,
          };
        });

        const messageItems: NotificationItem[] = conversations.slice(0, 5).map((conversation) => ({
          id: `message-${conversation._id}`,
          title: conversation.otherUserName
            ? `Nouveau message de ${conversation.otherUserName}`
            : 'Nouvelle conversation',
          body: conversation.lastMessage || 'Vous avez un nouveau message à consulter.',
          time: conversation.updatedAt ?? new Date().toISOString(),
          category: 'message',
          unread: true,
          href: `/messages?conversationId=${encodeURIComponent(conversation._id)}`,
        }));

        const reviewItems: NotificationItem[] = reviews.slice(0, 5).map((review) => ({
          id: `review-${review._id}`,
          title: 'Merci pour votre avis',
          body: `Votre note ${review.rating}/5 a bien été enregistrée.`,
          time: review.createdAt ?? new Date().toISOString(),
          category: 'review',
          unread: false,
          href: review.serviceId ? `/services/${review.serviceId}#service-comments` : '/reviews',
        }));

        const merged = [...bookingItems, ...messageItems, ...reviewItems].sort(
          (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
        );
        setItems(merged);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

  const filteredItems = useMemo(
    () => (filter === 'all' ? items : items.filter((item) => item.category === filter)),
    [filter, items],
  );

  return (
    <div className="mx-auto max-w-4xl">
      <AppHeader
        eyebrow="Centre d'alertes"
        title="Notifications"
        subtitle="Retrouvez ici vos réservations, messages et confirmations importantes."
      />

      <div className="mb-5 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              filter === tab.id
                ? 'bg-slate-950 text-white'
                : 'bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <AppCard className="text-center text-muted-foreground">Chargement des notifications...</AppCard>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Aucune notification pour le moment"
          description="Les confirmations de réservation, nouveaux messages et rappels importants apparaîtront ici."
        />
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <AppCard
              key={item.id}
              className={`rounded-2xl p-0 overflow-hidden ${
                item.unread ? 'border-primary/25 bg-primary/5' : ''
              } ${item.href ? 'cursor-pointer hover:bg-accent/40 active:scale-[0.99] transition' : ''}`}
              onClick={
                item.href
                  ? () => {
                      navigate(item.href!);
                    }
                  : undefined
              }
            >
              <div className="flex min-h-[92px] items-stretch">
                {item.imageSrc ? (
                  <div className="w-[92px] shrink-0 bg-muted">
                    <ImageWithFallback
                      src={item.imageSrc}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className={`flex w-[92px] shrink-0 items-center justify-center ${
                      item.category === 'booking'
                        ? 'bg-emerald-50 text-emerald-700'
                        : item.category === 'message'
                        ? 'bg-sky-50 text-sky-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {item.category === 'booking' ? (
                      <Calendar className="h-5 w-5" />
                    ) : item.category === 'message' ? (
                      <MessageCircle className="h-5 w-5" />
                    ) : (
                      <Star className="h-5 w-5" />
                    )}
                  </div>
                )}
                <div className="min-w-0 flex-1 p-4 sm:p-5">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{item.title}</p>
                    {item.unread && <StatusBadge status="live" className="text-[10px]" />}
                    {item.typeLabel && <StatusBadge status={item.typeLabel} className="text-[10px]" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{item.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(item.time).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
            </AppCard>
          ))}
        </div>
      )}
    </div>
  );
}

