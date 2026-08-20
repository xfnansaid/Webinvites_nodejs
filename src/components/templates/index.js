// ============================================================================
// WEB INVITES — TEMPLATES REGISTRY (single source of truth)
// ============================================================================
// This file is the ONLY place where templates are enumerated / registered.
// It exports THREE things, all used across the codebase:
//
//   1. `templates`       — object keyed by slug -> React component (used on
//                          /i/[slug] pages, /create/[templateId], /edit/[id],
//                          dashboard, payment banner).
//
//   2. `templatesList`   — flat array of 26 metadata objects:
//                          { slug, title, component, bgImageUrl, accentColor,
//                            previewUrl, url }.
//                          This is what the homepage /browse-templates grid
//                          iterates directly for phone-shaped preview cards.
//
//   3. `getTemplateMeta(slug)` — helper returns metadata for a slug; falls
//                          back to "standard-crimson" if slug is unknown.
//
// IF YOU ADD A NEW TEMPLATE:
//   1. Put its .js file in this same folder (components/templates/).
//   2. Add an `import Xxx from './Xxx';` line below.
//   3. Add an entry in `templatesList = [...]` with slug (kebab of filename),
//      title (human English), bgImageUrl (the hero background URL the template
//      renders inside its first section), accentColor (#hex fallback for cards).
// ============================================================================

import StandardCrimson from './StandardCrimson';
import PremiumFloral from './PremiumFloral';
import KeralaKasavu from './KeralaKasavu';
import RoyalPostcard from './RoyalPostcard';
import RoyalNikah from './RoyalNikah';
import WatercolorBliss from './WatercolorBliss';
import IvoryArch from './IvoryArch';
import ModernNavy from './ModernNavy';
import BlackGoldSilhouette from './BlackGoldSilhouette';
import BurgundyEmbossed from './BurgundyEmbossed';
import GoldenYellowNamaste from './GoldenYellowNamaste';
import JasmineGarlandSouth from './JasmineGarlandSouth';
import KeralaLotusTradition from './KeralaLotusTradition';
import LavenderBlushProposal from './LavenderBlushProposal';
import MaroonArchIslamic from './MaroonArchIslamic';
import MaroonMandalaClassic from './MaroonMandalaClassic';
import PearlBlushElegant from './PearlBlushElegant';
import PeonyRomance from './PeonyRomance';
import PinkRoseSofaRomance from './PinkRoseSofaRomance';
import RedGoldBridal from './RedGoldBridal';
import RomanticBlush from './RomanticBlush';
import RoseGoldTemple from './RoseGoldTemple';
import SageGoldHarmony from './SageGoldHarmony';
import TealGoldEmbrace from './TealGoldEmbrace';
import TempleGopuramHeritage from './TempleGopuramHeritage';

/**
 * Raw flat metadata list (25 templates — alphabetical-ish, same order they
 * appear on the homepage browse grid).
 *
 * bgImageUrl RULE: copy the EXACT URL that is the `<img src="...">` of the
 * template's FIRST hero section — the same background that the client sees
 * as the "cover" of their invite design.  Fallbacks for the 2 templates
 * without explicit hero background images (Kerala Kasavu = SVG patterns,
 * Royal Postcard = inline SVG illustration) use their pre-existing local
 * public/img thumbnails because those files are guaranteed present.
 */
