import { BellRing, CheckCheck } from "lucide-react"

import type { NotificationItem } from "@/entities/kratos/model/types"
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty"
import { PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle } from "@/shared/ui/popover"
import { ScrollArea } from "@/shared/ui/scroll-area"
import { Separator } from "@/shared/ui/separator"
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@/shared/ui/item"

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
      className="w-80 overflow-hidden sm:w-90"
      data-popover-root
      sideOffset={8}
    >
      <PopoverHeader className="flex flex-row items-center justify-between">
        <div>
          <PopoverTitle>通知中心</PopoverTitle>
          <PopoverDescription className="text-xs">
            {notifications.length ? `${notifications.length} 条事件` : "暂无新事件"}
          </PopoverDescription>
        </div>
        <Button
          disabled={!notifications.some((item) => !item.read)}
          onClick={onMarkAllRead}
          type="button"
          size="icon"
          variant="ghost"
        >
          <CheckCheck className="size-4" />
        </Button>
      </PopoverHeader>
      <ScrollArea className="h-[min(24rem,calc(100vh-10rem))]">
        {notifications.length ? (
          <div className="flex flex-col gap-2">
            {notifications.map((item) => (
              <Item variant="outline" key={item.id}>
                <ItemContent>
                  <ItemTitle className="text-xs truncate">{item.title}</ItemTitle>
                  <ItemDescription className="text-xs">
                    {item.body}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      item.read ? "bg-muted-foreground/35" : "bg-primary"
                    )}
                  />
                </ItemActions>
              </Item>
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
