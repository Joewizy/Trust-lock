import Link from "next/link"
import { ArrowUpRight, Search } from "lucide-react"

import { PageShell } from "@/components/shared/page-shell"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

const categories = ["Open Governance", "Frontend", "Public Goods", "DeSci"]

const raises = [
  {
    id: "openvote",
    title: "OpenVote Registry",
    description:
      "A permissionless registry for community elections, with weighted and equal-vote modes.",
    raised: "$5,322.12",
    target: "$8,322.12",
    locked: "$5,322.12",
    progress: 64,
    status: "Active",
  },
  {
    id: "audit",
    title: "Quorum Audit Pack",
    description:
      "Funding a full security audit, documentation overhaul, and launch support.",
    raised: "$4,109.88",
    target: "$9,800.00",
    locked: "$3,810.44",
    progress: 42,
    status: "Active",
  },
  {
    id: "atlas",
    title: "Atlas Climate Ledger",
    description:
      "Carbon offset verification with milestone gated releases for the core team.",
    raised: "$7,920.20",
    target: "$10,500.00",
    locked: "$6,112.09",
    progress: 75,
    status: "Active",
  },
]

export default function Home() {
  return (
    <PageShell>
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div className="space-y-5">
          <Badge variant="secondary">Discover Raises</Badge>
          <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl font-[var(--font-display)]">
            Build with transparency. Fund work you can verify.
          </h1>
          <p className="max-w-xl text-base text-muted-foreground">
            TRUSTLOCK helps contributors coordinate milestone-based funding for ambitious
            public projects. Track progress, vote on deliverables, and release funds
            only when outcomes are proven.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/raise/create/basic"
              className={cn(buttonVariants({ variant: "default" }))}
            >
              Start a Raise
            </Link>
            <Link
              href="/how-it-works"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              How it works
            </Link>
          </div>
        </div>
        <Card className="bg-white/70">
          <CardHeader>
            <CardTitle>Search raises</CardTitle>
            <CardDescription>
              Find active raises, creators, and themes to support.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10" placeholder="Search for a raise" />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge key={category} variant="outline">
                  {category}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {raises.map((raise) => (
          <Card key={raise.id} className="flex h-full flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{raise.title}</CardTitle>
                <Badge variant="success">{raise.status}</Badge>
              </div>
              <CardDescription>{raise.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Progress value={raise.progress} />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Raised: {raise.raised}</span>
                  <span>Target: {raise.target}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Locked: {raise.locked}</span>
                <span>{raise.progress}% funded</span>
              </div>
            </CardContent>
            <CardFooter>
              <Link
                href="/raises"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                View raise
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Badge variant="secondary">Milestone live</Badge>
            </CardFooter>
          </Card>
        ))}
      </section>
    </PageShell>
  )
}
