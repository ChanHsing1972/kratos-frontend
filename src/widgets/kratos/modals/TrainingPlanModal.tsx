import { useMemo, useState, type FormEvent } from "react"
import { CalendarIcon } from "lucide-react"
import { type DateRange } from "react-day-picker"
import { Calendar as DateCalendar } from "@/shared/ui/calendar"
import { Field } from "@/shared/ui/field"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover"

import type {
  TrainingPlanForm,
  TrainingPlanPayload,
} from "@/entities/kratos/model/types"
import {
  ErrorMessage,
  FormInput,
  FormTextarea,
} from "@/widgets/kratos/modals/ModalFormFields"
import {
  TrainingPlanScheduleEditor,
} from "@/widgets/kratos/modals/TrainingPlanScheduleEditor"
import {
  parseTrainingPlanWeeklySchedule,
  serializeTrainingPlanWeeklySchedule,
  type TrainingPlanWeeklyScheduleDay,
} from "@/widgets/kratos/modals/trainingPlanSchedule"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Label } from "@/shared/ui/label"
import { Spinner } from "@/shared/ui/spinner"

type TrainingPlanModalProps = {
  draft: TrainingPlanPayload | null
  error: string | null
  loading: boolean
  onClose: () => void
  onSubmit: (payload: TrainingPlanPayload) => void
  open: boolean
}

export function TrainingPlanModal({
  draft,
  error,
  loading,
  onClose,
  onSubmit,
  open,
}: TrainingPlanModalProps) {
  const draftSnapshot = [
    draft?.title ?? "",
    draft?.goal ?? "",
    draft?.status ?? "",
    draft?.start_date ?? "",
    draft?.end_date ?? "",
    draft?.summary ?? "",
    draft?.weekly_schedule ?? "",
    draft?.nutrition_guidance ?? "",
    draft?.recovery_guidance ?? "",
  ].join("\u0000")

  if (!open) {
    return null
  }

  return (
    <TrainingPlanModalForm
      key={draftSnapshot}
      draft={draft}
      error={error}
      loading={loading}
      onClose={onClose}
      onSubmit={onSubmit}
      open={open}
    />
  )
}

function TrainingPlanModalForm({
  draft,
  error,
  loading,
  onClose,
  onSubmit,
  open,
}: TrainingPlanModalProps) {
  const [form, setForm] = useState<TrainingPlanForm>(() =>
    trainingPlanFormFromPayload(draft)
  )
  const [weeklySchedule, setWeeklySchedule] = useState(() =>
    parseTrainingPlanWeeklySchedule(draft?.weekly_schedule ?? "")
  )
  const selectedDateRange = trainingPlanDateRangeFromForm(
    form.startDate,
    form.endDate
  )
  const weeklyScheduleText = useMemo(
    () => serializeTrainingPlanWeeklySchedule(weeklySchedule),
    [weeklySchedule]
  )

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(trainingPlanPayloadFromForm(form, weeklyScheduleText, weeklySchedule))
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose()
        }
      }}
    >
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl no-scrollbar">
        <form className="grid gap-5" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>
              撰写训练计划
            </DialogTitle>
            <DialogDescription>
              根据训练目标、时间和频率等信息，撰写个性化训练计划。
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1.3fr]">
            <FormInput
              label="计划标题"
              maxLength={120}
              onChange={(value) =>
                setForm((current) => ({ ...current, title: value }))
              }
              placeholder="例如 4 周减脂基础计划"
              required
              value={form.title}
            />
            <FormInput
              label="训练目标"
              maxLength={120}
              onChange={(value) =>
                setForm((current) => ({ ...current, goal: value }))
              }
              placeholder="减脂 / 增肌 / 塑形 / 康复"
              value={form.goal}
            />
            <Field>
              <Label htmlFor="training-plan-date-range">
                训练周期
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="training-plan-date-range"
                    type="button"
                    variant="outline"
                    className="justify-start font-normal"
                  >
                    <CalendarIcon className="size-4" />
                    <span >{trainingPlanDateRangeLabel(selectedDateRange)}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <DateCalendar
                    defaultMonth={
                      selectedDateRange?.from ??
                      selectedDateRange?.to ??
                      new Date()
                    }
                    mode="range"
                    numberOfMonths={2}
                    onSelect={(range) => {
                      setForm((current) => ({
                        ...current,
                        endDate: range?.to ? formatCalendarDate(range.to) : "",
                        startDate: range?.from ? formatCalendarDate(range.from) : "",
                      }))
                    }}
                    selected={selectedDateRange}
                  />
                </PopoverContent>
              </Popover>
            </Field>
          </div>

          <FormTextarea
            label="计划摘要"
            onChange={(value) =>
              setForm((current) => ({ ...current, summary: value }))
            }
            placeholder="写清楚适合人群、训练频率和总体策略"
            value={form.summary}
          />

          <TrainingPlanScheduleEditor
            onChange={setWeeklySchedule}
            value={weeklySchedule}
          />

          {/* <SuggestionChips
            label="恢复提醒选项"
            onSelect={(value) =>
              setForm((current) => ({
                ...current,
                recoveryGuidance: appendText(current.recoveryGuidance, value),
              }))
            }
            options={[
              "训练中疼痛超过 3/10 时停止，并记录疼痛动作。",
              "大重量训练日之间至少间隔 48 小时。",
              "睡眠不足或酸痛明显时，将训练总量降低 15-25%。",
            ]}
          /> */}

          <FormTextarea
            label="营养建议"
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                nutritionGuidance: value,
              }))
            }
            placeholder="训练日前后补给、蛋白质、水分等"
            rows={4}
            value={form.nutritionGuidance}
          />
          <FormTextarea
            label="恢复与风险提醒"
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                recoveryGuidance: value,
              }))
            }
            placeholder="休息间隔、疼痛阈值、动作替换等"
            rows={4}
            value={form.recoveryGuidance}
          />


          {error ? <ErrorMessage message={error} /> : null}

          <DialogFooter className="sticky -bottom-5 z-10 backdrop-blur ">
            <Button
              onClick={onClose}
              type="button"
              variant="outline"
            >
              取消
            </Button>
            <Button
              disabled={loading}
              type="submit"
            >
              {loading ? <Spinner /> : null}
              保存计划
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function trainingPlanFormFromPayload(
  payload: TrainingPlanPayload | null
): TrainingPlanForm {
  return {
    endDate: payload?.end_date ?? "",
    goal: payload?.goal ?? "",
    nutritionGuidance: payload?.nutrition_guidance ?? "",
    recoveryGuidance: payload?.recovery_guidance ?? "",
    startDate: payload?.start_date ?? "",
    status: payload?.status ?? "active",
    summary: payload?.summary ?? "",
    title: payload?.title ?? "",
    weeklySchedule: payload?.weekly_schedule ?? "",
  }
}

