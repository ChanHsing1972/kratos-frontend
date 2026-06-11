import {
  useEffect,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
} from "react"

import type {
  AgentToolConfig,
  ChatMessage,
  ChatAttachment,
  Skill,
  TrainingPlanPayload,
} from "@/entities/kratos/model/types"
import { ChatBubble } from "@/widgets/kratos/conversation/ChatBubble"
import {
  ConversationComposer,
  type AgentComposerMode,
  type ComposerUploadingAttachment,
} from "@/widgets/kratos/conversation/ConversationComposer"
import { EmptyConversation } from "@/widgets/kratos/conversation/EmptyConversation"
import { Skeleton } from "@/shared/ui/skeleton"

type ComposerDataCategory = "body" | "health" | "diet"

export type ConversationWorkspaceProps = {
  activeComposerMode: AgentComposerMode | null
  activeSessionTitle: string
  activeSessionTitlePending: boolean
  agentStreaming: boolean
  chatTrainingPlanSavingId: string | null
  composerValue: string
  composerAttachments: ChatAttachment[]
  composerUploadingAttachments: ComposerUploadingAttachment[]
  conversationLoading: boolean
  dietEstimating: boolean
  messages: ChatMessage[]
  onAttachment: (event: ChangeEvent<HTMLInputElement>) => void
  onComposerChange: (value: string) => void
  onComposerKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  onComposerModeChange: (mode: AgentComposerMode | null) => void
  onDietImage: (event: ChangeEvent<HTMLInputElement>) => void
  onOpenAddData: (category: ComposerDataCategory) => void
  onOpenCapabilities: () => void
  onOpenTrainingPlanComposer: () => void
  onRemoveAttachment: (index: number) => void
  onCreateTrainingPlanFromMessage: (
    messageId: string,
    payload: TrainingPlanPayload
  ) => void
  onEditTrainingPlanDraft: (payload: TrainingPlanPayload) => void
  onConfirmHealthData: (messageId: string) => void
  confirmingHealthDataId: string | null
  onConfirmDietRecords: (messageId: string) => void
  confirmingDietRecordsId: string | null
  onSendMessage: () => void
  onStopAgent: () => void
  onToggleThinking: () => void
  thinkingExpanded: boolean
  skills: Skill[]
  tools: AgentToolConfig[]
}

