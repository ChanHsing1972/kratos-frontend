import type {
  AgentCheckin,
  AgentConversationSession,
  AgentRun,
  AgentRunTraceStep,
  AgentTraceStep,
  ChatAttachment,
  ChatSession,
  BodyMetric,
  ChatMessage,
  DetailPanel,
  FitnessProfile,
  FoodImageEstimateResult,
  OnboardingStatus,
  ProfileForm,
  SuggestedHealthData,
  TrainingPlan,
  TrainingPlanPayload,
  TrainingPlanTemplate,
  UserProfile,
  WorkoutLog,
} from "@/entities/kratos/model/types"

export function buildProfilePanel(
  user: UserProfile | null,
  profile: FitnessProfile | null,
  metric: BodyMetric | null,
  onboarding: OnboardingStatus | null,
  completedExercises: string[]
): DetailPanel {
  if (!user) {
    return {
      title: "未登录",
      body: "登录后可以查看个人资料、经验值和后端同步状态。",
    }
  }

  return {
    title: "用户上下文",
    body: `${user.username} 的 Agent 上下文来自 /profile/context：账号、个人信息、身体数据已分离读取。`,
    items: [
      `用户 ID：${user.id}`,
      `性别：${profile?.gender ?? "未设置"}`,
      `年龄：${profile?.age ?? "未设置"}`,
      `地区：${profile?.location ?? "未设置"}`,
      `目标：${profile?.fitness_goal ?? "未设置"}`,
      `体重：${metric?.weight_kg ? `${metric.weight_kg} kg` : "未记录"}`,
      `档案状态：${onboarding?.ready_for_agent ? "可直接使用 Agent" : "需要继续完善"}`,
      `今日已完成动作：${completedExercises.length}/2`,
    ],
  }
}

export function buildDashboardPanel({
  checkin,
  metric,
  logs,
  onboarding,
}: {
  checkin: AgentCheckin | null
  metric: BodyMetric | null
  logs: WorkoutLog[]
  onboarding: OnboardingStatus | null
}): DetailPanel {
  const sleep = checkin?.sleep_quality ?? metric?.sleep_hours ?? null

  return {
    title: "身体与训练状态",
    body:
      "身体指标只来自 body_metrics；个人目标与偏好只来自 user_profiles；训练记录和打卡分别来自 workout_logs 与 agent_checkins。",
    items: [
      metric?.height_cm ? `身高：${metric.height_cm} cm` : "身高：未记录",
      metric?.weight_kg ? `体重：${metric.weight_kg} kg` : "体重：未记录",
      metric?.body_fat_percentage
        ? `体脂率：${metric.body_fat_percentage}%`
        : "体脂率：未记录",
      metric?.bmi ? `BMI：${metric.bmi}` : "BMI：未记录",
      `训练记录：${logs.length} 条`,
      sleep ? `睡眠：${sleep}${checkin?.sleep_quality ? "/10" : " 小时"}` : "睡眠：未记录",
      onboarding?.next_steps?.[0] ?? "上下文已可用于 Agent 回答",
      checkin?.summary
        ? `最近打卡：${checkin.summary}`
        : "最近打卡：暂无 Agent 打卡",
    ],
  }
}

export function buildPlanPanel(plan: TrainingPlan | null): DetailPanel {
  if (!plan) {
    return {
      title: "完整训练计划",
      body: "登录后 Kratos 会自动为您创建一份可同步的智能训练计划。",
    }
  }

  return {
    title: plan.title,
    body: plan.summary ?? "这份训练计划已从后端同步。",
    items: [
      `目标：${plan.goal ?? "未设置"}`,
      `状态：${plan.status}`,
      plan.weekly_schedule ?? "周计划：暂未填写",
      plan.nutrition_guidance ?? "营养建议：暂未填写",
      plan.recovery_guidance ?? "恢复建议：暂未填写",
    ],
  }
}

