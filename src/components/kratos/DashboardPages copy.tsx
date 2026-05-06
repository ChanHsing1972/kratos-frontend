import {
  Activity,
  BarChart3,
  Check,
  ChevronRight,
  Dumbbell,
  PlusCircle,
  Target,
  Timer,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { buildPlanPanel, getPlanExerciseLines } from "@/lib/kratos"
import { cn } from "@/lib/utils"
import type {
  AgentCheckin,
  BodyMetric,
  DetailPanel,
  FitnessProfile,
  OnboardingStatus,
  TrainingPlan,
  WorkoutLog,
} from "@/types/kratos"

type TrainingPlanPageProps = {
  activePlan: TrainingPlan | null
  completedExercises: string[]
  dashboardLoading: boolean
  onOpenPanel: (panel: DetailPanel) => void
  onToggleExercise: (title: string) => void
  onTrainingButton: () => void
  profile: FitnessProfile | null
  trainingPlans: TrainingPlan[]
  trainingStarted: boolean
  workoutLogs: WorkoutLog[]
}

export function TrainingPlanPage({
  activePlan,
  completedExercises,
  dashboardLoading,
  onOpenPanel,
  onToggleExercise,
  onTrainingButton,
  profile,
  trainingPlans,
  trainingStarted,
  workoutLogs,
}: TrainingPlanPageProps) {
  const exercises = getPlanExerciseLines(activePlan)
  const completedLogs = workoutLogs.filter((log) => log.completed)
  const totalMinutes = workoutLogs.reduce(
    (sum, log) => sum + (log.duration_minutes ?? 0),
    0
  )
  const completionTarget = Math.max(
    1,
    profile?.available_days_per_week ?? exercises.length
  )
  const progress = Math.min(
    100,
    Math.round((completedLogs.length / completionTarget) * 100)
  )
  const rows = buildScheduleRows(activePlan, workoutLogs)

  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-white">
      <div className="mx-auto min-h-full w-full max-w-[1180px] px-8 py-8 xl:px-10">
        <PageHeader
          title="训练计划"
          subtitle="只展示后端数据库中已有的计划、训练记录和档案字段。"
          actions={
            <Button
              className="h-10 rounded-[8px] bg-[#111111] px-5 text-[13px] font-bold text-white hover:bg-[#111111]/90"
              onClick={() => onOpenPanel(buildPlanPanel(activePlan))}
              type="button"
            >
              查看完整计划
            </Button>
          }
        />

        <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="min-w-0">
            <section className="rounded-[12px] border border-[#e8e8e8] bg-white p-6">
              <p className="text-[12px] font-semibold text-[#8a8a8a]">
                当前计划
              </p>
              <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-[24px] leading-tight font-black tracking-[-0.04em]">
                    {activePlan?.title ?? "暂无训练计划"}
                  </h2>
                  <p className="mt-4 max-w-[680px] text-[14px] leading-7 text-[#666666]">
                    {activePlan?.summary ??
                      activePlan?.goal ??
                      "数据库中还没有可展示的训练计划。你可以在对话里让 Agent 生成计划，生成后这里会同步展示。"}
                  </p>
                </div>
                <span className="rounded-full bg-[#f4f4f4] px-3 py-1 text-[11px] font-bold text-[#666666]">
                  {activePlan?.status ?? "未录入"}
                </span>
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-4">
                <InfoPill label="目标" value={activePlan?.goal ?? "未录入"} />
                <InfoPill
                  label="开始"
                  value={formatDate(activePlan?.start_date)}
                />
                <InfoPill label="结束" value={formatDate(activePlan?.end_date)} />
                <InfoPill
                  label="单次时长"
                  value={
                    profile?.workout_minutes_per_session
                      ? `${profile.workout_minutes_per_session} 分钟`
                      : "未录入"
                  }
                />
              </div>
            </section>

            <section className="mt-6 rounded-[12px] border border-[#e8e8e8] bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-[17px] font-black">训练安排</h3>
                  <p className="mt-1 text-[12px] text-[#8a8a8a]">
                    来自 `weekly_schedule` 和最近训练日志。
                  </p>
                </div>
                <span className="text-[12px] font-bold text-[#777777]">
                  {completedLogs.length}/{completionTarget} 次完成
                </span>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eeeeee]">
                <div
                  className="h-full rounded-full bg-[#111111]"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-5 overflow-hidden rounded-[10px] border border-[#eeeeee]">
                {rows.length > 0 ? (
                  rows.map((row, index) => (
                    <button
                      className="flex min-h-[64px] w-full items-center gap-4 border-b border-[#eeeeee] px-4 text-left last:border-b-0 hover:bg-[#fbfbfb]"
                      key={`${row.title}-${index}`}
                      onClick={() => row.fromPlan && onToggleExercise(row.title)}
                      type="button"
                    >
                      <ScheduleDot
                        active={row.fromPlan}
                        completed={completedExercises.includes(row.title)}
                        index={index + 1}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-black">
                          {row.title}
                        </p>
                        <p className="mt-1 text-[12px] text-[#8a8a8a]">
                          {row.meta}
                        </p>
                      </div>
                      <ChevronRight className="size-4 text-[#9a9a9a]" />
                    </button>
                  ))
                ) : (
                  <EmptyState text="暂无计划动作或训练日志。" />
                )}
              </div>

              <Button
                className="mt-4 h-11 w-full rounded-[8px] bg-[#111111] text-[14px] font-bold text-white hover:bg-[#111111]/90"
                disabled={dashboardLoading || !activePlan}
                onClick={onTrainingButton}
                type="button"
              >
                <Dumbbell className="size-4" />
                {trainingStarted ? "训练进行中" : "开始训练"}
              </Button>
            </section>
          </section>

          <aside className="space-y-4">
            <Panel title="训练概览">
              <div className="grid grid-cols-2 gap-y-5">
                <OverviewMetric
                  icon={Timer}
                  label="累计时长"
                  value={totalMinutes ? `${totalMinutes}` : "未录入"}
                  unit={totalMinutes ? "min" : ""}
                />
                <OverviewMetric
                  icon={Check}
                  label="完成训练"
                  value={completedLogs.length.toString()}
                  unit="次"
                  bordered
                />
                <OverviewMetric
                  icon={Target}
                  label="计划数量"
                  value={trainingPlans.length.toString()}
                  unit="个"
                />
                <OverviewMetric
                  icon={Activity}
                  label="完成度"
                  value={workoutLogs.length ? `${progress}` : "暂无"}
                  unit={workoutLogs.length ? "%" : ""}
                  bordered
                />
              </div>
            </Panel>

            <Panel title="营养与恢复">
              <KeyValue
                label="营养建议"
                value={activePlan?.nutrition_guidance ?? "未录入"}
              />
              <KeyValue
                label="恢复建议"
                value={activePlan?.recovery_guidance ?? "未录入"}
              />
            </Panel>

            <Panel title="最近训练日志">
              <div className="divide-y divide-[#eeeeee]">
                {workoutLogs.slice(0, 5).map((log) => (
                  <div className="py-3" key={log.id}>
                    <p className="text-[13px] font-bold">
                      {log.title ?? log.workout_type ?? "未命名训练"}
                    </p>
                    <p className="mt-1 text-[12px] text-[#8a8a8a]">
                      {formatDate(log.workout_date)} ·{" "}
                      {log.duration_minutes
                        ? `${log.duration_minutes} 分钟`
                        : "时长未录入"}
                    </p>
                  </div>
                ))}
                {workoutLogs.length === 0 ? (
                  <EmptyState text="暂无训练日志。" />
                ) : null}
              </div>
            </Panel>
          </aside>
        </div>
      </div>
    </main>
  )
}

