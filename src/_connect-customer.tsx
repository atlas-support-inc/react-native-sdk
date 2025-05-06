import { ATLAS_WS_BASE_URL } from './_config';

export function connectCustomer(
  appId: string,
  atlasId: string,
  listener: (message: string) => void,
  userId?: string,
  userHash?: string,
  onError?: (error: unknown) => void
): () => void {
  let killed = false;
  let synced = false;
  let ws: WebSocket | null = null;

  const kill = () => {
    killed = true;
    ws?.close();
  };

  let reconnectDelay = 1e3;

  const connect = () => {
    ws = new WebSocket(`${ATLAS_WS_BASE_URL}/ws/CUSTOMER::${atlasId}/${appId}`);

    ws.onopen = () => {
      reconnectDelay = 1e3;

      if (killed) {
        kill();
        return;
      }

      ws?.send(
        JSON.stringify({
          channel_id: atlasId,
          channel_kind: 'CUSTOMER',
          packet_type: 'SUBSCRIBE',
          payload: {
            ...(userId && { userId }),
            ...(userHash && { userHash }),
          },
        })
      );
    };

    ws.onmessage = (event) => {
      if (killed) {
        kill();
        return;
      }

      if (!synced) {
        synced = true;
        ws?.send(
          JSON.stringify({
            channel_id: atlasId,
            channel_kind: 'CUSTOMER',
            packet_type: 'FETCH_DATA',
            payload: { data: ['conversations'] },
          })
        );
      }

      listener(event.data);
    };

    ws.onclose = () => {
      if (killed) return;

      onError?.('Connection closed');
      setTimeout(connect, reconnectDelay);
      if (reconnectDelay < 120e3) reconnectDelay *= 2;
    };
  };

  connect();

  return kill;
}
