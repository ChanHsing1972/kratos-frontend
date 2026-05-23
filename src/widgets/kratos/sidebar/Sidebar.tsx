import type { ReactNode } from "react"
import { PanelLeft } from "lucide-react"

import type { ChatSession } from "@/entities/kratos/model/types"
import {
  Sidebar as ShadSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/shared/ui/sidebar"
import { ConversationHistory } from "@/widgets/kratos/sidebar/ConversationHistory"
import { PrimaryNavigation } from "@/widgets/kratos/sidebar/PrimaryNavigation"

type SidebarProps = {
  activeNav: string
  chatSessions: ChatSession[]
  drawerOpen: boolean
  footer: ReactNode
  onCreateConversation: () => void
  onDeleteConversation: (sessionId: string) => void
  onExportConversation: (sessionId: string) => void
  onNavSelect: (label: string) => void
  onRenameConversation: (sessionId: string, title: string) => void
  onSelectConversation: (sessionId: string) => void
  onToggleCollapse: () => void
  onDrawerOpenChange: (open: boolean) => void
  onTogglePinConversation: (sessionId: string) => void
}

export function Sidebar({
  activeNav,
  chatSessions,
  drawerOpen,
  footer,
  onCreateConversation,
  onDeleteConversation,
  onExportConversation,
  onNavSelect,
  onRenameConversation,
  onSelectConversation,
  onToggleCollapse,
  onDrawerOpenChange,
  onTogglePinConversation,
}: SidebarProps) {
  return (
    <ShadSidebar
      collapsible="icon"
      openMobile={drawerOpen}
      onOpenMobileChange={onDrawerOpenChange}
    >
      <SidebarHeader className="mt-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="pr-2" size="lg" tooltip="Kratos">
              <div className="hidden aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary font-black text-sidebar-primary-foreground transition-all duration-300 group-data-[collapsible=icon]:flex">
                K
              </div>
              <div className="grid flex-1 text-left text-lg leading-tight opacity-100 transition-[opacity,transform] duration-200 ease-out group-data-[collapsible=icon]:opacity-0">
                <span className="truncate text-[24px] font-black tracking-[-0.06em]">
                  Kratos
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  AI Fitness Coach
                </span>
              </div>
            </SidebarMenuButton>
            <SidebarMenuAction
              aria-label="收起侧边栏"
              className="cursor-w-resize"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onToggleCollapse()
              }}
              type="button"
            >
              <PanelLeft />
            </SidebarMenuAction>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="min-h-0 overflow-hidden">
        <PrimaryNavigation
          activeNav={activeNav}
          onCreateConversation={onCreateConversation}
          onNavSelect={onNavSelect}
        />
        <ConversationHistory
          activeNav={activeNav}
          chatSessions={chatSessions}
          onDeleteConversation={onDeleteConversation}
          onExportConversation={onExportConversation}
          onRenameConversation={onRenameConversation}
          onSelectConversation={onSelectConversation}
          onTogglePinConversation={onTogglePinConversation}
        />
      </SidebarContent>

      <SidebarFooter>{footer}</SidebarFooter>
      <SidebarRail />
    </ShadSidebar>
  )
}
