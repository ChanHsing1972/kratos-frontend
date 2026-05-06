import { useState, type ComponentProps, type FormEvent } from "react"
import { Check, CircleAlert, LoaderCircle, X } from "lucide-react"

import type {
  AuthForm,
  AuthMode,
  BodyMetricForm,
  DetailPanel,
  FitnessProfile,
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
    location: "",
    fitnessStatus: "",
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
            <>
              <FormInput
                label="地区"
                onChange={(value) =>
                  setForm((current) => ({ ...current, location: value }))
                }
                placeholder="例如 Shanghai"
                value={form.location}
              />
              <FormInput
                label="训练状态"
                onChange={(value) =>
                  setForm((current) => ({ ...current, fitnessStatus: value }))
                }
                placeholder="例如 初级训练者 / 恢复期"
                value={form.fitnessStatus}
              />
            </>
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
      ? profileFormFromUser(user, profile)
      : {
          gender: "",
          age: "",
          location: "",
          sleepHours: "",
          weightKg: "",
          dietaryHabits: "",
          fitnessStatus: "",
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
        className="w-full max-w-[480px] rounded-[20px] border border-white/80 bg-white p-5 shadow-[0_22px_70px_rgba(0,0,0,0.25)]"
        onSubmit={submit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[20px] font-black tracking-[-0.04em]">
              编辑个人资料
            </h2>
            <p className="mt-2 text-[12px] leading-5 text-[#777777]">
              基础资料写入 users，身体画像写入 user_profiles。
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
            label="训练状态"
            onChange={(value) =>
              setForm((current) => ({ ...current, fitnessStatus: value }))
            }
            placeholder="例如 中级训练者"
            value={form.fitnessStatus}
          />
          <FormInput
            label="体重 (kg)"
            min={0}
            onChange={(value) =>
              setForm((current) => ({ ...current, weightKg: value }))
            }
            placeholder="例如 68.5"
            step="0.1"
            type="number"
            value={form.weightKg}
          />
          <FormInput
            label="平均睡眠 (小时)"
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
        </div>
        <FormTextarea
          label="饮食习惯"
          onChange={(value) =>
            setForm((current) => ({ ...current, dietaryHabits: value }))
          }
          placeholder="例如 高蛋白、少糖、乳糖不耐受"
          value={form.dietaryHabits}
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
    notes: "",
    sleepHours: "",
    sleepQuality: "",
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
        className="w-full max-w-[480px] rounded-[20px] border border-white/80 bg-white p-5 shadow-[0_22px_70px_rgba(0,0,0,0.25)]"
        onSubmit={submit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[20px] font-black tracking-[-0.04em]">
              更新身体数据
            </h2>
            <p className="mt-2 text-[12px] leading-5 text-[#777777]">
              体重等指标写入 body_metrics；睡眠写入 user_profiles，睡眠质量写入 agent_checkins。
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
