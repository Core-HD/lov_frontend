import { useState, type FormEvent } from 'react';
import { useAuthStore } from '../../store/authStore';
import { PasswordField } from './PasswordField';

interface RegisterFormProps {
  onFocusField: () => void;
  onSwitchToLogin: () => void;
}

const USERNAME_PATTERN = /^\*[a-zA-Z0-9_]{1,15}$/;

export function RegisterForm({ onFocusField, onSwitchToLogin }: RegisterFormProps) {
  const signUp = useAuthStore((state) => state.signUp);
  const errorMessage = useAuthStore((state) => state.errorMessage);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('*');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (name.trim().length === 0 || name.trim().length > 16) {
      setLocalError('Имя должно быть от 1 до 16 символов.');
      return;
    }
    if (!USERNAME_PATTERN.test(username)) {
      setLocalError('Логин начинается с * и содержит латинские буквы, цифры или _ (до 15 символов).');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setLocalError('Введите корректный email.');
      return;
    }
    if (password.length < 3) {
      setLocalError('Пароль должен быть не короче 3 символов.');
      return;
    }
    if (password !== passwordConfirm) {
      setLocalError('Пароли не совпадают.');
      return;
    }
    setLocalError(null);
    setSubmitting(true);
    await signUp({ name: name.trim(), username, email: email.trim(), password });
    setSubmitting(false);
  };

  const shownError = localError ?? errorMessage;

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <h2>Создайте аккаунт</h2>
      <p className="muted">Вас ждёт лиана, на которой уже сидят друзья.</p>
      <label className="field-label">
        Имя
        <input
          className="field"
          value={name}
          maxLength={16}
          onFocus={onFocusField}
          onChange={(event) => setName(event.target.value)}
          placeholder="Как вас называть"
        />
      </label>
      <label className="field-label">
        Логин
        <input
          className="field"
          value={username}
          maxLength={16}
          onFocus={onFocusField}
          onChange={(event) => setUsername(event.target.value.startsWith('*') ? event.target.value : `*${event.target.value}`)}
          placeholder="*gibbon"
        />
      </label>
      <label className="field-label">
        Email
        <input
          className="field"
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
        placeholder="Не короче 3 символов"
        autoComplete="new-password"
        invalid={false}
        onFocus={onFocusField}
        onChange={setPassword}
      />
      <PasswordField
        label="Повторите пароль"
        value={passwordConfirm}
        placeholder="Введите пароль ещё раз"
        autoComplete="new-password"
        invalid={passwordConfirm.length > 0 && passwordConfirm !== password}
        onFocus={onFocusField}
        onChange={setPasswordConfirm}
      />
      {shownError && (
        <p className="error-text" role="alert">
          {shownError}
        </p>
      )}
      <button type="submit" className="btn-primary auth-submit" disabled={submitting}>
        {submitting ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
      </button>
      <p className="auth-switch muted">
        Уже есть аккаунт?{' '}
        <button type="button" className="link-button" onClick={onSwitchToLogin}>
          Войти
        </button>
      </p>
    </form>
  );
}
