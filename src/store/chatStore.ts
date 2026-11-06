import { create } from 'zustand';
import type { ChatSummary, MessageRead, UserStatus } from '../types/api';
import type { SocketName, SocketStatus } from '../services/websocket/realtime';

export interface PendingMessage {
  localId: string;
  chatId: string;
  content: string;
  createdAt: string;
  status: 'sending' | 'failed';
  failure: string | null;
  replyToId: string | null;
}

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface SystemNotice {
  id: string;
  text: string;
  createdAt: string;
  unread: boolean;
}

interface ChatState {
  chats: ChatSummary[];
  chatsStatus: LoadStatus;
  chatsError: string | null;
  activeChatId: string | null;
  messagesByChat: Record<string, MessageRead[]>;
  messagesStatus: Record<string, LoadStatus>;
  hasOlderByChat: Record<string, boolean>;
  pendingByChat: Record<string, PendingMessage[]>;
  noticesByChat: Record<string, SystemNotice[]>;
  memberRolesVersion: Record<string, number>;
  blockedUserIds: number[];
  descriptionByChat: Record<string, string | null>;
  typingByChat: Record<string, Record<number, number>>;
  presence: Record<number, UserStatus>;
  socketStatus: Record<SocketName, SocketStatus>;
  notice: string | null;

  setChatsLoading: () => void;
  setChats: (chats: ChatSummary[]) => void;
  setChatsError: (message: string) => void;
  updateChatTitle: (chatId: string, title: string | null) => void;
  openChat: (chatId: string | null) => void;
  setMessagesLoading: (chatId: string) => void;
  setMessagesError: (chatId: string) => void;
  mergeHistory: (chatId: string, messages: MessageRead[], hasOlder: boolean) => void;
  clearChatMessages: (chatId: string) => void;
  addNotice: (chatId: string, text: string, options?: { id?: string; unread?: boolean }) => void;
  markNoticesRead: (chatId: string, ids: string[]) => void;
  bumpMemberRoles: (chatId: string) => void;
  removeMessage: (chatId: string, messageId: string) => void;
  updateMessage: (chatId: string, messageId: string, content: string, editedAt: string | null) => void;
  setMessageReactions: (chatId: string, messageId: string, reactions: MessageRead['reactions']) => void;
  setBlockedUsers: (userIds: number[]) => void;
  addBlockedUser: (userId: number) => void;
  mergeNotices: (chatId: string, notices: SystemNotice[]) => void;
  setChatDescription: (chatId: string, description: string | null) => void;
  receiveMessage: (message: MessageRead, myId: number) => void;
  addPending: (chatId: string, content: string, replyToId: string | null) => string;
  failPending: (chatId: string, localId: string, failure: string) => void;
  removePending: (chatId: string, localId: string) => void;
  recordRead: (chatId: string, messageId: string, userId: number, readAt: string) => void;
  setPresence: (userId: number, status: UserStatus) => void;
  setTyping: (chatId: string, userId: number, typing: boolean) => void;
  setSocketStatus: (socket: SocketName, status: SocketStatus) => void;
  setNotice: (message: string | null) => void;
  resetSession: () => void;
}

const initialState = {
  chats: [],
  chatsStatus: 'idle' as LoadStatus,
  chatsError: null,
  activeChatId: null,
  messagesByChat: {},
  messagesStatus: {},
  hasOlderByChat: {},
  pendingByChat: {},
  noticesByChat: {},
  memberRolesVersion: {},
  blockedUserIds: [],
  descriptionByChat: {},
  typingByChat: {},
  presence: {},
  socketStatus: { notifications: 'idle', chat: 'idle' } as Record<SocketName, SocketStatus>,
  notice: null,
};

function byCreatedAt(a: MessageRead, b: MessageRead): number {
  return a.created_at.localeCompare(b.created_at);
}

export function lastMessageOf(messages: MessageRead[] | undefined): MessageRead | undefined {
  return messages?.[messages.length - 1];
}

