import { execFile, spawn } from "child_process"
import { join } from "path"
import { promisify } from "util"

import { app } from "electron"

import type {
  DownloadRequest,
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
