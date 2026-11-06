import { API_BASE_URL, toWsBase } from '../../config';

export interface ConnectionHandlers {
  onOpen: () => void;
  onMessage: (data: unknown) => void;
  onClose: (code: number) => void;
}

export interface Connection {
  send: (payload: unknown) => boolean;
  close: () => void;
}

export function openSocket(path: string, token: string, handlers: ConnectionHandlers): Connection {
  const url = `${toWsBase(API_BASE_URL)}${path}?token=${encodeURIComponent(token)}`;
  const socket = new WebSocket(url);
  let closedByClient = false;

  socket.onopen = () => handlers.onOpen();
  socket.onmessage = (event: MessageEvent<unknown>) => {
    let data: unknown = null;
    try {
      data = JSON.parse(String(event.data));
    } catch {
      data = null;
    }
    handlers.onMessage(data);
  };
  socket.onclose = (event: CloseEvent) => {
    if (!closedByClient) handlers.onClose(event.code);
  };

  return {
    send(payload) {
      if (socket.readyState !== WebSocket.OPEN) return false;
      socket.send(JSON.stringify(payload));
      return true;
    },
    close() {
      closedByClient = true;
      socket.close();
    },
  };
}
