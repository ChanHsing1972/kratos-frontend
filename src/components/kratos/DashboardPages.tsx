import {
  BarChart3,
  Calendar as CalendarIcon,
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
  Utensils,
  WandSparkles,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
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
import { ButtonGroup } from "../ui/button-group"

type TrainingPlanPageProps = {
  activePlan: TrainingPlan | null
  completedExercises: string[]
  dashboardLoading: boolean
  onDeletePlan: (plan: TrainingPlan) => void
  onEditPlan: (plan: TrainingPlan) => void
  onOpenPlanComposer: (draft?: TrainingPlanPayload | null) => void
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
  const activePlanKey = activePlan?.id ?? null
  const initialTrainingDate = getInitialTrainingDate(activePlan)
  const [trainingDateState, setTrainingDateState] = useState(() => ({
    planId: activePlanKey,
    selectedDate: localDateValue(initialTrainingDate),
    weekStart: startOfWeek(initialTrainingDate),
  }))

  if (trainingDateState.planId !== activePlanKey) {
    const nextInitialTrainingDate = getInitialTrainingDate(activePlan)
    setTrainingDateState({
      planId: activePlanKey,
      selectedDate: localDateValue(nextInitialTrainingDate),
      weekStart: startOfWeek(nextInitialTrainingDate),
    })
  }

  const { selectedDate, weekStart } = trainingDateState
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const calendarMenuRef = useRef<HTMLDivElement | null>(null)
  const moreMenuRef = useRef<HTMLDivElement | null>(null)
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
  const selectedWorkoutLog = getLatestWorkoutForDate(
    workoutLogs,
    activePlan?.id ?? null,
    selectedDate
  )
  const selectedWorkoutCompletedTitles = selectedWorkoutLog
    ? parseWorkoutActionsFromNotes(selectedWorkoutLog.notes)
    : []
  const selectedDisplayActions = selectedDay?.actions.map((action) => {
    const completed = selectedTrainingActive
      ? completedExercises.includes(action.id)
      : selectedDayCompleted || selectedWorkoutCompletedTitles.includes(action.title)

    return {
      ...action,
      completed,
    }
  }) ?? []
  const selectedCompletedCount = selectedDisplayActions.filter((action) => action.completed).length
  const selectedSavedSeconds = sumWorkoutSecondsForDate(
    workoutLogs,
    activePlan?.id ?? null,
    selectedDate
  )
  const selectedDisplayTitle =
    !selectedTrainingActive && selectedWorkoutLog?.title
      ? selectedWorkoutLog.title
      : selectedDay
        ? `${selectedDay.day} - ${selectedDay.title}`
        : ""
  const selectedTotalSeconds =
    selectedSavedSeconds + (selectedTrainingActive ? trainingElapsedSeconds : 0)
  const [calendarVisibleDate, setCalendarVisibleDate] = useState(() => new Date())
  const completedPlanSessions = trainingDays.filter((day) =>
    completedDateSet.has(day.dateValue)
  ).length
  const weekProgress = trainingDays.length
    ? Math.min(100, Math.round((completedPlanSessions / trainingDays.length) * 100))
    : 0
  const dailyProgress = selectedDay
    ? selectedDayCompleted
      ? 100
      : Math.min(
        100,
        Math.round((selectedCompletedCount / Math.max(selectedDay.actions.length, 1)) * 100)
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
  const planTotalProgress = calculatePlanTotalProgress(
    activePlan,
    workoutLogs,
    trainingDays.length,
    dailyProgress
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
  const dailySuggestion = buildDailySuggestion(activePlan, workoutLogs)
  const trainingStreak = calculateTrainingStreak(workoutLogs, activePlan?.id ?? null)
  const handleToggleCalendar = () => {
    setCalendarVisibleDate(dateFromValue(selectedDate))
    setCalendarOpen((current) => !current)
  }
  const handleToggleMoreMenu = () => {
    setMoreMenuOpen((current) => !current)
  }

  useEffect(() => {
    if (!calendarOpen && !moreMenuOpen) {
      return undefined
    }

    const closeMenus = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (
        (target && calendarMenuRef.current?.contains(target)) ||
        (target && moreMenuRef.current?.contains(target))
      ) {
        return
      }
      setCalendarOpen(false)
      setMoreMenuOpen(false)
    }

    document.addEventListener("pointerdown", closeMenus)
    return () => {
      document.removeEventListener("pointerdown", closeMenus)
    }
  }, [calendarOpen, moreMenuOpen])

  return (
    <main className="scrollbar-none min-h-0 flex-1 overflow-y-auto bg-muted/40">
      <section className="mx-auto flex min-h-full w-full max-w-385 flex-col px-6 py-7 sm:px-8 xl:px-12">
        <PageHeader
          title="训练计划"
          actions={
            <>
              <div className="relative" ref={calendarMenuRef}>
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-[#dfdfdf] bg-white px-4 text-[13px] font-bold text-[#111111] transition hover:border-[#111111]"
                  onClick={() => {
                    setCalendarVisibleDate(dateFromValue(selectedDate))
                    setCalendarOpen((current) => !current)
                  }}
                  type="button"
                >
                  <Calendar className="size-4" />
                  {formatWeekRange(weekStart)}
                  <ChevronRight className="size-3.5 rotate-90" />
                </button>
                {calendarOpen ? (
                  <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[min(88vw,340px)]">
                    <TrainingCalendar
                      completedDateSet={completedDateSet}
                      onClose={() => setCalendarOpen(false)}
                      onSelectDate={(dateValue) => {
                        const date = dateFromValue(dateValue)
                        setTrainingDateState({
                          planId: activePlanKey,
                          selectedDate: dateValue,
                          weekStart: startOfWeek(date),
                        })
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
              <Button
                aria-label="上一周"
                className="h-10 w-10 rounded-[10px] border border-[#dfdfdf] bg-white p-0 text-[#111111] hover:border-[#111111] hover:bg-white"
                onClick={() => {
                  setTrainingDateState((current) => {
                    const nextSelectedDate = localDateValue(
                      addDays(dateFromValue(current.selectedDate), -7)
                    )
                    return {
                      ...current,
                      selectedDate: nextSelectedDate,
                      weekStart: addDays(current.weekStart, -7),
                    }
                  })
                }}
                type="button"
                variant="outline"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                aria-label="下一周"
                className="h-10 w-10 rounded-[10px] border border-[#dfdfdf] bg-white p-0 text-[#111111] hover:border-[#111111] hover:bg-white"
                onClick={() => {
                  setTrainingDateState((current) => {
                    const nextSelectedDate = localDateValue(
                      addDays(dateFromValue(current.selectedDate), 7)
                    )
                    return {
                      ...current,
                      selectedDate: nextSelectedDate,
                      weekStart: addDays(current.weekStart, 7),
                    }
                  })
                }}
                type="button"
                variant="outline"
              >
                <ChevronRight className="size-4" />
              </Button>
              <div className="relative" ref={moreMenuRef}>
                <Button
                  className="h-10 rounded-[10px] bg-[#111111] px-5 text-[13px] font-bold text-white hover:bg-[#111111]/90"
                  onClick={() => setMoreMenuOpen((current) => !current)}
                  type="button"
                >
                  <SlidersHorizontal className="size-4" />
                  更多功能
                  <ChevronRight className="size-3.5 rotate-90" />
                </Button>
                {moreMenuOpen ? (
                  <MoreTrainingMenu
                    onClose={() => setMoreMenuOpen(false)}
                    onDeletePlan={onDeletePlan}
                    onEditPlan={onEditPlan}
                    onOpenPlanComposer={onOpenPlanComposer}
                    onSelectPlan={onSelectPlan}
                    plan={activePlan}
                    plans={trainingPlans}
                  />
                ) : null}
              </div>
            </>
          }
        />

        <TrainingStatsBar
          completedSessions={completedPlanSessions}
          planTitle={planTitle}
          planTotalProgress={planTotalProgress}
          planTotalSeconds={planTotalSeconds}
          stageLabel={buildPlanStageLabel(activePlan, weekStart)}
          streakDays={trainingStreak}
          totalSessions={planExpectedSessions}
          weekCalories={weekCalories}
          weekProgress={weekProgress}
          weekSeconds={weekSeconds}
        />

        <TodayTrainingHero
          anotherTrainingActive={anotherTrainingActive}
          dashboardLoading={dashboardLoading}
          dailyProgress={dailyProgress}
          dailySuggestion={dailySuggestion}
          onCompleteTrainingDay={onCompleteTrainingDay}
          onOpenPlanComposer={onOpenPlanComposer}
          onPauseTraining={onPauseTraining}
          onResumeTraining={onResumeTraining}
          onToggleExercise={onToggleExercise}
          onStartTraining={onStartTraining}
          planGoal={planGoal}
          selectedCompletedCount={selectedCompletedCount}
          selectedDate={selectedDate}
          selectedDay={selectedDay}
          selectedDayCompleted={selectedDayCompleted}
          selectedDisplayActions={selectedDisplayActions}
          selectedDisplayTitle={selectedDisplayTitle}
          selectedTotalSeconds={selectedTotalSeconds}
          selectedTrainingActive={selectedTrainingActive}
          trainingElapsedSeconds={trainingElapsedSeconds}
          trainingPaused={trainingPaused}
          completedExercises={completedExercises}
        />

        <WeeklyTrainingTimeline
          activePlan={activePlan}
          activePlanId={activePlan?.id ?? null}
          calendarMenuRef={calendarMenuRef}
          calendarOpen={calendarOpen}
          calendarVisibleDate={calendarVisibleDate}
          completedDateSet={completedDateSet}
          completedExercises={completedExercises}
          moreMenuOpen={moreMenuOpen}
          moreMenuRef={moreMenuRef}
          onDeletePlan={onDeletePlan}
          onEditPlan={onEditPlan}
          onOpenPlanComposer={onOpenPlanComposer}
          onOpenPlanDetails={() => setDetailsOpen(true)}
          onSelectPlan={onSelectPlan}
          onCalendarSelectDate={(dateValue) => {
            const date = dateFromValue(dateValue)
            setTrainingDateState({
              planId: activePlanKey,
              selectedDate: dateValue,
              weekStart: startOfWeek(date),
            })
            setCalendarVisibleDate(date)
            setCalendarOpen(true)
          }}
          onCalendarVisibleDateChange={setCalendarVisibleDate}
          onSelectDate={(dateValue) => {
            setTrainingDateState((current) => ({
              ...current,
              selectedDate: dateValue,
            }))
          }}
          onToggleCalendar={handleToggleCalendar}
          onToggleMoreMenu={handleToggleMoreMenu}
          onWeekBackward={() => {
            setTrainingDateState((current) => {
              const nextSelectedDate = localDateValue(addDays(dateFromValue(current.selectedDate), -7))
              return {
                ...current,
                selectedDate: nextSelectedDate,
                weekStart: addDays(current.weekStart, -7),
              }
            })
          }}
          onWeekForward={() => {
            setTrainingDateState((current) => {
              const nextSelectedDate = localDateValue(addDays(dateFromValue(current.selectedDate), 7))
              return {
                ...current,
                selectedDate: nextSelectedDate,
                weekStart: addDays(current.weekStart, 7),
              }
            })
          }}
          selectedDate={selectedDate}
          trainingPlans={trainingPlans}
          weekStart={weekStart}
          weekRangeLabel={formatWeekRange(weekStart)}
          workoutLogs={workoutLogs}
          trainingDays={trainingDays}
        />

        <TrainingPlanDetailDialog
          onOpenChange={setDetailsOpen}
          open={detailsOpen}
          plan={activePlan}
        />

        <TrainingConsistencyGrid
          activePlanId={activePlan?.id ?? null}
          workoutLogs={workoutLogs}
        />

        <p className="mt-6 text-center text-[12px] text-muted-foreground">
          计划会根据您的训练反馈和身体状态自动优化。
        </p>
      </section>
    </main>
  )
}
function getInitialTrainingDate(plan: TrainingPlan | null) {
  if (isDailyTrainingPlan(plan) && plan?.start_date) {
    return dateFromValue(plan.start_date)
  }
  return new Date()
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

function DetailBlock({
  label,
  value,
}: {
  label: string
  large?: boolean
  value: string
}) {
  const displayValue = value.trim() || "未填写"

  return (
    <Field>
      <FieldContent>
        <FieldLabel>
          {label}
        </FieldLabel>
        <FieldDescription className="whitespace-pre-wrap text-sm leading-6">
          {displayValue}
        </FieldDescription>
      </FieldContent>
    </Field>
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


function formatWeekRange(weekStart: Date) {
  const weekEnd = addDays(weekStart, 6)
  return `${weekStart.getMonth() + 1}.${weekStart.getDate()} - ${weekEnd.getMonth() + 1}.${weekEnd.getDate()}`
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

function formatMinutes(totalSeconds: number) {
  const minutes = Math.round(totalSeconds / 60)
  return `${minutes} min`
}

function formatHours(totalSeconds: number) {
  return `${(totalSeconds / 3600).toFixed(1)} 小时`
}

function buildPlanStageLabel(plan: TrainingPlan | null, weekStart: Date) {
  if (!plan?.start_date) {
    return `本周 ${formatWeekRange(weekStart)}`
  }

  const start = startOfWeek(dateFromValue(plan.start_date))
  const diffDays = Math.max(
    0,
    Math.floor((weekStart.getTime() - start.getTime()) / 86_400_000)
  )
  const weekNumber = Math.floor(diffDays / 7) + 1

  return `第 ${weekNumber} 周 · ${planStatusLabel(plan.status)}`
}

function calculateTrainingStreak(logs: WorkoutLog[], planId: number | null) {
  let streak = 0
  let cursor = startOfWeek(new Date())
  cursor = addDays(cursor, getMondayFirstDayIndex(new Date()))

  while (streak < 365) {
    const value = localDateValue(cursor)
    const trained = logs.some(
      (log) =>
        log.training_plan_id === planId &&
        log.workout_date === value &&
        log.completed
    )

    if (!trained) {
      break
    }

    streak += 1
    cursor = addDays(cursor, -1)
  }

  return streak
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
  const weightSeries = getMetricSeries(bodyMetrics, "weight_kg")
  const bodyFatSeries = getMetricSeries(bodyMetrics, "body_fat_percentage")
  const muscleSeries = getMetricSeries(bodyMetrics, "skeletal_muscle_mass_kg")
  const bodyCompositionSeries = getBodyCompositionSeries(bodyMetrics)
  const weight = latestMetric?.weight_kg ?? null
  const bodyFat = latestMetric?.body_fat_percentage ?? null
  const muscle = latestMetric?.skeletal_muscle_mass_kg ?? null
  const bmi = latestMetric?.bmi ?? calculateBmi(latestMetric)
  const age = profile?.age ?? null
  const targetWeight = latestMetric?.target_weight_kg ?? null
  const bmr = calculateBmr(profile, latestMetric)
  const dateRange = formatMetricDateRange(bodyMetrics)
  const weightChange = formatMetricChange(weightSeries, "kg")
  const bodyFatChange = formatMetricChange(bodyFatSeries, "%")
  const muscleChange = formatMetricChange(muscleSeries, "kg")
  const weightProgress = calculateTargetProgress(weightSeries[0]?.value ?? null, weight, targetWeight)

  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-card">
      <div className="grid min-h-full grid-cols-1 gap-8 px-8 py-8 xl:grid-cols-[minmax(0,1fr)_330px] xl:px-10">
        <section className="min-w-0">
          <PageHeader
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
            {["概览", "体成分", "围度", "力量表现", "心肺健康", "体能测试", "健康指标"].map((tab, index) => (
              <button className={cn("pb-3 font-semibold", index === 0 ? "border-b-2 border-primary text-foreground" : "text-muted-foreground")} key={tab}>
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3 2xl:grid-cols-5">
            <MetricTrendCard title="体重" value={formatMetricValue(weight)} unit="kg" change={weightChange} chart={chartVariantFromChange(weightSeries, "down")} />
            <MetricTrendCard title="体脂率" value={formatMetricValue(bodyFat)} unit="%" change={bodyFatChange} chart={chartVariantFromChange(bodyFatSeries, "down2")} />
            <MetricTrendCard title="肌肉量" value={formatMetricValue(muscle)} unit="kg" change={muscleChange} chart={chartVariantFromChange(muscleSeries, "up")} />
            <MetricTrendCard title="基础代谢率" value={bmr ? bmr.toString() : "待补充"} unit="kcal" change="由画像估算" chart="up2" />
            <MetricTrendCard title="身体评分" value="待评估" unit="/100" change="需要评分规则" chart="up" />
          </div>

          <section className="mt-5 rounded-[12px] border border-border bg-card p-5">
            <div className="grid gap-5 lg:grid-cols-[1fr_125px]">
              <div>
                <ChartHeader title="体重趋势" subtitle="最近 30 天 · 单位：kg" />
                <LineChart height={230} series={weightSeries} unit="kg" />
              </div>
              <ChartSideStat
                value={formatMetricWithUnit(weight, "kg")}
                label="当前体重"
                delta={weightChange}
                target={formatMetricWithUnit(targetWeight, "kg", "待设置")}
                progress={weightProgress}
                recordedAt={latestMetric?.recorded_at}
              />
            </div>
          </section>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <section className="rounded-[12px] border border-border bg-card p-5">
              <ChartHeader title="体成分变化" subtitle="最近 30 天" />
              <AreaStackChart series={bodyCompositionSeries} />
            </section>
            <section className="rounded-[12px] border border-border bg-card p-5">
              <div className="grid gap-5 lg:grid-cols-[1fr_125px]">
                <div>
                  <ChartHeader title="体脂率趋势" subtitle="最近 30 天 · 单位：%" />
                  <LineChart height={180} series={bodyFatSeries} unit="%" />
                </div>
                <ChartSideStat
                  value={formatMetricWithUnit(bodyFat, "%")}
                  label="当前体脂率"
                  delta={bodyFatChange}
                  target="待设置"
                  recordedAt={latestMetric?.recorded_at}
                />
              </div>
            </section>
          </div>
          <p className="mt-6 text-center text-[12px] text-muted-foreground">* 所有数据基于您的录入与设备监测量，如有误差请以实际情况为准。</p>
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
    <main className="min-h-0 flex-1 overflow-y-auto bg-card px-10 py-8">
      <PageHeader title="评估平台" subtitle="综合评估已接入外部平台。" />
      <section className="mt-8 rounded-[12px] border border-border p-8">
        <BarChart3 className="size-6 text-foreground" />
        <h2 className="mt-4 text-[20px] font-black">打开综合评估</h2>
        <p className="mt-2 text-[14px] leading-7 text-muted-foreground">
          点击下方按钮会在外部页面打开评估平台。
        </p>
        <a
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-[8px] bg-primary px-4 text-[13px] font-bold text-primary-foreground hover:bg-primary/90"
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

function PageHeader({ title }: { actions?: ReactNode; subtitle?: string; title: string }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-[28px] leading-tight font-black tracking-[-0.05em]">{title}</h1>
      </div>
    </header>
  )
}

type TrainingDay = ReturnType<typeof buildTrainingDays>[number]

function TrainingStatsBar({
  completedSessions,
  planTitle,
  planTotalProgress,
  planTotalSeconds,
  stageLabel,
  streakDays,
  totalSessions,
  weekCalories,
  weekProgress,
  weekSeconds,
}: {
  completedSessions: number
  planTitle: string
  planTotalProgress: number
  planTotalSeconds: number
  stageLabel: string
  streakDays: number
  totalSessions: number
  weekCalories: number
  weekProgress: number
  weekSeconds: number
}) {
  const stats = [
    {
      icon: CalendarIcon,
      label: "当前计划",
      sub: stageLabel,
      value: planTitle,
    },
    {
      icon: SlidersHorizontal,
      label: "本周进度",
      sub: `${weekProgress}% 完成`,
      value: `${completedSessions} / ${totalSessions || 0} 次`,
    },
    {
      icon: Timer,
      label: "本周训练时长",
      sub: `总累计 ${formatHours(planTotalSeconds)}`,
      value: formatMinutes(weekSeconds),
    },
    {
      icon: Flame,
      label: "本周消耗",
      sub: "来自训练记录",
      value: `${weekCalories} kcal`,
    },
    {
      icon: Trophy,
      label: "连续训练",
      sub: `计划总进度 ${planTotalProgress}%`,
      value: `${streakDays} 天`,
    },
  ]

  return (
    <section className="mt-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {stats.map(({ icon: Icon, label, value }, index) => (
          <div
            className={cn(
              "flex min-w-0 items-center gap-3 xl:border-r xl:border-border xl:pr-4",
              index === stats.length - 1 && "xl:border-r-0 xl:pr-0"
            )}
            key={label}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-[12px] text-foreground">
              <Icon className="size-8" />
            </span>
            <div className="min-w-0">
              <p className="text-[12px]  text-muted-foreground">{label}</p>
              <p className="truncate text-[16px] font-semibold text-foreground">{value}</p>
              {/* <p className="mt-1 truncate text-[12px] font-medium text-muted-foreground">{sub}</p> */}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function TodayTrainingHero({
  anotherTrainingActive,
  completedExercises,
  dailyProgress,
  dailySuggestion,
  dashboardLoading,
  onCompleteTrainingDay,
  onOpenPlanComposer,
  onPauseTraining,
  onResumeTraining,
  onStartTraining,
  onToggleExercise,
  planGoal,
  selectedCompletedCount,
  selectedDate,
  selectedDay,
  selectedDayCompleted,
  selectedDisplayActions,
  selectedDisplayTitle,
  selectedTotalSeconds,
  selectedTrainingActive,
  trainingElapsedSeconds,
  trainingPaused,
}: {
  anotherTrainingActive: boolean
  completedExercises: string[]
  dailyProgress: number
  dailySuggestion: string
  dashboardLoading: boolean
  onCompleteTrainingDay: TrainingPlanPageProps["onCompleteTrainingDay"]
  onOpenPlanComposer: TrainingPlanPageProps["onOpenPlanComposer"]
  onPauseTraining: () => void
  onResumeTraining: () => void
  onStartTraining: TrainingPlanPageProps["onStartTraining"]
  onToggleExercise: (title: string) => void
  planGoal: string
  selectedCompletedCount: number
  selectedDate: string
  selectedDay: TrainingDay | null
  selectedDayCompleted: boolean
  selectedDisplayActions: { id: string; title: string }[]
  selectedDisplayTitle: string
  selectedTotalSeconds: number
  selectedTrainingActive: boolean
  trainingElapsedSeconds: number
  trainingPaused: boolean
}) {
  const hasTraining = Boolean(selectedDay)
  const actionTotal = selectedDay?.actions.length ?? selectedDisplayActions.length
  const selectedDateLabel = selectedDay
    ? formatDateLabel(selectedDay.date)
    : formatDateLabel(dateFromValue(selectedDate))

  return (
    <section className="mt-4 overflow-hidden rounded-3xl bg-foreground text-primary-foreground ">
      <div className="grid min-h-82.5 gap-8 p-6 lg:grid-cols-[minmax(0,1fr)_minmax(420px,1.5fr)] lg:p-6">
        <div className="flex min-w-0 flex-col justify-between">
          <div>
            <p className="text-[13px] text-primary-foreground/70">
              {hasTraining ? `${selectedDateLabel} · 今日训练` : `${selectedDateLabel} · 恢复日`}
            </p>
            <h2 className="mt-0 max-w-160 text-[34px] leading-tight font-black tracking-[-0.05em] sm:text-[40px]">
              {hasTraining ? selectedDisplayTitle : "今天没有安排训练"}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-4 text-[13px] text-primary-foreground/74">
              <span className="inline-flex items-center gap-1">
                <Timer className="size-4" />
                {formatDurationShort(selectedTotalSeconds)}
              </span>
              <span className="inline-flex items-center gap-2">
                <BarChart3 className="size-4" />
                {hasTraining ? `${selectedCompletedCount}/${actionTotal} 动作` : "适合恢复和复盘"}
              </span>
              <span className="inline-flex items-center gap-2">
                <Target className="size-4" />
                {hasTraining ? `${dailyProgress}% 完成` : "维持节奏"}
              </span>
            </div>
            <div className="mt-6 max-w-162.5">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-primary-foreground">
                <WandSparkles className="size-4" />
                Kratos 建议
              </div>
              <p className="mt-1 text-[13px] leading-5 text-primary-foreground/76">
                {hasTraining ? dailySuggestion : planGoal}
              </p>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            {hasTraining ? (
              <Button
                className={cn(
                  "h-12 rounded-[12px] px-6 text-[14px] font-black",
                  selectedTrainingActive
                    ? "bg-card text-foreground hover:bg-card/90"
                    : "bg-card text-foreground hover:bg-card/90"
                )}
                disabled={dashboardLoading || anotherTrainingActive}
                onClick={() => {
                  if (!selectedDay) {
                    return
                  }

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
              >
                <Play className="size-4 fill-current" />
                {selectedTrainingActive
                  ? "结束并保存"
                  : anotherTrainingActive
                    ? "其他训练进行中"
                    : selectedDayCompleted
                      ? "再次训练"
                      : "开始今日训练"}
              </Button>
            ) : (
              <Button
                className="h-12 rounded-[12px] bg-card px-6 text-[14px] font-black text-foreground hover:bg-card/90"
                onClick={() => onOpenPlanComposer(null)}
                type="button"
              >
                <PlusCircle className="size-4" />
                调整训练计划
              </Button>
            )}
            {selectedTrainingActive ? (
              <Button
                className="h-12 rounded-[12px] border-primary-foreground/20 bg-transparent px-5 text-[14px] font-black text-primary-foreground hover:bg-card/10"
                onClick={trainingPaused ? onResumeTraining : onPauseTraining}
                type="button"
                variant="outline"
              >
                {trainingPaused ? "继续训练" : "暂停训练"}
              </Button>
            ) : null}
            {selectedTrainingActive ? (
              <span className="rounded-full border border-primary-foreground/10 bg-card/6 px-4 py-2 text-[13px] text-primary-foreground/82">
                {trainingPaused ? "已暂停" : "计时中"} {formatTimer(trainingElapsedSeconds)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="min-w-0 overflow-hidden">
          {hasTraining ? (
            <div className="scrollbar-none flex h-full min-h-65 gap-3 overflow-x-auto overflow-y-hidden pr-1 snap-x snap-mandatory">
              {selectedDisplayActions.map((action) => {
                const completed =
                  selectedTrainingActive
                    ? completedExercises.includes(action.id)
                    : selectedDayCompleted || completedExercises.includes(action.id)
                const actionPosition = selectedDisplayActions.findIndex(
                  (item) => item.id === action.id
                ) + 1
                const statusLabel = completed
                  ? "已完成"
                  : selectedTrainingActive
                    ? trainingPaused
                      ? "已暂停"
                      : "进行中"
                    : "待开始"

                return (
                  <button
                    className={cn(
                      "group flex h-full min-h-65 w-[min(76vw,280px)] shrink-0 snap-start flex-col justify-between rounded-[16px] border p-0 text-left transition sm:w-70 xl:w-70 overflow-hidden",
                      completed
                        ? "border-primary-foreground/35 bg-card text-foreground"
                        : "border-primary-foreground/10 bg-card/8 hover:bg-card/13",
                      (!selectedTrainingActive || trainingPaused) && "cursor-default"
                    )}
                    disabled={!selectedTrainingActive || trainingPaused}
                    key={action.id}
                    onClick={() => onToggleExercise(action.id)}
                    type="button"
                  >
                    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-linear-to-br from-background/12 via-primary-foreground/6 to-transparent">
                      <div className="px-4 py-2 text-[13px] font-semibold text-primary-foreground/45">
                        动作预览图片
                      </div>

                      {!completed && (
                        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
                      )}

                      <div className="absolute left-4 top-4 grid size-9 place-items-center rounded-full bg-black/45 text-[13px] font-black text-primary-foreground backdrop-blur-md">
                        {completed ? <Check className="size-4" /> : actionPosition}
                      </div>

                      <span className="absolute right-4 top-4 rounded-full bg-black/45 px-3 py-1 text-[12px] font-bold text-primary-foreground/72 backdrop-blur-md">
                        {statusLabel}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col justify-between p-5">
                      <div>
                        <h3
                          className={cn(
                            "line-clamp-2 text-[17px] font-semibold leading-6",
                            completed ? "text-foreground" : "text-primary-foreground"
                          )}
                        >
                          {action.title}
                        </h3>

                        <p className={cn("mt-0 text-[13px]", completed ? "text-muted-foreground" : "text-primary-foreground/46")}>
                          动作 {actionPosition} / {actionTotal}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="flex min-h-65 flex-col items-center justify-center rounded-[16px] border border-dashed border-primary-foreground/15 bg-card/6 p-8 text-center">
              <CalendarIcon className="size-8 text-primary-foreground/70" />
              <h3 className="mt-4 text-[22px] font-black">恢复、散步或记录身体反馈</h3>
              <p className="mt-3 max-w-105 text-[14px] leading-5 text-primary-foreground/62">
                这一天没有匹配到当前计划里的训练日。您可以切换周安排，或让 Kratos 重新规划训练节奏。
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function WeeklyTrainingTimeline({
  activePlan,
  activePlanId,
  calendarMenuRef,
  calendarOpen,
  calendarVisibleDate,
  completedDateSet,
  completedExercises,
  moreMenuOpen,
  moreMenuRef,
  onCalendarSelectDate,
  onCalendarVisibleDateChange,
  onDeletePlan,
  onEditPlan,
  onOpenPlanComposer,
  onOpenPlanDetails,
  onSelectDate,
  onSelectPlan,
  onToggleCalendar,
  onToggleMoreMenu,
  onWeekBackward,
  onWeekForward,
  selectedDate,
  trainingDays,
  trainingPlans,
  weekRangeLabel,
  weekStart,
  workoutLogs,
}: {
  activePlan: TrainingPlan | null
  activePlanId: number | null
  calendarMenuRef: { current: HTMLDivElement | null }
  calendarOpen: boolean
  calendarVisibleDate: Date
  completedDateSet: Set<string>
  completedExercises: string[]
  moreMenuOpen: boolean
  moreMenuRef: { current: HTMLDivElement | null }
  onCalendarSelectDate: (dateValue: string) => void
  onCalendarVisibleDateChange: (date: Date) => void
  onDeletePlan: (plan: TrainingPlan) => void
  onEditPlan: (plan: TrainingPlan) => void
  onOpenPlanComposer: TrainingPlanPageProps["onOpenPlanComposer"]
  onOpenPlanDetails: () => void
  onSelectDate: (dateValue: string) => void
  onSelectPlan: (plan: TrainingPlan) => void
  onToggleCalendar: () => void
  onToggleMoreMenu: () => void
  onWeekBackward: () => void
  onWeekForward: () => void
  selectedDate: string
  trainingDays: TrainingDay[]
  trainingPlans: TrainingPlan[]
  weekRangeLabel: string
  weekStart: Date
  workoutLogs: WorkoutLog[]
}) {
  const days = buildWeekDays(weekStart)

  return (
    <section className="mt-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">本周训练安排</h2>
          {/* <p className="mt-0 text-[12px] text-muted-foreground">{weekRangeLabel}</p> */}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Popover open={calendarOpen} onOpenChange={onToggleCalendar}>
            <PopoverTrigger asChild>
              <Button
                className="h-8"
                type="button"
                variant="outline"
              >
                <CalendarIcon className="size-4" />
                {weekRangeLabel}
                <ChevronRight className="size-4 rotate-90" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-auto p-0"
              ref={calendarMenuRef}
              sideOffset={12}
            >
              <TrainingCalendar
                completedDateSet={completedDateSet}
                onClose={onToggleCalendar}
                onSelectDate={onCalendarSelectDate}
                onVisibleDateChange={onCalendarVisibleDateChange}
                selectedDate={selectedDate}
                visibleDate={calendarVisibleDate}
              />
            </PopoverContent>
          </Popover>

          <ButtonGroup>
            <Button
              aria-label="上一周"
              className="size-8"
              onClick={onWeekBackward}
              type="button"
              variant="outline"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              aria-label="下一周"
              className="size-8"
              onClick={onWeekForward}
              type="button"
              variant="outline"
            >
              <ChevronRight className="size-4" />
            </Button>
          </ButtonGroup>

          <Button
            className="h-8"
            onClick={onOpenPlanDetails}
            type="button"
            variant="outline"
          >
            计划详情
            <ChevronRight className="size-3.5" />
          </Button>

          <Popover open={moreMenuOpen} onOpenChange={onToggleMoreMenu}>
            <PopoverTrigger asChild>
              <Button
                className="h-8"
                type="button"
              >
                <SlidersHorizontal className="size-3.5" />
                计划管理
                <ChevronRight className="size-4 rotate-90" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="max-h-xl w-xl overflow-y-auto rounded-[18px] p-4"
              ref={moreMenuRef}
              sideOffset={12}
            >
              <MoreTrainingMenu
                onClose={onToggleMoreMenu}
                onDeletePlan={onDeletePlan}
                onEditPlan={onEditPlan}
                onOpenPlanComposer={onOpenPlanComposer}
                onSelectPlan={onSelectPlan}
                plan={activePlan}
                plans={trainingPlans}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {trainingDays.length > 0 ? (
        <div className="relative mt-4 grid gap-3 lg:grid-cols-7">
          <div className="absolute left-[7%] right-[7%] top-25 hidden border-t border-dashed border-border lg:block" />
          {days.map((day) => {
            const trainingDay = trainingDays.find((item) => item.dateValue === day.value) ?? null
            const dayLog = getLatestWorkoutForDate(workoutLogs, activePlanId, day.value)
            const loggedActions = dayLog ? parseWorkoutActionsFromNotes(dayLog.notes) : []
            const completed = completedDateSet.has(day.value)
            const selected = selectedDate === day.value
            const active = trainingDay?.dateValue === selectedDate
            const completedCount =
              trainingDay?.actions.filter((action) =>
                completed || completedExercises.includes(action.id)
              ).length ?? 0
            const actionCount = trainingDay?.actions.length ?? 0
            const title = trainingDay
              ? trainingDay.title
              : "休息"
            const status = completed
              ? "已完成"
              : active
                ? "进行中"
                : trainingDay
                  ? "待完成"
                  : "休息日"

            return (
              <button
                className={cn(
                  "relative z-10 flex min-h-37.5 flex-col rounded-[14px] border bg-card p-3 text-left transition hover:border-primary hover:shadow-[0_14px_28px_rgba(17,17,17,0.06)]",
                  selected ? "border-primary shadow-[0_16px_32px_rgba(17,17,17,0.08)]" : "border-border",
                )}
                key={day.value}
                onClick={() => onSelectDate(day.value)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[12px] text-muted-foreground">{`周${day.day}`}</p>
                    <p className="mt-0 text-[20px] font-semibold">{day.label}</p>
                  </div>
                </div>
                <div className="mt-2 min-w-0 flex-1">
                  <h3 className="line-clamp-2 text-[16px] font-semibold leading-5">{title}</h3>
                  <p className="mt-2 line-clamp-3 text-[12px] leading-4 text-muted-foreground">
                    {trainingDay
                      ? completed && loggedActions.length > 0
                        ? loggedActions.join("；")
                        : `${completedCount}/${actionCount} 动作 · ${trainingDay.goal}`
                      : "恢复、拉伸或轻活动"}
                  </p>
                </div>
                <Badge
                  className="mt-8 w-fit"
                  variant={
                    completed || active
                      ? "default"
                      : trainingDay
                        ? "secondary"
                        : "outline"
                  }
                >
                  {status}
                </Badge>
              </button>
            )
          })}
        </div>
      ) : (
        <section className="mt-5 rounded-[14px] border border-dashed border-border bg-muted/40 p-8 text-center">
          <ClipboardList className="mx-auto size-7 text-muted-foreground" />
          <h2 className="mt-3 text-[17px] font-black">还没有可执行的训练安排</h2>
          <p className="mx-auto mt-2 max-w-107.5 text-[13px] leading-6 text-muted-foreground">
            选择一个常见模板，或从空白计划开始撰写。保存后会同步到后端计划接口。
          </p>
          <Button
            className="mt-4 h-10 rounded-[10px] bg-primary px-5 text-[13px] font-bold text-primary-foreground hover:bg-primary/90"
            onClick={() => onOpenPlanComposer(null)}
            type="button"
          >
            <PlusCircle className="size-4" />
            自定义计划
          </Button>
        </section>
      )}
    </section>
  )
}

function TrainingConsistencyGrid({
  activePlanId,
  workoutLogs,
}: {
  activePlanId: number | null
  workoutLogs: WorkoutLog[]
}) {
  const days = Array.from({ length: 56 }, (_, index) => {
    const date = addDays(startOfWeek(addDays(new Date(), -49)), index)
    const value = localDateValue(date)
    const seconds = sumWorkoutSecondsForDate(workoutLogs, activePlanId, value)
    const completed = workoutLogs.some(
      (log) => log.training_plan_id === activePlanId && log.workout_date === value && log.completed
    )
    const level = completed ? Math.min(4, Math.max(1, Math.ceil(seconds / 1200))) : 0

    return { date, level, value }
  })

  return (
    <section className="mt-5 rounded-[16px] border border-border bg-card p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[18px] font-black tracking-[-0.03em]">训练连续性</h2>
          <p className="mt-1 text-[12px] font-medium text-muted-foreground">
            最近 8 周 · 每一格都是一次和计划的约定
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
          <span>少</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <span
              className={cn(
                "size-3 rounded-[3px]",
                level === 0 && "bg-muted",
                level === 1 && "bg-chart-1",
                level === 2 && "bg-chart-2",
                level === 3 && "bg-chart-3",
                level === 4 && "bg-primary"
              )}
              key={level}
            />
          ))}
          <span>多</span>
        </div>
      </div>
      <div className="mt-5 grid grid-flow-col grid-rows-7 justify-start gap-1.5 overflow-x-auto pb-1">
        {days.map(({ date, level, value }) => (
          <span
            aria-label={`${formatDateLabel(date)} 训练强度 ${level}`}
            className={cn(
              "size-4 rounded-lg",
              level === 0 && "bg-muted",
              level === 1 && "bg-chart-1",
              level === 2 && "bg-chart-2",
              level === 3 && "bg-chart-3",
              level === 4 && "bg-primary"
            )}
            key={value}
            title={`${formatDateLabel(date)} · ${level > 0 ? "已训练" : "未训练"}`}
          />
        ))}
      </div>
    </section>
  )
}

function MoreTrainingMenu({
  onClose,
  onDeletePlan,
  onEditPlan,
  onOpenPlanComposer,
  onSelectPlan,
  plan,
  plans,
}: {
  onClose: () => void
  onDeletePlan: (plan: TrainingPlan) => void
  onEditPlan: (plan: TrainingPlan) => void
  onOpenPlanComposer: (draft?: TrainingPlanPayload | null) => void
  onSelectPlan: (plan: TrainingPlan) => void
  plan: TrainingPlan | null
  plans: TrainingPlan[]
}) {
  const dailyPlans = plans.filter(isDailyTrainingPlan)
  const longTermPlans = plans.filter((item) => !isDailyTrainingPlan(item))

  return (
    <div className="grid gap-5 text-foreground">
      <Card className="border-border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-[15px]">常见计划模板</CardTitle>
          <CardDescription>
            从预设模板开始，或创建一份完全自定义的训练计划。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2">
            {trainingPlanTemplates.map((template) => (
              <Button
                className="h-auto justify-start rounded-xl border-border bg-card p-3 text-left hover:border-primary hover:bg-muted/40"
                key={template.id}
                onClick={() => {
                  onClose()
                  onOpenPlanComposer(template)
                }}
                type="button"
                variant="outline"
              >
                <span className="flex min-w-0 flex-col items-start gap-2">
                  <Badge className="rounded-md" variant="secondary">
                    {template.level}
                  </Badge>
                  <span className="line-clamp-2 text-[13px] font-semibold leading-5 text-foreground">
                    {template.title}
                  </span>
                  <span className="line-clamp-2 text-[12px] leading-5 text-muted-foreground">
                    {template.summary}
                  </span>
                </span>
              </Button>
            ))}

            <Button
              className="flex min-h-37 flex-col gap-2 rounded-xl border-dashed border-border bg-transparent text-muted-foreground hover:border-primary hover:bg-muted/40 hover:text-foreground"
              onClick={() => {
                onClose()
                onOpenPlanComposer(null)
              }}
              type="button"
              variant="outline"
            >
              <PlusCircle className="size-8" strokeWidth={1.4} />
              <span className="text-[13px] font-semibold">新建空白计划</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-[15px]">计划库</CardTitle>
              <CardDescription>
                管理已保存的长期计划与每日训练安排。
              </CardDescription>
            </div>
            <Badge variant="outline">{plans.length} 个计划</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {plans.length > 0 ? (
            <div className="grid gap-4">
              <SavedPlanGroup
                emptyText="暂无长期计划。适合保存周期训练、周计划和阶段目标。"
                onDeletePlan={onDeletePlan}
                onEditPlan={onEditPlan}
                onSelectPlan={(nextPlan) => {
                  onClose()
                  onSelectPlan(nextPlan)
                }}
                plans={longTermPlans}
                selectedPlanId={plan?.id ?? null}
                title="长期计划"
              />
              <SavedPlanGroup
                emptyText="暂无每日计划。聊天生成的当日训练会放在这里。"
                onDeletePlan={onDeletePlan}
                onEditPlan={onEditPlan}
                onSelectPlan={(nextPlan) => {
                  onClose()
                  onSelectPlan(nextPlan)
                }}
                plans={dailyPlans}
                selectedPlanId={plan?.id ?? null}
                title="每日计划"
              />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted/40 p-4 text-[12px] leading-5 text-muted-foreground">
              从模板或空白计划保存后，这里会显示计划列表。
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function TrainingPlanDetailDialog({
  onOpenChange,
  open,
  plan,
}: {
  onOpenChange: (open: boolean) => void
  open: boolean
  plan: TrainingPlan | null
}) {
  if (!plan) {
    return (
      <section className="grid min-h-70 place-items-center rounded-[16px] border border-dashed border-border bg-muted/40 p-8 text-center">
        <div>
          <ClipboardList className="mx-auto size-7 text-muted-foreground" />
          <h2 className="mt-3 text-[17px] font-black">暂无计划详情</h2>
          <p className="mx-auto mt-2 max-w-107.5 text-[13px] leading-5 text-muted-foreground">
            创建或选择一个训练计划后，这里会展示完整内容。
          </p>
        </div>
      </section>
    )
  }
  return (
    <Dialog onOpenChange={onOpenChange} open={open} >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {plan.title}
          </DialogTitle>
          <DialogDescription>
            计划详情
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <DetailBlock label="目标" value={plan.goal ?? "未设置"} />
          <DetailBlock label="周期" value={`${plan.start_date ?? "未设置"} - ${plan.end_date ?? "未设置"}`} />
        </div>
        <div className="grid gap-3">
          <DetailBlock label="摘要" value={plan.summary ?? "暂无摘要"} />
          <DetailBlock label="周训练安排" value={plan.weekly_schedule ?? "未填写"} large />
          <DetailBlock label="恢复建议" value={plan.recovery_guidance ?? "未填写"} large />
          <DetailBlock label="营养建议" value={plan.nutrition_guidance ?? "未填写"} large />
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">关闭</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


function TrainingCalendar({
  completedDateSet,
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
  const completedDates = useMemo(
    () => Array.from(completedDateSet).map(dateFromValue),
    [completedDateSet]
  )

  return (
    <Calendar
      className="rounded-lg border"
      mode="single"
      modifiers={{
        completed: completedDates,
      }}
      modifiersClassNames={{
        completed:
          "after:absolute after:right-2.75 after:top-6 after:size-1 after:rounded-full after:bg-primary",
      }}
      month={visibleDate}
      onMonthChange={onVisibleDateChange}
      onSelect={(date) => {
        if (!date) {
          return
        }
        onSelectDate(localDateValue(date))
      }}
      selected={dateFromValue(selectedDate)}
      captionLayout="dropdown"
    />
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
    <section className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[12px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          {title}
        </h3>
        <Badge variant="secondary">{plans.length}</Badge>
      </div>

      {plans.length > 0 ? (
        <div className="grid gap-2">
          {plans.map((item) => {
            const selected = item.id === selectedPlanId

            return (
              <Card
                className={cn(
                  "border-border bg-card shadow-none transition-colors hover:bg-muted/30",
                  selected && "border-primary"
                )}
                key={item.id}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Button
                      className="min-w-0 flex-1 justify-start p-0 text-left hover:bg-transparent"
                      onClick={() => onSelectPlan(item)}
                      type="button"
                      variant="ghost"
                    >
                      <span className="flex min-w-0 flex-col items-start">
                        <span className="flex w-full min-w-0 items-center gap-2">
                          <span className="truncate text-[14px] font-semibold text-foreground">
                            {item.title}
                          </span>
                          {selected ? (
                            <Badge className="shrink-0" variant="default">
                              当前
                            </Badge>
                          ) : null}
                        </span>
                        <span className="mt-2 flex flex-wrap gap-2">
                          <Badge variant="secondary">{planStatusLabel(item.status)}</Badge>
                          {item.goal ? <Badge variant="outline">{item.goal}</Badge> : null}
                        </span>
                        <span className="mt-3 line-clamp-2 text-[12px] leading-5 text-muted-foreground">
                          {item.summary ?? item.weekly_schedule ?? "这份计划已保存到后端 plans 表。"}
                        </span>
                        <span className="mt-2 text-[12px] text-muted-foreground">
                          {selected
                            ? "当前计划"
                            : item.start_date
                              ? `点击设为当前 · 开始：${item.start_date}`
                              : "点击设为当前 · 未设置开始日期"}
                        </span>
                      </span>
                    </Button>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button
                        aria-label={`编辑 ${item.title}`}
                        className="size-8"
                        onClick={() => onEditPlan(item)}
                        size="icon"
                        type="button"
                        variant="outline"
                      >
                        <PencilLine className="size-3.5" />
                      </Button>
                      <Button
                        aria-label={`删除 ${item.title}`}
                        className="size-8"
                        onClick={() => onDeletePlan(item)}
                        size="icon"
                        type="button"
                        variant="outline"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                      <Button
                        aria-label={`选择 ${item.title}`}
                        className="size-8"
                        onClick={() => onSelectPlan(item)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        {selected ? (
                          <Check className="size-4" />
                        ) : (
                          <ChevronRight className="size-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/40 p-3 text-[12px] leading-5 text-muted-foreground">
          {emptyText}
        </div>
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

function BodyRightRail({ age, bmi, bodyFat, latestMetric, muscle, onEditBodyData, onboarding, workoutLogs }: { age: number | null; bmi: number | null; bodyFat: number | null; latestCheckin: AgentCheckin | null; latestMetric: BodyMetric | null; muscle: number | null; onEditBodyData: () => void; onboarding: OnboardingStatus | null; workoutLogs: WorkoutLog[] }) {
  return (
    <aside className="space-y-6">
      <RailHeader title="身体概览" action="更多数据" />
      <section className="rounded-[12px] border border-border bg-card p-5">
        <div className="grid grid-cols-2 gap-y-5">
          <BodyOverviewCell label="BMI" value={formatMetricValue(bmi)} sub={bmi ? getBmiLevel(bmi) : "暂无记录"} />
          <BodyOverviewCell label="体脂等级" value={bodyFat ? getBodyFatLevel(bodyFat) : "暂无记录"} sub={formatMetricWithUnit(bodyFat, "%")} bordered />
          <BodyOverviewCell label="内脏脂肪等级" value="待补充" sub="后端暂无字段" />
          <BodyOverviewCell label="骨骼肌量" value={formatMetricWithUnit(muscle, "kg")} sub={muscle ? "已记录" : "暂无记录"} bordered />
        </div>
      </section>
      <section className="rounded-[12px] border border-border bg-card p-5">
        <div className="grid grid-cols-2">
          <BodyOverviewCell label="画像年龄" value={age ? `${age} 岁` : "暂无记录"} sub="" />
          <BodyOverviewCell label="身体年龄" value="待评估" sub="需要评估规则" bordered small />
        </div>
      </section>
      <section className="rounded-[12px] border border-border bg-card p-5">
        <RailHeader title="数据录入" action="查看记录" compact />
        <div className="mt-3 divide-y divide-border">
          {[
            [ClipboardList, "训练记录", workoutLogs[0]?.workout_date?.slice(5).replace("-", ".") ?? "05.14"],
            [Utensils, "饮食记录", "05.14"],
            [Scale, "身体测量", latestMetric?.recorded_at?.slice(5, 10).replace("-", ".") ?? "05.13"],
            [Gauge, "体能测试", "05.10"],
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
        <p className="mt-1 text-[12px] text-muted-foreground">基于近 30 天数据</p>
        <div className="mt-5 rounded-[12px] border border-border p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-6 place-items-center rounded-full border border-primary"><Check className="size-3.5" /></span>
            <h4 className="text-[14px] font-black">身体状态良好</h4>
          </div>
          <p className="mt-3 text-[12px] leading-6 text-muted-foreground">
            {onboarding?.next_steps?.[0] ?? "体重、体脂率呈下降趋势，肌肉量稳步提升，继续保持当前的训练和饮食计划。"}
          </p>
          <button className="mt-4 h-8 rounded-[8px] border border-border px-3 text-[12px] font-bold">查看建议</button>
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

function getMetricSeries(metrics: BodyMetric[], key: keyof Pick<BodyMetric, "body_fat_percentage" | "skeletal_muscle_mass_kg" | "weight_kg">): MetricPoint[] {
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