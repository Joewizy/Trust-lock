import Link from "next/link"
import { CheckCircle2, Sparkles } from "lucide-react"

import { PageShell } from "@/components/shared/page-shell"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const steps = [
  {
    title: "Design your raise",
    description:
      "Define milestones, allocations, and timelines. Every release is linked to a deliverable.",
  },
  {
    title: "Invite contributors",
    description:
      "Share the raise page and collect funding in escrow. Supporters get voting rights.",
  },
  {
    title: "Submit proof",
    description:
      "When a milestone is complete, upload evidence for verification and open voting.",
  },
  {
    title: "Unlock the next phase",
    description:
      "Approved milestones release funds automatically and the raise moves forward.",
  },
]

export default function HowItWorks() {
  return (
    <PageShell>
      <section className="space-y-4">
        <Badge variant="secondary" className="w-fit">
          How It Works
        </Badge>
        <h1 className="text-4xl font-semibold leading-tight sm:text-5xl font-[var(--font-display)]">
          Milestone funding that feels fair, transparent, and immediate.
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          RaiseBox keeps contributors and builders aligned. You plan milestones, collect
          funds in escrow, and release them only after the community approves your proof.
        </p>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        {steps.map((step, index) => (
          <Card key={step.title} className="bg-white/70">
            <CardHeader className="flex flex-row items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <span className="text-sm font-semibold">{index + 1}</span>
              </div>
              <div>
                <CardTitle>{step.title}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="bg-white/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              RaiseBox guarantees
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {[
              "Escrowed funds protect contributors until milestones are approved.",
              "Voting windows and proof requirements are baked into every raise.",
              "Creators always know what happens next and when funds unlock.",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="bg-emerald-600 text-white">
          <CardHeader>
            <CardTitle className="text-white">Ready to launch?</CardTitle>
            <p className="text-sm text-emerald-50">
              Start a raise in minutes and invite your first contributors today.
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button className="bg-white text-emerald-700 hover:bg-emerald-50">
              Create a raise
            </Button>
            <Link
              href="/"
              className={cn(buttonVariants({ variant: "ghost" }), "text-white hover:text-emerald-50")}
            >
              Browse raises
            </Link>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  )
}
