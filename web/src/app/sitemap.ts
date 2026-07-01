import type { MetadataRoute } from "next"

const BASE = "https://youloader.robinrahman.pro"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/guide`, changeFrequency: "monthly", priority: 0.8 },
  ]
}
