import type { ReactNode } from "react"

import { ThemeProvider } from "@/app/providers/theme-provider"
import { TooltipProvider } from "@/shared/ui/tooltip"

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider defaultTheme="light" storageKey="kratos-agent-theme">
      <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
    </ThemeProvider>
  )
}
