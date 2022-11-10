import type { TAtlasSupportIdentity } from '.';
import { connectCustomer } from './_connect-customer';
import { loadConversations, TConversation } from './_load-conversations';
import { login } from './_login';
import { safeJsonParse } from './_safe-json-parse';

const getConversationStats = (conversation: TConversation) => {
  const unread = conversation.messages.reduce(
    (accUnread: number, message: { read: boolean }) =>
      message.read ? accUnread : accUnread + 1,
    0
  );
  return {
    id: conversation.id,
    unread,
    closed: Boolean(conversation.closed),
  };
};

export function watchAtlasSupportStats(
  appId: string,
  identity: TAtlasSupportIdentity,
  listener: (stats: TAtlasSupportStats) => void,
  onError?: (error: unknown) => void
) {
  let killed = false;
  let unsubscribe: (() => void) | null = null;

  login({ appId, ...identity })
    .then((customer) => {
      if (killed) return Promise.reject(null);
      return loadConversations(customer.id, identity.userHash).then(
        (conversations) => [customer, conversations] as const
      );
    })
    .then(([customer, conversations]) => {
      if (killed) return;

      const stats: TAtlasSupportStats = {
        conversations: conversations.map(getConversationStats),
      };
      listener(stats);

      const updateConversationStats = (conversation: TConversation) => {
        const conversationStats = getConversationStats(conversation);
        const index = stats.conversations.findIndex(
          (c) => c.id === conversation.id
        );
        if (index === -1) {
          stats.conversations.push(conversationStats);
        } else {
          stats.conversations[index] = conversationStats;
        }

        listener(stats);
      };

      unsubscribe = connectCustomer(
        customer,
        (packet: string) => {
          const data = safeJsonParse<{
            packet_type: string;
            payload: Record<string, unknown>;
          }>(packet);
          if (!data) return;

          switch (data.packet_type) {
            case 'CONVERSATION_UPDATED': {
              updateConversationStats(
                data.payload.conversation as TConversation
              );
              break;
            }

            case 'AGENT_MESSAGE':
            case 'BOT_MESSAGE': {
              const conversation = safeJsonParse<TConversation>(
                data.payload.conversation as string
              );
              if (!conversation) return;
              updateConversationStats(conversation);
              break;
            }

            case 'MESSAGE_READ': {
              if (typeof data.payload.conversationId !== 'string') return;
              stats.conversations = stats.conversations.map((c) =>
                c.id === data.payload.conversationId ? { ...c, unread: 0 } : c
              );
              listener(stats);
              break;
            }

            case 'CHATBOT_WIDGET_RESPONSE': {
              const message = safeJsonParse<{ conversationId: string }>(
                data.payload.message as string
              );
              if (!message) return;
              const conversation = stats.conversations.find(
                (c) => c.id === message.conversationId
              );
              if (conversation) {
                conversation.unread++;
              } else {
                stats.conversations.push({
                  id: message.conversationId,
                  unread: 1,
                  closed: false,
                });
              }
              listener(stats);
              break;
            }

            case 'CONVERSATION_HIDDEN': {
              stats.conversations = stats.conversations.filter(
                (c) => c.id !== data.payload.conversationId
              );
              listener(stats);
              break;
            }
          }
        },
        onError
      );
    })
    .catch((error) => {
      if (error === null) return;
      onError?.(error);
    });

  return () => {
    killed = true;
    unsubscribe?.();
  };
}

export type TAtlasSupportStats = {
  conversations: Array<{ id: string; closed: boolean; unread: number }>;
};

export type TAtlasSupportListener = (stats: TAtlasSupportStats) => void;
