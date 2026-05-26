import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  Dumbbell,
  Gauge,
  History,
  Info,
  MoonStar,
  Pencil,
  Plus,
  Ruler,
  Scale,
  Trash2,
  TrendingUp,
  WandSparkles,
} from "lucide-react"

import type {
  AgentCheckin,
  BodyMetric,
  FitnessProfile,
  OnboardingStatus,
  WorkoutLog,
} from "@/entities/kratos/model/types"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty"
import { Progress } from "@/shared/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"

type BodyDataPageProps = {
  bodyMetrics: BodyMetric[]
  latestCheckin: AgentCheckin | null
  latestMetric: BodyMetric | null
  onEditBodyData: () => void
  onEditBodyMetric: (metric: BodyMetric) => void
  onDeleteBodyMetric: (metric: BodyMetric) => void
  onExportBodyData: () => void
  onboarding: OnboardingStatus | null
  profile: FitnessProfile | null
  workoutLogs: WorkoutLog[]
}

type MetricPoint = {
  date: string
  value: number
}

export function BodyDataPage({
  bodyMetrics,
  latestCheckin,
  latestMetric,
  onEditBodyData,
  onEditBodyMetric,
  onDeleteBodyMetric,
  onExportBodyData,
  onboarding,
  profile,
  workoutLogs,
}: BodyDataPageProps) {
  const weightSeries = getMetricSeries(bodyMetrics, "weight_kg")
  const bodyFatSeries = getMetricSeries(bodyMetrics, "body_fat_percentage")
  const muscleSeries = getMetricSeries(bodyMetrics, "skeletal_muscle_mass_kg")
  const recovery = getRecoveryGuidance(latestCheckin)
  const completedLogs = workoutLogs.filter((log) => log.completed)
  const weight = latestMetric?.weight_kg ?? null
  const targetWeight = latestMetric?.target_weight_kg ?? null
  const targetProgress = calculateTargetProgress(weightSeries[0]?.value ?? null, weight, targetWeight)

  return (
    <main className="scrollbar-none min-h-0 flex-1 overflow-y-auto bg-muted/40">
      <section className="mx-auto mt-16 flex min-h-full w-full max-w-[900px] flex-col px-6 pb-12 sm:px-8">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm text-muted-foreground">身体与恢复</p>
            <h1 className="mt-1 text-3xl font-medium tracking-[-0.05em]">今天适合怎么练？</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              恢复打卡决定今天的训练强度，身体趋势帮助 Kratos 调整下一周，而不是用单次数字评价您。
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button onClick={onExportBodyData} type="button" variant="ghost">
              <Download />
              导出
            </Button>
            <Button onClick={onEditBodyData} type="button">
              <Plus />
              记录今天状态
            </Button>
          </div>
        </header>

        <RecoveryHero
          latestCheckin={latestCheckin}
          latestMetric={latestMetric}
          onCheckin={onEditBodyData}
          recovery={recovery}
        />

        <Tabs className="mt-12" defaultValue="trend">
          <TabsList aria-label="身体数据查看范围" variant="line">
            <TabsTrigger value="trend">
              <TrendingUp />
              趋势
            </TabsTrigger>
            <TabsTrigger value="training">
              <Dumbbell />
              训练反馈
            </TabsTrigger>
            <TabsTrigger value="records">
              <History />
              记录与隐私
            </TabsTrigger>
          </TabsList>

          <TabsContent className="mt-4 space-y-4" value="trend">
            <TrendPanel
              bodyFatSeries={bodyFatSeries}
              latestMetric={latestMetric}
              muscleSeries={muscleSeries}
              profile={profile}
              targetProgress={targetProgress}
              targetWeight={targetWeight}
              weightSeries={weightSeries}
            />
          </TabsContent>

          <TabsContent className="mt-4" value="training">
            <TrainingFeedbackPanel logs={completedLogs} />
          </TabsContent>

          <TabsContent className="mt-4 space-y-4" value="records">
            <RecordsPanel
              bodyMetrics={bodyMetrics}
              latestMetric={latestMetric}
              onDeleteBodyMetric={onDeleteBodyMetric}
              onEditBodyMetric={onEditBodyMetric}
              onboarding={onboarding}
            />
          </TabsContent>
        </Tabs>
      </section>
    </main>
  )
}

