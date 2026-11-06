import { useEffect, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Avatar } from '../common/Avatar';
import { ApiError } from '../../services/api/client';
import { contactLabel, createContact, deleteContact, renameContact, type Contact } from '../../services/api/contacts';
import { contactsToken, useContactsStore } from '../../store/contactsStore';
import { useUiStore } from '../../store/uiStore';

export function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) return 'Пользователь не найден.';
    if (error.status === 409 || error.status === 400) return 'Такой контакт уже есть или данные неверны.';
    if (error.status === 422) return 'Проверьте поля: имя контакта — от 1 до 16 символов.';
    if (error.status === 0) return 'Нет связи с сервером.';
  }
  return 'Не удалось выполнить действие.';
}

export function ContactsDialog() {
  const open = useUiStore((s) => s.contactsOpen);
  const setOpen = useUiStore((s) => s.setContactsOpen);
  const contacts = useContactsStore((s) => s.contacts);
  const status = useContactsStore((s) => s.status);
  const load = useContactsStore((s) => s.load);

  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => { if (open) void load(); }, [open, load]);

  const close = () => { setOpen(false); setError(null); setEditingId(null); };

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try { await action(); await load(); return true; }
    catch (e) { setError(describeError(e)); return false; }
    finally { setBusy(false); }
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    const id = identifier.trim();
    if (!id) { setError('Введите логин (*name) или email.'); return; }
    const isEmail = id.includes('@');
    const username = isEmail ? undefined : id.startsWith('*') ? id : `*${id}`;
    const ok = await run(() => createContact(contactsToken(), {
      username, email: isEmail ? id : undefined, contactName: name.trim() || undefined,
    }));
    if (ok) { setIdentifier(''); setName(''); }
  };

  const startEdit = (c: Contact) => { setEditingId(c.contactUserId); setEditName(contactLabel(c)); };

  const saveEdit = async (c: Contact) => {
    const n = editName.trim();
    if (!n || n.length > 16) { setError('Имя — от 1 до 16 символов.'); return; }
    const ok = await run(() => renameContact(contactsToken(), c.contactUserId, n));
    if (ok) setEditingId(null);
  };

  const remove = async (c: Contact) => {
    if (!window.confirm(`Удалить контакт «${contactLabel(c)}»?`)) return;
    await run(() => deleteContact(contactsToken(), c.contactUserId));
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
          <motion.div
            className="glass modal-card"
            role="dialog"
            aria-modal="true"
            aria-label="Контакты"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <h3>Контакты</h3>
            <form className="contact-form" onSubmit={handleCreate} noValidate>
              <span className="field-label">Новый контакт</span>
              <div className="contact-form__row">
                <input className="field" placeholder="*login или email" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
                <input className="field" placeholder="Имя (необяз.)" maxLength={16} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Сохраняем…' : '+ Создать контакт'}</button>
            </form>
            {error && <p className="error-text" role="alert">{error}</p>}

            {status === 'loading' && <p className="empty-hint">Загружаем…</p>}
            {status !== 'loading' && contacts.length === 0 && <p className="empty-hint">Контактов пока нет.</p>}
            <ul className="contact-list">
              {contacts.map((c) => (
                <li key={c.contactUserId} className="contact-row">
                  <Avatar name={contactLabel(c)} size={34} />
                  {editingId === c.contactUserId ? (
                    <>
                      <input
                        className="field"
                        value={editName}
                        maxLength={16}
                        autoFocus
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') void saveEdit(c); if (e.key === 'Escape') setEditingId(null); }}
                      />
                      <div className="contact-row__actions">
                        <button type="button" className="icon-btn" disabled={busy} onClick={() => void saveEdit(c)}>✓</button>
                        <button type="button" className="icon-btn" onClick={() => setEditingId(null)}>✕</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="contact-row__info">
                        <span className="contact-row__name">{contactLabel(c)}</span>
                        <span className="contact-row__sub">{c.username}{c.contactName ? ` · ${c.name}` : ''}</span>
                      </div>
                      <div className="contact-row__actions">
                        <button type="button" className="icon-btn" title="Переименовать" onClick={() => startEdit(c)}>Переименовать</button>
                        <button type="button" className="icon-btn icon-btn--danger" title="Удалить" disabled={busy} onClick={() => void remove(c)}>Удалить</button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
            <div className="modal-actions">
              <button type="button" className="btn-ghost" onClick={close}>Закрыть</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
