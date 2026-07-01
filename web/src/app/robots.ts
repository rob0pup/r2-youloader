import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://youloader.robinrahman.pro/sitemap.xml",
    host: "https://youloader.robinrahman.pro",
  }
}
