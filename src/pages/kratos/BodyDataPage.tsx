import {
  Activity,
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
} from "lucide-react"
import { useState, type ReactNode } from "react"

import type {
  AgentCheckin,
  BodyMetric,
  OnboardingStatus,
  WorkoutLog,
} from "@/entities/kratos/model/types"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty"
import { Progress } from "@/shared/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
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
  const todayCheckin = isToday(latestCheckin?.checkin_date ?? latestCheckin?.created_at)
    ? latestCheckin
    : null
  const todayMetric = isToday(latestMetric?.measured_at ?? latestMetric?.recorded_at)
    ? latestMetric
    : null
  const weight = latestMetric?.weight_kg ?? null
  const targetWeight = latestMetric?.target_weight_kg ?? null
  const targetProgress = calculateTargetProgress(weightSeries[0]?.value ?? null, weight, targetWeight)

  return (
    <main className="scrollbar-none min-h-0 flex-1 overflow-y-auto bg-muted/40">
      <section className="mx-auto mt-20 flex min-h-full w-full max-w-[900px] flex-col sm:p-8">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <h1 className="mt-1 text-3xl font-medium tracking-[-0.05em]">身体数据</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              睡眠、精力与酸痛来自恢复打卡；体重与围度来自身体测量。趋势帮助 Kratos 调整下一周。
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button onClick={onExportBodyData} type="button" variant="ghost">
              <Download />
              导出
            </Button>
          </div>
        </header>

        <TodayStatusHero
          latestCheckin={todayCheckin}
          latestMetric={todayMetric}
          onRecord={onEditBodyData}
        />

        <Tabs className="mt-12" defaultValue="trend">
          <TabsList aria-label="身体数据查看范围" variant="line">
            <TabsTrigger value="trend">
              <TrendingUp />
              趋势
            </TabsTrigger>
            <TabsTrigger value="extended">
              更多身体指标
            </TabsTrigger>
            <TabsTrigger value="records">
              <History />
              记录与隐私
            </TabsTrigger>
          </TabsList>

          <TabsContent className="mt-4 space-y-4" value="trend">
            <TrendPanel
              energySeries={energySeries}
              sleepSeries={sleepSeries}
              sorenessSeries={sorenessSeries}
              targetProgress={targetProgress}
              targetWeight={targetWeight}
              weightSeries={weightSeries}
              workoutLogs={workoutLogs.filter((log) => log.completed)}
            />
          </TabsContent>

          <TabsContent className="mt-4" value="extended">
            <ExtendedTrendPanel
              bodyFatSeries={bodyFatSeries}
              bodyMetrics={bodyMetrics}
              muscleSeries={muscleSeries}
            />
          </TabsContent>

          <TabsContent className="mt-4 space-y-4" value="records">
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

function TodayStatusHero({
  latestCheckin,
  latestMetric,
  onRecord,
}: {
  latestCheckin: AgentCheckin | null
  latestMetric: BodyMetric | null
  onRecord: () => void
}) {
  const hasTodayData = Boolean(latestCheckin)

  return (
    <section className="mt-12">
      <div className="mb-4 flex items-center justify-between">
        {/* <div>
          <h2 className="text-lg font-medium">今天的状态</h2>
          <p className="mt-1 text-sm text-muted-foreground">睡眠与主观恢复用于训练安排，体重用于长期趋势。</p>
        </div> */}
        {hasTodayData ? (
          <Button onClick={() => onRecord()} size="sm" type="button" variant="outline">
            更新记录
          </Button>
        ) : null}
      </div>
      {hasTodayData ? (
        <Card className="gap-0 py-0">
          <div className="grid sm:grid-cols-4">
            <StatusMetric icon={MoonStar} label="睡眠" value={formatMetricWithUnit(latestCheckin?.sleep_hours, "h")} />
            <StatusMetric icon={Activity} label="精力" value={formatScore(latestCheckin?.energy_level)} />
            <StatusMetric icon={Gauge} label="酸痛" value={formatScore(latestCheckin?.soreness_level)} />
            <StatusMetric icon={Scale} label="体重" value={formatMetricWithUnit(latestMetric?.weight_kg, "kg")} />
          </div>
        </Card>
      ) : (
        <Empty className="min-h-52 border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><Plus /></EmptyMedia>
            <EmptyTitle>今天还没有状态记录</EmptyTitle>
            <EmptyDescription>记录睡眠、精力、酸痛与体重，供训练计划页生成今天的建议。</EmptyDescription>
          </EmptyHeader>
          <Button onClick={() => onRecord()} type="button">
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
    <div className="flex min-h-27 gap-3 px-5 py-5 not-last:border-b sm:not-last:border-r sm:not-last:border-b-0">
      <Icon className="mt-1 size-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-medium tracking-tight">{value}</p>
      </div>
    </div>
  )
}

function TrendPanel({
  energySeries,
  sleepSeries,
  sorenessSeries,
  targetProgress,
  targetWeight,
  weightSeries,
  workoutLogs,
}: {
  energySeries: MetricPoint[]
  sleepSeries: MetricPoint[]
  sorenessSeries: MetricPoint[]
  targetProgress: number | null
  targetWeight: number | null
  weightSeries: MetricPoint[]
  workoutLogs: WorkoutLog[]
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <TrendChartCard label="体重" series={weightSeries} unit="kg">
          {typeof targetProgress === "number" ? (
            <div className="mt-4 rounded-xl bg-muted/50 p-3">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span>目标体重 {formatMetricWithUnit(targetWeight, "kg")}</span>
                <span className="text-muted-foreground">{targetProgress}%</span>
              </div>
              <Progress value={targetProgress} />
            </div>
          ) : null}
        </TrendChartCard>
        <TrendChartCard label="酸痛" series={sorenessSeries} unit="/10" />
        <TrendChartCard label="精力" series={energySeries} unit="/10" />
        <TrendChartCard label="睡眠" series={sleepSeries} unit="h" />
      </div>
      <TrainingFeedbackPanel logs={workoutLogs} />
    </>
  )
}

function ExtendedTrendPanel({
  bodyFatSeries,
  bodyMetrics,
  muscleSeries,
}: {
  bodyFatSeries: MetricPoint[]
  bodyMetrics: BodyMetric[]
  muscleSeries: MetricPoint[]
}) {
  const [selectedTrend, setSelectedTrend] = useState("body-fat")
  const trends = [
    { id: "body-fat", label: "体脂率", unit: "%", series: bodyFatSeries },
    { id: "muscle", label: "骨骼肌", unit: "kg", series: muscleSeries },
    { id: "bmi", label: "BMI", unit: "", series: getBmiSeries(bodyMetrics) },
    { id: "waist", label: "腰围", unit: "cm", series: getMetricSeries(bodyMetrics, "waist_cm") },
    { id: "chest", label: "胸围", unit: "cm", series: getMetricSeries(bodyMetrics, "chest_cm") },
    { id: "hip", label: "臀围", unit: "cm", series: getMetricSeries(bodyMetrics, "hip_cm") },
  ]
  const activeTrend = trends.find((trend) => trend.id === selectedTrend) ?? trends[0]

  return (
    <Card>
      <CardHeader className="sm:flex sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>更多身体指标</CardTitle>
          <CardDescription>选择一项低频测量指标，查看它的长期变化。</CardDescription>
        </div>
        <Select onValueChange={setSelectedTrend} value={selectedTrend}>
          <SelectTrigger className="mt-3 w-40 sm:mt-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {trends.map((trend) => (
              <SelectItem key={trend.id} value={trend.id}>{trend.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <LineChart series={activeTrend.series} unit={activeTrend.unit} />
      </CardContent>
    </Card>
  )
}

function TrendChartCard({
  children,
  label,
  series,
  unit,
}: {
  children?: ReactNode
  label: string
  series: MetricPoint[]
  unit: string
}) {
  return (
    <Card>
      <CardHeader className="grid-cols-[1fr_auto]">
        <CardTitle>{label}</CardTitle>
        <div className="text-right">
          <p className="font-medium">{formatSeriesLatest(series, unit)}</p>
          <p className="text-xs text-muted-foreground">{formatMetricChange(series, unit)}</p>
        </div>
      </CardHeader>
      <CardContent>
        <LineChart compact series={series} unit={unit} />
        {children}
      </CardContent>
    </Card>
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
      <Card>
        <CardHeader>
          <CardTitle>恢复打卡记录</CardTitle>
          <CardDescription>
            Hero 中的睡眠、精力与酸痛来自这里，与体重、围度等身体测量分别保存。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {checkins.length ? (
            <div className="divide-y">
              {checkins.slice(0, 10).map((checkin) => (
                <div className="flex items-center gap-4 py-4" key={checkin.id}>
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
            <p className="py-8 text-center text-sm text-muted-foreground">还没有恢复打卡记录。</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>身体测量记录</CardTitle>
          <CardDescription>体重、体脂与围度记录存放在这里，不包含恢复打卡；每次录入均可修正或删除。</CardDescription>
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

function LineChart({ compact = false, series, unit }: { compact?: boolean; series: MetricPoint[]; unit: string }) {
  if (series.length < 2) {
    return (
      <Empty className={compact ? "mt-4 min-h-32 border" : "mt-4 min-h-48 border"}>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TrendingUp />
          </EmptyMedia>
          <EmptyTitle>再记录一次即可查看趋势</EmptyTitle>
          {!compact ? <EmptyDescription>至少需要两个独立时间点，才会比较变化方向。</EmptyDescription> : null}
        </EmptyHeader>
      </Empty>
    )
  }

  const width = 700
  const height = compact ? 112 : 185
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
          y1={20 + line * ((height - 24) / 2)}
          y2={20 + line * ((height - 24) / 2)}
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

function getMetricSeries(
  metrics: BodyMetric[],
  key: keyof Pick<
    BodyMetric,
    "body_fat_percentage" | "chest_cm" | "hip_cm" | "skeletal_muscle_mass_kg" | "waist_cm" | "weight_kg"
  >
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

function getCheckinSeries(
  checkins: AgentCheckin[],
  key: keyof Pick<AgentCheckin, "energy_level" | "sleep_hours" | "soreness_level">
): MetricPoint[] {
  return checkins
    .filter((checkin) => checkin[key] !== null && checkin[key] !== undefined)
    .sort(
      (left, right) =>
        new Date(left.checkin_date ?? left.created_at).getTime() -
        new Date(right.checkin_date ?? right.created_at).getTime()
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
    .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime())
    .slice(-30)
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

function formatMetricSource(source: string | null | undefined) {
  if (source === "chat_confirmation") return "对话确认"
  if (source === "onboarding") return "建档录入"
  return "手动录入"
}

function formatCheckinSummary(checkin: AgentCheckin) {
  const parts = [
    typeof checkin.sleep_hours === "number" ? `睡眠 ${checkin.sleep_hours.toFixed(1)} h` : null,
    typeof checkin.energy_level === "number" ? `精力 ${checkin.energy_level}/10` : null,
    typeof checkin.soreness_level === "number" ? `酸痛 ${checkin.soreness_level}/10` : null,
  ].filter(Boolean)

  return parts.join(" · ") || "恢复状态记录"
}

function formatMetricWithUnit(value: number | null | undefined, unit: string) {
  return typeof value === "number" ? `${value.toFixed(1)} ${unit}` : "暂无记录"
}

function formatSeriesLatest(series: MetricPoint[], unit: string) {
  const latest = series[series.length - 1]
  return latest ? `${latest.value.toFixed(1)}${unit ? ` ${unit}` : ""}` : "未记录"
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
  if (Number.isNaN(parsed.getTime())) return "--.--"
  return `${(parsed.getMonth() + 1).toString().padStart(2, "0")}.${parsed.getDate().toString().padStart(2, "0")}`
}

function formatFullDate(date: string) {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date.slice(0, 10)
  return `${parsed.getFullYear()}.${(parsed.getMonth() + 1).toString().padStart(2, "0")}.${parsed.getDate().toString().padStart(2, "0")}`
}

function isToday(value: string | null | undefined) {
  if (!value) return false
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return false
  const today = new Date()
  return (
    parsed.getFullYear() === today.getFullYear() &&
    parsed.getMonth() === today.getMonth() &&
    parsed.getDate() === today.getDate()
  )
}
