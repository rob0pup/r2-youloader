// Shared between the main process (produces these) and the renderer (consumes
// them). Type-only, so it's erased at build time.

export type VideoFormat = {
  /** yt-dlp format_id, used later to pick what to download. */
  id: string
  ext: string
  /** Pixel height (e.g. 1080) for video formats; null for audio-only. */
  height: number | null
  fps: number | null
  /** Bytes, exact or approximate; null if yt-dlp couldn't tell. */
  filesize: number | null
  hasVideo: boolean
  hasAudio: boolean
  note: string | null
}

export type VideoInfo = {
  id: string
  title: string
  uploader: string | null
  durationSeconds: number | null
  thumbnail: string | null
  formats: VideoFormat[]
}
