import { ATLAS_API_BASE_URL } from './_config';

export function loadConversations(
  atlasId: string,
  userHash: string
): Promise<TConversation[]> {
  return fetch(`${ATLAS_API_BASE_URL}/client-app/conversations/${atlasId}`, {
    headers: { 'x-atlas-user-hash': userHash },
  }).then((response) => {
    if (response.status >= 200 && response.status < 300) {
      return response.json().then((json) => json.data);
    }

    return response.text().then((text) => {
      console.error(`HTTP(${response.status}): ${text}`);
      return Promise.reject(new Error('Stats loading failed'));
    });
  });
}

export type TConversation = {
  id: string;
  closed?: boolean;
  messages: Array<{ read: boolean }>;
};
