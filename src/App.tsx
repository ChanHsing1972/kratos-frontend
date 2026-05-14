import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react"

import { Menu } from "lucide-react"

import {
  initialMessages,
  initialNotifications,
} from "@/data/kratos"
import {
  AUTH_TOKEN_KEY,
  createAgentCheckin,
  createBodyMetric,
  createMyFitnessProfile,
  createTrainingPlan,
  createWorkoutLog,
  deleteTrainingPlan,
  getCurrentUser,
  getFitnessContext,
  getErrorMessage,
  listAgentRuns,
  listTrainingPlans,
  loginUser,
  previewTrainingPlanAdjustment,
  registerUser,
  streamAgentChat,
  updateMyFitnessProfile,
  updateTrainingPlan,
} from "@/lib/api"
import {
  buildPlanPanel,
  buildProfilePanel,
  chatMessagesFromAgentRuns,
  chatSessionsFromAgentRuns,
  compactOptionalText,
  formatTime,
  getPlanExerciseLines,
  getLatestByDate,
  titleFromPrompt,
  trainingPlanPayloadFromAgentResult,
} from "@/lib/kratos"
import { createId } from "@/lib/id"
import { MainConversation } from "@/components/kratos/MainConversation"
import {
  AuthModal,
  BodyMetricModal,
  DetailModal,
  OnboardingModal,
  ProfileEditModal,
  TrainingFeedbackModal,
  TrainingPlanModal,
  Toast,
} from "@/components/kratos/Modals"
import {
  BodyDataPage,
  EvaluationPage,
  TrainingPlanPage,
} from "@/components/kratos/DashboardPages"
import { Sidebar } from "@/components/kratos/Sidebar"
import { useTheme } from "@/components/theme-provider"
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
  TrainingPlan,
  TrainingPlanAdjustmentResponse,
  TrainingPlanPayload,
  UserProfile,
  WorkoutLog,
} from "@/types/kratos"

const CHAT_SESSION_META_KEY = "kratos-chat-session-meta"
const GENERATED_TRAINING_PLAN_KEY = "kratos-generated-training-plan-keys"
const AGENT_EVAL_FORMAT_VERSION = "agent-eval-json/v1"

type TrainingSession = {
  actionIds: string[]
  accumulatedSeconds: number
  dayTitle: string
  isPaused: boolean
  startedAt: number
  workoutDate: string
}

