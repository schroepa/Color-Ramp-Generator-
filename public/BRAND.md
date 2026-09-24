# Brand & share assets — swap files, keep filenames

Replace these binaries/SVGs in place. Paths are wired in `src/lib/brand.ts`
and `src/components/seo/SiteHead.astro`. No code change needed for a visual swap.

## Favicon & app icons

| File | Size | Used by |
|---|---|---|
| `/favicon.svg` | vector | Modern browsers |
| `/favicon.ico` | 16+32 | Legacy / bookmarks |
| `/favicon-16.png` / `/favicon-32.png` | 16 / 32 | Source for `.ico` rebuild |
| `/apple-touch-icon.png` | 180×180 | iOS home screen |
| `/android-chrome-192x192.png` | 192×192 | Alias → brand/icon-192 |
| `/android-chrome-512x512.png` | 512×512 | Alias → brand/icon-512 |
| `/brand/mark.svg` | vector | Master mark (edit this first) |
| `/brand/icon-192.png` | 192×192 | PWA / Android |
| `/brand/icon-512.png` | 512×512 | PWA / Android |
| `/brand/maskable-512.png` | 512×512 | Adaptive icon (safe zone) |
| `/brand/mstile-150.png` | 150×150 | Windows tiles |
| `/brand/safari-pinned-tab.svg` | vector | Safari pinned tab (mono OK) |

After editing `brand/mark.svg`, regenerate rasters:

```bash
magick -background none brand/mark.svg -resize 32x32 favicon-32.png
magick -background none brand/mark.svg -resize 16x16 favicon-16.png
magick favicon-16.png favicon-32.png favicon.ico
magick -background none brand/mark.svg -resize 180x180 apple-touch-icon.png
magick -background none brand/mark.svg -resize 192x192 brand/icon-192.png
magick -background none brand/mark.svg -resize 512x512 brand/icon-512.png
# then copy aliases:
cp brand/icon-192.png android-chrome-192x192.png
cp brand/icon-512.png android-chrome-512x512.png
```

## Social / Open Graph previews

| File | Size | Used by |
|---|---|---|
| `/social/og-default.png` | **1200×630** | Facebook, LinkedIn, Slack, Discord, iMessage, most OG crawlers |
| `/social/og-square.png` | **1200×1200** | WhatsApp / Telegram / some messengers (optional second `og:image`) |
| `/social/twitter.png` | **1200×630** | X (Twitter) `summary_large_image` |

Keep exact dimensions. Prefer PNG or JPG under ~1 MB. Absolute HTTPS URLs are injected in `<head>`.

After replacing images, re-scrape caches:

- Facebook: https://developers.facebook.com/tools/debug/
- LinkedIn: https://www.linkedin.com/post-inspector/
- X: https://cards-dev.twitter.com/validator (or post a test link)
- Slack/Discord: usually refresh after cache TTL; append `?v=2` to the image URL if stuck

## Config files

| File | Purpose |
|---|---|
| `/site.webmanifest` | PWA name, theme, icons |
| `/browserconfig.xml` | Windows Start tile |
