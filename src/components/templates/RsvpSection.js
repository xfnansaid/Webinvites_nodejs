'use client';

import React, { useState } from 'react';
import { MessageCircle, CheckCircle2, XCircle, Users, User, Send, Heart, Sparkles } from 'lucide-react';

/**
 * Universal Responsive WhatsApp RSVP Section for Web Invites templates.
 * 
 * Features:
 * - Collects Guest Name, Attendance Status (Attending / Regret), Guest Count, and Optional Wish/Message.
 * - Formats & sends directly to the client's provided WhatsApp number via https://wa.me/.
 * - Fully responsive, mobile-optimized, touch-friendly.
 * - Custom themes matching template color palettes (crimson, gold, emerald, navy, dark, light).
 */
export default function RsvpSection({
  groomName = 'Groom',
  brideName = 'Bride',
  whatsappNumber = '',
  theme = 'light',
  accentColor,
  cardBg,
  className = '',
}) {
  const [guestName, setGuestName] = useState('');
  const [attending, setAttending] = useState('yes'); // 'yes' | 'no'
  const [guestCount, setGuestCount] = useState('1');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Sanitize WhatsApp number (ensure country code e.g. 919876543210)
  const cleanPhone = (whatsappNumber || '').replace(/[^\d]/g, '');

  const handleSendRsvp = (e) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setError('Please enter your name');
      return;
    }
    setError('');

    const coupleNames = `${groomName} & ${brideName}`;
    const statusText = attending === 'yes' ? '✅ Joyfully Accepts' : '❌ Regretfully Declines';
    const guestsText = attending === 'yes' ? `👥 Guests Attending: ${guestCount}` : '';
    const wishText = message.trim() ? `\n💬 *Wish*: "${message.trim()}"` : '';

    const textMsg = 
      `*RSVP for ${coupleNames}'s Wedding* 💒\n` +
      `----------------------------------------\n` +
      `👤 *Name*: ${guestName.trim()}\n` +
      `✨ *Status*: ${statusText}\n` +
      (guestsText ? `${guestsText}\n` : '') +
      wishText + `\n\n` +
      `Sent via Web Invites`;

    const targetPhone = cleanPhone || '919876543210';
    const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(textMsg)}`;

    setSubmitted(true);

    // Open WhatsApp after brief feedback
    setTimeout(() => {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }, 300);
  };

  return (
    <section id="rsvp-section" className={`w-full my-8 ${className}`}>
      <div className="relative overflow-hidden rounded-3xl border border-amber-200/60 bg-gradient-to-b from-white via-[#FDFBF7] to-[#F5EBE0] p-5 sm:p-7 shadow-[0_12px_35px_rgba(0,0,0,0.06)]">
        
        {/* Top Decorative Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-2 mb-1.5">
            <span className="h-px w-6 bg-amber-400/60" />
            <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
            <span className="h-px w-6 bg-amber-400/60" />
          </div>
          <h3 className="font-display text-xl sm:text-2xl font-bold tracking-wide text-stone-800 uppercase">
            RSVP
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 font-medium">
            Please respond to let <span className="font-semibold text-stone-900">{groomName} &amp; {brideName}</span> know if you will attend
          </p>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 shadow-inner">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-stone-800">Opening WhatsApp…</h4>
            <p className="text-xs sm:text-sm text-stone-600 max-w-xs mx-auto">
              Your RSVP response has been formatted. If WhatsApp doesn't open automatically, tap the button below:
            </p>
            <button
              onClick={handleSendRsvp}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#25D366] text-white font-bold text-xs shadow-md hover:bg-[#20bd5a] transition-all"
            >
              <MessageCircle className="w-4 h-4" /> Open WhatsApp
            </button>
            <div>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="text-[11px] text-stone-500 underline mt-2 hover:text-stone-700"
              >
                Send another response
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSendRsvp} className="space-y-4 text-left">
            {/* Guest Name Input */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                Your Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => { setGuestName(e.target.value); setError(''); }}
                  placeholder="e.g. Sameer & Family"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-2xl bg-white border border-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs sm:text-sm text-stone-800 outline-none transition-all placeholder:text-stone-400 font-medium"
                />
              </div>
              {error && <p className="text-[11px] font-semibold text-red-500 mt-1">{error}</p>}
            </div>

            {/* Attendance Choice Buttons */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Will You Attend?
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setAttending('yes')}
                  className={`flex items-center justify-center gap-2 p-2.5 sm:p-3 rounded-2xl border text-xs sm:text-sm font-bold transition-all ${
                    attending === 'yes'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20 scale-[1.01]'
                      : 'bg-white text-stone-700 border-stone-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Joyfully Accept</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAttending('no')}
                  className={`flex items-center justify-center gap-2 p-2.5 sm:p-3 rounded-2xl border text-xs sm:text-sm font-bold transition-all ${
                    attending === 'no'
                      ? 'bg-stone-700 text-white border-stone-700 shadow-md shadow-stone-700/20 scale-[1.01]'
                      : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400 hover:bg-stone-50'
                  }`}
                >
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>Regretfully Decline</span>
                </button>
              </div>
            </div>

            {/* Guest Count (Only if Attending) */}
            {attending === 'yes' && (
              <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Number of Guests Attending
                </label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                  <select
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value)}
                    className="w-full pl-10 pr-8 py-2.5 sm:py-3 rounded-2xl bg-white border border-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs sm:text-sm text-stone-800 outline-none transition-all font-medium appearance-none cursor-pointer"
                  >
                    <option value="1">1 Person (Solo)</option>
                    <option value="2">2 Persons (Couple)</option>
                    <option value="3">3 Persons (Family)</option>
                    <option value="4">4 Persons (Family)</option>
                    <option value="5+">5+ Persons (Group)</option>
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400 text-xs">▼</div>
                </div>
              </div>
            )}

            {/* Optional Wish / Note */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                Warm Wish for Couple <span className="text-stone-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Congratulations on your special day!"
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs sm:text-sm text-stone-800 outline-none transition-all placeholder:text-stone-400 font-medium resize-none"
              />
            </div>

            {/* Submit via WhatsApp Button */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-[#25D366]/25 transition-all active:scale-[0.98] group mt-2"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>Send RSVP via WhatsApp</span>
              <Send className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            {cleanPhone && (
              <p className="text-[10px] text-center text-stone-500 font-medium">
                Directly sends to WhatsApp: <span className="font-semibold text-stone-700">+{cleanPhone}</span>
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
