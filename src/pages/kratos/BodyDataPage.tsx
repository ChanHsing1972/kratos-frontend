import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  BarChart3,
  Download,
  Dumbbell,
  Eye,
  Flame,
  HeartPulse,
  Pin,
  Plus,
  Scale,
  Timer,
  Trophy,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"

import type {
  BodyMetric,
  DietRecord,
  HealthMetric,
  HeartRateSummary,
  WorkoutLog,
} from "@/entities/kratos/model/types"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/shared/ui/chart"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/shared/ui/pagination"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"

type BodyDataPageProps = {
  bodyMetrics: BodyMetric[]
  dietRecords: DietRecord[]
  healthMetrics: HealthMetric[]
  latestHealthMetric: HealthMetric | null
  latestMetric: BodyMetric | null
  onAddData: () => void
  onEditBodyMetric: (metric: BodyMetric) => void
  onDeleteBodyMetric: (metric: BodyMetric) => void
  onExportBodyData: () => void
  onLoadWorkoutHeartRateSummary: (log: WorkoutLog) => Promise<HeartRateSummary | null>
  workoutLogs: WorkoutLog[]
}

type MetricPoint = {
  date: string
  label: string
  value: number
}

type RangeId = "week" | "month" | "half-year" | "year"
type MetricKind = "line" | "bar"

type MetricDefinition<T extends string> = {
  id: T
  key: string
  kind: MetricKind
  label: string
  unit: string
}

const BODY_IMPORTANT_KEY = "kratos-important-body-metrics-v1"
const HEALTH_IMPORTANT_KEY = "kratos-important-health-metrics-v1"
const DEFAULT_BODY_IMPORTANT = ["weight", "bmi"]
const DEFAULT_HEALTH_IMPORTANT = ["sleep", "active-kcal", "diet-kcal", "resting-hr"]

const BODY_METRIC_DEFS: MetricDefinition<string>[] = [
  { id: "weight", key: "weight_kg", kind: "line", label: "体重", unit: "kg" },
  { id: "bmi", key: "bmi", kind: "line", label: "BMI", unit: "" },
  { id: "body-fat", key: "body_fat_percentage", kind: "line", label: "体脂率", unit: "%" },
  { id: "height", key: "height_cm", kind: "line", label: "身高", unit: "cm" },
  { id: "waist", key: "waist_cm", kind: "line", label: "腰围", unit: "cm" },
  { id: "hip", key: "hip_cm", kind: "line", label: "臀围", unit: "cm" },
  { id: "thigh", key: "thigh_cm", kind: "line", label: "大腿围", unit: "cm" },
  { id: "calf", key: "calf_cm", kind: "line", label: "小腿围", unit: "cm" },
  { id: "chest", key: "chest_cm", kind: "line", label: "胸围", unit: "cm" },
  { id: "arm", key: "arm_cm", kind: "line", label: "臂围", unit: "cm" },
]

const HEALTH_METRIC_DEFS: MetricDefinition<string>[] = [
  { id: "sleep", key: "sleep_hours", kind: "bar", label: "睡眠时长", unit: "h" },
  { id: "active-kcal", key: "active_kcal", kind: "bar", label: "活动消耗", unit: "kcal" },
  { id: "diet-kcal", key: "dietary_kcal", kind: "bar", label: "饮食摄入", unit: "kcal" },
  { id: "hrv", key: "hrv_ms", kind: "line", label: "HRV", unit: "ms" },
  { id: "stress", key: "stress_level", kind: "line", label: "压力", unit: "/10" },
  { id: "resting-hr", key: "resting_heart_rate", kind: "line", label: "静息心率", unit: "bpm" },
  { id: "vo2", key: "vo2_max", kind: "line", label: "最大摄氧量", unit: "" },
  { id: "spo2", key: "blood_oxygen_percentage", kind: "line", label: "血氧饱和度", unit: "%" },
]

const RANGE_OPTIONS: Array<{ id: RangeId; label: string; days: number }> = [
  { id: "week", label: "最近一周", days: 7 },
  { id: "month", label: "最近一月", days: 31 },
  { id: "half-year", label: "最近半年", days: 183 },
  { id: "year", label: "最近一年", days: 365 },
]

