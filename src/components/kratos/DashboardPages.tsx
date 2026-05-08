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
import { useEffect, useMemo, useState, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import {
  buildPlanPanel,
  buildReminderPanel,
  getPlanExerciseLines,
  trainingPlanTemplates,
} from "@/lib/kratos"
import { cn } from "@/lib/utils"
import type {
  AgentCheckin,
  BodyMetric,
  DetailPanel,
  FitnessProfile,
  OnboardingStatus,
  TrainingPlan,
  TrainingPlanPayload,
  WorkoutLog,
} from "@/types/kratos"

type TrainingPlanPageProps = {
  activePlan: TrainingPlan | null
  completedExercises: string[]
  dashboardLoading: boolean
  onOpenPlanComposer: (draft?: TrainingPlanPayload | null) => void
  onOpenPanel: (panel: DetailPanel) => void
  onSelectPlan: (plan: TrainingPlan) => void
  onToggleExercise: (title: string) => void
  onStartTraining: (actions: string[]) => void
  onCompleteTrainingDay: (
    dayTitle: string,
    workoutDate: string,
    actionTitles: string[],
    actionIds: string[]
  ) => void
  trainingPlans: TrainingPlan[]
  trainingStarted: boolean
  workoutLogs: WorkoutLog[]
}

export function TrainingPlanPage({
  activePlan,
  completedExercises,
  dashboardLoading,
  onOpenPlanComposer,
  onOpenPanel,
  onSelectPlan,
  onToggleExercise,
  onStartTraining,
  onCompleteTrainingDay,
  trainingPlans,
  trainingStarted,
  workoutLogs,
}: TrainingPlanPageProps) {
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [selectedDate, setSelectedDate] = useState(() => localDateValue(new Date()))
  const [trainingTab, setTrainingTab] = useState<"week" | "today">("week")
  const trainingDays = useMemo(
    () => buildTrainingDays(activePlan, weekStart),
    [activePlan, weekStart]
  )
  const selectedDay = trainingDays.find((day) => day.dateValue === selectedDate) ?? null
  const completedDateSet = useMemo(
    () => buildCompletedDateSet(workoutLogs, activePlan?.id ?? null),
    [activePlan?.id, workoutLogs]
  )
  const selectedDayCompleted = selectedDay
    ? completedDateSet.has(selectedDay.dateValue)
    : false
  const selectedCompletedCount =
    selectedDay?.actions.filter((action) =>
      selectedDayCompleted || completedExercises.includes(action.id)
    ).length ?? 0
  const selectedAllDone =
    selectedDayCompleted ||
    (selectedDay ? selectedCompletedCount === selectedDay.actions.length : false)
  const completedPlanSessions = trainingDays.filter((day) =>
    completedDateSet.has(day.dateValue)
  ).length
  const progress = trainingDays.length
    ? Math.min(100, Math.round((completedPlanSessions / trainingDays.length) * 100))
    : 0
  const completedSessions = completedPlanSessions
  const totalMinutes =
    workoutLogs.reduce((sum, log) => sum + (log.duration_minutes ?? 0), 0)
  const planTitle = activePlan?.title ?? "暂无训练计划"
  const planGoal =
    activePlan?.goal ??
    "从模板创建或自定义撰写一份计划后，这里会展示后端同步的真实训练安排。"

  useEffect(() => {
    const today = new Date()
    setWeekStart(startOfWeek(today))
    setSelectedDate(localDateValue(today))
  }, [activePlan?.id])

  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-white">
      <div className="grid min-h-full grid-cols-1 gap-8 px-8 py-8 xl:grid-cols-[minmax(0,1fr)_350px] xl:px-10">
        <section className="min-w-0">
          <PageHeader
            title="训练计划"
            actions={
              <>
                <IconButton
                  icon={ChevronLeft}
                  label="上一周"
                  onClick={() => {
                    setWeekStart((current) => addDays(current, -7))
                    setSelectedDate((current) => localDateValue(addDays(dateFromValue(current), -7)))
                  }}
                />
                <button
                  className="inline-flex h-9 items-center gap-2 rounded-[8px] border border-[#e5e5e5] px-4 text-[12px] font-bold"
                  onClick={() => setCalendarOpen((current) => !current)}
                  type="button"
                >
                  {formatWeekRange(weekStart)}
                  <ChevronRight className="size-3.5 rotate-90" />
                </button>
                <IconButton
                  icon={ChevronRight}
                  label="下一周"
                  onClick={() => {
                    setWeekStart((current) => addDays(current, 7))
                    setSelectedDate((current) => localDateValue(addDays(dateFromValue(current), 7)))
                  }}
                />
                <Button
                  className="h-10 rounded-[8px] bg-[#111111] px-5 text-[13px] font-bold text-white hover:bg-[#111111]/90"
                  onClick={() => onOpenPlanComposer(null)}
                  type="button"
                >
                  <PlusCircle className="size-4" />
                  新建计划
                </Button>
              </>
            }
          />

          <WeekStrip
            completedDateSet={completedDateSet}
            onSelectDate={setSelectedDate}
            selectedDate={selectedDate}
            weekStart={weekStart}
          />
          {calendarOpen ? (
            <TrainingCalendar
              completedDateSet={completedDateSet}
              onSelectDate={(dateValue) => {
                const date = dateFromValue(dateValue)
                setWeekStart(startOfWeek(date))
                setSelectedDate(dateValue)
              }}
              selectedDate={selectedDate}
              visibleDate={weekStart}
            />
          ) : null}

          <section className="mt-4 rounded-[12px] border border-[#e8e8e8] bg-white p-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_390px]">
              <div className="border-[#eeeeee] lg:border-r lg:pr-8">
                <p className="text-[12px] font-semibold text-[#8a8a8a]">当前计划</p>
                <h2 className="mt-2 text-[24px] leading-tight font-black tracking-[-0.04em]">
                  {planTitle}
                </h2>
                <p className="mt-4 max-w-[620px] text-[14px] leading-7 text-[#666666]">
                  {planGoal}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {[
                    `目标：${activePlan?.goal ?? "未设置"}`,
                    `状态：${activePlan?.status ?? "未创建"}`,
                    `计划数：${trainingPlans.length}`,
                    activePlan?.start_date ? `开始：${activePlan.start_date}` : "开始日期：未设置",
                  ].map((tag) => (
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
                      <p className="font-bold text-[#111111]">{completedSessions} / {trainingDays.length || 0} 次训练</p>
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
            <button
              className={cn(
                "pb-3 text-[14px] font-black",
                trainingTab === "week"
                  ? "border-b-2 border-[#111111] text-[#111111]"
                  : "text-[#8a8a8a]"
              )}
              onClick={() => setTrainingTab("week")}
              type="button"
            >
              本周训练目标
            </button>
            <button
              className={cn(
                "pb-3 text-[14px] font-black",
                trainingTab === "today"
                  ? "border-b-2 border-[#111111] text-[#111111]"
                  : "text-[#8a8a8a]"
              )}
              onClick={() => setTrainingTab("today")}
              type="button"
            >
              当日训练计划
            </button>
            <button
              className="pb-3 text-[14px] font-semibold text-[#8a8a8a]"
              onClick={() => onOpenPanel(buildPlanPanel(activePlan))}
              type="button"
            >
              计划详情
            </button>
          </div>

          {trainingTab === "today" && selectedDay ? (
            <section className="mt-4 rounded-[12px] border border-[#e8e8e8] bg-white p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[12px] font-semibold text-[#8a8a8a]">当日训练计划</p>
                  <h2 className="mt-2 text-[20px] font-black tracking-[-0.04em]">
                    {selectedDay.day} - {selectedDay.title}
                  </h2>
                  <p className="mt-2 text-[13px] leading-6 text-[#666666]">
                    {formatDateLabel(selectedDay.date)} · {selectedDayCompleted
                      ? "当日训练已完成"
                      : `${selectedCompletedCount}/${selectedDay.actions.length} 个动作已完成`}
                  </p>
                </div>
                <Button
                  className={cn(
                    "h-10 rounded-[8px] px-5 text-[13px] font-bold",
                    selectedAllDone
                      ? "bg-[#111111] text-white hover:bg-[#111111]/90"
                      : "border-[#dedede]"
                  )}
                  disabled={
                    dashboardLoading ||
                    selectedDayCompleted ||
                    (trainingStarted && !selectedAllDone)
                  }
                  onClick={() => {
                    if (selectedAllDone) {
                      onCompleteTrainingDay(
                        `${selectedDay.day} - ${selectedDay.title}`,
                        selectedDay.dateValue,
                        selectedDay.actions.map((action) => action.title),
                        selectedDay.actions.map((action) => action.id)
                      )
                      return
                    }

                    onStartTraining(selectedDay.actions.map((action) => action.id))
                  }}
                  type="button"
                  variant={selectedAllDone ? "default" : "outline"}
                >
                  <Play className="size-4" />
                  {selectedAllDone
                    ? selectedDayCompleted
                      ? "当日训练已完成"
                      : "确认当日训练完成"
                    : trainingStarted
                      ? "完成全部动作后确认"
                      : "开始训练"}
                </Button>
              </div>
              <div className="mt-5 grid gap-3">
                {selectedDay.actions.map((action, index) => {
                  const completed =
                    selectedDayCompleted || completedExercises.includes(action.id)

                  return (
                    <button
                      className={cn(
                        "flex min-h-[58px] items-center gap-4 rounded-[10px] border px-4 text-left transition",
                        completed
                          ? "border-[#111111] bg-[#f7f7f6]"
                          : "border-[#e8e8e8] bg-white hover:bg-[#fbfbfb]"
                      )}
                      key={action.id}
                      disabled={selectedDayCompleted}
                      onClick={() => onToggleExercise(action.id)}
                      type="button"
                    >
                      <span
                        className={cn(
                          "grid size-6 shrink-0 place-items-center rounded-full border text-[11px] font-black",
                          completed
                            ? "border-[#111111] bg-[#111111] text-white"
                            : "border-[#d8d8d8] text-[#999999]"
                        )}
                      >
                        {completed ? <Check className="size-3.5" /> : index + 1}
                      </span>
                      <span className="min-w-0 flex-1 text-[13px] font-bold leading-5">
                        {action.title}
                      </span>
                      <span className="text-[12px] font-semibold text-[#8a8a8a]">
                        {completed ? "已完成" : "待完成"}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          ) : trainingTab === "today" ? (
            <section className="mt-4 rounded-[12px] border border-dashed border-[#d8d8d8] bg-[#fafafa] p-8 text-center">
              <Calendar className="mx-auto size-7 text-[#777777]" />
              <h2 className="mt-3 text-[17px] font-black">
                {formatDateLabel(dateFromValue(selectedDate))} 暂无训练任务
              </h2>
              <p className="mx-auto mt-2 max-w-[430px] text-[13px] leading-6 text-[#777777]">
                这一天没有匹配到当前计划里的训练日。你可以切换到有训练任务的日期，或新建计划调整周安排。
              </p>
            </section>
          ) : null}

          {trainingTab === "week" && trainingDays.length > 0 ? (
            <div className="mt-4 overflow-hidden rounded-[12px] border border-[#e8e8e8]">
              {trainingDays.map((day, index) => {
                const dayCompleted = completedDateSet.has(day.dateValue)
                const completedCount = day.actions.filter((action) =>
                  dayCompleted ||
                  completedExercises.includes(action.id)
                ).length
                const allDone = dayCompleted || completedCount === day.actions.length

                return (
              <button
                className={cn(
                  "flex min-h-[72px] w-full items-center gap-5 border-b border-[#ececec] bg-white px-6 text-left last:border-b-0 hover:bg-[#fbfbfb]",
                  selectedDate === day.dateValue && "bg-[#fbfbfb]"
                )}
                key={day.id}
                onClick={() => setSelectedDate(day.dateValue)}
                type="button"
              >
                <ScheduleDot completed={allDone} index={index + 1} active={selectedDate === day.dateValue} />
                <div className="min-w-0 flex-1">
                  <span className="text-[13px] font-black">{day.day} - {day.title}</span>
                  <p className="mt-1 line-clamp-1 text-[12px] text-[#777777]">
                    {formatDateLabel(day.date)} · {day.goal}
                  </p>
                </div>
                <span className="min-w-20 text-right text-[12px] font-semibold text-[#8a8a8a]">
                  {dayCompleted ? "已完成训练" : `${completedCount}/${day.actions.length} 动作`}
                </span>
                <ChevronRight className="size-4 text-[#9a9a9a]" />
              </button>
                )
              })}
            </div>
          ) : trainingTab === "week" ? (
            <section className="mt-1 rounded-[12px] border border-dashed border-[#d8d8d8] bg-[#fafafa] p-8 text-center">
              <ClipboardList className="mx-auto size-7 text-[#777777]" />
              <h2 className="mt-3 text-[17px] font-black">还没有可执行的训练安排</h2>
              <p className="mx-auto mt-2 max-w-[430px] text-[13px] leading-6 text-[#777777]">
                选择一个常见模板，或从空白计划开始撰写。保存后会同步到后端计划接口。
              </p>
              <Button
                className="mt-4 h-10 rounded-[8px] bg-[#111111] px-5 text-[13px] font-bold text-white hover:bg-[#111111]/90"
                onClick={() => onOpenPlanComposer(null)}
                type="button"
              >
                <PlusCircle className="size-4" />
                自定义计划
              </Button>
            </section>
          ) : null}

          <section className="mt-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-[18px] font-black tracking-[-0.03em]">
                  常见计划模板
                </h2>
                <p className="mt-1 text-[12px] text-[#8a8a8a]">
                  点进模板后可以继续改标题、周期、训练日和恢复建议。
                </p>
              </div>
              <Button
                className="h-9 rounded-[8px] border-[#dedede] px-4 text-[12px] font-bold"
                onClick={() => onOpenPlanComposer(null)}
                type="button"
                variant="outline"
              >
                <SlidersHorizontal className="size-4" />
                空白撰写
              </Button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {trainingPlanTemplates.map((template) => (
                <button
                  className="rounded-[12px] border border-[#e8e8e8] bg-white p-4 text-left transition hover:border-[#111111] hover:shadow-[0_14px_35px_rgba(0,0,0,0.08)]"
                  key={template.id}
                  onClick={() => onOpenPlanComposer(template)}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-[6px] bg-[#f3f3f2] px-2 py-1 text-[11px] font-black text-[#555555]">
                      {template.level}
                    </span>
                    <ChevronRight className="size-4 text-[#777777]" />
                  </div>
                  <h3 className="mt-4 text-[16px] font-black tracking-[-0.03em]">
                    {template.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-[12px] leading-5 text-[#666666]">
                    {template.summary}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[template.duration, template.frequency, template.goal].map((tag) => (
                      <span
                        className="rounded-[6px] border border-[#ededed] px-2 py-1 text-[11px] font-bold text-[#777777]"
                        key={tag ?? template.id}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </section>
          <p className="mt-6 text-center text-[12px] text-[#a0a0a0]">计划会根据你的训练反馈和身体状态自动优化。</p>
        </section>

        <TrainingRightRail
          onOpenPlanComposer={onOpenPlanComposer}
          onOpenPanel={onOpenPanel}
          onSelectPlan={onSelectPlan}
          plan={activePlan}
          plans={trainingPlans}
          completedSessions={completedSessions}
          totalMinutes={totalMinutes}
          progress={progress}
        />
      </div>
    </main>
  )
}

function buildTrainingDays(plan: TrainingPlan | null, weekStart: Date) {
  return getPlanExerciseLines(plan).map((line, dayIndex) => {
    const [dayPart, contentPart] = line.includes("｜")
      ? line.split("｜", 2)
      : [`第 ${dayIndex + 1} 天`, line]
    const weekdayIndex = inferWeekdayIndex(dayPart, dayIndex)
    const date = addDays(weekStart, weekdayIndex)
    const dateValue = localDateValue(date)
    const [titlePart, actionPart] = splitTrainingDayContent(contentPart)
    const actions = splitTrainingActions(actionPart || titlePart).map((title, actionIndex) => ({
      id: `${dateValue}-${dayPart.trim()}-${dayIndex}-${actionIndex}-${title}`,
      title,
    }))

    return {
      actions: actions.length
        ? actions
        : [{ id: `${dateValue}-${dayPart.trim()}-${dayIndex}-0-${contentPart.trim()}`, title: contentPart.trim() }],
      date,
      dateValue,
      day: dayPart.trim(),
      goal: contentPart.trim(),
      id: `${dayPart.trim()}-${dayIndex}-${contentPart.trim()}`,
      title: titlePart.trim() || "训练日",
    }
  })
}

function splitTrainingDayContent(content: string) {
  const normalized = content.trim()
  const separatorIndex = normalized.search(/[:：]/)

  if (separatorIndex === -1) {
    return [normalized, normalized]
  }

  return [
    normalized.slice(0, separatorIndex).trim(),
    normalized.slice(separatorIndex + 1).trim(),
  ]
}

function splitTrainingActions(content: string) {
  return content
    .split(/[；;]\s*/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function buildCompletedDateSet(logs: WorkoutLog[], planId: number | null) {
  return new Set(
    logs
      .filter((log) => log.completed && log.training_plan_id === planId)
      .map((log) => log.workout_date)
  )
}

function inferWeekdayIndex(label: string, fallback: number) {
  const normalized = label.trim()
  const weekdays = ["一", "二", "三", "四", "五", "六", "日"]
  const found = weekdays.findIndex((day) => normalized.includes(`周${day}`))
  return found >= 0 ? found : Math.min(fallback, 6)
}

function startOfWeek(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  const day = getMondayFirstDayIndex(next)
  next.setDate(next.getDate() - day)
  return next
}

function getMondayFirstDayIndex(date: Date) {
  return (date.getDay() + 6) % 7
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function localDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function dateFromValue(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function buildWeekDays(weekStart: Date) {
  return ["一", "二", "三", "四", "五", "六", "日"].map((day, index) => {
    const date = addDays(weekStart, index)
    return {
      date,
      day,
      label: `${date.getMonth() + 1}.${date.getDate()}`,
      value: localDateValue(date),
    }
  })
}

function buildCalendarDays(visibleDate: Date) {
  const monthStart = new Date(visibleDate.getFullYear(), visibleDate.getMonth(), 1)
  const calendarStart = startOfWeek(monthStart)

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(calendarStart, index)
    return {
      currentMonth: date.getMonth() === visibleDate.getMonth(),
      date,
      value: localDateValue(date),
    }
  })
}

function formatWeekRange(weekStart: Date) {
  const weekEnd = addDays(weekStart, 6)
  return `${weekStart.getMonth() + 1}.${weekStart.getDate()} - ${weekEnd.getMonth() + 1}.${weekEnd.getDate()}`
}

function formatMonthTitle(date: Date) {
  return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月`
}

function formatDateLabel(date: Date) {
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日`
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

function IconButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon
  label: string
  onClick?: () => void
}) {
  return (
    <button
      aria-label={label}
      className="grid size-9 place-items-center rounded-[8px] border border-[#e5e5e5]"
      onClick={onClick}
      type="button"
    >
      <Icon className="size-4" />
    </button>
  )
}

function WeekStrip({
  completedDateSet,
  onSelectDate,
  selectedDate,
  weekStart,
}: {
  completedDateSet: Set<string>
  onSelectDate: (dateValue: string) => void
  selectedDate: string
  weekStart: Date
}) {
  const days = buildWeekDays(weekStart)

  return (
    <div className="mt-6 grid grid-cols-7 gap-2">
      {days.map(({ date, day, label, value }) => {
        const selected = selectedDate === value
        const completed = completedDateSet.has(value)
        const today = date.toDateString() === new Date().toDateString()

        return (
        <button
          className={cn(
            "mx-auto grid h-[76px] w-[82px] place-items-center rounded-[12px] text-center transition",
            selected ? "bg-[#111111] text-white" : "text-[#555555]",
            today && !selected && "bg-white shadow-[0_10px_24px_rgba(0,0,0,0.14)] ring-1 ring-[#d8d8d8]",
            completed && !today && !selected && "bg-[#f0f0ef]"
          )}
          key={value}
          onClick={() => onSelectDate(value)}
          type="button"
        >
          <span className="block text-[15px] font-black">{day}</span>
          <span
            className={cn(
              "relative mt-2 block rounded-[7px] px-2 py-1 text-[13px] font-semibold",
              selected ? "text-white" : "text-[#888888]",
              completed && !today && !selected && "bg-[#111111] text-white"
            )}
          >
            {label}
            {completed && !today ? (
              <Check className={cn("absolute -top-2 -right-2 size-4 rounded-full p-0.5", selected ? "bg-white text-[#111111]" : "bg-white text-[#111111] shadow-sm")} />
            ) : null}
          </span>
          {today ? (
            <span className={cn("mt-1 text-[10px] font-black", selected ? "text-white" : "text-[#111111]")}>今天</span>
          ) : null}
        </button>
        )
      })}
    </div>
  )
}

function TrainingCalendar({
  completedDateSet,
  onSelectDate,
  selectedDate,
  visibleDate,
}: {
  completedDateSet: Set<string>
  onSelectDate: (dateValue: string) => void
  selectedDate: string
  visibleDate: Date
}) {
  const days = buildCalendarDays(visibleDate)

  return (
    <section className="mt-3 rounded-[12px] border border-[#e8e8e8] bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[14px] font-black">{formatMonthTitle(visibleDate)}</h2>
        <span className="text-[12px] font-semibold text-[#8a8a8a]">
          勾选表示当天已有完成记录
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-[#8a8a8a]">
        {["一", "二", "三", "四", "五", "六", "日"].map((day) => (
          <span className="py-1" key={day}>{day}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map(({ currentMonth, date, value }) => {
          const selected = selectedDate === value
          const completed = completedDateSet.has(value)
          const today = date.toDateString() === new Date().toDateString()

          return (
            <button
              className={cn(
                "relative grid h-10 place-items-center rounded-[8px] text-[12px] font-bold transition",
                currentMonth ? "text-[#333333]" : "text-[#c0c0c0]",
                selected && "bg-[#111111] text-white",
                today && !selected && "bg-white shadow-[0_8px_18px_rgba(0,0,0,0.14)] ring-1 ring-[#d8d8d8]",
                completed && !today && !selected && "bg-[#eeeeed] text-[#111111]"
              )}
              key={value}
              onClick={() => onSelectDate(value)}
              type="button"
            >
              <span
                className={cn(
                  "relative grid size-6 place-items-center rounded-full",
                  completed && !today && "bg-[#111111] text-white"
                )}
              >
                {date.getDate()}
                {completed && !today ? (
                  <Check className={cn("absolute -top-1.5 -right-1.5 size-3.5 rounded-full p-0.5", selected ? "bg-white text-[#111111]" : "bg-white text-[#111111] shadow-sm")} />
                ) : null}
              </span>
              {today ? (
                <span className={cn("absolute bottom-0.5 text-[8px] font-black", selected ? "text-white" : "text-[#111111]")}>今</span>
              ) : null}
            </button>
          )
        })}
      </div>
    </section>
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

function TrainingRightRail({
  completedSessions,
  onOpenPanel,
  onOpenPlanComposer,
  onSelectPlan,
  plan,
  plans,
  progress,
  totalMinutes,
}: {
  completedSessions: number
  onOpenPanel: (panel: DetailPanel) => void
  onOpenPlanComposer: (draft?: TrainingPlanPayload | null) => void
  onSelectPlan: (plan: TrainingPlan) => void
  plan: TrainingPlan | null
  plans: TrainingPlan[]
  progress: number
  totalMinutes: number
}) {
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
      <RailHeader
        title="已保存计划"
        action="新建"
        onAction={() => onOpenPlanComposer(null)}
      />
      {plans.length > 0 ? (
        <div className="space-y-3">
          {plans.map((item) => (
            <button
              className={cn(
                "w-full rounded-[12px] border bg-white p-4 text-left hover:bg-[#fbfbfb]",
                item.id === plan?.id ? "border-[#111111]" : "border-[#e8e8e8]"
              )}
              key={item.id}
              onClick={() => onSelectPlan(item)}
              type="button"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-[14px] font-black">{item.title}</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-[5px] bg-[#f5f5f5] px-2 py-0.5 text-[11px] font-bold text-[#666666]">
                      {planStatusLabel(item.status)}
                    </span>
                    {item.goal ? (
                      <span className="rounded-[5px] bg-[#f5f5f5] px-2 py-0.5 text-[11px] font-bold text-[#666666]">
                        {item.goal}
                      </span>
                    ) : null}
                  </div>
                </div>
                {item.id === plan?.id ? (
                  <Check className="size-4 shrink-0 text-[#111111]" />
                ) : (
                  <ChevronRight className="size-4 shrink-0 text-[#8a8a8a]" />
                )}
              </div>
              <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-[#777777]">
                {item.summary ?? item.weekly_schedule ?? "这份计划已保存到后端 plans 表。"}
              </p>
              <p className="mt-2 text-[12px] text-[#8a8a8a]">
                {item.id === plan?.id
                  ? "当前计划"
                  : item.start_date
                    ? `点击设为当前 · 开始：${item.start_date}`
                    : "点击设为当前 · 未设置开始日期"}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <section className="rounded-[12px] border border-dashed border-[#d8d8d8] bg-[#fafafa] p-4">
          <h3 className="text-[14px] font-black">还没有保存的计划</h3>
          <p className="mt-2 text-[12px] leading-5 text-[#777777]">
            从模板或空白计划保存后，这里会显示后端 /plans 返回的计划列表。
          </p>
          <Button
            className="mt-4 h-9 rounded-[8px] bg-[#111111] px-4 text-[12px] font-bold text-white hover:bg-[#111111]/90"
            onClick={() => onOpenPlanComposer(null)}
            type="button"
          >
            <PlusCircle className="size-4" />
            新建计划
          </Button>
        </section>
      )}
    </aside>
  )
}

function planStatusLabel(status: string) {
  const labels: Record<string, string> = {
    active: "进行中",
    archived: "已归档",
    draft: "草稿",
    paused: "暂停",
  }

  return labels[status] ?? status
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
