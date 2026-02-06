import Link from "next/link"

import { PageShell } from "@/components/shared/page-shell"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export default function VotePage({ params }: { params: { id: string } }) {
  const basePath = `/raise/${params.id}`

  return (
    <PageShell>
      <section className="space-y-4">
        <Badge variant="secondary" className="w-fit">
          Milestone Vote
        </Badge>
        <h1 className="text-3xl font-semibold sm:text-4xl font-[var(--font-display)]">
          Vote on Milestone 1
        </h1>
      </section>

      <section className="mt-10 flex items-center justify-center">
        <Card className="w-full max-w-3xl bg-white/90">
          <CardHeader>
            <CardTitle>Votes are final</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-sm text-muted-foreground">
            <p>
              Review the submitted proof carefully. Once you cast your vote, it is
              recorded on-chain and cannot be reversed.
            </p>
            <Separator />
            <div className="space-y-2">
              <p className="font-medium text-foreground">Supporting files</p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  GitHub link
                </Link>
                <Link
                  href="/"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Figma file
                </Link>
              </div>
            </div>
            <Separator />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                href={basePath}
                className={cn(buttonVariants({ variant: "ghost" }))}
              >
                Back to raise
              </Link>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={basePath}
                  className={cn(buttonVariants({ variant: "outline" }))}
                >
                  No, reject
                </Link>
                <Link
                  href={basePath}
                  className={cn(buttonVariants({ variant: "default" }))}
                >
                  Yes, approve
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  )
}
