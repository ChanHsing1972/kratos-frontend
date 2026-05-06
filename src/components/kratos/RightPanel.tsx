import {
  Activity,
  Check,
  ChevronRight,
  Dumbbell,
  LoaderCircle,
  Play,
  Sparkles,
  Target,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import type {
  BodyMetric,
  DetailPanel,
  FitnessProfile,
  Metric,
  OnboardingStatus,
  TrainingPlan,
} from "@/types/kratos"
import { Button } from "@/components/ui/button"
import {
  buildPlanPanel,
  buildReminderPanel,
  getPlanExerciseLines,
} from "@/lib/kratos"
import { cn } from "@/lib/utils"

type RightPanelProps = {
  activePlan: TrainingPlan | null
  completedExercises: string[]
  dashboardLoading: boolean
  latestMetric: BodyMetric | null
  metrics: Metric[]
  onboarding: OnboardingStatus | null
  onEditBodyData: () => void
  onOpenOnboarding: () => void
  onOpenPanel: (panel: DetailPanel) => void
  onToggleExercise: (title: string) => void
  onTrainingButton: () => void
  profile: FitnessProfile | null
  trainingStarted: boolean
}

export function RightPanel({
  activePlan,
  completedExercises,
  dashboardLoading,
  latestMetric,
  metrics,
  onboarding,
  onEditBodyData,
  onOpenOnboarding,
  onOpenPanel,
  onToggleExercise,
  onTrainingButton,
  profile,
  trainingStarted,
}: RightPanelProps) {
  return (
    <aside className="h-full w-full shrink-0 overflow-y-auto border-l border-[#ededed] bg-[#fbfbfa] px-5 py-6 xl:w-[410px]">
      <AgentReadinessCard
        latestMetric={latestMetric}
        onboarding={onboarding}
        onOpenOnboarding={onOpenOnboarding}
        profile={profile}
      />

      <div className="mt-6">
        <SectionHeader
          action="查看完整计划"
          onAction={() => onOpenPanel(buildPlanPanel(activePlan))}
          title="训练计划"
        />
      </div>
      {/* <PlanVisualizer
        activePlan={activePlan}
        completedExercises={completedExercises}
        onOpenPanel={onOpenPanel}
      /> */}
      <TrainingPlanCard
        activePlan={activePlan}
        completedExercises={completedExercises}
        dashboardLoading={dashboardLoading}
        onOpenPanel={onOpenPanel}
        onToggleExercise={onToggleExercise}
        onTrainingButton={onTrainingButton}
        trainingStarted={trainingStarted}
      />

      <div className="mt-7">
        <SectionHeader
          action="更多数据"
          onAction={() =>
            onOpenPanel({
              title: "身体与训练状态",
              body: "登录后这里会展示后端同步的身体指标、训练日志和 Agent 打卡状态。",
              items: [
                "身体指标来自 /api/v1/body-metrics",
                "训练记录来自 /api/v1/workout-logs",
                "Agent 打卡来自 /api/v1/agent-checkins",
              ],
            })
          }
          title="状态仪表"
        />
      </div>
      <StatusCard metrics={metrics} />

      <button
        className="mt-3 w-full rounded-[10px] border border-[#e0e0e0] bg-white px-4 py-3 text-left transition-colors hover:bg-[#f6f6f5] focus-visible:ring-2 focus-visible:ring-[#111111]/30 focus-visible:outline-none"
        onClick={onEditBodyData}
        type="button"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-[#111111]" strokeWidth={1.8} />
            <span className="text-[13px] font-bold">更新今日身体反馈</span>
          </div>
          <ChevronRight className="size-4 text-[#777777]" />
        </div>
      </button>

      <button
        className="mt-3 w-full rounded-[10px] border border-[#e0e0e0] bg-white px-4 py-4 text-left transition-colors hover:bg-[#f6f6f5] focus-visible:ring-2 focus-visible:ring-[#111111]/30 focus-visible:outline-none"
        onClick={() => onOpenPanel(buildReminderPanel(activePlan))}
        type="button"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 fill-[#111111]" strokeWidth={2} />
          <h3 className="text-[14px] font-bold">Kratos 下一步</h3>
        </div>
        <p className="mt-2 text-[12px] leading-5 text-[#777777]">
          {onboarding?.next_steps?.[0] ??
            "让 Agent 生成今日训练、饮食补给或恢复建议。"}
        </p>
      </button>
    </aside>
  )
}

function AgentReadinessCard({
  latestMetric,
  onboarding,
  onOpenOnboarding,
  profile,
}: {
  latestMetric: BodyMetric | null
  onboarding: OnboardingStatus | null
  onOpenOnboarding: () => void
  profile: FitnessProfile | null
}) {
  const ready = onboarding?.ready_for_agent ?? false

  return (
    <section className="mb-7 rounded-[12px] border border-[#e8e8e8] bg-[#fbfbfa] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-black tracking-[-0.02em]">
            Agent 上下文
          </h2>
          <p className="mt-1 text-[12px] leading-5 text-[#666666]">
            {ready
              ? "每次回复前都会读取你的目标、身体数据和近期记录。"
              : "先补齐关键字段，训练和饮食建议会更像真的为你定制。"}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold",
            ready ? "bg-[#111111] text-white" : "bg-[#fff3d6] text-[#8a6100]"
          )}
        >
          {ready ? "已就绪" : "待完善"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <ContextPill
          icon={Target}
          label="目标"
          value={profile?.fitness_goal ?? "未设置"}
        />
        <ContextPill
          icon={Dumbbell}
          label="体重"
          value={latestMetric?.weight_kg ? `${latestMetric.weight_kg} kg` : "未记录"}
        />
      </div>

      <button
        className="mt-3 flex w-full items-center justify-between gap-3 rounded-[10px] border border-[#e3e3e3] bg-white px-3 py-2.5 text-left text-[12px] font-bold text-[#222222] transition-colors hover:bg-[#f6f6f5] focus-visible:ring-2 focus-visible:ring-[#111111]/30 focus-visible:outline-none"
        onClick={onOpenOnboarding}
        type="button"
      >
        {ready ? "查看或更新建档信息" : onboarding?.next_steps?.[0] ?? "开始 2 分钟建档"}
        <ChevronRight className="size-3.5 text-[#777777]" />
      </button>
    </section>
  )
}

function ContextPill({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="rounded-[10px] border border-[#eeeeee] bg-white px-3 py-2">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#777777]">
        <Icon className="size-3.5" strokeWidth={1.8} />
        {label}
      </div>
      <p className="mt-1 truncate text-[13px] font-black text-[#111111]">
        {value}
      </p>
    </div>
  )
}

function SectionHeader({
  action,
  onAction,
  title,
}: {
  action: string
  onAction: () => void
  title: string
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-[17px] font-bold tracking-[-0.02em]">{title}</h2>
      <button
        className="inline-flex items-center gap-2 rounded-[8px] text-[11px] font-medium text-[#8a8a8a] hover:text-[#111111] focus-visible:ring-2 focus-visible:ring-[#111111]/30 focus-visible:outline-none"
        onClick={onAction}
        type="button"
      >
        {action}
        <ChevronRight className="size-3.5" strokeWidth={1.7} />
      </button>
    </div>
  )
}

function StatusCard({ metrics }: { metrics: Metric[] }) {
  return (
    <section className="mt-2 rounded-[12px] border border-[#e8e8e8] bg-white px-4 py-5 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
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

function TrainingPlanCard({
  activePlan,
  completedExercises,
  dashboardLoading,
  onOpenPanel,
  onToggleExercise,
  onTrainingButton,
  trainingStarted,
}: {
  activePlan: TrainingPlan | null
  completedExercises: string[]
  dashboardLoading: boolean
  onOpenPanel: (panel: DetailPanel) => void
  onToggleExercise: (title: string) => void
  onTrainingButton: () => void
  trainingStarted: boolean
}) {
  const exercises = getPlanExerciseLines(activePlan)
  const allDone = completedExercises.length >= 2
  const buttonLabel = allDone
    ? "保存完成记录"
    : trainingStarted
      ? "训练进行中"
      : "开始训练"

  return (
    <section className="mt-2 rounded-[12px] border border-[#e8e8e8] bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[13px] leading-5 font-bold">
            {activePlan?.title ?? "酒店护膝下肢训练"}（20 分钟）
          </h3>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[10px] font-semibold",
            allDone
              ? "bg-[#111111] text-white"
              : "bg-[#e9f5e6] text-[#5d9a5c]"
          )}
        >
          {allDone ? "已完成" : "已生成"}
        </span>
      </div>

      <div className="mt-3 overflow-hidden rounded-[8px] border border-[#eeeeee]">
        <ExerciseRow
          completed={completedExercises.includes(exercises[0])}
          illustration="hinge"
          onToggle={() => onToggleExercise(exercises[0])}
          title={exercises[0]}
        />
        <ExerciseRow
          completed={completedExercises.includes(exercises[1])}
          illustration="bridge"
          onToggle={() => onToggleExercise(exercises[1])}
          title={exercises[1]}
        />
      </div>

      <button
        className="mt-3 w-full rounded-[12px] border border-[#ededed] bg-white p-4 text-left transition-colors hover:bg-[#fbfbfa] focus-visible:ring-2 focus-visible:ring-[#111111]/30 focus-visible:outline-none"
        onClick={() =>
          onOpenPanel({
            title: "热身建议",
            body: "先做 4 分钟动态热身，让髋关节和臀部进入状态，降低膝盖代偿。",
            items: [
              "髋环绕 45 秒",
              "臀桥激活 60 秒",
              "轻度腘绳肌拉伸 60 秒",
              "空手髋铰链练习 75 秒",
            ],
          })
        }
        type="button"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[13px] font-bold">热身建议</h3>
            <p className="mt-2 text-[11px] text-[#777777]">
              4分钟动态热身（髋关节激活 + 轻度拉伸）
            </p>
          </div>
          <ChevronRight className="mt-2 size-4 text-[#777777]" />
        </div>
      </button>
      <Button
        className="mt-3 h-12 w-full rounded-[8px] bg-[#101010] text-[15px] font-semibold text-white hover:bg-[#101010]/90"
        disabled={dashboardLoading}
        onClick={onTrainingButton}
        type="button"
      >
        {dashboardLoading || (trainingStarted && !allDone) ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Play className="size-4" />
        )}
        {buttonLabel}
      </Button>
    </section>
  )
}

function ExerciseRow({
  completed,
  illustration,
  onToggle,
  title,
}: {
  completed: boolean
  illustration: "hinge" | "bridge"
  onToggle: () => void
  title: string
}) {
  const [name, detail] = title.split(/\s+(?=\d+\s*组)/)

  return (
    <button
      className={cn(
        "flex min-h-[100px] w-full items-center justify-between gap-3 border-b border-[#eeeeee] px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[#fbfbfa] focus-visible:ring-2 focus-visible:ring-[#111111]/30 focus-visible:outline-none",
        completed && "bg-[#f6f6f5]"
      )}
      onClick={onToggle}
      type="button"
    >
      <div className="flex min-w-0 gap-2">
        <span
          className={cn(
            "grid size-5 place-items-center rounded-full pt-px text-[12px] font-bold text-[#111111]",
            completed && "bg-[#111111] text-white"
          )}
        >
          {completed ? (
            <Check className="size-3" />
          ) : illustration === "hinge" ? (
            "1."
          ) : (
            "2."
          )}
        </span>
        <div>
          <h4 className="text-[12px] font-bold">{name}</h4>
          <p className="mt-2 text-[12px] text-[#555555]">
            {detail ?? "按计划完成"}
          </p>
        </div>
      </div>
      <ExerciseIllustration type={illustration} />
    </button>
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
