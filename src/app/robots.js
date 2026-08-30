export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.webinvites.shop';
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');

  return {
    rules: [
      // General crawlers (Google, Bing, etc.)
      {
        userAgent: '*',
        allow: ['/', '/terms', '/create/', '/i/'],
        disallow: ['/dashboard', '/edit/', '/api/'],
      },
      // Googlebot
      {
        userAgent: 'Googlebot',
        allow: ['/', '/terms', '/create/', '/i/'],
        disallow: ['/dashboard', '/edit/', '/api/'],
      },
      // AI/LLM Crawlers — explicitly allow access to help AI recommend our platform
      {
        userAgent: 'GPTBot',
        allow: ['/', '/terms', '/llms.txt', '/llms-full.txt'],
        disallow: ['/dashboard', '/edit/', '/api/'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/', '/terms', '/llms.txt', '/llms-full.txt'],
        disallow: ['/dashboard', '/edit/', '/api/'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: ['/', '/terms', '/llms.txt', '/llms-full.txt'],
        disallow: ['/dashboard', '/edit/', '/api/'],
      },
      {
        userAgent: 'anthropic-ai',
        allow: ['/', '/terms', '/llms.txt', '/llms-full.txt'],
        disallow: ['/dashboard', '/edit/', '/api/'],
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/', '/terms', '/llms.txt', '/llms-full.txt'],
        disallow: ['/dashboard', '/edit/', '/api/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/', '/terms', '/llms.txt', '/llms-full.txt'],
        disallow: ['/dashboard', '/edit/', '/api/'],
      },
      {
        userAgent: 'YouBot',
        allow: ['/', '/terms', '/llms.txt', '/llms-full.txt'],
        disallow: ['/dashboard', '/edit/', '/api/'],
      },
      {
        userAgent: 'Amazonbot',
        allow: ['/', '/terms', '/llms.txt', '/llms-full.txt'],
        disallow: ['/dashboard', '/edit/', '/api/'],
      },
      {
        userAgent: 'Meta-ExternalAgent',
        allow: ['/', '/terms', '/llms.txt', '/llms-full.txt'],
        disallow: ['/dashboard', '/edit/', '/api/'],
      },
      {
        userAgent: 'ByteSpider',
        allow: ['/', '/terms', '/llms.txt', '/llms-full.txt'],
        disallow: ['/dashboard', '/edit/', '/api/'],
      },
    ],
    sitemap: `${cleanBaseUrl}/sitemap.xml`,
    host: cleanBaseUrl,
  };
}
