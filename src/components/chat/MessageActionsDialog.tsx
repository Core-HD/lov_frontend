import { useState } from 'react';
import { motion } from 'framer-motion';
import { changeChatMessage, deleteChatMessage, MAX_MESSAGE_LENGTH } from '../../services/chatSync';
import type { MessageRead } from '../../types/api';

interface MessageActionsDialogProps {
  message: MessageRead;
  canEdit: boolean;
  canDelete: boolean;
  onClose: () => void;
  onForward: () => void;
  onReply: () => void;
  onReact: () => void;
}

export function MessageActionsDialog({ message, canEdit, canDelete, onClose, onForward, onReply, onReact }: MessageActionsDialogProps) {
  const [mode, setMode] = useState<'menu' | 'edit'>('menu');
  const [draft, setDraft] = useState(message.content);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = draft.trim();
  const canSaveEdit = !busy && trimmed.length > 0 && trimmed !== message.content;

  const run = async (action: () => Promise<void>, failure: string) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      onClose();
    } catch {
      setError(failure);
      setBusy(false);
    }
  };

  const startEdit = () => {
    setDraft(message.content);
    setError(null);
    setMode('edit');
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
        aria-label="Действия с сообщением"
        onClick={(event) => event.stopPropagation()}
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {mode === 'menu' ? (
          <>
            <h3>Сообщение</h3>
            <p className="message-actions__preview">{message.content}</p>
            {error && <p className="error-text" role="alert">{error}</p>}
            <div className="message-actions__list">
              <button type="button" className="message-actions__item" onClick={onReact}>
                Реакция
              </button>
              <button type="button" className="message-actions__item" onClick={onReply}>
                Ответить
              </button>
              <button type="button" className="message-actions__item" onClick={onForward}>
                Переслать
              </button>
              {canEdit && (
                <button type="button" className="message-actions__item" onClick={startEdit}>
                  Изменить
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  className="message-actions__item message-actions__item--danger"
                  disabled={busy}
                  onClick={() =>
                    void run(() => deleteChatMessage(message.chat_id, message.id), 'Не удалось удалить сообщение. Попробуйте ещё раз.')
                  }
                >
                  {busy ? 'Удаляем…' : 'Удалить'}
                </button>
              )}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-ghost" disabled={busy} onClick={onClose}>
                Закрыть
              </button>
            </div>
          </>
        ) : (
          <>
            <h3>Изменить сообщение</h3>
            <textarea
              className="field message-actions__edit"
              rows={4}
              maxLength={MAX_MESSAGE_LENGTH}
              value={draft}
              disabled={busy}
              aria-label="Текст сообщения"
              onChange={(event) => setDraft(event.target.value)}
            />
            {error && <p className="error-text" role="alert">{error}</p>}
            <div className="modal-actions">
              <button type="button" className="btn-ghost" disabled={busy} onClick={() => setMode('menu')}>
                Назад
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={!canSaveEdit}
                onClick={() =>
                  void run(() => changeChatMessage(message.chat_id, message.id, trimmed), 'Не удалось изменить сообщение. Попробуйте ещё раз.')
                }
              >
                {busy ? 'Сохраняем…' : 'Сохранить'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
