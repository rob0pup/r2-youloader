# Releasing Youloader

The repo is public, so releases are downloaded straight from GitHub. The website
button deep-links to the latest release asset; nothing is hosted on Vercel and
no tokens are involved.

## The flow

```
git tag v0.1.0  ->  Release workflow (windows-latest)  ->  GitHub Release
                                                              + Youloader-Setup.exe
                                                              |
                  Download button -> /releases/latest/download/Youloader-Setup.exe
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
`Youloader-Setup.exe` to a GitHub Release using the built-in `GITHUB_TOKEN`. A
manual `workflow_dispatch` run builds the installer and uploads it as an
artifact without cutting a release.

The asset name is **version-less and stable** (`Youloader-Setup.exe`), so
`/releases/latest/download/Youloader-Setup.exe` always points at the newest
build and the website button never needs updating.

## Notes

- The installer is large (Electron + bundled ffmpeg, roughly 100 MB), served
  from GitHub's release CDN.
- yt-dlp and Deno are **not** in the installer; they're downloaded on first run
  (see [`BUILD-NOTES.md`](./BUILD-NOTES.md)). Only ffmpeg is bundled.
