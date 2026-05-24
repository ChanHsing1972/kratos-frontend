import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react"

import { PanelLeft } from "lucide-react"
import { toast as sonnerToast } from "sonner"

import { initialMessages, initialNotifications } from "@/features/kratos/model/fixtures"
import {
  AUTH_TOKEN_KEY,
  createAgentSession,
  createAgentCheckin,
  createBodyMetric,
  createMyFitnessProfile,
  createSkill,
  createTrainingPlan,
  createWorkoutLog,
  deleteAgentSession,
  deleteSkill,
  deleteTrainingPlan,
  exportAgentRunRagas,
  getAgentSession,
  getCurrentUser,
  getErrorMessage,
  listAgentRunsForSession,
  listAgentSessions,
  listSkills,
  loginUser,
  previewTrainingPlanAdjustment,
  registerUser,
  renameAgentSession,
  streamAgentChat,
  updateAgentCheckin,
  updateBodyMetric,
  updateAgentSession,
  updateSkillBinding,
  updateMyFitnessProfile,
  updateTrainingPlan,
} from "@/entities/kratos/api/client"
import {
  buildPlanPanel,
  chatMessagesFromAgentRuns,
  chatSessionFromAgentSession,
  chatSessionsFromAgentSessions,
  formatTime,
  getLatestByDate,
  titleFromPrompt,
  trainingPlanPayloadFromAgentResult,
} from "@/entities/kratos/lib/domain"
import {
  loadDashboardSnapshot,
  loadInitialAuthSnapshot,
} from "@/entities/kratos/api/dashboard"
import {
  markGeneratedTrainingPlanMessages,
  sortChatSessions,
} from "@/features/kratos/lib/chatSessions"
import {
  downloadJsonFile,
  safeFilename,
} from "@/features/kratos/lib/conversationExport"
import {
  buildBodyPayload,
  buildProfilePayload,
} from "@/features/kratos/lib/formPayloads"
import {
  clearCachedUser,
  readActiveAgentSessionId,
  readCachedUser,
  readGeneratedTrainingPlanKeys,
  writeCachedUser,
  writeActiveAgentSessionId,
  writeGeneratedTrainingPlanKeys,
} from "@/features/kratos/lib/storage"
import { ProfileMenu } from "@/features/kratos/profile/ProfileMenu"
import {
  compactTrainingPlanProposal,
  formatDuration,
  isDailyPlanForAdjustment,
  trainingPlanDraftKey,
  trainingPlanPayloadFromPlan,
} from "@/features/kratos/lib/trainingPlans"
import { createId } from "@/shared/lib/id"
import { BodyDataPage } from "@/pages/kratos/BodyDataPage"
import { ConversationDetailPage } from "@/pages/kratos/ConversationDetailPage"
import { EvaluationPage } from "@/pages/kratos/EvaluationPage"
import { NewConversationPage } from "@/pages/kratos/NewConversationPage"
import { SkillPanelPage } from "@/pages/kratos/SkillPanelPage"
import { TrainingPlanPage } from "@/pages/kratos/TrainingPlanPage"
import { AuthModal } from "@/widgets/kratos/modals/AuthModal"
import { BodyMetricModal } from "@/widgets/kratos/modals/BodyMetricModal"
import { DetailModal } from "@/widgets/kratos/modals/DetailModal"
import { OnboardingModal } from "@/widgets/kratos/modals/OnboardingModal"
import { TrainingFeedbackModal } from "@/widgets/kratos/modals/TrainingFeedbackModal"
import { TrainingPlanModal } from "@/widgets/kratos/modals/TrainingPlanModal"
import { Sidebar } from "@/widgets/kratos/sidebar/Sidebar"
import { SidebarProvider } from "@/shared/ui/sidebar"
import { Toaster } from "@/shared/ui/sonner"
import { useTheme } from "@/app/providers/theme-provider"
import type {
  AgentCheckin,
  AgentRun,
  AuthForm,
  AuthMode,
  BodyMetric,
  BodyMetricForm,
  ChatSession,
  ChatMessage,
  DetailPanel,
  FitnessContext,
  FitnessProfile,
  FitnessProfilePayload,
  OnboardingStatus,
  NotificationItem,
  ProfileForm,
  QuickAction,
  Skill,
  SkillPayload,
  TrainingPlan,
  TrainingPlanAdjustmentResponse,
  TrainingPlanPayload,
  UserProfile,
  WorkoutLog,
} from "@/entities/kratos/model/types"
import { Button } from "@/shared/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog"

type TrainingSession = {
  actionIds: string[]
  accumulatedSeconds: number
  dayTitle: string
  isPaused: boolean
  startedAt: number
  workoutDate: string
}

