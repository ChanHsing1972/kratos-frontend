import type { ReactNode } from "react"
import { PanelLeft, PanelLeftOpen } from "lucide-react"

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
  collapsed: boolean
  drawerOpen: boolean
  footer: ReactNode
  historyLoading: boolean
  onCreateConversation: () => void
  onDeleteConversation: (sessionId: string) => void
  onExportConversation: (sessionId: string) => void
  onExpand: () => void
  onNavSelect: (label: string) => void
  onRenameConversation: (sessionId: string, title: string) => void
  onSelectConversation: (sessionId: string) => void
  onToggleCollapse: () => void
  onDrawerOpenChange: (open: boolean) => void
  onTogglePinConversation: (sessionId: string) => void
  onToggleShareConversation: (sessionId: string) => void
}

export function Sidebar({
  activeNav,
  chatSessions,
  collapsed,
  drawerOpen,
  footer,
  historyLoading,
  onCreateConversation,
  onDeleteConversation,
  onExportConversation,
  onExpand,
  onNavSelect,
  onRenameConversation,
  onSelectConversation,
  onToggleCollapse,
  onDrawerOpenChange,
  onTogglePinConversation,
  onToggleShareConversation,
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
            <SidebarMenuButton
              aria-label={collapsed ? "打开侧边栏" : "新建对话"}
              className="group/brand justify-start pr-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
              onClick={() => {
                if (collapsed) {
                  onExpand()
                  return
                }
                onCreateConversation()
              }}
              size="lg"
              tooltip={collapsed ? "打开侧边栏" : "新建对话"}
              type="button"
            >
              <div className="relative hidden aspect-square size-8 items-center justify-center overflow-hidden rounded-lg transition-all duration-200 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:cursor-e-resize group-data-[collapsible=icon]:hover:bg-sidebar-accent group-data-[collapsible=icon]:hover:text-sidebar-accent-foreground">
                <img
                  alt="Kratos"
                  className="size-7 object-contain transition-opacity duration-150 dark:invert group-hover/brand:opacity-0"
                  src="/logo.png"
                />
                <PanelLeftOpen
                  aria-hidden="true"
                  className="absolute size-4 opacity-0 transition-opacity duration-150 group-hover/brand:opacity-100"
                />
              </div>
              <div className="grid flex-1 text-left text-lg leading-tight opacity-100 transition-[opacity,transform] duration-200 ease-out group-data-[collapsible=icon]:hidden group-data-[collapsible=icon]:opacity-0">
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
          loading={historyLoading}
          onDeleteConversation={onDeleteConversation}
          onExportConversation={onExportConversation}
          onRenameConversation={onRenameConversation}
          onSelectConversation={onSelectConversation}
          onTogglePinConversation={onTogglePinConversation}
          onToggleShareConversation={onToggleShareConversation}
        />
      </SidebarContent>

      <SidebarFooter>{footer}</SidebarFooter>
      <SidebarRail />
    </ShadSidebar>
  )
}
