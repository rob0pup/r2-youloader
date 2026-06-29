import { contextBridge, ipcRenderer } from "electron"

// The only surface the renderer can touch. Real download/info methods land here
// in later PRs (resolve formats, start download, progress events).
const youloader = {
  appVersion: (): Promise<string> => ipcRenderer.invoke("app:version"),
}

contextBridge.exposeInMainWorld("youloader", youloader)

export type Youloader = typeof youloader
