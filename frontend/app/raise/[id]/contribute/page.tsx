import Link from "next/link"
import { Coins } from "lucide-react"

import { PageShell } from "@/components/shared/page-shell"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const presetAmounts = [200, 400, 800, 1200]

export default function ContributePage({ params }: { params: { id: string } }) {
  const basePath = `/raise/${params.id}`

  return (
    <PageShell>
      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <Badge variant="secondary" className="w-fit">
            Contribute to OpenVote Registry
          </Badge>
          <h1 className="text-3xl font-semibold sm:text-4xl font-[var(--font-display)]">
            Enter your contribution
          </h1>
          <Card className="bg-white/85">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-emerald-600" />
                Select token
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {presetAmounts.map((amount) => (
                  <Button key={amount} variant="outline" className="h-10">
                    ${amount}
                  </Button>
                ))}
                <Button variant="outline" className="h-10">
                  ETH
                </Button>
              </div>
              <Input placeholder="Enter amount" />
              <Separator />
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Your contribution is locked in escrow. Funds are released only if
                  milestones are approved by contributors.
                </p>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    You are funding
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>Milestone 1 — Smart contract deployment</li>
                    <li>Milestone 2 — Security audit</li>
                    <li>Milestone 3 — Frontend & docs</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit bg-white/85">
          <CardHeader>
            <CardTitle>Contribution summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={62} />
            <div className="text-sm text-muted-foreground">
              $5,232 out of $8,500 raised
            </div>
            <Separator />
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Your contribution</span>
                <span>$200</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Gas fee</span>
                <span>$6</span>
              </div>
              <div className="flex items-center justify-between font-medium text-foreground">
                <span>Total</span>
                <span>$206</span>
              </div>
            </div>
            <Button className="w-full">Contribute to Raise</Button>
            <Link
              href={basePath}
              className={cn(buttonVariants({ variant: "ghost" }), "w-full justify-center")}
            >
              Back to raise
            </Link>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  )
}
