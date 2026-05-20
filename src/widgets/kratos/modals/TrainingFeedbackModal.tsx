import type { ComponentProps } from "react"
import { Check, CircleAlert, LoaderCircle, X } from "lucide-react"

import type { TrainingPlanAdjustmentResponse } from "@/entities/kratos/model/types"
import { Button } from "@/shared/ui/button"

type TrainingFeedbackModalProps = {
  adjustment: TrainingPlanAdjustmentResponse | null
  error: string | null
  feedback: string
  loading: boolean
  onApply: () => void
  onClose: () => void
  onFeedbackChange: (value: string) => void
  onPreview: () => void
  open: boolean
}

export function TrainingFeedbackModal({
  adjustment,
  error,
  feedback,
  loading,
  onApply,
  onClose,
  onFeedbackChange,
  onPreview,
  open,
}: TrainingFeedbackModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4 backdrop-blur-[2px]">
      <section className="max-h-[90svh] w-full max-w-[640px] overflow-y-auto rounded-[20px] border border-border bg-card p-5 shadow-[0_22px_70px_rgba(0,0,0,0.25)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[20px] font-black tracking-[-0.04em]">
              训练反馈
            </h2>
            <p className="mt-2 text-[12px] leading-5 text-muted-foreground">
              Kratos 会基于这次反馈生成原计划的调整建议，只有您同意后才会更新计划。
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

        <FormTextarea
          label="本次训练反馈"
          onChange={onFeedbackChange}
          placeholder="例如 今天腿部很酸，深蹲膝盖有点不适；或今天很轻松，可以加一点强度"
          rows={5}
          value={feedback}
        />
        <SuggestionChips
          label="快速反馈"
          onSelect={(value) => onFeedbackChange(appendText(feedback, value))}
          options={[
            "今天整体很轻松，可以适当加一点强度。",
            "今天比较累，动作质量下降，建议下次降低训练量。",
            "膝盖有点不适，需要减少冲击和深屈膝动作。",
            "提前结束训练，今天时间和体力都不够。",
            "训练前补给不足，后半段有点没力。",
          ]}
        />

        {error ? <ErrorMessage message={error} /> : null}

        {adjustment ? (
          <div className="mt-4 rounded-[12px] border border-border bg-muted/40 p-4">
            <h3 className="text-[14px] font-black">调整建议</h3>
            <div className="mt-3 flex flex-col gap-2">
              {adjustment.rationale.map((item) => (
                <div
                  className="flex gap-2 text-[12px] leading-5 text-muted-foreground"
                  key={item}
                >
                  <Check className="mt-0.5 size-3.5 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-[10px] bg-card p-3 text-[12px] leading-5 text-muted-foreground">
              将更新原计划的摘要、周安排、营养或恢复建议；不会创建新计划。
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex items-center justify-end gap-3">
          <Button
            className="h-10 rounded-[10px] border-border px-4 text-[13px]"
            onClick={onClose}
            type="button"
            variant="outline"
          >
            暂不调整
          </Button>
          {adjustment ? (
            <Button
              className="h-10 rounded-[10px] bg-primary px-5 text-[13px] font-bold text-primary-foreground hover:bg-primary/90"
              disabled={loading}
              onClick={onApply}
              type="button"
            >
              {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
              同意并更新原计划
            </Button>
          ) : (
            <Button
              className="h-10 rounded-[10px] bg-primary px-5 text-[13px] font-bold text-primary-foreground hover:bg-primary/90"
              disabled={loading}
              onClick={onPreview}
              type="button"
            >
              {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
              生成调整建议
            </Button>
          )}
        </div>
      </section>
    </div>
  )
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

function SuggestionChips({
  label,
  onSelect,
  options,
}: {
  label: string
  onSelect: (value: string) => void
  options: string[]
}) {
  return (
    <div className="mt-2">
      <p className="text-[11px] font-bold text-muted-foreground">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            className="rounded-[8px] border border-border bg-card px-3 py-1.5 text-left text-[11px] font-bold text-muted-foreground shadow-[0_6px_14px_rgba(0,0,0,0.06)] hover:border-primary hover:bg-muted"
            key={option}
            onClick={() => onSelect(option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

function FormTextarea({
  label,
  onChange,
  value,
  ...props
}: {
  label: string
  onChange: (value: string) => void
  value: string
} & Omit<ComponentProps<"textarea">, "onChange" | "value">) {
  return (
    <label className="mt-3 block">
      <span className="text-[12px] font-bold text-foreground">{label}</span>
      <textarea
        className="mt-2 min-h-20 w-full resize-none rounded-[10px] border border-border bg-card px-3 py-2 text-[13px] leading-5 outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-ring/20"
        onChange={(event) => onChange(event.target.value)}
        value={value}
        {...props}
      />
    </label>
  )
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="mt-4 flex items-start gap-2 rounded-[10px] bg-destructive/10 p-3 text-[12px] leading-5 text-destructive">
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
