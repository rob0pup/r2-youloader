# Youloader

**Paste a YouTube link, pick a quality, download the video or audio.**

A clean front end for downloading from YouTube. The heavy lifting (resolving
streams, deciphering, merging) is done by a pluggable download provider behind
an adapter, so the engine can be swapped without touching the UI.

**Live:** [youloader.robinrahman.pro](https://youloader.robinrahman.pro)

## Status

In active development, built in the open one PR at a time. PR 1 is the scaffold.

## Tech

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com) v4
- Pluggable download-provider adapter (mock first, real API next)
- Deployed on [Vercel](https://vercel.com)

## Develop

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build
pnpm check-types
```

## Credits

Built by [Robin](https://github.com/rob0pup). MIT licensed.