export function buildReminderPanel(plan: TrainingPlan | null): DetailPanel {
  return {
    title: "Kratos 提醒",
    body:
      plan?.recovery_guidance ??
      "右膝恢复期建议选择髋主导动作，避免大量深蹲、弓步跳、箱跳等高冲击训练。",
    items: [
      "训练中疼痛超过 3/10 时停止",
      "热身时重点激活臀部和髋关节",
      "训练后观察 24 小时反馈",
    ],
  }
}

export function buildDefaultTrainingPlan() {
  return {
    title: "酒店护膝下肢训练",
    goal: "低冲击力量恢复",
    status: "active",
    start_date: toDateInputValue(new Date()),
    summary:
      "20 分钟酒店可完成计划：先做髋关节与臀部热身，再完成两个髋主导力量动作，控制膝关节压力。",
    weekly_schedule:
      "哑铃罗马尼亚硬拉 4 组 × 12 次\n哑铃臀桥 4 组 × 15 次\n训练后轻度拉伸 2 分钟",
    nutrition_guidance: "训练后 2 小时内补充 25-35g 蛋白质，并保持足量饮水。",
    recovery_guidance:
      "右膝不适时避免跳跃、深蹲和快速变向；疼痛超过 3/10 时停止训练。",
  }
}

export const trainingPlanTemplates: TrainingPlanTemplate[] = [
  {
    id: "fat-loss-base",
    title: "4 周减脂基础计划",
    goal: "减脂与心肺基础",
    status: "active",
    start_date: toDateInputValue(new Date()),
    summary:
      "适合刚开始恢复规律训练的人群。每周 4 次训练，力量训练维持肌肉量，低冲击有氧提升消耗和恢复能力。",
    weekly_schedule:
      "周一|全身力量 A：深蹲模式 3 组 x 10 次；俯卧撑 3 组 x 8-12 次；平板支撑 3 组 x 30 秒\n周二|低冲击有氧：快走或椭圆机 35 分钟，保持可对话强度\n周四|全身力量 B：罗马尼亚硬拉 3 组 x 10 次；哑铃划船 3 组 x 12 次；死虫 3 组 x 10 次\n周六|循环训练：壶铃硬拉、台阶上步、弹力带划船、登山者各 40 秒，完成 4 轮\n周日|恢复：拉伸 15 分钟，记录体重、睡眠和疲劳",
    nutrition_guidance:
      "优先保证每餐蛋白质，训练日前后安排适量碳水。避免用极低热量换短期体重下降。",
    recovery_guidance:
      "有氧强度以能完整说话为准。膝、踝或腰部不适时减少跳跃和跑步，改为快走或椭圆机。",
    duration: "4 周",
    frequency: "4 天/周",
    level: "新手友好",
  },
  {
    id: "muscle-gain-split",
    title: "8 周增肌分化计划",
    goal: "肌肉增长与基础力量",
    status: "active",
    start_date: toDateInputValue(new Date()),
    summary:
      "适合有基础器械经验的人群。采用推、拉、腿、全身辅助的周节奏，兼顾复合动作进步和肌肥大训练量。",
    weekly_schedule:
      "周一|上肢推：卧推 4 组 x 6-8 次；哑铃肩推 3 组 x 8-10 次；绳索下压 3 组 x 12 次\n周二|上肢拉：引体向上或高位下拉 4 组 x 8 次；杠铃划船 4 组 x 8 次；哑铃弯举 3 组 x 12 次\n周三|休息：步行 20-30 分钟，肩颈和髋部活动度\n周四|下肢：深蹲 4 组 x 6-8 次；罗马尼亚硬拉 3 组 x 8-10 次；腿弯举 3 组 x 12 次\n周六|全身辅助：上斜卧推 3 组 x 10 次；坐姿划船 3 组 x 10 次；臀桥 3 组 x 12 次；核心 8 分钟",
    nutrition_guidance:
      "训练日增加优质碳水，蛋白质分配到 3-4 餐。体重连续两周不变时小幅增加总热量。",
    recovery_guidance:
      "大重量训练日之间至少间隔 48 小时。动作质量下降明显时保留 1-2 次余力。",
    duration: "8 周",
    frequency: "4-5 天/周",
    level: "中级",
  },
  {
    id: "home-dumbbell",
    title: "居家哑铃塑形计划",
    goal: "居家塑形与体态改善",
    status: "active",
    start_date: toDateInputValue(new Date()),
    summary:
      "适合只有哑铃、弹力带和瑜伽垫的训练场景。训练时间控制在 35-45 分钟，重点提升臀腿、背部和核心稳定。",
    weekly_schedule:
      "周一|臀腿核心：哑铃杯式深蹲 4 组 x 12 次；哑铃臀桥 4 组 x 15 次；侧桥 3 组 x 30 秒\n周三|背肩体态：单臂哑铃划船 4 组 x 12 次；弹力带面拉 3 组 x 15 次；俯身飞鸟 3 组 x 12 次\n周五|全身循环：哑铃硬拉、地板卧推、反向箭步蹲、死虫各 45 秒，完成 4 轮\n周六|低强度有氧：快走 30 分钟，结束后做髋屈肌和胸椎拉伸",
    nutrition_guidance:
      "每次训练后 2 小时内安排蛋白质和水分。晚餐避免过度节食，保证第二天恢复。",
    recovery_guidance:
      "居家训练先保证动作幅度和控制速度。膝盖不适时把箭步蹲替换为臀桥或髋铰链动作。",
    duration: "6 周",
    frequency: "3-4 天/周",
    level: "新手到中级",
  },
]

