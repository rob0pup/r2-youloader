/// <reference types="vite/client" />

import type { Youloader } from "../../preload"

declare global {
  interface Window {
    youloader: Youloader
  }
}
