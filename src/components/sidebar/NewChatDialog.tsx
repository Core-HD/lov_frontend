import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createChatWith, selectChat } from '../../services/chatSync';
import { ApiError } from '../../services/api/client';
import { useUiStore } from '../../store/uiStore';
import { ContactPicker } from './ContactPicker';
import type { Contact } from '../../services/api/contacts';

function describeCreateError(error: unknown): string {
  if (error instanceof ApiError && error.status === 404) return 'Пользователь с таким логином не найден.';
  if (error instanceof ApiError && error.status === 0) return 'Нет связи с сервером. Попробуйте позже.';
  return 'Не удалось создать чат. Попробуйте ещё раз.';
}

export function NewChatDialog() {
  const open = useUiStore((state) => state.newChatOpen);
  const setOpen = useUiStore((state) => state.setNewChatOpen);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setOpen(false);
    setError(null);
    setSelected(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) {
      setError('Выберите контакт.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const chatId = await createChatWith(selected.username);
      close();
      selectChat(chatId);
    } catch (caught) {
      setError(describeCreateError(caught));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.form
            className="glass modal-card"
            role="dialog"
            aria-modal="true"
            aria-label="Новый чат"
            onClick={(event) => event.stopPropagation()}
            onSubmit={handleSubmit}
            noValidate
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <h3>Новый диалог</h3>
            <p className="muted">Выберите собеседника из ваших контактов.</p>
            <ContactPicker
              isSelected={(c) => selected?.contactUserId === c.contactUserId}
              onToggle={(c) => setSelected(c)}
            />
            {error && (
              <p className="error-text" role="alert">
                {error}
              </p>
            )}
            <div className="modal-actions">
              <button type="button" className="btn-ghost" onClick={close}>
                Отмена
              </button>
              <button type="submit" className="btn-primary" disabled={submitting || !selected}>
                {submitting ? 'Создаём...' : 'Начать диалог'}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
