import { Check, ShieldCheck } from "lucide-react"

import type { SuggestedHealthData } from "@/entities/kratos/model/types"

type HealthDataConfirmationCardProps = {
  data: SuggestedHealthData
  loading: boolean
  saved: boolean
  onConfirm: () => void
}

export function HealthDataConfirmationCard({
  data,
  loading,
  onConfirm,
  saved,
}: HealthDataConfirmationCardProps) {
  const items = [
    ...Object.entries(data.profile ?? {}),
    ...Object.entries(data.body_metric ?? {}),
    ...Object.entries(data.health_metric ?? {}),
    ...Object.entries(data.checkin ?? {}),
  ].filter(([, value]) => value !== null && value !== undefined)

  return (
    <section className="mt-4 rounded-[12px] border border-border bg-muted/40 p-4">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 size-5 shrink-0" />
        <div>
          <h4 className="text-[14px] font-bold">确认记录健康数据</h4>
          <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
            我识别到了身体或恢复信息。只有您确认后才会保存并用于后续训练调整。
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map(([key, value]) => (
          <span className="rounded-md border bg-card px-2 py-1 text-[12px]" key={key}>
            {healthLabel(key)}：{String(value)}
          </span>
        ))}
      </div>
      <button
        className="mt-4 inline-flex h-9 items-center gap-2 rounded-[8px] bg-primary px-3 text-[12px] font-bold text-primary-foreground disabled:opacity-50"
        disabled={loading || saved}
        onClick={onConfirm}
        type="button"
      >
        {saved ? <Check className="size-3.5" /> : null}
        {saved ? "已保存" : loading ? "保存中..." : "确认并保存"}
      </button>
    </section>
  )
}

function healthLabel(key: string) {
  const labels: Record<string, string> = {
    age: "年龄",
    active_kcal: "活动消耗",
    arm_cm: "臂围",
    blood_oxygen_percentage: "血氧饱和度",
    body_fat_percentage: "体脂率",
    calf_cm: "小腿围",
    chest_cm: "胸围",
    dietary_kcal: "饮食摄入",
    energy_level: "精力",
    fitness_goal: "目标",
    height_cm: "身高",
    injury_history: "伤病提示",
    hrv_ms: "HRV",
    resting_heart_rate: "静息心率",
    sleep_hours: "睡眠时长",
    sleep_quality: "睡眠质量",
    soreness_level: "酸痛",
    target_weight_kg: "目标体重",
    thigh_cm: "大腿围",
    vo2_max: "最大摄氧量",
    waist_cm: "腰围",
    weight_kg: "体重",
  }
  return labels[key] ?? key
}
