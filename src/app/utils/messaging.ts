import { fetchConversations, createConversation, type ApiConversation } from '../api/client';

/**
 * Ouvre ou crée une conversation entre l'utilisateur courant et un autre utilisateur,
 * puis renvoie l'ID de la conversation.
 */
export async function openOrCreateConversation(
  currentUserId: string,
  otherUserId: string
): Promise<string> {
  // 1. Chercher une conversation existante
  let convs: ApiConversation[] = [];
  try {
    convs = await fetchConversations(currentUserId);
  } catch (e) {
    console.error('Erreur fetchConversations', e);
  }

  const existing = convs.find((c) =>
    c.participants.includes(currentUserId) && c.participants.includes(otherUserId)
  );

  if (existing) {
    return existing._id;
  }

  // 2. Sinon créer une nouvelle conversation
  const res = await createConversation({
    userId: currentUserId,
    otherUserId,
  });
  return res.conversationId;
}

