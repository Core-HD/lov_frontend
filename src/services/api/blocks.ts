import { apiRequest } from './client';

export async function blockUser(token: string, input: { userId: number; username: string }): Promise<void> {
  await apiRequest('/api/v1/blocks/', {
    method: 'POST',
    token,
    body: { user_id: input.userId, username: input.username },
  });
}

export async function fetchBlockedUserIds(token: string): Promise<number[]> {
  const payload = await apiRequest('/api/v1/blocks/', { token });
  if (!Array.isArray(payload)) throw new Error('Unexpected blocks response');
  return payload.flatMap((item: unknown) =>
    typeof item === 'object' && item !== null && 'user_id' in item && typeof item.user_id === 'number'
      ? [item.user_id]
      : [],
  );
}
