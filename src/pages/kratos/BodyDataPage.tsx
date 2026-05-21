import { useState } from "react"
import {
  Check,
  ChevronRight,
  Circle,
  ClipboardList,
  Gauge,
  PlusCircle,
  Scale,
  Utensils,
} from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Calendar } from "@/shared/ui/calendar"
import { cn } from "@/shared/lib/utils"
import type {
  AgentCheckin,
  BodyMetric,
  FitnessProfile,
  OnboardingStatus,
  WorkoutLog,
} from "@/entities/kratos/model/types"
import { KratosPageHeader } from "@/widgets/kratos/layout/KratosPageHeader"

const BODY_DATA_TABS = ["概览", "体成分", "围度", "恢复状态", "力量表现", "心肺健康", "体能测试", "健康指标"] as const
type BodyDataTab = (typeof BODY_DATA_TABS)[number]

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
  const [activeTab, setActiveTab] = useState<BodyDataTab>("概览")
  const weightSeries = getMetricSeries(bodyMetrics, "weight_kg")
  const bodyFatSeries = getMetricSeries(bodyMetrics, "body_fat_percentage")
  const muscleSeries = getMetricSeries(bodyMetrics, "skeletal_muscle_mass_kg")
  const chestSeries = getMetricSeries(bodyMetrics, "chest_cm")
  const waistSeries = getMetricSeries(bodyMetrics, "waist_cm")
  const hipSeries = getMetricSeries(bodyMetrics, "hip_cm")
  const sleepSeries = getMetricSeries(bodyMetrics, "sleep_hours")
  const bodyCompositionSeries = getBodyCompositionSeries(bodyMetrics)
  const weight = latestMetric?.weight_kg ?? null
  const bodyFat = latestMetric?.body_fat_percentage ?? null
  const muscle = latestMetric?.skeletal_muscle_mass_kg ?? null
  const chest = latestMetric?.chest_cm ?? null
  const waist = latestMetric?.waist_cm ?? null
  const hip = latestMetric?.hip_cm ?? null
  const sleepHours = latestMetric?.sleep_hours ?? null
  const bmi = latestMetric?.bmi ?? calculateBmi(latestMetric)
  const age = profile?.age ?? null
  const targetWeight = latestMetric?.target_weight_kg ?? null
  const bmr = calculateBmr(profile, latestMetric)
  const dateRange = formatMetricDateRange(bodyMetrics)
  const weightChange = formatMetricChange(weightSeries, "kg")
  const bodyFatChange = formatMetricChange(bodyFatSeries, "%")
  const muscleChange = formatMetricChange(muscleSeries, "kg")
  const sleepChange = formatMetricChange(sleepSeries, "h")
  const weightProgress = calculateTargetProgress(weightSeries[0]?.value ?? null, weight, targetWeight)
  const trendInsight = buildTrendInsight({
    bodyFatSeries,
    latestCheckin,
    muscleSeries,
    sleepHours,
    weightSeries,
  })

  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-card">
      <div className="grid min-h-full grid-cols-1 gap-8 px-8 py-8 xl:grid-cols-[minmax(0,1fr)_330px] xl:px-10">
        <section className="min-w-0">
          <KratosPageHeader
            title="身体数据"
            subtitle="全面了解您的身体状态变化趋势"
            actions={
              <>
                <button className="inline-flex h-9 items-center gap-2 rounded-[8px] border border-[#e5e5e5] px-4 text-[13px] font-semibold">
                  {dateRange}
                  <Calendar className="size-4" />
                </button>
                <Button
                  className="h-10 rounded-[8px] bg-primary px-5 text-[13px] font-bold text-primary-foreground hover:bg-primary/90"
                  onClick={onEditBodyData}
                  type="button"
                >
                  <PlusCircle className="size-4" />
                  数据录入
                </Button>
              </>
            }
          />

          <div className="mt-7 flex gap-9 border-b border-border text-[14px]">
            {BODY_DATA_TABS.map((tab) => (
              <button
                className={cn("pb-3 font-semibold", activeTab === tab ? "border-b-2 border-primary text-foreground" : "text-muted-foreground")}
                key={tab}
                onClick={() => setActiveTab(tab)}
                type="button"
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "概览" ? (
            <>
              <div className="mt-5 grid gap-4 md:grid-cols-3 2xl:grid-cols-5">
                <MetricTrendCard title="体重" value={formatMetricValue(weight)} unit="kg" change={weightChange} chart={chartVariantFromChange(weightSeries, "down")} />
                <MetricTrendCard title="体脂率" value={formatMetricValue(bodyFat)} unit="%" change={bodyFatChange} chart={chartVariantFromChange(bodyFatSeries, "down2")} />
                <MetricTrendCard title="肌肉量" value={formatMetricValue(muscle)} unit="kg" change={muscleChange} chart={chartVariantFromChange(muscleSeries, "up")} />
                <MetricTrendCard title="基础代谢率" value={bmr ? bmr.toString() : "暂无"} unit="kcal" change={bmr ? "由画像估算" : "缺少身高/体重/年龄"} chart="up2" />
                <MetricTrendCard title="睡眠时长" value={formatMetricValue(sleepHours)} unit="h" change={sleepChange} chart={chartVariantFromChange(sleepSeries, "up2")} />
              </div>

              <section className="mt-5 rounded-[12px] border border-border bg-card p-5">
                <div className="grid gap-5 lg:grid-cols-[1fr_125px]">
                  <div>
                    <ChartHeader title="体重趋势" subtitle="最近 30 条记录 · 单位：kg" />
                    <LineChart height={230} series={weightSeries} unit="kg" />
                  </div>
                  <ChartSideStat
                    value={formatMetricWithUnit(weight, "kg")}
                    label="当前体重"
                    delta={weightChange}
                    target={formatMetricWithUnit(targetWeight, "kg", "暂无目标")}
                    progress={weightProgress}
                    recordedAt={latestMetric?.recorded_at}
                  />
                </div>
              </section>
            </>
          ) : null}

          {activeTab === "体成分" ? (
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <section className="rounded-[12px] border border-border bg-card p-5">
                <ChartHeader title="体成分变化" subtitle="最近 30 条记录" />
                <AreaStackChart series={bodyCompositionSeries} />
              </section>
              <section className="rounded-[12px] border border-border bg-card p-5">
                <div className="grid gap-5 lg:grid-cols-[1fr_125px]">
                  <div>
                    <ChartHeader title="体脂率趋势" subtitle="最近 30 条记录 · 单位：%" />
                    <LineChart height={180} series={bodyFatSeries} unit="%" />
                  </div>
                  <ChartSideStat
                    value={formatMetricWithUnit(bodyFat, "%")}
                    label="当前体脂率"
                    delta={bodyFatChange}
                    target="暂无目标字段"
                    recordedAt={latestMetric?.recorded_at}
                  />
                </div>
              </section>
              <section className="rounded-[12px] border border-border bg-card p-5 lg:col-span-2">
                <ChartHeader title="骨骼肌趋势" subtitle="最近 30 条记录 · 单位：kg" />
                <LineChart height={190} series={muscleSeries} unit="kg" />
              </section>
            </div>
          ) : null}

          {activeTab === "围度" ? (
            <div className="mt-5 grid gap-5 lg:grid-cols-3">
              <CircumferenceCard label="胸围" value={chest} series={chestSeries} />
              <CircumferenceCard label="腰围" value={waist} series={waistSeries} />
              <CircumferenceCard label="臀围" value={hip} series={hipSeries} />
            </div>
          ) : null}

          {activeTab === "恢复状态" ? (
            <RecoveryPanel latestCheckin={latestCheckin} sleepHours={sleepHours} />
          ) : null}

          {["力量表现", "心肺健康", "体能测试", "健康指标"].includes(activeTab) ? (
            <EmptyDataPanel title={activeTab} description="当前后端还没有对应的数据表或字段，后续接入后再展示真实数据。" />
          ) : null}
          <p className="mt-6 text-center text-[12px] text-muted-foreground">* 所有数据基于您的录入与设备监测量，如有误差请以实际情况为准。</p>
        </section>

        <BodyRightRail
          age={age}
          bmi={bmi}
          bodyFat={bodyFat}
          chest={chest}
          hip={hip}
          latestCheckin={latestCheckin}
          latestMetric={latestMetric}
          muscle={muscle}
          onEditBodyData={onEditBodyData}
          onboarding={onboarding}
          workoutLogs={workoutLogs}
          trendInsight={trendInsight}
          waist={waist}
        />
      </div>
    </main>
  )
}


