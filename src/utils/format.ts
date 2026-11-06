import type { ChatMember, ChatSummary } from '../types/api';

const timeFormatter = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' });
const dateFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' });
const dayFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

export function formatTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

export function formatListTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay ? timeFormatter.format(date) : dateFormatter.format(date);
}

export function dayKey(iso: string): string {
  return new Date(iso).toDateString();
}

export function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86_400_000);
  if (date.toDateString() === today.toDateString()) return 'Сегодня';
  if (date.toDateString() === yesterday.toDateString()) return 'Вчера';
  return dayFormatter.format(date);
}

export function chatTitle(chat: ChatSummary, contactNames?: Record<number, string>, myId?: number | null): string {
  if (chat.type === 'direct') {
    if (contactNames) {
      const peer = chat.members.find((m) => m.id !== myId) ?? chat.opponent;
      const custom = peer ? contactNames[peer.id] : undefined;
      if (custom) return custom;
    }
    return chat.opponent?.display_name ?? chat.title ?? 'Диалог';
  }
  return chat.title ?? 'Группа';
}

export function opponentOf(chat: ChatSummary, myId: number): ChatMember | null {
  if (chat.type !== 'direct') return null;
  return chat.members.find((member) => member.id !== myId) ?? chat.opponent;
}

export function initialsOf(name: string): string {
  const clean = name.replace(/^\*/, '').trim();
  return clean.slice(0, 2).toUpperCase() || '?';
}
