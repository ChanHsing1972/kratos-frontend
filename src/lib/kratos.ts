import type {
  AgentCheckin,
  AgentRun,
  AgentRunTraceStep,
  AgentTraceStep,
  BodyMetric,
  ChatMessage,
  DetailPanel,
  FitnessProfile,
  ProfileForm,
  TrainingPlan,
  UserProfile,
  WorkoutLog,
} from "@/types/kratos"

export function buildAssistantReply(prompt: string) {
  if (prompt.includes("饮食") || prompt.includes("早餐")) {
    return [
      "**已记录这次饮食。**",
      "",
      "| 项目 | 粗略估算 |",
      "| --- | ---: |",
      "| 蛋白质 | 约 24g |",
      "| 碳水 | 约 45g |",
      "| 脂肪 | 约 18g |",
      "",
      "- 晚餐训练后补一份优质蛋白会更稳。",
      "- 如果今天还有力量训练，优先保证水和碳水补给。",
    ].join("\n")
  }

  if (prompt.includes("膝") || prompt.includes("疼")) {
    return [
      "**收到右膝反馈。** 今天的训练策略先降风险：",
      "",
      "- 避免深膝屈、跳跃和快速变向。",
      "- 训练中疼痛超过 `3/10` 就停止。",
      "- 优先安排髋主导动作和核心稳定训练。",
    ].join("\n")
  }

  if (prompt.includes("历史") || prompt.includes("7 天")) {
    return [
      "最近 **7 天训练密度偏高**，下肢恢复窗口略短。",
      "",
      "- 下一次下肢训练前至少保留 **48 小时**。",
      "- 睡眠目标提到 **7 小时以上**。",
      "- 如果右膝仍有酸痛，把下肢训练改成低冲击恢复日。",
    ].join("\n")
  }

  return [
    "收到。我会把这条反馈纳入当前计划：",
    "",
    "- 优先控制训练风险。",
    "- 保持训练在 **20 分钟内**可完成。",
    "- 根据你的身体反馈动态调整动作选择。",
  ].join("\n")
}

export function buildProfilePanel(
  user: UserProfile | null,
  completedExercises: string[]
): DetailPanel {
  if (!user) {
    return {
      title: "未登录",
      body: "登录后可以查看个人资料、经验值和后端同步状态。",
    }
  }

  return {
    title: "个人信息",
    body: `${user.username} 的训练档案已从后端同步。当前经验值为本地演示数据，用户基础资料来自 /api/v1/auth/me。`,
    items: [
      `用户 ID：${user.id}`,
      `性别：${user.gender ?? "未设置"}`,
      `年龄：${user.age ?? "未设置"}`,
      `地区：${user.location ?? "未设置"}`,
      `训练状态：${user.fitness_status ?? "未设置"}`,
      `饮食习惯：${user.dietary_habits ?? "未设置"}`,
      `今日已完成动作：${completedExercises.length}/2`,
    ],
  }
}

export function buildDashboardPanel({
  checkin,
  metric,
  profile,
  logs,
}: {
  checkin: AgentCheckin | null
  metric: BodyMetric | null
  profile: FitnessProfile | null
  logs: WorkoutLog[]
}): DetailPanel {
  const weight = metric?.weight_kg ?? profile?.weight_kg ?? null
  const bodyFat = metric?.body_fat_percentage ?? profile?.body_fat_percentage ?? null
  const sleep = checkin?.sleep_quality ?? profile?.sleep_hours ?? null

  return {
    title: "身体与训练状态",
    body:
      "这些数据来自数据库：users/user_profiles、body_metrics、workout_logs 和 agent_checkins。时间序列表优先，用户画像作为新用户兜底。",
    items: [
      weight ? `体重：${weight} kg` : "体重：未记录",
      bodyFat
        ? `体脂率：${bodyFat}%`
        : "体脂率：未记录",
      metric?.bmi ? `BMI：${metric.bmi}` : "BMI：未记录",
      `训练记录：${logs.length} 条`,
      sleep ? `睡眠：${sleep}${checkin?.sleep_quality ? "/10" : " 小时"}` : "睡眠：未记录",
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
      body: "登录后 Kratos 会自动为你创建一份可同步的智能训练计划。",
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
  const fallback = ["哑铃罗马尼亚硬拉 4 组 × 12 次", "哑铃臀桥 4 组 × 15 次"]
  const lines = plan?.weekly_schedule
    ?.split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  return [...(lines ?? []), ...fallback].slice(0, 2)
}

export function chatMessagesFromAgentRuns(runs: AgentRun[]): ChatMessage[] {
  return [...runs]
    .sort(
      (left, right) =>
        new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
    )
    .flatMap((run) => [
      {
        id: `run-${run.id}-user`,
        author: "user" as const,
        body: run.user_message,
        time: formatStoredTime(run.created_at),
      },
      {
        id: `run-${run.id}-assistant`,
        author: "assistant" as const,
        body: run.answer,
        time: formatStoredTime(run.created_at),
        trace: run.trace_steps
          .sort((left, right) => left.position - right.position)
          .map(traceStepFromRun),
      },
    ])
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
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
  }).format(date)
}

export function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function formatTime() {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
  }).format(new Date())
}

export function profileFormFromUser(
  user: UserProfile,
  profile: FitnessProfile | null = null
): ProfileForm {
  return {
    gender: user.gender ?? "",
    age: user.age?.toString() ?? "",
    location: user.location ?? "",
    sleepHours: profile?.sleep_hours?.toString() ?? "",
    weightKg: profile?.weight_kg?.toString() ?? "",
    dietaryHabits: user.dietary_habits ?? "",
    fitnessStatus: user.fitness_status ?? "",
  }
}

export function compactOptionalText(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}
