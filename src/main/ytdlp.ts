import { execFile, spawn } from "child_process"
import { dirname, join } from "path"
import { promisify } from "util"

import { app } from "electron"

import type {
  DownloadRequest,
  PlaylistInfo,
  PlaylistRequest,
  QualityPreset,
  ResolveOptions,
  VideoFormat,
  VideoInfo,
} from "../shared/types"

import { ensureYtDlp } from "./binaries"
import { ffmpegPath } from "./ffmpeg"

const execFileAsync = promisify(execFile)

function isYouTubeUrl(url: string): boolean {
  return /^(https?:\/\/)?(www\.|m\.)?(youtube\.com|youtu\.be)\//i.test(
    url.trim()
  )
}

type RawFormat = {
  format_id: string
  ext: string
  height?: number | null
  fps?: number | null
  filesize?: number | null
  filesize_approx?: number | null
  vcodec?: string | null
  acodec?: string | null
  format_note?: string | null
}

/** Resolve a YouTube URL to its title, thumbnail, and available formats. */
export async function resolve(
  url: string,
  options?: ResolveOptions,
  onSetupProgress?: (percent: number) => void
): Promise<VideoInfo> {
  if (!isYouTubeUrl(url)) {
    throw new Error("Please paste a YouTube link.")
  }

  const bin = await ensureYtDlp(onSetupProgress)

  // --js-runtimes node: YouTube obfuscates format URLs with a JS "n challenge".
  //   yt-dlp's bundled solver needs a JS runtime; we point it at Node. Without
  //   this, only storyboard images come back.
  // --ignore-no-formats-error: still return the video's info even if format
  //   selection comes up empty.
  const args = [
    "-J",
    "--no-warnings",
    "--no-playlist",
    "--ignore-no-formats-error",
    "--js-runtimes",
    "node",
  ]
  if (options?.cookiesFile) {
    args.push("--cookies", options.cookiesFile)
  } else if (options?.cookiesBrowser && options.cookiesBrowser !== "none") {
    args.push("--cookies-from-browser", options.cookiesBrowser)
  }
  args.push(url)

  const { stdout } = await execFileAsync(bin, args, {
    maxBuffer: 64 * 1024 * 1024,
  })

  const data = JSON.parse(stdout) as {
    id: string
    title: string
    uploader?: string | null
    channel?: string | null
    duration?: number | null
    thumbnail?: string | null
    formats?: RawFormat[]
  }

  const formats: VideoFormat[] = (data.formats ?? [])
    .filter((f) => f.vcodec !== "none" || f.acodec !== "none")
    .map((f) => ({
      id: f.format_id,
      ext: f.ext,
      height: f.height ?? null,
      fps: f.fps ?? null,
      filesize: f.filesize ?? f.filesize_approx ?? null,
      hasVideo: !!f.vcodec && f.vcodec !== "none",
      hasAudio: !!f.acodec && f.acodec !== "none",
      note: f.format_note ?? null,
    }))

  return {
    id: data.id,
    title: data.title,
    uploader: data.uploader ?? data.channel ?? null,
    durationSeconds: data.duration ?? null,
    thumbnail: data.thumbnail ?? null,
    formats,
  }
}

