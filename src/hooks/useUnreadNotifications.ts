import { useEffect, useState } from 'react';
import { fetchNotifications, getUnreadCount } from '../lib/services';

export function useUnreadNotifications(userId?: string) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchNotifications(userId)
      .then((list) => {
        if (!cancelled) setCount(getUnreadCount(list));
      })
      .catch(() => {
        if (!cancelled) setCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return count;
}
