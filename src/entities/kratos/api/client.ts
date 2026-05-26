import type {
  AgentCheckin,
  AgentCheckinPayload,
  AgentConversationSession,
  AgentRun,
  AgentStreamEvent,
  BodyMetric,
  BodyMetricPayload,
  FitnessContext,
  FitnessProfile,
  FitnessProfilePayload,
  Skill,
  SkillPayload,
  TokenResponse,
  TrainingPlanAdjustmentPayload,
  TrainingPlanAdjustmentResponse,
  TrainingPlan,
  TrainingPlanPayload,
  UserProfile,
  UserRegisterPayload,
  UserUpdatePayload,
  WorkoutLog,
  WorkoutLogPayload,
  AgentToolConfig,
} from "@/entities/kratos/model/types"

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1"
// import.meta.env.VITE_API_BASE_URL ?? "http://192.0.2.1/api/v1"


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

export async function deleteTrainingPlan(token: string, planId: number) {
  return authorizedJson<null>(`/plans/${planId}`, token, {
    method: "DELETE",
  })
}

export async function previewTrainingPlanAdjustment(
  token: string,
  planId: number,
  payload: TrainingPlanAdjustmentPayload
) {
  return authorizedJson<TrainingPlanAdjustmentResponse>(
    `/plans/${planId}/adjustment-preview`,
    token,
    {
      body: JSON.stringify(payload),
      method: "POST",
    }
  )
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

export async function updateBodyMetric(
  token: string,
  metricId: number,
  payload: BodyMetricPayload
) {
  return authorizedJson<BodyMetric>(`/body-metrics/${metricId}`, token, {
    body: JSON.stringify(payload),
    method: "PATCH",
  })
}

export async function deleteBodyMetric(token: string, metricId: number) {
  return authorizedJson<null>(`/body-metrics/${metricId}`, token, {
    method: "DELETE",
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

export async function updateWorkoutLog(
  token: string,
  logId: number,
  payload: Partial<WorkoutLogPayload>
) {
  return authorizedJson<WorkoutLog>(`/workout-logs/${logId}`, token, {
    body: JSON.stringify(payload),
    method: "PATCH",
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

export async function deleteAgentCheckin(token: string, checkinId: number) {
  return authorizedJson<null>(`/agent-checkins/${checkinId}`, token, {
    method: "DELETE",
  })
}

export async function updateAgentCheckin(
  token: string,
  checkinId: number,
  payload: AgentCheckinPayload
) {
  return authorizedJson<AgentCheckin>(`/agent-checkins/${checkinId}`, token, {
    body: JSON.stringify(payload),
    method: "PATCH",
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

export async function listAgentRunsForSession(
  token: string,
  sessionId: string,
  limit = 200
) {
  return authorizedJson<AgentRun[]>(
    `/agent/runs?session_id=${encodeURIComponent(sessionId)}&limit=${encodeURIComponent(limit)}`,
    token
  )
}

export async function listAgentSessions(
  token: string,
  params: {
    includeArchived?: boolean
    includeDeleted?: boolean
    limit?: number
  } = {}
) {
  const query = new URLSearchParams()
  if (params.includeArchived !== undefined) {
    query.set("include_archived", String(params.includeArchived))
  }
  if (params.includeDeleted !== undefined) {
    query.set("include_deleted", String(params.includeDeleted))
  }
  if (params.limit !== undefined) {
    query.set("limit", String(params.limit))
  }

  const path = query.toString() ? `/agent/sessions?${query.toString()}` : "/agent/sessions"
  return authorizedJson<AgentConversationSession[]>(path, token)
}

export async function getAgentSession(token: string, sessionId: string) {
  return authorizedJson<AgentConversationSession>(
    `/agent/sessions/${encodeURIComponent(sessionId)}`,
    token
  )
}

export async function createAgentSession(token: string) {
  return authorizedJson<AgentConversationSession>("/agent/sessions", token, {
    method: "POST",
  })
}

export async function renameAgentSession(
  token: string,
  sessionId: string,
  title: string
) {
  return authorizedJson<AgentConversationSession>(
    `/agent/sessions/${encodeURIComponent(sessionId)}/rename`,
    token,
    {
      body: JSON.stringify({ title }),
      method: "PATCH",
    }
  )
}

export async function pinAgentSession(
  token: string,
  sessionId: string,
  isPinned: boolean
) {
  return authorizedJson<AgentConversationSession>(
    `/agent/sessions/${encodeURIComponent(sessionId)}/pin`,
    token,
    {
      body: JSON.stringify({ is_pinned: isPinned }),
      method: "PATCH",
    }
  )
}

export async function archiveAgentSession(
  token: string,
  sessionId: string,
  isArchived: boolean
) {
  return authorizedJson<AgentConversationSession>(
    `/agent/sessions/${encodeURIComponent(sessionId)}/archive`,
    token,
    {
      body: JSON.stringify({ is_archived: isArchived }),
      method: "PATCH",
    }
  )
}

export async function updateAgentSession(
  token: string,
  sessionId: string,
  payload: Partial<{
    title: string
    summary: string | null
    is_pinned: boolean
    is_archived: boolean
    is_deleted: boolean
    is_shared: boolean
  }>
) {
  return authorizedJson<AgentConversationSession>(
    `/agent/sessions/${encodeURIComponent(sessionId)}`,
    token,
    {
      body: JSON.stringify(payload),
      method: "PATCH",
    }
  )
}

export async function deleteAgentSession(token: string, sessionId: string) {
  return authorizedJson<AgentConversationSession | null>(
    `/agent/sessions/${encodeURIComponent(sessionId)}`,
    token,
    {
      method: "DELETE",
    }
  )
}

export async function exportAgentRunRagas(token: string, runId: number) {
  return authorizedJson<unknown>(
    `/agent/runs/${encodeURIComponent(runId)}/export/ragas`,
    token
  )
}

export async function listSkills(token: string) {
  return authorizedJson<Skill[]>("/skills", token)
}

export async function createSkill(token: string, payload: SkillPayload) {
  return authorizedJson<Skill>("/skills", token, {
    body: JSON.stringify(payload),
    method: "POST",
  })
}

export async function updateSkillBinding(
  token: string,
  skillId: number,
  enabled: boolean
) {
  return authorizedJson<Skill>(`/skills/${skillId}/binding`, token, {
    body: JSON.stringify({ enabled }),
    method: "PATCH",
  })
}

export async function deleteSkill(token: string, skillId: number) {
  return authorizedJson<null>(`/skills/${skillId}`, token, {
    method: "DELETE",
  })
}

export async function listAgentTools(token: string) {
  return authorizedJson<AgentToolConfig[]>("/tools", token)
}

export async function updateAgentTool(
  token: string,
  toolName: string,
  enabled: boolean
) {
  return authorizedJson<AgentToolConfig>(
    `/tools/${encodeURIComponent(toolName)}`,
    token,
    {
      body: JSON.stringify({ enabled }),
      method: "PATCH",
    }
  )
}

export async function activateTrainingPlan(token: string, planId: number) {
  return authorizedJson<TrainingPlan>(`/plans/${planId}/activate`, token, {
    method: "POST",
  })
}

export async function streamAgentChat({
  clientTurnId,
  message,
  onEvent,
  sessionId,
  signal,
  token,
}: {
  clientTurnId: string
  message: string
  onEvent: (event: AgentStreamEvent) => void
  sessionId: string | null
  signal?: AbortSignal
  token: string
}) {
  const response = await fetch(`${API_BASE_URL}/agent/chat/stream`, {
    body: JSON.stringify({
      client_turn_id: clientTurnId,
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

export type ExerciseMediaResponse = {
  action_name: string
  exercise_id: string | null
  exercise_name: string | null
  image_url: string | null
  media_url: string | null
  query: string | null
  source: string
  video_url: string | null
}

export async function getExerciseMedia(actionName: string, token?: string | null) {
  const url = new URL(
    `${API_BASE_URL.replace(/\/$/, "")}/plans/media`,
    window.location.origin
  )
  url.searchParams.set("action_name", actionName)

  const response = await fetch(url.toString(), {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json() as Promise<ExerciseMediaResponse>
}
