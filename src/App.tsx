import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react"

import {
  initialMessages,
  initialNotifications,
} from "@/data/kratos"
import {
  AUTH_TOKEN_KEY,
  createAgentCheckin,
  createBodyMetric,
  createMyFitnessProfile,
  createWorkoutLog,
  getCurrentUser,
  getFitnessContext,
  getErrorMessage,
  listAgentRuns,
  listTrainingPlans,
  loginUser,
  registerUser,
  streamAgentChat,
  updateMyFitnessProfile,
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
  toDateInputValue,
} from "@/lib/kratos"
import { createId } from "@/lib/id"
import { MainConversation } from "@/components/kratos/MainConversation"
import {
  AuthModal,
  BodyMetricModal,
  DetailModal,
  OnboardingModal,
  ProfileEditModal,
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
  UserProfile,
  WorkoutLog,
} from "@/types/kratos"

const CHAT_SESSION_META_KEY = "kratos-chat-session-meta"

export function App() {
  const { setTheme, theme } = useTheme()
  const [activeNav, setActiveNav] = useState("new")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
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
  const [toast, setToast] = useState<string | null>(null)
  const activeStreamRef = useRef<AbortController | null>(null)

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
    setActiveNav(label)
  }

  const handleCreateConversation = () => {
    activeStreamRef.current?.abort()
    setMessages(initialMessages)
    setAgentSessionId(null)
    setComposerValue("")
    setAgentStreaming(false)
    setActiveNav("new")
    setToast("已新建对话")
  }

  const handleSelectConversation = async (sessionId: string) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      return
    }

    try {
      const runs = await listAgentRuns(token, 200)
      const sessionRuns = runs.filter((run) => run.session_id === sessionId)
      setMessages(chatMessagesFromAgentRuns(sessionRuns))
      setAgentSessionId(sessionId)
      setToast("对话已切换")
    } catch (error) {
      setToast(getErrorMessage(error))
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
      const restoredSessions = chatSessionsFromAgentRuns(runs, chatSessionMeta)
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
          sessionRuns.length ? chatMessagesFromAgentRuns(sessionRuns) : initialMessages
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
      setToast("建档完成，Kratos 现在有上下文了")
    } catch (error) {
      setOnboardingError(getErrorMessage(error))
    } finally {
      setOnboardingSubmitting(false)
    }
  }

  const handleSendMessage = async () => {
    const body = composerValue.trim()
    if (!body) {
      setToast("先输入一点内容，Kratos 才能接招")
      return
    }

    if (agentStreaming) {
      setToast("Kratos 还在回复中，稍等一下")
      return
    }

    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      setToast("登录后即可开始真实对话")
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
                },
                ...current,
              ]
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
                return {
                  ...message,
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
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      setToast("登录后可以保存训练记录")
      return
    }

    const requiredExercises = Math.min(2, getPlanExerciseLines(activePlan).length)
    if (requiredExercises === 0) {
      setToast("当前计划没有可记录的训练动作")
      return
    }

    if (completedExercises.length >= requiredExercises) {
      void saveCompletedWorkout(token)
      return
    }

    setTrainingStarted(true)
    setToast("训练已开始，点击动作卡可标记完成")
  }

  const saveCompletedWorkout = async (token: string) => {
    setDashboardLoading(true)

    try {
      const log = await createWorkoutLog(token, {
        calories_burned: 180,
        completed: true,
        duration_minutes: 20,
        notes: `已完成：${completedExercises.join("、")}`,
        perceived_exertion: 6,
        title: activePlan?.title ?? "未命名训练",
        training_plan_id: activePlan?.id ?? null,
        workout_date: toDateInputValue(new Date()),
        workout_type: "strength",
      })
      setWorkoutLogs((current) => [log, ...current])
      setCompletedExercises([])
      setTrainingStarted(false)
      setToast("训练完成记录已同步到后端")
    } catch (error) {
      setToast(getErrorMessage(error))
    } finally {
      setDashboardLoading(false)
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
          onOpenPanel={(panel) => {
            if (panel.title === "完整训练计划") {
              setDetailPanel(buildPlanPanel(activePlan))
              return
            }

            setDetailPanel(panel)
          }}
          onToggleExercise={toggleExercise}
          onTrainingButton={handleTrainingButton}
          profile={fitnessProfile}
          trainingPlans={trainingPlans}
          trainingStarted={trainingStarted}
          workoutLogs={workoutLogs}
        />
      )
    }

    if (activeNav === "身体数据") {
      return (
        <BodyDataPage
          latestCheckin={latestCheckin}
          latestMetric={latestMetric}
          bodyMetrics={bodyMetrics}
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
        composerValue={composerValue}
        messages={messages}
        notifications={notifications}
        notificationsOpen={notificationsOpen}
        onAttachment={handleAttachment}
        onComposerChange={setComposerValue}
        onComposerKeyDown={handleComposerKeyDown}
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
        onToggleThinking={() => setThinkingExpanded((current) => !current)}
        thinkingExpanded={thinkingExpanded}
        theme={theme}
        unreadCount={unreadCount}
      />
    )
  }

  return (
    <div className="min-h-svh bg-[#efefee] text-[#111111]">
      <div className="mx-auto flex h-[100svh] w-full max-w-[1488px] overflow-hidden bg-white shadow-[0_18px_55px_rgba(0,0,0,0.12)] max-xl:h-auto max-xl:min-h-[calc(100svh-2rem)] max-xl:flex-col max-xl:overflow-visible">
        <Sidebar
          activeNav={activeNav}
          authLoading={authLoading}
          chatSessions={chatSessions}
          collapsed={sidebarCollapsed}
          currentUser={currentUser}
          menuOpen={profileMenuOpen}
          onCreateConversation={handleCreateConversation}
          onDeleteConversation={handleDeleteConversation}
          onEditProfile={openProfileEditor}
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
      <DetailModal
        panel={detailPanel}
        onClose={() => setDetailPanel(null)}
      />
      <Toast message={toast} />
    </div>
  )
}

export default App

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
