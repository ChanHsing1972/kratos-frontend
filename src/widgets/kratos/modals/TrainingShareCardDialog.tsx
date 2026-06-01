import { Download, Sparkles } from "lucide-react"
import { toast as sonnerToast } from "sonner"

import type { WorkoutShareCard } from "@/entities/kratos/model/types"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"

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
  if (!card) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>训练成果分享卡</DialogTitle>
          <DialogDescription>
            AI 已根据本次训练生成一张适合保存分享的总结卡。
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">KRATOS TRAINING</p>
              <h3 className="mt-1 text-xl font-semibold">{card.workout_title}</h3>
            </div>
            <span className="grid size-10 place-items-center rounded-md bg-primary text-primary-foreground">
              <Sparkles />
            </span>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <ShareMetric label="本次" value={formatDuration(card.duration_seconds)} />
            <ShareMetric label="本周" value={`${card.week_completed_count} 次`} />
            <ShareMetric label="连续" value={`${card.streak_days} 天`} />
          </div>

          <blockquote className="mt-5 rounded-lg bg-muted p-3 text-sm leading-6">
            {card.coach_comment}
          </blockquote>

          <div className="mt-4 flex flex-wrap gap-2">
            {card.highlights.slice(0, 4).map((item) => (
              <span className="rounded-md border px-2 py-1 text-xs" key={item}>
                {item}
              </span>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => {
              downloadShareCardPng(card)
                .then(() => sonnerToast.success("分享卡图片已保存"))
                .catch(() => sonnerToast.error("分享卡保存失败"))
            }}
            type="button"
          >
            <Download data-icon="inline-start" />
            保存图片
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ShareMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  )
}

async function downloadShareCardPng(card: WorkoutShareCard) {
  const svg = buildShareCardSvg(card)
  const image = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`)
  const canvas = document.createElement("canvas")
  canvas.width = 1080
  canvas.height = 1350
  const context = canvas.getContext("2d")
  if (!context) {
    throw new Error("Canvas is unavailable")
  }
  context.drawImage(image, 0, 0)
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png")
  )
  if (!blob) {
    throw new Error("PNG export failed")
  }
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `kratos-training-${card.workout_date}.png`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

function buildShareCardSvg(card: WorkoutShareCard) {
  const commentLines = wrapSvgText(card.coach_comment, 18).slice(0, 3)
  const titleLines = wrapSvgText(card.workout_title, 14).slice(0, 2)
  const highlightLines = card.highlights.slice(0, 4)
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <rect width="1080" height="1350" fill="#fafafa"/>
  <rect x="72" y="72" width="936" height="1206" rx="36" fill="#ffffff" stroke="#d4d4d4" stroke-width="3"/>
  <text x="118" y="154" fill="#737373" font-family="Arial, sans-serif" font-size="34" font-weight="700">KRATOS TRAINING</text>
  ${titleLines.map((line, index) => `<text x="118" y="${250 + index * 68}" fill="#171717" font-family="Arial, sans-serif" font-size="58" font-weight="700">${escapeSvg(line)}</text>`).join("")}
  <text x="118" y="392" fill="#737373" font-family="Arial, sans-serif" font-size="32">${escapeSvg(card.workout_date)}</text>
  ${metricSvg(118, 480, "本次训练", formatDuration(card.duration_seconds))}
  ${metricSvg(404, 480, "本周完成", `${card.week_completed_count} 次`)}
  ${metricSvg(690, 480, "连续天数", `${card.streak_days} 天`)}
  <rect x="118" y="710" width="844" height="196" rx="28" fill="#f5f5f5"/>
  <text x="158" y="778" fill="#525252" font-family="Arial, sans-serif" font-size="32" font-weight="700">AI 教练评价</text>
  ${commentLines.map((line, index) => `<text x="158" y="${840 + index * 44}" fill="#171717" font-family="Arial, sans-serif" font-size="36">${escapeSvg(line)}</text>`).join("")}
  <text x="118" y="994" fill="#525252" font-family="Arial, sans-serif" font-size="32" font-weight="700">训练亮点</text>
  ${highlightLines.map((line, index) => `<text x="132" y="${1060 + index * 44}" fill="#171717" font-family="Arial, sans-serif" font-size="32">• ${escapeSvg(line)}</text>`).join("")}
  <text x="118" y="1220" fill="#737373" font-family="Arial, sans-serif" font-size="28">坚持不是一次很猛，而是一次次回来。</text>
</svg>`
}

function metricSvg(x: number, y: number, label: string, value: string) {
  return `
  <rect x="${x}" y="${y}" width="250" height="154" rx="24" fill="#f5f5f5"/>
  <text x="${x + 28}" y="${y + 54}" fill="#737373" font-family="Arial, sans-serif" font-size="28">${escapeSvg(label)}</text>
  <text x="${x + 28}" y="${y + 114}" fill="#171717" font-family="Arial, sans-serif" font-size="44" font-weight="700">${escapeSvg(value)}</text>`
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.round(totalSeconds / 60)
  if (minutes < 60) {
    return `${minutes} 分`
  }
  const hours = Math.floor(minutes / 60)
  const restMinutes = minutes % 60
  return restMinutes ? `${hours}h${restMinutes}m` : `${hours}h`
}

function wrapSvgText(value: string, limit: number) {
  const chars = Array.from(value)
  const lines: string[] = []
  for (let index = 0; index < chars.length; index += limit) {
    lines.push(chars.slice(index, index + limit).join(""))
  }
  return lines.length ? lines : [value]
}

function escapeSvg(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
