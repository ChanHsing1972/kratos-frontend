import { Bell, Moon, Sun } from "lucide-react"

import type { NotificationItem } from "@/entities/kratos/model/types"
import { NotificationsPopover } from "@/widgets/kratos/conversation/NotificationsPopover"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

type ConversationHeaderProps = {
  muted: boolean
  notifications: NotificationItem[]
  notificationsOpen: boolean
  onMarkNotificationsRead: () => void
  onToggleNotifications: () => void
  onToggleTheme: () => void
  theme: "dark" | "light" | "system"
  unreadCount: number
}

export function ConversationHeader({
  muted,
  notifications,
  notificationsOpen,
  onMarkNotificationsRead,
  onToggleNotifications,
  onToggleTheme,
  theme,
  unreadCount,
}: ConversationHeaderProps) {
  return (
    <header
      className={cn(
        "flex shrink-0 items-start justify-end px-0 pt-4 pb-0 sm:px-6",
        muted ? "bg-muted/40" : "bg-card"
      )}
    >
      <div className="relative ml-auto flex items-center gap-0">
        <Button
          aria-label="Toggle theme"
          className="grid size-10 place-items-center"
          onClick={onToggleTheme}
          type="button"
          variant="ghost"
        >
          {theme === "dark" ? (
            <Moon className="size-5" strokeWidth={1.7} />
          ) : (
            <Sun className="size-5" strokeWidth={1.7} />
          )}
        </Button>

        <Button
          aria-label="Notifications"
          className="relative grid size-10"
          data-popover-root
          onClick={onToggleNotifications}
          type="button"
          variant="ghost"
        >
          <Bell className="size-5" strokeWidth={1.7} />
          {unreadCount > 0 ? (
            <span className="absolute top-0 right-0 grid size-4 place-items-center rounded-full bg-primary text-[9px] text-primary-foreground">
              {unreadCount}
            </span>
          ) : null}
        </Button>

        {notificationsOpen ? (
          <NotificationsPopover
            notifications={notifications}
            onMarkAllRead={onMarkNotificationsRead}
          />
        ) : null}
      </div>
    </header>
  )
}
