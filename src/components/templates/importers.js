// ============================================================================
// TEMPLATE IMPORTERS — lightweight dynamic import map
// ============================================================================
// This file exports ONLY the raw import functions for each template component.
// It has NO React.lazy, NO next/dynamic, NO React imports — keeping it safe
// and lightweight for use in both server and client components.
//
// Usage in server components:
//   const loader = templateImporters[slug] || templateImporters['standard-crimson'];
//   const { default: TemplateComponent } = await loader();
//
// Usage in client components with next/dynamic:
//   import dynamic from 'next/dynamic';
//   const DynamicTemplate = dynamic(templateImporters[slug]);
// ============================================================================

const templateImporters = {
  'standard-crimson': () => import('./StandardCrimson'),
  'royal-nikah': () => import('./RoyalNikah'),
  'royal-postcard': () => import('./RoyalPostcard'),
  'premium-floral': () => import('./PremiumFloral'),
  'watercolor-bliss': () => import('./WatercolorBliss'),
  'kerala-kasavu': () => import('./KeralaKasavu'),
  'ivory-arch': () => import('./IvoryArch'),
  'modern-navy': () => import('./ModernNavy'),
  'black-gold-silhouette': () => import('./BlackGoldSilhouette'),
  'burgundy-embossed': () => import('./BurgundyEmbossed'),
  'golden-yellow-namaste': () => import('./GoldenYellowNamaste'),
  'jasmine-garland-south': () => import('./JasmineGarlandSouth'),
  'kerala-lotus-tradition': () => import('./KeralaLotusTradition'),
  'lavender-blush-proposal': () => import('./LavenderBlushProposal'),
  'maroon-arch-islamic': () => import('./MaroonArchIslamic'),
  'maroon-mandala-classic': () => import('./MaroonMandalaClassic'),
  'pearl-blush-elegant': () => import('./PearlBlushElegant'),
  'peony-romance': () => import('./PeonyRomance'),
  'pink-rose-sofa-romance': () => import('./PinkRoseSofaRomance'),
  'red-gold-bridal': () => import('./RedGoldBridal'),
  'romantic-blush': () => import('./RomanticBlush'),
  'rose-gold-temple': () => import('./RoseGoldTemple'),
  'sage-gold-harmony': () => import('./SageGoldHarmony'),
  'teal-gold-embrace': () => import('./TealGoldEmbrace'),
  'temple-gopuram-heritage': () => import('./TempleGopuramHeritage'),
};

export default templateImporters;
