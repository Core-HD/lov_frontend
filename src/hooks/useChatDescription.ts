import { useEffect, useState } from 'react';
import { fetchChatDescription } from '../services/api/chats';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';

interface LoadedDescription {
  chatId: string;
  description: string | null;
  failed: boolean;
}

interface ChatDescriptionState {
  loading: boolean;
  description: string | null;
  failed: boolean;
}

export function useChatDescription(chatId: string | null): ChatDescriptionState {
  const token = useAuthStore((state) => state.token);
  const override = useChatStore((state) => (chatId ? state.descriptionByChat[chatId] : undefined));
  const [loaded, setLoaded] = useState<LoadedDescription | null>(null);

  useEffect(() => {
    if (!chatId || !token) return;
    let cancelled = false;
    fetchChatDescription(token, chatId)
      .then((description) => {
        if (!cancelled) setLoaded({ chatId, description, failed: false });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ chatId, description: null, failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [chatId, token]);

  if (!chatId) return { loading: false, description: null, failed: false };
  if (override !== undefined) return { loading: false, description: override, failed: false };
  if (!loaded || loaded.chatId !== chatId) return { loading: true, description: null, failed: false };
  return { loading: false, description: loaded.description, failed: loaded.failed };
}
