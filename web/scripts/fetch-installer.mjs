// Runs at build time (see "vercel-build" in package.json). The source repo is
// private, so the Windows installer lives as a GitHub Release asset rather than
// in git. If a token is available we download the latest installer into
// public/download so Vercel serves it statically from the website. Without a
// token (local dev, PR previews) we skip gracefully and leave the button as a
// dead link until a real deploy.
import { mkdir, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const REPO = "rob0pup/r2-youloader"
const OUT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "download",
  "youloader-setup.exe"
)

const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN
if (!token) {
  console.log("[fetch-installer] No GH_TOKEN set; skipping installer download.")
  process.exit(0)
}

const gh = (extra = {}) => ({
  Authorization: `Bearer ${token}`,
  "User-Agent": "youloader-build",
  ...extra,
})

try {
  const relRes = await fetch(
    `https://api.github.com/repos/${REPO}/releases/latest`,
    { headers: gh({ Accept: "application/vnd.github+json" }) }
  )
  if (!relRes.ok) {
    console.log(`[fetch-installer] No release found (HTTP ${relRes.status}); skipping.`)
    process.exit(0)
  }
  const release = await relRes.json()
  const asset = (release.assets ?? []).find((a) => a.name.endsWith(".exe"))
  if (!asset) {
    console.log("[fetch-installer] Latest release has no .exe asset; skipping.")
    process.exit(0)
  }

  const dlRes = await fetch(asset.url, {
    headers: gh({ Accept: "application/octet-stream" }),
  })
  if (!dlRes.ok) {
    throw new Error(`Asset download failed (HTTP ${dlRes.status})`)
  }
  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, Buffer.from(await dlRes.arrayBuffer()))
  console.log(
    `[fetch-installer] Saved ${asset.name} (${(asset.size / 1e6).toFixed(1)} MB) -> public/download/youloader-setup.exe`
  )
} catch (err) {
  // Never fail the whole build over the installer; just warn.
  console.warn("[fetch-installer] Skipped due to error:", err.message)
}
