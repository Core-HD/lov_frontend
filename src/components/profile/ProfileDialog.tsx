import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Avatar } from '../common/Avatar';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { ApiError } from '../../services/api/client';
import { fetchMyProfile, updateProfileField, type MyProfile, type ProfileField } from '../../services/api/profile';
import { PrivacySettingsPanel } from './PrivacySettingsPanel';

type ProfileTab = 'profile' | 'settings';

const PROFILE_TABS: { value: ProfileTab; label: string }[] = [
  { value: 'profile', label: 'Профиль' },
  { value: 'settings', label: 'Настройки' },
];

const CLEARABLE_FIELDS: ProfileField[] = ['bio', 'birthday'];

const FIELD_LABELS: Record<ProfileField, string> = {
  name: 'Имя',
  username: 'Username',
  bio: 'О себе',
  birthday: 'День рождения',
};

function EditableRow({
  field,
  value,
  onSave,
}: {
  field: ProfileField;
  value: string | null;
  onSave: (field: ProfileField, value: string | null) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = () => {
    setDraft(value ?? '');
    setError(null);
    setEditing(true);
  };

  const persist = async (next: string | null) => {
    setSaving(true);
    setError(null);
    try {
      await onSave(field, next);
      setEditing(false);
    } catch (e) {
      setError(e instanceof ApiError ? `Ошибка: ${e.code}` : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  const save = () => persist(field === 'birthday' && draft === '' ? null : draft);

  const clear = () => persist(field === 'birthday' ? null : '');

  return (
    <>
      <dt>{FIELD_LABELS[field]}</dt>
      <dd>
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {field === 'bio' ? (
              <textarea className="field" rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} />
            ) : (
              <input
                className="field"
                type={field === 'birthday' ? 'date' : 'text'}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            )}
            {error && <span className="field-error">{error}</span>}
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" className="btn-primary" onClick={() => void save()} disabled={saving}>
                {saving ? 'Сохраняем...' : 'Сохранить'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setEditing(false)} disabled={saving}>
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span>{value ? value : <span className="muted">не указано</span>}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {CLEARABLE_FIELDS.includes(field) && value && (
                  <button type="button" className="btn-ghost" onClick={() => void clear()} disabled={saving}>
                    Очистить
                  </button>
                )}
                <button type="button" className="btn-ghost" onClick={start} disabled={saving}>
                  Изменить
                </button>
              </div>
            </div>
            {error && <span className="field-error">{error}</span>}
          </div>
        )}
      </dd>
    </>
  );
}

export function ProfileDialog() {
  const open = useUiStore((state) => state.profileOpen);
  const setOpen = useUiStore((state) => state.setProfileOpen);
  const token = useAuthStore((state) => state.token);
  const signOut = useAuthStore((state) => state.signOut);
  const [signingOut, setSigningOut] = useState(false);
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<ProfileTab>('profile');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadError(null);
    fetchMyProfile(token)
      .then((p) => !cancelled && setProfile(p))
      .catch(() => !cancelled && setLoadError('Не удалось загрузить профиль'));
    return () => {
      cancelled = true;
    };
  }, [open, token]);

  const close = () => {
    setTab('profile');
    setOpen(false);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
    close();
  };

  const handleSave = async (field: ProfileField, value: string | null) => {
    await updateProfileField(field, value, token);
    setProfile((p) => (p ? { ...p, [field]: value ?? (field === 'bio' ? '' : null) } : p));
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="own-profile"
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="glass modal-card"
            role="dialog"
            aria-modal="true"
            aria-label="Мой профиль"
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="profile-tabs" role="tablist">
              {PROFILE_TABS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.value}
                  className={`profile-tab${tab === item.value ? ' profile-tab--active' : ''}`}
                  onClick={() => setTab(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {tab === 'profile' && (
              <>
                {loadError && <p className="field-error">{loadError}</p>}
                {!profile && !loadError && <p className="muted">Загрузка...</p>}
                {profile && (
                  <>
                    <div className="profile-dialog__hero">
                      <Avatar name={profile.name || '?'} size={72} />
                      <h3>{profile.name}</h3>
                      <span className="muted">@{profile.username}</span>
                    </div>
                    <dl className="profile-dialog__details">
                      <dt>Email</dt>
                      <dd>{profile.email}</dd>
                      <EditableRow field="name" value={profile.name} onSave={handleSave} />
                      <EditableRow field="username" value={profile.username} onSave={handleSave} />
                      <EditableRow field="bio" value={profile.bio} onSave={handleSave} />
                      <EditableRow field="birthday" value={profile.birthday} onSave={handleSave} />
                    </dl>
                  </>
                )}
              </>
            )}
            {tab === 'settings' && <PrivacySettingsPanel token={token} />}
            <div className="modal-actions">
              <button type="button" className="btn-ghost" onClick={close}>
                Закрыть
              </button>
              <button type="button" className="btn-primary" onClick={() => void handleSignOut()} disabled={signingOut}>
                {signingOut ? 'Выходим...' : 'Выйти из аккаунта'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
