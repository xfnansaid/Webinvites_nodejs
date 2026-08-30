'use client';
import { formatDayOfWeek } from '@/lib/utils';

import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Sparkles, Copy, Check, ExternalLink, Gift, Star, Music, PartyPopper, Cake, Users, Heart } from 'lucide-react';
import RsvpSection from './RsvpSection';

// Editable inline-edit component
const Editable = ({ tag: Tag = "span", value, field, onEdit, editable = false, className = "", placeholder = "", multiline = false }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const elementRef = React.useRef(null);

  React.useEffect(() => {
    if (!isEditing && elementRef.current) {
      const current = elementRef.current.textContent || "";
      const next = value ?? "";
      if (current !== next) elementRef.current.textContent = next;
    }
  }, [value, isEditing]);

  React.useEffect(() => {
    if (isEditing && elementRef.current) {
      elementRef.current.focus();
      try {
        const range = document.createRange();
        range.selectNodeContents(elementRef.current);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (e) {}
    }
  }, [isEditing]);

  const commit = () => {
    setIsEditing(false);
    if (elementRef.current && onEdit) {
      const text = elementRef.current.innerText || elementRef.current.textContent || "";
      onEdit(field, text.replace(/\u00a0/g, " "));
    }
  };

  const cancel = () => {
    if (elementRef.current) elementRef.current.textContent = value ?? "";
    setIsEditing(false);
  };

  if (!editable) return <Tag className={className}>{value || placeholder}</Tag>;

  return (
    <Tag
      ref={elementRef}
      contentEditable={isEditing}
      suppressContentEditableWarning={true}
      onClick={() => !isEditing && setIsEditing(true)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (isEditing) {
          if (!multiline && e.key === "Enter") { e.preventDefault(); commit(); }
          if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); cancel(); }
        }
      }}
      className={`${isEditing ? "outline-none ring-2 ring-blue-400/60 rounded bg-white/10" : "cursor-pointer ring-0 hover:ring-2 hover:ring-blue-400/40 rounded transition-all"} ${className}`}
      title={!isEditing ? "Click to edit" : undefined}
    >
      {value || (placeholder && !isEditing ? <span className="opacity-40">{placeholder}</span> : placeholder)}
    </Tag>
  );
};

const defaultData = {
  celebrantName: "Aarav",
  age: "5",
  heroTagline: "Join us for a magical celebration",
  heroIntro: "You're invited to",
  eventDay: "Saturday",
  birthdayDate: "2026-12-20",
  birthdayTime: "4:00 PM",
  venue: "Sunshine Party Hall",
  venueAddress: "45 Park Lane, Bangalore, Karnataka 560001",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Sunshine+Party+Hall+Bangalore",
  whatsappNumber: "919876543210",
  hostsName: "Raj & Priya Sharma",
  countdownTitle: "Counting Down to the Party",
  countdownSubtitle: "The fun begins in",
  partyTheme: "Enchanted Garden",
};


