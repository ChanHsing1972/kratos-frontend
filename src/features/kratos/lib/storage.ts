import { clearInitialAuthSnapshot } from "@/entities/kratos/api/dashboard"
import type { UserProfile } from "@/entities/kratos/model/types"

const ACTIVE_AGENT_SESSION_KEY = "kratos-active-agent-session-id"
const GENERATED_TRAINING_PLAN_KEY = "kratos-generated-training-plan-keys"
const AUTH_USER_CACHE_KEY = "kratos-auth-user"

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
  clearInitialAuthSnapshot()
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