export function App() {
  const { setTheme, theme } = useTheme()
  const [activeNav, setActiveNav] = useState("new")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarDrawerOpen, setSidebarDrawerOpen] = useState(false)
  const [conversationLoading, setConversationLoading] = useState(false)
  const [chatSessionMeta, setChatSessionMeta] = useState<
    Record<string, Partial<ChatSession>>
  >(() => readChatSessionMeta())
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
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
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [onboardingSubmitting, setOnboardingSubmitting] = useState(false)
  const [onboardingError, setOnboardingError] = useState<string | null>(null)
  const [bodyMetricModalOpen, setBodyMetricModalOpen] = useState(false)
  const [bodyMetricSubmitting, setBodyMetricSubmitting] = useState(false)
  const [bodyMetricError, setBodyMetricError] = useState<string | null>(null)
  const [trainingPlanModalOpen, setTrainingPlanModalOpen] = useState(false)
  const [trainingPlanDraft, setTrainingPlanDraft] =
    useState<TrainingPlanPayload | null>(null)
  const [editingTrainingPlanId, setEditingTrainingPlanId] = useState<number | null>(null)
  const [trainingPlanSubmitting, setTrainingPlanSubmitting] = useState(false)
  const [trainingPlanError, setTrainingPlanError] = useState<string | null>(null)
  const [chatTrainingPlanSavingId, setChatTrainingPlanSavingId] = useState<string | null>(null)
  const [generatedTrainingPlanKeys, setGeneratedTrainingPlanKeys] = useState<Set<string>>(
    () => readGeneratedTrainingPlanKeys()
  )
  const [thinkingExpanded, setThinkingExpanded] = useState(true)
  const [composerValue, setComposerValue] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [agentSessionId, setAgentSessionId] = useState<string | null>(null)
  const [agentStreaming, setAgentStreaming] = useState(false)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>([])
  const [fitnessContext, setFitnessContext] = useState<FitnessContext | null>(null)
  const [fitnessProfile, setFitnessProfile] = useState<FitnessProfile | null>(null)
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetric[]>([])
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([])
  const [agentCheckins, setAgentCheckins] = useState<AgentCheckin[]>([])
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(initialNotifications)
  const [detailPanel, setDetailPanel] = useState<DetailPanel | null>(null)
  const [completedExercises, setCompletedExercises] = useState<string[]>([])
  const [trainingStarted, setTrainingStarted] = useState(false)
  const [trainingSession, setTrainingSession] = useState<TrainingSession | null>(null)
  const [trainingElapsedSeconds, setTrainingElapsedSeconds] = useState(0)
  const [trainingPaused, setTrainingPaused] = useState(false)
  const [trainingFeedbackOpen, setTrainingFeedbackOpen] = useState(false)
  const [trainingFeedback, setTrainingFeedback] = useState("")
  const [trainingFeedbackError, setTrainingFeedbackError] = useState<string | null>(null)
  const [trainingFeedbackLoading, setTrainingFeedbackLoading] = useState(false)
  const [trainingAdjustment, setTrainingAdjustment] =
    useState<TrainingPlanAdjustmentResponse | null>(null)
  const [lastCompletedWorkout, setLastCompletedWorkout] = useState<{
    completed: boolean
    durationSeconds: number
    title: string
  } | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const activeStreamRef = useRef<AbortController | null>(null)
  const chatSessionMetaRef = useRef(chatSessionMeta)

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
    chatSessions.find((session) => session.id === agentSessionId) ?? null
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
      setAuthLoading(false)
      return
    }

    getCurrentUser(token)
      .then(async (user) => {
        setCurrentUser(user)
        const context = await refreshDashboard(token)
        setOnboardingOpen(!context?.onboarding.ready_for_agent)
        setToast(`欢迎回来，${user.username}`)
      })
      .catch(() => {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        setCurrentUser(null)
      })
      .finally(() => {
        setAuthLoading(false)
      })
    // Only restore persisted auth state on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  useEffect(() => {
    chatSessionMetaRef.current = chatSessionMeta
    localStorage.setItem(CHAT_SESSION_META_KEY, JSON.stringify(chatSessionMeta))
  }, [chatSessionMeta])

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
      setCurrentUser(user)
      const context = await refreshDashboard(token.access_token)
      setAuthModalOpen(false)
      setOnboardingOpen(authMode === "register" || !context?.onboarding.ready_for_agent)
      setToast(
        authMode === "register"
          ? "账号已创建，先完成 2 分钟建档"
          : "登录成功"
      )
    } catch (error) {
      setAuthError(getErrorMessage(error))
    } finally {
      setAuthSubmitting(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    setCurrentUser(null)
    setFitnessContext(null)
    setTrainingPlans([])
    setFitnessProfile(null)
    setBodyMetrics([])
    setWorkoutLogs([])
    setAgentCheckins([])
    setMessages(initialMessages)
    setAgentSessionId(null)
    setChatSessions([])
    setProfileMenuOpen(false)
    setProfileModalOpen(false)
    setOnboardingOpen(false)
    setBodyMetricModalOpen(false)
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
      const context = await refreshDashboard(token)
      setOnboardingOpen(!context?.onboarding.ready_for_agent)
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

    const age = form.age.trim()
    const parsedAge = age ? Number(age) : null
    if (parsedAge !== null && (!Number.isInteger(parsedAge) || parsedAge < 0)) {
      setProfileError("年龄必须是 0 或更大的整数")
      return
    }
    const parsedDays = parseOptionalInteger(form.availableDaysPerWeek, "每周可训练天数")
    if (typeof parsedDays === "string") {
      setProfileError(parsedDays)
      return
    }
    if (parsedDays !== null && parsedDays > 7) {
      setProfileError("每周可训练天数不能超过 7")
      return
    }
    const parsedMinutes = parseOptionalInteger(
      form.workoutMinutesPerSession,
      "单次训练时长"
    )
    if (typeof parsedMinutes === "string") {
      setProfileError(parsedMinutes)
      return
    }

    setProfileSubmitting(true)
    setProfileError(null)

    try {
      const updatedProfile = await upsertFitnessProfile(token, {
        age: parsedAge,
        activity_level: compactOptionalText(form.activityLevel),
        available_days_per_week: parsedDays,
        dietary_habits: compactOptionalText(form.dietaryHabits),
        dietary_restrictions: compactOptionalText(form.dietaryRestrictions),
        equipment_access: compactOptionalText(form.equipmentAccess),
        experience_level: compactOptionalText(form.experienceLevel),
        fitness_goal: compactOptionalText(form.fitnessGoal),
        fitness_summary: compactOptionalText(form.fitnessSummary),
        gender: compactOptionalText(form.gender),
        injury_history: compactOptionalText(form.injuryHistory),
        location: compactOptionalText(form.location),
        medical_conditions: compactOptionalText(form.medicalConditions),
        preferred_workout_types: compactOptionalText(form.preferredWorkoutTypes),
        workout_minutes_per_session: parsedMinutes,
      })
      setFitnessProfile(updatedProfile)
      await refreshDashboard(token, { preserveMessages: true })
      setProfileModalOpen(false)
      setToast("个人资料已更新")
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

  const handleCreateConversation = () => {
    activeStreamRef.current?.abort()
    setMessages(initialMessages)
    setAgentSessionId(null)
    setComposerValue("")
    setAgentStreaming(false)
    setActiveNav("new")
    setConversationLoading(false)
    setSidebarDrawerOpen(false)
    setToast("已新建对话")
  }

  const handleSelectConversation = async (sessionId: string) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      return
    }

    activeStreamRef.current?.abort()
    setActiveNav(sessionId)
    setAgentSessionId(sessionId)
    setConversationLoading(true)
    setSidebarDrawerOpen(false)

    try {
      const runs = await listAgentRuns(token, 200)
      const sessionRuns = runs.filter((run) => run.session_id === sessionId)
      setMessages(
        markGeneratedTrainingPlanMessages(
          chatMessagesFromAgentRuns(sessionRuns),
          generatedTrainingPlanKeys
        )
      )
      setToast("对话已切换")
    } catch (error) {
      setToast(getErrorMessage(error))
    } finally {
      setConversationLoading(false)
    }
  }

  const updateSessionMeta = (
    sessionId: string,
    update: Partial<ChatSession> | ((current: Partial<ChatSession>) => Partial<ChatSession>)
  ) => {
    setChatSessionMeta((current) => {
      const previous = current[sessionId] ?? {}
      const next = typeof update === "function" ? update(previous) : update
      return {
        ...current,
        [sessionId]: {
          ...previous,
          ...next,
        },
      }
    })
    setChatSessions((current) =>
      current
        .map((session) =>
          session.id === sessionId ? { ...session, ...resolveSessionUpdate(session, update) } : session
        )
        .filter((session) => !session.deleted)
        .sort(sortChatSessions)
    )
  }

  const handleRenameConversation = (sessionId: string, title: string) => {
    updateSessionMeta(sessionId, { title })
    setToast("对话已重命名")
  }

  const handleTogglePinConversation = (sessionId: string) => {
    updateSessionMeta(sessionId, (current) => ({ pinned: !current.pinned }))
  }

  const handleDeleteConversation = (sessionId: string) => {
    updateSessionMeta(sessionId, { deleted: true })
    if (agentSessionId === sessionId) {
      setMessages(initialMessages)
      setAgentSessionId(null)
      setActiveNav("new")
    }
    setToast("对话已从侧边栏移除")
  }

  const handleExportConversation = async (sessionId: string) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      return
    }

    const session = chatSessions.find((item) => item.id === sessionId)
    setToast("正在导出对话 JSON")

    try {
      const runs = await listAgentRuns(token, 200)
      const sessionRuns = runs.filter((run) => run.session_id === sessionId)
      if (!sessionRuns.length) {
        setToast("这段对话暂无可导出的消息")
        return
      }

      const payload = buildConversationEvalExport({
        runs: sessionRuns,
        session,
        user: currentUser,
      })
      downloadJsonFile(
        payload,
        `${safeFilename(session?.title ?? "kratos-conversation")}-${sessionId}.json`
      )
      setToast("对话 JSON 已导出，可在评估平台一键导入")
    } catch (error) {
      setToast(getErrorMessage(error))
    }
  }

  const parseOptionalNumber = (value: string, label: string) => {
    const trimmed = value.trim()
    if (!trimmed) {
      return null
    }

    const parsed = Number(trimmed)
    if (!Number.isFinite(parsed) || parsed < 0) {
      return `${label}必须是 0 或更大的数字`
    }

    return parsed
  }

  const parseOptionalInteger = (value: string, label: string) => {
    const parsed = parseOptionalNumber(value, label)
    if (parsed === null || typeof parsed === "string") {
      return parsed
    }

    if (!Number.isInteger(parsed)) {
      return `${label}必须是整数`
    }

    return parsed
  }

  const buildProfilePayload = (
    form: ProfileForm,
    setError: (message: string | null) => void
  ): FitnessProfilePayload | null => {
    const age = form.age.trim()
    const parsedAge = age ? Number(age) : null
    if (parsedAge !== null && (!Number.isInteger(parsedAge) || parsedAge < 0)) {
      setError("年龄必须是 0 或更大的整数")
      return null
    }

    const parsedDays = parseOptionalInteger(form.availableDaysPerWeek, "每周可训练天数")
    if (typeof parsedDays === "string") {
      setError(parsedDays)
      return null
    }
    if (parsedDays !== null && parsedDays > 7) {
      setError("每周可训练天数不能超过 7")
      return null
    }

    const parsedMinutes = parseOptionalInteger(
      form.workoutMinutesPerSession,
      "单次训练时长"
    )
    if (typeof parsedMinutes === "string") {
      setError(parsedMinutes)
      return null
    }

    return {
      age: parsedAge,
      activity_level: compactOptionalText(form.activityLevel),
      available_days_per_week: parsedDays,
      dietary_habits: compactOptionalText(form.dietaryHabits),
      dietary_restrictions: compactOptionalText(form.dietaryRestrictions),
      equipment_access: compactOptionalText(form.equipmentAccess),
      experience_level: compactOptionalText(form.experienceLevel),
      fitness_goal: compactOptionalText(form.fitnessGoal),
      fitness_summary: compactOptionalText(form.fitnessSummary),
      gender: compactOptionalText(form.gender),
      injury_history: compactOptionalText(form.injuryHistory),
      location: compactOptionalText(form.location),
      medical_conditions: compactOptionalText(form.medicalConditions),
      preferred_workout_types: compactOptionalText(form.preferredWorkoutTypes),
      workout_minutes_per_session: parsedMinutes,
    }
  }

  const buildBodyPayload = (
    form: BodyMetricForm,
    setError: (message: string | null) => void
  ) => {
    const heightCm = parseOptionalNumber(form.heightCm, "身高")
    if (typeof heightCm === "string") {
      setError(heightCm)
      return null
    }
    const weightKg = parseOptionalNumber(form.weightKg, "体重")
    if (typeof weightKg === "string") {
      setError(weightKg)
      return null
    }
    const targetWeightKg = parseOptionalNumber(form.targetWeightKg, "目标体重")
    if (typeof targetWeightKg === "string") {
      setError(targetWeightKg)
      return null
    }
    const bodyFatPercentage = parseOptionalNumber(form.bodyFatPercentage, "体脂率")
    if (typeof bodyFatPercentage === "string") {
      setError(bodyFatPercentage)
      return null
    }
    const skeletalMuscleMassKg = parseOptionalNumber(
      form.skeletalMuscleMassKg,
      "骨骼肌"
    )
    if (typeof skeletalMuscleMassKg === "string") {
      setError(skeletalMuscleMassKg)
      return null
    }
    const bmi = parseOptionalNumber(form.bmi, "BMI")
    if (typeof bmi === "string") {
      setError(bmi)
      return null
    }
    const waistCm = parseOptionalNumber(form.waistCm, "腰围")
    if (typeof waistCm === "string") {
      setError(waistCm)
      return null
    }
    const sleepHours = parseOptionalNumber(form.sleepHours, "睡眠时长")
    if (typeof sleepHours === "string") {
      setError(sleepHours)
      return null
    }
    const energyLevel = parseOptionalInteger(form.energyLevel, "精力")
    if (typeof energyLevel === "string") {
      setError(energyLevel)
      return null
    }
    const sleepQuality = parseOptionalInteger(form.sleepQuality, "睡眠质量")
    if (typeof sleepQuality === "string") {
      setError(sleepQuality)
      return null
    }
    const sorenessLevel = parseOptionalInteger(form.sorenessLevel, "酸痛")
    if (typeof sorenessLevel === "string") {
      setError(sorenessLevel)
      return null
    }

    for (const [label, value] of [
      ["精力", energyLevel],
      ["睡眠质量", sleepQuality],
      ["酸痛", sorenessLevel],
    ] as const) {
      if (value !== null && (value < 1 || value > 10)) {
        setError(`${label}必须在 1 到 10 之间`)
        return null
      }
    }

    const metric = {
      height_cm: heightCm,
      weight_kg: weightKg,
      target_weight_kg: targetWeightKg,
      body_fat_percentage: bodyFatPercentage,
      skeletal_muscle_mass_kg: skeletalMuscleMassKg,
      bmi,
      waist_cm: waistCm,
      sleep_hours: sleepHours,
      notes: compactOptionalText(form.notes),
    }
    const checkin = {
      energy_level: energyLevel,
      sleep_quality: sleepQuality,
      soreness_level: sorenessLevel,
    }

    return {
      checkin,
      hasCheckinData:
        energyLevel !== null || sleepQuality !== null || sorenessLevel !== null,
      hasMetricData:
        heightCm !== null ||
        weightKg !== null ||
        targetWeightKg !== null ||
        bodyFatPercentage !== null ||
        skeletalMuscleMassKg !== null ||
        bmi !== null ||
        waistCm !== null ||
        sleepHours !== null,
      metric,
    }
  }

  const handleBodyMetricSubmit = async (form: BodyMetricForm) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      return
    }

    const heightCm = parseOptionalNumber(form.heightCm, "身高")
    if (typeof heightCm === "string") {
      setBodyMetricError(heightCm)
      return
    }
    const weightKg = parseOptionalNumber(form.weightKg, "体重")
    if (typeof weightKg === "string") {
      setBodyMetricError(weightKg)
      return
    }
    const targetWeightKg = parseOptionalNumber(form.targetWeightKg, "目标体重")
    if (typeof targetWeightKg === "string") {
      setBodyMetricError(targetWeightKg)
      return
    }
    const bodyFatPercentage = parseOptionalNumber(form.bodyFatPercentage, "体脂率")
    if (typeof bodyFatPercentage === "string") {
      setBodyMetricError(bodyFatPercentage)
      return
    }
    const skeletalMuscleMassKg = parseOptionalNumber(
      form.skeletalMuscleMassKg,
      "骨骼肌"
    )
    if (typeof skeletalMuscleMassKg === "string") {
      setBodyMetricError(skeletalMuscleMassKg)
      return
    }
    const bmi = parseOptionalNumber(form.bmi, "BMI")
    if (typeof bmi === "string") {
      setBodyMetricError(bmi)
      return
    }
    const waistCm = parseOptionalNumber(form.waistCm, "腰围")
    if (typeof waistCm === "string") {
      setBodyMetricError(waistCm)
      return
    }
    const sleepHours = parseOptionalNumber(form.sleepHours, "睡眠时长")
    if (typeof sleepHours === "string") {
      setBodyMetricError(sleepHours)
      return
    }
    const energyLevel = parseOptionalInteger(form.energyLevel, "精力")
    if (typeof energyLevel === "string") {
      setBodyMetricError(energyLevel)
      return
    }
    const sleepQuality = parseOptionalInteger(form.sleepQuality, "睡眠质量")
    if (typeof sleepQuality === "string") {
      setBodyMetricError(sleepQuality)
      return
    }
    const sorenessLevel = parseOptionalInteger(form.sorenessLevel, "酸痛")
    if (typeof sorenessLevel === "string") {
      setBodyMetricError(sorenessLevel)
      return
    }
    if (energyLevel !== null && (energyLevel < 1 || energyLevel > 10)) {
      setBodyMetricError("精力必须在 1 到 10 之间")
      return
    }
    if (sleepQuality !== null && (sleepQuality < 1 || sleepQuality > 10)) {
      setBodyMetricError("睡眠质量必须在 1 到 10 之间")
      return
    }
    if (sorenessLevel !== null && (sorenessLevel < 1 || sorenessLevel > 10)) {
      setBodyMetricError("酸痛必须在 1 到 10 之间")
      return
    }

    setBodyMetricSubmitting(true)
    setBodyMetricError(null)

    try {
      if (
        heightCm !== null ||
        weightKg !== null ||
        targetWeightKg !== null ||
        bodyFatPercentage !== null ||
        skeletalMuscleMassKg !== null ||
        bmi !== null ||
        waistCm !== null ||
        sleepHours !== null
      ) {
        const metric = await createBodyMetric(token, {
          height_cm: heightCm,
          bmi,
          body_fat_percentage: bodyFatPercentage,
          skeletal_muscle_mass_kg: skeletalMuscleMassKg,
          notes: compactOptionalText(form.notes),
          sleep_hours: sleepHours,
          target_weight_kg: targetWeightKg,
          waist_cm: waistCm,
          weight_kg: weightKg,
        })
        setBodyMetrics((current) => [metric, ...current])
      }

      if (energyLevel !== null || sleepQuality !== null || sorenessLevel !== null) {
        const checkin = await createAgentCheckin(token, {
          energy_level: energyLevel,
          soreness_level: sorenessLevel,
          sleep_quality: sleepQuality,
          summary: compactOptionalText(form.notes) ?? "手动更新身体数据",
          training_plan_id: activePlan?.id ?? null,
        })
        setAgentCheckins((current) => [checkin, ...current])
      }

      await refreshDashboard(token, { preserveMessages: true })
      setBodyMetricModalOpen(false)
      setToast("身体数据已写入数据库")
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
      const [context, plans, runs] = await Promise.all([
        getFitnessContext(token),
        listTrainingPlans(token),
        listAgentRuns(token, 200),
      ])

      setFitnessContext(context)
      setTrainingPlans(plans)
      setFitnessProfile(context.profile)
      setBodyMetrics(context.recent_body_metrics)
      setWorkoutLogs(context.recent_workout_logs)
      setAgentCheckins(context.recent_checkins)
      const restoredSessions = chatSessionsFromAgentRuns(
        runs,
        chatSessionMetaRef.current
      )
      setChatSessions(restoredSessions)
      if (!options.preserveMessages) {
        const currentSessionId =
          agentSessionId && restoredSessions.some((session) => session.id === agentSessionId)
            ? agentSessionId
            : restoredSessions[0]?.id ?? null
        const sessionRuns = currentSessionId
          ? runs.filter((run) => run.session_id === currentSessionId)
          : []
        setMessages(
          sessionRuns.length
            ? markGeneratedTrainingPlanMessages(
                chatMessagesFromAgentRuns(sessionRuns),
                generatedTrainingPlanKeys
              )
            : initialMessages
        )
        setAgentSessionId(currentSessionId)
        setActiveNav(currentSessionId ?? "new")
      }
      return context
    } catch (error) {
      setToast(getErrorMessage(error))
      return null
    } finally {
      setDashboardLoading(false)
    }
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
        await createBodyMetric(token, bodyPayload.metric)
      }
      if (bodyPayload.hasCheckinData) {
        await createAgentCheckin(token, {
          ...bodyPayload.checkin,
          summary: compactOptionalText(bodyForm.notes) ?? "新用户引导记录",
          training_plan_id: activePlan?.id ?? null,
        })
      }

      const context = await refreshDashboard(token, { preserveMessages: true })
      setOnboardingOpen(!context?.onboarding.ready_for_agent)
      setToast("建档完成，Kratos 现在更了解你了")
    } catch (error) {
      setOnboardingError(getErrorMessage(error))
    } finally {
      setOnboardingSubmitting(false)
    }
  }

  const handleSendMessage = async () => {
    const body = composerValue.trim()
    if (!body) {
      setToast("不可发送空白消息")
      return
    }

    if (agentStreaming) {
      setToast("Kratos 正在回复，请稍等")
      return
    }

    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      setToast("登录后开始对话")
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

    try {
      await streamAgentChat({
        message: body,
        onEvent: (event) => {
          if (event.session_id) {
            const nextSessionId = event.session_id
            setAgentSessionId(nextSessionId)
            setActiveNav(nextSessionId)
            setChatSessions((current) => {
              if (current.some((session) => session.id === nextSessionId)) {
                return current
              }

              return [
                {
                  id: nextSessionId,
                  title: titleFromPrompt(body),
                  preview: body,
                  updatedAt: new Date().toISOString(),
                  messageCount: 2,
                  pinned: Boolean(chatSessionMetaRef.current[nextSessionId]?.pinned),
                },
                ...current,
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
                const suggestedTrainingPlan = trainingPlanPayloadFromAgentResult(event.raw)
                const generatedAlready = suggestedTrainingPlan
                  ? generatedTrainingPlanKeys.has(trainingPlanDraftKey(suggestedTrainingPlan))
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
        sessionId: agentSessionId,
        signal: controller.signal,
        token,
      })
      await refreshDashboard(token, { preserveMessages: true })
    } catch (error) {
      if (controller.signal.aborted) {
        return
      }

      const message = getErrorMessage(error)
      setToast(message)
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
    setToast("已中断 Agent 回复")
  }

  const handleQuickAction = (action: QuickAction) => {
    if (action.title === "查看历史") {
      setActiveNav("历史记录")
    }
    setComposerValue(action.prompt)
    setToast(`${action.title}已填入输入框`)
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
      setToast(`已选择 ${file.name}`)
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
      setToast("登录后可以保存训练记录")
      return
    }

    if (actions.length === 0) {
      setToast("当前计划没有可记录的训练动作")
      return
    }

    if (trainingSession) {
      setToast("已有训练进行中，请先结束当前训练")
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
    setToast("训练计时已开始，逐个点击动作卡片标记完成")
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
    setToast("训练已暂停")
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
    setToast("训练已继续")
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
      setToast("登录后可以保存训练记录")
      return
    }

    if (!trainingSession || trainingSession.workoutDate !== workoutDate) {
      setToast("请先开始当天训练")
      return
    }

    const elapsedSeconds =
      trainingSession.isPaused
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
      completedActionTitles.length > 0 ? completedActionTitles : ["未标记完成动作"]

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
        setToast("每日训练记录已同步，未更新后续计划")
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
        setToast("训练完成记录已同步")
      }
    } catch (error) {
      setToast(getErrorMessage(error))
    } finally {
      setDashboardLoading(false)
    }
  }

  const openTrainingPlanComposer = (draft: TrainingPlanPayload | null = null) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      setToast("登录后可以保存训练计划")
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
      setToast("登录后可以修改训练计划")
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
      setToast("登录后可以保存训练计划")
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
        const updated = await updateTrainingPlan(token, editingTrainingPlanId, payload)
        setTrainingPlans((current) =>
          current.map((plan) => (plan.id === updated.id ? updated : plan))
        )
        await refreshDashboard(token, { preserveMessages: true })
        setTrainingPlanModalOpen(false)
        setTrainingPlanDraft(null)
        setEditingTrainingPlanId(null)
        setActiveNav("训练计划")
        setToast("训练计划已更新，已完成训练仍显示历史快照")
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
      setToast("训练计划已保存")
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
      setToast("登录后可以保存训练计划")
      return
    }

    if (!payload.title.trim() || !payload.weekly_schedule?.trim()) {
      openTrainingPlanComposer(payload)
      setToast("计划草稿还需要补充后再保存")
      return
    }

    const generatedKey = trainingPlanDraftKey(payload)
    if (generatedTrainingPlanKeys.has(generatedKey)) {
      setMessages((current) =>
        current.map((message) =>
          message.id === messageId
            ? { ...message, trainingPlanCreatedId: message.trainingPlanCreatedId ?? -1 }
            : message
        )
      )
      setToast("这份聊天计划已经生成过了")
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
      setToast("已根据聊天内容生成训练计划")
    } catch (error) {
      setToast(getErrorMessage(error))
    } finally {
      setChatTrainingPlanSavingId(null)
    }
  }

  const handleSelectTrainingPlan = async (plan: TrainingPlan) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      setToast("登录后可以切换当前计划")
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

          if (activePlansToPause.some((activeItem) => activeItem.id === item.id)) {
            return { ...item, status: "paused" }
          }

          return item
        })
      )
      setCompletedExercises([])
      setTrainingStarted(false)
      await refreshDashboard(token, { preserveMessages: true })
      setToast(`已切换到：${updated.title}`)
    } catch (error) {
      setToast(getErrorMessage(error))
    } finally {
      setDashboardLoading(false)
    }
  }

  const handleDeleteTrainingPlan = async (plan: TrainingPlan) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      setToast("登录后可以删除训练计划")
      return
    }

    const confirmed = window.confirm(`确定删除「${plan.title}」吗？相关训练记录会保留。`)
    if (!confirmed) {
      return
    }

    setDashboardLoading(true)

    try {
      await deleteTrainingPlan(token, plan.id)
      setTrainingPlans((current) => current.filter((item) => item.id !== plan.id))
      await refreshDashboard(token, { preserveMessages: true })
      setToast("训练计划已删除")
    } catch (error) {
      setToast(getErrorMessage(error))
    } finally {
      setDashboardLoading(false)
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
      const adjustment = await previewTrainingPlanAdjustment(token, activePlan.id, {
        completed: lastCompletedWorkout.completed,
        duration_seconds: lastCompletedWorkout.durationSeconds,
        feedback: trainingFeedback.trim(),
        workout_title: lastCompletedWorkout.title,
      })
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
      const updated = await updateTrainingPlan(
        token,
        activePlan.id,
        proposal
      )
      setTrainingPlans((current) =>
        current.map((plan) => (plan.id === updated.id ? updated : plan))
      )
      await refreshDashboard(token, { preserveMessages: true })
      setTrainingFeedbackOpen(false)
      setTrainingFeedback("")
      setTrainingAdjustment(null)
      setLastCompletedWorkout(null)
      setToast("已根据反馈更新原训练计划")
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
    setToast("通知已全部标记为已读")
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

    if (activeNav === "评估平台") {
      return <EvaluationPage />
    }

    return (
      <MainConversation
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
          setToast(`已切换到${nextTheme === "dark" ? "深色" : "浅色"}模式`)
        }}
        onToggleThinking={() => setThinkingExpanded((current) => !current)}
        thinkingExpanded={thinkingExpanded}
        theme={theme}
        unreadCount={unreadCount}
      />
    )
  }

  return (
    <div className="min-h-svh bg-white text-[#111111]">
      <div className="flex h-[100svh] w-full overflow-hidden bg-white">
        <button
          aria-label="打开侧边栏"
          className="fixed top-4 left-4 z-40 grid size-10 place-items-center rounded-[10px] border border-[#e4e4e4] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.10)] xl:hidden"
          onClick={() => setSidebarDrawerOpen(true)}
          type="button"
        >
          <Menu className="size-5" />
        </button>
        {sidebarDrawerOpen ? (
          <button
            aria-label="关闭侧边栏"
            className="fixed inset-0 z-40 bg-black/28 xl:hidden"
            onClick={() => setSidebarDrawerOpen(false)}
            type="button"
          />
        ) : null}
        <Sidebar
          activeNav={activeNav}
          authLoading={authLoading}
          chatSessions={chatSessions}
          collapsed={sidebarCollapsed}
          currentUser={currentUser}
          drawerOpen={sidebarDrawerOpen}
          menuOpen={profileMenuOpen}
          onCreateConversation={handleCreateConversation}
          onDeleteConversation={handleDeleteConversation}
          onEditProfile={openProfileEditor}
          onExportConversation={handleExportConversation}
          onRenameConversation={handleRenameConversation}
          onLogin={() => openAuth("login")}
          onLogout={handleLogout}
          onNavSelect={handleNavSelect}
          onOpenProfile={() =>
            setDetailPanel(
              buildProfilePanel(
                currentUser,
                fitnessProfile,
                latestMetric,
                onboardingStatus,
                completedExercises
              )
            )
          }
          onSelectConversation={handleSelectConversation}
          onRefreshProfile={handleRefreshProfile}
          onRegister={() => openAuth("register")}
          onTogglePinConversation={handleTogglePinConversation}
          onToggleCollapse={() => setSidebarCollapsed((current) => !current)}
          onToggleMenu={() => setProfileMenuOpen((current) => !current)}
        />
        {renderWorkspace()}
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
      <ProfileEditModal
        error={profileError}
        key={`${currentUser?.id ?? "guest"}-${profileModalOpen ? "open" : "closed"}`}
        loading={profileSubmitting}
        onClose={() => setProfileModalOpen(false)}
        onSubmit={handleProfileSubmit}
        open={profileModalOpen}
        profile={fitnessProfile}
        user={currentUser}
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
      <DetailModal
        panel={detailPanel}
        onClose={() => setDetailPanel(null)}
      />
      <Toast message={toast} />
    </div>
  )
}

