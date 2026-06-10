import { useState } from "react"
import { Check, Copy, Paperclip } from "lucide-react"

import { absoluteApiUrl } from "@/entities/kratos/api/client"
import type {
  ChatAttachment,
  ChatMessage,
  TrainingPlanPayload,
} from "@/entities/kratos/model/types"
import { copyText } from "@/shared/lib/clipboard"
import { MarkdownMessage } from "@/widgets/kratos/conversation/MarkdownMessage"
import { ThinkingCard, ThinkingDots } from "@/widgets/kratos/conversation/ThinkingTrace"
import { TrainingPlanSuggestionCard } from "@/widgets/kratos/conversation/TrainingPlanSuggestionCard"
import { HealthDataConfirmationCard } from "@/widgets/kratos/conversation/HealthDataConfirmationCard"
import { DietRecordConfirmationCard } from "@/widgets/kratos/conversation/DietRecordConfirmationCard"
import { Skeleton } from "@/shared/ui/skeleton"

type ChatBubbleProps = {
  creatingTrainingPlan: boolean
  message: ChatMessage
  onCreateTrainingPlan: (messageId: string, payload: TrainingPlanPayload) => void
  onEditTrainingPlanDraft: (payload: TrainingPlanPayload) => void
  onConfirmHealthData: (messageId: string) => void
  confirmingHealthData: boolean
  onConfirmDietRecords: (messageId: string) => void
  confirmingDietRecords: boolean
  onToggleThinking: () => void
  thinkingExpanded: boolean
}

export function ChatBubble({
  creatingTrainingPlan,
  message,
  onCreateTrainingPlan,
  onEditTrainingPlanDraft,
  onConfirmHealthData,
  confirmingHealthData,
  onConfirmDietRecords,
  confirmingDietRecords,
  onToggleThinking,
  thinkingExpanded,
}: ChatBubbleProps) {
  const isAssistant = message.author === "assistant"
  const [copied, setCopied] = useState(false)

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
      <section className="flex flex-col items-end pt-5 pb-5">
        <div className="max-w-[72%] rounded-2xl bg-muted px-4 py-3">
          {message.body ? (
            <MarkdownMessage className="text-foreground">
              {message.body}
            </MarkdownMessage>
          ) : null}
          {message.attachments?.length ? (
            <AttachmentPreviewList
              attachments={message.attachments}
              className={message.body ? "mt-3" : ""}
            />
          ) : null}
        </div>
        <div className="mt-1 flex items-center gap-3 text-[12px] text-muted-foreground">
          <span>{message.time}</span>
          <button
            aria-label="复制消息"
            className="hover:text-foreground focus:outline-none"
            onClick={handleCopy}
            type="button"
          >
            {copied ? (
              <Check className="size-3.5 text-foreground" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-card pt-0 pb-4">
      <div className="flex gap-4">
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
          <span className="text-[18px] font-black">K</span>
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
              <MarkdownMessage className="text-foreground">
                {message.body}
              </MarkdownMessage>
            ) : (
              <ThinkingDots />
            )}
          </div>
          {message.error ? (
            <p className="mt-2 text-[12px] leading-5 text-destructive">
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

          {message.structuredCardPending && message.streaming && !message.suggestedTrainingPlan ? (
            <TrainingPlanDraftPendingCard />
          ) : null}

          {message.suggestedHealthData && !message.streaming ? (
            <HealthDataConfirmationCard
              data={message.suggestedHealthData}
              loading={confirmingHealthData}
              onConfirm={() => onConfirmHealthData(message.id)}
              saved={Boolean(message.healthDataSaved)}
            />
          ) : null}

          {message.suggestedDietRecords && !message.streaming ? (
            <DietRecordConfirmationCard
              data={message.suggestedDietRecords}
              loading={confirmingDietRecords}
              onConfirm={() => onConfirmDietRecords(message.id)}
              saved={Boolean(message.dietRecordsSaved)}
            />
          ) : null}

          <div className="mt-2 flex items-center gap-3 text-[12px] text-muted-foreground">
            <span>{message.time}</span>
            <button
              aria-label="复制消息"
              className="hover:text-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!message.body}
              onClick={handleCopy}
              type="button"
            >
              {copied ? (
                <Check className="size-3.5 text-foreground" />
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

function TrainingPlanDraftPendingCard() {
  return (
    <section className="mt-4 rounded-[12px] border border-border bg-muted/40 p-4 shadow-[0_10px_24px_rgba(17,17,17,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            AI 周期计划草稿
          </p>
          <h4 className="mt-1 text-[15px] font-black text-foreground">
            正在整理可保存的训练计划
          </h4>
          <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
            Kratos 正在把训练安排整理成可保存草稿，动作图片和教学视频会陆续补齐。
          </p>
        </div>
        <span className="inline-flex h-7 shrink-0 items-center rounded-[8px] border border-border bg-card px-2.5 text-[11px] font-bold text-muted-foreground">
          生成中
        </span>
      </div>
      <div className="mt-3 space-y-2">
        <Skeleton className="h-12 rounded-[8px]" />
        <Skeleton className="h-12 rounded-[8px]" />
        <Skeleton className="h-12 rounded-[8px]" />
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-9 w-24 rounded-[8px]" />
        <Skeleton className="h-9 w-24 rounded-[8px]" />
      </div>
    </section>
  )
}

function AttachmentPreviewList({
  attachments,
  className,
}: {
  attachments: ChatAttachment[]
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-2 ${className ?? ""}`}>
      {attachments.map((attachment) => {
        const isImage = attachment.content_type.startsWith("image/")
        return (
          <a
            className="flex max-w-full items-center gap-2 rounded-lg border border-border bg-background/70 p-2 text-xs text-foreground hover:bg-background"
            href={absoluteApiUrl(attachment.url)}
            key={attachment.url}
            rel="noreferrer"
            target="_blank"
          >
            {isImage ? (
              <img
                alt={attachment.filename}
                className="size-10 rounded-md object-cover"
                src={attachment.data_url || absoluteApiUrl(attachment.url)}
              />
            ) : (
              <span className="grid size-10 place-items-center rounded-md bg-muted">
                <Paperclip />
              </span>
            )}
            <span className="min-w-0 flex-1 truncate">{attachment.filename}</span>
          </a>
        )
      })}
    </div>
  )
}