export function ConversationWorkspace({
  activeComposerMode,
  activeSessionTitle,
  activeSessionTitlePending,
  agentStreaming,
  chatTrainingPlanSavingId,
  composerValue,
  composerAttachments,
  composerUploadingAttachments,
  conversationLoading,
  dietEstimating,
  messages,
  onAttachment,
  onComposerChange,
  onComposerKeyDown,
  onComposerModeChange,
  onDietImage,
  onOpenAddData,
  onOpenCapabilities,
  onOpenTrainingPlanComposer,
  onRemoveAttachment,
  onCreateTrainingPlanFromMessage,
  onEditTrainingPlanDraft,
  onConfirmHealthData,
  confirmingHealthDataId,
  onConfirmDietRecords,
  confirmingDietRecordsId,
  onSendMessage,
  onStopAgent,
  onToggleThinking,
  thinkingExpanded,
  skills,
  tools,
}: ConversationWorkspaceProps) {
  const scrollViewportRef = useRef<HTMLDivElement>(null)
  const bottomAnchorRef = useRef<HTMLDivElement>(null)
  const isEmptyConversation = messages.length === 0
  const liveMessageKey = messages
    .map(
      (message) =>
        `${message.id}:${message.body.length}:${message.trace?.length ?? 0}`
    )
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
    <main className="flex h-full min-w-0 flex-1 flex-col border-border bg-card xl:border-r">
      <div className="flex min-h-0 flex-1 flex-col">
        {conversationLoading ? (
          <LoadingConversation />
        ) : isEmptyConversation ? (
          <EmptyConversationPanel
            activeComposerMode={activeComposerMode}
            agentStreaming={agentStreaming}
            composerAttachments={composerAttachments}
            composerUploadingAttachments={composerUploadingAttachments}
            composerValue={composerValue}
            dietEstimating={dietEstimating}
            onAttachment={onAttachment}
            onDietImage={onDietImage}
            onComposerChange={onComposerChange}
            onComposerKeyDown={onComposerKeyDown}
            onComposerModeChange={onComposerModeChange}
            onOpenAddData={onOpenAddData}
            onOpenCapabilities={onOpenCapabilities}
            onOpenTrainingPlanComposer={onOpenTrainingPlanComposer}
            onRemoveAttachment={onRemoveAttachment}
            onSendMessage={onSendMessage}
            onStopAgent={onStopAgent}
            skills={skills}
            tools={tools}
          />
        ) : (
          <>
            <ConversationHeader
              pending={activeSessionTitlePending}
              title={activeSessionTitle}
            />
            <div className="relative min-h-0 flex-1">
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-20 bg-gradient-to-b from-card via-card/55 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-5 bg-gradient-to-b from-transparent via-card/55 to-card" />
              <div
                className="h-full min-h-0 overflow-y-auto bg-card"
                ref={scrollViewportRef}
              >
                <div className="mx-auto flex w-full max-w-[820px] flex-col gap-[17px] px-5 pt-8 pb-0 sm:px-6 sm:pt-10">
                  {messages.map((message) => (
                    <ChatBubble
                      creatingTrainingPlan={chatTrainingPlanSavingId === message.id}
                      key={message.id}
                      message={message}
                      onCreateTrainingPlan={onCreateTrainingPlanFromMessage}
                      onEditTrainingPlanDraft={onEditTrainingPlanDraft}
                      onConfirmHealthData={onConfirmHealthData}
                      confirmingHealthData={confirmingHealthDataId === message.id}
                      onConfirmDietRecords={onConfirmDietRecords}
                      confirmingDietRecords={confirmingDietRecordsId === message.id}
                      onToggleThinking={onToggleThinking}
                      thinkingExpanded={thinkingExpanded}
                    />
                  ))}
                  <div ref={bottomAnchorRef} />
                </div>
              </div>
            </div>

            <div className="relative shrink-0 bg-card px-5 pt-1 pb-3 sm:px-6">
              <div className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-b from-transparent via-card/50 to-card" />
              <div className="mx-auto w-full max-w-[780px]">
                <ConversationComposer
                  activeMode={activeComposerMode}
                  onAttachment={onAttachment}
                  onDietImage={onDietImage}
                  attachments={composerAttachments}
                  uploadingAttachments={composerUploadingAttachments}
                  dietEstimating={dietEstimating}
                  onChange={onComposerChange}
                  onKeyDown={onComposerKeyDown}
                  onModeChange={onComposerModeChange}
                  onOpenAddData={onOpenAddData}
                  onOpenCapabilities={onOpenCapabilities}
                  onOpenTrainingPlanComposer={onOpenTrainingPlanComposer}
                  onRemoveAttachment={onRemoveAttachment}
                  onSend={onSendMessage}
                  onStop={onStopAgent}
                  sending={agentStreaming}
                  skills={skills}
                  tools={tools}
                  value={composerValue}
                />
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">
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

function ConversationHeader({
  pending,
  title,
}: {
  pending: boolean
  title: string
}) {
  return (
    <header className="shrink-0 bg-card px-5 pt-7 pb-1 sm:px-6 sm:pt-9">
      <div className="mx-auto w-full max-w-[820px]">
        {pending ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-28 rounded-[8px]" />
            <Skeleton className="h-9 w-[min(360px,78vw)] rounded-[8px]" />
          </div>
        ) : (
          <h1
            className="max-w-[720px] truncate text-[28px] leading-tight font-black tracking-normal text-foreground sm:text-[34px]"
            title={title}
          >
            <span className="conversation-title-reveal" key={title}>
              {title}
            </span>
          </h1>
        )}
      </div>
    </header>
  )
}

function LoadingConversation() {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-card">
      <header className="shrink-0 px-5 pt-7 pb-1 sm:px-6 sm:pt-9">
        <div className="mx-auto w-full max-w-[820px] space-y-3">
          <Skeleton className="h-4 w-28 rounded-[8px]" />
          <Skeleton className="h-9 w-[min(360px,78vw)] rounded-[8px]" />
        </div>
      </header>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-card via-card/55 to-transparent" />
        <div className="mx-auto flex w-full max-w-[820px] flex-col gap-5 px-5 pt-8 pb-10 sm:px-6">
          <UserBubbleSkeleton />
          <AssistantBubbleSkeleton />
          <UserBubbleSkeleton compact />
        </div>
      </div>
      <div className="shrink-0 bg-card px-5 pt-1 pb-3 sm:px-6">
        <div className="mx-auto w-full max-w-[780px] rounded-[24px] border border-border bg-card p-4 shadow-[0_12px_34px_rgba(17,17,17,0.08)]">
          <Skeleton className="h-5 w-52 rounded-[8px]" />
          <div className="mt-7 flex items-center justify-between gap-4">
            <div className="flex gap-2">
              <Skeleton className="size-9 rounded-full" />
              <Skeleton className="h-9 w-24 rounded-[8px]" />
              <Skeleton className="h-9 w-24 rounded-[8px]" />
            </div>
            <Skeleton className="size-10 rounded-full" />
          </div>
        </div>
        <Skeleton className="mx-auto mt-2 h-3 w-[min(460px,80vw)] rounded-[8px]" />
      </div>
    </div>
  )
}

function UserBubbleSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex justify-end pt-2">
      <div className="w-[72%] max-w-[560px] space-y-2">
        <Skeleton className="ml-auto h-3 w-20 rounded-[8px]" />
        <div className="rounded-2xl bg-muted px-4 py-3">
          <Skeleton className="h-4 w-full rounded-[8px]" />
          {!compact ? <Skeleton className="mt-2 h-4 w-[78%] rounded-[8px]" /> : null}
        </div>
      </div>
    </div>
  )
}

