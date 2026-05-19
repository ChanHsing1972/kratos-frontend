import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type FormEvent,
} from "react"
import {
  Activity,
  BarChart3,
  BrainCircuit,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Download,
  Edit3,
  LoaderCircle,
  LogIn,
  LogOut,
  MessageCirclePlus,
  MoreHorizontal,
  PanelLeft,
  Pin,
  PinOff,
  Trash2,
  User,
} from "lucide-react"

import type { ChatSession, UserProfile } from "@/types/kratos"
import type { FitnessProfile, ProfileForm } from "@/types/kratos"
import { profileFormFromUser } from "@/lib/kratos"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
} from "@/components/ui/sidebar"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarBadge, AvatarImage } from "@/components/ui/avatar"

type SidebarProps = {
  activeNav: string
  authLoading: boolean
  chatSessions: ChatSession[]
  collapsed: boolean
  currentUser: UserProfile | null
  drawerOpen: boolean
  menuOpen: boolean
  profile: FitnessProfile | null
  profileError: string | null
  profileSubmitting: boolean
  onCreateConversation: () => void
  onDeleteConversation: (sessionId: string) => void
  onExportConversation: (sessionId: string) => void
  onRenameConversation: (sessionId: string, title: string) => void
  onLogin: () => void
  onLogout: () => void
  onNavSelect: (label: string) => void
  onProfileSubmit: (form: ProfileForm) => void
  onSelectConversation: (sessionId: string) => void
  onRefreshProfile: () => void
  onRegister: () => void
  onTogglePinConversation: (sessionId: string) => void
  onToggleCollapse: () => void
  onDrawerOpenChange: (open: boolean) => void
  onToggleMenu: (open: boolean) => void
}

const primaryNavItems = [
  { id: "new", label: "新建对话", icon: MessageCirclePlus },
  { id: "训练计划", label: "训练计划", icon: CalendarDays },
  { id: "身体数据", label: "身体数据", icon: Activity },
  { id: "Skill", label: "Skill", icon: BrainCircuit },
  { id: "评估平台", label: "评估平台", icon: BarChart3, external: true },
]