type BodyDataPageProps = {
  bodyMetrics: BodyMetric[]
  latestCheckin: AgentCheckin | null
  latestMetric: BodyMetric | null
  onEditBodyData: () => void
  onboarding: OnboardingStatus | null
  profile: FitnessProfile | null
  workoutLogs: WorkoutLog[]
}

export function BodyDataPage({
  bodyMetrics,
  latestCheckin,
  latestMetric,
  onEditBodyData,
  onboarding,
  profile,
  workoutLogs,
}: BodyDataPageProps) {
  const sortedMetrics = [...bodyMetrics].sort(
    (left, right) =>
      new Date(left.recorded_at).getTime() - new Date(right.recorded_at).getTime()
  )
  const weightPoints = sortedMetrics
    .map((metric) => metric.weight_kg)
    .filter((value): value is number => typeof value === "number")
  const bodyFatPoints = sortedMetrics
    .map((metric) => metric.body_fat_percentage)
    .filter((value): value is number => typeof value === "number")

  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-white">
      <div className="mx-auto min-h-full w-full max-w-[1180px] px-8 py-8 xl:px-10">
        <PageHeader
          title="身体数据"
          subtitle="只展示后端数据库中已有的身体指标、打卡和训练记录。"
          actions={
            <Button
              className="h-10 rounded-[8px] bg-[#111111] px-5 text-[13px] font-bold text-white hover:bg-[#111111]/90"
              onClick={onEditBodyData}
              type="button"
            >
              <PlusCircle className="size-4" />
              数据录入
            </Button>
          }
        />

        <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="min-w-0">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="体重"
                unit="kg"
                value={formatNumber(latestMetric?.weight_kg)}
              />
              <MetricCard
                label="目标体重"
                unit="kg"
                value={formatNumber(latestMetric?.target_weight_kg)}
              />
              <MetricCard
                label="体脂率"
                unit="%"
                value={formatNumber(latestMetric?.body_fat_percentage)}
              />
              <MetricCard
                label="BMI"
                value={formatNumber(latestMetric?.bmi)}
              />
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <Panel title="体重趋势">
                {weightPoints.length >= 2 ? (
                  <LineChart points={weightPoints} />
                ) : (
                  <EmptyState text="至少录入 2 条体重数据后显示趋势。" />
                )}
              </Panel>
              <Panel title="体脂率趋势">
                {bodyFatPoints.length >= 2 ? (
                  <LineChart points={bodyFatPoints} />
                ) : (
                  <EmptyState text="至少录入 2 条体脂率数据后显示趋势。" />
                )}
              </Panel>
            </div>

            <Panel className="mt-5" title="最近身体记录">
              <div className="divide-y divide-[#eeeeee]">
                {bodyMetrics.slice(0, 8).map((metric) => (
                  <div
                    className="grid gap-3 py-3 text-[13px] sm:grid-cols-5"
                    key={metric.id}
                  >
                    <span className="font-bold">
                      {formatDate(metric.recorded_at)}
                    </span>
                    <span>体重：{valueWithUnit(metric.weight_kg, "kg")}</span>
                    <span>体脂：{valueWithUnit(metric.body_fat_percentage, "%")}</span>
                    <span>BMI：{formatNumber(metric.bmi)}</span>
                    <span className="truncate text-[#777777]">
                      {metric.notes ?? "无备注"}
                    </span>
                  </div>
                ))}
                {bodyMetrics.length === 0 ? (
                  <EmptyState text="暂无身体数据。" />
                ) : null}
              </div>
            </Panel>
          </section>

          <aside className="space-y-4">
            <Panel title="身体概览">
              <div className="grid grid-cols-2 gap-y-5">
                <BodyOverviewCell
                  label="身高"
                  value={valueWithUnit(latestMetric?.height_cm, "cm")}
                />
                <BodyOverviewCell
                  bordered
                  label="腰围"
                  value={valueWithUnit(latestMetric?.waist_cm, "cm")}
                />
                <BodyOverviewCell
                  label="骨骼肌"
                  value={valueWithUnit(latestMetric?.skeletal_muscle_mass_kg, "kg")}
                />
                <BodyOverviewCell
                  bordered
                  label="睡眠"
                  value={valueWithUnit(latestMetric?.sleep_hours, "h")}
                />
              </div>
            </Panel>

            <Panel title="档案上下文">
              <KeyValue label="目标" value={profile?.fitness_goal ?? "未录入"} />
              <KeyValue label="经验" value={profile?.experience_level ?? "未录入"} />
              <KeyValue
                label="每周可练"
                value={
                  profile?.available_days_per_week
                    ? `${profile.available_days_per_week} 天`
                    : "未录入"
                }
              />
              <KeyValue
                label="器械"
                value={profile?.equipment_access ?? "未录入"}
              />
            </Panel>

            <Panel title="最近状态打卡">
              <KeyValue
                label="精力"
                value={valueWithUnit(latestCheckin?.energy_level, "/10")}
              />
              <KeyValue
                label="睡眠质量"
                value={valueWithUnit(latestCheckin?.sleep_quality, "/10")}
              />
              <KeyValue
                label="酸痛"
                value={valueWithUnit(latestCheckin?.soreness_level, "/10")}
              />
              <KeyValue label="总结" value={latestCheckin?.summary ?? "暂无打卡"} />
            </Panel>

            <Panel title="数据状态">
              <KeyValue
                label="档案"
                value={onboarding?.profile_complete ? "已完善" : "待完善"}
              />
              <KeyValue
                label="身体指标"
                value={onboarding?.body_metrics_complete ? "已录入" : "待录入"}
              />
              <KeyValue
                label="训练记录"
                value={`${workoutLogs.length} 条`}
              />
            </Panel>
          </aside>
        </div>
      </div>
    </main>
  )
}

