import { useEffect, useRef, useState, type FormEvent } from "react"
import {
  ChevronDown,
  Edit3,
  LoaderCircle,
  LogIn,
  LogOut,
  User,
} from "lucide-react"

import { profileFormFromUser } from "@/entities/kratos/lib/domain"
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
  menuOpen: boolean
  onLogin: () => void
  onLogout: () => void
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
  menuOpen,
  onLogin,
  onLogout,
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

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={menuOpen} onOpenChange={onToggleMenu}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" tooltip={user.username} type="button">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
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
                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
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
              训练数据
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
          form={form}
          loading={profileSubmitting}
          onClose={() => setActiveDialog(null)}
          onFieldChange={(field, value) =>
            setForm((current) => ({ ...current, [field]: value }))
          }
          onSubmit={submitProfile}
          profileError={profileError}
        />
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function getUserInitials(username: string) {
  return username.trim().slice(0, 2).toUpperCase() || "KR"
}