function BodyRightRail({
  age,
  bmi,
  bodyFat,
  chest,
  hip,
  latestCheckin,
  latestMetric,
  muscle,
  onEditBodyData,
  onboarding,
  trendInsight,
  waist,
  workoutLogs,
}: {
  age: number | null
  bmi: number | null
  bodyFat: number | null
  chest: number | null
  hip: number | null
  latestCheckin: AgentCheckin | null
  latestMetric: BodyMetric | null
  muscle: number | null
  onEditBodyData: () => void
  onboarding: OnboardingStatus | null
  trendInsight: string
  waist: number | null
  workoutLogs: WorkoutLog[]
}) {
  return (
    <aside className="space-y-6">
      <RailHeader title="身体概览" />
      <section className="rounded-[12px] border border-border bg-card p-5">
        <div className="grid grid-cols-2 gap-y-5">
          <BodyOverviewCell label="BMI" value={formatMetricValue(bmi)} sub={bmi ? getBmiLevel(bmi) : "暂无记录"} />
          <BodyOverviewCell label="体脂等级" value={bodyFat ? getBodyFatLevel(bodyFat) : "暂无记录"} sub={formatMetricWithUnit(bodyFat, "%")} bordered />
          <BodyOverviewCell label="腰围" value={formatMetricWithUnit(waist, "cm")} sub={waist ? "已记录" : "暂无记录"} />
          <BodyOverviewCell label="骨骼肌量" value={formatMetricWithUnit(muscle, "kg")} sub={muscle ? "已记录" : "暂无记录"} bordered />
        </div>
      </section>
      <section className="rounded-[12px] border border-border bg-card p-5">
        <div className="grid grid-cols-2">
          <BodyOverviewCell label="画像年龄" value={age ? `${age} 岁` : "暂无记录"} sub="" />
          <BodyOverviewCell label="胸/臀围" value={formatChestHip(chest, hip)} sub={chest || hip ? "来自身体测量" : "暂无记录"} bordered small />
        </div>
      </section>
      <section className="rounded-[12px] border border-border bg-card p-5">
        <RailHeader title="数据录入" compact />
        <div className="mt-3 divide-y divide-border">
          {[
            [ClipboardList, "训练记录", formatShortDate(workoutLogs[0]?.workout_date) ?? "暂无数据"],
            [Utensils, "饮食记录", "后续接入"],
            [Scale, "身体测量", formatShortDate(latestMetric?.recorded_at) ?? "暂无数据"],
            [Gauge, "恢复打卡", formatShortDate(latestCheckin?.created_at) ?? "暂无数据"],
          ].map(([Icon, label, date]) => (
            <button className="flex h-12 w-full items-center gap-3 text-left" key={label as string} onClick={label === "身体测量" ? onEditBodyData : undefined} type="button">
              <Icon className="size-4" />
              <span className="flex-1 text-[13px] font-bold">{label as string}</span>
              <span className="text-[12px] text-muted-foreground">最新：{date as string}</span>
              <ChevronRight className="size-3.5 text-muted-foreground" />
            </button>
          ))}
        </div>
      </section>
      <section className="rounded-[12px] border border-border bg-card p-5">
        <h3 className="text-[16px] font-black">健康趋势提示</h3>
        <p className="mt-1 text-[12px] text-muted-foreground">基于最近身体记录与恢复打卡</p>
        <div className="mt-5 rounded-[12px] border border-border p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-6 place-items-center rounded-full border border-primary"><Check className="size-3.5" /></span>
            <h4 className="text-[14px] font-black">趋势摘要</h4>
          </div>
          <p className="mt-3 text-[12px] leading-6 text-muted-foreground">
            {onboarding?.next_steps?.[0] ?? trendInsight}
          </p>
          <button className="mt-4 h-8 rounded-[8px] border border-border px-3 text-[12px] font-bold" type="button">后续接入建议</button>
        </div>
      </section>
    </aside>
  )
}

