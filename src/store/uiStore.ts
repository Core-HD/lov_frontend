import { create } from 'zustand';
import type { ChatMember } from '../types/api';

interface UiState {
  rightPanelOpen: boolean;
  newChatOpen: boolean;
  newGroupOpen: boolean;
  contactsOpen: boolean;
  setContactsOpen: (open: boolean) => void;
  profileOpen: boolean;
  memberProfile: ChatMember | null;
  toggleRightPanel: () => void;
  setRightPanelOpen: (open: boolean) => void;
  setNewChatOpen: (open: boolean) => void;
  setNewGroupOpen: (open: boolean) => void;
  setProfileOpen: (open: boolean) => void;
  setMemberProfile: (member: ChatMember | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  rightPanelOpen: false,
  newChatOpen: false,
  newGroupOpen: false,
  contactsOpen: false,
  setContactsOpen: (open) => set({ contactsOpen: open }),
  profileOpen: false,
  memberProfile: null,
  toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
  setNewChatOpen: (open) => set({ newChatOpen: open }),
  setNewGroupOpen: (open) => set({ newGroupOpen: open }),
  setProfileOpen: (open) => set({ profileOpen: open }),
  setMemberProfile: (member) => set({ memberProfile: member }),
}));
