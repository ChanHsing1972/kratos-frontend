import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  Bell,
  CalendarDays,
  ChartNoAxesColumn,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  ClipboardList,
  Flame,
  Heart,
  History,
  ImagePlus,
  LoaderCircle,
  LogIn,
  LogOut,
  MessageCircle,
  Moon,
  Paperclip,
  Play,
  RefreshCcw,
  SendHorizontal,
  Settings,
  Sparkles,
  Sun,
  User,
  UserPlus,
  Utensils,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

type NavItem = {
  label: string
  icon: LucideIcon
  badge?: string
}

type TimelineItem = {
  label: string
  time: string
  body: string
  icon: "thought" | "action" | "observation" | "final"
}

type Metric = {
  label: string
  value: string
  unit?: string
  icon: LucideIcon
}

type QuickAction = {
  title: string
  description: string
  icon: LucideIcon
  prompt: string
}

type UserProfile = {
  id: number
  username: string
  gender: string | null
  age: number | null
  location: string | null
  dietary_habits: string | null
  fitness_status: string | null
}

type TokenResponse = {
  access_token: string
  token_type: string
}

type AuthMode = "login" | "register"

type AuthForm = {
  username: string
  password: string
  location: string
  fitnessStatus: string
}

type ChatMessage = {
  id: string
  author: "user" | "assistant"
  body: string
  time: string
}

type NotificationItem = {
  id: string
  title: string
  body: string
  read: boolean
}

