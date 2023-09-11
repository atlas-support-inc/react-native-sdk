import { ATLAS_WS_BASE_URL } from './_config';

export function connectCustomer(
  atlasId: string,
  listener: (message: string) => void,
  onError?: (error: unknown) => void
): () => void {
  let killed = false;
  let ws: WebSocket | null = null;

  const kill = () => {
    killed = true;
    ws?.close();
  };

  let reconnectDelay = 1e3;

  const connect = () => {
    ws = new WebSocket(`${ATLAS_WS_BASE_URL}/ws/CUSTOMER::${atlasId}`);

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
          payload: {},
        })
      );
    };

    ws.onmessage = (event) => {
      if (killed) {
        kill();
        return;
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
