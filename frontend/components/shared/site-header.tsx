import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navLinks = [
  { label: "Discover", href: "/" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "My Activity", href: "/activity" },
]

export function SiteHeader() {
  return (
    <header className="relative z-10 w-full border-b border-transparent">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          RaiseBox
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/raise/create/basic"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Create a Raise
          </Link>
          <Button size="sm" className="hidden sm:inline-flex">
            Connect Wallet
            <ArrowUpRight className="h-4 w-4" />
          </Button>
          <div className="hidden rounded-full border border-border/70 bg-white/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm md:block">
            0x1234...abcd
          </div>
        </div>
      </div>
    </header>
  )
}
