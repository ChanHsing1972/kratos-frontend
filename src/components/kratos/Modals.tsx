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
  UserProfile,
} from "@/types/kratos"
import { Button } from "@/components/ui/button"
import { API_BASE_URL } from "@/lib/api"
import { cn } from "@/lib/utils"
import { profileFormFromUser } from "@/lib/kratos"

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
        className="w-full max-w-[420px] rounded-[20px] border border-white/80 bg-white p-5 shadow-[0_22px_70px_rgba(0,0,0,0.25)]"
        onSubmit={submit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[20px] font-black tracking-[-0.04em]">
              {mode === "login" ? "登录 Kratos" : "创建 Kratos 账号"}
            </h2>
            <p className="mt-2 text-[12px] leading-5 text-[#777777]">
              接口已连接到本地后端：{API_BASE_URL}
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

        <div className="mt-5 grid grid-cols-2 rounded-[10px] bg-[#f3f3f2] p-1">
          <button
            className={cn(
              "h-9 rounded-[8px] text-[13px] font-bold focus-visible:ring-2 focus-visible:ring-[#111111]/30 focus-visible:outline-none",
              mode === "login" && "bg-white shadow-sm"
            )}
            onClick={() => onModeChange("login")}
            type="button"
          >
            登录
          </button>
          <button
            className={cn(
              "h-9 rounded-[8px] text-[13px] font-bold focus-visible:ring-2 focus-visible:ring-[#111111]/30 focus-visible:outline-none",
              mode === "register" && "bg-white shadow-sm"
            )}
            onClick={() => onModeChange("register")}
            type="button"
          >
            注册
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <FormInput
            label="用户名"
            minLength={3}
            onChange={(value) =>
              setForm((current) => ({ ...current, username: value }))
            }
            placeholder="至少 3 个字符"
            required
            value={form.username}
          />
          <FormInput
            label="密码"
            minLength={6}
            onChange={(value) =>
              setForm((current) => ({ ...current, password: value }))
            }
            placeholder="至少 6 个字符"
            required
            type="password"
            value={form.password}
          />
          {mode === "register" ? (
            <p className="rounded-[10px] bg-[#f6f6f5] px-3 py-2 text-[12px] leading-5 text-[#666666]">
              注册只创建账号；登录后会进入 2 分钟建档，把个人信息和身体数据分别写入正确的数据表。
            </p>
          ) : null}
        </div>

        {error ? <ErrorMessage message={error} /> : null}

        <Button
          className="mt-5 h-11 w-full rounded-[10px] bg-[#111111] text-[14px] font-bold text-white hover:bg-[#111111]/90"
          disabled={loading}
          type="submit"
        >
          {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {mode === "login" ? "登录" : "注册并登录"}
        </Button>
      </form>
    </div>
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
            <p className="mt-2 text-[12px] leading-5 text-[#777777]">
              这些内容只写入 user_profiles；体重、睡眠等动态指标请到身体数据里更新。
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
