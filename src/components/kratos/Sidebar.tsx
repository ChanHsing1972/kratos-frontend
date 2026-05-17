import { useEffect, useState } from "react"
import {
  Activity,
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Download,
  Edit3,
  LoaderCircle,
  LogIn,
  LogOut,
  MessageCircle,
  MessageCirclePlus,
  MoreHorizontal,
  Pin,
  PinOff,
  Trash2,
  User,
  UserPlus,
} from "lucide-react"

import type { ChatSession, UserProfile } from "@/types/kratos"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar as ShadSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { UserAvatar } from "@/components/kratos/UserAvatar"

type SidebarProps = {
  activeNav: string
  authLoading: boolean
  chatSessions: ChatSession[]
  collapsed: boolean
  currentUser: UserProfile | null
  drawerOpen: boolean
  menuOpen: boolean
  onCreateConversation: () => void
  onDeleteConversation: (sessionId: string) => void
  onEditProfile: () => void
  onExportConversation: (sessionId: string) => void
  onRenameConversation: (sessionId: string, title: string) => void
  onLogin: () => void
  onLogout: () => void
  onNavSelect: (label: string) => void
  onOpenProfile: () => void
  onSelectConversation: (sessionId: string) => void
  onRefreshProfile: () => void
  onRegister: () => void
  onTogglePinConversation: (sessionId: string) => void
  onToggleCollapse: () => void
  onToggleMenu: () => void
}

const primaryNavItems = [
  { id: "new", label: "新建对话", icon: MessageCirclePlus },
  { id: "训练计划", label: "训练计划", icon: CalendarDays },
  { id: "身体数据", label: "身体数据", icon: Activity },
  { id: "评估平台", label: "评估平台", icon: BarChart3, external: true },
]

