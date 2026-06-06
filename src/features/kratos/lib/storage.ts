import { clearInitialAuthSnapshot } from "@/entities/kratos/api/dashboard"
import type {
  AgentCheckin,
  AgentToolConfig,
  BodyMetric,
  ChatMessage,
  ChatSession,
  DietRecord,
  FitnessContext,
  FitnessProfile,
  HealthMetric,
  NotificationItem,
  Skill,
  TrainingPlan,
  UserProfile,
  WorkoutLog,
} from "@/entities/kratos/model/types"

const ACTIVE_AGENT_SESSION_KEY = "kratos-active-agent-session-id"
const GENERATED_TRAINING_PLAN_KEY = "kratos-generated-training-plan-keys"
const AUTH_USER_CACHE_KEY = "kratos-auth-user"
const WORKSPACE_CACHE_KEY = "kratos-workspace-cache-v1"

export type KratosWorkspaceSnapshot = {
  activeNav: string
  activeSessionId: string | null
  agentCheckins: AgentCheckin[]
  bodyMetrics: BodyMetric[]
  chatSessions: ChatSession[]
  composerValue: string
  dietRecords: DietRecord[]
  fitnessContext: FitnessContext | null
  fitnessProfile: FitnessProfile | null
  healthMetrics: HealthMetric[]
  messages: ChatMessage[]
  notifications: NotificationItem[]
  skills: Skill[]
  timestamp: number
  tools: AgentToolConfig[]
  trainingPlans: TrainingPlan[]
  user: UserProfile | null
  workoutLogs: WorkoutLog[]
}

export function readActiveAgentSessionId(): string | null {
  try {
    const value = localStorage.getItem(ACTIVE_AGENT_SESSION_KEY)
    return value && value.trim() ? value : null
  } catch {
    return null
  }
}

export function writeActiveAgentSessionId(sessionId: string | null) {
  if (!sessionId) {
    localStorage.removeItem(ACTIVE_AGENT_SESSION_KEY)
    return
  }

  localStorage.setItem(ACTIVE_AGENT_SESSION_KEY, sessionId)
}

export function readCachedUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_CACHE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as unknown
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("id" in parsed) ||
      !("username" in parsed) ||
      !("created_at" in parsed)
    ) {
      return null
    }

    const user = parsed as Partial<UserProfile>
    return typeof user.id === "number" &&
      typeof user.username === "string" &&
      typeof user.created_at === "string"
      ? {
          created_at: user.created_at,
          avatar_url: typeof user.avatar_url === "string" ? user.avatar_url : null,
          id: user.id,
          username: user.username,
        }
      : null
  } catch {
    return null
  }
}

export function writeCachedUser(user: UserProfile) {
  localStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify(user))
}

export function clearCachedUser() {
  localStorage.removeItem(AUTH_USER_CACHE_KEY)
  localStorage.removeItem(WORKSPACE_CACHE_KEY)
  clearInitialAuthSnapshot()
}

export function readWorkspaceSnapshot(): KratosWorkspaceSnapshot | null {
  try {
    const raw = localStorage.getItem(WORKSPACE_CACHE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as Partial<KratosWorkspaceSnapshot>
    if (!parsed || typeof parsed !== "object") {
      return null
    }

    return {
      activeNav: typeof parsed.activeNav === "string" ? parsed.activeNav : "new",
      activeSessionId:
        typeof parsed.activeSessionId === "string" ? parsed.activeSessionId : null,
      agentCheckins: Array.isArray(parsed.agentCheckins) ? parsed.agentCheckins : [],
      bodyMetrics: Array.isArray(parsed.bodyMetrics) ? parsed.bodyMetrics : [],
      chatSessions: Array.isArray(parsed.chatSessions) ? parsed.chatSessions : [],
      composerValue:
        typeof parsed.composerValue === "string" ? parsed.composerValue : "",
      dietRecords: Array.isArray(parsed.dietRecords) ? parsed.dietRecords : [],
      fitnessContext: parsed.fitnessContext ?? null,
      fitnessProfile: parsed.fitnessProfile ?? null,
      healthMetrics: Array.isArray(parsed.healthMetrics) ? parsed.healthMetrics : [],
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      timestamp: typeof parsed.timestamp === "number" ? parsed.timestamp : 0,
      tools: Array.isArray(parsed.tools) ? parsed.tools : [],
      trainingPlans: Array.isArray(parsed.trainingPlans) ? parsed.trainingPlans : [],
      user: parsed.user ?? null,
      workoutLogs: Array.isArray(parsed.workoutLogs) ? parsed.workoutLogs : [],
    }
  } catch {
    return null
  }
}

export function writeWorkspaceSnapshot(snapshot: KratosWorkspaceSnapshot) {
  try {
    localStorage.setItem(
      WORKSPACE_CACHE_KEY,
      JSON.stringify({
        ...snapshot,
        messages: snapshot.messages.map((message) => ({
          ...message,
          attachments: message.attachments?.map(({ data_url, ...attachment }) => attachment),
        })),
      })
    )
  } catch {
    // localStorage can be full or disabled; the app can still run without a snapshot.
  }
}

export function readGeneratedTrainingPlanKeys() {
  try {
    const raw = localStorage.getItem(GENERATED_TRAINING_PLAN_KEY)
    if (!raw) {
      return new Set<string>()
    }

    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed)
      ? new Set(
          parsed.filter((item): item is string => typeof item === "string")
        )
      : new Set<string>()
  } catch {
    return new Set<string>()
  }
}

export function writeGeneratedTrainingPlanKeys(keys: Set<string>) {
  localStorage.setItem(GENERATED_TRAINING_PLAN_KEY, JSON.stringify([...keys]))
}
