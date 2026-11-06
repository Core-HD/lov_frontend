import { useAuthStore } from '../store/authStore';
import { isReadBy, useChatStore, type SystemNotice } from '../store/chatStore';
import { useUiStore } from '../store/uiStore';
import type { ChatRole, MessageRead } from '../types/api';
import { fetchNotifications, markNotificationRead } from './api/notifications';
import {
  addChatMember,
  createDirectChat,
  createGroupChat,
  deleteGroupChat,
  fetchChats,
  fetchMessages,
  removeChatMember,
  renameGroupChat,
  type GroupChatInput,
  updateMemberRole,
  updateChatDescription,
  deleteMessage,
  editMessage,
  forwardMessage,
  leaveGroupChat,
  setMessageReaction,
} from './api/chats';
import { blockUser, fetchBlockedUserIds } from './api/blocks';
import { connectToChat, disconnectChat, markMessageAsRead, sendMessage } from './websocket/realtime';

const PAGE_SIZE = 30;
export const MAX_MESSAGE_LENGTH = 10000;

function currentToken(): string | null {

  return useAuthStore.getState().token;
}

export async function refreshChats(): Promise<void> {
  const token = currentToken();
  if (!token) return;
  const store = useChatStore.getState();
  store.setChatsLoading();
  try {
    const chats = await fetchChats(token);
    useChatStore.getState().setChats(chats);
    await Promise.all([...chats.map((chat) => loadLatest(chat.id)), loadNotifications()]);
  } catch (error) {
    useChatStore.getState().setChatsError('Не удалось загрузить чаты. Попробуйте обновить страницу.');
  }
}

export async function loadLatest(chatId: string): Promise<void> {
  const token = currentToken();
  if (!token) return;
  useChatStore.getState().setMessagesLoading(chatId);
  try {
    const messages = await fetchMessages(token, chatId, PAGE_SIZE, 0);
    useChatStore.getState().mergeHistory(chatId, messages, messages.length === PAGE_SIZE);
  } catch {
    useChatStore.getState().setMessagesError(chatId);
  }
}

export async function loadOlder(chatId: string): Promise<void> {
  const token = currentToken();
  if (!token) return;
  const loaded = useChatStore.getState().messagesByChat[chatId]?.length ?? 0;
  useChatStore.getState().setMessagesLoading(chatId);
  try {
    const messages = await fetchMessages(token, chatId, PAGE_SIZE, loaded);
    useChatStore.getState().mergeHistory(chatId, messages, messages.length === PAGE_SIZE);
  } catch {
    useChatStore.getState().setMessagesError(chatId);
  }
}

async function loadNotifications(): Promise<void> {
  const token = currentToken();
  if (!token) return;
  try {
    const notifications = await fetchNotifications(token);
    const byChat = new Map<string, SystemNotice[]>();
    notifications.forEach((notification) => {
      if (notification.chat_id === null) return;
      const notice: SystemNotice = {
        id: notification.id,
        text: notification.content,
        createdAt: notification.created_at,
        unread: !notification.is_read,
      };
      byChat.set(notification.chat_id, [...(byChat.get(notification.chat_id) ?? []), notice]);
    });
    byChat.forEach((notices, chatId) => useChatStore.getState().mergeNotices(chatId, notices));
  } catch {
    useChatStore.getState().setNotice('Не удалось загрузить уведомления.');
  }
}

async function markChatNotificationsRead(chatId: string): Promise<void> {
  const token = currentToken();
  if (!token) return;
  const unreadIds = (useChatStore.getState().noticesByChat[chatId] ?? [])
    .filter((notice) => notice.unread)
    .map((notice) => notice.id);
  if (unreadIds.length === 0) return;
  const readIds = await Promise.all(
    unreadIds.map(async (id) => {
      try {
        await markNotificationRead(token, id);
        return id;
      } catch {
        return null;
      }
    }),
  );
  useChatStore.getState().markNoticesRead(chatId, readIds.filter((id): id is string => id !== null));
}

export function selectChat(chatId: string): void {
  const token = currentToken();
  if (!token) return;
  const previousChatId = useChatStore.getState().activeChatId;
  if (previousChatId && previousChatId !== chatId) void markChatNotificationsRead(previousChatId);
  const chat = useChatStore.getState().chats.find((item) => item.id === chatId);
  useChatStore.getState().openChat(chatId);
  useUiStore.getState().setRightPanelOpen(chat?.type === 'group');
  connectToChat(chatId, token);
  void loadLatest(chatId);
}

export function leaveChat(): void {
  const activeChatId = useChatStore.getState().activeChatId;
  if (activeChatId) void markChatNotificationsRead(activeChatId);
  useChatStore.getState().openChat(null);
  disconnectChat();
}

export async function loadBlockedUsers(): Promise<void> {
  const token = currentToken();
  if (!token) return;
  try {
    useChatStore.getState().setBlockedUsers(await fetchBlockedUserIds(token));
  } catch {
    useChatStore.getState().setNotice('Не удалось загрузить список заблокированных.');
  }
}

export async function blockOpponent(opponent: { id: number; username: string }): Promise<void> {
  const token = currentToken();
  if (!token) return;
  await blockUser(token, { userId: opponent.id, username: opponent.username });
  useChatStore.getState().addBlockedUser(opponent.id);
}

