# Building Youloader

## Develop

```bash
pnpm install
pnpm dev
```

## Portable build (no extra setup)

```bash
pnpm build
pnpm exec electron-builder --win --dir
# -> dist/win-unpacked/Youloader.exe  (run it directly)
```

## Installer (.exe)

The NSIS installer step needs the Windows symlink privilege to extract
electron-builder's `winCodeSign` cache. Grant it once, either:

- **Settings -> System -> For developers -> turn on "Developer Mode"**, or
- run the terminal **as Administrator**.

Then:

```bash
pnpm package:win
# -> dist/Youloader-Setup-<version>.exe
```

## Runtime notes

- **yt-dlp** (nightly channel), **ffmpeg** (bundled via `ffmpeg-static`,
  unpacked from the asar), and **Deno** are all set up automatically on first
  use, so there's nothing for the user to install.
- Solving YouTube's "n challenge" needs a JavaScript runtime. The app downloads
  and bundles **Deno** (unzipped into its `bin/` folder, which is added to
  yt-dlp's `PATH`) and runs with `--js-runtimes deno,node`, so it prefers the
  bundled Deno and falls back to a system Node if one happens to be installed.
- The repo uses `node-linker=hoisted` (`.npmrc`) so electron-builder can bundle
  the production dependencies from a flat `node_modules`.