function RailHeader({ action, compact, onAction, title }: { action?: string; compact?: boolean; onAction?: () => void; title: string }) {
  return (
    <div className={cn("flex items-center justify-between", !compact && "mb-3")}>
      <h2 className="text-[18px] font-black tracking-[-0.03em]">{title}</h2>
      {action ? (
        <button className="inline-flex items-center gap-1 text-[12px] font-semibold text-muted-foreground" onClick={onAction} type="button">
          {action}
          <ChevronRight className="size-3.5" />
        </button>
      ) : null}
    </div>
  )
}

function BodyOverviewCell({ bordered, label, small, sub, value }: { bordered?: boolean; label: string; small?: boolean; sub: string; value: string }) {
  return (
    <div className={cn("px-5 py-3", bordered && "border-l border-border")}>
      <p className="text-[12px] font-semibold text-muted-foreground">{label}</p>
      <p className={cn("mt-2 font-black", small ? "text-[13px]" : "text-[22px]")}>{value}</p>
      {sub ? <p className="mt-1 text-[12px] text-muted-foreground">{sub}</p> : null}
    </div>
  )
}

function CircumferenceCard({ label, series, value }: { label: string; series: MetricPoint[]; value: number | null }) {
  return (
    <section className="rounded-[12px] border border-border bg-card p-5">
      <ChartHeader title={`${label}趋势`} subtitle="最近 30 条记录 · 单位：cm" />
      <p className="mt-4 text-[26px] font-black">{formatMetricWithUnit(value, "cm")}</p>
      <p className="mt-1 text-[12px] text-muted-foreground">{formatMetricChange(series, "cm")}</p>
      <LineChart height={150} series={series} unit="cm" />
    </section>
  )
}