export default App

function buildConversationEvalExport({
  runs,
  session,
  user,
}: {
  runs: AgentRun[]
  session?: ChatSession | null
  user: UserProfile | null
}) {
  const orderedRuns = [...runs].sort(
    (left, right) =>
      new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
  )
  const sessionId = orderedRuns[0]?.session_id ?? session?.id ?? "unknown-session"
  const sessionTitle = session?.title ?? titleFromPrompt(orderedRuns[0]?.user_message ?? "")

  return {
    format_version: AGENT_EVAL_FORMAT_VERSION,
    source: "kratos-agent-frontend",
    dataset: {
      name: uniqueDatasetName(sessionTitle, sessionId),
      description: `Kratos Agent 对话导出：${sessionTitle}`,
    },
    metadata: {
      exported_at: new Date().toISOString(),
      project: "Kratos Agent",
      session_id: sessionId,
      session_title: sessionTitle,
      user: user
        ? {
            id: user.id,
            username: user.username,
          }
        : null,
    },
    items: orderedRuns.map((run, index) => {
      const runTrace = [...run.trace_steps].sort(
        (left, right) => left.position - right.position
      )
      const messages = orderedRuns.slice(0, index + 1).flatMap((messageRun) => [
        {
          role: "user",
          content: messageRun.user_message,
          created_at: messageRun.created_at,
          run_id: messageRun.id,
        },
        {
          role: "assistant",
          content: messageRun.answer,
          created_at: messageRun.created_at,
          run_id: messageRun.id,
        },
      ])
      const traceContexts = runTrace
        .map((step) => compactText(step.content))
        .filter(Boolean)

      return {
        trace_id: `${sessionId}-run-${run.id}`,
        user_input: run.user_message,
        ai_answer: run.answer,
        contexts: [
          `session_title: ${sessionTitle}`,
          `agent_status: ${run.status}`,
          ...traceContexts,
        ],
        messages,
        tool_calls: runTrace
          .filter((step) => /tool|工具/i.test(step.step_type))
          .map((step) => ({
            name: step.step_type,
            arguments: step.raw,
            result: step.content,
            position: step.position,
          })),
        trajectory: runTrace.map((step) => ({
          step: step.position,
          action: step.step_type,
          input: step.raw,
          observation: step.content,
          created_at: step.created_at,
        })),
        metadata: {
          run_id: run.id,
          session_id: run.session_id,
          status: run.status,
          intent: run.intent,
          task_results: run.task_results,
          tool_results: run.tool_results,
          reflection: run.reflection,
          result_payload: run.result_payload,
          created_at: run.created_at,
          message_index: index + 1,
        },
        expected: {
          answer_keywords: inferAnswerKeywords(run.answer),
        },
      }
    }),
  }
}

