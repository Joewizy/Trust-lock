import * as React from "react"

import { cn } from "@/lib/utils"
import { SiteHeader } from "@/components/shared/site-header"

interface PageShellProps {
  children: React.ReactNode
  className?: string
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f6f5ef]">
      <div className="pointer-events-none absolute left-[-160px] top-[-120px] h-[380px] w-[380px] rounded-full bg-emerald-200/50 blur-3xl" />
      <div className="pointer-events-none absolute right-[-200px] top-[-160px] h-[420px] w-[420px] rounded-full bg-sky-200/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-200px] left-[20%] h-[360px] w-[360px] rounded-full bg-amber-100/60 blur-3xl" />
      <div className="relative z-10">
        <SiteHeader />
        <main className={cn("mx-auto w-full max-w-6xl px-6 pb-20 pt-10", className)}>
          {children}
        </main>
      </div>
    </div>
  )
}
