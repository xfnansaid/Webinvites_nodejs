'use client';

import { Suspense, useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowUp, Sparkles, Heart, CheckCircle2, Palette, Star, Gift, MessageCircle, ShieldCheck, Clock, Eye, X } from 'lucide-react';
import SiteNavbar from '@/components/SiteNavbar';
import FadeIn from '@/components/FadeIn';
import RingLoader from '@/components/ui/RingLoader';
import { SUPPORT_WHATSAPP } from '@/lib/support-config';
// Template metadata only — NO component imports (code-split for small bundle).
// The actual template components are loaded lazily when the preview modal opens.
import { templatesList } from '@/components/templates/metadata';
import { templates } from '@/components/templates';

/**
 * Shuffle an array using the Fisher-Yates algorithm — unbiased,
 * returns a NEW array (does NOT mutate input).
 */
function shuffleArray(input) {
  const out = Array.isArray(input) ? input.slice() : [];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

const faqs = [
  {
    q: "What is a digital wedding invitation website?",
    a: "A digital wedding invitation is an interactive, mobile-optimized webpage designed for your wedding celebration. Unlike static PDF cards or paper prints, a web invite features 1-tap Google Maps directions to your venue, an auto-updating live countdown timer, WhatsApp RSVP collection, and couple photo galleries."
  },
  {
    q: "How does the live inline editor work?",
    a: "Once you pick a template, tap any text element directly on screen to customize names, dates, and venue info. Your changes render live in real time with zero watermarks while you design."
  },
  {
    q: "Can I publish an invitation for free?",
    a: "Yes! Every account gets 1 free invitation — publish with a short rewarded ad to generate your live shareable link with Google Maps navigation and countdown timer. The free invitation includes small non-intrusive ads. Once published, you can publish another template by either paying ₹399 or deleting your current free invitation from the Dashboard to unlock another free slot."
  },
  {
    q: "What's the difference between Free and Premium?",
    a: "Free: 1 invitation per account with small ads — great for trying us out. Premium (₹399): ad-free, no watermarks, and the same features. You can upgrade any free invitation to premium at any time from your Dashboard."
  },
  {
    q: "How do I remove ads from my free invitation?",
    a: "Open your Dashboard, find the free invitation, and click 'Remove Ads' — or pay ₹399 at any time during creation. The upgrade is instant, and your live link stays exactly the same."
  },
  {
    q: "How long does my digital invitation stay live?",
    a: "Free invitations are hosted for 21 days after publishing. Premium invitations (₹399) stay live until 3 days after your event date — giving you extended coverage through the celebration and beyond."
  },
  {
    q: "What happens when my free invitation expires?",
    a: "After 21 days, your free invitation link is automatically taken down and guests can no longer view it. You can upgrade to Premium (₹399) before the 21-day window to keep your invitation live until 3 days after your event."
  },
  {
    q: "Can I edit my invitation details after publishing?",
    a: "Yes, you can edit your live invitation up to 3 times directly from your dashboard after publishing. All updates reflect instantly on your live URL without altering the link you shared with guests."
  },
  {
    q: "Can I add couple photos, program schedules, or RSVP?",
    a: "Yes! Every template supports an optional Couple Photo section, a multi-event Program of Celebrations (Haldi, Mehendi, Muhurtham, Reception timings), and a WhatsApp RSVP button. You can toggle any of these sections on or off with 1 click."
  },
  {
    q: "How do guests navigate to our wedding venue?",
    a: "Each invitation features an integrated 'Get Directions' button powered by Google Maps. When guests tap it on their phone, it immediately opens GPS turn-by-turn navigation directly to your auditorium or hall."
  }
];

const weddingSampleData = {
  groomName: "Arjun",
  brideName: "Meera",
  weddingDate: "2026-12-12",
  weddingTime: "6:30 PM",
  venue: "Grand Heritage Palace",
  venueAddress: "123 Celebration Avenue, Marine Drive, Kochi, Kerala 682011, India",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Marine+Drive+Kochi",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=Marine+Drive+Kochi",
  directionsUrl: "https://www.google.com/maps/search/?api=1&query=Marine+Drive+Kochi",
  whatsappNumber: "919876543210",
  groomParents: "Sri. Ravi Varma & Smt. Lakshmi Devi",
  brideParents: "Sri. Mohan Kumar & Smt. Radha Mohan",
  heroTagline: "With the blessings of our families, we invite you to share in our joy",
  heroEventText: "as we unite in the sacred bond of marriage",
  countdownTitle: "Counting Every Moment",
  eventDay: "Saturday",
};

const birthdaySampleData = {
  celebrantName: "Aarav",
  age: "5",
  birthdayDate: "2026-12-20",
  birthdayTime: "4:00 PM",
  venue: "Sunshine Party Hall",
  venueAddress: "45 Park Lane, Bangalore, Karnataka 560001",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Sunshine+Party+Hall+Bangalore",
  whatsappNumber: "919876543210",
  hostsName: "Raj & Priya Sharma",
  heroTagline: "Join us for a magical celebration",
  heroIntro: "You're invited to celebrate",
  countdownTitle: "Counting Down to the Party",
  partyTheme: "Enchanted Garden",
  eventDay: "Sunday",
};

const housewarmingSampleData = {
  familyName: "The Sharma Family",
  eventDate: "2026-12-20",
  eventTime: "11:00 AM",
  venue: "Sharma Heritage Home",
  venueAddress: "88 Jasmine Lane, Bangalore, Karnataka 560001",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Bangalore+Karnataka",
  whatsappNumber: "919876543210",
  hostsName: "Anil & Sreedevi Sharma",
  heroTagline: "Come celebrate our new beginnings and warm memories",
  heroIntro: "With great joy, we invite you to",
  countdownTitle: "Days Until the Celebration",
  findOurHome: "Behind the Main Park, second right. You'll see a white house with brass lamps.",
  eventDay: "Sunday",
};

const CATEGORIES = [
  { id: 'all', label: 'All Designs' },
  { id: 'wedding', label: 'Wedding' },
  { id: 'birthday', label: 'Birthday' },
  { id: 'housewarming', label: 'House Warming' },
];

// Build a slug→category lookup from template metadata (single source of truth)
const _slugCategoryMap = {};
for (const t of templatesList) {
  _slugCategoryMap[t.slug] = t.category || 'wedding';
}

function getTemplateCategory(slug) {
  return _slugCategoryMap[slug] || 'wedding';
}

function getPreviewSampleData(slug) {
  const cat = getTemplateCategory(slug);
  if (cat === 'birthday') return birthdaySampleData;
  if (cat === 'housewarming') return housewarmingSampleData;
  return weddingSampleData;
}

export default function HomePage() {
  const router = useRouter();
  const stableList = templatesList;
  const stableStagger = stableList.map((_, idx) => (idx % 4) * 40 + (idx % 10) * 2);

  const [shuffledTemplates, setShuffledTemplates] = useState(stableList);
  const [perCardStagger, setPerCardStagger] = useState(stableStagger);
  const [hasShuffled, setHasShuffled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = useMemo(() => {
    return shuffledTemplates.filter(t => {
      const matchesCat = activeCategory === 'all' || getTemplateCategory(t.slug) === activeCategory;
      const matchesSearch = !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [shuffledTemplates, activeCategory, searchQuery]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ----- Template Preview Modal -----
  const [previewTemplate, setPreviewTemplate] = useState(null); // slug | null
  const PreviewComponent = previewTemplate ? (templates[previewTemplate] || templates['standard-crimson']) : null;

  const openPreview = (slug) => {
    setPreviewTemplate(slug);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  };
  const closePreview = () => {
    setPreviewTemplate(null);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  };
  const startDesigning = () => {
    if (!previewTemplate) return;
    closePreview();
    router.push(`/create/${previewTemplate}`);
  };

  // Run shuffle ONLY AFTER hydration, on client only.
  useEffect(() => {
    const list = shuffleArray(templatesList);
    const delays = list.map(() => Math.random() * 280);
    setShuffledTemplates(list);
    setPerCardStagger(delays);
    requestAnimationFrame(() => setHasShuffled(true));
  }, []);

  // Close preview modal on ESC key
  useEffect(() => {
    if (!previewTemplate) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closePreview();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previewTemplate]);

  // Compute final stagger — for shuffled cards merge deterministic + random
  const finalStagger = useMemo(
    () => filteredTemplates.map((_, i) => ((i % 4) * 25) / 1000 + (perCardStagger[i] || 0) / 1000),
    [filteredTemplates, perCardStagger]
  );

  const jsonLdData = useMemo(() => [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': 'https://www.webinvites.shop/#website',
      name: 'WEB INVITES',
      alternateName: ['Web Invites', 'WebInvites.shop', 'Digital Wedding Invites'],
      url: 'https://www.webinvites.shop',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://www.webinvites.shop/?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': 'https://www.webinvites.shop/#webpage',
      url: 'https://www.webinvites.shop',
      name: 'Digital Wedding Invitations Online for free | WEB INVITES',
      description: 'Create 1 free digital wedding invitation with ads, or go ad-free for ₹399. 25+ templates with Google Maps, RSVP & countdown. Share instantly on WhatsApp.',
      isPartOf: { '@id': 'https://www.webinvites.shop/#website' },
      about: { '@id': 'https://www.webinvites.shop/#product' },
      breadcrumb: { '@id': 'https://www.webinvites.shop/#breadcrumb' },
      datePublished: '2024-01-15T00:00:00+05:30',
      dateModified: '2026-08-27',
      inLanguage: 'en-IN',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      '@id': 'https://www.webinvites.shop/#breadcrumb',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://www.webinvites.shop',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Digital Wedding Invitations',
          item: 'https://www.webinvites.shop/#templates',
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': 'https://www.webinvites.shop/#organization',
      name: 'WEB INVITES',
      url: 'https://www.webinvites.shop',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.webinvites.shop/logo.png',
        width: 512,
        height: 512,
      },
      sameAs: [
        'https://www.instagram.com/webinvites.shop',
        'https://twitter.com/webinvites_shop',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: SUPPORT_WHATSAPP ? `+91-${SUPPORT_WHATSAPP}` : undefined,
        contactType: 'customer support',
        areaServed: ['IN', 'AE', 'US', 'GB', 'CA', 'SG', 'MY', 'SA'],
        availableLanguage: ['English', 'Hindi', 'Malayalam'],
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': 'https://www.webinvites.shop/#product',
      name: 'Digital Wedding Invitation Websites',
      image: 'https://www.webinvites.shop/hero_layer.png',
      description: 'Create 1 free digital wedding invitation with ads, or go ad-free for ₹399. 25+ templates with Google Maps, live countdown, RSVP, and photo uploads.',
      brand: {
        '@type': 'Brand',
        name: 'WEB INVITES',
      },
      category: 'Wedding Invitations & Stationery',
      offers: {
        '@type': 'Offer',
        price: '399',
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
        url: 'https://www.webinvites.shop',
        priceValidUntil: '2030-12-31',
        seller: {
          '@id': 'https://www.webinvites.shop/#organization',
        },
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '1280',
        bestRating: '5',
        worstRating: '1',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'How to Create a Digital Wedding Invitation Online',
      description: 'Design and publish a mobile-friendly digital wedding website in 3 steps for free.',
      totalTime: 'PT5M',
      estimatedCost: {
        '@type': 'MonetaryAmount',
        currency: 'INR',
        value: '399',
      },
      step: [
        {
          '@type': 'HowToStep',
          position: 1,
          name: 'Choose a Handcrafted Template',
          text: 'Browse our collection of 25+ templates for Nikah, Hindu Vivah, Christian Weddings, and Royal celebrations.',
          url: 'https://www.webinvites.shop/#templates',
        },
        {
          '@type': 'HowToStep',
          position: 2,
          name: 'Customize Your Details Inline',
          text: 'Click directly on the design to update couple names, wedding date, venue address, and upload your couple photo.',
        },
        {
          '@type': 'HowToStep',
          position: 3,
          name: 'Publish & Share on WhatsApp',
          text: 'Publish free with a short ad, or complete the ₹399 checkout via UPI/Cards to go ad-free with your live invitation link.',
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.a,
        },
      })),
    },
  ], []);

  return (
    <>
      {/* Search Engine Rich Snippet Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      />

      <SiteNavbar />
      <main className="min-h-screen bg-[#FAF8F5] text-[var(--ink)] selection:bg-[var(--emerald-primary)]/30">

        {/* ================== HERO SECTION ================== */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#061812] via-[#0A261C] to-[#0D3224] text-white pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-[#1B4332]/60">
          {/* Ambient Background Lights & Radial Glows */}
          <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] rounded-full bg-amber-500/15 animate-gold-glow" />
            <div className="absolute top-1/3 -right-20 w-[600px] h-[600px] rounded-full bg-emerald-500/20 blur-[100px]" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[200px] bg-gradient-to-t from-[#061812] to-transparent" />
            {/* Subtle Grid overlay */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: `radial-gradient(rgba(255,255,255,0.7) 1px, transparent 0)`,
                backgroundSize: '28px 28px'
              }}
            />
          </div>

          <div className="relative max-w-[1400px] mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

              {/* LEFT COLUMN: Value Proposition & Interactive CTAs */}
              <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 lg:space-y-7">


                {/* Top Pill / Context Badge */}
                <div
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 border-t-white/30 backdrop-blur-md shadow-sm animate-fade-in-up"
                  style={{ animationDelay: '0.05s' }}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span className="text-[11px] sm:text-xs font-semibold tracking-wider text-amber-200 uppercase">
                    Digital Wedding Invitations
                  </span>
                </div>

                {/* Main Headline (Optical Typography: tight negative tracking on display text) */}
                <h1
                  className="font-display text-[clamp(2.4rem,5.2vw,4.4rem)] font-bold tracking-tight text-white leading-[1.04] animate-fade-in-up"
                  style={{ animationDelay: '0.1s' }}
                >
                  Create Elegant Digital Wedding Invitations{' '}
                  <span className="block text-gradient-gold drop-shadow-sm mt-1">
                    That Impress Every Guest.
                  </span>
                </h1>

                {/* Subheadline */}
                <p
                  className="text-stone-300 text-base sm:text-lg max-w-xl leading-relaxed font-light animate-fade-in-up"
                  style={{ animationDelay: '0.2s' }}
                >
                  Create 1 free digital wedding invitation (with ads) — or go ad-free for a flat ₹399. Choose from 25+ templates, edit live on screen, and share your custom link instantly.
                </p>



                {/* Feature Chips / Trust Bar (Translucent Apple Glass) */}
                <div
                  className="pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl text-left animate-fade-in-up"
                  style={{ animationDelay: '0.4s' }}
                >
                  {[
                    { icon: <Palette className="w-4 h-4 text-amber-300" />, title: "Live Editor", sub: "Tap text to edit" },
                    { icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />, title: "No Watermark", sub: "Clean & ready" },
                    { icon: <Clock className="w-4 h-4 text-amber-300" />, title: "Live Countdown", sub: "Auto-updating" },
                    { icon: <Gift className="w-4 h-4 text-emerald-400" />, title: "1 Free Invite", sub: "Watch ad to publish" },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 border-t-white/20 hover:border-amber-400/40 hover:bg-white/10 transition-all duration-300 group shadow-sm"
                    >
                      <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-stone-200 group-hover:text-white transition-colors">
                        {item.icon}
                        <span>{item.title}</span>
                      </div>
                      <div className="text-[11px] text-stone-400 mt-1 pl-6">{item.sub}</div>
                    </div>
                  ))}
                </div>

              </div>

              {/* RIGHT COLUMN: 3D Interactive Phone Mockup Stage */}
              <div className="lg:col-span-5 flex justify-center relative">




                {/* Main Phone Mockup */}
                <div
                  className="relative group cursor-pointer w-[280px] sm:w-[320px] aspect-[9/18] rounded-[2.8rem] bg-stone-950 p-3 shadow-[0_30px_80px_rgba(0,0,0,0.6)] ring-1 ring-white/20 border-4 border-stone-800 hover:rotate-1 hover:scale-[1.02] transition-all duration-500 animate-fade-in-scale"
                  style={{ animationDelay: '0.2s' }}
                  onClick={() => openPreview(shuffledTemplates[0]?.slug || 'standard-crimson')}
                >
                  {/* Phone Notch */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-stone-900 rounded-full z-40 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-stone-950 border border-stone-800" />
                  </div>

                  {/* Inner Screen */}
                  <div className="relative w-full h-full rounded-[2.2rem] overflow-hidden bg-[#FAF6EE] flex flex-col">

                    {/* Background template preview image */}
                    {shuffledTemplates[0]?.bgImageUrl && (
                      <Image
                        src={shuffledTemplates[0].bgImageUrl}
                        alt="Hero Preview Template"
                        fill
                        unoptimized={shuffledTemplates[0].bgImageUrl.startsWith('http')}
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                        priority
                      />
                    )}

                    {/* Dark gradient overlay for text legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-stone-950/20 pointer-events-none" />

                    {/* Badge on phone top */}
                    <div className="absolute top-6 left-4 z-20">
                      <span className="inline-block px-3 py-1 rounded-full bg-amber-400 text-stone-950 font-black text-[10px] uppercase tracking-wider shadow-md">
                        {shuffledTemplates[0]?.title || 'Featured Design'}
                      </span>
                    </div>

                    {/* Free + Premium Badge */}
                    <div className="absolute top-6 right-4 z-20">
                      <span className="inline-block px-3 py-1 rounded-full bg-stone-900/90 backdrop-blur text-emerald-300 font-extrabold text-[11px] border border-emerald-400/40 shadow-md">
                        Free ✨
                      </span>
                    </div>

                    {/* Bottom overlay content mimicking invitation */}
                    <div className="relative mt-auto p-5 text-white z-20 space-y-2">
                      <div className="text-amber-300 text-xs font-semibold uppercase tracking-widest">Wedding Celebration</div>
                      <div className="font-display text-2xl font-bold text-gradient-gold">Arjun &amp; Meera</div>
                      <div className="text-stone-300 text-xs font-light">December 12, 2026 • Grand Heritage Palace</div>

                      {/* Interactive Tap Prompt */}
                      <div className="pt-2">
                        <div className="w-full py-2.5 rounded-xl bg-white/20 hover:bg-amber-400 hover:text-stone-950 backdrop-blur border border-white/30 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Tap to Live Preview</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>



        {/* ================== TEMPLATES GRID ================== */}
        <section id="templates" className="py-20 md:py-28 border-b border-[var(--border-subtle)]">
          <div className="max-w-[1400px] mx-auto px-4 md:px-8">
            <FadeIn className="text-center mb-10 md:mb-14">
              <div className="inline-flex items-center gap-2 text-[var(--emerald-primary)] font-bold uppercase tracking-[0.15em] text-xs mb-3">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" /> Our Collection
              </div>
              <h2 className="font-display text-[clamp(2rem,4vw,3rem)] text-[var(--ink)] mb-3">
                {templatesList.length} Premium Designs — Start Free, Go Ad-Free for ₹399
              </h2>
              <p className="text-[var(--ink-muted)] text-lg max-w-2xl mx-auto">
                Explore hand-crafted wedding invitations. Create 1 free invitation (with ads) or pay ₹399 to go ad-free.
              </p>
            </FadeIn>

            {/* Category Filter Pills & Search Input */}
            <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto max-w-full pb-2 md:pb-0 no-scrollbar">
                {CATEGORIES.map(cat => {
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`whitespace-nowrap px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${isActive
                        ? 'bg-[var(--emerald-primary)] text-white shadow-md shadow-[var(--emerald-primary)]/20 scale-[1.02]'
                        : 'bg-white border border-stone-200 text-[var(--ink-soft)] hover:border-stone-300 hover:text-[var(--ink)]'
                        }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-64 shrink-0">
                <input
                  type="text"
                  placeholder="Search by title or style…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 pl-9 rounded-full bg-white border border-stone-200 text-xs sm:text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--emerald-primary)]/20 focus:border-[var(--emerald-primary)] transition-all"
                />
                <Sparkles className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div
              key={`${hasShuffled ? 'shuffled' : 'stable'}-${activeCategory}-${searchQuery}`}
              className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 px-1 sm:px-0"
            >
              {filteredTemplates.map((t, i) => (
                <FadeIn
                  key={t.slug}
                  className="group relative cursor-pointer"
                  delay={finalStagger[i] || 0}
                  onClick={() => openPreview(t.slug)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPreview(t.slug); } }}
                >
                  {/* Phone-shaped tall invitation preview card */}
                  <div
                    className="relative aspect-[9/16] sm:aspect-[9/16] md:aspect-[9/16] w-full rounded-[1.75rem] sm:rounded-[2rem] md:rounded-[2.25rem] overflow-hidden border-2 border-[var(--border-subtle)] group-hover:border-[var(--emerald-primary)]/60 shadow-[0_10px_30px_rgba(0,0,0,0.06)] group-hover:shadow-[0_22px_60px_rgba(15,56,44,0.16)] group-hover:-translate-y-1.5 transition-all duration-500 bg-[#f6f2ea]"
                    style={{ backgroundColor: t.accentColor }}
                  >
                    <Image
                      src={t.bgImageUrl}
                      alt={t.title}
                      fill
                      loading="lazy"
                      unoptimized={t.bgImageUrl.startsWith('http')}
                      className="object-cover object-center group-hover:scale-[1.05] transition-transform duration-700"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                    />
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 animate-pulse bg-gradient-to-br from-white/10 via-transparent to-[var(--champagne-500)]/10 mix-blend-overlay"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/20 pointer-events-none" />

                    {/* ₹ PRICE PILL (top-right, always visible) */}
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20">
                      <span className="inline-flex items-center justify-center rounded-full bg-[#1B4332]/90 backdrop-blur text-white text-[11px] sm:text-xs md:text-sm font-black px-3 py-1.5 sm:px-3.5 sm:py-1.5 shadow-[0_6px_16px_rgba(0,0,0,0.25)] tracking-tight">
                        Free ✨
                      </span>
                    </div>

                    {/* Template title tag (top-left) */}
                    <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 max-w-[65%]">
                      <span className="inline-flex items-center rounded-full bg-white/85 backdrop-blur text-[var(--ink)] text-[10px] sm:text-[11px] font-bold px-2.5 py-1 sm:px-3 sm:py-1.5 shadow-sm border border-white/60 truncate">
                        {t.title}
                      </span>
                    </div>

                    {/* BOTTOM: PREVIEW TEMPLATE BUTTON */}
                    <div className="absolute inset-x-3 bottom-3 sm:inset-x-4 sm:bottom-4 z-20">
                      <div className="flex items-center justify-center gap-1.5 w-full h-10 sm:h-12 md:h-14 rounded-[1.1rem] sm:rounded-[1.25rem] md:rounded-2xl bg-black/55 backdrop-blur-xl text-white text-[13px] sm:text-sm md:text-base font-bold shadow-[0_10px_25px_rgba(0,0,0,0.35)] group-hover:bg-[var(--emerald-primary)] group-hover:shadow-[0_12px_30px_rgba(15,56,44,0.35)] transition-all border border-white/15 group-hover:border-[var(--emerald-primary)]/20">
                        <Eye className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                        Preview Template
                      </div>
                    </div>
                  </div>
                </FadeIn>
              ))}
              {filteredTemplates.length === 0 && (
                <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-stone-200 p-8">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold mb-3">
                    🔍
                  </div>
                  <h3 className="font-display text-xl font-bold text-[var(--ink)] mb-1">No templates found</h3>
                  <p className="text-sm text-[var(--ink-muted)] mb-4">Try clearing your search or picking another category.</p>
                  <button
                    onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
                    className="px-5 py-2.5 rounded-full bg-[var(--emerald-primary)] text-white text-xs font-bold shadow-md hover:bg-[var(--emerald-dark)] transition-all"
                  >
                    Show All {templatesList.length} Designs
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ================== HOW IT WORKS ================== */}
        <section id="how" className="py-20 md:py-28 border-b border-[var(--border-subtle)] bg-gradient-to-b from-white to-[#FAF8F5]">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8">
            <FadeIn className="text-center mb-16">
              <div className="inline-flex items-center gap-2 text-[var(--emerald-primary)] font-bold uppercase tracking-[0.15em] text-xs mb-3">
                <Sparkles className="w-4 h-4 text-amber-500" /> 3 Simple Steps
              </div>
              <h2 className="font-display text-[clamp(2rem,4vw,3rem)] text-[var(--ink)] mb-3">From Pick to Publish in Minutes</h2>
              <p className="text-[var(--ink-muted)] text-lg max-w-2xl mx-auto">No forms. No code. Just tap, edit, share.</p>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {[
                {
                  step: "01",
                  icon: <Palette className="w-9 h-9" />,
                  title: "Pick a Design",
                  desc: "Browse 25+ hand-crafted templates. Every design is free to preview and customize."
                },
                {
                  step: "02",
                  icon: <Heart className="w-9 h-9" />,
                  title: "Tap to Edit Live",
                  desc: "Click any text on the template to customize it inline. Watch your invitation update instantly. No watermarks while you design."
                },
                {
                  step: "03",
                  icon: <Gift className="w-9 h-9" />,
                  title: "Publish Free or Go Ad-Free",
                  desc: "Publish 1 invitation free (with ads) — or pay a flat ₹399 via Razorpay to remove all ads and get a premium, watermark-free link."
                }
              ].map((s, i) => (
                <FadeIn
                  key={s.step}
                  className="relative bg-white rounded-3xl border border-[var(--border-subtle)] p-8 md:p-10 shadow-sm hover:shadow-2xl hover:-translate-y-2 hover:border-[var(--emerald-primary)]/40 transition-all duration-300 group"
                  delay={i * 0.15}
                >
                  <div className="font-display text-5xl text-[var(--emerald-primary)]/15 group-hover:text-[var(--emerald-primary)]/25 absolute top-6 right-6 font-bold transition-colors">{s.step}</div>
                  <div className="w-14 h-14 rounded-2xl bg-[var(--emerald-light)] text-[var(--emerald-primary)] group-hover:bg-[var(--emerald-primary)] group-hover:text-white flex items-center justify-center mb-6 shadow-inner transition-colors duration-300">{s.icon}</div>
                  <h3 className="font-display text-2xl text-[var(--ink)] mb-3">{s.title}</h3>
                  <p className="text-[var(--ink-muted)] leading-relaxed">{s.desc}</p>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ================== WHY WEB INVITES COMPARISON ================== */}
        <section className="py-20 md:py-24 border-b border-[var(--border-subtle)] bg-[#0F382C] text-white relative overflow-hidden">
          <div aria-hidden className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px]" />
          </div>
          <div className="max-w-[1280px] mx-auto px-4 md:px-8 relative z-10">
            <FadeIn className="text-center mb-14">
              <div className="inline-flex items-center gap-2 text-amber-300 font-bold uppercase tracking-[0.15em] text-xs mb-3">
                <Sparkles className="w-4 h-4" /> Why Choose Web Invites
              </div>
              <h2 className="font-display text-[clamp(2rem,4vw,3.2rem)] text-white mb-3 leading-tight">
                Modern Digital Invites vs Heavy Static PDFs
              </h2>
              <p className="text-stone-300 text-base sm:text-lg max-w-2xl mx-auto font-light">
                See why thousands of couples choose interactive web links over traditional static files.
              </p>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {[
                {
                  title: "1-Tap Google Venue Map",
                  web: "Guests tap once to get turn-by-turn Google Maps navigation to auditorium",
                  pdf: "Static address text requiring manual typing into maps app",
                  icon: "📍"
                },
                {
                  title: "Live Countdown Timer",
                  web: "Real-time auto-updating countdown timer on every guest's phone",
                  pdf: "Static date text with no real-time countdown or reminder feel",
                  icon: "⏳"
                },
                {
                  title: "Live Editor",
                  web: "Tap any text directly on design to edit names, dates & venue in seconds",
                  pdf: "Requires graphic designer fees & multiple back-and-forth edits",
                  icon: "✨"
                },
                {
                  title: "Instant WhatsApp Sharing",
                  web: "Clean lightweight URL preview with thumbnail; opens instantly on mobile",
                  pdf: "Heavy 15MB file attachments that take time to download",
                  icon: "📱"
                }
              ].map((item, idx) => (
                <FadeIn
                  key={idx}
                  className="bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-6 flex flex-col justify-between hover:border-amber-400/40 transition-all group"
                  delay={idx * 0.1}
                >
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <h3 className="font-display text-xl font-bold text-white mb-3">
                      {item.title}
                    </h3>
                    <div className="space-y-3 text-xs sm:text-sm">
                      <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-200">
                        <div className="font-bold text-[11px] uppercase tracking-wider text-emerald-400 mb-0.5">With Web Invites</div>
                        <div>{item.web}</div>
                      </div>
                      <div className="p-3 rounded-2xl bg-black/30 border border-white/10 text-stone-400">
                        <div className="font-bold text-[11px] uppercase tracking-wider text-stone-500 mb-0.5">Static PDF / Print</div>
                        <div>{item.pdf}</div>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ================== FAQ ================== */}
        <section id="faq" className="py-20 md:py-28 border-b border-[var(--border-subtle)]">
          <div className="max-w-4xl mx-auto px-4 md:px-8">
            <FadeIn className="text-center mb-14">
              <h2 className="font-display text-[clamp(2rem,4vw,3rem)] text-[var(--ink)] mb-3">Frequently Asked Questions</h2>
              <p className="text-[var(--ink-muted)] text-lg">Everything you need to know before you start designing.</p>
            </FadeIn>

            <div className="space-y-4">
              {faqs.map((f, i) => (
                <FadeIn
                  key={i}
                  as="details"
                  className="group bg-white rounded-2xl border border-[var(--border-subtle)] p-6 md:p-7 open:shadow-lg hover:border-[var(--emerald-primary)]/30 transition-all duration-300"
                  delay={i * 0.08}
                >
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <h3 className="font-display text-lg md:text-xl text-[var(--ink)] pr-4">{f.q}</h3>
                    <span className="w-8 h-8 rounded-full bg-[var(--emerald-light)] text-[var(--emerald-primary)] flex items-center justify-center shrink-0 group-open:rotate-45 transition-transform font-bold">+</span>
                  </summary>
                  <p className="mt-4 text-[var(--ink-muted)] leading-relaxed">{f.a}</p>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* ================== LUXURY FOOTER ================== */}
      <footer className="relative bg-[#061812] text-white border-t border-[#1B4332]/60 pt-16 pb-12 overflow-hidden">
        {/* Ambient Footer Glow */}
        <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-emerald-500/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 right-10 w-[400px] h-[400px] bg-amber-500/10 blur-[100px] rounded-full animate-gold-glow" />
        </div>

        <div className="relative max-w-[1400px] mx-auto px-4 md:px-8">

          {/* CTA Banner inside Footer */}
          <FadeIn
            className="mb-16 p-8 sm:p-12 rounded-[2.5rem] bg-gradient-to-r from-[#0C3024] via-[#0F382C] to-[#08221A] border border-[#1B4332] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left"
          >
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 text-amber-300 font-bold uppercase tracking-widest text-xs">
                <Sparkles className="w-4 h-4" /> Ready to Invite Your Guests?
              </div>
              <h3 className="font-display text-3xl sm:text-4xl font-bold text-white leading-tight">
                Start Customizing Your Unique Invitation Today
              </h3>
              <p className="text-stone-300 text-sm sm:text-base font-light">
                Create 1 free invitation with ads — or go ad-free for ₹399. Edit any template, get Google Maps directions & live countdown.
              </p>
            </div>


          </FadeIn>

          {/* Main Footer Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10 text-sm">

            {/* Brand Column */}
            <div className="lg:col-span-2 space-y-4 pr-0 lg:pr-8">
              <Link href="/" className="inline-flex items-center gap-3 group">
                <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-white/20 overflow-hidden">
                  <Image
                    src="/logo.png"
                    alt="Web Invites"
                    width={44}
                    height={44}
                    className="object-contain scale-[1.05]"
                    unoptimized
                  />
                </span>
                <div className="flex flex-col leading-tight">
                  <span className="font-display font-bold tracking-wide text-lg text-white group-hover:text-amber-300 transition-colors">
                    WEB INVITES
                  </span>
                  <span className="text-[10px] text-amber-300 font-semibold tracking-widest uppercase">
                    Digital Wedding Invites • Free + Premium
                  </span>
                </div>
              </Link>
              <p className="text-stone-300 text-sm leading-relaxed max-w-sm font-light">
                Creating elegant, modern digital wedding invitations designed to impress your guests. Feature-packed with live inline editor, Google Maps venue directions, and live countdown timer.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold border border-white/10">
                  🔒 Secure Razorpay UPI
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-semibold border border-white/10">
                  ✨ No Watermarks
                </span>
              </div>
            </div>

            {/* Navigation Column */}
            <div className="space-y-3">
              <h4 className="font-display font-bold text-base text-amber-200 tracking-wide">Navigation</h4>
              <ul className="space-y-2.5 text-stone-300 font-light">
                <li>
                  <a href="#templates" className="hover:text-amber-300 transition-colors inline-flex items-center gap-1.5">
                    <span>Browse Designs</span>
                  </a>
                </li>
                <li>
                  <a href="#how" className="hover:text-amber-300 transition-colors inline-flex items-center gap-1.5">
                    <span>How It Works</span>
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-amber-300 transition-colors inline-flex items-center gap-1.5">
                    <span>FAQ</span>
                  </a>
                </li>
                <li>
                  <Link href="/signin" className="hover:text-amber-300 transition-colors">
                    Sign In / Account
                  </Link>
                </li>
              </ul>
            </div>

            {/* Core Features Column */}
            <div className="space-y-3">
              <h4 className="font-display font-bold text-base text-amber-200 tracking-wide">Key Features</h4>
              <ul className="space-y-2.5 text-stone-300 font-light">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Canva-Style Live Editor</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>1-Tap Google Directions</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Live Countdown Timer</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Unlimited Guest Sharing</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Publish for Free</span>
                </li>
              </ul>
            </div>

            {/* Support & Contact Column */}
            <div className="space-y-3">
              <h4 className="font-display font-bold text-base text-amber-200 tracking-wide">Support &amp; Trust</h4>
              <p className="text-stone-300 text-xs leading-relaxed font-light">
                Have questions before starting? Check out our FAQ or sign in to save your draft designs.
              </p>
              <div className="pt-2">
                <a
                  href={`https://wa.me/91${SUPPORT_WHATSAPP}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-200 text-xs font-bold transition-all"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>WhatsApp Support</span>
                </a>
              </div>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400 font-light">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>© {new Date().getFullYear()} Web Invites. All rights reserved.</span>
              <Link href="/terms" className="text-amber-300 hover:text-amber-200 underline font-normal transition-colors">
                Terms &amp; Conditions
              </Link>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('show-cookie-consent'))}
                className="text-amber-300 hover:text-amber-200 underline font-normal transition-colors"
              >
                Cookie Settings
              </button>
            </div>
            <button
              onClick={scrollToTop}
              className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-amber-400 hover:text-stone-950 text-stone-300 text-xs font-semibold transition-all duration-300"
            >
              <span>Back to top</span>
              <ArrowUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
            </button>
          </div>

        </div>
      </footer>



      {/* ================== TEMPLATE PREVIEW MODAL ================== */}
      {/* ================== TEMPLATE PREVIEW MODAL ================== */}
      {previewTemplate && PreviewComponent && (
        <div
          key="preview-modal"
          className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-label={`Preview ${previewTemplate} template`}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-md animate-fadeIn"
            onClick={closePreview}
          />

          {/* Sleek Slender Phone Frame */}
          <div
            className="
                relative
                z-10
                w-full
                max-w-[360px] sm:max-w-[380px]
                h-[88vh]
                max-h-[820px]
                bg-stone-950
                rounded-[2.4rem] sm:rounded-[2.8rem]
                shadow-[0_30px_90px_rgba(0,0,0,0.85)]
                ring-1 ring-white/15
                border-[4px] sm:border-[5px] border-stone-800
                overflow-hidden
                flex flex-col
                animate-fade-in-scale
              "
          >
            {/* Dynamic Island Notch */}
            <div className="w-24 h-3.5 bg-stone-900 rounded-full mx-auto mt-2 mb-1 shrink-0 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-stone-950 border border-stone-800" />
            </div>

            {/* Compact Header Bar */}
            <div className="px-3.5 py-2.5 bg-stone-950 border-b border-stone-800/80 shrink-0 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="font-display text-white text-sm sm:text-base font-bold truncate">
                  {(templatesList.find(t => t.slug === previewTemplate) || {}).title || 'Template Preview'}
                </h2>
                <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-400/15 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">                   Free with Ads · ₹399 Ad-Free
                </span>
              </div>
              <button
                onClick={closePreview}
                className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors active:scale-95 border border-white/5"
                aria-label="Close preview"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>

            {/* Template Content Area */}
            <div className="relative flex-1 w-full bg-[#FAF8F5] overflow-hidden">
              <div className="absolute inset-0 overflow-y-auto hide-scrollbar [-webkit-overflow-scrolling:touch]">
                <div style={{ containerType: 'inline-size', width: '100%', maxWidth: '100%' }}>
                  <Suspense fallback={
                    <div className="flex items-center justify-center min-h-[400px] w-full">
                      <RingLoader size="lg" color="gold" label="Loading invitation preview…" />
                    </div>
                  }>
                    <PreviewComponent
                      key={previewTemplate}
                      data={getPreviewSampleData(previewTemplate)}
                      isDraft={false}
                      editable={false}
                      onEdit={() => { }}
                    />
                  </Suspense>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="px-3.5 py-3 bg-stone-950 border-t border-stone-800/80 shrink-0">
              <button
                onClick={startDesigning}
                className="
                    btn-shine
                    w-full
                    py-3 sm:py-3.5
                    px-4
                    rounded-xl sm:rounded-2xl
                    bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400
                    hover:from-amber-300 hover:to-amber-400
                    text-stone-950
                    font-extrabold
                    text-xs sm:text-sm
                    tracking-wide
                    shadow-[0_8px_25px_rgba(245,158,11,0.3)]
                    hover:shadow-[0_12px_30px_rgba(245,158,11,0.45)]
                    transition-all
                    active:scale-[0.985]
                    flex items-center justify-center gap-2
                    group
                  "
              >
                <span>Customize Design — Free to Start</span>
                <ArrowRight className="w-4 h-4 text-stone-950 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}
