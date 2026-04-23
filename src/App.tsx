import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react"

import {
  baseMetrics,
  completionMetricIcon,
  initialMessages,
  initialNotifications,
} from "@/data/kratos"
import {
  AUTH_TOKEN_KEY,
  getCurrentUser,
  getErrorMessage,
  loginUser,
  registerUser,
  updateCurrentUser,
} from "@/lib/api"
import {
  buildAssistantReply,
  buildProfilePanel,
  compactOptionalText,
  formatTime,
} from "@/lib/kratos"
import { MainConversation } from "@/components/kratos/MainConversation"
import {
  AuthModal,
  DetailModal,
  ProfileEditModal,
  Toast,
} from "@/components/kratos/Modals"
import { RightPanel } from "@/components/kratos/RightPanel"
import { Sidebar } from "@/components/kratos/Sidebar"
import { useTheme } from "@/components/theme-provider"
import type {
  AuthForm,
  AuthMode,
  ChatMessage,
  DetailPanel,
  Metric,
  NotificationItem,
  ProfileForm,
  QuickAction,
  UserProfile,
  UserUpdatePayload,
} from "@/types/kratos"

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
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [profileSubmitting, setProfileSubmitting] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
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
  const displayName = currentUser?.username ?? "请登录"
  const metrics = useMemo<Metric[]>(
    () => [
      ...baseMetrics,
      {
        label: "今日训练完成度",
        value: `${Math.min(2 + completedExercises.length, 3)}/3`,
        icon: completionMetricIcon,
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
    setProfileModalOpen(false)
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

  const openProfileEditor = () => {
    if (!currentUser) {
      openAuth("login")
      return
    }

    setProfileError(null)
    setProfileMenuOpen(false)
    setProfileModalOpen(true)
  }

  const handleProfileSubmit = async (form: ProfileForm) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      return
    }

    const age = form.age.trim()
    const parsedAge = age ? Number(age) : null
    if (parsedAge !== null && (!Number.isInteger(parsedAge) || parsedAge < 0)) {
      setProfileError("年龄必须是 0 或更大的整数")
      return
    }

    const payload: UserUpdatePayload = {
      gender: compactOptionalText(form.gender),
      age: parsedAge,
      location: compactOptionalText(form.location),
      dietary_habits: compactOptionalText(form.dietaryHabits),
      fitness_status: compactOptionalText(form.fitnessStatus),
    }

    setProfileSubmitting(true)
    setProfileError(null)

    try {
      const updatedUser = await updateCurrentUser(token, payload)
      setCurrentUser(updatedUser)
      setProfileModalOpen(false)
      setToast("个人资料已更新")
    } catch (error) {
      setProfileError(getErrorMessage(error))
    } finally {
      setProfileSubmitting(false)
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

    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        author: "user",
        body,
        time: formatTime(),
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
      <div className="mx-auto flex h-[calc(100svh-2rem)] w-full max-w-[1488px] overflow-hidden rounded-[22px] border border-white/80 bg-white shadow-[0_18px_55px_rgba(0,0,0,0.12)] max-xl:h-auto max-xl:min-h-[calc(100svh-2rem)] max-xl:flex-col max-xl:overflow-visible">
        <Sidebar
          activeNav={activeNav}
          authLoading={authLoading}
          collapsed={sidebarCollapsed}
          currentUser={currentUser}
          menuOpen={profileMenuOpen}
          onEditProfile={openProfileEditor}
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
      <ProfileEditModal
        error={profileError}
        key={`${currentUser?.id ?? "guest"}-${profileModalOpen ? "open" : "closed"}`}
        loading={profileSubmitting}
        onClose={() => setProfileModalOpen(false)}
        onSubmit={handleProfileSubmit}
        open={profileModalOpen}
        user={currentUser}
      />
      <DetailModal
        panel={detailPanel}
        onClose={() => setDetailPanel(null)}
      />
      <Toast message={toast} />
    </div>
  )
}

export default App
