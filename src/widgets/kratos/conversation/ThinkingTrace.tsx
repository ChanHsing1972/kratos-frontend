import { useEffect, useState } from "react"
import { Check, ChevronRight, Sparkles } from "lucide-react"

import type { AgentTraceStep } from "@/entities/kratos/model/types"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { ScrollArea } from "@/shared/ui/scroll-area"

type ThinkingCardProps = {
  completedAt?: number
  expanded: boolean
  onToggle: () => void
  startedAt?: number
  steps: AgentTraceStep[]
  streaming?: boolean
}

export function ThinkingCard({
  completedAt,
  expanded,
  startedAt,
  steps,
  streaming,
  onToggle,
}: ThinkingCardProps) {
  const [evidenceStep, setEvidenceStep] = useState<AgentTraceStep | null>(null)
  const nonAnswerSteps = steps.filter((step) => step.type !== "answer_delta")
  const traceSteps = nonAnswerSteps.filter((step) => step.type !== "final")
  const visibleSteps = traceSteps.length > 0 ? traceSteps : nonAnswerSteps
  const latestStreamingStatus = [...visibleSteps]
    .reverse()
    .find((step) => step.type === "status" || step.type === "thought")
  const elapsedSeconds = useElapsedSeconds({
    completedAt,
    startedAt,
    steps: nonAnswerSteps,
    streaming,
  })

  return (
    <section className="animate-fade-slide-in rounded-[12px] border border-border bg-muted/40 px-4 py-4">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-[13px] leading-5 font-bold">
                思考过程 · {elapsedSeconds}s
              </h3>
              <p
                className={cn(
                  "mt-1 text-[12px] text-muted-foreground",
                  streaming && "thinking-status-sweep"
                )}
              >
                {streaming
                  ? latestStreamingStatus
                    ? formatTraceContent(latestStreamingStatus)
                    : "正在读取资料、规划工具和组织回答"
                  : `${visibleSteps.length} 条推理事件`}
              </p>
            </div>
            <button
              className="inline-flex items-center gap-1 rounded-[8px] text-[12px] font-medium text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
              onClick={onToggle}
              type="button"
            >
              {expanded ? "收起思考过程" : "展开思考过程"}
              <ChevronRight
                className={cn(
                  "size-3.5 transition-transform",
                  expanded && "rotate-[-90deg]"
                )}
              />
            </button>
          </div>

          {expanded ? (
            <div className="relative mt-5 pl-8">
              <div className="absolute top-2 bottom-3 left-[7px] w-px bg-border" />
              <div className="flex flex-col gap-3.5">
                {visibleSteps.length > 0 ? (
                  visibleSteps.map((step, index) => (
                    <TimelineRow
                      animate={Boolean(streaming)}
                      item={step}
                      key={`${step.type}-${step.timestamp ?? index}-${step.content}`}
                      onOpenEvidence={() => setEvidenceStep(step)}
                    />
                  ))
                ) : (
                  <div className="relative text-[12px] leading-5 text-muted-foreground">
                    <ThinkingDots />
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <Dialog open={Boolean(evidenceStep)} onOpenChange={(open) => !open && setEvidenceStep(null)}>
        <DialogContent className="max-h-[80svh] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>工具依据</DialogTitle>
            <DialogDescription>
              这里显示本次推理中对应步骤的原始工具参数或返回结果。
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[56svh] rounded-md border bg-muted/40">
            <pre className="whitespace-pre-wrap break-words p-4 text-xs leading-5">
              {formatEvidence(evidenceStep)}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function TimelineRow({
  animate,
  item,
  onOpenEvidence,
}: {
  animate: boolean
  item: AgentTraceStep
  onOpenEvidence: () => void
}) {
  const meta = traceMeta[item.type] ?? traceMeta.status
  const hasEvidence =
    (item.type === "action" || item.type === "observation") && item.raw !== undefined && item.raw !== null

  return (
    <div className="animate-fade-slide-in relative">
      <div className="absolute top-0.5 -left-[31px] grid size-3.5 place-items-center rounded-full border border-primary bg-card">
        {item.type === "thought" || item.type === "status" ? (
          <span className="size-1.5 rounded-full bg-primary" />
        ) : item.type === "error" ? (
          <span className="size-1.5 rounded-full bg-destructive" />
        ) : item.type === "reflection" ? (
          <Check className="size-2.5 text-foreground" strokeWidth={2.5} />
        ) : (
          <Sparkles className="size-2.5 text-foreground" strokeWidth={2.2} />
        )}
      </div>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h4 className="text-[12px] leading-4 font-bold text-foreground">
            {meta}
          </h4>
          <TypewriterText
            active={animate}
            className="mt-1 text-[12px] leading-[1.58] text-foreground"
            text={formatTraceContent(item)}
          />
          {hasEvidence ? (
            <Button
              className="mt-2 h-7 px-2 text-[11px]"
              onClick={onOpenEvidence}
              type="button"
              variant="outline"
            >
              查看工具依据
            </Button>
          ) : null}
        </div>
        {item.timestamp ? (
          <time className="shrink-0 text-[11px] leading-4 text-muted-foreground">
            {formatTraceTime(item.timestamp)}
          </time>
        ) : null}
      </div>
    </div>
  )
}

function formatEvidence(item: AgentTraceStep | null) {
  if (!item) {
    return ""
  }
  try {
    return JSON.stringify(item.raw ?? item.content, null, 2)
  } catch {
    return String(item.raw ?? item.content)
  }
}

function formatTraceContent(item: AgentTraceStep) {
  if (item.type === "action") {
    const toolName = item.content.match(/调用工具\s*([^(（]+)/)?.[1]?.trim()
    return toolName ? `调用工具 ${toolName}（参数已隐藏）` : "调用工具（参数已隐藏）"
  }

  if (item.type === "observation" && isVerboseTrace(item.content)) {
    return "工具返回结果已收到，原始数据已折叠。"
  }

  if (isVerboseTrace(item.content)) {
    return `${item.content.slice(0, 220)}...`
  }

  return item.content
}

function isVerboseTrace(content: string) {
  return (
    content.length > 360 ||
    content.startsWith("{") ||
    content.startsWith("[") ||
    content.includes("'headers':") ||
    content.includes('"headers":') ||
    content.includes("Transfer-Encoding") ||
    content.includes("Access-Control-")
  )
}

const traceMeta: Record<AgentTraceStep["type"], string> = {
  action: "Action",
  answer_delta: "Answer",
  done: "Done",
  error: "Error",
  final: "Final",
  observation: "Observation",
  reflection: "Reflection",
  status: "Status",
  thought: "Thought",
}

function formatTraceTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    second: "2-digit",
  }).format(date)
}

export function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      等待 Agent 事件
      <span className="inline-flex gap-0.5">
        <span className="size-1 animate-bounce rounded-full bg-muted-foreground" />
        <span className="size-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:120ms]" />
        <span className="size-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:240ms]" />
      </span>
    </span>
  )
}

function TypewriterText({
  active,
  className,
  text,
}: {
  active: boolean
  className: string
  text: string
}) {
  const [visibleLength, setVisibleLength] = useState(0)

  useEffect(() => {
    if (!active) {
      return undefined
    }

    let currentLength = 0
    const timer = window.setInterval(() => {
      currentLength = Math.min(text.length, currentLength + 3)
      setVisibleLength(currentLength)
      if (currentLength >= text.length) {
        window.clearInterval(timer)
      }
    }, 18)

    return () => {
      window.clearInterval(timer)
    }
  }, [active, text])

  return <p className={className}>{text.slice(0, active ? visibleLength : text.length)}</p>
}

function useElapsedSeconds({
  completedAt,
  startedAt,
  steps,
  streaming,
}: {
  completedAt?: number
  startedAt?: number
  steps: AgentTraceStep[]
  streaming?: boolean
}) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!streaming) {
      return undefined
    }
    const timer = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(timer)
  }, [streaming])

  const traceElapsed = elapsedSecondsFromTrace(steps)
  if (!streaming && traceElapsed !== null) {
    return traceElapsed
  }

  if (!startedAt) {
    return traceElapsed ?? 0
  }
  const end = completedAt ?? now
  const elapsed = Math.floor((end - startedAt) / 1000)
  if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed > MAX_REASONABLE_THINKING_SECONDS) {
    return traceElapsed ?? 0
  }
  return elapsed
}

const MAX_REASONABLE_THINKING_SECONDS = 30 * 60

function elapsedSecondsFromTrace(steps: AgentTraceStep[]) {
  const timestamps = steps
    .map((step) => parseTraceTimestamp(step.timestamp))
    .filter((value): value is number => value !== null)

  if (timestamps.length < 2) {
    return null
  }

  const elapsed = Math.floor((Math.max(...timestamps) - Math.min(...timestamps)) / 1000)
  if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed > MAX_REASONABLE_THINKING_SECONDS) {
    return null
  }
  return elapsed
}

function parseTraceTimestamp(value?: string) {
  if (!value) {
    return null
  }
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : null
}
