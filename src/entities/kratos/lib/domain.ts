import type {
  AgentCheckin,
  AgentConversationSession,
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
  TrainingPlanPayload,
  TrainingSchedule,
  TrainingPlanTemplate,
  UserProfile,
  WorkoutLog,
} from "@/entities/kratos/model/types"

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
    "- 根据您的身体反馈动态调整动作选择。",
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
        suggestedTrainingPlan:
          trainingPlanPayloadFromAssistantAnswer(run.answer, run.user_message) ??
          (isProgramPlanRequest(run.user_message)
            ? undefined
            : trainingPlanPayloadFromAgentResult(run.result_payload)),
        suggestedHealthData: pendingHealthDataFromTrace(run.trace_steps),
        time: formatStoredTime(run.created_at),
        trace: run.trace_steps
          .sort((left, right) => left.position - right.position)
          .map(traceStepFromRun),
      },
    ])
}

export function trainingPlanPayloadFromAgentResult(
  raw: unknown
): TrainingPlanPayload | undefined {
  const result = asRecord(raw)
  const workoutPlan = asRecord(result?.workout_plan)
  if (!workoutPlan) {
    return undefined
  }

  const sessions = asRecordArray(workoutPlan.sessions)
  const planKind =
    textValue(workoutPlan.plan_kind) === "program" || sessions.length > 1
      ? "program"
      : "daily"
  const weeklySchedule = buildWeeklyScheduleFromWorkoutSessions(sessions, planKind)
  if (!weeklySchedule) {
    return undefined
  }

  const title =
    planKind === "daily"
      ? normalizeDailyPlanTitle(textValue(workoutPlan.title))
      : (textValue(workoutPlan.title) ?? "Kratos 生成训练计划")
  const goal = textValue(workoutPlan.goal) ?? "基于聊天上下文生成的训练计划"
  const precautions = uniqueLines([
    ...stringArray(workoutPlan.precautions),
    ...extractGuidanceLinesFromWorkoutSessions(sessions),
  ])

  return {
    goal,
    nutrition_guidance: null,
    recovery_guidance: precautions.length
      ? precautions.join("\n")
      : "训练前充分热身，训练后完成拉伸；如出现疼痛或明显疲劳，及时降低强度。",
    start_date: localTrainingDateValue(new Date()),
    status: "draft",
    duration_weeks: numberValue(workoutPlan.duration_weeks) ?? (planKind === "program" ? 4 : null),
    plan_kind: planKind,
    schedule_json: buildStructuredSchedule(sessions, planKind),
    summary: buildWorkoutPlanSummary(title, goal, sessions),
    title,
    weekly_schedule: weeklySchedule,
  }
}

export function isProgramPlanRequest(prompt: string) {
  return /(一周|周计划|每周|长期|周期|多周|月度).*(训练|健身|计划|安排)|(训练|健身|计划|安排).*(一周|周计划|每周|长期|周期|多周|月度)/.test(prompt)
}

export function trainingPlanPayloadFromAssistantAnswer(
  answer: string,
  prompt: string
): TrainingPlanPayload | undefined {
  const normalizedAnswer = normalizeVisiblePlanBreaks(answer)
  const programRequested = isProgramPlanRequest(prompt)
  const dailyRequested =
    /(今天|今日|每日|日计划|本次).*(训练|健身|计划|安排)|(训练|健身|计划|安排).*(今天|今日|每日|日计划|本次)/.test(prompt)
  if (!programRequested && !dailyRequested) {
    return undefined
  }

  const sessions = programRequested
    ? parseProgramSessionsFromAnswer(normalizedAnswer)
    : parseDailySessionsFromAnswer(normalizedAnswer)
  if (!sessions.length || (programRequested && sessions.length < 2)) {
    return undefined
  }

  const title =
    findPlanTitleInAnswer(normalizedAnswer) ??
    (programRequested ? "一周训练计划" : "今日训练计划")
  const durationWeeks = programRequested ? parseDurationWeeks(prompt) : null
  return trainingPlanPayloadFromAgentResult({
    workout_plan: {
      duration_weeks: durationWeeks,
      goal: "根据本次对话生成的训练安排",
      plan_kind: programRequested ? "program" : "daily",
      sessions,
      title,
    },
  })
}

