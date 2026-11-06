import { motion } from 'framer-motion';
import { Avatar } from '../common/Avatar';
import type { MessageRead } from '../../types/api';

interface ReactionsDialogProps {
  reactions: MessageRead['reactions'];
  myId: number;
  nameOf: (userId: number) => string;
  onOpenProfile: (userId: number) => void;
  onRemoveMine: (emoji: string) => void;
  onClose: () => void;
}

export function ReactionsDialog({ reactions, myId, nameOf, onOpenProfile, onRemoveMine, onClose }: ReactionsDialogProps) {
  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className="glass modal-card"
        role="dialog"
        aria-modal="true"
        aria-label="Кто поставил реакцию"
        onClick={(event) => event.stopPropagation()}
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <h3>Реакции</h3>
        <ul className="contact-list">
          {reactions.map((reaction) => {
            const name = nameOf(reaction.user_id);
            const mine = reaction.user_id === myId;
            return (
              <li key={`${reaction.user_id}-${reaction.emoji}`} className="contact-row">
                <Avatar name={name} size={34} />
                <div className="contact-row__info">
                  <button type="button" className="link-button contact-row__name" onClick={() => onOpenProfile(reaction.user_id)}>
                    {name}
                  </button>
                  <span className="contact-row__sub">{mine ? 'Вы' : ''}</span>
                </div>
                <span className="reaction-dialog__emoji">{reaction.emoji}</span>
                {mine && (
                  <div className="contact-row__actions">
                    <button type="button" className="icon-btn icon-btn--danger" onClick={() => onRemoveMine(reaction.emoji)}>
                      Убрать
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
