import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react"
import {
  Bell,
  BellRing,
  ChevronDown,
  CheckCheck,
  Edit3,
  LoaderCircle,
  LogIn,
  LogOut,
  Moon,
  Sun,
  User,
  Activity,
  ClipboardList,
  Trophy,
  ChevronsUpDown,
} from "lucide-react"

import { profileFormFromUser } from "@/entities/kratos/lib/domain"
import { absoluteApiUrl } from "@/entities/kratos/api/client"
import type {
  FitnessProfile,
  NotificationItem,
  OnboardingStatus,
  ProfileForm,
  UserProfile,
} from "@/entities/kratos/model/types"
import {
  ProfileEditDialog,
  type ProfileDialogMode,
} from "@/features/kratos/profile/ProfileEditDialog"
import { cn } from "@/shared/lib/utils"
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "@/shared/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { Button } from "@/shared/ui/button"
import { ScrollArea } from "@/shared/ui/scroll-area"
import {
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/ui/sidebar"

type ProfileMenuProps = {
  authLoading: boolean
  avatarUploading: boolean
  menuOpen: boolean
  onEditBodyData: () => void
  onLogin: () => void
  onLogout: () => void
  onMarkNotificationsRead: () => void
  onOpenOnboarding: () => void
  onOpenAchievements: () => void
  onAvatarChange: (event: ChangeEvent<HTMLInputElement>) => void
  onProfileSubmit: (form: ProfileForm) => void
  onRegister: () => void
  onToggleTheme: () => void
  onToggleMenu: (open: boolean) => void
  notifications: NotificationItem[]
  onboardingStatus: OnboardingStatus | null
  profile: FitnessProfile | null
  profileError: string | null
  profileSubmitting: boolean
  theme: "dark" | "light" | "system"
  unreadCount: number
  user: UserProfile | null
}

export function ProfileMenu({
  authLoading,
  avatarUploading,
  menuOpen,
  onEditBodyData,
  onLogin,
  onLogout,
  onMarkNotificationsRead,
  onOpenOnboarding,
  onOpenAchievements,
  onAvatarChange,
  onProfileSubmit,
  onRegister,
  onToggleTheme,
  onToggleMenu,
  notifications,
  onboardingStatus,
  profile,
  profileError,
  profileSubmitting,
  theme,
  unreadCount,
  user,
}: ProfileMenuProps) {
  const [activeDialog, setActiveDialog] = useState<ProfileDialogMode>(null)
  const [form, setForm] = useState<ProfileForm>(() =>
    profileFormFromUser(profile)
  )
  const wasSubmitting = useRef(false)

  useEffect(() => {
    if (wasSubmitting.current && !profileSubmitting && !profileError) {
      wasSubmitting.current = profileSubmitting
      const closeTimer = window.setTimeout(() => {
        setActiveDialog(null)
      }, 0)

      return () => window.clearTimeout(closeTimer)
    }

    wasSubmitting.current = profileSubmitting
  }, [profileError, profileSubmitting])

  const openProfileDialog = (dialog: Exclude<ProfileDialogMode, null>) => {
    setForm(profileFormFromUser(profile))
    setActiveDialog(dialog)
    onToggleMenu(false)
  }

  const submitProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onProfileSubmit(form)
  }

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
          <SidebarMenuButton
            onClick={onLogin}
            size="lg"
            tooltip="未登录"
            type="button"
          >
            <LogIn />
            <div className="ml-1 grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">未登录</span>
              <span className="truncate text-xs">登录同步训练档案</span>
            </div>
          </SidebarMenuButton>
          <SidebarMenuAction
            aria-label="注册"
            onClick={onRegister}
            type="button"
          />
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const avatarSrc = user.avatar_url ? absoluteApiUrl(user.avatar_url) : undefined
  const showOnboardingEntry = Boolean(onboardingStatus && !onboardingStatus.ready_for_agent)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={menuOpen} onOpenChange={onToggleMenu}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" tooltip={user.username} type="button">
              <Avatar>
                <AvatarImage src={avatarSrc} alt={user.username} />
                <AvatarFallback>{getUserInitials(user.username)}</AvatarFallback>
                <AvatarBadge className="bg-green-600 dark:bg-green-800" />
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.username}</span>
                <span className="truncate text-xs">个人用户</span>
              </div>
              <ChevronsUpDown
                className={cn("ml-auto")}
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-55" side="right">
            <DropdownMenuItem>
              <Avatar>
                <AvatarImage src={avatarSrc} alt={user.username} />
                <AvatarFallback>{getUserInitials(user.username)}</AvatarFallback>
                <AvatarBadge className="bg-green-600 dark:bg-green-800" />
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.username}</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {showOnboardingEntry ? (
              <>
                <DropdownMenuItem onClick={() => {
                  onOpenOnboarding()
                  onToggleMenu(false)
                }}>
                  <ClipboardList />
                  继续建档
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            ) : null}
            <DropdownMenuItem onClick={() => openProfileDialog("personal")}>
              <User />
              个人信息
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openProfileDialog("training")}>
              <Edit3 />
              训练档案
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              onEditBodyData()
              onToggleMenu(false)
            }}>
              <Activity />
              身体数据
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              onOpenAchievements()
              onToggleMenu(false)
            }}>
              <Trophy />
              我的成就
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onToggleTheme}>
              {theme === "dark" ? <Sun /> : <Moon />}
              {theme === "dark" ? "浅色模式" : "深色模式"}
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-1.5">
                <Bell className="shrink-0" />
                <span className="min-w-0 flex-1 truncate">通知中心</span>
                {unreadCount > 0 ? (
                  <span className="ml-auto grid size-4 shrink-0 place-items-center rounded-full bg-primary text-[10px] leading-none text-primary-foreground!">
                    {unreadCount}
                  </span>
                ) : null}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-84 p-2" sideOffset={10}>
                <div className="flex items-center justify-between px-1.5 py-1">
                  <div>
                    <DropdownMenuLabel className="px-0 py-0">
                      通知中心
                    </DropdownMenuLabel>
                    <p className="text-xs text-muted-foreground">
                      {notifications.length
                        ? `${notifications.length} 条事件`
                        : "暂无新事件"}
                    </p>
                  </div>
                  <Button
                    aria-label="全部标记为已读"
                    disabled={!notifications.some((item) => !item.read)}
                    onClick={onMarkNotificationsRead}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <CheckCheck className="size-4" />
                  </Button>
                </div>
                <ScrollArea className="mt-1 h-[min(24rem,calc(100vh-10rem))] px-2">
                  {notifications.length ? (
                    <div className="space-y-1.5 pr-1">
                      {notifications.map((item) => (
                        <div
                          className="border-t border-border bg-card pt-3 pb-1 text-sm"
                          key={item.id}
                        >
                          <div className="flex items-start gap-2">
                            <span
                              className={cn(
                                "mt-1.5 size-1.5 shrink-0 rounded-full",
                                item.read
                                  ? "bg-muted-foreground/35"
                                  : "bg-primary"
                              )}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium">
                                {item.title}
                              </p>
                              <p className="mt-1 text-xs leading-4 text-muted-foreground">
                                {item.body}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid min-h-32 place-items-center rounded-md border border-dashed text-center">
                      <div>
                        <BellRing className="mx-auto size-5 text-muted-foreground" />
                        <p className="mt-2 text-sm font-medium">暂无通知</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Agent 完成回复或失败时会出现在这里。
                        </p>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout}>
              <LogOut />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ProfileEditDialog
          activeDialog={activeDialog}
          avatarUploading={avatarUploading}
          form={form}
          loading={profileSubmitting}
          onAvatarChange={onAvatarChange}
          onClose={() => setActiveDialog(null)}
          onFieldChange={(field, value) =>
            setForm((current) => ({ ...current, [field]: value }))
          }
          onSubmit={submitProfile}
          profileError={profileError}
          user={user}
        />
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function getUserInitials(username: string) {
  return username.trim().slice(0, 2).toUpperCase() || "KR"
}
