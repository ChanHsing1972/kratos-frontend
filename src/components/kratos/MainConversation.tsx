import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react"
import {
  Bell,
  Check,
  ChevronRight,
  Copy,
  Eye,
  ImagePlus,
  Moon,
  Paperclip,
  PencilLine,
  SendHorizontal,
  Sparkles,
  Sun,
} from "lucide-react"

// import { quickActions } from "@/data/kratos"
import type {
  AgentTraceStep,
  ChatMessage,
  NotificationItem,
  QuickAction,
} from "@/types/kratos"
import { MarkdownMessage } from "@/components/kratos/MarkdownMessage"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type MainConversationProps = {
  activeNav: string
  agentStreaming: boolean
  composerValue: string
  currentUserName: string
  messages: ChatMessage[]
  notifications: NotificationItem[]
  notificationsOpen: boolean
  onAttachment: (event: ChangeEvent<HTMLInputElement>) => void
  onComposerChange: (value: string) => void
  onComposerKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  onEndConversation: () => void
  onMarkNotificationsRead: () => void
  onQuickAction: (action: QuickAction) => void
  onSendMessage: () => void
  onToggleNotifications: () => void
  onToggleTheme: () => void
  onToggleThinking: () => void
  thinkingExpanded: boolean
  theme: "dark" | "light" | "system"
  unreadCount: number
}

