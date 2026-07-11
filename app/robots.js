const SITE_URL = 'https://moneyjot.vercel.app'

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/expenses', '/analytics', '/lending', '/sso-callback', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
