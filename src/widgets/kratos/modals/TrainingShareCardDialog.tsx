import type { ReactNode, RefObject } from "react"
import { useRef, useState } from "react"
import { toPng } from "html-to-image"
import { Activity, CalendarDays, Download, Flame, Trophy, X } from "lucide-react"
import { toast as sonnerToast } from "sonner"

import type { WorkoutShareCard } from "@/entities/kratos/model/types"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogClose, DialogContent } from "@/shared/ui/dialog"
import { Spinner } from "@/shared/ui/spinner"

const SHARE_CARD_WIDTH = 500
const SHARE_CARD_MIN_HEIGHT = 560

type TrainingShareCardDialogProps = {
  card: WorkoutShareCard | null
  onOpenChange: (open: boolean) => void
  open: boolean
}

export function TrainingShareCardDialog({
  card,
  onOpenChange,
  open,
}: TrainingShareCardDialogProps) {
  const shareCardRef = useRef<HTMLDivElement>(null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-fit overflow-hidden border-0 bg-transparent p-0 shadow-none sm:max-w-none [&>button]:hidden">
        {card ? (
          <TrainingShareCardPreview card={card} captureRef={shareCardRef} />
        ) : (
          <TrainingShareCardGenerating />
        )}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          {card ? (
            <TrainingShareCardSaveButton
              card={card}
              captureRef={shareCardRef}
              className="h-9 rounded-full bg-white/85 text-black shadow-sm backdrop-blur hover:bg-white"
              showLabel={false}
            />
          ) : null}
          <DialogClose asChild>
            <Button
              aria-label="关闭分享卡"
              className="size-9 rounded-full bg-white/85 p-0 text-black shadow-sm backdrop-blur hover:bg-white"
              type="button"
              variant="ghost"
            >
              <X className="size-4" />
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function TrainingShareCardGenerating() {
  return (
    <div
      className="grid place-items-center bg-[#101010] text-center text-white"
      style={{ minHeight: SHARE_CARD_MIN_HEIGHT, width: SHARE_CARD_WIDTH }}
    >
      <div>
        <div className="mx-auto grid place-items-center">
          <Spinner className="size-6 animate-spin" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">加载中</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Kratos 正在整理本次训练数据
        </p>
      </div>
    </div>
  )
}

export function TrainingShareCardPreview({
  captureRef,
  card,
}: {
  captureRef?: RefObject<HTMLDivElement | null>
  card: WorkoutShareCard
}) {
  const duration = formatDetailedDurationParts(card.duration_seconds)
  const weekDuration = formatDurationParts(card.week_duration_seconds)
  const calories = formatCaloriesParts(card.calories_burned)
  const completion = clampPercent(
    card.completion_rate ?? (card.completed ? 100 : 0)
  )
  const hasHeartRate = Boolean(
    card.avg_bpm || card.max_bpm || card.heart_rate_zone_label
  )

  return (
    <div className="overflow-hidden">
      <div
        className="relative overflow-hidden bg-[#101010] text-white"
        ref={captureRef}
        style={{ minHeight: SHARE_CARD_MIN_HEIGHT, width: SHARE_CARD_WIDTH }}
      >
        <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(135deg,#f5ff66_0%,#43e2c4_48%,#8bd8ff_100%)]" />
        <div className="absolute top-44 -left-12 h-44 w-44 rounded-full bg-[#43e2c4]/25 blur-3xl" />
        <div className="absolute top-40 right-0 h-56 w-56 rounded-full bg-[#f5ff66]/20 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-[linear-gradient(0deg,rgba(67,226,196,0.18),transparent)]" />

        <div className="relative p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] tracking-[0.2em] text-black/60 uppercase">
                KRATOS TRAINING
              </p>
              <h3 className="mt-1 max-w-[20rem] text-4xl leading-[1.04] font-semibold text-black">
                {card.workout_title}
              </h3>
            </div>
          </div>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-xs font-medium text-black/70 shadow-sm backdrop-blur">
            <CalendarDays className="size-3.5" />
            {formatShareDate(card.workout_date)}
          </div>

          <div className="mt-6 grid grid-cols-[1.1fr_0.9fr] gap-3">
            <HeroMetric
              label="本次训练"
              segments={duration.segments}
              tone="light"
            />
            <HeroMetric
              label="热量消耗"
              segments={[calories]}
              tone="hot"
            />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3">
            <StatTile
              icon={<Activity className="size-4" />}
              label="完成度"
              value={String(completion)}
              unit="%"
            />
            <StatTile
              icon={<Flame className="size-4" />}
              label="连续"
              value={String(card.streak_days)}
              unit="天"
            />
            <StatTile
              icon={<Trophy className="size-4" />}
              label="本周"
              value={String(card.week_completed_count)}
              unit="次"
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <MiniFact
              label="周累计时长"
              value={weekDuration.value}
              unit={weekDuration.unit}
            />
            <MiniFact
              label="累计训练"
              value={String(card.total_completed_count)}
              unit="次"
            />
          </div>

          {hasHeartRate ? (
            <div className="mt-3 grid grid-cols-3 gap-3">
              <MiniFact
                label="平均心率"
                value={formatShareBpm(card.avg_bpm)}
                unit={card.avg_bpm ? "bpm" : ""}
              />
              <MiniFact
                label="最高心率"
                value={formatShareBpm(card.max_bpm)}
                unit={card.max_bpm ? "bpm" : ""}
              />
              <MiniFact
                label="主要心率区间"
                value={card.heart_rate_zone_label ?? "暂无"}
                unit=""
              />
            </div>
          ) : null}

          <blockquote className="mt-3 rounded-2xl bg-[#242424]/80 p-4 text-base leading-6 font-semibold text-white">
            <span className="mb-1 block text-[11px] font-black tracking-[0.2em] text-[#f5ff66] uppercase">
              Kratos says
            </span>
            {card.coach_comment}
          </blockquote>

          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-4 text-[11px] tracking-[0.18em] text-white/50 uppercase">
            <span>KRATOS</span>
            <span>让健身更智能，让训练更高效</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function HeroMetric({
  label,
  segments,
  tone,
}: {
  label: string
  segments: Array<{ unit: string; value: string }>
  tone: "hot" | "light"
}) {
  const className =
    tone === "hot" ? "bg-[#f5ff66] text-black" : "bg-white text-black"

  return (
    <div
      className={`${className} rounded-3xl p-4 shadow-[0_18px_40px_rgba(0,0,0,0.16)]`}
    >
      <p className="text-sm font-medium text-black/55">{label}</p>
      <p className="mt-3 flex flex-wrap items-baseline gap-x-1.5 gap-y-2 leading-none font-black">
        {segments.map((segment, index) => (
          <span className="inline-flex items-baseline" key={`${segment.unit}-${index}`}>
            <span className="text-6xl tracking-tight">
              {segment.value}
            </span>
            <span className="ml-1 text-lg font-semibold text-black/60">
              {segment.unit}
            </span>
          </span>
        ))}
      </p>
    </div>
  )
}

function StatTile({
  icon,
  label,
  unit,
  value,
}: {
  icon: ReactNode
  label: string
  unit: string
  value: string
}) {
  return (
    <div className="rounded-2xl bg-white/[0.08] p-3">
      <div className="flex items-center gap-1.5 text-white/55">
        {icon}
        <p className="text-xs">{label}</p>
      </div>
      <p className="mt-2 leading-none font-semibold text-white">
        <span className="text-3xl">{value}</span>
        <span className="ml-1 text-xs font-semibold text-white/55">{unit}</span>
      </p>
    </div>
  )
}

function MiniFact({
  label,
  unit,
  value,
}: {
  label: string
  unit: string
  value: string
}) {
  return (
    <div className="rounded-2xl bg-white/[0.06] px-4 py-3">
      <p className="text-xs text-white/50">{label}</p>
      <p className="mt-1 font-semibold text-white">
        <span className={value.length > 6 ? "text-base" : "text-2xl"}>
          {value}
        </span>
        <span className="ml-1 text-xs font-semibold text-white/50">{unit}</span>
      </p>
    </div>
  )
}

export function TrainingShareCardSaveButton({
  card,
  captureRef,
  className,
  variant,
}: {
  card: WorkoutShareCard
  captureRef: RefObject<HTMLElement | null>
  className?: string
  variant?:
  | "default"
  | "outline"
  | "ghost"
  | "link"
  | "destructive"
  | "secondary"
  showLabel?: boolean
}) {
  const [saving, setSaving] = useState(false)
  return (
    <Button
      className={className}
      disabled={saving}
      onClick={() => {
        setSaving(true)
        downloadShareCardPng(card, captureRef)
          .then(() => sonnerToast.success("分享卡图片已保存"))
          .catch(() => sonnerToast.error("分享卡保存失败"))
          .finally(() => setSaving(false))
      }}
      type="button"
      variant={variant}
    >
      {saving ? (
        <Spinner />
      ) : (
        <Download />
      )}
    </Button>
  )
}

async function downloadShareCardPng(
  card: WorkoutShareCard,
  captureRef: RefObject<HTMLElement | null>
) {
  const node = captureRef.current
  if (!node) {
    throw new Error("Share card preview is unavailable")
  }

  const width = node.scrollWidth || SHARE_CARD_WIDTH
  const height = node.scrollHeight || SHARE_CARD_MIN_HEIGHT
  const url = await toPng(node, {
    backgroundColor: "#101010",
    cacheBust: true,
    height,
    pixelRatio: 2,
    style: {
      height: `${height}px`,
      width: `${width}px`,
    },
    width,
  })
  const link = document.createElement("a")
  link.href = url
  link.download = `kratos-training-${card.workout_date}.png`
  document.body.appendChild(link)
  link.click()
  link.remove()
}

function formatDetailedDurationParts(totalSeconds: number) {
  const roundedSeconds = Math.max(0, Math.round(totalSeconds))

  if (roundedSeconds < 60) {
    return { segments: [{ unit: "秒", value: String(roundedSeconds) }] }
  }

  if (roundedSeconds < 3600) {
    const minutes = Math.floor(roundedSeconds / 60)
    const seconds = roundedSeconds % 60
    return {
      segments: [
        { unit: "分", value: String(minutes) },
        { unit: "秒", value: String(seconds) },
      ],
    }
  }

  const hours = Math.floor(roundedSeconds / 3600)
  const minutes = Math.floor((roundedSeconds % 3600) / 60)
  const seconds = roundedSeconds % 60

  return {
    segments: [
      { unit: "时", value: String(hours) },
      { unit: "分", value: String(minutes) },
      { unit: "秒", value: String(seconds) },
    ],
  }
}

function formatDurationParts(totalSeconds: number) {
  if (totalSeconds <= 0) {
    return { unit: "秒", value: "0" }
  }
  if (totalSeconds < 60) {
    return { unit: "秒", value: String(Math.round(totalSeconds)) }
  }
  const minutes = Math.round(totalSeconds / 60)
  if (minutes < 60) {
    return { unit: "分", value: String(minutes) }
  }
  const hours = Math.floor(minutes / 60)
  const restMinutes = minutes % 60
  return restMinutes
    ? {
      unit: "时 分",
      value: `${hours}:${String(restMinutes).padStart(2, "0")}`,
    }
    : { unit: "时", value: String(hours) }
}

function formatCaloriesParts(calories: number | null | undefined) {
  if (calories === null || calories === undefined) {
    return { unit: "kcal", value: "--" }
  }
  return { unit: "kcal", value: String(Math.max(0, Math.round(calories))) }
}

function formatShareBpm(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "--"
  }
  return String(Math.max(0, Math.round(value)))
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function formatShareDate(value: string) {
  const [year, month, day] = value.split("-")
  if (!year || !month || !day) {
    return value
  }
  return `${year}.${month}.${day}`
}
