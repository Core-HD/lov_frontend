import { AnimatePresence, motion } from 'framer-motion';
import { useUiStore } from '../../store/uiStore';
import { UserProfileBody } from './UserProfileBody';

export function MemberProfileDialog() {
  const member = useUiStore((state) => state.memberProfile);
  const setMember = useUiStore((state) => state.setMemberProfile);
  const close = () => setMember(null);

  return (
    <AnimatePresence>
      {member && (
        <motion.div
          key={member.id}
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
            aria-label="Профиль участника"
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <UserProfileBody username={member.username} fallbackName={member.name} />

            <div className="modal-actions">
              <button type="button" className="btn-ghost" onClick={close}>
                Закрыть
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
