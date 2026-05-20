import { getPlanExerciseLines } from "@/entities/kratos/lib/domain"
import type {
  TrainingPlan,
  TrainingPlanPayload,
} from "@/entities/kratos/model/types"

export function isDailyPlanForAdjustment(plan: TrainingPlan | null) {
  if (!plan) {
    return false
  }

  const trainingLines = getPlanExerciseLines(plan).filter((line) =>
    /(周[一二三四五六日天]|第\s*\d+\s*天)/.test(line)
  )

  if (trainingLines.length !== 1) {
    return false
  }

  if (plan.end_date && plan.start_date && plan.end_date !== plan.start_date) {
    return false
  }

  return (
    !plan.end_date ||
    /今日|当天|每日|单日|本次|今天|Kratos 生成/.test(
      `${plan.title} ${plan.summary ?? ""} ${plan.goal ?? ""}`
    )
  )
}

export function trainingPlanPayloadFromPlan(
  plan: TrainingPlan
): TrainingPlanPayload {
  return {
    end_date: plan.end_date,
    goal: plan.goal,
    nutrition_guidance: plan.nutrition_guidance,
    recovery_guidance: plan.recovery_guidance,
    start_date: plan.start_date,
    status: plan.status,
    summary: plan.summary,
    title: plan.title,
    weekly_schedule: plan.weekly_schedule,
  }
}

export function trainingPlanDraftKey(payload: TrainingPlanPayload) {
  return [
    payload.title.trim(),
    payload.goal?.trim() ?? "",
    payload.summary?.trim() ?? "",
    payload.weekly_schedule?.trim() ?? "",
  ]
    .join("|")
    .replace(/\s+/g, " ")
}

export function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes <= 0) {
    return `${seconds} 秒`
  }

  return `${minutes} 分 ${seconds.toString().padStart(2, "0")} 秒`
}

export function compactTrainingPlanProposal(
  proposal: Partial<TrainingPlanPayload>
) {
  return Object.fromEntries(
    Object.entries(proposal).filter(
      ([, value]) => value !== null && value !== undefined
    )
  ) as Partial<TrainingPlanPayload>
}
