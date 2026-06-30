import type { BrowserWindow } from "electron"
import { autoUpdater } from "electron-updater"

import type { UpdateStatus } from "../shared/types"

/**
 * Wire up auto-update against the GitHub releases (the publish provider in
 * electron-builder.yml). Works for the Windows (NSIS) and Linux (AppImage)
 * builds, which update unsigned. macOS auto-update needs code signing, which we
 * don't have yet, so we skip it there (those users re-download from the site).
 *
 * Status is forwarded to the renderer, which shows a small banner and a
 * "Restart to update" button once a build has finished downloading.
 */
export function initUpdater(win: BrowserWindow): void {
  if (process.platform === "darwin") return

  const send = (payload: UpdateStatus): void => {
    if (!win.isDestroyed()) win.webContents.send("update:status", payload)
  }

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on("update-available", (info) =>
    send({ status: "available", version: info.version })
  )
  autoUpdater.on("download-progress", (p) =>
    send({ status: "downloading", percent: Math.round(p.percent) })
  )
  autoUpdater.on("update-downloaded", (info) =>
    send({ status: "downloaded", version: info.version })
  )
  autoUpdater.on("error", (err) =>
    send({ status: "error", message: err == null ? "unknown" : String(err) })
  )

  autoUpdater.checkForUpdates().catch(() => {
    // Offline or no release yet: stay quiet, the banner just never appears.
  })
}

/** Quit and install a downloaded update. */
export function quitAndInstall(): void {
  autoUpdater.quitAndInstall()
}
