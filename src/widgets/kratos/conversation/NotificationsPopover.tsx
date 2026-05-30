import type { NotificationItem } from "@/entities/kratos/model/types"
import { cn } from "@/shared/lib/utils"

type NotificationsPopoverProps = {
  notifications: NotificationItem[]
  onMarkAllRead: () => void
}

export function NotificationsPopover({
  notifications,
  onMarkAllRead,
}: NotificationsPopoverProps) {
  return (
    <div
      className="absolute top-9 right-0 z-40 w-[280px] rounded-[14px] border border-border bg-card p-3 shadow-[0_16px_40px_rgba(0,0,0,0.16)]"
      data-popover-root
    >
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-bold">通知中心</h3>
        <button
          className="text-[11px] font-medium text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
          onClick={onMarkAllRead}
          type="button"
        >
          全部已读
        </button>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {notifications.length ? (
          notifications.map((item) => (
            <div className="rounded-[10px] border border-border p-3" key={item.id}>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    item.read ? "bg-muted-foreground/35" : "bg-primary"
                  )}
                />
                <h4 className="text-[12px] font-bold">{item.title}</h4>
              </div>
              <p className="mt-1.5 text-[11px] leading-4 text-muted-foreground">
                {item.body}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-[10px] border border-dashed border-border p-3 text-[11px] leading-5 text-muted-foreground">
            暂无通知。Agent 完成回复、失败或继续运行时会出现在这里。
          </div>
        )}
      </div>
    </div>
  )
}
