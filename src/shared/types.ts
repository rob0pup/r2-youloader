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

export type DownloadRequest = {
  url: string
  title: string
  formatId: string
  /** True for audio-only rows. */
  isAudio: boolean
  /** Whether the chosen format already has audio (if not, we add bestaudio). */
  hasAudio: boolean
  /** Output container, e.g. "mp4" or "m4a". */
  container: string
  /** Human label used in the filename, e.g. "720p" or "Audio". */
  label: string
  /** Extract best audio to MP3 (ignores formatId). */
  extractMp3?: boolean
  /** Destination folder; defaults to the OS Downloads folder. */
  downloadDir?: string | null
  cookiesBrowser?: CookiesBrowser
  cookiesFile?: string | null
  /** Write English subtitles (incl. auto-generated) as a .srt sidecar. */
  subtitles?: boolean
  /** Cut out SponsorBlock "sponsor" segments (needs the network at download). */
  sponsorblock?: boolean
  /** yt-dlp --download-sections value, e.g. "*0:30-2:00"; null = whole video. */
  section?: string | null
}

export type DownloadProgress = {
  /** The format id this update is for. */
  id: string
  percent: number
  merging?: boolean
}

export type QualityPreset = "best" | "1080p" | "720p" | "480p" | "audio"

export type PlaylistEntry = { id: string; title: string }

export type PlaylistInfo = {
  title: string
  count: number
  entries: PlaylistEntry[]
}

export type PlaylistRequest = {
  url: string
  quality: QualityPreset
  /** Destination folder; defaults to the OS Downloads folder. */
  downloadDir?: string | null
  cookiesBrowser?: CookiesBrowser
  cookiesFile?: string | null
  /** Write English subtitles (incl. auto-generated) as .srt sidecars. */
  subtitles?: boolean
  /** Cut out SponsorBlock "sponsor" segments. */
  sponsorblock?: boolean
}

export type PlaylistProgress = {
  item: number
  total: number
  /** Percent of the current item. */
  percent: number
  merging?: boolean
}

/** Auto-update lifecycle, surfaced to the renderer as a small banner. */
export type UpdateStatus =
  | { status: "available"; version: string }
  | { status: "downloading"; percent: number }
  | { status: "downloaded"; version: string }
  | { status: "error"; message: string }
