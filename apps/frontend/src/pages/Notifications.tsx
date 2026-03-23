import { useEffect, useState } from "react";
import { Bell, CheckCheck, AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { apiGetNotifications, apiMarkAllNotificationsRead, apiMarkNotificationRead } from "@/http";
import type { UserNotification } from "@/types/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AppBackground } from "@/components/background";

const severityMap = {
  info: {
    icon: Info,
    badge: "border-sky-500/20 bg-sky-500/10 text-sky-300",
  },
  warning: {
    icon: AlertTriangle,
    badge: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  },
  error: {
    icon: ShieldAlert,
    badge: "border-red-500/20 bg-red-500/10 text-red-300",
  },
} as const;

export const Notifications = () => {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await apiGetNotifications();
      setNotifications(response.notifications);
    } catch (error: any) {
      toast.error("Failed to load notifications", {
        description: error?.response?.data?.message ?? "Could not fetch your alerts.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();
  }, []);

  const handleMarkRead = async (notificationId: string) => {
    try {
      await apiMarkNotificationRead(notificationId);
      setNotifications((current) =>
        current.map((notification) =>
          notification._id === notificationId
            ? { ...notification, read: true, readAt: new Date().toISOString() }
            : notification,
        ),
      );
    } catch (error: any) {
      toast.error("Could not update notification", {
        description: error?.response?.data?.message ?? "Please try again.",
      });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiMarkAllNotificationsRead();
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read: true,
          readAt: new Date().toISOString(),
        })),
      );
      toast.success("Notifications updated", {
        description: "All alerts have been marked as read.",
      });
    } catch (error: any) {
      toast.error("Could not mark all as read", {
        description: error?.response?.data?.message ?? "Please try again.",
      });
    }
  };

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-black px-6 pb-10 pt-36 text-white md:px-10">
      <AppBackground />
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#f17463]">
              Notifications
            </p>
            <p className="mt-2 max-w-2xl text-sm text-neutral-400">
              Stay updated with important alerts from your workflows and integrations.
            </p>
          </div>
          <Button
            className="bg-white px-5 py-2 text-xs font-medium text-neutral-900 hover:bg-gray-200 md:text-sm"
            onClick={() => void handleMarkAllRead()}
            disabled={!notifications.some((notification) => !notification.read)}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        </section>

        <section className="rounded-3xl border border-neutral-800 bg-linear-to-b from-neutral-950 via-black to-neutral-950/80 p-4 md:p-6">
          {loading ? (
            <div className="flex h-40 items-center justify-center text-sm text-neutral-400">
              <div className="flex items-center gap-3">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-600 border-t-transparent" />
                <span>Loading notifications…</span>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-3 text-center text-sm text-neutral-400">
              <Bell className="h-8 w-8 text-neutral-600" />
              <p>No alerts right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const severity = severityMap[notification.severity];
                const SeverityIcon = severity.icon;
                return (
                  <button
                    key={notification._id}
                    type="button"
                    onClick={() => {
                      if (!notification.read) {
                        void handleMarkRead(notification._id);
                      }
                    }}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      notification.read
                        ? "border-neutral-800 bg-neutral-950/60"
                        : "border-neutral-700 bg-neutral-900/80"
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="flex gap-3">
                        <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border ${severity.badge}`}>
                          <SeverityIcon className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-sm font-medium text-neutral-100">{notification.title}</h2>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] ${severity.badge}`}>
                              {notification.severity}
                            </span>
                            {!notification.read && (
                              <span className="rounded-full bg-[#f17463]/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-[#f17463]">
                                New
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-neutral-300">{notification.message}</p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                            <span>{new Date(notification.createdAt).toLocaleString()}</span>
                            {notification.workflowName && (
                              <span>Workflow: {notification.workflowName}</span>
                            )}
                            <span className="uppercase tracking-[0.16em]">{notification.type.replaceAll("_", " ")}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
