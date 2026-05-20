import type {
  ChatMessage,
  ChatSession,
} from "@/entities/kratos/model/types"

import { trainingPlanDraftKey } from "@/features/kratos/lib/trainingPlans"

export function markGeneratedTrainingPlanMessages(
  items: ChatMessage[],
  generatedKeys: Set<string>
) {
  return items.map((message) => {
    if (
      !message.suggestedTrainingPlan ||
      message.trainingPlanCreatedId ||
      !generatedKeys.has(trainingPlanDraftKey(message.suggestedTrainingPlan))
    ) {
      return message
    }

    return {
      ...message,
      trainingPlanCreatedId: -1,
    }
  })
}

export function resolveSessionUpdate(
  session: ChatSession,
  update:
    | Partial<ChatSession>
    | ((current: Partial<ChatSession>) => Partial<ChatSession>)
) {
  return typeof update === "function" ? update(session) : update
}

export function sortChatSessions(left: ChatSession, right: ChatSession) {
  if (left.pinned !== right.pinned) {
    return left.pinned ? -1 : 1
  }

  return (
    new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  )
}
