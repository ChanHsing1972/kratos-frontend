import type { ChangeEvent, KeyboardEvent } from "react"
import {
  Bell,
  Check,
  ChevronRight,
  ImagePlus,
  MessageCircle,
  Moon,
  Paperclip,
  SendHorizontal,
  Sparkles,
  Sun,
  User,
} from "lucide-react"

import { quickActions, timelineItems } from "@/data/kratos"
import type { ChatMessage, NotificationItem, QuickAction } from "@/types/kratos"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type MainConversationProps = {
  activeNav: string
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
  const extraMessages = messages.slice(1)

  return (
    <main className="flex h-full min-w-0 flex-1 flex-col border-[#e8e8e8] bg-white xl:border-r">
      <header className="flex shrink-0 flex-col gap-5 px-7 pt-8 pb-6 sm:px-10 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-[25px] leading-[1.1] font-extrabold tracking-[-0.04em]">
            {activeNav === "对话" ? `下午好， ${currentUserName}` : activeNav}{" "}
            <span className="tracking-normal">👋</span>
          </h2>
          <p className="mt-2 text-[13px] text-[#6d6d6d]">
            {activeNav === "对话"
              ? "我是你的 AI 健身教练 Kratos， 有什么可以帮你?"
              : "该模块已接入界面状态，当前使用本地假数据预览。"}
          </p>
        </div>
        <div className="relative flex items-center gap-7 pr-2">
          <div className="flex items-center gap-2 text-[12px] text-[#5e5e5e]">
            <span className="size-1.5 rounded-full bg-[#4c9b4d]" />
            在线
          </div>
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
        <div className="min-h-0 flex-1 overflow-y-auto px-7 sm:px-10">
          <div className="flex flex-col gap-[17px] pb-5">
            <UserPromptCard message={messages[0]} />
            <ThinkingCard expanded={thinkingExpanded} onToggle={onToggleThinking} />
            {extraMessages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))}
            {activeNav !== "对话" ? <ModulePreview activeNav={activeNav} /> : null}
          </div>
        </div>

        <div className="shrink-0 border-t border-transparent bg-white px-7 pt-3 pb-5 sm:px-10">
          <Composer
            onAttachment={onAttachment}
            onChange={onComposerChange}
            onEndConversation={onEndConversation}
            onKeyDown={onComposerKeyDown}
            onSend={onSendMessage}
            value={composerValue}
          />
          <div className="mt-3">
            <QuickActions onQuickAction={onQuickAction} />
          </div>
          <p className="mt-3 text-center text-[10px] text-[#9a9a9a]">
            Kratos 提供的建议仅供健身参考，不构成医疗或诊断建议。如有严重不适，请及时就医。
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

function UserPromptCard({ message }: { message: ChatMessage }) {
  return (
    // <section className="rounded-[12px] border border-[#e8e8e8] bg-white px-5 py-5 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
    <section className="bg-white px-5 py-5 pb-5">
      <div className="flex gap-4">
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#ededed]">
          <MessageCircle className="size-4.5 text-[#2b2b2b]" strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-[14px] leading-5 font-bold">你</h3>
            <span className="text-[12px] text-[#8b8b8b]">{message.time}</span>
          </div>
          <p className="mt-0.5 max-w-[620px] text-[14px] leading-[1.7] text-[#2f2f2f]">
            {message.body}
          </p>
        </div>
      </div>
    </section>

  )
}

