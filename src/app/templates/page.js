import Image from 'next/image';
import Link from 'next/link';
import { Palette, ArrowRight, Sparkles, CheckCircle2, Eye } from 'lucide-react';

const availableTemplates = [
  {
    id: "standard-crimson",
    name: "Standard Crimson",
    description: "A royal and elegant design perfect for traditional Nikah and wedding celebrations.",
    image: "/img/crimson-thumb.jpg",
    category: "Traditional"
  },
  {
    id: "kerala-kasavu",
    name: "Kerala Kasavu",
    description: "Inspired by the timeless beauty of Kerala tradition, with golden accents and lamps.",
    image: "/img/hero-photo.png",
    category: "Regional"
  },
  {
    id: "royal-nikah",
    name: "Royal Malabar Nikah",
    description: "Deep emerald and gold theme with arabesque textures for a premium Nikah experience.",
    image: "/img/imgg3.png",
    category: "Traditional"
  },
  {
    id: "royal-postcard",
    name: "Royal Postcard",
    description: "A classic postcard style invitation with vintage charm and elegant typography.",
    image: "/img/imgg4.png",
    category: "Classic"
  },
  {
    id: "premium-floral",
    name: "Premium Floral",
    description: "Modern elegance with soft floral touches and interactive countdown timers.",
    image: "/img/floral-arch-thumb.jpg",
    category: "Modern"
  },
  {
    id: "watercolor-bliss",
    name: "Watercolor Bliss",
    description: "Soft pink and beige watercolor textures for a romantic and artistic invitation.",
    image: "/img/Beige and Pink Watercolor Wedding Invitation.png",
    category: "Artistic"
  },
  {
    id: "ivory-arch",
    name: "Ivory Arch",
    description: "Minimalist ivory design with architectural arches and clean serif typography.",
    image: "/img/imgg8.png",
    category: "Traditional"
  },
  {
    id: "modern-navy",
    name: "Modern Navy",
    description: "Sophisticated blue watercolor illustration with a clean, contemporary layout.",
    image: "/img/Blue Watercolor Illustration Wedding Invitation.png",
    category: "Modern"
  }
];

