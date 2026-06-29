import { execFile } from "child_process"
import { promisify } from "util"

import type { ResolveOptions, VideoFormat, VideoInfo } from "../shared/types"

import { ensureYtDlp } from "./binaries"

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

  // --ignore-no-formats-error so we still get the video's info even when
  // YouTube's default format selection comes up empty (SABR / gated formats).
  const args = [
    "-J",
    "--no-warnings",
    "--no-playlist",
    "--ignore-no-formats-error",
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