export function getLatestByDate<T>(
  items: T[],
  getValue: (item: T) => string | null | undefined
) {
  return [...items].sort(
    (left, right) =>
      new Date(getValue(right) ?? 0).getTime() -
      new Date(getValue(left) ?? 0).getTime()
  )[0]
}

export function getPlanExerciseLines(plan: TrainingPlan | null) {
  return (
    plan?.weekly_schedule
      ?.split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 6) ?? []
  )
}

export function chatMessagesFromAgentRuns(runs: AgentRun[]): ChatMessage[] {
  return [...runs]
    .sort(
      (left, right) =>
        new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
    )
    .flatMap((run) => {
      const orderedTraceSteps = [...run.trace_steps].sort(
        (left, right) => left.position - right.position
      )
      const trace = orderedTraceSteps.map(traceStepFromRun)
      const running = run.status === "running"
      const traceTimes = orderedTraceSteps
        .map((step) => new Date(step.created_at).getTime())
        .filter((value) => Number.isFinite(value))
      const runCreatedAt = new Date(run.created_at).getTime()
      const fallbackStartedAt = Number.isFinite(runCreatedAt)
        ? runCreatedAt
        : traceTimes[0]
      const startedAt = fallbackStartedAt
      const resultCompletedAt = agentRunResultUpdatedAt(run.result_payload)
      const completedAt =
        resultCompletedAt ??
        traceTimes[traceTimes.length - 1] ??
        fallbackStartedAt

      return [
        {
          id: `run-${run.id}-user`,
          author: "user" as const,
          attachments: attachmentsFromAgentResult(run.result_payload),
          body: stripStoredAttachmentBlock(run.user_message),
          time: formatStoredTime(run.created_at),
        },
        {
          id: `run-${run.id}-assistant`,
          author: "assistant" as const,
          body: run.answer,
          completedAt: running ? undefined : completedAt,
          startedAt,
          structuredCardPending: running && structuredCardPendingFromTrace(run.trace_steps),
          suggestedDietRecords: foodImageEstimateFromAgentResult(run.result_payload),
          suggestedTrainingPlan: trainingPlanPayloadFromAgentResult(run.result_payload),
          suggestedHealthData:
            pendingHealthDataFromAgentResult(run.result_payload) ??
            pendingHealthDataFromTrace(run.trace_steps),
          streaming: running,
          time: formatStoredTime(run.created_at),
          trace,
        },
      ]
    })
}