export default function BirthdayRoyalGold({ data = {}, isDraft = false, editable = false, onEdit }) {
  const merged = { ...defaultData, ...data };
  const displayDay = data.eventDay || formatDayOfWeek(merged.birthdayDate, merged.eventDay || 'Saturday');
  const canonicalMapUrl = merged.mapsUrl || merged.mapUrl || merged.directionsUrl
    || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(merged.venue + ' ' + merged.venueAddress)}`;

  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(null), 3500); };

  const [copied, setCopied] = useState(false);
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(`${merged.venue}, ${merged.venueAddress}`).then(() => {
      setCopied(true); showToast("📍 Address copied!"); setTimeout(() => setCopied(false), 2500);
    }).catch(() => showToast(`📍 ${merged.venue}, ${merged.venueAddress}`));
  };

  const [timeLeft, setTimeLeft] = useState({ days: "00", hours: "00", minutes: "00", seconds: "00" });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const parseDate = (d, t) => { if (!d) return NaN; let v = new Date(`${d}T${t || '16:00:00'}`).getTime(); if (!isNaN(v)) return v; v = new Date(d).getTime(); return v; };
    const targetTime = parseDate(merged.birthdayDate, merged.birthdayTime);
    if (isNaN(targetTime)) { setIsExpired(true); return; }
    const updateTimer = () => {
      const diff = targetTime - Date.now();
      if (diff <= 0) { setIsExpired(true); setTimeLeft({ days: "00", hours: "00", minutes: "00", seconds: "00" }); return; }
      setIsExpired(false);
      setTimeLeft({
        days: String(Math.floor(diff / 86400000)).padStart(2, "0"),
        hours: String(Math.floor((diff % 86400000) / 3600000)).padStart(2, "0"),
        minutes: String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0"),
        seconds: String(Math.floor((diff % 60000) / 1000)).padStart(2, "0"),
      });
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [merged.birthdayDate, merged.birthdayTime]);

  const [calendarAdded, setCalendarAdded] = useState(false);
  const addToCalendar = () => {
    const start = new Date(`${merged.birthdayDate}T${merged.birthdayTime || '16:00:00'}`);
    const end = new Date(start.getTime() + 4 * 3600000);
    const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${merged.celebrantName}'s ${merged.age}${getOrdinal(merged.age)} Birthday!`)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(`Join us to celebrate ${merged.celebrantName}'s birthday!`)}&location=${encodeURIComponent(`${merged.venue}, ${merged.venueAddress}`)}`;
    window.open(url, '_blank');
    setCalendarAdded(true);
  };

  function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  }

  useEffect(() => {
    const linkId = 'birthday-gold-fonts';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Great+Vibes&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0f00] via-[#2d1810] to-[#1a0f00] text-white font-sans">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-5 py-2.5 rounded-2xl bg-black/80 backdrop-blur-md text-white text-xs font-bold shadow-xl animate-in slide-in-from-top-4 fade-in">
          {toastMessage}
        </div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden px-4 py-16">
        {/* Decorative Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-rose-500/10 blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
        containerType: 'inline-size',
        width: '100%',
        maxWidth: '100%', backgroundImage: 'radial-gradient(rgba(255,215,0,0.8) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        </div>

        <div className="relative z-10 text-center max-w-lg mx-auto space-y-6">
          {/* Top Ornament */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-amber-400/60" />
            <Star className="w-5 h-5 text-amber-400 animate-pulse fill-amber-400" />
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-amber-400/60" />
          </div>

          <Editable tag="p" value={merged.heroIntro} field="heroIntro" onEdit={onEdit} editable={editable}
            className="text-amber-300/80 text-sm tracking-[0.3em] uppercase font-semibold" placeholder="You're invited to" />

          <Editable tag="h1" value={merged.celebrantName} field="celebrantName" onEdit={onEdit} editable={editable}
            className="font-[Cinzel] text-[clamp(2.2rem,11cqw,3.8rem)] font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 leading-[1] tracking-wide break-words"
            placeholder="Birthday Name" />

          <div className="flex items-center justify-center gap-4">
            <span className="h-px w-16 bg-amber-400/30" />
            <Editable tag="span" value={`${merged.age}${getOrdinal(merged.age)}`} field="age" onEdit={onEdit} editable={editable}
              className="font-[Great_Vibes] text-4xl text-amber-300" placeholder="5th" />
            <span className="h-px w-16 bg-amber-400/30" />
          </div>

          <Editable tag="p" value={merged.heroTagline} field="heroTagline" onEdit={onEdit} editable={editable}
            className="font-[Cormorant_Garamond] text-lg text-stone-300 italic" placeholder="Join us for a magical celebration" />

          {merged.partyTheme && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400/10 border border-amber-400/20">
              <PartyPopper className="w-4 h-4 text-amber-400" />
              <Editable tag="span" value={merged.partyTheme} field="partyTheme" onEdit={onEdit} editable={editable}
                className="text-amber-300 text-xs font-bold tracking-wider uppercase" placeholder="Party Theme" />
            </div>
          )}

          <div className="pt-4 flex items-center justify-center gap-3 text-stone-400 text-sm">
            <Calendar className="w-4 h-4 text-amber-400" />
            <Editable tag="span" value={merged.birthdayDate} field="birthdayDate" onEdit={onEdit} editable={editable}
              className="font-semibold" placeholder="December 20, 2026" />
            <span>•</span>
            <Clock className="w-4 h-4 text-amber-400" />
            <Editable tag="span" value={merged.birthdayTime} field="birthdayTime" onEdit={onEdit} editable={editable}
              className="font-semibold" placeholder="4:00 PM" />
          </div>
        </div>
      </section>

      {/* Countdown Section */}
      <section className="py-12 px-4 bg-gradient-to-b from-[#1a0f00] to-[#0d0700]">
        <div className="max-w-lg mx-auto text-center space-y-6">
          <Editable tag="h2" value={merged.countdownTitle} field="countdownTitle" onEdit={onEdit} editable={editable}
            className="font-[Cinzel] text-2xl font-bold text-amber-300" placeholder="Counting Down to the Party" />

          {isExpired ? (
            <div className="space-y-2">
              <PartyPopper className="w-12 h-12 text-amber-400 mx-auto animate-bounce" />
              <p className="font-[Cinzel] text-xl text-amber-200">The Party is ON! 🎉</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto" role="timer" aria-live="polite" aria-label="Countdown timer">
              {[
                { label: 'Days', value: timeLeft.days },
                { label: 'Hours', value: timeLeft.hours },
                { label: 'Minutes', value: timeLeft.minutes },
                { label: 'Seconds', value: timeLeft.seconds },
              ].map((item) => (
                <div key={item.label} className="bg-white/5 border border-amber-400/20 rounded-2xl p-3 sm:p-4 backdrop-blur-sm">
                  <div className="font-[Cinzel] text-2xl sm:text-3xl font-black text-amber-300">{item.value}</div>
                  <div className="text-[10px] text-stone-500 uppercase tracking-wider mt-1">{item.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Save the Date */}
      <section className="py-12 px-4 bg-[#0d0700]">
        <div className="max-w-lg mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-bold tracking-[0.2em] uppercase">
            <Calendar className="w-4 h-4" /> Save the Date
          </div>
          <div className="bg-white/5 border border-amber-400/15 rounded-3xl p-6 sm:p-8 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <Editable tag="div" value={displayDay} field="eventDay" onEdit={onEdit} editable={editable} className="font-[Cinzel] text-3xl font-black text-amber-300" placeholder="Day" />
                <div className="text-xs text-stone-500 uppercase tracking-wider">Day</div>
              </div>
              <div className="h-12 w-px bg-amber-400/20" />
              <div className="text-center">
                <Editable tag="div" value={merged.birthdayDate} field="birthdayDate" onEdit={onEdit} editable={editable} className="font-[Cinzel] text-3xl font-black text-amber-300" placeholder="Date" />
                <div className="text-xs text-stone-500 uppercase tracking-wider">Date</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-stone-300">
              <Clock className="w-4 h-4 text-amber-400" />
              <Editable tag="span" value={merged.birthdayTime} field="birthdayTime" onEdit={onEdit} editable={editable} className="font-semibold" placeholder="Time" />
            </div>
            <button onClick={addToCalendar} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-bold hover:bg-amber-500/20 transition-all">
              {calendarAdded ? <Check className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
              {calendarAdded ? 'Added to Calendar!' : 'Add to Google Calendar'}
            </button>
          </div>
        </div>
      </section>

      {/* Party Venue */}
      <section className="py-12 px-4 bg-gradient-to-b from-[#0d0700] to-[#1a0f00]">
        <div className="max-w-lg mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-bold tracking-[0.2em] uppercase">
            <MapPin className="w-4 h-4" /> Party Venue
          </div>
          <div className="bg-white/5 border border-amber-400/15 rounded-3xl p-6 sm:p-8 backdrop-blur-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 flex items-center justify-center mx-auto">
              <MapPin className="w-6 h-6 text-amber-400" />
            </div>
            <Editable tag="h3" value={merged.venue} field="venue" onEdit={onEdit} editable={editable}
              className="font-[Cinzel] text-xl font-bold text-white" placeholder="Party Venue Name" />
            <Editable tag="p" value={merged.venueAddress} field="venueAddress" onEdit={onEdit} editable={editable}
              className="text-stone-400 text-sm leading-relaxed" placeholder="Full venue address" multiline />
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href={canonicalMapUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 text-stone-900 font-bold text-xs shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition-all">
                <ExternalLink className="w-4 h-4" /> Get Directions
              </a>
              <button onClick={handleCopyAddress}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white/10 border border-white/20 text-white font-bold text-xs hover:bg-white/15 transition-all">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Address'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* RSVP Section */}
      <section className="py-12 px-4 bg-[#1a0f00]">
        <div className="max-w-lg mx-auto">
          <RsvpSection
            groomName={merged.celebrantName}
            brideName={`${merged.age}${getOrdinal(merged.age)} Birthday`}
            whatsappNumber={merged.whatsappNumber}
            theme="dark"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-[#0d0700] border-t border-amber-400/10 text-center">
        <p className="text-stone-600 text-xs">
          Hosted by <Editable tag="span" value={merged.hostsName} field="hostsName" onEdit={onEdit} editable={editable}
            className="text-amber-400/70 font-semibold" placeholder="Host Name" />
        </p>
        <p className="text-stone-700 text-[10px] mt-2">Created with Web Invites</p>
      </footer>
    </div>
  );
}
