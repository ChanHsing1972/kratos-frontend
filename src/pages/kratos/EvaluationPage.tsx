import { BarChart3, ExternalLink } from "lucide-react"

import { EVAL_APP_URL } from "@/entities/kratos/api/client"
import { KratosPageHeader } from "@/widgets/kratos/layout/KratosPageHeader"

export function EvaluationPage() {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-card px-10 py-8">
      <KratosPageHeader title="评估平台" subtitle="综合评估已接入外部平台。" />
      <section className="mt-8 rounded-[12px] border border-border p-8">
        <BarChart3 className="size-6 text-foreground" />
        <h2 className="mt-4 text-[20px] font-black">打开综合评估</h2>
        <p className="mt-2 text-[14px] leading-7 text-muted-foreground">
          点击下方按钮会在外部页面打开评估平台。
        </p>
        <a
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-[8px] bg-primary px-4 text-[13px] font-bold text-primary-foreground hover:bg-primary/90"
          href={EVAL_APP_URL}
          rel="noreferrer"
          target="_blank"
        >
          前往评估平台
          <ExternalLink className="size-4" />
        </a>
      </section>
    </main>
  )
}
