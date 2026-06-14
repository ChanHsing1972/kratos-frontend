import { useState, type FormEvent } from "react"
import { CalendarIcon, RotateCcw } from "lucide-react"

import type {
  BodyMetricForm,
  DietIntakeForm,
  HealthMetricForm,
} from "@/entities/kratos/model/types"
import { Button } from "@/shared/ui/button"
import { Calendar } from "@/shared/ui/calendar"
import { cn } from "@/shared/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover"
import { Spinner } from "@/shared/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import {
  ErrorMessage,
  FormInput,
  FormTextarea,
} from "@/widgets/kratos/modals/ModalFormFields"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/shared/ui/input-group"

export type AddDataCategory = "body" | "health" | "diet"

export type AddDataSubmitPayload = {
  category: AddDataCategory
  bodyForm: BodyMetricForm
  healthForm: HealthMetricForm
  dietForm: DietIntakeForm
}

type AddDataModalProps = {
  bodyForm: BodyMetricForm
  dietForm: DietIntakeForm
  error: string | null
  healthForm: HealthMetricForm
  initialTab: AddDataCategory
  loading: boolean
  onClose: () => void
  onSubmit: (payload: AddDataSubmitPayload) => void
  open: boolean
}

export function AddDataModal({
  bodyForm,
  dietForm,
  error,
  healthForm,
  initialTab,
  loading,
  onClose,
  onSubmit,
  open,
}: AddDataModalProps) {
  const [activeTab, setActiveTab] = useState<AddDataCategory>(initialTab)
  const [body, setBody] = useState(bodyForm)
  const [health, setHealth] = useState(healthForm)
  const [diet, setDiet] = useState(dietForm)

  if (!open) {
    return null
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit({
      bodyForm: body,
      category: activeTab,
      dietForm: diet,
      healthForm: health,
    })
  }

  const resetActiveTab = () => {
    if (activeTab === "body") setBody(emptyBodyMetricForm())
    if (activeTab === "health") setHealth(emptyHealthMetricForm())
    if (activeTab === "diet") setDiet(emptyDietIntakeForm())
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
    >
      <DialogContent className="grid max-h-[90svh] grid-rows-[auto_minmax(0,1fr)_auto] overflow-visible sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>添加数据</DialogTitle>
          <DialogDescription>
            只修改关心的字段，其他字段可以保持不动或清空。
          </DialogDescription>
        </DialogHeader>

        <form className="min-h-0 overflow-hidden" id="add-data-form" onSubmit={submit}>
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as AddDataCategory)}
            className="flex h-full min-h-0 flex-col"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="body">身体指标</TabsTrigger>
              <TabsTrigger value="health">健康数据</TabsTrigger>
              <TabsTrigger value="diet">饮食摄入</TabsTrigger>
            </TabsList>

            <div className="mt-2 min-h-0 overflow-y-auto px-1 pb-3 pt-1">
              <TabsContent className="mt-0 focus-visible:outline-none" value="body">
                <BodyFields
                  form={body}
                  onChange={(field, value) =>
                    setBody((current) => ({ ...current, [field]: value }))
                  }
                />

              </TabsContent>
              <TabsContent className="mt-0 focus-visible:outline-none" value="health">
                <HealthFields
                  form={health}
                  onChange={(field, value) =>
                    setHealth((current) => ({ ...current, [field]: value }))
                  }
                />
              </TabsContent>
              <TabsContent className="mt-0 focus-visible:outline-none" value="diet">
                <DietFields
                  form={diet}
                  onChange={(field, value) =>
                    setDiet((current) => ({ ...current, [field]: value }))
                  }
                />
              </TabsContent>
              {error ? <ErrorMessage message={error} /> : null}
            </div>
          </Tabs>
        </form>

        <DialogFooter className="flex-col sm:flex-row sm:items-center sm:justify-between">
          <Button onClick={resetActiveTab} type="button" variant="outline">
            <RotateCcw className="size-4" />
            清空本页
          </Button>
          <div className="flex items-center gap-2">
            <Button onClick={onClose} type="button" variant="outline">
              取消
            </Button>
            <Button disabled={loading} form="add-data-form" type="submit">
              {loading ? <Spinner /> : null}
              保存
            </Button>
          </div>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}

