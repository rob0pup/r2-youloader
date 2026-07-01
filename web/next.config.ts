import { withSentryConfig } from "@sentry/nextjs"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {}

// Wrapped for Sentry: injects the SDK and, when SENTRY_AUTH_TOKEN + SENTRY_ORG
// + SENTRY_PROJECT are set, uploads source maps at build time. Without them it
// builds normally and just skips the upload.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  telemetry: false,
})
