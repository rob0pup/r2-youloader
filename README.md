# Youloader

**A free desktop app to download YouTube videos, audio, and playlists, on your own machine.**

Paste a link, pick a quality up to 8K, and save the video (MP4) or audio (MP3/M4A). Everything runs locally on your own connection, nothing is uploaded and there are no accounts, quotas, or ads.

**Site:** [youloader.robinrahman.pro](https://youloader.robinrahman.pro) · **[Download](https://github.com/rob0pup/r2-youloader/releases/latest)** · **[Guide & troubleshooting](https://youloader.robinrahman.pro/guide)**

## Download

| Platform | |
| --- | --- |
| Windows | [Youloader-Setup.exe](https://github.com/rob0pup/r2-youloader/releases/latest/download/Youloader-Setup.exe) |
| macOS (Apple Silicon) | [Youloader-arm64.dmg](https://github.com/rob0pup/r2-youloader/releases/latest/download/Youloader-arm64.dmg) |
| Linux | [Youloader.AppImage](https://github.com/rob0pup/r2-youloader/releases/latest/download/Youloader.AppImage) |

Intel Macs aren't prebuilt (Apple Silicon covers Macs since late 2020); [build from source](docs/BUILDING.md) if you need one.

Builds are unsigned for now, so Windows shows a SmartScreen prompt (More info → Run anyway) and macOS needs a right-click → Open. The [guide](https://youloader.robinrahman.pro/guide) walks through it. Windows and Linux builds update themselves; macOS users re-download.

## Features

- **Videos and whole playlists** from a single link, any quality from 144p to 8K.
- **MP4 video or MP3 / M4A audio.**
- **Subtitles** (incl. auto-generated) as a `.srt` sidecar.
- **SponsorBlock** — skip sponsor segments.
- **Trim** a video to a start/end section.
- **Clipboard auto-detect** — copy a link, the app pre-fills it.
- **Cookies** (from your browser or a `cookies.txt`) to get past YouTube's "confirm you're not a bot" gate.
- **Live speed and ETA** while downloading.
- **Auto-update** on Windows and Linux.

## How it works

A thin desktop shell over the proven [yt-dlp](https://github.com/yt-dlp/yt-dlp) engine:

- **yt-dlp** (nightly) resolves and downloads. Auto-downloaded on first run.
- **ffmpeg** merges separate video/audio streams and extracts audio. Bundled.
- **Deno** runs yt-dlp's JavaScript solver for YouTube's "n challenge". Auto-downloaded.

Nothing for the user to install separately. See [`docs/BUILD-NOTES.md`](docs/BUILD-NOTES.md) for the full story (the bot gate, the n-challenge, packaging) and [`docs/BUILDING.md`](docs/BUILDING.md) / [`docs/RELEASING.md`](docs/RELEASING.md) for build and release details.

## Tech

- [Electron](https://www.electronjs.org) + [electron-vite](https://electron-vite.org)
- [React](https://react.dev) + TypeScript + [Tailwind CSS](https://tailwindcss.com) v4
- A separate [Next.js](https://nextjs.org) landing page in [`web/`](web/), deployed on Vercel
- Packaged with [electron-builder](https://www.electron.build); built for all three OSes in CI

## Develop

```bash
pnpm install
pnpm dev              # run the app
pnpm build            # bundle main + preload + renderer
pnpm check-types

# package an installer for your OS:
pnpm package:win      # or package:mac / package:linux
```

## Credits

Built by [Robin](https://robinrahman.pro). MIT licensed.
