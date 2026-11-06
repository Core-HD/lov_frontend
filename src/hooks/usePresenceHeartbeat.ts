import { useEffect } from 'react';
import { sendPresence } from '../services/websocket/realtime';

// "online" is sent when the notifications socket opens (useRealtimeSync).
// Here we only send "offline" when the user closes the tab or hides the page.
export function usePresenceHeartbeat(userId: number | null): void {
  useEffect(() => {
    if (userId === null) return;
    const handlePageHide = () => {
      sendPresence(userId, 'offline');
    };
    const handleVisibility = () => {
      sendPresence(userId, document.visibilityState === 'visible' ? 'online' : 'offline');
    };
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [userId]);
}
