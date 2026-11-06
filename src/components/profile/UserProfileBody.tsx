import { Fragment } from 'react';
import { Avatar } from '../common/Avatar';
import { useUserProfile } from '../../hooks/useUserProfile';
import type { UserProfile } from '../../services/api/profile';
import type { UserStatus } from '../../types/api';

interface DetailRow {
  label: string;
  value: string;
}

function formatBirthday(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : value;
}

function profileRows(profile: UserProfile): DetailRow[] {
  const rows: DetailRow[] = [];
  if (profile.email) rows.push({ label: 'Email', value: profile.email });
  if (profile.bio) rows.push({ label: 'О себе', value: profile.bio });
  if (profile.birthday) rows.push({ label: 'День рождения', value: formatBirthday(profile.birthday) });
  return rows;
}

interface UserProfileBodyProps {
  username: string;
  fallbackName: string;
  status?: UserStatus | null;
}

export function UserProfileBody({ username, fallbackName, status = null }: UserProfileBodyProps) {
  const { profile, error } = useUserProfile(username);
  const name = profile?.name ?? fallbackName;
  const rows = profile ? profileRows(profile) : [];

  return (
    <>
      <div className="profile-dialog__hero">
        <Avatar name={name} size={72} status={status} />
        <h3>{name}</h3>
        <span className="muted">@{username}</span>
      </div>

      {error && <p className="field-error">{error}</p>}
      {!profile && !error && <p className="muted">Загрузка...</p>}
      {rows.length > 0 && (
        <dl className="profile-dialog__details">
          {rows.map((row) => (
            <Fragment key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </Fragment>
          ))}
        </dl>
      )}
    </>
  );
}
