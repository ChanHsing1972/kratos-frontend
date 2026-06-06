import {
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  Play,
  RotateCcw,
  Save,
  Ban,
  PencilLine,
  PlusCircle,
  Trash2,
  Pause,
  MoreHorizontal,
  List,
  CircleAlert,
  ArrowUp,
  HeartPulse,
} from "lucide-react"
import { Fragment, useEffect, useMemo, useRef, useState } from "react"

import { Button } from "@/shared/ui/button"
import { Spinner } from "@/shared/ui/spinner"
import { Calendar } from "@/shared/ui/calendar"
import { Badge } from "@/shared/ui/badge"
import { CardContent } from "@/shared/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/shared/ui/carousel"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/shared/ui/dialog"

import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import {
  proxiedBilibiliImageUrl,
} from "@/entities/kratos/api/client"
import {
  getPlanExerciseLines,
  trainingPlanTemplates,
} from "@/entities/kratos/lib/domain"
import { cn } from "@/shared/lib/utils"
import type {
  AgentCheckin,
  HeartRateSummary,
  TrainingExerciseMedia,
  TrainingPlan,
  TrainingPlanAdjustmentResponse,
  TrainingPlanPayload,
  WorkoutLog,
} from "@/entities/kratos/model/types"
import type { LiveHeartRateState } from "@/shared/hooks/useLiveHeartRate"
import { ActionImage } from "@/shared/ui/ActionImage"
import { ButtonGroup } from "@/shared/ui/button-group"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/shared/ui/input-group"

