import {
  useEffect,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
} from "react"
import { LoaderCircle } from "lucide-react"

import type {
  ChatMessage,
  NotificationItem,
  QuickAction,
  TrainingPlanPayload,
} from "@/entities/kratos/model/types"
import { ChatBubble } from "@/widgets/kratos/conversation/ChatBubble"
import { ConversationComposer } from "@/widgets/kratos/conversation/ConversationComposer"
import { ConversationHeader } from "@/widgets/kratos/conversation/ConversationHeader"
import { EmptyConversation } from "@/widgets/kratos/conversation/EmptyConversation"
import { Spinner } from "@/shared/ui/spinner"

export type ConversationWorkspaceProps = {
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
  onConfirmHealthData: (messageId: string) => void
  confirmingHealthDataId: string | null
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

export function ConversationWorkspace({
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
  onConfirmHealthData,
  confirmingHealthDataId,
  onQuickAction,
  onSendMessage,
  onStopAgent,
  onToggleNotifications,
  onToggleTheme,
  onToggleThinking,
  thinkingExpanded,
  theme,
  unreadCount,
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
      <ConversationHeader
        muted={isEmptyConversation && !conversationLoading}
        notifications={notifications}
        notificationsOpen={notificationsOpen}
        onMarkNotificationsRead={onMarkNotificationsRead}
        onToggleNotifications={onToggleNotifications}
        onToggleTheme={onToggleTheme}
        theme={theme}
        unreadCount={unreadCount}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        {conversationLoading ? (
          <LoadingConversation />
        ) : isEmptyConversation ? (
          <EmptyConversationPanel
            agentStreaming={agentStreaming}
            composerValue={composerValue}
            onAttachment={onAttachment}
            onComposerChange={onComposerChange}
            onComposerKeyDown={onComposerKeyDown}
            onQuickAction={onQuickAction}
            onSendMessage={onSendMessage}
            onStopAgent={onStopAgent}
          />
        ) : (
          <>
            <div className="relative min-h-0 flex-1">
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-5 bg-gradient-to-b from-card via-card/55 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-5 bg-gradient-to-b from-transparent via-card/55 to-card" />
              <div
                className="h-full min-h-0 overflow-y-auto bg-card"
                ref={scrollViewportRef}
              >
                <div className="mx-auto flex w-full max-w-[820px] flex-col gap-[17px] px-5 pb-0 sm:px-6">
                  {messages.map((message) => (
                    <ChatBubble
                      creatingTrainingPlan={chatTrainingPlanSavingId === message.id}
                      key={message.id}
                      message={message}
                      onCreateTrainingPlan={onCreateTrainingPlanFromMessage}
                      onEditTrainingPlanDraft={onEditTrainingPlanDraft}
                      onConfirmHealthData={onConfirmHealthData}
                      confirmingHealthData={confirmingHealthDataId === message.id}
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
              <div className="mx-auto w-full max-w-[820px]">
                <ConversationComposer
                  onAttachment={onAttachment}
                  onChange={onComposerChange}
                  onKeyDown={onComposerKeyDown}
                  onSend={onSendMessage}
                  onStop={onStopAgent}
                  sending={agentStreaming}
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

function LoadingConversation() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Spinner />
        正在加载对话内容
      </div>
    </div>
  )
}

function EmptyConversationPanel({
  agentStreaming,
  composerValue,
  onAttachment,
  onComposerChange,
  onComposerKeyDown,
  onQuickAction,
  onSendMessage,
  onStopAgent,
}: {
  agentStreaming: boolean
  composerValue: string
  onAttachment: (event: ChangeEvent<HTMLInputElement>) => void
  onComposerChange: (value: string) => void
  onComposerKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  onQuickAction: (action: QuickAction) => void
  onSendMessage: () => void
  onStopAgent: () => void
}) {
  return (
    <div className="flex min-h-0 flex-1 items-center bg-muted/40 px-5 pb-20 sm:px-6">
      <div className="mx-auto w-full max-w-[820px]">
        <EmptyConversation
          composer={
            <ConversationComposer
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
      </div>
    </div>
  )
}
