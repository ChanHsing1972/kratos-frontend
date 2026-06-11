import { MessageCirclePlus } from "lucide-react"

import type { ChatSession } from "@/entities/kratos/model/types"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/ui/sidebar"
import { Skeleton } from "@/shared/ui/skeleton"
import { ConversationRow } from "@/widgets/kratos/sidebar/ConversationRow"

type ConversationHistoryProps = {
  activeNav: string
  chatSessions: ChatSession[]
  loading: boolean
  onDeleteConversation: (sessionId: string) => void
  onExportConversation: (sessionId: string) => void
  onRenameConversation: (sessionId: string, title: string) => void
  onSelectConversation: (sessionId: string) => void
  onTogglePinConversation: (sessionId: string) => void
  onToggleShareConversation: (sessionId: string) => void
}

export function ConversationHistory({
  activeNav,
  chatSessions,
  loading,
  onDeleteConversation,
  onExportConversation,
  onRenameConversation,
  onSelectConversation,
  onTogglePinConversation,
  onToggleShareConversation,
}: ConversationHistoryProps) {
  return (
    <SidebarGroup className="min-h-0 flex-1 overflow-hidden opacity-100 transition-[opacity,transform] duration-200 ease-out group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0">
      <SidebarGroupLabel>对话历史</SidebarGroupLabel>
      <SidebarGroupContent className="min-h-0 overflow-y-auto">
        <SidebarMenu>
          {loading ? (
            <ConversationHistorySkeleton />
          ) : chatSessions.length > 0 ? (
            chatSessions.map((session) => (
              <ConversationRow
                active={activeNav === session.id}
                key={session.id}
                onDelete={() => onDeleteConversation(session.id)}
                onExport={() => onExportConversation(session.id)}
                onRename={(title) => onRenameConversation(session.id, title)}
                onSelect={() => onSelectConversation(session.id)}
                onTogglePin={() => onTogglePinConversation(session.id)}
                onToggleShare={() => onToggleShareConversation(session.id)}
                session={session}
              />
            ))
          ) : (
            <SidebarMenuItem>
              <SidebarMenuButton disabled>
                <MessageCirclePlus />
                <span>暂无历史对话</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function ConversationHistorySkeleton() {
  return (
    <>
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <SidebarMenuItem key={item}>
          <div className="flex h-8 items-center gap-2 rounded-md px-2">
            {item < 2 ? <Skeleton className="size-3.5 rounded-full" /> : null}
            <Skeleton
              className={
                item % 3 === 0
                  ? "h-4 flex-1 rounded-[8px]"
                  : item % 3 === 1
                    ? "h-4 w-[76%] rounded-[8px]"
                    : "h-4 w-[58%] rounded-[8px]"
              }
            />
            <Skeleton className="ml-auto size-4 rounded-[6px]" />
          </div>
        </SidebarMenuItem>
      ))}
    </>
  )
}
