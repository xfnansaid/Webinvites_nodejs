'use client';

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { templates } from '@/components/templates';
import PaymentBanner from '@/components/PaymentBanner';
import { ChevronLeft, Palette, MousePointerClick, RotateCcw, Sparkles, CheckCircle2, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

const sectionHints = [
  { id: 1, title: "1 · Hero (Couple Names + Event Details)", desc: "Tap the couple names, tagline, event text, date, time, or venue in the top section to personalize." },
  { id: 2, title: "2 · Find Us (Venue + Get Directions)", desc: "Tap the venue name or address in the Find Us card. Click Get Directions to test the Google Maps link." },
  { id: 3, title: "3 · Countdown Timer", desc: "Tap the countdown heading above the days/hours/minutes counter. The timer updates live from the wedding date." }
];

const defaults = {
  groomName: "Rizwan",
  brideName: "Ayesha",
  weddingDate: "2026-12-25",
  weddingTime: "10:00 AM",
  venue: "Grand Palace Auditorium",
  venueAddress: "Beach Road, Calicut, Kerala 673001, India",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Calicut+Kerala",
  whatsappNumber: "919876543210",
  groomParents: "",
  brideParents: "",
  heroTagline: "With the blessings of our families, we invite you to share in our joy",
  heroEventText: "as we embark on this beautiful journey together",
  countdownTitle: "Counting Every Moment"
};

export default function CreatePage() {
  const { templateId } = useParams();
  const templateExists = Boolean(templates[templateId]);
  const TemplateComponent = templates[templateId] || templates['standard-crimson'];

  const [formData, setFormData] = useState(defaults);
  const [showHint, setShowHint] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(true); // expanded by default so users fill details first

  const handleInlineEdit = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetAll = () => {
    if (typeof window !== 'undefined' && window.confirm("Reset all edited text to defaults?")) {
      setFormData({ ...defaults });
    }
  };

  const editsCount = useMemo(() => {
    let n = 0;
    Object.keys(defaults).forEach(k => {
      if (String(formData[k] ?? "") !== String(defaults[k] ?? "")) n++;
    });
    return n;
  }, [formData]);

  const summaryFields = [
    { label: "Bride's Full Name", value: formData.brideName, field: "brideName", placeholder: "e.g. Ayesha Fathima" },
    { label: "Groom's Full Name", value: formData.groomName, field: "groomName", placeholder: "e.g. Rizwan Ahmed" },
    { label: "Tagline (above names)", value: formData.heroTagline, field: "heroTagline", placeholder: "Together with their families…" },
    { label: "Event Text", value: formData.heroEventText, field: "heroEventText", placeholder: "are entering into Nikah, insha'Allah" },
    { label: "Wedding Date", value: formData.weddingDate, field: "weddingDate", type: "date", placeholder: "YYYY-MM-DD" },
    { label: "Wedding Time", value: formData.weddingTime, field: "weddingTime", placeholder: "e.g. 10:00 AM" },
    { label: "Venue", value: formData.venue, field: "venue", placeholder: "Hall, Auditorium, Mosque" },
    { label: "Full Address", value: formData.venueAddress, field: "venueAddress", multiline: true, placeholder: "Street, City, State, Pincode" },
    { label: "Google Maps URL", value: formData.mapsUrl, field: "mapsUrl", type: "url", placeholder: "https://www.google.com/maps/search/?api=1&query=..." },
    { label: "WhatsApp Number", value: formData.whatsappNumber, field: "whatsappNumber", type: "tel", placeholder: "91XXXXXXXXXX" },
    { label: "Bride's Parents", value: formData.brideParents, field: "brideParents", placeholder: "Smt. Mariam & Sri. Fathima Ali" },
    { label: "Groom's Parents", value: formData.groomParents, field: "groomParents", placeholder: "Smt. Zohra & Sri. Ahmed Khan" },
    { label: "Countdown Heading", value: formData.countdownTitle, field: "countdownTitle", placeholder: "Counting Down to Forever" },
  ];

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#FAF8F5] text-[var(--ink)] selection:bg-[var(--emerald-primary)]/30">
      {/* WYSIWYG Editor Header */}
      <header className="bg-white/95 backdrop-blur-xl border-b border-[var(--border-subtle)] sticky top-0 z-[90] px-3 sm:px-4 md:px-8 py-2.5 sm:py-3 md:py-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link href="/" className="p-2 sm:p-2.5 -ml-1 hover:bg-gray-100 rounded-full transition-colors text-[var(--ink-soft)] shrink-0 active:scale-95" aria-label="Back to templates">
              <ChevronLeft className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-0.5 sm:mb-1">
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-[var(--ink)] leading-none truncate">
                  Live Editor
                </h2>

              </div>
              <p className="text-[10px] sm:text-[11px] md:text-xs text-[var(--ink-muted)] font-medium uppercase tracking-[0.12em] truncate">
                {String(templateId).replace(/-/g, ' ')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
            <button
              onClick={resetAll}
              className="inline-flex items-center justify-center gap-1 p-2 sm:px-3 sm:py-2.5 text-xs md:text-sm font-bold text-[var(--ink-soft)] hover:bg-gray-100 rounded-xl transition-all active:scale-95 shrink-0"
              title="Reset to defaults"
              aria-label="Reset edits"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden md:inline">Reset</span>
            </button>

            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-gray-50 rounded-xl border border-gray-100 min-h-[40px]">
              {editsCount > 0 ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--emerald-primary)] shrink-0" />
                  <span className="text-[11px] sm:text-xs md:text-sm font-bold text-[var(--ink)] leading-none">
                    {editsCount}
                    <span className="hidden sm:inline"> edit{editsCount === 1 ? '' : 's'}</span>
                  </span>
                </>
              ) : (
                <>
                  <MousePointerClick className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--ink-muted)] shrink-0 hidden sm:block" />
                  <span className="text-[10px] sm:text-xs md:text-sm font-bold text-[var(--ink-muted)] leading-none whitespace-nowrap">
                    Tap to edit
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {!templateExists && (
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 md:px-8 pt-4 sm:pt-6">
          <div className="relative bg-amber-50 border-2 border-amber-300/70 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[0_16px_40px_rgba(180,83,9,0.12)] overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/4 w-40 sm:w-56 h-40 sm:h-56 bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex items-start gap-3 sm:gap-4 pr-8 sm:pr-10">
              <div className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white border border-amber-200 shadow-inner flex items-center justify-center text-amber-700">
                <Sparkles className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-amber-900 text-[15px] sm:text-base md:text-lg leading-tight mb-1">
                  Showing a template preview from our gallery
                </h3>
                <p className="text-[12px] sm:text-sm md:text-[15px] text-amber-800/90 leading-relaxed">
                  The template you selected is no longer available. You're now previewing our popular{" "}
                  <strong className="font-semibold">Standard Crimson</strong> design with the exact same live editor.
                </p>
                <div className="mt-3 sm:mt-4 flex flex-wrap gap-2 sm:gap-3">
                  <Link
                    href="/templates"
                    className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-700/20 transition-all active:scale-[0.98]"
                  >
                    <Palette className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                    Choose a different template
                  </Link>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-white hover:bg-amber-50 text-amber-800 font-semibold text-xs sm:text-sm border border-amber-200 transition-colors active:scale-[0.98]"
                  >
                    Back to home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-[1400px] mx-auto px-3 sm:px-4 md:px-8 pt-4 sm:pt-6 md:pt-8 pb-[240px] sm:pb-[260px]">
        {/* Hint Panel */}
        {showHint && (
          <div className="relative bg-gradient-to-br from-[var(--emerald-light)] to-white border border-[var(--emerald-primary)]/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 mb-5 sm:mb-8 md:mb-10 overflow-hidden shadow-sm">
            <button
              onClick={() => setShowHint(false)}
              className="absolute top-3 right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors font-bold z-10 shrink-0"
              aria-label="Close tips"
            >
              ×
            </button>
            <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-5 pr-8 sm:pr-10">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white shadow-inner flex items-center justify-center text-[var(--emerald-primary)] shrink-0">
                <MousePointerClick className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-lg sm:text-xl md:text-2xl text-[var(--ink)] mb-1 leading-tight">Tap any text to edit</h3>
                <p className="text-[13px] sm:text-sm md:text-lg text-[var(--ink-muted)] leading-relaxed">
                  Canva-style editor — tap text in phone preview → type → press Enter or tap away to save. Press Esc to cancel.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
              {sectionHints.map(h => (
                <div key={h.id} className="bg-white/80 backdrop-blur rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 border border-white/90">
                  <div className="text-[var(--emerald-primary)] font-bold text-[10px] sm:text-xs uppercase tracking-widest mb-1 sm:mb-2">Section {h.id}</div>
                  <h4 className="font-bold text-[var(--ink)] mb-1 text-[13px] sm:text-sm md:text-base leading-snug">{h.title.split('·')[1]?.trim() || h.title}</h4>
                  <p className="text-[var(--ink-muted)] text-[11px] sm:text-xs md:text-sm leading-relaxed">{h.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Editor + Info Layout: DETAILS FIRST (fill form), then PHONE PREVIEW (see live edits) */}
        <div className="flex flex-col lg:flex-row gap-5 sm:gap-8 lg:gap-12 items-start">
          {/* Live Data Panel — expanded by default so user fills details first */}
          <div className="flex-1 w-full space-y-4 sm:space-y-6 order-1 lg:order-none">
            {/* Live Summary accordion */}
            <details open={detailsOpen} className={detailsOpen ? "bg-white rounded-3xl border border-[var(--border-subtle)] shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden" : "bg-white rounded-3xl border border-[var(--border-subtle)] shadow-sm overflow-hidden"}>
              <summary
                onClick={(e) => { e.preventDefault(); setDetailsOpen(o => !o); }}
                className="cursor-pointer list-none select-none"
              >
                <div className="p-5 sm:p-6 md:p-7 flex items-center justify-between gap-3 bg-gradient-to-r from-white to-[var(--emerald-light)]/30 hover:from-[var(--emerald-light)]/10 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[var(--emerald-light)] text-[var(--emerald-primary)] flex items-center justify-center shadow-inner shrink-0">
                      <Palette className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display text-lg md:text-xl text-[var(--ink)] truncate">Invitation Details</h3>
                      <p className="text-xs sm:text-sm text-[var(--ink-muted)] truncate">
                        <span className="lg:hidden">Tap to {detailsOpen ? 'collapse' : 'expand'} · </span>
                        Fill in bride & groom details first — preview updates below
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {detailsOpen ? (
                      <ChevronUp className="w-5 h-5 text-[var(--emerald-primary)]" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[var(--ink-muted)]" />
                    )}
                  </div>
                </div>
              </summary>

              {detailsOpen && (
                <div className="p-4 sm:p-6 md:p-7 border-t border-[var(--border-subtle)] space-y-2 sm:space-y-3 animate-in slide-in-from-top-4 fade-in duration-300">
                  {summaryFields.map(row => (
                    <div
                      key={row.field}
                      className="grid grid-cols-1 sm:grid-cols-[180px_1fr] md:grid-cols-[220px_1fr] items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-[10px] sm:text-[11px] font-bold text-[var(--ink-muted)] uppercase tracking-[0.15em] pt-1.5 shrink-0">{row.label}</span>
                      <div className="min-w-0">
                        {row.multiline ? (
                          <textarea
                            value={row.value ?? ""}
                            onChange={(e) => handleInlineEdit(row.field, e.target.value)}
                            rows={Math.max(2, String(row.value ?? "").split("\n").length)}
                            className="w-full resize-y bg-transparent font-semibold text-[13px] sm:text-sm md:text-base text-[var(--ink)] placeholder:text-[var(--ink-muted)]/60 outline-none focus:ring-2 focus:ring-[var(--emerald-primary)]/40 rounded-lg px-2 py-1.5 -mx-2 transition-all border border-transparent focus:border-[var(--emerald-primary)]/30 focus:bg-white min-h-[64px]"
                            placeholder={row.placeholder || `Enter ${row.label.toLowerCase()}`}
                          />
                        ) : (
                          <input
                            type={row.type || "text"}
                            value={row.value ?? ""}
                            onChange={(e) => handleInlineEdit(row.field, e.target.value)}
                            className="w-full bg-transparent font-semibold text-[13px] sm:text-sm md:text-base text-[var(--ink)] placeholder:text-[var(--ink-muted)]/60 outline-none focus:ring-2 focus:ring-[var(--emerald-primary)]/40 rounded-lg px-2 py-1.5 -mx-2 transition-all border border-transparent focus:border-[var(--emerald-primary)]/30 focus:bg-white min-h-[40px]"
                            placeholder={row.placeholder || `Enter ${row.label.toLowerCase()}`}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 sm:pt-3">
                    <p className="text-[11px] sm:text-xs text-[var(--ink-muted)] italic text-center bg-[var(--emerald-light)]/30 py-2.5 px-3 sm:px-4 rounded-xl leading-relaxed">
                      💡 Tip: after filling these fields, tap directly on the text in the phone preview below for pixel-perfect inline edits.
                    </p>
                  </div>
                </div>
              )}
            </details>

            {/* Purchase Summary */}
            <div className="bg-gradient-to-br from-[var(--emerald-primary)] to-[var(--emerald-dark)] rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-7 text-white shadow-[0_30px_80px_rgba(15,56,44,0.25)] relative overflow-hidden">
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-40 sm:w-56 h-40 sm:h-56 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-5">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-white/15 backdrop-blur px-2.5 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-2 sm:mb-3 border border-white/20 shrink-0">
                    <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Secure payment method
                  </div>

                  <p className="text-white/80 text-sm sm:text-base max-w-sm leading-relaxed">
                    Secure Razorpay checkout. Publishes your invitation & generates your unique shareable WhatsApp-ready link.
                  </p>
                </div>
                <div className="sm:text-right space-y-1 sm:space-y-2 text-xs sm:text-sm w-full sm:w-auto">
                  <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--champagne-500)] shrink-0" />
                    <span className="font-medium whitespace-nowrap">Every template includes everything</span>
                  </div>
                  <div className="block text-xs text-white/70 font-medium leading-relaxed">
                    Unlimited edits · No time limits · Publish when ready
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Phone Preview (edge-to-edge on mobile) — renders SECOND so it shows the filled-in details */}
          <div className="w-full lg:w-auto mx-auto lg:mx-0 shrink-0 order-2 lg:order-none">
            <div className="relative">
              {/* Glow background on desktop */}
              <div className="hidden md:block absolute -inset-4 md:-inset-6 rounded-[3rem] bg-gradient-to-br from-[var(--emerald-primary)]/15 via-[var(--champagne-500)]/10 to-transparent blur-2xl pointer-events-none"></div>

              <div
                className="
                  relative
                  bg-[#111]
                  shadow-[0_60px_120px_-20px_rgba(0,0,0,0.35)]
                  rounded-[2.5rem] sm:rounded-[3rem]
                  overflow-hidden
                  /* MOBILE: full-screen edge-to-edge with iPhone 12/13/14 aspect (393:852 ≈ 1:2.168) */
                  aspect-[393/852]
                  w-full
                  /* DESKTOP (sm+): LOCKED to exact iPhone viewport 393x852 for 1:1 cqw accuracy — do not use 380/420px widths */
                  sm:w-[393px]
                  sm:h-[852px]
                  sm:aspect-auto
                  border-[6px] sm:border-[10px] border-[#0d0d0d]
                  ring-1 ring-white/10
                "
              >
                {/* Status bar */}
                <div className="absolute top-0 left-0 right-0 h-[30px] sm:h-8 z-[65] flex items-center justify-between px-4 sm:px-6 text-white/80 text-[10px] sm:text-[11px] font-semibold bg-gradient-to-b from-black/30 to-transparent pointer-events-none">
                  <span>9:41</span>
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white/70"></div>
                </div>

                {/* Dynamic Island */}
                <div className="absolute top-[6px] sm:top-2 left-1/2 -translate-x-1/2 w-[96px] sm:w-28 h-[22px] sm:h-7 bg-black rounded-full z-[70] flex items-center justify-center">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#1a1a1a] mr-1.5 sm:mr-2"></div>
                </div>

                {/* Scrollable Template Content (inline editable, no watermarks) */}
                <div className="absolute inset-0 overflow-y-auto hide-scrollbar pt-[38px] sm:pt-[42px] pb-6 sm:pb-8 [-webkit-overflow-scrolling:touch]">
                  <div className="WebInvitesPreviewContainer" style={{ containerType: 'inline-size', width: '100%', maxWidth: '100%' }}><TemplateComponent
                    key={templateId}
                    data={formData}
                    isDraft={false}
                    editable={true}
                    onEdit={handleInlineEdit}
                  /></div>
                </div>

                {/* Home Indicator */}
                <div className="absolute bottom-[6px] sm:bottom-2 left-1/2 -translate-x-1/2 w-[96px] sm:w-28 h-1 rounded-full bg-white/40 z-[70]"></div>
              </div>

              {/* Phone Caption */}
              <div className="mt-4 sm:mt-6 flex items-center justify-center gap-2 text-[var(--ink-muted)] text-[12px] sm:text-sm font-medium">
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--emerald-primary)]" />
                Live preview · all changes applied instantly
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Payment Banner (safe-area aware on mobile — above home indicator, always visible) */}
      <div
        className="
          fixed bottom-0 left-0 right-0 z-[95]
          animate-in slide-in-from-bottom-8 fade-in duration-500
          /* iOS / mobile safe area */
          pb-[env(safe-area-inset-bottom)]
          supports-[padding-bottom:env(safe-area-inset-bottom)]:pb-[max(0px,env(safe-area-inset-bottom))]
          pointer-events-auto
        "
      >
        <PaymentBanner formData={formData} templateId={templateId} />
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
