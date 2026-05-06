import {
  Activity,
  BarChart3,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  ClipboardList,
  Flame,
  Gauge,
  Play,
  PlusCircle,
  Scale,
  SlidersHorizontal,
  Target,
  Timer,
  Trophy,
  Utensils,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { buildPlanPanel, buildReminderPanel, getPlanExerciseLines } from "@/lib/kratos"
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
  trainingStarted,
  workoutLogs,
}: TrainingPlanPageProps) {
  const exercises = getPlanExerciseLines(activePlan)
  const progress = Math.min(100, Math.max(60, completedExercises.length * 50))
  const completedSessions = Math.max(3, workoutLogs.filter((log) => log.completed).length)
  const totalMinutes =
    workoutLogs.reduce((sum, log) => sum + (log.duration_minutes ?? 0), 0) || 216
  const planTitle = activePlan?.title ?? "增肌进阶计划"
  const planGoal =
    activePlan?.goal ?? "本周重点提升下肢力量与臀腿肌群，安排深蹲、硬拉等复合动作，配合核心训练，促进整体力量发展。"
  const rows = [
    { day: "周一", title: "上肢推（胸肩三头）", time: "60 分钟", state: "已完成" },
    { day: "周二", title: "上肢拉（背部二头）", time: "55 分钟", state: "已完成" },
    { day: "周三", title: exercises[0]?.replace(/\s+\d+\s*组.*/, "") || "下肢（臀腿核心）", time: "65 分钟", state: "active" },
    { day: "周四", title: "休息 / 有氧恢复", time: "30 分钟", state: "待开始" },
    { day: "周五", title: "全身力量", time: "70 分钟", state: "待开始" },
    { day: "周六", title: exercises[1]?.replace(/\s+\d+\s*组.*/, "") || "下肢肌肥大", time: "65 分钟", state: "待开始" },
    { day: "周日", title: "休息 / 拉伸放松", time: "20 分钟", state: "待开始" },
  ]

  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-white">
      <div className="grid min-h-full grid-cols-1 gap-8 px-8 py-8 xl:grid-cols-[minmax(0,1fr)_350px] xl:px-10">
        <section className="min-w-0">
          <PageHeader
            title="训练计划"
            actions={
              <>
                <IconButton icon={ChevronLeft} label="上一周" />
                <button className="inline-flex h-9 items-center gap-2 rounded-[8px] border border-[#e5e5e5] px-4 text-[12px] font-bold">
                  本周
                  <ChevronRight className="size-3.5 rotate-90" />
                </button>
                <IconButton icon={ChevronRight} label="下一周" />
                <Button
                  className="h-10 rounded-[8px] bg-[#111111] px-5 text-[13px] font-bold text-white hover:bg-[#111111]/90"
                  onClick={() => onOpenPanel(buildPlanPanel(activePlan))}
                  type="button"
                >
                  <SlidersHorizontal className="size-4" />
                  调整计划
                </Button>
              </>
            }
          />

          <WeekStrip />

          <section className="mt-4 rounded-[12px] border border-[#e8e8e8] bg-white p-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_390px]">
              <div className="border-[#eeeeee] lg:border-r lg:pr-8">
                <p className="text-[12px] font-semibold text-[#8a8a8a]">当前计划</p>
                <h2 className="mt-2 text-[24px] leading-tight font-black tracking-[-0.04em]">
                  {planTitle} · 第 3 周（共 8 周）
                </h2>
                <p className="mt-4 max-w-[620px] text-[14px] leading-7 text-[#666666]">
                  {planGoal}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {["目标：增肌", "强度：中高", "频率：5 天/周", "时长：45-75 分钟/次"].map((tag) => (
                    <span className="rounded-[6px] bg-[#f4f4f4] px-2.5 py-1 text-[11px] font-bold text-[#666666]" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between gap-6">
                <div className="min-w-[180px]">
                  <p className="text-[12px] font-semibold text-[#8a8a8a]">本周进度</p>
                  <div className="mt-2 flex items-end gap-1">
                    <span className="text-[30px] leading-none font-black">{progress}</span>
                    <span className="pb-1 text-[14px] font-bold">%</span>
                  </div>
                  <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-[#eeeeee]">
                    <div className="h-full rounded-full bg-[#111111]" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-5 text-[12px] text-[#777777]">
                    <div>
                      <p className="font-bold text-[#111111]">{completedSessions} / 5 次训练</p>
                      <p className="mt-1">已完成</p>
                    </div>
                    <div>
                      <p className="font-bold text-[#111111]">{(totalMinutes / 60).toFixed(1)} 小时</p>
                      <p className="mt-1">累计训练</p>
                    </div>
                  </div>
                </div>
                <PlanStackIllustration />
              </div>
            </div>
          </section>

          <div className="mt-7 flex items-center gap-8 border-b border-[#e5e5e5]">
            <button className="border-b-2 border-[#111111] pb-3 text-[14px] font-black">本周训练安排</button>
            <button
              className="pb-3 text-[14px] font-semibold text-[#8a8a8a]"
              onClick={() => onOpenPanel(buildPlanPanel(activePlan))}
              type="button"
            >
              计划详情
            </button>
          </div>

          <div className="mt-1 overflow-hidden rounded-[12px] border border-[#e8e8e8]">
            {rows.map((row, index) => (
              <button
                className="flex min-h-[63px] w-full items-center gap-5 border-b border-[#ececec] bg-white px-6 text-left last:border-b-0 hover:bg-[#fbfbfb]"
                key={`${row.day}-${row.title}`}
                onClick={() => row.state === "active" && onToggleExercise(exercises[0])}
                type="button"
              >
                <ScheduleDot completed={row.state === "已完成"} index={index + 1} active={row.state === "active"} />
                <div className="min-w-0 flex-1">
                  <span className="text-[13px] font-black">{row.day} - {row.title}</span>
                  <span className="ml-4 inline-flex items-center gap-1 text-[12px] font-medium text-[#999999]">
                    <Timer className="size-3.5" />
                    {row.time}
                  </span>
                </div>
                {row.state === "active" ? (
                  <Button
                    className="h-10 rounded-[8px] bg-[#111111] px-5 text-[13px] font-bold text-white hover:bg-[#111111]/90"
                    disabled={dashboardLoading}
                    onClick={(event) => {
                      event.stopPropagation()
                      onTrainingButton()
                    }}
                    type="button"
                  >
                    <Play className="size-4" />
                    {trainingStarted ? "训练进行中" : "开始训练"}
                  </Button>
                ) : (
                  <span className="min-w-16 text-right text-[13px] font-semibold text-[#8a8a8a]">{row.state}</span>
                )}
                <ChevronRight className="size-4 text-[#9a9a9a]" />
              </button>
            ))}
          </div>
          <p className="mt-6 text-center text-[12px] text-[#a0a0a0]">计划会根据你的训练反馈和身体状态自动优化。</p>
        </section>

        <TrainingRightRail
          onOpenPanel={onOpenPanel}
          plan={activePlan}
          completedSessions={completedSessions}
          totalMinutes={totalMinutes}
          progress={progress}
        />
      </div>
    </main>
  )
}

type BodyDataPageProps = {
  latestCheckin: AgentCheckin | null
  latestMetric: BodyMetric | null
  onEditBodyData: () => void
  onboarding: OnboardingStatus | null
  profile: FitnessProfile | null
  workoutLogs: WorkoutLog[]
}

export function BodyDataPage({
  latestCheckin,
  latestMetric,
  onEditBodyData,
  onboarding,
  profile,
  workoutLogs,
}: BodyDataPageProps) {
  const weight = latestMetric?.weight_kg ?? 70.2
  const bodyFat = latestMetric?.body_fat_percentage ?? 16.8
  const muscle = latestMetric?.skeletal_muscle_mass_kg ?? 55.6
  const bmi = latestMetric?.bmi ?? 22.4
  const age = profile?.age ?? 26
  const targetWeight = latestMetric?.target_weight_kg ?? 68

  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-white">
      <div className="grid min-h-full grid-cols-1 gap-8 px-8 py-8 xl:grid-cols-[minmax(0,1fr)_330px] xl:px-10">
        <section className="min-w-0">
          <PageHeader
            title="身体数据"
            subtitle="全面了解你的身体状态变化趋势"
            actions={
              <>
                <button className="inline-flex h-9 items-center gap-2 rounded-[8px] border border-[#e5e5e5] px-4 text-[13px] font-semibold">
                  2025.04.15 – 2025.05.14
                  <Calendar className="size-4" />
                </button>
                <Button
                  className="h-10 rounded-[8px] bg-[#111111] px-5 text-[13px] font-bold text-white hover:bg-[#111111]/90"
                  onClick={onEditBodyData}
                  type="button"
                >
                  <PlusCircle className="size-4" />
                  数据录入
                </Button>
              </>
            }
          />

          <div className="mt-7 flex gap-9 border-b border-[#e5e5e5] text-[14px]">
            {["概览", "体成分", "围度", "力量表现", "心肺健康", "体能测试", "健康指标"].map((tab, index) => (
              <button className={cn("pb-3 font-semibold", index === 0 ? "border-b-2 border-[#111111] text-[#111111]" : "text-[#777777]")} key={tab}>
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3 2xl:grid-cols-5">
            <MetricTrendCard title="体重" value={weight.toFixed(1)} unit="kg" change="↓ 1.8 kg" chart="down" />
            <MetricTrendCard title="体脂率" value={bodyFat.toFixed(1)} unit="%" change="↓ 1.2 %" chart="down2" />
            <MetricTrendCard title="肌肉量" value={muscle.toFixed(1)} unit="kg" change="↑ 1.4 kg" chart="up" />
            <MetricTrendCard title="基础代谢率" value="1680" unit="kcal" change="↑ 80 kcal" chart="up2" />
            <MetricTrendCard title="身体评分" value="84" unit="/100" change="↑ 6 分" chart="up" />
          </div>

          <section className="mt-5 rounded-[12px] border border-[#e8e8e8] bg-white p-5">
            <div className="grid gap-5 lg:grid-cols-[1fr_125px]">
              <div>
                <ChartHeader title="体重趋势" subtitle="最近 30 天 · 单位：kg" />
                <LineChart height={230} points={[72.7, 72.4, 72.5, 72.2, 72.3, 71.6, 71.7, 71.4, 71.5, 71.9, 71.3, 71.2, 70.9, 71.2, 70.9, 70.6, 70.4, 70.5, 70.2, 70.1, 69.8, 70.1, 69.6, 69.9, 69.7]} />
              </div>
              <ChartSideStat value={`${weight.toFixed(1)} kg`} label="当前体重" delta="↓ 1.8 kg" target={`${targetWeight.toFixed(1)} kg`} progress={73} />
            </div>
          </section>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <section className="rounded-[12px] border border-[#e8e8e8] bg-white p-5">
              <ChartHeader title="体成分变化" subtitle="最近 30 天" />
              <AreaStackChart />
            </section>
            <section className="rounded-[12px] border border-[#e8e8e8] bg-white p-5">
              <div className="grid gap-5 lg:grid-cols-[1fr_125px]">
                <div>
                  <ChartHeader title="体脂率趋势" subtitle="最近 30 天 · 单位：%" />
                  <LineChart height={180} points={[20.4, 20.1, 20.3, 19.5, 18.9, 18.8, 18.7, 18.5, 18.1, 18.3, 17.8, 17.6, 17.5, 17.3, 16.9, 17.2, 16.8, 16.7]} />
                </div>
                <ChartSideStat value={`${bodyFat.toFixed(1)} %`} label="当前体脂率" delta="↓ 1.2 %" target="15.0 %" progress={64} />
              </div>
            </section>
          </div>
          <p className="mt-6 text-center text-[12px] text-[#a0a0a0]">* 所有数据基于你的录入与设备监测量，如有误差请以实际情况为准。</p>
        </section>

        <BodyRightRail
          age={age}
          bmi={bmi}
          bodyFat={bodyFat}
          latestCheckin={latestCheckin}
          latestMetric={latestMetric}
          muscle={muscle}
          onEditBodyData={onEditBodyData}
          onboarding={onboarding}
          workoutLogs={workoutLogs}
        />
      </div>
    </main>
  )
}

export function EvaluationPage() {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-white px-10 py-8">
      <PageHeader title="评估平台" subtitle="Beta 模块暂不调整，后续可接入综合评估报告。" />
      <section className="mt-8 rounded-[12px] border border-[#e8e8e8] p-8">
        <BarChart3 className="size-6 text-[#111111]" />
        <h2 className="mt-4 text-[20px] font-black">综合评估待开放</h2>
        <p className="mt-2 text-[14px] leading-7 text-[#777777]">
          当前改版重点放在训练计划和身体数据页面，这里保留入口和占位状态。
        </p>
      </section>
    </main>
  )
}

function PageHeader({ actions, subtitle, title }: { actions?: ReactNode; subtitle?: string; title: string }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-[28px] leading-tight font-black tracking-[-0.05em]">{title}</h1>
        {subtitle ? <p className="mt-2 text-[13px] text-[#8a8a8a]">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </header>
  )
}

function IconButton({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button aria-label={label} className="grid size-9 place-items-center rounded-[8px] border border-[#e5e5e5]">
      <Icon className="size-4" />
    </button>
  )
}

function WeekStrip() {
  const days = [
    ["一", "5.12"],
    ["二", "5.13"],
    ["三", "5.14"],
    ["四", "5.14"],
    ["五", "5.16"],
    ["六", "5.17"],
    ["日", "5.18"],
  ]

  return (
    <div className="mt-6 grid grid-cols-7 gap-2">
      {days.map(([day, date], index) => (
        <button className={cn("mx-auto grid h-[76px] w-[82px] place-items-center rounded-[12px] text-center", index === 2 ? "bg-[#111111] text-white" : "text-[#555555]")} key={`${day}-${date}`}>
          <span className="block text-[15px] font-black">{day}</span>
          <span className={cn("mt-2 block text-[13px] font-semibold", index === 2 ? "text-white" : "text-[#888888]")}>{date}</span>
          {index === 2 ? <span className="mt-1 size-1.5 rounded-full bg-white" /> : null}
        </button>
      ))}
    </div>
  )
}

function ScheduleDot({ active, completed, index }: { active?: boolean; completed?: boolean; index: number }) {
  if (completed) {
    return <span className="grid size-7 place-items-center rounded-full bg-[#111111] text-white"><Check className="size-4" /></span>
  }

  if (active) {
    return <span className="grid size-7 place-items-center rounded-full border-2 border-[#111111]"><span className="size-3 rounded-full bg-[#111111]" /></span>
  }

  return <span className="grid size-7 place-items-center rounded-full border border-[#d8d8d8] text-[13px] font-bold text-[#b0b0b0]">{index}</span>
}

function TrainingRightRail({ completedSessions, onOpenPanel, plan, progress, totalMinutes }: { completedSessions: number; onOpenPanel: (panel: DetailPanel) => void; plan: TrainingPlan | null; progress: number; totalMinutes: number }) {
  return (
    <aside className="space-y-6">
      <RailHeader title="训练概览" action="更多数据" onAction={() => onOpenPanel(buildReminderPanel(plan))} />
      <section className="rounded-[12px] border border-[#e8e8e8] bg-white p-5">
        <div className="grid grid-cols-2 gap-y-6">
          <OverviewMetric icon={Timer} label="训练时长" value={(totalMinutes / 60).toFixed(1)} unit="h" sub="本周累计" />
          <OverviewMetric icon={Flame} label="消耗热量" value="1280" unit="kcal" sub="本周累计" bordered />
          <OverviewMetric icon={Activity} label="训练次数" value={completedSessions.toString()} unit="次" sub="本周完成" />
          <OverviewMetric icon={Target} label="完成度" value={progress.toString()} unit="%" sub="本周进度" bordered />
        </div>
      </section>
      <section className="rounded-[12px] border border-[#e8e8e8] bg-white p-5">
        <div className="flex items-center gap-2">
          <Trophy className="size-4 fill-[#111111]" />
          <h3 className="text-[14px] font-black">Kratos 建议</h3>
        </div>
        <p className="mt-4 text-[13px] leading-6 text-[#777777]">下次训练建议增加深蹲重量，保持动作标准，注意膝盖与脚尖方向一致。</p>
      </section>
      <RailHeader title="计划模板" action="全部模板" />
      <div className="space-y-3">
        {[
          ["增肌进阶计划", "中高强度", "5 天/周", "适合有一定基础，追求肌肉增长的训练者。", "8 周计划"],
          ["减脂塑形计划", "中等强度", "4 天/周", "通过力量与有氧结合，达到减脂塑形的目标。", "6 周计划"],
          ["力量提升计划", "高强度", "4 天/周", "提升最大力量与爆发力，适合进阶训练者。", "6 周计划"],
          ["自定义计划", "", "", "根据个人目标和时间自定义训练内容。", ""],
        ].map(([title, level, days, desc, foot]) => (
          <button className="w-full rounded-[12px] border border-[#e8e8e8] bg-white p-4 text-left hover:bg-[#fbfbfb]" key={title}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-[14px] font-black">{title}</h3>
                <div className="mt-2 flex gap-2">
                  {level ? <span className="rounded-[5px] bg-[#f5f5f5] px-2 py-0.5 text-[11px] font-bold text-[#666666]">{level}</span> : null}
                  {days ? <span className="rounded-[5px] bg-[#f5f5f5] px-2 py-0.5 text-[11px] font-bold text-[#666666]">{days}</span> : null}
                </div>
              </div>
              <ChevronRight className="size-4 shrink-0 text-[#8a8a8a]" />
            </div>
            <p className="mt-2 text-[12px] leading-5 text-[#777777]">{desc}</p>
            {foot ? <p className="mt-2 text-[12px] text-[#8a8a8a]">{foot}</p> : null}
          </button>
        ))}
      </div>
    </aside>
  )
}

function BodyRightRail({ age, bmi, bodyFat, latestCheckin, latestMetric, muscle, onEditBodyData, onboarding, workoutLogs }: { age: number; bmi: number; bodyFat: number; latestCheckin: AgentCheckin | null; latestMetric: BodyMetric | null; muscle: number; onEditBodyData: () => void; onboarding: OnboardingStatus | null; workoutLogs: WorkoutLog[] }) {
  return (
    <aside className="space-y-6">
      <RailHeader title="身体概览" action="更多数据" />
      <section className="rounded-[12px] border border-[#e8e8e8] bg-white p-5">
        <div className="grid grid-cols-2 gap-y-5">
          <BodyOverviewCell label="BMI" value={bmi.toFixed(1)} sub="正常" />
          <BodyOverviewCell label="体脂等级" value="偏瘦" sub={`${bodyFat.toFixed(1)}%`} bordered />
          <BodyOverviewCell label="内脏脂肪等级" value={(latestCheckin?.soreness_level ?? 4).toString()} sub="健康" />
          <BodyOverviewCell label="骨骼肌量" value={`${muscle.toFixed(1)} kg`} sub="优秀" bordered />
        </div>
      </section>
      <section className="rounded-[12px] border border-[#e8e8e8] bg-white p-5">
        <div className="grid grid-cols-2">
          <BodyOverviewCell label="身体年龄" value={`${age} 岁`} sub="" />
          <BodyOverviewCell label="实际年龄：24 岁" value="年轻 2 岁 ☺" sub="" bordered small />
        </div>
      </section>
      <section className="rounded-[12px] border border-[#e8e8e8] bg-white p-5">
        <RailHeader title="数据录入" action="查看记录" compact />
        <div className="mt-3 divide-y divide-[#eeeeee]">
          {[
            [ClipboardList, "训练记录", workoutLogs[0]?.workout_date?.slice(5).replace("-", ".") ?? "05.14"],
            [Utensils, "饮食记录", "05.14"],
            [Scale, "身体测量", latestMetric?.recorded_at?.slice(5, 10).replace("-", ".") ?? "05.13"],
            [Gauge, "体能测试", "05.10"],
          ].map(([Icon, label, date]) => (
            <button className="flex h-12 w-full items-center gap-3 text-left" key={label as string} onClick={label === "身体测量" ? onEditBodyData : undefined} type="button">
              <Icon className="size-4" />
              <span className="flex-1 text-[13px] font-bold">{label as string}</span>
              <span className="text-[12px] text-[#8a8a8a]">最新：{date as string}</span>
              <ChevronRight className="size-3.5 text-[#999999]" />
            </button>
          ))}
        </div>
      </section>
      <section className="rounded-[12px] border border-[#e8e8e8] bg-white p-5">
        <h3 className="text-[16px] font-black">健康趋势提示</h3>
        <p className="mt-1 text-[12px] text-[#8a8a8a]">基于近 30 天数据</p>
        <div className="mt-5 rounded-[12px] border border-[#e8e8e8] p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-6 place-items-center rounded-full border border-[#111111]"><Check className="size-3.5" /></span>
            <h4 className="text-[14px] font-black">身体状态良好</h4>
          </div>
          <p className="mt-3 text-[12px] leading-6 text-[#777777]">
            {onboarding?.next_steps?.[0] ?? "体重、体脂率呈下降趋势，肌肉量稳步提升，继续保持当前的训练和饮食计划。"}
          </p>
          <button className="mt-4 h-8 rounded-[8px] border border-[#e6e6e6] px-3 text-[12px] font-bold">查看建议</button>
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
        <button className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#9a9a9a]" onClick={onAction} type="button">
          {action}
          <ChevronRight className="size-3.5" />
        </button>
      ) : null}
    </div>
  )
}

function OverviewMetric({ bordered, icon: Icon, label, sub, unit, value }: { bordered?: boolean; icon: LucideIcon; label: string; sub: string; unit: string; value: string }) {
  return (
    <div className={cn("flex gap-4 px-3 py-2", bordered && "border-l border-[#eeeeee]")}>
      <Icon className="mt-1 size-7 shrink-0" strokeWidth={1.7} />
      <div>
        <p className="text-[12px] font-semibold text-[#9a9a9a]">{label}</p>
        <p className="mt-1 text-[22px] leading-none font-black">{value}<span className="ml-1 text-[11px] font-semibold text-[#777777]">{unit}</span></p>
        <p className="mt-3 text-[12px] text-[#9a9a9a]">{sub}</p>
      </div>
    </div>
  )
}

function BodyOverviewCell({ bordered, label, small, sub, value }: { bordered?: boolean; label: string; small?: boolean; sub: string; value: string }) {
  return (
    <div className={cn("px-5 py-3", bordered && "border-l border-[#eeeeee]")}>
      <p className="text-[12px] font-semibold text-[#8a8a8a]">{label}</p>
      <p className={cn("mt-2 font-black", small ? "text-[13px]" : "text-[22px]")}>{value}</p>
      {sub ? <p className="mt-1 text-[12px] text-[#555555]">{sub}</p> : null}
    </div>
  )
}

function MetricTrendCard({ change, chart, title, unit, value }: { change: string; chart: "down" | "down2" | "up" | "up2"; title: string; unit: string; value: string }) {
  return (
    <section className="rounded-[10px] border border-[#e8e8e8] bg-white p-4">
      <p className="text-[12px] font-semibold text-[#777777]">{title}</p>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-[22px] font-black">{value}</span>
        <span className="text-[12px] font-semibold text-[#777777]">{unit}</span>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-[12px] font-bold">{change}</p>
          <p className="mt-1 text-[11px] text-[#999999]">较上周期</p>
        </div>
        <MiniSparkline variant={chart} />
      </div>
    </section>
  )
}

function ChartHeader({ subtitle, title }: { subtitle: string; title: string }) {
  return (
    <div>
      <h3 className="text-[17px] font-black">{title}<Circle className="ml-2 inline size-3.5 text-[#999999]" /></h3>
      <p className="mt-2 text-[12px] text-[#8a8a8a]">{subtitle}</p>
    </div>
  )
}

function ChartSideStat({ delta, label, progress, target, value }: { delta: string; label: string; progress: number; target: string; value: string }) {
  return (
    <aside className="border-[#eeeeee] pt-2 lg:border-l lg:pl-5">
      <p className="text-[12px] text-[#8a8a8a]">{label}</p>
      <p className="mt-2 text-[20px] font-black">{value}</p>
      <p className="mt-1 text-[12px] text-[#8a8a8a]">05.14</p>
      <div className="my-5 h-px bg-[#eeeeee]" />
      <p className="text-[12px] text-[#8a8a8a]">周期变化</p>
      <p className="mt-2 text-[15px] font-black">{delta}</p>
      <p className="mt-5 text-[12px] text-[#8a8a8a]">目标值</p>
      <p className="mt-2 text-[17px] font-black">{target}</p>
      <p className="mt-2 text-[12px] text-[#8a8a8a]">目标达成 {progress}%</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eeeeee]">
        <div className="h-full rounded-full bg-[#111111]" style={{ width: `${progress}%` }} />
      </div>
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
      <path d={paths[variant]} fill="none" stroke="#111111" strokeLinecap="round" strokeWidth="2" />
    </svg>
  )
}

function LineChart({ height, points }: { height: number; points: number[] }) {
  const min = Math.min(...points) - 1
  const max = Math.max(...points) + 1
  const width = 640
  const step = width / (points.length - 1)
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
        <line key={line} x1="0" x2={width} y1={25 + line * 48} y2={25 + line * 48} stroke="#e9e9e9" strokeDasharray="3 4" />
      ))}
      <path d={path} fill="none" stroke="#111111" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
      <path d={`${path} L${width} ${height} L0 ${height} Z`} fill="url(#fade)" opacity="0.35" />
      <path d={`M${width * 0.72} ${height * 0.58} C${width * 0.82} ${height * 0.65}, ${width * 0.9} ${height * 0.69}, ${width} ${height * 0.75}`} fill="none" stroke="#888888" strokeDasharray="2 6" strokeLinecap="round" strokeWidth="2" />
      <g transform={`translate(${width * 0.72} ${height * 0.43})`}>
        <rect width="64" height="43" rx="7" fill="#111111" />
        <text x="9" y="18" fill="white" fontSize="12" fontWeight="700">70.2 kg</text>
        <text x="18" y="33" fill="white" fontSize="11">05.14</text>
      </g>
      <text x="4" y={height + 25} fill="#999999" fontSize="12">04.15</text>
      <text x={width * 0.98} y={height + 25} fill="#999999" fontSize="12" textAnchor="end">05.14</text>
      <defs>
        <linearGradient id="fade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#d8d8d8" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function AreaStackChart() {
  return (
    <svg className="mt-4 h-auto w-full" viewBox="0 0 520 230">
      {[0, 1, 2, 3].map((line) => <line key={line} x1="0" x2="520" y1={25 + line * 45} y2={25 + line * 45} stroke="#eeeeee" strokeDasharray="3 4" />)}
      <path d="M0 180 C80 176 120 182 180 174 C245 181 310 170 390 176 C440 172 485 169 520 171 L520 215 L0 215 Z" fill="#d4d5d8" />
      <path d="M0 115 C80 109 120 116 180 111 C245 115 310 101 390 109 C440 105 485 99 520 101 L520 215 L0 215 Z" fill="#111111" opacity="0.82" />
      <path d="M0 181 C120 176 220 184 340 177 C420 182 470 174 520 178 L520 215 L0 215 Z" fill="#efefef" />
      <text x="0" y="224" fill="#999999" fontSize="12">04.15</text>
      <text x="520" y="224" fill="#999999" fontSize="12" textAnchor="end">05.14</text>
    </svg>
  )
}

function PlanStackIllustration() {
  return (
    <svg className="hidden h-[140px] w-[150px] shrink-0 lg:block" viewBox="0 0 150 140">
      {[0, 1, 2, 3, 4].map((item) => (
        <path d="M75 10 128 38 75 66 22 38Z" fill="#eeeeee" opacity={0.38 + item * 0.1} key={item} transform={`translate(0 ${item * 15})`} />
      ))}
      <path d="M75 79 128 106 75 134 22 106Z" fill="#111111" />
      <path d="M65 102 74 96 83 101 91 94" fill="none" stroke="#ffffff" strokeLinecap="round" strokeWidth="2" />
    </svg>
  )
}
