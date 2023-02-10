import { ATLAS_WS_BASE_URL } from './_config';
import type { TCustomer } from './_login';

export function connectCustomer(
  customer: TCustomer,
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
    ws = new WebSocket(`${ATLAS_WS_BASE_URL}/ws/CUSTOMER::${customer.id}`);

    ws.onopen = () => {
      reconnectDelay = 1e3;

      if (killed) {
        kill();
        return;
      }

      ws?.send(
        JSON.stringify({
          channel_id: customer.id,
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
