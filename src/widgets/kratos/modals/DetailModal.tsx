import { Check } from "lucide-react"

import type { DetailPanel } from "@/entities/kratos/model/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"

type DetailModalProps = {
  onClose: () => void
  panel: DetailPanel | null
}

export function DetailModal({ onClose, panel }: DetailModalProps) {
  const open = panel !== null

  if (!panel) {
    return null
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-107.5">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-black tracking-[-0.04em]">
            {panel.title}
          </DialogTitle>
          <DialogDescription className="text-[13px] leading-6 text-muted-foreground">
            {panel.body}
          </DialogDescription>
        </DialogHeader>
        {panel.items ? (
          <div className="mt-1 flex flex-col gap-2">
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
      </DialogContent>
    </Dialog>
  )
}
