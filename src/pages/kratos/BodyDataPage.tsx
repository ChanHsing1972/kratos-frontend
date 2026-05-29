import {
  Activity,
  ChevronDown,
  Download,
  Dumbbell,
  Flame,
  Gauge,
  MoonStar,
  Pencil,
  Plus,
  Scale,
  Timer,
  Trash2,
  TrendingUp,
  Trophy,
  type LucideIcon,
} from "lucide-react"
import { Fragment, useState, type ReactNode } from "react"
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  Line,
  XAxis,
  YAxis,
} from "recharts"

import type {
  AgentCheckin,
  BodyMetric,
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
import { Separator } from "@/shared/ui/separator"

type BodyDataPageProps = {
  bodyMetrics: BodyMetric[]
  checkins: AgentCheckin[]
  latestCheckin: AgentCheckin | null
  latestMetric: BodyMetric | null
  onEditBodyData: () => void
  onEditBodyMetric: (metric: BodyMetric) => void
  onDeleteCheckin: (checkin: AgentCheckin) => void
  onDeleteBodyMetric: (metric: BodyMetric) => void
  onDeleteBodyDataRecord: (record: {
    checkin: AgentCheckin | null
    metric: BodyMetric | null
  }) => void
  onExportBodyData: () => void
  workoutLogs: WorkoutLog[]
}

type MetricPoint = {
  date: string
  value: number
}

type TrendOption = {
  icon: LucideIcon
  id: string
  label: string
  series: MetricPoint[]
  unit: string
}

type BodyDataRecord = {
  checkin: AgentCheckin | null
  id: string
  metric: BodyMetric | null
  sortTime: number
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
  onDeleteBodyDataRecord,
  onExportBodyData,
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
    {
      icon: Scale,
      id: "weight",
      label: "体重",
      unit: "kg",
      series: weightSeries,
    },
    {
      icon: Gauge,
      id: "soreness",
      label: "酸痛",
      unit: "/10",
      series: sorenessSeries,
    },
    {
      icon: MoonStar,
      id: "sleep",
      label: "睡眠",
      unit: "h",
      series: sleepSeries,
    },
    {
      icon: Activity,
      id: "energy",
      label: "精力",
      unit: "/10",
      series: energySeries,
    },
  ]
  const additionalTrends: TrendOption[] = [
    {
      icon: TrendingUp,
      id: "body-fat",
      label: "体脂率",
      unit: "%",
      series: bodyFatSeries,
    },
    {
      icon: TrendingUp,
      id: "muscle",
      label: "骨骼肌",
      unit: "kg",
      series: muscleSeries,
    },
    {
      icon: TrendingUp,
      id: "bmi",
      label: "BMI",
      unit: "",
      series: getBmiSeries(bodyMetrics),
    },
    {
      icon: TrendingUp,
      id: "waist",
      label: "腰围",
      unit: "cm",
      series: getMetricSeries(bodyMetrics, "waist_cm"),
    },
    {
      icon: TrendingUp,
      id: "chest",
      label: "胸围",
      unit: "cm",
      series: getMetricSeries(bodyMetrics, "chest_cm"),
    },
    {
      icon: TrendingUp,
      id: "hip",
      label: "臀围",
      unit: "cm",
      series: getMetricSeries(bodyMetrics, "hip_cm"),
    },
  ]

  return (
    <main className="scrollbar-none min-h-0 flex-1 overflow-y-auto bg-muted/40">
      <section className="mx-auto mt-20 flex min-h-full w-full max-w-[900px] flex-col px-6 pt-8 pb-16 sm:px-8">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <h1 className="text-3xl font-medium tracking-[-0.05em]">
            数据中心
          </h1>
          <Button onClick={onExportBodyData} type="button" variant="ghost">
            <Download />
            导出
          </Button>
        </header>

        <WeeklyTrainingStats logs={completedWorkoutLogs} />

        <TrendPanel
          additionalTrends={additionalTrends}
          coreTrends={coreTrends}
          latestMetric={latestMetric}
          onRecord={onEditBodyData}
          targetProgress={targetProgress}
          todayCheckin={todayCheckin}
          todayMetric={todayMetric}
        />

        <HistoryPanel
          bodyMetrics={bodyMetrics}
          checkins={checkins}
          logs={completedWorkoutLogs}
          onDeleteCheckin={onDeleteCheckin}
          onDeleteBodyDataRecord={onDeleteBodyDataRecord}
          onDeleteBodyMetric={onDeleteBodyMetric}
          onEditBodyMetric={onEditBodyMetric}
        />
      </section>
    </main>
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
        className="size-4 shrink-0 text-muted-foreground"
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
      value: `${weekCalories} 千卡`,
    },
    {
      icon: Trophy,
      label: "连续训练",
      value: `${streakDays} 天`,
    },
  ]

  return (
    <section className="mt-10">
      <SectionHeading
        description={`${formatWeekRange(weekStart)}`}
        title="本周统计"
      />
      <div className="mt-5 grid gap-6 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] sm:items-center sm:gap-x-4">
        {stats.map(({ icon: Icon, label, value }, index) => (
          <Fragment key={label}>
            <StatusMetric icon={Icon} label={label} value={value} />
            {index < stats.length - 1 ? (
              <Separator
                className="hidden h-12 sm:block"
                orientation="vertical"
              />
            ) : null}
          </Fragment>
        ))}
      </div>
    </section>
  )
}

