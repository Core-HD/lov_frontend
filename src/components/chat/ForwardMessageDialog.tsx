import { useState } from 'react';
import { motion } from 'framer-motion';
import { forwardChatMessage } from '../../services/chatSync';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { useContactNames } from '../../store/contactsStore';
import { chatTitle } from '../../utils/format';
import type { MessageRead } from '../../types/api';

interface ForwardMessageDialogProps {
  message: MessageRead;
  onClose: () => void;
}

export function ForwardMessageDialog({ message, onClose }: ForwardMessageDialogProps) {
  const allChats = useChatStore((state) => state.chats);
  const chats = allChats.filter((chat) => chat.id !== message.chat_id);
  const myId = useAuthStore((state) => state.user?.id ?? null);
  const contactNames = useContactNames();
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (chatId: string) =>
    setSelected((current) =>
      current.includes(chatId) ? current.filter((id) => id !== chatId) : [...current, chatId],
    );

  const handleForward = async () => {
    if (selected.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      await forwardChatMessage(message, selected);
      onClose();
    } catch {
      setError('Не удалось переслать сообщение. Попробуйте ещё раз.');
      setBusy(false);
    }
  };

  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="glass modal-card"
        role="dialog"
        aria-modal="true"
        aria-label="Переслать сообщение"
        onClick={(event) => event.stopPropagation()}
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <h3>Переслать в чаты</h3>
        <p className="message-actions__preview">{message.content}</p>
        {chats.length === 0 ? (
          <p className="muted">Нет чатов, куда можно переслать.</p>
        ) : (
          <div className="forward-dialog__chats">
            {chats.map((chat) => (
              <label key={chat.id} className="forward-dialog__chat">
                <input
                  type="checkbox"
                  checked={selected.includes(chat.id)}
                  disabled={busy}
                  onChange={() => toggle(chat.id)}
                />
                <span>{chatTitle(chat, contactNames, myId)}</span>
              </label>
            ))}
          </div>
        )}
        {error && <p className="error-text" role="alert">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn-ghost" disabled={busy} onClick={onClose}>
            Отмена
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={busy || selected.length === 0}
            onClick={() => void handleForward()}
          >
            {busy ? 'Пересылаем…' : `Переслать (${selected.length})`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
