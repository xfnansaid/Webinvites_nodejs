'use client';
import { formatDayOfWeek } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Sparkles, Copy, Check, ExternalLink, Flower2, Heart, Star, PartyPopper } from 'lucide-react';
import RsvpSection from './RsvpSection';
import SharedEditable from './_Editable';

const defaultData = {
  celebrantName: "Meera",
  age: "25",
  heroTagline: "A quarter century of beautiful moments",
  heroIntro: "You're invited to celebrate",
  eventDay: "Sunday",
  birthdayDate: "2026-12-20",
  birthdayTime: "5:00 PM",
  venue: "Rose Garden Banquet",
  venueAddress: "78 Flower Market Road, Chennai, Tamil Nadu 600001",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Rose+Garden+Banquet+Chennai",
  whatsappNumber: "919876543210",
  hostsName: "The Kumar Family",
  countdownTitle: "Until the Celebration",
  partyTheme: "Garden Party",
};


export default function BirthdayFloralBlush({ data = {}, isDraft = false, editable = false, onEdit, onStyleChange, templateData, }) {
  const Editable = React.useMemo(() => {
    return function ScopedEditable(props) {
      return React.createElement(SharedEditable, {
        ...props,
        onStyleChange: props.onStyleChange === undefined ? onStyleChange : props.onStyleChange,
        templateData: props.templateData === undefined ? templateData : props.templateData,
      });
    };
  }, [onStyleChange, templateData]);
  const m = { ...defaultData, ...data };
  const displayDay = data.eventDay || formatDayOfWeek(m.birthdayDate, m.eventDay || 'Sunday');
  const mapUrl = m.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.venue + ' ' + m.venueAddress)}`;
  const [toast, setToast] = useState(null);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(`${m.venue}, ${m.venueAddress}`).then(() => { setCopied(true); showToast("📍 Copied!"); setTimeout(() => setCopied(false), 2500); }); };
  const [timeLeft, setTimeLeft] = useState({ days: "00", hours: "00", minutes: "00", seconds: "00" });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const parseDate = (d, t) => { if (!d) return NaN; let v = new Date(`${d}T${t || '17:00:00'}`).getTime(); if (!isNaN(v)) return v; v = new Date(d).getTime(); return v; };
    const target = parseDate(m.birthdayDate, m.birthdayTime);
    if (isNaN(target)) { setIsExpired(true); return; }
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setIsExpired(true); return; }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({
        days: String(days).padStart(2, "0"),
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0"),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [m.birthdayDate, m.birthdayTime]);

  useEffect(() => {
    if (!document.getElementById('blush-fonts')) {
      const l = document.createElement('link'); l.id = 'blush-fonts'; l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,600;1,400&display=swap';
      document.head.appendChild(l);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#FFF0F5] text-stone-800 font-sans" style={{ containerType: 'inline-size', width: '100%', maxWidth: '100%' }}>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-5 py-2.5 rounded-full bg-pink-600 text-white text-xs font-bold shadow-xl animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden px-4 py-16">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-1/4 w-[400px] h-[400px] rounded-full bg-pink-200/40 blur-[100px]" />
          <div className="absolute bottom-10 right-1/4 w-[300px] h-[300px] rounded-full bg-rose-200/30 blur-[80px]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #f43f5e 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        </div>

        <div className="relative z-10 text-center max-w-lg mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-100/80 border border-pink-200 text-pink-600 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <Editable tag="span" value={m.heroTagline} field="heroTagline" onEdit={onEdit} editable={editable} placeholder="Tagline" />
          </div>

          <div className="space-y-2">
            <p className="font-[Playfair_Display] text-stone-500 text-sm tracking-widest uppercase">
              <Editable tag="span" value={m.heroIntro} field="heroIntro" onEdit={onEdit} editable={editable} placeholder="You're invited to celebrate" />
            </p>
            <h1 className="font-[Playfair_Display] text-[clamp(2.2rem,11cqw,3.8rem)] font-bold text-transparent bg-clip-text bg-gradient-to-b from-rose-600 via-pink-500 to-rose-400 leading-[1] break-words">
              <Editable tag="h1" value={m.celebrantName} field="celebrantName" onEdit={onEdit} editable={editable} className="font-[Playfair_Display] text-[clamp(2.2rem,11cqw,3.8rem)] font-bold text-transparent bg-clip-text bg-gradient-to-b from-rose-600 via-pink-500 to-rose-400 leading-[1] break-words" placeholder="Name" />
            </h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold">
              <PartyPopper className="w-3.5 h-3.5" />
              <span>Turning</span>
              <Editable tag="span" value={m.age} field="age" onEdit={onEdit} editable={editable} className="font-bold underline" placeholder="Age" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 text-stone-500 text-xs font-medium tracking-wide">
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-pink-400" />
            <Editable tag="span" value={m.birthdayDate} field="birthdayDate" onEdit={onEdit} editable={editable} className="font-semibold" placeholder="Date" /></span>
            <span>•</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-pink-400" />
            <Editable tag="span" value={m.birthdayTime} field="birthdayTime" onEdit={onEdit} editable={editable} className="font-semibold" placeholder="Time" /></span>
          </div>

          {/* Photo Frame */}
          {m.photoUrl && (
            <div className="relative mx-auto w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden border-4 border-white shadow-xl ring-4 ring-pink-100">
              <img src={m.photoUrl} alt={m.celebrantName} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Countdown */}
          {!isExpired ? (
            <div className="pt-2">
              <p className="text-[11px] font-bold text-pink-400 tracking-[0.2em] uppercase mb-3">
                <Editable tag="span" value={m.countdownTitle} field="countdownTitle" onEdit={onEdit} editable={editable} placeholder="Countdown Title" />
              </p>
              <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto">
                {[
                  { label: "DAYS", value: timeLeft.days },
                  { label: "HOURS", value: timeLeft.hours },
                  { label: "MINS", value: timeLeft.minutes },
                  { label: "SECS", value: timeLeft.seconds }
                ].map(item => (
                  <div key={item.label} className="bg-white/80 backdrop-blur-sm border border-pink-100 rounded-2xl p-2.5 shadow-sm text-center">
                    <div className="font-[Playfair_Display] text-xl sm:text-2xl font-bold text-pink-600 leading-tight">{item.value}</div>
                    <div className="text-[8px] font-bold text-stone-400 tracking-wider mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-4 px-6 rounded-2xl bg-white/80 border border-pink-100 max-w-xs mx-auto">
              <p className="text-pink-600 font-bold text-sm">Today is the Day! 🎂</p>
            </div>
          )}
        </div>
      </section>

      {/* Save the Date */}
      <section className="py-10 px-4">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-pink-500 text-xs font-bold tracking-[0.2em] uppercase"><Calendar className="w-4 h-4" /> Save the Date</div>
          <div className="bg-white rounded-3xl border border-pink-100 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <Editable tag="div" value={displayDay} field="eventDay" onEdit={onEdit} editable={editable} className="font-[Playfair_Display] text-2xl font-bold text-pink-600" placeholder="Day" />
                <div className="text-[10px] text-stone-400 uppercase">Day</div>
              </div>
              <div className="h-10 w-px bg-pink-100" />
              <div className="text-center">
                <Editable tag="div" value={m.birthdayDate} field="birthdayDate" onEdit={onEdit} editable={editable} className="font-[Playfair_Display] text-2xl font-bold text-pink-600" placeholder="Date" />
                <div className="text-[10px] text-stone-400 uppercase">Date</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-stone-500 text-sm">
              <Clock className="w-4 h-4 text-pink-400" />
              <Editable tag="span" value={m.birthdayTime} field="birthdayTime" onEdit={onEdit} editable={editable} className="font-semibold" placeholder="Time" />
            </div>
          </div>
        </div>
      </section>

      {/* Party Venue */}
      <section className="py-10 px-4">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-pink-500 text-xs font-bold tracking-[0.2em] uppercase"><MapPin className="w-4 h-4" /> Party Venue</div>
          <div className="bg-white rounded-3xl border border-pink-100 p-6 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center mx-auto"><MapPin className="w-5 h-5 text-pink-500" /></div>
            <Editable tag="h3" value={m.venue} field="venue" onEdit={onEdit} editable={editable} className="font-[Playfair_Display] text-lg font-bold text-stone-800" placeholder="Venue Name" />
            <Editable tag="p" value={m.venueAddress} field="venueAddress" onEdit={onEdit} editable={editable} className="text-stone-500 text-sm" placeholder="Address" multiline />
            <div className="flex gap-3 justify-center">
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-pink-500 text-white font-bold text-xs shadow-md hover:bg-pink-600 transition-all"><ExternalLink className="w-4 h-4" /> Directions</a>
              <button onClick={handleCopy} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-pink-50 border border-pink-200 text-pink-600 font-bold text-xs hover:bg-pink-100 transition-all">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? 'Copied!' : 'Copy'}</button>
            </div>
          </div>
        </div>
      </section>

      {/* RSVP */}
      <section className="py-10 px-4">
        <div className="max-w-lg mx-auto"><RsvpSection groomName={m.celebrantName} brideName={`${m.age}th Birthday`} whatsappNumber={m.whatsappNumber} theme="light" /></div>
      </section>

      <footer className="py-8 px-4 text-center border-t border-pink-100">
        <p className="text-stone-400 text-xs">Hosted by <Editable tag="span" value={m.hostsName} field="hostsName" onEdit={onEdit} editable={editable} className="text-pink-500 font-semibold" placeholder="Host" /></p>
        <p className="text-stone-300 text-[10px] mt-2">Created with Web Invites</p>
      </footer>
    </div>
  );
}
