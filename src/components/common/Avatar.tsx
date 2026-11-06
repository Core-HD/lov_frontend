import { initialsOf } from '../../utils/format';
import type { UserStatus } from '../../types/api';

interface AvatarProps {
  name: string;
  size?: number;
  status?: UserStatus | null;
}

const hues = ['#19c982', '#b9f77c', '#0e8a5b', '#7fd6b0', '#d9e86b', '#4fb89a'];

function hueFor(name: string): string {
  const sum = [...name].reduce((total, char) => total + char.charCodeAt(0), 0);
  return hues[sum % hues.length] ?? hues[0]!;
}

export function Avatar({ name, size = 40, status = null }: AvatarProps) {
  const color = hueFor(name);
  return (
    <span className="avatar" style={{ width: size, height: size }}>
      <span
        className="avatar__circle"
        style={{
          background: `linear-gradient(135deg, ${color}, #0a2016)`,
          fontSize: size * 0.36,
        }}
      >
        {initialsOf(name)}
      </span>
      {status && <span className={`avatar__status avatar__status--${status}`} aria-label={status === 'online' ? 'В сети' : 'Не в сети'} />}
    </span>
  );
}
