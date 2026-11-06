import { parseReactions, parseReceipts, parseServerNotification } from '../api/parsers';
import type { ChatSocketEvent, MessageRead, NotificationEvent } from '../../types/api';

type Dict = Record<string, unknown>;

function isDict(value: unknown): value is Dict {
  return typeof value === 'object' && value !== null;
}

function isMessage(value: unknown): value is MessageRead {
  return (
    isDict(value) &&
    typeof value.id === 'string' &&
    typeof value.chat_id === 'string' &&
    typeof value.sender_id === 'number' &&
    typeof value.content === 'string' &&
    typeof value.created_at === 'string'
  );
}

export function parseNotificationEvent(raw: unknown): NotificationEvent | null {
  if (!isDict(raw) || typeof raw.type !== 'string') return null;
  switch (raw.type) {
    case 'new_message':
      if (typeof raw.chat_id !== 'string' || !isMessage(raw.message)) return null;
      return {
        type: 'new_message',
        chat_id: raw.chat_id,
        message: { ...raw.message, reads: parseReceipts(raw.message.reads), reactions: parseReactions(raw.message.reactions) },
      };
    case 'message_read':
      if (
        typeof raw.chat_id !== 'string' ||
        typeof raw.message_id !== 'string' ||
        typeof raw.user_id !== 'number' ||
        typeof raw.read_at !== 'string'
      ) {
        return null;
      }
      return {
        type: 'message_read',
        chat_id: raw.chat_id,
        message_id: raw.message_id,
        user_id: raw.user_id,
        read_at: raw.read_at,
      };
    case 'user_status':
      if (typeof raw.user_id !== 'number' || (raw.status !== 'online' && raw.status !== 'offline')) return null;
      return { type: 'user_status', user_id: raw.user_id, status: raw.status };
    case 'new_chat':
      if (
        typeof raw.chat_id !== 'string' ||
        typeof raw.chat_type !== 'string' ||
        (raw.title !== null && typeof raw.title !== 'string') ||
        typeof raw.created_by !== 'number'
      ) {
        return null;
      }
      return {
        type: 'new_chat',
        chat_id: raw.chat_id,
        chat_type: raw.chat_type,
        title: raw.title,
        created_by: raw.created_by,
      };
    case 'notification': {
      const notification = parseServerNotification(raw.notification);
      return notification ? { type: 'notification', notification } : null;
    }
    case 'member_added':
      if (
        typeof raw.chat_id !== 'string' ||
        typeof raw.user_id !== 'number' ||
        typeof raw.username !== 'string' ||
        typeof raw.added_by !== 'number'
      ) {
        return null;
      }
      return {
        type: 'member_added',
        chat_id: raw.chat_id,
        user_id: raw.user_id,
        username: raw.username,
        added_by: raw.added_by,
      };
    case 'member_removed':
      if (typeof raw.chat_id !== 'string' || typeof raw.user_id !== 'number' || typeof raw.removed_by !== 'number') {
        return null;
      }
      return { type: 'member_removed', chat_id: raw.chat_id, user_id: raw.user_id, removed_by: raw.removed_by };
    case 'added_to_chat':
      if (
        typeof raw.chat_id !== 'string' ||
        typeof raw.chat_type !== 'string' ||
        (raw.title !== null && typeof raw.title !== 'string') ||
        typeof raw.added_by !== 'number'
      ) {
        return null;
      }
      return {
        type: 'added_to_chat',
        chat_id: raw.chat_id,
        chat_type: raw.chat_type,
        title: raw.title,
        added_by: raw.added_by,
      };
    case 'removed_from_chat':
      if (typeof raw.chat_id !== 'string' || typeof raw.removed_by !== 'number') return null;
      return { type: 'removed_from_chat', chat_id: raw.chat_id, removed_by: raw.removed_by };
    case 'chat_deleted':
      if (typeof raw.chat_id !== 'string' || typeof raw.deleted_by !== 'number') return null;
      return { type: 'chat_deleted', chat_id: raw.chat_id, deleted_by: raw.deleted_by };
    case 'chat_updated':
      if (
        typeof raw.chat_id !== 'string' ||
        (raw.title !== null && typeof raw.title !== 'string') ||
        typeof raw.updated_by !== 'number'
      ) {
        return null;
      }
      return { type: 'chat_updated', chat_id: raw.chat_id, title: raw.title, updated_by: raw.updated_by };
    case 'chat_cleared':
      if (typeof raw.chat_id !== 'string' || typeof raw.cleared_by !== 'number') return null;
      return { type: 'chat_cleared', chat_id: raw.chat_id, cleared_by: raw.cleared_by };
    case 'chat_description_updated':
      if (
        typeof raw.chat_id !== 'string' ||
        (raw.description !== null && typeof raw.description !== 'string') ||
        typeof raw.updated_by !== 'number'
      ) {
        return null;
      }
      return {
        type: 'chat_description_updated',
        chat_id: raw.chat_id,
        description: raw.description,
        updated_by: raw.updated_by,
      };
    case 'message_edited':
      if (
        typeof raw.chat_id !== 'string' ||
        typeof raw.message_id !== 'string' ||
        typeof raw.content !== 'string' ||
        (raw.edited_at !== null && typeof raw.edited_at !== 'string')
      ) {
        return null;
      }
      return {
        type: 'message_edited',
        chat_id: raw.chat_id,
        message_id: raw.message_id,
        content: raw.content,
        edited_at: raw.edited_at,
      };
    case 'user_blocked':
      if (typeof raw.user_id !== 'number' || typeof raw.username !== 'string') return null;
      return { type: 'user_blocked', user_id: raw.user_id, username: raw.username };
    case 'message_reactions_updated':
      if (typeof raw.chat_id !== 'string' || typeof raw.message_id !== 'string') return null;
      return {
        type: 'message_reactions_updated',
        chat_id: raw.chat_id,
        message_id: raw.message_id,
        reactions: parseReactions(raw.reactions),
      };
    case 'message_deleted':
      if (typeof raw.chat_id !== 'string' || typeof raw.message_id !== 'string' || typeof raw.deleted_by !== 'number') {
        return null;
      }
      return { type: 'message_deleted', chat_id: raw.chat_id, message_id: raw.message_id, deleted_by: raw.deleted_by };
    case 'error':
      return typeof raw.detail === 'string' ? { type: 'error', detail: raw.detail } : null;
    default:
      return null;
  }
}

export function parseChatSocketEvent(raw: unknown): ChatSocketEvent | null {
  if (!isDict(raw) || typeof raw.type !== 'string') return null;
  switch (raw.type) {
    case 'typing':
      if (typeof raw.chat_id !== 'string' || typeof raw.user_id !== 'number') return null;
      return { type: 'typing', chat_id: raw.chat_id, user_id: raw.user_id };
    case 'member_role_changed':
      return typeof raw.chat_id === 'string' ? { type: 'member_role_changed', chat_id: raw.chat_id } : null;
    case 'chat_description_updated': {
      const event = parseNotificationEvent(raw);
      return event && event.type === 'chat_description_updated' ? event : null;
    }
    case 'new_message':
    case 'message_read': {
      const event = parseNotificationEvent(raw);
      return event && (event.type === 'new_message' || event.type === 'message_read') ? event : null;
    }
    case 'message_reactions_updated': {
      const event = parseNotificationEvent(raw);
      return event && event.type === 'message_reactions_updated' ? event : null;
    }
    case 'error':
      return typeof raw.detail === 'string' ? { type: 'error', detail: raw.detail } : null;
    default:
      return null;
  }
}
