import {
  Activity,
  BarChart3,
  BrainCircuit,
  CalendarDays,
  ChevronRight,
  Database,
  MessageCirclePlus,
  Utensils,
} from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/ui/sidebar"

type PrimaryNavigationProps = {
  activeNav: string
  onCreateConversation: () => void
  onNavSelect: (label: string) => void
}

const primaryNavItems = [
  { id: "new", label: "新建对话", icon: MessageCirclePlus },
  { id: "训练计划", label: "训练计划", icon: CalendarDays },
  { id: "数据中心", label: "数据中心", icon: Activity },
  { id: "饮食摄入", label: "饮食摄入", icon: Utensils },
  // { id: "知识库", label: "知识库", icon: Database },
  { id: "工具技能", label: "工具技能", icon: BrainCircuit },
  // { id: "评估平台", label: "评估平台", icon: BarChart3, external: true },
]

export function PrimaryNavigation({
  activeNav,
  onCreateConversation,
  onNavSelect,
}: PrimaryNavigationProps) {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {primaryNavItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                isActive={activeNav === item.id}
                onClick={() => {
                  if (item.id === "new") {
                    onCreateConversation()
                    return
                  }
                  onNavSelect(item.id)
                }}
                tooltip={item.label}
                type="button"
              >
                <item.icon />
                <span className="truncate opacity-100 transition-[opacity,transform] duration-200 ease-out group-data-[collapsible=icon]:opacity-0">
                  {item.label}
                </span>
              </SidebarMenuButton>
              {item.external ? (
                <SidebarMenuAction aria-label="打开评估平台" type="button">
                  <ChevronRight />
                </SidebarMenuAction>
              ) : null}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
