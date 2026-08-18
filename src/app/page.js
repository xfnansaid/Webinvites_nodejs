'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles, Heart, CheckCircle2, Palette, Star, Users, Gift, MessageCircle, ShieldCheck, Clock, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

const templates = [
  { id: "standard-crimson", title: "Standard Crimson", image: "/img/crimson-thumb.jpg", url: "/create/standard-crimson", previewUrl: "https://one-tawny-two.vercel.app/0001/standard.html", color: "#0D0F0D" },
  { id: "royal-nikah", title: "Malabar Nikah", image: "/img/imgg3.png", url: "/create/royal-nikah", previewUrl: "https://one-tawny-two.vercel.app/0003/standard.html", color: "#0E0A00" },
  { id: "royal-postcard", title: "Royal Postcard", image: "/img/imgg4.png", url: "/create/royal-postcard", previewUrl: "https://one-tawny-two.vercel.app/0004/standard.html", color: "#FDF5EE" },
  { id: "premium-floral", title: "Premium Floral", image: "/img/floral-arch-thumb.jpg", url: "/create/premium-floral", previewUrl: "https://one-tawny-two.vercel.app/0005/standard.html", color: "#1A150C" },
  { id: "watercolor-bliss", title: "Watercolor Bliss", image: "/img/Beige and Pink Watercolor Wedding Invitation.png", url: "/create/watercolor-bliss", previewUrl: "https://one-tawny-two.vercel.app/0007/standard.html", color: "#0E1F18" },
  { id: "kerala-kasavu", title: "Kerala Kasavu", image: "/img/imgg2.png", url: "/create/kerala-kasavu", previewUrl: "https://one-tawny-two.vercel.app/0005/standard.html", color: "#1A1110" },
  { id: "ivory-arch", title: "Ivory Arch", image: "/img/imgg8.png", url: "/create/ivory-arch", previewUrl: "https://one-tawny-two.vercel.app/0008/standard.html", color: "#24161B" },
  { id: "modern-navy", title: "Modern Navy", image: "/img/Blue Watercolor Illustration Wedding Invitation.png", url: "/create/modern-navy", previewUrl: "https://one-tawny-two.vercel.app/0009/standard.html", color: "#1C1524" }
];

const features = [
  { icon: <Palette className="w-7 h-7" />, title: "Canva-Style Live Editor", desc: "Tap any text on the template to edit it directly. No forms — instant customization." },
  { icon: <Clock className="w-7 h-7" />, title: "3 Editable Sections", desc: "Hero, Find Us with Get Directions, and a live Countdown Timer — all fully customizable." },
  { icon: <MessageCircle className="w-7 h-7" />, title: "Instant Preview", desc: "See every edit live with a clean watermark-free preview as you customize. Publish to get your shareable link." },
  { icon: <Gift className="w-7 h-7" />, title: "Unified ₹399 Price", desc: "Every template, every feature. One flat price of ₹399 — no hidden fees or tiers." },
  { icon: <ShieldCheck className="w-7 h-7" />, title: "Secure Razorpay Checkout", desc: "Publish instantly after secure Razorpay UPI/card payment. Your unique link is ready." },
  { icon: <Users className="w-7 h-7" />, title: "Shareable Unique Link", desc: "Send your personalized digital invitation via WhatsApp, email, or social media." }
];

