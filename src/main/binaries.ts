import { execFile } from "child_process"
import { createWriteStream } from "fs"
import { access, chmod, mkdir, readFile, rm, writeFile } from "fs/promises"
import { delimiter, join } from "path"
import { promisify } from "util"

import { app } from "electron"

const execFileAsync = promisify(execFile)

// yt-dlp and Deno are both single self-contained binaries. We download them on
// first use into the app's userData dir, so there's nothing for the user to
// install. yt-dlp's nightly builds track YouTube's frequent changes far better
// than stable, so we pin the nightly channel and re-download if a cached binary
// was from a different channel.
const YT_DLP_CHANNEL = "nightly"

const YT_DLP_URLS: Partial<Record<NodeJS.Platform, string>> = {
  win32:
    "https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/latest/download/yt-dlp.exe",
  darwin:
    "https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/latest/download/yt-dlp_macos",
  linux:
    "https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/latest/download/yt-dlp",
}

// YouTube scrambles its format URLs with a JavaScript "n challenge". yt-dlp
// ships a solver but needs an external JS engine to run it; without one, only
// storyboard images come back. We bundle Deno (yt-dlp's recommended runtime: it
// sandboxes the untrusted YouTube JS) so the app needs nothing installed. Deno
// ships only as a zip, keyed by platform+arch.
const DENO_ASSETS: Record<string, string> = {
  "win32-x64": "deno-x86_64-pc-windows-msvc.zip",
  "darwin-x64": "deno-x86_64-apple-darwin.zip",
  "darwin-arm64": "deno-aarch64-apple-darwin.zip",
  "linux-x64": "deno-x86_64-unknown-linux-gnu.zip",
  "linux-arm64": "deno-aarch64-unknown-linux-gnu.zip",
}

function binDir(): string {
  return join(app.getPath("userData"), "bin")
}

export function ytDlpPath(): string {
  const name = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp"
  return join(binDir(), name)
}

export function denoPath(): string {
  const name = process.platform === "win32" ? "deno.exe" : "deno"
  return join(binDir(), name)
}

/**
 * Environment for spawning yt-dlp: the bin dir is prepended to PATH so yt-dlp
 * discovers our bundled Deno (it locates JS runtimes by name on PATH).
 */
export function runtimeEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    PATH: `${binDir()}${delimiter}${process.env.PATH ?? ""}`,
  }
}

function channelMarker(): string {
  return join(binDir(), ".channel")
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

/** Stream a URL to disk, reporting 0-100 progress when the size is known. */
async function downloadFile(
  url: string,
  dest: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  const res = await fetch(url)
  if (!res.ok || !res.body) {
    throw new Error(`Download failed (HTTP ${res.status}): ${url}`)
  }

  const total = Number(res.headers.get("content-length") ?? 0)
  let received = 0
  const file = createWriteStream(dest)
  const reader = res.body.getReader()

  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      file.write(value)
      received += value.length
      if (total && onProgress) {
        onProgress(Math.min(100, Math.round((received / total) * 100)))
      }
    }
  } finally {
    file.end()
  }
  await new Promise<void>((resolve, reject) => {
    file.on("finish", () => resolve())
    file.on("error", reject)
  })
}

/** Extract a .zip into a directory using the OS's built-in tools (no deps). */
async function extractZip(zipPath: string, destDir: string): Promise<void> {
  if (process.platform === "win32") {
    await execFileAsync("powershell", [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      `Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${destDir}' -Force`,
    ])
  } else {
    await execFileAsync("unzip", ["-o", zipPath, "-d", destDir])
  }
}

/**
 * Ensure the yt-dlp binary exists locally (and is from the pinned channel),
 * downloading it the first time. `onProgress` reports 0-100 during downloads.
 */
export async function ensureYtDlp(
  onProgress?: (percent: number) => void
): Promise<string> {
  const dest = ytDlpPath()
  const cachedChannel = await readFile(channelMarker(), "utf8")
    .then((s) => s.trim())
    .catch(() => null)

  if ((await exists(dest)) && cachedChannel === YT_DLP_CHANNEL) return dest

  const url = YT_DLP_URLS[process.platform]
  if (!url) throw new Error(`Unsupported platform: ${process.platform}`)

  await mkdir(binDir(), { recursive: true })
  await downloadFile(url, dest, onProgress)

  if (process.platform !== "win32") await chmod(dest, 0o755)
  await writeFile(channelMarker(), YT_DLP_CHANNEL)
  return dest
}

/**
 * Ensure the bundled Deno binary exists locally, downloading and unzipping it
 * the first time. This is the JS runtime yt-dlp uses to solve the n challenge.
 */
export async function ensureDeno(
  onProgress?: (percent: number) => void
): Promise<string> {
  const dest = denoPath()
  if (await exists(dest)) return dest

  const key = `${process.platform}-${process.arch}`
  const asset = DENO_ASSETS[key]
  if (!asset) throw new Error(`No Deno build for this platform: ${key}`)

  await mkdir(binDir(), { recursive: true })
  const zipPath = join(binDir(), asset)
  await downloadFile(
    `https://github.com/denoland/deno/releases/latest/download/${asset}`,
    zipPath,
    onProgress
  )
  await extractZip(zipPath, binDir())
  await rm(zipPath, { force: true })

  if (process.platform !== "win32") await chmod(dest, 0o755)
  return dest
}

/**
 * Ensure the full engine is present: yt-dlp plus the bundled Deno runtime.
 * Returns the yt-dlp path. Deno setup is best-effort, if it fails (e.g. offline)
 * we still return so yt-dlp can fall back to a system JS runtime if one exists.
 */
export async function ensureEngine(
  onProgress?: (percent: number) => void
): Promise<string> {
  const ytdlp = await ensureYtDlp(onProgress)
  try {
    await ensureDeno(onProgress)
  } catch (err) {
    console.warn(
      "Bundled Deno setup failed; falling back to a system JS runtime if present.",
      err
    )
  }
  return ytdlp
}