function TrendPanel({
  additionalTrends,
  coreTrends,
  latestMetric,
  onRecord,
  targetProgress,
  todayCheckin,
  todayMetric,
}: {
  additionalTrends: TrendOption[]
  coreTrends: TrendOption[]
  latestMetric: BodyMetric | null
  onRecord: () => void
  targetProgress: number | null
  todayCheckin: AgentCheckin | null
  todayMetric: BodyMetric | null
}) {
  const [additionalOpen, setAdditionalOpen] = useState(false)
  const hasTodayData = Boolean(todayCheckin || todayMetric)

  return (
    <section className="mt-10">
      <SectionHeading
        action={
          <Button onClick={onRecord} size="sm" type="button" variant="outline">
            {hasTodayData ? "更新记录" : "记录今日状态"}
          </Button>
        }
        description=""
        title="今日状态"
      />

      {hasTodayData ? (
        null
        // <div className="mt-5 grid gap-y-6 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] sm:items-center sm:gap-x-4">
        //   <StatusMetric
        //     icon={MoonStar}
        //     label="睡眠"
        //     value={formatMetricWithUnit(todayCheckin?.sleep_hours, "小时")}
        //   />
        //   <Separator
        //     className="hidden h-12 sm:block"
        //     orientation="vertical"
        //   />
        //   <StatusMetric
        //     icon={Activity}
        //     label="精力"
        //     value={formatScore(todayCheckin?.energy_level)}
        //   />
        //   <Separator
        //     className="hidden h-12 sm:block"
        //     orientation="vertical"
        //   />
        //   <StatusMetric
        //     icon={Gauge}
        //     label="酸痛"
        //     value={formatScore(todayCheckin?.soreness_level)}
        //   />
        //   <Separator
        //     className="hidden h-12 sm:block"
        //     orientation="vertical"
        //   />
        //   <StatusMetric
        //     icon={Scale}
        //     label="体重"
        //     value={formatMetricWithUnit(todayMetric?.weight_kg, "千克")}
        //   />
        // </div>
      ) : (
        <Empty className="mt-5 min-h-50 border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Plus />
            </EmptyMedia>
            <EmptyTitle>今天还没有状态记录</EmptyTitle>
            <EmptyDescription>
              记录睡眠、精力、酸痛与体重，获得更贴合今日状态的训练建议。
            </EmptyDescription>
          </EmptyHeader>
          <Button onClick={onRecord} type="button">
            记录今日状态
          </Button>
        </Empty>
      )}

      <div className="mt-5 space-y-12">
        {coreTrends
          .filter((trend) => trend.id === "weight")
          .map((trend) => (
            <CoreTrendChart
              emphasis="primary"
              key={trend.id}
              latestMetric={latestMetric}
              targetProgress={targetProgress}
              trend={trend}
            />
          ))}

        <div className="grid gap-x-8 gap-y-12 md:grid-cols-3">
          {coreTrends
            .filter((trend) => trend.id !== "weight")
            .map((trend) => (
              <CoreTrendChart
                key={trend.id}
                latestMetric={latestMetric}
                targetProgress={targetProgress}
                trend={trend}
              />
            ))}
        </div>
      </div>

      <section className="mt-4">
        <Button
          aria-expanded={additionalOpen}
          onClick={() => setAdditionalOpen((current) => !current)}
          type="button"
          variant="ghost"
        >
          更多指标
          <ChevronDown
            className={
              additionalOpen
                ? "size-4 rotate-180 transition-transform"
                : "size-4 transition-transform"
            }
          />
        </Button>

        {additionalOpen ? (
          <div className="mt-8 grid gap-x-8 gap-y-12 md:grid-cols-3">
            {additionalTrends.map((trend) => (
              <CoreTrendChart
                key={trend.id}
                latestMetric={latestMetric}
                targetProgress={targetProgress}
                trend={trend}
              />
            ))}
          </div>
        ) : null}
      </section>
    </section>
  )
}

