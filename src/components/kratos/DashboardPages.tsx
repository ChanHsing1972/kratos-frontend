import {
  Activity,
  BarChart3,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  ClipboardList,
  ExternalLink,
  Flame,
  Gauge,
  Play,
  PencilLine,
  PlusCircle,
  Scale,
  SlidersHorizontal,
  Target,
  Timer,
  Trophy,
  Trash2,
  X,
  Utensils,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import {
  getPlanExerciseLines,
  trainingPlanTemplates,
} from "@/lib/kratos"
import { cn } from "@/lib/utils"
import type {
  AgentCheckin,
  BodyMetric,
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
  onDeletePlan: (plan: TrainingPlan) => void
  onEditPlan: (plan: TrainingPlan) => void
  onOpenPlanComposer: (draft?: TrainingPlanPayload | null) => void
  onOpenBodyData: () => void
  onSelectPlan: (plan: TrainingPlan) => void
  onToggleExercise: (title: string) => void
  onStartTraining: (dayTitle: string, workoutDate: string, actions: string[]) => void
  onCompleteTrainingDay: (
    dayTitle: string,
    workoutDate: string,
    actionTitles: string[],
    actionIds: string[]
  ) => void
  onPauseTraining: () => void
  onResumeTraining: () => void
  trainingElapsedSeconds: number
  trainingPaused: boolean
  trainingSessionDate: string | null
  trainingPlans: TrainingPlan[]
  trainingStarted: boolean
  workoutLogs: WorkoutLog[]
}

export function TrainingPlanPage({
  activePlan,
  completedExercises,
  dashboardLoading,
  onDeletePlan,
  onEditPlan,
  onOpenPlanComposer,
  onOpenBodyData,
  onSelectPlan,
  onToggleExercise,
  onStartTraining,
  onCompleteTrainingDay,
  onPauseTraining,
  onResumeTraining,
  trainingElapsedSeconds,
  trainingPaused,
  trainingSessionDate,
  trainingPlans,
  trainingStarted,
  workoutLogs,
}: TrainingPlanPageProps) {
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [selectedDate, setSelectedDate] = useState(() => localDateValue(new Date()))
  const [trainingTab, setTrainingTab] = useState<"week" | "today" | "details">("week")
  const [createMenuOpen, setCreateMenuOpen] = useState(false)
  const templateSectionRef = useRef<HTMLElement | null>(null)
  const calendarMenuRef = useRef<HTMLDivElement | null>(null)
  const createMenuRef = useRef<HTMLDivElement | null>(null)
  const dailyPlan = isDailyTrainingPlan(activePlan)
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
  const selectedTrainingActive =
    trainingStarted && selectedDay ? trainingSessionDate === selectedDay.dateValue : false
  const anotherTrainingActive =
    trainingStarted && selectedDay ? trainingSessionDate !== selectedDay.dateValue : false
  const selectedCompletedCount =
    selectedDay?.actions.filter((action) =>
      selectedTrainingActive
        ? completedExercises.includes(action.id)
        : selectedDayCompleted || completedExercises.includes(action.id)
    ).length ?? 0
  const selectedSavedSeconds = sumWorkoutSecondsForDate(
    workoutLogs,
    activePlan?.id ?? null,
    selectedDate
  )
  const selectedWorkoutLog = getLatestWorkoutForDate(
    workoutLogs,
    activePlan?.id ?? null,
    selectedDate
  )
  const selectedSnapshotActions = selectedWorkoutLog
    ? parseWorkoutActionsFromNotes(selectedWorkoutLog.notes)
    : []
  const selectedDisplayTitle =
    !selectedTrainingActive && selectedWorkoutLog?.title
      ? selectedWorkoutLog.title
      : selectedDay
        ? `${selectedDay.day} - ${selectedDay.title}`
        : ""
  const selectedDisplayActions =
    !selectedTrainingActive && selectedSnapshotActions.length > 0
      ? selectedSnapshotActions.map((title, index) => ({
          id: `${selectedDate}-snapshot-${index}-${title}`,
          title,
        }))
      : selectedDay?.actions ?? []
  const selectedTotalSeconds =
    selectedSavedSeconds + (selectedTrainingActive ? trainingElapsedSeconds : 0)
          const [calendarVisibleDate, setCalendarVisibleDate] = useState(() => new Date())
  const completedPlanSessions = trainingDays.filter((day) =>
    completedDateSet.has(day.dateValue)
  ).length
  const weekProgress = trainingDays.length
    ? Math.min(100, Math.round((completedPlanSessions / trainingDays.length) * 100))
    : 0
  const dailyLogCount = countWorkoutLogsForDate(
    workoutLogs,
    activePlan?.id ?? null,
    selectedDate
  )
  const dailyProgress = selectedDay
    ? selectedDayCompleted
      ? 100
      : Math.min(
          100,
          Math.round(
            ((selectedSnapshotActions.length || selectedCompletedCount) /
              selectedDay.actions.length) *
              100
          )
        )
    : 0
  const weekSeconds = sumWorkoutSecondsForWeek(
    workoutLogs,
    activePlan?.id ?? null,
    weekStart
  )
  const weekCalories = sumWorkoutCaloriesForWeek(
    workoutLogs,
    activePlan?.id ?? null,
    weekStart
  )
  const dailyCalories = sumWorkoutCaloriesForDate(
    workoutLogs,
    activePlan?.id ?? null,
    selectedDate
  )
  const overviewMode: "day" | "week" =
    dailyPlan || trainingTab === "today" ? "day" : "week"
  const overviewCompletedSessions =
    overviewMode === "day" ? dailyLogCount : completedPlanSessions
  const overviewProgress = overviewMode === "day" ? dailyProgress : weekProgress
  const overviewSeconds = overviewMode === "day" ? selectedTotalSeconds : weekSeconds
  const overviewCalories = overviewMode === "day" ? dailyCalories : weekCalories
  const planTotalProgress = calculatePlanTotalProgress(
    activePlan,
    workoutLogs,
    trainingDays.length,
    dailyProgress
  )
  const planCompletedSessions = countCompletedWorkoutLogsForPlan(
    workoutLogs,
    activePlan?.id ?? null
  )
  const planExpectedSessions = dailyPlan
    ? trainingDays.length || 1
    : activePlan
      ? calculateExpectedPlanSessions(activePlan, trainingDays.length)
      : 0
  const planTotalSeconds = sumWorkoutSecondsForPlan(
    workoutLogs,
    activePlan?.id ?? null
  )
  const planTitle = activePlan?.title ?? "暂无训练计划"
  const planGoal =
    activePlan?.goal ??
    "从模板创建或自定义撰写一份计划后，这里会展示后端同步的真实训练安排。"

  useEffect(() => {
    const baseDate =
      isDailyTrainingPlan(activePlan) && activePlan?.start_date
        ? dateFromValue(activePlan.start_date)
        : new Date()
    setWeekStart(startOfWeek(baseDate))
    setSelectedDate(localDateValue(baseDate))
    if (isDailyTrainingPlan(activePlan)) {
      setTrainingTab("today")
    }
  }, [activePlan?.id])

  useEffect(() => {
    if (!calendarOpen && !createMenuOpen) {
      return undefined
    }

    const closeMenus = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (
        (target && calendarMenuRef.current?.contains(target)) ||
        (target && createMenuRef.current?.contains(target))
      ) {
        return
      }
      setCalendarOpen(false)
      setCreateMenuOpen(false)
    }

    document.addEventListener("pointerdown", closeMenus)
    return () => {
      document.removeEventListener("pointerdown", closeMenus)
    }
  }, [calendarOpen, createMenuOpen])

  return (
    <main className="scrollbar-none min-h-0 flex-1 overflow-y-auto bg-white xl:overflow-hidden">
      <div className="grid min-h-full grid-cols-1 gap-8 px-8 py-8 xl:h-full xl:min-h-0 xl:grid-cols-[minmax(0,1fr)_350px] xl:px-10">
        <section className="scrollbar-none min-w-0 xl:min-h-0 xl:overflow-y-auto xl:pr-1">
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
                <div className="relative" ref={calendarMenuRef}>
                  <button
                    className="inline-flex h-9 items-center gap-2 rounded-[8px] border border-[#d9d9d9] bg-white px-4 text-[12px] font-semibold text-[#111111] transition hover:border-[#111111]"
                    onClick={() => {
                      setCalendarVisibleDate(dateFromValue(selectedDate))
                      setCalendarOpen((current) => !current)
                    }}
                    type="button"
                  >
                    {formatWeekRange(weekStart)}
                    <ChevronRight className="size-3.5 rotate-90" />
                  </button>
                  {calendarOpen ? (
                    <div className="absolute left-[-40px] top-[calc(100%+12px)] z-50 w-[min(84vw,320px)] sm:left-[-48px] sm:w-[340px]">
                      <TrainingCalendar
                        completedDateSet={completedDateSet}
                        onClose={() => setCalendarOpen(false)}
                        onSelectDate={(dateValue) => {
                          const date = dateFromValue(dateValue)
                          setWeekStart(startOfWeek(date))
                          setSelectedDate(dateValue)
                          setCalendarVisibleDate(date)
                          setCalendarOpen(false)
                        }}
                        onVisibleDateChange={setCalendarVisibleDate}
                        selectedDate={selectedDate}
                        visibleDate={calendarVisibleDate}
                      />
                    </div>
                  ) : null}
                </div>
                <IconButton
                  icon={ChevronRight}
                  label="下一周"
                  onClick={() => {
                    setWeekStart((current) => addDays(current, 7))
                    setSelectedDate((current) => localDateValue(addDays(dateFromValue(current), 7)))
                  }}
                />
                <div className="relative" ref={createMenuRef}>
                  <Button
                    className="h-10 rounded-[8px] bg-[#111111] px-5 text-[13px] font-bold text-white hover:bg-[#111111]/90"
                    onClick={() => setCreateMenuOpen((current) => !current)}
                    type="button"
                  >
                    <PlusCircle className="size-4" />
                    新建计划
                  </Button>
                  {createMenuOpen ? (
                    <div className="absolute right-0 top-12 z-30 w-44 overflow-hidden rounded-[10px] border border-[#e5e5e5] bg-white p-1 shadow-[0_14px_35px_rgba(0,0,0,0.14)]">
                      <button
                        className="flex h-10 w-full items-center justify-between rounded-[8px] px-3 text-left text-[13px] font-bold hover:bg-[#f6f6f5]"
                        onClick={() => {
                          setCreateMenuOpen(false)
                          templateSectionRef.current?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          })
                        }}
                        type="button"
                      >
                        从模板创建
                        <ChevronRight className="size-4 text-[#8a8a8a]" />
                      </button>
                      <button
                        className="flex h-10 w-full items-center justify-between rounded-[8px] px-3 text-left text-[13px] font-bold hover:bg-[#f6f6f5]"
                        onClick={() => {
                          setCreateMenuOpen(false)
                          onOpenPlanComposer(null)
                        }}
                        type="button"
                      >
                        自定义创建
                        <ChevronRight className="size-4 text-[#8a8a8a]" />
                      </button>
                    </div>
                  ) : null}
                </div>
              </>
            }
          />

          <WeekStrip
            completedDateSet={completedDateSet}
            onSelectDate={setSelectedDate}
            selectedDate={selectedDate}
            weekStart={weekStart}
          />

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
	                    activePlan?.start_date ? `开始：${activePlan.start_date}` : "开始日期：未设置",
	                    activePlan?.end_date ? `结束：${activePlan.end_date}` : "结束日期：未设置",
	                  ].map((tag) => (
                    <span className="rounded-[6px] bg-[#f4f4f4] px-2.5 py-1 text-[11px] font-bold text-[#666666]" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
	              <div className="flex items-center justify-between gap-6">
	                <div className="min-w-[180px]">
	                  <p className="text-[12px] font-semibold text-[#8a8a8a]">该训练总进度</p>
	                  <div className="mt-2 flex items-end gap-1">
	                    <span className="text-[30px] leading-none font-black">{planTotalProgress}</span>
	                    <span className="pb-1 text-[14px] font-bold">%</span>
	                  </div>
	                  <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-[#eeeeee]">
	                    <div className="h-full rounded-full bg-[#111111]" style={{ width: `${planTotalProgress}%` }} />
	                  </div>
	                  <div className="mt-4 grid grid-cols-2 gap-5 text-[12px] text-[#777777]">
	                    <div>
	                      <p className="font-bold text-[#111111]">
	                        {planCompletedSessions} / {planExpectedSessions} 次训练
	                      </p>
	                      <p className="mt-1">总完成</p>
	                    </div>
	                    <div>
	                      <p className="font-bold text-[#111111]">{formatHours(planTotalSeconds)}</p>
	                      <p className="mt-1">总累计训练</p>
	                    </div>
                  </div>
                </div>
                <PlanStackIllustration />
              </div>
            </div>
          </section>

          <div className="mt-7 flex items-center gap-8 border-b border-[#e5e5e5]">
            {!dailyPlan ? (
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
            ) : null}
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
              className={cn(
                "pb-3 text-[14px] font-black",
                trainingTab === "details"
                  ? "border-b-2 border-[#111111] text-[#111111]"
                  : "text-[#8a8a8a]"
              )}
              onClick={() => setTrainingTab("details")}
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
                    {selectedDisplayTitle}
                  </h2>
                  <p className="mt-2 text-[13px] leading-6 text-[#666666]">
                    {formatDateLabel(selectedDay.date)} · 今日训练时长 {formatDurationShort(selectedTotalSeconds)}
                    {" · "}
                    {selectedTrainingActive
                      ? `${selectedCompletedCount}/${selectedDay.actions.length} 个动作已完成`
                      : selectedDayCompleted
                        ? "当日训练已完成"
                        : `${selectedCompletedCount}/${selectedDay.actions.length} 个动作已完成`}
                  </p>
                </div>
                <Button
                  className={cn(
                    "h-10 rounded-[8px] px-5 text-[13px] font-bold",
                    selectedTrainingActive
                      ? "bg-[#111111] text-white hover:bg-[#111111]/90"
                      : "border-[#dedede]"
                  )}
                  disabled={dashboardLoading || anotherTrainingActive}
                  onClick={() => {
                    if (selectedTrainingActive) {
                      onCompleteTrainingDay(
                        `${selectedDay.day} - ${selectedDay.title}`,
                        selectedDay.dateValue,
                        selectedDay.actions.map((action) => action.title),
                        selectedDay.actions.map((action) => action.id)
                      )
                      return
                    }

                    onStartTraining(
                      `${selectedDay.day} - ${selectedDay.title}`,
                      selectedDay.dateValue,
                      selectedDay.actions.map((action) => action.id)
                    )
                  }}
                  type="button"
                  variant={selectedTrainingActive ? "default" : "outline"}
                >
                  <Play className="size-4" />
                  {selectedTrainingActive
                    ? "结束并保存"
                    : anotherTrainingActive
                      ? "其他训练进行中"
                      : selectedDayCompleted
                        ? "再次训练"
                        : "开始训练"}
                </Button>
              </div>
              {selectedTrainingActive ? (
                <div className="mt-4 rounded-[10px] border border-[#e8e8e8] bg-[#fafafa] px-4 py-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[12px] font-semibold text-[#8a8a8a]">
                        {trainingPaused ? "训练已暂停" : "训练计时"}
                      </p>
                      <p className="mt-1 text-[24px] font-black tracking-[-0.04em]">
                        {formatTimer(trainingElapsedSeconds)}
                      </p>
                    </div>
                    <Button
                      className="h-9 rounded-[8px] border-[#dedede] px-4 text-[12px] font-bold"
                      onClick={trainingPaused ? onResumeTraining : onPauseTraining}
                      type="button"
                      variant="outline"
                    >
                      {trainingPaused ? "继续训练" : "暂停训练"}
                    </Button>
                  </div>
                </div>
              ) : null}
              <div className="mt-5 grid gap-3">
                {selectedDisplayActions.map((action, index) => {
                  const completed =
                    selectedTrainingActive
                      ? completedExercises.includes(action.id)
                      : selectedDayCompleted || completedExercises.includes(action.id)

                  return (
                    <button
                      className={cn(
                        "flex min-h-[58px] items-center gap-4 rounded-[10px] border px-4 text-left transition",
                        completed
                          ? "border-[#111111] bg-[#f7f7f6]"
                          : "border-[#e8e8e8] bg-white hover:bg-[#fbfbfb]"
                      )}
                      key={action.id}
                      disabled={!selectedTrainingActive || trainingPaused}
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
              <p className="mt-2 text-[13px] font-bold text-[#555555]">
                今日训练时长 {formatDurationShort(selectedTotalSeconds)}
              </p>
              <p className="mx-auto mt-2 max-w-[430px] text-[13px] leading-6 text-[#777777]">
                这一天没有匹配到当前计划里的训练日。你可以切换到有训练任务的日期，或新建计划调整周安排。
              </p>
            </section>
          ) : null}

          {trainingTab === "details" ? (
            <PlanDetailsSection plan={activePlan} />
          ) : null}

          {!dailyPlan && trainingTab === "week" && trainingDays.length > 0 ? (
            <div className="mt-4 overflow-hidden rounded-[12px] border border-[#e8e8e8]">
              {trainingDays.map((day, index) => {
                const dayLog = getLatestWorkoutForDate(
                  workoutLogs,
                  activePlan?.id ?? null,
                  day.dateValue
                )
                const loggedActions = dayLog
                  ? parseWorkoutActionsFromNotes(dayLog.notes)
                  : []
                const dayCompleted = completedDateSet.has(day.dateValue)
                const completedCount = day.actions.filter((action) =>
                  dayCompleted || completedExercises.includes(action.id)
                ).length
                const allDone = dayCompleted || completedCount === day.actions.length
                const displayTitle = dayCompleted && dayLog?.title
                  ? dayLog.title
                  : `${day.day} - ${day.title}`

                return (
                  <button
                    className={cn(
                      "flex min-h-[72px] w-full items-center gap-5 border-b border-[#ececec] bg-white px-6 text-left last:border-b-0 hover:bg-[#fbfbfb]",
                      selectedDate === day.dateValue && "bg-[#fbfbfb]"
                    )}
                    key={day.id}
                    onClick={() => {
                      if (selectedDate === day.dateValue) {
                        setTrainingTab("today")
                        return
                      }

                      setSelectedDate(day.dateValue)
                    }}
                    type="button"
                  >
                    <ScheduleDot completed={allDone} index={index + 1} active={selectedDate === day.dateValue} />
                    <div className="min-w-0 flex-1">
                      <span className="text-[13px] font-black">{displayTitle}</span>
                      <p className="mt-1 line-clamp-1 text-[12px] text-[#777777]">
                        {formatDateLabel(day.date)} · {dayCompleted && loggedActions.length > 0
                          ? loggedActions.join("；")
                          : day.goal}
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
          ) : !dailyPlan && trainingTab === "week" ? (
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

          <section className="mt-8" ref={templateSectionRef}>
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
          onDeletePlan={onDeletePlan}
          onEditPlan={onEditPlan}
          onOpenPlanComposer={onOpenPlanComposer}
          onSelectPlan={onSelectPlan}
          plan={activePlan}
          plans={trainingPlans}
          completedSessions={overviewCompletedSessions}
          totalSeconds={overviewSeconds}
          calories={overviewCalories}
          progress={overviewProgress}
          workoutLogs={workoutLogs}
          onOpenBodyData={onOpenBodyData}
          overviewMode={overviewMode}
        />
      </div>
    </main>
  )
}

function buildTrainingDays(plan: TrainingPlan | null, weekStart: Date) {
  const lines = getPlanExerciseLines(plan).filter(isTrainingDayLine)
  const dailyPlan = isDailyTrainingPlan(plan)
  const dailyDate = dailyPlan
    ? dateFromValue(plan?.start_date ?? localDateValue(new Date()))
    : null

  return lines.map((line, dayIndex) => {
    const [dayPart, contentPart] = line.includes("｜")
      ? line.split("｜", 2)
      : [`第 ${dayIndex + 1} 天`, line]
    const weekdayIndex = dailyDate ? getMondayFirstDayIndex(dailyDate) : inferWeekdayIndex(dayPart, dayIndex)
    const date = dailyDate ?? addDays(weekStart, weekdayIndex)
    const dateValue = localDateValue(date)
    const dayLabel = dailyDate ? weekdayLabel(date) : dayPart.trim()
    const [titlePart, actionPart] = splitTrainingDayContent(contentPart)
    const actions = splitTrainingActions(actionPart || titlePart).map((title, actionIndex) => ({
      id: `${dateValue}-${dayLabel}-${dayIndex}-${actionIndex}-${title}`,
      title,
    }))

    return {
      actions: actions.length
        ? actions
        : [{ id: `${dateValue}-${dayLabel}-${dayIndex}-0-${contentPart.trim()}`, title: contentPart.trim() }],
      date,
      dateValue,
      day: dayLabel,
      goal: contentPart.trim(),
      id: `${dayLabel}-${dayIndex}-${contentPart.trim()}`,
      title: titlePart.trim() || "训练日",
    }
  })
}

function isDailyTrainingPlan(plan: TrainingPlan | null) {
  const lines = getPlanExerciseLines(plan).filter(isTrainingDayLine)
  if (!plan || lines.length !== 1) {
    return false
  }

  if (plan.end_date && plan.start_date && plan.end_date !== plan.start_date) {
    return false
  }

  return !plan.end_date || /今日|当天|每日|单日|本次|今天|Kratos 生成/.test(
    `${plan.title} ${plan.summary ?? ""} ${plan.goal ?? ""}`
  )
}

function calculatePlanTotalProgress(
  plan: TrainingPlan | null,
  logs: WorkoutLog[],
  weeklyTrainingDayCount: number,
  dailyProgress: number
) {
  if (!plan) {
    return 0
  }

  if (isDailyTrainingPlan(plan)) {
    return dailyProgress
  }

  const completedLogs = logs.filter(
    (log) => log.training_plan_id === plan.id && log.completed
  ).length
  const expectedSessions = calculateExpectedPlanSessions(plan, weeklyTrainingDayCount)

  if (expectedSessions <= 0) {
    return completedLogs > 0 ? 100 : 0
  }

  return Math.min(100, Math.round((completedLogs / expectedSessions) * 100))
}

function calculateExpectedPlanSessions(plan: TrainingPlan, weeklyTrainingDayCount: number) {
  const fallback = Math.max(weeklyTrainingDayCount, 1)
  if (!plan.start_date || !plan.end_date) {
    return fallback
  }

  const start = dateFromValue(plan.start_date)
  const end = dateFromValue(plan.end_date)
  if (end < start) {
    return fallback
  }

  const totalDays = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1
  const fullWeeks = Math.floor(totalDays / 7)
  const remainderDays = totalDays % 7
  const weeklyIndexes = getPlanExerciseLines(plan)
    .filter(isTrainingDayLine)
    .map((line, index) => {
      const [dayPart] = line.includes("｜")
        ? line.split("｜", 2)
        : [`第 ${index + 1} 天`]
      return inferWeekdayIndex(dayPart, index)
    })

  const remainderSessions = Array.from({ length: remainderDays }, (_, index) =>
    getMondayFirstDayIndex(addDays(start, fullWeeks * 7 + index))
  ).filter((weekdayIndex) => weeklyIndexes.includes(weekdayIndex)).length

  return Math.max(fullWeeks * weeklyTrainingDayCount + remainderSessions, fallback)
}

function PlanDetailsSection({ plan }: { plan: TrainingPlan | null }) {
  if (!plan) {
    return (
      <section className="mt-4 rounded-[12px] border border-dashed border-[#d8d8d8] bg-[#fafafa] p-8 text-center">
        <ClipboardList className="mx-auto size-7 text-[#777777]" />
        <h2 className="mt-3 text-[17px] font-black">暂无计划详情</h2>
        <p className="mx-auto mt-2 max-w-[430px] text-[13px] leading-6 text-[#777777]">
          创建或选择一个训练计划后，这里会展示完整内容。
        </p>
      </section>
    )
  }

  return (
    <section className="mt-4 rounded-[12px] border border-[#e8e8e8] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold text-[#8a8a8a]">计划详情</p>
          <h2 className="mt-2 text-[20px] font-black tracking-[-0.04em]">{plan.title}</h2>
          <p className="mt-2 text-[13px] leading-6 text-[#666666]">
            {plan.summary ?? "暂无摘要"}
          </p>
        </div>
        <span className="rounded-[7px] bg-[#f4f4f4] px-3 py-1.5 text-[12px] font-black text-[#555555]">
          {planStatusLabel(plan.status)}
        </span>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <DetailBlock label="目标" value={plan.goal ?? "未设置"} />
        <DetailBlock label="周期" value={`${plan.start_date ?? "未设置"} - ${plan.end_date ?? "未设置"}`} />
        <DetailBlock label="周训练安排" value={plan.weekly_schedule ?? "未填写"} large />
        <DetailBlock label="恢复建议" value={plan.recovery_guidance ?? "未填写"} large />
        <DetailBlock label="营养建议" value={plan.nutrition_guidance ?? "未填写"} large />
      </div>
    </section>
  )
}

function DetailBlock({
  label,
  large,
  value,
}: {
  label: string
  large?: boolean
  value: string
}) {
  return (
    <div className={cn("rounded-[10px] border border-[#eeeeee] bg-[#fafafa] p-4", large && "md:col-span-2")}>
      <p className="text-[12px] font-black text-[#777777]">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-[13px] leading-6 text-[#444444]">{value}</p>
    </div>
  )
}

function isTrainingDayLine(line: string) {
  const normalized = line.trim()
  if (!normalized) {
    return false
  }

  if (/^(进阶提示|调整提示|恢复提示|营养提示|最近训练反馈|根据最近一次)/.test(normalized)) {
    return false
  }

  return /(周[一二三四五六日天]|第\s*\d+\s*天)/.test(normalized)
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

function sumWorkoutSecondsForDate(
  logs: WorkoutLog[],
  planId: number | null,
  dateValue: string
) {
  return logs
    .filter(
      (log) =>
        log.training_plan_id === planId &&
        log.workout_date === dateValue
    )
    .reduce((sum, log) => sum + getWorkoutSeconds(log), 0)
}

function sumWorkoutSecondsForWeek(
  logs: WorkoutLog[],
  planId: number | null,
  weekStart: Date
) {
  const weekEnd = addDays(weekStart, 6)
  return logs
    .filter((log) => isWorkoutLogInRange(log, planId, weekStart, weekEnd))
    .reduce((sum, log) => sum + getWorkoutSeconds(log), 0)
}

function sumWorkoutSecondsForPlan(logs: WorkoutLog[], planId: number | null) {
  return logs
    .filter((log) => log.training_plan_id === planId)
    .reduce((sum, log) => sum + getWorkoutSeconds(log), 0)
}

function countCompletedWorkoutLogsForPlan(logs: WorkoutLog[], planId: number | null) {
  return logs.filter((log) => log.training_plan_id === planId && log.completed).length
}

function countWorkoutLogsForDate(
  logs: WorkoutLog[],
  planId: number | null,
  dateValue: string
) {
  return logs.filter(
    (log) => log.training_plan_id === planId && log.workout_date === dateValue
  ).length
}

function sumWorkoutCaloriesForDate(
  logs: WorkoutLog[],
  planId: number | null,
  dateValue: string
) {
  return logs
    .filter(
      (log) => log.training_plan_id === planId && log.workout_date === dateValue
    )
    .reduce((sum, log) => sum + (log.calories_burned ?? 0), 0)
}

function sumWorkoutCaloriesForWeek(
  logs: WorkoutLog[],
  planId: number | null,
  weekStart: Date
) {
  const weekEnd = addDays(weekStart, 6)
  return logs
    .filter((log) => isWorkoutLogInRange(log, planId, weekStart, weekEnd))
    .reduce((sum, log) => sum + (log.calories_burned ?? 0), 0)
}

function isWorkoutLogInRange(
  log: WorkoutLog,
  planId: number | null,
  start: Date,
  end: Date
) {
  if (log.training_plan_id !== planId) {
    return false
  }

  const date = dateFromValue(log.workout_date)
  return date >= start && date <= end
}

function getWorkoutSeconds(log: WorkoutLog) {
  return log.duration_seconds ?? (log.duration_minutes ?? 0) * 60
}

function getLatestWorkoutForDate(
  logs: WorkoutLog[],
  planId: number | null,
  dateValue: string
) {
  return logs
    .filter(
      (log) =>
        log.training_plan_id === planId &&
        log.workout_date === dateValue
    )
    .sort(
      (left, right) =>
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
    )[0] ?? null
}

function parseWorkoutActionsFromNotes(notes: string | null) {
  if (!notes) {
    return []
  }

  const snapshotMatched = notes.match(/动作快照：(\[[\s\S]*?\])(?:；|$)/)
  if (snapshotMatched?.[1]) {
    try {
      const parsed = JSON.parse(snapshotMatched[1]) as unknown
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => (typeof item === "string" ? item.trim() : ""))
          .filter(Boolean)
      }
    } catch {
      // Fall back to legacy text parsing below.
    }
  }

  const matched = notes.match(/已标记：(.+)$/) ?? notes.match(/已完成：(.+)$/)
  if (!matched?.[1]) {
    return []
  }

  return matched[1]
    .split("、")
    .map((item) => item.trim())
    .filter(Boolean)
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

function addMonths(date: Date, months: number) {
  const next = new Date(date)
  next.setDate(1)
  next.setMonth(next.getMonth() + months)
  return next
}

function addYears(date: Date, years: number) {
  const next = new Date(date)
  next.setDate(1)
  next.setFullYear(next.getFullYear() + years)
  return next
}

function localDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function weekdayLabel(date: Date) {
  const labels = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
  return labels[date.getDay()]
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

function formatTimer(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":")
}

function formatDurationShort(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes <= 0) {
    return `${seconds} 秒`
  }

  return `${minutes} 分 ${seconds.toString().padStart(2, "0")} 秒`
}

function formatHours(totalSeconds: number) {
  return `${(totalSeconds / 3600).toFixed(1)} 小时`
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
      <PageHeader title="评估平台" subtitle="综合评估已接入外部平台。" />
      <section className="mt-8 rounded-[12px] border border-[#e8e8e8] p-8">
        <BarChart3 className="size-6 text-[#111111]" />
        <h2 className="mt-4 text-[20px] font-black">打开综合评估</h2>
        <p className="mt-2 text-[14px] leading-7 text-[#777777]">
          点击下方按钮会在外部页面打开评估平台。
        </p>
        <a
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#111111] px-4 text-[13px] font-bold text-white hover:bg-[#222222]"
          href="http://192.0.2.1/eval"
          rel="noreferrer"
          target="_blank"
        >
          前往评估平台
          <ExternalLink className="size-4" />
        </a>
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
    <section className="mt-6 overflow-hidden rounded-[16px] border border-[#e6e6e6] bg-white shadow-[0_10px_30px_rgba(17,17,17,0.04)]">
      <div className="flex items-center justify-between gap-4 border-b border-[#ededed] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full border border-[#111111] bg-white text-[#111111]">
            <Calendar className="size-4" />
          </span>
          <div>
            <p className="text-[12px] font-semibold tracking-[0.08em] text-[#6b6b6b] uppercase">Date Navigation</p>
            <p className="text-[11px] leading-4 text-[#9b9b9b]">当前周：{formatWeekRange(weekStart)} · 点击切换训练日</p>
          </div>
        </div>
        <span className="hidden rounded-full border border-[#ececec] bg-[#fafafa] px-3 py-1 text-[11px] font-medium text-[#7a7a7a] sm:inline-flex">
          未训练 / 已完成
        </span>
      </div>

      <div className="grid grid-cols-7 gap-2 px-3 py-3 sm:px-4">
        {days.map(({ date, day, label, value }) => {
          const selected = selectedDate === value
          const completed = completedDateSet.has(value)
          const today = date.toDateString() === new Date().toDateString()

          return (
            <button
              className={cn(
                "group relative flex min-h-[108px] flex-col items-start justify-between overflow-hidden rounded-[12px] border px-3 py-3 text-left transition-all duration-200 ease-out",
                selected
                  ? "border-[#111111] bg-white text-[#111111] shadow-[0_14px_28px_rgba(17,17,17,0.12)]"
                  : "border-[#e8e8e8] bg-white text-[#111111] hover:-translate-y-0.5 hover:border-[#bfbfbf] hover:shadow-[0_10px_20px_rgba(17,17,17,0.05)]",
                today && !selected && "border-[#111111] shadow-[0_0_0_1px_rgba(17,17,17,0.06)]",
                completed && !today && !selected && "border-[#d9d9d9]"
              )}
              key={value}
              onClick={() => onSelectDate(value)}
              type="button"
            >
              <div className="flex w-full items-start justify-between gap-3">
                <span
                  className={cn(
                    "text-[11px] font-semibold uppercase tracking-[0.22em]",
                    selected ? "text-[#111111]" : "text-[#9b9b9b]"
                  )}
                >
                  {day}
                </span>
                {completed ? (
                  <span className="grid size-5 place-items-center rounded-[6px] border border-[#111111] bg-[#111111]">
                    <Check className="size-3 text-white" />
                  </span>
                ) : null}
              </div>

              <div className="mt-3 flex items-end gap-2">
                <span className="text-[26px] leading-none font-semibold tracking-[-0.04em] text-[#111111]">{label}</span>
              </div>

              <div
                className={cn(
                  "mt-4 flex w-full items-center justify-center rounded-[8px] px-3 py-1.5 text-[11px] font-medium",
                  selected
                    ? "border border-[#111111] bg-[#f7f7f7] text-[#111111]"
                    : completed
                      ? "bg-[#111111] text-white"
                      : "border border-[#ededed] bg-[#fafafa] text-[#7a7a7a]"
                )}
              >
                <span>{completed ? "已完成" : "未训练"}</span>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function TrainingCalendar({
  completedDateSet,
  onClose,
  onSelectDate,
  onVisibleDateChange,
  selectedDate,
  visibleDate,
}: {
  completedDateSet: Set<string>
  onClose: () => void
  onSelectDate: (dateValue: string) => void
  onVisibleDateChange: (date: Date) => void
  selectedDate: string
  visibleDate: Date
}) {
  const days = buildCalendarDays(visibleDate)

  return (
    <section className="overflow-hidden rounded-[16px] border border-[#e6e6e6] bg-white shadow-[0_14px_34px_rgba(17,17,17,0.08)] ring-1 ring-black/5">
      <div className="flex items-start justify-between gap-3 border-b border-[#ededed] px-3.5 py-3.5">
        <div>
          <h2 className="text-[15px] font-semibold tracking-[-0.04em] text-[#111111]">{formatMonthTitle(visibleDate)}</h2>
          <p className="mt-1 text-[11px] leading-4 text-[#9b9b9b]">点选日期即可切换对应训练日</p>
        </div>
        <button
          className="grid size-8 place-items-center rounded-full border border-[#e5e5e5] bg-white text-[#111111] transition hover:border-[#111111] hover:bg-[#f7f7f7]"
          onClick={onClose}
          type="button"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-5 gap-1.5 px-3.5 pt-3.5">
        <button
          className="inline-flex h-8 items-center justify-center rounded-full border border-[#e5e5e5] bg-white px-2 text-[10px] font-medium text-[#111111] transition hover:border-[#111111]"
          onClick={() => onVisibleDateChange(addYears(visibleDate, -1))}
          type="button"
        >
          上一年
        </button>
        <button
          className="inline-flex h-8 items-center justify-center rounded-full border border-[#e5e5e5] bg-white px-2 text-[10px] font-medium text-[#111111] transition hover:border-[#111111]"
          onClick={() => onVisibleDateChange(addMonths(visibleDate, -1))}
          type="button"
        >
          上一月
        </button>
        <button
          className="inline-flex h-8 items-center justify-center rounded-full border border-[#111111] bg-white px-2 text-[10px] font-medium text-[#111111] transition hover:bg-[#f7f7f7]"
          onClick={() => onVisibleDateChange(new Date())}
          type="button"
        >
          今天
        </button>
        <button
          className="inline-flex h-8 items-center justify-center rounded-full border border-[#e5e5e5] bg-white px-2 text-[10px] font-medium text-[#111111] transition hover:border-[#111111]"
          onClick={() => onVisibleDateChange(addMonths(visibleDate, 1))}
          type="button"
        >
          下一月
        </button>
        <button
          className="inline-flex h-8 items-center justify-center rounded-full border border-[#e5e5e5] bg-white px-2 text-[10px] font-medium text-[#111111] transition hover:border-[#111111]"
          onClick={() => onVisibleDateChange(addYears(visibleDate, 1))}
          type="button"
        >
          下一年
        </button>
      </div>

      <div className="mt-3.5 grid grid-cols-7 gap-1.5 px-3.5 text-center text-[11px] font-medium text-[#9b9b9b]">
        {["一", "二", "三", "四", "五", "六", "日"].map((day) => (
          <span className="py-1.5 uppercase tracking-[0.14em]" key={day}>
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5 px-3.5 pb-3.5 pt-2">
        {days.map(({ currentMonth, date, value }) => {
          const selected = selectedDate === value
          const completed = completedDateSet.has(value)
          const today = date.toDateString() === new Date().toDateString()

          return (
            <button
              className={cn(
                "relative flex h-11 flex-col items-center justify-center rounded-[10px] border text-[12px] font-medium transition-all duration-200 ease-out",
                currentMonth ? "text-[#111111]" : "text-[#c7c7c7]",
                selected && "border-[#111111] bg-white text-[#111111] shadow-[0_10px_22px_rgba(17,17,17,0.09)] ring-1 ring-[#111111]/70",
                today && !selected && "border-[#111111] bg-white shadow-[0_0_0_1px_rgba(17,17,17,0.05)]",
                completed && !today && !selected && "border-[#d9d9d9] bg-white text-[#111111] shadow-[0_6px_14px_rgba(17,17,17,0.06)]"
              )}
              key={value}
              onClick={() => onSelectDate(value)}
              type="button"
            >
              <span
                className={cn(
                  "relative grid size-7 place-items-center rounded-[8px]",
                  selected && "border border-[#111111] bg-white text-[#111111] shadow-sm",
                  completed && !selected && "border border-[#111111] bg-white text-[#111111] shadow-sm",
                  today && !selected && "border border-[#111111] bg-white text-[#111111]"
                )}
              >
                {date.getDate()}
                {completed ? (
                  <Check className="absolute -top-1.5 -right-1.5 size-3.5 rounded-[5px] bg-white p-0.5 text-[#111111] shadow-sm ring-1 ring-[#d8d8d8]" />
                ) : null}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function ScheduleDot({ active, completed, index }: { active?: boolean; completed?: boolean; index: number }) {
  if (completed) {
    return <span className="grid size-8 place-items-center rounded-full bg-[#111111] text-white shadow-[0_6px_16px_rgba(17,17,17,0.16)]"><Check className="size-4" /></span>
  }

  if (active) {
    return <span className="grid size-8 place-items-center rounded-full border border-[#111111] bg-white"><span className="size-3 rounded-full bg-[#111111]" /></span>
  }

  return <span className="grid size-8 place-items-center rounded-full border border-[#e5e5e5] bg-white text-[13px] font-medium text-[#7a7a7a]">{index}</span>
}

function TrainingRightRail({
  calories,
  completedSessions,
  overviewMode,
  onDeletePlan,
  onEditPlan,
  onOpenPlanComposer,
  onSelectPlan,
  plan,
  plans,
  progress,
  totalSeconds,
  workoutLogs,
  onOpenBodyData,
}: {
  calories: number
  completedSessions: number
  overviewMode: "day" | "week"
  onDeletePlan: (plan: TrainingPlan) => void
  onEditPlan: (plan: TrainingPlan) => void
  onOpenPlanComposer: (draft?: TrainingPlanPayload | null) => void
  onSelectPlan: (plan: TrainingPlan) => void
  plan: TrainingPlan | null
  plans: TrainingPlan[]
  progress: number
  totalSeconds: number
  workoutLogs: WorkoutLog[]
  onOpenBodyData: () => void
}) {
  const dailySuggestion = buildDailySuggestion(plan, workoutLogs)
  const dailyPlans = plans.filter(isDailyTrainingPlan)
  const longTermPlans = plans.filter((item) => !isDailyTrainingPlan(item))
  const dailyOverview = overviewMode === "day"

  return (
    <aside className="scrollbar-none space-y-6 xl:min-h-0 xl:overflow-y-auto xl:pr-1">
      <RailHeader title={dailyOverview ? "本日概览" : "本周概览"} action="更多数据" onAction={onOpenBodyData} />
      <section className="rounded-[12px] border border-[#e8e8e8] bg-white p-5">
        <div className="grid grid-cols-2 gap-y-6">
          <OverviewMetric icon={Timer} label="训练时长" value={(totalSeconds / 3600).toFixed(1)} unit="h" sub={dailyOverview ? "本日累计" : "本周累计"} />
          <OverviewMetric icon={Flame} label="消耗热量" value={calories.toString()} unit="kcal" sub={dailyOverview ? "本日累计" : "本周累计"} bordered />
          <OverviewMetric icon={Activity} label="训练次数" value={completedSessions.toString()} unit="次" sub={dailyOverview ? "本日完成" : "本周完成"} />
          <OverviewMetric icon={Target} label="完成度" value={progress.toString()} unit="%" sub={dailyOverview ? "本日进度" : "本周进度"} bordered />
        </div>
      </section>
      <section className="rounded-[12px] border border-[#e8e8e8] bg-white p-5">
        <div className="flex items-center gap-2">
          <Trophy className="size-4 fill-[#111111]" />
          <h3 className="text-[14px] font-black">Kratos 建议</h3>
        </div>
        <p className="mt-4 text-[13px] leading-6 text-[#777777]">{dailySuggestion}</p>
      </section>
      <RailHeader title="计划库" action="新建" onAction={() => onOpenPlanComposer(null)} />
      {plans.length > 0 ? (
        <div className="space-y-5">
          <SavedPlanGroup
            emptyText="暂无长期计划。适合保存周期训练、周计划和阶段目标。"
            onDeletePlan={onDeletePlan}
            onEditPlan={onEditPlan}
            onSelectPlan={onSelectPlan}
            plans={longTermPlans}
            selectedPlanId={plan?.id ?? null}
            title="长期计划"
          />
          <SavedPlanGroup
            emptyText="暂无每日计划。聊天生成的当日训练会放在这里。"
            onDeletePlan={onDeletePlan}
            onEditPlan={onEditPlan}
            onSelectPlan={onSelectPlan}
            plans={dailyPlans}
            selectedPlanId={plan?.id ?? null}
            title="每日计划"
          />
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

function SavedPlanGroup({
  emptyText,
  onDeletePlan,
  onEditPlan,
  onSelectPlan,
  plans,
  selectedPlanId,
  title,
}: {
  emptyText: string
  onDeletePlan: (plan: TrainingPlan) => void
  onEditPlan: (plan: TrainingPlan) => void
  onSelectPlan: (plan: TrainingPlan) => void
  plans: TrainingPlan[]
  selectedPlanId: number | null
  title: string
}) {
  return (
    <section>
      <h3 className="mb-2 text-[12px] font-black tracking-[0.08em] text-[#777777] uppercase">
        {title}
      </h3>
      {plans.length > 0 ? (
        <div className="space-y-3">
          {plans.map((item) => (
            <section
              className={cn(
                "w-full rounded-[12px] border bg-white p-4 text-left hover:bg-[#fbfbfb]",
                item.id === selectedPlanId ? "border-[#111111]" : "border-[#e8e8e8]"
              )}
              key={item.id}
            >
              <div className="flex items-center justify-between gap-3">
                <button
                  className="min-w-0 flex-1 text-left"
                  onClick={() => onSelectPlan(item)}
                  type="button"
                >
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
                </button>
                <div className="flex shrink-0 items-center gap-2">
                  {item.id === selectedPlanId ? (
                    <Check className="size-4 text-[#111111]" />
                  ) : (
                    <ChevronRight className="size-4 text-[#8a8a8a]" />
                  )}
                  <button
                    aria-label={`编辑 ${item.title}`}
                    className="grid size-8 place-items-center rounded-[8px] border border-[#e7e7e7] bg-white text-[#8a8a8a] transition hover:border-[#111111] hover:text-[#111111]"
                    onClick={() => onEditPlan(item)}
                    type="button"
                  >
                    <PencilLine className="size-3.5" />
                  </button>
                  <button
                    aria-label={`删除 ${item.title}`}
                    className="grid size-8 place-items-center rounded-[8px] border border-[#e7e7e7] bg-white text-[#8a8a8a] transition hover:border-[#111111] hover:text-[#111111]"
                    onClick={() => onDeletePlan(item)}
                    type="button"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
              <button
                className="mt-2 block w-full text-left"
                onClick={() => onSelectPlan(item)}
                type="button"
              >
                <p className="line-clamp-2 text-[12px] leading-5 text-[#777777]">
                  {item.summary ?? item.weekly_schedule ?? "这份计划已保存到后端 plans 表。"}
                </p>
                <p className="mt-2 text-[12px] text-[#8a8a8a]">
                  {item.id === selectedPlanId
                    ? "当前计划"
                    : item.start_date
                      ? `点击设为当前 · 开始：${item.start_date}`
                      : "点击设为当前 · 未设置开始日期"}
                </p>
              </button>
            </section>
          ))}
        </div>
      ) : (
        <p className="rounded-[10px] border border-dashed border-[#dedede] bg-[#fafafa] p-3 text-[12px] leading-5 text-[#888888]">
          {emptyText}
        </p>
      )}
    </section>
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

function buildDailySuggestion(plan: TrainingPlan | null, workoutLogs: WorkoutLog[]) {
  const latestLog = [...workoutLogs].sort(
    (left, right) =>
      new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
  )[0]

  if (latestLog && latestLog.completed === false) {
    return "最近一次训练提前结束，下一次建议先减少 1-2 个动作或降低 15-25% 训练量，优先保证完成率和动作质量。"
  }

  if (latestLog?.notes?.includes("膝") || latestLog?.notes?.includes("疼")) {
    return "最近反馈出现疼痛或不适信号，下一次训练优先选择低冲击动作，疼痛超过 3/10 立即停止。"
  }

  if (plan?.recovery_guidance) {
    return plan.recovery_guidance.split(/\r?\n/).filter(Boolean).slice(-1)[0]
  }

  if (latestLog?.duration_seconds || latestLog?.duration_minutes) {
    return `最近一次训练完成 ${formatDurationShort(getWorkoutSeconds(latestLog))}，下次保持热身充分，并根据当日疲劳调整强度。`
  }

  return "完成训练后填写反馈，Kratos 会在这里给出下一次训练的动态建议。"
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
