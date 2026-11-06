import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { fetchContacts, type Contact } from '../services/api/contacts';
import { useAuthStore } from './authStore';

interface ContactsState {
  contacts: Contact[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  load: () => Promise<void>;
}

export function contactsToken(): string {
  const value = useAuthStore.getState().token;
  if (!value) throw new Error('Not authenticated');
  return value;
}

export const useContactsStore = create<ContactsState>((set) => ({
  contacts: [],
  status: 'idle',
  load: async () => {
    set((s) => ({ status: s.contacts.length ? s.status : 'loading' }));
    try {
      const contacts = await fetchContacts(contactsToken());
      set({ contacts, status: 'ready' });
    } catch {
      set({ status: 'error' });
    }
  },
}));

/** Map contact user id -> custom contact name (only contacts with a name set). */
export function useContactNames(): Record<number, string> {
  return useContactsStore(
    useShallow((s) => {
      const map: Record<number, string> = {};
      for (const c of s.contacts) if (c.contactName) map[c.contactUserId] = c.contactName;
      return map;
    }),
  );
}
