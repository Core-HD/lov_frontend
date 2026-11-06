import type { ChatSocketEvent, NotificationEvent, UserStatus } from '../../types/api';
import { openSocket, type Connection } from './connection';
import { parseChatSocketEvent, parseNotificationEvent } from './events';

export type SocketName = 'notifications' | 'chat';
export type SocketStatus = 'idle' | 'connecting' | 'open' | 'reconnecting' | 'offline' | 'auth_failed';

export interface RealtimeListener {
  onNotification: (event: NotificationEvent) => void;
  onChatEvent: (event: ChatSocketEvent) => void;
  onStatus: (socket: SocketName, status: SocketStatus) => void;
  onOpen: (socket: SocketName) => void;
  onAuthFailed: (socket: SocketName) => void;
  onError: (detail: string) => void;
}

const AUTH_FAILED_CODE = 1008;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;
const TYPING_THROTTLE_MS = 2000;

const listeners = new Set<RealtimeListener>();

function emit(callback: (listener: RealtimeListener) => void): void {
  listeners.forEach(callback);
}

export function subscribeRealtime(listener: RealtimeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

class ManagedSocket {
  private readonly name: SocketName;
  private readonly onEvent: (raw: unknown) => void;
  private path: string | null = null;
  private token: string | null = null;
  private connection: Connection | null = null;
  private retryTimer: number | null = null;
  private attempt = 0;
  private status: SocketStatus = 'idle';

  constructor(name: SocketName, onEvent: (raw: unknown) => void) {
    this.name = name;
    this.onEvent = onEvent;
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  connect(path: string, token: string): void {
    if (this.path === path && this.status !== 'idle' && this.status !== 'auth_failed') {
      this.token = token;
      return;
    }
    this.stop();
    this.path = path;
    this.token = token;
    this.attempt = 0;
    this.open();
  }

  stop(): void {
    this.clearRetry();
    const connection = this.connection;
    this.connection = null;
    this.path = null;
    this.token = null;
    connection?.close();
    this.setStatus('idle');
  }

  send(payload: unknown): boolean {
    return this.connection?.send(payload) ?? false;
  }

  private readonly handleOnline = (): void => {
    if (this.path && this.status !== 'open' && this.status !== 'connecting') {
      this.attempt = 0;
      this.open();
    }
  };

  private readonly handleOffline = (): void => {
    if (this.path) {
      this.clearRetry();
      this.connection?.close();
      this.connection = null;
      this.setStatus('offline');
    }
  };

  private open(): void {
    if (!this.path || !this.token) return;
    this.clearRetry();
    this.setStatus(this.attempt === 0 ? 'connecting' : 'reconnecting');
    const connection = openSocket(this.path, this.token, {
      onOpen: () => {
        this.attempt = 0;
        this.setStatus('open');
        emit((listener) => listener.onOpen(this.name));
      },
      onMessage: (data) => this.onEvent(data),
      onClose: (code) => {
        this.connection = null;
        if (!this.path) return;
        if (code === AUTH_FAILED_CODE) {
          this.path = null;
          this.setStatus('auth_failed');
          emit((listener) => listener.onAuthFailed(this.name));
          return;
        }
        this.scheduleRetry();
      },
    });
    this.connection = connection;
  }

  private scheduleRetry(): void {
    this.attempt += 1;
    const exponential = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** (this.attempt - 1));
    const delay = exponential * (0.8 + Math.random() * 0.4);
    this.setStatus('reconnecting');
    this.retryTimer = window.setTimeout(() => {
      this.retryTimer = null;
      this.open();
    }, delay);
  }

  private clearRetry(): void {
    if (this.retryTimer !== null) {
      window.clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  private setStatus(status: SocketStatus): void {
    if (this.status === status) return;
    this.status = status;
    emit((listener) => listener.onStatus(this.name, status));
  }
}

function handleNotificationRaw(raw: unknown): void {
  const event = parseNotificationEvent(raw);
  if (!event) {
    emit((listener) => listener.onError('Получено неизвестное событие от сервера'));
    return;
  }
  emit((listener) => listener.onNotification(event));
}

function handleChatRaw(raw: unknown): void {
  const event = parseChatSocketEvent(raw);
  if (!event) {
    emit((listener) => listener.onError('Получено неизвестное событие от сервера'));
    return;
  }
  emit((listener) => listener.onChatEvent(event));
}

const notificationsSocket = new ManagedSocket('notifications', handleNotificationRaw);
const chatSocket = new ManagedSocket('chat', handleChatRaw);

let lastTypingSentAt = 0;

export function connectNotifications(token: string): void {
  notificationsSocket.connect('/ws/notifications', token);
}

export function disconnectNotifications(): void {
  notificationsSocket.stop();
}

export function connectToChat(chatId: string, token: string): void {
  lastTypingSentAt = 0;
  chatSocket.connect(`/ws/chats/${chatId}`, token);
}

export function disconnectChat(): void {
  chatSocket.stop();
}

export function sendMessage(content: string, replyToId?: string): boolean {
  return chatSocket.send(
    replyToId ? { type: 'new_message', content, reply_to_id: replyToId } : { type: 'new_message', content },
  );
}

export function sendPresence(userId: number, status: UserStatus): boolean {
  return notificationsSocket.send({ type: 'user_status', user_id: userId, status });
}

export function markMessageAsRead(messageId: string): boolean {
  return chatSocket.send({ type: 'read_message', message_id: messageId });
}

export function sendTyping(): boolean {
  const now = Date.now();
  if (now - lastTypingSentAt < TYPING_THROTTLE_MS) return false;
  lastTypingSentAt = now;
  return chatSocket.send({ type: 'typing' });
}

export function disconnectAll(): void {
  disconnectChat();
  disconnectNotifications();
}
