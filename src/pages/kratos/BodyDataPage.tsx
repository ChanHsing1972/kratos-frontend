import {
  Activity,
  Download,
  Dumbbell,
  Flame,
  Gauge,
  History,
  Info,
  MoonStar,
  Pencil,
  Plus,
  Ruler,
  Scale,
  Timer,
  Trash2,
  TrendingUp,
  Trophy,
} from "lucide-react"
import { useState, type ReactNode } from "react"
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  XAxis,
  YAxis,
} from "recharts"

import type {
  AgentCheckin,
  BodyMetric,
  OnboardingStatus,
  WorkoutLog,
} from "@/entities/kratos/model/types"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/shared/ui/chart"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/ui/empty"
import { Progress } from "@/shared/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"

type BodyDataPageProps = {
  bodyMetrics: BodyMetric[]
  checkins: AgentCheckin[]
  latestCheckin: AgentCheckin | null
  latestMetric: BodyMetric | null
  onEditBodyData: () => void
  onEditBodyMetric: (metric: BodyMetric) => void
  onDeleteCheckin: (checkin: AgentCheckin) => void
  onDeleteBodyMetric: (metric: BodyMetric) => void
  onExportBodyData: () => void
  onboarding: OnboardingStatus | null
  workoutLogs: WorkoutLog[]
}

type MetricPoint = {
  date: string
  value: number
}

type TrendOption = {
  id: string
  label: string
  series: MetricPoint[]
  unit: string
}