function downloadJsonFile(payload: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function uniqueDatasetName(title: string, sessionId: string) {
  const suffix = sessionId.slice(0, 8) || Date.now().toString(36)
  return `${title || "Kratos 对话评估"}-${suffix}`.slice(0, 120)
}

function safeFilename(value: string) {
  return (
    value
      .trim()
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, "-")
      .slice(0, 80) || "kratos-conversation"
  )
}

function compactText(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function inferAnswerKeywords(answer: string) {
  const words = Array.from(new Set(answer.match(/[\p{Script=Han}A-Za-z0-9]{2,}/gu) ?? []))
  return words.slice(0, 8)
}

function readChatSessionMeta(): Record<string, Partial<ChatSession>> {
  try {
    const raw = localStorage.getItem(CHAT_SESSION_META_KEY)
    if (!raw) {
      return {}
    }

    const parsed = JSON.parse(raw) as unknown
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, Partial<ChatSession>>)
      : {}
  } catch {
    return {}
  }
}

function readGeneratedTrainingPlanKeys() {
  try {
    const raw = localStorage.getItem(GENERATED_TRAINING_PLAN_KEY)
    if (!raw) {
      return new Set<string>()
    }

    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed)
      ? new Set(parsed.filter((item): item is string => typeof item === "string"))
      : new Set<string>()
  } catch {
    return new Set<string>()
  }
}