export function Sidebar({
  activeNav,
  authLoading,
  chatSessions,
  currentUser,
  drawerOpen,
  menuOpen,
  profile,
  profileError,
  profileSubmitting,
  onCreateConversation,
  onDeleteConversation,
  onExportConversation,
  onRenameConversation,
  onLogin,
  onLogout,
  onNavSelect,
  onProfileSubmit,
  onSelectConversation,
  onRefreshProfile,
  onRegister,
  onTogglePinConversation,
  onToggleCollapse,
  onDrawerOpenChange,
  onToggleMenu,
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
              <div className="hidden aspect-square font-black size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground group-data-[collapsible=icon]:flex transition-all duration-300">
                K
              </div>
              <div className="grid flex-1 text-left text-lg leading-tight opacity-100 transition-[opacity,transform] duration-200 ease-out group-data-[collapsible=icon]:opacity-0">
                <span className="truncate text-[24px] font-black tracking-[-0.06em]">Kratos</span>
                <span className="truncate text-xs text-muted-foreground">AI Fitness Coach</span>
              </div>
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
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="min-h-0 overflow-hidden">
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
          onLogin={onLogin}
          onLogout={onLogout}
          onProfileSubmit={onProfileSubmit}
          onRefreshProfile={onRefreshProfile}
          onRegister={onRegister}
          onToggleMenu={onToggleMenu}
          profile={profile}
          profileError={profileError}
          profileSubmitting={profileSubmitting}
          user={currentUser}
        />
      </SidebarFooter>
      <SidebarRail />
    </ShadSidebar>
  )
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
  onLogin,
  onLogout,
  onProfileSubmit,
  onRegister,
  onToggleMenu,
  profile,
  profileError,
  profileSubmitting,
  user,
}: {
  authLoading: boolean
  menuOpen: boolean
  onLogin: () => void
  onLogout: () => void
  onProfileSubmit: (form: ProfileForm) => void
  onRefreshProfile: () => void
  onRegister: () => void
  onToggleMenu: (open: boolean) => void
  profile: FitnessProfile | null
  profileError: string | null
  profileSubmitting: boolean
  user: UserProfile | null
}) {
  const [activeDialog, setActiveDialog] = useState<
    "personal" | "training" | null
  >(null)
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

  const openProfileDialog = (dialog: "personal" | "training") => {
    setForm(profileFormFromUser(profile))
    setActiveDialog(dialog)
    onToggleMenu(false)
  }

  const closeProfileDialog = () => {
    setActiveDialog(null)
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
          <SidebarMenuButton onClick={onLogin} size="lg" tooltip="未登录" type="button">
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
          >
          </SidebarMenuAction>
        </SidebarMenuItem>
      </SidebarMenu >
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu
          open={menuOpen}
          onOpenChange={(open) => {
            onToggleMenu(open)
          }}
        >
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

        <Dialog
          open={activeDialog === "personal"}
          onOpenChange={(open) => {
            if (!open) {
              closeProfileDialog()
            }
          }}
        >
          <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>个人信息</DialogTitle>
              <DialogDescription>您的基础信息、健康和饮食偏好。</DialogDescription>
            </DialogHeader>

            <form id="sidebar-personal-form" onSubmit={submitProfile}>
              <FieldGroup>
                <div className="grid gap-4 sm:grid-cols-3">
                  <ProfileInput
                    label="性别"
                    onChange={(value) =>
                      setForm((current) => ({ ...current, gender: value }))
                    }
                    placeholder="男/女"
                    value={form.gender}
                  />
                  <ProfileInput
                    label="年龄"
                    max={120}
                    min={0}
                    onChange={(value) =>
                      setForm((current) => ({ ...current, age: value }))
                    }
                    placeholder=""
                    type="number"
                    value={form.age}
                  />
                  <ProfileInput
                    label="地区"
                    onChange={(value) =>
                      setForm((current) => ({ ...current, location: value }))
                    }
                    placeholder=""
                    value={form.location}
                  />
                </div>
                <ProfileTextarea
                  label="医疗情况"
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      medicalConditions: value,
                    }))
                  }
                  placeholder="例如 无 / 高血压 / 哮喘"
                  value={form.medicalConditions}
                />
                <ProfileTextarea
                  label="饮食习惯"
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      dietaryHabits: value,
                    }))
                  }
                  placeholder="例如 高蛋白、少糖、乳糖不耐受"
                  value={form.dietaryHabits}
                />
                <ProfileTextarea
                  label="饮食限制"
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      dietaryRestrictions: value,
                    }))
                  }
                  placeholder="例如 乳糖不耐受、海鲜过敏、不吃牛肉"
                  value={form.dietaryRestrictions}
                />
                {profileError ? (
                  <DialogDescription role="alert">
                    {profileError}
                  </DialogDescription>
                ) : null}
              </FieldGroup>
            </form>

            <ProfileDialogFooter
              formId="sidebar-personal-form"
              loading={profileSubmitting}
              onCancel={closeProfileDialog}
            />
          </DialogContent>
        </Dialog>

        <Dialog
          open={activeDialog === "training"}
          onOpenChange={(open) => {
            if (!open) {
              closeProfileDialog()
            }
          }}
        >
          <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>训练数据</DialogTitle>
              <DialogDescription>您的训练目标、经验、器械和限制条件。</DialogDescription>
            </DialogHeader>

            <form id="sidebar-training-form" onSubmit={submitProfile}>
              <FieldGroup>
                <div className="grid gap-4 sm:grid-cols-3">
                  <ProfileInput
                    label="活动水平"
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        activityLevel: value,
                      }))
                    }
                    placeholder="例如 久坐 / 中等 / 高"
                    value={form.activityLevel}
                  />
                  <ProfileInput
                    label="训练经验"
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        experienceLevel: value,
                      }))
                    }
                    placeholder="例如 新手 / 中级"
                    value={form.experienceLevel}
                  />
                  <ProfileInput
                    label="每周可练天数"
                    max={7}
                    min={0}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        availableDaysPerWeek: value,
                      }))
                    }
                    placeholder="例如 4"
                    type="number"
                    value={form.availableDaysPerWeek}
                  />
                  <ProfileInput
                    label="单次训练时长 (分钟)"
                    min={0}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        workoutMinutesPerSession: value,
                      }))
                    }
                    placeholder="例如 45"
                    type="number"
                    value={form.workoutMinutesPerSession}
                  />
                  <ProfileInput
                    label="可用器械"
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        equipmentAccess: value,
                      }))
                    }
                    placeholder="例如 健身房、哑铃、弹力带"
                    value={form.equipmentAccess}
                  />
                  <ProfileInput
                    label="偏好训练"
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        preferredWorkoutTypes: value,
                      }))
                    }
                    placeholder="例如 力量训练、跑步、瑜伽"
                    value={form.preferredWorkoutTypes}
                  />
                </div>
                <ProfileInput
                  label="健身目标"
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      fitnessGoal: value,
                    }))
                  }
                  placeholder="例如 减脂 / 增肌 / 塑形"
                  value={form.fitnessGoal}
                />
                <ProfileTextarea
                  label="当前训练状态"
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      fitnessSummary: value,
                    }))
                  }
                  placeholder="例如 近期恢复一般，想先提升基础力量"
                  value={form.fitnessSummary}
                />
                <ProfileTextarea
                  label="伤病史"
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      injuryHistory: value,
                    }))
                  }
                  placeholder="例如 右膝偶尔不适，避免跳跃"
                  value={form.injuryHistory}
                />
                {profileError ? (
                  <DialogDescription role="alert">
                    {profileError}
                  </DialogDescription>
                ) : null}
              </FieldGroup>
            </form>

            <ProfileDialogFooter
              formId="sidebar-training-form"
              loading={profileSubmitting}
              onCancel={closeProfileDialog}
            />
          </DialogContent>
        </Dialog>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function ProfileDialogFooter({
  formId,
  loading,
  onCancel,
}: {
  formId: string
  loading: boolean
  onCancel: () => void
}) {
  return (
    <DialogFooter>
      <Button onClick={onCancel} type="button" variant="outline">
        取消
      </Button>
      <Button disabled={loading} form={formId} type="submit">
        {loading ? <LoaderCircle className="animate-spin" /> : null}
        保存更新
      </Button>
    </DialogFooter>
  )
}

function ProfileInput({
  label,
  onChange,
  value,
  ...props
}: Omit<ComponentProps<typeof Input>, "onChange" | "value"> & {
  label: string
  onChange: (value: string) => void
  value: string
}) {
  const id = `profile-${label}`

  return (
    <Field>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
        {...props}
      />
    </Field>
  )
}

function ProfileTextarea({
  label,
  onChange,
  value,
  ...props
}: Omit<ComponentProps<typeof Textarea>, "onChange" | "value"> & {
  label: string
  onChange: (value: string) => void
  value: string
}) {
  const id = `profile-${label}`

  return (
    <Field>
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
        {...props}
      />
    </Field>
  )
}

function getUserInitials(username: string) {
  return username.trim().slice(0, 2).toUpperCase() || "KR"
}
