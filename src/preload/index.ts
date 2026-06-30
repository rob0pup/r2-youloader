import { contextBridge, ipcRenderer } from "electron"

import type {
  DownloadProgress,
  DownloadRequest,
  PlaylistInfo,
  PlaylistProgress,
  PlaylistRequest,
  ResolveOptions,
  UpdateStatus,
  VideoInfo,
} from "../shared/types"

// The only surface the renderer can touch. Download + progress land here in
// the next PRs.
const youloader = {
  appVersion: (): Promise<string> => ipcRenderer.invoke("app:version"),

  /** Resolve a YouTube URL to its info + available formats. */
  resolve: (url: string, options?: ResolveOptions): Promise<VideoInfo> =>
    ipcRenderer.invoke("yt:resolve", url, options),

  /** Download a chosen format. Resolves with the saved file path. */
  download: (req: DownloadRequest): Promise<string> =>
    ipcRenderer.invoke("yt:download", req),

  /** Per-download progress. Returns an unsubscribe fn. */
  onDownloadProgress: (cb: (p: DownloadProgress) => void): (() => void) => {
    const listener = (_: unknown, p: DownloadProgress): void => cb(p)
    ipcRenderer.on("yt:download-progress", listener)
    return () => ipcRenderer.removeListener("yt:download-progress", listener)
  },

  /** List a playlist's entries (flat). */
  resolvePlaylist: (
    url: string,
    options?: ResolveOptions
  ): Promise<PlaylistInfo> => ipcRenderer.invoke("yt:resolve-playlist", url, options),

  /** Download a whole playlist at one quality. Resolves with the folder. */
  downloadPlaylist: (req: PlaylistRequest): Promise<string> =>
    ipcRenderer.invoke("yt:download-playlist", req),

  /** Playlist download progress. Returns an unsubscribe fn. */
  onPlaylistProgress: (cb: (p: PlaylistProgress) => void): (() => void) => {
    const listener = (_: unknown, p: PlaylistProgress): void => cb(p)
    ipcRenderer.on("yt:playlist-progress", listener)
    return () => ipcRenderer.removeListener("yt:playlist-progress", listener)
  },

  /** Reveal a downloaded file in the OS file manager. */
  showInFolder: (path: string): Promise<void> =>
    ipcRenderer.invoke("shell:show-item", path),

  /** The OS Downloads folder (the default save location). */
  downloadsDir: (): Promise<string> => ipcRenderer.invoke("app:downloads-dir"),

  /** Current clipboard text (used to auto-detect a pasted YouTube link). */
  readClipboard: (): Promise<string> =>
    ipcRenderer.invoke("clipboard:read-text"),

  /** Open a folder picker for the download location. */
  pickFolder: (): Promise<string | null> =>
    ipcRenderer.invoke("dialog:pick-folder"),

  /** Open a file dialog to choose an exported cookies.txt. */
  pickCookiesFile: (): Promise<string | null> =>
    ipcRenderer.invoke("dialog:pick-cookies"),

  /** First-run yt-dlp download progress (0-100). Returns an unsubscribe fn. */
  onSetupProgress: (cb: (percent: number) => void): (() => void) => {
    const listener = (_: unknown, percent: number): void => cb(percent)
    ipcRenderer.on("yt:setup-progress", listener)
    return () => ipcRenderer.removeListener("yt:setup-progress", listener)
  },

  /** Auto-update status events. Returns an unsubscribe fn. */
  onUpdateStatus: (cb: (s: UpdateStatus) => void): (() => void) => {
    const listener = (_: unknown, s: UpdateStatus): void => cb(s)
    ipcRenderer.on("update:status", listener)
    return () => ipcRenderer.removeListener("update:status", listener)
  },

  /** Restart the app to install a downloaded update. */
  restartToUpdate: (): Promise<void> => ipcRenderer.invoke("update:restart"),
}

contextBridge.exposeInMainWorld("youloader", youloader)

export type Youloader = typeof youloader