const faqs = [
  { q: "How does the Live editor work?", a: "Once you pick a template, tap any text element to enter edit mode. Type your changes, press Enter (or click away) to save. Everything updates live, like Canva or Figma." },
  { q: "Is the price really the same for all templates?", a: "Yes — unified flat pricing of ₹399 for every design. Standard & Premium tiers have been merged into one great experience." },
  { q: "What sections can I edit?", a: "Each template has exactly 3 editable parts: (1) a personalized Hero with couple names, date, time, venue tagline, (2) Find Us with the auditorium details and a direct Get Directions link, (3) a live Countdown Timer with a customizable heading." },
  { q: "Will there be a watermark on my final invite?", a: "Nope — your final published invite is completely watermark-free and ready to share. The live editor itself also shows no watermarks, so you can design distraction-free." },
  { q: "What about photos, music, or RSVP forms?", a: "We simplified the product for a faster editing experience. Photo galleries, background music, and RSVP forms have been removed — all templates now focus on the 3 core sections that guests actually open invites to see." },
  { q: "How do my guests reach the venue?", a: "Section 2 includes a Get Directions button that opens Google Maps (or your custom maps URL) with a single tap. No embedded map iFrames — clean and privacy-friendly." }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#FAF8F5] text-[var(--ink)] selection:bg-[var(--emerald-primary)]/30">
      {/* ================== HERO ================== */}
      <section className="relative overflow-hidden pt-10 md:pt-16 pb-20 md:pb-32 border-b border-[var(--border-subtle)] bg-gradient-to-b from-white via-[#FAF8F5] to-[#F4F0E8]">
        <div className="absolute -top-20 right-0 w-96 h-96 rounded-full bg-[var(--champagne-500)]/20 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-16 w-[28rem] h-[28rem] rounded-full bg-[var(--emerald-primary)]/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-[1280px] mx-auto px-4 md:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-white border border-[var(--border-subtle)] px-5 py-2 rounded-full shadow-sm mb-8"
            >
              <Sparkles className="w-4 h-4 text-[var(--emerald-primary)]" />
              <span className="text-sm font-bold text-[var(--ink-soft)]">All Designs Included • Unified ₹399 Flat</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-display text-[clamp(2.5rem,6vw,4.6rem)] leading-[1.05] tracking-[-0.02em] text-[var(--ink)] mb-6"
            >
              Digital Wedding Invites<br />
              You <span className="text-[var(--emerald-primary)]">Edit Like Canva</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg md:text-xl text-[var(--ink-muted)] max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Pick a template, tap any text to edit it live — then publish with secure Razorpay checkout
              for a flat <span className="font-bold text-[var(--emerald-primary)]">₹399</span>.
              Preview instantly, share the unique link after purchase.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href="/templates"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--emerald-primary)] text-white rounded-2xl font-bold text-lg hover:bg-[var(--emerald-dark)] hover:-translate-y-1 active:scale-[0.98] transition-all shadow-2xl shadow-[var(--emerald-primary)]/20"
              >
                <Palette className="w-5 h-5" />
                Browse All Templates
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#how"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white border border-[var(--border-subtle)] text-[var(--ink)] rounded-2xl font-bold text-lg hover:bg-gray-50 hover:-translate-y-1 active:scale-[0.98] transition-all shadow-sm"
              >
                How It Works
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-[var(--ink-soft)] font-medium"
            >
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--emerald-primary)]" /> 3 Editable Sections</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--emerald-primary)]" /> Countdown Timer</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--emerald-primary)]" /> Get Directions Link</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--emerald-primary)]" /> Live Watermark-Free Preview</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--emerald-primary)]" /> Razorpay Checkout</span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================== TEMPLATES GRID ================== */}
      <section id="templates" className="py-20 md:py-28 border-b border-[var(--border-subtle)]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-[var(--emerald-primary)] font-bold uppercase tracking-[0.15em] text-xs mb-3">
              <Star className="w-4 h-4" /> Our Unified Collection
            </div>
            <h2 className="font-display text-[clamp(2rem,4vw,3rem)] text-[var(--ink)] mb-3">All Designs — ₹399 Flat</h2>
            <p className="text-[var(--ink-muted)] text-lg max-w-2xl mx-auto">Tap on any design to enter the Canva-style live editor and start personalizing your invite instantly.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5 px-1 sm:px-0">
            {templates.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.04 }}
                className="group relative"
              >
                <Link href={t.url} className="block">
                  {/* Phone-shaped tall invitation preview card */}
                  <div
                    className="relative aspect-[9/16] sm:aspect-[9/16] md:aspect-[9/16] w-full rounded-[1.75rem] sm:rounded-[2rem] md:rounded-[2.25rem] overflow-hidden border-2 border-[var(--border-subtle)] group-hover:border-[var(--emerald-primary)]/60 shadow-[0_10px_30px_rgba(0,0,0,0.06)] group-hover:shadow-[0_22px_60px_rgba(15,56,44,0.16)] group-hover:-translate-y-1.5 transition-all duration-500 bg-[#f6f2ea]"
                    style={{ backgroundColor: t.color }}
                  >
                    {/* Background preview image (clipped to phone shape) */}
                    <Image
                      src={t.image}
                      alt={t.title}
                      fill
                      className="object-cover object-center group-hover:scale-[1.05] transition-transform duration-700"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    {/* Subtle top-to-bottom fade so price pill & button always readable */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/20 pointer-events-none" />

                    {/* ₹ PRICE PILL (top-right, always visible) */}
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20">
                      <span className="inline-flex items-center justify-center rounded-full bg-[#1B4332]/90 backdrop-blur text-white text-[11px] sm:text-xs md:text-sm font-black px-3 py-1.5 sm:px-3.5 sm:py-1.5 shadow-[0_6px_16px_rgba(0,0,0,0.25)] tracking-tight">
                        ₹399
                      </span>
                    </div>

                    {/* Template title tag (top-left) */}
                    <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 max-w-[55%]">
                      <span className="inline-flex items-center rounded-full bg-white/85 backdrop-blur text-[var(--ink)] text-[10px] sm:text-[11px] font-bold px-2.5 py-1 sm:px-3 sm:py-1.5 shadow-sm border border-white/60 truncate">
                        {t.title}
                      </span>
                    </div>

                    {/* BOTTOM: PREVIEW DESIGN BUTTON */}
                    <div className="absolute inset-x-3 bottom-3 sm:inset-x-4 sm:bottom-4 z-20">
                      <div className="flex items-center justify-center gap-1.5 w-full h-10 sm:h-12 md:h-14 rounded-[1.1rem] sm:rounded-[1.25rem] md:rounded-2xl bg-black/55 backdrop-blur-xl text-white text-[13px] sm:text-sm md:text-base font-bold shadow-[0_10px_25px_rgba(0,0,0,0.35)] group-hover:bg-[var(--emerald-primary)] group-hover:shadow-[0_12px_30px_rgba(15,56,44,0.35)] transition-all border border-white/15 group-hover:border-[var(--emerald-primary)]/20">
                        <Eye className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                        Preview Design
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
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
                desc: "Browse all hand-crafted templates. Every single one is ₹399 — pick the look that matches your celebration."
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
                title: "Publish via Razorpay",
                desc: "Complete secure ₹399 Razorpay checkout. Your unique shareable link is ready — unlimited guests, fully published."
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

      {/* ================== FEATURES GRID ================== */}
      <section className="py-20 md:py-28 border-b border-[var(--border-subtle)]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.05 }}
                className="group p-8 rounded-3xl bg-white border border-[var(--border-subtle)] hover:border-[var(--emerald-primary)]/40 hover:bg-[var(--emerald-light)]/20 transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-[var(--emerald-light)] text-[var(--emerald-primary)] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-inner">
                  {f.icon}
                </div>
                <h3 className="font-display text-xl text-[var(--ink)] mb-2">{f.title}</h3>
                <p className="text-[var(--ink-muted)] leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================== PRICING (Single Unified Tier) ================== */}
      <section id="pricing" className="py-20 md:py-28 border-b border-[var(--border-subtle)] bg-gradient-to-b from-[#FAF8F5] to-white">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-[var(--emerald-primary)] font-bold uppercase tracking-[0.15em] text-xs mb-3">
              <Gift className="w-4 h-4" /> Simple, Transparent Pricing
            </div>
            <h2 className="font-display text-[clamp(2rem,4vw,3rem)] text-[var(--ink)] mb-3">One Price. Everything Included.</h2>
            <p className="text-[var(--ink-muted)] text-lg max-w-2xl mx-auto">No more confusing Standard vs Premium tiers. One plan, one price, every template.</p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden bg-white rounded-[2.5rem] border-2 border-[var(--emerald-primary)]/30 shadow-[0_40px_100px_rgba(15,56,44,0.15)] p-10 md:p-16 text-center"
          >
            <div className="absolute top-6 right-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--emerald-primary)] text-white text-xs font-bold uppercase tracking-widest shadow-lg">
              <Sparkles className="w-3.5 h-3.5" /> Unified Plan
            </div>

            <div className="font-display text-[var(--ink-muted)] text-xl mb-2">Per Invitation</div>
            <div className="flex items-baseline justify-center gap-2 mb-6">
              <span className="font-display text-7xl md:text-8xl text-[var(--ink)] tracking-[-0.03em]">₹399</span>
            </div>
            <p className="text-[var(--ink-muted)] text-lg mb-10 max-w-xl mx-auto">
              Create, edit live, then publish instantly. Your unique digital invitation link — shareable with unlimited guests.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto text-left mb-10">
              {[
                "All Template Designs",
                " Live Editor",
                "3 Customizable Sections per Template",
                "Live Countdown Timer",
                "Venue Details + Get Directions Link",
                "Clean Watermark-Free Live Preview",
                "Secure Razorpay UPI/Card Checkout",
                "Unique Shareable Invitation Link"
              ].map((bullet) => (
                <div key={bullet} className="flex items-start gap-3 p-3 rounded-xl bg-[var(--emerald-light)]/30">
                  <CheckCircle2 className="w-5 h-5 text-[var(--emerald-primary)] shrink-0 mt-0.5" />
                  <span className="text-[var(--ink-soft)] font-medium leading-snug">{bullet}</span>
                </div>
              ))}
            </div>

            <Link
              href="/templates"
              className="inline-flex items-center gap-2 px-10 py-5 bg-[var(--emerald-primary)] text-white rounded-2xl font-bold text-lg hover:bg-[var(--emerald-dark)] hover:-translate-y-1 active:scale-[0.98] transition-all shadow-2xl shadow-[var(--emerald-primary)]/25"
            >
              Start Creating My Invite
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
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

      {/* ================== FINAL CTA ================== */}
      <section className="py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="relative overflow-hidden bg-[var(--emerald-primary)] rounded-[2.5rem] p-10 md:p-16 text-white text-center shadow-[0_40px_100px_rgba(15,56,44,0.3)]">
            <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-96 h-96 rounded-full bg-[var(--champagne-500)]/20 blur-3xl pointer-events-none"></div>
            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-white/20">
                <Heart className="w-4 h-4" /> Start Today
              </div>
              <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] leading-tight mb-5">
                Ready to Create Your<br />Dream Digital Invitation?
              </h2>
              <p className="text-white/80 text-lg max-w-2xl mx-auto mb-10">
                Pick any template for a flat ₹399. Edit inline, preview instantly, and publish when you love it.
              </p>
              <Link
                href="/templates"
                className="inline-flex items-center gap-2 px-10 py-5 bg-white text-[var(--emerald-primary)] rounded-2xl font-bold text-lg hover:bg-[var(--emerald-light)] hover:-translate-y-1 active:scale-[0.98] transition-all shadow-2xl"
              >
                Browse All Templates
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
