import Link from "next/link"
import { Search } from "lucide-react"

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

const myRaises = [
  {
    id: "openvote",
    title: "OpenVote Registry",
    description:
      "Funding the core registry, audit, and public frontend for the initiative.",
    raised: "$5,322.12",
    target: "$8,322.12",
    locked: "$5,322.12",
    progress: 64,
    status: "Active",
  },
  {
    id: "atlas",
    title: "Atlas Climate Ledger",
    description:
      "Verification rails for high-integrity climate projects worldwide.",
    raised: "$7,920.20",
    target: "$10,500.00",
    locked: "$6,112.09",
    progress: 75,
    status: "Active",
  },
]

export default function Activity() {
  return (
    <PageShell>
      <section className="space-y-4">
        <Badge variant="secondary" className="w-fit">
          My Activity
        </Badge>
        <h1 className="text-4xl font-semibold leading-tight sm:text-5xl font-[var(--font-display)]">
          Your raises at a glance.
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          Track the raises you have created, monitor funding progress, and manage
          your milestones from a single place.
        </p>
      </section>

      <div className="mt-8 max-w-xl">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Search your raises" />
        </div>
      </div>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        {myRaises.map((raise) => (
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
                href={`/raise/${raise.id}`}
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                View raise
              </Link>
              <Badge variant="secondary">Milestone live</Badge>
            </CardFooter>
          </Card>
        ))}
      </section>
    </PageShell>
  )
}
