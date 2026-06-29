import { join } from "path"

import { app, BrowserWindow, ipcMain, shell } from "electron"

import { resolve as resolveVideo } from "./ytdlp"

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

  ipcMain.handle("yt:resolve", (event, url: string) =>
    resolveVideo(url, (percent) =>
      event.sender.send("yt:setup-progress", percent)
    )
  )

  createWindow()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})
