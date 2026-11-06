import type { ChatMemberWithRole, ChatRole, ChatSummary, MessageRead } from '../../types/api';
import { apiRequest } from './client';
import { parseChatDescription, parseChatList, parseChatMembers, parseMessageList } from './parsers';

export interface GroupChatInput {
  title: string;
  description: string;
  memberUsernames: string[];
  adminUsernames: string[];
}

export async function fetchChats(token: string): Promise<ChatSummary[]> {
  return parseChatList(await apiRequest('/api/v1/chats/', { token }));
}

export async function createDirectChat(token: string, opponentUsername: string): Promise<string> {
  const payload = await apiRequest('/api/v1/chats/create-direct', {
    method: 'POST',
    token,
    body: { opponent_username: opponentUsername },
  });
  return chatIdFrom(payload);
}

export async function createGroupChat(token: string, input: GroupChatInput): Promise<string> {
  const payload = await apiRequest('/api/v1/chats/create-group', {
    method: 'POST',
    token,
    body: {
      title: input.title,
      description: input.description,
      member_emails: [],
      admin_emails: [],
      member_usernames: input.memberUsernames,
      admin_usernames: input.adminUsernames,
    },
  });
  return chatIdFrom(payload);
}

function chatIdFrom(payload: unknown): string {
  if (typeof payload !== 'object' || payload === null || !('id' in payload)) {
    throw new Error('Unexpected chat response');
  }
  const id = (payload as { id: unknown }).id;
  if (typeof id !== 'string') throw new Error('Unexpected chat response');
  return id;
}

export async function fetchMessages(
  token: string,
  chatId: string,
  limit = 50,
  offset = 0,
): Promise<MessageRead[]> {
  const payload = await apiRequest(
    `/api/v1/messages/${chatId}/messages?limit=${limit}&offset=${offset}`,
    { token },
  );
  return parseMessageList(payload);
}

export async function fetchChatMembers(token: string, chatId: string): Promise<ChatMemberWithRole[]> {
  return parseChatMembers(await apiRequest(`/api/v1/chats/${chatId}/members`, { token }));
}

export async function fetchChatDescription(token: string, chatId: string): Promise<string | null> {
  return parseChatDescription(await apiRequest(`/api/v1/chats/${chatId}/description`, { token }));
}

export async function renameGroupChat(token: string, chatId: string, title: string): Promise<void> {
  await apiRequest(`/api/v1/chats/${chatId}/rename-group`, { method: 'PATCH', token, body: { title } });
}

export async function deleteGroupChat(token: string, chatId: string): Promise<void> {
  await apiRequest(`/api/v1/chats/${chatId}/del-group`, { method: 'DELETE', token });
}

export async function leaveGroupChat(token: string, chatId: string): Promise<void> {
  await apiRequest(`/api/v1/chats/${chatId}/leave`, { method: 'DELETE', token });
}

export async function addChatMember(token: string, chatId: string, username: string): Promise<void> {
  await apiRequest(`/api/v1/chats/${chatId}/add-members`, { method: 'POST', token, body: { username } });
}

export async function removeChatMember(token: string, chatId: string, username: string): Promise<void> {
  await apiRequest(`/api/v1/chats/${chatId}/remove-member`, { method: 'DELETE', token, body: { username } });
}

export async function updateMemberRole(token: string, chatId: string, username: string, role: ChatRole): Promise<void> {
  await apiRequest(`/api/v1/chats/${chatId}/members/role`, { method: 'PATCH', token, body: { username, role } });
}

export async function updateChatDescription(token: string, chatId: string, description: string): Promise<void> {
  await apiRequest(`/api/v1/chats/${chatId}/description-update`, { method: 'PATCH', token, body: { description } });
}

export async function deleteMessage(token: string, messageId: string): Promise<void> {
  await apiRequest(`/api/v1/messages/${messageId}/delete-message/`, { method: 'DELETE', token });
}

export async function editMessage(token: string, messageId: string, content: string): Promise<void> {
  await apiRequest(`/api/v1/messages/${messageId}/edit-message/`, { method: 'PATCH', token, body: { content } });
}

export async function setMessageReaction(token: string, chatId: string, messageId: string, emoji: string): Promise<void> {
  await apiRequest(`/api/v1/messages/${chatId}/messages/${messageId}/reaction`, {
    method: 'PUT',
    token,
    body: { emoji },
  });
}

export async function forwardMessage(token: string, messageId: string, targetChatIds: string[]): Promise<void> {
  await apiRequest(`/api/v1/messages/${messageId}/forward`, {
    method: 'POST',
    token,
    body: { target_chat_ids: targetChatIds },
  });
}