const DONUT_COLORS = [
  "var(--foreground)",
  "var(--muted-foreground)",
  "color-mix(in oklch, var(--foreground) 72%, transparent)",
  "color-mix(in oklch, var(--muted-foreground) 72%, transparent)",
  "color-mix(in oklch, var(--foreground) 48%, transparent)",
  "color-mix(in oklch, var(--muted-foreground) 48%, transparent)",
]

export function BodyDataPage({
  bodyMetrics,
  dietRecords,
  healthMetrics,
  latestHealthMetric,
  latestMetric,
  onAddData,
  onDeleteBodyMetric,
  onEditBodyMetric,
  onExportBodyData,
  onLoadWorkoutHeartRateSummary,
  workoutLogs,
}: BodyDataPageProps) {
  const savedWorkoutLogs = useMemo(
    () => workoutLogs.filter(isSavedWorkoutLog),
    [workoutLogs]
  )
  const [importantBody, setImportantBody] = useImportantMetrics(
    BODY_IMPORTANT_KEY,
    DEFAULT_BODY_IMPORTANT
  )
  const [importantHealth, setImportantHealth] = useImportantMetrics(
    HEALTH_IMPORTANT_KEY,
    DEFAULT_HEALTH_IMPORTANT
  )

  return (
    <main className="scrollbar-none min-h-0 flex-1 overflow-y-auto bg-muted/40">
      <section className="mx-auto mt-20 flex min-h-full w-full max-w-[900px] flex-col px-6 pt-8 pb-16 sm:px-8">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <h1 className="text-3xl font-medium tracking-[-0.05em]">数据中心</h1>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onExportBodyData} type="button" variant="ghost">
              <Download />
              导出
            </Button>
            <Button onClick={onAddData} type="button">
              <Plus />
              添加数据
            </Button>
          </div>
        </header>

        <ExerciseOverview logs={savedWorkoutLogs} />

        <MetricSection
          definitions={BODY_METRIC_DEFS}
          emptyIcon={<Scale />}
          importantIds={importantBody}
          latestLabel={latestMetric ? formatFullDate(latestMetric.measured_at ?? latestMetric.recorded_at) : "暂无记录"}
          onToggleImportant={(id) => setImportantBody(toggleMetricId(importantBody, id))}
          renderSeries={(definition) => getBodySeries(bodyMetrics, definition.key)}
          title="身体指标"
        />

        <MetricSection
          definitions={HEALTH_METRIC_DEFS}
          emptyIcon={<HeartPulse />}
          importantIds={importantHealth}
          latestLabel={latestHealthMetric ? formatFullDate(latestHealthMetric.measured_at ?? latestHealthMetric.recorded_at) : "暂无记录"}
          onToggleImportant={(id) => setImportantHealth(toggleMetricId(importantHealth, id))}
          renderSeries={(definition) =>
            getHealthSeries(healthMetrics, dietRecords, definition.key)
          }
          title="健康数据"
        />

        <WorkoutRecordsSection
          logs={savedWorkoutLogs}
          onLoadHeartRateSummary={onLoadWorkoutHeartRateSummary}
        />

        {/* <BodyHistorySection
          metrics={bodyMetrics}
          onDeleteBodyMetric={onDeleteBodyMetric}
          onEditBodyMetric={onEditBodyMetric}
        /> */}
      </section>
    </main>
  )
}