type DetailPanel = {
  title: string
  body: string
  items?: string[]
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1"
const AUTH_TOKEN_KEY = "kratos-auth-token"

const navItems: NavItem[] = [
  { label: "对话", icon: MessageCircle },
  { label: "训练计划", icon: CalendarDays },
  { label: "营养分析", icon: Utensils },
  { label: "身体数据", icon: Activity },
  { label: "历史记录", icon: ClipboardList },
  { label: "评估平台", icon: ChartNoAxesColumn, badge: "Beta" },
  { label: "设置", icon: Settings },
]

const timelineItems: TimelineItem[] = [
  {
    label: "Thought",
    time: "10:30:15",
    icon: "thought",
    body: "用户时间紧凑、器械极少，且报告右膝盖疼痛。需避免大关节压力动作，选择无膝关节深屈曲的下肢或上半身/核心训练，并计算适合 20 分钟的训练方案。",
  },
  {
    label: "Action",
    time: "10:30:18",
    icon: "action",
    body: '调用工具 search_exercise(muscle="legs", equipment="dumbbell", avoid_joints="knee")',
  },
  {
    label: "Observation",
    time: "10:30:20",
    icon: "observation",
    body: "找到 6 个合适的动作",
  },
  {
    label: "Action",
    time: "10:30:21",
    icon: "action",
    body: "调用工具 calculate_workout_volume(time_min=20, exercise_count=2)",
  },
  {
    label: "Observation",
    time: "10:30:22",
    icon: "observation",
    body: "建议：2 个动作，每个 4 组，总计约 16 分钟，剩余 4 分钟热身",
  },
  {
    label: "Thought (反思)",
    time: "10:30:25",
    icon: "thought",
    body: "硬拉虽不深屈膝，但在酒店环境下存在腰部风险。改用更安全的训练组合。",
  },
  {
    label: "Final Answer",
    time: "10:30:28",
    icon: "final",
    body: "已生成 20 分钟酒店护膝下肢训练计划",
  },
]

const baseMetrics: Metric[] = [
  { label: "静息心率 (bpm)", value: "72", icon: Heart },
  { label: "今日消耗", value: "350", unit: "kcal", icon: Flame },
  { label: "昨晚睡眠", value: "6.5", unit: "h", icon: Moon },
]

const quickActions: QuickAction[] = [
  {
    title: "记录饮食",
    description: "记录今天你饮食内容",
    icon: Utensils,
    prompt: "我早餐吃了鸡蛋、燕麦和一杯拿铁，请帮我记录并估算营养。",
  },
  {
    title: "身体反馈",
    description: "告诉我你的身体感受",
    icon: Heart,
    prompt: "今天右膝还是有轻微酸痛，但精神不错，请调整今天训练强度。",
  },
  {
    title: "模拟数据",
    description: "发送模拟身体数据",
    icon: ChartNoAxesColumn,
    prompt: "同步一组模拟身体数据：静息心率 72，睡眠 6.5 小时，今日步数 6800。",
  },
  {
    title: "查看历史",
    description: "回顾你的训练记录",
    icon: History,
    prompt: "帮我回顾最近 7 天训练记录，找出恢复不足的风险。",
  },
]

const initialMessages: ChatMessage[] = [
  {
    id: "initial-user",
    author: "user",
    time: "10:30",
    body: "我今天在酒店，只有一对 10 kg 的哑铃和一张床，时间只有 20 分钟。另外我昨天深蹲完右膝盖有点疼，今天还能练腿吗?",
  },
]

const initialNotifications: NotificationItem[] = [
  {
    id: "knee",
    title: "恢复提醒",
    body: "右膝反馈仍需观察，今天避免跳跃和深蹲。",
    read: false,
  },
  {
    id: "hydration",
    title: "补水建议",
    body: "训练前 30 分钟补充 300ml 水。",
    read: false,
  },
  {
    id: "plan",
    title: "计划已生成",
    body: "20 分钟酒店护膝训练已经准备好。",
    read: true,
  },
]

export function App() {
  const { setTheme, theme } = useTheme()
  const [activeNav, setActiveNav] = useState("对话")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>("login")
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [authSubmitting, setAuthSubmitting] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [thinkingExpanded, setThinkingExpanded] = useState(true)
  const [composerValue, setComposerValue] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(initialNotifications)
  const [detailPanel, setDetailPanel] = useState<DetailPanel | null>(null)
  const [completedExercises, setCompletedExercises] = useState<string[]>([])
  const [trainingStarted, setTrainingStarted] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const unreadCount = notifications.filter((item) => !item.read).length
  const displayName = currentUser?.username ?? "Kevin"
  const metrics = useMemo<Metric[]>(
    () => [
      ...baseMetrics,
      {
        label: "今日训练完成度",
        value: `${Math.min(2 + completedExercises.length, 3)}/3`,
        icon: CircleCheck,
      },
    ],
    [completedExercises.length]
  )

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      setAuthLoading(false)
      return
    }

    getCurrentUser(token)
      .then((user) => {
        setCurrentUser(user)
        setToast(`欢迎回来，${user.username}`)
      })
      .catch(() => {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        setCurrentUser(null)
      })
      .finally(() => {
        setAuthLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!toast) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      setToast(null)
    }, 2600)

    return () => {
      window.clearTimeout(timer)
    }
  }, [toast])

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode)
    setAuthError(null)
    setProfileMenuOpen(false)
    setAuthModalOpen(true)
  }

  const handleAuthSubmit = async (form: AuthForm) => {
    setAuthSubmitting(true)
    setAuthError(null)

    try {
      if (authMode === "register") {
        await registerUser({
          username: form.username,
          password: form.password,
          location: form.location || null,
          fitness_status: form.fitnessStatus || null,
        })
      }

      const token = await loginUser(form.username, form.password)
      localStorage.setItem(AUTH_TOKEN_KEY, token.access_token)
      const user = await getCurrentUser(token.access_token)
      setCurrentUser(user)
      setAuthModalOpen(false)
      setToast(authMode === "register" ? "注册并登录成功" : "登录成功")
    } catch (error) {
      setAuthError(getErrorMessage(error))
    } finally {
      setAuthSubmitting(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    setCurrentUser(null)
    setProfileMenuOpen(false)
    setToast("已退出登录")
  }

  const handleRefreshProfile = async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      return
    }

    try {
      const user = await getCurrentUser(token)
      setCurrentUser(user)
      setToast("个人资料已刷新")
    } catch (error) {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      setCurrentUser(null)
      setToast(getErrorMessage(error))
    }
  }

  const handleNavSelect = (label: string) => {
    setActiveNav(label)
    if (label === "历史记录") {
      setComposerValue("帮我整理最近 7 天的训练历史和恢复情况。")
    }
    if (label === "设置" && !currentUser) {
      openAuth("login")
      return
    }
    setToast(`已切换到${label}`)
  }

  const handleSendMessage = () => {
    const body = composerValue.trim()
    if (!body) {
      setToast("先输入一点内容，Kratos 才能接招")
      return
    }

    const sentAt = formatTime()
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        author: "user",
        body,
        time: sentAt,
      },
      {
        id: crypto.randomUUID(),
        author: "assistant",
        body: buildAssistantReply(body),
        time: formatTime(),
      },
    ])
    setComposerValue("")
    setToast("Kratos 已生成一条模拟回复")
  }

  const handleQuickAction = (action: QuickAction) => {
    if (action.title === "查看历史") {
      setActiveNav("历史记录")
    }
    setComposerValue(action.prompt)
    setToast(`${action.title}已填入输入框`)
  }

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) {
      return
    }

    event.preventDefault()
    handleSendMessage()
  }

  const handleAttachment = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setToast(`已选择 ${file.name}，当前版本先作为本地假数据处理`)
    }
    event.target.value = ""
  }

  const toggleExercise = (title: string) => {
    setCompletedExercises((current) =>
      current.includes(title)
        ? current.filter((item) => item !== title)
        : [...current, title]
    )
  }

  const handleTrainingButton = () => {
    if (completedExercises.length >= 2) {
      setCompletedExercises([])
      setTrainingStarted(false)
      setToast("训练计划已重置")
      return
    }

    setTrainingStarted(true)
    setToast("训练已开始，点击动作卡可标记完成")
  }

  const markAllNotificationsRead = () => {
    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        read: true,
      }))
    )
    setToast("通知已全部标记为已读")
  }

  return (
    <div className="min-h-svh bg-[#efefee] p-4 text-[#111111]">
      <div className="mx-auto flex min-h-[calc(100svh-2rem)] w-full max-w-[1488px] overflow-hidden rounded-[22px] border border-white/80 bg-white shadow-[0_18px_55px_rgba(0,0,0,0.12)] max-xl:flex-col">
        <Sidebar
          activeNav={activeNav}
          authLoading={authLoading}
          collapsed={sidebarCollapsed}
          currentUser={currentUser}
          menuOpen={profileMenuOpen}
          onLogin={() => openAuth("login")}
          onLogout={handleLogout}
          onNavSelect={handleNavSelect}
          onOpenProfile={() =>
            setDetailPanel(buildProfilePanel(currentUser, completedExercises))
          }
          onRefreshProfile={handleRefreshProfile}
          onRegister={() => openAuth("register")}
          onToggleCollapse={() => setSidebarCollapsed((current) => !current)}
          onToggleMenu={() => setProfileMenuOpen((current) => !current)}
        />
        <MainConversation
          activeNav={activeNav}
          composerValue={composerValue}
          currentUserName={displayName}
          messages={messages}
          notifications={notifications}
          notificationsOpen={notificationsOpen}
          onAttachment={handleAttachment}
          onComposerChange={setComposerValue}
          onComposerKeyDown={handleComposerKeyDown}
          onEndConversation={() => {
            setMessages(initialMessages)
            setComposerValue("")
            setToast("对话已回到初始状态")
          }}
          onMarkNotificationsRead={markAllNotificationsRead}
          onQuickAction={handleQuickAction}
          onSendMessage={handleSendMessage}
          onToggleNotifications={() =>
            setNotificationsOpen((current) => !current)
          }
          onToggleTheme={() => {
            const nextTheme = theme === "dark" ? "light" : "dark"
            setTheme(nextTheme)
            setToast(`已切换到${nextTheme === "dark" ? "深色" : "浅色"}模式`)
          }}
          onToggleThinking={() =>
            setThinkingExpanded((current) => !current)
          }
          thinkingExpanded={thinkingExpanded}
          theme={theme}
          unreadCount={unreadCount}
        />
        <RightPanel
          completedExercises={completedExercises}
          metrics={metrics}
          onOpenPanel={setDetailPanel}
          onToggleExercise={toggleExercise}
          onTrainingButton={handleTrainingButton}
          trainingStarted={trainingStarted}
        />
      </div>

      <AuthModal
        error={authError}
        key={`${authMode}-${authModalOpen ? "open" : "closed"}`}
        loading={authSubmitting}
        mode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onModeChange={(mode) => {
          setAuthMode(mode)
          setAuthError(null)
        }}
        onSubmit={handleAuthSubmit}
        open={authModalOpen}
      />
      <DetailModal
        panel={detailPanel}
        onClose={() => setDetailPanel(null)}
      />
      <Toast message={toast} />
    </div>
  )
}