export function BodyDataPage({
  bodyMetrics,
  checkins,
  latestCheckin,
  latestMetric,
  onEditBodyData,
  onEditBodyMetric,
  onDeleteCheckin,
  onDeleteBodyMetric,
  onExportBodyData,
  onboarding,
  workoutLogs,
}: BodyDataPageProps) {
  const weightSeries = getMetricSeries(bodyMetrics, "weight_kg")
  const bodyFatSeries = getMetricSeries(bodyMetrics, "body_fat_percentage")
  const muscleSeries = getMetricSeries(bodyMetrics, "skeletal_muscle_mass_kg")
  const sleepSeries = getCheckinSeries(checkins, "sleep_hours")
  const energySeries = getCheckinSeries(checkins, "energy_level")
  const sorenessSeries = getCheckinSeries(checkins, "soreness_level")
  const todayCheckin = isToday(
    latestCheckin?.checkin_date ?? latestCheckin?.created_at
  )
    ? latestCheckin
    : null
  const todayMetric = isToday(
    latestMetric?.measured_at ?? latestMetric?.recorded_at
  )
    ? latestMetric
    : null
  const completedWorkoutLogs = workoutLogs.filter((log) => log.completed)
  const targetProgress = calculateTargetProgress(
    weightSeries[0]?.value ?? null,
    latestMetric?.weight_kg ?? null,
    latestMetric?.target_weight_kg ?? null
  )

  const coreTrends: TrendOption[] = [
    { id: "weight", label: "体重", unit: "kg", series: weightSeries },
    { id: "soreness", label: "酸痛", unit: "/10", series: sorenessSeries },
    { id: "sleep", label: "睡眠", unit: "h", series: sleepSeries },
    { id: "energy", label: "精力", unit: "/10", series: energySeries },
  ]
  const additionalTrends: TrendOption[] = [
    { id: "body-fat", label: "体脂率", unit: "%", series: bodyFatSeries },
    { id: "muscle", label: "骨骼肌", unit: "kg", series: muscleSeries },
    { id: "bmi", label: "BMI", unit: "", series: getBmiSeries(bodyMetrics) },
    {
      id: "waist",
      label: "腰围",
      unit: "cm",
      series: getMetricSeries(bodyMetrics, "waist_cm"),
    },
    {
      id: "chest",
      label: "胸围",
      unit: "cm",
      series: getMetricSeries(bodyMetrics, "chest_cm"),
    },
    {
      id: "hip",
      label: "臀围",
      unit: "cm",
      series: getMetricSeries(bodyMetrics, "hip_cm"),
    },
  ]

  return (
    <main className="scrollbar-none min-h-0 flex-1 overflow-y-auto bg-background">
      <section className="mx-auto mt-20 flex min-h-full w-full max-w-[900px] flex-col px-6 pt-8 pb-16 sm:px-8">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-3xl font-medium tracking-[-0.05em]">
              身体数据
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              从今天的恢复状态开始，观察训练负荷与身体趋势如何共同变化。
            </p>
          </div>
          <Button onClick={onExportBodyData} type="button" variant="ghost">
            <Download />
            导出
          </Button>
        </header>

        <TodayRecoveryStatus
          latestCheckin={todayCheckin}
          latestMetric={todayMetric}
          onRecord={onEditBodyData}
        />

        <WeeklyTrainingStats logs={completedWorkoutLogs} />

        <Tabs className="mt-14" defaultValue="trend">
          <TabsList aria-label="身体数据查看范围" variant="line">
            <TabsTrigger value="trend">
              <TrendingUp />
              趋势
            </TabsTrigger>
            <TabsTrigger value="records">
              <History />
              历史记录
            </TabsTrigger>
          </TabsList>

          <TabsContent className="mt-8" value="trend">
            <TrendPanel
              additionalTrends={additionalTrends}
              coreTrends={coreTrends}
              latestMetric={latestMetric}
              targetProgress={targetProgress}
            />
          </TabsContent>

          <TabsContent className="mt-8 space-y-12" value="records">
            <TrainingFeedbackPanel logs={completedWorkoutLogs} />
            <RecordsPanel
              bodyMetrics={bodyMetrics}
              checkins={checkins}
              latestMetric={latestMetric}
              onDeleteCheckin={onDeleteCheckin}
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

function TodayRecoveryStatus({
  latestCheckin,
  latestMetric,
  onRecord,
}: {
  latestCheckin: AgentCheckin | null
  latestMetric: BodyMetric | null
  onRecord: () => void
}) {
  const hasTodayData = Boolean(latestCheckin || latestMetric)

  return (
    <section className="mt-12">
      <SectionHeading
        action={
          hasTodayData ? (
            <Button onClick={onRecord} size="sm" type="button" variant="ghost">
              更新记录
            </Button>
          ) : null
        }
        description="睡眠、精力与酸痛将帮助调整今天的训练强度。"
        title="今日恢复状态"
      />
      {hasTodayData ? (
        <div className="mt-8 grid gap-x-8 gap-y-7 sm:grid-cols-4">
          <StatusMetric
            icon={MoonStar}
            label="睡眠"
            value={formatMetricWithUnit(latestCheckin?.sleep_hours, "h")}
          />
          <StatusMetric
            icon={Activity}
            label="精力"
            value={formatScore(latestCheckin?.energy_level)}
          />
          <StatusMetric
            icon={Gauge}
            label="酸痛"
            value={formatScore(latestCheckin?.soreness_level)}
          />
          <StatusMetric
            icon={Scale}
            label="体重"
            value={formatMetricWithUnit(latestMetric?.weight_kg, "kg")}
          />
        </div>
      ) : (
        <Empty className="mt-6 min-h-44 bg-muted/30">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Plus />
            </EmptyMedia>
            <EmptyTitle>今天还没有状态记录</EmptyTitle>
            <EmptyDescription>
              记录睡眠、精力、酸痛与体重，获得更贴合今天的训练建议。
            </EmptyDescription>
          </EmptyHeader>
          <Button onClick={onRecord} type="button">
            <Plus />
            记录今天状态
          </Button>
        </Empty>
      )}
    </section>
  )
}

function StatusMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity
  label: string
  value: string
}) {
  return (
    <div className="flex gap-3">
      <Icon
        className="mt-1 size-4 shrink-0 text-muted-foreground"
        strokeWidth={1.8}
      />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-medium tracking-tight">{value}</p>
      </div>
    </div>
  )
}

