import { useState, type FormEvent } from 'react';
import { useAuthStore } from '../../store/authStore';

interface VerifyStepProps {
  email: string;
  onFocusField: () => void;
}

export function VerifyStep({ email, onFocusField }: VerifyStepProps) {
  const verifyEmail = useAuthStore((state) => state.verifyEmail);
  const resendVerification = useAuthStore((state) => state.resendVerification);
  const cancelVerification = useAuthStore((state) => state.cancelVerification);
  const errorMessage = useAuthStore((state) => state.errorMessage);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resent, setResent] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (code.trim().length === 0) {
      setLocalError('Введите код из письма.');
      return;
    }
    setLocalError(null);
    setSubmitting(true);
    await verifyEmail(code.trim());
    setSubmitting(false);
  };

  const handleResend = async () => {
    setResent(false);
    await resendVerification();
    setResent(true);
  };

  const shownError = localError ?? errorMessage;

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <h2>Подтвердите почту</h2>
      <p className="muted">Мы отправили код на {email}. Введите его, чтобы войти в GibbonChat.</p>
      <label className="field-label">
        Код из письма
        <input
          className={`field${shownError ? ' field-error' : ''}`}
          value={code}
          autoComplete="one-time-code"
          onFocus={onFocusField}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Вставьте код"
        />
      </label>
      {shownError && (
        <p className="error-text" role="alert">
          {shownError}
        </p>
      )}
      {resent && !shownError && <p className="muted">Новый код отправлен.</p>}
      <button type="submit" className="btn-primary auth-submit" disabled={submitting}>
        {submitting ? 'Проверяем...' : 'Подтвердить'}
      </button>
      <div className="auth-switch">
        <button type="button" className="link-button" onClick={handleResend}>
          Отправить код ещё раз
        </button>
        <span className="muted"> · </span>
        <button type="button" className="link-button" onClick={cancelVerification}>
          Назад
        </button>
      </div>
    </form>
  );
}
