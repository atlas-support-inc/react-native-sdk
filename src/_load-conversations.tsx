import { ATLAS_API_BASE_URL } from './_config';

export function loadConversations(
  atlasId: string,
  userHash?: string
): Promise<TConversation[]> {
  return fetch(
    `${ATLAS_API_BASE_URL}/client-app/conversations/${atlasId}`,
    userHash ? { headers: { 'x-atlas-user-hash': userHash } } : undefined
  ).then((response) => {
    if (response.status >= 200 && response.status < 300) {
      return response.json().then((json) => json.data);
    }

    return response.text().then((text) => {
      try {
        const body = JSON.parse(text);
        const errorMessage =
          typeof body === 'object' &&
          'detail' in body &&
          typeof body.detail === 'string'
            ? body.detail
            : JSON.stringify(body);
        return Promise.reject(`Stats failed: ${errorMessage}`);
      } catch (err) {}
      return Promise.reject(`Stats failed: HTTP(${response.status}) ${text}`);
    });
  });
}

export enum MessageSide {
  CUSTOMER = 1,
  AGENT = 2,
  BOT = 3,
}

export enum ConversationStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  SNOOZED = 'SNOOZED',
  PENDING = 'PENDING',
}

export type TConversationMessage = {
  conversationId: string;
  read?: boolean;
  side: MessageSide;
  text: string;
};

export type TConversation = {
  id: string;
  status?: ConversationStatus;
  messages: TConversationMessage[];
  lastMessage?: TConversationMessage;
};
