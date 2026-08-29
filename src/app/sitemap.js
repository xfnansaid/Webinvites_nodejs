import { templatesList } from '@/components/templates/metadata';

export default function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.webinvites.shop';
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const now = new Date();

  // Core static pages
  const staticPages = [
    {
      url: `${cleanBaseUrl}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${cleanBaseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${cleanBaseUrl}/signin`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${cleanBaseUrl}/ai-info`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // 25+ Template editor / creation landing pages
  const list = Array.isArray(templatesList) ? templatesList : [];
  const templatePages = list.map((tpl) => ({
    url: `${cleanBaseUrl}/create/${encodeURIComponent(tpl.slug)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  return [...staticPages, ...templatePages];
}
