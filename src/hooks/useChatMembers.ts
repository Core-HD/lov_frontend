import { useEffect, useState } from 'react';
import { fetchChatMembers } from '../services/api/chats';
import { useAuthStore } from '../store/authStore';
import type { ChatMemberWithRole } from '../types/api';

interface ChatMembersState {
  members: ChatMemberWithRole[] | null;
  failed: boolean;
}

interface LoadedMembers extends ChatMembersState {
  chatId: string;
}

export function useChatMembers(chatId: string | null, refreshKey = ''): ChatMembersState {
  const token = useAuthStore((state) => state.token);
  const [loaded, setLoaded] = useState<LoadedMembers | null>(null);

  useEffect(() => {
    if (!chatId || !token) return;
    let cancelled = false;
    fetchChatMembers(token, chatId)
      .then((members) => {
        if (!cancelled) setLoaded({ chatId, members, failed: false });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ chatId, members: null, failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [chatId, token, refreshKey]);

  if (!chatId || !loaded || loaded.chatId !== chatId) return { members: null, failed: false };
  return { members: loaded.members, failed: loaded.failed };
}
