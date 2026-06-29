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

// When YouTube demands "sign in to confirm you're not a bot", yt-dlp can read
// the user's logged-in cookies straight from their browser.
export type CookiesBrowser =
  | "none"
  | "chrome"
  | "edge"
  | "firefox"
  | "brave"
  | "opera"
  | "vivaldi"
  | "chromium"

export type ResolveOptions = {
  cookiesBrowser?: CookiesBrowser
  /** Path to an exported cookies.txt; takes precedence over cookiesBrowser. */
  cookiesFile?: string | null
}

export type VideoInfo = {
  id: string
  title: string
  uploader: string | null
  durationSeconds: number | null
  thumbnail: string | null
  formats: VideoFormat[]
}
