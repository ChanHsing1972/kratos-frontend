import { useState, type FormEvent } from "react"
import { ChevronDown, LoaderCircle, RotateCcw } from "lucide-react"

import type { BodyMetricForm } from "@/entities/kratos/model/types"
import {
  ErrorMessage,
  FormTextarea,
} from "@/widgets/kratos/modals/ModalFormFields"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"

type BodyMetricModalProps = {
  error: string | null
  loading: boolean
  onClose: () => void
  onSubmit: (form: BodyMetricForm) => void
  open: boolean
}

const emptyBodyMetricForm: BodyMetricForm = {
  bmi: "",
  bodyFatPercentage: "",
  chestCm: "",
  energyLevel: "",
  heightCm: "",
  hipCm: "",
  notes: "",
  skeletalMuscleMassKg: "",
  sleepHours: "",
  sleepQuality: "",
  sorenessLevel: "",
  targetWeightKg: "",
  waistCm: "",
  weightKg: "",
}

export function BodyMetricModal({
  error,
  loading,
  onClose,
  onSubmit,
  open,
}: BodyMetricModalProps) {
  const [form, setForm] = useState<BodyMetricForm>(emptyBodyMetricForm)
  const [moreOpen, setMoreOpen] = useState(false)

  if (!open) {
    return null
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(form)
  }

  const updateField = (field: keyof BodyMetricForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
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
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-155">
        <form className="grid gap-5" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle className="text-[20px] font-black tracking-[-0.04em]">
              更新身体数据
            </DialogTitle>
            <DialogDescription className="text-[12px] leading-5 text-muted-foreground">
              只填写本次要更新的项目，未填写字段会保持原值。
            </DialogDescription>
          </DialogHeader>

          <section className="rounded-[14px] border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-[14px] font-black">常用体测</h3>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  体重、体脂和睡眠是最常更新的项目
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MetricInput
                label="体重"
                onChange={(value) => updateField("weightKg", value)}
                placeholder="70"
                unit="kg"
                value={form.weightKg}
              />
              <MetricInput
                label="体脂率"
                max={100}
                onChange={(value) => updateField("bodyFatPercentage", value)}
                placeholder="18.5"
                unit="%"
                value={form.bodyFatPercentage}
              />
              <MetricInput
                label="目标体重"
                onChange={(value) => updateField("targetWeightKg", value)}
                placeholder="68"
                unit="kg"
                value={form.targetWeightKg}
              />
              <RangeField
                label="睡眠时长"
                max={24}
                onChange={(value) => updateField("sleepHours", value)}
                step={0.5}
                unit="h"
                value={form.sleepHours}
              />
            </div>
          </section>

          <section className="rounded-[14px] border border-border p-4">
            <div>
              <h3 className="text-[14px] font-black">今日恢复状态</h3>
              <p className="mt-1 text-[11px] text-muted-foreground">
                滑动后才会更新对应打卡字段
              </p>
            </div>
            <div className="mt-4 grid gap-4">
              <RangeField
                label="精力"
                max={10}
                min={1}
                onChange={(value) => updateField("energyLevel", value)}
                unit="/10"
                value={form.energyLevel}
              />
              <RangeField
                label="睡眠质量"
                max={10}
                min={1}
                onChange={(value) => updateField("sleepQuality", value)}
                unit="/10"
                value={form.sleepQuality}
              />
              <RangeField
                label="酸痛"
                max={10}
                min={1}
                onChange={(value) => updateField("sorenessLevel", value)}
                unit="/10"
                value={form.sorenessLevel}
              />
            </div>
          </section>

          <section className="rounded-[14px] border border-border">
            <button
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              onClick={() => setMoreOpen((current) => !current)}
              type="button"
            >
              <div>
                <h3 className="text-[14px] font-black">更多体测项</h3>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  身高、骨骼肌、BMI 和围度
                </p>
              </div>
              <ChevronDown
                className={cn(
                  "size-4 text-muted-foreground transition-transform",
                  moreOpen && "rotate-180"
                )}
              />
            </button>
            {moreOpen ? (
              <div className="grid gap-3 border-t border-border p-4 sm:grid-cols-2">
                <MetricInput
                  label="身高"
                  onChange={(value) => updateField("heightCm", value)}
                  placeholder="175"
                  unit="cm"
                  value={form.heightCm}
                />
                <MetricInput
                  label="骨骼肌"
                  onChange={(value) => updateField("skeletalMuscleMassKg", value)}
                  placeholder="31.2"
                  unit="kg"
                  value={form.skeletalMuscleMassKg}
                />
                <MetricInput
                  label="BMI"
                  max={100}
                  onChange={(value) => updateField("bmi", value)}
                  placeholder="23.1"
                  value={form.bmi}
                />
                <MetricInput
                  label="胸围"
                  onChange={(value) => updateField("chestCm", value)}
                  placeholder="92"
                  unit="cm"
                  value={form.chestCm}
                />
                <MetricInput
                  label="腰围"
                  onChange={(value) => updateField("waistCm", value)}
                  placeholder="78"
                  unit="cm"
                  value={form.waistCm}
                />
                <MetricInput
                  label="臀围"
                  onChange={(value) => updateField("hipCm", value)}
                  placeholder="96"
                  unit="cm"
                  value={form.hipCm}
                />
              </div>
            ) : null}
          </section>

          <FormTextarea
            label="备注"
            onChange={(value) => updateField("notes", value)}
            placeholder="例如 早晨空腹称重，训练后恢复良好"
            value={form.notes}
          />

          {error ? <ErrorMessage message={error} /> : null}

          <DialogFooter className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              className="h-10 rounded-[10px] border-border px-4 text-[13px]"
              onClick={() => setForm(emptyBodyMetricForm)}
              type="button"
              variant="outline"
            >
              <RotateCcw className="size-4" />
              清空本次填写
            </Button>
            <div className="flex items-center gap-3">
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
                保存
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function MetricInput({
  label,
  max,
  onChange,
  placeholder,
  unit,
  value,
}: {
  label: string
  max?: number
  onChange: (value: string) => void
  placeholder: string
  unit?: string
  value: string
}) {
  return (
    <label className="block">
      <span className="text-[12px] font-bold text-foreground">{label}</span>
      <div className="mt-2 flex h-10 items-center rounded-[10px] border border-border bg-card focus-within:border-primary focus-within:ring-3 focus-within:ring-ring/20">
        <input
          className="min-w-0 flex-1 bg-transparent px-3 text-[13px] outline-none placeholder:text-muted-foreground"
          max={max}
          min={0}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          step="0.1"
          type="number"
          value={value}
        />
        {unit ? (
          <span className="border-l border-border px-3 text-[12px] font-bold text-muted-foreground">
            {unit}
          </span>
        ) : null}
      </div>
    </label>
  )
}

function RangeField({
  label,
  max,
  min = 0,
  onChange,
  step = 1,
  unit,
  value,
}: {
  label: string
  max: number
  min?: number
  onChange: (value: string) => void
  step?: number
  unit: string
  value: string
}) {
  const displayValue = value ? `${value}${unit}` : "未填写"
  const sliderValue = value || String(min)

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] font-bold text-foreground">{label}</span>
        <button
          className="text-[11px] font-bold text-muted-foreground hover:text-foreground"
          onClick={() => onChange("")}
          type="button"
        >
          {displayValue}
        </button>
      </div>
      <input
        className="mt-3 h-2 w-full accent-primary"
        max={max}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        step={step}
        type="range"
        value={sliderValue}
      />
      <div className="mt-1 flex justify-between text-[10px] font-semibold text-muted-foreground">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
