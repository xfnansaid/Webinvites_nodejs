export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.webinvites.shop';
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/terms', '/create/', '/i/'],
        disallow: ['/dashboard', '/edit/', '/api/'],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/', '/terms', '/create/', '/i/'],
        disallow: ['/dashboard', '/edit/', '/api/'],
      },
    ],
    sitemap: `${cleanBaseUrl}/sitemap.xml`,
    host: cleanBaseUrl,
  };
}
