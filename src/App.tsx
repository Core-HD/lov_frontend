import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { JungleBackground } from './components/jungle/JungleBackground';
import { ChatList } from './components/sidebar/ChatList';
import { ChatWindow } from './components/chat/ChatWindow';
import { RightPanel } from './components/profile/RightPanel';
import { ProfileDialog } from './components/profile/ProfileDialog';
import { MemberProfileDialog } from './components/profile/MemberProfileDialog';
import { NewGroupDialog } from './components/sidebar/NewGroupDialog';
import { NewChatDialog } from './components/sidebar/NewChatDialog';
import { ContactsDialog } from './components/sidebar/ContactsDialog';
import { StatusScreen } from './components/common/StatusScreen';
import { AuthPage } from './pages/AuthPage';
import { useRealtimeSync } from './hooks/useRealtimeSync';
import { usePresenceHeartbeat } from './hooks/usePresenceHeartbeat';
import { useAuthStore } from './store/authStore';
import { useContactsStore } from './store/contactsStore';

export default function App() {
  const status = useAuthStore((state) => state.status);
  const token = useAuthStore((state) => state.token);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const errorMessage = useAuthStore((state) => state.errorMessage);
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (status === 'authenticated') void useContactsStore.getState().load();
  }, [status, userId]);

  useRealtimeSync(status === 'authenticated' ? userId : null, token);
  usePresenceHeartbeat(status === 'authenticated' ? userId : null);

  return (
    <>
      <JungleBackground />
      <AnimatePresence mode="wait">
        {status === 'checking' && (
          <motion.div key="checking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <StatusScreen mode="loading" />
          </motion.div>
        )}
        {status === 'error' && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <StatusScreen mode="error" message={errorMessage ?? undefined} onRetry={() => void restoreSession()} />
          </motion.div>
        )}
        {status === 'anonymous' && (
          <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AuthPage />
          </motion.div>
        )}
        {status === 'authenticated' && (
          <motion.div
            key="app"
            className="app-shell"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <ChatList />
            <ChatWindow />
            <RightPanel />
          </motion.div>
        )}
      </AnimatePresence>
      {status === 'authenticated' && (
        <>
          <NewChatDialog />
          <NewGroupDialog />
          <ContactsDialog />
          <ProfileDialog />
          <MemberProfileDialog />
        </>
      )}
    </>
  );
}