function BodyFields({
  form,
  onChange,
}: {
  form: BodyMetricForm
  onChange: (field: keyof BodyMetricForm, value: string) => void
}) {
  const bmi = calculateBmiPreview(form.weightKg, form.heightCm) ?? form.bmi
  return (
    <div className="grid gap-4">
      <DatePickerField
        label="测量时间"
        mode="datetime"
        onChange={(value) => onChange("measuredAt", value)}
        value={form.measuredAt}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <NumberInput label="体重 kg" onChange={(value) => onChange("weightKg", value)} value={form.weightKg} />
        <NumberInput label="身高 cm" onChange={(value) => onChange("heightCm", value)} value={form.heightCm} />
        <NumberInput label="BMI" onChange={(value) => onChange("bmi", value)} value={bmi || "自动计算"} disabled={true} />
        <NumberInput label="目标体重 kg" onChange={(value) => onChange("targetWeightKg", value)} value={form.targetWeightKg} />
        <NumberInput label="体脂率 %" onChange={(value) => onChange("bodyFatPercentage", value)} value={form.bodyFatPercentage} />
        <NumberInput label="腰围 cm" onChange={(value) => onChange("waistCm", value)} value={form.waistCm} />
        <NumberInput label="臀围 cm" onChange={(value) => onChange("hipCm", value)} value={form.hipCm} />
        <NumberInput label="大腿围 cm" onChange={(value) => onChange("thighCm", value)} value={form.thighCm} />
        <NumberInput label="小腿围 cm" onChange={(value) => onChange("calfCm", value)} value={form.calfCm} />
        <NumberInput label="胸围 cm" onChange={(value) => onChange("chestCm", value)} value={form.chestCm} />
        <NumberInput label="臂围 cm" onChange={(value) => onChange("armCm", value)} value={form.armCm} />
      </div>
      <FormTextarea
        label="备注"
        onChange={(value) => onChange("notes", value)}
        placeholder="例如 早晨空腹称重"
        value={form.notes}
      />
    </div>
  )
}

function HealthFields({
  form,
  onChange,
}: {
  form: HealthMetricForm
  onChange: (field: keyof HealthMetricForm, value: string) => void
}) {
  return (
    <div className="grid gap-4">

      <DatePickerField
        label="测量时间"
        mode="datetime"
        onChange={(value) => onChange("measuredAt", value)}
        value={form.measuredAt}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <NumberInput label="步数 步" onChange={(value) => onChange("steps", value)} value={form.steps} />
        <NumberInput label="睡眠时长 h" onChange={(value) => onChange("sleepHours", value)} value={form.sleepHours} />
        <NumberInput label="活动消耗 kcal" onChange={(value) => onChange("activeKcal", value)} value={form.activeKcal} />
        <NumberInput label="饮食摄入 kcal" onChange={(value) => onChange("dietaryKcal", value)} value={form.dietaryKcal} />
        <NumberInput label="HRV ms" onChange={(value) => onChange("hrvMs", value)} value={form.hrvMs} />
        <NumberInput label="压力 0-10" onChange={(value) => onChange("stressLevel", value)} value={form.stressLevel} />
        <NumberInput label="静息心率 bpm" onChange={(value) => onChange("restingHeartRate", value)} value={form.restingHeartRate} />
        <NumberInput label="最大摄氧量" onChange={(value) => onChange("vo2Max", value)} value={form.vo2Max} />
        <NumberInput label="血氧饱和度 %" onChange={(value) => onChange("bloodOxygenPercentage", value)} value={form.bloodOxygenPercentage} />
      </div>
      <FormTextarea
        label="备注"
        onChange={(value) => onChange("notes", value)}
        placeholder="例如 手表同步，昨晚醒来两次"
        value={form.notes}
      />
    </div>
  )
}

function DietFields({
  form,
  onChange,
}: {
  form: DietIntakeForm
  onChange: (field: keyof DietIntakeForm, value: string) => void
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <DatePickerField
          label="日期"
          onChange={(value) => onChange("mealDate", value)}
          value={form.mealDate}
        />
        <FormInput
          label="食物名称"
          onChange={(value) => onChange("name", value)}
          placeholder="例如 鸡胸肉沙拉"
          value={form.name}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <NumberInput label="重量 g" onChange={(value) => onChange("estimatedWeightG", value)} value={form.estimatedWeightG} />
        <NumberInput label="热量 kcal" onChange={(value) => onChange("estimatedKcal", value)} value={form.estimatedKcal} />
        <NumberInput label="蛋白质 g" onChange={(value) => onChange("proteinG", value)} value={form.proteinG} />
        <NumberInput label="脂肪 g" onChange={(value) => onChange("fatG", value)} value={form.fatG} />
        <NumberInput label="碳水 g" onChange={(value) => onChange("carbsG", value)} value={form.carbsG} />
      </div>
    </div>
  )
}

