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
  HealthMetric,
  HealthMetricPayload,
  HeartRateSample,
  HeartRateSamplePayload,
  HeartRateSummary,
  HyperateCurrentHeartRate,
  Skill,
  SkillPayload,
  TokenResponse,
  TrainingPlanAdjustmentPayload,
  TrainingPlanAdjustmentResponse,
  TrainingPlanGuidanceResponse,
  TrainingPlan,
  TrainingPlanPayload,
  UserProfile,
  UserRegisterPayload,
  UserUpdatePayload,
  WorkoutLog,
  WorkoutLogPayload,
  ChatAttachment,
  DietRecord,
  DietRecordPayload,
  FoodImageEstimateResponse,
  WorkoutShareCard,
  AgentToolConfig,
} from "@/entities/kratos/model/types"

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "/api/v1"
// import.meta.env.VITE_API_BASE_URL ?? "http://192.0.2.1/api/v1"


export const AUTH_TOKEN_KEY = "kratos-auth-token"

export type UploadResponse = {
  content_type: string
  filename: string
  size: number
  url: string
}

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

export async function uploadAttachment(token: string, file: File) {
  return uploadFile(token, "/uploads/attachments", file)
}

export async function uploadAvatar(token: string, file: File) {
  return uploadFile(token, "/uploads/avatar", file)
}