function RecoveryPanel({ latestCheckin, sleepHours }: { latestCheckin: AgentCheckin | null; sleepHours: number | null }) {
  return (
    <section className="mt-5 rounded-[12px] border border-border bg-card p-5">
      <ChartHeader title="恢复状态" subtitle="来自 body_metrics 睡眠时长与 agent_checkins 主观打卡" />
      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <BodyOverviewCell label="睡眠时长" value={formatMetricWithUnit(sleepHours, "h")} sub="body_metrics.sleep_hours" />
        <BodyOverviewCell label="精力" value={formatScore(latestCheckin?.energy_level)} sub="agent_checkins.energy_level" bordered />
        <BodyOverviewCell label="睡眠质量" value={formatScore(latestCheckin?.sleep_quality)} sub="agent_checkins.sleep_quality" bordered />
        <BodyOverviewCell label="酸痛" value={formatScore(latestCheckin?.soreness_level)} sub="agent_checkins.soreness_level" bordered />
      </div>
    </section>
  )
}

function EmptyDataPanel({ description, title }: { description: string; title: string }) {
  return (
    <section className="mt-5 rounded-[12px] border border-dashed border-border bg-card p-8 text-center">
      <h3 className="text-[18px] font-black">{title}</h3>
      <p className="mx-auto mt-2 max-w-[460px] text-[13px] leading-6 text-muted-foreground">{description}</p>
    </section>
  )
}

type MetricPoint = {
  date: string
  value: number
}

type BodyCompositionPoint = {
  bodyFat: number | null
  date: string
  muscle: number | null
  weight: number | null
}

function MetricTrendCard({ change, chart, title, unit, value }: { change: string; chart: "down" | "down2" | "up" | "up2"; title: string; unit: string; value: string }) {
  return (
    <section className="rounded-[10px] border border-border bg-card p-4">
      <p className="text-[12px] font-semibold text-muted-foreground">{title}</p>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-[22px] font-black">{value}</span>
        <span className="text-[12px] font-semibold text-muted-foreground">{unit}</span>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-[12px] font-bold">{change}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">较上周期</p>
        </div>
        <MiniSparkline variant={chart} />
      </div>
    </section>
  )
}

function ChartHeader({ subtitle, title }: { subtitle: string; title: string }) {
  return (
    <div>
      <h3 className="text-[17px] font-black">{title}<Circle className="ml-2 inline size-3.5 text-muted-foreground" /></h3>
      <p className="mt-2 text-[12px] text-muted-foreground">{subtitle}</p>
    </div>
  )
}

