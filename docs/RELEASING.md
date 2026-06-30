# Releasing Youloader

The repo is public, so releases are downloaded straight from GitHub. The website
button deep-links to the latest release asset; nothing is hosted on Vercel and
no tokens are involved.

## The flow

```
git tag v0.1.0  ->  Release workflow (matrix)  ->  one GitHub Release with:
                    win   x64  (windows-latest)      Youloader-Setup.exe
                    mac   arm64 (macos-latest)        Youloader-arm64.dmg
                    mac   x64  (macos-13 / Intel)     Youloader-x64.dmg
                    linux x64  (ubuntu-latest)        Youloader.AppImage
                                                          |
                    Download links -> /releases/latest/download/<stable name>
```

## Cut a release

```bash
# bump the version in package.json first, then:
git tag v0.1.0
git push origin v0.1.0
```

The **Release** workflow (`.github/workflows/release.yml`) builds each target on
a matching runner (so ffmpeg-static, a per-arch binary, is correct), uploads
each as an artifact, then a final `release` job publishes them all to one GitHub
Release with the built-in `GITHUB_TOKEN`. Building each arch on its own runner
also avoids races on the release. CI runners have the symlink privilege the
local winCodeSign step needs, so no Developer Mode is required.

A manual `workflow_dispatch` run builds all four installers and uploads them as
artifacts **without** cutting a release, useful for verifying a build before
tagging.

Asset names are **version-less and stable**, so the website always deep-links
the newest build and never needs updating:

| Platform | Asset |
| --- | --- |
| Windows | `Youloader-Setup.exe` |
| macOS (Apple Silicon) | `Youloader-arm64.dmg` |
| macOS (Intel) | `Youloader-x64.dmg` |
| Linux | `Youloader.AppImage` |

## Notes

- Installers are large (Electron + bundled ffmpeg, roughly 100 MB), served from
  GitHub's release CDN.
- yt-dlp and Deno are **not** in the installer; they're downloaded on first run
  (see [`BUILD-NOTES.md`](./BUILD-NOTES.md)). Only ffmpeg is bundled.
- Builds are **unsigned**: Windows shows a SmartScreen prompt, macOS needs a
  right-click Open / `xattr -cr` (both covered in the website guide). Signing
  needs a paid certificate; see future work.
