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
import { ConversationRow } from "@/widgets/kratos/sidebar/ConversationRow"

type ConversationHistoryProps = {
  activeNav: string
  chatSessions: ChatSession[]
  onDeleteConversation: (sessionId: string) => void
  onExportConversation: (sessionId: string) => void
  onNavSelect: (label: string) => void
  onRenameConversation: (sessionId: string, title: string) => void
  onSelectConversation: (sessionId: string) => void
  onTogglePinConversation: (sessionId: string) => void
}

export function ConversationHistory({
  activeNav,
  chatSessions,
  onDeleteConversation,
  onExportConversation,
  onNavSelect,
  onRenameConversation,
  onSelectConversation,
  onTogglePinConversation,
}: ConversationHistoryProps) {
  return (
    <SidebarGroup className="min-h-0 flex-1 overflow-hidden opacity-100 transition-[opacity,transform] duration-200 ease-out group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0">
      <SidebarGroupLabel>对话历史</SidebarGroupLabel>
      <SidebarGroupContent className="min-h-0 overflow-y-auto">
        <SidebarMenu>
          {chatSessions.length > 0 ? (
            chatSessions.map((session) => (
              <ConversationRow
                active={activeNav === session.id}
                key={session.id}
                onDelete={() => onDeleteConversation(session.id)}
                onExport={() => onExportConversation(session.id)}
                onRename={(title) => onRenameConversation(session.id, title)}
                onSelect={() => {
                  onNavSelect(session.id)
                  onSelectConversation(session.id)
                }}
                onTogglePin={() => onTogglePinConversation(session.id)}
                session={session}
              />
            ))
          ) : (
            <SidebarMenuItem>
              <SidebarMenuButton disabled>
                <MessageCirclePlus />
                <span>还没有历史对话</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