function ThinkingCard({
  expanded,
  onToggle,
}: {
  expanded: boolean
  onToggle: () => void
}) {
  return (
    // <section className="rounded-[12px] border border-[#e8e8e8] bg-white px-5 pt-5 pb-5 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
    <section className="bg-white px-5 pb-5">
      <div className="flex items-start gap-4">
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#111111] text-white">
          <span className="text-[18px] font-bold">K</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-[14px] leading-5 font-bold">Kratos</h3>
              <p className="mt-1 text-[12px] text-[#8a8a8a]">
                {expanded ? "正在思考中..." : "思考过程已收起"}
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
                {timelineItems.map((item) => (
                  <TimelineRow item={item} key={`${item.label}-${item.time}`} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section >
  )
}

function TimelineRow({ item }: { item: (typeof timelineItems)[number] }) {
  return (
    <div className="relative">
      <div className="absolute top-0.5 -left-[31px] grid size-3.5 place-items-center rounded-full border border-[#111111] bg-white">
        {item.icon === "thought" ? (
          <span className="size-1.5 rounded-full bg-[#111111]" />
        ) : item.icon === "final" ? (
          <Check className="size-2.5 text-[#111111]" strokeWidth={2.5} />
        ) : (
          <Sparkles className="size-2.5 text-[#111111]" strokeWidth={2.2} />
        )}
      </div>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h4 className="text-[12px] leading-4 font-bold text-[#141414]">
            {item.label}
          </h4>
          <p className="mt-1 text-[12px] leading-[1.58] text-[#333333]">
            {item.body}
          </p>
        </div>
        <time className="shrink-0 text-[11px] leading-4 text-[#999999]">
          {item.time}
        </time>
      </div>
    </div>
  )
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isAssistant = message.author === "assistant"

  return (
    // <section className="rounded-[12px] border border-[#e8e8e8] bg-white px-5 py-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
    <section className="bg-white px-5 py-4 pt-0 ">
      <div className="flex gap-4">
        <div
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full",
            isAssistant ? "bg-[#111111] text-white" : "bg-[#ededed]"
          )}
        >
          {isAssistant ? (
            <span className="text-[18px] font-bold">K</span>
          ) : (
            <User className="size-4.5" strokeWidth={1.8} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-[14px] leading-5 font-bold">
              {isAssistant ? "Kratos" : "你"}
            </h3>
            <span className="text-[12px] text-[#8b8b8b]">{message.time}</span>
          </div>
          <p className="mt-0.5 text-[13px] leading-[1.7] text-[#333333]">
            {message.body}
          </p>
        </div>
      </div>
    </section>
  )
}

function ModulePreview({ activeNav }: { activeNav: string }) {
  const copy = {
    训练计划: "今日计划已生成，可在右侧开始训练并逐项标记完成。",
    营养分析: "今日蛋白质目标 125g，已记录 62g；晚餐建议补充瘦肉或豆制品。",
    身体数据: "最近 7 天静息心率稳定，睡眠略低，建议今晚提前 30 分钟入睡。",
    历史记录: "最近 7 天完成 4 次训练，下肢训练后恢复间隔偏短。",
    评估平台: "Beta 评估会结合身体反馈、训练负荷和恢复数据输出风险等级。",
    设置: "登录后可同步地区、饮食习惯和训练状态。",
  }[activeNav]

  return (
    <section className="rounded-[12px] border border-[#e8e8e8] bg-[#fbfbfa] px-5 py-4">
      <div className="flex items-center gap-3">
        <Sparkles className="size-4 text-[#111111]" />
        <h3 className="text-[13px] font-bold">{activeNav}预览</h3>
      </div>
      <p className="mt-2 text-[12px] leading-5 text-[#666666]">{copy}</p>
    </section>
  )
}

function Composer({
  onAttachment,
  onChange,
  onEndConversation,
  onKeyDown,
  onSend,
  value,
}: {
  onAttachment: (event: ChangeEvent<HTMLInputElement>) => void
  onChange: (value: string) => void
  onEndConversation: () => void
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  onSend: () => void
  value: string
}) {
  return (
    <section className="rounded-[12px] border border-[#e7e7e7] bg-white px-4 pt-3 pb-2 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-colors focus-within:border-[#111111] focus-within:shadow-[0_0_0_3px_rgba(17,17,17,0.08)]">
      <textarea
        className="min-h-9 w-full resize-none bg-transparent text-[12px] leading-5 text-[#222222] outline-none placeholder:text-[#8c8c8c]"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="输入你的问题或反馈， Shift + Enter 换行"
        rows={2}
        value={value}
      />
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
            onClick={onSend}
            size="icon"
            type="button"
          >
            <SendHorizontal className="size-5" strokeWidth={2} />
          </Button>
        </div>
      </div>
    </section>
  )
}

function QuickActions({
  onQuickAction,
}: {
  onQuickAction: (action: QuickAction) => void
}) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {quickActions.map((action) => (
        <button
          className="flex h-[56px] items-center gap-3 rounded-[12px] border border-[#e9e9e9] bg-white px-4 text-left shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-colors hover:bg-[#f8f8f7] focus-visible:ring-2 focus-visible:ring-[#111111]/30 focus-visible:outline-none"
          key={action.title}
          onClick={() => onQuickAction(action)}
          type="button"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#f2f2f2] text-[#242424]">
            <action.icon className="size-4" strokeWidth={1.8} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] font-bold text-[#181818]">
              {action.title}
            </span>
            <span className="mt-0.5 block truncate text-[10px] text-[#898989]">
              {action.description}
            </span>
          </span>
          <span className="text-[16px] leading-none text-[#333333]">+</span>
        </button>
      ))}
    </section>
  )
}
