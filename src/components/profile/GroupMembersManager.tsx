import { useState, type FormEvent } from 'react';
import { addMember, changeMemberRole, removeMember } from '../../services/chatSync';
import { ApiError } from '../../services/api/client';
import { useAuthStore } from '../../store/authStore';
import type { ChatMemberWithRole, ChatRole } from '../../types/api';

interface GroupMembersManagerProps {
  chatId: string;
  members: ChatMemberWithRole[];
  onMembersChanged: () => void;
}

function describeError(error: unknown): string {
  if (error instanceof ApiError && error.status === 404) return 'Пользователь не найден.';
  if (error instanceof ApiError && error.status === 409) return 'Этот пользователь уже в группе.';
  return 'Не удалось выполнить действие. Попробуйте ещё раз.';
}

export function GroupMembersManager({ chatId, members, onMembersChanged }: GroupMembersManagerProps) {
  const myId = useAuthStore((state) => state.user?.id ?? null);
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<void>): Promise<boolean> => {
    setBusy(true);
    setError(null);
    try {
      await action();
      return true;
    } catch (caught) {
      setError(describeError(caught));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = username.trim();
    if (trimmed.length === 0) {
      setError('Введите логин пользователя.');
      return;
    }
    const normalized = trimmed.startsWith('*') ? trimmed : `*${trimmed}`;
    if (await run(() => addMember(chatId, normalized))) setUsername('');
  };

  const handleRemove = (member: ChatMemberWithRole) => {
    if (!window.confirm(`Удалить ${member.name} из группы?`)) return;
    void run(() => removeMember(chatId, member.username));
  };

  const handleRoleChange = (member: ChatMemberWithRole, role: ChatRole) => {
    void run(async () => {
      await changeMemberRole(chatId, member.username, role);
      onMembersChanged();
    });
  };

  const removable = members.filter((member) => member.id !== myId && member.role !== 'OWNER');

  return (
    <section className="info-panel__section">
      <h4>Участники</h4>
      <form className="group-manage__rename" onSubmit={handleAdd} noValidate>
        <input
          className="field"
          placeholder="*login"
          value={username}
          disabled={busy}
          aria-label="Логин нового участника"
          onChange={(event) => setUsername(event.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Добавляем...' : 'Добавить'}
        </button>
      </form>
      {error && <p className="error-text">{error}</p>}
      <ul className="info-panel__members">
        {removable.map((member) => (
          <li key={member.id}>
            <div>
              <span className="info-panel__member-name">{member.name}</span>
              <span className="muted">@{member.username}</span>
            </div>
            <select
              className="field group-manage__role"
              value={member.role}
              disabled={busy}
              aria-label={`Роль ${member.name}`}
              onChange={(event) => handleRoleChange(member, event.target.value === 'ADMIN' ? 'ADMIN' : 'USER')}
            >
              <option value="USER">Участник</option>
              <option value="ADMIN">Админ</option>
            </select>
            <button type="button" className="icon-btn icon-btn--danger" disabled={busy} onClick={() => handleRemove(member)}>
              Удалить
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
