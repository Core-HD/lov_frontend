export interface UserRead {
  id: number;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
  username: string;
  name: string;
}

export interface ChatMember {
  id: number;
  username: string;
  name: string;
}

export interface ChatOpponent extends ChatMember {
  display_name: string;
}

export type ChatType = 'group' | 'direct';

export type ChatRole = 'OWNER' | 'ADMIN' | 'USER';

export interface ChatMemberWithRole extends ChatMember {
  role: ChatRole;
}

export interface ChatSummary {
  id: string;
  type: ChatType;
  title: string | null;
  created_at: string;
  members: ChatMember[];
  opponent: ChatOpponent | null;
}

export interface MessageReceipt {
  user_id: number;
  read_at: string;
}

export interface ReplyPreview {
  id: string;
  sender_id: number;
  content: string;
  created_at: string;
}

export interface MessageRead {
  id: string;
  chat_id: string;
  sender_id: number;
  content: string;
  created_at: string;
  edited_at: string | null;
  forwarded_from_user_id: number | null;
  forwarded_from_message_id: string | null;
  forwarded_from_name: string | null;
  reply_to_id: string | null;
  reply_to: ReplyPreview | null;
  reads: MessageReceipt[];
  reactions: MessageReaction[];
}

export interface MessageReaction {
  user_id: number;
  emoji: string;
  created_at: string;
}

export type UserStatus = 'online' | 'offline';

export interface NewMessageEvent {
  type: 'new_message';
  chat_id: string;
  message: MessageRead;
}

export interface MessageReadEvent {
  type: 'message_read';
  chat_id: string;
  message_id: string;
  user_id: number;
  read_at: string;
}

export interface UserStatusEvent {
  type: 'user_status';
  user_id: number;
  status: UserStatus;
}

export interface TypingEvent {
  type: 'typing';
  chat_id: string;
  user_id: number;
}

export interface ErrorEvent {
  type: 'error';
  detail: string;
}

export interface NewChatEvent {
  type: 'new_chat';
  chat_id: string;
  chat_type: string;
  title: string | null;
  created_by: number;
}

export interface ChatDeletedEvent {
  type: 'chat_deleted';
  chat_id: string;
  deleted_by: number;
}

export interface ChatUpdatedEvent {
  type: 'chat_updated';
  chat_id: string;
  title: string | null;
  updated_by: number;
}

export interface ChatClearedEvent {
  type: 'chat_cleared';
  chat_id: string;
  cleared_by: number;
}

export interface ChatDescriptionUpdatedEvent {
  type: 'chat_description_updated';
  chat_id: string;
  description: string | null;
  updated_by: number;
}

export interface MemberAddedEvent {
  type: 'member_added';
  chat_id: string;
  user_id: number;
  username: string;
  added_by: number;
}

export interface MemberRemovedEvent {
  type: 'member_removed';
  chat_id: string;
  user_id: number;
  removed_by: number;
}

export interface AddedToChatEvent {
  type: 'added_to_chat';
  chat_id: string;
  chat_type: string;
  title: string | null;
  added_by: number;
}

export interface RemovedFromChatEvent {
  type: 'removed_from_chat';
  chat_id: string;
  removed_by: number;
}

export interface ServerNotification {
  id: string;
  chat_id: string | null;
  type: string;
  title: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface ServerNotificationEvent {
  type: 'notification';
  notification: ServerNotification;
}

export type NotificationEvent =
  | ServerNotificationEvent
  | MemberAddedEvent
  | MemberRemovedEvent
  | AddedToChatEvent
  | RemovedFromChatEvent
  | NewMessageEvent
  | MessageReadEvent
  | UserStatusEvent
  | ErrorEvent
  | NewChatEvent
  | ChatDeletedEvent
  | ChatUpdatedEvent
  | ChatClearedEvent
  | ChatDescriptionUpdatedEvent
  | MessageDeletedEvent
  | MessageEditedEvent
  | MessageReactionsUpdatedEvent
  | UserBlockedEvent;
export interface MessageEditedEvent {
  type: 'message_edited';
  chat_id: string;
  message_id: string;
  content: string;
  edited_at: string | null;
}

export interface MessageReactionsUpdatedEvent {
  type: 'message_reactions_updated';
  chat_id: string;
  message_id: string;
  reactions: MessageReaction[];
}

export interface UserBlockedEvent {
  type: 'user_blocked';
  user_id: number;
  username: string;
}

export interface MessageDeletedEvent {
  type: 'message_deleted';
  chat_id: string;
  message_id: string;
  deleted_by: number;
}

export interface MemberRoleChangedEvent {
  type: 'member_role_changed';
  chat_id: string;
}

export type ChatSocketEvent =
  | TypingEvent
  | ErrorEvent
  | NewMessageEvent
  | MessageReadEvent
  | MemberRoleChangedEvent
  | ChatDescriptionUpdatedEvent
  | MessageReactionsUpdatedEvent;