export function isReadBy(message: MessageRead, userId: number): boolean {
  return message.reads.some((receipt) => receipt.user_id === userId);
}

export function unreadCountOf(messages: MessageRead[] | undefined, myId: number): number {
  return (messages ?? []).filter((message) => message.sender_id !== myId && !isReadBy(message, myId)).length;
}

function mergeNoticeList(existing: SystemNotice[], incoming: SystemNotice[]): SystemNotice[] {
  const known = new Set(existing.map((notice) => notice.id));
  const fresh = incoming.filter((notice) => !known.has(notice.id));
  if (fresh.length === 0) return existing;
  return [...existing, ...fresh].sort(
    (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
  );
}

export const useChatStore = create<ChatState>((set) => ({
  ...initialState,

  setChatsLoading: () => set({ chatsStatus: 'loading', chatsError: null }),

  setChats: (chats) => set({ chats, chatsStatus: 'ready', chatsError: null }),

  setChatsError: (message) => set({ chatsStatus: 'error', chatsError: message }),

  updateChatTitle: (chatId, title) =>
    set((state) => ({
      chats: state.chats.map((chat) => (chat.id === chatId ? { ...chat, title } : chat)),
    })),

  openChat: (chatId) => set({ activeChatId: chatId }),

  clearChatMessages: (chatId) =>
    set((state) => ({
      messagesByChat: { ...state.messagesByChat, [chatId]: [] },
      hasOlderByChat: { ...state.hasOlderByChat, [chatId]: false },
    })),

  addNotice: (chatId, text, options = {}) =>
    set((state) => ({
      noticesByChat: {
        ...state.noticesByChat,
        [chatId]: mergeNoticeList(state.noticesByChat[chatId] ?? [], [
          {
            id: options.id ?? crypto.randomUUID(),
            text,
            createdAt: new Date().toISOString(),
            unread: options.unread ?? false,
          },
        ]),
      },
    })),

  updateMessage: (chatId, messageId, content, editedAt) =>
    set((state) => ({
      messagesByChat: {
        ...state.messagesByChat,
        [chatId]: (state.messagesByChat[chatId] ?? []).map((message) =>
          message.id === messageId ? { ...message, content, edited_at: editedAt } : message,
        ),
      },
    })),

  setBlockedUsers: (userIds) => set({ blockedUserIds: [...new Set(userIds)] }),

  addBlockedUser: (userId) =>
    set((state) => ({
      blockedUserIds: state.blockedUserIds.includes(userId) ? state.blockedUserIds : [...state.blockedUserIds, userId],
    })),

  setMessageReactions: (chatId, messageId, reactions) =>
    set((state) => ({
      messagesByChat: {
        ...state.messagesByChat,
        [chatId]: (state.messagesByChat[chatId] ?? []).map((message) =>
          message.id === messageId ? { ...message, reactions } : message,
        ),
      },
    })),

  removeMessage: (chatId, messageId) =>
    set((state) => ({
      messagesByChat: {
        ...state.messagesByChat,
        [chatId]: (state.messagesByChat[chatId] ?? [])
          .filter((message) => message.id !== messageId)
          .map((message) =>
            message.reply_to?.id === messageId ? { ...message, reply_to_id: null, reply_to: null } : message,
          ),
      },
    })),

  bumpMemberRoles: (chatId) =>
    set((state) => ({
      memberRolesVersion: {
        ...state.memberRolesVersion,
        [chatId]: (state.memberRolesVersion[chatId] ?? 0) + 1,
      },
    })),

  markNoticesRead: (chatId, ids) =>
    set((state) => ({
      noticesByChat: {
        ...state.noticesByChat,
        [chatId]: (state.noticesByChat[chatId] ?? []).map((notice) =>
          ids.includes(notice.id) ? { ...notice, unread: false } : notice,
        ),
      },
    })),

  mergeNotices: (chatId, notices) =>
    set((state) => ({
      noticesByChat: {
        ...state.noticesByChat,
        [chatId]: mergeNoticeList(state.noticesByChat[chatId] ?? [], notices),
      },
    })),

  setChatDescription: (chatId, description) =>
    set((state) => ({ descriptionByChat: { ...state.descriptionByChat, [chatId]: description } })),

  setMessagesLoading: (chatId) =>
    set((state) => ({ messagesStatus: { ...state.messagesStatus, [chatId]: 'loading' } })),

  setMessagesError: (chatId) =>
    set((state) => ({ messagesStatus: { ...state.messagesStatus, [chatId]: 'error' } })),

  mergeHistory: (chatId, messages, hasOlder) =>
    set((state) => {
      const existing = state.messagesByChat[chatId] ?? [];
      const known = new Set(existing.map((message) => message.id));
      const fresh = messages.filter((message) => !known.has(message.id));
      return {
        messagesByChat: { ...state.messagesByChat, [chatId]: [...fresh, ...existing].sort(byCreatedAt) },
        messagesStatus: { ...state.messagesStatus, [chatId]: 'ready' },
        hasOlderByChat: { ...state.hasOlderByChat, [chatId]: hasOlder },
      };
    }),

  receiveMessage: (message, myId) =>
    set((state) => {
      const chatId = message.chat_id;
      const existing = state.messagesByChat[chatId] ?? [];
      if (existing.some((item) => item.id === message.id)) return {};

      const pending = state.pendingByChat[chatId] ?? [];
      const ownEcho = message.sender_id === myId ? pending.find((item) => item.content === message.content) : undefined;
      const nextPending = ownEcho
        ? pending.filter((item) => item.localId !== ownEcho.localId)
        : pending;

      return {
        messagesByChat: { ...state.messagesByChat, [chatId]: [...existing, message].sort(byCreatedAt) },
        pendingByChat: { ...state.pendingByChat, [chatId]: nextPending },
      };
    }),

  addPending: (chatId, content, replyToId) => {
    const localId = crypto.randomUUID();
    set((state) => ({
      pendingByChat: {
        ...state.pendingByChat,
        [chatId]: [
          ...(state.pendingByChat[chatId] ?? []),
          { localId, chatId, content, createdAt: new Date().toISOString(), status: 'sending', failure: null, replyToId },
        ],
      },
    }));
    return localId;
  },

  failPending: (chatId, localId, failure) =>
    set((state) => {
      const list = state.pendingByChat[chatId] ?? [];
      if (!list.some((item) => item.localId === localId)) return {};
      return {
        pendingByChat: {
          ...state.pendingByChat,
          [chatId]: list.map((item) =>
            item.localId === localId ? { ...item, status: 'failed', failure } : item,
          ),
        },
      };
    }),

  removePending: (chatId, localId) =>
    set((state) => ({
      pendingByChat: {
        ...state.pendingByChat,
        [chatId]: (state.pendingByChat[chatId] ?? []).filter((item) => item.localId !== localId),
      },
    })),

  recordRead: (chatId, messageId, userId, readAt) =>
    set((state) => {
      const existing = state.messagesByChat[chatId];
      if (!existing?.some((message) => message.id === messageId && !isReadBy(message, userId))) return {};
      return {
        messagesByChat: {
          ...state.messagesByChat,
          [chatId]: existing.map((message) =>
            message.id === messageId && !isReadBy(message, userId)
              ? { ...message, reads: [...message.reads, { user_id: userId, read_at: readAt }] }
              : message,
          ),
        },
      };
    }),

  setPresence: (userId, status) =>
    set((state) => ({ presence: { ...state.presence, [userId]: status } })),

  setTyping: (chatId, userId, typing) =>
    set((state) => {
      const current = { ...(state.typingByChat[chatId] ?? {}) };
      if (typing) {
        current[userId] = Date.now();
      } else {
        delete current[userId];
      }
      return { typingByChat: { ...state.typingByChat, [chatId]: current } };
    }),

  setSocketStatus: (socket, status) =>
    set((state) => ({ socketStatus: { ...state.socketStatus, [socket]: status } })),

  setNotice: (message) => set({ notice: message }),

  resetSession: () => set({ ...initialState }),
}));
