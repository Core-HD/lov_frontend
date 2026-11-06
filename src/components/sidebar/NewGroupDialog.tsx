import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createGroupWith, selectChat } from '../../services/chatSync';
import { ApiError } from '../../services/api/client';
import { useUiStore } from '../../store/uiStore';
import { ContactPicker } from './ContactPicker';

function describeCreateError(error: unknown): string {
  if (error instanceof ApiError && error.status === 404) return 'Один из пользователей не найден.';
  if (error instanceof ApiError && error.status === 0) return 'Нет связи с сервером. Попробуйте позже.';
  return 'Не удалось создать группу. Попробуйте ещё раз.';
}

export function NewGroupDialog() {
  const open = useUiStore((state) => state.newGroupOpen);
  const setOpen = useUiStore((state) => state.setNewGroupOpen);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [roles, setRoles] = useState<Record<string, 'member' | 'admin'>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle('');
    setDescription('');
    setRoles({});
    setError(null);
  };

  const close = () => {
    setOpen(false);
    reset();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      setError('Укажите название группы.');
      return;
    }
    const entries = Object.entries(roles);
    if (entries.length === 0) {
      setError('Выберите хотя бы одного участника.');
      return;
    }
    const members = entries.filter(([, r]) => r === 'member').map(([u]) => u);
    const admins = entries.filter(([, r]) => r === 'admin').map(([u]) => u);
    setSubmitting(true);
    setError(null);
    try {
      const chatId = await createGroupWith({
        title: trimmedTitle,
        description: description.trim(),
        memberUsernames: members,
        adminUsernames: admins,
      });
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
            aria-label="Новая группа"
            onClick={(event) => event.stopPropagation()}
            onSubmit={handleSubmit}
            noValidate
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <h3>Новая группа</h3>
            <label className="field-label" htmlFor="group-title">Название</label>
            <input
              id="group-title"
              className="field"
              value={title}
              maxLength={80}
              autoFocus
              onChange={(event) => setTitle(event.target.value)}
            />
            <label className="field-label" htmlFor="group-description">Описание (необязательно)</label>
            <textarea
              id="group-description"
              className="field"
              rows={2}
              value={description}
              maxLength={500}
              onChange={(event) => setDescription(event.target.value)}
            />
            <span className="field-label">Участники · выбрано {Object.values(roles).filter((r) => r === 'member').length}</span>
            <ContactPicker
              isSelected={(c) => roles[c.username] === 'member'}
              onToggle={(c) =>
                setRoles((prev) => {
                  const next = { ...prev };
                  if (next[c.username] === 'member') delete next[c.username];
                  else next[c.username] = 'member';
                  return next;
                })
              }
            />
            <span className="field-label">Администраторы · выбрано {Object.values(roles).filter((r) => r === 'admin').length}</span>
            <ContactPicker
              isSelected={(c) => roles[c.username] === 'admin'}
              onToggle={(c) =>
                setRoles((prev) => {
                  const next = { ...prev };
                  if (next[c.username] === 'admin') delete next[c.username];
                  else next[c.username] = 'admin';
                  return next;
                })
              }
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
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Создаём...' : 'Создать группу'}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
