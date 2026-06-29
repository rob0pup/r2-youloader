export function formatBytes(bytes: number | null): string {
  if (!bytes) return "—"
  const units = ["B", "KB", "MB", "GB"]
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  )
  const value = bytes / 1024 ** i
  return `${value.toFixed(i > 1 && value < 100 ? 1 : 0)} ${units[i]}`
}

export function formatDuration(seconds: number | null): string {
  if (!seconds) return ""
  const s = Math.round(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number): string => String(n).padStart(2, "0")
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`
}
