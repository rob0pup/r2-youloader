import { contextBridge, ipcRenderer } from "electron"

import type {
  DownloadProgress,
  DownloadRequest,
  ResolveOptions,
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

  /** Reveal a downloaded file in the OS file manager. */
  showInFolder: (path: string): Promise<void> =>
    ipcRenderer.invoke("shell:show-item", path),

  /** Open a file dialog to choose an exported cookies.txt. */
  pickCookiesFile: (): Promise<string | null> =>
    ipcRenderer.invoke("dialog:pick-cookies"),

  /** First-run yt-dlp download progress (0-100). Returns an unsubscribe fn. */
  onSetupProgress: (cb: (percent: number) => void): (() => void) => {
    const listener = (_: unknown, percent: number): void => cb(percent)
    ipcRenderer.on("yt:setup-progress", listener)
    return () => ipcRenderer.removeListener("yt:setup-progress", listener)
  },
}

contextBridge.exposeInMainWorld("youloader", youloader)

export type Youloader = typeof youloader
