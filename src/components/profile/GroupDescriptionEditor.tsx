import { useState } from 'react';
import { useChatDescription } from '../../hooks/useChatDescription';
import { changeChatDescription } from '../../services/chatSync';

interface GroupDescriptionEditorProps {
  chatId: string;
}

export function GroupDescriptionEditor({ chatId }: GroupDescriptionEditorProps) {
  const { loading, description, failed } = useChatDescription(chatId);
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  const current = description ?? '';
  const value = draft ?? current;
  const trimmed = value.trim();
  const canSave = !saving && !loading && trimmed !== current.trim();

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await changeChatDescription(chatId, trimmed);
      setDraft(null);
      setSavedNotice(true);
    } catch {
      setError('Не удалось сохранить описание. Попробуйте ещё раз.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="info-panel__section">
      <h4>Описание</h4>
      {loading ? (
        <p className="muted">Загружаем…</p>
      ) : (
        <form
          className="group-manage__description"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSave) void handleSave();
          }}
        >
          <textarea
            className="field"
            rows={3}
            value={value}
            disabled={saving}
            aria-label="Описание группы"
            placeholder="Расскажите, о чём эта группа"
            onChange={(event) => {
              setDraft(event.target.value);
              setSavedNotice(false);
            }}
          />
          <button type="submit" className="btn-primary" disabled={!canSave}>
            {saving ? 'Сохраняем...' : 'Сохранить описание'}
          </button>
        </form>
      )}
      {failed && <p className="muted">Не удалось загрузить текущее описание.</p>}
      {savedNotice && <p className="muted" role="status">Описание сохранено.</p>}
      {error && <p className="error-text">{error}</p>}
    </section>
  );
}