function parseProgramSessionsFromAnswer(answer: string) {
  const sessions: Record<string, unknown>[] = []
  for (const rawLine of answer.split(/\r?\n/)) {
    const markdownCells = rawLine.includes("|") || (rawLine.match(/｜/g)?.length ?? 0) >= 2
      ? rawLine.trim().replace(/^[|｜]/, "").replace(/[|｜]$/, "").split(/[|｜]/).map((cell) => cell.trim())
      : []
    if (markdownCells.length >= 2) {
      const weekday = normalizeWeekday(markdownCells[0])
      if (weekday) {
        const details = (markdownCells.length >= 3 ? markdownCells.slice(2) : markdownCells.slice(1)).join("；")
        sessions.push(visibleSession(weekday, markdownCells.length >= 3 ? markdownCells[1] : "训练安排", details))
      }
      continue
    }

    const line = rawLine.trim().replace(/^[-*•\s]+/, "")
    const match = line.match(/^(周[一二三四五六日天](?:\/[日天])?)(?:\s*[|｜/-]\s*([^:：]+))?\s*[:：]\s*(.+)$/)
    if (match) {
      sessions.push(visibleSession(match[1], match[2] ?? "训练安排", match[3]))
    }
  }
  return sessions
}

function parseDailySessionsFromAnswer(answer: string) {
  const exercises = parseVisibleExercises(answer)
  return exercises.length
    ? [{ exercises, notes: [], title: "今日训练", weekday: weekdayLabel(new Date()) }]
    : []
}

function visibleSession(weekday: string, title: string, details: string) {
  const parsed = parseVisibleSessionDetails(details, title)
  return {
    exercises: parsed.exercises,
    notes: parsed.note ? [parsed.note] : [],
    schedule_line: parsed.scheduleLine,
    title: title.trim() || "训练安排",
    weekday,
  }
}

function parseVisibleExercises(text: string) {
  return splitVisiblePlanSegments(text)
    .map(parseVisibleExercise)
    .filter((exercise): exercise is NonNullable<typeof exercise> => Boolean(exercise))
}

function parseVisibleSessionDetails(details: string, title: string) {
  const parsedSegments = splitVisiblePlanSegments(details).map((segment) => ({
    exercise: parseVisibleExercise(segment),
    segment,
  }))
  const exercises = parsedSegments
    .map(({ exercise }) => exercise)
    .filter((exercise): exercise is NonNullable<typeof exercise> => Boolean(exercise))
  const note = parsedSegments
    .filter(({ exercise }) => !exercise)
    .map(({ segment }) => segment)
    .join("；")
  const scheduleLine = exercises.length
    ? exercises
      .map((exercise, index) => {
        const trailingNote = note && index === exercises.length - 1 ? `（${note}）` : ""
        return `${exercise.name} ${exercise.schedule_amount}${trailingNote}`
      })
      .join("；")
    : `${/休息|恢复/.test(title) ? "恢复安排" : title.trim() || "训练安排"} 按需${note ? `（${note}）` : ""}`

  return {
    exercises: exercises.map((exercise, index) => ({
      ...exercise,
      notes: note && index === exercises.length - 1 ? note : null,
    })),
    note,
    scheduleLine,
  }
}

