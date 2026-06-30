import type { Metadata } from "next"
import Link from "next/link"

import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Guide & troubleshooting",
  description:
    "How to install and run Youloader, fix the YouTube bot gate with cookies, run it on macOS or Linux, and solve common download problems.",
  alternates: { canonical: "/guide" },
}

const REPO = "https://github.com/rob0pup/r2-youloader"
const LATEST = `${REPO}/releases/latest/download`
const DL = {
  win: `${LATEST}/Youloader-Setup.exe`,
  macArm: `${LATEST}/Youloader-arm64.dmg`,
  linux: `${LATEST}/Youloader.AppImage`,
}
const DOWNLOAD = DL.win

const TOC = [
  { id: "install-windows", label: "Install on Windows" },
  { id: "smartscreen", label: "The SmartScreen warning" },
  { id: "mac-linux", label: "macOS & Linux" },
  { id: "bot-gate", label: "“Sign in to confirm you’re not a bot”" },
  { id: "no-formats", label: "A video won’t resolve" },
  { id: "save-location", label: "Where files are saved" },
  { id: "playlists", label: "Downloading playlists" },
  { id: "slow", label: "Slow or stuck downloads" },
  { id: "antivirus", label: "Antivirus false positives" },
  { id: "updating", label: "Updating" },
]

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className="scroll-mt-20 border-t border-line py-8 first:border-t-0"
    >
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-border bg-card p-4 font-mono text-xs leading-relaxed text-foreground">
      <code>{children}</code>
    </pre>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-xs text-foreground">
      {children}
    </span>
  )
}

