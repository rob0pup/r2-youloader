import {
  CheckIcon,
  DownloadIcon,
  FolderOpenIcon,
  Loader2Icon,
  TriangleAlertIcon,
} from "lucide-react"
import { useEffect, useState } from "react"

import type { CookiesBrowser } from "../../shared/types"

import { LogoMark } from "@/components/logo-mark"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { formatBytes, formatDuration } from "@/lib/format"

type VideoInfo = Awaited<ReturnType<Window["youloader"]["resolve"]>>
type Status = "idle" | "resolving" | "done" | "error"

type Option = {
  formatId: string
  label: string
  sub: string
  isAudio: boolean
  hasAudio: boolean
  container: string
}

type DownloadState = {
  status: "downloading" | "done" | "error"
  percent: number
  merging?: boolean
  path?: string
  error?: string
}

const BROWSERS: { value: CookiesBrowser; label: string }[] = [
  { value: "none", label: "None" },
  { value: "chrome", label: "Chrome" },
  { value: "edge", label: "Edge" },
  { value: "firefox", label: "Firefox" },
  { value: "brave", label: "Brave" },
  { value: "opera", label: "Opera" },
  { value: "vivaldi", label: "Vivaldi" },
]

function App(): React.JSX.Element {
  const [url, setUrl] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [info, setInfo] = useState<VideoInfo | null>(null)
  const [error, setError] = useState("")
  const [setupPercent, setSetupPercent] = useState(0)
  const [cookiesBrowser, setCookiesBrowser] = useState<CookiesBrowser>("none")
  const [cookiesFile, setCookiesFile] = useState<string | null>(null)
  const [downloads, setDownloads] = useState<Record<string, DownloadState>>({})

  useEffect(() => window.youloader.onSetupProgress(setSetupPercent), [])

  useEffect(() => {
    return window.youloader.onDownloadProgress(({ id, percent, merging }) => {
      setDownloads((d) => ({
        ...d,
        [id]: { ...d[id], status: "downloading", percent, merging },
      }))
    })
  }, [])

  async function importCookies(): Promise<void> {
    const path = await window.youloader.pickCookiesFile()
    if (path) setCookiesFile(path)
  }

  async function handleResolve(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!url.trim() || status === "resolving") return
    setStatus("resolving")
    setError("")
    setInfo(null)
    setDownloads({})
    try {
      const result = await window.youloader.resolve(url.trim(), {
        cookiesBrowser,
        cookiesFile,
      })
      setInfo(result)
      setStatus("done")
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not resolve that link."
      const botGate = /not a bot|sign in to confirm/i.test(msg)
      const cookieLock = /could not copy|cookie database/i.test(msg)
      setError(
        botGate
          ? "YouTube wants to confirm you're a real person. Pick the browser you're signed into YouTube on below, or import a cookies.txt, then Resolve again."
          : cookieLock
            ? "That browser locks its cookies while it's open. Fully quit it and retry, pick a different browser, or import a cookies.txt (most reliable)."
            : msg
      )
      setStatus("error")
    } finally {
      setSetupPercent(0)
    }
  }

  async function handleDownload(opt: Option): Promise<void> {
    if (!info) return
    setDownloads((d) => ({
      ...d,
      [opt.formatId]: { status: "downloading", percent: 0 },
    }))
    try {
      const path = await window.youloader.download({
        url: url.trim(),
        title: info.title,
        formatId: opt.formatId,
        isAudio: opt.isAudio,
        hasAudio: opt.hasAudio,
        container: opt.container,
        label: opt.label,
        cookiesBrowser,
        cookiesFile,
      })
      setDownloads((d) => ({
        ...d,
        [opt.formatId]: { status: "done", percent: 100, path },
      }))
    } catch (err) {
      setDownloads((d) => ({
        ...d,
        [opt.formatId]: {
          status: "error",
          percent: 0,
          error: err instanceof Error ? err.message : "Download failed",
        },
      }))
    }
  }

  const seen = new Set<number>()
  const videoOptions: Option[] = (info?.formats ?? [])
    .filter((f) => f.height != null)
    .sort((a, b) => b.height! - a.height!)
    .filter((f) => (seen.has(f.height!) ? false : (seen.add(f.height!), true)))
    .map((f) => ({
      formatId: f.id,
      label: `${f.height}p`,
      sub: `MP4 · ${formatBytes(f.filesize)}`,
      isAudio: false,
      hasAudio: f.hasAudio,
      container: "mp4",
    }))

  const allAudio = (info?.formats ?? []).filter(
    (f) => f.height == null && f.hasAudio
  )
  const m4a = allAudio.filter((f) => f.ext === "m4a")
  const audioOptions: Option[] = (m4a.length ? m4a : allAudio)
    .sort((a, b) => (b.filesize ?? 0) - (a.filesize ?? 0))
    .slice(0, 2)
    .map((f) => ({
      formatId: f.id,
      label: "Audio",
      sub: `${f.ext.toUpperCase()} · ${formatBytes(f.filesize)}`,
      isAudio: true,
      hasAudio: true,
      container: f.ext,
    }))

  const options = [...videoOptions, ...audioOptions]

  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col px-6">
      <header className="flex items-center justify-between py-5">
        <span className="inline-flex items-center gap-2">
          <LogoMark className="h-5 w-auto" />
          <span className="text-sm font-semibold tracking-tight">Youloader</span>
        </span>
        <ThemeToggle />
      </header>

      <div className="flex flex-1 flex-col py-8">
        <form onSubmit={handleResolve} className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a YouTube link…"
            autoFocus
            className="min-w-0 flex-1 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 placeholder:text-muted-foreground"
          />
          <Button type="submit" size="lg" disabled={status === "resolving"}>
            {status === "resolving" ? (
              <>
                <Loader2Icon className="animate-spin" />
                Resolving
              </>
            ) : (
              "Resolve"
            )}
          </Button>
        </form>

        <div className="mt-3 space-y-2 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2">
            <span>If a video is blocked, sign in with cookies from</span>
            <select
              value={cookiesBrowser}
              disabled={!!cookiesFile}
              onChange={(e) =>
                setCookiesBrowser(e.target.value as CookiesBrowser)
              }
              className="cursor-pointer rounded-md border border-border bg-card px-2 py-1 text-foreground outline-none focus-visible:border-ring disabled:opacity-50"
            >
              {BROWSERS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
            <span>or</span>
            <Button variant="outline" size="sm" onClick={importCookies}>
              Import cookies.txt
            </Button>
          </div>
          {cookiesFile && (
            <div className="flex items-center gap-2">
              <span className="text-foreground">
                Using {cookiesFile.split(/[\\/]/).pop()}
              </span>
              <button
                type="button"
                onClick={() => setCookiesFile(null)}
                className="cursor-pointer underline underline-offset-2 hover:text-foreground"
              >
                clear
              </button>
            </div>
          )}
        </div>

        {status === "resolving" && setupPercent > 0 && setupPercent < 100 && (
          <p className="mt-3 text-sm text-muted-foreground">
            First run: downloading the yt-dlp engine… {setupPercent}%
          </p>
        )}

        {status === "error" && (
          <p className="mt-4 flex items-start gap-2 text-sm text-destructive">
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        )}

        {status === "done" && info && (
          <div className="mt-6 space-y-5">
            <div className="flex gap-4">
              {info.thumbnail && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={info.thumbnail}
                  alt=""
                  className="aspect-video w-40 shrink-0 rounded-lg border border-border object-cover"
                />
              )}
              <div className="min-w-0">
                <h1 className="text-pretty font-semibold">{info.title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {info.uploader}
                  {info.uploader && info.durationSeconds ? " · " : ""}
                  {formatDuration(info.durationSeconds)}
                </p>
              </div>
            </div>

            <section className="space-y-2">
              <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Available formats
              </h2>
              <div className="divide-y divide-line overflow-hidden rounded-xl border border-border">
                {options.map((opt) => (
                  <FormatRow
                    key={opt.formatId}
                    option={opt}
                    state={downloads[opt.formatId]}
                    onDownload={() => handleDownload(opt)}
                    onShow={(p) => window.youloader.showInFolder(p)}
                  />
                ))}
                {options.length === 0 && (
                  <p className="px-4 py-3 text-sm text-muted-foreground">
                    No downloadable formats were returned for this video.
                  </p>
                )}
              </div>
            </section>
          </div>
        )}
      </div>

      <footer className="border-t border-line py-6 text-center text-xs text-muted-foreground">
        a desktop tool by Robin
      </footer>
    </main>
  )
}

