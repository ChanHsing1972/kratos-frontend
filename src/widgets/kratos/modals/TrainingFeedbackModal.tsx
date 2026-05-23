import type { ComponentProps } from "react"
import { Check, CircleAlert, LoaderCircle } from "lucide-react"

import type { TrainingPlanAdjustmentResponse } from "@/entities/kratos/model/types"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Field } from "@/shared/ui/field"
import { Textarea } from "@/shared/ui/textarea"

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
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            训练反馈
          </DialogTitle>
          <DialogDescription>
            Kratos 将根据您的反馈调整计划。
          </DialogDescription>
        </DialogHeader>

        <FormTextarea
          label="本次训练反馈"
          onChange={onFeedbackChange}
          placeholder="训练结束，感觉如何？"
          rows={5}
          value={feedback}
        />
        {!adjustment && <SuggestionChips
          label="快速反馈"
          onSelect={(value) => onFeedbackChange(appendText(feedback, value))}
          options={[
            "今天整体很轻松，可以适当加一点强度。",
            "今天比较累，动作质量下降，建议下次降低训练量。",
            "膝盖有点不适，需要减少冲击和深屈膝动作。",
            "提前结束训练，今天时间和体力都不够。",
            "训练前补给不足，后半段有点没力。",
          ]}
        />}

        {error ? <ErrorMessage message={error} /> : null}

        {adjustment ? (
          <div className="rounded-[12px] border border-border bg-muted/40 p-4">
            <h3 className="text-[14px] font-medium">调整建议</h3>
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
          </div>
        ) : null}

        <DialogFooter>
          <Button
            onClick={onClose}
            type="button"
            variant="outline"
          >
            暂不调整
          </Button>
          {adjustment ? (
            <Button
              disabled={loading}
              onClick={onApply}
              type="button"
            >
              {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
              同意并更新计划
            </Button>
          ) : (
            <Button
              disabled={loading}
              onClick={onPreview}
              type="button"
            >
              {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
              生成调整建议
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  onSelect,
  options,
}: {
  label: string
  onSelect: (value: string) => void
  options: string[]
}) {
  return (
    <Field>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            className="border border-border rounded-full text-left text-[12px] font-normal text-muted-foreground "
            key={option}
            onClick={() => onSelect(option)}
            type="button"
            variant="outline"
          >
            {option}
          </Button>
        ))}
      </div>
    </Field>
  )
}

function FormTextarea({
  onChange,
  value,
  ...props
}: {
  label: string
  onChange: (value: string) => void
  value: string
} & Omit<ComponentProps<"textarea">, "onChange" | "value">) {
  return (
    <Field>
      <Textarea
        className="min-h-25"
        onChange={(event) => onChange(event.target.value)}
        value={value}
        {...props}
      />
    </Field>
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
