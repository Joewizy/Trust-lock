import Link from "next/link"

import { PageShell } from "@/components/shared/page-shell"
import { RaiseStepper } from "@/components/shared/raise-stepper"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

const rules = [
  "All contributed funds are held in escrow until a milestone is approved by contributors.",
  "No individual can override milestone outcomes, voting results, or protocol rules.",
  "If milestones fail, contributors can reclaim refundable funds automatically.",
]

export default function CreateRaiseAcknowledgement() {
  return (
    <PageShell>
      <section className="space-y-4">
        <Badge variant="secondary" className="w-fit">
          Create a Raise
        </Badge>
        <h1 className="text-3xl font-semibold sm:text-4xl font-[var(--font-display)]">
          Acknowledge the protocol rules.
        </h1>
        <RaiseStepper currentStep={3} />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <Card className="bg-white/85">
          <CardHeader>
            <CardTitle>Before you publish</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Before this raise can be created, you must explicitly acknowledge the
              rules enforced by the RaiseBox protocol. These rules are automatic and
              apply equally to all participants.
            </p>
            <div className="space-y-4">
              {rules.map((rule) => (
                <label key={rule} className="flex items-start gap-3 text-sm">
                  <Checkbox />
                  <span className="text-muted-foreground">{rule}</span>
                </label>
              ))}
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              Creating this raise is irreversible. Once published, milestone structure,
              funding rules, and protocol constraints cannot be changed.
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <Link
                href="/raise/create/milestones"
                className={cn(buttonVariants({ variant: "ghost" }))}
              >
                Back
              </Link>
              <Link
                href="/raise/openvote"
                className={cn(buttonVariants({ variant: "default" }))}
              >
                Create Raise
              </Link>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/70">
          <CardHeader>
            <CardTitle>Publishing tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Strong raises outline outcomes, timelines, and evidence expectations
              up front. Aim for clarity and measurable progress.
            </p>
            <p>Consider including supporting links or docs for each milestone.</p>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  )
}
