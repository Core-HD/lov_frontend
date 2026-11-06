import type { ServerNotification } from '../../types/api';
import { apiRequest } from './client';
import { parseServerNotifications } from './parsers';

export async function fetchNotifications(token: string): Promise<ServerNotification[]> {
  return parseServerNotifications(await apiRequest('/api/v1/notifications/', { token }));
}

export async function markNotificationRead(token: string, notificationId: string): Promise<void> {
  await apiRequest(`/api/v1/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: 'PATCH',
    token,
  });
}
