import { useEffect, useState } from 'react';
import { ApiError } from '../../services/api/client';
import {
  fetchPrivacySettings,
  updatePrivacySetting,
  type PrivacyField,
  type PrivacySettings,
  type PrivacyVisibility,
} from '../../services/api/settings';

const PRIVACY_ROWS: { field: PrivacyField; label: string }[] = [
  { field: 'is_bio_hidden', label: 'Кто видит «О себе»' },
  { field: 'is_birthday_hidden', label: 'Кто видит день рождения' },
  { field: 'is_email_hidden', label: 'Кто видит email' },
];

const VISIBILITY_OPTIONS: { value: PrivacyVisibility; label: string }[] = [
  { value: 'nobody', label: 'Никто' },
  { value: 'only_contacts', label: 'Контакты' },
  { value: 'everyone', label: 'Все' },
];

export function PrivacySettingsPanel({ token }: { token: string | null }) {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pendingField, setPendingField] = useState<PrivacyField | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPrivacySettings(token)
      .then((data) => {
        if (!cancelled) setSettings(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError('Не удалось загрузить настройки');
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const choose = async (field: PrivacyField, value: PrivacyVisibility) => {
    if (!settings || settings[field] === value) return;
    const previous = settings[field];
    setSaveError(null);
    setPendingField(field);
    setSettings((current) => (current ? { ...current, [field]: value } : current));
    try {
      await updatePrivacySetting(field, value, token);
    } catch (e) {
      setSettings((current) => (current ? { ...current, [field]: previous } : current));
      setSaveError(e instanceof ApiError ? `Ошибка: ${e.code}` : 'Не удалось сохранить настройку');
    } finally {
      setPendingField(null);
    }
  };

  if (loadError) return <p className="field-error">{loadError}</p>;
  if (!settings) return <p className="muted">Загрузка...</p>;

  return (
    <div className="privacy-settings">
      {PRIVACY_ROWS.map(({ field, label }) => (
        <div key={field} className="privacy-row">
          <span className="privacy-row__label">{label}</span>
          <div className="privacy-options" role="radiogroup" aria-label={label}>
            {VISIBILITY_OPTIONS.map((option) => {
              const active = settings[field] === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={pendingField === field}
                  className={`privacy-option${active ? ' privacy-option--active' : ''}`}
                  onClick={() => void choose(field, option.value)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {saveError && <p className="privacy-settings__error">{saveError}</p>}
    </div>
  );
}
