import "./globals.css"

import { Analytics } from "@vercel/analytics/next"
import { GeistMono } from "geist/font/mono"
import { GeistSans } from "geist/font/sans"
import type { Metadata, Viewport } from "next"

import { Providers } from "@/components/providers"
import { ViewBeacon } from "@/components/view-beacon"

const title = "Youloader — download YouTube videos on your PC"
const description =
  "A free desktop app to download YouTube videos and audio in up to 8K. Runs on your machine, nothing uploaded."

export const metadata: Metadata = {
  metadataBase: new URL("https://youloader.robinrahman.pro"),
  title: {
    default: title,
    template: "%s · Youloader",
  },
  description,
  applicationName: "Youloader",
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description,
    url: "/",
    siteName: "Youloader",
    locale: "en_US",
    type: "website",
  },
  twitter: { card: "summary_large_image", title, description },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-svh bg-background font-sans text-foreground antialiased">
        <Providers>{children}</Providers>
        <Analytics />
        <ViewBeacon />
      </body>
    </html>
  )
}