function WeeklyTrainingStats({ logs }: { logs: WorkoutLog[] }) {
  const weekLogs = getCurrentWeekLogs(logs)
  const weekSeconds = weekLogs.reduce(
    (sum, log) => sum + getWorkoutSeconds(log),
    0
  )
  const weekCalories = weekLogs.reduce(
    (sum, log) => sum + (log.calories_burned ?? 0),
    0
  )
  const streakDays = calculateTrainingStreak(logs)
  const weekStart = startOfWeek(new Date())
  const stats = [
    {
      icon: Dumbbell,
      label: "完成训练",
      value: `${weekLogs.length} 次`,
    },
    {
      icon: Timer,
      label: "训练时长",
      value: formatTrainingDuration(weekSeconds),
    },
    {
      icon: Flame,
      label: "训练消耗",
      value: `${weekCalories} kcal`,
    },
    {
      icon: Trophy,
      label: "连续训练",
      value: `${streakDays} 天`,
    },
  ]

  return (
    <section className="mt-14">
      <SectionHeading
        description={`本周 ${formatWeekRange(weekStart)} · 来自已完成的训练记录`}
        title="本周训练统计"
      />
      <div className="mt-8 grid gap-x-8 gap-y-7 sm:grid-cols-4">
        {stats.map(({ icon: Icon, label, value }) => (
          <StatusMetric icon={Icon} key={label} label={label} value={value} />
        ))}
      </div>
    </section>
  )
}

