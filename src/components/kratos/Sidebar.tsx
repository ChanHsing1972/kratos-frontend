import type { LucideIcon } from "lucide-react"
import {
  ChevronDown,
  ChevronLeft,
  Edit3,
  LoaderCircle,
  LogIn,
  LogOut,
  RefreshCcw,
  User,
  UserPlus,
} from "lucide-react"

import { navItems } from "@/data/kratos"
import type { UserProfile } from "@/types/kratos"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { UserAvatar } from "@/components/kratos/UserAvatar"

type SidebarProps = {
  activeNav: string
  authLoading: boolean
  collapsed: boolean
  currentUser: UserProfile | null
  menuOpen: boolean
  onEditProfile: () => void
  onLogin: () => void
  onLogout: () => void
  onNavSelect: (label: string) => void
  onOpenProfile: () => void
  onRefreshProfile: () => void
  onRegister: () => void
  onToggleCollapse: () => void
  onToggleMenu: () => void
}

export function Sidebar({
  activeNav,
  authLoading,
  collapsed,
  currentUser,
  menuOpen,
  onEditProfile,
  onLogin,
  onLogout,
  onNavSelect,
  onOpenProfile,
  onRefreshProfile,
  onRegister,
  onToggleCollapse,
  onToggleMenu,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex min-h-0 w-full shrink-0 flex-col border-b border-[#e8e8e8] bg-gray-100 py-7 transition-all duration-300 xl:h-full xl:border-r xl:border-b-0",
        collapsed ? "px-4 xl:w-[86px]" : "px-6 xl:w-[270px]"
      )}
    >
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div className={cn(collapsed && "xl:text-center")}>
          <h1 className="text-[28px] leading-none font-black tracking-[-0.06em]">
            <span className={cn(collapsed && "xl:hidden")}>Kratos</span>
            <span className={cn("hidden", collapsed && "xl:inline")}>K</span>
          </h1>
          <p
            className={cn(
              "mt-1 text-[13px] tracking-[0.01em] text-[#8b8b8b]",
              collapsed && "xl:hidden"
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

      <nav className="mt-9 flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-0.5">
        {navItems.map((item) => {
          const active = item.label === activeNav

          return (
            <button
              className={cn(
                "flex h-[46px] shrink-0 items-center gap-4 rounded-[9px] px-4 text-[14px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[#111111]/30 focus-visible:outline-none",
                active
                  ? "bg-[#0f0f0f] text-white"
                  : "text-[#303030] hover:bg-black/6",
                collapsed && "xl:justify-center xl:px-0"
              )}
              key={item.label}
              onClick={() => onNavSelect(item.label)}
              title={collapsed ? item.label : undefined}
              type="button"
            >
              <item.icon
                className={cn("size-[19px]", active && "text-white")}
                strokeWidth={1.8}
              />
              <span className={cn(collapsed && "xl:hidden")}>{item.label}</span>
              {item.badge ? (
                <span
                  className={cn(
                    "ml-auto rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-medium text-[#777777]",
                    collapsed && "xl:hidden"
                  )}
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          )
        })}
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
          user={currentUser}
        />
      </div>
    </aside>
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
  user: UserProfile | null
}) {
  if (authLoading) {
    return (
      <section className="w-full rounded-[12px] border border-[#e8e8e8] bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3 text-[12px] text-[#777777]">
          <LoaderCircle className="size-4 animate-spin" />
          <span className={cn(collapsed && "xl:hidden")}>正在读取登录状态</span>
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
          <span className={cn("min-w-0", collapsed && "xl:hidden")}>
            <span className="block text-[14px] leading-5 font-bold">
              未登录用户
            </span>
            <span className="text-[12px] text-[#666666]">登录同步训练档案</span>
          </span>
        </button>
        <div className={cn("mt-4 grid grid-cols-2 gap-2", collapsed && "xl:hidden")}>
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
    <section className="relative w-full rounded-[12px] border border-[#e8e8e8] bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)] xl:w-auto">
      <button
        className={cn(
          "flex w-full items-center gap-3 rounded-[10px] text-left focus-visible:ring-2 focus-visible:ring-[#111111]/30 focus-visible:outline-none",
          collapsed && "xl:justify-center"
        )}
        onClick={onToggleMenu}
        type="button"
      >
        <UserAvatar />
        <span className={cn("min-w-0 flex-1", collapsed && "xl:hidden")}>
          <span className="block truncate text-[14px] leading-5 font-bold">
            {user.username}
          </span>
          <span className="text-[12px] text-[#666666]">Lv.{level}</span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-[#777777] transition-transform",
            menuOpen && "rotate-180",
            collapsed && "xl:hidden"
          )}
        />
      </button>

      <div className={cn(collapsed && "xl:hidden")}>
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
