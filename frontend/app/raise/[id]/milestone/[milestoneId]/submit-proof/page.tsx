import Link from "next/link"
import { UploadCloud } from "lucide-react"

import { PageShell } from "@/components/shared/page-shell"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export default function SubmitProof({
  params,
}: {
  params: { id: string; milestoneId: string }
}) {
  const basePath = `/raise/${params.id}`

  return (
    <PageShell>
      <section className="space-y-4">
        <Badge variant="secondary" className="w-fit">
          Submit Proof
        </Badge>
        <h1 className="text-3xl font-semibold sm:text-4xl font-[var(--font-display)]">
          Submit proof for Milestone {params.milestoneId}
        </h1>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="bg-white/85">
          <CardHeader>
            <CardTitle>Proof details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Explain what was delivered and how it maps to the milestone." />
            </div>
            <div className="space-y-2">
              <Label>Link to proof</Label>
              <Input placeholder="https://" />
            </div>
            <div className="space-y-2">
              <Label>Upload assets</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-border/80 bg-white text-xs text-muted-foreground"
                  >
                    <UploadCloud className="h-4 w-4 text-emerald-600" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <Link
                href={basePath}
                className={cn(buttonVariants({ variant: "ghost" }))}
              >
                Back
              </Link>
              <Link
                href={`${basePath}/vote`}
                className={cn(buttonVariants({ variant: "default" }))}
              >
                Submit proof
              </Link>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/70">
          <CardHeader>
            <CardTitle>Review checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Provide clear evidence and supporting links for reviewers.</p>
            <p>Include documentation, demo links, or repos where possible.</p>
            <p>Proof submissions open a voting window for contributors.</p>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  )
}