export function EvaluationPage() {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-white px-10 py-8">
      <PageHeader title="评估平台" subtitle="Beta 模块暂保留入口。" />
      <section className="mt-8 rounded-[12px] border border-[#e8e8e8] p-8">
        <BarChart3 className="size-6 text-[#111111]" />
        <h2 className="mt-4 text-[20px] font-black">综合评估待开放</h2>
        <p className="mt-2 text-[14px] leading-7 text-[#777777]">
          后续可接入身体数据、训练日志和 Agent 轨迹生成综合评估报告。
        </p>
      </section>
    </main>
  )
}

function PageHeader({
  actions,
  subtitle,
  title,
}: {
  actions?: ReactNode
  subtitle?: string
  title: string
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-[28px] leading-tight font-black tracking-[-0.05em]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 text-[13px] text-[#8a8a8a]">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </header>
  )
}

function Panel({
  children,
  className,
  title,
}: {
  children: ReactNode
  className?: string
  title: string
}) {
  return (
    <section
      className={cn(
        "rounded-[12px] border border-[#e8e8e8] bg-white p-5",
        className
      )}
    >
      <h3 className="text-[16px] font-black tracking-[-0.02em]">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[9px] border border-[#eeeeee] bg-[#fbfbfa] px-3 py-3">
      <p className="text-[11px] font-semibold text-[#8a8a8a]">{label}</p>
      <p className="mt-1 truncate text-[13px] font-black">{value}</p>
    </div>
  )
}

function MetricCard({
  label,
  unit,
  value,
}: {
  label: string
  unit?: string
  value: string
}) {
  return (
    <section className="rounded-[10px] border border-[#e8e8e8] bg-white p-4">
      <p className="text-[12px] font-semibold text-[#777777]">{label}</p>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-[24px] font-black">{value}</span>
        {value !== "未录入" && unit ? (
          <span className="text-[12px] font-semibold text-[#777777]">{unit}</span>
        ) : null}
      </div>
    </section>
  )
}

function OverviewMetric({
  bordered,
  icon: Icon,
  label,
  unit,
  value,
}: {
  bordered?: boolean
  icon: LucideIcon
  label: string
  unit: string
  value: string
}) {
  return (
    <div className={cn("flex gap-3 px-3 py-2", bordered && "border-l border-[#eeeeee]")}>
      <Icon className="mt-1 size-5 shrink-0" strokeWidth={1.8} />
      <div>
        <p className="text-[12px] font-semibold text-[#9a9a9a]">{label}</p>
        <p className="mt-1 text-[20px] leading-none font-black">
          {value}
          {unit ? (
            <span className="ml-1 text-[11px] font-semibold text-[#777777]">
              {unit}
            </span>
          ) : null}
        </p>
      </div>
    </div>
  )
}

function BodyOverviewCell({
  bordered,
  label,
  value,
}: {
  bordered?: boolean
  label: string
  value: string
}) {
  return (
    <div className={cn("px-4 py-3", bordered && "border-l border-[#eeeeee]")}>
      <p className="text-[12px] font-semibold text-[#8a8a8a]">{label}</p>
      <p className="mt-2 text-[18px] font-black">{value}</p>
    </div>
  )
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-[#eeeeee] py-3 last:border-b-0">
      <p className="text-[11px] font-semibold text-[#8a8a8a]">{label}</p>
      <p className="mt-1 text-[13px] leading-5 font-semibold text-[#222222]">
        {value}
      </p>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[10px] border border-dashed border-[#dddddd] bg-[#fbfbfa] px-4 py-6 text-center text-[13px] text-[#888888]">
      {text}
    </div>
  )
}

function ScheduleDot({
  active,
  completed,
  index,
}: {
  active?: boolean
  completed?: boolean
  index: number
}) {
  if (completed) {
    return (
      <span className="grid size-7 place-items-center rounded-full bg-[#111111] text-white">
        <Check className="size-4" />
      </span>
    )
  }

  if (active) {
    return (
      <span className="grid size-7 place-items-center rounded-full border-2 border-[#111111]">
        <span className="size-3 rounded-full bg-[#111111]" />
      </span>
    )
  }

  return (
    <span className="grid size-7 place-items-center rounded-full border border-[#d8d8d8] text-[13px] font-bold text-[#b0b0b0]">
      {index}
    </span>
  )
}

function LineChart({ points }: { points: number[] }) {
  const min = Math.min(...points)
  const max = Math.max(...points)
  const width = 640
  const height = 210
  const step = points.length > 1 ? width / (points.length - 1) : width
  const range = max - min || 1
  const path = points
    .map((point, index) => {
      const x = index * step
      const y = height - ((point - min) / range) * (height - 34) - 17
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(" ")

  return (
    <svg className="h-auto w-full" viewBox={`0 0 ${width} ${height}`}>
      {[0, 1, 2, 3].map((line) => (
        <line
          key={line}
          stroke="#e9e9e9"
          strokeDasharray="3 4"
          x1="0"
          x2={width}
          y1={24 + line * 48}
          y2={24 + line * 48}
        />
      ))}
      <path
        d={path}
        fill="none"
        stroke="#111111"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
    </svg>
  )
}

function buildScheduleRows(plan: TrainingPlan | null, logs: WorkoutLog[]) {
  const planRows = plan
    ? getPlanExerciseLines(plan).map((title) => ({
        fromPlan: true,
        meta: "来自当前训练计划",
        title,
      }))
    : []
  const logRows = logs.slice(0, 5).map((log) => ({
    fromPlan: false,
    meta: `${formatDate(log.workout_date)} · ${
      log.duration_minutes ? `${log.duration_minutes} 分钟` : "时长未录入"
    }`,
    title: log.title ?? log.workout_type ?? "未命名训练",
  }))

  return [...planRows, ...logRows]
}

function formatNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(1)
    : "未录入"
}

function valueWithUnit(value: number | null | undefined, unit: string) {
  return typeof value === "number" && Number.isFinite(value)
    ? `${value}${unit}`
    : "未录入"
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "未录入"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}
