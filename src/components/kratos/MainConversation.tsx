import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react"
import {
  Bell,
  Check,
  ChevronRight,
  Copy,
  Eye,
  LoaderCircle,
  Moon,
  Paperclip,
  PencilLine,
  SendHorizontal,
  Sparkles,
  Square,
  Sun,
} from "lucide-react"

// import { quickActions } from "@/data/kratos"
import type {
  AgentTraceStep,
  ChatMessage,
  NotificationItem,
  QuickAction,
  TrainingPlanPayload,
} from "@/types/kratos"
import { MarkdownMessage } from "@/components/kratos/MarkdownMessage"
import { Button } from "@/components/ui/button"
import { copyText } from "@/lib/clipboard"
import { cn } from "@/lib/utils"

type MainConversationProps = {
  activeSessionTitle: string
  agentStreaming: boolean
  chatTrainingPlanSavingId: string | null
  composerValue: string
  conversationLoading: boolean
  messages: ChatMessage[]
  notifications: NotificationItem[]
  notificationsOpen: boolean
  onAttachment: (event: ChangeEvent<HTMLInputElement>) => void
  onComposerChange: (value: string) => void
  onComposerKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  onMarkNotificationsRead: () => void
  onCreateTrainingPlanFromMessage: (
    messageId: string,
    payload: TrainingPlanPayload
  ) => void
  onEditTrainingPlanDraft: (payload: TrainingPlanPayload) => void
  onQuickAction: (action: QuickAction) => void
  onSendMessage: () => void
  onStopAgent: () => void
  onToggleNotifications: () => void
  onToggleTheme: () => void
  onToggleThinking: () => void
  thinkingExpanded: boolean
  theme: "dark" | "light" | "system"
  unreadCount: number
}

