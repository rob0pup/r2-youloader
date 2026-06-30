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

- **yt-dlp** (nightly channel) is downloaded automatically into the app's data
  folder on first use. **ffmpeg** is bundled (`ffmpeg-static`, unpacked from the
  asar).
- Solving YouTube's "n challenge" needs a JavaScript runtime. Right now the app
  uses **Node (>= 22)**, which must be installed. A later build will bundle a
  runtime (Deno) so nothing is required.
- The repo uses `node-linker=hoisted` (`.npmrc`) so electron-builder can bundle
  the production dependencies from a flat `node_modules`.
