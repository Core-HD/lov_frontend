import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { fetchUserProfile, type UserProfile } from '../services/api/profile';

export function useUserProfile(username: string): { profile: UserProfile | null; error: string | null } {
  const token = useAuthStore((state) => state.token);
  const [state, setState] = useState<{ profile: UserProfile | null; error: string | null }>({
    profile: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ profile: null, error: null });
    fetchUserProfile(username, token)
      .then((profile) => {
        if (!cancelled) setState({ profile, error: null });
      })
      .catch(() => {
        if (!cancelled) setState({ profile: null, error: 'Не удалось загрузить профиль' });
      });
    return () => {
      cancelled = true;
    };
  }, [username, token]);

  return state;
}
