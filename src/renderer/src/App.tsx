import { DownloadIcon, Loader2Icon, TriangleAlertIcon } from "lucide-react"
import { useEffect, useState } from "react"

import { LogoMark } from "@/components/logo-mark"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { formatBytes, formatDuration } from "@/lib/format"

type VideoInfo = Awaited<ReturnType<Window["youloader"]["resolve"]>>
type Status = "idle" | "resolving" | "done" | "error"

function App(): React.JSX.Element {
  const [url, setUrl] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [info, setInfo] = useState<VideoInfo | null>(null)
  const [error, setError] = useState("")
  const [setupPercent, setSetupPercent] = useState(0)

  useEffect(() => {
    return window.youloader.onSetupProgress(setSetupPercent)
  }, [])

  async function handleResolve(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!url.trim() || status === "resolving") return
    setStatus("resolving")
    setError("")
    setInfo(null)
    try {
      const result = await window.youloader.resolve(url.trim())
      setInfo(result)
      setStatus("done")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resolve that link.")
      setStatus("error")
    } finally {
      setSetupPercent(0)
    }
  }

  // One row per distinct resolution, plus audio-only options.
  const seen = new Set<number>()
  const videoRows = (info?.formats ?? [])
    .filter((f) => f.height != null)
    .sort((a, b) => b.height! - a.height!)
    .filter((f) => (seen.has(f.height!) ? false : (seen.add(f.height!), true)))
  const audioRows = (info?.formats ?? []).filter(
    (f) => f.height == null && f.hasAudio
  )

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

        {status === "resolving" && setupPercent > 0 && setupPercent < 100 && (
          <p className="mt-3 text-sm text-muted-foreground">
            First run: downloading the yt-dlp engine… {setupPercent}%
          </p>
        )}

        {status === "error" && (
          <p className="mt-4 flex items-center gap-2 text-sm text-destructive">
            <TriangleAlertIcon className="size-4 shrink-0" />
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
                {videoRows.map((f) => (
                  <FormatRow
                    key={f.id}
                    label={`${f.height}p${f.fps && f.fps > 30 ? ` ${f.fps}` : ""}`}
                    meta={`${f.ext.toUpperCase()} · ${formatBytes(f.filesize)}`}
                  />
                ))}
                {audioRows.slice(0, 2).map((f) => (
                  <FormatRow
                    key={f.id}
                    label="Audio"
                    meta={`${f.ext.toUpperCase()} · ${formatBytes(f.filesize)}`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Downloading lands in the next update.
              </p>
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
  label,
  meta,
}: {
  label: string
  meta: string
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">{meta}</span>
      <Button
        variant="outline"
        size="sm"
        disabled
        className="ml-auto"
        title="Coming in the next update"
      >
        <DownloadIcon />
        Download
      </Button>
    </div>
  )
}

export default App
