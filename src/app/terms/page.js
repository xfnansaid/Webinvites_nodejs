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
  Gift,
  BadgeCheck,
  Eye,
} from 'lucide-react';
import SiteNavbar from '@/components/SiteNavbar';
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP } from '@/lib/support-config';

export default function TermsPage() {
  const lastUpdated = 'August 29, 2026';

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

        {/* Pricing Overview Card */}
        <div className="mb-12 p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-[var(--emerald-primary)] to-[#0D3224] text-white shadow-xl shadow-[var(--emerald-primary)]/15">
          <div className="flex items-center gap-2 text-amber-300 font-bold uppercase tracking-widest text-xs mb-4">
            <Sparkles className="w-4 h-4" /> How Pricing Works
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {/* Free Tier */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-sm">Free Tier</div>
                  <div className="text-emerald-300 text-xs font-semibold">₹0</div>
                </div>
              </div>
              <ul className="space-y-1.5 text-xs text-stone-300">
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>1 free invitation per account</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>Published with small non-intrusive ads</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>Watch a short rewarded ad to publish</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>All features: Maps, Countdown, RSVP, Photos</span>
                </li>
              </ul>
            </div>
            {/* Premium Tier */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/10 border border-amber-400/30 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center">
                  <BadgeCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-sm">Premium (Ad-Free)</div>
                  <div className="text-amber-300 text-xs font-semibold">₹399 one-time</div>
                </div>
              </div>
              <ul className="space-y-1.5 text-xs text-stone-300">
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span>No ads — completely ad-free experience</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span>No watermarks — clean, premium design</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span>Can publish unlimited additional templates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span>Upgrade any free invitation to ad-free at any time</span>
                </li>
              </ul>
            </div>
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

          {/* 2. Two-Tier Pricing Model */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ink)] flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-stone-700 text-xs font-bold">2</span>
              <span>Free &amp; Premium Tiers — How It Works</span>
            </h2>
            <p>
              Web Invites offers a <strong>two-tier pricing model</strong> for digital wedding invitations:
            </p>

            <div className="space-y-4 mt-4">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-900 mb-2">
                  <Gift className="w-4 h-4 text-emerald-600" />
                  Free Tier — ₹0
                </div>
                <ul className="list-disc pl-6 space-y-1.5 text-sm text-emerald-800/90">
                  <li>Each account gets <strong>1 free invitation</strong> at no cost.</li>
                  <li>To publish, you watch a short rewarded video ad (typically 15–30 seconds).</li>
                  <li>The published invitation <strong>includes small, non-intrusive advertisements</strong> (Google Adsense / ad network banners) to support the free tier.</li>
                  <li>All features are included: live inline editor, Google Maps directions, countdown timer, RSVP, couple photo upload, and WhatsApp sharing.</li>
                  <li>You may <strong>edit and re-publish</strong> your free invitation as many times as needed — no extra charge.</li>
                  <li>If you delete your free invitation from the Dashboard, you can publish another free invitation (still limited to 1 active free invitation at a time).</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-900 mb-2">
                  <BadgeCheck className="w-4 h-4 text-amber-600" />
                  Premium Tier (Ad-Free) — ₹399
                </div>
                <ul className="list-disc pl-6 space-y-1.5 text-sm text-amber-800/90">
                  <li>A <strong>one-time flat fee of ₹399</strong> per invitation — no subscriptions, no recurring charges.</li>
                  <li>Your invitation is <strong>completely ad-free</strong> — no ads of any kind are shown to your guests.</li>
                  <li>No watermarks — your invitation looks clean and professional.</li>
                  <li>You can publish <strong>unlimited additional premium templates</strong> (₹399 each).</li>
                  <li>Payments are processed securely via <strong>Razorpay</strong> (UPI, Credit/Debit Cards, Net Banking).</li>
                  <li>You can <strong>upgrade a free invitation to premium at any time</strong> from your Dashboard — the live link stays the same, ads are simply removed.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. Ads on Free Invitations */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ink)] flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-stone-700 text-xs font-bold">3</span>
              <span>Advertisements on Free Invitations</span>
            </h2>
            <p>
              Free-tier invitations display small, non-intrusive advertisements served through third-party ad networks (such as Google Adsense). Here is what you need to know:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-stone-600">
              <li><strong>Ad Placement:</strong> Ads appear as small banners within the invitation page — they do not cover your content or block guest interaction.</li>
              <li><strong>Ad Content:</strong> Ads are served by third-party networks and are not selected or controlled by Web Invites. Ad content may vary by guest location and browsing history.</li>
              <li><strong>Removing Ads:</strong> You can remove all ads at any time by upgrading to Premium (₹399) from your Dashboard. This takes effect immediately — no re-publishing required.</li>
              <li><strong>No Data Collection by Web Invites:</strong> Web Invites does not collect or sell your guests&apos; personal data to advertisers. Ad networks may use cookies per their own privacy policies.</li>
            </ul>
          </section>

          {/* 4. Post-Publish 3-Edits Policy */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ink)] flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-stone-700 text-xs font-bold">4</span>
              <span>Post-Publish 3-Edits Policy</span>
            </h2>
            <p>
              To safeguard the stability of your shared wedding link and protect against unintended overwrites after distribution, each published invitation includes up to <strong>3 complimentary post-publish edits</strong> directly from your account dashboard.
            </p>
            <p>
              Any changes made within the 3 complimentary edits update your live link immediately without changing the URL. Once the 3-edit quota is reached, the invitation is locked. Any critical corrections required thereafter must be requested via our official support team.
            </p>
          </section>

          {/* 5. User-Uploaded Photos & Content */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ink)] flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-stone-700 text-xs font-bold">5</span>
              <span>User-Uploaded Content &amp; Photos</span>
            </h2>
            <p>
              You retain full ownership of all names, dates, text, and photos you upload to your invitation:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-stone-600">
              <li><strong>Permissions:</strong> You warrant that you have the right to use and display any photos or information you submit.</li>
              <li><strong>Prohibited Content:</strong> You may not upload offensive, defamatory, unlawful, or copyright-infringing content.</li>
              <li><strong>Storage:</strong> Images are compressed (to under 200KB) and stored securely for the duration of your hosted invitation.</li>
            </ul>
          </section>

          {/* 6. Payments & Security */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ink)] flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-stone-700 text-xs font-bold">6</span>
              <span>Payment Processing</span>
            </h2>
            <p>
              Premium tier payments on Web Invites are securely processed through <strong>Razorpay</strong> via UPI, Credit/Debit Cards, or Net Banking. Web Invites does not store your payment card numbers, UPI PINs, or banking passwords. All payment data is handled entirely by Razorpay&apos;s PCI-DSS compliant infrastructure.
            </p>
            <p>
              The free tier requires no payment. Publishing a free invitation involves watching a short rewarded video ad, which generates a small amount of ad revenue to cover hosting costs.
            </p>
          </section>

          {/* 7. Refund & Cancellation Policy */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ink)] flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-stone-700 text-xs font-bold">7</span>
              <span>Refund &amp; Cancellation Policy</span>
            </h2>
            <p>
              Because digital invitations are customized and generated instantly upon payment confirmation with full ad-free access, <strong>orders are non-refundable once published</strong>.
            </p>
            <p>
              If you experience a verified duplicate charge or technical failure that prevented access to your invitation link, please contact us within 48 hours for a prompt investigation and resolution.
            </p>
            <p>
              Free-tier invitations can be deleted at any time from your Dashboard at no cost. Deleting a free invitation unlocks your ability to publish another free template.
            </p>
          </section>

          {/* 8. Hosting Duration & Link Validity */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ink)] flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-stone-700 text-xs font-bold">8</span>
              <span>Hosting Duration &amp; Link Validity</span>
            </h2>
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-950 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Globe className="w-4 h-4 text-amber-700" />
                <span>Hosting Lifecycle Commitment</span>
              </div>
              <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed">
                <strong>Free Tier:</strong> Your invitation is hosted for <strong>21 days from the date of publishing</strong>. After 21 days, the link is taken down. To keep it live longer, upgrade to Premium (₹399) before the 21-day window expires.
                <br /><br />
                <strong>Premium Tier:</strong> Your invitation is hosted from the moment of payment until <strong>3 days after your specified event date</strong>. This gives you and your guests extended access well beyond the event itself.
              </p>
            </div>
          </section>

          {/* 9. Free Tier Limitations */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ink)] flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-stone-700 text-xs font-bold">9</span>
              <span>Free Tier Limitations</span>
            </h2>
            <p>
              The free tier is designed to let you try Web Invites before committing. Please note the following limitations:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-stone-600">
              <li><strong>One active free invitation at a time.</strong> You cannot have multiple free invitations published simultaneously. If you already have one, you must delete it before publishing another for free.</li>
              <li><strong>21-day hosting limit.</strong> Free invitations are automatically taken down 21 days after publishing. To keep your invitation live beyond 21 days, upgrade to Premium (₹399) before the expiry.</li>
              <li><strong>Ads are displayed</strong> on free invitations. Guests will see small ad banners on the page.</li>
              <li><strong>No watermark removal</strong> — free invitations may display a subtle &ldquo;Made with Web Invites&rdquo; badge. Upgrading to premium removes this.</li>
              <li><strong>Publishing requires a rewarded ad.</strong> You must watch a short video ad (15–30 seconds) before your free invitation goes live.</li>
            </ul>
            <p className="mt-3">
              To remove any of these limitations, upgrade to Premium for a one-time ₹399 payment per invitation.
            </p>
          </section>

          {/* 10. Upgrade Path */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ink)] flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-stone-700 text-xs font-bold">10</span>
              <span>Upgrading from Free to Premium</span>
            </h2>
            <p>
              You can upgrade any free invitation to premium at any time:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-stone-600">
              <li><strong>From the Dashboard:</strong> Find your free invitation and click &ldquo;Remove Ads&rdquo; — you&apos;ll be taken through the ₹399 Razorpay checkout.</li>
              <li><strong>During creation:</strong> When publishing, choose &ldquo;Pay ₹399 &amp; Go Ad-Free&rdquo; instead of the free option.</li>
              <li><strong>Your link stays the same.</strong> Upgrading does not change your invitation URL — guests who already have the link will see the ad-free version immediately.</li>
              <li><strong>No re-publishing needed.</strong> The upgrade happens server-side; your live site updates instantly.</li>
            </ul>
          </section>

          {/* 11. Intellectual Property */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ink)] flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-stone-700 text-xs font-bold">11</span>
              <span>Intellectual Property</span>
            </h2>
            <p>
              All template themes, graphic illustrations, typography systems, and underlying code on Web Invites are the intellectual property of Web Invites. Users are granted a limited, personal, non-transferable license to distribute their unique invitation link to wedding guests and family.
            </p>
          </section>

          {/* 12. Limitation of Liability */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ink)] flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-stone-700 text-xs font-bold">12</span>
              <span>Limitation of Liability</span>
            </h2>
            <p>
              Web Invites is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. In no event shall Web Invites or its operators be liable for any indirect, incidental, or consequential damages arising from the use of our services. Our total liability for any claim shall not exceed the amount paid for the specific invitation (₹399 for premium, ₹0 for free).
            </p>
          </section>

          {/* 13. Contact & Support */}
          <section className="space-y-4 pt-4 border-t border-stone-200">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ink)] flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-stone-700 text-xs font-bold">13</span>
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
