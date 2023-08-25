import { ATLAS_API_BASE_URL } from './_config';

export async function updateAtlasCustomFields(
  atlasId: string,
  ticketId: string,
  customFields: Record<string, any>,
  userHash?: string
): Promise<void> {
  await fetch(
    `${ATLAS_API_BASE_URL}/client-app/ticket/${atlasId}/update_custom_fields`,
    {
      headers: {
        ...(userHash && { 'x-atlas-user-hash': userHash }),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customFields, conversationId: ticketId }),
    }
  );
}
