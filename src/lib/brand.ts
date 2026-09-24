/**
 * Brand & share asset paths — swap files under /public, keep these paths.
 * See public/BRAND.md
 */
export const BRAND = {
  name: 'Tintfield',
  themeColor: '#121212',
  themeColorLight: '#f5f5f5',
  tileColor: '#121212',
  /** Absolute path from site root */
  faviconIco: '/favicon.ico',
  faviconSvg: '/favicon.svg',
  appleTouchIcon: '/apple-touch-icon.png',
  icon192: '/brand/icon-192.png',
  icon512: '/brand/icon-512.png',
  maskable512: '/brand/maskable-512.png',
  safariPinnedTab: '/brand/safari-pinned-tab.svg',
  mstile150: '/brand/mstile-150.png',
  /** Open Graph / Facebook / LinkedIn / Slack / Discord / iMessage */
  ogImage: '/social/og-default.png',
  /** Square crop for WhatsApp / Telegram / some crawlers */
  ogSquare: '/social/og-square.png',
  /** X (Twitter) summary_large_image */
  twitterImage: '/social/twitter.png',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  manifest: '/site.webmanifest',
  browserConfig: '/browserconfig.xml',
} as const
