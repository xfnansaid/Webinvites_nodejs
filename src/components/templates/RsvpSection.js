'use client';

import React, { useState } from 'react';
import { MessageCircle, CheckCircle2, XCircle, User, Send, Sparkles } from 'lucide-react';

const THEME_STYLES = {
  gold: {
    container: 'bg-[#18130B]/90 border-[#D4AF37]/35 text-[#F5EBE0] shadow-[0_16px_40px_rgba(0,0,0,0.35)]',
    divider: 'bg-[#D4AF37]/40',
    badge: 'border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#F4E096]',
    titleColor: 'text-[#F4E096]',
    subtitleColor: 'text-[#D8C7A5]',
    highlightNames: 'text-[#FAF5E6]',
    labelColor: 'text-[#D4AF37]',
    inputBg: 'bg-[#231B10]/85 border-[#D4AF37]/25 text-[#FAF6ED] placeholder-[#9E8B6B] focus:border-[#D4AF37] focus:ring-[#D4AF37]/20',
    inputIcon: 'text-[#D4AF37]/70',
    pillAcceptActive: 'bg-[#D4AF37] text-[#18130B] font-extrabold border-[#D4AF37] shadow-md shadow-[#D4AF37]/20',
    pillDeclineActive: 'bg-[#2E271E] text-[#E0D3BC] font-bold border-[#D4AF37]/40',
    pillInactive: 'bg-[#231B10]/60 text-[#C4B495] border-[#D4AF37]/20 hover:border-[#D4AF37]/40 hover:bg-[#2B2114]',
    guestCountActive: 'bg-[#D4AF37] text-[#18130B] font-bold border-[#D4AF37]',
    guestCountInactive: 'bg-[#231B10]/70 text-[#D8C7A5] border-[#D4AF37]/20 hover:border-[#D4AF37]/40',
    button: 'bg-gradient-to-r from-[#25D366] to-[#1ebe5d] hover:brightness-105 text-white shadow-lg shadow-[#25D366]/20',
    footnote: 'text-[#A89878]',
    sparkleColor: 'text-[#D4AF37]',
  },
  'dark-gold': {
    container: 'bg-[#0B1E1A]/92 border-[#D4AF37]/30 text-[#F7F5F0] shadow-[0_16px_40px_rgba(0,0,0,0.4)]',
    divider: 'bg-[#D4AF37]/35',
    badge: 'border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#F4E096]',
    titleColor: 'text-[#F4E096]',
    subtitleColor: 'text-[#A3B8B5]',
    highlightNames: 'text-[#FAF5E6]',
    labelColor: 'text-[#D4AF37]',
    inputBg: 'bg-[#122722]/85 border-[#D4AF37]/25 text-[#F7F5F0] placeholder-[#7F9A93] focus:border-[#D4AF37] focus:ring-[#D4AF37]/20',
    inputIcon: 'text-[#D4AF37]/70',
    pillAcceptActive: 'bg-[#D4AF37] text-[#0B1E1A] font-extrabold border-[#D4AF37] shadow-md shadow-[#D4AF37]/20',
    pillDeclineActive: 'bg-[#182C27] text-[#C6D8D4] font-bold border-[#D4AF37]/40',
    pillInactive: 'bg-[#122722]/60 text-[#9BB4AF] border-[#D4AF37]/20 hover:border-[#D4AF37]/40 hover:bg-[#1A342E]',
    guestCountActive: 'bg-[#D4AF37] text-[#0B1E1A] font-bold border-[#D4AF37]',
    guestCountInactive: 'bg-[#122722]/70 text-[#C6D8D4] border-[#D4AF37]/20 hover:border-[#D4AF37]/40',
    button: 'bg-gradient-to-r from-[#25D366] to-[#1ebe5d] hover:brightness-105 text-white shadow-lg shadow-[#25D366]/20',
    footnote: 'text-[#7F9A93]',
    sparkleColor: 'text-[#D4AF37]',
  },
  crimson: {
    container: 'bg-[#FFFDFB]/95 border-rose-900/20 text-[#2B1B17] shadow-[0_14px_35px_rgba(128,0,32,0.06)]',
    divider: 'bg-rose-900/25',
    badge: 'border-rose-900/20 bg-rose-50 text-rose-900',
    titleColor: 'text-rose-950',
    subtitleColor: 'text-[#6E4B43]',
    highlightNames: 'text-rose-950',
    labelColor: 'text-rose-900',
    inputBg: 'bg-white/95 border-rose-900/15 text-[#2B1B17] placeholder-[#A88E88] focus:border-rose-900 focus:ring-rose-900/15',
    inputIcon: 'text-rose-900/60',
    pillAcceptActive: 'bg-rose-900 text-white font-bold border-rose-900 shadow-md shadow-rose-900/20',
    pillDeclineActive: 'bg-stone-700 text-white font-bold border-stone-700',
    pillInactive: 'bg-white text-[#6E4B43] border-rose-900/15 hover:border-rose-900/30 hover:bg-rose-50/40',
    guestCountActive: 'bg-rose-900 text-white font-bold border-rose-900',
    guestCountInactive: 'bg-white text-stone-700 border-rose-900/15 hover:border-rose-900/30',
    button: 'bg-gradient-to-r from-[#25D366] to-[#1ebe5d] hover:brightness-105 text-white shadow-lg shadow-[#25D366]/20',
    footnote: 'text-[#8C6D65]',
    sparkleColor: 'text-rose-800',
  },
  emerald: {
    container: 'bg-[#0E241E]/92 border-emerald-500/25 text-[#E6F4F0] shadow-[0_16px_40px_rgba(0,0,0,0.35)]',
    divider: 'bg-emerald-500/35',
    badge: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
    titleColor: 'text-emerald-100',
    subtitleColor: 'text-emerald-200/80',
    highlightNames: 'text-emerald-50',
    labelColor: 'text-emerald-400',
    inputBg: 'bg-[#15342C]/85 border-emerald-500/20 text-emerald-50 placeholder-emerald-300/40 focus:border-emerald-400 focus:ring-emerald-400/20',
    inputIcon: 'text-emerald-400/70',
    pillAcceptActive: 'bg-emerald-600 text-white font-bold border-emerald-500 shadow-md shadow-emerald-600/30',
    pillDeclineActive: 'bg-[#1E3E34] text-emerald-200 font-bold border-emerald-600/40',
    pillInactive: 'bg-[#15342C]/60 text-emerald-200/70 border-emerald-500/15 hover:border-emerald-400/30 hover:bg-[#1C4238]',
    guestCountActive: 'bg-emerald-500 text-[#0E241E] font-bold border-emerald-400',
    guestCountInactive: 'bg-[#15342C]/70 text-emerald-200 border-emerald-500/20 hover:border-emerald-400/30',
    button: 'bg-gradient-to-r from-[#25D366] to-[#1ebe5d] hover:brightness-105 text-white shadow-lg shadow-[#25D366]/25',
    footnote: 'text-emerald-300/60',
    sparkleColor: 'text-emerald-400',
  },
  rose: {
    container: 'bg-[#FFF9F9]/95 border-rose-200/85 text-stone-800 shadow-[0_14px_35px_rgba(244,63,94,0.06)]',
    divider: 'bg-rose-300/60',
    badge: 'border-rose-200 bg-rose-50 text-rose-700',
    titleColor: 'text-rose-950',
    subtitleColor: 'text-stone-600',
    highlightNames: 'text-rose-900',
    labelColor: 'text-rose-800',
    inputBg: 'bg-white/95 border-rose-200/80 text-stone-800 placeholder-stone-400 focus:border-rose-400 focus:ring-rose-400/20',
    inputIcon: 'text-rose-400',
    pillAcceptActive: 'bg-rose-800 text-white font-bold border-rose-800 shadow-md shadow-rose-800/20',
    pillDeclineActive: 'bg-stone-700 text-white font-bold border-stone-700',
    pillInactive: 'bg-white text-stone-600 border-rose-200/70 hover:border-rose-300 hover:bg-rose-50/50',
    guestCountActive: 'bg-rose-800 text-white font-bold border-rose-800',
    guestCountInactive: 'bg-white text-stone-700 border-rose-200/70 hover:border-rose-300',
    button: 'bg-gradient-to-r from-[#25D366] to-[#1ebe5d] hover:brightness-105 text-white shadow-lg shadow-[#25D366]/20',
    footnote: 'text-stone-500',
    sparkleColor: 'text-rose-500',
  },
  navy: {
    container: 'bg-[#0A1628]/92 border-amber-400/25 text-slate-100 shadow-[0_16px_40px_rgba(0,0,0,0.4)]',
    divider: 'bg-amber-400/35',
    badge: 'border-amber-400/25 bg-amber-400/10 text-amber-300',
    titleColor: 'text-amber-100',
    subtitleColor: 'text-slate-300',
    highlightNames: 'text-amber-200',
    labelColor: 'text-amber-300',
    inputBg: 'bg-[#11233E]/85 border-slate-700/80 text-slate-100 placeholder-slate-400 focus:border-amber-400 focus:ring-amber-400/20',
    inputIcon: 'text-amber-400/70',
    pillAcceptActive: 'bg-amber-500 text-[#0A1628] font-extrabold border-amber-400 shadow-md shadow-amber-500/20',
    pillDeclineActive: 'bg-slate-800 text-slate-200 font-bold border-slate-700',
    pillInactive: 'bg-[#11233E]/60 text-slate-300 border-slate-700/60 hover:border-amber-400/30 hover:bg-[#172D4D]',
    guestCountActive: 'bg-amber-400 text-[#0A1628] font-bold border-amber-300',
    guestCountInactive: 'bg-[#11233E]/70 text-slate-300 border-slate-700/60 hover:border-amber-400/30',
    button: 'bg-gradient-to-r from-[#25D366] to-[#1ebe5d] hover:brightness-105 text-white shadow-lg shadow-[#25D366]/20',
    footnote: 'text-slate-400',
    sparkleColor: 'text-amber-400',
  },
  dark: {
    container: 'bg-zinc-900/92 border-amber-500/25 text-zinc-100 shadow-[0_16px_40px_rgba(0,0,0,0.5)]',
    divider: 'bg-amber-500/30',
    badge: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    titleColor: 'text-amber-100',
    subtitleColor: 'text-zinc-400',
    highlightNames: 'text-amber-200',
    labelColor: 'text-amber-400',
    inputBg: 'bg-zinc-800/85 border-zinc-700/80 text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:ring-amber-400/20',
    inputIcon: 'text-amber-400/70',
    pillAcceptActive: 'bg-amber-500 text-zinc-950 font-extrabold border-amber-400 shadow-md shadow-amber-500/20',
    pillDeclineActive: 'bg-zinc-800 text-zinc-200 font-bold border-zinc-700',
    pillInactive: 'bg-zinc-950/60 text-zinc-300 border-zinc-800 hover:border-amber-500/30 hover:bg-zinc-800/70',
    guestCountActive: 'bg-amber-400 text-zinc-950 font-bold border-amber-300',
    guestCountInactive: 'bg-zinc-800/70 text-zinc-300 border-zinc-700 hover:border-amber-500/30',
    button: 'bg-gradient-to-r from-[#25D366] to-[#1ebe5d] hover:brightness-105 text-white shadow-lg shadow-[#25D366]/20',
    footnote: 'text-zinc-400',
    sparkleColor: 'text-amber-400',
  },
  light: {
    container: 'bg-white/95 border-stone-200/90 text-stone-800 shadow-[0_14px_35px_rgba(0,0,0,0.05)] backdrop-blur-sm',
    divider: 'bg-stone-300',
    badge: 'border-stone-200 bg-stone-50 text-stone-700',
    titleColor: 'text-stone-900',
    subtitleColor: 'text-stone-600',
    highlightNames: 'text-stone-900',
    labelColor: 'text-stone-700',
    inputBg: 'bg-stone-50/70 border-stone-200/80 text-stone-800 placeholder-stone-400 focus:border-stone-400 focus:ring-stone-400/20 focus:bg-white',
    inputIcon: 'text-stone-400',
    pillAcceptActive: 'bg-stone-900 text-white font-bold border-stone-900 shadow-md shadow-stone-900/15',
    pillDeclineActive: 'bg-stone-200 text-stone-800 font-bold border-stone-300',
    pillInactive: 'bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:bg-stone-50',
    guestCountActive: 'bg-stone-900 text-white font-bold border-stone-900',
    guestCountInactive: 'bg-stone-100 text-stone-700 border-stone-200 hover:border-stone-300',
    button: 'bg-gradient-to-r from-[#25D366] to-[#1ebe5d] hover:brightness-105 text-white shadow-lg shadow-[#25D366]/20',
    footnote: 'text-stone-500',
    sparkleColor: 'text-amber-500',
  },
};