function attachmentsFromAgentResult(resultPayload: unknown): ChatAttachment[] {
  const result = asRecord(resultPayload)
  const attachments = Array.isArray(result?.user_attachments)
    ? result.user_attachments
    : []

  return attachments
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map((item) => ({
      content_type: textValue(item.content_type) ?? "application/octet-stream",
      filename: textValue(item.filename) ?? "附件",
      size: numberValue(item.size) ?? 0,
      url: textValue(item.url) ?? "",
    }))
    .filter((item) => item.url)
}

function stripStoredAttachmentBlock(message: string) {
  return message
    .replace(/\n{0,2}附件：\n(?:- .+(?:\n|$))+$/u, "")
    .trim()
}

function structuredCardPendingFromTrace(traceSteps: AgentRunTraceStep[]) {
  return traceSteps.some((step) => {
    const raw = asRecord(step.raw)
    return raw?.structured_card_pending === true
  })
}

function agentRunResultUpdatedAt(resultPayload: unknown) {
  const result = asRecord(resultPayload)
  const value = textValue(result?.last_updated_at)
  if (!value) {
    return null
  }
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : null
}

export function trainingPlanPayloadFromAgentResult(
  raw: unknown,
  _answerText = ""
): TrainingPlanPayload | undefined {
  void _answerText
  const result = asRecord(raw)
  const artifacts = asRecord(result?.structured_artifacts)
  const draft =
    asRecord(artifacts?.training_plan_draft) ??
    asRecord(result?.training_plan_draft)
  if (!draft) {
    return undefined
  }

  const title = textValue(draft.title)
  const planKind = textValue(draft.plan_kind)
  const scheduleJson = asRecord(draft.schedule_json)
  const weeklySchedule = textValue(draft.weekly_schedule)
  if (
    !title ||
    (planKind !== "daily" && planKind !== "program") ||
    !scheduleJson ||
    !Array.isArray(scheduleJson.weeks) ||
    !weeklySchedule
  ) {
    return undefined
  }

  return {
    end_date: textValue(draft.end_date),
    goal: textValue(draft.goal),
    duration_weeks: numberValue(draft.duration_weeks),
    nutrition_guidance: textValue(draft.nutrition_guidance),
    plan_kind: planKind,
    schedule_json: scheduleJson as TrainingPlanPayload["schedule_json"],
    recovery_guidance: textValue(draft.recovery_guidance),
    start_date: textValue(draft.start_date),
    status: textValue(draft.status) ?? "draft",
    summary: textValue(draft.summary),
    title,
    weekly_schedule: weeklySchedule,
  }
}

