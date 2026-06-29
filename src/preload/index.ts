import { contextBridge, ipcRenderer } from "electron"

import type { ResolveOptions, VideoInfo } from "../shared/types"

// The only surface the renderer can touch. Download + progress land here in
// the next PRs.
const youloader = {
  appVersion: (): Promise<string> => ipcRenderer.invoke("app:version"),

  /** Resolve a YouTube URL to its info + available formats. */
  resolve: (url: string, options?: ResolveOptions): Promise<VideoInfo> =>
    ipcRenderer.invoke("yt:resolve", url, options),

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
