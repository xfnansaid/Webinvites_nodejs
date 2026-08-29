// ============================================================================
// WEB INVITES — TEMPLATE METADATA (no component imports)
// ============================================================================
// This file contains ONLY the template metadata array and helpers.
// It does NOT import any template components, so it's safe to use in both
// server and client components without pulling template code into the bundle.
//
// The `component` property has been removed from each entry. Use
// `templateImporters` from ./index.js to lazily load components.
// ============================================================================

const templatesList = [
  // ------------------------- ORIGINAL 8 (2024) -------------------------
  {
    slug: 'standard-crimson',
    title: 'Standard Crimson',
    bgImageUrl: 'https://one-tawny-two.vercel.app/0001/img/crimson-scroll-bg.webp',
    accentColor: '#0D0F0D',
    previewUrl: 'https://one-tawny-two.vercel.app/0001/standard.html',
  },
  {
    slug: 'royal-nikah',
    title: 'Royal Nikah',
    bgImageUrl: 'https://i.pinimg.com/474x/24/0f/5b/240f5bef281adfd33597e641f448654f.jpg',
    accentColor: '#0E0A00',
    previewUrl: 'https://one-tawny-two.vercel.app/0003/standard.html',
  },
  {
    slug: 'royal-postcard',
    title: 'Royal Postcard',
    // No external hero img in template (inline SVG couple illustration).
    // Use its historic local thumbnail (present in public/img).
    bgImageUrl: '/imgg4.png',
    accentColor: '#FDF5EE',
    previewUrl: 'https://one-tawny-two.vercel.app/0004/standard.html',
  },
  {
    slug: 'premium-floral',
    title: 'Premium Floral',
    bgImageUrl: 'https://one-tawny-two.vercel.app/0005/img/floral-arch-thumb.jpg',
    accentColor: '#1A150C',
    previewUrl: 'https://one-tawny-two.vercel.app/0005/standard.html',
  },
  {
    slug: 'watercolor-bliss',
    title: 'Watercolor Bliss',
    bgImageUrl: 'https://one-tawny-two.vercel.app/0007/Beige%20and%20Pink%20Watercolor%20Wedding%20Invitation.png',
    accentColor: '#0E1F18',
    previewUrl: 'https://one-tawny-two.vercel.app/0007/standard.html',
  },
  {
    slug: 'kerala-kasavu',
    title: 'Kerala Kasavu',
    // No external hero img in template (uses SVG nilavilakku + peacock + grid
    // patterns as ornaments).  Fallback to its known local thumbnail.
    bgImageUrl: '/imgg2.png',
    accentColor: '#1A1110',
    previewUrl: 'https://one-tawny-two.vercel.app/0005/standard.html',
  },
  {
    slug: 'ivory-arch',
    title: 'Ivory Arch',
    bgImageUrl: 'https://one-tawny-two.vercel.app/0008/img/ivory-arch-thumb.jpg',
    accentColor: '#24161B',
    previewUrl: 'https://one-tawny-two.vercel.app/0008/standard.html',
  },
  {
    slug: 'modern-navy',
    title: 'Modern Navy',
    bgImageUrl: 'https://one-tawny-two.vercel.app/0009/Blue%20Watercolor%20Illustration%20Wedding%20Invitation.png',
    accentColor: '#1C1524',
    previewUrl: 'https://one-tawny-two.vercel.app/0009/standard.html',
  },
  // ------------------------- NEW 18 (added 2026-08) -------------------------
  {
    slug: 'black-gold-silhouette',
    title: 'Black Gold Silhouette',
    bgImageUrl: 'https://i.pinimg.com/736x/a7/33/41/a7334147da51bbc26c3e278c65d54c08.jpg',
    accentColor: '#f59e0b',
  },
  {
    slug: 'burgundy-embossed',
    title: 'Burgundy Embossed',
    bgImageUrl: 'https://i.pinimg.com/736x/d7/5d/0b/d75d0bcd3f428725a323c43c3c37d7ca.jpg',
    accentColor: '#881337',
  },
  {
    slug: 'golden-yellow-namaste',
    title: 'Golden Yellow Namaste',
    bgImageUrl: 'https://i.pinimg.com/1200x/25/d0/c4/25d0c4cb78faf6d2f42fea9bac44fd24.jpg',
    accentColor: '#b45309',
  },
  {
    slug: 'jasmine-garland-south',
    title: 'Jasmine Garland South',
    bgImageUrl: 'https://i.pinimg.com/1200x/67/e1/59/67e1596c45e1a0b3229b8830a297a1a7.jpg',
    accentColor: '#db2777',
  },
  {
    slug: 'kerala-lotus-tradition',
    title: 'Kerala Lotus Tradition',
    bgImageUrl: 'https://i.pinimg.com/736x/01/7c/a4/017ca4d93a0f295f0e1d1bc3b4199be0.jpg',
    accentColor: '#92400e',
  },
  {
    slug: 'lavender-blush-proposal',
    title: 'Lavender Blush Proposal',
    bgImageUrl: 'https://i.pinimg.com/736x/7a/6e/06/7a6e06b270dc24eb85fb83113f9c6c6c.jpg',
    accentColor: '#8b5cf6',
  },
  {
    slug: 'maroon-arch-islamic',
    title: 'Maroon Arch Islamic',
    bgImageUrl: 'https://i.pinimg.com/736x/5f/69/24/5f6924a1348ea74e7d454723f4309edb.jpg',
    accentColor: '#881337',
  },
  {
    slug: 'maroon-mandala-classic',
    title: 'Maroon Mandala Classic',
    bgImageUrl: 'https://i.pinimg.com/736x/5a/c7/4e/5ac74e649a2696ae89c9d37dd124f913.jpg',
    accentColor: '#881337',
  },
  {
    slug: 'pearl-blush-elegant',
    title: 'Pearl Blush Elegant',
    bgImageUrl: 'https://i.pinimg.com/736x/65/3e/a3/653ea3522b0f8f4aa8be649eba8dd7d7.jpg',
    accentColor: '#292524',
  },
  {
    slug: 'peony-romance',
    title: 'Peony Romance',
    bgImageUrl: 'https://i.pinimg.com/736x/ae/07/6f/ae076f97dede906b6075a21619838ec0.jpg',
    accentColor: '#881337',
  },
  {
    slug: 'pink-rose-sofa-romance',
    title: 'Pink Rose Sofa Romance',
    bgImageUrl: 'https://i.pinimg.com/736x/d1/83/eb/d183ebc18088cbaf6163aa5787a865e1.jpg',
    accentColor: '#ec4899',
  },
  {
    slug: 'red-gold-bridal',
    title: 'Red Gold Bridal',
    bgImageUrl: 'https://i.pinimg.com/736x/fa/9c/ac/fa9cac1813abf59df06e52698420ecea.jpg',
    accentColor: '#b91c1c',
  },
  {
    slug: 'romantic-blush',
    title: 'Romantic Blush',
    bgImageUrl: 'https://i.pinimg.com/736x/fc/de/91/fcde911ed948280ff339ff1701382479.jpg',
    accentColor: '#f43f5e',
  },
  {
    slug: 'rose-gold-temple',
    title: 'Rose Gold Temple',
    bgImageUrl: 'https://i.pinimg.com/736x/02/6e/13/026e13fa9252f8650f9f2be2e027f0e8.jpg',
    accentColor: '#be123c',
  },
  {
    slug: 'sage-gold-harmony',
    title: 'Sage Gold Harmony',
    bgImageUrl: 'https://i.pinimg.com/736x/8a/fa/e2/8afae2680457d0877f464dab7b4f3240.jpg',
    accentColor: '#047857',
  },
  {
    slug: 'teal-gold-embrace',
    title: 'Teal Gold Embrace',
    bgImageUrl: 'https://i.pinimg.com/736x/d1/04/c0/d104c0c0e30ac0955cbfc0f1757a95fa.jpg',
    accentColor: '#0f766e',
  },
  {
    slug: 'temple-gopuram-heritage',
    title: 'Temple Gopuram Heritage',
    bgImageUrl: 'https://i.pinimg.com/736x/94/3f/eb/943feb4f2e40b3354546af2989ab64ed.jpg',
    accentColor: '#92400e',
  },
  // ------------------------- BIRTHDAY TEMPLATES (2026-08) -------------------------
  {
    slug: 'birthday-floral-blush',
    title: 'Birthday Floral Blush',
    bgImageUrl: '/imag1.png',
    accentColor: '#ec4899',
    category: 'birthday',
  },
  {
    slug: 'birthday-royal-gold',
    title: 'Birthday Royal Gold',
    bgImageUrl: '/imag2.png',
    accentColor: '#b45309',
    category: 'birthday',
  },
  {
    slug: 'birthday-kids-colorful',
    title: 'Birthday Kids Colorful',
    bgImageUrl: '/imag3.png',
    accentColor: '#a855f7',
    category: 'birthday',
  },
  {
    slug: 'birthday-modern-neon',
    title: 'Birthday Modern Neon',
    bgImageUrl: '/imag4.png',
    accentColor: '#7c3aed',
    category: 'birthday',
  },
  {
    slug: 'birthday-fun-tropical',
    title: 'Birthday Fun Tropical',
    bgImageUrl: '/imag5.png',
    accentColor: '#f97316',
    category: 'birthday',
  },
  // ------------------------- HOUSE WARMING TEMPLATES (2026-08) -------------------------
  {
    slug: 'housewarming-south-indian',
    title: 'House Warming South Indian',
    bgImageUrl: '/imag6.png',
    accentColor: '#c2410c',
    category: 'housewarming',
  },
  {
    slug: 'housewarming-traditional',
    title: 'House Warming Traditional',
    bgImageUrl: '/imag7.png',
    accentColor: '#d97706',
    category: 'housewarming',
  },
  {
    slug: 'housewarming-minimal-cream',
    title: 'House Warming Minimal',
    bgImageUrl: '/imag8.png',
    accentColor: '#78716c',
    category: 'housewarming',
  },
  {
    slug: 'housewarming-festive-red',
    title: 'House Warming Festive Red',
    bgImageUrl: '/imag9.png',
    accentColor: '#991b1b',
    category: 'housewarming',
  },
  {
    slug: 'housewarming-modern-green',
    title: 'House Warming Modern Green',
    bgImageUrl: '/imag10.png',
    accentColor: '#059669',
    category: 'housewarming',
  },
];

// ---------------------------------------------------------------------------
// Helper — get metadata for a slug, with safe fallback to standard-crimson
// if slug is unknown OR the entry doesn't have bgImageUrl set.
// ---------------------------------------------------------------------------
function getTemplateMeta(slug) {
  const found = templatesList.find(m => m.slug === slug) || templatesList[0];
  return {
    ...found,
    url: found.url || `/create/${found.slug}`,
  };
}

// ---------------------------------------------------------------------------
// Enrich templatesList with the derived `url` field (idempotent even if
// someone already provided it) so callers can just do `<Link href={t.url}>`.
// ---------------------------------------------------------------------------
templatesList.forEach(t => {
  t.url = t.url || `/create/${t.slug}`;
  // Default category is 'wedding' for any template without an explicit category
  if (!t.category) t.category = 'wedding';
});

export { templatesList, getTemplateMeta };