function ChartSideStat({ delta, label, progress, recordedAt, target, value }: { delta: string; label: string; progress?: number | null; recordedAt?: string | null; target: string; value: string }) {
  return (
    <aside className="border-border pt-2 lg:border-l lg:pl-5">
      <p className="text-[12px] text-muted-foreground">{label}</p>
      <p className="mt-2 text-[20px] font-black">{value}</p>
      <p className="mt-1 text-[12px] text-[#8a8a8a]">{formatShortDate(recordedAt) ?? "暂无日期"}</p>
      <div className="my-5 h-px bg-[#eeeeee]" />
      <p className="text-[12px] text-[#8a8a8a]">周期变化</p>
      <p className="mt-2 text-[15px] font-black">{delta}</p>
      <p className="mt-5 text-[12px] text-muted-foreground">目标值</p>
      <p className="mt-2 text-[17px] font-black">{target}</p>
      {typeof progress === "number" ? (
        <>
          <p className="mt-2 text-[12px] text-[#8a8a8a]">目标达成 {progress}%</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eeeeee]">
            <div className="h-full rounded-full bg-[#111111]" style={{ width: `${progress}%` }} />
          </div>
        </>
      ) : (
        <p className="mt-2 text-[12px] text-[#8a8a8a]">目标达成待计算</p>
      )}
    </aside>
  )
}

function MiniSparkline({ variant }: { variant: "down" | "down2" | "up" | "up2" }) {
  const paths = {
    down: "M2 18 14 22 25 12 37 20 50 18 60 29",
    down2: "M2 12 14 17 25 8 38 17 49 13 60 16",
    up: "M2 26 14 20 25 12 37 13 50 7 60 10",
    up2: "M2 20 14 14 25 13 37 8 49 22 60 15",
  }
  return (
    <svg className="h-9 w-16" viewBox="0 0 62 34">
      <path d={paths[variant]} fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  )
}

