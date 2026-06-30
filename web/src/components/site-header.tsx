import Link from "next/link"

import { LogoMark } from "@/components/logo-mark"
import { ThemeToggle } from "@/components/theme-toggle"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between py-5">
      <Link
        href="/"
        className="inline-flex items-center gap-2 transition-opacity hover:opacity-80"
      >
        <LogoMark className="h-5 w-auto" />
        <span className="text-sm font-semibold tracking-tight">Youloader</span>
      </Link>
      <nav className="flex items-center gap-1">
        <Link
          href="/guide"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          Guide
        </Link>
        <ThemeToggle />
      </nav>
    </header>
  )
}
