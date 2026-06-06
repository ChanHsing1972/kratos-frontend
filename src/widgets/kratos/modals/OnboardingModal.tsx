import { useState, type FormEvent } from "react"
import { ChevronRight, ChevronLeft } from "lucide-react"

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
import { Spinner } from "@/shared/ui/spinner"

type OnboardingModalProps = {
  bodyMetric: BodyMetric | null
  error: string | null
  loading: boolean
  onClose: () => void
  onSubmit: (profile: ProfileForm, bodyForm: BodyMetricForm) => void
  open: boolean
  profile: FitnessProfile | null
  status?: OnboardingStatus | null
}

const STEPS = [
  {
    id: "personal",
    title: "个人信息",
    description: "让我们先了解您的基本情况。",
  },
  {
    id: "training_exp",
    title: "训练目标与经验",
    description: "了解您的经验和目标，以便为您量身定制计划。",
  },
  {
    id: "training_habit",
    title: "日常训练偏好",
    description: "您的可分配时间和常用器械。",
  },
  {
    id: "health",
    title: "健康与饮食",
    description: "了解您的限制因素，确保训练安全。",
  },
  {
    id: "body_metrics",
    title: "身体数据",
    description: "您的初始身体数据，用于计算基础代谢和制定计划。",
  },
] as const

