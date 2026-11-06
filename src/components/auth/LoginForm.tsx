import { useState, type FormEvent } from 'react';
import { useAuthStore } from '../../store/authStore';
import { PasswordField } from './PasswordField';

interface LoginFormProps {
  onFocusField: () => void;
  onSwitchToRegister: () => void;
}

export function LoginForm({ onFocusField, onSwitchToRegister }: LoginFormProps) {
  const signIn = useAuthStore((state) => state.signIn);
  const errorMessage = useAuthStore((state) => state.errorMessage);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setLocalError('Введите корректный email.');
      return;
    }
    if (password.length === 0) {
      setLocalError('Введите пароль.');
      return;
    }
    setLocalError(null);
    setSubmitting(true);
    await signIn(email.trim(), password);
    setSubmitting(false);
  };

  const shownError = localError ?? errorMessage;

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <h2>С возвращением</h2>
      <p className="muted">Войдите, чтобы продолжить разговоры.</p>
      <label className="field-label">
        Email
        <input
          className={`field${shownError ? ' field-error' : ''}`}
          type="email"
          autoComplete="email"
          value={email}
          onFocus={onFocusField}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
      </label>
      <PasswordField
        label="Пароль"
        value={password}
        placeholder="Ваш пароль"
        autoComplete="current-password"
        invalid={shownError !== null}
        onFocus={onFocusField}
        onChange={setPassword}
      />
      {shownError && (
        <p className="error-text" role="alert">
          {shownError}
        </p>
      )}
      <button type="submit" className="btn-primary auth-submit" disabled={submitting}>
        {submitting ? 'Входим...' : 'Войти'}
      </button>
      <p className="auth-switch muted">
        Нет аккаунта?{' '}
        <button type="button" className="link-button" onClick={onSwitchToRegister}>
          Зарегистрироваться
        </button>
      </p>
    </form>
  );
}
