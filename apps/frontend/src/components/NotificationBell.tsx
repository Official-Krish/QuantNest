import { useEffect } from "react";
import { Bell, Info, AlertTriangle, ShieldAlert } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const severityIcon = {
  info: Info,
  warning: AlertTriangle,
  error: ShieldAlert,
};

const severityDot = {
  info: "bg-sky-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
};

export const NotificationBell = () => {
  const { notifications, unreadCount, load, markRead } = useNotifications();

  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-200"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f17463] px-1 text-[9px] font-bold text-black">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-80 border-neutral-800 bg-neutral-950 p-0"
      >
        <div className="flex items-center justify-between border-b border-neutral-800 px-3 py-2.5">
          <span className="text-xs font-medium text-neutral-200">
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="rounded-full bg-[#f17463]/15 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.16em] text-[#f17463]">
              {unreadCount} new
            </span>
          )}
        </div>

        <div className="max-h-72 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
              <Bell className="h-5 w-5 text-neutral-600" />
              <p className="text-xs text-neutral-500">No alerts right now.</p>
            </div>
          ) : (
            notifications.slice(0, 5).map((notification) => {
              const Icon = severityIcon[notification.severity];
              const dotColor = severityDot[notification.severity];
              return (
                <button
                  key={notification._id}
                  type="button"
                  className={`flex w-full items-start gap-3 px-3 py-2.5 text-left text-xs transition-colors hover:bg-neutral-900 ${
                    notification.read ? "opacity-60" : ""
                  }`}
                  onClick={() => {
                    if (!notification.read) {
                      void markRead(notification._id);
                    }
                  }}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${dotColor}/10`}
                  >
                    <Icon className={`h-3 w-3 ${dotColor}`} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-neutral-200">
                        {notification.title}
                      </span>
                      {!notification.read && (
                        <span className="shrink-0 rounded-full bg-[#f17463] px-1.5 py-px text-[8px] font-bold uppercase tracking-wider text-black">
                          New
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-neutral-400">
                      {notification.message}
                    </p>
                    <p className="mt-0.5 text-neutral-500">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <DropdownMenuSeparator className="bg-neutral-800" />
        <a
          href="/notifications"
          className="flex items-center justify-center px-3 py-2.5 text-xs font-medium text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-neutral-200"
        >
          View all notifications
        </a>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