function writeGeneratedTrainingPlanKeys(keys: Set<string>) {
  localStorage.setItem(GENERATED_TRAINING_PLAN_KEY, JSON.stringify([...keys]))
}

function markGeneratedTrainingPlanMessages(
  items: ChatMessage[],
  generatedKeys: Set<string>
) {
  return items.map((message) => {
    if (
      !message.suggestedTrainingPlan ||
      message.trainingPlanCreatedId ||
      !generatedKeys.has(trainingPlanDraftKey(message.suggestedTrainingPlan))
    ) {
      return message
    }

    return {
      ...message,
      trainingPlanCreatedId: -1,
    }
  })
}

function isDailyPlanForAdjustment(plan: TrainingPlan | null) {
  if (!plan) {
    return false
  }

  const trainingLines = getPlanExerciseLines(plan).filter((line) =>
    /(周[一二三四五六日天]|第\s*\d+\s*天)/.test(line)
  )

  if (trainingLines.length !== 1) {
    return false
  }

  if (plan.end_date && plan.start_date && plan.end_date !== plan.start_date) {
    return false
  }

  return !plan.end_date || /今日|当天|每日|单日|本次|今天|Kratos 生成/.test(
    `${plan.title} ${plan.summary ?? ""} ${plan.goal ?? ""}`
  )
}

