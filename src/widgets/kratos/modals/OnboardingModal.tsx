import { useState, type FormEvent } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

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
import { Label } from "@/shared/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
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
    id: "basic",
    title: "基础数据",
    description: "年龄、性别、身高和体重。",
  },
  {
    id: "goal",
    title: "目标偏好",
    description: "运动目标、偏好类型和活动水平。",
  },
  {
    id: "schedule",
    title: "训练能力",
    description: "每周频率、单次时长和训练经验。",
  },
  {
    id: "safety",
    title: "伤病史",
    description: "记录需要避开的动作或部位。",
  },
] as const

const GENDER_OPTIONS = ["男", "女", "非二元/其他", "不便透露"]
const GOAL_OPTIONS = ["减脂塑形", "增肌", "提升体能", "健康维持", "康复恢复"]
const WORKOUT_TYPE_OPTIONS = ["力量训练", "跑步", "HIIT", "瑜伽/拉伸", "游泳", "球类", "居家训练"]
const ACTIVITY_LEVEL_OPTIONS = ["久坐", "轻度活动", "中等活动", "高活动量"]
const EXPERIENCE_OPTIONS = ["新手", "初级", "中等", "高级"]
const DURATION_OPTIONS = [
  { label: "30 分钟", value: "30" },
  { label: "45 分钟", value: "45" },
  { label: "60 分钟", value: "60" },
  { label: "75 分钟", value: "75" },
  { label: "90 分钟", value: "90" },
  { label: "120 分钟", value: "120" },
]

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
  const [currentStep, setCurrentStep] = useState(() =>
    initialStepFromStatus(status)
  )
  const [stepError, setStepError] = useState<string | null>(null)

  if (!open) {
    return null
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validationError = validateStep(currentStep, profileForm, bodyForm)
    if (validationError) {
      setStepError(validationError)
      return
    }

    setStepError(null)
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
      return
    }

    onSubmit(profileForm, bodyForm)
  }

  const handleBack = () => {
    setStepError(null)
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
      return
    }
    onClose()
  }

  const stepInfo = STEPS[currentStep]
  const displayError = stepError ?? error

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
              {STEPS.map((step, idx) => (
                <div key={step.id} className="flex items-center gap-2">
                  <div
                    className={`flex size-5 items-center justify-center rounded-full text-[10px] ${
                      idx === currentStep
                        ? "bg-primary text-primary-foreground"
                        : idx < currentStep
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  {idx < STEPS.length - 1 ? (
                    <div className="h-px w-5 bg-border" />
                  ) : null}
                </div>
              ))}
            </div>
            <DialogTitle>{stepInfo.title}</DialogTitle>
            <DialogDescription>{stepInfo.description}</DialogDescription>
          </DialogHeader>

          <section className="min-h-[260px]">
            {currentStep === 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="性别"
                  onChange={(value) =>
                    setProfileForm((current) => ({ ...current, gender: value }))
                  }
                  options={GENDER_OPTIONS}
                  placeholder="请选择"
                  value={profileForm.gender}
                />
                <FormInput
                  label="年龄"
                  max={120}
                  min={1}
                  onChange={(value) =>
                    setProfileForm((current) => ({ ...current, age: value }))
                  }
                  placeholder="28"
                  step="1"
                  type="number"
                  value={profileForm.age}
                />
                <FormInput
                  label="身高 (cm)"
                  min={0}
                  onChange={(value) =>
                    setBodyForm((current) => ({ ...current, heightCm: value }))
                  }
                  placeholder="175"
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
                  placeholder="70"
                  step="0.1"
                  type="number"
                  value={bodyForm.weightKg}
                />
              </div>
            ) : null}

            {currentStep === 1 ? (
              <div className="grid gap-4">
                <SelectField
                  label="运动目标"
                  onChange={(value) =>
                    setProfileForm((current) => ({
                      ...current,
                      fitnessGoal: value,
                    }))
                  }
                  options={GOAL_OPTIONS}
                  placeholder="请选择"
                  value={profileForm.fitnessGoal}
                />
                <SelectField
                  label="偏好运动类型"
                  onChange={(value) =>
                    setProfileForm((current) => ({
                      ...current,
                      preferredWorkoutTypes: value,
                    }))
                  }
                  options={WORKOUT_TYPE_OPTIONS}
                  placeholder="请选择"
                  value={profileForm.preferredWorkoutTypes}
                />
                <SelectField
                  label="活动水平"
                  onChange={(value) =>
                    setProfileForm((current) => ({
                      ...current,
                      activityLevel: value,
                    }))
                  }
                  options={ACTIVITY_LEVEL_OPTIONS}
                  placeholder="请选择"
                  value={profileForm.activityLevel}
                />
              </div>
            ) : null}

            {currentStep === 2 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  label="每周运动天数"
                  max={7}
                  min={0}
                  onChange={(value) =>
                    setProfileForm((current) => ({
                      ...current,
                      availableDaysPerWeek: value,
                    }))
                  }
                  placeholder="4"
                  step="1"
                  type="number"
                  value={profileForm.availableDaysPerWeek}
                />
                <SelectField
                  label="单次训练时长"
                  onChange={(value) =>
                    setProfileForm((current) => ({
                      ...current,
                      workoutMinutesPerSession: value,
                    }))
                  }
                  options={DURATION_OPTIONS}
                  placeholder="请选择"
                  value={profileForm.workoutMinutesPerSession}
                />
                <div className="sm:col-span-2">
                  <SelectField
                    label="运动能力"
                    onChange={(value) =>
                      setProfileForm((current) => ({
                        ...current,
                        experienceLevel: value,
                      }))
                    }
                    options={EXPERIENCE_OPTIONS}
                    placeholder="请选择"
                    value={profileForm.experienceLevel}
                  />
                </div>
              </div>
            ) : null}

            {currentStep === 3 ? (
              <FormTextarea
                label="伤病史"
                onChange={(value) =>
                  setProfileForm((current) => ({
                    ...current,
                    injuryHistory: value,
                  }))
                }
                placeholder="无 / 右膝旧伤，避免跳跃"
                value={profileForm.injuryHistory}
              />
            ) : null}
          </section>

          {displayError ? <ErrorMessage message={displayError} /> : null}

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              disabled={loading}
              onClick={onClose}
              type="button"
              variant="outline"
            >
              稍后填写
            </Button>
            <div className="flex gap-2">
              <Button
                disabled={loading}
                onClick={handleBack}
                type="button"
                variant="outline"
              >
                <ChevronLeft className="size-4" />
                上一步
              </Button>
              <Button disabled={loading} type="submit">
                {loading ? <Spinner /> : null}
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

function SelectField({
  label,
  onChange,
  options,
  placeholder,
  value,
}: {
  label: string
  onChange: (value: string) => void
  options: Array<string | { label: string; value: string }>
  placeholder: string
  value: string
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Select onValueChange={onChange} value={value}>
        <SelectTrigger className="h-9 w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => {
              const item =
                typeof option === "string"
                  ? { label: option, value: option }
                  : option
              return (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              )
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

function initialStepFromStatus(status?: OnboardingStatus | null) {
  const missingProfile = new Set(status?.missing_profile_fields ?? [])
  const missingBody = new Set(status?.missing_body_metric_fields ?? [])

  if (
    missingProfile.has("age") ||
    missingProfile.has("gender") ||
    missingBody.has("height_cm") ||
    missingBody.has("weight_kg")
  ) {
    return 0
  }
  if (
    missingProfile.has("fitness_goal") ||
    missingProfile.has("preferred_workout_types") ||
    missingProfile.has("activity_level")
  ) {
    return 1
  }
  if (
    missingProfile.has("available_days_per_week") ||
    missingProfile.has("workout_minutes_per_session") ||
    missingProfile.has("experience_level")
  ) {
    return 2
  }
  if (missingProfile.has("injury_history")) {
    return 3
  }
  return 0
}

function validateStep(
  step: number,
  profileForm: ProfileForm,
  bodyForm: BodyMetricForm
) {
  const missing: string[] = []
  if (step === 0) {
    if (!profileForm.gender.trim()) missing.push("性别")
    if (!profileForm.age.trim()) missing.push("年龄")
    if (!bodyForm.heightCm.trim()) missing.push("身高")
    if (!bodyForm.weightKg.trim()) missing.push("体重")
  }
  if (step === 1) {
    if (!profileForm.fitnessGoal.trim()) missing.push("运动目标")
    if (!profileForm.preferredWorkoutTypes.trim()) missing.push("偏好运动类型")
    if (!profileForm.activityLevel.trim()) missing.push("活动水平")
  }
  if (step === 2) {
    if (!profileForm.availableDaysPerWeek.trim()) missing.push("每周运动天数")
    if (!profileForm.workoutMinutesPerSession.trim()) missing.push("单次训练时长")
    if (!profileForm.experienceLevel.trim()) missing.push("运动能力")
  }
  if (step === 3 && !profileForm.injuryHistory.trim()) {
    missing.push("伤病史")
  }

  if (missing.length) {
    return `请先填写：${missing.join("、")}`
  }
  return null
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
