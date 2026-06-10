import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react"

import { PanelLeft } from "lucide-react"
import { toast as sonnerToast } from "sonner"

import { initialMessages } from "@/features/kratos/model/fixtures"
import {
  AUTH_TOKEN_KEY,
  activateTrainingPlan,
  cancelAgentChatStream,
  createAgentCheckin,
  createBodyMetric,
  createDietRecords,
  createHealthMetric,
  createMyFitnessProfile,
  createSkill,
  createTrainingPlan,
  createWorkoutLog,
  deleteAgentSession,
  deleteSkill,
  deleteTrainingPlan,
  estimateDietFromImage,
  exportAgentRunRagas,
  getAgentSession,
  getCurrentUser,
  getErrorMessage,
  getTrainingPlanGuidance,
  getWorkoutHeartRateSummary,
  getWorkoutShareCard,
  listAgentRunsForSession,
  listAgentSessions,
  listAgentTools,
  listSkills,
  loginUser,
  previewTrainingPlanAdjustment,
  registerUser,
  renameAgentSession,
  streamAgentChat,
  updateAgentSession,
  updateAgentTool,
  updateBodyMetric,
  updateSkillBinding,
  updateMyFitnessProfile,
  updateTrainingPlan,
  updateWorkoutLog,
  uploadAttachment,
  uploadAvatar,
} from "@/entities/kratos/api/client"
import {
  buildPlanPanel,
  chatMessagesFromAgentRuns,
  chatSessionFromAgentSession,
  chatSessionsFromAgentSessions,
  foodImageEstimateFromAgentResult,
  formatTime,
  getLatestByDate,
  pendingHealthDataFromAgentResult,
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
  buildDietPayload,
  buildHealthPayload,
  buildProfilePayload,
} from "@/features/kratos/lib/formPayloads"
import {
  clearCachedUser,
  readActiveAgentSessionId,
  readCachedUser,
  readGeneratedTrainingPlanKeys,
  readWorkspaceSnapshot,
  writeCachedUser,
  writeActiveAgentSessionId,
  writeGeneratedTrainingPlanKeys,
  writeWorkspaceSnapshot,
} from "@/features/kratos/lib/storage"
import { ProfileMenu } from "@/features/kratos/profile/ProfileMenu"
import { AchievementCenterDialog } from "@/features/kratos/achievements/AchievementCenterDialog"
import {
  compactTrainingPlanProposal,
  formatDuration,
  isDailyPlanForAdjustment,
  trainingPlanDraftKey,
  trainingPlanPayloadFromPlan,
} from "@/features/kratos/lib/trainingPlans"
import { createId } from "@/shared/lib/id"
import { useLiveHeartRate } from "@/shared/hooks/useLiveHeartRate"
import { BodyDataPage } from "@/pages/kratos/BodyDataPage"
import { ConversationDetailPage } from "@/pages/kratos/ConversationDetailPage"
import { DietIntakePage } from "@/pages/kratos/DietIntakePage"
import { EvaluationPage } from "@/pages/kratos/EvaluationPage"
import { NewConversationPage } from "@/pages/kratos/NewConversationPage"
import { SkillPanelPage } from "@/pages/kratos/SkillPanelPage"
import { TrainingPlanPage } from "@/pages/kratos/TrainingPlanPage"
import { AuthModal } from "@/widgets/kratos/modals/AuthModal"
import {
  AddDataModal,
  emptyDietIntakeForm,
  emptyHealthMetricForm,
  type AddDataCategory,
  type AddDataSubmitPayload,
} from "@/widgets/kratos/modals/AddDataModal"
import { DetailModal } from "@/widgets/kratos/modals/DetailModal"
import { OnboardingModal } from "@/widgets/kratos/modals/OnboardingModal"
import { TrainingShareCardDialog } from "@/widgets/kratos/modals/TrainingShareCardDialog"
import { DietEstimateDialog } from "@/widgets/kratos/modals/DietEstimateDialog"
import { TrainingPlanModal } from "@/widgets/kratos/modals/TrainingPlanModal"
import type {
  AgentComposerMode,
  ComposerUploadingAttachment,
} from "@/widgets/kratos/conversation/ConversationComposer"
import { Sidebar } from "@/widgets/kratos/sidebar/Sidebar"
import { SidebarProvider } from "@/shared/ui/sidebar"
import { Toaster } from "@/shared/ui/sonner"
import { useTheme } from "@/app/providers/theme-provider"
import type {
  AgentCheckin,
  AgentStreamEvent,
  AgentToolConfig,
  AgentRun,
  AuthForm,
  AuthMode,
  BodyMetric,
  BodyMetricForm,
  ChatSession,
  ChatAttachment,
  ChatMessage,
  DetailPanel,
  FitnessContext,
  DietRecord,
  FoodEstimateItem,
  FoodImageEstimateResult,
  FitnessProfile,
  FitnessProfilePayload,
  HealthMetric,
  HealthMetricForm,
  HeartRateSummary,
  OnboardingStatus,
  NotificationItem,
  ProfileForm,
  Skill,
  SkillPayload,
  TrainingPlan,
  TrainingPlanAdjustmentResponse,
  TrainingPlanPayload,
  UserProfile,
  WorkoutLog,
  WorkoutShareCard,
  SuggestedHealthData,
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
  actionTitles: string[]
  accumulatedSeconds: number
  dayTitle: string
  isPaused: boolean
  logId: number
  startedAt: number
  workoutDate: string
}

function routeFromLocation() {
  const path = window.location.pathname
  const chatMatch = path.match(/^\/chat\/([^/]+)$/)
  if (chatMatch && chatMatch[1] !== "new") {
    return { nav: decodeURIComponent(chatMatch[1]), sessionId: decodeURIComponent(chatMatch[1]) }
  }
  if (path === "/training") return { nav: "训练计划", sessionId: null }
  if (path === "/body") return { nav: "数据中心", sessionId: null }
  if (path === "/diet") return { nav: "饮食摄入", sessionId: null }
  if (path === "/capabilities") return { nav: "工具技能", sessionId: null }
  return { nav: "new", sessionId: null }
}

function pushWorkspacePath(path: string) {
  if (window.location.pathname !== path) {
    window.history.pushState({}, "", path)
  }
}

function replaceWorkspacePath(path: string) {
  if (window.location.pathname !== path) {
    window.history.replaceState({}, "", path)
  }
}

