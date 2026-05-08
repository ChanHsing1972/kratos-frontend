import type {
  AgentCheckin,
  AgentRun,
  AgentRunTraceStep,
  AgentTraceStep,
  ChatSession,
  BodyMetric,
  ChatMessage,
  DetailPanel,
  FitnessProfile,
  OnboardingStatus,
  ProfileForm,
  TrainingPlan,
  TrainingPlanTemplate,
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
      "周一｜全身力量 A：深蹲模式 3 组 x 10 次；俯卧撑 3 组 x 8-12 次；平板支撑 3 组 x 30 秒\n周二｜低冲击有氧：快走或椭圆机 35 分钟，保持可对话强度\n周四｜全身力量 B：罗马尼亚硬拉 3 组 x 10 次；哑铃划船 3 组 x 12 次；死虫 3 组 x 10 次\n周六｜循环训练：壶铃硬拉、台阶上步、弹力带划船、登山者各 40 秒，完成 4 轮\n周日｜恢复：拉伸 15 分钟，记录体重、睡眠和疲劳",
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
      "周一｜上肢推：卧推 4 组 x 6-8 次；哑铃肩推 3 组 x 8-10 次；绳索下压 3 组 x 12 次\n周二｜上肢拉：引体向上或高位下拉 4 组 x 8 次；杠铃划船 4 组 x 8 次；哑铃弯举 3 组 x 12 次\n周三｜休息：步行 20-30 分钟，肩颈和髋部活动度\n周四｜下肢：深蹲 4 组 x 6-8 次；罗马尼亚硬拉 3 组 x 8-10 次；腿弯举 3 组 x 12 次\n周六｜全身辅助：上斜卧推 3 组 x 10 次；坐姿划船 3 组 x 10 次；臀桥 3 组 x 12 次；核心 8 分钟",
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
      "周一｜臀腿核心：哑铃杯式深蹲 4 组 x 12 次；哑铃臀桥 4 组 x 15 次；侧桥 3 组 x 30 秒\n周三｜背肩体态：单臂哑铃划船 4 组 x 12 次；弹力带面拉 3 组 x 15 次；俯身飞鸟 3 组 x 12 次\n周五｜全身循环：哑铃硬拉、地板卧推、反向箭步蹲、死虫各 45 秒，完成 4 轮\n周六｜低强度有氧：快走 30 分钟，结束后做髋屈肌和胸椎拉伸",
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
      const firstQuestion = ordered[0]?.user_message ?? "新的训练对话"
      const title = meta.title ?? titleFromPrompt(firstQuestion)

      return {
        id: sessionId,
        title,
        preview: latest?.answer || latest?.user_message || "还没有消息",
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

export function titleFromPrompt(prompt: string) {
  const compacted = prompt.replace(/\s+/g, " ").trim()
  if (!compacted) {
    return "新的训练对话"
  }

  return compacted.length > 20 ? `${compacted.slice(0, 20)}...` : compacted
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
  profile: FitnessProfile | null = null
): ProfileForm {
  return {
    gender: profile?.gender ?? "",
    age: profile?.age?.toString() ?? "",
    location: profile?.location ?? "",
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
