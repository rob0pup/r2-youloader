import "./globals.css"

import * as Sentry from "@sentry/electron/renderer"
import React from "react"
import ReactDOM from "react-dom/client"

import { Providers } from "@/components/providers"

import App from "./App"

// Hooks the renderer into the main process's Sentry client (enable/DSN are
// controlled there); reports unhandled errors from the UI.
Sentry.init({})

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Providers>
      <App />
    </Providers>
  </React.StrictMode>
)
