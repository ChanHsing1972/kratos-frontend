import { useState, type FormEvent } from "react"
import { LoaderCircle, X } from "lucide-react"

import type { BodyMetricForm } from "@/entities/kratos/model/types"
import {
  ErrorMessage,
  FormInput,
  FormTextarea,
} from "@/widgets/kratos/modals/ModalFormFields"
import { Button } from "@/shared/ui/button"

type BodyMetricModalProps = {
  error: string | null
  loading: boolean
  onClose: () => void
  onSubmit: (form: BodyMetricForm) => void
  open: boolean
}

export function BodyMetricModal({
  error,
  loading,
  onClose,
  onSubmit,
  open,
}: BodyMetricModalProps) {
  const [form, setForm] = useState<BodyMetricForm>({
    bmi: "",
    bodyFatPercentage: "",
    energyLevel: "",
    heightCm: "",
    notes: "",
    skeletalMuscleMassKg: "",
    sleepHours: "",
    sleepQuality: "",
    sorenessLevel: "",
    targetWeightKg: "",
    waistCm: "",
    weightKg: "",
  })

  if (!open) {
    return null
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(form)
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4 backdrop-blur-[2px]">
      <form
        className="max-h-[90svh] w-full max-w-[560px] overflow-y-auto rounded-[20px] border border-border bg-card p-5 shadow-[0_22px_70px_rgba(0,0,0,0.25)]"
        onSubmit={submit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[20px] font-black tracking-[-0.04em]">
              更新身体数据
            </h2>
            <p className="mt-2 text-[12px] leading-5 text-muted-foreground">
              体测和睡眠时长写入 body_metrics；精力、睡眠质量和酸痛写入 agent_checkins。
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
            label="身高 (cm)"
            min={0}
            onChange={(value) =>
              setForm((current) => ({ ...current, heightCm: value }))
            }
            placeholder="例如 175"
            step="0.1"
            type="number"
            value={form.heightCm}
          />
          <FormInput
            label="体重 (kg)"
            min={0}
            onChange={(value) =>
              setForm((current) => ({ ...current, weightKg: value }))
            }
            placeholder="例如 70"
            step="0.1"
            type="number"
            value={form.weightKg}
          />
          <FormInput
            label="目标体重 (kg)"
            min={0}
            onChange={(value) =>
              setForm((current) => ({ ...current, targetWeightKg: value }))
            }
            placeholder="例如 68"
            step="0.1"
            type="number"
            value={form.targetWeightKg}
          />
          <FormInput
            label="体脂率 (%)"
            max={100}
            min={0}
            onChange={(value) =>
              setForm((current) => ({ ...current, bodyFatPercentage: value }))
            }
            placeholder="例如 18.5"
            step="0.1"
            type="number"
            value={form.bodyFatPercentage}
          />
          <FormInput
            label="骨骼肌 (kg)"
            min={0}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                skeletalMuscleMassKg: value,
              }))
            }
            placeholder="例如 31.2"
            step="0.1"
            type="number"
            value={form.skeletalMuscleMassKg}
          />
          <FormInput
            label="BMI"
            min={0}
            onChange={(value) =>
              setForm((current) => ({ ...current, bmi: value }))
            }
            placeholder="例如 23.1"
            step="0.1"
            type="number"
            value={form.bmi}
          />
          <FormInput
            label="腰围 (cm)"
            min={0}
            onChange={(value) =>
              setForm((current) => ({ ...current, waistCm: value }))
            }
            placeholder="例如 78"
            step="0.1"
            type="number"
            value={form.waistCm}
          />
          <FormInput
            label="睡眠时长 (小时)"
            max={24}
            min={0}
            onChange={(value) =>
              setForm((current) => ({ ...current, sleepHours: value }))
            }
            placeholder="例如 7.5"
            step="0.1"
            type="number"
            value={form.sleepHours}
          />
          <FormInput
            label="精力 (1-10)"
            max={10}
            min={1}
            onChange={(value) =>
              setForm((current) => ({ ...current, energyLevel: value }))
            }
            placeholder="例如 7"
            type="number"
            value={form.energyLevel}
          />
          <FormInput
            label="睡眠质量 (1-10)"
            max={10}
            min={1}
            onChange={(value) =>
              setForm((current) => ({ ...current, sleepQuality: value }))
            }
            placeholder="例如 8"
            type="number"
            value={form.sleepQuality}
          />
          <FormInput
            label="酸痛 (1-10)"
            max={10}
            min={1}
            onChange={(value) =>
              setForm((current) => ({ ...current, sorenessLevel: value }))
            }
            placeholder="例如 3"
            type="number"
            value={form.sorenessLevel}
          />
        </div>
        <FormTextarea
          label="备注"
          onChange={(value) =>
            setForm((current) => ({ ...current, notes: value }))
          }
          placeholder="例如 早晨空腹称重，训练后恢复良好"
          value={form.notes}
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
            保存身体数据
          </Button>
        </div>
      </form>
    </div>
  )
}
