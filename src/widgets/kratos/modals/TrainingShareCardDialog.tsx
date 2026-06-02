import type { ReactNode, RefObject } from "react"
import { useRef, useState } from "react"
import { toPng } from "html-to-image"
import { Activity, CalendarDays, Download, Flame, LoaderCircle, Trophy } from "lucide-react"
import { toast as sonnerToast } from "sonner"

import type { WorkoutShareCard } from "@/entities/kratos/model/types"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/shared/ui/dialog"
import { Spinner } from "@/shared/ui/spinner"

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
      <DialogContent className="sm:max-w-lg overflow-hidden">
        {card ? (
          <TrainingShareCardPreview card={card} captureRef={shareCardRef} />
        ) : (
          <TrainingShareCardGenerating />
        )}
        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            完成
          </Button>
          {card ? (
            <TrainingShareCardSaveButton card={card} captureRef={shareCardRef} />
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TrainingShareCardGenerating() {
  return (
    <div className="-m-5 grid min-h-[560px] place-items-center text-center text-black">
      <div>
        <div className="mx-auto grid place-items-center">
          <Spinner className="size-6 animate-spin" />
        </div>
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
  const duration = formatDurationParts(card.duration_seconds)
  const weekDuration = formatDurationParts(card.week_duration_seconds)
  const calories = formatCaloriesParts(card.calories_burned)
  const completion = clampPercent(card.completion_rate ?? (card.completed ? 100 : 0))
  // const statusLabel = card.completed ? "全部完成" : "部分完成"

  return (
    <div className="overflow-hidden bg-[#f7f3e8] -m-5" ref={captureRef}>
      <div className="relative min-h-[560px] bg-[#101010] text-white">
        <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(135deg,#f5ff66_0%,#43e2c4_48%,#8bd8ff_100%)]" />
        <div className="absolute -left-12 top-44 h-44 w-44 rounded-full bg-[#43e2c4]/25 blur-3xl" />
        <div className="absolute right-0 top-40 h-56 w-56 rounded-full bg-[#f5ff66]/20 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-[linear-gradient(0deg,rgba(67,226,196,0.18),transparent)]" />

        <div className="relative p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              {/* <div className="inline-flex items-center gap-1.5 rounded-full bg-black/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#f5ff66]">
                <Trophy className="size-3" />
                {statusLabel}
              </div> */}
              <p className=" text-[11px]  uppercase tracking-[0.2em] text-black/60">
                KRATOS TRAINING
              </p>
              <h3 className="mt-1 max-w-[20rem] text-3xl font-semibold leading-[1.04] text-black sm:text-4xl">
                {card.workout_title}
              </h3>
            </div>
            {/* <span className="grid size-12 shrink-0 place-items-center rounded-3xl bg-black text-white shadow-[0_16px_36px_rgba(0,0,0,0.22)]">
              <Sparkles className="size-6" />
            </span> */}
          </div>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-xs font-medium text-black/70 shadow-sm backdrop-blur">
            <CalendarDays className="size-3.5" />
            {formatShareDate(card.workout_date)}
          </div>

          <div className="mt-6 grid grid-cols-[1.1fr_0.9fr] gap-3">
            <HeroMetric
              label="本次训练"
              tone="light"
              value={duration.value}
              unit={duration.unit}
            />
            <HeroMetric
              label="热量消耗"
              tone="hot"
              value={calories.value}
              unit={calories.unit}
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


          <div className="mt-4 grid grid-cols-2 gap-3">
            <MiniFact label="周累计时长" value={weekDuration.value} unit={weekDuration.unit} />
            <MiniFact label="累计训练" value={String(card.total_completed_count)} unit="次" />
          </div>

          <blockquote className="mt-4 rounded-2xl bg-[#242424]/80 p-4 text-base font-semibold leading-7 text-white">
            <span className="-mb-1 block text-[11px] font-black uppercase tracking-[0.2em] text-[#f5ff66]">
              Kratos says
            </span>
            {card.coach_comment}
          </blockquote>


          <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-[11px] uppercase tracking-[0.18em] text-white/50">
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
  tone,
  unit,
  value,
}: {
  label: string
  tone: "hot" | "light"
  unit: string
  value: string
}) {
  const className =
    tone === "hot" ? "bg-[#f5ff66] text-black" : "bg-white text-black"

  return (
    <div className={`${className} rounded-3xl p-4 shadow-[0_18px_40px_rgba(0,0,0,0.16)]`}>
      <p className="text-sm font-medium text-black/55">{label}</p>
      <p className="mt-3 font-black leading-none">
        <span className="text-5xl sm:text-6xl">{value}</span>
        <span className="ml-1 align-baseline text-base font-semibold text-black/60">
          {unit}
        </span>
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
    <div className="rounded-2xl  bg-white/[0.08] p-3">
      <div className="flex items-center gap-1.5 text-white/55">
        {icon}
        <p className="text-xs">{label}</p>
      </div>
      <p className="mt-2 font-semibold leading-none text-white">
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
        <span className="text-2xl">{value}</span>
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
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary"
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
        <Spinner data-icon="inline-start" />
      ) : (
        <Download data-icon="inline-start" />
      )}
      {saving ? "保存中" : "保存图片"}
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

  const url = await toPng(node, {
    cacheBust: true,
    pixelRatio: 2,
  })
  const link = document.createElement("a")
  link.href = url
  link.download = `kratos-training-${card.workout_date}.png`
  document.body.appendChild(link)
  link.click()
  link.remove()
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
    ? { unit: "时 分", value: `${hours}:${String(restMinutes).padStart(2, "0")}` }
    : { unit: "时", value: String(hours) }
}

function formatCaloriesParts(calories: number | null | undefined) {
  if (calories === null || calories === undefined) {
    return { unit: "kcal", value: "--" }
  }
  return { unit: "kcal", value: String(Math.max(0, Math.round(calories))) }
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
