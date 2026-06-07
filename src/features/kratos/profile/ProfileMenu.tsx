import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react"
import {
  ChevronDown,
  Edit3,
  LoaderCircle,
  LogIn,
  LogOut,
  User,
  Activity,
  Trophy,
} from "lucide-react"

import { profileFormFromUser } from "@/entities/kratos/lib/domain"
import { absoluteApiUrl } from "@/entities/kratos/api/client"
import type {
  FitnessProfile,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
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
  onOpenAchievements: () => void
  onAvatarChange: (event: ChangeEvent<HTMLInputElement>) => void
  onProfileSubmit: (form: ProfileForm) => void
  onRegister: () => void
  onToggleMenu: (open: boolean) => void
  profile: FitnessProfile | null
  profileError: string | null
  profileSubmitting: boolean
  user: UserProfile | null
}

export function ProfileMenu({
  authLoading,
  avatarUploading,
  menuOpen,
  onEditBodyData,
  onLogin,
  onLogout,
  onOpenAchievements,
  onAvatarChange,
  onProfileSubmit,
  onRegister,
  onToggleMenu,
  profile,
  profileError,
  profileSubmitting,
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
              <ChevronDown
                className={cn("ml-auto", menuOpen && "rotate-180")}
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="right">
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
