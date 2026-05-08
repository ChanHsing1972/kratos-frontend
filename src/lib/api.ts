import type {
  AgentCheckin,
  AgentCheckinPayload,
  AgentRun,
  AgentStreamEvent,
  BodyMetric,
  BodyMetricPayload,
  FitnessContext,
  FitnessProfile,
  FitnessProfilePayload,
  TokenResponse,
  TrainingPlan,
  TrainingPlanPayload,
  UserProfile,
  UserRegisterPayload,
  UserUpdatePayload,
  WorkoutLog,
  WorkoutLogPayload,
} from "@/types/kratos"

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1"
export const AUTH_TOKEN_KEY = "kratos-auth-token"

export async function registerUser(payload: UserRegisterPayload) {
  return requestJson<UserProfile>("/auth/register", {
    body: JSON.stringify(payload),
    method: "POST",
  })
}

export async function loginUser(username: string, password: string) {
  return requestJson<TokenResponse>("/auth/login", {
    body: JSON.stringify({ username, password }),
    method: "POST",
  })
}

export async function getCurrentUser(token: string) {
  return requestJson<UserProfile>("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function updateCurrentUser(token: string, payload: UserUpdatePayload) {
  return requestJson<UserProfile>("/auth/me", {
    body: JSON.stringify(payload),
    headers: {
      Authorization: `Bearer ${token}`,
    },
    method: "PUT",
  })
}

export async function listTrainingPlans(token: string) {
  return authorizedJson<TrainingPlan[]>("/plans", token)
}

export async function createTrainingPlan(
  token: string,
  payload: TrainingPlanPayload
) {
  return authorizedJson<TrainingPlan>("/plans", token, {
    body: JSON.stringify(payload),
    method: "POST",
  })
}

export async function updateTrainingPlan(
  token: string,
  planId: number,
  payload: Partial<TrainingPlanPayload>
) {
  return authorizedJson<TrainingPlan>(`/plans/${planId}`, token, {
    body: JSON.stringify(payload),
    method: "PATCH",
  })
}

export async function listBodyMetrics(token: string) {
  return authorizedJson<BodyMetric[]>("/body-metrics", token)
}

export async function createBodyMetric(token: string, payload: BodyMetricPayload) {
  return authorizedJson<BodyMetric>("/body-metrics", token, {
    body: JSON.stringify(payload),
    method: "POST",
  })
}

export async function listWorkoutLogs(token: string) {
  return authorizedJson<WorkoutLog[]>("/workout-logs", token)
}

export async function createWorkoutLog(token: string, payload: WorkoutLogPayload) {
  return authorizedJson<WorkoutLog>("/workout-logs", token, {
    body: JSON.stringify(payload),
    method: "POST",
  })
}

export async function listAgentCheckins(token: string) {
  return authorizedJson<AgentCheckin[]>("/agent-checkins", token)
}

export async function createAgentCheckin(
  token: string,
  payload: AgentCheckinPayload
) {
  return authorizedJson<AgentCheckin>("/agent-checkins", token, {
    body: JSON.stringify(payload),
    method: "POST",
  })
}

export async function getMyFitnessProfile(token: string) {
  return authorizedJson<FitnessProfile>("/profile/me", token)
}

export async function getFitnessContext(token: string) {
  return authorizedJson<FitnessContext>("/profile/context", token)
}

export async function createMyFitnessProfile(
  token: string,
  payload: FitnessProfilePayload
) {
  return authorizedJson<FitnessProfile>("/profile/me", token, {
    body: JSON.stringify(payload),
    method: "POST",
  })
}

export async function updateMyFitnessProfile(
  token: string,
  payload: FitnessProfilePayload
) {
  return authorizedJson<FitnessProfile>("/profile/me", token, {
    body: JSON.stringify(payload),
    method: "PATCH",
  })
}

export async function listAgentRuns(token: string, limit = 50) {
  return authorizedJson<AgentRun[]>(
    `/agent/runs?limit=${encodeURIComponent(limit)}`,
    token
  )
}

export async function streamAgentChat({
  message,
  onEvent,
  sessionId,
  signal,
  token,
}: {
  message: string
  onEvent: (event: AgentStreamEvent) => void
  sessionId: string | null
  signal?: AbortSignal
  token: string
}) {
  const response = await fetch(`${API_BASE_URL}/agent/chat/stream`, {
    body: JSON.stringify({
      message,
      session_id: sessionId,
    }),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    method: "POST",
    signal,
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null as unknown)
    throw new Error(extractApiError(payload) ?? `请求失败：${response.status}`)
  }

  if (!response.body) {
    throw new Error("当前浏览器不支持流式响应")
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split(/\r?\n\r?\n/)
    buffer = parts.pop() ?? ""

    for (const part of parts) {
      const event = parseServerSentEvent(part)
      if (event) {
        onEvent(event)
      }
    }
  }

  buffer += decoder.decode()
  const event = parseServerSentEvent(buffer)
  if (event) {
    onEvent(event)
  }
}

async function authorizedJson<T>(
  path: string,
  token: string,
  options: RequestInit = {}
) {
  const headers = new Headers(options.headers)
  headers.set("Authorization", `Bearer ${token}`)

  return requestJson<T>(path, {
    ...options,
    headers,
  })
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

  const payload = await response.json().catch(() => null as unknown)

  if (!response.ok) {
    throw new Error(extractApiError(payload) ?? `请求失败：${response.status}`)
  }

  return payload as T
}

function parseServerSentEvent(chunk: string): AgentStreamEvent | null {
  const data = chunk
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n")

  if (!data) {
    return null
  }

  return JSON.parse(data) as AgentStreamEvent
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

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return "请求失败，请稍后再试"
}
