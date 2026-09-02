// ============================================================================
// TEMPLATE REGISTRY — server-component variant
// ============================================================================
// This file eagerly imports ALL template components (like the original code).
// It's designed for Next.js App Router SERVER COMPONENTS where:
//   - React.lazy doesn't help (server renders synchronously)
//   - Eager imports let webpack tree-shake: only the ONE rendered template
//     ends up in the client bundle for hydration
//
// CLIENT COMPONENTS should use the main index.js (React.lazy wrappers)
// instead of this file.
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

const templates = {
  'standard-crimson': StandardCrimson,
  'royal-nikah': RoyalNikah,
  'royal-postcard': RoyalPostcard,
  'premium-floral': PremiumFloral,
  'watercolor-bliss': WatercolorBliss,
  'kerala-kasavu': KeralaKasavu,
  'ivory-arch': IvoryArch,
  'modern-navy': ModernNavy,
  'black-gold-silhouette': BlackGoldSilhouette,
  'burgundy-embossed': BurgundyEmbossed,
  'golden-yellow-namaste': GoldenYellowNamaste,
  'jasmine-garland-south': JasmineGarlandSouth,
  'kerala-lotus-tradition': KeralaLotusTradition,
  'lavender-blush-proposal': LavenderBlushProposal,
  'maroon-arch-islamic': MaroonArchIslamic,
  'maroon-mandala-classic': MaroonMandalaClassic,
  'pearl-blush-elegant': PearlBlushElegant,
  'peony-romance': PeonyRomance,
  'pink-rose-sofa-romance': PinkRoseSofaRomance,
  'red-gold-bridal': RedGoldBridal,
  'romantic-blush': RomanticBlush,
  'rose-gold-temple': RoseGoldTemple,
  'sage-gold-harmony': SageGoldHarmony,
  'teal-gold-embrace': TealGoldEmbrace,
  'temple-gopuram-heritage': TempleGopuramHeritage,
};

export { templates };
export default templates;
