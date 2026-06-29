import { createWriteStream } from "fs"
import { access, chmod, mkdir } from "fs/promises"
import { join } from "path"

import { app } from "electron"

// yt-dlp is a single self-contained executable. We download it on first use
// into the app's userData dir, so there's nothing for the user to install.
const YT_DLP_URLS: Partial<Record<NodeJS.Platform, string>> = {
  win32: "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe",
  darwin: "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos",
  linux: "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp",
}

function binDir(): string {
  return join(app.getPath("userData"), "bin")
}

export function ytDlpPath(): string {
  const name = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp"
  return join(binDir(), name)
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

/**
 * Ensure the yt-dlp binary exists locally, downloading it the first time.
 * `onProgress` reports 0-100 during the (one-time) download.
 */
export async function ensureYtDlp(
  onProgress?: (percent: number) => void
): Promise<string> {
  const dest = ytDlpPath()
  if (await exists(dest)) return dest

  const url = YT_DLP_URLS[process.platform]
  if (!url) throw new Error(`Unsupported platform: ${process.platform}`)

  await mkdir(binDir(), { recursive: true })

  const res = await fetch(url)
  if (!res.ok || !res.body) {
    throw new Error(`Could not download yt-dlp (HTTP ${res.status})`)
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

  if (process.platform !== "win32") await chmod(dest, 0o755)
  return dest
}
