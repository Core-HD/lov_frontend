import { motion } from 'framer-motion';
import { Gibbon } from '../mascot/Gibbon';

interface StatusScreenProps {
  mode: 'loading' | 'error';
  message?: string;
  onRetry?: () => void;
}

export function StatusScreen({ mode, message, onRetry }: StatusScreenProps) {
  return (
    <div className="status-screen">
      <Gibbon state={mode === 'loading' ? 'idle' : 'curious'} size={150} />
      <motion.div
        className="glass status-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {mode === 'loading' ? (
          <>
            <h2>Открываем джунгли</h2>
            <p className="muted">Проверяем вашу сессию...</p>
            <div className="loader-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </>
        ) : (
          <>
            <h2>Нет связи с сервером</h2>
            <p className="muted">{message ?? 'Проверьте подключение к интернету и попробуйте снова.'}</p>
            {onRetry && (
              <button type="button" className="btn-primary" onClick={onRetry}>
                Попробовать снова
              </button>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