function TrendPanel({
  additionalTrends,
  coreTrends,
  latestMetric,
  targetProgress,
}: {
  additionalTrends: TrendOption[]
  coreTrends: TrendOption[]
  latestMetric: BodyMetric | null
  targetProgress: number | null
}) {
  const [selectedTrend, setSelectedTrend] = useState(additionalTrends[0].id)
  const activeTrend =
    additionalTrends.find((trend) => trend.id === selectedTrend) ??
    additionalTrends[0]

  return (
    <section>
      <div>
        <h2 className="text-xl font-medium tracking-[-0.03em]">变化趋势</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          先查看恢复与训练判断最相关的四项指标，最多展示最近 30 个时间点。
        </p>
      </div>

      <div className="mt-9 grid gap-x-10 gap-y-12 md:grid-cols-2">
        {coreTrends.map((trend) => (
          <CoreTrendChart
            key={trend.id}
            latestMetric={latestMetric}
            targetProgress={targetProgress}
            trend={trend}
          />
        ))}
      </div>

      <section className="mt-16">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h3 className="text-xl font-medium tracking-[-0.03em]">更多指标</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              选择一项身体测量指标，查看长期变化。
            </p>
          </div>
          <Select onValueChange={setSelectedTrend} value={selectedTrend}>
            <SelectTrigger className="w-44 border-0 bg-muted/45 shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {additionalTrends.map((trend) => (
                <SelectItem key={trend.id} value={trend.id}>
                  {trend.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-9 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{activeTrend.label}</p>
            <p className="mt-1 text-3xl font-medium tracking-[-0.04em]">
              {formatSeriesLatest(activeTrend.series, activeTrend.unit)}
            </p>
          </div>
          <p className="pb-1 text-sm text-muted-foreground">
            {formatMetricChange(activeTrend.series, activeTrend.unit)}
          </p>
        </div>

        <MetricChart
          label={activeTrend.label}
          series={activeTrend.series}
          unit={activeTrend.unit}
        />

        <section className="mt-14">
          <h3 className="text-base font-medium">指标概览</h3>
          <div className="mt-6 grid gap-x-8 gap-y-7 sm:grid-cols-3">
            {additionalTrends.map((trend) => (
              <button
                className="text-left transition-opacity hover:opacity-60"
                key={trend.id}
                onClick={() => setSelectedTrend(trend.id)}
                type="button"
              >
                <p className="text-xs text-muted-foreground">{trend.label}</p>
                <p className="mt-1 font-medium">
                  {formatSeriesLatest(trend.series, trend.unit)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatMetricChange(trend.series, trend.unit)}
                </p>
              </button>
            ))}
          </div>
        </section>
      </section>
    </section>
  )
}

function CoreTrendChart({
  latestMetric,
  targetProgress,
  trend,
}: {
  latestMetric: BodyMetric | null
  targetProgress: number | null
  trend: TrendOption
}) {
  return (
    <section>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{trend.label}</p>
          <p className="mt-1 text-2xl font-medium tracking-[-0.03em]">
            {formatSeriesLatest(trend.series, trend.unit)}
          </p>
        </div>
        <p className="pb-1 text-xs text-muted-foreground">
          {formatMetricChange(trend.series, trend.unit)}
        </p>
      </div>
      <MetricChart
        compact
        label={trend.label}
        series={trend.series}
        unit={trend.unit}
      />
      {trend.id === "weight" && typeof targetProgress === "number" ? (
        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between text-xs">
            <span>
              目标体重{" "}
              {formatMetricWithUnit(latestMetric?.target_weight_kg, "kg")}
            </span>
            <span className="text-muted-foreground">{targetProgress}%</span>
          </div>
          <Progress value={targetProgress} />
        </div>
      ) : null}
    </section>
  )
}

function MetricChart({
  compact = false,
  label,
  series,
  unit,
}: {
  compact?: boolean
  label: string
  series: MetricPoint[]
  unit: string
}) {
  if (series.length < 2) {
    return (
      <Empty
        className={
          compact ? "mt-5 min-h-40 bg-muted/25" : "mt-7 min-h-56 bg-muted/25"
        }
      >
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TrendingUp />
          </EmptyMedia>
          <EmptyTitle>再记录一次即可查看趋势</EmptyTitle>
          {!compact ? (
            <EmptyDescription>
              至少需要两个独立时间点，才会比较变化方向。
            </EmptyDescription>
          ) : null}
        </EmptyHeader>
      </Empty>
    )
  }

  const chartData = series.map((point) => ({
    date: formatShortDate(point.date),
    value: point.value,
  }))
  const chartConfig = {
    value: {
      color: "var(--foreground)",
      label,
    },
  } satisfies ChartConfig

  return (
    <ChartContainer
      className={
        compact
          ? "mt-5 aspect-auto h-40 w-full"
          : "mt-7 aspect-auto h-64 w-full"
      }
      config={chartConfig}
      initialDimension={
        compact ? { height: 160, width: 390 } : { height: 256, width: 820 }
      }
    >
      <RechartsLineChart
        accessibilityLayer
        data={chartData}
        margin={{ bottom: 0, left: -18, right: 12, top: 10 }}
      >
        <CartesianGrid strokeDasharray="3 6" vertical={false} />
        <XAxis
          axisLine={false}
          dataKey="date"
          tickLine={false}
          tickMargin={12}
        />
        <YAxis
          axisLine={false}
          tickFormatter={(value: number) => `${value}${unit}`}
          tickLine={false}
          width={64}
        />
        <ChartTooltip
          content={<ChartTooltipContent indicator="line" />}
          cursor={false}
        />
        <Line
          activeDot={{ r: 4 }}
          dataKey="value"
          dot={false}
          stroke="var(--color-value)"
          strokeWidth={2.25}
          type="monotone"
        />
      </RechartsLineChart>
    </ChartContainer>
  )
}

function TrainingFeedbackPanel({ logs }: { logs: WorkoutLog[] }) {
  const sortedLogs = [...logs].sort(
    (left, right) => dateTime(right.workout_date) - dateTime(left.workout_date)
  )
  const totalMinutes = Math.round(
    logs.reduce((total, log) => total + getWorkoutSeconds(log), 0) / 60
  )
  const setCount = logs.reduce(
    (total, log) =>
      total +
      log.exercises.reduce(
        (count, exercise) => count + exercise.sets.length,
        0
      ),
    0
  )

  return (
    <section>
      <SectionHeading
        description="完成情况与主观强度帮助 Kratos 调整下一次安排。"
        title="训练反馈"
      />
      {!logs.length ? (
        <Empty className="mt-6 min-h-48 bg-muted/25">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Dumbbell />
            </EmptyMedia>
            <EmptyTitle>完成训练后，这里会显示反馈</EmptyTitle>
            <EmptyDescription>
              训练时长、RPE 与疼痛记录将作为下一次调整的依据。
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="mt-7 grid gap-x-8 gap-y-6 sm:grid-cols-3">
            <SummaryValue label="已完成训练" value={`${logs.length} 次`} />
            <SummaryValue label="累计训练时长" value={`${totalMinutes} 分钟`} />
            <SummaryValue label="已记录组次" value={`${setCount} 组`} />
          </div>
          <div className="mt-8 space-y-5">
            {sortedLogs.slice(0, 5).map((log) => (
              <div
                className="flex items-center justify-between gap-4"
                key={log.id}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {log.title ?? "训练记录"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatFullDate(log.workout_date)} ·{" "}
                    {formatTrainingDuration(getWorkoutSeconds(log))}
                  </p>
                </div>
                <Badge variant="secondary">
                  RPE {log.perceived_exertion ?? "未填"}
                </Badge>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

function RecordsPanel({
  bodyMetrics,
  checkins,
  latestMetric,
  onDeleteCheckin,
  onDeleteBodyMetric,
  onEditBodyMetric,
  onboarding,
}: {
  bodyMetrics: BodyMetric[]
  checkins: AgentCheckin[]
  latestMetric: BodyMetric | null
  onDeleteCheckin: (checkin: AgentCheckin) => void
  onDeleteBodyMetric: (metric: BodyMetric) => void
  onEditBodyMetric: (metric: BodyMetric) => void
  onboarding: OnboardingStatus | null
}) {
  return (
    <>
      <RecordSection
        description="睡眠、精力与酸痛来自每日恢复打卡。"
        title="恢复打卡记录"
      >
        {checkins.length ? (
          <div className="mt-6 space-y-5">
            {checkins.slice(0, 10).map((checkin) => (
              <div className="flex items-center gap-4" key={checkin.id}>
                <div className="w-24 shrink-0 text-sm text-muted-foreground">
                  {formatFullDate(checkin.checkin_date ?? checkin.created_at)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{formatCheckinSummary(checkin)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatMetricSource(checkin.source)}
                    {checkin.pain_notes ? ` · ${checkin.pain_notes}` : ""}
                  </p>
                </div>
                <Button
                  aria-label="删除恢复打卡"
                  onClick={() => onDeleteCheckin(checkin)}
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
          <p className="mt-8 text-sm text-muted-foreground">
            还没有恢复打卡记录。
          </p>
        )}
      </RecordSection>

      <RecordSection
        description="体重、体脂与围度分别保存，每次录入均可修正或删除。"
        title="身体测量记录"
      >
        {bodyMetrics.length ? (
          <div className="mt-6 space-y-5">
            {bodyMetrics.slice(0, 10).map((metric) => (
              <div className="flex items-center gap-4" key={metric.id}>
                <div className="w-24 shrink-0 text-sm text-muted-foreground">
                  {formatFullDate(metric.measured_at ?? metric.recorded_at)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {formatMetricWithUnit(metric.weight_kg, "kg")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatMetricSource(metric.source)}
                  </p>
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
          <p className="mt-8 text-sm text-muted-foreground">
            还没有身体测量记录。
          </p>
        )}
      </RecordSection>

      <div className="grid gap-10 pt-2 sm:grid-cols-2">
        <section>
          <h3 className="flex items-center gap-2 font-medium">
            <Ruler className="size-4 text-muted-foreground" />
            最近围度
          </h3>
          <div className="mt-5 space-y-3 text-sm">
            <RecordLine
              label="胸围"
              value={formatMetricWithUnit(latestMetric?.chest_cm, "cm")}
            />
            <RecordLine
              label="腰围"
              value={formatMetricWithUnit(latestMetric?.waist_cm, "cm")}
            />
            <RecordLine
              label="臀围"
              value={formatMetricWithUnit(latestMetric?.hip_cm, "cm")}
            />
          </div>
        </section>
        <section>
          <h3 className="flex items-center gap-2 font-medium">
            <Info className="size-4 text-muted-foreground" />
            数据用途
          </h3>
          <div className="mt-5 text-sm leading-6 text-muted-foreground">
            <p>
              身体数据用于观察趋势和解释训练调整依据。对话识别的数据需您确认后才会保存。
            </p>
            <p className="mt-3">
              {onboarding?.next_steps?.[0] ??
                "您可以随时修正、删除或导出这些记录。"}
            </p>
          </div>
        </section>
      </div>
    </>
  )
}

function SectionHeading({
  action,
  description,
  title,
}: {
  action?: ReactNode
  description: string
  title: string
}) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
      <div>
        <h2 className="text-xl font-medium tracking-[-0.03em]">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}

function RecordSection({
  children,
  description,
  title,
}: {
  children: ReactNode
  description: string
  title: string
}) {
  return (
    <section>
      <SectionHeading description={description} title={title} />
      {children}
    </section>
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

function getMetricSeries(
  metrics: BodyMetric[],
  key: keyof Pick<
    BodyMetric,
    | "body_fat_percentage"
    | "chest_cm"
    | "hip_cm"
    | "skeletal_muscle_mass_kg"
    | "waist_cm"
    | "weight_kg"
  >
): MetricPoint[] {
  return metrics
    .filter((metric) => metric[key] !== null && metric[key] !== undefined)
    .sort(
      (a, b) =>
        dateTime(a.measured_at ?? a.recorded_at) -
        dateTime(b.measured_at ?? b.recorded_at)
    )
    .slice(-30)
    .map((metric) => ({
      date: metric.measured_at ?? metric.recorded_at,
      value: Number(metric[key]),
    }))
}

function getCheckinSeries(
  checkins: AgentCheckin[],
  key: keyof Pick<
    AgentCheckin,
    "energy_level" | "sleep_hours" | "soreness_level"
  >
): MetricPoint[] {
  return checkins
    .filter((checkin) => checkin[key] !== null && checkin[key] !== undefined)
    .sort(
      (left, right) =>
        dateTime(left.checkin_date ?? left.created_at) -
        dateTime(right.checkin_date ?? right.created_at)
    )
    .slice(-30)
    .map((checkin) => ({
      date: checkin.checkin_date ?? checkin.created_at,
      value: Number(checkin[key]),
    }))
}

function getBmiSeries(metrics: BodyMetric[]): MetricPoint[] {
  return metrics
    .map((metric) => ({
      date: metric.measured_at ?? metric.recorded_at,
      value: metric.bmi ?? calculateBmi(metric),
    }))
    .filter((point): point is MetricPoint => typeof point.value === "number")
    .sort((left, right) => dateTime(left.date) - dateTime(right.date))
    .slice(-30)
}

function getCurrentWeekLogs(logs: WorkoutLog[]) {
  const weekStart = startOfWeek(new Date())
  const weekEnd = addDays(weekStart, 7)

  return logs.filter((log) => {
    const date = localDate(log.workout_date)
    return date >= weekStart && date < weekEnd
  })
}

function calculateTrainingStreak(logs: WorkoutLog[]) {
  const trainedDates = new Set(
    logs.map((log) => dateKey(localDate(log.workout_date)))
  )
  let cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  if (!trainedDates.has(dateKey(cursor))) {
    cursor = addDays(cursor, -1)
  }

  let streak = 0
  while (trainedDates.has(dateKey(cursor))) {
    streak += 1
    cursor = addDays(cursor, -1)
  }

  return streak
}

function getWorkoutSeconds(log: WorkoutLog) {
  return log.duration_seconds ?? (log.duration_minutes ?? 0) * 60
}

function calculateTargetProgress(
  start: number | null,
  current: number | null,
  target: number | null
) {
  if (
    start === null ||
    current === null ||
    target === null ||
    Math.abs(start - target) < 0.1
  ) {
    return null
  }
  return Math.max(
    0,
    Math.min(
      100,
      Math.round((Math.abs(start - current) / Math.abs(start - target)) * 100)
    )
  )
}

function calculateBmi(metric: BodyMetric | null) {
  if (!metric?.height_cm || !metric.weight_kg) return null
  return Number((metric.weight_kg / (metric.height_cm / 100) ** 2).toFixed(1))
}

function formatMetricSource(source: string | null | undefined) {
  if (source === "chat_confirmation") return "对话确认"
  if (source === "onboarding") return "建档录入"
  return "手动录入"
}

function formatCheckinSummary(checkin: AgentCheckin) {
  const parts = [
    typeof checkin.sleep_hours === "number"
      ? `睡眠 ${checkin.sleep_hours.toFixed(1)} h`
      : null,
    typeof checkin.energy_level === "number"
      ? `精力 ${checkin.energy_level}/10`
      : null,
    typeof checkin.soreness_level === "number"
      ? `酸痛 ${checkin.soreness_level}/10`
      : null,
  ].filter(Boolean)

  return parts.join(" · ") || "恢复状态记录"
}

function formatMetricWithUnit(value: number | null | undefined, unit: string) {
  return typeof value === "number" ? `${value.toFixed(1)} ${unit}` : "暂无记录"
}

function formatSeriesLatest(series: MetricPoint[], unit: string) {
  const latest = series[series.length - 1]
  return latest
    ? `${latest.value.toFixed(1)}${unit ? ` ${unit}` : ""}`
    : "未记录"
}

function formatScore(value: number | null | undefined) {
  return typeof value === "number" ? `${value}/10` : "暂无记录"
}

function formatMetricChange(series: MetricPoint[], unit: string) {
  if (series.length < 2) return "暂无周期变化"
  const change = series[series.length - 1].value - series[0].value
  if (Math.abs(change) < 0.05) return `持平 0.0${unit ? ` ${unit}` : ""}`
  return `${change > 0 ? "上升" : "下降"} ${Math.abs(change).toFixed(1)}${unit ? ` ${unit}` : ""}`
}

function formatShortDate(date: string) {
  const parsed = localDate(date)
  if (Number.isNaN(parsed.getTime())) return "--.--"
  return `${(parsed.getMonth() + 1).toString().padStart(2, "0")}.${parsed.getDate().toString().padStart(2, "0")}`
}

function formatFullDate(date: string) {
  const parsed = localDate(date)
  if (Number.isNaN(parsed.getTime())) return date.slice(0, 10)
  return `${parsed.getFullYear()}.${(parsed.getMonth() + 1).toString().padStart(2, "0")}.${parsed.getDate().toString().padStart(2, "0")}`
}

function formatTrainingDuration(totalSeconds: number) {
  const minutes = Math.round(totalSeconds / 60)
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const remainder = minutes % 60
    return remainder ? `${hours} 小时 ${remainder} 分` : `${hours} 小时`
  }
  return `${minutes} 分钟`
}

function formatWeekRange(weekStart: Date) {
  const weekEnd = addDays(weekStart, 6)
  return `${weekStart.getMonth() + 1}.${weekStart.getDate()} - ${weekEnd.getMonth() + 1}.${weekEnd.getDate()}`
}

function isToday(value: string | null | undefined) {
  if (!value) return false
  const parsed = localDate(value)
  if (Number.isNaN(parsed.getTime())) return false
  const today = new Date()
  return (
    parsed.getFullYear() === today.getFullYear() &&
    parsed.getMonth() === today.getMonth() &&
    parsed.getDate() === today.getDate()
  )
}

function startOfWeek(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  next.setDate(next.getDate() - ((next.getDay() + 6) % 7))
  return next
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function localDate(value: string) {
  const plainDate = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (plainDate) {
    return new Date(
      Number(plainDate[1]),
      Number(plainDate[2]) - 1,
      Number(plainDate[3])
    )
  }
  return new Date(value)
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

function dateTime(value: string) {
  return localDate(value).getTime()
}
