import {
  ChartNoAxesColumn,
  CircleCheck,
  Flame,
  Heart,
  History,
  MessageCircle,
  Moon,
  Utensils,
} from "lucide-react"

import type {
  ChatMessage,
  Metric,
  NavItem,
  NotificationItem,
  QuickAction,
  TimelineItem,
} from "@/types/kratos"

export const navItems: NavItem[] = [
  { label: "对话", icon: MessageCircle },
]

export const timelineItems: TimelineItem[] = [
  {
    label: "Thought",
    time: "10:30:15",
    icon: "thought",
    body: "用户时间紧凑、器械极少，且报告右膝盖疼痛。需避免大关节压力动作，选择无膝关节深屈曲的下肢或上半身/核心训练，并计算适合 20 分钟的训练方案。",
  },
  {
    label: "Action",
    time: "10:30:18",
    icon: "action",
    body: '调用工具 search_exercise(muscle="legs", equipment="dumbbell", avoid_joints="knee")',
  },
  {
    label: "Observation",
    time: "10:30:20",
    icon: "observation",
    body: "找到 6 个合适的动作",
  },
  {
    label: "Action",
    time: "10:30:21",
    icon: "action",
    body: "调用工具 calculate_workout_volume(time_min=20, exercise_count=2)",
  },
  {
    label: "Observation",
    time: "10:30:22",
    icon: "observation",
    body: "建议：2 个动作，每个 4 组，总计约 16 分钟，剩余 4 分钟热身",
  },
  {
    label: "Thought (反思)",
    time: "10:30:25",
    icon: "thought",
    body: "硬拉虽不深屈膝，但在酒店环境下存在腰部风险。改用更安全的训练组合。",
  },
  {
    label: "Final Answer",
    time: "10:30:28",
    icon: "final",
    body: "已生成 20 分钟酒店护膝下肢训练计划",
  },
]

export const baseMetrics: Metric[] = [
  { label: "静息心率 (bpm)", value: "72", icon: Heart },
  { label: "今日消耗", value: "350", unit: "kcal", icon: Flame },
  { label: "昨晚睡眠", value: "6.5", unit: "h", icon: Moon },
]

export const completionMetricIcon = CircleCheck

export const quickActions: QuickAction[] = [
  {
    title: "记录饮食",
    description: "记录今天您饮食内容",
    icon: Utensils,
    prompt: "我早餐吃了鸡蛋、燕麦和一杯拿铁，请帮我记录并估算营养。",
  },
  {
    title: "身体反馈",
    description: "告诉我您的身体感受",
    icon: Heart,
    prompt: "今天右膝还是有轻微酸痛，但精神不错，请调整今天训练强度。",
  },
  {
    title: "模拟数据",
    description: "发送模拟身体数据",
    icon: ChartNoAxesColumn,
    prompt: "同步一组模拟身体数据：静息心率 72，睡眠 6.5 小时，今日步数 6800。",
  },
  {
    title: "查看历史",
    description: "回顾您的训练记录",
    icon: History,
    prompt: "帮我回顾最近 7 天训练记录，找出恢复不足的风险。",
  },
]

export const initialMessages: ChatMessage[] = [
]

export const initialNotifications: NotificationItem[] = [
  {
    id: "knee",
    title: "上下文提醒",
    body: "Agent 会在每次回答前读取您的档案和最新身体数据。",
    read: false,
  },
  {
    id: "hydration",
    title: "新用户引导",
    body: "先补目标、训练经验、身高体重，回答会明显更准。",
    read: false,
  },
  {
    id: "plan",
    title: "数据分离",
    body: "个人信息写入 user_profiles，身体指标写入 body_metrics。",
    read: true,
  },
]