export function foodImageEstimateFromAgentResult(
  raw: unknown
): FoodImageEstimateResult | undefined {
  const result = asRecord(raw)
  const artifacts = asRecord(result?.structured_artifacts)
  const estimate =
    asRecord(artifacts?.food_image_estimate) ??
    asRecord(result?.food_image_estimate)
  if (!estimate) {
    return undefined
  }

  const items = asRecordArray(estimate.items)
    .map((item) => ({
      assumptions: stringArray(item.assumptions),
      carbs_g: numberValue(item.carbs_g) ?? 0,
      confidence: clampNumber(numberValue(item.confidence) ?? 0, 0, 1),
      estimated_kcal: numberValue(item.estimated_kcal) ?? 0,
      estimated_weight_g: numberValue(item.estimated_weight_g) ?? 0,
      fat_g: numberValue(item.fat_g) ?? 0,
      max_kcal: numberValue(item.max_kcal) ?? numberValue(item.estimated_kcal) ?? 0,
      min_kcal: numberValue(item.min_kcal) ?? numberValue(item.estimated_kcal) ?? 0,
      name: textValue(item.name) ?? "未知食物",
      protein_g: numberValue(item.protein_g) ?? 0,
      source: textValue(item.source) ?? "ai_estimated",
    }))
    .filter((item) => item.name && item.estimated_kcal > 0)

  if (!items.length) {
    return undefined
  }

  const total = asRecord(estimate.total)
  return {
    items,
    need_user_confirmation: true,
    total: {
      carbs_g: numberValue(total?.carbs_g) ?? roundOne(items.reduce((sum, item) => sum + item.carbs_g, 0)),
      estimated_kcal:
        numberValue(total?.estimated_kcal) ??
        roundOne(items.reduce((sum, item) => sum + item.estimated_kcal, 0)),
      fat_g: numberValue(total?.fat_g) ?? roundOne(items.reduce((sum, item) => sum + item.fat_g, 0)),
      max_kcal:
        numberValue(total?.max_kcal) ??
        roundOne(items.reduce((sum, item) => sum + item.max_kcal, 0)),
      min_kcal:
        numberValue(total?.min_kcal) ??
        roundOne(items.reduce((sum, item) => sum + item.min_kcal, 0)),
      protein_g:
        numberValue(total?.protein_g) ??
        roundOne(items.reduce((sum, item) => sum + item.protein_g, 0)),
    },
    warning:
      textValue(estimate.warning) ??
      "该结果为 AI 估算，可能受到拍摄角度、食物遮挡、油量、酱料和份量判断误差影响。",
  }
}

export function pendingHealthDataFromAgentResult(
  raw: unknown
): SuggestedHealthData | undefined {
  const result = asRecord(raw)
  const artifacts = asRecord(result?.structured_artifacts)
  const pending =
    asRecord(artifacts?.pending_health_data) ??
    asRecord(result?.pending_health_data)
  return pending ? (pending as SuggestedHealthData) : undefined
}

function pendingHealthDataFromTrace(traceSteps: AgentRunTraceStep[]) {
  for (const step of traceSteps) {
    const raw = asRecord(step.raw)
    const pending = asRecord(raw?.pending_health_data)
    if (pending) {
      return pending
    }
  }
  return undefined
}

export function chatSessionsFromAgentRuns(
  runs: AgentRun[],
  metadata: Record<string, Partial<ChatSession>> = {}
): ChatSession[] {
  const grouped = new Map<string, AgentRun[]>()

  for (const run of runs) {
    grouped.set(run.session_id, [...(grouped.get(run.session_id) ?? []), run])
  }

  return [...grouped.entries()]
    .map(([sessionId, sessionRuns]) => {
      const ordered = [...sessionRuns].sort(
        (left, right) =>
          new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
      )
      const latest = ordered[ordered.length - 1]
      const meta = metadata[sessionId] ?? {}
      const firstQuestion = ordered[0]?.user_message ?? "新会话"
      const title = meta.title ?? titleFromPrompt(firstQuestion)

      return {
        id: sessionId,
        title,
        preview: latest?.answer || latest?.user_message || "暂无消息",
        updatedAt: latest?.created_at ?? new Date().toISOString(),
        messageCount: ordered.length * 2,
        pinned: Boolean(meta.pinned),
        deleted: Boolean(meta.deleted),
      }
    })
    .filter((session) => !session.deleted)
    .sort((left, right) => {
      if (left.pinned !== right.pinned) {
        return left.pinned ? -1 : 1
      }

      return (
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
      )
    })
}

export function chatSessionFromAgentSession(
  session: AgentConversationSession
): ChatSession {
  if (!session) {
    throw new Error("会话数据为空，请刷新后重试")
  }

  return {
    archived: session.is_archived,
    createdAt: session.created_at,
    deleted: session.is_deleted,
    id: session.session_id,
    lastMessage: session.last_message,
    lastRunAt: session.last_run_at,
    messageCount: session.run_count * 2,
    pinned: session.is_pinned,
    preview: session.last_message ?? session.summary ?? "暂无消息",
    shared: session.is_shared,
    summary: session.summary,
    title: session.title,
    updatedAt: session.updated_at,
  }
}