export function OnboardingModal({
  bodyMetric,
  error,
  loading,
  onClose,
  onSubmit,
  open,
  profile,
}: OnboardingModalProps) {
  const [profileForm, setProfileForm] = useState<ProfileForm>(() =>
    profileFormFromUser(profile)
  )
  const [bodyForm, setBodyForm] = useState<BodyMetricForm>(() =>
    bodyMetricFormFromMetric(bodyMetric)
  )
  const [currentStep, setCurrentStep] = useState(0)

  if (!open) {
    return null
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      onSubmit(profileForm, bodyForm)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
      return
    }
    onClose()
  }

  const stepInfo = STEPS[currentStep]

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose()
        }
      }}
    >
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg no-scrollbar">
        <form className="grid gap-5" onSubmit={submit}>
          <DialogHeader>
            <div className="mb-4 flex items-center gap-2 text-[12px] font-bold text-muted-foreground">
              {STEPS.map((s, idx) => (
                <div key={s.id} className="flex items-center gap-2">
                  <div
                    className={`flex size-5 items-center justify-center rounded-full text-[10px] ${idx === currentStep
                      ? "bg-primary text-primary-foreground"
                      : idx < currentStep
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                      }`}
                  >
                    {idx + 1}
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className="h-px w-4 bg-border" />
                  )}
                </div>
              ))}
            </div>
            <DialogTitle>
              {stepInfo.title}
            </DialogTitle>
            <DialogDescription>
              {stepInfo.description}
            </DialogDescription>
          </DialogHeader>

          <section className="min-h-[220px]">
            {currentStep === 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  label="性别"
                  onChange={(value) =>
                    setProfileForm((current) => ({ ...current, gender: value }))
                  }
                  placeholder="男 / 女"
                  value={profileForm.gender}
                />
                <FormInput
                  label="年龄"
                  max={120}
                  min={0}
                  step="1"
                  onChange={(value) =>
                    setProfileForm((current) => ({ ...current, age: value }))
                  }
                  placeholder="例如 28"
                  type="number"
                  value={profileForm.age}
                />
                <FormInput
                  label="地区"
                  onChange={(value) =>
                    setProfileForm((current) => ({ ...current, location: value }))
                  }
                  placeholder="例如 Shanghai"
                  value={profileForm.location}
                />
              </div>
            )}

            {currentStep === 1 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  label="训练经验"
                  onChange={(value) =>
                    setProfileForm((current) => ({
                      ...current,
                      experienceLevel: value,
                    }))
                  }
                  placeholder="新手 / 中级 / 高级"
                  value={profileForm.experienceLevel}
                />
                <FormInput
                  label="健身目标"
                  onChange={(value) =>
                    setProfileForm((current) => ({
                      ...current,
                      fitnessGoal: value,
                    }))
                  }
                  placeholder="减脂 / 增肌 / 塑形"
                  value={profileForm.fitnessGoal}
                />
                <div className="sm:col-span-2">
                  <FormTextarea
                    label="当前训练状态"
                    onChange={(value) =>
                      setProfileForm((current) => ({
                        ...current,
                        fitnessSummary: value,
                      }))
                    }
                    placeholder="例如 近期恢复一般，想先提升基础力量"
                    value={profileForm.fitnessSummary}
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  label="活动水平"
                  onChange={(value) =>
                    setProfileForm((current) => ({
                      ...current,
                      activityLevel: value,
                    }))
                  }
                  placeholder="久坐 / 中等 / 活跃"
                  value={profileForm.activityLevel}
                />
                <FormInput
                  label="首选训练类型"
                  onChange={(value) =>
                    setProfileForm((current) => ({
                      ...current,
                      preferredWorkoutTypes: value,
                    }))
                  }
                  placeholder="例如 力量训练、跑步、瑜伽"
                  value={profileForm.preferredWorkoutTypes}
                />
                <FormInput
                  label="每周可练天数"
                  max={7}
                  min={0}
                  step="1"
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
                  step="1"
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
                <div className="sm:col-span-2">
                  <FormInput
                    label="可用器械"
                    onChange={(value) =>
                      setProfileForm((current) => ({
                        ...current,
                        equipmentAccess: value,
                      }))
                    }
                    placeholder="例如 健身房、哑铃、弹力带"
                    value={profileForm.equipmentAccess}
                  />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormTextarea
                    label="伤病史或活动限制"
                    onChange={(value) =>
                      setProfileForm((current) => ({
                        ...current,
                        injuryHistory: value,
                      }))
                    }
                    placeholder="例如 右膝偶尔不适，避免跳跃"
                    value={profileForm.injuryHistory}
                  />
                  <FormTextarea
                    label="医疗情况"
                    onChange={(value) =>
                      setProfileForm((current) => ({
                        ...current,
                        medicalConditions: value,
                      }))
                    }
                    placeholder="例如 高血压 / 哮喘 / 无"
                    value={profileForm.medicalConditions}
                  />
                  <FormTextarea
                    label="饮食习惯"
                    onChange={(value) =>
                      setProfileForm((current) => ({
                        ...current,
                        dietaryHabits: value,
                      }))
                    }
                    placeholder="例如 高蛋白、适中碳水"
                    value={profileForm.dietaryHabits}
                  />
                  <FormTextarea
                    label="饮食限制"
                    onChange={(value) =>
                      setProfileForm((current) => ({
                        ...current,
                        dietaryRestrictions: value,
                      }))
                    }
                    placeholder="例如 乳糖不耐受、海鲜过敏"
                    value={profileForm.dietaryRestrictions}
                  />
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="grid gap-4 sm:grid-cols-2">
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
            )}
          </section>

          {error ? <ErrorMessage message={error} /> : null}

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              onClick={handleBack}
              type="button"
              variant="outline"
              disabled={loading}
            >
              稍后填写
            </Button>
            <div className="flex gap-2">
              <Button
                onClick={handleBack}
                type="button"
                variant="outline"
                disabled={loading}
              >
                <ChevronLeft className="size-4" />
                上一步
              </Button>

              <Button
                disabled={loading}
                type="submit"
                variant="default"
              >
                {loading ? (
                  <Spinner/>
                ) : null}
                {currentStep < STEPS.length - 1 ? (
                  <>
                    下一步
                    <ChevronRight className="size-4" />
                  </>
                ) : (
                  "完成建档"
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function bodyMetricFormFromMetric(metric: BodyMetric | null): BodyMetricForm {
  return {
    measuredAt: "",
    bmi: metric?.bmi?.toString() ?? "",
    bodyFatPercentage: metric?.body_fat_percentage?.toString() ?? "",
    chestCm: metric?.chest_cm?.toString() ?? "",
    thighCm: metric?.thigh_cm?.toString() ?? "",
    calfCm: metric?.calf_cm?.toString() ?? "",
    armCm: metric?.arm_cm?.toString() ?? "",
    hipCm: metric?.hip_cm?.toString() ?? "",
    mood: "",
    energyLevel: "",
    heightCm: metric?.height_cm?.toString() ?? "",
    notes: "",
    painNotes: "",
    skeletalMuscleMassKg: metric?.skeletal_muscle_mass_kg?.toString() ?? "",
    sleepHours: metric?.sleep_hours?.toString() ?? "",
    sleepQuality: "",
    sorenessLevel: "",
    targetWeightKg: metric?.target_weight_kg?.toString() ?? "",
    waistCm: metric?.waist_cm?.toString() ?? "",
    weightKg: metric?.weight_kg?.toString() ?? "",
  }
}
