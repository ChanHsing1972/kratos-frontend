import type { DetailPanel, ProfileForm, UserProfile } from "@/types/kratos"

export function buildAssistantReply(prompt: string) {
  if (prompt.includes("饮食") || prompt.includes("早餐")) {
    return "已记录这次饮食。粗略估算：蛋白质约 24g，碳水约 45g，脂肪约 18g；如果晚餐训练后补一份优质蛋白，今天会更稳。"
  }

  if (prompt.includes("膝") || prompt.includes("疼")) {
    return "收到右膝反馈。今天继续避免深膝屈和跳跃，训练中疼痛超过 3/10 就停止；我会优先安排髋主导和核心稳定动作。"
  }

  if (prompt.includes("历史") || prompt.includes("7 天")) {
    return "最近 7 天训练密度偏高，下肢恢复窗口略短。建议下一次下肢训练前至少保留 48 小时，并把睡眠目标提到 7 小时以上。"
  }

  return "收到。我会把这条反馈纳入当前计划：优先控制训练风险，同时保持 20 分钟内可完成。"
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
