import Link from "next/link"

import { LogoMark } from "@/components/logo-mark"

const REPO = "https://github.com/rob0pup/r2-youloader"

const LINKS: { label: string; href: string; external?: boolean }[] = [
  { label: "Guide & troubleshooting", href: "/guide" },
  { label: "Source on GitHub", href: REPO, external: true },
  { label: "Releases", href: `${REPO}/releases`, external: true },
  { label: "Squish", href: "https://compress.robinrahman.pro", external: true },
  { label: "Shop", href: "https://shop.robinrahman.pro", external: true },
]

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line py-10">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold tracking-tight">
          <LogoMark className="h-4 w-auto" />
          Youloader
        </span>
        <p className="max-w-xs text-xs text-pretty text-muted-foreground">
          A free, open-source desktop app to download YouTube videos and audio.
          Everything runs on your machine, nothing is uploaded.
        </p>

        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
          {LINKS.map((l) =>
            l.external ? (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener"
                className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.label}
                href={l.href}
                className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                {l.label}
              </Link>
            )
          )}
        </nav>

        <p className="text-xs text-muted-foreground">
          a tool by{" "}
          <a
            href="https://robinrahman.pro"
            target="_blank"
            rel="noopener"
            className="font-medium text-foreground underline underline-offset-2"
          >
            Robin
          </a>
          <span className="px-1.5 text-muted-foreground/50">·</span>
          <span className="tabular-nums">© 2026</span>
        </p>
      </div>
    </footer>
  )
}
