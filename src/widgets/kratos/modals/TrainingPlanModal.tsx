import { useState, type FormEvent } from "react"
import { LoaderCircle, X } from "lucide-react"

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
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4 backdrop-blur-[2px]">
      <form
        className="max-h-[92svh] w-full max-w-[760px] overflow-y-auto rounded-[20px] border border-border bg-card p-5 shadow-[0_22px_70px_rgba(0,0,0,0.25)]"
        onSubmit={submit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[20px] font-black tracking-[-0.04em]">
              撰写训练计划
            </h2>
            <p className="mt-2 text-[12px] leading-5 text-muted-foreground">
              保存后会写入后端 /plans，训练页和打卡记录都会读取这份真实计划。
            </p>
          </div>
          <button
            className="grid size-8 place-items-center rounded-full hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
            placeholder="例如 减脂 / 增肌 / 塑形"
            value={form.goal}
          />
          <SuggestionChips
            label="目标选项"
            onSelect={(value) =>
              setForm((current) => ({ ...current, goal: value }))
            }
            options={["减脂塑形", "增肌增力", "体态改善", "心肺耐力", "康复恢复"]}
          />
          <label className="block">
            <span className="text-[12px] font-bold text-foreground">状态</span>
            <select
              className="mt-1 h-10 w-full rounded-[10px] border border-border bg-card px-3 text-[13px] outline-none focus:border-primary"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
              value={form.status}
            >
              <option value="active">进行中</option>
              <option value="draft">草稿</option>
              <option value="paused">暂停</option>
              <option value="archived">归档</option>
            </select>
          </label>
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

        <div className="mt-5 flex items-center justify-end gap-3">
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
        </div>
      </form>
    </div>
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
