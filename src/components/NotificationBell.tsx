import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Bell,
  CalendarDays,
  CheckCheck,
  CheckSquare,
  Flag,
  Flame,
  FolderKanban,
  GraduationCap,
  Target,
  type LucideIcon,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  browserPermission,
  requestBrowserPermission,
  type NotifKind,
  type NotifSeverity,
  type Reminders,
} from "@/lib/notifications";

const ICONS: Record<NotifKind, LucideIcon> = {
  task: CheckSquare,
  event: CalendarDays,
  assessment: GraduationCap,
  milestone: Flag,
  goal: Target,
  project: FolderKanban,
  habit: Flame,
  review: CheckCheck,
};

const DOT: Record<NotifSeverity, string> = {
  overdue: "bg-destructive",
  today: "bg-primary",
  soon: "bg-muted-foreground/50",
};

export function NotificationBell({
  reminders,
  compact = false,
}: {
  reminders: Reminders;
  compact?: boolean;
}) {
  const navigate = useNavigate();
  const { notifications, count, dismiss, dismissAll } = reminders;
  const [permission, setPermission] = useState(browserPermission());

  function open(to: string, id: string) {
    dismiss(id);
    navigate({ to });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        {compact ? (
          <button
            aria-label="Notifications"
            className="relative text-muted-foreground transition-colors hover:text-foreground"
          >
            <Bell className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {count}
              </span>
            )}
          </button>
        ) : (
          <button
            aria-label="Notifications"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Bell className="h-4 w-4" /> Reminders
            {count > 0 && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                {count}
              </span>
            )}
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" side="right" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-sm font-semibold">Reminders</span>
          {count > 0 && (
            <button
              onClick={dismissAll}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Mark all read
            </button>
          )}
        </div>

        {permission !== "granted" && permission !== "unsupported" && (
          <button
            onClick={async () => setPermission(await requestBrowserPermission())}
            className="flex w-full items-center gap-2 border-b border-border bg-accent/40 px-3 py-2 text-left text-xs text-muted-foreground hover:bg-accent"
          >
            <Bell className="h-3.5 w-3.5" />
            Enable browser notifications for due reminders
          </button>
        )}

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              You're all caught up.
            </p>
          ) : (
            notifications.map((n) => {
              const Icon = ICONS[n.kind];
              return (
                <button
                  key={n.id}
                  onClick={() => open(n.to, n.id)}
                  className="flex w-full items-start gap-3 border-b border-border/60 px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-accent"
                >
                  <span className="mt-1">
                    <span className={cn("block h-2 w-2 rounded-full", DOT[n.severity])} />
                  </span>
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{n.title}</span>
                    <span className="block text-xs text-muted-foreground">{n.body}</span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
