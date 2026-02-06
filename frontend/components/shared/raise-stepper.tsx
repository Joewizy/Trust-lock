import Link from "next/link"

import { cn } from "@/lib/utils"

const steps = [
  { label: "Basic Info", href: "/raise/create/basic" },
  { label: "Define Milestones", href: "/raise/create/milestones" },
  { label: "Acknowledgement", href: "/raise/create/acknowledgement" },
]

export function RaiseStepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      {steps.map((step, index) => {
        const isActive = currentStep === index + 1
        const isCompleted = currentStep > index + 1

        return (
          <Link
            key={step.href}
            href={step.href}
            className={cn(
              "flex items-center gap-3 rounded-full border px-4 py-2 text-sm transition",
              isActive
                ? "border-emerald-500 bg-white/80 text-foreground shadow-sm"
                : "border-border/70 bg-white/50 text-muted-foreground hover:bg-white/80",
              isCompleted && "border-emerald-300 text-emerald-700"
            )}
          >
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold",
                isActive
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-border/80 bg-white",
                isCompleted && "border-emerald-400 bg-emerald-100 text-emerald-700"
              )}
            >
              {index + 1}
            </span>
            <span className="font-medium">{step.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
