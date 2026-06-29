import { LogoMark } from "@/components/logo-mark"
import { ThemeToggle } from "@/components/theme-toggle"

function App(): React.JSX.Element {
  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col px-6">
      <header className="flex items-center justify-between py-5">
        <span className="inline-flex items-center gap-2">
          <LogoMark className="h-5 w-auto" />
          <span className="text-sm font-semibold tracking-tight">Youloader</span>
        </span>
        <ThemeToggle />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
        <LogoMark className="mb-6 h-12 w-auto" />
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Download from YouTube.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-pretty text-muted-foreground">
          Paste a link, pick a quality, save the video or audio. Runs on your
          machine, nothing in the cloud.
        </p>

        <div className="mt-8 w-full max-w-xl">
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-card px-3 py-2.5 text-left">
            <input
              type="url"
              disabled
              placeholder="Paste a YouTube link…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
              coming soon
            </span>
          </div>
        </div>
      </div>

      <footer className="border-t border-line py-6 text-center text-xs text-muted-foreground">
        a desktop tool by Robin
      </footer>
    </main>
  )
}

export default App
