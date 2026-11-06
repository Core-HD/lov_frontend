import { apiRequest } from './client';

export interface MyProfile {
  bio: string;
  birthday: string | null;
  email: string;
  name: string;
  username: string;
}

export type ProfileField = 'bio' | 'birthday' | 'name' | 'username';

export interface UserProfile {
  name: string;
  username: string;
  bio: string | null;
  birthday: string | null;
  email: string | null;
}

function toUserProfile(payload: unknown): UserProfile {
  if (typeof payload !== 'object' || payload === null) throw new Error('INVALID_PROFILE');
  const record = payload as Record<string, unknown>;
  if (typeof record.name !== 'string' || typeof record.username !== 'string') throw new Error('INVALID_PROFILE');
  return {
    name: record.name,
    username: record.username,
    bio: typeof record.bio === 'string' ? record.bio : null,
    birthday: typeof record.birthday === 'string' ? record.birthday : null,
    email: typeof record.email === 'string' ? record.email : null,
  };
}

export async function fetchUserProfile(username: string, token: string | null): Promise<UserProfile> {
  const payload = await apiRequest(`/api/v1/profile/${encodeURIComponent(username)}`, { token });
  return toUserProfile(payload);
}

export async function fetchMyProfile(token: string | null): Promise<MyProfile> {
  return (await apiRequest('/api/v1/profile/me', { token })) as MyProfile;
}

export async function updateProfileField(
  field: ProfileField,
  value: string | null,
  token: string | null,
): Promise<void> {
  const path = field === 'bio' || field === 'birthday' ? '/api/v1/profile/edit' : '/api/v1/users/me';
  await apiRequest(path, { method: 'PATCH', body: { [field]: value }, token });
}
