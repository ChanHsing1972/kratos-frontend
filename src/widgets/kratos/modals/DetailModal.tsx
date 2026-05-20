import { Check, X } from "lucide-react"

import type { DetailPanel } from "@/entities/kratos/model/types"

type DetailModalProps = {
  onClose: () => void
  panel: DetailPanel | null
}

export function DetailModal({ onClose, panel }: DetailModalProps) {
  if (!panel) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/30 px-4 backdrop-blur-[2px]">
      <section className="w-full max-w-[430px] rounded-[18px] border border-border bg-card p-5 shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[18px] font-black tracking-[-0.04em]">
              {panel.title}
            </h2>
            <p className="mt-3 text-[13px] leading-6 text-muted-foreground">
              {panel.body}
            </p>
          </div>
          <button
            className="grid size-8 place-items-center rounded-full hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
        {panel.items ? (
          <div className="mt-4 flex flex-col gap-2">
            {panel.items.map((item) => (
              <div
                className="flex items-start gap-3 rounded-[10px] bg-muted p-3 text-[12px] leading-5 text-muted-foreground"
                key={item}
              >
                <Check className="mt-0.5 size-4 shrink-0 text-foreground" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}