function localDateValue(date: Date) {
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

function healthDataFromAgentRaw(raw: unknown): SuggestedHealthData | undefined {
  const fromArtifacts = pendingHealthDataFromAgentResult(raw)
  if (fromArtifacts) {
    return fromArtifacts
  }
  if (!raw || typeof raw !== "object" || !("pending_health_data" in raw)) {
    return undefined
  }
  const pending = raw.pending_health_data
  return pending && typeof pending === "object"
    ? (pending as SuggestedHealthData)
    : undefined
}

function stripTrainingPlanJsonContract(
  message: string,
  options: { trim?: boolean } = {}
) {
  const stripped = message.replace(
    /```json\s*\{[\s\S]*?"workout_plan"[\s\S]*?\}\s*```/g,
    ""
  )

  return options.trim === false ? stripped : stripped.trim()
}

function buildModeAwareAgentMessage({
  attachments,
  body,
  mode,
}: {
  attachments: ChatAttachment[]
  body: string
  mode: AgentComposerMode | null
}) {
  const fallbackAttachmentIntent = attachments.length
    ? "我上传了附件，请结合附件内容处理。"
    : ""
  const userInput = body || fallbackAttachmentIntent || mode?.initialPrompt || ""

  if (!mode) {
    return body || fallbackAttachmentIntent
  }

  return `${mode.promptPrefix}\n\n用户输入：${userInput}`.trim()
}

function isAnswerResetEvent(event: AgentStreamEvent) {
  const raw = event.raw
  return (
    event.type === "status" &&
    raw !== null &&
    typeof raw === "object" &&
    "answer_reset" in raw &&
    raw.answer_reset === true
  )
}

function isStructuredCardPendingEvent(event: AgentStreamEvent) {
  const raw = event.raw
  return (
    event.type === "status" &&
    raw !== null &&
    typeof raw === "object" &&
    "structured_card_pending" in raw &&
    raw.structured_card_pending === true
  )
}

function bodyMetricFormFromRecord(metric: BodyMetric): BodyMetricForm {
  const measuredAt = metric.measured_at ?? metric.recorded_at
  const date = new Date(measuredAt)
  const validDate = Number.isNaN(date.getTime()) ? new Date() : date
  const offset = validDate.getTimezoneOffset() * 60_000
  return {
    measuredAt: new Date(validDate.getTime() - offset).toISOString().slice(0, 16),
    bmi: metric.bmi?.toString() ?? "",
    bodyFatPercentage: metric.body_fat_percentage?.toString() ?? "",
    armCm: metric.arm_cm?.toString() ?? "",
    calfCm: metric.calf_cm?.toString() ?? "",
    chestCm: metric.chest_cm?.toString() ?? "",
    energyLevel: "",
    heightCm: metric.height_cm?.toString() ?? "",
    hipCm: metric.hip_cm?.toString() ?? "",
    mood: "",
    notes: metric.notes ?? "",
    painNotes: "",
    skeletalMuscleMassKg: "",
    sleepHours: "",
    sleepQuality: "",
    sorenessLevel: "",
    targetWeightKg: metric.target_weight_kg?.toString() ?? "",
    thighCm: metric.thigh_cm?.toString() ?? "",
    waistCm: metric.waist_cm?.toString() ?? "",
    weightKg: metric.weight_kg?.toString() ?? "",
  }
}

function bodyMetricFormFromLatest(metric: BodyMetric | null): BodyMetricForm {
  if (!metric) {
    return {
      ...bodyMetricFormFromRecord({
        arm_cm: null,
        bmi: null,
        body_fat_percentage: null,
        calf_cm: null,
        chest_cm: null,
        external_id: null,
        height_cm: null,
        hip_cm: null,
        id: 0,
        measured_at: new Date().toISOString(),
        notes: null,
        recorded_at: new Date().toISOString(),
        skeletal_muscle_mass_kg: null,
        sleep_hours: null,
        source: "manual",
        target_weight_kg: null,
        thigh_cm: null,
        user_id: 0,
        waist_cm: null,
        weight_kg: null,
      }),
      measuredAt: localDatetimeValue(new Date()),
    }
  }
  return {
    ...bodyMetricFormFromRecord(metric),
    measuredAt: localDatetimeValue(new Date()),
  }
}

function healthMetricFormFromRecord(metric: HealthMetric | null): HealthMetricForm {
  const measuredAt = metric?.measured_at ?? metric?.recorded_at ?? new Date().toISOString()
  const date = new Date(measuredAt)
  const validDate = Number.isNaN(date.getTime()) ? new Date() : date
  return {
    activeKcal: metric?.active_kcal?.toString() ?? "",
    bloodOxygenPercentage: metric?.blood_oxygen_percentage?.toString() ?? "",
    dietaryKcal: metric?.dietary_kcal?.toString() ?? "",
    hrvMs: metric?.hrv_ms?.toString() ?? "",
    measuredAt: localDatetimeValue(validDate),
    metricDate: metric?.metric_date ?? localDateValue(validDate),
    notes: metric?.notes ?? "",
    restingHeartRate: metric?.resting_heart_rate?.toString() ?? "",
    sleepHours: metric?.sleep_hours?.toString() ?? "",
    steps: metric?.steps?.toString() ?? "",
    stressLevel: metric?.stress_level?.toString() ?? "",
    vo2Max: metric?.vo2_max?.toString() ?? "",
  }
}

function healthMetricFormFromLatest(metric: HealthMetric | null): HealthMetricForm {
  return {
    ...healthMetricFormFromRecord(metric),
    measuredAt: localDatetimeValue(new Date()),
    metricDate: localDateValue(new Date()),
  }
}

function localDatetimeValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ""))
    reader.onerror = () => reject(reader.error ?? new Error("图片读取失败"))
    reader.readAsDataURL(file)
  })
}

function readImageAsAgentDataUrl(file: File) {
  const maxEdge = 1024
  const quality = 0.72

  return new Promise<string>((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const scale = Math.min(1, maxEdge / Math.max(image.width, image.height))
      const width = Math.max(1, Math.round(image.width * scale))
      const height = Math.max(1, Math.round(image.height * scale))
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext("2d")
      if (!context) {
        reject(new Error("图片压缩失败"))
        return
      }
      context.drawImage(image, 0, 0, width, height)
      resolve(canvas.toDataURL("image/jpeg", quality))
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      readFileAsDataUrl(file).then(resolve, reject)
    }
    image.src = objectUrl
  })
}

