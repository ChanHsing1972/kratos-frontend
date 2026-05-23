import { useState, type FormEvent } from "react"
import { LoaderCircle } from "lucide-react"

import { profileFormFromUser } from "@/entities/kratos/lib/domain"
import type {
  BodyMetric,
  BodyMetricForm,
  FitnessProfile,
  OnboardingStatus,
  ProfileForm,
} from "@/entities/kratos/model/types"
import {
  ErrorMessage,
  FormInput,
  FormTextarea,
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

type OnboardingModalProps = {
  bodyMetric: BodyMetric | null
  error: string | null
  loading: boolean
  onClose: () => void
  onSubmit: (profile: ProfileForm, bodyMetric: BodyMetricForm) => void
  open: boolean
  profile: FitnessProfile | null
  status: OnboardingStatus | null
}

export function OnboardingModal({
  bodyMetric,
  error,
  loading,
  onClose,
  onSubmit,
  open,
  profile,
  status,
}: OnboardingModalProps) {
  const [profileForm, setProfileForm] = useState<ProfileForm>(() =>
    profileFormFromUser(profile)
  )
  const [bodyForm, setBodyForm] = useState<BodyMetricForm>(() =>
    bodyMetricFormFromMetric(bodyMetric)
  )

  if (!open) {
    return null
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(profileForm, bodyForm)
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
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-190">
        <form className="grid gap-5" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle className="text-[21px] font-black tracking-[-0.04em]">
              建立您的 Kratos 档案
            </DialogTitle>
            <DialogDescription className="max-w-140 text-[12px] leading-5 text-muted-foreground">
              先补齐 Agent 判断强度、动作风险和饮食建议所需的最小上下文。
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 sm:grid-cols-2">
            {(status?.next_steps ?? ["完善个人信息", "记录身体数据"]).map((item) => (
              <div
                className="rounded-[10px] border border-border bg-muted/40 px-3 py-2 text-[12px] font-semibold text-foreground"
                key={item}
              >
                {item}
              </div>
            ))}
          </div>

          <section className="mt-5">
            <h3 className="text-[14px] font-black">个人信息</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <FormInput
                label="年龄"
                max={120}
                min={0}
                onChange={(value) =>
                  setProfileForm((current) => ({ ...current, age: value }))
                }
                placeholder="例如 28"
                type="number"
                value={profileForm.age}
              />
              <FormInput
                label="健身目标"
                onChange={(value) =>
                  setProfileForm((current) => ({
                    ...current,
                    fitnessGoal: value,
                  }))
                }
                placeholder="减脂 / 增肌"
                value={profileForm.fitnessGoal}
              />
              <FormInput
                label="训练经验"
                onChange={(value) =>
                  setProfileForm((current) => ({
                    ...current,
                    experienceLevel: value,
                  }))
                }
                placeholder="新手 / 中级"
                value={profileForm.experienceLevel}
              />
              <FormInput
                label="活动水平"
                onChange={(value) =>
                  setProfileForm((current) => ({
                    ...current,
                    activityLevel: value,
                  }))
                }
                placeholder="久坐 / 中等"
                value={profileForm.activityLevel}
              />
              <FormInput
                label="每周可练天数"
                max={7}
                min={0}
                onChange={(value) =>
                  setProfileForm((current) => ({
                    ...current,
                    availableDaysPerWeek: value,
                  }))
                }
                placeholder="例如 4"
                type="number"
                value={profileForm.availableDaysPerWeek}
              />
              <FormInput
                label="单次时长 (分钟)"
                min={0}
                onChange={(value) =>
                  setProfileForm((current) => ({
                    ...current,
                    workoutMinutesPerSession: value,
                  }))
                }
                placeholder="例如 45"
                type="number"
                value={profileForm.workoutMinutesPerSession}
              />
              <FormInput
                label="地区"
                onChange={(value) =>
                  setProfileForm((current) => ({ ...current, location: value }))
                }
                placeholder="例如 Shanghai"
                value={profileForm.location}
              />
              <FormInput
                label="可用器械"
                onChange={(value) =>
                  setProfileForm((current) => ({
                    ...current,
                    equipmentAccess: value,
                  }))
                }
                placeholder="健身房 / 哑铃"
                value={profileForm.equipmentAccess}
              />
              <FormInput
                label="饮食习惯"
                onChange={(value) =>
                  setProfileForm((current) => ({
                    ...current,
                    dietaryHabits: value,
                  }))
                }
                placeholder="高蛋白 / 清淡"
                value={profileForm.dietaryHabits}
              />
            </div>
            <FormTextarea
              label="伤病或限制"
              onChange={(value) =>
                setProfileForm((current) => ({
                  ...current,
                  injuryHistory: value,
                }))
              }
              placeholder="例如 右膝偶尔不适，避免跳跃"
              value={profileForm.injuryHistory}
            />
          </section>

          <section className="mt-5 border-t border-border pt-5">
            <h3 className="text-[14px] font-black">身体数据</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <FormInput
                label="身高 (cm)"
                min={0}
                onChange={(value) =>
                  setBodyForm((current) => ({ ...current, heightCm: value }))
                }
                placeholder="例如 175"
                step="0.1"
                type="number"
                value={bodyForm.heightCm}
              />
              <FormInput
                label="体重 (kg)"
                min={0}
                onChange={(value) =>
                  setBodyForm((current) => ({ ...current, weightKg: value }))
                }
                placeholder="例如 70"
                step="0.1"
                type="number"
                value={bodyForm.weightKg}
              />
              <FormInput
                label="目标体重 (kg)"
                min={0}
                onChange={(value) =>
                  setBodyForm((current) => ({
                    ...current,
                    targetWeightKg: value,
                  }))
                }
                placeholder="例如 68"
                step="0.1"
                type="number"
                value={bodyForm.targetWeightKg}
              />
              <FormInput
                label="体脂率 (%)"
                max={100}
                min={0}
                onChange={(value) =>
                  setBodyForm((current) => ({
                    ...current,
                    bodyFatPercentage: value,
                  }))
                }
                placeholder="例如 18"
                step="0.1"
                type="number"
                value={bodyForm.bodyFatPercentage}
              />
              <FormInput
                label="睡眠时长"
                max={24}
                min={0}
                onChange={(value) =>
                  setBodyForm((current) => ({ ...current, sleepHours: value }))
                }
                placeholder="例如 7.5"
                step="0.1"
                type="number"
                value={bodyForm.sleepHours}
              />
              <FormInput
                label="精力 (1-10)"
                max={10}
                min={1}
                onChange={(value) =>
                  setBodyForm((current) => ({ ...current, energyLevel: value }))
                }
                placeholder="例如 7"
                type="number"
                value={bodyForm.energyLevel}
              />
            </div>
          </section>

          {error ? <ErrorMessage message={error} /> : null}

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              className="h-10 rounded-[10px] border-border px-4 text-[13px]"
              onClick={onClose}
              type="button"
              variant="outline"
            >
              稍后再说
            </Button>
            <Button
              className="h-10 rounded-[10px] bg-primary px-5 text-[13px] font-bold text-primary-foreground hover:bg-primary/90"
              disabled={loading}
              type="submit"
            >
              {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
              完成建档
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function bodyMetricFormFromMetric(metric: BodyMetric | null): BodyMetricForm {
  return {
    bmi: metric?.bmi?.toString() ?? "",
    bodyFatPercentage: metric?.body_fat_percentage?.toString() ?? "",
    chestCm: metric?.chest_cm?.toString() ?? "",
    energyLevel: "",
    heightCm: metric?.height_cm?.toString() ?? "",
    hipCm: metric?.hip_cm?.toString() ?? "",
    notes: "",
    skeletalMuscleMassKg: metric?.skeletal_muscle_mass_kg?.toString() ?? "",
    sleepHours: metric?.sleep_hours?.toString() ?? "",
    sleepQuality: "",
    sorenessLevel: "",
    targetWeightKg: metric?.target_weight_kg?.toString() ?? "",
    waistCm: metric?.waist_cm?.toString() ?? "",
    weightKg: metric?.weight_kg?.toString() ?? "",
  }
}
