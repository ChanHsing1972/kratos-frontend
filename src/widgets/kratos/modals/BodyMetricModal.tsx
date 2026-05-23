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
import { Label } from "@/shared/ui/label"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/shared/ui/input-group"
import { Field, FieldLabel } from "@/shared/ui/field"
import { Slider } from "@/shared/ui/slider"

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
      <DialogContent className="flex max-h-[90svh] flex-col overflow-hidden sm:max-w-lg no-scrollbar">
        <DialogHeader>
          <DialogTitle>
            身体数据
          </DialogTitle>
          <DialogDescription>
            记录身体数据有助于训练计划的调整和恢复状态的跟踪。
          </DialogDescription>
        </DialogHeader>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={submit}>
          <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
            <div className="grid gap-5 pb-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricInput
              label="身高"
              onChange={(value) => updateField("heightCm", value)}
              placeholder="175"
              unit="cm"
              value={form.heightCm}
            />
            <MetricInput
              label="体重"
              onChange={(value) => updateField("weightKg", value)}
              placeholder="70"
              unit="kg"
              value={form.weightKg}
            />
            <MetricInput
              label="目标体重"
              onChange={(value) => updateField("targetWeightKg", value)}
              placeholder="68"
              unit="kg"
              value={form.targetWeightKg}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
              label="睡眠时长"
              max={12}
              onChange={(value) => updateField("sleepHours", value)}
              step={0.5}
              unit=" h"
              value={form.sleepHours}
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

          <div>
            <Button
              onClick={() => setMoreOpen((current) => !current)}
              type="button"
              variant="outline"
            >
              更多项目
              <ChevronDown
                className={cn(
                  "size-4 text-muted-foreground transition-transform",
                  moreOpen && "rotate-180"
                )}
              />
            </Button>
            {moreOpen ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <MetricInput
                  label="体脂率"
                  max={100}
                  onChange={(value) => updateField("bodyFatPercentage", value)}
                  placeholder="18.5"
                  unit="%"
                  value={form.bodyFatPercentage}
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
          </div>

          <FormTextarea
            label="备注"
            onChange={(value) => updateField("notes", value)}
            placeholder="例如 早晨空腹称重，训练后恢复良好"
            value={form.notes}
          />

          {error ? <ErrorMessage message={error} /> : null}
            </div>
          </div>

          <DialogFooter className="flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <Button
              onClick={() => setForm(emptyBodyMetricForm)}
              type="button"
              variant="outline"
            >
              <RotateCcw className="size-4" />
              清空本次填写
            </Button>
            <div className="flex items-center gap-2">
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
    <Field>
      <FieldLabel htmlFor="inline-end-input">{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          max={max}
          min={0}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          value={value}
        />
        {unit && <InputGroupAddon align="inline-end">
          {unit}
        </InputGroupAddon>}
      </InputGroup>
    </Field>
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
  const sliderValueNum = value ? Number(value) : min

  return (
    // <div>
    //   <input
    //     className="mt-3 h-2 w-full accent-primary"
    //     max={max}
    //     min={min}
    //     onChange={(event) => onChange(event.target.value)}
    //     step={step}
    //     type="range"
    //     value={sliderValueNum}
    //   />
    //   <div className="mt-1 flex justify-between text-[10px] font-semibold text-muted-foreground">
    //     <span>{min}</span>
    //     <span>{max}</span>
    //   </div>
    // </div>
    <div className="mx-auto grid w-full max-w-xs gap-3">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="slider-demo-temperature">{label}</Label>
        <span className="text-sm text-muted-foreground">
          {displayValue}
        </span>
      </div>
      <Slider
        id="slider-demo-temperature"
        value={[sliderValueNum]}
        onValueChange={(val) => onChange(String(Array.isArray(val) ? val[0] : val))}
        min={min}
        max={max}
        step={step}
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