export async function reactToMessage(chatId: string, messageId: string, emoji: string): Promise<void> {
  const token = currentToken();
  if (!token) return;
  try {
    await setMessageReaction(token, chatId, messageId, emoji);
  } catch {
    useChatStore.getState().setNotice('Не удалось поставить реакцию. Попробуйте ещё раз.');
  }
}

export async function leaveGroup(chatId: string): Promise<void> {
  const token = currentToken();
  if (!token) return;
  try {
    await leaveGroupChat(token, chatId);
  } catch {
    useChatStore.getState().setNotice('Не удалось покинуть группу. Попробуйте ещё раз.');
    return;
  }
  if (useChatStore.getState().activeChatId === chatId) leaveChat();
  await refreshChats();
}

export function sendChatMessage(chatId: string, rawContent: string, replyToId: string | null = null): void {
  const content = rawContent.trim();
  if (content.length === 0 || content.length > MAX_MESSAGE_LENGTH) return;
  const localId = useChatStore.getState().addPending(chatId, content, replyToId);
  if (!sendMessage(content, replyToId ?? undefined)) {
    useChatStore.getState().failPending(chatId, localId, 'Нет соединения с чатом');
  }
}

export function retryPendingMessage(chatId: string, localId: string): void {
  const pending = useChatStore.getState().pendingByChat[chatId]?.find((item) => item.localId === localId);
  if (!pending) return;
  useChatStore.getState().removePending(chatId, localId);
  sendChatMessage(chatId, pending.content, pending.replyToId);
}

export function acknowledgeIncomingMessages(chatId: string, messages: MessageRead[], myId: number): void {
  messages.forEach((message) => {
    if (message.sender_id === myId || isReadBy(message, myId)) return;
    if (markMessageAsRead(message.id)) {
      useChatStore.getState().recordRead(chatId, message.id, myId, new Date().toISOString());
    }
  });
}

export function acknowledgeActiveChat(): void {
  const { activeChatId, messagesByChat } = useChatStore.getState();
  const myId = useAuthStore.getState().user?.id ?? null;
  if (!activeChatId || myId === null) return;
  acknowledgeIncomingMessages(activeChatId, messagesByChat[activeChatId] ?? [], myId);
}


export async function createChatWith(username: string): Promise<string> {
  const token = currentToken();
  if (!token) throw new Error('Not authenticated');
  const chatId = await createDirectChat(token, username);
  await refreshChats();
  return chatId;
}

export async function createGroupWith(input: GroupChatInput): Promise<string> {
  const token = currentToken();
  if (!token) throw new Error('Not authenticated');
  const chatId = await createGroupChat(token, input);
  await refreshChats();
  return chatId;
}

export async function deleteGroup(chatId: string): Promise<void> {
  const token = currentToken();
  if (!token) throw new Error('Not authenticated');
  await deleteGroupChat(token, chatId);
  handleChatDeleted(chatId);
}

export async function renameGroup(chatId: string, title: string): Promise<void> {
  const token = currentToken();
  if (!token) throw new Error('Not authenticated');
  await renameGroupChat(token, chatId, title);
  await refreshChats();
}

export async function addMember(chatId: string, username: string): Promise<void> {
  const token = currentToken();
  if (!token) throw new Error('Not authenticated');
  await addChatMember(token, chatId, username);
  await refreshChats();
}

export async function removeMember(chatId: string, username: string): Promise<void> {
  const token = currentToken();
  if (!token) throw new Error('Not authenticated');
  await removeChatMember(token, chatId, username);
  await refreshChats();
}

export async function changeMemberRole(chatId: string, username: string, role: ChatRole): Promise<void> {
  const token = currentToken();
  if (!token) throw new Error('Not authenticated');
  await updateMemberRole(token, chatId, username, role);
}

export async function changeChatDescription(chatId: string, description: string): Promise<void> {
  const token = currentToken();
  if (!token) throw new Error('Not authenticated');
  await updateChatDescription(token, chatId, description);
  useChatStore.getState().setChatDescription(chatId, description);
}

export async function deleteChatMessage(chatId: string, messageId: string): Promise<void> {
  const token = currentToken();
  if (!token) throw new Error('Not authenticated');
  await deleteMessage(token, messageId);
  useChatStore.getState().removeMessage(chatId, messageId);
}

export async function changeChatMessage(chatId: string, messageId: string, content: string): Promise<void> {
  const token = currentToken();
  if (!token) throw new Error('Not authenticated');
  await editMessage(token, messageId, content);
  useChatStore.getState().updateMessage(chatId, messageId, content, new Date().toISOString());
}

export async function forwardChatMessage(message: MessageRead, targetChatIds: string[]): Promise<void> {
  const token = currentToken();
  if (!token) throw new Error('Not authenticated');
  await forwardMessage(token, message.forwarded_from_message_id ?? message.id, targetChatIds);
  await Promise.all(targetChatIds.map((chatId) => loadLatest(chatId)));
}

export function handleChatDeleted(chatId: string): void {
  if (useChatStore.getState().activeChatId === chatId) {
    leaveChat();
    useChatStore.getState().setNotice('Групповой чат был удалён');
  }
  void refreshChats();
}
