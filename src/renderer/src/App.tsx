import {
  CheckIcon,
  DownloadIcon,
  FolderOpenIcon,
  ListVideoIcon,
  Loader2Icon,
  RotateCwIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useEffect, useState } from "react"

import type {
  CookiesBrowser,
  QualityPreset,
  UpdateStatus,
} from "../../shared/types"

import { LogoMark } from "@/components/logo-mark"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { formatBytes, formatDuration } from "@/lib/format"

type VideoInfo = Awaited<ReturnType<Window["youloader"]["resolve"]>>
type PlaylistInfo = Awaited<ReturnType<Window["youloader"]["resolvePlaylist"]>>
type Status = "idle" | "resolving" | "video" | "playlist" | "error"

type Option = {
  formatId: string
  label: string
  sub: string
  isAudio: boolean
  hasAudio: boolean
  container: string
  extractMp3?: boolean
}
type DownloadState = {
  status: "downloading" | "done" | "error"
  percent: number
  merging?: boolean
  eta?: string
  speed?: string
  path?: string
  error?: string
}
type PlaylistDL = {
  status: "idle" | "downloading" | "done" | "error"
  item: number
  total: number
  percent: number
  merging?: boolean
  eta?: string
  speed?: string
  folder?: string
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

const QUALITIES: { value: QualityPreset; label: string }[] = [
  { value: "best", label: "Best" },
  { value: "1080p", label: "1080p" },
  { value: "720p", label: "720p" },
  { value: "480p", label: "480p" },
  { value: "audio", label: "Audio (MP3)" },
]

function isPlaylistUrl(url: string): boolean {
  const u = url.trim()
  return /[?&]list=/.test(u) && (/\/playlist\?/.test(u) || !/[?&]v=/.test(u))
}

function App(): React.JSX.Element {
  const [url, setUrl] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [info, setInfo] = useState<VideoInfo | null>(null)
  const [playlist, setPlaylist] = useState<PlaylistInfo | null>(null)
  const [error, setError] = useState("")
  const [setupPercent, setSetupPercent] = useState(0)
  const [cookiesBrowser, setCookiesBrowser] = useState<CookiesBrowser>(
    () => (localStorage.getItem("youloader.cookiesBrowser") as CookiesBrowser) || "none"
  )
  const [cookiesFile, setCookiesFile] = useState<string | null>(null)
  const [downloads, setDownloads] = useState<Record<string, DownloadState>>({})
  const [quality, setQuality] = useState<QualityPreset>(
    () => (localStorage.getItem("youloader.quality") as QualityPreset) || "best"
  )
  const [downloadDir, setDownloadDir] = useState<string>(
    () => localStorage.getItem("youloader.downloadDir") || ""
  )
  const [defaultDir, setDefaultDir] = useState<string>("")
  const [pl, setPl] = useState<PlaylistDL>({
    status: "idle",
    item: 0,
    total: 0,
    percent: 0,
  })
  const [wantSubs, setWantSubs] = useState(
    () => localStorage.getItem("youloader.subs") === "1"
  )
  const [wantSponsor, setWantSponsor] = useState(
    () => localStorage.getItem("youloader.sponsorblock") === "1"
  )
  const [trimStart, setTrimStart] = useState("")
  const [trimEnd, setTrimEnd] = useState("")
  const [update, setUpdate] = useState<UpdateStatus | null>(null)
  const [appVersion, setAppVersion] = useState("")

  useEffect(() => window.youloader.onSetupProgress(setSetupPercent), [])
  useEffect(() => window.youloader.onUpdateStatus(setUpdate), [])
  useEffect(() => {
    window.youloader.appVersion().then(setAppVersion)
  }, [])

  useEffect(() => {
    window.youloader.downloadsDir().then(setDefaultDir)
  }, [])

  // Auto-fill a YouTube link sitting on the clipboard when the app gains focus,
  // but only when the box is empty so we never clobber what you're typing.
  useEffect(() => {
    function check(): void {
      window.youloader.readClipboard().then((text) => {
        const t = (text || "").trim()
        if (/^(https?:\/\/)?(www\.|m\.)?(youtube\.com|youtu\.be)\//i.test(t)) {
          setUrl((cur) => (cur.trim() === "" ? t : cur))
        }
      })
    }
    check()
    window.addEventListener("focus", check)
    return () => window.removeEventListener("focus", check)
  }, [])
  useEffect(() => {
    localStorage.setItem("youloader.cookiesBrowser", cookiesBrowser)
  }, [cookiesBrowser])
  useEffect(() => {
    localStorage.setItem("youloader.quality", quality)
  }, [quality])
  useEffect(() => {
    localStorage.setItem("youloader.downloadDir", downloadDir)
  }, [downloadDir])
  useEffect(() => {
    localStorage.setItem("youloader.subs", wantSubs ? "1" : "0")
  }, [wantSubs])
  useEffect(() => {
    localStorage.setItem("youloader.sponsorblock", wantSponsor ? "1" : "0")
  }, [wantSponsor])

  useEffect(() => {
    return window.youloader.onDownloadProgress(
      ({ id, percent, merging, eta, speed }) => {
        setDownloads((d) => ({
          ...d,
          [id]: { ...d[id], status: "downloading", percent, merging, eta, speed },
        }))
      }
    )
  }, [])

  useEffect(() => {
    return window.youloader.onPlaylistProgress((p) => {
      setPl((cur) => ({ ...cur, ...p, status: "downloading" }))
    })
  }, [])

  const cookieOpts = { cookiesBrowser, cookiesFile }

  function buildSection(): string | null {
    const s = trimStart.trim()
    const e = trimEnd.trim()
    if (!s && !e) return null
    return `*${s || "0"}-${e || "inf"}`
  }

  async function importCookies(): Promise<void> {
    const path = await window.youloader.pickCookiesFile()
    if (path) setCookiesFile(path)
  }

  function describeError(msg: string): string {
    if (/not a bot|sign in to confirm/i.test(msg))
      return "YouTube wants to confirm you're a real person. Pick the browser you're signed into YouTube on below, or import a cookies.txt, then try again."
    if (/could not copy|cookie database/i.test(msg))
      return "That browser locks its cookies while it's open. Fully quit it and retry, pick a different browser, or import a cookies.txt (most reliable)."
    return msg
  }

  async function handleResolve(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!url.trim() || status === "resolving") return
    setStatus("resolving")
    setError("")
    setInfo(null)
    setPlaylist(null)
    setDownloads({})
    setPl({ status: "idle", item: 0, total: 0, percent: 0 })
    setTrimStart("")
    setTrimEnd("")
    try {
      if (isPlaylistUrl(url)) {
        const result = await window.youloader.resolvePlaylist(url.trim(), cookieOpts)
        setPlaylist(result)
        setStatus("playlist")
      } else {
        const result = await window.youloader.resolve(url.trim(), cookieOpts)
        setInfo(result)
        setStatus("video")
      }
    } catch (err) {
      setError(
        describeError(
          err instanceof Error ? err.message : "Could not resolve that link."
        )
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
        extractMp3: opt.extractMp3,
        downloadDir: downloadDir || null,
        subtitles: wantSubs,
        sponsorblock: wantSponsor,
        section: buildSection(),
        ...cookieOpts,
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

  async function handleDownloadPlaylist(): Promise<void> {
    setPl({ status: "downloading", item: 0, total: playlist?.count ?? 0, percent: 0 })
    try {
      const folder = await window.youloader.downloadPlaylist({
        url: url.trim(),
        quality,
        downloadDir: downloadDir || null,
        subtitles: wantSubs,
        sponsorblock: wantSponsor,
        ...cookieOpts,
      })
      setPl((cur) => ({ ...cur, status: "done", folder }))
    } catch (err) {
      setPl((cur) => ({
        ...cur,
        status: "error",
        error: err instanceof Error ? err.message : "Playlist download failed",
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
  const bestAudio = (m4a.length ? m4a : allAudio).sort(
    (a, b) => (b.filesize ?? 0) - (a.filesize ?? 0)
  )[0]
  const audioOptions: Option[] =
    allAudio.length > 0
      ? [
          {
            formatId: "audio-mp3",
            label: "MP3",
            sub: "best audio, converted",
            isAudio: true,
            hasAudio: true,
            container: "mp3",
            extractMp3: true,
          },
          ...(bestAudio
            ? [
                {
                  formatId: bestAudio.id,
                  label: bestAudio.ext.toUpperCase(),
                  sub: formatBytes(bestAudio.filesize),
                  isAudio: true,
                  hasAudio: true,
                  container: bestAudio.ext,
                },
              ]
            : []),
        ]
      : []
  const options = [...videoOptions, ...audioOptions]

  const plOverall =
    pl.total > 0
      ? Math.min(100, ((pl.item - 1 + pl.percent / 100) / pl.total) * 100)
      : pl.percent

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
        {update && (
          <UpdateBanner
            update={update}
            onRestart={() => window.youloader.restartToUpdate()}
          />
        )}
        <form onSubmit={handleResolve} className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a YouTube video or playlist link…"
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
            <span>Save to</span>
            <span
              className="max-w-[24rem] truncate text-foreground"
              title={downloadDir || defaultDir}
            >
              {downloadDir || defaultDir || "Downloads"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const f = await window.youloader.pickFolder()
                if (f) setDownloadDir(f)
              }}
            >
              Change
            </Button>
            {downloadDir && (
              <button
                type="button"
                onClick={() => setDownloadDir("")}
                className="cursor-pointer underline underline-offset-2 hover:text-foreground"
              >
                reset
              </button>
            )}
          </div>
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

        {status === "video" && info && (
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
                Options
              </h2>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border border-border bg-card p-3 text-sm">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={wantSubs}
                    onChange={(e) => setWantSubs(e.target.checked)}
                    className="size-4 accent-foreground"
                  />
                  Subtitles (.srt)
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={wantSponsor}
                    onChange={(e) => setWantSponsor(e.target.checked)}
                    className="size-4 accent-foreground"
                  />
                  Remove sponsors
                </label>
                <span className="flex items-center gap-2">
                  <span className="text-muted-foreground">Trim</span>
                  <input
                    value={trimStart}
                    onChange={(e) => setTrimStart(e.target.value)}
                    placeholder="0:00"
                    aria-label="Trim start"
                    className="w-20 rounded-md border border-border bg-background px-2 py-1 outline-none focus-visible:border-ring"
                  />
                  <span className="text-muted-foreground">to</span>
                  <input
                    value={trimEnd}
                    onChange={(e) => setTrimEnd(e.target.value)}
                    placeholder="end"
                    aria-label="Trim end"
                    className="w-20 rounded-md border border-border bg-background px-2 py-1 outline-none focus-visible:border-ring"
                  />
                </span>
              </div>
            </section>

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

        {status === "playlist" && playlist && (
          <div className="mt-6 space-y-5">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
                <ListVideoIcon className="size-5 text-muted-foreground" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate font-semibold">{playlist.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {playlist.count} videos
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
              <span className="text-xs font-medium text-muted-foreground">
                Quality
              </span>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value as QualityPreset)}
                disabled={pl.status === "downloading"}
                className="cursor-pointer rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus-visible:border-ring disabled:opacity-50"
              >
                {QUALITIES.map((q) => (
                  <option key={q.value} value={q.value}>
                    {q.label}
                  </option>
                ))}
              </select>

              <label className="flex cursor-pointer items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={wantSubs}
                  onChange={(e) => setWantSubs(e.target.checked)}
                  disabled={pl.status === "downloading"}
                  className="size-4 accent-foreground"
                />
                Subtitles
              </label>
              <label className="flex cursor-pointer items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={wantSponsor}
                  onChange={(e) => setWantSponsor(e.target.checked)}
                  disabled={pl.status === "downloading"}
                  className="size-4 accent-foreground"
                />
                Remove sponsors
              </label>

              {pl.status === "done" ? (
                <button
                  type="button"
                  onClick={() => pl.folder && window.youloader.showInFolder(pl.folder)}
                  className="ml-auto inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400"
                >
                  <CheckIcon className="size-4" />
                  Saved
                  <FolderOpenIcon className="size-4" />
                </button>
              ) : (
                <Button
                  className="ml-auto"
                  disabled={pl.status === "downloading"}
                  onClick={handleDownloadPlaylist}
                >
                  {pl.status === "downloading" ? (
                    <>
                      <Loader2Icon className="animate-spin" />
                      {pl.merging
                        ? "Merging…"
                        : `Item ${pl.item}/${pl.total} · ${Math.round(pl.percent)}%`}
                    </>
                  ) : (
                    <>
                      <DownloadIcon />
                      Download all
                    </>
                  )}
                </Button>
              )}
            </div>

            {pl.status === "downloading" && (
              <div className="space-y-1.5">
                <div className="h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground transition-[width] duration-200"
                    style={{ width: `${plOverall}%` }}
                  />
                </div>
                {!pl.merging && (pl.speed || pl.eta) && (
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {pl.speed}
                    {pl.speed && pl.eta ? " · " : ""}
                    {pl.eta ? `ETA ${pl.eta}` : ""}
                  </p>
                )}
              </div>
            )}
            {pl.status === "error" && (
              <p className="text-sm text-destructive">{pl.error}</p>
            )}

            <section className="space-y-2">
              <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Videos
              </h2>
              <ol className="max-h-72 divide-y divide-line overflow-y-auto rounded-xl border border-border">
                {playlist.entries.map((entry, i) => (
                  <li
                    key={entry.id}
                    className="flex gap-3 px-4 py-2.5 text-sm"
                  >
                    <span className="w-6 shrink-0 text-right tabular-nums text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="truncate">{entry.title}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        )}
      </div>

      <footer className="mt-auto border-t border-line py-6">
        <div className="flex flex-col items-center gap-2.5 text-center">
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs">
            <a
              href="https://youloader.robinrahman.pro/guide"
              target="_blank"
              rel="noopener"
              className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Guide
            </a>
            <a
              href="https://github.com/rob0pup/r2-youloader"
              target="_blank"
              rel="noopener"
              className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              GitHub
            </a>
            <a
              href="https://github.com/rob0pup/r2-youloader/releases"
              target="_blank"
              rel="noopener"
              className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Releases
            </a>
          </nav>
          <p className="text-xs text-muted-foreground">
            a desktop tool by{" "}
            <a
              href="https://robinrahman.pro"
              target="_blank"
              rel="noopener"
              className="font-medium text-foreground underline underline-offset-2"
            >
              Robin
            </a>
            {appVersion && (
              <>
                <span className="px-1.5 text-muted-foreground/50">·</span>
                <span className="tabular-nums">v{appVersion}</span>
              </>
            )}
          </p>
        </div>
      </footer>
    </main>
  )
}

function UpdateBanner({
  update,
  onRestart,
}: {
  update: UpdateStatus
  onRestart: () => void
}): React.JSX.Element | null {
  if (update.status === "error") return null

  if (update.status === "downloaded") {
    return (
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 text-sm">
        <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
        <span>Update ready (v{update.version}).</span>
        <Button size="sm" className="ml-auto" onClick={onRestart}>
          <RotateCwIcon />
          Restart to update
        </Button>
      </div>
    )
  }

  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground">
      <Loader2Icon className="size-4 shrink-0 animate-spin" />
      <span>
        {update.status === "downloading"
          ? `Downloading update… ${update.percent}%`
          : "A new version is available, downloading…"}
      </span>
    </div>
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

      {downloading && !state?.merging && (state?.speed || state?.eta) && (
        <p className="mt-1.5 text-xs tabular-nums text-muted-foreground">
          {state?.speed}
          {state?.speed && state?.eta ? " · " : ""}
          {state?.eta ? `ETA ${state.eta}` : ""}
        </p>
      )}

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