export function chatSessionsFromAgentSessions(
  sessions: Array<AgentConversationSession | null | undefined> | null | undefined
): ChatSession[] {
  return (sessions ?? [])
    .filter((session): session is AgentConversationSession => Boolean(session))
    .map(chatSessionFromAgentSession)
}

export function titleFromPrompt(prompt: string) {
  const compacted = prompt
    .replace(/[#>*_`~(){}]/g, "")
    .replace(/\[/g, "")
    .replace(/\]/g, "")
    .replace(/\s+/g, " ")
    .trim()
  if (!compacted) {
    return "新会话"
  }

  const keywordTitles = [
    ["训练计划", "训练计划制定"],
    ["今日训练", "今日训练安排"],
    ["一周训练", "一周训练规划"],
    ["饮食建议", "饮食建议方案"],
    ["恢复建议", "恢复调整建议"],
    ["风险评估", "训练风险评估"],
    ["身体数据", "身体数据分析"],
    ["减脂", "减脂训练方案"],
    ["增肌", "增肌训练方案"],
    ["跑步路线", "跑步路线规划"],
    ["动作纠正", "动作纠正建议"],
  ] as const
  const matched = keywordTitles.find(([keyword]) => compacted.includes(keyword))
  if (matched) {
    return matched[1]
  }

  const chineseOnly = compacted.replace(/[^\u4e00-\u9fa5]/g, "")
  if (chineseOnly.length >= 6) {
    return chineseOnly.slice(0, 12)
  }

  const fallback = compacted.length > 12 ? compacted.slice(0, 12) : compacted
  return fallback.length < 6 ? `${fallback}相关对话`.slice(0, 12) : fallback
}

function traceStepFromRun(step: AgentRunTraceStep) {
  return {
    type: normalizeTraceType(step.step_type),
    content: step.content,
    timestamp: step.created_at,
    raw: step.raw,
  }
}

function normalizeTraceType(type: string): AgentTraceStep["type"] {
  const knownTypes: AgentTraceStep["type"][] = [
    "action",
    "answer_delta",
    "answer_replace",
    "done",
    "error",
    "final",
    "observation",
    "reflection",
    "status",
    "thought",
  ]

  return knownTypes.includes(type as AgentTraceStep["type"])
    ? (type as AgentTraceStep["type"])
    : "status"
}

function formatStoredTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return formatTime()
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
  }).format(date)
}

export function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null
}

function asRecordArray(value: unknown) {
  return Array.isArray(value)
    ? value.map(asRecord).filter((item): item is Record<string, unknown> => Boolean(item))
    : []
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean)
    : []
}

function textValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10
}

export function formatTime() {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
  }).format(new Date())
}

export function profileFormFromUser(
  profile: FitnessProfile | null = null
): ProfileForm {
  return {
    gender: profile?.gender ?? "",
    age: profile?.age?.toString() ?? "",
    location: profile?.location ?? "",
    hyperateId: profile?.hyperate_id ?? "",
    fitnessGoal: profile?.fitness_goal ?? "",
    fitnessSummary: profile?.fitness_summary ?? "",
    activityLevel: profile?.activity_level ?? "",
    experienceLevel: profile?.experience_level ?? "",
    availableDaysPerWeek: profile?.available_days_per_week?.toString() ?? "",
    workoutMinutesPerSession:
      profile?.workout_minutes_per_session?.toString() ?? "",
    equipmentAccess: profile?.equipment_access ?? "",
    injuryHistory: profile?.injury_history ?? "",
    medicalConditions: profile?.medical_conditions ?? "",
    preferredWorkoutTypes: profile?.preferred_workout_types ?? "",
    dietaryHabits: profile?.dietary_habits ?? "",
    dietaryRestrictions: profile?.dietary_restrictions ?? "",
  }
}

export function compactOptionalText(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}
