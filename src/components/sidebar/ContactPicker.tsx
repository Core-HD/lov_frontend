import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Avatar } from '../common/Avatar';
import { contactLabel, type Contact } from '../../services/api/contacts';
import { useContactsStore } from '../../store/contactsStore';
import { useUiStore } from '../../store/uiStore';

interface Props {
  isSelected: (c: Contact) => boolean;
  onToggle: (c: Contact) => void;
  renderExtra?: (c: Contact) => ReactNode;
}

export function ContactPicker({ isSelected, onToggle, renderExtra }: Props) {
  const contacts = useContactsStore((s) => s.contacts);
  const status = useContactsStore((s) => s.status);
  const load = useContactsStore((s) => s.load);
  const setContactsOpen = useUiStore((s) => s.setContactsOpen);
  const [query, setQuery] = useState('');

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => `${contactLabel(c)} ${c.username} ${c.name}`.toLowerCase().includes(q));
  }, [contacts, query]);

  if (status === 'loading') return <p className="empty-hint">Загружаем контакты…</p>;
  if (status === 'error') return <p className="error-text">Не удалось загрузить контакты.</p>;
  if (contacts.length === 0) {
    return (
      <div className="empty-hint">
        <p>У вас пока нет контактов.</p>
        <button type="button" className="btn-primary" onClick={() => setContactsOpen(true)}>Добавить контакт</button>
      </div>
    );
  }

  return (
    <>
      <input className="field" placeholder="Поиск по контактам" value={query} onChange={(e) => setQuery(e.target.value)} />
      <ul className="contact-list">
        {filtered.map((c) => {
          const selected = isSelected(c);
          return (
            <li
              key={c.contactUserId}
              className={`contact-row contact-row--selectable${selected ? ' contact-row--selected' : ''}`}
              onClick={() => onToggle(c)}
              role="option"
              aria-selected={selected}
            >
              <Avatar name={contactLabel(c)} size={34} />
              <div className="contact-row__info">
                <span className="contact-row__name">{contactLabel(c)}</span>
                <span className="contact-row__sub">{c.username}</span>
              </div>
              {selected && renderExtra?.(c)}
            </li>
          );
        })}
        {filtered.length === 0 && <li className="empty-hint">Никого не найдено</li>}
      </ul>
    </>
  );
}
