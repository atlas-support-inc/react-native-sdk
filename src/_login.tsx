import { ATLAS_API_BASE_URL } from './_config';

const url = `${ATLAS_API_BASE_URL}/client-app/company/identify`;

export function login(credentials: TCredentials): Promise<TCustomer> {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      appId: credentials.appId,
      userId: credentials.userId,
      ...(credentials.userHash && { userHash: credentials.userHash }),
      ...(credentials.userName && { name: credentials.userName }),
      ...(credentials.userEmail && { email: credentials.userEmail }),
    }),
  }).then((response) => {
    if (response.status >= 200 && response.status < 300) {
      return response.json();
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
        return Promise.reject(`Login failed: ${errorMessage}`);
      } catch (err) {}
      return Promise.reject(`Login failed: HTTP(${response.status}) ${text}`);
    });
  });
}

export type TCredentials = {
  appId: string;
  userId: string;
  userHash?: string;
  userName?: string;
  userEmail?: string;
};

export type TCustomer = {
  avgTimeToSolve: number;
  company: null;
  companyId: string;
  conversationHistory: Array<{
    conversation_id: string;
    sent_at: string;
    text: string;
  }>;
  convertedCustomerId: string | null;
  createdAt: string;
  email: string;
  externalUserId: string;
  fields: {
    accountName: string | null;
    city: string | null;
    country: string | null;
    department: string | null;
    phone: string | null;
    photo: string | null;
    postalCode: string | null;
    secondaryEmail: string | null;
    street1: string | null;
    street2: string | null;
    title: string | null;
  };
  firstName: string;
  id: string;
  ip: string;
  isVisitor: boolean;
  lastLoginTime: string;
  lastName: string;
  location: string;
  openConversationIds: Array<string>;
  totalConversations: number;
  updatedAt: string;
  customFields: Record<string, any>;
};