export default function TemplateSelection() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-20 selection:bg-[var(--emerald-primary)]/30">
      {/* Header */}
      <header className="bg-gradient-to-b from-white to-[#FAF8F5] border-b border-[var(--border-subtle)] py-12 md:py-16 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[var(--champagne-500)]/15 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-[var(--emerald-primary)]/15 blur-3xl pointer-events-none"></div>
        <div className="container mx-auto px-4 text-center relative">
          <div className="inline-flex items-center gap-2 bg-[var(--emerald-light)] text-[var(--emerald-primary)] px-4 py-2 rounded-full text-xs font-bold uppercase tracking-[0.15em] mb-6 shadow-inner">
            <Sparkles className="w-3.5 h-3.5" />
            Unified ₹399 Flat Pricing
          </div>
          <h1 className="text-3xl md:text-5xl font-display text-[var(--ink)] mb-4 leading-[1.1]">
            Choose Your Invitation Design
          </h1>
          <p className="text-[var(--ink-muted)] max-w-2xl mx-auto text-lg">
            All premium designs — one flat price of <span className="font-bold text-[var(--emerald-primary)]">₹399</span>. Tap any card below to preview the design and enter the live Canva-style editor.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm md:text-base text-[var(--ink-soft)] font-medium">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[var(--emerald-primary)]" />
              3 Editable Sections Each
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[var(--emerald-primary)]" />
              Live Editing
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[var(--emerald-primary)]" />
              Countdown Timer
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[var(--emerald-primary)]" />
              Get Directions Link
            </span>
          </div>
        </div>
      </header>

      {/* Grid */}
      <main className="container mx-auto px-2 sm:px-4 mt-10 md:mt-14">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {availableTemplates.map((template) => (
            <div
              key={template.id}
              className="group bg-white rounded-[1.75rem] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_24px_60px_rgba(15,56,44,0.12)] transition-all duration-500 border border-[var(--border-subtle)] flex flex-col h-full hover:-translate-y-1"
            >
              {/* Phone-shaped tall preview image */}
              <div className="relative mx-auto w-full px-3 pt-3 sm:px-4 sm:pt-4">
                <div className="relative aspect-[9/16] w-full rounded-[1.5rem] sm:rounded-[1.75rem] overflow-hidden border-2 border-[var(--border-subtle)] group-hover:border-[var(--emerald-primary)]/60 shadow-[0_10px_28px_rgba(0,0,0,0.08)] transition-all">
                  <Image
                    src={template.image}
                    alt={template.name}
                    fill
                    className="object-cover object-center group-hover:scale-[1.05] transition-transform duration-700"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 33vw"
                  />
                  {/* Subtle readability overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/20 pointer-events-none" />

                  {/* Category tag (top-left) */}
                  <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-20 max-w-[55%]">
                    <span className="inline-flex items-center px-2.5 py-1 bg-white/90 backdrop-blur rounded-full text-[10px] font-bold text-[var(--emerald-primary)] shadow-sm uppercase tracking-[0.15em] truncate border border-white/60">
                      {template.category}
                    </span>
                  </div>

                  {/* ₹ PRICE PILL (top-right, like image design) */}
                  <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-20">
                    <span className="inline-flex items-center justify-center rounded-full bg-[#1B4332]/90 backdrop-blur text-white text-[11px] sm:text-xs font-black px-3 py-1.5 shadow-[0_6px_16px_rgba(0,0,0,0.25)] tracking-tight">
                      ₹399
                    </span>
                  </div>

                  {/* BOTTOM: PREVIEW DESIGN BUTTON */}
                  <Link
                    href={`/create/${template.id}`}
                    className="absolute inset-x-2.5 bottom-2.5 sm:inset-x-3 sm:bottom-3 z-20 flex items-center justify-center gap-1.5 w-[calc(100%-20px)] sm:w-[calc(100%-24px)] h-9 sm:h-11 md:h-12 rounded-[1rem] sm:rounded-[1.15rem] bg-black/55 backdrop-blur-xl text-white text-[12px] sm:text-sm font-bold shadow-[0_10px_25px_rgba(0,0,0,0.35)] group-hover:bg-[var(--emerald-primary)] group-hover:shadow-[0_12px_30px_rgba(15,56,44,0.35)] transition-all border border-white/15 group-hover:border-[var(--emerald-primary)]/20"
                  >
                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Preview Design
                  </Link>
                </div>
              </div>

              {/* Description + Start Editing */}
              <div className="p-4 sm:p-5 md:p-6 flex-1 flex flex-col">
                <h3 className="text-lg sm:text-xl font-display text-[var(--ink)] mb-1.5 leading-tight">{template.name}</h3>
                <p className="text-[var(--ink-muted)] text-xs sm:text-sm mb-4 md:mb-5 line-clamp-3 flex-1 leading-relaxed">
                  {template.description}
                </p>

                <Link
                  href={`/create/${template.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-[var(--emerald-primary)] text-white rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm hover:bg-[var(--emerald-dark)] hover:-translate-y-0.5 active:scale-[0.98] transition-all shadow-xl shadow-[var(--emerald-primary)]/20 group/btn"
                >
                  <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Start Editing
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}

          {/* Coming Soon Card (kept, redesigned same aspect ratio) */}
          <div className="bg-gradient-to-br from-[#FAF8F5] to-white rounded-[1.75rem] border-2 border-dashed border-[var(--border-subtle)] p-4 sm:p-5 md:p-6 flex flex-col items-center justify-center text-center">
            <div className="relative aspect-[9/16] w-full rounded-[1.5rem] sm:rounded-[1.75rem] border-2 border-dashed border-[var(--border-subtle)] mb-4 flex items-center justify-center overflow-hidden bg-white">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(15,56,44,0.06),transparent_55%),radial-gradient(circle_at_70%_80%,rgba(222,185,120,0.12),transparent_55%)]" />
              <div className="relative flex flex-col items-center justify-center p-4 sm:p-5 text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[var(--emerald-light)] rounded-full flex items-center justify-center text-[var(--emerald-primary)] mb-3 sm:mb-4 shadow-inner shrink-0">
                  <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <h4 className="font-display text-sm sm:text-base text-[var(--ink-soft)] mb-1">More Designs</h4>
                <p className="text-[11px] sm:text-xs text-[var(--ink-muted)] leading-snug">
                  Coming soon — all future designs stay at the ₹399 flat price.
                </p>
              </div>
            </div>
            <h3 className="text-lg sm:text-xl font-display text-[var(--ink-soft)] mb-2">More Designs Coming Soon</h3>
            <p className="text-[var(--ink-muted)] text-xs sm:text-sm max-w-[260px]">We're constantly crafting new luxury templates. All future designs stay at the unified ₹399 flat price.</p>
          </div>
        </div>
      </main>

      {/* Help Section */}
      <section className="mt-20 md:mt-28 container mx-auto px-4">
        <div className="bg-[var(--emerald-primary)] rounded-[2rem] p-10 md:p-14 text-white text-center relative overflow-hidden shadow-[0_30px_80px_rgba(15,56,44,0.25)]">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-80 h-80 bg-[var(--champagne-500)]/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-display mb-4">Need a custom design?</h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto text-lg">
              Looking for something completely unique? Our design team can craft a bespoke invitation experience tailored exactly to your celebration.
            </p>
            <a
              href="https://wa.me/91XXXXXXXXXX"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-[var(--emerald-primary)] rounded-full font-bold hover:bg-[var(--emerald-light)] hover:-translate-y-0.5 active:scale-[0.98] transition-all shadow-xl"
            >
              Chat with Designer
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
