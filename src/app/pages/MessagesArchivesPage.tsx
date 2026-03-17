import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Archives</h1>
          <p className="text-muted-foreground">
            Retrouvez ici vos conversations archivées et réactivez-les en un clic.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/messages')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux messages
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
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
            <div className="p-8 text-center text-muted-foreground">
              Aucune conversation archivée.
            </div>
          )}

          {filtered.map((conversation) => (
            <div
              key={conversation._id}
              className="p-4 flex items-center justify-between hover:bg-accent transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-300 to-purple-300 flex items-center justify-center text-sm font-medium text-white flex-shrink-0">
                  {(conversation.otherUserName || '??')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
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
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigate(`/messages?conversationId=${encodeURIComponent(conversation._id)}`)
                  }
                >
                  Ouvrir
                </Button>
                <Button
                  size="sm"
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
      </div>
    </div>
  );
}