/**
 * Universal Responsive WhatsApp RSVP Section for Web Invites templates.
 * Redesigned for luxury aesthetics, clean minimal layout, tactile mobile inputs, and matching theme palettes.
 */
export default function RsvpSection({
  groomName = 'Groom',
  brideName = 'Bride',
  whatsappNumber = '',
  theme = 'light',
  className = '',
}) {
  const [guestName, setGuestName] = useState('');
  const [attending, setAttending] = useState('yes'); // 'yes' | 'no'
  const [guestCount, setGuestCount] = useState('1');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const currentTheme = THEME_STYLES[theme] || THEME_STYLES.light;

  // Sanitize WhatsApp number (ensure country code e.g. 919876543210)
  const cleanPhone = (whatsappNumber || '').replace(/[^\d]/g, '');

  const isBirthday = typeof brideName === 'string' && brideName.toLowerCase().includes('birthday');
  const isHousewarming = typeof brideName === 'string' && brideName.toLowerCase().includes('housewarming');

  const handleSendRsvp = (e) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setError('Please enter your name');
      return;
    }
    setError('');

    let headerTitle = `*RSVP for ${groomName} & ${brideName}'s Celebration* ✨`;
    if (isBirthday) {
      headerTitle = `*RSVP for ${groomName}'s ${brideName}* 🎂`;
    } else if (isHousewarming) {
      headerTitle = `*RSVP for ${groomName}'s Housewarming* 🏡`;
    }

    const statusText = attending === 'yes' ? '✅ Joyfully Accepts' : '❌ Regretfully Declines';
    const guestsText = attending === 'yes' ? `👥 Guests: ${guestCount}` : '';
    const wishText = message.trim() ? `\n💬 *Wish*: "${message.trim()}"` : '';

    const textMsg = 
      `${headerTitle}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Name*: ${guestName.trim()}\n` +
      `✨ *Status*: ${statusText}\n` +
      (guestsText ? `${guestsText}\n` : '') +
      wishText + `\n\n` +
      `Sent via Web Invites`;

    const targetPhone = cleanPhone || '919876543210';
    const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(textMsg)}`;

    setSubmitted(true);

    // Open WhatsApp after brief tactile feedback
    setTimeout(() => {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }, 300);
  };

  const guestCountOptions = ['1', '2', '3', '4', '5+'];

  return (
    <section id="rsvp-section" className={`w-full my-8 sm:my-12 px-2 sm:px-4 ${className}`}>
      <div className={`relative overflow-hidden rounded-[28px] sm:rounded-[32px] border p-5 sm:p-7 md:p-8 transition-all backdrop-blur-md ${currentTheme.container}`}>
        
        {/* Subtle top decorative header */}
        <div className="text-center mb-5 sm:mb-6">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <span className={`h-px w-6 sm:w-8 ${currentTheme.divider}`} />
            <Sparkles className={`w-3.5 h-3.5 ${currentTheme.sparkleColor}`} />
            <span className={`h-px w-6 sm:w-8 ${currentTheme.divider}`} />
          </div>

          <h3 className={`font-display text-lg sm:text-xl font-bold tracking-[0.2em] uppercase ${currentTheme.titleColor}`}>
            RSVP
          </h3>

          <p className={`text-[11.5px] sm:text-[13px] mt-1 font-normal max-w-xs sm:max-w-sm mx-auto leading-relaxed ${currentTheme.subtitleColor}`}>
            {isBirthday ? (
              <>Kindly respond to let <span className={`font-semibold ${currentTheme.highlightNames}`}>{groomName}</span> know if you will attend</>
            ) : isHousewarming ? (
              <>Kindly respond to let <span className={`font-semibold ${currentTheme.highlightNames}`}>{groomName}</span> know if you can join</>
            ) : (
              <>Kindly respond to let <span className={`font-semibold ${currentTheme.highlightNames}`}>{groomName} &amp; {brideName}</span> know if you can join</>
            )}
          </p>
        </div>

        {submitted ? (
          <div className="py-6 text-center space-y-3 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-inner">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className={`text-base sm:text-lg font-bold ${currentTheme.titleColor}`}>Opening WhatsApp…</h4>
            <p className={`text-xs max-w-xs mx-auto leading-relaxed ${currentTheme.subtitleColor}`}>
              Your RSVP details are ready. If WhatsApp doesn't launch automatically, tap the button below:
            </p>
            <button
              type="button"
              onClick={handleSendRsvp}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#25D366] text-white font-bold text-xs shadow-md hover:bg-[#20bd5a] transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-current" /> Open WhatsApp
            </button>
            <div>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className={`text-[11px] underline mt-1.5 opacity-70 hover:opacity-100 ${currentTheme.subtitleColor}`}
              >
                Send another response
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSendRsvp} className="space-y-3.5 text-left max-w-md mx-auto">
            
            {/* Guest Name */}
            <div>
              <label className={`block text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] mb-1.5 ${currentTheme.labelColor}`}>
                Your Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${currentTheme.inputIcon}`} />
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => { setGuestName(e.target.value); setError(''); }}
                  placeholder="e.g. Sameer & Family"
                  className={`w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-2xl border text-xs sm:text-sm outline-none transition-all font-medium ${currentTheme.inputBg}`}
                />
              </div>
              {error && <p className="text-[10.5px] font-semibold text-rose-500 mt-1">{error}</p>}
            </div>

            {/* Attendance Toggle Segment */}
            <div>
              <label className={`block text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] mb-1.5 ${currentTheme.labelColor}`}>
                Will You Attend?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAttending('yes')}
                  className={`flex items-center justify-center gap-1.5 p-2.5 sm:p-3 rounded-2xl border text-[11.5px] sm:text-[12.5px] transition-all active:scale-[0.98] ${
                    attending === 'yes' ? currentTheme.pillAcceptActive : currentTheme.pillInactive
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Joyfully Accept</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAttending('no')}
                  className={`flex items-center justify-center gap-1.5 p-2.5 sm:p-3 rounded-2xl border text-[11.5px] sm:text-[12.5px] transition-all active:scale-[0.98] ${
                    attending === 'no' ? currentTheme.pillDeclineActive : currentTheme.pillInactive
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Regretfully Decline</span>
                </button>
              </div>
            </div>

            {/* Guest Count (Pills) — Smoothly appears only when attending */}
            {attending === 'yes' && (
              <div className="animate-in slide-in-from-top-1 fade-in duration-200 pt-0.5">
                <label className={`block text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] mb-1.5 ${currentTheme.labelColor}`}>
                  Number of Guests
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {guestCountOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setGuestCount(opt)}
                      className={`py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all active:scale-95 text-center ${
                        guestCount === opt ? currentTheme.guestCountActive : currentTheme.guestCountInactive
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Warm Wish Note (Optional) */}
            <div>
              <label className={`block text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] mb-1.5 ${currentTheme.labelColor}`}>
                Heartfelt Wish <span className="opacity-60 lowercase font-normal">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share a blessing or note for the couple…"
                className={`w-full px-3.5 py-2 sm:py-2.5 rounded-2xl border text-xs sm:text-sm outline-none transition-all font-medium resize-none leading-relaxed ${currentTheme.inputBg}`}
              />
            </div>

            {/* CTA WhatsApp Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                className={`w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 px-5 rounded-2xl font-bold text-xs sm:text-sm tracking-wide transition-all active:scale-[0.98] group ${currentTheme.button}`}
              >
                <MessageCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-current" />
                <span>Send RSVP via WhatsApp</span>
                <Send className="w-3.5 h-3.5 opacity-80 transition-transform group-hover:translate-x-0.5" />
              </button>

              {cleanPhone && (
                <p className={`text-[10px] text-center mt-2 font-medium tracking-wide ${currentTheme.footnote}`}>
                  Pre-fills message to <span className="font-semibold opacity-90">+{cleanPhone}</span>
                </p>
              )}
            </div>

          </form>
        )}
      </div>
    </section>
  );
}
