import Link from "next/link"
import { ImagePlus } from "lucide-react"

import { PageShell } from "@/components/shared/page-shell"
import { RaiseStepper } from "@/components/shared/raise-stepper"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export default function CreateRaiseBasic() {
  return (
    <PageShell>
      <section className="space-y-4">
        <Badge variant="secondary" className="w-fit">
          Create a Raise
        </Badge>
        <h1 className="text-3xl font-semibold sm:text-4xl font-[var(--font-display)]">
          Start with the basics.
        </h1>
        <RaiseStepper currentStep={1} />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="bg-white/80">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Project name</Label>
              <Input placeholder="OpenVote Registry" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Describe the mission, impact, and what you will deliver." />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Total funding target</Label>
                <Input placeholder="$8,500" />
              </div>
              <div className="space-y-2">
                <Label>Raise duration</Label>
                <Input placeholder="45 days" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Upload cover image</Label>
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border/80 bg-white px-4 py-6 text-sm text-muted-foreground">
                <ImagePlus className="h-5 w-5 text-emerald-500" />
                <span>Drag and drop or browse files</span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <Link
                href="/"
                className={cn(buttonVariants({ variant: "ghost" }))}
              >
                Cancel
              </Link>
              <Link
                href="/raise/create/milestones"
                className={cn(buttonVariants({ variant: "default" }))}
              >
                Next
              </Link>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/70">
          <CardHeader>
            <CardTitle>What happens next</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Add milestones with clear outcomes. Each milestone defines the amount
              that can be unlocked after contributor approval.
            </p>
            <p>
              Once published, the milestone structure and funding rules are locked in.
            </p>
            <Button variant="outline" className="w-full">
              Preview raise details
            </Button>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  )
}