function RecoveryHero({
  latestCheckin,
  latestMetric,
  onCheckin,
  recovery,
}: {
  latestCheckin: AgentCheckin | null
  latestMetric: BodyMetric | null
  onCheckin: () => void
  recovery: RecoveryGuidance
}) {
  const dataDate = latestCheckin?.checkin_date ?? latestCheckin?.created_at

  return (
    <section className="mt-12">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <div className="flex items-center gap-2">
            <Badge className={recovery.badgeClass} variant="outline">
              <recovery.icon className="size-3.5" />
              {recovery.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {dataDate ? `${formatFullDate(dataDate)} 打卡` : "尚未打卡"}
            </span>
          </div>
          <h2 className="mt-4 text-2xl leading-tight font-medium tracking-[-0.04em]">
            {recovery.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{recovery.description}</p>
        </div>
        {!latestCheckin ? (
          <Button onClick={onCheckin} type="button" variant="outline">
            进行恢复打卡
            <ArrowRight />
          </Button>
        ) : null}
      </div>

      <Card className="mt-8 gap-0 py-0">
        <div className="grid sm:grid-cols-4">
          <StatusMetric
            icon={MoonStar}
            label="睡眠"
            note="恢复基础"
            value={formatMetricWithUnit(latestCheckin?.sleep_hours ?? latestMetric?.sleep_hours, "h")}
          />
          <StatusMetric
            icon={Activity}
            label="精力"
            note="主观活力"
            value={formatScore(latestCheckin?.energy_level)}
          />
          <StatusMetric
            icon={Gauge}
            label="酸痛"
            note="训练风险"
            value={formatScore(latestCheckin?.soreness_level)}
          />
          <StatusMetric
            icon={Scale}
            label="体重"
            note="低频趋势"
            value={formatMetricWithUnit(latestMetric?.weight_kg, "kg")}
          />
        </div>
      </Card>
    </section>
  )
}

function StatusMetric({
  icon: Icon,
  label,
  note,
  value,
}: {
  icon: typeof Activity
  label: string
  note: string
  value: string
}) {
  return (
    <div className="flex min-h-27 gap-3 px-5 py-5 not-last:border-b sm:not-last:border-r sm:not-last:border-b-0">
      <Icon className="mt-1 size-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-medium tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{note}</p>
      </div>
    </div>
  )
}

function TrendPanel({
  bodyFatSeries,
  latestMetric,
  muscleSeries,
  profile,
  targetProgress,
  targetWeight,
  weightSeries,
}: {
  bodyFatSeries: MetricPoint[]
  latestMetric: BodyMetric | null
  muscleSeries: MetricPoint[]
  profile: FitnessProfile | null
  targetProgress: number | null
  targetWeight: number | null
  weightSeries: MetricPoint[]
}) {
  const bmi = latestMetric?.bmi ?? calculateBmi(latestMetric)
  const measurements = [
    {
      label: "体脂率",
      value: formatMetricWithUnit(latestMetric?.body_fat_percentage, "%"),
      change: formatMetricChange(bodyFatSeries, "%"),
    },
    {
      label: "骨骼肌",
      value: formatMetricWithUnit(latestMetric?.skeletal_muscle_mass_kg, "kg"),
      change: formatMetricChange(muscleSeries, "kg"),
    },
    {
      label: "BMI",
      value: formatMetricValue(bmi),
      change: bmi ? getBmiLevel(bmi) : "待记录",
    },
    {
      label: "基础代谢",
      value: calculateBmr(profile, latestMetric)
        ? `${calculateBmr(profile, latestMetric)} kcal`
        : "待补全",
      change: "画像估算",
    },
  ]

  return (
    <>
      <Card>
        <CardHeader className="sm:grid-cols-[1fr_auto]">
          <div>
            <CardTitle>体重趋势</CardTitle>
            <CardDescription>推荐每周固定条件记录一次，用长期方向辅助训练调整。</CardDescription>
          </div>
          <div className="mt-3 text-left sm:mt-0 sm:text-right">
            <p className="text-2xl font-medium">{formatMetricWithUnit(latestMetric?.weight_kg, "kg")}</p>
            <p className="text-xs text-muted-foreground">{formatMetricChange(weightSeries, "kg")}</p>
          </div>
        </CardHeader>
        <CardContent>
          <LineChart series={weightSeries} unit="kg" />
          {typeof targetProgress === "number" ? (
            <div className="mt-6 rounded-xl bg-muted/50 p-4">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span>目标体重 {formatMetricWithUnit(targetWeight, "kg")}</span>
                <span className="text-muted-foreground">{targetProgress}%</span>
              </div>
              <Progress value={targetProgress} />
            </div>
          ) : null}
        </CardContent>
      </Card>
      <div className="grid gap-3 sm:grid-cols-4">
        {measurements.map((item) => (
          <div className="rounded-xl bg-card px-4 py-4 ring-1 ring-foreground/10" key={item.label}>
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-lg font-medium">{item.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.change}</p>
          </div>
        ))}
      </div>
    </>
  )
}

function TrainingFeedbackPanel({ logs }: { logs: WorkoutLog[] }) {
  const totalMinutes = logs.reduce((total, log) => total + (log.duration_minutes ?? 0), 0)
  const setCount = logs.reduce(
    (total, log) =>
      total + log.exercises.reduce((count, exercise) => count + exercise.sets.length, 0),
    0
  )

  if (!logs.length) {
    return (
      <Empty className="min-h-64 border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Dumbbell />
          </EmptyMedia>
          <EmptyTitle>完成训练后，这里会变得有用</EmptyTitle>
          <EmptyDescription>
            实际完成情况、RPE 与疼痛反馈会帮助 Kratos 决定下一次维持、加量或降级。
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>训练反馈如何影响计划</CardTitle>
        <CardDescription>
          连续完成且恢复良好时才建议进阶；高强度或疼痛记录会优先保护恢复。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-5 rounded-xl bg-muted/45 p-5 sm:grid-cols-3">
          <SummaryValue label="已完成训练" value={`${logs.length} 次`} />
          <SummaryValue label="累计训练时长" value={`${totalMinutes} 分钟`} />
          <SummaryValue label="已记录组次" value={`${setCount} 组`} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-medium">最近训练</h3>
          <div className="divide-y">
            {logs.slice(0, 5).map((log) => (
              <div className="flex items-center justify-between gap-4 py-4" key={log.id}>
                <div className="min-w-0">
                  <p className="truncate font-medium">{log.title ?? "训练记录"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatFullDate(log.workout_date)} · {log.duration_minutes ?? 0} 分钟
                  </p>
                </div>
                <Badge variant="outline">
                  RPE {log.perceived_exertion ?? "未填"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RecordsPanel({
  bodyMetrics,
  latestMetric,
  onDeleteBodyMetric,
  onEditBodyMetric,
  onboarding,
}: {
  bodyMetrics: BodyMetric[]
  latestMetric: BodyMetric | null
  onDeleteBodyMetric: (metric: BodyMetric) => void
  onEditBodyMetric: (metric: BodyMetric) => void
  onboarding: OnboardingStatus | null
}) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>身体测量记录</CardTitle>
          <CardDescription>每次录入独立保留，可修正误录；趋势只使用您确认保存的数据。</CardDescription>
        </CardHeader>
        <CardContent>
          {bodyMetrics.length ? (
            <div className="divide-y">
              {bodyMetrics.slice(0, 10).map((metric) => (
                <div className="flex items-center gap-4 py-4" key={metric.id}>
                  <div className="w-24 shrink-0 text-sm text-muted-foreground">
                    {formatFullDate(metric.measured_at ?? metric.recorded_at)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{formatMetricWithUnit(metric.weight_kg, "kg")}</p>
                    <p className="text-xs text-muted-foreground">{formatMetricSource(metric.source)}</p>
                  </div>
                  <Button
                    aria-label="编辑测量记录"
                    onClick={() => onEditBodyMetric(metric)}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    <Pencil />
                  </Button>
                  <Button
                    aria-label="删除测量记录"
                    onClick={() => onDeleteBodyMetric(metric)}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">还没有身体测量记录。</p>
          )}
        </CardContent>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="size-4" />
              最近围度
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <RecordLine label="胸围" value={formatMetricWithUnit(latestMetric?.chest_cm, "cm")} />
            <RecordLine label="腰围" value={formatMetricWithUnit(latestMetric?.waist_cm, "cm")} />
            <RecordLine label="臀围" value={formatMetricWithUnit(latestMetric?.hip_cm, "cm")} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="size-4" />
              数据用途
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            <p>身体数据用于观察趋势和解释训练调整依据。对话识别的数据需您确认后才会保存。</p>
            <p className="mt-3">
              {onboarding?.next_steps?.[0] ?? "您可以随时修正、删除或导出这些记录。"}
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-medium">{value}</p>
    </div>
  )
}

function RecordLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function LineChart({ series, unit }: { series: MetricPoint[]; unit: string }) {
  if (series.length < 2) {
    return (
      <Empty className="mt-4 min-h-48 border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TrendingUp />
          </EmptyMedia>
          <EmptyTitle>再记录一次即可查看趋势</EmptyTitle>
          <EmptyDescription>至少需要两个独立时间点，才会比较变化方向。</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const width = 700
  const height = 185
  const values = series.map((point) => point.value)
  const min = Math.min(...values) - 1
  const max = Math.max(...values) + 1
  const step = width / (values.length - 1)
  const path = values
    .map((value, index) => {
      const x = index * step
      const y = height - ((value - min) / (max - min)) * (height - 38) - 15
      return `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(" ")
  const latest = series[series.length - 1]

  return (
    <svg className="mt-5 w-full" viewBox={`0 0 ${width} ${height + 34}`}>
      {[0, 1, 2].map((line) => (
        <line
          key={line}
          stroke="var(--border)"
          strokeDasharray="3 5"
          x1="0"
          x2={width}
          y1={28 + line * 56}
          y2={28 + line * 56}
        />
      ))}
      <path d={path} fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.25" />
      <circle cx={width} cy={height - ((latest.value - min) / (max - min)) * (height - 38) - 15} fill="currentColor" r="4" />
      <text fill="var(--muted-foreground)" fontSize="12" x="0" y={height + 25}>
        {formatShortDate(series[0].date)}
      </text>
      <text fill="var(--muted-foreground)" fontSize="12" textAnchor="end" x={width} y={height + 25}>
        {formatShortDate(latest.date)} · {latest.value.toFixed(1)} {unit}
      </text>
    </svg>
  )
}

type RecoveryGuidance = {
  badgeClass: string
  description: string
  icon: typeof CheckCircle2
  label: string
  title: string
}

function getRecoveryGuidance(checkin: AgentCheckin | null): RecoveryGuidance {
  if (!checkin) {
    return {
      badgeClass: "text-muted-foreground",
      description: "记录睡眠、精力与酸痛后，Kratos 才能安全地建议今天的训练强度。",
      icon: WandSparkles,
      label: "待打卡",
      title: "先花 30 秒告诉教练您今天的状态",
    }
  }
  if (checkin.pain_notes || (checkin.soreness_level ?? 0) >= 7 || (checkin.energy_level ?? 10) <= 3) {
    return {
      badgeClass: "border-destructive/30 bg-destructive/5 text-destructive",
      description: "检测到疼痛、高酸痛或低精力信号。今天优先恢复、替换刺激动作；急性不适请停止训练并就医评估。",
      icon: AlertTriangle,
      label: "恢复优先",
      title: "今天不适合盲目加量",
    }
  }
  if ((checkin.sleep_hours ?? 8) < 7 || (checkin.soreness_level ?? 0) >= 5) {
    return {
      badgeClass: "border-amber-500/30 bg-amber-500/5 text-amber-700",
      description: "睡眠或酸痛显示恢复尚不充分。按计划训练时保留余力，避免挑战新的最大重量。",
      icon: Gauge,
      label: "保守训练",
      title: "今天建议降低一点强度",
    }
  }
  return {
    badgeClass: "border-primary/20 bg-primary/5 text-foreground",
    description: "当前恢复信号稳定。可执行既定计划，并在训练结束后记录 RPE 供后续调整参考。",
    icon: CheckCircle2,
    label: "可按计划训练",
    title: "恢复状态支持今天的安排",
  }
}

function getMetricSeries(
  metrics: BodyMetric[],
  key: keyof Pick<BodyMetric, "body_fat_percentage" | "skeletal_muscle_mass_kg" | "weight_kg">
): MetricPoint[] {
  return metrics
    .filter((metric) => metric[key] !== null && metric[key] !== undefined)
    .sort(
      (a, b) =>
        new Date(a.measured_at ?? a.recorded_at).getTime() -
        new Date(b.measured_at ?? b.recorded_at).getTime()
    )
    .slice(-30)
    .map((metric) => ({
      date: metric.measured_at ?? metric.recorded_at,
      value: Number(metric[key]),
    }))
}

function calculateTargetProgress(start: number | null, current: number | null, target: number | null) {
  if (start === null || current === null || target === null || Math.abs(start - target) < 0.1) {
    return null
  }
  return Math.max(0, Math.min(100, Math.round((Math.abs(start - current) / Math.abs(start - target)) * 100)))
}

function calculateBmi(metric: BodyMetric | null) {
  if (!metric?.height_cm || !metric.weight_kg) return null
  return Number((metric.weight_kg / (metric.height_cm / 100) ** 2).toFixed(1))
}

function calculateBmr(profile: FitnessProfile | null, metric: BodyMetric | null) {
  if (!metric?.weight_kg || !metric.height_cm || !profile?.age) return null
  const offset = profile.gender?.includes("女") ? -161 : 5
  return Math.round(10 * metric.weight_kg + 6.25 * metric.height_cm - 5 * profile.age + offset)
}

function formatMetricSource(source: string | null | undefined) {
  if (source === "chat_confirmation") return "对话确认"
  if (source === "onboarding") return "建档录入"
  return "手动录入"
}

function formatMetricValue(value: number | null | undefined) {
  return typeof value === "number" ? value.toFixed(1) : "暂无记录"
}

function formatMetricWithUnit(value: number | null | undefined, unit: string) {
  return typeof value === "number" ? `${value.toFixed(1)} ${unit}` : "暂无记录"
}

function formatScore(value: number | null | undefined) {
  return typeof value === "number" ? `${value}/10` : "暂无记录"
}

function formatMetricChange(series: MetricPoint[], unit: string) {
  if (series.length < 2) return "暂无周期变化"
  const change = series[series.length - 1].value - series[0].value
  if (Math.abs(change) < 0.05) return `持平 0.0 ${unit}`
  return `${change > 0 ? "上升" : "下降"} ${Math.abs(change).toFixed(1)} ${unit}`
}

function formatShortDate(date: string) {
  const parsed = new Date(date)
  return `${(parsed.getMonth() + 1).toString().padStart(2, "0")}.${parsed.getDate().toString().padStart(2, "0")}`
}

function formatFullDate(date: string) {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date.slice(0, 10)
  return `${parsed.getFullYear()}.${(parsed.getMonth() + 1).toString().padStart(2, "0")}.${parsed.getDate().toString().padStart(2, "0")}`
}

function getBmiLevel(bmi: number) {
  if (bmi < 18.5) return "偏低"
  if (bmi < 24) return "正常"
  if (bmi < 28) return "偏高"
  return "较高"
}
