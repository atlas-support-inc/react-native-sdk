import { ATLAS_API_BASE_URL } from './_config';

const url = `${ATLAS_API_BASE_URL}/client-app/company/identify`;

export function updateIdentity(identity: TIdentityDetails): Promise<TCustomer> {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      appId: identity.appId,
      ...('atlasId' in identity &&
        identity.atlasId && { atlasId: identity.atlasId }),
      ...('userId' in identity &&
        identity.userId && { userId: identity.userId }),
      ...(identity.userHash && { userHash: identity.userHash }),
      ...(identity.userName && { name: identity.userName }),
      ...(identity.userEmail && { email: identity.userEmail }),
      ...(identity.fields && { fields: identity.fields }),
      ...(identity.customFields && { customFields: identity.customFields }),
      ...(identity.account && { account: identity.account }),
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
        return Promise.reject(`Identify call failed: ${errorMessage}`);
      } catch (err) {}
      return Promise.reject(
        `Identify call failed: HTTP(${response.status}) ${text}`
      );
    });
  });
}

type TJsonValue =
  | null
  | string
  | number
  | boolean
  | { [x: string]: TJsonValue }
  | TJsonValue[];

export type TCustomFields = Record<string, TJsonValue>;

export type TCustomerFields = {
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

export type TAccountFields = {
  name: string | null;
  email: string | null;
  website: string | null;
  externalId: string | null;
  monthlySpend: string | null;
  industry: string | null;
  customFields: TCustomFields | null;
};

export type TIdentityDetails = { appId: string } & (
  | { userId: string }
  | { atlasId: string }
) & {
    userHash?: string;
    userName?: string;
    userEmail?: string;
    fields?: Partial<TCustomerFields>;
    customFields?: TCustomFields;
    account?: Partial<TAccountFields>;
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
  fields: TCustomerFields;
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
  customFields: TCustomFields;
};