export function KratosPage() {
  const { setTheme, theme } = useTheme()
  const cachedWorkspaceRef = useRef(readWorkspaceSnapshot())
  const [activeNav, setActiveNav] = useState(() => {
    const route = routeFromLocation()
    return window.location.pathname === "/"
      ? cachedWorkspaceRef.current?.activeNav ?? route.nav
      : route.nav
  })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarDrawerOpen, setSidebarDrawerOpen] = useState(false)
  const [conversationLoading, setConversationLoading] = useState(false)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(
    () => cachedWorkspaceRef.current?.chatSessions ?? []
  )
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() =>
    routeFromLocation().sessionId ??
    (routeFromLocation().nav === "new"
      ? null
      : cachedWorkspaceRef.current?.activeSessionId ?? readActiveAgentSessionId())
  )
  const [authMode, setAuthMode] = useState<AuthMode>("login")
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authLoading, setAuthLoading] = useState(
    () =>
      Boolean(localStorage.getItem(AUTH_TOKEN_KEY)) &&
      !(readCachedUser() ?? cachedWorkspaceRef.current?.user)
  )
  const [authSubmitting, setAuthSubmitting] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() =>
    readCachedUser() ?? cachedWorkspaceRef.current?.user ?? null
  )
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [achievementsOpen, setAchievementsOpen] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [profileSubmitting, setProfileSubmitting] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [onboardingSubmitting, setOnboardingSubmitting] = useState(false)
  const [onboardingError, setOnboardingError] = useState<string | null>(null)
  const [bodyMetricModalOpen, setBodyMetricModalOpen] = useState(false)
  const [editingBodyMetric, setEditingBodyMetric] = useState<BodyMetric | null>(null)
  const [addDataInitialTab, setAddDataInitialTab] = useState<AddDataCategory>("body")
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
  const [composerValue, setComposerValue] = useState(
    () => {
      const route = routeFromLocation()
      return !route.sessionId && route.nav === "new"
        ? ""
        : cachedWorkspaceRef.current?.composerValue ?? ""
    }
  )
  const [composerMode, setComposerMode] = useState<AgentComposerMode | null>(null)
  const [composerAttachments, setComposerAttachments] = useState<ChatAttachment[]>([])
  const [composerUploadingAttachments, setComposerUploadingAttachments] =
    useState<ComposerUploadingAttachment[]>([])
  const [dietEstimating, setDietEstimating] = useState(false)
  const [dietSaving, setDietSaving] = useState(false)
  const [dietEstimateOpen, setDietEstimateOpen] = useState(false)
  const [dietEstimate, setDietEstimate] = useState<FoodImageEstimateResult | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>(
    () => {
      const route = routeFromLocation()
      if (!route.sessionId && route.nav === "new") {
        return initialMessages
      }
      return cachedWorkspaceRef.current?.messages?.length
        ? cachedWorkspaceRef.current.messages
        : initialMessages
    }
  )
  const [agentStreaming, setAgentStreaming] = useState(false)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>(
    () => cachedWorkspaceRef.current?.trainingPlans ?? []
  )
  const [skills, setSkills] = useState<Skill[]>(
    () => cachedWorkspaceRef.current?.skills ?? []
  )
  const [tools, setTools] = useState<AgentToolConfig[]>(
    () => cachedWorkspaceRef.current?.tools ?? []
  )
  const [skillSubmitting, setSkillSubmitting] = useState(false)
  const [skillError, setSkillError] = useState<string | null>(null)
  const [confirmingHealthDataId, setConfirmingHealthDataId] = useState<string | null>(null)
  const [confirmingDietRecordsId, setConfirmingDietRecordsId] = useState<string | null>(null)
  const [fitnessContext, setFitnessContext] = useState<FitnessContext | null>(
    () => cachedWorkspaceRef.current?.fitnessContext ?? null
  )
  const [fitnessProfile, setFitnessProfile] = useState<FitnessProfile | null>(
    () => cachedWorkspaceRef.current?.fitnessProfile ?? null
  )
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetric[]>(
    () => cachedWorkspaceRef.current?.bodyMetrics ?? []
  )
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>(
    () => cachedWorkspaceRef.current?.healthMetrics ?? []
  )
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>(
    () => cachedWorkspaceRef.current?.workoutLogs ?? []
  )
  const [dietRecords, setDietRecords] = useState<DietRecord[]>(
    () => cachedWorkspaceRef.current?.dietRecords ?? cachedWorkspaceRef.current?.fitnessContext?.recent_diet_records ?? []
  )
  const [agentCheckins, setAgentCheckins] = useState<AgentCheckin[]>(
    () => cachedWorkspaceRef.current?.agentCheckins ?? []
  )
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(
      () =>
        (cachedWorkspaceRef.current?.notifications ?? []).filter(
          (item) => !["hydration", "knee", "plan"].includes(item.id)
        )
    )
  const [detailPanel, setDetailPanel] = useState<DetailPanel | null>(null)
  const [completedExercises, setCompletedExercises] = useState<string[]>([])
  const [trainingStarted, setTrainingStarted] = useState(false)
  const [trainingSession, setTrainingSession] =
    useState<TrainingSession | null>(null)
  const [trainingElapsedSeconds, setTrainingElapsedSeconds] = useState(0)
  const [trainingPaused, setTrainingPaused] = useState(false)
  const [trainingFeedback, setTrainingFeedback] = useState("")
  const [trainingFeedbackError, setTrainingFeedbackError] = useState<
    string | null
  >(null)
  const [trainingFeedbackLoading, setTrainingFeedbackLoading] = useState(false)
  const [trainingAdjustment, setTrainingAdjustment] =
    useState<TrainingPlanAdjustmentResponse | null>(null)
  const [lastHeartRateSummary, setLastHeartRateSummary] =
    useState<HeartRateSummary | null>(null)
  const [trainingGuidance, setTrainingGuidance] = useState("")
  const [trainingGuidanceError, setTrainingGuidanceError] = useState<
    string | null
  >(null)
  const [trainingGuidanceLoading, setTrainingGuidanceLoading] = useState(false)
  const [lastCompletedWorkout, setLastCompletedWorkout] = useState<{
    completed: boolean
    durationSeconds: number
    heartRateSummary: HeartRateSummary | null
    logId: number
    log: WorkoutLog
    title: string
  } | null>(null)
  const [trainingShareCard, setTrainingShareCard] =
    useState<WorkoutShareCard | null>(null)
  const [trainingShareCardOpen, setTrainingShareCardOpen] = useState(false)
  const activeStreamRef = useRef<AbortController | null>(null)
  const activeClientTurnIdRef = useRef<string | null>(null)
  const activeSessionIdRef = useRef<string | null>(null)
  const attachedClientTurnIdsRef = useRef<Set<string>>(new Set())
  const dataCenterRefreshRef = useRef(0)
  const liveMessagesBySessionRef = useRef<Record<string, ChatMessage[]>>({})
  const messagesRef = useRef<ChatMessage[]>(messages)
  const sendLockRef = useRef(false)

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId
  }, [activeSessionId])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const unreadCount = notifications.filter((item) => !item.read).length
  const activePlan =
    trainingPlans.find((plan) => plan.status === "active") ?? null
  const activeSession =
    chatSessions.find((session) => session.id === activeSessionId) ?? null
  const activeSessionTitle = activeSession?.title ?? "新会话"
  const activeSessionHasRunningMessage = messages.some(
    (message) => message.author === "assistant" && message.streaming
  )
  const latestMetric =
    getLatestByDate(bodyMetrics, (metric) => metric.measured_at ?? metric.recorded_at) ?? null
  const latestCheckin =
    getLatestByDate(agentCheckins, (checkin) => checkin.checkin_date ?? checkin.created_at) ?? null
  const latestHealthMetric =
    getLatestByDate(healthMetrics, (metric) => metric.measured_at ?? metric.recorded_at) ?? null
  const onboardingStatus: OnboardingStatus | null =
    fitnessContext?.onboarding ?? null
  const authToken = localStorage.getItem(AUTH_TOKEN_KEY)
  const liveHeartRate = useLiveHeartRate({
    enabled:
      activeNav === "训练计划" &&
      trainingStarted &&
      Boolean(trainingSession?.logId),
    hasHyperateId: Boolean(fitnessProfile?.hyperate_id?.trim()),
    token: authToken,
    workoutSessionId: trainingSession?.logId ?? null,
  })

  const pushNotification = (title: string, body: string, read = false) => {
    setNotifications((current) => [
      {
        id: createId(),
        title,
        body,
        read,
      },
      ...current,
    ].slice(0, 20))
  }

  const updateLiveSessionMessages = (
    sessionId: string,
    updater: (current: ChatMessage[]) => ChatMessage[]
  ) => {
    const current =
      liveMessagesBySessionRef.current[sessionId] ??
      (activeSessionIdRef.current === sessionId ? messagesRef.current : [])
    const next = updater(current)
    liveMessagesBySessionRef.current[sessionId] = next
    if (activeSessionIdRef.current === sessionId) {
      messagesRef.current = next
      setMessages(next)
    }
    return next
  }

  const attachRunningRuns = (token: string, runs: AgentRun[]) => {
    runs
      .filter((run) => run.status === "running" && run.client_turn_id)
      .forEach((run) => {
        const clientTurnId = run.client_turn_id
        if (!clientTurnId || attachedClientTurnIdsRef.current.has(clientTurnId)) {
          return
        }
        attachedClientTurnIdsRef.current.add(clientTurnId)
        void streamAgentChat({
          clientTurnId,
          message: run.user_message,
          sessionId: run.session_id,
          token,
          onEvent: (event) => {
            applyAgentEventToSession({
              assistantMessageId: `run-${run.id}-assistant`,
              body: run.user_message,
              event,
              sessionId: event.session_id ?? run.session_id,
            })
          },
        }).finally(() => {
          attachedClientTurnIdsRef.current.delete(clientTurnId)
        })
      })
  }

  const applyAgentEventToSession = ({
    assistantMessageId,
    body,
    event,
    sessionId,
  }: {
    assistantMessageId: string
    body: string
    event: AgentStreamEvent
    sessionId: string
  }) => {
    if (event.type === "final") {
      setAgentStreaming(false)
    }
    if (event.type === "done") {
      activeStreamRef.current = null
      setAgentStreaming(false)
      sendLockRef.current = false
      if (event.answer) {
        pushNotification("Agent 回复完成", body.slice(0, 36) || "一条对话已生成结果")
      }
    }
    if (event.type === "error") {
      activeStreamRef.current = null
      setAgentStreaming(false)
      sendLockRef.current = false
      pushNotification("Agent 回复失败", event.content || "请稍后重试")
    }

    updateLiveSessionMessages(sessionId, (current) =>
      current.map((message) => {
        if (message.id !== assistantMessageId) {
          return message
        }
        const suggestedHealthData =
          healthDataFromAgentRaw(event.raw) ?? message.suggestedHealthData
        const suggestedDietRecords =
          foodImageEstimateFromAgentResult(event.raw) ?? message.suggestedDietRecords
        const structuredCardPending =
          event.type === "done" || event.type === "final" || event.type === "error"
            ? false
            : isStructuredCardPendingEvent(event) || message.structuredCardPending

        if (isAnswerResetEvent(event)) {
          return {
            ...message,
            suggestedDietRecords,
            suggestedHealthData,
            structuredCardPending,
            trace: [...(message.trace ?? []), event],
          }
        }

        if (event.type === "done") {
          const nextBody = event.answer
            ? stripTrainingPlanJsonContract(event.answer)
            : message.body
          return {
            ...message,
            body: nextBody,
            completedAt: Date.now(),
            streaming: false,
            suggestedDietRecords,
            structuredCardPending,
            suggestedHealthData,
          }
        }

        if (event.type === "answer_delta") {
          return {
            ...message,
            body: stripTrainingPlanJsonContract(
              `${message.body}${event.delta ?? ""}`,
              { trim: false }
            ),
          }
        }

        if (event.type === "answer_replace") {
          const nextBody = stripTrainingPlanJsonContract(
            event.answer || event.content || message.body
          )
          return {
            ...message,
            body: nextBody,
            suggestedDietRecords,
            suggestedHealthData,
            structuredCardPending,
          }
        }

        if (event.type === "error") {
          return {
            ...message,
            completedAt: Date.now(),
            error: event.content,
            streaming: false,
            suggestedDietRecords,
            suggestedHealthData,
            structuredCardPending,
            trace: [...(message.trace ?? []), event],
          }
        }

        if (event.type === "final") {
          const suggestedTrainingPlan = trainingPlanPayloadFromAgentResult(event.raw)
          const nextBody = stripTrainingPlanJsonContract(
            event.answer || event.content || message.body
          )
          const generatedAlready = suggestedTrainingPlan
            ? generatedTrainingPlanKeys.has(
              trainingPlanDraftKey(suggestedTrainingPlan)
            )
            : false
          return {
            ...message,
            body: nextBody,
            completedAt: Date.now(),
            streaming: false,
            suggestedDietRecords,
            suggestedHealthData,
            structuredCardPending,
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
          suggestedDietRecords,
          suggestedHealthData,
          structuredCardPending,
          trace: [...(message.trace ?? []), event],
        }
      })
    )
  }

  useEffect(() => {
    if (!currentUser) {
      return
    }

    writeWorkspaceSnapshot({
      activeNav,
      activeSessionId,
      agentCheckins,
      bodyMetrics,
      chatSessions,
      composerValue,
      dietRecords,
      fitnessContext,
      fitnessProfile,
      healthMetrics,
      messages,
      notifications,
      skills,
      timestamp: Date.now(),
      tools,
      trainingPlans,
      user: currentUser,
      workoutLogs,
    })
  }, [
    activeNav,
    activeSessionId,
    agentCheckins,
    bodyMetrics,
    chatSessions,
    composerValue,
    currentUser,
    dietRecords,
    fitnessContext,
    fitnessProfile,
    healthMetrics,
    messages,
    notifications,
    skills,
    tools,
    trainingPlans,
    workoutLogs,
  ])

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      clearCachedUser()
      setCurrentUser(null)
      setAuthLoading(false)
      if (window.location.pathname === "/") {
        replaceWorkspacePath("/chat/new")
      }
      return
    }

    const cachedWorkspace = cachedWorkspaceRef.current
    const hasCachedUser = Boolean(readCachedUser() ?? cachedWorkspace?.user)
    setAuthLoading(!hasCachedUser)
    setDashboardLoading(!cachedWorkspace)

    const route = routeFromLocation()
    const cacheMatchesRoute =
      cachedWorkspace &&
      hasCachedUser &&
      (!route.sessionId || route.sessionId === cachedWorkspace.activeSessionId)
    if (cacheMatchesRoute) {
      setAuthLoading(false)
      setDashboardLoading(false)
      return
    }

    let ignore = false

    loadInitialAuthSnapshot(token)
      .then(async ({ context, plans, runs, skills: nextSkills, tools: nextTools, user }) => {
        if (ignore) {
          return
        }
        writeCachedUser(user)
        setCurrentUser(user)
        applyDashboardSnapshot(context, plans, runs, nextSkills, nextTools)
        const preferredSessionId =
          route.sessionId ?? (route.nav === "new" ? null : readActiveAgentSessionId())
        const selectedSessionId = await syncConversationSessions(
          token,
          preferredSessionId,
          { selectFirst: false }
        )

        if (route.nav === "new" && !route.sessionId) {
          setMessages(initialMessages)
          setActiveSessionId(null)
          setActiveNav("new")
          writeActiveAgentSessionId(null)
          replaceWorkspacePath("/chat/new")
          return
        }

        if (!selectedSessionId) {
          if (route.nav !== "训练计划" && route.nav !== "数据中心" && route.nav !== "饮食摄入" && route.nav !== "工具技能") {
            setMessages(initialMessages)
            setActiveSessionId(null)
            setActiveNav("new")
            replaceWorkspacePath("/chat/new")
          }
          return
        }

        if (route.sessionId) {
          await loadConversationSession(token, selectedSessionId, {
            silent: Boolean(cachedWorkspace),
          })
        }
      })
      .catch((error) => {
        if (ignore) {
          return
        }
        if (!hasCachedUser) {
          localStorage.removeItem(AUTH_TOKEN_KEY)
          clearCachedUser()
          setCurrentUser(null)
          return
        }
        console.warn("后台同步登录状态失败，继续使用本地快照", error)
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
    const handlePopState = () => {
      const route = routeFromLocation()
      setActiveNav(route.nav)
      if (!route.sessionId) {
        return
      }
      const token = localStorage.getItem(AUTH_TOKEN_KEY)
      if (token) {
        void loadConversationSession(token, route.sessionId)
      }
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
    // Navigation handler should bind once; load uses current authenticated state.
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

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token || !activePlan) {
      setTrainingGuidance("")
      setTrainingGuidanceError(null)
      setTrainingGuidanceLoading(false)
      return undefined
    }

    let cancelled = false
    setTrainingGuidanceLoading(true)
    setTrainingGuidanceError(null)
    void getTrainingPlanGuidance(token, activePlan.id)
      .then((response) => {
        if (cancelled) return
        setTrainingGuidance(response.message)
      })
      .catch((error) => {
        if (cancelled) return
        setTrainingGuidance("")
        setTrainingGuidanceError(getErrorMessage(error))
      })
      .finally(() => {
        if (cancelled) return
        setTrainingGuidanceLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [
    activePlan?.id,
    latestCheckin?.id,
    workoutLogs[0]?.id,
    workoutLogs[0]?.created_at,
  ])

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
      await refreshDashboard(token.access_token)
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
        replaceWorkspacePath("/chat/new")
      }

      setAuthModalOpen(false)
      setOnboardingOpen(authMode === "register")
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
    setHealthMetrics([])
    setWorkoutLogs([])
    setDietRecords([])
    setAgentCheckins([])
    setTools([])
    setMessages(initialMessages)
    setComposerAttachments([])
    setComposerUploadingAttachments([])
    setComposerMode(null)
    setActiveSessionId(null)
    writeActiveAgentSessionId(null)
    setChatSessions([])
    setProfileMenuOpen(false)
    setOnboardingOpen(false)
    setBodyMetricModalOpen(false)
    setCompletedExercises([])
    setTrainingStarted(false)
    setTrainingSession(null)
    setTrainingElapsedSeconds(0)
    setTrainingPaused(false)
    setLastHeartRateSummary(null)
    pushWorkspacePath("/chat/new")
    setActiveNav("new")
    sonnerToast.info("已退出登录")
  }

  const openAddDataModal = (category: AddDataCategory = "body") => {
    if (!currentUser) {
      openAuth("login")
      return
    }

    setBodyMetricError(null)
    setEditingBodyMetric(null)
    setAddDataInitialTab(category)
    setBodyMetricModalOpen(true)
  }

  const openBodyMetricEditor = (metric: BodyMetric | null = null) => {
    if (!currentUser) {
      openAuth("login")
      return
    }

    const record = metric && typeof metric.id === "number" ? metric : null
    setBodyMetricError(null)
    setEditingBodyMetric(record)
    setAddDataInitialTab("body")
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
    pushWorkspacePath(
      label === "训练计划"
        ? "/training"
        : label === "数据中心"
          ? "/body"
          : label === "饮食摄入"
            ? "/diet"
            : label === "工具技能"
              ? "/capabilities"
              : "/chat/new"
    )
    setSidebarDrawerOpen(false)
  }

  const syncConversationSessions = async (
    token: string,
    preferredSessionId: string | null = activeSessionId,
    options: { preserveActive?: boolean; selectFirst?: boolean } = {}
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

    if (options.preserveActive) {
      return activeSessionId
    }

    const nextActiveSessionId =
      preferredSessionId &&
        nextSessions.some((session) => session.id === preferredSessionId)
        ? preferredSessionId
        : options.selectFirst === false
          ? null
          : nextSessions[0]?.id ?? null

    setActiveSessionId(nextActiveSessionId)
    writeActiveAgentSessionId(nextActiveSessionId)
    return nextActiveSessionId
  }

  const loadConversationSession = async (
    token: string,
    sessionId: string,
    options: { silent?: boolean } = {}
  ) => {
    if (!options.silent) {
      setConversationLoading(true)
    }
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

      const storedMessages = markGeneratedTrainingPlanMessages(
        chatMessagesFromAgentRuns(runs),
        generatedTrainingPlanKeys
      )
      const liveMessages = liveMessagesBySessionRef.current[sessionId]
      const nextMessages = liveMessages?.some((message) => message.streaming)
        ? liveMessages
        : storedMessages
      liveMessagesBySessionRef.current[sessionId] = nextMessages
      messagesRef.current = nextMessages
      setMessages(
        markGeneratedTrainingPlanMessages(
          nextMessages,
          generatedTrainingPlanKeys
        )
      )
      setActiveSessionId(sessionId)
      activeSessionIdRef.current = sessionId
      writeActiveAgentSessionId(sessionId)
      setActiveNav(sessionId)
      pushWorkspacePath(`/chat/${encodeURIComponent(sessionId)}`)
      attachRunningRuns(token, runs)
    } finally {
      if (!options.silent) {
        setConversationLoading(false)
      }
    }
  }

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token || !activeSessionId || agentStreaming || !activeSessionHasRunningMessage) {
      return undefined
    }

    let cancelled = false
    const refreshRunningSession = async () => {
      try {
        const runs = await listAgentRunsForSession(token, activeSessionId)
        if (cancelled) {
          return
        }

        attachRunningRuns(token, runs)
        const storedMessages = markGeneratedTrainingPlanMessages(
          chatMessagesFromAgentRuns(runs),
          generatedTrainingPlanKeys
        )
        const liveMessages = liveMessagesBySessionRef.current[activeSessionId]
        const nextMessages = liveMessages?.some((message) => message.streaming)
          ? liveMessages
          : storedMessages

        setMessages(
          markGeneratedTrainingPlanMessages(nextMessages, generatedTrainingPlanKeys)
        )

        if (!runs.some((run) => run.status === "running")) {
          const sessions = await listAgentSessions(token, {
            includeArchived: true,
            includeDeleted: false,
            limit: 200,
          })
          if (!cancelled) {
            setChatSessions(
              chatSessionsFromAgentSessions(sessions)
                .filter((session) => !session.deleted && session.messageCount > 0)
                .sort(sortChatSessions)
            )
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error(error)
        }
      }
    }

    void refreshRunningSession()
    const intervalId = window.setInterval(refreshRunningSession, 4000)
    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- attachRunningRuns reads latest live refs; including it would recreate polling every render.
  }, [
    activeSessionHasRunningMessage,
    activeSessionId,
    agentStreaming,
    generatedTrainingPlanKeys,
  ])

  const handleCreateConversation = () => {
    if (activeSessionHasRunningMessage) {
      pushNotification("Agent 继续运行", "当前对话仍在生成，切回该对话可继续查看实时进度")
    }
    activeStreamRef.current = null
    setMessages(initialMessages)
    setActiveSessionId(null)
    activeSessionIdRef.current = null
    writeActiveAgentSessionId(null)
    setComposerValue("")
    setComposerAttachments([])
    setComposerUploadingAttachments([])
    setComposerMode(null)
    setAgentStreaming(false)
    sendLockRef.current = false
    setActiveNav("new")
    pushWorkspacePath("/chat/new")
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

    if (activeSessionHasRunningMessage) {
      pushNotification("Agent 继续运行", "当前对话仍在生成，切回该对话可继续查看实时进度")
    }
    activeStreamRef.current = null
    setAgentStreaming(false)
    sendLockRef.current = false

    try {
      await loadConversationSession(token, sessionId)
      pushWorkspacePath(`/chat/${encodeURIComponent(sessionId)}`)
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

  const handleToggleShareConversation = (sessionId: string) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      return
    }

    const session = chatSessions.find((item) => item.id === sessionId)
    const nextShared = !session?.shared

    void updateAgentSession(token, sessionId, {
      is_shared: nextShared,
    })
      .then((updated) => {
        setChatSessions((current) =>
          [chatSessionFromAgentSession(updated), ...current.filter((item) => item.id !== updated.session_id)]
            .filter((item) => !item.deleted)
            .sort(sortChatSessions)
        )
        sonnerToast.success(nextShared ? "已加入跨对话知识共享" : "已关闭跨对话共享")
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

  const handleAddDataSubmit = async ({
    bodyForm,
    category,
    dietForm,
    healthForm,
  }: AddDataSubmitPayload) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      return
    }

    setBodyMetricSubmitting(true)
    setBodyMetricError(null)

    try {
      if (category === "body") {
        const bodyPayload = buildBodyPayload(bodyForm, setBodyMetricError)
        if (!bodyPayload) {
          return
        }
        if (!bodyPayload.hasMetricData && !bodyPayload.hasCheckinData) {
          setBodyMetricError("请至少填写一项身体指标")
          return
        }

        const metricPayload = {
          ...bodyPayload.metric,
          measured_at: bodyForm.measuredAt
            ? new Date(bodyForm.measuredAt).toISOString()
            : new Date().toISOString(),
          source: editingBodyMetric?.source ?? "manual",
        }
        if (bodyPayload.hasMetricData) {
          const metric = editingBodyMetric
            ? await updateBodyMetric(token, editingBodyMetric.id, metricPayload)
            : await createBodyMetric(token, metricPayload)
          setBodyMetrics((current) =>
            editingBodyMetric
              ? current.map((item) => item.id === metric.id ? metric : item)
              : [metric, ...current]
          )
        }

        if (bodyPayload.hasCheckinData) {
          const measuredDate = bodyForm.measuredAt ? new Date(bodyForm.measuredAt) : null
          const checkinDate =
            measuredDate && !Number.isNaN(measuredDate.getTime())
              ? localDateValue(measuredDate)
              : localDateValue(new Date())
          const checkin = await createAgentCheckin(token, {
            ...bodyPayload.checkin,
            checkin_date: checkinDate,
            source: "manual",
            summary: "手动记录恢复状态",
            training_plan_id: activePlan?.id ?? null,
          })
          setAgentCheckins((current) => [checkin, ...current])
        }
      }

      if (category === "health") {
        const healthPayload = buildHealthPayload(healthForm, setBodyMetricError)
        if (!healthPayload) {
          return
        }
        if (!healthPayload.hasHealthData) {
          setBodyMetricError("请至少填写一项健康数据")
          return
        }
        const measuredAt = healthForm.measuredAt
          ? new Date(healthForm.measuredAt).toISOString()
          : new Date().toISOString()
        const metric = await createHealthMetric(token, {
          ...healthPayload.metric,
          measured_at: measuredAt,
          metric_date: healthForm.metricDate || localDateValue(new Date(measuredAt)),
          source: "manual",
        })
        setHealthMetrics((current) => [metric, ...current])
      }

      if (category === "diet") {
        const dietPayload = buildDietPayload(dietForm, setBodyMetricError)
        if (!dietPayload) {
          return
        }
        if (!dietPayload.hasDietData || !dietPayload.item) {
          setBodyMetricError("请至少填写一条饮食记录")
          return
        }
        const saved = await createDietRecords(token, {
          meal_date: dietPayload.mealDate ?? localDateValue(new Date()),
          items: [dietPayload.item],
        })
        setDietRecords((current) => [...saved, ...current])
      }

      await refreshDashboard(token, { preserveMessages: true })
      setBodyMetricModalOpen(false)
      setEditingBodyMetric(null)
      sonnerToast.success(
        category === "diet"
          ? "饮食摄入已保存"
          : category === "health"
            ? "健康数据已保存"
            : editingBodyMetric
              ? "身体测量记录已修正"
              : "身体指标已保存"
      )
    } catch (error) {
      setBodyMetricError(getErrorMessage(error))
    } finally {
      setBodyMetricSubmitting(false)
    }
  }

  const handleExportBodyData = () => {
    downloadJsonFile(
      {
        exported_at: new Date().toISOString(),
        body_metrics: bodyMetrics,
        health_metrics: healthMetrics,
        diet_records: dietRecords,
        recovery_checkins: agentCheckins,
        workout_logs: workoutLogs,
      },
      `kratos-health-data-${localDateValue(new Date())}.json`
    )
    sonnerToast.success("身体与训练数据已导出")
  }

  const refreshDashboard = async (
    token: string,
    options: { preserveMessages?: boolean } = {}
  ): Promise<FitnessContext | null> => {
    setDashboardLoading(true)

    try {
      const { context, plans, runs, skills: nextSkills, tools: nextTools } = await loadDashboardSnapshot(token)
      applyDashboardSnapshot(context, plans, runs, nextSkills, nextTools, options)
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
    nextTools: AgentToolConfig[],
    _options: { preserveMessages?: boolean } = {}
  ) {
    void _options
    setFitnessContext(context)
    setTrainingPlans(plans)
    setSkills(nextSkills)
    setTools(nextTools)
    setSkillError(null)
    setFitnessProfile(context.profile)
    setBodyMetrics(context.recent_body_metrics)
    setHealthMetrics(context.recent_health_metrics)
    setWorkoutLogs(context.recent_workout_logs)
    setDietRecords(context.recent_diet_records)
    setAgentCheckins(context.recent_checkins)
  }

  useEffect(() => {
    if (activeNav !== "数据中心") {
      return
    }
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      return
    }
    const now = Date.now()
    if (now - dataCenterRefreshRef.current < 3000) {
      return
    }
    dataCenterRefreshRef.current = now
    void refreshDashboard(token, { preserveMessages: true })
    // Refresh only when entering the data center or switching user; the
    // dashboard refresh function is intentionally not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNav, currentUser?.id])

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
        await createBodyMetric(token, {
          ...bodyPayload.metric,
          measured_at: new Date().toISOString(),
          source: "onboarding",
        })
      }
      if (bodyPayload.hasCheckinData) {
        await createAgentCheckin(token, {
          ...bodyPayload.checkin,
          checkin_date: localDateValue(new Date()),
          source: "onboarding",
          summary: "新用户引导恢复状态记录",
          training_plan_id: activePlan?.id ?? null,
        })
      }

      await refreshDashboard(token, { preserveMessages: true })
      setOnboardingOpen(false)
      sonnerToast.success("建档完成，Kratos 现在更了解您了")
    } catch (error) {
      setOnboardingError(getErrorMessage(error))
    } finally {
      setOnboardingSubmitting(false)
    }
  }

  const handleSendMessage = async () => {
    const body = composerValue.trim()
    const attachments = composerAttachments
    const displayBody =
      body || (attachments.length ? `${composerMode?.label ?? "附件"}：已上传附件` : "")
    if (!body && attachments.length === 0) {
      sonnerToast.warning("请输入消息或上传附件")
      return
    }

    if (agentStreaming || sendLockRef.current) {
      sonnerToast.warning("Kratos 正在回复，请稍等")
      return
    }

    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      sonnerToast.info("登录后开始对话")
      return
    }

    sendLockRef.current = true
    let nextSessionId = activeSessionId ?? createId()
    activeSessionIdRef.current = nextSessionId
    const clientTurnId = createId()
    activeClientTurnIdRef.current = clientTurnId
    if (!activeSessionId) {
      const sessionTitle = "新会话"
      setActiveSessionId(nextSessionId)
      writeActiveAgentSessionId(nextSessionId)
      setActiveNav(nextSessionId)
      pushWorkspacePath(`/chat/${encodeURIComponent(nextSessionId)}`)
      setChatSessions((current) =>
        [
          {
            id: nextSessionId,
            title: sessionTitle,
            preview: displayBody,
            updatedAt: new Date().toISOString(),
            messageCount: 2,
            pinned: false,
          },
          ...current.filter((item) => item.id !== nextSessionId),
        ].sort(sortChatSessions)
      )
    }

    const assistantMessageId = createId()
    const controller = new AbortController()
    activeClientTurnIdRef.current = clientTurnId
    activeStreamRef.current = controller
    setAgentStreaming(true)
    updateLiveSessionMessages(nextSessionId, (current) => [
      ...current,
      {
        id: createId(),
        author: "user",
        attachments,
        body: displayBody,
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
    setComposerAttachments([])
    setComposerUploadingAttachments([])

    let handledStreamSessionId: string | null = null
    const agentMessage = buildModeAwareAgentMessage({
      attachments,
      body,
      mode: composerMode,
    })

    try {
      attachedClientTurnIdsRef.current.add(clientTurnId)
      await streamAgentChat({
        attachments,
        clientTurnId,
        message: agentMessage,
        onEvent: (event) => {
          if (event.session_id && event.session_id !== handledStreamSessionId) {
            handledStreamSessionId = event.session_id
            const serverSessionId = event.session_id
            const sessionTitle = "新会话"
            const optimisticSessionId = nextSessionId
            nextSessionId = serverSessionId
            activeSessionIdRef.current = serverSessionId
            if (optimisticSessionId !== serverSessionId) {
              const liveMessages = liveMessagesBySessionRef.current[optimisticSessionId]
              if (liveMessages) {
                liveMessagesBySessionRef.current[serverSessionId] = liveMessages
                delete liveMessagesBySessionRef.current[optimisticSessionId]
              }
            }
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
                  preview: displayBody,
                  updatedAt: new Date().toISOString(),
                  messageCount: 2,
                  pinned: false,
                },
                ...withoutOptimistic,
              ].sort(sortChatSessions)
            })
          }

          applyAgentEventToSession({
            assistantMessageId,
            body: displayBody,
            event,
            sessionId: event.session_id ?? nextSessionId,
          })
        },
        sessionId: nextSessionId,
        signal: controller.signal,
        token,
      })
      if (nextSessionId) {
        void syncConversationSessions(token, nextSessionId, {
          preserveActive: true,
        })
      }
      void refreshDashboard(token, { preserveMessages: true })
    } catch (error) {
      if (controller.signal.aborted) {
        return
      }

      const message = getErrorMessage(error)
      sonnerToast.error(message)
      pushNotification("Agent 连接失败", message)
      updateLiveSessionMessages(nextSessionId, (current) =>
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
      attachedClientTurnIdsRef.current.delete(clientTurnId)
      if (activeClientTurnIdRef.current === clientTurnId) {
        activeClientTurnIdRef.current = null
      }
      activeStreamRef.current = null
      setAgentStreaming(false)
      sendLockRef.current = false
    }
  }

  const handleStopAgent = () => {
    const stoppingSessionId = activeSessionId
    const stoppingClientTurnId = activeClientTurnIdRef.current
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (token && stoppingClientTurnId) {
      void cancelAgentChatStream(token, stoppingClientTurnId).catch((error) => {
        sonnerToast.error(getErrorMessage(error), { richColors: true })
      })
    }
    activeStreamRef.current?.abort()
    activeClientTurnIdRef.current = null
    activeStreamRef.current = null
    activeClientTurnIdRef.current = null
    setAgentStreaming(false)
    sendLockRef.current = false
    const updateMessages = (current: ChatMessage[]) =>
      current.map((message) =>
        message.streaming
          ? {
            ...message,
            completedAt: Date.now(),
            streaming: false,
            trace: [
              ...(message.trace ?? []),
              {
                type: "status" as const,
                content: "已终止本次 Agent 回复",
              },
            ],
          }
          : message
      )
    if (stoppingSessionId) {
      updateLiveSessionMessages(stoppingSessionId, updateMessages)
    } else {
      setMessages(updateMessages)
    }
    sonnerToast.warning("已终止本次 Agent 回复")
  }

  const handleConfirmHealthData = async (messageId: string) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    const message = messages.find((item) => item.id === messageId)
    const data = message?.suggestedHealthData
    if (!token || !data) {
      openAuth("login")
      return
    }
    setConfirmingHealthDataId(messageId)
    try {
      if (data.profile && Object.keys(data.profile).length) {
        await upsertFitnessProfile(token, data.profile)
      }
      if (data.body_metric && Object.keys(data.body_metric).length) {
        await createBodyMetric(token, {
          ...data.body_metric,
          measured_at: new Date().toISOString(),
          source: "chat_confirmation",
        })
      }
      if (data.health_metric && Object.keys(data.health_metric).length) {
        await createHealthMetric(token, {
          ...data.health_metric,
          measured_at: new Date().toISOString(),
          metric_date: localDateValue(new Date()),
          source: "chat_confirmation",
        })
      }
      if (data.checkin && Object.keys(data.checkin).length) {
        await createAgentCheckin(token, {
          ...data.checkin,
          checkin_date: localDateValue(new Date()),
          source: "chat_confirmation",
          training_plan_id: activePlan?.id ?? null,
        })
      }
      setMessages((current) =>
        current.map((item) =>
          item.id === messageId ? { ...item, healthDataSaved: true } : item
        )
      )
      await refreshDashboard(token, { preserveMessages: true })
      sonnerToast.success("已确认并保存健康数据")
    } catch (error) {
      sonnerToast.error(getErrorMessage(error), { richColors: true })
    } finally {
      setConfirmingHealthDataId(null)
    }
  }

  const handleConfirmDietRecords = async (messageId: string) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    const message = messages.find((item) => item.id === messageId)
    const data = message?.suggestedDietRecords
    if (!token || !data || !data.items.length) {
      openAuth("login")
      return
    }
    setConfirmingDietRecordsId(messageId)
    try {
      const saved = await createDietRecords(token, {
        meal_date: localDateValue(new Date()),
        items: data.items,
      })
      setDietRecords((current) => [...saved, ...current])
      setMessages((current) =>
        current.map((item) =>
          item.id === messageId ? { ...item, dietRecordsSaved: true } : item
        )
      )
      await refreshDashboard(token, { preserveMessages: true })
      sonnerToast.success("已确认并保存饮食记录")
    } catch (error) {
      sonnerToast.error(getErrorMessage(error), { richColors: true })
    } finally {
      setConfirmingDietRecordsId(null)
    }
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
    const files = Array.from(event.target.files ?? [])
    event.target.value = ""
    if (!files.length) {
      return
    }

    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      sonnerToast.info("登录后可以上传文件给 Agent")
      return
    }

    const remainingSlots = Math.max(
      0,
      8 - composerAttachments.length - composerUploadingAttachments.length
    )
    if (remainingSlots === 0) {
      sonnerToast.warning("最多同时附加 8 个文件")
      return
    }

    const filesToUpload = files.slice(0, remainingSlots)
    if (files.length > filesToUpload.length) {
      sonnerToast.info(`已选择前 ${filesToUpload.length} 个文件，最多附加 8 个`)
    }

    const pendingUploads = filesToUpload.map((file) => ({
      content_type: file.type || "application/octet-stream",
      filename: file.name,
      id: createId(),
      size: file.size,
    }))
    setComposerUploadingAttachments((current) =>
      [...current, ...pendingUploads].slice(0, 8)
    )

    void Promise.allSettled(filesToUpload.map(async (file, index) => {
      const uploaded = await uploadAttachment(token, file)
      return {
        attachment: {
          ...uploaded,
          data_url: file.type.startsWith("image/")
            ? await readImageAsAgentDataUrl(file)
            : null,
        },
        pendingId: pendingUploads[index].id,
      }
    }))
      .then((results) => {
        const pendingIds = new Set(pendingUploads.map((item) => item.id))
        const uploads: ChatAttachment[] = []
        const errors: string[] = []

        results.forEach((result) => {
          if (result.status === "fulfilled") {
            uploads.push(result.value.attachment)
            return
          }
          errors.push(getErrorMessage(result.reason))
        })

        setComposerUploadingAttachments((current) =>
          current.filter((item) => !pendingIds.has(item.id))
        )
        if (uploads.length) {
          setComposerAttachments((current) => [...current, ...uploads].slice(0, 8))
          sonnerToast.success(`已上传 ${uploads.length} 个附件`)
        }
        if (errors.length) {
          sonnerToast.error(errors[0] ?? "附件上传失败", { richColors: true })
        }
      })
  }

  const handleDietImageEstimate = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) {
      return
    }

    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      sonnerToast.info("登录后可以识别餐食热量")
      return
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      sonnerToast.error("仅支持 JPG、PNG 或 WebP 图片")
      return
    }

    if (file.size > 8 * 1024 * 1024) {
      sonnerToast.error("图片不能超过 8MB")
      return
    }

    setDietEstimating(true)
    const toastId = sonnerToast.loading("正在识别餐食热量...")
    void estimateDietFromImage(token, file)
      .then((response) => {
        setDietEstimate(response.data)
        setDietEstimateOpen(true)
        sonnerToast.success("热量估算完成", { id: toastId })
      })
      .catch((error) => {
        sonnerToast.error(getErrorMessage(error), { id: toastId, richColors: true })
      })
      .finally(() => {
        setDietEstimating(false)
      })
  }

  const handleSaveDietEstimate = async (items: FoodEstimateItem[]) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      sonnerToast.info("登录后可以保存饮食记录")
      return
    }
    if (!items.length) {
      sonnerToast.warning("请选择至少一项食物")
      return
    }

    setDietSaving(true)
    try {
      const saved = await createDietRecords(token, {
        meal_date: localDateValue(new Date()),
        items,
      })
      setDietRecords((current) => [...saved, ...current])
      setDietEstimateOpen(false)
      await refreshDashboard(token, { preserveMessages: true })
      sonnerToast.success("已保存到今日饮食")
    } catch (error) {
      sonnerToast.error(getErrorMessage(error), { richColors: true })
    } finally {
      setDietSaving(false)
    }
  }

  const handleAvatarUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) {
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      sonnerToast.error("头像不能超过 5MB")
      return
    }

    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token || !currentUser) {
      openAuth("login")
      return
    }

    setAvatarUploading(true)
    void uploadAvatar(token, file)
      .then((upload) => {
        const nextUser = { ...currentUser, avatar_url: upload.url }
        setCurrentUser(nextUser)
        writeCachedUser(nextUser)
        sonnerToast.success("头像已更新")
      })
      .catch((error) => {
        sonnerToast.error(getErrorMessage(error), { richColors: true })
      })
      .finally(() => {
        setAvatarUploading(false)
      })
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
    actionTitles: string[],
    actionIds: string[]
  ) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      sonnerToast.info("登录后可以保存训练记录")
      return
    }

    if (actionTitles.length === 0) {
      sonnerToast.info("当前计划没有可记录的训练动作")
      return
    }

    if (trainingSession) {
      sonnerToast.warning("已有训练进行中，请先结束当前训练")
      return
    }

    void startWorkoutSession(token, dayTitle, workoutDate, actionTitles, actionIds)
  }

  const startWorkoutSession = async (
    token: string,
    dayTitle: string,
    workoutDate: string,
    actionTitles: string[],
    actionIds: string[]
  ) => {
    setDashboardLoading(true)
    try {
      setLastHeartRateSummary(null)
      const log = await createWorkoutLog(token, {
        calories_burned: null,
        completed: false,
        duration_minutes: 0,
        duration_seconds: 0,
        notes: `训练进行中；计划动作快照：${JSON.stringify(actionTitles)}`,
        perceived_exertion: null,
        title: dayTitle || activePlan?.title || "未命名训练",
        training_plan_id: activePlan?.id ?? null,
        workout_date: workoutDate,
        workout_type: inferWorkoutType(dayTitle, actionTitles),
        exercises: actionTitles.map((action, index) => ({
          completed: false,
          exercise_id: actionIds[index] ?? `${workoutDate}-${index}`,
          name: action,
          position: index,
          sets: [
            {
              completed: false,
              set_number: 1,
            },
          ],
        })),
      })

      setCompletedExercises([])
      setTrainingSession({
        actionIds,
        actionTitles,
        accumulatedSeconds: 0,
        dayTitle,
        isPaused: false,
        logId: log.id,
        startedAt: Date.now(),
        workoutDate,
      })
      setTrainingElapsedSeconds(0)
      setTrainingPaused(false)
      setTrainingStarted(true)
      sonnerToast.info("训练计时已开始，逐个点击动作卡片标记完成")
    } catch (error) {
      sonnerToast.error(getErrorMessage(error), { richColors: true })
    } finally {
      setDashboardLoading(false)
    }
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
      trainingSession.logId,
      dayTitle,
      workoutDate,
      actionsToSave,
      elapsedSeconds,
      allActionsDone
    )
  }

  const saveCompletedWorkout = async (
    token: string,
    logId: number,
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
      let log = await updateWorkoutLog(token, logId, {
        calories_burned: Math.max(20, Math.round(durationMinutes * 6)),
        completed,
        duration_minutes: durationMinutes,
        duration_seconds: elapsedSeconds,
        notes: `实际训练 ${formatDuration(elapsedSeconds)}；${completed ? "完成全部计划动作" : "提前结束"}；动作快照：${actionSnapshot}；已标记：${actions.join("、")}`,
        perceived_exertion: 6,
        title: dayTitle || activePlan?.title || "未命名训练",
        training_plan_id: activePlan?.id ?? null,
        workout_date: workoutDate,
        workout_type: inferWorkoutType(dayTitle, actions),
        exercises: actions.map((action, index) => ({
          completed: action !== "未标记完成动作",
          exercise_id: `${workoutDate}-${index}`,
          name: action,
          position: index,
          sets: [
            {
              completed: action !== "未标记完成动作",
              set_number: 1,
            },
          ],
        })),
      })
      let heartRateSummary: HeartRateSummary | null = null
      try {
        heartRateSummary = await getWorkoutHeartRateSummary(token, log.id)
        setLastHeartRateSummary(heartRateSummary)
        const estimatedKcal = heartRateSummary.estimated_kcal.value
        if (estimatedKcal !== null && Number.isFinite(estimatedKcal)) {
          log = await updateWorkoutLog(token, log.id, {
            calories_burned: Math.max(0, Math.round(estimatedKcal)),
          })
        }
      } catch (error) {
        console.warn("训练心率汇总失败，保留基础训练记录", error)
      }
      setWorkoutLogs((current) => [
        log,
        ...current.filter((item) => item.id !== log.id),
      ])
      setCompletedExercises([])
      setTrainingStarted(false)
      setTrainingSession(null)
      setTrainingElapsedSeconds(0)
      setTrainingPaused(false)
      const dailyAdjustmentPlan = isDailyPlanForAdjustment(activePlan)
      setTrainingShareCard(null)
      setTrainingShareCardOpen(true)
      void loadTrainingShareCard(token, log.id)
      if (dailyAdjustmentPlan) {
        setLastCompletedWorkout(null)
        setTrainingFeedback("")
        setTrainingAdjustment(null)
        setTrainingFeedbackError(null)
        sonnerToast.success("每日训练记录已同步，未更新后续计划")
      } else {
        setLastCompletedWorkout({
          completed,
          durationSeconds: elapsedSeconds,
          heartRateSummary,
          logId: log.id,
          log,
          title: dayTitle || activePlan?.title || "未命名训练",
        })
        setTrainingFeedback("")
        setTrainingAdjustment(null)
        setTrainingFeedbackError(null)
        sonnerToast.success("训练完成记录已同步")
      }
    } catch (error) {
      sonnerToast.error(getErrorMessage(error))
    } finally {
      setDashboardLoading(false)
    }
  }

  const loadTrainingShareCard = async (token: string, logId: number) => {
    try {
      const card = await getWorkoutShareCard(token, logId)
      setTrainingShareCard(card)
    } catch (error) {
      console.warn("训练分享卡生成失败", error)
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

      const plan = await createTrainingPlan(token, {
        ...payload,
        status: "draft",
      })
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
      pushWorkspacePath("/training")
      sonnerToast.success(
        "计划草稿已保存，请确认后设为当前"
      )
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
        status: "draft",
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
      pushWorkspacePath("/training")
      sonnerToast.success(
        payload.plan_kind === "daily"
          ? "今日训练草稿已保存，请设为当前后开始训练"
          : "周期训练草稿已保存，请确认后设为当前"
      )
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
      const updated = await activateTrainingPlan(token, plan.id)

      setTrainingPlans((current) =>
        current.map((item) => {
          if (item.id === updated.id) {
            return updated
          }

          if (item.id !== updated.id && item.status === "active") {
            return { ...item, status: "paused" }
          }

          return item
        })
      )
      setCompletedExercises([])
      setTrainingStarted(false)
      await refreshDashboard(token, { preserveMessages: true })
      pushWorkspacePath("/training")
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
      const [nextSkills, nextTools] = await Promise.all([
        listSkills(token),
        listAgentTools(token),
      ])
      setSkills(nextSkills)
      setTools(nextTools)
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

  const handleToggleTool = async (tool: AgentToolConfig, enabled: boolean) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      openAuth("login")
      return
    }
    setSkillSubmitting(true)
    setSkillError(null)
    try {
      const updated = await updateAgentTool(token, tool.name, enabled)
      setTools((current) =>
        current.map((item) => (item.name === updated.name ? updated : item))
      )
      sonnerToast.success(enabled ? "工具已启用" : "工具已禁用")
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
          workout_log_id: lastCompletedWorkout.logId,
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
          latestCheckin={latestCheckin}
          completedExercises={completedExercises}
          dashboardLoading={dashboardLoading}
          guidanceError={trainingGuidanceError}
          guidanceLoading={trainingGuidanceLoading}
          guidanceMessage={trainingGuidance}
          postTrainingAdjustment={trainingAdjustment}
          postTrainingFeedback={trainingFeedback}
          postTrainingFeedbackError={trainingFeedbackError}
          postTrainingFeedbackLoading={trainingFeedbackLoading}
          postTrainingFeedbackVisible={Boolean(lastCompletedWorkout)}
          postTrainingHeartRateSummary={lastHeartRateSummary}
          liveHeartRate={liveHeartRate}
          onOpenPlanComposer={openTrainingPlanComposer}
          onApplyPostTrainingAdjustment={handleApplyTrainingAdjustment}
          onDeletePlan={handleDeleteTrainingPlan}
          onEditPlan={openTrainingPlanEditor}
          onPostTrainingFeedbackChange={(value) => {
            setTrainingFeedback(value)
            setTrainingFeedbackError(null)
            setTrainingAdjustment(null)
          }}
          onPreviewPostTrainingAdjustment={handlePreviewTrainingAdjustment}
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

    if (activeNav === "数据中心") {
      return (
        <BodyDataPage
          bodyMetrics={bodyMetrics}
          dietRecords={dietRecords}
          healthMetrics={healthMetrics}
          latestHealthMetric={latestHealthMetric}
          latestMetric={latestMetric}
          onAddData={() => openAddDataModal("body")}
          onExportBodyData={handleExportBodyData}
          onLoadWorkoutHeartRateSummary={(log) => getWorkoutHeartRateSummary(localStorage.getItem(AUTH_TOKEN_KEY) ?? "", log.id)}
          workoutLogs={workoutLogs}
        />
      )
    }

    if (activeNav === "饮食摄入") {
      return (
        <DietIntakePage
          dietEstimating={dietEstimating}
          onAddDiet={() => openAddDataModal("diet")}
          onDietImage={handleDietImageEstimate}
          records={dietRecords}
        />
      )
    }

    if (activeNav === "工具技能") {
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
          onToggleTool={handleToggleTool}
          skills={skills}
          tools={tools}
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
        activeComposerMode={composerMode}
        activeSessionTitle={activeSessionTitle}
        agentStreaming={agentStreaming}
        chatTrainingPlanSavingId={chatTrainingPlanSavingId}
        composerAttachments={composerAttachments}
        composerUploadingAttachments={composerUploadingAttachments}
        composerValue={composerValue}
        conversationLoading={conversationLoading}
        dietEstimating={dietEstimating}
        messages={messages}
        onAttachment={handleAttachment}
        onComposerChange={(value) => setComposerValue(value.slice(0, 1000))}
        onComposerKeyDown={handleComposerKeyDown}
        onComposerModeChange={setComposerMode}
        onDietImage={handleDietImageEstimate}
        onCreateTrainingPlanFromMessage={handleCreateTrainingPlanFromChat}
        onEditTrainingPlanDraft={openTrainingPlanComposer}
        onConfirmHealthData={handleConfirmHealthData}
        confirmingHealthDataId={confirmingHealthDataId}
        onConfirmDietRecords={handleConfirmDietRecords}
        confirmingDietRecordsId={confirmingDietRecordsId}
        onOpenAddData={openAddDataModal}
        onOpenCapabilities={() => handleNavSelect("工具技能")}
        onOpenTrainingPlanComposer={() => openTrainingPlanComposer()}
        onRemoveAttachment={(index) =>
          setComposerAttachments((current) =>
            current.filter((_, itemIndex) => itemIndex !== index)
          )
        }
        onSendMessage={handleSendMessage}
        onStopAgent={handleStopAgent}
        onToggleThinking={() => setThinkingExpanded((current) => !current)}
        thinkingExpanded={thinkingExpanded}
        skills={skills}
        tools={tools}
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
              avatarUploading={avatarUploading}
              menuOpen={profileMenuOpen}
              onEditBodyData={openBodyMetricEditor}
              onLogin={() => openAuth("login")}
              onLogout={handleLogout}
              onMarkNotificationsRead={markAllNotificationsRead}
              onOpenOnboarding={() => setOnboardingOpen(true)}
              onAvatarChange={handleAvatarUpload}
              onProfileSubmit={handleProfileSubmit}
              onRegister={() => openAuth("register")}
              onOpenAchievements={() => setAchievementsOpen(true)}
              onToggleTheme={() => {
                const nextTheme = theme === "dark" ? "light" : "dark"
                setTheme(nextTheme)
                sonnerToast.success(`已切换到${nextTheme === "dark" ? "深色" : "浅色"}模式`)
              }}
              onToggleMenu={setProfileMenuOpen}
              notifications={notifications}
              onboardingStatus={onboardingStatus}
              profile={fitnessProfile}
              profileError={profileError}
              profileSubmitting={profileSubmitting}
              theme={theme}
              unreadCount={unreadCount}
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
          onToggleShareConversation={handleToggleShareConversation}
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
      <AddDataModal
        bodyForm={editingBodyMetric ? bodyMetricFormFromRecord(editingBodyMetric) : bodyMetricFormFromLatest(latestMetric)}
        dietForm={emptyDietIntakeForm()}
        error={bodyMetricError}
        healthForm={latestHealthMetric ? healthMetricFormFromLatest(latestHealthMetric) : emptyHealthMetricForm()}
        initialTab={addDataInitialTab}
        key={`${bodyMetricModalOpen ? "data-open" : "data-closed"}-${addDataInitialTab}-${editingBodyMetric?.id ?? "new"}-${latestMetric?.id ?? "no-body"}-${latestHealthMetric?.id ?? "no-health"}`}
        loading={bodyMetricSubmitting}
        onClose={() => {
          setBodyMetricModalOpen(false)
          setEditingBodyMetric(null)
        }}
        onSubmit={handleAddDataSubmit}
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
      <AchievementCenterDialog
        checkins={agentCheckins}
        bodyMetrics={bodyMetrics}
        onOpenChange={setAchievementsOpen}
        open={achievementsOpen}
        workoutLogs={workoutLogs}
      />
      <TrainingShareCardDialog
        card={trainingShareCard}
        onOpenChange={setTrainingShareCardOpen}
        open={trainingShareCardOpen}
      />
      <DietEstimateDialog
        estimate={dietEstimate}
        onOpenChange={setDietEstimateOpen}
        onSave={handleSaveDietEstimate}
        open={dietEstimateOpen}
        saving={dietSaving}
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

function inferWorkoutType(title: string, actions: string[]) {
  const text = [title, ...actions].filter(Boolean).join(" ")
  if (/(跑|running|run|慢跑|冲刺|间歇跑)/i.test(text)) return "running"
  if (/(快走|椭圆机|单车|游泳|有氧|cardio|hiit|tabata|跳绳|爬楼|划船机)/i.test(text)) return "cardio"
  if (/(瑜伽|yoga)/i.test(text)) return "yoga"
  if (/(拉伸|伸展|灵活|活动度|mobility|stretch|放松)/i.test(text)) return "mobility"
  return "strength"
}

export default KratosPage
