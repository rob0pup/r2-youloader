import { join } from "path"

import * as Sentry from "@sentry/electron/main"
import { app, BrowserWindow, clipboard, dialog, ipcMain, shell } from "electron"

import type {
  DownloadRequest,
  PlaylistRequest,
  ResolveOptions,
} from "../shared/types"

import {
  download as downloadVideo,
  downloadPlaylist,
  resolve as resolveVideo,
  resolvePlaylist,
} from "./ytdlp"
import { initUpdater, quitAndInstall } from "./updater"

// Crash + error reporting. The DSN is client-side/public by design. Only
// enabled in packaged builds so dev runs stay out of the dashboard.
Sentry.init({
  dsn: "https://b80961e25732edbffeda65032222cebc@o4511660520964096.ingest.us.sentry.io/4511660621824000",
  enabled: app.isPackaged,
})

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 920,
    height: 740,
    minWidth: 480,
    minHeight: 560,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#0a0a0a",
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      sandbox: false,
    },
  })

  win.on("ready-to-show", () => win.show())

  // Open external links in the user's browser, never inside the app window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: "deny" }
  })

  const devUrl = process.env["ELECTRON_RENDERER_URL"]
  if (devUrl) {
    win.loadURL(devUrl)
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"))
  }

  return win
}

app.whenReady().then(() => {
  ipcMain.handle("app:version", () => app.getVersion())

  ipcMain.handle(
    "yt:resolve",
    (event, url: string, options?: ResolveOptions) =>
      resolveVideo(url, options, (percent) =>
        event.sender.send("yt:setup-progress", percent)
      )
  )

  ipcMain.handle("yt:download", (event, req: DownloadRequest) =>
    downloadVideo(
      req,
      (tick) =>
        event.sender.send("yt:download-progress", {
          id: req.formatId,
          ...tick,
        }),
      (percent) => event.sender.send("yt:setup-progress", percent)
    )
  )

  ipcMain.handle(
    "yt:resolve-playlist",
    (event, url: string, options?: ResolveOptions) =>
      resolvePlaylist(url, options, (percent) =>
        event.sender.send("yt:setup-progress", percent)
      )
  )

  ipcMain.handle("yt:download-playlist", (event, req: PlaylistRequest) =>
    downloadPlaylist(
      req,
      (p) => event.sender.send("yt:playlist-progress", p),
      (percent) => event.sender.send("yt:setup-progress", percent)
    )
  )

  ipcMain.handle("shell:show-item", (_event, path: string) => {
    shell.showItemInFolder(path)
  })

  ipcMain.handle("app:downloads-dir", () => app.getPath("downloads"))

  ipcMain.handle("clipboard:read-text", () => clipboard.readText())

  ipcMain.handle("update:restart", () => quitAndInstall())

  ipcMain.handle("dialog:pick-folder", async () => {
    const result = await dialog.showOpenDialog({
      title: "Choose a download folder",
      properties: ["openDirectory", "createDirectory"],
    })
    return result.canceled ? null : (result.filePaths[0] ?? null)
  })

  ipcMain.handle("dialog:pick-cookies", async () => {
    const result = await dialog.showOpenDialog({
      title: "Select your cookies.txt",
      filters: [{ name: "Cookies", extensions: ["txt"] }],
      properties: ["openFile"],
    })
    return result.canceled ? null : (result.filePaths[0] ?? null)
  })

  const win = createWindow()
  // Auto-update only makes sense for an installed build.
  if (app.isPackaged) initUpdater(win)

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})
