import { useState, type ComponentProps, type FormEvent } from "react"
import { Check, CircleAlert, LoaderCircle, X } from "lucide-react"

import type {
  AuthForm,
  AuthMode,
  BodyMetric,
  BodyMetricForm,
  DetailPanel,
  FitnessProfile,
  OnboardingStatus,
  ProfileForm,
  TrainingPlanForm,
  TrainingPlanAdjustmentResponse,
  TrainingPlanPayload,
  UserProfile,
} from "@/types/kratos"
import { Button } from "@/components/ui/button"
import { profileFormFromUser } from "@/lib/kratos"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AuthModal({
  error,
  loading,
  mode,
  onClose,
  onModeChange,
  onSubmit,
  open,
}: {
  error: string | null
  loading: boolean
  mode: AuthMode
  onClose: () => void
  onModeChange: (mode: AuthMode) => void
  onSubmit: (form: AuthForm) => void
  open: boolean
}) {
  const [form, setForm] = useState<AuthForm>({
    username: "",
    password: "",
  })
  const [agreed, setAgreed] = useState(false)

  if (!open) {
    return null
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(form)
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
      <DialogContent className="sm:max-w-sm pt-5">
        <DialogHeader>
          <DialogTitle className="font-semibold">
            {mode === "login" ? "登录 Kratos" : "创建 Kratos 账号"}
          </DialogTitle>
          <DialogDescription>让健身更智能，让训练更高效</DialogDescription>
        </DialogHeader>
        <form id="auth-form" onSubmit={submit}>
          <FieldGroup>
            <Field>
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                name="username"
                minLength={3}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    username: event.target.value,
                  }))
                }
                placeholder="至少 3 个字符"
                required
                value={form.username}
              />
            </Field>
            <Field>
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                name="password"
                minLength={6}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                placeholder="至少 6 个字符"
                required
                type="password"
                value={form.password}
              />
            </Field>
            <Field orientation="horizontal" className="text-sm text-muted-foreground">
              <Checkbox
                checked={agreed}
                id="terms-checkbox-2"
                name="terms-checkbox-2"
                onCheckedChange={(checked) => setAgreed(checked === true)}
              />
              我已阅读并同意《用户协议》和《隐私政策》
            </Field>
            {error ? (
              <Field>
                <DialogDescription role="alert">{error}</DialogDescription>
              </Field>
            ) : null}
          </FieldGroup>
        </form>
        <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0 ">
          <Button
            disabled={loading || !agreed}
            form="auth-form"
            type="submit"
          >
            {loading
              ? "加载中..."
              : mode === "login"
                ? "登录"
                : "注册并登录"}
          </Button>
          <Button
            onClick={() =>
              onModeChange(mode === "login" ? "register" : "login")
            }
            type="button"
            variant="outline"
          >
            {mode === "login" ? "注册" : "登录"}
          </Button>

        </DialogFooter>
      </DialogContent>
    </Dialog >
  )
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
}: {
  bodyMetric: BodyMetric | null
  error: string | null
  loading: boolean
  onClose: () => void
  onSubmit: (profile: ProfileForm, bodyMetric: BodyMetricForm) => void
  open: boolean
  profile: FitnessProfile | null
  status: OnboardingStatus | null
}) {
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4 backdrop-blur-[2px]">
      <form
        className="max-h-[92svh] w-full max-w-[760px] overflow-y-auto rounded-[20px] border border-white/80 bg-white p-5 shadow-[0_22px_70px_rgba(0,0,0,0.25)]"
        onSubmit={submit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[21px] font-black tracking-[-0.04em]">
              建立你的 Kratos 档案
            </h2>
            <p className="mt-2 max-w-[560px] text-[12px] leading-5 text-[#666666]">
              先补齐 Agent 判断强度、动作风险和饮食建议所需的最小上下文。
            </p>
          </div>
          <button
            className="grid size-8 place-items-center rounded-full hover:bg-[#f4f4f4] focus-visible:ring-2 focus-visible:ring-[#111111]/30 focus-visible:outline-none"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {(status?.next_steps ?? ["完善个人信息", "记录身体数据"]).map((item) => (
            <div
              className="rounded-[10px] border border-[#eeeeee] bg-[#fbfbfa] px-3 py-2 text-[12px] font-semibold text-[#333333]"
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

        <section className="mt-5 border-t border-[#eeeeee] pt-5">
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
              min={0}
              max={100}
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
              min={0}
              max={24}
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
              min={1}
              max={10}
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

        <div className="mt-5 flex items-center justify-end gap-3">
          <Button
            className="h-10 rounded-[10px] border-[#dedede] px-4 text-[13px]"
            onClick={onClose}
            type="button"
            variant="outline"
          >
            稍后再说
          </Button>
          <Button
            className="h-10 rounded-[10px] bg-[#111111] px-5 text-[13px] font-bold text-white hover:bg-[#111111]/90"
            disabled={loading}
            type="submit"
          >
            {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
            完成建档
          </Button>
        </div>
      </form>
    </div>
  )
}

export function ProfileEditModal({
  error,
  loading,
  onClose,
  onSubmit,
  open,
  profile,
  user,
}: {
  error: string | null
  loading: boolean
  onClose: () => void
  onSubmit: (form: ProfileForm) => void
  open: boolean
  profile: FitnessProfile | null
  user: UserProfile | null
}) {
  const [form, setForm] = useState<ProfileForm>(() =>
    user
      ? profileFormFromUser(profile)
      : {
        gender: "",
        age: "",
        location: "",
        fitnessGoal: "",
        fitnessSummary: "",
        activityLevel: "",
        experienceLevel: "",
        availableDaysPerWeek: "",
        workoutMinutesPerSession: "",
        equipmentAccess: "",
        injuryHistory: "",
        medicalConditions: "",
        preferredWorkoutTypes: "",
        dietaryHabits: "",
        dietaryRestrictions: "",
      }
  )

  if (!open || !user) {
    return null
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(form)
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4 backdrop-blur-[2px]">
      <form
        className="max-h-[90svh] w-full max-w-[560px] overflow-y-auto rounded-[20px] border border-white/80 bg-white p-5 shadow-[0_22px_70px_rgba(0,0,0,0.25)]"
        onSubmit={submit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[20px] font-black tracking-[-0.04em]">
              编辑个人资料
            </h2>
            {/* <p className="mt-2 text-[12px] leading-5 text-[#777777]">
              这些内容只写入 user_profiles；体重、睡眠等动态指标请到身体数据里更新。
            </p> */}
          </div>
          <button
            className="grid size-8 place-items-center rounded-full hover:bg-[#f4f4f4] focus-visible:ring-2 focus-visible:ring-[#111111]/30 focus-visible:outline-none"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <FormInput
            label="性别"
            onChange={(value) =>
              setForm((current) => ({ ...current, gender: value }))
            }
            placeholder="例如 male / female"
            value={form.gender}
          />
          <FormInput
            label="年龄"
            max={120}
            min={0}
            onChange={(value) =>
              setForm((current) => ({ ...current, age: value }))
            }
            placeholder="例如 28"
            type="number"
            value={form.age}
          />
          <FormInput
            label="地区"
            onChange={(value) =>
              setForm((current) => ({ ...current, location: value }))
            }
            placeholder="例如 Shanghai"
            value={form.location}
          />
          <FormInput
            label="健身目标"
            onChange={(value) =>
              setForm((current) => ({ ...current, fitnessGoal: value }))
            }
            placeholder="例如 减脂 / 增肌 / 塑形"
            value={form.fitnessGoal}
          />
          <FormInput
            label="活动水平"
            onChange={(value) =>
              setForm((current) => ({ ...current, activityLevel: value }))
            }
            placeholder="例如 久坐 / 中等 / 高"
            value={form.activityLevel}
          />
          <FormInput
            label="训练经验"
            onChange={(value) =>
              setForm((current) => ({ ...current, experienceLevel: value }))
            }
            placeholder="例如 新手 / 中级"
            value={form.experienceLevel}
          />
          <FormInput
            label="每周可练天数"
            max={7}
            min={0}
            onChange={(value) =>
              setForm((current) => ({ ...current, availableDaysPerWeek: value }))
            }
            placeholder="例如 4"
            type="number"
            value={form.availableDaysPerWeek}
          />
          <FormInput
            label="单次训练时长 (分钟)"
            min={0}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                workoutMinutesPerSession: value,
              }))
            }
            placeholder="例如 45"
            type="number"
            value={form.workoutMinutesPerSession}
          />
          <FormInput
            label="可用器械"
            onChange={(value) =>
              setForm((current) => ({ ...current, equipmentAccess: value }))
            }
            placeholder="例如 健身房、哑铃、弹力带"
            value={form.equipmentAccess}
          />
          <FormInput
            label="偏好训练"
            onChange={(value) =>
              setForm((current) => ({ ...current, preferredWorkoutTypes: value }))
            }
            placeholder="例如 力量训练、跑步、瑜伽"
            value={form.preferredWorkoutTypes}
          />
        </div>
        <FormTextarea
          label="当前训练状态"
          onChange={(value) =>
            setForm((current) => ({ ...current, fitnessSummary: value }))
          }
          placeholder="例如 近期恢复一般，想先提升基础力量"
          value={form.fitnessSummary}
        />
        <FormTextarea
          label="伤病史"
          onChange={(value) =>
            setForm((current) => ({ ...current, injuryHistory: value }))
          }
          placeholder="例如 右膝偶尔不适，避免跳跃"
          value={form.injuryHistory}
        />
        <FormTextarea
          label="医疗情况"
          onChange={(value) =>
            setForm((current) => ({ ...current, medicalConditions: value }))
          }
          placeholder="例如 无 / 高血压 / 哮喘"
          value={form.medicalConditions}
        />
        <FormTextarea
          label="饮食习惯"
          onChange={(value) =>
            setForm((current) => ({ ...current, dietaryHabits: value }))
          }
          placeholder="例如 高蛋白、少糖、乳糖不耐受"
          value={form.dietaryHabits}
        />
        <FormTextarea
          label="饮食限制"
          onChange={(value) =>
            setForm((current) => ({ ...current, dietaryRestrictions: value }))
          }
          placeholder="例如 乳糖不耐受、海鲜过敏、不吃牛肉"
          value={form.dietaryRestrictions}
        />

        {error ? <ErrorMessage message={error} /> : null}

        <div className="mt-5 flex items-center justify-end gap-3">
          <Button
            className="h-10 rounded-[10px] border-[#dedede] px-4 text-[13px]"
            onClick={onClose}
            type="button"
            variant="outline"
          >
            取消
          </Button>
          <Button
            className="h-10 rounded-[10px] bg-[#111111] px-5 text-[13px] font-bold text-white hover:bg-[#111111]/90"
            disabled={loading}
            type="submit"
          >
            {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
            保存更新
          </Button>
        </div>
      </form>
    </div>
  )
}

export function BodyMetricModal({
  error,
  loading,
  onClose,
  onSubmit,
  open,
}: {
  error: string | null
  loading: boolean
  onClose: () => void
  onSubmit: (form: BodyMetricForm) => void
  open: boolean
}) {
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
        className="max-h-[90svh] w-full max-w-[560px] overflow-y-auto rounded-[20px] border border-white/80 bg-white p-5 shadow-[0_22px_70px_rgba(0,0,0,0.25)]"
        onSubmit={submit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[20px] font-black tracking-[-0.04em]">
              更新身体数据
            </h2>
            <p className="mt-2 text-[12px] leading-5 text-[#777777]">
              体测和睡眠时长写入 body_metrics；精力、睡眠质量和酸痛写入 agent_checkins。
            </p>
          </div>
          <button
            className="grid size-8 place-items-center rounded-full hover:bg-[#f4f4f4] focus-visible:ring-2 focus-visible:ring-[#111111]/30 focus-visible:outline-none"
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
            className="h-10 rounded-[10px] border-[#dedede] px-4 text-[13px]"
            onClick={onClose}
            type="button"
            variant="outline"
          >
            取消
          </Button>
          <Button
            className="h-10 rounded-[10px] bg-[#111111] px-5 text-[13px] font-bold text-white hover:bg-[#111111]/90"
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

export function TrainingPlanModal({
  draft,
  error,
  loading,
  onClose,
  onSubmit,
  open,
}: {
  draft: TrainingPlanPayload | null
  error: string | null
  loading: boolean
  onClose: () => void
  onSubmit: (payload: TrainingPlanPayload) => void
  open: boolean
}) {
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
        className="max-h-[92svh] w-full max-w-[760px] overflow-y-auto rounded-[20px] border border-white/80 bg-white p-5 shadow-[0_22px_70px_rgba(0,0,0,0.25)]"
        onSubmit={submit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[20px] font-black tracking-[-0.04em]">
              撰写训练计划
            </h2>
            <p className="mt-2 text-[12px] leading-5 text-[#777777]">
              保存后会写入后端 /plans，训练页和打卡记录都会读取这份真实计划。
            </p>
          </div>
          <button
            className="grid size-8 place-items-center rounded-full hover:bg-[#f4f4f4] focus-visible:ring-2 focus-visible:ring-[#111111]/30 focus-visible:outline-none"
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
            <span className="text-[12px] font-bold text-[#333333]">状态</span>
            <select
              className="mt-1 h-10 w-full rounded-[10px] border border-[#dedede] bg-white px-3 text-[13px] outline-none focus:border-[#111111]"
              onChange={(event) =>
                setForm((current) => ({ ...current, status: event.target.value }))
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
              setForm((current) => ({ ...current, nutritionGuidance: value }))
            }
            placeholder="训练日前后补给、蛋白质、水分等"
            rows={4}
            value={form.nutritionGuidance}
          />
          <FormTextarea
            label="恢复与风险提醒"
            onChange={(value) =>
              setForm((current) => ({ ...current, recoveryGuidance: value }))
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
            className="h-10 rounded-[10px] border-[#dedede] px-4 text-[13px]"
            onClick={onClose}
            type="button"
            variant="outline"
          >
            取消
          </Button>
          <Button
            className="h-10 rounded-[10px] bg-[#111111] px-5 text-[13px] font-bold text-white hover:bg-[#111111]/90"
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
}: {
  adjustment: TrainingPlanAdjustmentResponse | null
  error: string | null
  feedback: string
  loading: boolean
  onApply: () => void
  onClose: () => void
  onFeedbackChange: (value: string) => void
  onPreview: () => void
  open: boolean
}) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4 backdrop-blur-[2px]">
      <section className="max-h-[90svh] w-full max-w-[640px] overflow-y-auto rounded-[20px] border border-white/80 bg-white p-5 shadow-[0_22px_70px_rgba(0,0,0,0.25)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[20px] font-black tracking-[-0.04em]">
              训练反馈
            </h2>
            <p className="mt-2 text-[12px] leading-5 text-[#777777]">
              Kratos 会基于这次反馈生成原计划的调整建议，只有你同意后才会更新计划。
            </p>
          </div>
          <button
            className="grid size-8 place-items-center rounded-full hover:bg-[#f4f4f4] focus-visible:ring-2 focus-visible:ring-[#111111]/30 focus-visible:outline-none"
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
          <div className="mt-4 rounded-[12px] border border-[#e8e8e8] bg-[#fafafa] p-4">
            <h3 className="text-[14px] font-black">调整建议</h3>
            <div className="mt-3 flex flex-col gap-2">
              {adjustment.rationale.map((item) => (
                <div className="flex gap-2 text-[12px] leading-5 text-[#555555]" key={item}>
                  <Check className="mt-0.5 size-3.5 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-[10px] bg-white p-3 text-[12px] leading-5 text-[#555555]">
              将更新原计划的摘要、周安排、营养或恢复建议；不会创建新计划。
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex items-center justify-end gap-3">
          <Button
            className="h-10 rounded-[10px] border-[#dedede] px-4 text-[13px]"
            onClick={onClose}
            type="button"
            variant="outline"
          >
            暂不调整
          </Button>
          {adjustment ? (
            <Button
              className="h-10 rounded-[10px] bg-[#111111] px-5 text-[13px] font-bold text-white hover:bg-[#111111]/90"
              disabled={loading}
              onClick={onApply}
              type="button"
            >
              {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
              同意并更新原计划
            </Button>
          ) : (
            <Button
              className="h-10 rounded-[10px] bg-[#111111] px-5 text-[13px] font-bold text-white hover:bg-[#111111]/90"
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

export function DetailModal({
  onClose,
  panel,
}: {
  onClose: () => void
  panel: DetailPanel | null
}) {
  if (!panel) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/30 px-4 backdrop-blur-[2px]">
      <section className="w-full max-w-[430px] rounded-[18px] border border-white/80 bg-white p-5 shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[18px] font-black tracking-[-0.04em]">
              {panel.title}
            </h2>
            <p className="mt-3 text-[13px] leading-6 text-[#555555]">
              {panel.body}
            </p>
          </div>
          <button
            className="grid size-8 place-items-center rounded-full hover:bg-[#f4f4f4] focus-visible:ring-2 focus-visible:ring-[#111111]/30 focus-visible:outline-none"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
        {panel.items ? (
          <div className="mt-4 flex flex-col gap-2">
            {panel.items.map((item) => (
              <div
                className="flex items-start gap-3 rounded-[10px] bg-[#f6f6f5] p-3 text-[12px] leading-5 text-[#444444]"
                key={item}
              >
                <Check className="mt-0.5 size-4 shrink-0 text-[#111111]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}

export function Toast({ message }: { message: string | null }) {
  if (!message) {
    return null
  }

  return (
    <div className="fixed right-5 bottom-5 z-[60] rounded-full border border-[#e2e2e2] bg-white px-4 py-3 text-[12px] font-semibold text-[#222222] shadow-[0_12px_35px_rgba(0,0,0,0.18)]">
      {message}
    </div>
  )
}

function bodyMetricFormFromMetric(metric: BodyMetric | null): BodyMetricForm {
  return {
    bmi: metric?.bmi?.toString() ?? "",
    bodyFatPercentage: metric?.body_fat_percentage?.toString() ?? "",
    energyLevel: "",
    heightCm: metric?.height_cm?.toString() ?? "",
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
      <p className="text-[11px] font-bold text-[#8a8a8a]">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            className="rounded-[8px] border border-[#e6e6e6] bg-white px-3 py-1.5 text-left text-[11px] font-bold text-[#555555] shadow-[0_6px_14px_rgba(0,0,0,0.06)] hover:border-[#bfc7b7] hover:bg-[#f8faf6]"
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

function FormInput({
  label,
  onChange,
  value,
  ...props
}: {
  label: string
  onChange: (value: string) => void
  value: string
} & Omit<ComponentProps<"input">, "onChange" | "value">) {
  return (
    <label className="block">
      <span className="text-[12px] font-bold text-[#333333]">{label}</span>
      <input
        className="mt-2 h-10 w-full rounded-[10px] border border-[#e4e4e4] bg-white px-3 text-[13px] outline-none transition-colors placeholder:text-[#aaaaaa] focus:border-[#111111] focus:shadow-[0_0_0_3px_rgba(17,17,17,0.08)]"
        onChange={(event) => onChange(event.target.value)}
        value={value}
        {...props}
      />
    </label>
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
      <span className="text-[12px] font-bold text-[#333333]">{label}</span>
      <textarea
        className="mt-2 min-h-20 w-full resize-none rounded-[10px] border border-[#e4e4e4] bg-white px-3 py-2 text-[13px] leading-5 outline-none transition-colors placeholder:text-[#aaaaaa] focus:border-[#111111] focus:shadow-[0_0_0_3px_rgba(17,17,17,0.08)]"
        onChange={(event) => onChange(event.target.value)}
        value={value}
        {...props}
      />
    </label>
  )
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="mt-4 flex items-start gap-2 rounded-[10px] bg-[#fff4f2] p-3 text-[12px] leading-5 text-[#a13b2b]">
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
