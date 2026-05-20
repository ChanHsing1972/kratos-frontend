import type { ReactNode } from "react"

type KratosPageHeaderProps = {
  actions?: ReactNode
  subtitle?: string
  title: string
}

export function KratosPageHeader({ title }: KratosPageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-[28px] font-medium">{title}</h1>
      </div>
    </header>
  )
}