const templatesList = [
  // ------------------------- ORIGINAL 8 (2024) -------------------------
  {
    slug: 'standard-crimson',
    title: 'Standard Crimson',
    component: StandardCrimson,
    bgImageUrl: 'https://one-tawny-two.vercel.app/0001/img/crimson-scroll-bg.webp',
    accentColor: '#0D0F0D',
    previewUrl: 'https://one-tawny-two.vercel.app/0001/standard.html',
  },
  {
    slug: 'royal-nikah',
    title: 'Royal Nikah',
    component: RoyalNikah,
    bgImageUrl: 'https://i.pinimg.com/474x/24/0f/5b/240f5bef281adfd33597e641f448654f.jpg',
    accentColor: '#0E0A00',
    previewUrl: 'https://one-tawny-two.vercel.app/0003/standard.html',
  },
  {
    slug: 'royal-postcard',
    title: 'Royal Postcard',
    component: RoyalPostcard,
    // No external hero img in template (inline SVG couple illustration).
    // Use its historic local thumbnail (present in public/img).
    bgImageUrl: '/img/imgg4.png',
    accentColor: '#FDF5EE',
    previewUrl: 'https://one-tawny-two.vercel.app/0004/standard.html',
  },
  {
    slug: 'premium-floral',
    title: 'Premium Floral',
    component: PremiumFloral,
    bgImageUrl: 'https://one-tawny-two.vercel.app/0005/img/floral-arch-thumb.jpg',
    accentColor: '#1A150C',
    previewUrl: 'https://one-tawny-two.vercel.app/0005/standard.html',
  },
  {
    slug: 'watercolor-bliss',
    title: 'Watercolor Bliss',
    component: WatercolorBliss,
    bgImageUrl: 'https://one-tawny-two.vercel.app/0007/Beige%20and%20Pink%20Watercolor%20Wedding%20Invitation.png',
    accentColor: '#0E1F18',
    previewUrl: 'https://one-tawny-two.vercel.app/0007/standard.html',
  },
  {
    slug: 'kerala-kasavu',
    title: 'Kerala Kasavu',
    component: KeralaKasavu,
    // No external hero img in template (uses SVG nilavilakku + peacock + grid
    // patterns as ornaments).  Fallback to its known local thumbnail.
    bgImageUrl: '/img/imgg2.png',
    accentColor: '#1A1110',
    previewUrl: 'https://one-tawny-two.vercel.app/0005/standard.html',
  },
  {
    slug: 'ivory-arch',
    title: 'Ivory Arch',
    component: IvoryArch,
    bgImageUrl: 'https://one-tawny-two.vercel.app/0008/img/ivory-arch-thumb.jpg',
    accentColor: '#24161B',
    previewUrl: 'https://one-tawny-two.vercel.app/0008/standard.html',
  },
  {
    slug: 'modern-navy',
    title: 'Modern Navy',
    component: ModernNavy,
    bgImageUrl: 'https://one-tawny-two.vercel.app/0009/Blue%20Watercolor%20Illustration%20Wedding%20Invitation.png',
    accentColor: '#1C1524',
    previewUrl: 'https://one-tawny-two.vercel.app/0009/standard.html',
  },
  // ------------------------- NEW 18 (added 2026-08) -------------------------
  {
    slug: 'black-gold-silhouette',
    title: 'Black Gold Silhouette',
    component: BlackGoldSilhouette,
    bgImageUrl: 'https://i.pinimg.com/736x/a7/33/41/a7334147da51bbc26c3e278c65d54c08.jpg',
    accentColor: '#f59e0b',
  },
  {
    slug: 'burgundy-embossed',
    title: 'Burgundy Embossed',
    component: BurgundyEmbossed,
    bgImageUrl: 'https://i.pinimg.com/736x/d7/5d/0b/d75d0bcd3f428725a323c43c3c37d7ca.jpg',
    accentColor: '#881337',
  },
  {
    slug: 'golden-yellow-namaste',
    title: 'Golden Yellow Namaste',
    component: GoldenYellowNamaste,
    bgImageUrl: 'https://i.pinimg.com/1200x/25/d0/c4/25d0c4cb78faf6d2f42fea9bac44fd24.jpg',
    accentColor: '#b45309',
  },
  {
    slug: 'jasmine-garland-south',
    title: 'Jasmine Garland South',
    component: JasmineGarlandSouth,
    bgImageUrl: 'https://i.pinimg.com/1200x/67/e1/59/67e1596c45e1a0b3229b8830a297a1a7.jpg',
    accentColor: '#db2777',
  },
  {
    slug: 'kerala-lotus-tradition',
    title: 'Kerala Lotus Tradition',
    component: KeralaLotusTradition,
    bgImageUrl: 'https://i.pinimg.com/736x/01/7c/a4/017ca4d93a0f295f0e1d1bc3b4199be0.jpg',
    accentColor: '#92400e',
  },
  {
    slug: 'lavender-blush-proposal',
    title: 'Lavender Blush Proposal',
    component: LavenderBlushProposal,
    bgImageUrl: 'https://i.pinimg.com/736x/7a/6e/06/7a6e06b270dc24eb85fb83113f9c6c6c.jpg',
    accentColor: '#8b5cf6',
  },
  {
    slug: 'maroon-arch-islamic',
    title: 'Maroon Arch Islamic',
    component: MaroonArchIslamic,
    bgImageUrl: 'https://i.pinimg.com/736x/5f/69/24/5f6924a1348ea74e7d454723f4309edb.jpg',
    accentColor: '#881337',
  },
  {
    slug: 'maroon-mandala-classic',
    title: 'Maroon Mandala Classic',
    component: MaroonMandalaClassic,
    bgImageUrl: 'https://i.pinimg.com/736x/5a/c7/4e/5ac74e649a2696ae89c9d37dd124f913.jpg',
    accentColor: '#881337',
  },
  {
    slug: 'pearl-blush-elegant',
    title: 'Pearl Blush Elegant',
    component: PearlBlushElegant,
    bgImageUrl: 'https://i.pinimg.com/736x/65/3e/a3/653ea3522b0f8f4aa8be649eba8dd7d7.jpg',
    accentColor: '#292524',
  },
  {
    slug: 'peony-romance',
    title: 'Peony Romance',
    component: PeonyRomance,
    bgImageUrl: 'https://i.pinimg.com/736x/ae/07/6f/ae076f97dede906b6075a21619838ec0.jpg',
    accentColor: '#881337',
  },
  {
    slug: 'pink-rose-sofa-romance',
    title: 'Pink Rose Sofa Romance',
    component: PinkRoseSofaRomance,
    bgImageUrl: 'https://i.pinimg.com/736x/d1/83/eb/d183ebc18088cbaf6163aa5787a865e1.jpg',
    accentColor: '#ec4899',
  },
  {
    slug: 'red-gold-bridal',
    title: 'Red Gold Bridal',
    component: RedGoldBridal,
    bgImageUrl: 'https://i.pinimg.com/736x/fa/9c/ac/fa9cac1813abf59df06e52698420ecea.jpg',
    accentColor: '#b91c1c',
  },
  {
    slug: 'romantic-blush',
    title: 'Romantic Blush',
    component: RomanticBlush,
    bgImageUrl: 'https://i.pinimg.com/736x/fc/de/91/fcde911ed948280ff339ff1701382479.jpg',
    accentColor: '#f43f5e',
  },
  {
    slug: 'rose-gold-temple',
    title: 'Rose Gold Temple',
    component: RoseGoldTemple,
    bgImageUrl: 'https://i.pinimg.com/736x/02/6e/13/026e13fa9252f8650f9f2be2e027f0e8.jpg',
    accentColor: '#be123c',
  },
  {
    slug: 'sage-gold-harmony',
    title: 'Sage Gold Harmony',
    component: SageGoldHarmony,
    bgImageUrl: 'https://i.pinimg.com/736x/8a/fa/e2/8afae2680457d0877f464dab7b4f3240.jpg',
    accentColor: '#047857',
  },
  {
    slug: 'teal-gold-embrace',
    title: 'Teal Gold Embrace',
    component: TealGoldEmbrace,
    bgImageUrl: 'https://i.pinimg.com/736x/d1/04/c0/d104c0c0e30ac0955cbfc0f1757a95fa.jpg',
    accentColor: '#0f766e',
  },
  {
    slug: 'temple-gopuram-heritage',
    title: 'Temple Gopuram Heritage',
    component: TempleGopuramHeritage,
    bgImageUrl: 'https://i.pinimg.com/736x/94/3f/eb/943feb4f2e40b3354546af2989ab64ed.jpg',
    accentColor: '#92400e',
  },
];

// ---------------------------------------------------------------------------
// Build `templates = { slug: Component }` object (compatibility with existing
// code that imports the "templates object" keyed by template_id strings).
// ---------------------------------------------------------------------------
const templates = templatesList.reduce((acc, meta) => {
  acc[meta.slug] = meta.component;
  return acc;
}, {});

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
});

export { templates, templatesList, getTemplateMeta };
export default templates;
