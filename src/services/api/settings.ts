import { apiRequest } from './client';

export type PrivacyVisibility = 'nobody' | 'only_contacts' | 'everyone';

export type PrivacyField = 'is_bio_hidden' | 'is_birthday_hidden' | 'is_email_hidden';

export interface PrivacySettings {
  name: string;
  username: string;
  is_bio_hidden: PrivacyVisibility;
  is_birthday_hidden: PrivacyVisibility;
  is_email_hidden: PrivacyVisibility;
}

const VISIBILITY_VALUES: readonly PrivacyVisibility[] = ['nobody', 'only_contacts', 'everyone'];
const PRIVACY_FIELDS: readonly PrivacyField[] = ['is_bio_hidden', 'is_birthday_hidden', 'is_email_hidden'];

function isVisibility(value: unknown): value is PrivacyVisibility {
  return typeof value === 'string' && (VISIBILITY_VALUES as readonly string[]).includes(value);
}

function isPrivacySettings(payload: unknown): payload is PrivacySettings {
  if (typeof payload !== 'object' || payload === null) return false;
  const record = payload as Record<string, unknown>;
  return (
    typeof record.name === 'string' &&
    typeof record.username === 'string' &&
    PRIVACY_FIELDS.every((field) => isVisibility(record[field]))
  );
}

export async function fetchPrivacySettings(token: string | null): Promise<PrivacySettings> {
  const payload = await apiRequest('/api/v1/settings/privacy-get', { token });
  if (!isPrivacySettings(payload)) throw new Error('INVALID_PRIVACY_SETTINGS');
  return payload;
}

export async function updatePrivacySetting(
  field: PrivacyField,
  value: PrivacyVisibility,
  token: string | null,
): Promise<void> {
  await apiRequest('/api/v1/settings/privacy-update', { method: 'PATCH', body: { [field]: value }, token });
}
