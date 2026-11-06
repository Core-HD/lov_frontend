import { useState } from 'react';
import { deleteGroup, renameGroup } from '../../services/chatSync';
import { GroupMembersManager } from './GroupMembersManager';
import { GroupDescriptionEditor } from './GroupDescriptionEditor';
import type { ChatMemberWithRole } from '../../types/api';

interface GroupManagePanelProps {
  chatId: string;
  currentTitle: string;
  members: ChatMemberWithRole[];
  onMembersChanged: () => void;
}

export function GroupManagePanel({ chatId, currentTitle, members, onMembersChanged }: GroupManagePanelProps) {
  const [title, setTitle] = useState(currentTitle);
  const [renaming, setRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedTitle = title.trim();
  const canRename = trimmedTitle.length > 0 && trimmedTitle !== currentTitle && !renaming;

  const handleRename = async () => {
    setRenaming(true);
    setRenameError(null);
    try {
      await renameGroup(chatId, trimmedTitle);
    } catch {
      setRenameError('Не удалось переименовать группу. Попробуйте ещё раз.');
    } finally {
      setRenaming(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteGroup(chatId);
    } catch {
      setError('Не удалось удалить группу. Попробуйте ещё раз.');
      setDeleting(false);
    }
  };

  return (
    <>
      <section className="info-panel__section">
        <h4>Название группы</h4>
        <form
          className="group-manage__rename"
          onSubmit={(event) => {
            event.preventDefault();
            if (canRename) void handleRename();
          }}
        >
          <input
            className="field"
            value={title}
            maxLength={64}
            disabled={renaming}
            aria-label="Новое название группы"
            onChange={(event) => setTitle(event.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={!canRename}>
            {renaming ? 'Сохраняем...' : 'Сохранить'}
          </button>
        </form>
        {renameError && <p className="error-text">{renameError}</p>}
      </section>

      <GroupDescriptionEditor chatId={chatId} />

      <GroupMembersManager chatId={chatId} members={members} onMembersChanged={onMembersChanged} />

      <section className="info-panel__section">
        <h4>Удаление группы</h4>
        <p className="muted">Группа будет удалена для всех участников. Это действие нельзя отменить.</p>
        {confirming ? (
          <div className="group-manage__confirm">
            <p>Точно удалить группу?</p>
            <div className="modal-actions">
              <button type="button" className="btn-ghost" disabled={deleting} onClick={() => setConfirming(false)}>
                Отмена
              </button>
              <button type="button" className="btn-danger" disabled={deleting} onClick={() => void handleDelete()}>
                {deleting ? 'Удаляем...' : 'Удалить'}
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn-danger" onClick={() => setConfirming(true)}>
            Удалить группу
          </button>
        )}
        {error && <p className="error-text">{error}</p>}
      </section>
    </>
  );
}
