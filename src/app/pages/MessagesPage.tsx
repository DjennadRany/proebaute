import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Send, Search, Phone, Video, MoreVertical, Archive } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  ApiConversation,
  ApiMessage,
  fetchConversations,
  fetchMessages,
  sendMessage,
  archiveConversation,
  blockConversationUser,
  unblockConversationUser,
  reportConversationUser,
} from '../api/client';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';

export function MessagesPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [otherUserName, setOtherUserName] = useState<string>('Conversation');
  const [otherUserRole, setOtherUserRole] = useState<'client' | 'professional'>('professional');
  const [otherUserPhone, setOtherUserPhone] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  useEffect(() => {
    async function loadConversations() {
      if (!user) {
        // Pas connecté : pas de conversations à charger
        setConversations([]);
        setSelectedConversation(null);
        return;
      }
      try {
        const convs = await fetchConversations(user._id);
        setConversations(convs.filter((c) => !c.archived));
        const fromParam = searchParams.get('conversationId');
        if (fromParam && convs.some((c) => c._id === fromParam)) {
          setSelectedConversation(fromParam);
        } else {
          const visible = convs.filter((c) => !c.archived);
          if (visible.length > 0) {
            setSelectedConversation(visible[0]._id);
          }
        }
      } catch (e) {
        console.error('Erreur chargement conversations', e);
      }
    }
    loadConversations();
  }, [user?._id, searchParams]);

  useEffect(() => {
    async function loadMessages() {
      if (!selectedConversation) return;
      try {
        const msgs = await fetchMessages(selectedConversation);
        setMessages(msgs);
      } catch (e) {
        console.error('Erreur chargement messages', e);
      }
    }
    loadMessages();
  }, [selectedConversation]);
  const activeConversation = conversations.find((c) => c._id === selectedConversation) || null;
  const conversationMessages = messages;

  useEffect(() => {
    if (!activeConversation) {
      setOtherUserName('Conversation');
      setOtherUserRole('professional');
      setOtherUserPhone(null);
      return;
    }
    setOtherUserName(activeConversation.otherUserName ?? 'Conversation');
    setOtherUserRole(activeConversation.otherUserRole ?? 'professional');
    setOtherUserPhone(activeConversation.otherUserPhone ?? null);
  }, [activeConversation?.otherUserId]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation || !activeConversation) return;

    const receiverId =
      activeConversation.participants.find((p) => p !== user._id) ||
      activeConversation.otherUserId;

    sendMessage(selectedConversation, {
      senderId: user._id,
      receiverId,
      content: messageInput.trim(),
    }).then(() => {
      setMessages((prev) => [
        ...prev,
        {
          _id: 'temp',
          conversationId: selectedConversation,
          senderId: user._id,
          receiverId,
          content: messageInput.trim(),
          createdAt: new Date().toISOString(),
          readStatus: false,
        },
      ]);
    }).catch((e) => console.error('Erreur envoi message', e));

    setMessageInput('');
  };

  const formatTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    const ms = typeof dateStr === 'string' && /^\d+$/.test(dateStr) ? Number(dateStr) : NaN;
    const date = !Number.isNaN(ms) ? new Date(ms) : new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    const ms = typeof dateStr === 'string' && /^\d+$/.test(dateStr) ? Number(dateStr) : NaN;
    const date = !Number.isNaN(ms) ? new Date(ms) : new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '—';
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
      }).format(date);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Messages</h1>
          <p className="text-muted-foreground">Communiquez avec vos professionnels</p>
        </div>
        <Link to="/messages/archives" className="w-full sm:w-auto">
          <Button variant="outline" className="gap-2 w-full sm:w-auto">
            <Archive className="w-4 h-4" />
            Voir les archives
          </Button>
        </Link>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden min-h-[70dvh] md:h-[calc(100dvh-16rem)]">
        <div className="grid h-full grid-cols-1 md:grid-cols-12">
          {/* Conversations List */}
          <div className="col-span-12 border-b border-border md:col-span-4 md:border-b-0 md:border-r flex flex-col max-h-[40dvh] md:max-h-none">
            {/* Search */}
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher une conversation..."
                  className="pl-9"
                />
              </div>
            </div>

            {/* Conversation Items */}
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conversation) => (
                <button
                  key={conversation._id}
                  onClick={() => setSelectedConversation(conversation._id)}
                  className={`w-full p-4 border-b border-border hover:bg-accent transition-colors text-left ${
                    selectedConversation === conversation._id ? 'bg-accent' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-300 to-purple-300 flex items-center justify-center text-sm font-medium text-white flex-shrink-0">
                      {(conversation.otherUserName || '??')
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-medium text-foreground truncate">
                          {conversation.otherUserName ||
                            (conversation.otherUserId
                              ? `Conversation #${conversation.otherUserId.slice(-6)}`
                              : 'Conversation')}
                        </h3>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTime(conversation.updatedAt)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">Message</p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="col-span-12 md:col-span-8 flex flex-col min-h-[40dvh]">
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-300 to-purple-300 flex items-center justify-center text-sm font-medium text-white">
                      {(otherUserName || '??')
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {otherUserName}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {otherUserRole === 'professional' ? 'Professionnel' : 'Client'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (!otherUserPhone) {
                          alert("Aucun numéro de téléphone n'est disponible pour ce contact.");
                          return;
                        }
                        window.location.href = `tel:${otherUserPhone}`;
                      }}
                    >
                      <Phone className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const url = `https://meet.jit.si/BeautyHub-${activeConversation.otherUserId ?? ''}`;
                        window.open(url, '_blank', 'noopener,noreferrer');
                      }}
                    >
                      <Video className="w-5 h-5" />
                    </Button>
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowActions((v) => !v)}
                      >
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                      {showActions && activeConversation && (
                        <div className="absolute right-0 mt-2 w-56 max-w-[80vw] bg-popover border border-border rounded-lg shadow-lg text-sm z-20">
                          <button
                            className="w-full text-left px-3 py-2 hover:bg-accent"
                            onClick={async () => {
                              await archiveConversation(activeConversation._id);
                              setConversations((prev) =>
                                prev.filter((c) => c._id !== activeConversation._id)
                              );
                              setSelectedConversation(null);
                              setShowActions(false);
                            }}
                          >
                            Archiver la conversation
                          </button>
                          {activeConversation.blockedBy?.includes(user._id) ? (
                            <button
                              className="w-full text-left px-3 py-2 hover:bg-accent"
                              onClick={async () => {
                                await unblockConversationUser(activeConversation._id, user._id);
                                setConversations((prev) =>
                                  prev.map((c) =>
                                    c._id === activeConversation._id
                                      ? {
                                          ...c,
                                          blockedBy: (c.blockedBy || []).filter((id) => id !== user._id),
                                        }
                                      : c
                                  )
                                );
                                setShowActions(false);
                              }}
                            >
                              Débloquer ce contact
                            </button>
                          ) : (
                            <button
                              className="w-full text-left px-3 py-2 hover:bg-accent"
                              onClick={async () => {
                                await blockConversationUser(activeConversation._id, user._id);
                                setConversations((prev) =>
                                  prev.map((c) =>
                                    c._id === activeConversation._id
                                      ? { ...c, blockedBy: [...(c.blockedBy || []), user._id] }
                                      : c
                                  )
                                );
                                alert('Ce contact est maintenant bloqué pour cette conversation.');
                                setShowActions(false);
                              }}
                            >
                              Bloquer ce contact
                            </button>
                          )}
                          <AlertDialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                            <AlertDialogTrigger asChild>
                              <button
                                className="w-full text-left px-3 py-2 text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  setReportDialogOpen(true);
                                }}
                              >
                                Signaler…
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Signaler cette conversation ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Ce signalement sera transmis à l&apos;équipe de modération. Utilisez cette action
                                  uniquement en cas de comportement inapproprié, abusif ou suspect.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={async () => {
                                    await reportConversationUser(activeConversation._id, user._id);
                                    setReportDialogOpen(false);
                                    setShowActions(false);
                                  }}
                                >
                                  Confirmer le signalement
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                  <div className="flex justify-center">
                    <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      {formatDate(conversationMessages[0]?.createdAt || new Date().toISOString())}
                    </span>
                  </div>

                  {conversationMessages.map((message, index) => {
                    const isOwnMessage = message.senderId === user._id;
                    const showTime =
                      index === 0 ||
                      new Date(message.createdAt).getTime() -
                        new Date(conversationMessages[index - 1].createdAt).getTime() >
                        300000;

                    return (
                      <div
                        key={message._id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] sm:max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                          <div
                            className={`rounded-2xl px-4 py-2.5 ${
                              isOwnMessage
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-foreground'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                          </div>
                          {showTime && (
                            <span className="text-xs text-muted-foreground px-2">
                              {formatTime(message.createdAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-border">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                      type="text"
                      placeholder="Écrire un message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage} disabled={!messageInput.trim()} className="w-full sm:w-auto">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Sélectionnez une conversation
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Choisissez une conversation pour commencer à discuter
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
