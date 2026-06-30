# Releasing Youloader

The source repo is **private**, but the download is **public**, served from the
website (`youloader.robinrahman.pro`). The Windows installer is built in CI,
stored as a GitHub Release asset, and pulled into the website at build time. The
binary never lives in git.

## The flow

```
git tag v0.1.0  ->  Release workflow (windows-latest)  ->  GitHub Release + .exe asset
                                                              |
                                   Vercel build runs fetch-installer.mjs (with GH_TOKEN)
                                                              |
                                   public/download/youloader-setup.exe  ->  Download button
```

## Cut a release

```bash
# bump the version in package.json first, then:
git tag v0.1.0
git push origin v0.1.0
```

The **Release** workflow (`.github/workflows/release.yml`) runs on the tag,
builds the NSIS installer on a Windows runner (CI has the symlink privilege the
local winCodeSign step needs, so no Developer Mode required), and attaches
`Youloader-Setup-<version>.exe` to a GitHub Release. It's also uploaded as a
workflow artifact, so a `workflow_dispatch` run gives you a downloadable build
without cutting a release.

## One-time Vercel setup

So the website build can pull the installer out of the private release:

1. Create a **fine-grained Personal Access Token** with read access to
   `rob0pup/r2-youloader` (Contents: Read).
2. In the Vercel project, add it as an environment variable named **`GH_TOKEN`**.
3. Make sure Vercel runs the `vercel-build` script (it does by default when the
   script exists). That script runs `fetch-installer.mjs` before `next build`,
   downloading the latest release's `.exe` into `public/download/`.

Without the token (local dev, PR previews) the fetch skips gracefully and the
download button is a dead link until a real production deploy.

## Notes

- The installer is large (Electron + bundled ffmpeg, roughly 100 MB). It's
  served as a static file from Vercel's CDN.
- yt-dlp and Deno are **not** in the installer; they're downloaded on first run
  (see [`BUILD-NOTES.md`](./BUILD-NOTES.md)). Only ffmpeg is bundled.
- Prefer committing the binary instead? Drop it at
  `web/public/download/youloader-setup.exe` and remove that path from
  `.gitignore`. Simpler, but it bloats the repo by ~100 MB per version.