function ExerciseOverview({ logs }: { logs: WorkoutLog[] }) {
  const [range, setRange] = useState<RangeId>("week")
  const rangeOption = RANGE_OPTIONS.find((item) => item.id === range) ?? RANGE_OPTIONS[0]
  const rangeLogs = filterLogsByRange(logs, rangeOption.days)
  const stats = buildExerciseStats(rangeLogs)
  const timeData = buildTimePreferenceData(rangeLogs)
  const typeData = buildWorkoutTypeData(rangeLogs)

  return (
    <section className="mt-10">
      <Tabs value={range} onValueChange={(value) => setRange(value as RangeId)} >
        <div className="flex items-center justify-between">
          <SectionHeader
            description=""
            title="运动总览"
          />
          <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-4">
            {RANGE_OPTIONS.map((item) => (
              <TabsTrigger key={item.id} value={item.id} className="px-3">{item.label}</TabsTrigger>
            ))}
          </TabsList>
        </div>
        {RANGE_OPTIONS.map((item) => (
          <TabsContent className="mt-4" key={item.id} value={item.id}>
            <div className="grid gap-4 sm:grid-cols-4">
              <OverviewStat icon={<Dumbbell />} label="总运动次数" value={`${stats.count} 次`} />
              <OverviewStat icon={<Timer />} label="总运动时长" value={formatDuration(stats.seconds)} />
              <OverviewStat icon={<Flame />} label="总消耗热量" value={`${stats.calories} kcal`} />
              <OverviewStat icon={<Trophy />} label="累计运动天数" value={`${stats.days} 天`} />
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
              <ChartCard title="运动时间偏好">
                <PreferenceBarChart data={timeData} />
              </ChartCard>
              <ChartCard title="训练类型偏好">
                <PreferenceDonutChart data={typeData} />
              </ChartCard>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  )
}

function MetricSection({
  definitions,
  emptyIcon,
  importantIds,
  latestLabel,
  onToggleImportant,
  renderSeries,
  title,
}: {
  definitions: MetricDefinition<string>[]
  emptyIcon: ReactNode
  importantIds: string[]
  latestLabel: string
  onToggleImportant: (id: string) => void
  renderSeries: (definition: MetricDefinition<string>) => MetricPoint[]
  title: string
}) {
  const importantDefinitions = definitions.filter((definition) =>
    importantIds.includes(definition.id)
  )
  const moreDefinitions = definitions.filter((definition) =>
    !importantIds.includes(definition.id)
  )

  return (
    <section className="mt-12">
      <SectionHeader description={`最近记录：${latestLabel}`} title={title} />
      {importantDefinitions.length ? (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {importantDefinitions.map((definition) => (
            <MetricChartCard
              definition={definition}
              important
              key={definition.id}
              onToggleImportant={onToggleImportant}
              series={renderSeries(definition)}
            />
          ))}
        </div>
      ) : (
        <Empty className="mt-5 min-h-52 border border-dashed bg-background/60">
          <EmptyHeader>
            <EmptyMedia variant="icon">{emptyIcon}</EmptyMedia>
            <EmptyTitle>暂无重要指标</EmptyTitle>
            <EmptyDescription>在更多指标中标记重要后会显示在这里。</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <Accordion className="mt-5" collapsible type="single">
        <AccordionItem value="more">
          <AccordionTrigger>
            <span className="flex items-center gap-2">
              更多指标
              <Badge variant="outline">{moreDefinitions.length}</Badge>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-5 pt-3 lg:grid-cols-2">
              {moreDefinitions.map((definition) => (
                <MetricChartCard
                  definition={definition}
                  important={false}
                  key={definition.id}
                  onToggleImportant={onToggleImportant}
                  series={renderSeries(definition)}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  )
}

function MetricChartCard({
  definition,
  important,
  onToggleImportant,
  series,
}: {
  definition: MetricDefinition<string>
  important: boolean
  onToggleImportant: (id: string) => void
  series: MetricPoint[]
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>{definition.label}</CardTitle>
          <p className="mt-1 text-2xl font-medium tracking-tight">
            {formatLatest(series, definition.unit)}
          </p>
        </div>
        <Button
          onClick={() => onToggleImportant(definition.id)}
          size="sm"
          type="button"
          variant="ghost"
          className="text-muted-foreground"
        >
          {important ? < Eye /> : <Pin />}
        </Button>
      </CardHeader>
      <CardContent>
        <MetricMiniChart
          kind={definition.kind}
          label={definition.label}
          series={series}
          unit={definition.unit}
        />
      </CardContent>
    </Card>
  )
}

function MetricMiniChart({
  kind,
  label,
  series,
  unit,
}: {
  kind: MetricKind
  label: string
  series: MetricPoint[]
  unit: string
}) {
  if (!series.length) {
    return (
      <Empty className="min-h-40 border border-dashed bg-muted/20">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BarChart3 />
          </EmptyMedia>
          <EmptyTitle>无数据</EmptyTitle>
        </EmptyHeader>
      </Empty>
    )
  }

  const chartConfig = {
    value: {
      color: "var(--foreground)",
      label,
    },
  } satisfies ChartConfig

  return (
    <ChartContainer
      className="mt-2 h-48 w-full"
      config={chartConfig}
      initialDimension={{ height: 192, width: 460 }}
    >
      {kind === "bar" ? (
        <BarChart data={series} margin={{ bottom: 0, left: 0, right: 8, top: 12 }}>
          <CartesianGrid stroke="color-mix(in oklch, var(--muted-foreground) 12%, transparent)" strokeDasharray="3 8" vertical={false} />
          <XAxis axisLine={false} dataKey="label" minTickGap={18} tick={{ fontSize: 12 }} tickLine={false} tickMargin={10} />
          <YAxis allowDecimals={false} axisLine={false} tick={{ fontSize: 12 }} tickFormatter={(value: number) => formatAxisTick(value, unit)} tickLine={false} tickMargin={8} width={48} />
          <ChartTooltip content={<ChartTooltipContent indicator="dot" />} cursor={{ fill: "color-mix(in oklch, var(--muted) 50%, transparent)" }} />
          <Bar dataKey="value" fill="var(--color-value)" radius={[6, 6, 0, 0]} />
        </BarChart>
      ) : (
        <LineChart data={series} margin={{ bottom: 0, left: 0, right: 12, top: 12 }}>
          <CartesianGrid stroke="color-mix(in oklch, var(--muted-foreground) 12%, transparent)" strokeDasharray="3 8" vertical={false} />
          <XAxis axisLine={false} dataKey="label" minTickGap={18} tick={{ fontSize: 12 }} tickLine={false} tickMargin={10} />
          <YAxis axisLine={false} domain={metricDomain(series, unit)} tick={{ fontSize: 12 }} tickCount={4} tickFormatter={(value: number) => formatAxisTick(value, unit)} tickLine={false} tickMargin={8} width={52} />
          <ChartTooltip content={<ChartTooltipContent indicator="dot" />} cursor={{ stroke: "color-mix(in oklch, var(--muted-foreground) 22%, transparent)" }} />
          <Line activeDot={{ r: 5, strokeWidth: 2 }} dataKey="value" dot={{ r: 3, strokeWidth: 2 }} stroke="var(--color-value)" strokeLinecap="round" strokeWidth={2.2} type="monotone" />
        </LineChart>
      )}
    </ChartContainer>
  )
}

function PreferenceBarChart({ data }: { data: Array<{ label: string; value: number }> }) {
  if (!data.some((item) => item.value > 0)) {
    return <ChartEmpty icon={<Timer />} title="暂无运动时间数据" />
  }
  const chartConfig = {
    value: { color: "var(--foreground)", label: "次数" },
  } satisfies ChartConfig
  return (
    <ChartContainer className="h-64 w-full" config={chartConfig} initialDimension={{ height: 256, width: 620 }}>
      <BarChart data={data} margin={{ bottom: 0, left: 0, right: 8, top: 12 }}>
        <CartesianGrid stroke="color-mix(in oklch, var(--muted-foreground) 12%, transparent)" strokeDasharray="3 8" vertical={false} />
        <XAxis axisLine={false} dataKey="label" tick={{ fontSize: 12 }} tickLine={false} tickMargin={10} />
        <YAxis allowDecimals={false} axisLine={false} tick={{ fontSize: 12 }} tickLine={false} tickMargin={8} width={36} />
        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} cursor={{ fill: "color-mix(in oklch, var(--muted) 50%, transparent)" }} />
        <Bar dataKey="value" fill="var(--color-value)" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}

function PreferenceDonutChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const hasData = data.some((item) => item.value > 0)
  if (!hasData) {
    return <ChartEmpty icon={<Dumbbell />} title="暂无训练类型数据" />
  }
  const chartConfig = {
    value: { color: "var(--foreground)", label: "次数" },
  } satisfies ChartConfig
  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center">
      <ChartContainer className="h-64 w-full" config={chartConfig} initialDimension={{ height: 256, width: 320 }}>
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          <Pie
            data={data}
            dataKey="value"
            innerRadius={54}
            nameKey="label"
            outerRadius={82}
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell fill={DONUT_COLORS[index % DONUT_COLORS.length]} key={entry.label} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div className="flex items-center justify-between gap-3 text-sm" key={item.label}>
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }}
              />
              <span className="truncate">{item.label}</span>
            </span>
            <span className="text-muted-foreground">{item.value} 次</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function WorkoutRecordsSection({
  logs,
  onLoadHeartRateSummary,
}: {
  logs: WorkoutLog[]
  onLoadHeartRateSummary: (log: WorkoutLog) => Promise<HeartRateSummary | null>
}) {
  const [selectedLog, setSelectedLog] = useState<WorkoutLog | null>(null)
  const [heartRateSummary, setHeartRateSummary] = useState<HeartRateSummary | null>(null)
  const [heartRateLoading, setHeartRateLoading] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 8
  const sortedLogs = [...logs].sort((left, right) => dateTime(right.workout_date) - dateTime(left.workout_date))
  const pageCount = Math.max(1, Math.ceil(sortedLogs.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pagedLogs = sortedLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    let cancelled = false
    if (!selectedLog) {
      setHeartRateSummary(null)
      return undefined
    }
    setHeartRateLoading(true)
    void onLoadHeartRateSummary(selectedLog)
      .then((summary) => {
        if (!cancelled) setHeartRateSummary(summary)
      })
      .catch(() => {
        if (!cancelled) setHeartRateSummary(null)
      })
      .finally(() => {
        if (!cancelled) setHeartRateLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [onLoadHeartRateSummary, selectedLog])

  useEffect(() => {
    setPage(1)
  }, [logs.length])

  return (
    <section className="mt-12">
      <SectionHeader description="" title="运动记录" />
      {sortedLogs.length ? (
        <div className="overflow-x-auto mt-4">
          <Table className="">
            <TableHeader>
              <TableRow>
                <TableHead>训练名称</TableHead>
                <TableHead>训练时间</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>时长</TableHead>
                <TableHead>热量</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedLogs.map((log) => (
                <TableRow className="cursor-pointer" key={log.id} onClick={() => setSelectedLog(log)}>
                  <TableCell className="font-medium">{log.title || "未命名训练"}</TableCell>
                  <TableCell>{formatFullDate(log.workout_date)}</TableCell>
                  <TableCell>{formatWorkoutType(log.workout_type)}</TableCell>
                  <TableCell>{formatDuration(getWorkoutSeconds(log))}</TableCell>
                  <TableCell>{log.calories_burned ?? 0} kcal</TableCell>
                  <TableCell>
                    <Badge variant={log.completed ? "default" : "secondary"}>
                      {log.completed ? "完成" : "已保存"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {pageCount > 1 ? (
            <Pagination className="mt-5">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    aria-disabled={currentPage === 1}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                    href="#"
                    onClick={(event) => {
                      event.preventDefault()
                      setPage((value) => Math.max(1, value - 1))
                    }}
                  />
                </PaginationItem>
                {buildPaginationItems(currentPage, pageCount).map((item) => (
                  <PaginationItem key={item}>
                    <PaginationLink
                      href="#"
                      isActive={item === currentPage}
                      onClick={(event) => {
                        event.preventDefault()
                        setPage(item)
                      }}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    aria-disabled={currentPage === pageCount}
                    className={currentPage === pageCount ? "pointer-events-none opacity-50" : undefined}
                    href="#"
                    onClick={(event) => {
                      event.preventDefault()
                      setPage((value) => Math.min(pageCount, value + 1))
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          ) : null}
        </div>
      ) : (
        <Empty className="min-h-60 border border-dashed bg-muted/20">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Dumbbell />
            </EmptyMedia>
            <EmptyTitle>还没有运动记录</EmptyTitle>
            <EmptyDescription>训练计划中点击保存后会生成记录。</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <WorkoutDetailDialog
        heartRateLoading={heartRateLoading}
        heartRateSummary={heartRateSummary}
        log={selectedLog}
        onOpenChange={(open) => {
          if (!open) setSelectedLog(null)
        }}
      />
    </section>
  )
}

function WorkoutDetailDialog({
  heartRateLoading,
  heartRateSummary,
  log,
  onOpenChange,
}: {
  heartRateLoading: boolean
  heartRateSummary: HeartRateSummary | null
  log: WorkoutLog | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={Boolean(log)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{log?.title || "运动详情"}</DialogTitle>
          <DialogDescription>
            {log ? `${formatFullDate(log.workout_date)} · ${formatWorkoutType(log.workout_type)} · ${formatDuration(getWorkoutSeconds(log))}` : ""}
          </DialogDescription>
        </DialogHeader>
        {log ? (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <DetailMetric label="完成状态" value={log.completed ? "完成" : "已保存"} />
              <DetailMetric label="消耗热量" value={`${log.calories_burned ?? 0} kcal`} />
              <DetailMetric label="RPE" value={log.perceived_exertion ? `${log.perceived_exertion}/10` : "未记录"} />
            </div>

            <section>
              <h3 className="text-sm font-medium">训练动作</h3>
              <div className="mt-3 space-y-3">
                {log.exercises.length ? log.exercises.map((exercise) => (
                  <div className="rounded-lg border border-border/60 bg-background px-3 py-3" key={`${exercise.name}-${exercise.position}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{exercise.name}</p>
                      <Badge variant={exercise.completed ? "default" : "secondary"}>
                        {exercise.completed ? "完成" : "未完成"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {exercise.sets.length ? exercise.sets.map(formatSet).join("；") : "未记录组次"}
                    </p>
                    {exercise.notes ? <p className="mt-2 text-sm">{exercise.notes}</p> : null}
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">未记录训练动作。</p>
                )}
              </div>
            </section>

            <section>
              <h3 className="text-sm font-medium">心率摘要</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {heartRateLoading
                  ? "正在加载心率摘要..."
                  : heartRateSummary?.sample_count
                    ? `平均 ${heartRateSummary.avg_bpm ?? "--"} bpm，最高 ${heartRateSummary.max_bpm ?? "--"} bpm，主要区间 ${heartRateSummary.dominant_zone_label ?? "未识别"}`
                    : "本次暂无心率样本。"}
              </p>
            </section>

            <section>
              <h3 className="text-sm font-medium">训练反馈与备注</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                {log.notes || "暂无备注。"}
              </p>
            </section>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function BodyHistorySection({
  metrics,
  onDeleteBodyMetric,
  onEditBodyMetric,
}: {
  metrics: BodyMetric[]
  onDeleteBodyMetric: (metric: BodyMetric) => void
  onEditBodyMetric: (metric: BodyMetric) => void
}) {
  const sorted = [...metrics].sort((left, right) => dateTime(right.measured_at ?? right.recorded_at) - dateTime(left.measured_at ?? left.recorded_at)).slice(0, 8)
  if (!sorted.length) return null

  return (
    <section className="mt-12">
      <SectionHeader description="最近 8 条身体指标记录。" title="身体记录" />
      <div className="mt-5 space-y-3">
        {sorted.map((metric) => (
          <Card className="border-border/50 shadow-none" key={metric.id}>
            <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">{formatBodySummary(metric)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatFullDate(metric.measured_at ?? metric.recorded_at)}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => onEditBodyMetric(metric)} size="sm" type="button" variant="outline">编辑</Button>
                <Button onClick={() => onDeleteBodyMetric(metric)} size="sm" type="button" variant="ghost">删除</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

function ChartCard({ children, title }: { children: ReactNode; title: string }) {
  return (
    <Card className="border-border/50 shadow-none">
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function ChartEmpty({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <Empty className="min-h-64 border border-dashed bg-muted/20">
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
      </EmptyHeader>
    </Empty>
  )
}

function OverviewStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Card className="shadow-none">
      <CardContent className="flex gap-3">
        <span className="mt-1 text-muted-foreground [&_svg]:size-4">{icon}</span>
        <span>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-xl font-medium tracking-tight">{value}</p>
        </span>
      </CardContent>
    </Card>
  )
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/35 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  )
}

function SectionHeader({ description, title }: { description: string; title: string }) {
  return (
    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
      <h2 className="text-xl font-medium tracking-[-0.03em]">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function useImportantMetrics(key: string, defaults: string[]) {
  const [value, setValue] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(key)
      const parsed = raw ? JSON.parse(raw) : null
      return Array.isArray(parsed) && parsed.every((item) => typeof item === "string")
        ? parsed
        : defaults
    } catch {
      return defaults
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Local preference persistence is optional.
    }
  }, [key, value])

  return [value, setValue] as const
}

function toggleMetricId(current: string[], id: string) {
  return current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id]
}

function getBodySeries(metrics: BodyMetric[], key: string): MetricPoint[] {
  return metrics
    .map((metric) => {
      const date = metric.measured_at ?? metric.recorded_at
      const rawValue =
        key === "bmi"
          ? metric.bmi ?? calculateBmi(metric)
          : metric[key as keyof BodyMetric]
      const value = typeof rawValue === "number" ? rawValue : null
      return value !== null && Number.isFinite(value)
        ? { date, label: formatShortDate(date), value }
        : null
    })
    .filter((point): point is MetricPoint => Boolean(point))
    .sort((left, right) => dateTime(left.date) - dateTime(right.date))
    .slice(-40)
}

function getHealthSeries(
  metrics: HealthMetric[],
  dietRecords: DietRecord[],
  key: string
): MetricPoint[] {
  if (key === "dietary_kcal") {
    return getDietKcalSeries(metrics, dietRecords)
  }
  return metrics
    .map((metric) => {
      const date = metric.measured_at ?? metric.recorded_at
      const rawValue = metric[key as keyof HealthMetric]
      const value = typeof rawValue === "number" ? rawValue : null
      return value !== null && Number.isFinite(value)
        ? { date, label: formatShortDate(date), value }
        : null
    })
    .filter((point): point is MetricPoint => Boolean(point))
    .sort((left, right) => dateTime(left.date) - dateTime(right.date))
    .slice(-40)
}

function getDietKcalSeries(metrics: HealthMetric[], records: DietRecord[]): MetricPoint[] {
  const byDate = new Map<string, number>()
  for (const record of records) {
    const date = dateKey(record.meal_date)
    byDate.set(date, (byDate.get(date) ?? 0) + record.estimated_kcal)
  }
  for (const metric of metrics) {
    if (typeof metric.dietary_kcal === "number") {
      const date = dateKey(metric.metric_date ?? metric.measured_at ?? metric.recorded_at)
      byDate.set(date, metric.dietary_kcal)
    }
  }
  return [...byDate.entries()]
    .map(([date, value]) => ({ date, label: formatShortDate(date), value: roundOne(value) }))
    .sort((left, right) => dateTime(left.date) - dateTime(right.date))
    .slice(-40)
}

function filterLogsByRange(logs: WorkoutLog[], days: number) {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - days + 1)
  return logs.filter((log) => localDate(log.workout_date) >= start)
}

function buildExerciseStats(logs: WorkoutLog[]) {
  const trainedDates = new Set(logs.map((log) => dateKey(log.workout_date)))
  const seconds = logs.reduce((sum, log) => sum + getWorkoutSeconds(log), 0)
  return {
    calories: logs.reduce((sum, log) => sum + (log.calories_burned ?? 0), 0),
    count: logs.length,
    days: trainedDates.size,
    seconds,
  }
}

function buildTimePreferenceData(logs: WorkoutLog[]) {
  const buckets = [
    { label: "凌晨", max: 5, min: 0, value: 0 },
    { label: "上午", max: 10, min: 6, value: 0 },
    { label: "中午", max: 13, min: 11, value: 0 },
    { label: "下午", max: 17, min: 14, value: 0 },
    { label: "傍晚", max: 20, min: 18, value: 0 },
    { label: "夜间", max: 23, min: 21, value: 0 },
  ]
  for (const log of logs) {
    const date = new Date(log.created_at)
    const hour = Number.isNaN(date.getTime()) ? 12 : date.getHours()
    const bucket = buckets.find((item) => hour >= item.min && hour <= item.max) ?? buckets[2]
    bucket.value += 1
  }
  return buckets.map(({ label, value }) => ({ label, value }))
}

function buildWorkoutTypeData(logs: WorkoutLog[]) {
  const byType = new Map<string, number>()
  for (const log of logs) {
    const label = formatWorkoutType(log.workout_type)
    byType.set(label, (byType.get(label) ?? 0) + 1)
  }
  return [...byType.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value)
}

function isSavedWorkoutLog(log: WorkoutLog) {
  return getWorkoutSeconds(log) > 0 || Boolean(log.completed)
}

function getWorkoutSeconds(log: WorkoutLog) {
  return log.duration_seconds ?? (log.duration_minutes ?? 0) * 60
}

function calculateBmi(metric: BodyMetric | null) {
  if (!metric?.height_cm || !metric.weight_kg) return null
  return Number((metric.weight_kg / (metric.height_cm / 100) ** 2).toFixed(1))
}

function metricDomain(series: MetricPoint[], unit: string): [number, number] {
  if (unit === "/10") return [0, 10]
  if (unit === "h") return [0, 12]
  const values = series.map((point) => point.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1]
  const range = Math.max(max - min, 1)
  const padding = Math.max(range * 0.3, 1)
  return [Math.max(0, Math.floor((min - padding) * 10) / 10), Math.ceil((max + padding) * 10) / 10]
}

function formatAxisTick(value: number, unit: string) {
  if (unit === "kg") return formatNumber(value)
  if (unit === "kcal") return value >= 1000 ? `${Math.round(value / 100) / 10}k` : `${value}`
  if (unit === "bpm" || unit === "ms" || unit === "cm" || unit === "h") return formatNumber(value)
  return unit ? `${formatNumber(value)}${unit}` : formatNumber(value)
}

function formatLatest(series: MetricPoint[], unit: string) {
  const latest = series[series.length - 1]
  return latest ? `${formatNumber(latest.value)}${unit ? ` ${unit}` : ""}` : "未记录"
}

function formatSet(set: WorkoutLog["exercises"][number]["sets"][number]) {
  const reps = set.reps ? `${set.reps} 次` : "未填次数"
  const weight = set.weight_kg ? `${set.weight_kg} kg` : null
  const rpe = set.rpe ? `RPE ${set.rpe}` : null
  return [`第 ${set.set_number} 组`, reps, weight, rpe].filter(Boolean).join(" · ")
}

function formatBodySummary(metric: BodyMetric) {
  return [
    typeof metric.weight_kg === "number" ? `体重 ${formatNumber(metric.weight_kg)} kg` : null,
    typeof metric.bmi === "number" ? `BMI ${formatNumber(metric.bmi)}` : null,
    typeof metric.body_fat_percentage === "number" ? `体脂 ${formatNumber(metric.body_fat_percentage)}%` : null,
    typeof metric.waist_cm === "number" ? `腰围 ${formatNumber(metric.waist_cm)} cm` : null,
  ].filter(Boolean).join("，") || "身体指标记录"
}


function buildPaginationItems(currentPage: number, pageCount: number) {
  const start = Math.max(1, Math.min(currentPage - 1, pageCount - 2))
  const end = Math.min(pageCount, start + 2)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

function formatWorkoutType(type: string | null | undefined) {
  const map: Record<string, string> = {
    cardio: "有氧",
    mobility: "灵活性",
    running: "跑步",
    strength: "力量",
    yoga: "瑜伽",
  }
  return type ? (map[type] ?? type) : "未分类"
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.round(totalSeconds / 60)
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const rest = minutes % 60
    return rest ? `${hours} 小时 ${rest} 分钟` : `${hours} 小时`
  }
  return `${minutes} 分钟`
}

function formatShortDate(date: string) {
  const parsed = localDate(date)
  if (Number.isNaN(parsed.getTime())) return date.slice(5, 10)
  return `${`${parsed.getMonth() + 1}`.padStart(2, "0")}.${`${parsed.getDate()}`.padStart(2, "0")}`
}

function formatFullDate(date: string) {
  const parsed = localDate(date)
  if (Number.isNaN(parsed.getTime())) return date.slice(0, 10)
  return `${parsed.getFullYear()}.${`${parsed.getMonth() + 1}`.padStart(2, "0")}.${`${parsed.getDate()}`.padStart(2, "0")}`
}

function dateKey(value: string) {
  const parsed = localDate(value)
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10)
  return `${parsed.getFullYear()}-${`${parsed.getMonth() + 1}`.padStart(2, "0")}-${`${parsed.getDate()}`.padStart(2, "0")}`
}

function localDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number)
    return new Date(year, month - 1, day)
  }
  return new Date(value)
}

function dateTime(value: string) {
  const parsed = localDate(value)
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime()
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10
}