type TrainingPlanPageProps = {
  activePlan: TrainingPlan | null
  latestCheckin: AgentCheckin | null
  completedExercises: string[]
  dashboardLoading: boolean
  guidanceError: string | null
  guidanceLoading: boolean
  guidanceMessage: string
  postTrainingAdjustment: TrainingPlanAdjustmentResponse | null
  postTrainingFeedback: string
  postTrainingFeedbackError: string | null
  postTrainingFeedbackLoading: boolean
  postTrainingFeedbackVisible: boolean
  postTrainingHeartRateSummary: HeartRateSummary | null
  liveHeartRate: LiveHeartRateState
  onDeletePlan: (plan: TrainingPlan) => void
  onEditPlan: (plan: TrainingPlan) => void
  onApplyPostTrainingAdjustment: () => void
  onPostTrainingFeedbackChange: (value: string) => void
  onPreviewPostTrainingAdjustment: () => void
  onOpenPlanComposer: (draft?: TrainingPlanPayload | null) => void
  onSelectPlan: (plan: TrainingPlan) => void
  onToggleExercise: (title: string) => void
  onStartTraining: (
    dayTitle: string,
    workoutDate: string,
    actionTitles: string[],
    actionIds: string[]
  ) => void
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

type TrainingDayAction = {
  completed?: boolean
  id: string
  media?: TrainingExerciseMedia | null
  notes?: string | null
  restSeconds?: number | null
  targetReps?: string | null
  targetRpe?: number | null
  targetSets?: number | null
  targetWeightKg?: number | null
  title: string
}

type TrainingDay = {
  actions: TrainingDayAction[]
  date: Date
  dateValue: string
  day: string
  goal: string
  id: string
  title: string
}

export function TrainingPlanPage({
  activePlan,
  latestCheckin,
  completedExercises,
  dashboardLoading,
  guidanceError,
  guidanceLoading,
  guidanceMessage,
  postTrainingAdjustment,
  postTrainingFeedback,
  postTrainingFeedbackError,
  postTrainingFeedbackLoading,
  postTrainingFeedbackVisible,
  postTrainingHeartRateSummary,
  liveHeartRate,
  onDeletePlan,
  onEditPlan,
  onApplyPostTrainingAdjustment,
  onPostTrainingFeedbackChange,
  onPreviewPostTrainingAdjustment,
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
  const [detailsOpen, setDetailsOpen] = useState(false)
  const calendarMenuRef = useRef<HTMLDivElement | null>(null)
  const dailyPlan = isDailyTrainingPlan(activePlan)
  const trainingDays = useMemo(
    () => buildTrainingDays(activePlan, weekStart),
    [activePlan, weekStart]
  )
  const selectedDay =
    trainingDays.find((day) => day.dateValue === selectedDate) ?? null
  const completedDateSet = useMemo(
    () => buildCompletedDateSet(workoutLogs, activePlan?.id ?? null),
    [activePlan?.id, workoutLogs]
  )
  const selectedDayCompleted = selectedDay
    ? completedDateSet.has(selectedDay.dateValue)
    : false
  const selectedTrainingActive =
    trainingStarted && selectedDay
      ? trainingSessionDate === selectedDay.dateValue
      : false
  const anotherTrainingActive =
    trainingStarted && selectedDay
      ? trainingSessionDate !== selectedDay.dateValue
      : false
  const selectedWorkoutLog = getLatestWorkoutForDate(
    workoutLogs,
    activePlan?.id ?? null,
    selectedDate
  )
  const selectedWorkoutCompletedTitles = selectedWorkoutLog
    ? parseWorkoutActionsFromNotes(selectedWorkoutLog.notes)
    : []
  const selectedDisplayActions =
    selectedDay?.actions.map((action) => {
      const completed = selectedTrainingActive
        ? completedExercises.includes(action.id)
        : selectedDayCompleted ||
        selectedWorkoutCompletedTitles.includes(action.title)

      return {
        ...action,
        completed,
      }
    }) ?? []
  const selectedCompletedCount = selectedDisplayActions.filter(
    (action) => action.completed
  ).length
  const selectedDisplayTitle =
    !selectedTrainingActive && selectedWorkoutLog?.title
      ? selectedWorkoutLog.title
      : selectedDay
        ? `${selectedDay.day} - ${selectedDay.title}`
        : ""
  const [calendarVisibleDate, setCalendarVisibleDate] = useState(
    () => new Date()
  )
  const completedPlanSessions = trainingDays.filter((day) =>
    completedDateSet.has(day.dateValue)
  ).length
  const weekProgress = trainingDays.length
    ? Math.min(
      100,
      Math.round((completedPlanSessions / trainingDays.length) * 100)
    )
    : 0
  const dailyProgress = selectedDay
    ? selectedDayCompleted
      ? 100
      : Math.min(
        100,
        Math.round(
          (selectedCompletedCount / Math.max(selectedDay.actions.length, 1)) *
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
  const dailySuggestion = buildDailySuggestion(activePlan, workoutLogs, latestCheckin)
  const trainingStreak = calculateTrainingStreak(
    workoutLogs,
    activePlan?.id ?? null
  )
  const handleToggleCalendar = () => {
    setCalendarVisibleDate(dateFromValue(selectedDate))
    setCalendarOpen((current) => !current)
  }

  useEffect(() => {
    if (!calendarOpen) {
      return undefined
    }

    const closeMenus = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (target && calendarMenuRef.current?.contains(target)) {
        return
      }
      setCalendarOpen(false)
    }

    document.addEventListener("pointerdown", closeMenus)
    return () => {
      document.removeEventListener("pointerdown", closeMenus)
    }
  }, [calendarOpen])

  return (
    <main className="scrollbar-none min-h-0 flex-1 overflow-y-auto bg-muted/40">
      <section className="mx-auto mt-20 flex min-h-full w-full max-w-[900px] p-8 flex-col">
        <TodayTrainingHero
          anotherTrainingActive={anotherTrainingActive}
          dashboardLoading={dashboardLoading}
          dailySuggestion={dailySuggestion}
          guidanceError={guidanceError}
          guidanceLoading={guidanceLoading}
          guidanceMessage={guidanceMessage}
          hasActivePlan={Boolean(activePlan)}
          postTrainingAdjustment={postTrainingAdjustment}
          postTrainingFeedback={postTrainingFeedback}
          postTrainingFeedbackError={postTrainingFeedbackError}
          postTrainingFeedbackLoading={postTrainingFeedbackLoading}
          postTrainingFeedbackVisible={postTrainingFeedbackVisible}
          postTrainingHeartRateSummary={postTrainingHeartRateSummary}
          liveHeartRate={liveHeartRate}
          onApplyPostTrainingAdjustment={onApplyPostTrainingAdjustment}
          onCompleteTrainingDay={onCompleteTrainingDay}
          onOpenPlanComposer={onOpenPlanComposer}
          onPostTrainingFeedbackChange={onPostTrainingFeedbackChange}
          onPreviewPostTrainingAdjustment={onPreviewPostTrainingAdjustment}
          onPauseTraining={onPauseTraining}
          onResumeTraining={onResumeTraining}
          onToggleExercise={onToggleExercise}
          onStartTraining={onStartTraining}
          planGoal={planGoal}
          selectedDate={selectedDate}
          selectedDay={selectedDay}
          selectedDayCompleted={selectedDayCompleted}
          selectedDisplayActions={selectedDisplayActions}
          selectedDisplayTitle={selectedDisplayTitle}
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
          completedSessions={completedPlanSessions}
          completedDateSet={completedDateSet}
          completedExercises={completedExercises}
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
          planTitle={planTitle}
          planTotalProgress={planTotalProgress}
          planTotalSeconds={planTotalSeconds}
          onWeekBackward={() => {
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
          onWeekForward={() => {
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
          selectedDate={selectedDate}
          stageLabel={buildPlanStageLabel(activePlan, weekStart)}
          streakDays={trainingStreak}
          trainingPlans={trainingPlans}
          totalSessions={planExpectedSessions}
          weekCalories={weekCalories}
          weekProgress={weekProgress}
          weekStart={weekStart}
          weekRangeLabel={formatWeekRange(weekStart)}
          weekSeconds={weekSeconds}
          workoutLogs={workoutLogs}
          trainingDays={trainingDays}
        />

        <TrainingPlanDetailDialog
          onOpenChange={setDetailsOpen}
          open={detailsOpen}
          plan={activePlan}
        />
      </section>
    </main>
  )
}

function PostTrainingFeedbackPanel({
  feedback,
  loading,
  onFeedbackChange,
  onPreview,
}: {
  feedback: string
  loading: boolean
  onFeedbackChange: (value: string) => void
  onPreview: () => void
}) {
  return (
    <div className="mt-3">
      <InputGroup className="min-h-10 bg-background">
        <InputGroupInput
          onChange={(event) => onFeedbackChange(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault()
              if (!loading && feedback.trim()) {
                onPreview()
              }
            }
          }}
          placeholder="训练结束，感觉如何？"
          value={feedback}
        />
        <InputGroupAddon align="inline-end" className="self-center">
          <Button
            className="rounded-full"
            aria-disabled={loading || !feedback.trim()}
            onClick={() => {
              if (loading || !feedback.trim()) {
                return
              }
              onPreview()
            }}
            size="icon"
            type="button"
          >
            {loading ? <Spinner /> : <ArrowUp className="size-4" />}
          </Button>
        </InputGroupAddon>
      </InputGroup>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {[
          "整体轻松",
          "正常完成",
          "较为吃力",
          "提前结束",
          "有不适感觉",
          "补给不足",
        ].map((item) => (
          <Button
            className="h-auto rounded-full px-3 py-1 text-left text-[12px] font-normal text-muted-foreground bg-background"
            key={item}
            onClick={() => onFeedbackChange(appendFeedbackText(feedback, item))}
            type="button"
            variant="outline"
          >
            {item}
          </Button>
        ))}
      </div>
    </div>
  )
}

function TrainingSuggestionBubbleContent({
  adjustment,
  defaultMessage,
  error,
  guidanceError,
  guidanceLoading,
  loading,
  onApply,
}: {
  adjustment: TrainingPlanAdjustmentResponse | null
  defaultMessage: string
  error: string | null
  guidanceError: string | null
  guidanceLoading: boolean
  loading: boolean
  onApply: () => void
}) {
  if (loading && !adjustment) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Spinner />
        <span>正在根据你的反馈生成调整建议...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 text-destructive">
        <CircleAlert className="mt-0.5 size-4 shrink-0" />
        <span>{error}</span>
      </div>
    )
  }

  if (adjustment) {
    return (
      <div>
        <div className="font-semibold">我建议这样调整：</div>
        <div className="mt-2 flex flex-col gap-2">
          {adjustment.rationale.map((item) => (
            <div
              className="flex gap-2 text-muted-foreground"
              key={item}
            >
              <Check className="mt-0.5 size-3.5 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-end">
          <Button
            disabled={loading}
            onClick={onApply}
            size="sm"
            type="button"
          >
            {loading ? <Spinner /> : null}
            同意并更新计划
          </Button>
        </div>
      </div>
    )
  }

  if (guidanceLoading && !guidanceError) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Spinner />
        <span>Kratos 正在分析你的训练状态...</span>
      </div>
    )
  }

  return defaultMessage
}

function appendFeedbackText(current: string, addition: string) {
  const trimmed = current.trim()
  if (!trimmed) {
    return addition
  }
  if (trimmed.includes(addition)) {
    return trimmed
  }
  return `${trimmed}\n${addition}`
}

function getInitialTrainingDate(plan: TrainingPlan | null) {
  if (isDailyTrainingPlan(plan) && plan?.start_date) {
    return dateFromValue(plan.start_date)
  }
  return new Date()
}

function buildTrainingDays(plan: TrainingPlan | null, weekStart: Date): TrainingDay[] {
  const structuredWeeks = plan?.schedule_json?.weeks ?? []
  const structuredSessions = structuredWeeks.flatMap((week) =>
    week.sessions.map((session) => ({ session, week: week.week }))
  )
  if (structuredSessions.length) {
    const dailyPlan = isDailyTrainingPlan(plan)
    const dailyDate = dailyPlan
      ? dateFromValue(plan?.start_date ?? localDateValue(new Date()))
      : null

    return structuredSessions.map(({ session, week }, sessionIndex) => {
      const weekdayIndex = dailyDate
        ? getMondayFirstDayIndex(dailyDate)
        : inferWeekdayIndex(session.weekday, sessionIndex)
      const date = dailyDate ?? addDays(weekStart, weekdayIndex + Math.max(week - 1, 0) * 7)
      const dateValue = localDateValue(date)
      const dayLabel = dailyDate ? weekdayLabel(date) : session.weekday.trim()
      const actions = session.exercises.map((exercise, exerciseIndex) => ({
        id: exercise.id || `${dateValue}-${dayLabel}-${sessionIndex}-${exerciseIndex}-${exercise.name}`,
        media: exercise.media,
        notes: exercise.notes,
        restSeconds: exercise.rest_seconds,
        targetReps: exercise.target_reps,
        targetRpe: exercise.target_rpe,
        targetSets: exercise.target_sets,
        targetWeightKg: exercise.target_weight_kg,
        title: exercise.name,
      }))

      return {
        actions,
        date,
        dateValue,
        day: dayLabel,
        goal: session.title,
        id: `${dayLabel}-${sessionIndex}-${session.id}`,
        title: session.title || "训练日",
      }
    })
  }

  const lines = getPlanExerciseLines(plan).filter(isTrainingDayLine)
  const dailyPlan = isDailyTrainingPlan(plan)
  const dailyDate = dailyPlan
    ? dateFromValue(plan?.start_date ?? localDateValue(new Date()))
    : null

  return lines.map((line, dayIndex) => {
    const [dayPart, contentPart] = line.includes("｜")
      ? line.split("｜", 2)
      : [`第 ${dayIndex + 1} 天`, line]
    const weekdayIndex = dailyDate
      ? getMondayFirstDayIndex(dailyDate)
      : inferWeekdayIndex(dayPart, dayIndex)
    const date = dailyDate ?? addDays(weekStart, weekdayIndex)
    const dateValue = localDateValue(date)
    const dayLabel = dailyDate ? weekdayLabel(date) : dayPart.trim()
    const [titlePart, actionPart] = splitTrainingDayContent(contentPart)
    const actions = splitTrainingActions(actionPart || titlePart).map(
      (title, actionIndex) => ({
        id: `${dateValue}-${dayLabel}-${dayIndex}-${actionIndex}-${title}`,
        title,
      })
    )

    return {
      actions: actions.length
        ? actions
        : [
          {
            id: `${dateValue}-${dayLabel}-${dayIndex}-0-${contentPart.trim()}`,
            title: contentPart.trim(),
          },
        ],
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
  if (plan?.plan_kind) {
    return plan.plan_kind === "daily"
  }
  const lines = getPlanExerciseLines(plan).filter(isTrainingDayLine)
  if (!plan || lines.length !== 1) {
    return false
  }

  if (plan.end_date && plan.start_date && plan.end_date !== plan.start_date) {
    return false
  }

  return (
    !plan.end_date ||
    /今日|当天|每日|单日|本次|今天|Kratos 生成/.test(
      `${plan.title} ${plan.summary ?? ""} ${plan.goal ?? ""}`
    )
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
  const expectedSessions = calculateExpectedPlanSessions(
    plan,
    weeklyTrainingDayCount
  )

  if (expectedSessions <= 0) {
    return completedLogs > 0 ? 100 : 0
  }

  return Math.min(100, Math.round((completedLogs / expectedSessions) * 100))
}

function calculateExpectedPlanSessions(
  plan: TrainingPlan,
  weeklyTrainingDayCount: number
) {
  const fallback = Math.max(weeklyTrainingDayCount, 1)
  if (!plan.start_date || !plan.end_date) {
    return fallback
  }

  const start = dateFromValue(plan.start_date)
  const end = dateFromValue(plan.end_date)
  if (end < start) {
    return fallback
  }

  const totalDays =
    Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1
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

  return Math.max(
    fullWeeks * weeklyTrainingDayCount + remainderSessions,
    fallback
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

  if (/(休息|恢复日)/.test(normalized) && !/[；;].*(组|次|秒|轮)/.test(normalized)) {
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
    .flatMap(expandTrainingActionSegment)
    .filter(isRecordableTrainingAction)
    .filter(Boolean)
}

function expandTrainingActionSegment(segment: string) {
  const normalized = segment.trim()
  if (!normalized) {
    return []
  }

  if (!normalized.includes("、")) {
    return [normalized]
  }

  return normalized
    .split("、")
    .map((item) =>
      item
        .replace(/\s*各\s*[\s\S]*$/, "")
        .replace(/\s*完成\s*\d+\s*轮[\s\S]*$/, "")
        .trim()
    )
    .filter(Boolean)
}

function isRecordableTrainingAction(action: string) {
  if (!action) {
    return false
  }

  if (/(休息|恢复|步行|快走|拉伸|活动度|记录体重|睡眠|疲劳)/.test(action)) {
    return false
  }

  return true
}

function buildCompletedDateSet(logs: WorkoutLog[], planId: number | null) {
  return new Set(
    logs
      .filter((log) => log.completed && log.training_plan_id === planId)
      .map((log) => log.workout_date)
  )
}

// function sumWorkoutSecondsForDate(
//   logs: WorkoutLog[],
//   planId: number | null,
//   dateValue: string
// ) {
//   return logs
//     .filter(
//       (log) => log.training_plan_id === planId && log.workout_date === dateValue
//     )
//     .reduce((sum, log) => sum + getWorkoutSeconds(log), 0)
// }

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
  return (
    logs
      .filter(
        (log) =>
          log.training_plan_id === planId && log.workout_date === dateValue
      )
      .sort(
        (left, right) =>
          new Date(right.created_at).getTime() -
          new Date(left.created_at).getTime()
      )[0] ?? null
  )
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

function TodayTrainingHero({
  anotherTrainingActive,
  completedExercises,
  dailySuggestion,
  dashboardLoading,
  guidanceError,
  guidanceLoading,
  hasActivePlan,
  postTrainingAdjustment,
  postTrainingFeedback,
  postTrainingFeedbackError,
  postTrainingFeedbackLoading,
  postTrainingFeedbackVisible,
  liveHeartRate,
  onApplyPostTrainingAdjustment,
  onCompleteTrainingDay,
  onOpenPlanComposer,
  onPostTrainingFeedbackChange,
  onPreviewPostTrainingAdjustment,
  onPauseTraining,
  onResumeTraining,
  onStartTraining,
  onToggleExercise,
  planGoal,
  selectedDate,
  selectedDay,
  selectedDayCompleted,
  selectedDisplayActions,
  selectedDisplayTitle,
  selectedTrainingActive,
  trainingElapsedSeconds,
  trainingPaused,
}: {
  anotherTrainingActive: boolean
  completedExercises: string[]
  dailySuggestion: string
  dashboardLoading: boolean
  guidanceError: string | null
  guidanceLoading: boolean
  guidanceMessage: string
  hasActivePlan: boolean
  postTrainingAdjustment: TrainingPlanAdjustmentResponse | null
  postTrainingFeedback: string
  postTrainingFeedbackError: string | null
  postTrainingFeedbackLoading: boolean
  postTrainingFeedbackVisible: boolean
  postTrainingHeartRateSummary: HeartRateSummary | null
  liveHeartRate: LiveHeartRateState
  onApplyPostTrainingAdjustment: () => void
  onCompleteTrainingDay: TrainingPlanPageProps["onCompleteTrainingDay"]
  onOpenPlanComposer: TrainingPlanPageProps["onOpenPlanComposer"]
  onPostTrainingFeedbackChange: (value: string) => void
  onPreviewPostTrainingAdjustment: () => void
  onPauseTraining: () => void
  onResumeTraining: () => void
  onStartTraining: TrainingPlanPageProps["onStartTraining"]
  onToggleExercise: (title: string) => void
  planGoal: string
  selectedDate: string
  selectedDay: TrainingDay | null
  selectedDayCompleted: boolean
  selectedDisplayActions: TrainingDayAction[]
  selectedDisplayTitle: string
  selectedTrainingActive: boolean
  trainingElapsedSeconds: number
  trainingPaused: boolean
}) {
  const hasTraining = Boolean(selectedDay)
  const actionTotal =
    selectedDay?.actions.length ?? selectedDisplayActions.length
  const selectedDateLabel = selectedDay
    ? formatDateLabel(selectedDay.date)
    : formatDateLabel(dateFromValue(selectedDate))

  return (
    <section>
      <div className="flex min-h-82.5 flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-muted-foreground">
              {hasTraining
                ? `${selectedDateLabel} · 今日训练`
                : `${selectedDateLabel} · 恢复日`}
            </p>
            <h2 className="mt-0 max-w-160 text-xl leading-tight font-medium tracking-[-0.05em] sm:text-3xl">
              {hasTraining ? selectedDisplayTitle : "今天没有安排训练"}
            </h2>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3 sm:justify-end pt-5">
            {selectedTrainingActive ? (
              <LiveHeartRatePanel reading={liveHeartRate} />
            ) : null}
            {selectedTrainingActive ? (
              <ButtonGroup>
                <Button
                  variant="outline"
                  onClick={trainingPaused ? onResumeTraining : onPauseTraining}
                  className="w-32 justify-center py-5 font-normal tabular-nums"
                >
                  <span className="inline-block w-10 text-left">
                    {trainingPaused ? "已暂停" : "计时中"}
                  </span>
                  <span className="inline-block w-20 text-left tabular-nums">
                    {formatTimer(trainingElapsedSeconds)}
                  </span>
                </Button>
                <Button
                  onClick={trainingPaused ? onResumeTraining : onPauseTraining}
                  type="button"
                  className="py-5"
                  variant="outline">
                  {trainingPaused ? <Play className="size-4" /> : <Pause className="size-4" />}
                </Button>
              </ButtonGroup>
            ) : null}
            {hasTraining ? (
              <Button
                className={cn(
                  "p-5"
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
                    selectedDay.actions.map((action) => action.title),
                    selectedDay.actions.map((action) => action.id)
                  )
                }}
                type="button"
                variant="default"
              >
                {selectedTrainingActive ? (
                  <Save className="size-4" />
                ) : anotherTrainingActive ? (
                  <Ban className="size-4" />
                ) : selectedDayCompleted ? (
                  <RotateCcw className="size-4" />
                ) : (
                  <Play className="size-4 fill-current" />
                )}
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
                className="p-5"
                onClick={() => onOpenPlanComposer(null)}
                type="button"
                variant="outline"
              >
                <PlusCircle className="size-4" />
                训练计划
              </Button>
            )}


          </div>
        </div>



        <div className="max-w-150">
          <div className="flex items-start gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
              <span className="text-[18px] font-black">K</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] leading-5 font-bold">Kratos</div>
              <div className="mt-2 rounded-2xl rounded-tl-md bg-muted px-4 py-3 text-[13px] leading-5 text-foreground">
                <TrainingSuggestionBubbleContent
                  adjustment={postTrainingAdjustment}
                  defaultMessage={hasActivePlan ? dailySuggestion : planGoal}
                  error={postTrainingFeedbackError}
                  guidanceError={guidanceError}
                  guidanceLoading={guidanceLoading}
                  loading={postTrainingFeedbackLoading}
                  onApply={onApplyPostTrainingAdjustment}
                />
              </div>
              {postTrainingFeedbackVisible ? (
                <PostTrainingFeedbackPanel
                  feedback={postTrainingFeedback}
                  loading={postTrainingFeedbackLoading}
                  onFeedbackChange={onPostTrainingFeedbackChange}
                  onPreview={onPreviewPostTrainingAdjustment}
                />
              ) : null}
            </div>
          </div>
        </div>

        <div className="min-w-0">
          {hasTraining ? (
            <Carousel
              className="w-full"
              opts={{
                align: "start",
              }}
            >
              <CarouselContent className="-ml-3">
                {selectedDisplayActions.map((action) => {
                  const completed = selectedTrainingActive
                    ? completedExercises.includes(action.id)
                    : selectedDayCompleted ||
                    action.completed ||
                    completedExercises.includes(action.id)
                  const actionPosition =
                    selectedDisplayActions.findIndex(
                      (item) => item.id === action.id
                    ) + 1

                  return (
                    <CarouselItem key={action.id} className="basis-full pl-3 md:basis-1/2 lg:basis-1/3">
                      <button
                        className={cn(
                          "group flex h-full min-h-65 w-full snap-start flex-col justify-between overflow-hidden rounded-[16px] border p-0 text-left transition",
                          completed
                            ? "border-primary bg-muted text-foreground"
                            : "border-border bg-card text-foreground hover:border-primary/25 hover:bg-muted",
                          (!selectedTrainingActive || trainingPaused) && "cursor-default"
                        )}
                        disabled={!selectedTrainingActive || trainingPaused}
                        key={action.id}
                        onClick={() => onToggleExercise(action.id)}
                        type="button"
                      >
                        <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-linear-to-br from-background/12 via-primary-foreground/6 to-transparent">
                          <div className="px-4 py-2 text-[13px] font-semibold text-primary-foreground/45">
                            <ActionImage
                              actionName={action.title}
                              className="absolute inset-0"
                              media={action.media}
                            />
                          </div>

                          <div className="absolute top-4 left-4 grid size-9 place-items-center rounded-full bg-background/90 text-[13px] font-black text-foreground shadow-sm">
                            {completed ? (
                              <Check className="size-4" />
                            ) : (
                              actionPosition
                            )}
                          </div>
                        </div>

                        <CardContent className="flex flex-1 flex-col justify-between p-4">
                          <div>
                            <h3 className="line-clamp-2 text-[16px] leading-5 font-medium">
                              {action.title} {action.targetReps}
                            </h3>
                            <p className="mt-1 text-[13px] text-muted-foreground">
                              动作 {actionPosition} / {actionTotal}
                            </p>
                          </div>
                        </CardContent>
                      </button>
                    </CarouselItem>
                  )
                })}
              </CarouselContent>
              {selectedDisplayActions.length > 1 ? (
                <>
                  <CarouselPrevious />
                  <CarouselNext />
                </>
              ) : null}
            </Carousel>
          ) : (
            <Empty className="border border-dashed min-h-50">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CalendarIcon />
                </EmptyMedia>
                <EmptyTitle>恢复、散步或记录身体反馈</EmptyTitle>
                <EmptyDescription>
                  这一天没有匹配到当前计划里的训练日。您可以切换周安排，或让 Kratos 重新规划训练节奏。
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </div >
    </section >
  )
}

function LiveHeartRatePanel({ reading }: { reading: LiveHeartRateState }) {
  const [heartBeatActive, setHeartBeatActive] = useState(false)
  const bpmValue = reading.bpm && reading.status === "live"
    ? String(Math.round(reading.bpm))
    : "--"
  const beatDurationMs = reading.bpm && reading.status === "live"
    ? Math.max(350, Math.min(1200, Math.round(60_000 / reading.bpm)))
    : 1000

  useEffect(() => {
    if (!reading.bpm || reading.status !== "live") {
      setHeartBeatActive(false)
      return undefined
    }

    setHeartBeatActive(true)
    const beatTimer = window.setInterval(() => {
      setHeartBeatActive(true)
      window.setTimeout(() => setHeartBeatActive(false), 140)
    }, beatDurationMs)

    return () => window.clearInterval(beatTimer)
  }, [beatDurationMs, reading.bpm, reading.status])

  return (
    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center mr-2">
      <div className="flex min-w-0 items-center gap-1">
        {reading.status === "connecting" ? (
          <Spinner className="size-4" />
        ) : null}
        <HeartPulse
          className="size-6 text-red-500 transition-transform duration-150 ease-out"
          style={{ transform: heartBeatActive ? "scale(1.18)" : "scale(1)" }}
        />
      </div>
      <span className="inline-block text-left text-xl font-medium tabular-nums">
        {bpmValue}
      </span>
    </div>
  )
}


// function liveHeartRateDisplay(reading: LiveHeartRateState) {
//   const labels: Record<LiveHeartRateState["status"], string> = {
//     connecting: "连接中",
//     disconnected: "连接中断",
//     idle: "连接中",
//     live: "实时心率",
//     no_data: "暂无数据",
//     unbound: "未绑定 HypeRate",
//   }

//   return {
//     label: reading.detail
//       ? `${labels[reading.status]} · ${reading.detail}`
//       : labels[reading.status],
//   }
// }

function WeeklyTrainingTimeline({
  activePlan,
  calendarMenuRef,
  calendarOpen,
  calendarVisibleDate,
  completedDateSet,
  onCalendarSelectDate,
  onCalendarVisibleDateChange,
  onDeletePlan,
  onEditPlan,
  onOpenPlanComposer,
  onOpenPlanDetails,
  onSelectDate,
  onSelectPlan,
  onToggleCalendar,
  onWeekBackward,
  onWeekForward,
  selectedDate,
  trainingDays,
  trainingPlans,
  weekRangeLabel,
  weekStart,
}: {
  activePlan: TrainingPlan | null
  activePlanId: number | null
  calendarMenuRef: { current: HTMLDivElement | null }
  calendarOpen: boolean
  calendarVisibleDate: Date
  completedSessions: number
  completedDateSet: Set<string>
  completedExercises: string[]
  onCalendarSelectDate: (dateValue: string) => void
  onCalendarVisibleDateChange: (date: Date) => void
  onDeletePlan: (plan: TrainingPlan) => void
  onEditPlan: (plan: TrainingPlan) => void
  onOpenPlanComposer: TrainingPlanPageProps["onOpenPlanComposer"]
  onOpenPlanDetails: () => void
  onSelectDate: (dateValue: string) => void
  onSelectPlan: (plan: TrainingPlan) => void
  onToggleCalendar: () => void
  planTitle: string
  planTotalProgress: number
  planTotalSeconds: number
  onWeekBackward: () => void
  onWeekForward: () => void
  selectedDate: string
  stageLabel: string
  streakDays: number
  trainingDays: TrainingDay[]
  trainingPlans: TrainingPlan[]
  totalSessions: number
  weekCalories: number
  weekProgress: number
  weekRangeLabel: string
  weekStart: Date
  weekSeconds: number
  workoutLogs: WorkoutLog[]
}) {
  const days = buildWeekDays(weekStart)

  return (
    <section className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-medium">本周训练安排</h2>
        </div>
        {activePlan &&
          <div className="flex flex-wrap items-center gap-2">
            <Popover open={calendarOpen} onOpenChange={onToggleCalendar}>
              <PopoverTrigger asChild>
                <Button className="font-medium" type="button" variant="outline">
                  <CalendarIcon className="size-4" />
                  {weekRangeLabel}
                  <ChevronRight className="size-4 rotate-90" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-auto p-0"
                ref={calendarMenuRef}
                sideOffset={5}
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
          </div>}
      </div>

      {trainingDays.length > 0 ? (
        <div className="relative mt-4 grid overflow-visible -mx-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr]">
          {days.map((day) => {
            const trainingDay =
              trainingDays.find((item) => item.dateValue === day.value) ?? null
            const completed = completedDateSet.has(day.value)
            const selected = selectedDate === day.value
            const active = trainingDay?.dateValue === selectedDate
            const actionCount = trainingDay?.actions.length ?? 0
            const title = trainingDay ? trainingDay.title : "休息"
            const status = completed
              ? "已完成"
              : active
                ? "进行中"
                : trainingDay
                  ? "待完成"
                  : "休息日"

            return (
              <Fragment key={day.value}>
                <button
                  className={cn(
                    "relative z-10 flex min-h-37.5 flex-col rounded-[14px] border p-3 text-left transition-colors",
                    selected
                      ? "border-primary bg-muted"
                      : "border-transparent bg-primary-foreground hover:bg-muted"
                  )}
                  onClick={() => onSelectDate(day.value)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[12px] text-muted-foreground">{`周${day.day}`}</p>
                      <p className="-mt-1 text-[16px]">
                        {day.label}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-[16px] leading-5 font-medium">
                      {title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-[12px] leading-4 text-muted-foreground">
                      {trainingDay
                        ? `${actionCount} 个动作 · ${trainingDay.actions
                          .map((action) => action.title)
                          .join("；")}`
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
                {day.day !== "日" ? (
                  <div className="flex items-center justify-center">
                    <div className="h-46 w-px bg-border/80" aria-hidden="true" />
                  </div>
                ) : null}
              </Fragment>
            )
          })}
        </div>
      ) : (
        <Empty className="mt-4 border border-dashed min-h-50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClipboardList />
            </EmptyMedia>
            <EmptyTitle>暂无可执行的训练安排</EmptyTitle>
            <EmptyDescription>
              选择一个常见模板，或从空白计划开始撰写。
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <PlanManagementSection
        activePlan={activePlan}
        onDeletePlan={onDeletePlan}
        onEditPlan={onEditPlan}
        onOpenPlanComposer={onOpenPlanComposer}
        onSelectPlan={onSelectPlan}
        trainingPlans={trainingPlans}
      />
    </section>
  )
}

function PlanManagementSection({
  activePlan,
  onDeletePlan,
  onEditPlan,
  onOpenPlanComposer,
  onSelectPlan,
  trainingPlans,
}: {
  activePlan: TrainingPlan | null
  onDeletePlan: (plan: TrainingPlan) => void
  onEditPlan: (plan: TrainingPlan) => void
  onOpenPlanComposer: TrainingPlanPageProps["onOpenPlanComposer"]
  onSelectPlan: (plan: TrainingPlan) => void
  trainingPlans: TrainingPlan[]
}) {
  return (
    <section className="mt-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <h2 className="text-xl font-medium tracking-[-0.03em]">
          计划管理
        </h2>
        {trainingPlans.length > 0 &&
          <Button
            onClick={() => onOpenPlanComposer(null)}
            type="button"
            variant="outline"
          >
            <PlusCircle className="size-4" />
            新建计划
          </Button>}
      </div>

      <MoreTrainingMenu
        onClose={() => undefined}
        onDeletePlan={onDeletePlan}
        onEditPlan={onEditPlan}
        onOpenPlanComposer={onOpenPlanComposer}
        onSelectPlan={onSelectPlan}
        plan={activePlan}
        plans={trainingPlans}
      />
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
  const shouldFillDailyEmpty = longTermPlans.length > 1
  const shouldFillLongTermEmpty = dailyPlans.length > 1

  return (
    <div className="mt-7 grid gap-6">

      <section className="grid items-start gap-3">
        {plans.length > 0 ? (
          <div className="grid items-start gap-6 lg:grid-cols-2 lg:items-stretch">
            <SavedPlanGroup
              shouldFillEmpty={shouldFillLongTermEmpty}
              emptyText="暂无长期计划"
              emptyDescription="长期计划会显示在这里。适合保存周期训练、周计划和阶段目标。"
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
              shouldFillEmpty={shouldFillDailyEmpty}
              emptyText="暂无每日计划"
              emptyDescription="从聊天中生成的当日训练计划会显示在这里。"
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
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <List />
              </EmptyMedia>
              <EmptyTitle>暂无训练计划</EmptyTitle>
              <EmptyDescription>
                从模板或空白计划保存后，这里会显示计划列表。
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>

      <section className="grid gap-3">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between">
          <h3 className="font-medium">从模板开始</h3>
        </div>

        <div className="grid gap-10 md:grid-cols-3 overflow-visible">
          {trainingPlanTemplates.map((template) => (
            <button
              className="-mx-4 group flex min-h-38 flex-col items-start justify-between rounded-2xl p-4 text-left transition hover:bg-muted"
              key={template.id}
              onClick={() => {
                onClose()
                onOpenPlanComposer(template)
              }}
              type="button"
            >

              <span className="min-w-0">
                <span className="line-clamp-1 text-[15px]">
                  {template.title}
                </span>
                <span className="mt-1 line-clamp-3 text-[12px] leading-5 text-muted-foreground">
                  {template.summary}
                </span>
              </span>

              <span className="mt-5 flex w-full items-center justify-between gap-3">
                <Badge variant="secondary">
                  {template.level}
                </Badge>
                <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
              </span>
            </button>
          ))}
        </div>
      </section>
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
  const [selectedAction, setSelectedAction] = useState<TrainingDayAction | null>(null)
  const detailDays = useMemo(
    () => buildTrainingDays(plan, startOfWeek(dateFromValue(plan?.start_date ?? localDateValue(new Date())))),
    [plan]
  )

  if (!plan) {
    return null
  }

  return (
    <>
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{plan.title}</DialogTitle>
            <DialogDescription>
              {plan.summary ?? "按训练日查看动作安排、目标次数和恢复建议。"}
            </DialogDescription>
          </DialogHeader>

          <section className="grid gap-3 sm:grid-cols-3">
            <PlanSummaryTile label="目标" value={plan.goal ?? "未设置"} />
            <PlanSummaryTile
              label="周期"
              value={`${plan.start_date ?? "未设置"} - ${plan.end_date ?? "未设置"}`}
            />
            <PlanSummaryTile
              label="类型"
              value={plan.plan_kind === "daily" ? "单日计划" : `${plan.duration_weeks ?? 1} 周计划`}
            />
          </section>

          <section className="grid gap-3">
            <h3 className="text-[15px] font-semibold">训练安排</h3>
            {detailDays.length ? (
              <div className="grid gap-3">
                {detailDays.map((day) => (
                  <div className="grid gap-2 rounded-lg border border-border p-3" key={day.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-[13px] font-semibold text-muted-foreground">{day.day}</p>
                        <h4 className="text-[15px] font-semibold">{day.title}</h4>
                      </div>
                      <Badge variant="secondary">{day.actions.length} 个动作</Badge>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {day.actions.map((action) => (
                        <button
                          className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-lg border border-border bg-card p-2 text-left transition hover:border-primary/40 hover:bg-muted"
                          key={action.id}
                          onClick={() => setSelectedAction(action)}
                          type="button"
                        >
                          <span className="relative aspect-square overflow-hidden rounded-md bg-muted">
                            <ActionImage actionName={action.title} className="absolute inset-0" fit="contain" media={action.media} />
                          </span>
                          <span className="min-w-0 self-center">
                            <span className="block truncate text-[14px] font-semibold">{action.title}</span>
                            <span className="mt-1 block text-[12px] text-muted-foreground">
                              {formatActionPrescription(action)}
                            </span>
                            <span className="mt-1 line-clamp-2 text-[12px] leading-5 text-muted-foreground">
                              {action.notes || action.media?.exercise_name || "点击查看动作讲解和教学视频"}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                暂无结构化训练动作。
              </p>
            )}
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <GuidanceBlock label="恢复建议" value={plan.recovery_guidance} />
            <GuidanceBlock label="营养建议" value={plan.nutrition_guidance} />
          </section>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">关闭</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ActionDetailDialog
        action={selectedAction}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setSelectedAction(null)
          }
        }}
      />
    </>
  )
}

function PlanSummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-[12px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-[14px] font-semibold leading-5">{value}</p>
    </div>
  )
}

function GuidanceBlock({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  const lines = value
    ?.split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean) ?? []

  return (
    <section className="rounded-lg border border-border p-3">
      <h3 className="text-[14px] font-semibold">{label}</h3>
      {lines.length ? (
        <div className="mt-2 grid gap-2">
          {lines.map((line) => (
            <p className="rounded-md bg-muted px-3 py-2 text-[13px] leading-5 text-muted-foreground" key={line}>
              {line}
            </p>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-[13px] text-muted-foreground">未填写</p>
      )}
    </section>
  )
}

function ActionDetailDialog({
  action,
  onOpenChange,
}: {
  action: TrainingDayAction | null
  onOpenChange: (open: boolean) => void
}) {
  const videos = action?.media?.teaching_videos ?? []

  return (
    <Dialog onOpenChange={onOpenChange} open={Boolean(action)}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        {action ? (
          <>
            <DialogHeader>
              <DialogTitle>{action.title}</DialogTitle>
              <DialogDescription>
                {action.media?.exercise_name ?? "动作讲解、训练处方和教学视频"}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 sm:grid-cols-[220px_minmax(0,1fr)]">
              <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
                <ActionImage actionName={action.title} className="absolute inset-0" fit="contain" media={action.media} />
              </div>
              <div className="grid content-start gap-3">
                <PlanSummaryTile label="次数组数" value={formatActionPrescription(action)} />
                <PlanSummaryTile
                  label="休息与强度"
                  value={formatActionIntensity(action)}
                />
                <section className="rounded-lg border border-border p-3">
                  <h3 className="text-[14px] font-semibold">动作讲解</h3>
                  <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                    {action.notes || "保持动作稳定、控制节奏，在目标次数范围内优先保证动作质量。"}
                  </p>
                </section>
              </div>
            </div>

            <section className="grid gap-3">
              <h3 className="text-[15px] font-semibold">教学视频</h3>
              {videos.length ? (
                <div className="grid gap-2">
                  {videos.slice(0, 4).map((video) => (
                    <a
                      className="flex min-w-0 items-center gap-3 rounded-lg border border-border p-2 transition hover:border-primary/40 hover:bg-muted"
                      href={video.url}
                      key={`${video.source}-${video.external_id ?? video.url}`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-md bg-muted">
                        {video.thumbnail_url ? (
                          <img
                            alt={video.title}
                            className="absolute inset-0 h-full w-full object-cover"
                            draggable={false}
                            src={proxiedBilibiliImageUrl(video.thumbnail_url) ?? video.thumbnail_url}
                          />
                        ) : null}
                        <span className="relative grid size-8 place-items-center rounded-full bg-foreground/70 text-background">
                          <Play className="size-3.5 fill-current" />
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold">{video.title}</span>
                        <span className="block truncate text-[12px] text-muted-foreground">
                          {video.author ?? video.source}
                        </span>
                      </span>
                      <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed p-3 text-[13px] text-muted-foreground">
                  暂无匹配的教学视频。
                </p>
              )}
            </section>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function formatActionPrescription(action: TrainingDayAction) {
  const parts = [
    action.targetSets ? `${action.targetSets} 组` : null,
    action.targetReps,
    action.targetWeightKg ? `${action.targetWeightKg} kg` : null,
  ].filter(Boolean)

  return parts.length ? parts.join(" × ") : "按计划完成"
}

function formatActionIntensity(action: TrainingDayAction) {
  const parts = [
    action.restSeconds ? `休息 ${Math.round(action.restSeconds / 60)} 分钟` : null,
    action.targetRpe ? `RPE ${action.targetRpe}` : null,
  ].filter(Boolean)

  return parts.length ? parts.join(" · ") : "以动作质量优先"
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
  emptyDescription,
  onDeletePlan,
  onEditPlan,
  onSelectPlan,
  plans,
  selectedPlanId,
  shouldFillEmpty = false,
  title,
}: {
  emptyText: string
  emptyDescription: string
  onDeletePlan: (plan: TrainingPlan) => void
  onEditPlan: (plan: TrainingPlan) => void
  onSelectPlan: (plan: TrainingPlan) => void
  plans: TrainingPlan[]
  selectedPlanId: number | null
  shouldFillEmpty?: boolean
  title: string
}) {
  const shouldStretchEmpty = plans.length === 0 && shouldFillEmpty

  return (
    <section
      className={cn(
        "grid gap-3 content-start",
        shouldStretchEmpty && "lg:grid-rows-[auto_1fr]"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h4 className="font-medium">
          {title}
        </h4>
        {/* <Badge variant="secondary">
          {plans.length} 个计划
        </Badge> */}
      </div>

      {plans.length > 0 ? (
        <div className=" grid gap-0 overflow-visible">
          {plans.map((item) => {
            const selected = item.id === selectedPlanId
            const description =
              item.summary ??
              item.weekly_schedule ??
              "这份计划已保存到后端 plans 表。"

            return (
              <div
                className={cn(
                  "-mx-4 -my-1 grid gap-6 rounded-2xl px-4 py-4 transition-all md:grid-cols-[minmax(0,1fr)_auto] md:items-center hover:bg-muted",
                )}
                key={item.id}
              >
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <h5 className="truncate text-[15px] text-foreground">
                      {item.title}
                    </h5>
                    {selected ? (
                      <Badge variant="outline">
                        当前
                      </Badge>
                    ) : null}
                  </div>

                  <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-muted-foreground">
                    {description}
                  </p>
                </div>

                <div className="flex items-center justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        aria-label={`打开 ${item.title} 的操作菜单`}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-36">
                      {selected ? (
                        <DropdownMenuItem disabled>
                          <Check className="size-4" />
                          当前执行
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => onSelectPlan(item)}>
                          <Check className="size-4" />
                          设为当前
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onEditPlan(item)}>
                        <PencilLine className="size-4" />
                        编辑计划
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDeletePlan(item)}
                      >
                        <Trash2 className="size-4" />
                        删除计划
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <Empty
          className={cn(
            "min-h-40 border border-dashed",
            shouldStretchEmpty && "lg:h-full"
          )}
        >
          <EmptyHeader>
            <EmptyTitle>{emptyText}</EmptyTitle>
            <EmptyDescription>
              {emptyDescription}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
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

function buildDailySuggestion(
  plan: TrainingPlan | null,
  workoutLogs: WorkoutLog[],
  latestCheckin: AgentCheckin | null
) {
  const todayCheckin = latestCheckin && isCurrentDate(
    latestCheckin.checkin_date ?? latestCheckin.created_at
  )
    ? latestCheckin
    : null
  if (todayCheckin?.pain_notes || (todayCheckin?.soreness_level ?? 0) >= 7 || (todayCheckin?.energy_level ?? 10) <= 3) {
    return "今天的恢复打卡出现疼痛、高酸痛或低精力信号，不适合盲目加量。建议降低强度或停止引发不适的动作；急性不适请及时就医评估。"
  }

  if (todayCheckin && ((todayCheckin.sleep_hours ?? 8) < 7 || (todayCheckin.soreness_level ?? 0) >= 5)) {
    return "今天睡眠或酸痛提示恢复不足，建议按计划保守训练，降低训练量并避免挑战新的最大重量。"
  }

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

function isCurrentDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  const today = new Date()
  return date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate()
}
