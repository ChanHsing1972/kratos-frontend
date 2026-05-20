import type { ReactNode } from "react"
import { Sparkles } from "lucide-react"

import type { QuickAction } from "@/entities/kratos/model/types"

type EmptyConversationProps = {
  composer: ReactNode
  onQuickAction: (action: QuickAction) => void
}

const starterActions: QuickAction[] = [
  {
    description: "按您的档案生成今日训练",
    icon: Sparkles,
    prompt: "请读取我的档案和最近状态，生成一份今天可执行的训练计划，包含热身、主训练、冷身和注意事项。",
    title: "生成今日训练",
  },
  {
    description: "把训练目标拆成一周节奏",
    icon: Sparkles,
    prompt: "请根据我的目标、可训练天数和恢复情况，生成下一周训练安排。",
    title: "规划一周节奏",
  },
  {
    description: "判断今天是否适合上强度",
    icon: Sparkles,
    prompt: "请结合我的身体数据、训练记录和打卡，评估今天训练风险并给出调整建议。",
    title: "训练风险评估",
  },
]

export function EmptyConversation({
  composer,
  onQuickAction,
}: EmptyConversationProps) {
  return (
    <section className="mx-auto flex w-full flex-col justify-center px-0">
      <div className="mb-8">
        <h3 className="text-3xl font-medium tracking-tight text-foreground">
          您今天想完成什么？
        </h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Kratos 会根据您的训练目标、身体状况和恢复情况，提供个性化的训练建议和计划。
        </p>
      </div>
      <div className="mb-8">{composer}</div>

      <div className="grid gap-3 sm:grid-cols-3">
        {starterActions.map((action) => (
          <button
            className="min-h-[100px] rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            key={action.title}
            onClick={() => onQuickAction(action)}
            type="button"
          >
            <action.icon className="size-4 text-foreground" strokeWidth={1.5} />
            <h4 className="mt-3 text-[13px]">{action.title}</h4>
            <p className="text-[13px] leading-4 text-muted-foreground">
              {action.description}
            </p>
          </button>
        ))}
      </div>
    </section>
  )
}