export function Sidebar({
  activeNav,
  authLoading,
  chatSessions,
  currentUser,
  drawerOpen,
  menuOpen,
  onCreateConversation,
  onDeleteConversation,
  onEditProfile,
  onExportConversation,
  onRenameConversation,
  onLogin,
  onLogout,
  onNavSelect,
  onOpenProfile,
  onSelectConversation,
  onRefreshProfile,
  onRegister,
  onTogglePinConversation,
  onToggleMenu,
}: SidebarProps) {
  return (
    <ShadSidebar collapsible="icon">
      <SidebarMobileStateBridge drawerOpen={drawerOpen} />
      <SidebarHeader className="mt-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Kratos">
              <div className="hidden aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground group-data-[collapsible=icon]:flex transition-all duration-300">
                K
              </div>
              <div className="grid flex-1 text-left text-lg leading-tight">
                <span className="text-[24px] truncate font-black tracking-[-0.06em]">Kratos</span>
                <span className="truncate text-xs text-[#8b8b8b]">AI Fitness Coach</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
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
                    <span>{item.label}</span>
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

        <SidebarGroup className=" overflow-hidden transition-all duration-200 ease-out group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:max-h-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:invisible group-data-[collapsible=icon]:translate-y-1 max-h-150 opacity-100 visible translate-y-0">
          <SidebarGroupLabel>对话历史</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chatSessions.length > 0 ? (
                chatSessions.map((session) => (
                  <ConversationRow
                    active={activeNav === session.id}
                    key={session.id}
                    onDelete={() => onDeleteConversation(session.id)}
                    onExport={() => onExportConversation(session.id)}
                    onRename={(title) =>
                      onRenameConversation(session.id, title)
                    }
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
      </SidebarContent>

      <SidebarFooter>
        <PersonalInfoModule
          authLoading={authLoading}
          menuOpen={menuOpen}
          onEditProfile={onEditProfile}
          onLogin={onLogin}
          onLogout={onLogout}
          onOpenProfile={onOpenProfile}
          onRefreshProfile={onRefreshProfile}
          onRegister={onRegister}
          onToggleMenu={onToggleMenu}
          user={currentUser}
        />
      </SidebarFooter>
      <SidebarRail />
    </ShadSidebar>
  )
}

function SidebarMobileStateBridge({ drawerOpen }: { drawerOpen: boolean }) {
  const { setOpenMobile } = useSidebar()

  useEffect(() => {
    setOpenMobile(drawerOpen)
  }, [drawerOpen, setOpenMobile])

  return null
}

function ConversationRow({
  active,
  onDelete,
  onExport,
  onRename,
  onSelect,
  onTogglePin,
  session,
}: {
  active: boolean
  onDelete: () => void
  onExport: () => void
  onRename: (title: string) => void
  onSelect: () => void
  onTogglePin: () => void
  session: ChatSession
}) {
  const [editing, setEditing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [title, setTitle] = useState(session.title)

  const commitTitle = () => {
    const nextTitle = title.trim()
    if (nextTitle) {
      onRename(nextTitle)
    }
    setEditing(false)
  }

  function ellipsis(text: string, max = 16) {
    if (!text) return ""
    return text.length > max ? text.slice(0, max) + "…" : text
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active}
        onClick={onSelect}
        size="default"
        tooltip={session.title}
        type="button"
      >
        {session.pinned && <Pin />}
        {editing ? (
          <input
            autoFocus
            className="h-7 min-w-0 flex-1 rounded-md border bg-background px-2 text-sm"
            onBlur={commitTitle}
            onChange={(event) => setTitle(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                commitTitle()
              }

              if (event.key === "Escape") {
                setEditing(false)
                setTitle(session.title)
              }
            }}
            value={title}
          />
        ) :
          (
            <div>
              <span className="truncate">{ellipsis(session.title, 13)}</span>
              {/* <span className="truncate text-xs text-muted-foreground">
                {formatStoredTime(session.updatedAt)} · {session.messageCount}{" "}
                条消息
              </span> */}
            </div>
          )}
      </SidebarMenuButton>

      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction aria-label="对话操作" showOnHover type="button">
            <MoreHorizontal />
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="right">
          <DropdownMenuItem onClick={onTogglePin}>
            {session.pinned ? <PinOff /> : <Pin />}
            {session.pinned ? "取消置顶" : "置顶"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExport}>
            <Download />
            导出 JSON
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setTitle(session.title)
              setEditing(true)
            }}
          >
            <Edit3 />
            重命名
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} variant="destructive">
            <Trash2 />
            删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

function PersonalInfoModule({
  authLoading,
  menuOpen,
  onEditProfile,
  onLogin,
  onLogout,
  onOpenProfile,
  onRegister,
  onToggleMenu,
  user,
}: {
  authLoading: boolean
  menuOpen: boolean
  onEditProfile: () => void
  onLogin: () => void
  onLogout: () => void
  onOpenProfile: () => void
  onRefreshProfile: () => void
  onRegister: () => void
  onToggleMenu: () => void
  user: UserProfile | null
}) {
  if (authLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton disabled size="lg">
            <LoaderCircle className="animate-spin" />
            <span>正在读取登录状态</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (!user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton onClick={onLogin} size="lg" tooltip="未登录用户">
            <User />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">未登录用户</span>
              <span className="truncate text-xs">登录同步训练档案</span>
            </div>
          </SidebarMenuButton>
          <SidebarMenuAction
            aria-label="注册"
            onClick={onRegister}
            type="button"
          >
            <UserPlus />
          </SidebarMenuAction>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton onClick={onLogin} tooltip="登录" type="button">
            <LogIn />
            <span>登录</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu
          open={menuOpen}
          onOpenChange={(open) => {
            if (open !== menuOpen) {
              onToggleMenu()
            }
          }}
        >
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" tooltip={user.username} type="button">
              <UserAvatar />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.username}</span>
                <span className="truncate text-xs">个人资料</span>
              </div>
              <ChevronDown
                className={cn("ml-auto", menuOpen && "rotate-180")}
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="right">
            <DropdownMenuItem onClick={onOpenProfile}>
              <User />
              查看个人资料
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEditProfile}>
              <Edit3 />
              编辑个人资料
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout}>
              <LogOut />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function formatStoredTime(time: string | number | Date) {
  const date = new Date(time)
  const now = new Date()

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(todayStart.getDate() - 1)

  if (date >= todayStart) {
    return "今天"
  }

  if (date >= yesterdayStart) {
    return "昨天"
  }

  return `${date.getMonth() + 1} 月 ${date.getDate()} 日`
}
