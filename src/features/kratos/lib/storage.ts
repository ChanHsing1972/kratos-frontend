import { clearInitialAuthSnapshot } from "@/entities/kratos/api/dashboard"
import type { ChatSession, UserProfile } from "@/entities/kratos/model/types"

const CHAT_SESSION_META_KEY = "kratos-chat-session-meta"
const GENERATED_TRAINING_PLAN_KEY = "kratos-generated-training-plan-keys"
const AUTH_USER_CACHE_KEY = "kratos-auth-user"

export function readChatSessionMeta(): Record<string, Partial<ChatSession>> {
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

export function writeChatSessionMeta(
  metadata: Record<string, Partial<ChatSession>>
) {
  localStorage.setItem(CHAT_SESSION_META_KEY, JSON.stringify(metadata))
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
