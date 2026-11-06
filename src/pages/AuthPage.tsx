import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Gibbon, type GibbonState } from '../components/mascot/Gibbon';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { VerifyStep } from '../components/auth/VerifyStep';
import { useAuthStore } from '../store/authStore';

type AuthMode = 'login' | 'register';

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [mascotState, setMascotState] = useState<GibbonState>('greeting');
  const pendingVerification = useAuthStore((state) => state.pendingVerification);
  const cancelVerification = useAuthStore((state) => state.cancelVerification);

  const showCurious = () => setMascotState('curious');
  const switchMode = (next: AuthMode) => {
    setMode(next);
    setMascotState('greeting');
  };

  const verifying = pendingVerification !== null;
  const activeState: GibbonState = verifying ? 'happy' : mascotState;

  return (
    <div className="auth-page">
      <motion.div
        className="auth-stage"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="auth-brand">
          <Gibbon state={activeState} size={168} />
          <h1 className="brand-title">GibbonChat</h1>
          <p className="brand-tagline">Мессенджер в тени тропических лиан</p>
        </div>
        <div className="glass auth-card">
          {verifying ? (
            <VerifyStep email={pendingVerification.email} onFocusField={showCurious} />
          ) : (
            <>
              <div className="auth-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'login'}
                  className={`auth-tab${mode === 'login' ? ' auth-tab--active' : ''}`}
                  onClick={() => switchMode('login')}
                >
                  Вход
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'register'}
                  className={`auth-tab${mode === 'register' ? ' auth-tab--active' : ''}`}
                  onClick={() => switchMode('register')}
                >
                  Регистрация
                </button>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, x: mode === 'login' ? -16 : 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: mode === 'login' ? 16 : -16 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  {mode === 'login' ? (
                    <LoginForm onFocusField={showCurious} onSwitchToRegister={() => switchMode('register')} />
                  ) : (
                    <RegisterForm onFocusField={showCurious} onSwitchToLogin={() => switchMode('login')} />
                  )}
                </motion.div>
              </AnimatePresence>
            </>
          )}
        </div>
        {verifying && (
          <button type="button" className="link-button auth-cancel" onClick={cancelVerification}>
            Вернуться ко входу
          </button>
        )}
      </motion.div>
    </div>
  );
}