export async function estimateDietFromImage(token: string, file: File) {
  const formData = new FormData()
  formData.set("image", file)

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/diet/estimate-from-image`, {
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      method: "POST",
    })
  } catch {
    throw new Error(
      `饮食图片识别请求失败。当前接口：${API_BASE_URL}。请确认后端已允许本地开发源，且图片识别服务没有触发网关超时。`
    )
  }

  const payload = await response.json().catch(() => null as unknown)
  if (!response.ok) {
    throw new Error(extractApiError(payload) ?? `识别失败：${response.status}`)
  }

  return payload as FoodImageEstimateResponse
}

export async function createDietRecords(token: string, payload: DietRecordPayload) {
  return authorizedJson<DietRecord[]>("/diet/records", token, {
    body: JSON.stringify(payload),
    method: "POST",
  })
}

export async function listDietRecords(token: string, limit = 200) {
  return authorizedJson<DietRecord[]>(
    `/diet/records?limit=${encodeURIComponent(limit)}`,
    token
  )
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

export async function getTrainingPlanGuidance(token: string, planId: number) {
  return authorizedJson<TrainingPlanGuidanceResponse>(
    `/plans/${planId}/guidance`,
    token
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

export async function listHealthMetrics(token: string) {
  return authorizedJson<HealthMetric[]>("/health-metrics", token)
}

export async function createHealthMetric(token: string, payload: HealthMetricPayload) {
  return authorizedJson<HealthMetric>("/health-metrics", token, {
    body: JSON.stringify(payload),
    method: "POST",
  })
}

export async function updateHealthMetric(
  token: string,
  metricId: number,
  payload: HealthMetricPayload
) {
  return authorizedJson<HealthMetric>(`/health-metrics/${metricId}`, token, {
    body: JSON.stringify(payload),
    method: "PATCH",
  })
}

export async function deleteHealthMetric(token: string, metricId: number) {
  return authorizedJson<null>(`/health-metrics/${metricId}`, token, {
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

export async function getWorkoutShareCard(token: string, logId: number) {
  return authorizedJson<WorkoutShareCard>(`/workout-logs/${logId}/share-card`, token)
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

export async function getCurrentHyperateHeartRate(
  token: string,
  signal?: AbortSignal
) {
  return authorizedJson<HyperateCurrentHeartRate>(
    "/integrations/hyperate/current",
    token,
    { signal }
  )
}

export async function saveWorkoutHeartRateSample(
  token: string,
  workoutSessionId: number,
  payload: HeartRateSamplePayload,
  signal?: AbortSignal
) {
  return authorizedJson<HeartRateSample>(
    `/workout-sessions/${workoutSessionId}/heart-rate-samples`,
    token,
    {
      body: JSON.stringify(payload),
      method: "POST",
      signal,
    }
  )
}

export async function getWorkoutHeartRateSummary(
  token: string,
  workoutSessionId: number,
  signal?: AbortSignal
) {
  return authorizedJson<HeartRateSummary>(
    `/workout-sessions/${workoutSessionId}/heart-rate-summary`,
    token,
    { signal }
  )
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
  attachments = [],
  clientTurnId,
  message,
  onEvent,
  sessionId,
  signal,
  token,
}: {
  attachments?: ChatAttachment[]
  clientTurnId: string
  message: string
  onEvent: (event: AgentStreamEvent) => void
  sessionId: string | null
  signal?: AbortSignal
  token: string
}) {
  const response = await fetch(`${API_BASE_URL}/agent/chat/stream`, {
    body: JSON.stringify({
      attachments,
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
  let receivedDone = false

  const emitEvent = (event: AgentStreamEvent) => {
    if (event.type === "done") {
      receivedDone = true
    }
    onEvent(event)
  }

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
        emitEvent(event)
      }
    }
  }

  buffer += decoder.decode()
  const event = parseServerSentEvent(buffer)
  if (event) {
    emitEvent(event)
  }

  if (!receivedDone) {
    const interrupted: AgentStreamEvent = {
      type: "error",
      content: "Agent 连接已中断，未收到完成事件。请检查网络或稍后重试。",
    }
    emitEvent(interrupted)
    throw new Error(interrupted.content)
  }
}

export async function cancelAgentChatStream(token: string, clientTurnId: string) {
  return authorizedJson<{ cancelled: boolean }>(
    `/agent/chat/stream/${encodeURIComponent(clientTurnId)}/cancel`,
    token,
    {
      method: "POST",
    }
  )
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

  try {
    return JSON.parse(data) as AgentStreamEvent
  } catch {
    return {
      type: "error",
      content: "收到无法解析的 Agent 事件，连接可能已被代理截断。",
      raw: { parse_error: true },
    }
  }
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
  teaching_videos?: Array<{
    author?: string | null
    confidence?: number | null
    duration_seconds?: number | null
    embed_url?: string | null
    external_id?: string | null
    search_query?: string | null
    source: string
    status?: string | null
    thumbnail_url?: string | null
    title: string
    url: string
  }>
  video_url: string | null
}

export async function getExerciseMedia(actionName: string, token?: string | null) {
  const url = new URL(apiUrl("/plans/media"), window.location.origin)
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

export function absoluteApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const apiRoot = API_BASE_URL.replace(/\/api\/v1\/?$/, "")
  return `${apiRoot}${path.startsWith("/") ? path : `/${path}`}`
}

function apiUrl(path: string) {
  const base = API_BASE_URL.replace(/\/$/, "")
  const nextPath = path.startsWith("/") ? path : `/${path}`
  return `${base}${nextPath}`
}

export function proxiedBilibiliImageUrl(url: string | null | undefined) {
  if (!url) {
    return null
  }

  const normalized = url.startsWith("//") ? `https:${url}` : url
  try {
    const host = new URL(normalized).hostname.toLowerCase()
    if (!host.endsWith("hdslb.com") && !host.endsWith("biliimg.com")) {
      return normalized
    }
  } catch {
    return normalized
  }

  const proxyUrl = new URL(apiUrl("/plans/media/proxy-image"), window.location.origin)
  proxyUrl.searchParams.set("url", normalized)
  return proxyUrl.toString()
}

async function uploadFile(token: string, path: string, file: File) {
  const formData = new FormData()
  formData.set("file", file)

  const response = await fetch(`${API_BASE_URL}${path}`, {
    body: formData,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    method: "POST",
  })

  const payload = await response.json().catch(() => null as unknown)
  if (!response.ok) {
    throw new Error(extractApiError(payload) ?? `上传失败：${response.status}`)
  }

  return payload as UploadResponse
}
