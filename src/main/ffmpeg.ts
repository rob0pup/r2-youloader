import { app } from "electron"
import ffmpegStatic from "ffmpeg-static"

/**
 * Absolute path to the bundled ffmpeg binary. In a packaged build the binary is
 * unpacked from the asar archive.
 */
export function ffmpegPath(): string {
  const path = ffmpegStatic as string | null
  if (!path) throw new Error("ffmpeg binary is missing")
  return app.isPackaged ? path.replace("app.asar", "app.asar.unpacked") : path
}