function FormatRow({
  option,
  state,
  onDownload,
  onShow,
}: {
  option: Option
  state: DownloadState | undefined
  onDownload: () => void
  onShow: (path: string) => void
}): React.JSX.Element {
  const downloading = state?.status === "downloading"
  const done = state?.status === "done"
  const errored = state?.status === "error"

  return (
    <div className="px-4 py-2.5">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">{option.label}</span>
        <span className="text-xs text-muted-foreground">{option.sub}</span>

        {done ? (
          <button
            type="button"
            onClick={() => state?.path && onShow(state.path)}
            className="ml-auto inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
          >
            <CheckIcon className="size-3.5" />
            Saved
            <FolderOpenIcon className="size-3.5" />
          </button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            disabled={downloading}
            onClick={onDownload}
          >
            {downloading ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <DownloadIcon />
            )}
            {downloading
              ? state?.merging
                ? "Merging…"
                : `${Math.round(state?.percent ?? 0)}%`
              : "Download"}
          </Button>
        )}
      </div>

      {downloading && (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-foreground transition-[width] duration-200"
            style={{ width: `${state?.merging ? 100 : (state?.percent ?? 0)}%` }}
          />
        </div>
      )}
      {errored && (
        <p className="mt-1.5 text-xs text-destructive">{state?.error}</p>
      )}
    </div>
  )
}

export default App