function trainingPlanPayloadFromPlan(plan: TrainingPlan): TrainingPlanPayload {
  return {
    end_date: plan.end_date,
    goal: plan.goal,
    nutrition_guidance: plan.nutrition_guidance,
    recovery_guidance: plan.recovery_guidance,
    start_date: plan.start_date,
    status: plan.status,
    summary: plan.summary,
    title: plan.title,
    weekly_schedule: plan.weekly_schedule,
  }
}

function trainingPlanDraftKey(payload: TrainingPlanPayload) {
  return [
    payload.title.trim(),
    payload.goal?.trim() ?? "",
    payload.summary?.trim() ?? "",
    payload.weekly_schedule?.trim() ?? "",
  ]
    .join("|")
    .replace(/\s+/g, " ")
}

function resolveSessionUpdate(
  session: ChatSession,
  update:
    | Partial<ChatSession>
    | ((current: Partial<ChatSession>) => Partial<ChatSession>)
) {
  return typeof update === "function" ? update(session) : update
}

function sortChatSessions(left: ChatSession, right: ChatSession) {
  if (left.pinned !== right.pinned) {
    return left.pinned ? -1 : 1
  }

  return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes <= 0) {
    return `${seconds} 秒`
  }

  return `${minutes} 分 ${seconds.toString().padStart(2, "0")} 秒`
}

function compactTrainingPlanProposal(proposal: Partial<TrainingPlanPayload>) {
  return Object.fromEntries(
    Object.entries(proposal).filter(([, value]) => value !== null && value !== undefined)
  ) as Partial<TrainingPlanPayload>
}
