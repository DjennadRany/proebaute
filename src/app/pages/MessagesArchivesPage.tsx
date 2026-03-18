import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppCard } from '../components/AppCard';
import { AppHeader } from '../components/AppHeader';
import { EmptyState } from '../components/EmptyState';
import { EntityAvatar } from '../components/EntityAvatar';
import { ApiConversation, fetchConversations, unarchiveConversation } from '../api/client';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

export function MessagesArchivesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadArchived() {
      try {
        const all = await fetchConversations(user._id);
        setConversations(all.filter((c) => c.archived));
      } catch (e) {
        console.error('Erreur chargement conversations archivées', e);
      }
    }
    loadArchived();
  }, [user._id]);

  const formatTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    const ms = typeof dateStr === 'string' && /^\d+$/.test(dateStr) ? Number(dateStr) : NaN;
    const date = !Number.isNaN(ms) ? new Date(ms) : new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const filtered = conversations.filter((c) => {
    const label =
      c.otherUserName ||
      (c.otherUserId ? `#${c.otherUserId.slice(-6)}` : '') ||
      '';
    const haystack = `${label} ${c.lastMessage}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto">
      <AppHeader
        eyebrow="Messagerie"
        title="Archives"
        subtitle="Retrouvez ici vos conversations archivées et réactivez-les en un clic."
        action={
        <Button variant="outline" className="w-full sm:w-auto" onClick={() => navigate('/messages')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux messages
        </Button>
        }
      />

      <AppCard tone="elevated" className="rounded-[32px] overflow-hidden p-0">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher dans vos archives..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="divide-y divide-border">
          {filtered.length === 0 && (
            <div className="p-6">
              <EmptyState
                icon={Search}
                title="Aucune conversation archivée"
                description="Les conversations que vous archivez apparaîtront ici pour pouvoir être réouvertes plus tard."
              />
            </div>
          )}

          {filtered.map((conversation) => (
            <div
              key={conversation._id}
              className="p-4 flex flex-col gap-4 hover:bg-accent transition-colors sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3 min-w-0">
                <EntityAvatar name={conversation.otherUserName || 'Conversation'} size="sm" />
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-foreground">
                      {conversation.otherUserName ||
                        (conversation.otherUserId
                          ? `Conversation #${conversation.otherUserId.slice(-6)}`
                          : 'Conversation')}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(conversation.updatedAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {conversation.lastMessage || 'Aucun message'}
                  </p>
                </div>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() =>
                    navigate(`/messages?conversationId=${encodeURIComponent(conversation._id)}`)
                  }
                >
                  Ouvrir
                </Button>
                <Button
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={async () => {
                    await unarchiveConversation(conversation._id);
                    setConversations((prev) =>
                      prev.filter((c) => c._id !== conversation._id)
                    );
                  }}
                >
                  Désarchiver
                </Button>
              </div>
            </div>
          ))}
        </div>
      </AppCard>
    </div>
  );
}

