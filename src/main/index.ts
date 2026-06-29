import { join } from "path"

import { app, BrowserWindow, dialog, ipcMain, shell } from "electron"

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

function createWindow(): void {
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
      (percent, merging) =>
        event.sender.send("yt:download-progress", {
          id: req.formatId,
          percent,
          merging,
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

  ipcMain.handle("dialog:pick-cookies", async () => {
    const result = await dialog.showOpenDialog({
      title: "Select your cookies.txt",
      filters: [{ name: "Cookies", extensions: ["txt"] }],
      properties: ["openFile"],
    })
    return result.canceled ? null : (result.filePaths[0] ?? null)
  })

  createWindow()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})
