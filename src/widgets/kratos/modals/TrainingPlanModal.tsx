import { useState, type FormEvent } from "react"
import { LoaderCircle } from "lucide-react"

import type {
  TrainingPlanForm,
  TrainingPlanPayload,
} from "@/entities/kratos/model/types"
import {
  ErrorMessage,
  FormInput,
  FormTextarea,
  SuggestionChips,
} from "@/widgets/kratos/modals/ModalFormFields"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"

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
  const [form, setForm] = useState<TrainingPlanForm>(() =>
    trainingPlanFormFromPayload(draft)
  )

  if (!open) {
    return null
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(trainingPlanPayloadFromForm(form))
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
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-3xl">
        <form className="grid gap-5" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>
              撰写训练计划
            </DialogTitle>
            <DialogDescription>
              根据训练目标、时间和频率等信息，撰写个性化训练计划。
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-3">
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
              placeholder="例如 减脂 / 增肌 / 塑形 / 康复"
              value={form.goal}
            />




            <div className="grid gap-3 sm:grid-cols-2">
              <FormInput
                label="开始日期"
                onChange={(value) =>
                  setForm((current) => ({ ...current, startDate: value }))
                }
                type="date"
                value={form.startDate}
              />
              <FormInput
                label="结束日期"
                onChange={(value) =>
                  setForm((current) => ({ ...current, endDate: value }))
                }
                type="date"
                value={form.endDate}
              />
            </div>
          </div>

          <FormTextarea
            label="计划摘要"
            onChange={(value) =>
              setForm((current) => ({ ...current, summary: value }))
            }
            placeholder="写清楚适合人群、训练频率和总体策略"
            value={form.summary}
          />
          <SuggestionChips
            label="摘要选项"
            onSelect={(value) =>
              setForm((current) => ({
                ...current,
                summary: appendText(current.summary, value),
              }))
            }
            options={[
              "适合新手建立规律训练习惯，每周 3-4 次，控制动作质量和恢复。",
              "适合有基础训练者提升肌肉量与力量表现，每周 4-5 次。",
              "适合时间紧张用户，单次训练控制在 30-45 分钟。",
            ]}
          />
          <FormTextarea
            label="周训练安排"
            onChange={(value) =>
              setForm((current) => ({ ...current, weeklySchedule: value }))
            }
            placeholder="每行一个训练日，例如：周一｜上肢推：卧推 4 组 x 8 次..."
            required
            rows={7}
            value={form.weeklySchedule}
          />
          <SuggestionChips
            label="训练日选项"
            onSelect={(value) =>
              setForm((current) => ({
                ...current,
                weeklySchedule: appendText(current.weeklySchedule, value),
              }))
            }
            options={[
              "周一｜全身力量：深蹲模式 3 组 x 10 次；俯卧撑 3 组 x 8-12 次；平板支撑 3 组 x 30 秒",
              "周三｜上肢拉：高位下拉 4 组 x 10 次；哑铃划船 3 组 x 12 次；面拉 3 组 x 15 次",
              "周五｜低冲击有氧：快走或椭圆机 35 分钟；髋部和胸椎拉伸 10 分钟",
            ]}
          />
          <div className="grid gap-3 sm:grid-cols-2">
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
          </div>
          <SuggestionChips
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
          />

          {error ? <ErrorMessage message={error} /> : null}

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              className="h-10 rounded-[10px] border-border px-4 text-[13px]"
              onClick={onClose}
              type="button"
              variant="outline"
            >
              取消
            </Button>
            <Button
              className="h-10 rounded-[10px] bg-primary px-5 text-[13px] font-bold text-primary-foreground hover:bg-primary/90"
              disabled={loading}
              type="submit"
            >
              {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
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

function trainingPlanPayloadFromForm(form: TrainingPlanForm): TrainingPlanPayload {
  return {
    end_date: compactFormText(form.endDate),
    goal: compactFormText(form.goal),
    nutrition_guidance: compactFormText(form.nutritionGuidance),
    recovery_guidance: compactFormText(form.recoveryGuidance),
    start_date: compactFormText(form.startDate),
    status: form.status || "draft",
    summary: compactFormText(form.summary),
    title: form.title.trim(),
    weekly_schedule: compactFormText(form.weeklySchedule),
  }
}

function compactFormText(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function appendText(current: string, addition: string) {
  const trimmed = current.trim()
  if (!trimmed) {
    return addition
  }

  if (trimmed.includes(addition)) {
    return trimmed
  }

  return `${trimmed}\n${addition}`
}
