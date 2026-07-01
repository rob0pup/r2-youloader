import type { BrowserWindow } from "electron"
import { autoUpdater } from "electron-updater"

import type { UpdateStatus } from "../shared/types"

/**
 * Wire up updates against the GitHub releases (the publish provider in
 * electron-builder.yml). Works for the Windows (NSIS) and Linux (AppImage)
 * builds, which update unsigned. macOS auto-update needs code signing, which we
 * don't have yet, so we skip it there (those users re-download from the site).
 *
 * Consent-first: we only *check* on launch and tell the renderer a new version
 * exists. Nothing downloads until the user clicks Update (downloadUpdate), and
 * nothing installs until they click Restart (quitAndInstall). No silent
 * download/install.
 */
export function initUpdater(win: BrowserWindow): void {
  if (process.platform === "darwin") return

  const send = (payload: UpdateStatus): void => {
    if (!win.isDestroyed()) win.webContents.send("update:status", payload)
  }

  // Don't fetch the update until the user opts in; don't slip it in on quit.
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false

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

/** Start downloading the available update (called when the user clicks Update). */
export function downloadUpdate(): void {
  autoUpdater.downloadUpdate().catch(() => {
    // Surfaced to the renderer via the "error" event above.
  })
}

/** Quit and install a downloaded update. */
export function quitAndInstall(): void {
  autoUpdater.quitAndInstall()
}