function HistoryPanel({
  bodyMetrics,
  checkins,
  logs,
  onDeleteCheckin,
  onDeleteBodyDataRecord,
  onDeleteBodyMetric,
  onEditBodyMetric,
}: {
  bodyMetrics: BodyMetric[]
  checkins: AgentCheckin[]
  logs: WorkoutLog[]
  onDeleteCheckin: (checkin: AgentCheckin) => void
  onDeleteBodyDataRecord: (record: {
    checkin: AgentCheckin | null
    metric: BodyMetric | null
  }) => void
  onDeleteBodyMetric: (metric: BodyMetric) => void
  onEditBodyMetric: (metric: BodyMetric) => void
}) {
  return (
    <section className="mt-10">
      <SectionHeading
        description=""
        title="历史记录"
      />
      <div className="mt-6 grid gap-12 lg:grid-cols-2">
        <TrainingFeedbackPanel logs={logs} />
        <RecordsPanel
          bodyMetrics={bodyMetrics}
          checkins={checkins}
          onDeleteCheckin={onDeleteCheckin}
          onDeleteBodyDataRecord={onDeleteBodyDataRecord}
          onDeleteBodyMetric={onDeleteBodyMetric}
          onEditBodyMetric={onEditBodyMetric}
        />
      </div>
    </section>
  )
}