export function MainConversation({
  activeSessionTitle,
  agentStreaming,
  chatTrainingPlanSavingId,
  composerValue,
  conversationLoading,
  messages,
  notifications,
  notificationsOpen,
  onAttachment,
  onComposerChange,
  onComposerKeyDown,
  onMarkNotificationsRead,
  onCreateTrainingPlanFromMessage,
  onEditTrainingPlanDraft,
  onQuickAction,
  onSendMessage,
  onStopAgent,
  onToggleNotifications,
  onToggleTheme,
  onToggleThinking,
  thinkingExpanded,
  theme,
  unreadCount,
}: MainConversationProps) {
  const scrollViewportRef = useRef<HTMLDivElement>(null)
  const bottomAnchorRef = useRef<HTMLDivElement>(null)
  const isEmptyConversation = messages.length === 0
  const liveMessageKey = messages
    .map((message) => `${message.id}:${message.body.length}:${message.trace?.length ?? 0}`)
    .join("|")

  useEffect(() => {
    requestAnimationFrame(() => {
      bottomAnchorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      })
    })
  }, [liveMessageKey])

  return (
    <main className="flex h-full min-w-0 flex-1 flex-col border-[#e8e8e8] bg-white xl:border-r">
      <header className={cn("flex shrink-0 flex-col gap-2 px-0 pt-5 pb-0 sm:px-6 lg:flex-row lg:items-start lg:justify-between ", isEmptyConversation ? "bg-gray-50" : "bg-white")}>
        <div>
          <h2 className="text-[25px] leading-[1.1] font-extrabold tracking-[-0.04em]">
            {messages.length ? activeSessionTitle : ``}
          </h2>
          <p className="mt-2 text-[13px] text-[#6d6d6d]">
            {messages.length
              ? "Kratos 会把训练计划、工具调用和推理轨迹保存在这条会话里。"
              : ""}
          </p>
        </div>
        <div className="relative flex items-center gap-4">
          <button
            aria-label="Toggle theme"
            className="grid size-6 place-items-center rounded-full text-[#161616] focus-visible:ring-2 focus-visible:ring-[#111111]/30 focus-visible:outline-none"
            onClick={onToggleTheme}
            type="button"
          >
            {theme === "dark" ? (
              <Moon className="size-5" strokeWidth={1.7} />
            ) : (
              <Sun className="size-5" strokeWidth={1.7} />
            )}
          </button>
          <button
            aria-label="Notifications"
            data-popover-root
            className="relative grid size-6 place-items-center rounded-full text-[#161616] focus-visible:ring-2 focus-visible:ring-[#111111]/30 focus-visible:outline-none"
            onClick={onToggleNotifications}
            type="button"
          >
            <Bell className="size-5" strokeWidth={1.7} />
            {unreadCount > 0 ? (
              <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-[#111111] text-[9px] font-bold text-white">
                {unreadCount}
              </span>
            ) : null}
          </button>
          {notificationsOpen ? (
            <NotificationsPopover
              notifications={notifications}
              onMarkAllRead={onMarkNotificationsRead}
            />
          ) : null}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        {conversationLoading ? (
          <div className="flex min-h-0 flex-1 items-center justify-center bg-white px-5">
            <div className="flex items-center gap-3 rounded-[12px] border border-[#eeeeee] bg-[#fbfbfa] px-4 py-3 text-[13px] font-semibold text-[#555555]">
              <LoaderCircle className="size-4 animate-spin" />
              正在加载对话内容
            </div>
          </div>
        ) : isEmptyConversation ? (
          <div className="flex min-h-0 flex-1 items-center px-5 pb-8 pt-2 sm:px-6 bg-gray-50">
            <div className="mx-auto w-full max-w-[820px]">
              <EmptyConversation
                composer={
                  <Composer
                    onAttachment={onAttachment}
                    onChange={onComposerChange}
                    onKeyDown={onComposerKeyDown}
                    onSend={onSendMessage}
                    onStop={onStopAgent}
                    sending={agentStreaming}
                    value={composerValue}
                  />
                }
                onQuickAction={onQuickAction}
              />
              <p className="mt-5 text-center text-[10px] text-[#9a9a9a]">
                Kratos
                提供的建议仅供健身参考，不构成医疗或诊断建议。如有严重不适，请及时就医。
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="relative min-h-0 flex-1">
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-6 bg-gradient-to-b from-white via-white/88 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-6 bg-gradient-to-b from-transparent via-white/72 to-white" />
              <div className="h-full min-h-0 overflow-y-auto bg-white" ref={scrollViewportRef}>
                <div className="mx-auto flex w-full max-w-[820px] flex-col gap-[17px] px-5 pb-0 sm:px-6">
	                  {messages.map((message) => (
	                    <ChatBubble
	                      creatingTrainingPlan={chatTrainingPlanSavingId === message.id}
	                      key={message.id}
	                      message={message}
	                      onCreateTrainingPlan={onCreateTrainingPlanFromMessage}
	                      onEditTrainingPlanDraft={onEditTrainingPlanDraft}
	                      onToggleThinking={onToggleThinking}
	                      thinkingExpanded={thinkingExpanded}
	                    />
                  ))}
                  {/* {activeNav !== "对话" ? (
                    <ModulePreview
                      activeNav={activeNav}
                      onQuickAction={onQuickAction}
                    />
                  ) : null} */}
                  <div ref={bottomAnchorRef} />
                </div>
              </div>
            </div>

            <div className="relative shrink-0 bg-white px-5 pt-1 pb-3 sm:px-6">
              <div className="pointer-events-none absolute inset-x-0 -top-10 h-10 bg-gradient-to-b from-transparent via-white/72 to-white" />
              <div className="mx-auto w-full max-w-[820px]">
                <Composer
                  onAttachment={onAttachment}
                  onChange={onComposerChange}
                  onKeyDown={onComposerKeyDown}
                  onSend={onSendMessage}
                  onStop={onStopAgent}
                  sending={agentStreaming}
                  value={composerValue}
                />
              </div>
              {/* <div className="mt-3">
                <QuickActions onQuickAction={onQuickAction} />
              </div> */}
              <p className="mt-2 text-center text-[10px] text-[#9a9a9a]">
                Kratos
                提供的建议仅供健身参考，不构成医疗或诊断建议。如有严重不适，请及时就医。
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  )
}

function NotificationsPopover({
  notifications,
  onMarkAllRead,
}: {
  notifications: NotificationItem[]
  onMarkAllRead: () => void
}) {
  return (
    <div data-popover-root className="absolute top-9 right-0 z-40 w-[280px] rounded-[14px] border border-[#e6e6e6] bg-white p-3 shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-bold">通知中心</h3>
        <button
          className="text-[11px] font-medium text-[#777777] hover:text-[#111111] focus-visible:ring-2 focus-visible:ring-[#111111]/30 focus-visible:outline-none"
          onClick={onMarkAllRead}
          type="button"
        >
          全部已读
        </button>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {notifications.map((item) => (
          <div
            className="rounded-[10px] border border-[#eeeeee] p-3"
            key={item.id}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  item.read ? "bg-[#d4d4d4]" : "bg-[#111111]"
                )}
              />
              <h4 className="text-[12px] font-bold">{item.title}</h4>
            </div>
            <p className="mt-1.5 text-[11px] leading-4 text-[#777777]">
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ThinkingCard({
  completedAt,
  expanded,
  startedAt,
  steps,
  streaming,
  onToggle,
}: {
  completedAt?: number
  expanded: boolean
  startedAt?: number
  steps: AgentTraceStep[]
  streaming?: boolean
  onToggle: () => void
}) {
  const nonAnswerSteps = steps.filter((step) => step.type !== "answer_delta")
  const traceSteps = nonAnswerSteps.filter((step) => step.type !== "final")
  const visibleSteps = traceSteps.length > 0 ? traceSteps : nonAnswerSteps
  const elapsedSeconds = useElapsedSeconds(startedAt, completedAt, streaming)

  return (
    <section className="animate-fade-slide-in rounded-[12px] border border-[#eeeeee] bg-[#fbfbfa] px-4 py-4">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-[13px] leading-5 font-bold">
                思考过程 · {elapsedSeconds}s
              </h3>
              <p className="thinking-status-sweep mt-1 text-[12px] text-[#8a8a8a]">
                {streaming
                  ? "正在读取资料、规划工具和组织回答"
                  : `${visibleSteps.length} 条推理事件`}
              </p>
            </div>
            <button
              className="inline-flex items-center gap-1 rounded-[8px] text-[12px] font-medium text-[#777777] focus-visible:ring-2 focus-visible:ring-[#111111]/30 focus-visible:outline-none"
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
              <div className="absolute top-2 bottom-3 left-[7px] w-px bg-[#e4e4e4]" />
              <div className="flex flex-col gap-3.5">
                {visibleSteps.length > 0 ? (
                  visibleSteps.map((step, index) => (
                    <TimelineRow
                      animate={Boolean(streaming)}
                      item={step}
                      key={`${step.type}-${step.timestamp ?? index}-${step.content}`}
                    />
                  ))
                ) : (
                  <div className="relative text-[12px] leading-5 text-[#666666]">
                    <ThinkingDots />
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function TimelineRow({
  animate,
  item,
}: {
  animate: boolean
  item: AgentTraceStep
}) {
  const meta = traceMeta[item.type] ?? traceMeta.status

  return (
    <div className="animate-fade-slide-in relative">
      <div className="absolute top-0.5 -left-[31px] grid size-3.5 place-items-center rounded-full border border-[#111111] bg-white">
        {item.type === "thought" || item.type === "status" ? (
          <span className="size-1.5 rounded-full bg-[#111111]" />
        ) : item.type === "error" ? (
          <span className="size-1.5 rounded-full bg-[#d64040]" />
        ) : item.type === "reflection" ? (
          <Check className="size-2.5 text-[#111111]" strokeWidth={2.5} />
        ) : (
          <Sparkles className="size-2.5 text-[#111111]" strokeWidth={2.2} />
        )}
      </div>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h4 className="text-[12px] leading-4 font-bold text-[#141414]">
            {meta}
          </h4>
          <TypewriterText
            active={animate}
            className="mt-1 text-[12px] leading-[1.58] text-[#333333]"
            text={formatTraceContent(item)}
          />
        </div>
        {item.timestamp ? (
          <time className="shrink-0 text-[11px] leading-4 text-[#999999]">
            {formatTraceTime(item.timestamp)}
          </time>
        ) : null}
      </div>
    </div>
  )
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

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      等待 Agent 事件
      <span className="inline-flex gap-0.5">
        <span className="size-1 animate-bounce rounded-full bg-[#777777]" />
        <span className="size-1 animate-bounce rounded-full bg-[#777777] [animation-delay:120ms]" />
        <span className="size-1 animate-bounce rounded-full bg-[#777777] [animation-delay:240ms]" />
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

function useElapsedSeconds(
  startedAt?: number,
  completedAt?: number,
  streaming?: boolean
) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!streaming) {
      return undefined
    }
    const timer = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(timer)
  }, [streaming])

  if (!startedAt) {
    return 0
  }
  const end = completedAt ?? now
  return Math.max(0, Math.floor((end - startedAt) / 1000))
}

function ChatBubble({
  creatingTrainingPlan,
  message,
  onCreateTrainingPlan,
  onEditTrainingPlanDraft,
  onToggleThinking,
  thinkingExpanded,
}: {
  creatingTrainingPlan: boolean
  message: ChatMessage
  onCreateTrainingPlan: (messageId: string, payload: TrainingPlanPayload) => void
  onEditTrainingPlanDraft: (payload: TrainingPlanPayload) => void
  onToggleThinking: () => void
  thinkingExpanded: boolean
}) {
  const isAssistant = message.author === "assistant"
  const [copied, setCopied] = useState(false)

  // 复制当前显示的内容
  const handleCopy = async () => {
    try {
      await copyText(message.body)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("复制失败", err)
    }
  }

  if (!isAssistant) {
    return (
      <section className="flex flex-col items-end pb-5 pt-5">
        <div className="max-w-[72%] rounded-2xl bg-[#f2f2f2] px-4 py-3">
          <MarkdownMessage className="text-[#2f2f2f]">
            {message.body}
          </MarkdownMessage>
        </div>
        <div className="mt-1 flex items-center gap-3 text-[12px] text-[#8b8b8b]">
          <span>{message.time}</span>
          <button
            onClick={handleCopy}
            className="hover:text-black focus:outline-none"
            aria-label="复制消息"
          >
            {copied ? (
              <Check className="size-3.5 text-black" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-white pt-0 pb-4">
      <div className="flex gap-4">
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#111111] text-white">
          <span className="text-[18px] font-bold">K</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-[14px] leading-5 font-bold">Kratos</h3>
          </div>
          {message.trace?.length ? (
            <div className="mt-3">
              <ThinkingCard
                completedAt={message.completedAt}
                expanded={thinkingExpanded}
                onToggle={onToggleThinking}
                startedAt={message.startedAt}
                steps={message.trace}
                streaming={message.streaming}
              />
            </div>
          ) : null}
          <div className="mt-3 min-h-7">
            {message.body ? (
              <MarkdownMessage className="text-[#333333]">
                {message.body}
              </MarkdownMessage>
            ) : (
              <ThinkingDots />
            )}
          </div>
          {message.error ? (
            <p className="mt-2 text-[12px] leading-5 text-[#b42318]">
              {message.error}
            </p>
          ) : null}

          {message.suggestedTrainingPlan && !message.streaming ? (
            <TrainingPlanSuggestionCard
              created={Boolean(message.trainingPlanCreatedId)}
              loading={creatingTrainingPlan}
              onCreate={() =>
                onCreateTrainingPlan(message.id, message.suggestedTrainingPlan!)
              }
              onEdit={() => onEditTrainingPlanDraft(message.suggestedTrainingPlan!)}
              plan={message.suggestedTrainingPlan}
            />
          ) : null}

          {/* 操作栏：重新生成、版本切换、时间戳、复制 (全部靠左) */}
          <div className="mt-2 flex items-center gap-3 text-[12px] text-[#8b8b8b]">
            {/* 时间戳 */}
            <span>{message.time}</span>

            {/* 复制按钮 */}
            <button
              onClick={handleCopy}
              disabled={!message.body}
              className="hover:text-black focus:outline-none"
              aria-label="复制消息"
            >
              {copied ? (
                <Check className="size-3.5 text-black" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function TrainingPlanSuggestionCard({
  created,
  loading,
  onCreate,
  onEdit,
  plan,
}: {
  created: boolean
  loading: boolean
  onCreate: () => void
  onEdit: () => void
  plan: TrainingPlanPayload
}) {
  const scheduleLines =
    plan.weekly_schedule
      ?.split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 3) ?? []

  return (
    <section className="mt-4 rounded-[12px] border border-[#e5e5e5] bg-[#fbfbfa] p-4 shadow-[0_10px_24px_rgba(17,17,17,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-[#8a8a8a] uppercase">
            AI 训练计划草稿
          </p>
          <h4 className="mt-1 text-[15px] font-black tracking-[-0.03em] text-[#111111]">
            {plan.title}
          </h4>
          {plan.goal ? (
            <p className="mt-1 text-[12px] leading-5 text-[#666666]">
              {plan.goal}
            </p>
          ) : null}
        </div>
        {created ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-[8px] border border-[#111111] bg-white px-2.5 py-1 text-[11px] font-bold text-[#111111]">
            <Check className="size-3.5" />
            已生成
          </span>
        ) : null}
      </div>

      {scheduleLines.length ? (
        <div className="mt-3 space-y-2">
          {scheduleLines.map((line) => (
            <p
              className="rounded-[8px] border border-[#eeeeee] bg-white px-3 py-2 text-[12px] leading-5 text-[#444444]"
              key={line}
            >
              {line}
            </p>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="inline-flex h-9 items-center gap-2 rounded-[8px] bg-[#111111] px-3 text-[12px] font-bold text-white transition hover:bg-[#222222] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={created || loading}
          onClick={onCreate}
          type="button"
        >
          {created ? "已保存到训练计划" : loading ? "生成中..." : "生成训练计划"}
          <ChevronRight className="size-3.5" />
        </button>
        <button
          className="inline-flex h-9 items-center gap-2 rounded-[8px] border border-[#d9d9d9] bg-white px-3 text-[12px] font-bold text-[#111111] transition hover:border-[#111111] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={created || loading}
          onClick={onEdit}
          type="button"
        >
          <PencilLine className="size-3.5" />
          先编辑
        </button>
      </div>
    </section>
  )
}

function EmptyConversation({
  composer,
  onQuickAction,
}: {
  composer: ReactNode
  onQuickAction: (action: QuickAction) => void
}) {
  const starters: QuickAction[] = [
    {
      description: "按你的档案生成今天可以直接执行的训练",
      icon: Sparkles,
      prompt: "请读取我的档案和最近状态，生成一份今天可执行的训练计划，包含热身、主训练、冷身和注意事项。",
      title: "生成今日训练",
    },
    {
      description: "把训练目标拆成一周节奏",
      icon: Sparkles,
      prompt: "请根据我的目标、可训练天数和恢复情况，生成下一周训练安排。",
      title: "规划一周节奏",
    },
    {
      description: "判断今天是否适合上强度",
      icon: Sparkles,
      prompt: "请结合我的身体数据、训练记录和打卡，评估今天训练风险并给出调整建议。",
      title: "训练风险评估",
    },
  ]

  return (
    <section className="mx-auto flex w-full flex-col justify-center px-0">
      <div className="mb-6">
        <h3 className="text-[32px] leading-tight font-black tracking-[-0.04em]">
          你今天想完成什么？
        </h3>
        <p className="mt-1 max-w-[560px] text-[13px] leading-6 text-[#6d6d6d]">
          Kratos 会根据你的训练目标、身体状况和恢复情况，提供个性化的训练建议和计划。
        </p>
      </div>
      <div className="mb-8">{composer}</div>
      <div className="grid gap-3 sm:grid-cols-3">
        {starters.map((action) => (
          <button
            className="min-h-[100px] rounded-[10px] border border-[#e8e8e8] bg-white p-4 text-left transition-colors hover:bg-[#fbfbfa] focus-visible:ring-2 focus-visible:ring-[#111111]/30 focus-visible:outline-none"
            key={action.title}
            onClick={() => onQuickAction(action)}
            type="button"
          >
            <action.icon className="size-4 text-[#111111]" strokeWidth={1.8} />
            <h4 className="mt-3 text-[13px] font-bold">{action.title}</h4>
            <p className="mt-0.5 text-[11px] leading-4 text-[#777777]">
              {action.description}
            </p>
          </button>
        ))}
      </div>
    </section>
  )
}

function Composer({
  onAttachment,
  onChange,
  onKeyDown,
  onSend,
  onStop,
  sending,
  value,
}: {
  onAttachment: (event: ChangeEvent<HTMLInputElement>) => void
  onChange: (value: string) => void
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  onSend: () => void
  onStop: () => void
  sending: boolean
  value: string
}) {
  const [mode, setMode] = useState<"write" | "preview">("write")

  return (
    <section className="rounded-[12px] border border-[#e7e7e7] bg-white pl-4 pr-2 pt-3 pb-2 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-colors focus-within:border-[#111111] focus-within:shadow-[0_0_0_3px_rgba(17,17,17,0.08)]">

      {mode === "write" ? (
        <textarea
          className="min-h-9 w-full resize-none bg-transparent text-[12px] leading-5 text-[#222222] outline-none placeholder:text-[#8c8c8c] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={sending}
          onChange={(event) => onChange(event.target.value)}
          onCompositionEnd={(event) => {
            event.currentTarget.dataset.composing = "false"
          }}
          onCompositionStart={(event) => {
            event.currentTarget.dataset.composing = "true"
          }}
          onKeyDown={onKeyDown}
          placeholder={sending ? "Kratos 正在回复..." : "输入 Markdown 内容，Shift + Enter 换行"}
          rows={2}
          value={value}
        />
      ) : (
        <div className="min-h-10 rounded-[8px] bg-[#fbfbfa] px-3 py-2 mb-1.5">
          {value.trim() ? (
            <MarkdownMessage className="text-[12px] text-[#222222]">
              {value}
            </MarkdownMessage>
          ) : (
            <p className="text-[12px] leading-5 text-[#8c8c8c]">
              Markdown 预览会显示在这里
            </p>
          )}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="cursor-pointer rounded-[6px] text-[#1f1f1f] focus-within:ring-2 focus-within:ring-[#111111]/30">
            <input className="hidden" onChange={onAttachment} type="file" />
            <Paperclip className="size-4.5" strokeWidth={1.8} />
          </label>
          <div className="flex items-center rounded-[8px] bg-[#f3f3f3] p-0.5">
            <button
              aria-label="编辑 Markdown"
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-[7px] px-2.5 text-[11px] font-medium text-[#777777] transition-colors focus-visible:ring-2 focus-visible:ring-[#111111]/30 focus-visible:outline-none",
                mode === "write" &&
                "bg-white text-[#111111] shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
              )}
              onClick={() => setMode("write")}
              title="编辑 Markdown"
              type="button"
            >
              <PencilLine className="size-3.5" strokeWidth={1.8} />
              编辑
            </button>
            <button
              aria-label="预览 Markdown"
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-[7px] px-2.5 text-[11px] font-medium text-[#777777] transition-colors focus-visible:ring-2 focus-visible:ring-[#111111]/30 focus-visible:outline-none",
                mode === "preview" &&
                "bg-white text-[#111111] shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
              )}
              onClick={() => setMode("preview")}
              title="预览 Markdown"
              type="button"
            >
              <Eye className="size-3.5" strokeWidth={1.8} />
              预览
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            aria-label={sending ? "Stop" : "Send"}
            className="size-10 rounded-[9px] bg-[#0f0f0f] text-white hover:bg-[#0f0f0f]/90"
            onClick={sending ? onStop : onSend}
            size="icon"
            type="button"
          >
            {sending ? (
              <Square className="size-4 fill-white" strokeWidth={2} />
            ) : (
              <SendHorizontal className="size-5" strokeWidth={2} />
            )}
          </Button>
        </div>
      </div>
    </section>
  )
}
