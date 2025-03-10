import type { TAtlasSupportIdentity } from '.';
import { connectCustomer } from './_connect-customer';
import {
  ConversationStatus,
  loadConversations,
  MessageSide,
  type TConversation,
  type TConversationMessage,
} from './_load-conversations';
import { safeJsonParse } from './_safe-json-parse';
import { updateIdentity } from './_updateIdentity';

const getTextPreview = (text: string) => {
  if (text.length <= 100) return text;
  return text.substring(0, 100) + '...';
};

const getConversationStats = (conversation: TConversation): TConversationStats => {
  const unread =
    conversation.messages?.reduce(
      (accUnread: number, message) =>
        'read' in message &&
        !message.read &&
        [MessageSide.BOT, MessageSide.AGENT].includes(message.side)
          ? accUnread + 1
          : accUnread,
      0
    ) ?? 0;
  return {
    id: conversation.id,
    unread,
    closed: conversation.status === ConversationStatus.CLOSED,
    subject: conversation.subject,
    lastMessage: conversation.lastMessage && {
      read: conversation.lastMessage.read,
      side: conversation.lastMessage.side,
      text: conversation.lastMessage.text,
      preview: getTextPreview(conversation.lastMessage.plainText || ''),
    },
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

  const { atlasId: identityAtlasId, userId } = identity;

  if (!identityAtlasId && !userId) return () => {};

  (identityAtlasId
    ? Promise.resolve(identityAtlasId)
    : userId
    ? updateIdentity({ ...identity, userId, appId }).then(
        (customer) => customer.id
      )
    : Promise.reject(null)
  )
    .then((atlasId) => {
      if (killed) return Promise.reject(null);
      return loadConversations(atlasId, identity.userHash).then(
        (conversations) => [atlasId, conversations] as const
      );
    })
    .then(([atlasId, conversations]) => {
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
        atlasId,
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

            case 'CLIENT_MESSAGE':
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
              const message = safeJsonParse<TConversationMessage>(
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
                  subject: null,
                  lastMessage: {
                    read: false,
                    side: message.side,
                    text: message.text,
                    preview: getTextPreview(message.plainText || ''),
                  },
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
      if (error !== null) onError?.(error);
    });

  return () => {
    killed = true;
    unsubscribe?.();
  };
}

type TConversationStatsLastMessage = {
  read?: boolean;
  side: MessageSide;
  text: string;
  preview?: string;
};

type TConversationStats = {
  id: string;
  unread: number;
  closed: boolean;
  subject: string | null;
  lastMessage?: TConversationStatsLastMessage;
};

export type TAtlasSupportStats = {
  conversations: Array<TConversationStats>;
};

export type TAtlasSupportListener = (stats: TAtlasSupportStats) => void;