function Sidebar({
  activeNav,
  authLoading,
  collapsed,
  currentUser,
  menuOpen,
  onLogin,
  onLogout,
  onNavSelect,
  onOpenProfile,
  onRefreshProfile,
  onRegister,
  onToggleCollapse,
  onToggleMenu,
}: {
  activeNav: string
  authLoading: boolean
  collapsed: boolean
  currentUser: UserProfile | null
  menuOpen: boolean
  onLogin: () => void
  onLogout: () => void
  onNavSelect: (label: string) => void
  onOpenProfile: () => void
  onRefreshProfile: () => void
  onRegister: () => void
  onToggleCollapse: () => void
  onToggleMenu: () => void
}) {
  return (
    <aside
      className={cn(
        "flex w-full shrink-0 flex-col border-b border-[#e8e8e8] bg-white py-7 transition-all duration-300 xl:border-r xl:border-b-0",
        collapsed ? "px-4 xl:w-[86px]" : "px-6 xl:w-[270px]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={cn(collapsed && "xl:text-center")}>
          <h1 className="text-[28px] leading-none font-black tracking-[-0.06em]">
            <span className={cn(collapsed && "xl:hidden")}>Kratos</span>
            <span className={cn("hidden", collapsed && "xl:inline")}>K</span>
          </h1>
          <p
            className={cn(
              "mt-2 text-[13px] tracking-[0.01em] text-[#8b8b8b]",
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
            className={cn("size-4 transition-transform", collapsed && "rotate-180")}
            strokeWidth={2.3}
          />
        </Button>
      </div>

      <nav className="mt-9 flex flex-col gap-2.5">
        {navItems.map((item) => {
          const active = item.label === activeNav

          return (
            <button
              className={cn(
                "flex h-[46px] items-center gap-4 rounded-[9px] px-4 text-[14px] font-medium transition-colors",
                active
                  ? "bg-[#0f0f0f] text-white"
                  : "text-[#303030] hover:bg-[#f5f5f4]",
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
                    "ml-auto rounded-full bg-[#efefef] px-2 py-0.5 text-[11px] font-medium text-[#777777]",
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

      <div className="mt-10 flex gap-4 max-xl:flex-wrap xl:mt-auto xl:flex-col">
        <PersonalInfoModule
          authLoading={authLoading}
          collapsed={collapsed}
          menuOpen={menuOpen}
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
      <section className="w-full rounded-[12px] border border-[#e8e8e8] bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)] xl:w-auto">
        <button
          className={cn(
            "flex w-full items-center gap-3 text-left",
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
          "flex w-full items-center gap-3 text-left",
          collapsed && "xl:justify-center"
        )}
        onClick={onToggleMenu}
        type="button"
      >
        <KevinAvatar />
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
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#eeeeee]">
          <div
            className="h-full rounded-full bg-[#111111]"
            style={{ width: `${expPercent}%` }}
          />
        </div>
        <p className="mt-3 truncate text-[11px] text-[#858585]">
          {user.location ?? "未设置地区"} ·{" "}
          {user.fitness_status ?? "等待完善训练状态"}
        </p>
      </div>

      {menuOpen ? (
        <div className="absolute right-0 bottom-[calc(100%+10px)] z-30 w-[220px] overflow-hidden rounded-[12px] border border-[#e6e6e6] bg-white p-1 shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
          <ProfileMenuButton icon={User} label="查看个人资料" onClick={onOpenProfile} />
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
      className="flex w-full items-center gap-3 rounded-[9px] px-3 py-2.5 text-left text-[12px] font-medium text-[#333333] hover:bg-[#f5f5f4]"
      onClick={onClick}
      type="button"
    >
      <Icon className="size-4" strokeWidth={1.8} />
      {label}
    </button>
  )
}

function KevinAvatar() {
  return (
    <div className="relative size-11 shrink-0 overflow-hidden rounded-full bg-[#e6e2dc]">
      <div className="absolute top-2 left-1/2 size-4 -translate-x-1/2 rounded-full bg-[#a36b43]" />
      <div className="absolute top-1.5 left-1/2 h-2.5 w-5 -translate-x-1/2 rounded-t-full bg-[#211915]" />
      <div className="absolute right-2 bottom-0 left-2 h-6 rounded-t-[16px] bg-[#101010]" />
      <div className="absolute bottom-3 left-1/2 h-2.5 w-5 -translate-x-1/2 rounded-b-full bg-[#d9d9d9]" />
    </div>
  )
}

function MainConversation({
  activeNav,
  composerValue,
  currentUserName,
  messages,
  notifications,
  notificationsOpen,
  onAttachment,
  onComposerChange,
  onComposerKeyDown,
  onEndConversation,
  onMarkNotificationsRead,
  onQuickAction,
  onSendMessage,
  onToggleNotifications,
  onToggleTheme,
  onToggleThinking,
  thinkingExpanded,
  theme,
  unreadCount,
}: {
  activeNav: string
  composerValue: string
  currentUserName: string
  messages: ChatMessage[]
  notifications: NotificationItem[]
  notificationsOpen: boolean
  onAttachment: (event: ChangeEvent<HTMLInputElement>) => void
  onComposerChange: (value: string) => void
  onComposerKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  onEndConversation: () => void
  onMarkNotificationsRead: () => void
  onQuickAction: (action: QuickAction) => void
  onSendMessage: () => void
  onToggleNotifications: () => void
  onToggleTheme: () => void
  onToggleThinking: () => void
  thinkingExpanded: boolean
  theme: "dark" | "light" | "system"
  unreadCount: number
}) {
  const extraMessages = messages.slice(1)

  return (
    <main className="flex min-w-0 flex-1 flex-col border-[#e8e8e8] bg-white xl:border-r">
      <header className="flex flex-col gap-5 px-7 pt-8 pb-6 sm:px-10 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-[25px] leading-[1.1] font-extrabold tracking-[-0.04em]">
            {activeNav === "对话" ? `下午好， ${currentUserName}` : activeNav}{" "}
            <span className="tracking-normal">👋</span>
          </h2>
          <p className="mt-3 text-[13px] text-[#6d6d6d]">
            {activeNav === "对话"
              ? "我是你的 AI 健身教练 Kratos， 有什么可以帮你?"
              : "该模块已接入界面状态，当前使用本地假数据预览。"}
          </p>
        </div>
        <div className="relative flex items-center gap-7 pr-2">
          <div className="flex items-center gap-2 text-[12px] text-[#5e5e5e]">
            <span className="size-1.5 rounded-full bg-[#4c9b4d]" />
            在线
          </div>
          <button
            aria-label="Toggle theme"
            className="grid size-6 place-items-center text-[#161616]"
            onClick={onToggleTheme}
            type="button"
          >
            {theme === "dark" ? (
              <Moon className="size-5" strokeWidth={1.7} />
            ) : (
              <Sun className="size-5" strokeWidth={1.7} />
            )}
          </button>
          <button
            aria-label="Notifications"
            className="relative grid size-6 place-items-center text-[#161616]"
            onClick={onToggleNotifications}
            type="button"
          >
            <Bell className="size-5" strokeWidth={1.7} />
            {unreadCount > 0 ? (
              <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-[#111111] text-[9px] font-bold text-white">
                {unreadCount}
              </span>
            ) : null}
          </button>
          {notificationsOpen ? (
            <NotificationsPopover
              notifications={notifications}
              onMarkAllRead={onMarkNotificationsRead}
            />
          ) : null}
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-[17px] px-7 pb-5 sm:px-10">
        <UserPromptCard message={messages[0]} />
        <ThinkingCard expanded={thinkingExpanded} onToggle={onToggleThinking} />
        {extraMessages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}
        {activeNav !== "对话" ? <ModulePreview activeNav={activeNav} /> : null}
        <Composer
          onAttachment={onAttachment}
          onChange={onComposerChange}
          onEndConversation={onEndConversation}
          onKeyDown={onComposerKeyDown}
          onSend={onSendMessage}
          value={composerValue}
        />
        <QuickActions onQuickAction={onQuickAction} />
        <p className="text-center text-[10px] text-[#9a9a9a]">
          Kratos 提供的建议仅供健身参考，不构成医疗或诊断建议。如有严重不适，请及时就医。
        </p>
      </div>
    </main>
  )
}

function NotificationsPopover({
  notifications,
  onMarkAllRead,
}: {
  notifications: NotificationItem[]
  onMarkAllRead: () => void
}) {
  return (
    <div className="absolute top-9 right-0 z-40 w-[280px] rounded-[14px] border border-[#e6e6e6] bg-white p-3 shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-bold">通知中心</h3>
        <button
          className="text-[11px] font-medium text-[#777777] hover:text-[#111111]"
          onClick={onMarkAllRead}
          type="button"
        >
          全部已读
        </button>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {notifications.map((item) => (
          <div
            className="rounded-[10px] border border-[#eeeeee] p-3"
            key={item.id}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  item.read ? "bg-[#d4d4d4]" : "bg-[#111111]"
                )}
              />
              <h4 className="text-[12px] font-bold">{item.title}</h4>
            </div>
            <p className="mt-1.5 text-[11px] leading-4 text-[#777777]">
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function UserPromptCard({ message }: { message: ChatMessage }) {
  return (
    <section className="rounded-[12px] border border-[#e8e8e8] bg-white px-5 py-5 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <div className="flex gap-4">
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#ededed]">
          <ClipboardList className="size-4.5 text-[#2b2b2b]" strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-[14px] leading-5 font-bold">你</h3>
            <span className="text-[12px] text-[#8b8b8b]">{message.time}</span>
          </div>
          <p className="mt-1.5 max-w-[620px] text-[14px] leading-[1.7] text-[#2f2f2f]">
            {message.body}
          </p>
        </div>
      </div>
    </section>
  )
}

function ThinkingCard({
  expanded,
  onToggle,
}: {
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <section className="rounded-[12px] border border-[#e8e8e8] bg-white px-5 pt-5 pb-5 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <div className="flex items-start gap-4">
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#111111] text-white">
          <span className="text-[18px] font-bold">K</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-[14px] leading-5 font-bold">Kratos</h3>
              <p className="mt-1 text-[12px] text-[#8a8a8a]">
                {expanded ? "正在思考中..." : "思考过程已收起"}
              </p>
            </div>
            <button
              className="inline-flex items-center gap-1 text-[12px] font-medium text-[#777777]"
              onClick={onToggle}
              type="button"
            >
              {expanded ? "收起思考过程" : "展开思考过程"}
              <ChevronRight
                className={cn("size-3.5 transition-transform", expanded && "rotate-[-90deg]")}
              />
            </button>
          </div>

          {expanded ? (
            <div className="relative mt-5 pl-8">
              <div className="absolute top-2 bottom-3 left-[7px] w-px bg-[#e4e4e4]" />
              <div className="flex flex-col gap-3.5">
                {timelineItems.map((item) => (
                  <TimelineRow item={item} key={`${item.label}-${item.time}`} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function TimelineRow({ item }: { item: TimelineItem }) {
  return (
    <div className="relative">
      <div className="absolute top-0.5 -left-[31px] grid size-3.5 place-items-center rounded-full border border-[#111111] bg-white">
        {item.icon === "thought" ? (
          <span className="size-1.5 rounded-full bg-[#111111]" />
        ) : item.icon === "final" ? (
          <Check className="size-2.5 text-[#111111]" strokeWidth={2.5} />
        ) : (
          <Sparkles className="size-2.5 text-[#111111]" strokeWidth={2.2} />
        )}
      </div>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h4 className="text-[12px] leading-4 font-bold text-[#141414]">
            {item.label}
          </h4>
          <p className="mt-1 text-[12px] leading-[1.58] text-[#333333]">
            {item.body}
          </p>
        </div>
        <time className="shrink-0 text-[11px] leading-4 text-[#999999]">
          {item.time}
        </time>
      </div>
    </div>
  )
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isAssistant = message.author === "assistant"

  return (
    <section className="rounded-[12px] border border-[#e8e8e8] bg-white px-5 py-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <div className="flex gap-4">
        <div
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full",
            isAssistant ? "bg-[#111111] text-white" : "bg-[#ededed]"
          )}
        >
          {isAssistant ? (
            <span className="text-[18px] font-bold">K</span>
          ) : (
            <User className="size-4.5" strokeWidth={1.8} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-[14px] leading-5 font-bold">
              {isAssistant ? "Kratos" : "你"}
            </h3>
            <span className="text-[12px] text-[#8b8b8b]">{message.time}</span>
          </div>
          <p className="mt-1.5 text-[13px] leading-[1.7] text-[#333333]">
            {message.body}
          </p>
        </div>
      </div>
    </section>
  )
}

function ModulePreview({ activeNav }: { activeNav: string }) {
  const copy = {
    训练计划: "今日计划已生成，可在右侧开始训练并逐项标记完成。",
    营养分析: "今日蛋白质目标 125g，已记录 62g；晚餐建议补充瘦肉或豆制品。",
    身体数据: "最近 7 天静息心率稳定，睡眠略低，建议今晚提前 30 分钟入睡。",
    历史记录: "最近 7 天完成 4 次训练，下肢训练后恢复间隔偏短。",
    评估平台: "Beta 评估会结合身体反馈、训练负荷和恢复数据输出风险等级。",
    设置: "登录后可同步地区、饮食习惯和训练状态。",
  }[activeNav]

  return (
    <section className="rounded-[12px] border border-[#e8e8e8] bg-[#fbfbfa] px-5 py-4">
      <div className="flex items-center gap-3">
        <Sparkles className="size-4 text-[#111111]" />
        <h3 className="text-[13px] font-bold">{activeNav}预览</h3>
      </div>
      <p className="mt-2 text-[12px] leading-5 text-[#666666]">{copy}</p>
    </section>
  )
}

function Composer({
  onAttachment,
  onChange,
  onEndConversation,
  onKeyDown,
  onSend,
  value,
}: {
  onAttachment: (event: ChangeEvent<HTMLInputElement>) => void
  onChange: (value: string) => void
  onEndConversation: () => void
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  onSend: () => void
  value: string
}) {
  return (
    <section className="rounded-[12px] border border-[#e7e7e7] bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <textarea
        className="min-h-9 w-full resize-none bg-transparent text-[12px] leading-5 text-[#222222] outline-none placeholder:text-[#8c8c8c]"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="输入你的问题或反馈， Shift + Enter 换行"
        rows={2}
        value={value}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="cursor-pointer text-[#1f1f1f]">
            <input className="hidden" onChange={onAttachment} type="file" />
            <Paperclip className="size-4.5" strokeWidth={1.8} />
          </label>
          <label className="cursor-pointer text-[#1f1f1f]">
            <input
              accept="image/*"
              className="hidden"
              onChange={onAttachment}
              type="file"
            />
            <ImagePlus className="size-4.5" strokeWidth={1.8} />
          </label>
        </div>
        <div className="flex items-center gap-3">
          <Button
            className="h-9 rounded-[8px] border-[#dedede] px-4 text-[12px] font-medium text-[#333333]"
            onClick={onEndConversation}
            type="button"
            variant="outline"
          >
            结束对话
          </Button>
          <Button
            aria-label="Send"
            className="size-10 rounded-[9px] bg-[#0f0f0f] text-white hover:bg-[#0f0f0f]/90"
            onClick={onSend}
            size="icon"
            type="button"
          >
            <SendHorizontal className="size-5" strokeWidth={2} />
          </Button>
        </div>
      </div>
    </section>
  )
}

function QuickActions({
  onQuickAction,
}: {
  onQuickAction: (action: QuickAction) => void
}) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {quickActions.map((action) => (
        <button
          className="flex h-[60px] items-center gap-3 rounded-[12px] border border-[#e9e9e9] bg-white px-4 text-left shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-colors hover:bg-[#f8f8f7]"
          key={action.title}
          onClick={() => onQuickAction(action)}
          type="button"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#f2f2f2] text-[#242424]">
            <action.icon className="size-4" strokeWidth={1.8} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] font-bold text-[#181818]">
              {action.title}
            </span>
            <span className="mt-0.5 block truncate text-[10px] text-[#898989]">
              {action.description}
            </span>
          </span>
          <span className="text-[16px] leading-none text-[#333333]">+</span>
        </button>
      ))}
    </section>
  )
}

function RightPanel({
  completedExercises,
  metrics,
  onOpenPanel,
  onToggleExercise,
  onTrainingButton,
  trainingStarted,
}: {
  completedExercises: string[]
  metrics: Metric[]
  onOpenPanel: (panel: DetailPanel) => void
  onToggleExercise: (title: string) => void
  onTrainingButton: () => void
  trainingStarted: boolean
}) {
  return (
    <aside className="w-full shrink-0 bg-white px-6 py-8 xl:w-[388px]">
      <SectionHeader
        action="更多数据"
        onAction={() =>
          onOpenPanel({
            title: "身体与训练状态",
            body: "这些是当前界面的本地假数据，用于模拟可交互状态面板。",
            items: ["静息心率 72 bpm", "昨晚睡眠 6.5 小时", "今日训练完成度动态跟随动作完成情况"],
          })
        }
        title="当前状态"
      />
      <StatusCard metrics={metrics} />

      <button
        className="mt-4 w-full rounded-[12px] border border-[#e8e8e8] bg-white px-4 py-4 text-left shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-colors hover:bg-[#fbfbfa]"
        onClick={() =>
          onOpenPanel({
            title: "Kratos 提醒",
            body: "右膝恢复期建议选择髋主导动作，避免大量深蹲、弓步跳、箱跳等高冲击训练。",
            items: ["训练中疼痛超过 3/10 时停止", "热身时重点激活臀部和髋关节", "训练后观察 24 小时反馈"],
          })
        }
        type="button"
      >
        <div className="flex items-center gap-3">
          <span className="grid size-5 place-items-center rounded-full text-[#111111]">
            <Sparkles className="size-4 fill-[#111111]" strokeWidth={2} />
          </span>
          <h3 className="text-[14px] font-bold">Kratos 提醒</h3>
        </div>
        <p className="mt-3 text-[12px] leading-5 text-[#777777]">
          注意右膝恢复，建议避免大量深蹲和跳跃类动作。
        </p>
      </button>

      <div className="mt-9">
        <SectionHeader
          action="查看完整计划"
          onAction={() =>
            onOpenPanel({
              title: "完整训练计划",
              body: "20 分钟酒店护膝下肢训练：4 分钟热身，两个主动作各 4 组，组间休息 45 秒。",
              items: ["哑铃罗马尼亚硬拉 4 组 × 12 次", "哑铃臀桥 4 组 × 15 次", "训练后做轻度拉伸 2 分钟"],
            })
          }
          title="今日训练计划"
        />
      </div>
      <TrainingPlanCard
        completedExercises={completedExercises}
        onOpenPanel={onOpenPanel}
        onToggleExercise={onToggleExercise}
        onTrainingButton={onTrainingButton}
        trainingStarted={trainingStarted}
      />
    </aside>
  )
}

function SectionHeader({
  action,
  onAction,
  title,
}: {
  action: string
  onAction: () => void
  title: string
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-[17px] font-bold tracking-[-0.02em]">{title}</h2>
      <button
        className="inline-flex items-center gap-2 text-[11px] font-medium text-[#8a8a8a] hover:text-[#111111]"
        onClick={onAction}
        type="button"
      >
        {action}
        <ChevronRight className="size-3.5" strokeWidth={1.7} />
      </button>
    </div>
  )
}

function StatusCard({ metrics }: { metrics: Metric[] }) {
  return (
    <section className="mt-4 rounded-[12px] border border-[#e8e8e8] bg-white px-4 py-5 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <div className="grid grid-cols-2 border-b border-[#efefef] pb-4 text-center text-[11px] text-[#8a8a8a]">
        <span>身体状态</span>
        <span className="border-l border-[#efefef]">训练状态</span>
      </div>
      <div className="grid grid-cols-2 gap-y-7 pt-6">
        {metrics.map((metric, index) => (
          <MetricCell isRight={index % 2 === 1} key={metric.label} {...metric} />
        ))}
      </div>
    </section>
  )
}

function MetricCell({
  icon: Icon,
  isRight,
  label,
  unit,
  value,
}: Metric & { isRight: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 px-1",
        isRight && "border-l border-[#efefef] pl-6"
      )}
    >
      <Icon className="size-7 shrink-0 text-[#101010]" strokeWidth={1.7} />
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-[20px] leading-none font-bold tracking-[-0.02em]">
            {value}
          </span>
          {unit ? (
            <span className="text-[11px] font-medium text-[#777777]">
              {unit}
            </span>
          ) : null}
        </div>
        <p className="mt-1.5 text-[11px] text-[#8a8a8a]">{label}</p>
      </div>
    </div>
  )
}

function TrainingPlanCard({
  completedExercises,
  onOpenPanel,
  onToggleExercise,
  onTrainingButton,
  trainingStarted,
}: {
  completedExercises: string[]
  onOpenPanel: (panel: DetailPanel) => void
  onToggleExercise: (title: string) => void
  onTrainingButton: () => void
  trainingStarted: boolean
}) {
  const allDone = completedExercises.length >= 2
  const buttonLabel = allDone
    ? "重新开始"
    : trainingStarted
      ? "训练进行中"
      : "开始训练"

  return (
    <section className="mt-4 rounded-[12px] border border-[#e8e8e8] bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[13px] leading-5 font-bold">
            酒店护膝下肢训练（20 分钟）
          </h3>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[10px] font-semibold",
            allDone
              ? "bg-[#111111] text-white"
              : "bg-[#e9f5e6] text-[#5d9a5c]"
          )}
        >
          {allDone ? "已完成" : "已生成"}
        </span>
      </div>

      <div className="mt-3 overflow-hidden rounded-[8px] border border-[#eeeeee]">
        <ExerciseRow
          completed={completedExercises.includes("哑铃罗马尼亚硬拉")}
          illustration="hinge"
          onToggle={() => onToggleExercise("哑铃罗马尼亚硬拉")}
          reps="4 组 × 12 次"
          title="哑铃罗马尼亚硬拉"
        />
        <ExerciseRow
          completed={completedExercises.includes("哑铃臀桥")}
          illustration="bridge"
          onToggle={() => onToggleExercise("哑铃臀桥")}
          reps="4 组 × 15 次"
          title="哑铃臀桥"
        />
      </div>

      <button
        className="mt-8 w-full rounded-[12px] border border-[#ededed] bg-white p-4 text-left transition-colors hover:bg-[#fbfbfa]"
        onClick={() =>
          onOpenPanel({
            title: "热身建议",
            body: "先做 4 分钟动态热身，让髋关节和臀部进入状态，降低膝盖代偿。",
            items: ["髋环绕 45 秒", "臀桥激活 60 秒", "轻度腘绳肌拉伸 60 秒", "空手髋铰链练习 75 秒"],
          })
        }
        type="button"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[13px] font-bold">热身建议</h3>
            <p className="mt-2 text-[11px] text-[#777777]">
              4分钟动态热身（髋关节激活 + 轻度拉伸）
            </p>
          </div>
          <ChevronRight className="mt-2 size-4 text-[#777777]" />
        </div>
      </button>
      <Button
        className="mt-4 h-12 w-full rounded-[8px] bg-[#101010] text-[15px] font-semibold text-white hover:bg-[#101010]/90"
        onClick={onTrainingButton}
        type="button"
      >
        {trainingStarted && !allDone ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Play className="size-4" />
        )}
        {buttonLabel}
      </Button>
    </section>
  )
}

function ExerciseRow({
  completed,
  illustration,
  onToggle,
  reps,
  title,
}: {
  completed: boolean
  illustration: "hinge" | "bridge"
  onToggle: () => void
  reps: string
  title: string
}) {
  return (
    <button
      className={cn(
        "flex min-h-[112px] w-full items-center justify-between gap-3 border-b border-[#eeeeee] px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[#fbfbfa]",
        completed && "bg-[#f6f6f5]"
      )}
      onClick={onToggle}
      type="button"
    >
      <div className="flex min-w-0 gap-3">
        <span
          className={cn(
            "grid size-5 place-items-center rounded-full pt-px text-[12px] font-bold text-[#111111]",
            completed && "bg-[#111111] text-white"
          )}
        >
          {completed ? <Check className="size-3" /> : illustration === "hinge" ? "1." : "2."}
        </span>
        <div>
          <h4 className="text-[12px] font-bold">{title}</h4>
          <p className="mt-2 text-[12px] text-[#555555]">{reps}</p>
        </div>
      </div>
      <ExerciseIllustration type={illustration} />
    </button>
  )
}

function ExerciseIllustration({ type }: { type: "hinge" | "bridge" }) {
  if (type === "bridge") {
    return (
      <svg
        aria-hidden="true"
        className="h-[70px] w-[138px] shrink-0"
        viewBox="0 0 138 70"
      >
        <path
          d="M20 50c18 0 28-4 39-13 7-6 16-10 28-3l12 7"
          fill="none"
          stroke="#111"
          strokeLinecap="round"
          strokeWidth="7"
        />
        <path
          d="M52 36 73 17c7-6 17-3 21 6l9 20"
          fill="none"
          stroke="#d9d9d9"
          strokeLinecap="round"
          strokeWidth="10"
        />
        <path
          d="M75 18c12 4 22 14 31 29"
          fill="none"
          stroke="#111"
          strokeLinecap="round"
          strokeWidth="2.2"
        />
        <circle cx="18" cy="48" fill="#111" r="8" />
        <rect fill="#111" height="7" rx="2" width="34" x="9" y="46" />
        <circle cx="105" cy="45" fill="#111" r="4" />
        <circle cx="115" cy="47" fill="#111" r="4" />
      </svg>
    )
  }

  return (
    <svg
      aria-hidden="true"
      className="h-[74px] w-[132px] shrink-0"
      viewBox="0 0 132 74"
    >
      <PoseFigure transform="translate(15 5)" variant="stand" />
      <PoseFigure transform="translate(78 9) rotate(11)" variant="hinge" />
    </svg>
  )
}

function PoseFigure({
  transform,
  variant,
}: {
  transform: string
  variant: "stand" | "hinge"
}) {
  const bent = variant === "hinge"

  return (
    <g transform={transform}>
      <circle cx="13" cy="8" fill="#d8d8d8" r="6" stroke="#111" strokeWidth="1" />
      <path
        d={bent ? "M13 15 22 35" : "M13 15 14 37"}
        fill="none"
        stroke="#111"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d={bent ? "M21 35 37 39" : "M14 37 19 57"}
        fill="none"
        stroke="#111"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d={bent ? "M22 35 15 57" : "M14 37 10 58"}
        fill="none"
        stroke="#111"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d={bent ? "M17 25 11 43" : "M13 24 8 43"}
        fill="none"
        stroke="#111"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d={bent ? "M18 25 25 43" : "M15 24 20 43"}
        fill="none"
        stroke="#111"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <circle cx={bent ? "10" : "7"} cy="44" fill="#111" r="4.5" />
      <circle cx={bent ? "26" : "21"} cy="44" fill="#111" r="4.5" />
    </g>
  )
}

function AuthModal({
  error,
  loading,
  mode,
  onClose,
  onModeChange,
  onSubmit,
  open,
}: {
  error: string | null
  loading: boolean
  mode: AuthMode
  onClose: () => void
  onModeChange: (mode: AuthMode) => void
  onSubmit: (form: AuthForm) => void
  open: boolean
}) {
  const [form, setForm] = useState<AuthForm>({
    username: "",
    password: "",
    location: "",
    fitnessStatus: "",
  })

  if (!open) {
    return null
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(form)
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4 backdrop-blur-[2px]">
      <form
        className="w-full max-w-[420px] rounded-[20px] border border-white/80 bg-white p-5 shadow-[0_22px_70px_rgba(0,0,0,0.25)]"
        onSubmit={submit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[20px] font-black tracking-[-0.04em]">
              {mode === "login" ? "登录 Kratos" : "创建 Kratos 账号"}
            </h2>
            <p className="mt-2 text-[12px] leading-5 text-[#777777]">
              接口已连接到本地后端：{API_BASE_URL}
            </p>
          </div>
          <button
            className="grid size-8 place-items-center rounded-full hover:bg-[#f4f4f4]"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 rounded-[10px] bg-[#f3f3f2] p-1">
          <button
            className={cn(
              "h-9 rounded-[8px] text-[13px] font-bold",
              mode === "login" && "bg-white shadow-sm"
            )}
            onClick={() => onModeChange("login")}
            type="button"
          >
            登录
          </button>
          <button
            className={cn(
              "h-9 rounded-[8px] text-[13px] font-bold",
              mode === "register" && "bg-white shadow-sm"
            )}
            onClick={() => onModeChange("register")}
            type="button"
          >
            注册
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <AuthInput
            label="用户名"
            minLength={3}
            onChange={(value) =>
              setForm((current) => ({ ...current, username: value }))
            }
            placeholder="至少 3 个字符"
            required
            value={form.username}
          />
          <AuthInput
            label="密码"
            minLength={6}
            onChange={(value) =>
              setForm((current) => ({ ...current, password: value }))
            }
            placeholder="至少 6 个字符"
            required
            type="password"
            value={form.password}
          />
          {mode === "register" ? (
            <>
              <AuthInput
                label="地区"
                onChange={(value) =>
                  setForm((current) => ({ ...current, location: value }))
                }
                placeholder="例如 Shanghai"
                value={form.location}
              />
              <AuthInput
                label="训练状态"
                onChange={(value) =>
                  setForm((current) => ({ ...current, fitnessStatus: value }))
                }
                placeholder="例如 初级训练者 / 恢复期"
                value={form.fitnessStatus}
              />
            </>
          ) : null}
        </div>

        {error ? (
          <div className="mt-4 flex items-start gap-2 rounded-[10px] bg-[#fff4f2] p-3 text-[12px] leading-5 text-[#a13b2b]">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <Button
          className="mt-5 h-11 w-full rounded-[10px] bg-[#111111] text-[14px] font-bold text-white hover:bg-[#111111]/90"
          disabled={loading}
          type="submit"
        >
          {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {mode === "login" ? "登录" : "注册并登录"}
        </Button>
      </form>
    </div>
  )
}

function AuthInput({
  label,
  onChange,
  value,
  ...props
}: {
  label: string
  onChange: (value: string) => void
  value: string
} & Omit<React.ComponentProps<"input">, "onChange" | "value">) {
  return (
    <label className="block">
      <span className="text-[12px] font-bold text-[#333333]">{label}</span>
      <input
        className="mt-2 h-10 w-full rounded-[10px] border border-[#e4e4e4] bg-white px-3 text-[13px] outline-none transition-colors placeholder:text-[#aaaaaa] focus:border-[#111111]"
        onChange={(event) => onChange(event.target.value)}
        value={value}
        {...props}
      />
    </label>
  )
}

function DetailModal({
  onClose,
  panel,
}: {
  onClose: () => void
  panel: DetailPanel | null
}) {
  if (!panel) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/30 px-4 backdrop-blur-[2px]">
      <section className="w-full max-w-[430px] rounded-[18px] border border-white/80 bg-white p-5 shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[18px] font-black tracking-[-0.04em]">
              {panel.title}
            </h2>
            <p className="mt-3 text-[13px] leading-6 text-[#555555]">
              {panel.body}
            </p>
          </div>
          <button
            className="grid size-8 place-items-center rounded-full hover:bg-[#f4f4f4]"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
        {panel.items ? (
          <div className="mt-4 flex flex-col gap-2">
            {panel.items.map((item) => (
              <div
                className="flex items-start gap-3 rounded-[10px] bg-[#f6f6f5] p-3 text-[12px] leading-5 text-[#444444]"
                key={item}
              >
                <Check className="mt-0.5 size-4 shrink-0 text-[#111111]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}

function Toast({ message }: { message: string | null }) {
  if (!message) {
    return null
  }

  return (
    <div className="fixed right-5 bottom-5 z-[60] rounded-full border border-[#e2e2e2] bg-white px-4 py-3 text-[12px] font-semibold text-[#222222] shadow-[0_12px_35px_rgba(0,0,0,0.18)]">
      {message}
    </div>
  )
}

async function requestJson<T>(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  const payload = await response
    .json()
    .catch(() => null as unknown)

  if (!response.ok) {
    throw new Error(extractApiError(payload) ?? `请求失败：${response.status}`)
  }

  return payload as T
}

async function registerUser(payload: {
  username: string
  password: string
  location: string | null
  fitness_status: string | null
}) {
  return requestJson<UserProfile>("/auth/register", {
    body: JSON.stringify(payload),
    method: "POST",
  })
}

async function loginUser(username: string, password: string) {
  return requestJson<TokenResponse>("/auth/login", {
    body: JSON.stringify({ username, password }),
    method: "POST",
  })
}

async function getCurrentUser(token: string) {
  return requestJson<UserProfile>("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

function extractApiError(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null
  }

  if ("detail" in payload) {
    const detail = payload.detail
    if (typeof detail === "string") {
      return detail
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (item && typeof item === "object" && "msg" in item) {
            return String(item.msg)
          }
          return String(item)
        })
        .join("；")
    }
  }

  return null
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return "请求失败，请稍后再试"
}

function buildAssistantReply(prompt: string) {
  if (prompt.includes("饮食") || prompt.includes("早餐")) {
    return "已记录这次饮食。粗略估算：蛋白质约 24g，碳水约 45g，脂肪约 18g；如果晚餐训练后补一份优质蛋白，今天会更稳。"
  }

  if (prompt.includes("膝") || prompt.includes("疼")) {
    return "收到右膝反馈。今天继续避免深膝屈和跳跃，训练中疼痛超过 3/10 就停止；我会优先安排髋主导和核心稳定动作。"
  }

  if (prompt.includes("历史") || prompt.includes("7 天")) {
    return "最近 7 天训练密度偏高，下肢恢复窗口略短。建议下一次下肢训练前至少保留 48 小时，并把睡眠目标提到 7 小时以上。"
  }

  return "收到。我会把这条反馈纳入当前计划：优先控制训练风险，同时保持 20 分钟内可完成。"
}

function buildProfilePanel(
  user: UserProfile | null,
  completedExercises: string[]
): DetailPanel {
  if (!user) {
    return {
      title: "未登录",
      body: "登录后可以查看个人资料、经验值和后端同步状态。",
    }
  }

  return {
    title: "个人信息",
    body: `${user.username} 的训练档案已从后端同步。当前经验值为本地演示数据，用户基础资料来自 /api/v1/auth/me。`,
    items: [
      `用户 ID：${user.id}`,
      `地区：${user.location ?? "未设置"}`,
      `训练状态：${user.fitness_status ?? "未设置"}`,
      `饮食习惯：${user.dietary_habits ?? "未设置"}`,
      `今日已完成动作：${completedExercises.length}/2`,
    ],
  }
}

function formatTime() {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
  }).format(new Date())
}

export default App
