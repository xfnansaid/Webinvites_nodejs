'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Clock,
  Sparkles,
  Edit3,
  CreditCard,
  Image as ImageIcon,
  Mail,
  MessageCircle,
  ArrowLeft,
  FileText,
  AlertCircle,
  Globe,
} from 'lucide-react';
import SiteNavbar from '@/components/SiteNavbar';
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP } from '@/lib/support-config';

export default function TermsPage() {
  const lastUpdated = 'August 25, 2026';

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[var(--ink)] selection:bg-[var(--emerald-primary)]/30">
      <SiteNavbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[var(--ink-muted)] hover:text-[var(--emerald-primary)] transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Home</span>
        </Link>

        {/* Page Header */}
        <div className="text-center sm:text-left border-b border-stone-200/80 pb-10 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--emerald-primary)]/10 text-[var(--emerald-primary)] text-xs font-bold uppercase tracking-wider mb-4">
            <FileText className="w-3.5 h-3.5" />
            <span>Legal Documentation</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[var(--ink)]">
            Terms &amp; Conditions
          </h1>

          <p className="mt-3 text-sm sm:text-base text-[var(--ink-muted)] leading-relaxed max-w-2xl">
            Please read these terms carefully before creating or publishing your digital wedding invitation on <strong>Web Invites</strong>.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 text-xs text-stone-500 font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>Last Updated: {lastUpdated}</span>
          </div>
        </div>

        {/* Terms Sections */}
        <div className="space-y-10 sm:space-y-12 leading-relaxed text-sm sm:text-base text-stone-700">

          {/* 1. Introduction */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ink)] flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-stone-700 text-xs font-bold">1</span>
              <span>Acceptance of Terms</span>
            </h2>
            <p>
              By accessing, browsing, editing, or publishing an invitation on <strong>Web Invites</strong> (accessible via <code>webinvites.shop</code>), you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, please do not use our services.
            </p>
          </section>

          {/* 2. Digital Service & Pricing */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ink)] flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-stone-700 text-xs font-bold">2</span>
              <span>100% Digital Service &amp; ₹299 Flat Pricing</span>
            </h2>
            <p>
              Web Invites is a digital self-service platform for creating interactive, mobile-optimized wedding and event invitations:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-stone-600">
              <li><strong>Flat Fee:</strong> Every design template is available at a flat one-time charge of <strong>₹299</strong> with no recurring subscriptions or hidden tiers.</li>
              <li><strong>No Watermarks:</strong> Once unlocked and published, your final invitation link is 100% watermark-free.</li>
              <li><strong>No Physical Delivery:</strong> Our products are purely digital web experiences hosted online. No physical paper cards are printed or shipped.</li>
            </ul>
          </section>

          {/* 3. Post-Publish 3-Edits Policy */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ink)] flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-stone-700 text-xs font-bold">3</span>
              <span>Post-Publish 3-Edits Policy</span>
            </h2>
            <p>
              To safeguard the stability of your shared wedding link and protect against unintended overwrites after distribution, each published invitation includes up to <strong>3 complimentary post-publish edits</strong> directly from your account dashboard.
            </p>
            <p>
              Any changes made within the 3 complimentary edits update your live link immediately without changing the URL. Once the 3-edit quota is reached, the invitation is locked. Any critical corrections required thereafter must be requested via our official support team.
            </p>
          </section>

          {/* 4. User-Uploaded Photos & Content */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ink)] flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-stone-700 text-xs font-bold">4</span>
              <span>User-Uploaded Content &amp; Photos</span>
            </h2>
            <p>
              You retain full ownership of all names, dates, text, and photos you upload to your invitation:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-stone-600">
              <li><strong>Permissions:</strong> You warrant that you have the right to use and display any photos or information you submit.</li>
              <li><strong>Prohibited Content:</strong> You may not upload offensive, defamatory, unlawful, or copyright-infringing content.</li>
              <li><strong>Storage:</strong> Images are compressed and stored securely for the duration of your hosted invitation.</li>
            </ul>
          </section>

          {/* 5. Payments & Security */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ink)] flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-stone-700 text-xs font-bold">5</span>
              <span>Payment Processing</span>
            </h2>
            <p>
              Payments on Web Invites are securely processed through <strong>Razorpay</strong> via UPI, Credit/Debit Cards, or Net Banking. Web Invites does not store your payment card numbers, UPI PINs, or banking passwords.
            </p>
          </section>

          {/* 6. Refund & Cancellation Policy */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ink)] flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-stone-700 text-xs font-bold">6</span>
              <span>Refund &amp; Cancellation Policy</span>
            </h2>
            <p>
              Because digital invitations are customized and generated instantly upon payment confirmation with full watermark-free access, <strong>orders are non-refundable once published</strong>.
            </p>
            <p>
              If you experience a verified duplicate charge or technical failure that prevented access to your invitation link, please contact us within 48 hours for a prompt investigation and resolution.
            </p>
          </section>

          {/* 7. Hosting Duration & Link Validity */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ink)] flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-stone-700 text-xs font-bold">7</span>
              <span>Hosting Duration &amp; Link Validity</span>
            </h2>
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-950 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Globe className="w-4 h-4 text-amber-700" />
                <span>Hosting Lifecycle Commitment</span>
              </div>
              <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed">
                Every published invitation is guaranteed to be hosted and publicly accessible online from the moment of publication until <strong>3 days after your specified event date</strong>. This ensures your guests can access directions, schedule details, and venue navigation before, during, and immediately following your wedding celebrations.
              </p>
            </div>
          </section>

          {/* 8. Intellectual Property */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ink)] flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-stone-700 text-xs font-bold">8</span>
              <span>Intellectual Property</span>
            </h2>
            <p>
              All template themes, graphic illustrations, typography systems, and underlying code on Web Invites are the intellectual property of Web Invites. Users are granted a limited, personal, non-transferable license to distribute their unique invitation link to wedding guests and family.
            </p>
          </section>

          {/* 9. Limitation of Liability */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ink)] flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-stone-700 text-xs font-bold">9</span>
              <span>Limitation of Liability</span>
            </h2>
            <p>
              Web Invites is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. In no event shall Web Invites or its operators be liable for any indirect, incidental, or consequential damages arising from the use of our services. Our total liability for any claim shall not exceed the amount paid for the specific invitation (₹299).
            </p>
          </section>

          {/* 10. Contact & Support */}
          <section className="space-y-4 pt-4 border-t border-stone-200">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ink)] flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-stone-700 text-xs font-bold">10</span>
              <span>Contact &amp; Customer Support</span>
            </h2>
            <p>
              If you have any questions about these Terms, need assistance with your invitation, or have a general inquiry, our support team is happy to assist:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-stone-200 hover:border-amber-400/50 hover:shadow-sm transition-all group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-stone-400">Email Support</div>
                  <div className="text-sm font-semibold text-[var(--ink)]">{SUPPORT_EMAIL}</div>
                </div>
              </a>

              <a
                href={`https://wa.me/91${SUPPORT_WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-stone-200 hover:border-emerald-400/50 hover:shadow-sm transition-all group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-stone-400">WhatsApp Support</div>
                  <div className="text-sm font-semibold text-[var(--ink)]">+91 {SUPPORT_WHATSAPP}</div>
                </div>
              </a>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-8 text-center text-xs text-stone-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>&copy; {new Date().getFullYear()} Web Invites. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-[var(--emerald-primary)] transition-colors">Home</Link>
            <Link href="/terms" className="text-[var(--emerald-primary)] font-semibold">Terms &amp; Conditions</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
