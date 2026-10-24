import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/dashboard', '/login', '/api/'] }],
    // Short links themselves aren't pages; point crawlers at the real sites.
    sitemap: ['https://me.mueed.xyz/sitemap.xml', 'https://portfolio.mueed.xyz/sitemap.xml'],
  }
}
