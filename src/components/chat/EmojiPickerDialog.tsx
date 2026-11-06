import { motion } from 'framer-motion';
import { EMOJI_CHOICES } from '../../utils/emoji';

interface EmojiPickerDialogProps {
  currentEmoji: string | null;
  onPick: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPickerDialog({ currentEmoji, onPick, onClose }: EmojiPickerDialogProps) {
  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className="glass modal-card"
        role="dialog"
        aria-modal="true"
        aria-label="Выбор реакции"
        onClick={(event) => event.stopPropagation()}
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <h3>Реакция</h3>
        <div className="emoji-picker__grid">
          {EMOJI_CHOICES.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className={`emoji-picker__item${emoji === currentEmoji ? ' emoji-picker__item--active' : ''}`}
              aria-label={emoji}
              onClick={() => onPick(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
        {currentEmoji && <p className="muted emoji-picker__hint">Нажмите на свою реакцию ещё раз, чтобы убрать её.</p>}
        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
