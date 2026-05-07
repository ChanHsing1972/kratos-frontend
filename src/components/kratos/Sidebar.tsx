import { act, useEffect, useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  Edit3,
  LoaderCircle,
  LogIn,
  LogOut,
  MessageCirclePlus,
  MoreHorizontal,
  Pin,
  PinOff,
  RefreshCcw,
  Trash2,
  User,
  UserPlus,
} from "lucide-react"

import type { ChatSession, UserProfile } from "@/types/kratos"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { UserAvatar } from "@/components/kratos/UserAvatar"

type SidebarProps = {
  activeNav: string
  authLoading: boolean
  chatSessions: ChatSession[]
  collapsed: boolean
  currentUser: UserProfile | null
  menuOpen: boolean
  onCreateConversation: () => void
  onDeleteConversation: (sessionId: string) => void
  onEditProfile: () => void
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

export function Sidebar({
  activeNav,
  authLoading,
  chatSessions,
  collapsed,
  currentUser,
  menuOpen,
  onCreateConversation,
  onDeleteConversation,
  onEditProfile,
  onRenameConversation,
  onLogin,
  onLogout,
  onNavSelect,
  onOpenProfile,
  onSelectConversation,
  onRefreshProfile,
  onRegister,
  onTogglePinConversation,
  onToggleCollapse,
  onToggleMenu,
}: SidebarProps) {
  const [expandTextReady, setExpandTextReady] = useState(!collapsed)
  const showExpandedText = !collapsed && expandTextReady
  const primaryNavItems = [
    { id: "new", label: "新建对话", icon: MessageCirclePlus },
    { id: "训练计划", label: "训练计划", icon: CalendarDays },
    { id: "身体数据", label: "身体数据", icon: Activity },
    { id: "评估平台", label: "评估平台", icon: BarChart3, badge: "Beta" },
  ]

  useEffect(() => {
    if (collapsed) {
      const collapseTimer = window.setTimeout(() => {
        setExpandTextReady(false)
      }, 0)

      return () => {
        window.clearTimeout(collapseTimer)
      }
    }

    const timer = window.setTimeout(() => {
      setExpandTextReady(true)
    }, 160)

    return () => {
      window.clearTimeout(timer)
    }
  }, [collapsed])

  return (
    <aside
      className={cn(
        "flex min-h-0 w-full shrink-0 flex-col border-b border-[#e8e8e8] bg-gray-100 pt-5 pb-4 transition-all duration-300 xl:h-full xl:border-r xl:border-b-0",
        collapsed ? "px-4 xl:w-[86px]" : "px-2 xl:w-[260px]"
      )}
    >
      <div className={cn("flex shrink-0 items-start justify-between gap-3 ", collapsed ? "" : "ml-4")}>
        <div className={cn("min-w-0", collapsed && "xl:text-center")}>
          <h1 className="text-[28px] leading-none font-black tracking-[-0.06em]">
            <span className={cn(showExpandedText ? "xl:inline" : "xl:hidden")}>
              Kratos
            </span>
            <span className={cn("hidden", collapsed && "xl:inline")}>K</span>
          </h1>
          <p
            className={cn(
              "mt-0 overflow-hidden whitespace-nowrap text-[13px] tracking-[0.01em] text-[#8b8b8b] transition-[max-height,opacity,transform] duration-300",
              showExpandedText
                ? "max-h-6 opacity-100 translate-y-0"
                : "max-h-0 opacity-0 -translate-y-1"
            )}
          >
            AI Fitness Coach
          </p>
        </div>
        <Button
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="mt-0.5 size-7 rounded-full bg-[#0f0f0f] text-white hover:bg-[#0f0f0f]/90"
          onClick={onToggleCollapse}
          size="icon"
          type="button"
        >
          <ChevronLeft
            className={cn(
              "size-4 transition-transform",
              collapsed && "rotate-180"
            )}
            strokeWidth={2.3}
          />
        </Button>
      </div>

      <nav className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="mt-3 flex flex-col gap-1">
          {primaryNavItems.map((item) => (
            <button
              className={cn(
                "flex h-10 w-full items-center gap-3 rounded-[12px] px-4 text-left text-[14px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[#111111]/30 focus-visible:outline-none",
                activeNav === item.id
                  ? "bg-[#111111] text-white shadow-[0_8px_18px_rgba(0,0,0,0.08)]"
                  : "text-[#202020] hover:bg-white/70",
                collapsed && "xl:justify-center xl:px-0"
              )}
              key={item.label}
              onClick={() => {
                if (item.id === "new") {
                  onCreateConversation()
                  return
                }
                onNavSelect(item.id)
              }}
              title={collapsed ? item.label : undefined}
              type="button"
            >
              <item.icon className="size-5 shrink-0" strokeWidth={1.8} />
              <span className={cn(showExpandedText ? "xl:inline" : "xl:hidden")}>
                {item.label}
              </span>
              {item.badge ? (
                <span
                  className={cn(
                    "ml-auto rounded-full bg-[#dedee2] px-2 py-0.5 text-[10px] font-bold text-[#888888]",
                    activeNav === item.id && "bg-white/18 text-white/80",
                    !showExpandedText && "xl:hidden"
                  )}
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="mt-6 min-h-0 flex-1 overflow-y-auto">
          <div
            className={cn(
              "mb-2 ml-4 text-[11px] font-bold tracking-[0.08em] text-[#8b8b8b]",
              !showExpandedText && "xl:hidden"
            )}
          >
            对话历史
          </div>
          <div className="flex flex-col gap-1">
            {chatSessions.length > 0 ? (
              chatSessions.map((session) => (
                <ConversationRow
                  active={activeNav === session.id}
                  collapsed={collapsed}
                  key={session.id}
                  onDelete={() => onDeleteConversation(session.id)}
                  onRename={(title) => onRenameConversation(session.id, title)}
                  onSelect={() => {
                    onNavSelect(session.id)
                    onSelectConversation(session.id)
                  }}
                  onTogglePin={() => onTogglePinConversation(session.id)}
                  session={session}
                  showExpandedText={showExpandedText}
                />
              ))
            ) : (
              <div
                className={cn(
                  "mx-2 rounded-[10px] border border-[#e5e5e5] bg-white px-3 py-3 text-[12px] leading-5 text-[#777777]",
                  !showExpandedText && "xl:hidden"
                )}
              >
                还没有历史对话。发起一次训练规划后会自动保存。
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="sticky bottom-0 mt-4 shrink-0 pt-3">
        <PersonalInfoModule
          authLoading={authLoading}
          collapsed={collapsed}
          menuOpen={menuOpen}
          onEditProfile={onEditProfile}
          onLogin={onLogin}
          onLogout={onLogout}
          onOpenProfile={onOpenProfile}
          onRefreshProfile={onRefreshProfile}
          onRegister={onRegister}
          onToggleMenu={onToggleMenu}
          showExpandedText={showExpandedText}
          user={currentUser}
        />
      </div>
    </aside >
  )
}

function ConversationRow({
  active,
  collapsed,
  onDelete,
  onRename,
  onSelect,
  onTogglePin,
  session,
  showExpandedText,
}: {
  active: boolean
  collapsed: boolean
  onDelete: () => void
  onRename: (title: string) => void
  onSelect: () => void
  onTogglePin: () => void
  session: ChatSession
  showExpandedText: boolean
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

  return (
    <div
      className={cn(
        "group relative transition-all duration-300",
        collapsed
          ? "opacity-0 pointer-events-none"
          : "opacity-100"
      )}
    >
      <button
        className={cn(
          "flex min-h-[52px] w-full items-center gap-3 rounded-[12px] pl-4 pr-3 py-2 text-left transition-colors focus-visible:ring-2 focus-visible:ring-[#111111]/30 focus-visible:outline-none",
          active ? "bg-[#111111] shadow-[0_1px_5px_rgba(0,0,0,0.08)]" : "hover:bg-white/70",
          collapsed && "xl:min-h-10 xl:justify-center xl:px-0 xl:py-0"
        )}
        onClick={onSelect}
        title={collapsed ? session.title : undefined}
        type="button"
      >
        {session.pinned ? (
          <Pin className={cn("size-4 shrink-0 ", active ? "text-[#b8b8b8]" : "text-[#111111]")} strokeWidth={1.8} />
        ) : (
          <span className="mx-1 size-2 shrink-0 rounded-full bg-[#9f9f9f]" />
        )}
        <span
          className={cn(
            "min-w-0 flex-1 overflow-hidden transition-[max-width,opacity,transform] duration-300",
            showExpandedText
              ? "max-w-[170px] opacity-100 translate-x-0"
              : "max-w-0 opacity-0 -translate-x-1"
          )}
        >
          {editing ? (
            <input
              autoFocus
              className="h-7 w-full rounded-[7px] border border-[#d8d8d8] bg-white px-2 text-[12px] font-semibold outline-none focus:border-[#111111]"
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
          ) : (
            <>
              <span className={cn("block truncate text-[13px] font-semibold ", active ? "text-white" : "text-black")}>
                {session.title}
              </span>
              <span className={cn("block truncate text-[11px]", active ? "text-[#a4a4a4]" : "text-[#8a8a8a]")}>
                {session.messageCount} 条消息
              </span>
            </>
          )}
        </span>
      </button>
      <div
        className={cn(
          "absolute top-2 right-2 flex items-center gap-0.5 rounded-[7px] bg-white/95 opacity-0 shadow-[0_1px_8px_rgba(0,0,0,0.08)] transition-opacity group-hover:opacity-100",
          menuOpen && "opacity-100",
          !showExpandedText && "xl:hidden"
        )}
      >
        <button
          aria-label="对话操作"
          className="grid size-7 place-items-center rounded-[7px] text-[#555555] hover:bg-[#f1f1f1]"
          onClick={(event) => {
            event.stopPropagation()
            setMenuOpen((current) => !current)
          }}
          type="button"
        >
          <MoreHorizontal className="size-4" />
        </button>
        {menuOpen ? (
          <div className="absolute top-8 right-0 z-30 w-32 rounded-[10px] border border-[#e6e6e6] bg-white p-1 shadow-[0_14px_34px_rgba(0,0,0,0.14)]">
            <MenuButton
              icon={session.pinned ? PinOff : Pin}
              label={session.pinned ? "取消置顶" : "置顶"}
              onClick={() => {
                onTogglePin()
                setMenuOpen(false)
              }}
            />
            <MenuButton
              icon={Edit3}
              label="重命名"
              onClick={() => {
                setTitle(session.title)
                setEditing(true)
                setMenuOpen(false)
              }}
            />
            <MenuButton
              danger
              icon={Trash2}
              label="删除"
              onClick={() => {
                onDelete()
                setMenuOpen(false)
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

function MenuButton({
  danger,
  icon: Icon,
  label,
  onClick,
}: {
  danger?: boolean
  icon: LucideIcon
  label: string
  onClick: () => void
}) {
  return (
    <button
      className={cn(
        "flex h-8 w-full items-center gap-2 rounded-[8px] px-2 text-[12px] font-medium hover:bg-[#f4f4f4]",
        danger ? "text-[#b42318]" : "text-[#222222]"
      )}
      onClick={onClick}
      type="button"
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  )
}

function PersonalInfoModule({
  authLoading,
  collapsed,
  menuOpen,
  onEditProfile,
  onLogin,
  onLogout,
  onOpenProfile,
  onRefreshProfile,
  onRegister,
  onToggleMenu,
  showExpandedText,
  user,
}: {
  authLoading: boolean
  collapsed: boolean
  menuOpen: boolean
  onEditProfile: () => void
  onLogin: () => void
  onLogout: () => void
  onOpenProfile: () => void
  onRefreshProfile: () => void
  onRegister: () => void
  onToggleMenu: () => void
  showExpandedText: boolean
  user: UserProfile | null
}) {
  if (authLoading) {
    return (
      <section className="w-full rounded-[12px] border border-[#e8e8e8] bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3 text-[12px] text-[#777777]">
          <LoaderCircle className="size-4 animate-spin" />
          <span
            className={cn(
              "overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300",
              showExpandedText ? "max-w-[140px] opacity-100" : "max-w-0 opacity-0"
            )}
          >
            正在读取登录状态
          </span>
        </div>
      </section>
    )
  }

  if (!user) {
    return (
      <section
        className={cn(
          // 基础样式
          "w-full transition-all duration-300",
          // 展开状态：有边框、背景、内边距和阴影
          !collapsed && "rounded-[12px] border border-[#e8e8e8] bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)] xl:w-auto",
          // 收起状态：隐藏背景、边框、阴影，调整宽度和内边距以居中头像
          collapsed && "xl:border-none xl:bg-transparent xl:p-0 xl:shadow-none xl:w-full"
        )}
      >
        <button
          className={cn(
            "flex w-full items-center gap-3 rounded-[10px] text-left focus-visible:ring-2 focus-visible:ring-[#111111]/30 focus-visible:outline-none",
            collapsed && "xl:justify-center"
          )}
          onClick={onLogin}
          type="button"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#111111] text-white">
            <User className="size-5" strokeWidth={1.8} />
          </span>
          <span
            className={cn(
              "min-w-0 overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-300",
              showExpandedText
                ? "max-w-[150px] opacity-100 translate-x-0"
                : "max-w-0 opacity-0 -translate-x-1"
            )}
          >
            <span className="block truncate text-[14px] leading-5 font-bold">
              未登录用户
            </span>
            <span className="block truncate text-[12px] text-[#666666]">
              登录同步训练档案
            </span>
          </span>
        </button>
        <div
          className={cn(
            "mt-4 grid grid-cols-2 gap-2 overflow-hidden transition-[max-height,opacity] duration-300",
            showExpandedText ? "max-h-16 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <Button
            className="h-8 rounded-[8px] text-[12px]"
            onClick={onLogin}
            type="button"
          >
            <LogIn className="size-3.5" />
            登录
          </Button>
          <Button
            className="h-8 rounded-[8px] border-[#dedede] text-[12px]"
            onClick={onRegister}
            type="button"
            variant="outline"
          >
            <UserPlus className="size-3.5" />
            注册
          </Button>
        </div>
      </section>
    )
  }

  const level = 10 + (user.id % 6)
  const expNow = 2100 + user.id * 43
  const expTotal = 3500
  const expPercent = Math.min(Math.round((expNow / expTotal) * 100), 100)

  return (

    <section
      className={cn(
        // 基础样式
        "w-full transition-all duration-300",
        // 展开状态：有边框、背景、内边距和阴影
        !collapsed && "rounded-[12px] border border-[#e8e8e8] bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)] xl:w-auto",
        // 收起状态：隐藏背景、边框、阴影，调整宽度和内边距以居中头像
        collapsed && "xl:border-none xl:bg-transparent xl:p-0 xl:shadow-none xl:w-full"
      )}
    >
      <button
        className={cn(
          "flex w-full items-center gap-3 rounded-[10px] text-left focus-visible:ring-2 focus-visible:ring-[#111111]/30 focus-visible:outline-none",
          collapsed && "xl:justify-center"
        )}
        onClick={onToggleMenu}
        type="button"
      >
        <UserAvatar />
        <span
          className={cn(
            "min-w-0 flex-1 overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-300",
            showExpandedText
              ? "max-w-[150px] opacity-100 translate-x-0"
              : "hidden"
          )}
        >
          <span className="block truncate text-[14px] leading-5 font-bold">
            {user.username}
          </span>
          <span className="text-[12px] text-[#666666]">Lv.{level}</span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-[#777777] transition-transform",
            menuOpen && "rotate-180",
            !showExpandedText && "hidden"
          )}
        />
      </button>

      <div
        className={cn(
          "overflow-hidden transition-[max-height,opacity] duration-300",
          showExpandedText ? "max-h-32 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="mt-5 flex items-center justify-between text-[12px] text-[#575757]">
          <span>经验值</span>
          <span>
            {expNow} / {expTotal}
          </span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#eeeeee]">
          <div
            className="h-full rounded-full bg-[#111111]"
            style={{ width: `${expPercent}%` }}
          />
        </div>
      </div>

      {menuOpen ? (
        <div className="absolute right-0 bottom-[calc(100%+10px)] z-30 w-[220px] overflow-hidden rounded-[12px] border border-[#e6e6e6] bg-white p-1 shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
          <ProfileMenuButton icon={User} label="查看个人资料" onClick={onOpenProfile} />
          <ProfileMenuButton icon={Edit3} label="编辑个人资料" onClick={onEditProfile} />
          <ProfileMenuButton
            icon={RefreshCcw}
            label="刷新后端资料"
            onClick={onRefreshProfile}
          />
          <ProfileMenuButton icon={LogOut} label="退出登录" onClick={onLogout} />
        </div>
      ) : null}
    </section>
  )
}

function ProfileMenuButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
}) {
  return (
    <button
      className="flex w-full items-center gap-3 rounded-[9px] px-3 py-2.5 text-left text-[12px] font-medium text-[#333333] hover:bg-[#f5f5f4] focus-visible:ring-2 focus-visible:ring-[#111111]/30 focus-visible:outline-none"
      onClick={onClick}
      type="button"
    >
      <Icon className="size-4" strokeWidth={1.8} />
      {label}
    </button>
  )
}