function LineChart({ height, series, unit }: { height: number; series: MetricPoint[]; unit: string }) {
  if (series.length < 2) {
    return (
      <div className="mt-4 grid h-55 place-items-center rounded-[10px] border border-dashed border-[#dddddd] text-[12px] font-semibold text-[#999999]">
        至少需要 2 条记录生成趋势
      </div>
    )
  }

  const points = series.map((point) => point.value)
  const min = Math.min(...points) - 1
  const max = Math.max(...points) + 1
  const width = 640
  const step = width / (points.length - 1)
  const latest = series[series.length - 1]
  const path = points
    .map((point, index) => {
      const x = index * step
      const y = height - ((point - min) / (max - min)) * (height - 30) - 15
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(" ")

  return (
    <svg className="mt-4 h-auto w-full" viewBox={`0 0 ${width} ${height + 35}`}>
      {[0, 1, 2, 3].map((line) => (
        <line key={line} x1="0" x2={width} y1={25 + line * 48} y2={25 + line * 48} stroke="var(--border)" strokeDasharray="3 4" />
      ))}
      <path d={path} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
      <path d={`${path} L${width} ${height} L0 ${height} Z`} fill="url(#fade)" opacity="0.35" />
      <path d={`M${width * 0.72} ${height * 0.58} C${width * 0.82} ${height * 0.65}, ${width * 0.9} ${height * 0.69}, ${width} ${height * 0.75}`} fill="none" stroke="var(--muted-foreground)" strokeDasharray="2 6" strokeLinecap="round" strokeWidth="2" />
      <g transform={`translate(${width * 0.72} ${height * 0.43})`}>
        <rect width="64" height="43" rx="7" fill="#111111" />
        <text x="9" y="18" fill="white" fontSize="12" fontWeight="700">{`${latest.value.toFixed(1)} ${unit}`}</text>
        <text x="18" y="33" fill="white" fontSize="11">{formatShortDate(latest.date)}</text>
      </g>
      <text x="4" y={height + 25} fill="#999999" fontSize="12">{formatShortDate(series[0].date)}</text>
      <text x={width * 0.98} y={height + 25} fill="#999999" fontSize="12" textAnchor="end">{formatShortDate(latest.date)}</text>
      <defs>
        <linearGradient id="fade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--muted)" />
          <stop offset="100%" stopColor="var(--background)" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function AreaStackChart({ series }: { series: BodyCompositionPoint[] }) {
  if (series.length < 2) {
    return (
      <div className="mt-4 grid h-55 place-items-center rounded-[10px] border border-dashed border-[#dddddd] text-[12px] font-semibold text-[#999999]">
        录入体重、体脂和骨骼肌后生成体成分趋势
      </div>
    )
  }

  return (
    <svg className="mt-4 h-auto w-full" viewBox="0 0 520 230">
      {[0, 1, 2, 3].map((line) => <line key={line} x1="0" x2="520" y1={25 + line * 45} y2={25 + line * 45} stroke="#eeeeee" strokeDasharray="3 4" />)}
      <path d={buildAreaPath(series.map((point) => point.weight), 520, 200)} fill="#d4d5d8" />
      <path d={buildAreaPath(series.map((point) => point.muscle), 520, 200)} fill="#111111" opacity="0.82" />
      <path d={buildAreaPath(series.map((point) => point.bodyFat), 520, 200)} fill="#efefef" />
      <text x="0" y="224" fill="#999999" fontSize="12">{formatShortDate(series[0].date)}</text>
      <text x="520" y="224" fill="#999999" fontSize="12" textAnchor="end">{formatShortDate(series[series.length - 1].date)}</text>
    </svg>
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
    | "sleep_hours"
    | "waist_cm"
    | "weight_kg"
  >
): MetricPoint[] {
  return metrics
    .filter((metric) => metric.recorded_at && metric[key] !== null && metric[key] !== undefined)
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    .slice(-30)
    .map((metric) => ({
      date: metric.recorded_at,
      value: Number(metric[key]),
    }))
}

function getBodyCompositionSeries(metrics: BodyMetric[]): BodyCompositionPoint[] {
  return metrics
    .filter(
      (metric) =>
        metric.recorded_at &&
        (metric.weight_kg !== null ||
          metric.body_fat_percentage !== null ||
          metric.skeletal_muscle_mass_kg !== null)
    )
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    .slice(-30)
    .map((metric) => ({
      bodyFat: metric.body_fat_percentage,
      date: metric.recorded_at,
      muscle: metric.skeletal_muscle_mass_kg,
      weight: metric.weight_kg,
    }))
}

function formatMetricValue(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(1) : "暂无"
}

function formatMetricWithUnit(value: number | null | undefined, unit: string, fallback = "暂无记录") {
  return typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(1)} ${unit}` : fallback
}

function formatScore(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? `${value}/10` : "暂无记录"
}

function formatMetricChange(series: MetricPoint[], unit: string) {
  if (series.length < 2) {
    return "暂无周期变化"
  }

  const change = series[series.length - 1].value - series[0].value
  if (Math.abs(change) < 0.05) {
    return `持平 0.0 ${unit}`
  }

  const arrow = change > 0 ? "↑" : "↓"
  const formatted = Math.abs(change).toFixed(1)
  return `${arrow} ${formatted} ${unit}`
}

function chartVariantFromChange(series: MetricPoint[], fallback: "down" | "down2" | "up" | "up2") {
  if (series.length < 2) {
    return fallback
  }

  return series[series.length - 1].value >= series[0].value ? "up" : "down"
}

function calculateBmi(metric: BodyMetric | null) {
  if (!metric?.height_cm || !metric.weight_kg) {
    return null
  }

  const heightM = metric.height_cm / 100
  return Number((metric.weight_kg / (heightM * heightM)).toFixed(1))
}

function calculateBmr(profile: FitnessProfile | null, metric: BodyMetric | null) {
  const weight = metric?.weight_kg
  const height = metric?.height_cm
  const age = profile?.age
  if (!weight || !height || !age) {
    return null
  }

  const gender = profile?.gender?.toLowerCase() ?? ""
  const genderOffset = gender.includes("女") || gender.includes("female") ? -161 : 5
  return Math.round(10 * weight + 6.25 * height - 5 * age + genderOffset)
}

function calculateTargetProgress(start: number | null, current: number | null, target: number | null) {
  if (start === null || current === null || target === null || Math.abs(start - target) < 0.1) {
    return null
  }

  const progress = (Math.abs(start - current) / Math.abs(start - target)) * 100
  return Math.max(0, Math.min(100, Math.round(progress)))
}

function formatMetricDateRange(metrics: BodyMetric[]) {
  const dates = metrics
    .map((metric) => metric.recorded_at)
    .filter(Boolean)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

  if (!dates.length) {
    return "暂无身体记录"
  }

  const recent = dates.slice(-30)
  return `${formatFullDate(recent[0])} – ${formatFullDate(recent[recent.length - 1])}`
}

function formatShortDate(date?: string | null) {
  if (!date) {
    return null
  }

  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return `${(parsed.getMonth() + 1).toString().padStart(2, "0")}.${parsed.getDate().toString().padStart(2, "0")}`
}

function formatFullDate(date: string) {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) {
    return date.slice(0, 10)
  }

  return `${parsed.getFullYear()}.${(parsed.getMonth() + 1).toString().padStart(2, "0")}.${parsed.getDate().toString().padStart(2, "0")}`
}

function formatChestHip(chest: number | null, hip: number | null) {
  if (chest === null && hip === null) {
    return "暂无记录"
  }

  return `${chest !== null ? chest.toFixed(1) : "-"} / ${hip !== null ? hip.toFixed(1) : "-"} cm`
}

function buildTrendInsight({
  bodyFatSeries,
  latestCheckin,
  muscleSeries,
  sleepHours,
  weightSeries,
}: {
  bodyFatSeries: MetricPoint[]
  latestCheckin: AgentCheckin | null
  muscleSeries: MetricPoint[]
  sleepHours: number | null
  weightSeries: MetricPoint[]
}) {
  const messages: string[] = []
  const weightTrend = describeTrend(weightSeries, "体重")
  const bodyFatTrend = describeTrend(bodyFatSeries, "体脂率")
  const muscleTrend = describeTrend(muscleSeries, "骨骼肌")

  if (weightTrend) messages.push(weightTrend)
  if (bodyFatTrend) messages.push(bodyFatTrend)
  if (muscleTrend) messages.push(muscleTrend)
  if (sleepHours !== null && sleepHours < 7) {
    messages.push("最近睡眠时长偏少，训练强度建议保守调整。")
  }
  if (latestCheckin?.soreness_level && latestCheckin.soreness_level >= 7) {
    messages.push("最近酸痛评分较高，优先安排恢复或低冲击训练。")
  }

  return messages.length
    ? messages.join(" ")
    : "暂无足够身体记录生成趋势，请至少录入两次身体数据。"
}

function describeTrend(series: MetricPoint[], label: string) {
  if (series.length < 2) {
    return null
  }

  const change = series[series.length - 1].value - series[0].value
  if (Math.abs(change) < 0.05) {
    return `${label}近期基本稳定。`
  }

  return `${label}近期${change > 0 ? "上升" : "下降"} ${Math.abs(change).toFixed(1)}。`
}

function getBmiLevel(bmi: number) {
  if (bmi < 18.5) {
    return "偏低"
  }
  if (bmi < 24) {
    return "正常"
  }
  if (bmi < 28) {
    return "偏高"
  }
  return "较高"
}

function getBodyFatLevel(bodyFat: number) {
  if (bodyFat < 12) {
    return "偏低"
  }
  if (bodyFat < 22) {
    return "正常"
  }
  if (bodyFat < 30) {
    return "偏高"
  }
  return "较高"
}

function buildAreaPath(values: Array<number | null>, width: number, height: number) {
  const usable = values.map((value) => (typeof value === "number" && Number.isFinite(value) ? value : null))
  const validValues = usable.filter((value): value is number => value !== null)
  if (validValues.length < 2) {
    return `M0 ${height} L${width} ${height} L${width} 215 L0 215 Z`
  }

  const min = Math.min(...validValues) - 1
  const max = Math.max(...validValues) + 1
  const step = width / (usable.length - 1)
  const points = usable.map((value, index) => {
    const fallback = validValues[validValues.length - 1]
    const normalized = value ?? fallback
    return {
      x: index * step,
      y: height - ((normalized - min) / (max - min)) * (height - 35),
    }
  })
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ")
  return `${line} L${width} 215 L0 215 Z`
}
