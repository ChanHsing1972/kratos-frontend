import type { LucideIcon } from "lucide-react"
import {
  Activity,
  Bell,
  CalendarDays,
  ChartNoAxesColumn,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  ClipboardList,
  Flame,
  Heart,
  History,
  ImagePlus,
  MessageCircle,
  Moon,
  Paperclip,
  SendHorizontal,
  Settings,
  Sparkles,
  Sun,
  Utensils,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type NavItem = {
  label: string
  icon: LucideIcon
  active?: boolean
  badge?: string
}

type TimelineItem = {
  label: string
  time: string
  body: string
  icon: "thought" | "action" | "observation" | "final"
}

type Metric = {
  label: string
  value: string
  unit?: string
  icon: LucideIcon
}

type QuickAction = {
  title: string
  description: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { label: "对话", icon: MessageCircle, active: true },
  { label: "训练计划", icon: CalendarDays },
  { label: "营养分析", icon: Utensils },
  { label: "身体数据", icon: Activity },
  { label: "历史记录", icon: ClipboardList },
  { label: "评估平台", icon: ChartNoAxesColumn, badge: "Beta" },
  { label: "设置", icon: Settings },
]

const timelineItems: TimelineItem[] = [
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

const metrics: Metric[] = [
  { label: "静息心率 (bpm)", value: "72", icon: Heart },
  { label: "今日消耗", value: "350", unit: "kcal", icon: Flame },
  { label: "昨晚睡眠", value: "6.5", unit: "h", icon: Moon },
  { label: "今日训练完成度", value: "2/3", icon: CircleCheck },
]

const quickActions: QuickAction[] = [
  { title: "记录饮食", description: "记录今天你饮食内容", icon: Utensils },
  { title: "身体反馈", description: "告诉我你的身体感受", icon: Heart },
  { title: "模拟数据", description: "发送模拟身体数据", icon: ChartNoAxesColumn },
  { title: "查看历史", description: "回顾你的训练记录", icon: History },
]

export function App() {
  return (
    <div className="min-h-svh bg-[#efefee] p-4 text-[#111111]">
      <div className="mx-auto flex min-h-[calc(100svh-2rem)] w-full max-w-[1488px] overflow-hidden rounded-[22px] border border-white/80 bg-white shadow-[0_18px_55px_rgba(0,0,0,0.12)] max-xl:flex-col">
        <Sidebar />
        <MainConversation />
        <RightPanel />
      </div>
    </div>
  )
}

function Sidebar() {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-[#e8e8e8] bg-white px-6 py-7 xl:w-[270px] xl:border-r xl:border-b-0">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[28px] leading-none font-black tracking-[-0.06em]">
            Kratos
          </h1>
          <p className="mt-2 text-[13px] tracking-[0.01em] text-[#8b8b8b]">
            AI Fitness Coach
          </p>
        </div>
        <Button
          aria-label="Collapse sidebar"
          className="mt-0.5 size-7 rounded-full bg-[#0f0f0f] text-white hover:bg-[#0f0f0f]/90"
          size="icon"
          type="button"
        >
          <ChevronLeft className="size-4" strokeWidth={2.3} />
        </Button>
      </div>

      <nav className="mt-9 flex flex-col gap-2.5">
        {navItems.map((item) => (
          <button
            className={cn(
              "flex h-[46px] items-center gap-4 rounded-[9px] px-4 text-[14px] font-medium transition-colors",
              item.active
                ? "bg-[#0f0f0f] text-white"
                : "text-[#303030] hover:bg-[#f5f5f4]"
            )}
            key={item.label}
            type="button"
          >
            <item.icon
              className={cn("size-[19px]", item.active && "text-white")}
              strokeWidth={1.8}
            />
            <span>{item.label}</span>
            {item.badge ? (
              <span className="ml-auto rounded-full bg-[#efefef] px-2 py-0.5 text-[11px] font-medium text-[#777777]">
                {item.badge}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      <div className="mt-10 flex gap-4 max-xl:flex-wrap xl:mt-auto xl:flex-col">
        <UserCard />
        <ProgressCard />
      </div>
    </aside>
  )
}

function UserCard() {
  return (
    <section className="w-full rounded-[12px] border border-[#e8e8e8] bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)] xl:w-auto">
      <div className="flex items-center gap-3">
        <KevinAvatar />
        <div>
          <h2 className="text-[14px] leading-5 font-bold">Kevin</h2>
          <p className="text-[12px] text-[#666666]">Lv.12</p>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between text-[12px] text-[#575757]">
        <span>经验值</span>
        <span>2450 / 3500</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#eeeeee]">
        <div className="h-full w-[70%] rounded-full bg-[#111111]" />
      </div>
    </section>
  )
}

function ProgressCard() {
  return (
    <section className="w-full rounded-[12px] border border-[#e8e8e8] bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)] xl:w-auto">
      <p className="text-[12px] text-[#7b7b7b]">今日任务完成度</p>
      <div className="mt-2 flex items-end gap-1">
        <span className="text-[24px] leading-none font-bold">78</span>
        <span className="pb-0.5 text-[14px] font-semibold">%</span>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#eeeeee]">
        <div className="h-full w-[78%] rounded-full bg-[#111111]" />
      </div>
      <button
        className="mt-4 inline-flex items-center gap-1 text-[12px] font-medium text-[#575757]"
        type="button"
      >
        查看详情
        <ChevronRight className="size-3.5" />
      </button>
    </section>
  )
}

function KevinAvatar() {
  return (
    <div className="relative size-11 overflow-hidden rounded-full bg-[#e6e2dc]">
      <div className="absolute top-2 left-1/2 size-4 -translate-x-1/2 rounded-full bg-[#a36b43]" />
      <div className="absolute top-1.5 left-1/2 h-2.5 w-5 -translate-x-1/2 rounded-t-full bg-[#211915]" />
      <div className="absolute right-2 bottom-0 left-2 h-6 rounded-t-[16px] bg-[#101010]" />
      <div className="absolute bottom-3 left-1/2 h-2.5 w-5 -translate-x-1/2 rounded-b-full bg-[#d9d9d9]" />
    </div>
  )
}

function MainConversation() {
  return (
    <main className="flex min-w-0 flex-1 flex-col border-[#e8e8e8] bg-white xl:border-r">
      <header className="flex flex-col gap-5 px-7 pt-8 pb-6 sm:px-10 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-[25px] leading-[1.1] font-extrabold tracking-[-0.04em]">
            下午好， Kevin <span className="tracking-normal">👋</span>
          </h2>
          <p className="mt-3 text-[13px] text-[#6d6d6d]">
            我是你的 AI 健身教练 Kratos， 有什么可以帮你?
          </p>
        </div>
        <div className="flex items-center gap-7 pr-2">
          <div className="flex items-center gap-2 text-[12px] text-[#5e5e5e]">
            <span className="size-1.5 rounded-full bg-[#4c9b4d]" />
            在线
          </div>
          <button
            aria-label="Light mode"
            className="grid size-6 place-items-center text-[#161616]"
            type="button"
          >
            <Sun className="size-5" strokeWidth={1.7} />
          </button>
          <button
            aria-label="Notifications"
            className="grid size-6 place-items-center text-[#161616]"
            type="button"
          >
            <Bell className="size-5" strokeWidth={1.7} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-[17px] px-7 pb-5 sm:px-10">
        <UserPromptCard />
        <ThinkingCard />
        <Composer />
        <QuickActions />
        <p className="text-center text-[10px] text-[#9a9a9a]">
          Kratos 提供的建议仅供健身参考，不构成医疗或诊断建议。如有严重不适，请及时就医。
        </p>
      </div>
    </main>
  )
}

function UserPromptCard() {
  return (
    <section className="rounded-[12px] border border-[#e8e8e8] bg-white px-5 py-5 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <div className="flex gap-4">
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#ededed]">
          <ClipboardList className="size-4.5 text-[#2b2b2b]" strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-[14px] leading-5 font-bold">你</h3>
            <span className="text-[12px] text-[#8b8b8b]">10:30</span>
          </div>
          <p className="mt-1.5 max-w-[620px] text-[14px] leading-[1.7] text-[#2f2f2f]">
            我今天在酒店，只有一对 10 kg 的哑铃和一张床，时间只有 20
            分钟。另外我昨天深蹲完右膝盖有点疼，今天还能练腿吗?
          </p>
        </div>
      </div>
    </section>
  )
}

function ThinkingCard() {
  return (
    <section className="rounded-[12px] border border-[#e8e8e8] bg-white px-5 pt-5 pb-5 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <div className="flex items-start gap-4">
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#111111] text-white">
          <span className="text-[18px] font-bold">K</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-[14px] leading-5 font-bold">Kratos</h3>
              <p className="mt-1 text-[12px] text-[#8a8a8a]">正在思考中...</p>
            </div>
            <button
              className="inline-flex items-center gap-1 text-[12px] font-medium text-[#777777]"
              type="button"
            >
              收起思考过程
              <ChevronRight className="size-3.5 rotate-[-90deg]" />
            </button>
          </div>

          <div className="relative mt-5 pl-8">
            <div className="absolute top-2 bottom-3 left-[7px] w-px bg-[#e4e4e4]" />
            <div className="flex flex-col gap-3.5">
              {timelineItems.map((item) => (
                <TimelineRow item={item} key={`${item.label}-${item.time}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function TimelineRow({ item }: { item: TimelineItem }) {
  const iconClass =
    item.icon === "thought" || item.icon === "final"
      ? "border-[#111111] bg-white"
      : "border-[#111111] bg-white"

  return (
    <div className="relative">
      <div
        className={cn(
          "absolute top-0.5 -left-[31px] grid size-3.5 place-items-center rounded-full border bg-white",
          iconClass
        )}
      >
        {item.icon === "thought" ? (
          <span className="size-1.5 rounded-full bg-[#111111]" />
        ) : item.icon === "final" ? (
          <Check className="size-2.5 text-[#111111]" strokeWidth={2.5} />
        ) : (
          <Sparkles className="size-2.5 text-[#111111]" strokeWidth={2.2} />
        )}
      </div>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h4 className="text-[12px] leading-4 font-bold text-[#141414]">
            {item.label}
          </h4>
          <p className="mt-1 text-[12px] leading-[1.58] text-[#333333]">
            {item.body}
          </p>
        </div>
        <time className="shrink-0 text-[11px] leading-4 text-[#999999]">
          {item.time}
        </time>
      </div>
    </div>
  )
}

function Composer() {
  return (
    <section className="rounded-[12px] border border-[#e7e7e7] bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <div className="min-h-9 text-[12px] text-[#8c8c8c]">
        输入你的问题或反馈， Shift + Enter 换行
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            aria-label="Attach file"
            className="text-[#1f1f1f]"
            type="button"
          >
            <Paperclip className="size-4.5" strokeWidth={1.8} />
          </button>
          <button
            aria-label="Add image"
            className="text-[#1f1f1f]"
            type="button"
          >
            <ImagePlus className="size-4.5" strokeWidth={1.8} />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <Button
            className="h-9 rounded-[8px] border-[#dedede] px-4 text-[12px] font-medium text-[#333333]"
            type="button"
            variant="outline"
          >
            结束对话
          </Button>
          <Button
            aria-label="Send"
            className="size-10 rounded-[9px] bg-[#0f0f0f] text-white hover:bg-[#0f0f0f]/90"
            size="icon"
            type="button"
          >
            <SendHorizontal className="size-5" strokeWidth={2} />
          </Button>
        </div>
      </div>
    </section>
  )
}

function QuickActions() {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {quickActions.map((action) => (
        <button
          className="flex h-[60px] items-center gap-3 rounded-[12px] border border-[#e9e9e9] bg-white px-4 text-left shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-colors hover:bg-[#f8f8f7]"
          key={action.title}
          type="button"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#f2f2f2] text-[#242424]">
            <action.icon className="size-4" strokeWidth={1.8} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] font-bold text-[#181818]">
              {action.title}
            </span>
            <span className="mt-0.5 block truncate text-[10px] text-[#898989]">
              {action.description}
            </span>
          </span>
          <span className="text-[16px] leading-none text-[#333333]">+</span>
        </button>
      ))}
    </section>
  )
}

function RightPanel() {
  return (
    <aside className="w-full shrink-0 bg-white px-6 py-8 xl:w-[388px]">
      <SectionHeader action="更多数据" title="当前状态" />
      <StatusCard />

      <section className="mt-4 rounded-[12px] border border-[#e8e8e8] bg-white px-4 py-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <span className="grid size-5 place-items-center rounded-full text-[#111111]">
            <Sparkles className="size-4 fill-[#111111]" strokeWidth={2} />
          </span>
          <h3 className="text-[14px] font-bold">Kratos 提醒</h3>
        </div>
        <p className="mt-3 text-[12px] leading-5 text-[#777777]">
          注意右膝恢复，建议避免大量深蹲和跳跃类动作。
        </p>
      </section>

      <div className="mt-9">
        <SectionHeader action="查看完整计划" title="今日训练计划" />
      </div>
      <TrainingPlanCard />
    </aside>
  )
}

function SectionHeader({
  action,
  title,
}: {
  action: string
  title: string
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-[17px] font-bold tracking-[-0.02em]">{title}</h2>
      <button
        className="inline-flex items-center gap-2 text-[11px] font-medium text-[#8a8a8a]"
        type="button"
      >
        {action}
        <ChevronRight className="size-3.5" strokeWidth={1.7} />
      </button>
    </div>
  )
}

function StatusCard() {
  return (
    <section className="mt-4 rounded-[12px] border border-[#e8e8e8] bg-white px-4 py-5 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <div className="grid grid-cols-2 border-b border-[#efefef] pb-4 text-center text-[11px] text-[#8a8a8a]">
        <span>身体状态</span>
        <span className="border-l border-[#efefef]">训练状态</span>
      </div>
      <div className="grid grid-cols-2 gap-y-7 pt-6">
        {metrics.map((metric, index) => (
          <MetricCell isRight={index % 2 === 1} key={metric.label} {...metric} />
        ))}
      </div>
    </section>
  )
}

function MetricCell({
  icon: Icon,
  isRight,
  label,
  unit,
  value,
}: Metric & { isRight: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 px-1",
        isRight && "border-l border-[#efefef] pl-6"
      )}
    >
      <Icon className="size-7 shrink-0 text-[#101010]" strokeWidth={1.7} />
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-[20px] leading-none font-bold tracking-[-0.02em]">
            {value}
          </span>
          {unit ? (
            <span className="text-[11px] font-medium text-[#777777]">
              {unit}
            </span>
          ) : null}
        </div>
        <p className="mt-1.5 text-[11px] text-[#8a8a8a]">{label}</p>
      </div>
    </div>
  )
}

function TrainingPlanCard() {
  return (
    <section className="mt-4 rounded-[12px] border border-[#e8e8e8] bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[13px] leading-5 font-bold">
            酒店护膝下肢训练（20 分钟）
          </h3>
        </div>
        <span className="rounded-full bg-[#e9f5e6] px-2.5 py-1 text-[10px] font-semibold text-[#5d9a5c]">
          已生成
        </span>
      </div>

      <div className="mt-3 overflow-hidden rounded-[8px] border border-[#eeeeee]">
        <ExerciseRow
          illustration="hinge"
          reps="4 组 × 12 次"
          title="哑铃罗马尼亚硬拉"
        />
        <ExerciseRow
          illustration="bridge"
          reps="4 组 × 15 次"
          title="哑铃臀桥"
        />
      </div>

      <div className="mt-8 rounded-[12px] border border-[#ededed] bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[13px] font-bold">热身建议</h3>
            <p className="mt-2 text-[11px] text-[#777777]">
              4分钟动态热身（髋关节激活 + 轻度拉伸）
            </p>
          </div>
          <ChevronRight className="mt-2 size-4 text-[#777777]" />
        </div>
        <Button
          className="mt-6 h-12 w-full rounded-[8px] bg-[#101010] text-[15px] font-semibold text-white hover:bg-[#101010]/90"
          type="button"
        >
          开始训练
        </Button>
      </div>
    </section>
  )
}

function ExerciseRow({
  illustration,
  reps,
  title,
}: {
  illustration: "hinge" | "bridge"
  reps: string
  title: string
}) {
  return (
    <div className="flex min-h-[112px] items-center justify-between gap-3 border-b border-[#eeeeee] px-4 py-3 last:border-b-0">
      <div className="flex min-w-0 gap-3">
        <span className="pt-0.5 text-[12px] font-bold text-[#111111]">
          {illustration === "hinge" ? "1." : "2."}
        </span>
        <div>
          <h4 className="text-[12px] font-bold">{title}</h4>
          <p className="mt-2 text-[12px] text-[#555555]">{reps}</p>
        </div>
      </div>
      <ExerciseIllustration type={illustration} />
    </div>
  )
}

function ExerciseIllustration({ type }: { type: "hinge" | "bridge" }) {
  if (type === "bridge") {
    return (
      <svg
        aria-hidden="true"
        className="h-[70px] w-[138px] shrink-0"
        viewBox="0 0 138 70"
      >
        <path
          d="M20 50c18 0 28-4 39-13 7-6 16-10 28-3l12 7"
          fill="none"
          stroke="#111"
          strokeLinecap="round"
          strokeWidth="7"
        />
        <path
          d="M52 36 73 17c7-6 17-3 21 6l9 20"
          fill="none"
          stroke="#d9d9d9"
          strokeLinecap="round"
          strokeWidth="10"
        />
        <path
          d="M75 18c12 4 22 14 31 29"
          fill="none"
          stroke="#111"
          strokeLinecap="round"
          strokeWidth="2.2"
        />
        <circle cx="18" cy="48" fill="#111" r="8" />
        <rect fill="#111" height="7" rx="2" width="34" x="9" y="46" />
        <circle cx="105" cy="45" fill="#111" r="4" />
        <circle cx="115" cy="47" fill="#111" r="4" />
      </svg>
    )
  }

  return (
    <svg
      aria-hidden="true"
      className="h-[74px] w-[132px] shrink-0"
      viewBox="0 0 132 74"
    >
      <PoseFigure transform="translate(15 5)" variant="stand" />
      <PoseFigure transform="translate(78 9) rotate(11)" variant="hinge" />
    </svg>
  )
}

function PoseFigure({
  transform,
  variant,
}: {
  transform: string
  variant: "stand" | "hinge"
}) {
  const bent = variant === "hinge"

  return (
    <g transform={transform}>
      <circle cx="13" cy="8" fill="#d8d8d8" r="6" stroke="#111" strokeWidth="1" />
      <path
        d={bent ? "M13 15 22 35" : "M13 15 14 37"}
        fill="none"
        stroke="#111"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d={bent ? "M21 35 37 39" : "M14 37 19 57"}
        fill="none"
        stroke="#111"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d={bent ? "M22 35 15 57" : "M14 37 10 58"}
        fill="none"
        stroke="#111"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d={bent ? "M17 25 11 43" : "M13 24 8 43"}
        fill="none"
        stroke="#111"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d={bent ? "M18 25 25 43" : "M15 24 20 43"}
        fill="none"
        stroke="#111"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <circle cx={bent ? "10" : "7"} cy="44" fill="#111" r="4.5" />
      <circle cx={bent ? "26" : "21"} cy="44" fill="#111" r="4.5" />
    </g>
  )
}

export default App
