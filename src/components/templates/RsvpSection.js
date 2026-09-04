'use client';

import React, { useState } from 'react';
import { MessageCircle, CheckCircle2, XCircle, User, Send, Sparkles } from 'lucide-react';
import SharedEditable from './_Editable';

const THEME_STYLES = {
  gold: {
    container: 'bg-white/95 border-amber-200/90 text-stone-800 shadow-[0_14px_35px_rgba(180,120,40,0.06)] backdrop-blur-sm',
    divider: 'bg-amber-300/70',
    badge: 'border-amber-200 bg-amber-50 text-amber-900',
    titleColor: 'text-amber-950',
    subtitleColor: 'text-stone-600',
    highlightNames: 'text-amber-900',
    labelColor: 'text-amber-950',
    inputBg: 'bg-amber-50/40 border-amber-200/80 text-stone-800 placeholder-stone-400 focus:border-amber-600 focus:ring-amber-500/20 focus:bg-white',
    inputIcon: 'text-amber-700',
    pillAcceptActive: 'bg-amber-700 text-white font-bold border-amber-700 shadow-md shadow-amber-700/20',
    pillDeclineActive: 'bg-stone-700 text-white font-bold border-stone-700',
    pillInactive: 'bg-white text-stone-600 border-amber-200/80 hover:border-amber-300 hover:bg-amber-50/40',
    guestCountActive: 'bg-amber-700 text-white font-bold border-amber-700',
    guestCountInactive: 'bg-white text-stone-700 border-amber-200/80 hover:border-amber-300 hover:bg-amber-50/40',
    button: 'bg-gradient-to-r from-[#25D366] to-[#1ebe5d] hover:brightness-105 text-white shadow-lg shadow-[#25D366]/20',
    footnote: 'text-stone-500',
    sparkleColor: 'text-amber-600',
  },
  'dark-gold': {
    container: 'bg-zinc-950/90 border-amber-500/30 text-zinc-100 shadow-[0_16px_40px_rgba(0,0,0,0.6)] backdrop-blur-md',
    divider: 'bg-amber-500/35',
    badge: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    titleColor: 'text-[#F5D77F]',
    subtitleColor: 'text-amber-100/70',
    highlightNames: 'text-[#FAF5E6]',
    labelColor: 'text-amber-400',
    inputBg: 'bg-zinc-900/90 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:ring-amber-400/20',
    inputIcon: 'text-amber-400/80',
    pillAcceptActive: 'bg-amber-500 text-zinc-950 font-extrabold border-amber-400 shadow-md shadow-amber-500/20',
    pillDeclineActive: 'bg-zinc-800 text-zinc-200 font-bold border-zinc-700',
    pillInactive: 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-800/80',
    guestCountActive: 'bg-amber-500 text-zinc-950 font-bold border-amber-400 shadow-md shadow-amber-500/20',
    guestCountInactive: 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-800/80',
    button: 'bg-gradient-to-r from-[#25D366] to-[#1ebe5d] hover:brightness-105 text-white shadow-lg shadow-[#25D366]/20 font-bold',
    footnote: 'text-zinc-400',
    sparkleColor: 'text-amber-400',
  },
  'royal-nikah': {
    container: 'bg-[#0B231E]/95 border-[#D4AF37]/35 text-[#F7F5F0] shadow-[0_18px_45px_rgba(0,0,0,0.5)] backdrop-blur-md',
    divider: 'bg-[#D4AF37]/35',
    badge: 'border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#F4E096]',
    titleColor: 'text-[#F4E096]',
    subtitleColor: 'text-[#B8CCC8]',
    highlightNames: 'text-[#FAF5E6]',
    labelColor: 'text-[#D4AF37]',
    inputBg: 'bg-[#061412]/90 border-[#D4AF37]/25 text-[#F7F5F0] placeholder-[#7A9993] focus:border-[#D4AF37] focus:ring-[#D4AF37]/20',
    inputIcon: 'text-[#D4AF37]',
    pillAcceptActive: 'bg-[#D4AF37] text-[#061412] font-extrabold border-[#D4AF37] shadow-md shadow-[#D4AF37]/25',
    pillDeclineActive: 'bg-[#15342E] text-[#D8E6E3] font-bold border-[#D4AF37]/40',
    pillInactive: 'bg-[#061412]/80 text-[#ADC4C0] border-[#D4AF37]/20 hover:border-[#D4AF37]/40 hover:bg-[#15342E]/70',
    guestCountActive: 'bg-[#D4AF37] text-[#061412] font-bold border-[#D4AF37]',
    guestCountInactive: 'bg-[#061412]/80 text-[#C5D6D2] border-[#D4AF37]/20 hover:border-[#D4AF37]/40',
    button: 'bg-gradient-to-r from-[#25D366] to-[#1ebe5d] hover:brightness-105 text-white shadow-lg shadow-[#25D366]/20 font-bold',
    footnote: 'text-[#8EA8A2]',
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
    container: 'bg-white/95 border-emerald-100 text-stone-800 shadow-[0_14px_35px_rgba(20,83,45,0.06)] backdrop-blur-sm',
    divider: 'bg-emerald-300/70',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    titleColor: 'text-emerald-950',
    subtitleColor: 'text-stone-600',
    highlightNames: 'text-emerald-800',
    labelColor: 'text-emerald-900',
    inputBg: 'bg-emerald-50/40 border-emerald-200/80 text-stone-800 placeholder-stone-400 focus:border-emerald-600 focus:ring-emerald-500/20 focus:bg-white',
    inputIcon: 'text-emerald-600',
    pillAcceptActive: 'bg-emerald-700 text-white font-bold border-emerald-700 shadow-md shadow-emerald-700/20',
    pillDeclineActive: 'bg-stone-700 text-white font-bold border-stone-700',
    pillInactive: 'bg-white text-stone-600 border-emerald-200/80 hover:border-emerald-300 hover:bg-emerald-50/40',
    guestCountActive: 'bg-emerald-700 text-white font-bold border-emerald-700',
    guestCountInactive: 'bg-white text-stone-700 border-emerald-200/80 hover:border-emerald-300 hover:bg-emerald-50/40',
    button: 'bg-gradient-to-r from-[#25D366] to-[#1ebe5d] hover:brightness-105 text-white shadow-lg shadow-[#25D366]/25',
    footnote: 'text-stone-500',
    sparkleColor: 'text-emerald-600',
  },
  sage: {
    container: 'bg-white/95 border-emerald-100 text-stone-800 shadow-[0_14px_35px_rgba(20,83,45,0.06)] backdrop-blur-sm',
    divider: 'bg-emerald-300/70',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    titleColor: 'text-emerald-950',
    subtitleColor: 'text-stone-600',
    highlightNames: 'text-emerald-800',
    labelColor: 'text-emerald-900',
    inputBg: 'bg-emerald-50/40 border-emerald-200/80 text-stone-800 placeholder-stone-400 focus:border-emerald-600 focus:ring-emerald-500/20 focus:bg-white',
    inputIcon: 'text-emerald-600',
    pillAcceptActive: 'bg-emerald-700 text-white font-bold border-emerald-700 shadow-md shadow-emerald-700/20',
    pillDeclineActive: 'bg-stone-700 text-white font-bold border-stone-700',
    pillInactive: 'bg-white text-stone-600 border-emerald-200/80 hover:border-emerald-300 hover:bg-emerald-50/40',
    guestCountActive: 'bg-emerald-700 text-white font-bold border-emerald-700',
    guestCountInactive: 'bg-white text-stone-700 border-emerald-200/80 hover:border-emerald-300 hover:bg-emerald-50/40',
    button: 'bg-gradient-to-r from-[#25D366] to-[#1ebe5d] hover:brightness-105 text-white shadow-lg shadow-[#25D366]/25',
    footnote: 'text-stone-500',
    sparkleColor: 'text-emerald-600',
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
    container: 'bg-white/95 border-slate-200/90 text-slate-800 shadow-[0_14px_35px_rgba(30,58,138,0.06)] backdrop-blur-sm',
    divider: 'bg-[#c5a059]/40',
    badge: 'border-[#c5a059]/30 bg-[#f4f8fb] text-[#3b4d66]',
    titleColor: 'text-[#1e2e42]',
    subtitleColor: 'text-[#6c7e93]',
    highlightNames: 'text-[#3b4d66]',
    labelColor: 'text-[#3b4d66]',
    inputBg: 'bg-[#f4f8fb]/70 border-slate-200/90 text-slate-800 placeholder-slate-400 focus:border-[#c5a059] focus:ring-[#c5a059]/20 focus:bg-white',
    inputIcon: 'text-[#3b4d66]',
    pillAcceptActive: 'bg-[#3b4d66] text-white font-bold border-[#3b4d66] shadow-md shadow-[#3b4d66]/20',
    pillDeclineActive: 'bg-stone-700 text-white font-bold border-stone-700',
    pillInactive: 'bg-white text-slate-600 border-slate-200/90 hover:border-[#c5a059]/50 hover:bg-[#f4f8fb]',
    guestCountActive: 'bg-[#3b4d66] text-white font-bold border-[#3b4d66]',
    guestCountInactive: 'bg-white text-slate-700 border-slate-200/90 hover:border-[#c5a059]/50 hover:bg-[#f4f8fb]',
    button: 'bg-gradient-to-r from-[#25D366] to-[#1ebe5d] hover:brightness-105 text-white shadow-lg shadow-[#25D366]/20 font-bold',
    footnote: 'text-slate-500',
    sparkleColor: 'text-[#c5a059]',
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
  onStyleChange,
  templateData,
}) {
  // Inject per-field style props into every <Editable /> JSX site below.
  // Avoids touching every individual <Editable ... /> call. Safe: if props
  // are undefined (live /i/[slug] page), SharedEditable falls back to BasicEditable.
  const Editable = React.useMemo(() => {
    return function ScopedEditable(props) {
      return React.createElement(SharedEditable, {
        ...props,
        onStyleChange: props.onStyleChange === undefined ? onStyleChange : props.onStyleChange,
        templateData: props.templateData === undefined ? templateData : props.templateData,
      });
    };
  }, [onStyleChange, templateData]);
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