export function KratosPage() {
  const { setTheme, theme } = useTheme()
  const [activeNav, setActiveNav] = useState("new")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarDrawerOpen, setSidebarDrawerOpen] = useState(false)
  const [conversationLoading, setConversationLoading] = useState(false)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() =>
    readActiveAgentSessionId()
  )
  const [authMode, setAuthMode] = useState<AuthMode>("login")
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authLoading, setAuthLoading] = useState(
    () => Boolean(localStorage.getItem(AUTH_TOKEN_KEY)) && !readCachedUser()
  )
  const [authSubmitting, setAuthSubmitting] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() =>
    readCachedUser()
  )
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [profileSubmitting, setProfileSubmitting] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [onboardingSubmitting, setOnboardingSubmitting] = useState(false)
  const [onboardingError, setOnboardingError] = useState<string | null>(null)
  const [bodyMetricModalOpen, setBodyMetricModalOpen] = useState(false)
  const [bodyMetricSubmitting, setBodyMetricSubmitting] = useState(false)
  const [bodyMetricError, setBodyMetricError] = useState<string | null>(null)
  const [trainingPlanModalOpen, setTrainingPlanModalOpen] = useState(false)
  const [trainingPlanDraft, setTrainingPlanDraft] =
    useState<TrainingPlanPayload | null>(null)
  const [editingTrainingPlanId, setEditingTrainingPlanId] = useState<
    number | null
  >(null)
  const [deletingPlan, setDeletingPlan] = useState<TrainingPlan | null>(null)
  const [deletingSkill, setDeletingSkill] = useState<Skill | null>(null)
  const [trainingPlanSubmitting, setTrainingPlanSubmitting] = useState(false)
  const [trainingPlanError, setTrainingPlanError] = useState<string | null>(
    null
  )
  const [chatTrainingPlanSavingId, setChatTrainingPlanSavingId] = useState<
    string | null
  >(null)
  const [generatedTrainingPlanKeys, setGeneratedTrainingPlanKeys] = useState<
    Set<string>
  >(() => readGeneratedTrainingPlanKeys())
  const [thinkingExpanded, setThinkingExpanded] = useState(true)
  const [composerValue, setComposerValue] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [agentStreaming, setAgentStreaming] = useState(false)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [skillSubmitting, setSkillSubmitting] = useState(false)
  const [skillError, setSkillError] = useState<string | null>(null)
  const [fitnessContext, setFitnessContext] = useState<FitnessContext | null>(
    null
  )
  const [fitnessProfile, setFitnessProfile] = useState<FitnessProfile | null>(
    null
  )
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetric[]>([])
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([])
  const [agentCheckins, setAgentCheckins] = useState<AgentCheckin[]>([])
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(initialNotifications)
  const [detailPanel, setDetailPanel] = useState<DetailPanel | null>(null)
  const [completedExercises, setCompletedExercises] = useState<string[]>([])
  const [trainingStarted, setTrainingStarted] = useState(false)
  const [trainingSession, setTrainingSession] =
    useState<TrainingSession | null>(null)
  const [trainingElapsedSeconds, setTrainingElapsedSeconds] = useState(0)
  const [trainingPaused, setTrainingPaused] = useState(false)
  const [trainingFeedbackOpen, setTrainingFeedbackOpen] = useState(false)
  const [trainingFeedback, setTrainingFeedback] = useState("")
  const [trainingFeedbackError, setTrainingFeedbackError] = useState<
    string | null
  >(null)
  const [trainingFeedbackLoading, setTrainingFeedbackLoading] = useState(false)
  const [trainingAdjustment, setTrainingAdjustment] =
    useState<TrainingPlanAdjustmentResponse | null>(null)
  const [lastCompletedWorkout, setLastCompletedWorkout] = useState<{
    completed: boolean
    durationSeconds: number
    title: string
  } | null>(null)
  const activeStreamRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!profileMenuOpen && !notificationsOpen) {
      return undefined
    }

    const closeFloatingMenus = (event: PointerEvent) => {
      if ((event.target as Element | null)?.closest("[data-popover-root]")) {
        return
      }
      setProfileMenuOpen(false)
      setNotificationsOpen(false)
    }

    document.addEventListener("pointerdown", closeFloatingMenus)
    return () => {
      document.removeEventListener("pointerdown", closeFloatingMenus)
    }
  }, [notificationsOpen, profileMenuOpen])

  const unreadCount = notifications.filter((item) => !item.read).length
  const activePlan =
    trainingPlans.find((plan) => plan.status === "active") ??
    getLatestByDate(trainingPlans, (plan) => plan.updated_at) ??
    null
  const activeSession =
    chatSessions.find((session) => session.id === activeSessionId) ?? null
  const activeSessionTitle = activeSession?.title ?? "新的训练对话"
  const latestMetric =
    getLatestByDate(bodyMetrics, (metric) => metric.recorded_at) ?? null
  const latestCheckin =
    getLatestByDate(agentCheckins, (checkin) => checkin.created_at) ?? null
  const onboardingStatus: OnboardingStatus | null =
    fitnessContext?.onboarding ?? null

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      clearCachedUser()
      setCurrentUser(null)
      setAuthLoading(false)
      return
    }

    setAuthLoading(!readCachedUser())
    setDashboardLoading(true)
    let ignore = false

    loadInitialAuthSnapshot(token)
      .then(async ({ context, plans, runs, skills: nextSkills, user }) => {
        if (ignore) {
          return
        }
        writeCachedUser(user)
        setCurrentUser(user)
        applyDashboardSnapshot(context, plans, runs, nextSkills)
        setOnboardingOpen(!context?.onboarding.ready_for_agent)
        const selectedSessionId = await syncConversationSessions(
          token,
          readActiveAgentSessionId()
        )

        if (!selectedSessionId) {
          setMessages(initialMessages)
          setActiveSessionId(null)
          setActiveNav("new")
          return
        }

        await loadConversationSession(token, selectedSessionId)
      })
      .catch(() => {
        if (ignore) {
          return
        }
        localStorage.removeItem(AUTH_TOKEN_KEY)
        clearCachedUser()
        setCurrentUser(null)
      })
      .finally(() => {
        if (ignore) {
          return
        }
        setAuthLoading(false)
        setDashboardLoading(false)
      })

    return () => {
      ignore = true
    }
    // Only restore persisted auth state on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!trainingSession) {
      setTrainingElapsedSeconds(0)
      return undefined
    }

    const updateElapsed = () => {
      if (trainingSession.isPaused) {
        setTrainingElapsedSeconds(trainingSession.accumulatedSeconds)
        return
      }

      setTrainingElapsedSeconds(
        Math.max(
          0,
          trainingSession.accumulatedSeconds +
          Math.floor((Date.now() - trainingSession.startedAt) / 1000)
        )
      )
    }

    updateElapsed()
    const timer = window.setInterval(updateElapsed, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [trainingSession])

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
        })
      }

      const token = await loginUser(form.username, form.password)
      localStorage.setItem(AUTH_TOKEN_KEY, token.access_token)
      const user = await getCurrentUser(token.access_token)
      writeCachedUser(user)
      setCurrentUser(user)
      const context = await refreshDashboard(token.access_token)
      const selectedSessionId = await syncConversationSessions(
        token.access_token,
        readActiveAgentSessionId()
      )

      if (selectedSessionId) {
        await loadConversationSession(token.access_token, selectedSessionId)
      } else {
        setMessages(initialMessages)
        setActiveSessionId(null)
        setActiveNav("new")
      }

      setAuthModalOpen(false)
      setOnboardingOpen(
        authMode === "register" || !context?.onboarding.ready_for_agent
      )
      sonnerToast.success(
        authMode === "register" ? "账号创建成功，请先完成建档" : `欢迎回来，${user.username}`
      )
    } catch (error) {
      setAuthError(getErrorMessage(error))
    } finally {
      setAuthSubmitting(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    clearCachedUser()
    setCurrentUser(null)
    setFitnessContext(null)
    setTrainingPlans([])
    setSkills([])
    setSkillError(null)
    setFitnessProfile(null)
    setBodyMetrics([])
    setWorkoutLogs([])
    setAgentCheckins([])
    setMessages(initialMessages)
    setActiveSessionId(null)
    writeActiveAgentSessionId(null)
    setChatSessions([])
    setProfileMenuOpen(false)
    setOnboardingOpen(false)
    setBodyMetricModalOpen(false)
    sonnerToast.info("已退出登录")
  }

  const openBodyMetricEditor = () => {
    if (!currentUser) {
      openAuth("login")
      return
    }

    setBodyMetricError(null)
    setBodyMetricModalOpen(true)
  }

  const handleProfileSubmit = async (form: ProfileForm) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      return
    }

    const payload = buildProfilePayload(form, setProfileError)
    if (!payload) {
      return
    }

    setProfileSubmitting(true)
    setProfileError(null)

    try {
      const updatedProfile = await upsertFitnessProfile(token, payload)
      setFitnessProfile(updatedProfile)
      await refreshDashboard(token, { preserveMessages: true })
      sonnerToast.success("个人资料已更新")
    } catch (error) {
      setProfileError(getErrorMessage(error))
    } finally {
      setProfileSubmitting(false)
    }
  }

  const handleNavSelect = (label: string) => {
    if (label === "评估平台") {
      window.open("http://192.0.2.1/eval", "_blank", "noopener,noreferrer")
      setSidebarDrawerOpen(false)
      return
    }
    setActiveNav(label)
    setSidebarDrawerOpen(false)
  }

  const syncConversationSessions = async (
    token: string,
    preferredSessionId: string | null = activeSessionId
  ) => {
    const sessions = await listAgentSessions(token, {
      includeArchived: true,
      includeDeleted: false,
      limit: 200,
    })
    const nextSessions = chatSessionsFromAgentSessions(sessions)
      .filter((session) => !session.deleted && session.messageCount > 0)
      .sort(sortChatSessions)
    setChatSessions(nextSessions)

    const nextActiveSessionId =
      preferredSessionId &&
        nextSessions.some((session) => session.id === preferredSessionId)
        ? preferredSessionId
        : nextSessions[0]?.id ?? null

    setActiveSessionId(nextActiveSessionId)
    writeActiveAgentSessionId(nextActiveSessionId)
    return nextActiveSessionId
  }

  const loadConversationSession = async (token: string, sessionId: string) => {
    setConversationLoading(true)
    setSidebarDrawerOpen(false)

    try {
      const [session, runs] = await Promise.all([
        getAgentSession(token, sessionId),
        listAgentRunsForSession(token, sessionId),
      ])

      const mappedSession = chatSessionFromAgentSession(session)
      if (runs.length === 0) {
        setChatSessions((current) => current.filter((item) => item.id !== sessionId))
        if (activeSessionId === sessionId) {
          setActiveSessionId(null)
          writeActiveAgentSessionId(null)
          setActiveNav("new")
        }
        throw new Error(
          session.run_count > 0
            ? "会话元信息存在，但消息记录未返回，请刷新后重试"
            : "这是一个没有消息的空会话，已从历史列表移除"
        )
      }

      setChatSessions((current) =>
        [mappedSession, ...current.filter((item) => item.id !== sessionId)]
          .filter((item) => !item.deleted)
          .sort(sortChatSessions)
      )

      setMessages(
        markGeneratedTrainingPlanMessages(
          chatMessagesFromAgentRuns(runs),
          generatedTrainingPlanKeys
        )
      )
      setActiveSessionId(sessionId)
      writeActiveAgentSessionId(sessionId)
      setActiveNav(sessionId)
    } finally {
      setConversationLoading(false)
    }
  }

  const handleCreateConversation = () => {
    activeStreamRef.current?.abort()
    setMessages(initialMessages)
    setActiveSessionId(null)
    writeActiveAgentSessionId(null)
    setComposerValue("")
    setAgentStreaming(false)
    setActiveNav("new")
    setConversationLoading(false)
    setSidebarDrawerOpen(false)
    sonnerToast.success("已新建对话")
  }

  const handleSelectConversation = async (sessionId: string) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      return
    }

    activeStreamRef.current?.abort()

    try {
      await loadConversationSession(token, sessionId)
      sonnerToast.success("对话已切换")
    } catch (error) {
      sonnerToast.error(getErrorMessage(error), { richColors: true })
    }
  }

  const handleRenameConversation = (sessionId: string, title: string) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      return
    }

    void renameAgentSession(token, sessionId, title)
      .then((session) => {
        setChatSessions((current) =>
          [chatSessionFromAgentSession(session), ...current.filter((item) => item.id !== session.session_id)]
            .filter((item) => !item.deleted)
            .sort(sortChatSessions)
        )
        sonnerToast.success("对话已重命名")
      })
      .catch((error) => {
        sonnerToast.error(getErrorMessage(error), { richColors: true })
      })
  }

  const handleTogglePinConversation = (sessionId: string) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      return
    }

    const session = chatSessions.find((item) => item.id === sessionId)
    const nextPinned = !session?.pinned

    void updateAgentSession(token, sessionId, {
      is_pinned: nextPinned,
    })
      .then((updated) => {
        setChatSessions((current) =>
          [chatSessionFromAgentSession(updated), ...current.filter((item) => item.id !== updated.session_id)]
            .filter((item) => !item.deleted)
            .sort(sortChatSessions)
        )
      })
      .catch((error) => {
        sonnerToast.error(getErrorMessage(error), { richColors: true })
      })
  }

  const handleDeleteConversation = (sessionId: string) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      return
    }

    void deleteAgentSession(token, sessionId)
      .then(() => {
        setChatSessions((current) => current.filter((item) => item.id !== sessionId))

        if (activeSessionId === sessionId) {
          setMessages(initialMessages)
          setActiveSessionId(null)
          writeActiveAgentSessionId(null)
          setActiveNav("new")
        }

        sonnerToast.success("对话已删除")
      })
      .catch((error) => {
        sonnerToast.error(getErrorMessage(error), { richColors: true })
      })
  }

  const handleExportConversation = async (sessionId: string) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      return
    }

    const session = chatSessions.find((item) => item.id === sessionId)
    sonnerToast.info("正在导出为 JSON 文件")

    try {
      const runs = await listAgentRunsForSession(token, sessionId)
      const latestRun = runs[runs.length - 1]
      if (!latestRun) {
        sonnerToast.info("这段对话暂无可导出的消息")
        return
      }

      const payload = await exportAgentRunRagas(token, latestRun.id)
      downloadJsonFile(
        payload,
        `${safeFilename(session?.title ?? "kratos-conversation")}-${sessionId}.json`
      )
      sonnerToast.success("对话 JSON 已导出")
    } catch (error) {
      sonnerToast.error(getErrorMessage(error), { richColors: true })
    }
  }

  const handleBodyMetricSubmit = async (form: BodyMetricForm) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      return
    }

    const bodyPayload = buildBodyPayload(form, setBodyMetricError)
    if (!bodyPayload) {
      return
    }

    setBodyMetricSubmitting(true)
    setBodyMetricError(null)

    try {
      if (bodyPayload.hasMetricData) {
        const metric = latestMetric
          ? await updateBodyMetric(token, latestMetric.id, bodyPayload.metric)
          : await createBodyMetric(token, bodyPayload.metric)
        setBodyMetrics((current) =>
          latestMetric
            ? current.map((item) => (item.id === metric.id ? metric : item))
            : [metric, ...current]
        )
      }

      if (bodyPayload.hasCheckinData) {
        const checkin = latestCheckin
          ? await updateAgentCheckin(token, latestCheckin.id, {
            ...bodyPayload.checkin,
            summary: "手动更新恢复状态",
          })
          : await createAgentCheckin(token, {
            ...bodyPayload.checkin,
            summary: "手动更新恢复状态",
            training_plan_id: activePlan?.id ?? null,
          })
        setAgentCheckins((current) =>
          latestCheckin
            ? current.map((item) => (item.id === checkin.id ? checkin : item))
            : [checkin, ...current]
        )
      }

      await refreshDashboard(token, { preserveMessages: true })
      setBodyMetricModalOpen(false)
      sonnerToast.success("身体数据已更新")
    } catch (error) {
      setBodyMetricError(getErrorMessage(error))
    } finally {
      setBodyMetricSubmitting(false)
    }
  }

  const refreshDashboard = async (
    token: string,
    options: { preserveMessages?: boolean } = {}
  ): Promise<FitnessContext | null> => {
    setDashboardLoading(true)

    try {
      const { context, plans, runs, skills: nextSkills } = await loadDashboardSnapshot(token)
      applyDashboardSnapshot(context, plans, runs, nextSkills, options)
      return context
    } catch (error) {
      sonnerToast.error(getErrorMessage(error), { richColors: true })
      return null
    } finally {
      setDashboardLoading(false)
    }
  }

  function applyDashboardSnapshot(
    context: FitnessContext,
    plans: TrainingPlan[],
    _runs: AgentRun[],
    nextSkills: Skill[],
    _options: { preserveMessages?: boolean } = {}
  ) {
    void _options
    setFitnessContext(context)
    setTrainingPlans(plans)
    setSkills(nextSkills)
    setSkillError(null)
    setFitnessProfile(context.profile)
    setBodyMetrics(context.recent_body_metrics)
    setWorkoutLogs(context.recent_workout_logs)
    setAgentCheckins(context.recent_checkins)
  }

  const upsertFitnessProfile = async (
    token: string,
    payload: FitnessProfilePayload
  ) => {
    try {
      return await updateMyFitnessProfile(token, payload)
    } catch {
      return createMyFitnessProfile(token, payload)
    }
  }

  const handleOnboardingSubmit = async (
    profileForm: ProfileForm,
    bodyForm: BodyMetricForm
  ) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      return
    }

    const profilePayload = buildProfilePayload(profileForm, setOnboardingError)
    if (!profilePayload) {
      return
    }
    const bodyPayload = buildBodyPayload(bodyForm, setOnboardingError)
    if (!bodyPayload) {
      return
    }

    setOnboardingSubmitting(true)
    setOnboardingError(null)

    try {
      const updatedProfile = await upsertFitnessProfile(token, profilePayload)
      setFitnessProfile(updatedProfile)

      if (bodyPayload.hasMetricData) {
        await (latestMetric
          ? updateBodyMetric(token, latestMetric.id, bodyPayload.metric)
          : createBodyMetric(token, bodyPayload.metric))
      }
      if (bodyPayload.hasCheckinData) {
        await (latestCheckin
          ? updateAgentCheckin(token, latestCheckin.id, {
            ...bodyPayload.checkin,
            summary: "新用户引导恢复状态记录",
          })
          : createAgentCheckin(token, {
            ...bodyPayload.checkin,
            summary: "新用户引导恢复状态记录",
            training_plan_id: activePlan?.id ?? null,
          }))
      }

      const context = await refreshDashboard(token, { preserveMessages: true })
      setOnboardingOpen(!context?.onboarding.ready_for_agent)
      sonnerToast.success("建档完成，Kratos 现在更了解您了")
    } catch (error) {
      setOnboardingError(getErrorMessage(error))
    } finally {
      setOnboardingSubmitting(false)
    }
  }

  const handleSendMessage = async () => {
    const body = composerValue.trim()
    if (!body) {
      sonnerToast.warning("不可发送空白消息")
      return
    }

    if (agentStreaming) {
      sonnerToast.warning("Kratos 正在回复，请稍等")
      return
    }

    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      sonnerToast.info("登录后开始对话")
      return
    }

    let nextSessionId = activeSessionId
    try {
      if (!nextSessionId) {
        const session = await createAgentSession(token)
        nextSessionId = session.session_id
        const sessionTitle = titleFromPrompt(body)
        setActiveSessionId(nextSessionId)
        writeActiveAgentSessionId(nextSessionId)
        setChatSessions((current) =>
          [
            {
              ...chatSessionFromAgentSession(session),
              title: sessionTitle,
            },
            ...current.filter((item) => item.id !== session.session_id),
          ].sort(sortChatSessions)
        )
        void renameAgentSession(token, nextSessionId, sessionTitle).catch(
          () => undefined
        )
      }
    } catch (error) {
      sonnerToast.error(getErrorMessage(error), { richColors: true })
      return
    }

    const assistantMessageId = createId()
    const controller = new AbortController()
    activeStreamRef.current = controller
    setAgentStreaming(true)
    setMessages((current) => [
      ...current,
      {
        id: createId(),
        author: "user",
        body,
        time: formatTime(),
      },
      {
        id: assistantMessageId,
        author: "assistant",
        body: "",
        startedAt: Date.now(),
        streaming: true,
        time: formatTime(),
        trace: [
          {
            type: "status",
            content: "正在连接 Kratos Agent...",
          },
        ],
      },
    ])
    setComposerValue("")

    let handledStreamSessionId: string | null = null

    try {
      await streamAgentChat({
        message: body,
        onEvent: (event) => {
          if (event.session_id && event.session_id !== handledStreamSessionId) {
            handledStreamSessionId = event.session_id
            const serverSessionId = event.session_id
            const sessionTitle = titleFromPrompt(body)
            const optimisticSessionId = nextSessionId
            nextSessionId = serverSessionId
            setActiveSessionId(serverSessionId)
            writeActiveAgentSessionId(serverSessionId)
            setActiveNav(serverSessionId)
            setChatSessions((current) => {
              const withoutOptimistic =
                optimisticSessionId && optimisticSessionId !== serverSessionId
                  ? current.filter((session) => session.id !== optimisticSessionId)
                  : current

              if (withoutOptimistic.some((session) => session.id === serverSessionId)) {
                return [...withoutOptimistic].sort(sortChatSessions)
              }

              return [
                {
                  id: serverSessionId,
                  title: sessionTitle,
                  preview: body,
                  updatedAt: new Date().toISOString(),
                  messageCount: 2,
                  pinned: false,
                },
                ...withoutOptimistic,
              ].sort(sortChatSessions)
            })
          }

          setMessages((current) =>
            current.map((message) => {
              if (message.id !== assistantMessageId) {
                return message
              }

              if (event.type === "done") {
                return {
                  ...message,
                  body: event.answer ?? message.body,
                  completedAt: Date.now(),
                  streaming: false,
                }
              }

              if (event.type === "answer_delta") {
                return {
                  ...message,
                  body: `${message.body}${event.delta ?? ""}`,
                }
              }

              if (event.type === "error") {
                return {
                  ...message,
                  completedAt: Date.now(),
                  error: event.content,
                  streaming: false,
                  trace: [...(message.trace ?? []), event],
                }
              }

              if (event.type === "final") {
                const suggestedTrainingPlan =
                  trainingPlanPayloadFromAgentResult(event.raw)
                const generatedAlready = suggestedTrainingPlan
                  ? generatedTrainingPlanKeys.has(
                    trainingPlanDraftKey(suggestedTrainingPlan)
                  )
                  : false
                return {
                  ...message,
                  suggestedTrainingPlan:
                    suggestedTrainingPlan ?? message.suggestedTrainingPlan,
                  trainingPlanCreatedId: generatedAlready
                    ? (message.trainingPlanCreatedId ?? -1)
                    : message.trainingPlanCreatedId,
                  trace: [...(message.trace ?? []), event],
                }
              }

              return {
                ...message,
                trace: [...(message.trace ?? []), event],
              }
            })
          )
        },
        sessionId: nextSessionId,
        signal: controller.signal,
        token,
      })
      if (nextSessionId) {
        await syncConversationSessions(token, nextSessionId)
      }
      await refreshDashboard(token, { preserveMessages: true })
    } catch (error) {
      if (controller.signal.aborted) {
        return
      }

      const message = getErrorMessage(error)
      sonnerToast.error(message)
      setMessages((current) =>
        current.map((item) =>
          item.id === assistantMessageId
            ? {
              ...item,
              body: item.body || "抱歉，Agent 连接失败了。",
              error: message,
              streaming: false,
              trace: [
                ...(item.trace ?? []),
                {
                  type: "error",
                  content: message,
                },
              ],
            }
            : item
        )
      )
    } finally {
      activeStreamRef.current = null
      setAgentStreaming(false)
    }
  }

  const handleStopAgent = () => {
    activeStreamRef.current?.abort()
    activeStreamRef.current = null
    setAgentStreaming(false)
    setMessages((current) =>
      current.map((message) =>
        message.streaming
          ? {
            ...message,
            completedAt: Date.now(),
            streaming: false,
            trace: [
              ...(message.trace ?? []),
              {
                type: "status",
                content: "用户已中断本次回复",
              },
            ],
          }
          : message
      )
    )
    sonnerToast.warning("已中断 Agent 回复")
  }

  const handleQuickAction = (action: QuickAction) => {
    if (action.title === "查看历史") {
      setActiveNav("历史记录")
    }
    setComposerValue(action.prompt)
    sonnerToast.info(`${action.title}已填入输入框`)
  }

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing ||
      event.currentTarget.dataset.composing === "true"
    ) {
      return
    }

    event.preventDefault()
    handleSendMessage()
  }

  const handleAttachment = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      sonnerToast.success(`已选择 ${file.name}`)
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

  const handleStartTraining = (
    dayTitle: string,
    workoutDate: string,
    actions: string[]
  ) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      sonnerToast.info("登录后可以保存训练记录")
      return
    }

    if (actions.length === 0) {
      sonnerToast.info("当前计划没有可记录的训练动作")
      return
    }

    if (trainingSession) {
      sonnerToast.warning("已有训练进行中，请先结束当前训练")
      return
    }

    setCompletedExercises([])
    setTrainingSession({
      actionIds: actions,
      accumulatedSeconds: 0,
      dayTitle,
      isPaused: false,
      startedAt: Date.now(),
      workoutDate,
    })
    setTrainingElapsedSeconds(0)
    setTrainingPaused(false)
    setTrainingStarted(true)
    sonnerToast.info("训练计时已开始，逐个点击动作卡片标记完成")
  }

  const handlePauseTraining = () => {
    if (!trainingSession || trainingSession.isPaused) {
      return
    }

    const elapsedSeconds =
      trainingSession.accumulatedSeconds +
      Math.max(0, Math.floor((Date.now() - trainingSession.startedAt) / 1000))

    setTrainingSession({
      ...trainingSession,
      accumulatedSeconds: elapsedSeconds,
      isPaused: true,
    })
    setTrainingElapsedSeconds(elapsedSeconds)
    setTrainingPaused(true)
    sonnerToast.info("训练已暂停")
  }

  const handleResumeTraining = () => {
    if (!trainingSession || !trainingSession.isPaused) {
      return
    }

    setTrainingSession({
      ...trainingSession,
      isPaused: false,
      startedAt: Date.now(),
    })
    setTrainingPaused(false)
    sonnerToast.info("训练已继续")
  }

  const handleCompleteTrainingDay = (
    dayTitle: string,
    workoutDate: string,
    actionTitles: string[],
    actionIds: string[]
  ) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      sonnerToast.info("登录后可以保存训练记录")
      return
    }

    if (!trainingSession || trainingSession.workoutDate !== workoutDate) {
      sonnerToast.info("请先开始当天训练")
      return
    }

    const elapsedSeconds = trainingSession.isPaused
      ? Math.max(1, trainingSession.accumulatedSeconds)
      : Math.max(
        1,
        trainingSession.accumulatedSeconds +
        Math.floor((Date.now() - trainingSession.startedAt) / 1000)
      )
    const completedActionTitles = actionTitles.filter((_, index) =>
      completedExercises.includes(actionIds[index])
    )
    const allActionsDone = actionIds.every((action) =>
      completedExercises.includes(action)
    )
    const actionsToSave =
      completedActionTitles.length > 0
        ? completedActionTitles
        : ["未标记完成动作"]

    void saveCompletedWorkout(
      token,
      dayTitle,
      workoutDate,
      actionsToSave,
      elapsedSeconds,
      allActionsDone
    )
  }

  const saveCompletedWorkout = async (
    token: string,
    dayTitle: string,
    workoutDate: string,
    actions: string[],
    elapsedSeconds: number,
    completed: boolean
  ) => {
    setDashboardLoading(true)

    try {
      const durationMinutes = Math.max(1, Math.ceil(elapsedSeconds / 60))
      const actionSnapshot = JSON.stringify(actions)
      const log = await createWorkoutLog(token, {
        calories_burned: Math.max(20, Math.round(durationMinutes * 6)),
        completed,
        duration_minutes: durationMinutes,
        duration_seconds: elapsedSeconds,
        notes: `实际训练 ${formatDuration(elapsedSeconds)}；${completed ? "完成全部计划动作" : "提前结束"}；动作快照：${actionSnapshot}；已标记：${actions.join("、")}`,
        perceived_exertion: 6,
        title: dayTitle || activePlan?.title || "未命名训练",
        training_plan_id: activePlan?.id ?? null,
        workout_date: workoutDate,
        workout_type: "strength",
      })
      setWorkoutLogs((current) => [log, ...current])
      setCompletedExercises([])
      setTrainingStarted(false)
      setTrainingSession(null)
      setTrainingElapsedSeconds(0)
      setTrainingPaused(false)
      if (isDailyPlanForAdjustment(activePlan)) {
        setLastCompletedWorkout(null)
        setTrainingFeedback("")
        setTrainingAdjustment(null)
        setTrainingFeedbackError(null)
        setTrainingFeedbackOpen(false)
        sonnerToast.success("每日训练记录已同步，未更新后续计划")
      } else {
        setLastCompletedWorkout({
          completed,
          durationSeconds: elapsedSeconds,
          title: dayTitle || activePlan?.title || "未命名训练",
        })
        setTrainingFeedback("")
        setTrainingAdjustment(null)
        setTrainingFeedbackError(null)
        setTrainingFeedbackOpen(true)
        sonnerToast.success("训练完成记录已同步")
      }
    } catch (error) {
      sonnerToast.error(getErrorMessage(error))
    } finally {
      setDashboardLoading(false)
    }
  }

  const openTrainingPlanComposer = (
    draft: TrainingPlanPayload | null = null
  ) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      sonnerToast.info("登录后可以保存训练计划")
      return
    }

    setEditingTrainingPlanId(null)
    setTrainingPlanDraft(draft)
    setTrainingPlanError(null)
    setTrainingPlanModalOpen(true)
  }

  const openTrainingPlanEditor = (plan: TrainingPlan) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      sonnerToast.info("登录后可以修改训练计划")
      return
    }

    setEditingTrainingPlanId(plan.id)
    setTrainingPlanDraft(trainingPlanPayloadFromPlan(plan))
    setTrainingPlanError(null)
    setTrainingPlanModalOpen(true)
  }

  const handleTrainingPlanSubmit = async (payload: TrainingPlanPayload) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      sonnerToast.info("登录后可以保存训练计划")
      return
    }

    if (!payload.title.trim()) {
      setTrainingPlanError("计划标题不能为空")
      return
    }

    if (!payload.weekly_schedule?.trim()) {
      setTrainingPlanError("请至少填写一条周训练安排")
      return
    }

    setTrainingPlanSubmitting(true)
    setTrainingPlanError(null)

    try {
      if (editingTrainingPlanId) {
        const updated = await updateTrainingPlan(
          token,
          editingTrainingPlanId,
          payload
        )
        setTrainingPlans((current) =>
          current.map((plan) => (plan.id === updated.id ? updated : plan))
        )
        await refreshDashboard(token, { preserveMessages: true })
        setTrainingPlanModalOpen(false)
        setTrainingPlanDraft(null)
        setEditingTrainingPlanId(null)
        setActiveNav("训练计划")
        sonnerToast.success("训练计划已更新")
        return
      }

      const plan = await createTrainingPlan(token, payload)
      const generatedKey = trainingPlanDraftKey(payload)
      const nextKeys = new Set(generatedTrainingPlanKeys)
      nextKeys.add(generatedKey)
      setGeneratedTrainingPlanKeys(nextKeys)
      writeGeneratedTrainingPlanKeys(nextKeys)
      setTrainingPlans((current) => [plan, ...current])
      await refreshDashboard(token, { preserveMessages: true })
      setTrainingPlanModalOpen(false)
      setTrainingPlanDraft(null)
      setEditingTrainingPlanId(null)
      setActiveNav("训练计划")
      sonnerToast.success("训练计划已保存")
    } catch (error) {
      setTrainingPlanError(getErrorMessage(error))
    } finally {
      setTrainingPlanSubmitting(false)
    }
  }

  const handleCreateTrainingPlanFromChat = async (
    messageId: string,
    payload: TrainingPlanPayload
  ) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      sonnerToast.info("登录后可以保存训练计划")
      return
    }

    if (!payload.title.trim() || !payload.weekly_schedule?.trim()) {
      openTrainingPlanComposer(payload)
      sonnerToast.info("计划草稿还需要补充后再保存")
      return
    }

    const generatedKey = trainingPlanDraftKey(payload)
    if (generatedTrainingPlanKeys.has(generatedKey)) {
      setMessages((current) =>
        current.map((message) =>
          message.id === messageId
            ? {
              ...message,
              trainingPlanCreatedId: message.trainingPlanCreatedId ?? -1,
            }
            : message
        )
      )
      sonnerToast.info("这份聊天计划已经生成过了")
      return
    }

    setChatTrainingPlanSavingId(messageId)

    try {
      const plan = await createTrainingPlan(token, {
        ...payload,
        status: payload.status ?? "active",
      })
      const nextKeys = new Set(generatedTrainingPlanKeys)
      nextKeys.add(generatedKey)
      setGeneratedTrainingPlanKeys(nextKeys)
      writeGeneratedTrainingPlanKeys(nextKeys)
      setTrainingPlans((current) => [plan, ...current])
      setMessages((current) =>
        current.map((message) =>
          message.id === messageId
            ? { ...message, trainingPlanCreatedId: plan.id }
            : message
        )
      )
      await refreshDashboard(token, { preserveMessages: true })
      setActiveNav("训练计划")
      sonnerToast.success("已根据聊天内容生成训练计划")
    } catch (error) {
      sonnerToast.error(getErrorMessage(error))
    } finally {
      setChatTrainingPlanSavingId(null)
    }
  }

  const handleSelectTrainingPlan = async (plan: TrainingPlan) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      sonnerToast.info("登录后可以切换当前计划")
      return
    }

    if (plan.id === activePlan?.id && plan.status === "active") {
      setDetailPanel(buildPlanPanel(plan))
      return
    }

    setDashboardLoading(true)

    try {
      const activePlansToPause = trainingPlans.filter(
        (item) => item.id !== plan.id && item.status === "active"
      )

      const updated = await updateTrainingPlan(token, plan.id, {
        status: "active",
      })

      await Promise.all(
        activePlansToPause.map((item) =>
          updateTrainingPlan(token, item.id, { status: "paused" })
        )
      )

      setTrainingPlans((current) =>
        current.map((item) => {
          if (item.id === updated.id) {
            return updated
          }

          if (
            activePlansToPause.some((activeItem) => activeItem.id === item.id)
          ) {
            return { ...item, status: "paused" }
          }

          return item
        })
      )
      setCompletedExercises([])
      setTrainingStarted(false)
      await refreshDashboard(token, { preserveMessages: true })
      sonnerToast.success(`已切换到：${updated.title}`)
    } catch (error) {
      sonnerToast.error(getErrorMessage(error))
    } finally {
      setDashboardLoading(false)
    }
  }

  const handleDeleteTrainingPlan = async (plan: TrainingPlan) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      sonnerToast.info("登录后可以删除训练计划")
      return
    }

    setDeletingPlan(plan)
  }

  const executeDeleteTrainingPlan = async () => {
    if (!deletingPlan) return

    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) return

    setDashboardLoading(true)

    try {
      await deleteTrainingPlan(token, deletingPlan.id)
      setTrainingPlans((current) =>
        current.filter((item) => item.id !== deletingPlan.id)
      )
      await refreshDashboard(token, { preserveMessages: true })
      sonnerToast.success("训练计划已删除")
    } catch (error) {
      sonnerToast.error(getErrorMessage(error))
    } finally {
      setDashboardLoading(false)
      setDeletingPlan(null)
    }
  }

  const refreshSkills = async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      sonnerToast.info("登录后可以管理 Skill")
      return
    }

    setDashboardLoading(true)
    setSkillError(null)

    try {
      const nextSkills = await listSkills(token)
      setSkills(nextSkills)
    } catch (error) {
      const message = getErrorMessage(error)
      setSkillError(message)
      sonnerToast.error(message)
    } finally {
      setDashboardLoading(false)
    }
  }

  const handleCreateSkill = async (payload: SkillPayload) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      sonnerToast.info("登录后可以创建 Skill")
      return
    }

    setSkillSubmitting(true)
    setSkillError(null)

    try {
      const skill = await createSkill(token, payload)
      setSkills((current) => [skill, ...current.filter((item) => item.id !== skill.id)])
      sonnerToast.success("Skill 已创建并启用")
    } catch (error) {
      const message = getErrorMessage(error)
      setSkillError(message)
      sonnerToast.error(message)
      throw error
    } finally {
      setSkillSubmitting(false)
    }
  }

  const handleToggleSkill = async (skill: Skill, enabled: boolean) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      sonnerToast.info("登录后可以启用 Skill")
      return
    }

    setSkillSubmitting(true)
    setSkillError(null)

    try {
      const updated = await updateSkillBinding(token, skill.id, enabled)
      setSkills((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      )
      sonnerToast.success(enabled ? "Skill 已启用" : "Skill 已停用")
    } catch (error) {
      const message = getErrorMessage(error)
      setSkillError(message)
      sonnerToast.error(message)
    } finally {
      setSkillSubmitting(false)
    }
  }

  const handleDeleteSkill = async (skill: Skill) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      sonnerToast.info("登录后可以删除自建 Skill")
      return
    }

    if (skill.is_builtin) {
      sonnerToast.info("内置 Skill 只能停用，不能删除")
      return
    }

    setDeletingSkill(skill)
  }

  const executeDeleteSkill = async () => {
    if (!deletingSkill) return

    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) return

    setSkillSubmitting(true)
    setSkillError(null)

    try {
      await deleteSkill(token, deletingSkill.id)
      setSkills((current) => current.filter((item) => item.id !== deletingSkill.id))
      sonnerToast.success("Skill 已删除")
    } catch (error) {
      const message = getErrorMessage(error)
      setSkillError(message)
      sonnerToast.error(message)
    } finally {
      setSkillSubmitting(false)
      setDeletingSkill(null)
    }
  }

  const handlePreviewTrainingAdjustment = async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token || !activePlan || !lastCompletedWorkout) {
      setTrainingFeedbackError("缺少当前计划或训练记录，暂时无法生成调整建议")
      return
    }

    if (isDailyPlanForAdjustment(activePlan)) {
      setTrainingFeedbackError("每日计划不参与后续计划自动调整")
      return
    }

    if (!trainingFeedback.trim()) {
      setTrainingFeedbackError("请先填写本次训练反馈")
      return
    }

    setTrainingFeedbackLoading(true)
    setTrainingFeedbackError(null)

    try {
      const adjustment = await previewTrainingPlanAdjustment(
        token,
        activePlan.id,
        {
          completed: lastCompletedWorkout.completed,
          duration_seconds: lastCompletedWorkout.durationSeconds,
          feedback: trainingFeedback.trim(),
          workout_title: lastCompletedWorkout.title,
        }
      )
      setTrainingAdjustment(adjustment)
    } catch (error) {
      setTrainingFeedbackError(getErrorMessage(error))
    } finally {
      setTrainingFeedbackLoading(false)
    }
  }

  const handleApplyTrainingAdjustment = async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token || !activePlan || !trainingAdjustment) {
      setTrainingFeedbackError("缺少调整建议，暂时无法更新计划")
      return
    }

    if (isDailyPlanForAdjustment(activePlan)) {
      setTrainingFeedbackError("每日计划不参与后续计划自动调整")
      return
    }

    setTrainingFeedbackLoading(true)
    setTrainingFeedbackError(null)

    try {
      const proposal = compactTrainingPlanProposal(trainingAdjustment.proposal)
      const updated = await updateTrainingPlan(token, activePlan.id, proposal)
      setTrainingPlans((current) =>
        current.map((plan) => (plan.id === updated.id ? updated : plan))
      )
      await refreshDashboard(token, { preserveMessages: true })
      setTrainingFeedbackOpen(false)
      setTrainingFeedback("")
      setTrainingAdjustment(null)
      setLastCompletedWorkout(null)
      sonnerToast.success("已根据反馈更新原训练计划")
    } catch (error) {
      setTrainingFeedbackError(getErrorMessage(error))
    } finally {
      setTrainingFeedbackLoading(false)
    }
  }

  const markAllNotificationsRead = () => {
    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        read: true,
      }))
    )
    sonnerToast.success("通知已全部标记为已读")
  }

  const renderWorkspace = () => {
    if (activeNav === "训练计划") {
      return (
        <TrainingPlanPage
          activePlan={activePlan}
          completedExercises={completedExercises}
          dashboardLoading={dashboardLoading}
          onOpenPlanComposer={openTrainingPlanComposer}
          onDeletePlan={handleDeleteTrainingPlan}
          onEditPlan={openTrainingPlanEditor}
          onSelectPlan={handleSelectTrainingPlan}
          onStartTraining={handleStartTraining}
          onCompleteTrainingDay={handleCompleteTrainingDay}
          onPauseTraining={handlePauseTraining}
          onResumeTraining={handleResumeTraining}
          onToggleExercise={toggleExercise}
          trainingElapsedSeconds={trainingElapsedSeconds}
          trainingPaused={trainingPaused}
          trainingSessionDate={trainingSession?.workoutDate ?? null}
          trainingPlans={trainingPlans}
          trainingStarted={trainingStarted}
          workoutLogs={workoutLogs}
        />
      )
    }

    if (activeNav === "身体数据") {
      return (
        <BodyDataPage
          bodyMetrics={bodyMetrics}
          latestCheckin={latestCheckin}
          latestMetric={latestMetric}
          onEditBodyData={openBodyMetricEditor}
          onboarding={onboardingStatus}
          profile={fitnessProfile}
          workoutLogs={workoutLogs}
        />
      )
    }

    if (activeNav === "Skill") {
      return (
        <SkillPanelPage
          currentUser={currentUser}
          error={skillError}
          loading={dashboardLoading}
          onCreateSkill={handleCreateSkill}
          onDeleteSkill={handleDeleteSkill}
          onLogin={() => openAuth("login")}
          onRefresh={refreshSkills}
          onToggleSkill={handleToggleSkill}
          skills={skills}
          submitting={skillSubmitting}
        />
      )
    }

    if (activeNav === "评估平台") {
      return <EvaluationPage />
    }

    const ConversationPage = activeSessionId
      ? ConversationDetailPage
      : NewConversationPage

    return (
      <ConversationPage
        activeSessionTitle={activeSessionTitle}
        agentStreaming={agentStreaming}
        chatTrainingPlanSavingId={chatTrainingPlanSavingId}
        composerValue={composerValue}
        conversationLoading={conversationLoading}
        messages={messages}
        notifications={notifications}
        notificationsOpen={notificationsOpen}
        onAttachment={handleAttachment}
        onComposerChange={setComposerValue}
        onComposerKeyDown={handleComposerKeyDown}
        onCreateTrainingPlanFromMessage={handleCreateTrainingPlanFromChat}
        onEditTrainingPlanDraft={openTrainingPlanComposer}
        onMarkNotificationsRead={markAllNotificationsRead}
        onQuickAction={handleQuickAction}
        onSendMessage={handleSendMessage}
        onStopAgent={handleStopAgent}
        onToggleNotifications={() =>
          setNotificationsOpen((current) => !current)
        }
        onToggleTheme={() => {
          const nextTheme = theme === "dark" ? "light" : "dark"
          setTheme(nextTheme)
          sonnerToast.success(`已切换到${nextTheme === "dark" ? "深色" : "浅色"}模式`)
        }}
        onToggleThinking={() => setThinkingExpanded((current) => !current)}
        thinkingExpanded={thinkingExpanded}
        theme={theme}
        unreadCount={unreadCount}
      />
    )
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <SidebarProvider
        className="flex h-[100svh] w-full overflow-hidden bg-background"
        open={!sidebarCollapsed}
        onOpenChange={(open) => setSidebarCollapsed(!open)}
      >
        <Button
          aria-label="打开侧边栏"
          className="fixed top-4 left-4 z-40 size-10 place-items-center  md:hidden"
          onClick={() => setSidebarDrawerOpen(true)}
          variant="ghost"
        >
          <PanelLeft className="size-5" />
        </Button>
        <Sidebar
          activeNav={activeNav}
          chatSessions={chatSessions}
          drawerOpen={sidebarDrawerOpen}
          footer={
            <ProfileMenu
              authLoading={authLoading}
              menuOpen={profileMenuOpen}
              onEditBodyData={openBodyMetricEditor}
              onLogin={() => openAuth("login")}
              onLogout={handleLogout}
              onProfileSubmit={handleProfileSubmit}
              onRegister={() => openAuth("register")}
              onToggleMenu={setProfileMenuOpen}
              profile={fitnessProfile}
              profileError={profileError}
              profileSubmitting={profileSubmitting}
              user={currentUser}
            />
          }
          onCreateConversation={handleCreateConversation}
          onDeleteConversation={handleDeleteConversation}
          onExportConversation={handleExportConversation}
          onRenameConversation={handleRenameConversation}
          onNavSelect={handleNavSelect}
          onSelectConversation={handleSelectConversation}
          onTogglePinConversation={handleTogglePinConversation}
          onToggleCollapse={() => setSidebarCollapsed((current) => !current)}
          onDrawerOpenChange={setSidebarDrawerOpen}
        />
        {renderWorkspace()}
      </SidebarProvider>

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
      <OnboardingModal
        bodyMetric={latestMetric}
        error={onboardingError}
        key={`${currentUser?.id ?? "guest"}-${onboardingOpen ? "open" : "closed"}-${fitnessProfile?.updated_at ?? "no-profile"}-${latestMetric?.id ?? "no-metric"}`}
        loading={onboardingSubmitting}
        onClose={() => setOnboardingOpen(false)}
        onSubmit={handleOnboardingSubmit}
        open={onboardingOpen && Boolean(currentUser)}
        profile={fitnessProfile}
        status={onboardingStatus}
      />
      <BodyMetricModal
        error={bodyMetricError}
        key={bodyMetricModalOpen ? "body-open" : "body-closed"}
        loading={bodyMetricSubmitting}
        onClose={() => setBodyMetricModalOpen(false)}
        onSubmit={handleBodyMetricSubmit}
        open={bodyMetricModalOpen}
      />
      <TrainingPlanModal
        draft={trainingPlanDraft}
        error={trainingPlanError}
        key={`${trainingPlanModalOpen ? "plan-open" : "plan-closed"}-${trainingPlanDraft?.title ?? "custom"}`}
        loading={trainingPlanSubmitting}
        onClose={() => {
          setTrainingPlanModalOpen(false)
          setEditingTrainingPlanId(null)
        }}
        onSubmit={handleTrainingPlanSubmit}
        open={trainingPlanModalOpen}
      />
      <TrainingFeedbackModal
        adjustment={trainingAdjustment}
        error={trainingFeedbackError}
        feedback={trainingFeedback}
        loading={trainingFeedbackLoading}
        onApply={handleApplyTrainingAdjustment}
        onClose={() => {
          setTrainingFeedbackOpen(false)
          setTrainingFeedback("")
          setTrainingFeedbackError(null)
          setTrainingAdjustment(null)
          setLastCompletedWorkout(null)
        }}
        onFeedbackChange={(value) => {
          setTrainingFeedback(value)
          setTrainingFeedbackError(null)
          setTrainingAdjustment(null)
        }}
        onPreview={handlePreviewTrainingAdjustment}
        open={trainingFeedbackOpen}
      />
      <DetailModal panel={detailPanel} onClose={() => setDetailPanel(null)} />
      <Toaster position="bottom-right" />

      <AlertDialog open={!!deletingPlan} onOpenChange={(open) => {
        if (!open) setDeletingPlan(null)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定删除「{deletingPlan?.title}」吗？</AlertDialogTitle>
            <AlertDialogDescription>相关训练记录会保留。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={dashboardLoading}>取消</AlertDialogCancel>
            <AlertDialogAction disabled={dashboardLoading} onClick={(e) => {
              e.preventDefault()
              executeDeleteTrainingPlan()
            }}>确定</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingSkill} onOpenChange={(open) => {
        if (!open) setDeletingSkill(null)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定删除「{deletingSkill?.name}」吗？</AlertDialogTitle>
            <AlertDialogDescription>此操作无法撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={skillSubmitting}>取消</AlertDialogCancel>
            <AlertDialogAction disabled={skillSubmitting} onClick={(e) => {
              e.preventDefault()
              executeDeleteSkill()
            }}>确定</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default KratosPage