function splitVisiblePlanSegments(text: string) {
  return normalizeVisiblePlanBreaks(text)
    .split(/[；;、]\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function parseVisibleExercise(compact: string) {
  const amount = compact.match(/(\d+)\s*(?:组\s*[xX×*]?\s*|[xX×*])\s*(\d+(?:\s*[-~至]\s*\d+)?)(?:\s*(次|秒|分钟))?/)
  const duration = compact.match(/(\d+(?:\s*[-~至]\s*\d+)?)\s*(分钟|秒)/)
  const start = amount?.index ?? duration?.index
  if (start === undefined) return null
  const name = compact.slice(0, start).replace(/[：:,，\s]+$/, "").trim()
  if (!name) return null
  return {
    duration_minutes: duration && !amount && duration[2] === "分钟" ? Number.parseInt(duration[1], 10) : null,
    name,
    notes: null,
    reps: amount
      ? `${amount[2].replace(/\s/g, "")} ${amount[3] ?? "次"}`
      : duration
        ? `${duration[1].replace(/\s/g, "")} ${duration[2]}`
        : null,
    schedule_amount: compact.slice(start).trim(),
    sets: amount ? Number.parseInt(amount[1], 10) : null,
  }
}

function normalizeVisiblePlanBreaks(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "；")
    .replace(/&lt;br\s*\/?&gt;/gi, "；")
}

function normalizeWeekday(value: string) {
  const match = value.match(/^(?:周|星期)[一二三四五六日天](?:\/[日天])?$/)
  return match ? value.replace(/^星期/, "周") : null
}

function findPlanTitleInAnswer(answer: string) {
  return answer
    .split(/\r?\n/)
    .map((line) => line.replace(/^#+\s*/, "").replace(/\*\*/g, "").trim())
    .find((line) => line.includes("计划") && !line.includes("|") && line.length <= 40) ?? null
}

function parseDurationWeeks(prompt: string) {
  const arabic = prompt.match(/(\d+)\s*周/)
  if (arabic) return Math.max(1, Number.parseInt(arabic[1], 10))
  if (prompt.includes("一周") || prompt.includes("周计划")) return 1
  return 4
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

function buildStructuredSchedule(sessions: Record<string, unknown>[], planKind: "daily" | "program"): TrainingSchedule | null {
  if (!sessions.length) {
    return null
  }
  const structuredSessions = sessions.map((session, index) => ({
    exercises: asRecordArray(session.exercises).map((exercise, exerciseIndex) => ({
      id: `agent-exercise-${index}-${exerciseIndex}`,
      name: textValue(exercise.name) ?? textValue(exercise.title) ?? `动作 ${exerciseIndex + 1}`,
      notes: textValue(exercise.notes),
      rest_seconds: null,
      target_reps: textValue(exercise.reps),
      target_rpe: null,
      target_sets: numberValue(exercise.sets),
      target_weight_kg: null,
    })),
    id: `agent-session-${index}`,
    title: textValue(session.title) ?? textValue(session.focus) ?? `训练 ${index + 1}`,
    weekday: workoutSessionWeekday(session, index, planKind),
  }))
  return {
    version: 1,
    weeks: [{ sessions: structuredSessions, week: 1 }],
  }
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

export function chatSessionFromAgentSession(
  session: AgentConversationSession
): ChatSession {
  return {
    archived: session.is_archived,
    createdAt: session.created_at,
    deleted: session.is_deleted,
    id: session.session_id,
    lastMessage: session.last_message,
    lastRunAt: session.last_run_at,
    messageCount: session.run_count * 2,
    pinned: session.is_pinned,
    preview: session.last_message ?? session.summary ?? "还没有消息",
    shared: session.is_shared,
    summary: session.summary,
    title: session.title,
    updatedAt: session.updated_at,
  }
}

export function chatSessionsFromAgentSessions(
  sessions: AgentConversationSession[]
): ChatSession[] {
  return sessions.map(chatSessionFromAgentSession)
}

export function titleFromPrompt(prompt: string) {
  const compacted = prompt
    .replace(/[#>*_`~(){}]/g, "")
    .replace(/\[/g, "")
    .replace(/\]/g, "")
    .replace(/\s+/g, " ")
    .trim()
  if (!compacted) {
    return "新的训练对话"
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

function localTrainingDateValue(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

function buildWeeklyScheduleFromWorkoutSessions(sessions: Record<string, unknown>[], planKind: "daily" | "program") {
  const lines = sessions
    .map((session, index) => {
      const title = cleanScheduleTitle(
        textValue(session.title) ?? textValue(session.focus) ?? `训练 ${index + 1}`
      )
      const exercises = asRecordArray(session.exercises)
        .map(formatWorkoutExercise)
        .filter((item): item is string => Boolean(item))
        .filter(isTrainingActionLine)
      const notes = stringArray(session.notes)
        .map(cleanWorkoutLine)
        .filter((item): item is string => Boolean(item))
      const fallbackNotes = notes.filter((note) =>
        isTrainingActionLine(note) || /恢复|休息|快走|拉伸|瑜伽|活动/.test(note)
      )
      const explicitScheduleLine = cleanWorkoutLine(textValue(session.schedule_line))
      const actions = uniqueLines(fallbackNotes.length ? fallbackNotes : exercises).slice(0, 8)
      const actionText = explicitScheduleLine ?? actions.join("；")

      if (!actionText && isGuidanceLine(title)) {
        return null
      }

      return `${workoutSessionWeekday(session, index, planKind)}｜${title}${actionText ? `：${actionText}` : ""}`
    })
    .filter(Boolean)

  return lines.join("\n")
}

function workoutSessionWeekday(session: Record<string, unknown>, index: number, planKind: "daily" | "program") {
  const storedWeekday = textValue(session.weekday)
  if (storedWeekday) return storedWeekday
  if (planKind === "daily") return weekdayLabel(new Date())
  return ["周一", "周二", "周三", "周四", "周五", "周六", "周日"][index % 7]
}

function weekdayLabel(date: Date) {
  const labels = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
  return labels[date.getDay()]
}

function normalizeDailyPlanTitle(title: string | null) {
  if (!title || title === "训练计划" || title === "Kratos 生成训练计划") {
    return "今日训练计划"
  }

  return /今日|今天|每日|单日/.test(title) ? title : `今日${title}`
}

function formatWorkoutExercise(exercise: Record<string, unknown>) {
  const name = cleanWorkoutLine(textValue(exercise.name) ?? textValue(exercise.title))
  if (!name) {
    return null
  }

  const sets = numberValue(exercise.sets)
  const reps = cleanWorkoutLine(textValue(exercise.reps))
  const duration = numberValue(exercise.duration_minutes)
  const notes = cleanExerciseNotes(name, textValue(exercise.notes))
  const prescription = [
    sets ? `${sets} 组` : null,
    reps ? normalizeRepsText(reps) : null,
    duration ? `${duration} 分钟` : null,
  ].filter(Boolean)

  return [name, prescription.join(" x "), notes].filter(Boolean).join("，")
}

function extractGuidanceLinesFromWorkoutSessions(sessions: Record<string, unknown>[]) {
  return sessions.flatMap((session) => {
    const notes = stringArray(session.notes)
    const exerciseNotes = asRecordArray(session.exercises)
      .map((exercise) => textValue(exercise.notes))
      .filter((item): item is string => Boolean(item))

    return [...notes, ...exerciseNotes]
      .filter((line): line is string => Boolean(line))
      .map(cleanWorkoutLine)
      .filter((line): line is string => Boolean(line))
      .filter(isGuidanceLine)
  })
}

function cleanScheduleTitle(value: string) {
  return value
    .replace(/^[-\d\s.、]+/, "")
    .replace(/[：:]\s*$/, "")
    .trim() || "训练"
}

function cleanWorkoutLine(value: string | null) {
  if (!value) {
    return null
  }

  const compacted = value
    .replace(/^[-•\s]+/, "")
    .replace(/\s+/g, " ")
    .replace(/([：:])\s*\1+/g, "$1")
    .trim()

  return compacted || null
}

function cleanExerciseNotes(name: string, notes: string | null) {
  const cleaned = cleanWorkoutLine(notes)
  if (!cleaned || cleaned === name || cleaned.startsWith(`${name}：`) || cleaned.startsWith(`${name}:`)) {
    return null
  }

  if (isGuidanceLine(cleaned)) {
    return null
  }

  return cleaned
}

function normalizeRepsText(value: string) {
  return /次|分钟|秒/.test(value) ? value : `${value} 次`
}

function isTrainingActionLine(value: string) {
  const line = value.trim()
  if (!line || isGuidanceLine(line)) {
    return false
  }

  return /(\d+\s*组|\d+\s*[x×*]\s*\d+|\d+\s*(次|分钟|秒)|每组|RM|递增|递减|力竭)/i.test(line)
}

function isGuidanceLine(value: string) {
  return /冷身|拉伸|注意事项|注意|避免|疼痛|刺痛|头晕|不适|补充蛋白|补充水分|睡眠|恢复|风险|如有|如果|立即停止|呼吸均匀/.test(value)
}

function uniqueLines(lines: string[]) {
  const seen = new Set<string>()
  return lines.filter((line) => {
    const normalized = line.replace(/\s+/g, "")
    if (seen.has(normalized)) {
      return false
    }
    seen.add(normalized)
    return true
  })
}

function buildWorkoutPlanSummary(
  title: string,
  goal: string,
  sessions: Record<string, unknown>[]
) {
  const focuses = sessions
    .map((session) => textValue(session.focus) ?? textValue(session.title))
    .filter(Boolean)
    .slice(0, 4)

  return [
    `由 Kratos 对话生成：${title}。`,
    goal ? `目标：${goal}。` : null,
    focuses.length ? `训练重点：${focuses.join("、")}。` : null,
  ]
    .filter(Boolean)
    .join("")
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
