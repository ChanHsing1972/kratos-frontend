import { BellRing, CheckCheck } from "lucide-react"

import type { NotificationItem } from "@/entities/kratos/model/types"
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty"
import { PopoverContent } from "@/shared/ui/popover"
import { ScrollArea } from "@/shared/ui/scroll-area"

type NotificationsPopoverProps = {
  notifications: NotificationItem[]
  onMarkAllRead: () => void
}

export function NotificationsPopover({
  notifications,
  onMarkAllRead,
}: NotificationsPopoverProps) {
  return (
    <PopoverContent
      align="end"
      className="w-80 p-0 sm:w-96"
      data-popover-root
      sideOffset={8}
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">通知中心</h3>
          <p className="text-xs text-muted-foreground">
            {notifications.length ? `${notifications.length} 条事件` : "暂无新事件"}
          </p>
        </div>
        <Button
          className="h-8 px-2"
          disabled={!notifications.some((item) => !item.read)}
          onClick={onMarkAllRead}
          type="button"
          variant="ghost"
        >
          <CheckCheck data-icon="inline-start" />
          全部已读
        </Button>
      </div>
      <ScrollArea className="max-h-96">
        {notifications.length ? (
          <div className="flex flex-col gap-2 p-3">
            {notifications.map((item) => (
              <div className="rounded-lg border bg-card p-3" key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        item.read ? "bg-muted-foreground/35" : "bg-primary"
                      )}
                    />
                    <h4 className="truncate text-sm font-medium">{item.title}</h4>
                  </div>
                  <Badge variant={item.read ? "secondary" : "default"}>
                    {item.read ? "已读" : "新"}
                  </Badge>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <Empty className="border-0 py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BellRing />
              </EmptyMedia>
              <EmptyTitle>暂无通知</EmptyTitle>
              <EmptyDescription>
                Agent 完成回复、失败或继续运行时会出现在这里。
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </ScrollArea>
    </PopoverContent>
  )
}
