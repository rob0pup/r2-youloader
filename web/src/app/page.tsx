import {
  DownloadIcon,
  FilmIcon,
  ListVideoIcon,
  ShieldCheckIcon,
} from "lucide-react"

import { LogoMark } from "@/components/logo-mark"
import { ThemeToggle } from "@/components/theme-toggle"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const FEATURES = [
  {
    icon: ListVideoIcon,
    title: "Videos & playlists, up to 8K",
    body: "Grab a single video or a whole playlist from one link, in any quality from 144p to 8K.",
  },
  {
    icon: FilmIcon,
    title: "MP4 video or MP3 audio",
    body: "Pick the format you want. Keep the full video, or pull just the audio.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Runs on your machine",
    body: "Everything happens locally. Your downloads never pass through anyone's server.",
  },
  {
    icon: DownloadIcon,
    title: "Free, no limits",
    body: "No accounts, no quotas, no ads. Download as much as you like.",
  },
]

export default function Home() {
  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col px-6">
      <header className="flex items-center justify-between py-5">
        <span className="inline-flex items-center gap-2">
          <LogoMark className="h-5 w-auto" />
          <span className="text-sm font-semibold tracking-tight">Youloader</span>
        </span>
        <ThemeToggle />
      </header>

      <section className="flex flex-col items-center py-16 text-center sm:py-24">
        <LogoMark className="mb-7 h-14 w-auto" />
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Download from YouTube, on your PC.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-pretty text-muted-foreground">
          A free desktop app. Paste a link, pick a quality up to 8K, and save
          the video or audio. Runs entirely on your machine.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          <a
            href="/download/youloader-setup.exe"
            download
            className={cn(buttonVariants({ size: "lg" }), "gap-2")}
          >
            <DownloadIcon />
            Download for Windows
          </a>
          <span className="text-xs text-muted-foreground">
            Windows 10/11 &middot; free &amp; open. yt-dlp and ffmpeg set
            themselves up on first run.
          </span>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 pb-16 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-border bg-card p-5"
          >
            <f.icon className="size-5 text-foreground" />
            <h2 className="mt-3 text-sm font-semibold">{f.title}</h2>
            <p className="mt-1.5 text-sm text-pretty text-muted-foreground">
              {f.body}
            </p>
          </div>
        ))}
      </section>

      <footer className="mt-auto border-t border-line py-6 text-center text-xs text-muted-foreground">
        a tool by{" "}
        <a
          href="https://robinrahman.pro"
          target="_blank"
          rel="noopener"
          className="font-medium text-foreground underline underline-offset-2"
        >
          Robin
        </a>
      </footer>
    </main>
  )
}
