import { titleFromPrompt } from "@/entities/kratos/lib/domain"
import type {
  AgentRun,
  ChatSession,
  UserProfile,
} from "@/entities/kratos/model/types"

const AGENT_EVAL_FORMAT_VERSION = "agent-eval-json/v1"

export function buildConversationEvalExport({
  runs,
  session,
  user,
}: {
  runs: AgentRun[]
  session?: ChatSession | null
  user: UserProfile | null
}) {
  const orderedRuns = [...runs].sort(
    (left, right) =>
      new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
  )
  const sessionId =
    orderedRuns[0]?.session_id ?? session?.id ?? "unknown-session"
  const sessionTitle =
    session?.title ?? titleFromPrompt(orderedRuns[0]?.user_message ?? "")

  return {
    format_version: AGENT_EVAL_FORMAT_VERSION,
    source: "kratos-agent-frontend",
    dataset: {
      name: uniqueDatasetName(sessionTitle, sessionId),
      description: `Kratos Agent 对话导出：${sessionTitle}`,
    },
    metadata: {
      exported_at: new Date().toISOString(),
      project: "Kratos Agent",
      session_id: sessionId,
      session_title: sessionTitle,
      user: user
        ? {
            id: user.id,
            username: user.username,
          }
        : null,
    },
    items: orderedRuns.map((run, index) => {
      const runTrace = [...run.trace_steps].sort(
        (left, right) => left.position - right.position
      )
      const messages = orderedRuns.slice(0, index + 1).flatMap((messageRun) => [
        {
          role: "user",
          content: messageRun.user_message,
          created_at: messageRun.created_at,
          run_id: messageRun.id,
        },
        {
          role: "assistant",
          content: messageRun.answer,
          created_at: messageRun.created_at,
          run_id: messageRun.id,
        },
      ])
      const traceContexts = runTrace
        .map((step) => compactText(step.content))
        .filter(Boolean)

      return {
        trace_id: `${sessionId}-run-${run.id}`,
        user_input: run.user_message,
        ai_answer: run.answer,
        contexts: [
          `session_title: ${sessionTitle}`,
          `agent_status: ${run.status}`,
          ...traceContexts,
        ],
        messages,
        tool_calls: runTrace
          .filter((step) => /tool|工具/i.test(step.step_type))
          .map((step) => ({
            name: step.step_type,
            arguments: step.raw,
            result: step.content,
            position: step.position,
          })),
        trajectory: runTrace.map((step) => ({
          step: step.position,
          action: step.step_type,
          input: step.raw,
          observation: step.content,
          created_at: step.created_at,
        })),
        metadata: {
          run_id: run.id,
          session_id: run.session_id,
          status: run.status,
          intent: run.intent,
          task_results: run.task_results,
          tool_results: run.tool_results,
          reflection: run.reflection,
          result_payload: run.result_payload,
          created_at: run.created_at,
          message_index: index + 1,
        },
        expected: {
          answer_keywords: inferAnswerKeywords(run.answer),
        },
      }
    }),
  }
}

export function downloadJsonFile(payload: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function safeFilename(value: string) {
  return (
    value
      .trim()
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, "-")
      .slice(0, 80) || "kratos-conversation"
  )
}

function uniqueDatasetName(title: string, sessionId: string) {
  const suffix = sessionId.slice(0, 8) || Date.now().toString(36)
  return `${title || "Kratos 对话评估"}-${suffix}`.slice(0, 120)
}

function compactText(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function inferAnswerKeywords(answer: string) {
  const words = Array.from(
    new Set(answer.match(/[\p{Script=Han}A-Za-z0-9]{2,}/gu) ?? [])
  )
  return words.slice(0, 8)
}