function safeName(title: string): string {
  return (
    title
      .replace(/[<>:"/\\|?*\n\r\t]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120) || "video"
  )
}

/** Download the chosen format to the Downloads folder. Resolves with the path. */
export async function download(
  req: DownloadRequest,
  onProgress: (percent: number, merging: boolean) => void,
  onSetupProgress?: (percent: number) => void
): Promise<string> {
  const bin = await ensureYtDlp(onSetupProgress)
  const outPath = join(
    app.getPath("downloads"),
    `${safeName(req.title)} [${req.label}].${req.container}`
  )

  const args = [
    "--js-runtimes",
    "node",
    "--ffmpeg-location",
    ffmpegPath(),
    "--no-warnings",
    "--no-playlist",
    "--newline",
    "-o",
    outPath,
  ]
  if (req.cookiesFile) {
    args.push("--cookies", req.cookiesFile)
  } else if (req.cookiesBrowser && req.cookiesBrowser !== "none") {
    args.push("--cookies-from-browser", req.cookiesBrowser)
  }

  let format = req.formatId
  if (!req.isAudio && !req.hasAudio) {
    format = `${req.formatId}+bestaudio`
    args.push("--merge-output-format", "mp4")
  }
  args.push("-f", format, req.url)

  return new Promise<string>((resolve, reject) => {
    const proc = spawn(bin, args)
    let lastError = ""

    const handle = (chunk: Buffer): void => {
      const text = chunk.toString()
      if (/\[Merger\]/.test(text)) {
        onProgress(100, true)
        return
      }
      const match = text.match(/\[download\]\s+([\d.]+)%/)
      if (match) onProgress(Math.min(100, parseFloat(match[1])), false)
      if (/ERROR:/i.test(text)) lastError = text.trim()
    }

    proc.stdout.on("data", handle)
    proc.stderr.on("data", handle)
    proc.on("error", reject)
    proc.on("close", (code) => {
      if (code === 0) resolve(outPath)
      else
        reject(
          new Error(
            lastError.replace(/^ERROR:\s*/i, "") ||
              `Download failed (code ${code})`
          )
        )
    })
  })
}

export function isPlaylistUrl(url: string): boolean {
  const u = url.trim()
  return /[?&]list=/.test(u) && (/\/playlist\?/.test(u) || !/[?&]v=/.test(u))
}

/** Quickly list a playlist's entries (flat, no per-video extraction). */
export async function resolvePlaylist(
  url: string,
  options?: ResolveOptions,
  onSetupProgress?: (percent: number) => void
): Promise<PlaylistInfo> {
  if (!isYouTubeUrl(url)) throw new Error("Please paste a YouTube link.")
  const bin = await ensureYtDlp(onSetupProgress)

  const args = ["-J", "--flat-playlist", "--no-warnings"]
  if (options?.cookiesFile) args.push("--cookies", options.cookiesFile)
  else if (options?.cookiesBrowser && options.cookiesBrowser !== "none")
    args.push("--cookies-from-browser", options.cookiesBrowser)
  args.push(url)

  const { stdout } = await execFileAsync(bin, args, {
    maxBuffer: 128 * 1024 * 1024,
  })
  const data = JSON.parse(stdout) as {
    title?: string
    playlist_count?: number
    entries?: { id: string; title?: string }[]
  }
  const entries = (data.entries ?? [])
    .filter(Boolean)
    .map((e) => ({ id: e.id, title: e.title ?? e.id }))
  return {
    title: data.title ?? "Playlist",
    count: data.playlist_count ?? entries.length,
    entries,
  }
}

function selectorForQuality(quality: QualityPreset): {
  selector: string
  merge: boolean
  audioOnly: boolean
} {
  if (quality === "audio")
    return { selector: "ba/b", merge: false, audioOnly: true }
  if (quality === "best")
    return { selector: "bv*+ba/b", merge: true, audioOnly: false }
  const h = parseInt(quality, 10)
  return {
    selector: `bv*[height<=${h}]+ba/b[height<=${h}]`,
    merge: true,
    audioOnly: false,
  }
}

/** Download an entire playlist in one yt-dlp pass. Resolves with the folder. */
export async function downloadPlaylist(
  req: PlaylistRequest,
  onProgress: (p: {
    item: number
    total: number
    percent: number
    merging: boolean
  }) => void,
  onSetupProgress?: (percent: number) => void
): Promise<string> {
  const bin = await ensureYtDlp(onSetupProgress)
  const { selector, merge, audioOnly } = selectorForQuality(req.quality)
  const outTemplate = join(
    app.getPath("downloads"),
    "%(playlist_title|Playlist)s",
    "%(playlist_index)02d - %(title)s.%(ext)s"
  )

  const args = [
    "--js-runtimes",
    "node",
    "--ffmpeg-location",
    ffmpegPath(),
    "--no-warnings",
    "--newline",
    "--yes-playlist",
    "--ignore-errors",
    "-o",
    outTemplate,
  ]
  if (req.cookiesFile) args.push("--cookies", req.cookiesFile)
  else if (req.cookiesBrowser && req.cookiesBrowser !== "none")
    args.push("--cookies-from-browser", req.cookiesBrowser)

  if (audioOnly) {
    args.push("-x", "--audio-format", "mp3", "--audio-quality", "0")
  } else {
    args.push("-f", selector)
    if (merge) args.push("--merge-output-format", "mp4")
  }
  args.push(req.url)

  return new Promise<string>((resolve, reject) => {
    const proc = spawn(bin, args)
    const downloads = app.getPath("downloads")
    let item = 1
    let total = 0
    let folder = downloads
    let lastError = ""

    const handle = (chunk: Buffer): void => {
      const text = chunk.toString()
      const itemMatch = text.match(/Downloading (?:item|video) (\d+) of (\d+)/)
      if (itemMatch) {
        item = parseInt(itemMatch[1], 10)
        total = parseInt(itemMatch[2], 10)
      }
      const dest = text.match(/\[download\] Destination: (.+)/)
      if (dest && folder === downloads) folder = dirname(dest[1].trim())
      if (/\[Merger\]|\[ExtractAudio\]/.test(text)) {
        onProgress({ item, total, percent: 100, merging: true })
        return
      }
      const pct = text.match(/\[download\]\s+([\d.]+)%/)
      if (pct) {
        onProgress({
          item,
          total,
          percent: Math.min(100, parseFloat(pct[1])),
          merging: false,
        })
      }
      if (/ERROR:/i.test(text)) lastError = text.trim()
    }

    proc.stdout.on("data", handle)
    proc.stderr.on("data", handle)
    proc.on("error", reject)
    proc.on("close", (code) => {
      // --ignore-errors can exit non-zero on a single skipped item while the
      // rest succeeded; treat "made progress" as success.
      if (code === 0 || total > 0) resolve(folder)
      else
        reject(
          new Error(
            lastError.replace(/^ERROR:\s*/i, "") ||
              `Playlist download failed (code ${code})`
          )
        )
    })
  })
}
