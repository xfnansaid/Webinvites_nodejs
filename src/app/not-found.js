import Link from 'next/link';
import Image from 'next/image';
import { Heart, ArrowRight, Sparkles, Home, Palette } from 'lucide-react';

/**
 * Custom 404 Page — matches the luxurious wedding invitation aesthetic.
 *
 * Design:
 *   - Dark emerald gradient background (same as homepage hero)
 *   - Giant "404" in gold gradient
 *   - Wedding-themed playful copy
 *   - Clear CTAs back to templates or dashboard
 *   - Floating decorative elements
 *   - Trust footer with logo
 */
export default function NotFound() {
  return (
    <main className="relative min-h-screen bg-gradient-to-br from-[#061812] via-[#0A261C] to-[#0D3224] text-white overflow-hidden flex flex-col">

      {/* ── Dot grid pattern ── */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* ── Floating orbs ── */}
      <div className="absolute top-[10%] left-[8%] w-72 h-72 bg-[var(--champagne-500)]/8 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[15%] right-[5%] w-96 h-96 bg-[var(--emerald-primary)]/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute top-[50%] left-[45%] w-56 h-56 bg-[var(--champagne-400)]/6 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '4s' }} />

      {/* ── Floating decorative shapes ── */}
      <div className="absolute top-[20%] right-[15%] opacity-[0.06]">
        <Heart className="w-16 h-16 text-[var(--champagne-500)]" fill="currentColor" />
      </div>
      <div className="absolute bottom-[25%] left-[12%] opacity-[0.04]">
        <Sparkles className="w-20 h-20 text-[var(--champagne-400)]" />
      </div>
      <div className="absolute top-[65%] right-[8%] opacity-[0.03] rotate-12">
        <Heart className="w-10 h-10 text-white" fill="currentColor" />
      </div>

      {/* ── Top nav ── */}
      <nav className="relative z-10 px-6 sm:px-10 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/10 overflow-hidden">
            <Image
              src="/logo.webp"
              alt="Web Invites"
              width={40}
              height={40}
              className="object-contain"
              unoptimized
            />
          </span>
          <span className="font-display font-bold tracking-widest text-sm text-white/70 group-hover:text-white transition-colors">
            WEB INVITES
          </span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/10 hover:bg-white/15 text-sm font-semibold text-white/80 hover:text-white transition-all"
        >
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">Home</span>
        </Link>
      </nav>

      {/* ── Main content ── */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 sm:px-10 py-8">
        <div className="text-center max-w-2xl mx-auto">

          {/* 404 number */}
          <div className="relative inline-block mb-6">
            {/* Glow behind */}
            <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-[var(--champagne-500)] via-[var(--champagne-400)] to-[var(--champagne-500)] rounded-full scale-150" />
            <h1 className="relative font-display text-[clamp(5rem,15vw,10rem)] font-bold leading-none text-gradient-gold select-none">
              404
            </h1>
          </div>

          {/* Decorative line */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[var(--champagne-500)]/40" />
            <Heart className="w-4 h-4 text-[var(--champagne-500)]/60" fill="currentColor" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[var(--champagne-500)]/40" />
          </div>

          {/* Headline */}
          <h2 className="font-display text-[clamp(1.4rem,3vw,2rem)] text-white leading-tight mb-4">
            This Page Got Lost
            <span className="block text-gradient-gold mt-1 text-[clamp(1.2rem,2.5vw,1.6rem)]">
              In the Wedding Dance
            </span>
          </h2>

          {/* Description */}
          <p className="text-sm sm:text-base text-white/50 leading-relaxed max-w-md mx-auto mb-8">
            Looks like this page stepped away to join the celebration.
            Don&apos;t worry — your dream invitations are just a click away.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white text-[var(--emerald-primary)] font-bold text-sm shadow-lg shadow-white/10 hover:shadow-xl hover:shadow-white/15 hover:bg-white/95 active:scale-[0.98] transition-all duration-200"
            >
              <Palette className="w-4 h-4" />
              Browse Templates
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/15 hover:bg-white/15 text-white font-bold text-sm transition-all duration-200 active:scale-[0.98]"
            >
              <Home className="w-4 h-4" />
              Go to Dashboard
            </Link>
          </div>

          {/* Helpful links */}
          <div className="mt-10 pt-8 border-t border-white/10">
            <p className="text-[11px] uppercase tracking-widest text-white/25 font-semibold mb-4">
              Or try one of these
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { label: 'Home', href: '/' },
                { label: 'Templates', href: '/' },
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Sign In', href: '/signin' },
                { label: 'Terms', href: '/terms' },
              ].map((link) => (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  className="px-3.5 py-1.5 rounded-full bg-white/5 ring-1 ring-white/10 text-[11px] sm:text-xs font-semibold text-white/50 hover:text-white/80 hover:bg-white/10 hover:ring-white/20 transition-all"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="relative z-10 px-6 sm:px-10 py-5 flex items-center justify-between text-[11px] text-white/20">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold tracking-wider">WEB INVITES</span>
          <span>© {new Date().getFullYear()}</span>
        </div>

      </footer>
    </main>
  );
}
