import Link from "next/link"

import { PageShell } from "@/components/shared/page-shell"
import { RaiseStepper } from "@/components/shared/raise-stepper"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export default function CreateRaiseMilestones() {
  return (
    <PageShell>
      <section className="space-y-4">
        <Badge variant="secondary" className="w-fit">
          Create a Raise
        </Badge>
        <h1 className="text-3xl font-semibold sm:text-4xl font-[var(--font-display)]">
          Define your milestones.
        </h1>
        <RaiseStepper currentStep={2} />
      </section>

      <section className="mt-8 space-y-6">
        {[1, 2].map((step) => (
          <Card key={step} className="bg-white/80">
            <CardHeader>
              <CardTitle>Milestone {step}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Outcome</Label>
                <Textarea placeholder="Describe the deliverable for this milestone." />
              </div>
              <div className="space-y-2">
                <Label>Allocation</Label>
                <Input placeholder="40% (Approx $3,600)" />
              </div>
            </CardContent>
          </Card>
        ))}

        <Button variant="outline" className="w-full sm:w-fit">
          Add Milestone
        </Button>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link
            href="/raise/create/basic"
            className={cn(buttonVariants({ variant: "ghost" }))}
          >
            Back
          </Link>
          <Link
            href="/raise/create/acknowledgement"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            Next
          </Link>
        </div>
      </section>
    </PageShell>
  )
}