function trainingPlanPayloadFromForm(
  form: TrainingPlanForm,
  weeklyScheduleText: string,
  schedule: TrainingPlanWeeklyScheduleDay[]
): TrainingPlanPayload {
  const populatedDays = schedule.filter((day) =>
    day.actions.some((action) => action.name.trim() && action.amount.trim())
  )
  return {
    end_date: compactFormText(form.endDate),
    goal: compactFormText(form.goal),
    nutrition_guidance: compactFormText(form.nutritionGuidance),
    recovery_guidance: compactFormText(form.recoveryGuidance),
    start_date: compactFormText(form.startDate),
    status: "draft",
    plan_kind: populatedDays.length <= 1 ? "daily" : "program",
    duration_weeks: populatedDays.length <= 1 ? null : 4,
    schedule_json: {
      version: 1,
      weeks: [
        {
          week: 1,
          sessions: populatedDays.map((day) => ({
            exercises: day.actions
              .filter((action) => action.name.trim() && action.amount.trim())
              .map((action) => ({
                id: action.id,
                name: action.name.trim(),
                notes: action.note.trim() || null,
                target_reps: action.amount.trim(),
              })),
            id: day.id,
            title: day.theme.trim(),
            weekday: day.weekday,
          })),
        },
      ],
    },
    summary: compactFormText(form.summary),
    title: form.title.trim(),
    weekly_schedule: compactFormText(weeklyScheduleText),
  }
}

function compactFormText(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function trainingPlanDateRangeFromForm(
  startDate: string,
  endDate: string
): DateRange | undefined {
  const from = parseDateValue(startDate)
  const to = parseDateValue(endDate)

  if (!from && !to) {
    return undefined
  }

  if (from && to) {
    return { from, to }
  }

  const singleDate = from ?? to
  return singleDate ? { from: singleDate } : undefined
}

function trainingPlanDateRangeLabel(dateRange: DateRange | undefined) {
  if (dateRange?.from && dateRange.to) {
    return `${formatCalendarDate(dateRange.from)} 至 ${formatCalendarDate(dateRange.to)}`
  }

  if (dateRange?.from) {
    return formatCalendarDate(dateRange.from)
  }

  if (dateRange?.to) {
    return formatCalendarDate(dateRange.to)
  }

  return "选择开始和结束日期"
}

function parseDateValue(value: string) {
  if (!value) {
    return undefined
  }

  const [yearText, monthText, dayText] = value.split("-")
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return undefined
  }

  const parsed = new Date(year, month - 1, day)
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return undefined
  }

  return parsed
}

function formatCalendarDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
