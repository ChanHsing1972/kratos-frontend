import type { DetailPanel, ProfileForm, UserProfile } from "@/types/kratos"

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

export function formatTime() {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
  }).format(new Date())
}

export function profileFormFromUser(user: UserProfile): ProfileForm {
  return {
    gender: user.gender ?? "",
    age: user.age?.toString() ?? "",
    location: user.location ?? "",
    dietaryHabits: user.dietary_habits ?? "",
    fitnessStatus: user.fitness_status ?? "",
  }
}

export function compactOptionalText(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}
