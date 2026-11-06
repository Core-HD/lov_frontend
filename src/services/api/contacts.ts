import { apiRequest } from './client';

export interface Contact {
  id: number;
  userId: number;
  contactUserId: number;
  contactName: string | null;
  username: string;
  name: string;
}

export interface ContactCreateInput {
  username?: string;
  email?: string;
  contactName?: string;
}

function parseContact(raw: unknown): Contact | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const cid = Number(r.contact_user_id ?? r.id);
  if (!Number.isFinite(cid) || typeof r.username !== 'string') return null;
  return {
    id: Number(r.id),
    userId: Number(r.user_id),
    contactUserId: cid,
    contactName: typeof r.contact_name === 'string' ? r.contact_name : null,
    username: r.username,
    name: typeof r.name === 'string' ? r.name : r.username,
  };
}

export function contactLabel(contact: Contact): string {
  return contact.contactName || contact.name || contact.username;
}

export async function fetchContacts(token: string): Promise<Contact[]> {
  const payload = await apiRequest('/api/v1/contacts/', { token });
  const list = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray((payload as { contacts?: unknown }).contacts)
      ? (payload as { contacts: unknown[] }).contacts
      : [];
  return list.map(parseContact).filter((c): c is Contact => c !== null);
}

export async function createContact(token: string, input: ContactCreateInput): Promise<void> {
  await apiRequest('/api/v1/contacts/create', {
    method: 'POST',
    token,
    body: {
      ...(input.username ? { username: input.username } : {}),
      ...(input.email ? { email: input.email } : {}),
      ...(input.contactName ? { contact_name: input.contactName } : {}),
    },
  });
}

export async function renameContact(token: string, contactUserId: number, contactName: string): Promise<void> {
  await apiRequest(`/api/v1/contacts/${contactUserId}/rename`, {
    method: 'PATCH',
    token,
    body: { contact_name: contactName },
  });
}

export async function deleteContact(token: string, contactUserId: number): Promise<void> {
  await apiRequest(`/api/v1/contacts/${contactUserId}`, { method: 'DELETE', token });
}
