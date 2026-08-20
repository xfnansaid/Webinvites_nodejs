'use client';

import { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles, Heart, CheckCircle2, Palette, Star, Users, Gift, MessageCircle, ShieldCheck, Clock, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SiteNavbar from '@/components/SiteNavbar';
// Single source of truth for ALL template metadata — adding templates only
// requires editing src/components/templates/index.js; this page auto-updates.
import { templatesList } from '@/components/templates';

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

const features = [
  { icon: <Palette className="w-7 h-7" />, title: "Canva-Style Live Editor", desc: "Tap any text on the template to edit it directly. No forms — instant customization." },
  { icon: <Clock className="w-7 h-7" />, title: "3 Editable Sections", desc: "Hero, Find Us with Get Directions, and a live Countdown Timer — all fully customizable." },
  { icon: <MessageCircle className="w-7 h-7" />, title: "Instant Preview", desc: "See every edit live with a clean watermark-free preview as you customize. Publish to get your shareable link." },
  { icon: <Gift className="w-7 h-7" />, title: "Unified ₹299 Price", desc: "Every template, every feature. One flat price of ₹299 — no hidden fees or tiers." },
  { icon: <ShieldCheck className="w-7 h-7" />, title: "Secure Razorpay Checkout", desc: "Publish instantly after secure Razorpay UPI/card payment. Your unique link is ready." },
  { icon: <Users className="w-7 h-7" />, title: "Shareable Unique Link", desc: "Send your personalized digital invitation via WhatsApp, email, or social media." }
];

const faqs = [
  { q: "How does the Live editor work?", a: "Once you pick a template, tap any text element to enter edit mode. Type your changes, press Enter (or click away) to save. Everything updates live, like Canva or Figma." },
  { q: "Is the price really the same for all templates?", a: `Yes — unified flat pricing of ₹299 for every one of our ${templatesList.length} designs.  No tiers, no upsells, no surprise charges.` },
  { q: "What sections can I edit?", a: "Each template has exactly 3 editable parts: (1) a personalized Hero with couple names, date, time, venue tagline, (2) Find Us with the auditorium details and a direct Get Directions link, (3) a live Countdown Timer with a customizable heading." },
  { q: "Will there be a watermark on my final invite?", a: "Nope — your final published invite is completely watermark-free and ready to share. The live editor itself also shows no watermarks, so you can design distraction-free." },
  { q: "What about photos, music, or RSVP forms?", a: "We simplified the product for a faster editing experience. Photo galleries, background music, and RSVP forms have been removed — all templates now focus on the 3 core sections that guests actually open invites to see." },
  { q: "How do my guests reach the venue?", a: "Section 2 includes a Get Directions button that opens Google Maps (or your custom maps URL) with a single tap. No embedded map iFrames — clean and privacy-friendly." }
];

export default function HomePage() {
  // ==========================================================================
  // HYDRATION-SAFE RANDOMIZATION
  //
  // PROBLEM (the error the user saw):
  //   React hydration mismatch "Text content does not match server-rendered
  //   HTML" because `useMemo(..., [])` with Math.random() inside runs during
  //   the SERVER render (order X) AND during CLIENT first render (order Y) →
  //   the positions of shuffledTemplates differ, React reconciles first-child
  //   content, finds Kerala Lotus Tradition in position 1 on one side but
  //   something else on the other → throws.
  //
  // SOLUTION:
  //   * First render (server + matching client hydration pass) = use the
  //     STABLE registry order, identical on both sides → hydration passes.
  //   * After useEffect fires (guaranteed AFTER first client paint, hydration
  //     already done), run the Fisher-Yates shuffle ONCE per mount, swap in
  //     the shuffled list, and cross-fade the entire grid via framer-motion
  //     key so users never see any "jump" between order A → order B.
  //   * Per-card stagger also only runs AFTER shuffle is mounted — the
  //     server render uses a fixed stagger so server/client DOM matches.
  // ==========================================================================

  const stableList = templatesList;               // server + hydration-safe
  const stableStagger = stableList.map((_, idx) => (idx % 4) * 40 + (idx % 10) * 2);

  const [shuffledTemplates, setShuffledTemplates] = useState(stableList);
  const [perCardStagger, setPerCardStagger] = useState(stableStagger);
  const [hasShuffled, setHasShuffled] = useState(false);

  // Run shuffle ONLY AFTER hydration, on client only.
  useEffect(() => {
    const list = shuffleArray(templatesList);
    const delays = list.map(() => Math.random() * 280);
    setShuffledTemplates(list);
    setPerCardStagger(delays);
    // Small RAF delay so the 1st paint is stable, then we swap order.
    requestAnimationFrame(() => setHasShuffled(true));
  }, []);

  // Compute final stagger — for shuffled cards merge deterministic + random
  const finalStagger = useMemo(
    () => shuffledTemplates.map((_, i) => ((i % 4) * 25) / 1000 + (perCardStagger[i] || 0) / 1000),
    [shuffledTemplates, perCardStagger]
  );

  return (
    <>
      <SiteNavbar />
      <main className="min-h-screen bg-[#FAF8F5] text-[var(--ink)] selection:bg-[var(--emerald-primary)]/30">


        {/* ================== TEMPLATES GRID ================== */}
        <section id="templates" className="py-20 md:py-28 border-b border-[var(--border-subtle)]">
          <div className="max-w-[1400px] mx-auto px-4 md:px-8">
            <div className="text-center mb-10 md:mb-14">
              <div className="inline-flex items-center gap-2 text-[var(--emerald-primary)] font-bold uppercase tracking-[0.15em] text-xs mb-3">
                <Star className="w-4 h-4" /> Our Collection
              </div>
              <h2 className="font-display text-[clamp(2rem,4vw,3rem)] text-[var(--ink)] mb-3">
                {shuffledTemplates.length} Designs — ₹299 Flat
              </h2>
              <p className="text-[var(--ink-muted)] text-lg max-w-2xl mx-auto">
                Designs are shuffled randomly every visit so each one gets equal eyeballs.
                Refresh the page for a new order.
              </p>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={hasShuffled ? 'shuffled' : 'stable'}
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0.8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 px-1 sm:px-0"
              >
                {shuffledTemplates.map((t, i) => (
                  <motion.div
                    key={t.slug}
                    initial={{ opacity: 0, y: 22, scale: 0.97 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, amount: 0.08, margin: '80px 0px' }}
                    transition={{
                      type: 'spring',
                      stiffness: 260,
                      damping: 22,
                      mass: 0.7,
                      // Hydration-safe delay.  First render (before shuffle kicks
                      // in) = stable deterministic stagger (matches server HTML).
                      // After useEffect shuffle = random per-card stagger for
                      // the "lazy, fastest loaded first" effect.
                      delay: finalStagger[i] || 0,
                    }}
                    className="group relative"
                  >
                    <Link href={t.url} className="block">
                    {/* Phone-shaped tall invitation preview card */}
                    <div
                      className="relative aspect-[9/16] sm:aspect-[9/16] md:aspect-[9/16] w-full rounded-[1.75rem] sm:rounded-[2rem] md:rounded-[2.25rem] overflow-hidden border-2 border-[var(--border-subtle)] group-hover:border-[var(--emerald-primary)]/60 shadow-[0_10px_30px_rgba(0,0,0,0.06)] group-hover:shadow-[0_22px_60px_rgba(15,56,44,0.16)] group-hover:-translate-y-1.5 transition-all duration-500 bg-[#f6f2ea]"
                      style={{ backgroundColor: t.accentColor }}
                    >
                      {/* Background preview image (clipped to phone shape) — uses the
                          EXACT hero background URL from the template itself (bgImageUrl),
                          so the browse card matches the "cover" of the invite design.
                          loading="lazy" = below-the-fold cards don't download until user
                          scrolls near them (real lazy effect, fastest images appear first). */}
                      <Image
                        src={t.bgImageUrl}
                        alt={t.title}
                        fill
                        loading="lazy"
                        unoptimized={t.bgImageUrl.startsWith('http')}
                        className="object-cover object-center group-hover:scale-[1.05] transition-transform duration-700"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                      />
                      {/* Shimmer/placeholder fade so cards above-the-fold that are
                          waiting on image HTTP response don't show blank white voids */}
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 animate-pulse bg-gradient-to-br from-white/10 via-transparent to-[var(--champagne-500)]/10 mix-blend-overlay"
                      />
                      {/* Subtle top-to-bottom fade so price pill & button always readable */}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/20 pointer-events-none" />

                      {/* ₹ PRICE PILL (top-right, always visible) */}
                      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20">
                        <span className="inline-flex items-center justify-center rounded-full bg-[#1B4332]/90 backdrop-blur text-white text-[11px] sm:text-xs md:text-sm font-black px-3 py-1.5 sm:px-3.5 sm:py-1.5 shadow-[0_6px_16px_rgba(0,0,0,0.25)] tracking-tight">
                          ₹299
                        </span>
                      </div>

                      {/* Template title tag (top-left) */}
                      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 max-w-[65%]">
                        <span className="inline-flex items-center rounded-full bg-white/85 backdrop-blur text-[var(--ink)] text-[10px] sm:text-[11px] font-bold px-2.5 py-1 sm:px-3 sm:py-1.5 shadow-sm border border-white/60 truncate">
                          {t.title}
                        </span>
                      </div>

                      {/* BOTTOM: START DESIGNING BUTTON */}
                      <div className="absolute inset-x-3 bottom-3 sm:inset-x-4 sm:bottom-4 z-20">
                        <div className="flex items-center justify-center gap-1.5 w-full h-10 sm:h-12 md:h-14 rounded-[1.1rem] sm:rounded-[1.25rem] md:rounded-2xl bg-black/55 backdrop-blur-xl text-white text-[13px] sm:text-sm md:text-base font-bold shadow-[0_10px_25px_rgba(0,0,0,0.35)] group-hover:bg-[var(--emerald-primary)] group-hover:shadow-[0_12px_30px_rgba(15,56,44,0.35)] transition-all border border-white/15 group-hover:border-[var(--emerald-primary)]/20">
                          <Eye className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                          Start Designing
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* ================== HOW IT WORKS ================== */}
        <section id="how" className="py-20 md:py-28 border-b border-[var(--border-subtle)] bg-gradient-to-b from-white to-[#FAF8F5]">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 text-[var(--emerald-primary)] font-bold uppercase tracking-[0.15em] text-xs mb-3">
                <Sparkles className="w-4 h-4" /> 3 Simple Steps
              </div>
              <h2 className="font-display text-[clamp(2rem,4vw,3rem)] text-[var(--ink)] mb-3">From Pick to Publish in Minutes</h2>
              <p className="text-[var(--ink-muted)] text-lg max-w-2xl mx-auto">No forms. No code. Just tap, edit, share.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {[
                {
                  step: "01",
                  icon: <Palette className="w-9 h-9" />,
                  title: "Pick a Design",
                  desc: "Browse all hand-crafted templates. Every single one is ₹299 — pick the look that matches your celebration."
                },
                {
                  step: "02",
                  icon: <Heart className="w-9 h-9" />,
                  title: "Tap to Edit Live",
                  desc: "Click any text on the template to customize it inline. Watch the countdown and hero update instantly. No watermarks while you design."
                },
                {
                  step: "03",
                  icon: <Gift className="w-9 h-9" />,
                  title: "Pay via Razorpay",
                  desc: "Complete secure ₹299 Razorpay checkout. Your unique shareable link is ready — unlimited guests, fully published."
                }
              ].map((s, i) => (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="relative bg-white rounded-3xl border border-[var(--border-subtle)] p-8 md:p-10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
                >
                  <div className="font-display text-5xl text-[var(--emerald-primary)]/15 absolute top-6 right-6 font-bold">{s.step}</div>
                  <div className="w-14 h-14 rounded-2xl bg-[var(--emerald-light)] text-[var(--emerald-primary)] flex items-center justify-center mb-6 shadow-inner">{s.icon}</div>
                  <h3 className="font-display text-2xl text-[var(--ink)] mb-3">{s.title}</h3>
                  <p className="text-[var(--ink-muted)] leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>



        {/* ================== FAQ ================== */}
        <section className="py-20 md:py-28 border-b border-[var(--border-subtle)]">
          <div className="max-w-4xl mx-auto px-4 md:px-8">
            <div className="text-center mb-14">
              <h2 className="font-display text-[clamp(2rem,4vw,3rem)] text-[var(--ink)] mb-3">Frequently Asked Questions</h2>
              <p className="text-[var(--ink-muted)] text-lg">Everything you need to know before you start designing.</p>
            </div>

            <div className="space-y-4">
              {faqs.map((f, i) => (
                <details
                  key={i}
                  className="group bg-white rounded-2xl border border-[var(--border-subtle)] p-6 md:p-7 open:shadow-lg transition-all"
                >
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <h3 className="font-display text-lg md:text-xl text-[var(--ink)] pr-4">{f.q}</h3>
                    <span className="w-8 h-8 rounded-full bg-[var(--emerald-light)] text-[var(--emerald-primary)] flex items-center justify-center shrink-0 group-open:rotate-45 transition-transform font-bold">+</span>
                  </summary>
                  <p className="mt-4 text-[var(--ink-muted)] leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>


      </main>
    </>
  );
}
