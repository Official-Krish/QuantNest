import { useState, useEffect, useCallback, useRef } from "react";
import {
  apiGetNotifications,
  apiMarkNotificationRead,
  apiMarkAllNotificationsRead,
} from "@/http";
import type { UserNotification } from "@/types/api";

export function useNotifications() {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGetNotifications();
      if (mountedRef.current) {
        setNotifications(res.notifications);
      }
    } catch {
      // silent — approvals pattern handles errors gracefully
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const markRead = useCallback(async (id: string) => {
    try {
      await apiMarkNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
    } catch {
      // silent
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await apiMarkAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  return { notifications, unreadCount, loading, load, markRead, markAllRead };
}