function AssistantBubbleSkeleton() {
  return (
    <div className="bg-card pt-0 pb-4">
      <div className="flex gap-4">
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
          <span className="text-[18px] font-black">K</span>
        </div>
        <div className="min-w-0 flex-1">
          <Skeleton className="h-4 w-20 rounded-[8px]" />
          <div className="mt-3 rounded-[12px] border border-border bg-muted/40 px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28 rounded-[8px]" />
                <Skeleton className="h-3 w-44 rounded-[8px]" />
              </div>
              <Skeleton className="size-8 rounded-[8px]" />
            </div>
            <div className="mt-5 space-y-3 pl-8">
              <Skeleton className="h-3 w-[70%] rounded-[8px]" />
              <Skeleton className="h-3 w-[84%] rounded-[8px]" />
              <Skeleton className="h-3 w-[62%] rounded-[8px]" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton className="h-4 w-full rounded-[8px]" />
            <Skeleton className="h-4 w-[92%] rounded-[8px]" />
            <Skeleton className="h-4 w-[74%] rounded-[8px]" />
          </div>
          <PlanCardSkeleton />
        </div>
      </div>
    </div>
  )
}

function PlanCardSkeleton() {
  return (
    <section className="mt-4 rounded-[12px] border border-border bg-muted/40 p-4 shadow-[0_10px_24px_rgba(17,17,17,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-28 rounded-[8px]" />
          <Skeleton className="h-5 w-56 rounded-[8px]" />
          <Skeleton className="h-3 w-[72%] rounded-[8px]" />
        </div>
        <Skeleton className="h-7 w-16 rounded-[8px]" />
      </div>
      <div className="mt-3 space-y-2">
        <Skeleton className="h-9 rounded-[8px]" />
        <Skeleton className="h-9 rounded-[8px]" />
        <Skeleton className="h-9 w-[88%] rounded-[8px]" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div className="overflow-hidden rounded-[8px] border border-border bg-card" key={item}>
            <Skeleton className="aspect-[4/3] rounded-none" />
            <div className="p-2">
              <Skeleton className="h-3 w-[78%] rounded-[8px]" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-9 w-24 rounded-[8px]" />
        <Skeleton className="h-9 w-20 rounded-[8px]" />
      </div>
    </section>
  )
}

function EmptyConversationPanel({
  activeComposerMode,
  agentStreaming,
  composerValue,
  dietEstimating,
  composerAttachments,
  composerUploadingAttachments,
  onAttachment,
  onComposerChange,
  onComposerKeyDown,
  onComposerModeChange,
  onDietImage,
  onOpenAddData,
  onOpenCapabilities,
  onOpenTrainingPlanComposer,
  onRemoveAttachment,
  onSendMessage,
  onStopAgent,
  skills,
  tools,
}: {
  activeComposerMode: AgentComposerMode | null
  agentStreaming: boolean
  composerValue: string
  dietEstimating: boolean
  composerAttachments: ChatAttachment[]
  composerUploadingAttachments: ComposerUploadingAttachment[]
  onAttachment: (event: ChangeEvent<HTMLInputElement>) => void
  onComposerChange: (value: string) => void
  onComposerKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  onComposerModeChange: (mode: AgentComposerMode | null) => void
  onDietImage: (event: ChangeEvent<HTMLInputElement>) => void
  onOpenAddData: (category: ComposerDataCategory) => void
  onOpenCapabilities: () => void
  onOpenTrainingPlanComposer: () => void
  onRemoveAttachment: (index: number) => void
  onSendMessage: () => void
  onStopAgent: () => void
  skills: Skill[]
  tools: AgentToolConfig[]
}) {
  return (
    <div className="flex min-h-0 flex-1 items-center bg-muted/40 px-5 pb-20 sm:px-6">
      <div className="mx-auto w-full max-w-[750px]">
        <EmptyConversation
          composer={
            <ConversationComposer
              activeMode={activeComposerMode}
              onAttachment={onAttachment}
              onDietImage={onDietImage}
              attachments={composerAttachments}
              uploadingAttachments={composerUploadingAttachments}
              dietEstimating={dietEstimating}
              onChange={onComposerChange}
              onKeyDown={onComposerKeyDown}
              onModeChange={onComposerModeChange}
              onOpenAddData={onOpenAddData}
              onOpenCapabilities={onOpenCapabilities}
              onOpenTrainingPlanComposer={onOpenTrainingPlanComposer}
              onRemoveAttachment={onRemoveAttachment}
              onSend={onSendMessage}
              onStop={onStopAgent}
              sending={agentStreaming}
              skills={skills}
              tools={tools}
              value={composerValue}
            />
          }
        />
      </div>
    </div>
  )
}