export function MainConversation({
  activeNav,
  agentStreaming,
  composerValue,
  currentUserName,
  messages,
  notifications,
  notificationsOpen,
  onAttachment,
  onComposerChange,
  onComposerKeyDown,
  onEndConversation,
  onMarkNotificationsRead,
  onQuickAction,
  onSendMessage,
  onToggleNotifications,
  onToggleTheme,
  onToggleThinking,
  thinkingExpanded,
  theme,
  unreadCount,
}: MainConversationProps) {
  const scrollViewportRef = useRef<HTMLDivElement>(null)
  const bottomAnchorRef = useRef<HTMLDivElement>(null)
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
      <header className="flex shrink-0 flex-col gap-5 px-7 pt-8 pb-0 sm:px-10 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-[25px] leading-[1.1] font-extrabold tracking-[-0.04em]">
            {activeNav === "对话" ? `下午好， ${currentUserName}` : activeNav}{" "}
            <span className="tracking-normal">👋</span>
          </h2>
          <p className="mt-2 text-[13px] text-[#6d6d6d]">
            {activeNav === "对话"
              ? "我是你的 AI 健身教练 Kratos， 有什么可以帮你?"
              : "该模块已接入后端同步状态，可通过对话和右侧面板继续更新。"}
          </p>
        </div>
        <div className="relative flex items-center gap-7 pr-2">
          {/* <div className="flex items-center gap-2 text-[12px] text-[#5e5e5e]">
            <span className="size-1.5 rounded-full bg-[#4c9b4d]" />
            在线
          </div> */}
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
        <div className="relative min-h-0 flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-6 bg-gradient-to-b from-white via-white/88 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-6 bg-gradient-to-b from-transparent via-white/72 to-white" />
          <div
            className="h-full min-h-0 overflow-y-auto px-7 sm:px-10"
            ref={scrollViewportRef}
          >
            <div className="flex flex-col gap-[17px] pb-0">
              {messages.map((message) => (
                <ChatBubble
                  key={message.id}
                  message={message}
                  onToggleThinking={onToggleThinking}
                  thinkingExpanded={thinkingExpanded}
                />
              ))}
              {activeNav !== "对话" ? (
                <ModulePreview
                  activeNav={activeNav}
                  onQuickAction={onQuickAction}
                />
              ) : null}
              <div ref={bottomAnchorRef} />
            </div>
          </div>
        </div>

        <div className="relative shrink-0 bg-white px-7 pt-1 pb-3 sm:px-10">
          <div className="pointer-events-none absolute inset-x-0 -top-10 h-10 bg-gradient-to-b from-transparent via-white/72 to-white" />
          <Composer
            onAttachment={onAttachment}
            onChange={onComposerChange}
            onEndConversation={onEndConversation}
            onKeyDown={onComposerKeyDown}
            onSend={onSendMessage}
            sending={agentStreaming}
            value={composerValue}
          />
          {/* <div className="mt-3">
            <QuickActions onQuickAction={onQuickAction} />
          </div> */}
          <p className="mt-3 text-center text-[10px] text-[#9a9a9a]">
            Kratos
            提供的建议仅供健身参考，不构成医疗或诊断建议。如有严重不适，请及时就医。
          </p>
        </div>
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
    <div className="absolute top-9 right-0 z-40 w-[280px] rounded-[14px] border border-[#e6e6e6] bg-white p-3 shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
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
  expanded,
  steps,
  streaming,
  onToggle,
}: {
  expanded: boolean
  steps: AgentTraceStep[]
  streaming?: boolean
  onToggle: () => void
}) {
  const visibleSteps = steps.filter(
    (step) => step.type !== "final" && step.type !== "answer_delta"
  )

  return (
    <section className="rounded-[12px] border border-[#eeeeee] bg-[#fbfbfa] px-4 py-4">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-[13px] leading-5 font-bold">思考过程</h3>
              <p className="mt-1 text-[12px] text-[#8a8a8a]">
                {streaming
                  ? "正在思考中..."
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

function TimelineRow({ item }: { item: AgentTraceStep }) {
  const meta = traceMeta[item.type] ?? traceMeta.status

  return (
    <div className="relative">
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
          <p className="mt-1 text-[12px] leading-[1.58] text-[#333333]">
            {formatTraceContent(item)}
          </p>
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

function ChatBubble({
  message,
  onToggleThinking,
  thinkingExpanded,
}: {
  message: ChatMessage
  onToggleThinking: () => void
  thinkingExpanded: boolean
}) {
  const isAssistant = message.author === "assistant"
  const [copied, setCopied] = useState(false)

  // 复制当前显示的内容
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.body)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("复制失败", err)
    }
  }

  if (!isAssistant) {
    return (
      <section className="flex flex-col items-end px-5 pb-5 pt-5">
        <div className="max-w-[83.333%] rounded-2xl bg-[#f2f2f2] px-4 py-3">
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
    <section className="bg-white px-5 pt-0 pb-4">
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
                expanded={thinkingExpanded}
                onToggle={onToggleThinking}
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

function ModulePreview({
  activeNav,
  onQuickAction,
}: {
  activeNav: string
  onQuickAction: (action: QuickAction) => void
}) {
  const copy = {
    训练计划: "今日计划来自后端 /plans，可在右侧开始训练并保存完成记录。",
    营养分析: "把饮食发给 Kratos 后，Agent 会结合你的档案给出补给建议。",
    身体数据: "身体指标会从 /body-metrics 同步，右侧状态卡展示最新记录。",
    历史记录: "训练完成后会写入 /workout-logs，用于复盘训练负荷和恢复节奏。",
    评估平台: "Beta 评估会结合身体反馈、训练负荷和 Agent 打卡输出风险等级。",
    设置: "登录后可同步地区、饮食习惯和训练状态。",
  }[activeNav]
  const actions = moduleActions[activeNav] ?? []

  return (
    <section className="rounded-[12px] border border-[#e8e8e8] bg-[#fbfbfa] px-5 py-4">
      <div className="flex items-center gap-3">
        <Sparkles className="size-4 text-[#111111]" />
        <h3 className="text-[13px] font-bold">{activeNav}工作区</h3>
      </div>
      <p className="mt-2 text-[12px] leading-5 text-[#666666]">{copy}</p>
      {actions.length > 0 ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {actions.map((action) => (
            <button
              className="flex items-center justify-between gap-3 rounded-[10px] border border-[#e6e6e6] bg-white px-3 py-2.5 text-left text-[12px] font-semibold text-[#222222] transition-colors hover:bg-[#f7f7f6] focus-visible:ring-2 focus-visible:ring-[#111111]/30 focus-visible:outline-none"
              key={action.title}
              onClick={() => onQuickAction(action)}
              type="button"
            >
              <span>{action.title}</span>
              <ChevronRight className="size-3.5 text-[#777777]" />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  )
}

const moduleActions: Record<string, QuickAction[]> = {
  训练计划: [
    {
      description: "根据后端计划做今日调整",
      icon: Sparkles,
      prompt: "请读取我的当前训练状态，帮我把今日训练计划调整成可执行版本。",
      title: "调整今日计划",
    },
    {
      description: "生成下一周训练节奏",
      icon: Sparkles,
      prompt: "请根据我的训练记录和恢复情况，生成下一周训练安排。",
      title: "生成周计划",
    },
  ],
  营养分析: [
    {
      description: "记录一餐并估算营养",
      icon: Sparkles,
      prompt: "我刚吃了一餐，请帮我记录并估算热量、蛋白质、碳水和脂肪。",
      title: "记录一餐",
    },
    {
      description: "按训练目标给建议",
      icon: Sparkles,
      prompt: "请根据我的训练目标和饮食习惯，给我今天剩余餐食建议。",
      title: "今日补给建议",
    },
  ],
  身体数据: [
    {
      description: "解释身体指标变化",
      icon: Sparkles,
      prompt: "请结合我的身体指标和训练记录，解释最近的状态变化。",
      title: "分析状态",
    },
    {
      description: "写入一组身体反馈",
      icon: Sparkles,
      prompt: "我想记录一组身体反馈：体重、睡眠、酸痛和精神状态，请引导我补全。",
      title: "记录反馈",
    },
  ],
  历史记录: [
    {
      description: "复盘训练日志",
      icon: Sparkles,
      prompt: "请复盘我最近 7 天的训练记录，指出恢复不足和进步点。",
      title: "7 天复盘",
    },
    {
      description: "查找训练风险",
      icon: Sparkles,
      prompt: "请从我的历史训练记录里找出可能的过载风险。",
      title: "风险检查",
    },
  ],
  评估平台: [
    {
      description: "输出综合评估",
      icon: Sparkles,
      prompt: "请结合我的档案、训练记录、身体数据和打卡，输出一次综合健身评估。",
      title: "开始评估",
    },
  ],
  设置: [
    {
      description: "完善个人档案",
      icon: Sparkles,
      prompt: "请帮我检查当前个人档案还缺哪些信息，并说明为什么这些信息重要。",
      title: "检查档案完整度",
    },
  ],
}

function Composer({
  onAttachment,
  onChange,
  onEndConversation,
  onKeyDown,
  onSend,
  sending,
  value,
}: {
  onAttachment: (event: ChangeEvent<HTMLInputElement>) => void
  onChange: (value: string) => void
  onEndConversation: () => void
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  onSend: () => void
  sending: boolean
  value: string
}) {
  const [mode, setMode] = useState<"write" | "preview">("write")

  return (
    <section className="rounded-[12px] border border-[#e7e7e7] bg-white px-4 pt-3 pb-2 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-colors focus-within:border-[#111111] focus-within:shadow-[0_0_0_3px_rgba(17,17,17,0.08)]">
      <div className="mb-2 flex items-center justify-between gap-3">
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
      {mode === "write" ? (
        <textarea
          className="min-h-9 w-full resize-none bg-transparent text-[12px] leading-5 text-[#222222] outline-none placeholder:text-[#8c8c8c] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={sending}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={sending ? "Kratos 正在回复..." : "输入 Markdown 内容，Shift + Enter 换行"}
          rows={2}
          value={value}
        />
      ) : (
        <div className="min-h-10 rounded-[8px] bg-[#fbfbfa] px-3 py-2">
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
          <label className="cursor-pointer rounded-[6px] text-[#1f1f1f] focus-within:ring-2 focus-within:ring-[#111111]/30">
            <input
              accept="image/*"
              className="hidden"
              onChange={onAttachment}
              type="file"
            />
            <ImagePlus className="size-4.5" strokeWidth={1.8} />
          </label>
        </div>
        <div className="flex items-center gap-3">
          <Button
            className="h-9 rounded-[8px] border-[#dedede] px-4 text-[12px] font-medium text-[#333333]"
            onClick={onEndConversation}
            type="button"
            variant="outline"
          >
            结束对话
          </Button>
          <Button
            aria-label="Send"
            className="size-10 rounded-[9px] bg-[#0f0f0f] text-white hover:bg-[#0f0f0f]/90"
            disabled={sending}
            onClick={onSend}
            size="icon"
            type="button"
          >
            {sending ? (
              <span className="size-4 animate-pulse rounded-full bg-white" />
            ) : (
              <SendHorizontal className="size-5" strokeWidth={2} />
            )}
          </Button>
        </div>
      </div>
    </section>
  )
}

// function QuickActions({
//   onQuickAction,
// }: {
//   onQuickAction: (action: QuickAction) => void
// }) {
//   return (
//     <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
//       {quickActions.map((action) => (
//         <button
//           className="flex h-[56px] items-center gap-3 rounded-[12px] border border-[#e9e9e9] bg-white px-4 text-left shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-colors hover:bg-[#f8f8f7] focus-visible:ring-2 focus-visible:ring-[#111111]/30 focus-visible:outline-none"
//           key={action.title}
//           onClick={() => onQuickAction(action)}
//           type="button"
//         >
//           <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#f2f2f2] text-[#242424]">
//             <action.icon className="size-4" strokeWidth={1.8} />
//           </span>
//           <span className="min-w-0 flex-1">
//             <span className="block text-[12px] font-bold text-[#181818]">
//               {action.title}
//             </span>
//             <span className="mt-0.5 block truncate text-[10px] text-[#898989]">
//               {action.description}
//             </span>
//           </span>
//           <span className="text-[16px] leading-none text-[#333333]">+</span>
//         </button>
//       ))}
//     </section>
//   )
// }
