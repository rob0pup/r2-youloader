# Youloader, Build Notes No. 04

A study companion to how Youloader is built. Of the tools in this series, this
one had the longest fight with the platform it targets, so the war stories are
the most instructive part.

Three halves:

1. **How downloading from YouTube actually works** (and why it's hard).
2. **How Youloader is built** (the desktop architecture, mapped to the code).
3. **The cat-and-mouse** (every wall YouTube put up, and how each was cleared).

For build/run commands see [`BUILDING.md`](./BUILDING.md).

---

## Part 1. How downloading from YouTube actually works

### 1.1 YouTube does not hand you a file

When you watch a video, your browser does not download one MP4. YouTube serves:

- **Separate video and audio streams** (DASH). Anything above 360p is a
  video-only stream plus a separate audio stream that must be **merged** back
  together afterwards.
- **Obfuscated stream URLs.** Each URL is protected by a `signature` and an `n`
  parameter that are scrambled by JavaScript running in YouTube's player. To get
  a working URL you must run that JS to **descramble** them. YouTube changes the
  scrambling constantly, specifically to break downloaders.
- **A bot gate.** YouTube increasingly answers anonymous requests with "sign in
  to confirm you're not a bot," especially from data-center IPs.

So a downloader has to: resolve the player response, defeat the JS obfuscation,
download two streams, and merge them. Almost nobody re-implements this; the
de-facto engine is **[yt-dlp](https://github.com/yt-dlp/yt-dlp)** (open source),
with **ffmpeg** doing the merge.

### 1.2 Why this can't be a website

It is tempting to build a web app like the other tools in this series. It does
not work:

- A browser can't fetch YouTube's streams (CORS), can't reliably run the
  descrambling, and can't run ffmpeg at scale.
- So you need a **server** running yt-dlp + ffmpeg. But YouTube **blocks
  data-center IPs** (every cloud/free host) within hours. The public downloader
  sites survive only by paying for **residential proxy pools** (funded by heavy
  ads) and rotating domains.

The honest conclusion: for a free, reliable, personal tool, run it on the user's
**own machine** (their residential IP). That is why Youloader is a **desktop
app**, not a website.

### 1.3 The newest walls: the n-challenge and PO tokens / SABR

Two recent escalations matter:

- **The n-challenge.** YouTube made the `n`-parameter puzzle so complex that
  yt-dlp can no longer solve it in pure Python; it now needs an **external
  JavaScript runtime** (Deno or Node) to run a bundled solver script. Without a
  JS runtime, you get *only storyboard images*, no real formats.
- **SABR / PO tokens.** YouTube is moving to a streaming protocol where format
  URLs are gated behind a "Proof-of-Origin" token. Staying current here is why
  Youloader tracks yt-dlp's **nightly** builds rather than the slower stable
  release.

---

## Part 2. How Youloader is built

Youloader is a **desktop app**: a thin UI driving yt-dlp + ffmpeg locally.

### 2.1 The shape

- **Electron** app, built with **electron-vite** (it bundles the three pieces:
  main, preload, renderer). UI is **React + Tailwind v4**, reusing the R² mark
  and theme from the other tools.
- Three processes/layers:
  - **Main** (Node): owns the engine. Spawns yt-dlp, points it at ffmpeg, parses
    progress, and talks to the OS (file dialogs, "show in folder").
  - **Preload**: a context-isolated bridge exposing a small, safe
    `window.youloader` API (resolve, download, downloadPlaylist, pick folder,
    progress events). The renderer can touch nothing else.
  - **Renderer**: the React UI. Paste a link, see formats, click download.
- A second surface, the **web landing page** (`/web`, Next.js on Vercel), is
  just marketing + a download button. The two never share a process.

### 2.2 The engine, with nothing to install

- **yt-dlp** is downloaded automatically on first use into the app's data folder
  (the **nightly** build, with a `.channel` marker so an old cached binary is
  replaced). Nothing for the user to install.
- **ffmpeg** is bundled (`ffmpeg-static`), and unpacked from the asar when
  packaged so it's a real runnable file.
- **Deno** (the JS runtime that solves the n-challenge, see 3.5) is downloaded
  the same way on first use and unzipped into the same `bin/` folder. yt-dlp
  discovers it because that folder is prepended to the spawned process's `PATH`.
  All three binaries are fetched at runtime, so they don't bloat the installer.

### 2.3 The three flows

- **Resolve.** `yt-dlp -J` dumps the video's info as JSON; we map it to a clean
  list of formats (one row per resolution, plus audio). A custom `--js-runtimes`
  setting lets yt-dlp solve the n-challenge (see Part 3).
- **Download.** For a chosen resolution we run `yt-dlp -f "<id>+bestaudio"
  --merge-output-format mp4`, with `--ffmpeg-location` pointing at the bundled
  ffmpeg; audio can be downloaded natively (M4A) or extracted to MP3. yt-dlp's
  `[download] N%` lines are parsed into a progress bar; `[Merger]` flips it to
  "Merging…".
- **Playlists.** Rather than orchestrate per-video, we hand the **playlist URL to
  one yt-dlp process** with an output template
  (`<playlist>/NN - title.ext`); yt-dlp iterates the whole list and we parse
  "Downloading item N of M" for overall progress.

### 2.4 Settings & where things live

Download folder, quality preset, and the cookies-browser choice persist
(localStorage); the folder is passed to each job. Key files:

| Concern | Path |
| --- | --- |
| Electron entry (window, IPC) | `src/main/index.ts` |
| yt-dlp + ffmpeg binary management | `src/main/binaries.ts`, `src/main/ffmpeg.ts` |
| Engine: resolve / download / playlist | `src/main/ytdlp.ts` |
| Safe bridge | `src/preload/index.ts` |
| UI | `src/renderer/src/App.tsx` |
| Shared types | `src/shared/types.ts` |
| Landing site | `web/` |

---

## Part 3. The cat-and-mouse (the war stories)

This is the real lesson. Each step below was a separate wall, hit in order.

### 3.1 "Sign in to confirm you're not a bot"

The first resolve failed at YouTube's bot gate. **Fix:** give yt-dlp the user's
logged-in cookies with `--cookies-from-browser`. Picking **Firefox** worked
immediately. Chrome/Edge did **not**: on Windows they lock their cookie DB while
running and use app-bound encryption, so yt-dlp can't read them ("could not copy
cookie database"). **So we added a second path: importing an exported
`cookies.txt`** (`--cookies <file>`), which is browser-agnostic and bullet-proof.

### 3.2 Past the gate, but only storyboards

With cookies accepted, the next error was "Requested format is not available" and
only storyboard images. This was the **n-challenge**: yt-dlp needs a JS runtime
to run its bundled solver. **Fix:** pass `--js-runtimes node` (Node 22+ is
present in dev). Instantly, a video that returned 4 storyboards returned **143
real formats**. We also switched yt-dlp to the **nightly** channel and added
`--ignore-no-formats-error` for resilience.

> The diagnosis only worked because we ran `yt-dlp -F` directly to see the raw
> formats, separating "our bug" from "YouTube's wall." When an integration
> misbehaves, talk to the underlying tool directly.

### 3.3 Desktop, and Electron over Tauri

Because YouTube blocks cloud IPs, Youloader had to be a desktop app. The first
choice was **Tauri** (tiny binaries), but it requires Rust + the Visual Studio
C++ build tools, which weren't installed and couldn't be verified locally. We
pivoted to **Electron**: it uses the Node already present, and the build is
verifiable. Bigger binary, but it ships.

### 3.4 Packaging on Windows

Two packaging traps:
- **pnpm + electron-builder**: pnpm's symlinked `node_modules` confuses
  electron-builder. Fix: `.npmrc` with `node-linker=hoisted` for a flat tree.
- **The winCodeSign cache**: electron-builder downloads a signing cache that
  contains *macOS symlinks*. Extracting them on Windows needs the symlink
  privilege, so the installer step fails unless **Developer Mode** (or admin) is
  on. The unpacked (`--dir`) build works without it.

### 3.5 The last hidden dependency: bundling Deno

After the n-challenge was beaten with `--js-runtimes node`, the app technically
worked, but only on machines that happened to have **Node 22+ installed**. A
"nothing to install" desktop app that secretly requires Node isn't actually
zero-install. So why is a JS runtime needed at all, and why Deno?

- **Why any JS runtime.** YouTube scrambles its stream URLs with a JavaScript
  "n challenge" (see 1.3). yt-dlp ships a *solver script* but can't run JS
  itself; it shells out to an external engine. No engine -> only storyboard
  images come back.
- **Why Deno, not the Node we started with.** Deno is yt-dlp's **recommended**
  runtime for this: it runs the untrusted YouTube JS in a **sandbox** (no file,
  network, or env access by default), which is safer than handing it a full
  Node. It also ships as a **single self-contained binary** with no installer or
  system dependencies, so it can be fetched on demand exactly like yt-dlp and
  ffmpeg.

**Fix:** download Deno's zip on first use, unzip it into the same `bin/` folder
(`Expand-Archive` on Windows, `unzip` elsewhere, no extra npm dependency), and
prepend that folder to the spawned yt-dlp process's `PATH`. The runtime flag
became `--js-runtimes deno,node`, so the bundled Deno is preferred but a system
Node still works as a fallback. Deno setup is best-effort: if the download fails
(e.g. offline), the app still runs and yt-dlp falls back to whatever runtime is
on `PATH`. The app is now genuinely zero-install.

### 3.6 What's still open

- **Public distribution.** Because this is a YouTube tool, hosting a public,
  branded installer carries ToS exposure. The repo is private and the landing
  button says "coming soon" until that's a deliberate decision.

---

## Glossary

- **yt-dlp:** the open-source engine that resolves and downloads from YouTube
  (and 1000+ sites).
- **ffmpeg:** merges separate video/audio streams; extracts audio (e.g. to MP3).
- **DASH:** YouTube's split video-only + audio-only streams for higher quality.
- **n-challenge / signature:** JS-scrambled stream-URL protection; needs a JS
  runtime to solve.
- **EJS:** yt-dlp's "external JS" mechanism using Deno/Node to run the solver.
- **Deno:** a single-binary, sandboxed JS runtime; bundled here (downloaded on
  first use) to solve the n-challenge with no installed Node required.
- **PO token / SABR:** YouTube's newer proof-of-origin gating of format URLs.
- **cookies-from-browser / cookies.txt:** ways to hand yt-dlp a logged-in session
  to clear the bot gate.
- **Electron / electron-vite:** the desktop shell and its build tool.
- **asarUnpack:** keeps a bundled binary (ffmpeg) outside the asar archive so it
  can actually run.
