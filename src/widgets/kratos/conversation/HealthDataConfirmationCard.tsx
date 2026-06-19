import { Check, HeartPulse, PencilLine, ShieldCheck } from "lucide-react"

import type { SuggestedHealthData } from "@/entities/kratos/model/types"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/shared/ui/item"
import { Skeleton } from "@/shared/ui/skeleton"
import { Spinner } from "@/shared/ui/spinner"

type HealthDataConfirmationCardProps = {
  data: SuggestedHealthData
  loading: boolean
  saved: boolean
  onConfirm: () => void
  onEdit?: () => void
}

type HealthItem = {
  key: string
  source: string
  value: unknown
}

export function HealthDataConfirmationCard({
  data,
  loading,
  onConfirm,
  onEdit,
  saved,
}: HealthDataConfirmationCardProps) {
  const items = buildHealthItems(data)
  const primaryItems = items.slice(0, 7)
  const extraCount = Math.max(0, items.length - primaryItems.length)

  return (
    <Card className="mt-4" size="default">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-4" />
          确认健康数据
        </CardTitle>
        <CardDescription>
          识别到身体或恢复信息，请确认是否保存并用于后续训练调整。
        </CardDescription>
        <CardAction>
          <Badge variant={saved ? "default" : "secondary"}>
            {saved ? "已保存" : `${items.length} 项`}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent>
        <ItemGroup data-size="sm">
          {primaryItems.map((item) => (
            <Item key={`${item.source}-${item.key}`} size="sm" variant="muted">
              <ItemMedia variant="icon">
                <HeartPulse className="size-4" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{healthLabel(item.key)}</ItemTitle>
                <ItemDescription>
                  {formatHealthValue(item.key, item.value)} · {item.source}
                </ItemDescription>
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
        {extraCount ? (
          <p className="mt-2 text-xs text-muted-foreground">
            另有 {extraCount} 项将在保存时一起写入。
          </p>
        ) : null}
      </CardContent>

      <CardFooter className="justify-end gap-2">
        <Button
          disabled={loading || saved}
          onClick={onEdit}
          type="button"
          variant="outline"
        >
          <PencilLine className="size-4" />
          编辑
        </Button>
        <Button disabled={loading || saved} onClick={onConfirm} type="button">
          {loading ? <Spinner /> : <Check className="size-4" />}
          {saved ? "已保存" : loading ? "保存中..." : "确认并保存"}
        </Button>
      </CardFooter>
    </Card>
  )
}

export function HealthDataConfirmationCardSkeleton() {
  return (
    <Card className="mt-4" size="default">
      <CardHeader>
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-[70%]" />
        <CardAction>
          <Skeleton className="h-5 w-12 rounded-full" />
        </CardAction>
      </CardHeader>
      <CardContent>
        <ItemGroup data-size="sm">
          {Array.from({ length: 3 }).map((_, index) => (
            <Item key={index} size="sm" variant="muted">
              <ItemMedia variant="icon">
                <Skeleton className="size-4 rounded-full" />
              </ItemMedia>
              <ItemContent>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-36" />
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      </CardContent>
      <CardFooter className="justify-end">
        <Skeleton className="h-8 w-24" />
      </CardFooter>
    </Card>
  )
}

function buildHealthItems(data: SuggestedHealthData): HealthItem[] {
  return [
    ...itemsFromRecord("个人档案", data.profile),
    ...itemsFromRecord("身体数据", data.body_metric),
    ...itemsFromRecord("恢复指标", data.health_metric),
    ...itemsFromRecord("训练反馈", data.checkin),
  ].filter((item) => item.value !== null && item.value !== undefined)
}

function itemsFromRecord(
  source: string,
  record: Record<string, unknown> | null | undefined
): HealthItem[] {
  return Object.entries(record ?? {}).map(([key, value]) => ({
    key,
    source,
    value,
  }))
}

function formatHealthValue(key: string, value: unknown) {
  const unitMap: Record<string, string> = {
    active_kcal: "kcal",
    arm_cm: "cm",
    body_fat_percentage: "%",
    calf_cm: "cm",
    chest_cm: "cm",
    dietary_kcal: "kcal",
    height_cm: "cm",
    hrv_ms: "ms",
    resting_heart_rate: "bpm",
    sleep_hours: "小时",
    target_weight_kg: "kg",
    thigh_cm: "cm",
    waist_cm: "cm",
    weight_kg: "kg",
  }
  const unit = unitMap[key]
  return unit ? `${String(value)} ${unit}` : String(value)
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