export default function GuidePage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col px-6">
      <SiteHeader />

      <article className="py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Guide &amp; troubleshooting
        </h1>
        <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
          Everything you need to get Youloader running, on any OS, and fixes for
          the handful of things YouTube can throw at you.
        </p>

        <nav
          aria-label="On this page"
          className="mt-8 rounded-xl border border-border bg-card p-5"
        >
          <p className="text-xs font-semibold tracking-wide text-foreground uppercase">
            On this page
          </p>
          <ul className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
            {TOC.map((t) => (
              <li key={t.id}>
                <a
                  href={`#${t.id}`}
                  className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  {t.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-6">
          <Section id="install-windows" title="Install on Windows">
            <p>
              Download the installer, run it, and follow the prompts. You can
              choose where to install. The first time you resolve a link,
              Youloader quietly downloads its engine (yt-dlp, ffmpeg, and a small
              JavaScript runtime) into its own folder, so there is nothing else
              to install.
            </p>
            <p>
              <a href={DOWNLOAD} className={cn(buttonVariants({ size: "sm" }))}>
                Download for Windows
              </a>
            </p>
          </Section>

          <Section id="smartscreen" title="The SmartScreen warning">
            <p>
              The installer is not code-signed yet, so Windows may show a blue{" "}
              <strong className="text-foreground">
                “Windows protected your PC”
              </strong>{" "}
              screen. This is expected for a small open-source app, not a sign of
              anything wrong.
            </p>
            <p>
              Click <Kbd>More info</Kbd>, then <Kbd>Run anyway</Kbd>. If you would
              rather verify the file first, the source is public and every build
              is produced in the open on GitHub Actions.
            </p>
          </Section>

          <Section id="mac-linux" title="macOS & Linux">
            <p>
              Youloader is built for macOS and Linux too. Grab the right build:
            </p>
            <div className="flex flex-wrap gap-2">
              <a href={DL.macArm} className={cn(buttonVariants({ size: "sm" }))}>
                macOS (Apple Silicon)
              </a>
              <a
                href={DL.linux}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Linux (AppImage)
              </a>
            </div>
            <p>
              The macOS build is for <strong className="text-foreground">Apple
              Silicon</strong> (M1 and later, every Mac since late 2020). On an
              older <strong className="text-foreground">Intel</strong> Mac, build
              from source (below).
            </p>

            <p className="pt-1">
              <strong className="text-foreground">On macOS</strong>, the app
              isn’t notarized yet, so Gatekeeper will block the first launch.
              Right-click (or Control-click) Youloader in Applications and choose{" "}
              <Kbd>Open</Kbd>, then <Kbd>Open</Kbd> again. If macOS insists the
              app is “damaged”, clear the quarantine flag in Terminal:
            </p>
            <Code>{`xattr -cr /Applications/Youloader.app`}</Code>

            <p>
              <strong className="text-foreground">On Linux</strong>, make the
              AppImage executable and run it (no install needed):
            </p>
            <Code>{`chmod +x Youloader.AppImage
./Youloader.AppImage`}</Code>

            <p>
              Prefer to build it yourself? Clone the repo and run{" "}
              <span className="font-mono text-xs">pnpm dev</span>, or{" "}
              <span className="font-mono text-xs">
                pnpm exec electron-builder --mac
              </span>{" "}
              / <span className="font-mono text-xs">--linux</span>. See{" "}
              <a
                href={`${REPO}/blob/main/docs/BUILDING.md`}
                target="_blank"
                rel="noopener"
                className="text-foreground underline underline-offset-2"
              >
                BUILDING.md
              </a>
              .
            </p>
          </Section>

          <Section
            id="bot-gate"
            title="“Sign in to confirm you’re not a bot”"
          >
            <p>
              YouTube sometimes asks a downloader to prove it is a real,
              signed-in viewer. When that happens, give Youloader your browser
              session:
            </p>
            <ul className="ml-4 list-disc space-y-1.5">
              <li>
                In the app, open the <strong className="text-foreground">cookies</strong>{" "}
                row and pick the browser you are signed into YouTube with.{" "}
                <strong className="text-foreground">Firefox</strong> works most
                reliably.
              </li>
              <li>
                On Chrome or Edge, Windows locks and encrypts the cookie database
                while the browser is open, so reading cookies can fail. If it
                does, export a <span className="font-mono text-xs">cookies.txt</span>{" "}
                (any “Get cookies.txt” browser extension) and import it with{" "}
                <strong className="text-foreground">Import cookies.txt</strong>{" "}
                instead. That route works for any browser.
              </li>
            </ul>
            <p>
              Then resolve the link again. Your cookies never leave your machine.
            </p>
          </Section>

          <Section id="no-formats" title="A video won’t resolve">
            <p>
              YouTube changes its protections often. Youloader tracks the nightly
              build of yt-dlp and bundles a JavaScript runtime to solve YouTube’s
              “n challenge”, so empty or images-only results are rare. If a video
              still fails:
            </p>
            <ul className="ml-4 list-disc space-y-1.5">
              <li>Try again in a moment, transient YouTube errors are common.</li>
              <li>Add your cookies (see above), some videos need a session.</li>
              <li>
                Age- or region-restricted and members-only videos require an
                account that can actually watch them, via cookies.
              </li>
            </ul>
          </Section>

          <Section id="save-location" title="Where files are saved">
            <p>
              By default downloads go to your system{" "}
              <strong className="text-foreground">Downloads</strong> folder. Use
              the <strong className="text-foreground">Save to</strong> row to pick
              a different folder; Youloader remembers your choice. Playlists are
              saved into a subfolder named after the playlist.
            </p>
          </Section>

          <Section id="playlists" title="Downloading playlists">
            <p>
              Paste a playlist link and Youloader switches to playlist mode. Pick
              a quality preset, then <strong className="text-foreground">Download all</strong>.
              Every item is downloaded in one pass and numbered in order inside a
              folder named after the playlist.
            </p>
          </Section>

          <Section id="slow" title="Slow or stuck downloads">
            <p>
              Speed is set by YouTube, not the app. A few things help:
            </p>
            <ul className="ml-4 list-disc space-y-1.5">
              <li>
                Signing in via cookies can lift throttling on some videos.
              </li>
              <li>
                High-resolution video (4K/8K) downloads the video and audio
                separately and then merges them with ffmpeg, so the last step can
                take a little while, this is normal.
              </li>
              <li>
                If a download seems frozen at the merge step, give it a moment;
                merging a long 4K file is CPU-bound.
              </li>
            </ul>
          </Section>

          <Section id="antivirus" title="Antivirus false positives">
            <p>
              Tools built on yt-dlp are occasionally flagged by antivirus engines
              as a false positive, partly because the installer is unsigned and
              the app downloads its engine on first run. Nothing is hidden: the
              full source is public and the binaries are built transparently in
              CI. If you are unsure, build it yourself from source (see macOS &amp;
              Linux above, the same works on Windows).
            </p>
          </Section>

          <Section id="updating" title="Updating">
            <p>
              The download engine (yt-dlp) updates itself automatically, which is
              what keeps up with YouTube’s changes. To update the app itself, grab
              the latest installer and run it over your existing install.
            </p>
            <p>
              <a
                href={`${REPO}/releases`}
                target="_blank"
                rel="noopener"
                className="text-foreground underline underline-offset-2"
              >
                See all releases →
              </a>
            </p>
          </Section>
        </div>

        <div className="mt-10 rounded-xl border border-border bg-card p-6 text-center">
          <h2 className="text-base font-semibold">Still stuck?</h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-pretty text-muted-foreground">
            Open an issue on GitHub with the link you tried and any error
            message, and I’ll take a look.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <a
              href={`${REPO}/issues`}
              target="_blank"
              rel="noopener"
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Open an issue
            </a>
            <Link
              href="/"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Back to home
            </Link>
          </div>
        </div>
      </article>

      <SiteFooter />
    </main>
  )
}
