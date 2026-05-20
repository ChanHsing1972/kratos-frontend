import { Check, ChevronRight, PencilLine } from "lucide-react"

import type { TrainingPlanPayload } from "@/entities/kratos/model/types"

type TrainingPlanSuggestionCardProps = {
  created: boolean
  loading: boolean
  onCreate: () => void
  onEdit: () => void
  plan: TrainingPlanPayload
}

export function TrainingPlanSuggestionCard({
  created,
  loading,
  onCreate,
  onEdit,
  plan,
}: TrainingPlanSuggestionCardProps) {
  const scheduleLines =
    plan.weekly_schedule
      ?.split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 3) ?? []

  return (
    <section className="mt-4 rounded-[12px] border border-border bg-muted/40 p-4 shadow-[0_10px_24px_rgba(17,17,17,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            AI 训练计划草稿
          </p>
          <h4 className="mt-1 text-[15px] font-black tracking-[-0.03em] text-foreground">
            {plan.title}
          </h4>
          {plan.goal ? (
            <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
              {plan.goal}
            </p>
          ) : null}
        </div>
        {created ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-[8px] border border-primary bg-card px-2.5 py-1 text-[11px] font-bold text-foreground">
            <Check className="size-3.5" />
            已生成
          </span>
        ) : null}
      </div>

      {scheduleLines.length ? (
        <div className="mt-3 space-y-2">
          {scheduleLines.map((line) => (
            <p
              className="rounded-[8px] border border-border bg-card px-3 py-2 text-[12px] leading-5 text-muted-foreground"
              key={line}
            >
              {line}
            </p>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="inline-flex h-9 items-center gap-2 rounded-[8px] bg-primary px-3 text-[12px] font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={created || loading}
          onClick={onCreate}
          type="button"
        >
          {created ? "已保存到训练计划" : loading ? "生成中..." : "生成训练计划"}
          <ChevronRight className="size-3.5" />
        </button>
        <button
          className="inline-flex h-9 items-center gap-2 rounded-[8px] border border-border bg-card px-3 text-[12px] font-bold text-foreground transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
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
