import { resolve } from "path"

import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, externalizeDepsPlugin } from "electron-vite"

export default defineConfig({
  main: {
    // Bundle @sentry/electron into the main bundle instead of leaving it as an
    // external require. Under pnpm's symlinked node_modules, electron-builder
    // didn't pack its transitive deps (e.g. @sentry/browser-utils) into the
    // asar, so the packaged app crashed at startup with "Cannot find module".
    // Bundling sidesteps the packaging problem entirely.
    plugins: [externalizeDepsPlugin({ exclude: ["@sentry/electron"] })],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    base: "./",
    resolve: {
      alias: { "@": resolve("src/renderer/src") },
    },
    plugins: [react(), tailwindcss()],
  },
})