function CoreTrendChart({
  emphasis = "secondary",
  latestMetric,
  targetProgress,
  trend,
}: {
  emphasis?: "primary" | "secondary"
  latestMetric: BodyMetric | null
  targetProgress: number | null
  trend: TrendOption
}) {
  const isPrimary = emphasis === "primary"
  const TrendIcon = trend.icon
  return (
    <section className={isPrimary ? "max-w-none" : undefined}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>{trend.label}</span>
            <TrendIcon className="size-3.5" strokeWidth={1.8} />
          </div>
          <p
            className={
              isPrimary
                ? "mt-1 text-xl font-medium tracking-[-0.03em]"
                : "mt-1 text-xl font-medium tracking-[-0.03em]"
            }
          >
            {formatSeriesLatest(trend.series, trend.unit)}
          </p>
        </div>
        <p className="pb-1 text-xs text-muted-foreground">
          {formatMetricChange(trend.series, trend.unit)}
        </p>
      </div>
      <MetricChart
        compact={!isPrimary}
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
          compact ? "mt-5 min-h-40 border border-dashed" : "mt-7 min-h-56 border border-dashed"
        }
      >
        <EmptyHeader>
          {!compact ? (<EmptyMedia variant="icon">
            <TrendingUp />
          </EmptyMedia>) : null}
          <EmptyTitle>无数据</EmptyTitle>
          {!compact ? (
            <EmptyDescription>
              再记录一次即可查看趋势。
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

  const yAxisDomain = getMetricChartDomain(series, unit)
  const yAxisTicks = getMetricChartTicks(yAxisDomain, unit)

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
      <RechartsAreaChart
        accessibilityLayer
        data={chartData}
        margin={{ bottom: 0, left: compact ? 0 : -14, right: 12, top: 10 }}
      >
        <defs>
          <linearGradient id={`metric-fill-${label}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.1} />
            <stop offset="90%" stopColor="var(--color-value)" stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          stroke="hsl(var(--muted-foreground) / 0.16)"
          strokeDasharray="3 8"
          vertical={false}
        />
        <XAxis
          axisLine={false}
          dataKey="date"
          minTickGap={compact ? 18 : 36}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          tickLine={false}
          tickMargin={12}
        />
        <YAxis
          allowDecimals={unit !== "/10"}
          axisLine={false}
          domain={yAxisDomain}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          tickFormatter={(value: number) => `${value}${unit}`}
          tickLine={false}
          ticks={yAxisTicks}
          width={compact ? 42 : 64}
        />
        <ChartTooltip
          content={<ChartTooltipContent indicator="dot" />}
          cursor={{ stroke: "hsl(var(--muted-foreground) / 0.22)", strokeWidth: 1 }}
        />
        <Area
          dataKey="value"
          fill={`url(#metric-fill-${label})`}
          fillOpacity={1}
          stroke="none"
          tooltipType="none"
          type="monotone"
        />
        <Line
          activeDot={{ r: 5, strokeWidth: 2 }}
          dataKey="value"
          dot={{ r: compact ? 2.5 : 3, strokeWidth: 2 }}
          stroke="var(--color-value)"
          strokeLinecap="round"
          strokeWidth={compact ? 2 : 2.4}
          type="monotone"
        />
      </RechartsAreaChart>
    </ChartContainer>
  )
}

function getMetricChartDomain(series: MetricPoint[], unit: string): [number, number] {
  if (unit === "/10") {
    return [0, 10]
  }

  if (unit === "h") {
    return [0, 12]
  }

  const values = series.map((point) => point.value)
  const min = Math.min(...values)
  const max = Math.max(...values)

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return [0, 1]
  }

  const range = Math.max(max - min, 1)
  const padding = Math.max(range * 0.35, unit === "kg" ? 1 : range * 0.2)
  const lower = Math.max(0, Math.floor((min - padding) * 10) / 10)
  const upper = Math.ceil((max + padding) * 10) / 10

  if (upper <= lower) {
    return [Math.max(0, lower - 1), lower + 1]
  }

  return [lower, upper]
}

function getMetricChartTicks(domain: [number, number], unit: string) {
  if (unit === "/10") {
    return [0, 3, 6, 9, 10]
  }

  if (unit === "h") {
    return [0, 3, 6, 9, 12]
  }

  const [min, max] = domain
  const step = (max - min) / 4

  return Array.from({ length: 5 }, (_, index) =>
    Number((min + step * index).toFixed(1))
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
      <h2 className="font-medium tracking-[-0.03em]">训练反馈</h2>

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
          <div className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-3">
            <SummaryValue label="已完成训练" value={`${logs.length} 次`} />
            <SummaryValue label="累计训练时长" value={`${totalMinutes} 分钟`} />
            <SummaryValue label="已记录组次" value={`${setCount} 组`} />
          </div>
          <div className="mt-6 space-y-5">
            {sortedLogs.slice(0, 5).map((log) => (
              <div
                className="flex items-center justify-between gap-4"
                key={log.id}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm">
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
  onDeleteCheckin,
  onDeleteBodyDataRecord,
  onDeleteBodyMetric,
  onEditBodyMetric,
}: {
  bodyMetrics: BodyMetric[]
  checkins: AgentCheckin[]
  onDeleteCheckin: (checkin: AgentCheckin) => void
  onDeleteBodyDataRecord: (record: {
    checkin: AgentCheckin | null
    metric: BodyMetric | null
  }) => void
  onDeleteBodyMetric: (metric: BodyMetric) => void
  onEditBodyMetric: (metric: BodyMetric) => void
}) {
  const records = getBodyDataRecords(bodyMetrics, checkins).slice(0, 10)

  return (
    <RecordSection
      title="数据历史"
    >
      {records.length ? (
        <div className="mt-6 space-y-6">
          {records.map((record) => (
            <div className="flex items-center gap-1" key={record.id}>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  {formatBodyDataRecordSummary(record)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatFullDate(getBodyDataRecordDate(record))} · {formatBodyDataRecordMeta(record)}
                </p>
              </div>
              {record.metric ? (
                <Button
                  aria-label="编辑身体数据记录"
                  onClick={() => onEditBodyMetric(record.metric!)}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  <Pencil />
                </Button>
              ) : null}
              {record.metric && record.checkin ? (
                <Button
                  aria-label="删除身体数据记录"
                  onClick={() => onDeleteBodyDataRecord(record)}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  <Trash2 />
                </Button>
              ) : record.metric ? (
                <Button
                  aria-label="删除测量记录"
                  onClick={() => onDeleteBodyMetric(record.metric!)}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  <Trash2 />
                </Button>
              ) : record.checkin ? (
                <Button
                  aria-label="删除恢复打卡"
                  onClick={() => onDeleteCheckin(record.checkin!)}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  <Trash2 />
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">
          还没有身体数据记录。
        </p>
      )}
    </RecordSection>
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
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  )
}

function RecordSection({
  children,
  title,
}: {
  children: ReactNode
  title: string
}) {
  return (
    <section>
      <h2 className="font-medium tracking-[-0.03em]">{title}</h2>
      {children}
    </section>
  )
}

const BODY_DATA_PAIR_WINDOW_MS = 10 * 60 * 1000

function getBodyDataRecords(
  bodyMetrics: BodyMetric[],
  checkins: AgentCheckin[]
): BodyDataRecord[] {
  const unpairedMetrics = [...bodyMetrics].sort(
    (left, right) => getMetricSortTime(right) - getMetricSortTime(left)
  )
  const records: BodyDataRecord[] = []

  for (const checkin of [...checkins].sort(
    (left, right) => getCheckinSortTime(right) - getCheckinSortTime(left)
  )) {
    const matchIndex = findPairedMetricIndex(checkin, unpairedMetrics)
    const metric =
      matchIndex >= 0 ? unpairedMetrics.splice(matchIndex, 1)[0] : null

    records.push({
      checkin,
      id: bodyDataRecordId(metric, checkin),
      metric,
      sortTime: Math.max(
        metric ? getMetricSortTime(metric) : Number.NEGATIVE_INFINITY,
        getCheckinSortTime(checkin)
      ),
    })
  }

  for (const metric of unpairedMetrics) {
    records.push({
      checkin: null,
      id: bodyDataRecordId(metric, null),
      metric,
      sortTime: getMetricSortTime(metric),
    })
  }

  return records.sort((left, right) => right.sortTime - left.sortTime)
}

function findPairedMetricIndex(
  checkin: AgentCheckin,
  metrics: BodyMetric[]
) {
  const checkinDate = dateKey(localDate(checkin.checkin_date ?? checkin.created_at))
  const checkinTime = dateTime(checkin.created_at)
  let closestIndex = -1
  let closestDistance = Number.POSITIVE_INFINITY

  metrics.forEach((metric, index) => {
    const metricDate = dateKey(localDate(metric.measured_at ?? metric.recorded_at))
    if (metricDate !== checkinDate) {
      return
    }

    const distance = Math.abs(dateTime(metric.recorded_at) - checkinTime)
    if (distance <= BODY_DATA_PAIR_WINDOW_MS && distance < closestDistance) {
      closestDistance = distance
      closestIndex = index
    }
  })

  return closestIndex
}

function bodyDataRecordId(
  metric: BodyMetric | null,
  checkin: AgentCheckin | null
) {
  return `body-data-${metric?.id ?? "none"}-${checkin?.id ?? "none"}`
}

function getBodyDataRecordDate(record: BodyDataRecord) {
  return (
    record.metric?.measured_at ??
    record.metric?.recorded_at ??
    record.checkin?.checkin_date ??
    record.checkin?.created_at ??
    ""
  )
}

function getMetricSortTime(metric: BodyMetric) {
  return dateTime(metric.measured_at ?? metric.recorded_at)
}

function getCheckinSortTime(checkin: AgentCheckin) {
  return dateTime(checkin.created_at)
}

function formatBodyDataRecordSummary(record: BodyDataRecord) {
  return [
    record.metric ? formatBodyMetricSummary(record.metric) : null,
    record.checkin ? formatCheckinSummary(record.checkin) : null,
  ]
    .filter(Boolean)
    .join("，")
}

function formatBodyMetricSummary(metric: BodyMetric) {
  const parts = [
    typeof metric.weight_kg === "number"
      ? `体重 ${metric.weight_kg.toFixed(1)} kg`
      : null,
    typeof metric.body_fat_percentage === "number"
      ? `体脂 ${metric.body_fat_percentage.toFixed(1)}%`
      : null,
    typeof metric.skeletal_muscle_mass_kg === "number"
      ? `骨骼肌 ${metric.skeletal_muscle_mass_kg.toFixed(1)} kg`
      : null,
    typeof metric.waist_cm === "number"
      ? `腰围 ${metric.waist_cm.toFixed(1)} cm`
      : null,
    typeof metric.chest_cm === "number"
      ? `胸围 ${metric.chest_cm.toFixed(1)} cm`
      : null,
    typeof metric.hip_cm === "number"
      ? `臀围 ${metric.hip_cm.toFixed(1)} cm`
      : null,
  ].filter(Boolean)

  return parts.join("，") || "身体测量记录"
}

function formatBodyDataRecordMeta(record: BodyDataRecord) {
  const sources = Array.from(
    new Set(
      [record.metric?.source, record.checkin?.source]
        .filter(Boolean)
        .map((source) => formatMetricSource(source))
    )
  )
  const recordType =
    record.metric && record.checkin
      ? "恢复 + 测量"
      : record.metric
        ? "测量"
        : "恢复"
  const details = [
    ...sources,
    recordType,
    record.metric?.notes,
    record.checkin?.pain_notes,
  ].filter(Boolean)

  return details.join(" · ")
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl">{value}</p>
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

function formatMetricChange(series: MetricPoint[], unit: string) {
  if (series.length < 2) return "暂无周期变化"
  const change = series[series.length - 1].value - series[0].value
  if (Math.abs(change) < 0.05) return `持平`
  return `${change > 0 ? "↑" : "↓"} ${Math.abs(change).toFixed(1)}${unit ? ` ${unit}` : ""}`
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
