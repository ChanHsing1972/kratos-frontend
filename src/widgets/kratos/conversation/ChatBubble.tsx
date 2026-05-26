import { useState } from "react"
import { Check, Copy } from "lucide-react"

import type {
  ChatMessage,
  TrainingPlanPayload,
} from "@/entities/kratos/model/types"
import { copyText } from "@/shared/lib/clipboard"
import { MarkdownMessage } from "@/widgets/kratos/conversation/MarkdownMessage"
import { ThinkingCard, ThinkingDots } from "@/widgets/kratos/conversation/ThinkingTrace"
import { TrainingPlanSuggestionCard } from "@/widgets/kratos/conversation/TrainingPlanSuggestionCard"
import { HealthDataConfirmationCard } from "@/widgets/kratos/conversation/HealthDataConfirmationCard"

type ChatBubbleProps = {
  creatingTrainingPlan: boolean
  message: ChatMessage
  onCreateTrainingPlan: (messageId: string, payload: TrainingPlanPayload) => void
  onEditTrainingPlanDraft: (payload: TrainingPlanPayload) => void
  onConfirmHealthData: (messageId: string) => void
  confirmingHealthData: boolean
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
          <MarkdownMessage className="text-foreground">
            {message.body}
          </MarkdownMessage>
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

          {message.suggestedHealthData && !message.streaming ? (
            <HealthDataConfirmationCard
              data={message.suggestedHealthData}
              loading={confirmingHealthData}
              onConfirm={() => onConfirmHealthData(message.id)}
              saved={Boolean(message.healthDataSaved)}
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