function DatePickerField({
  label,
  mode = "date",
  onChange,
  value,
}: {
  label: string
  mode?: "date" | "datetime"
  onChange: (value: string) => void
  value: string
}) {
  const selectedDate = parseDateValue(value)
  const timeValue = parseTimeValue(value)

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            className={cn(
              "w-full justify-start gap-2 text-left font-normal",
              !value && "text-muted-foreground",
            )}
            type="button"
            variant="outline"
          >
            <CalendarIcon className="size-4 shrink-0" />
            <span>{value ? formatDateButtonLabel(value, mode) : "选择日期"}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            initialFocus
            mode="single"
            onSelect={(date) => {
              if (!date) return
              const nextDate = localDateValue(date)
              onChange(mode === "datetime" ? `${nextDate}T${timeValue}` : nextDate)
            }}
            selected={selectedDate ?? undefined}
          />
          {mode === "datetime" ? (
            <div className="border-t p-3">
              <label className="block space-y-2">
                <input
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
                  onChange={(event) => {
                    const nextDate = value.slice(0, 10) || localDateValue(new Date())
                    onChange(`${nextDate}T${event.target.value || "00:00"}`)
                  }}
                  type="time"
                  value={timeValue}
                />
              </label>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  )
}

function parseDateValue(value: string) {
  const datePart = value.slice(0, 10)
  if (!datePart) return null
  const date = new Date(`${datePart}T00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function parseTimeValue(value: string) {
  const timePart = value.includes("T") ? value.slice(11, 16) : ""
  return timePart || "00:00"
}

function formatDateButtonLabel(value: string, mode: "date" | "datetime") {
  const datePart = value.slice(0, 10)
  if (!datePart) return "选择日期"
  if (mode === "date") return datePart
  return `${datePart} ${parseTimeValue(value)}`
}

function NumberInput({
  label,
  onChange,
  value,
  disabled = false,
}: {
  label: string
  onChange: (value: string) => void
  value: string
  disabled?: boolean
}) {
  const { name, unit } = splitNumberInputLabel(label)
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{name}</span>
      <InputGroup>
        <InputGroupInput
          className={unit ? "pr-0.5!" : undefined}
          min={0}
          onChange={(event) => onChange(event.target.value)}
          value={value}
          disabled={disabled}
        />
        {unit ? (
          <InputGroupAddon align="inline-end">
            <InputGroupText>{unit}</InputGroupText>
          </InputGroupAddon>
        ) : null}
      </InputGroup>
    </label>
  )
}

function splitNumberInputLabel(label: string) {
  const match = label.match(/^(.*)\s+(kg|cm|%|h|kcal|g|ms|bpm|步|0-10)$/)
  if (!match) return { name: label, unit: "" }
  return { name: match[1], unit: match[2] }
}

function calculateBmiPreview(weightValue: string, heightValue: string) {
  const weight = Number(weightValue)
  const height = Number(heightValue)
  if (!Number.isFinite(weight) || !Number.isFinite(height) || weight <= 0 || height <= 0) {
    return null
  }
  return (weight / (height / 100) ** 2).toFixed(1)
}

export function emptyBodyMetricForm(): BodyMetricForm {
  return {
    armCm: "",
    bmi: "",
    bodyFatPercentage: "",
    calfCm: "",
    chestCm: "",
    energyLevel: "",
    heightCm: "",
    hipCm: "",
    measuredAt: localDatetimeValue(new Date()),
    mood: "",
    notes: "",
    painNotes: "",
    skeletalMuscleMassKg: "",
    sleepHours: "",
    sleepQuality: "",
    sorenessLevel: "",
    targetWeightKg: "",
    thighCm: "",
    waistCm: "",
    weightKg: "",
  }
}

export function emptyHealthMetricForm(): HealthMetricForm {
  return {
    activeKcal: "",
    bloodOxygenPercentage: "",
    dietaryKcal: "",
    hrvMs: "",
    measuredAt: localDatetimeValue(new Date()),
    metricDate: localDateValue(new Date()),
    notes: "",
    restingHeartRate: "",
    sleepHours: "",
    steps: "",
    stressLevel: "",
    vo2Max: "",
  }
}

export function emptyDietIntakeForm(): DietIntakeForm {
  return {
    carbsG: "",
    estimatedKcal: "",
    estimatedWeightG: "",
    fatG: "",
    mealDate: localDateValue(new Date()),
    name: "",
    proteinG: "",
  }
}

function localDatetimeValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function localDateValue(date: Date) {
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}
