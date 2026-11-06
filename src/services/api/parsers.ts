import type {
  ChatMemberWithRole,
  ChatRole,
  ChatSummary,
  MessageReceipt,
  MessageRead,
  ReplyPreview,
  ServerNotification,
  UserRead,
} from '../../types/api';

type Dict = Record<string, unknown>;

function isDict(value: unknown): value is Dict {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value);
}

export function parseUser(value: unknown): UserRead {
  if (
    !isDict(value) ||
    !isNumber(value.id) ||
    !isString(value.email) ||
    !isString(value.username) ||
    !isString(value.name)
  ) {
    throw new Error('Unexpected user response');
  }
  return {
    id: value.id,
    email: value.email,
    username: value.username,
    name: value.name,
    is_active: value.is_active !== false,
    is_superuser: value.is_superuser === true,
    is_verified: value.is_verified === true,
  };
}

function isMember(value: unknown): value is ChatSummary['members'][number] {
  return isDict(value) && isNumber(value.id) && isString(value.username) && isString(value.name);
}

function parseChat(value: unknown): ChatSummary {
  if (
    !isDict(value) ||
    !isString(value.id) ||
    (value.type !== 'group' && value.type !== 'direct') ||
    !isNullableString(value.title) ||
    !isString(value.created_at) ||
    !Array.isArray(value.members) ||
    !value.members.every(isMember)
  ) {
    throw new Error('Unexpected chat');
  }
  const opponent = isDict(value.opponent) && isMember(value.opponent) && isString(value.opponent.display_name)
    ? { ...value.opponent, display_name: value.opponent.display_name }
    : null;
  return {
    id: value.id,
    type: value.type,
    title: value.title,
    created_at: value.created_at,
    members: value.members,
    opponent,
  };
}

export function parseChatList(value: unknown): ChatSummary[] {
  if (!isDict(value) || !Array.isArray(value.chats)) {
    throw new Error('Unexpected chats response');
  }
  return value.chats.map(parseChat);
}

export function parseReceipts(value: unknown): MessageReceipt[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) =>
    isDict(item) && isNumber(item.user_id) && isString(item.read_at)
      ? [{ user_id: item.user_id, read_at: item.read_at }]
      : [],
  );
}

export function parseReactions(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) =>
    isDict(item) && isNumber(item.user_id) && isString(item.emoji) && isString(item.created_at)
      ? [{ user_id: item.user_id, emoji: item.emoji, created_at: item.created_at }]
      : [],
  );
}

export function parseMessage(value: unknown): MessageRead {
  if (
    !isDict(value) ||
    !isString(value.id) ||
    !isString(value.chat_id) ||
    !isNumber(value.sender_id) ||
    !isString(value.content) ||
    !isString(value.created_at)
  ) {
    throw new Error('Unexpected message');
  }
  return {
    id: value.id,
    chat_id: value.chat_id,
    sender_id: value.sender_id,
    content: value.content,
    created_at: value.created_at,
    edited_at: isString(value.edited_at) ? value.edited_at : null,
    forwarded_from_user_id: isNumber(value.forwarded_from_user_id) ? value.forwarded_from_user_id : null,
    forwarded_from_message_id: isString(value.forwarded_from_message_id) ? value.forwarded_from_message_id : null,
    forwarded_from_name: isString(value.forwarded_from_name) ? value.forwarded_from_name : null,
    reply_to_id: isString(value.reply_to_id) ? value.reply_to_id : null,
    reply_to: parseReplyPreview(value.reply_to),
    reads: parseReceipts(value.reads),
    reactions: parseReactions(value.reactions),
  };
}

function parseReplyPreview(value: unknown): ReplyPreview | null {
  if (
    !isDict(value) ||
    !isString(value.id) ||
    !isNumber(value.sender_id) ||
    !isString(value.content) ||
    !isString(value.created_at)
  ) {
    return null;
  }
  return { id: value.id, sender_id: value.sender_id, content: value.content, created_at: value.created_at };
}

export function parseMessageList(value: unknown): MessageRead[] {
  if (!Array.isArray(value)) {
    throw new Error('Unexpected messages response');
  }
  return value.map(parseMessage);
}

export function parseServerNotification(value: unknown): ServerNotification | null {
  if (
    !isDict(value) ||
    !isString(value.id) ||
    !isNullableString(value.chat_id) ||
    !isString(value.type) ||
    !isNullableString(value.title) ||
    !isString(value.content) ||
    typeof value.is_read !== 'boolean' ||
    !isString(value.created_at)
  ) {
    return null;
  }
  return {
    id: value.id,
    chat_id: value.chat_id,
    type: value.type,
    title: value.title,
    content: value.content,
    is_read: value.is_read,
    created_at: value.created_at,
  };
}

export function parseServerNotifications(value: unknown): ServerNotification[] {
  if (!Array.isArray(value)) throw new Error('Unexpected notifications response');
  return value.flatMap((item) => parseServerNotification(item) ?? []);
}

export function parseChatDescription(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (isDict(value) && (value.description === null || isString(value.description))) {
    return value.description;
  }
  throw new Error('Unexpected description response');
}

const CHAT_ROLES: readonly ChatRole[] = ['OWNER', 'ADMIN', 'USER'];

export function parseChatMembers(value: unknown): ChatMemberWithRole[] {
  if (!Array.isArray(value)) {
    throw new Error('Unexpected members response');
  }
  return value.map((item) => {
    if (!isDict(item) || !isNumber(item.user_id) || !isString(item.username) || !isString(item.name)) {
      throw new Error('Unexpected member');
    }
    const role = CHAT_ROLES.find((candidate) => candidate === item.role) ?? 'USER';
    return { id: item.user_id, username: item.username, name: item.name, role };
  });
}
