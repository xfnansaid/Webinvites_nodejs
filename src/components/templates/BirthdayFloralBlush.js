'use client';
import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Sparkles, Copy, Check, ExternalLink, Flower2, Heart, Star, PartyPopper } from 'lucide-react';
import RsvpSection from './RsvpSection';

const Editable = ({ tag: Tag = "span", value, field, onEdit, editable = false, className = "", placeholder = "", multiline = false }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const elementRef = React.useRef(null);
  React.useEffect(() => { if (!isEditing && elementRef.current) { const c = elementRef.current.textContent || ""; if (c !== (value ?? "")) elementRef.current.textContent = value ?? ""; } }, [value, isEditing]);
  React.useEffect(() => { if (isEditing && elementRef.current) { elementRef.current.focus(); try { const r = document.createRange(); r.selectNodeContents(elementRef.current); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); } catch(e){} } }, [isEditing]);
  const commit = () => { setIsEditing(false); if (elementRef.current && onEdit) onEdit(field, (elementRef.current.innerText || "").replace(/\u00a0/g, " ")); };
  const cancel = () => { if (elementRef.current) elementRef.current.textContent = value ?? ""; setIsEditing(false); };
  if (!editable) return <Tag className={className}>{value || placeholder}</Tag>;
  return <Tag ref={elementRef} contentEditable={isEditing} suppressContentEditableWarning onClick={() => !isEditing && setIsEditing(true)} onBlur={commit} onKeyDown={(e) => { if (isEditing) { if (!multiline && e.key === "Enter") { e.preventDefault(); commit(); } if (e.key === "Escape") { e.preventDefault(); cancel(); } } }} className={`${isEditing ? "outline-none ring-2 ring-pink-400/60 rounded bg-white/10" : "cursor-pointer hover:ring-2 hover:ring-pink-400/40 rounded transition-all"} ${className}`} title={!isEditing ? "Click to edit" : undefined}>{value || (placeholder && !isEditing ? <span className="opacity-40">{placeholder}</span> : placeholder)}</Tag>;
};

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

export default function BirthdayFloralBlush({ data = {}, isDraft = false, editable = false, onEdit }) {
  const m = { ...defaultData, ...data };
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
      setTimeLeft({ days: String(Math.floor(diff / 86400000)).padStart(2, "0"), hours: String(Math.floor((diff % 86400000) / 3600000)).padStart(2, "0"), minutes: String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0"), seconds: String(Math.floor((diff % 60000) / 1000)).padStart(2, "0") });
    };
    tick(); const i = setInterval(tick, 1000); return () => clearInterval(i);
  }, [m.birthdayDate, m.birthdayTime]);

  useEffect(() => {
    if (!document.getElementById('blush-fonts')) {
      const l = document.createElement('link'); l.id = 'blush-fonts'; l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,600;1,400&display=swap';
      document.head.appendChild(l);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF5F5] via-[#FFF0F3] to-[#FFE8EE] text-stone-800 font-sans">
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-5 py-2.5 rounded-2xl bg-pink-600 text-white text-xs font-bold shadow-xl animate-in slide-in-from-top-4">{toast}</div>}

      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden px-4 py-16">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-40 h-40 rounded-full bg-pink-300/20 blur-[80px]" />
          <div className="absolute bottom-20 right-10 w-56 h-56 rounded-full bg-rose-200/30 blur-[100px]" />
        </div>
        <div className="relative z-10 text-center max-w-lg mx-auto space-y-5">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Flower2 className="w-5 h-5 text-pink-400" />
            <span className="h-px w-10 bg-pink-300" />
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
            <span className="h-px w-10 bg-pink-300" />
            <Flower2 className="w-5 h-5 text-pink-400" />
          </div>
          <Editable tag="p" value={m.heroIntro} field="heroIntro" onEdit={onEdit} editable={editable} className="text-pink-500 text-xs tracking-[0.3em] uppercase font-bold" placeholder="You're invited to celebrate" />
          <Editable tag="h1" value={m.celebrantName} field="celebrantName" onEdit={onEdit} editable={editable} className="font-[Playfair_Display] text-[clamp(2.5rem,7vw,4.5rem)] font-bold text-transparent bg-clip-text bg-gradient-to-b from-rose-600 via-pink-500 to-rose-400 leading-[0.95]" placeholder="Name" />
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-pink-300" />
            <Editable tag="span" value={`${m.age}th`} field="age" onEdit={onEdit} editable={editable} className="font-[Playfair_Display] italic text-3xl text-pink-500" placeholder="25th" />
            <span className="h-px w-10 bg-pink-300" />
          </div>
          <Editable tag="p" value={m.heroTagline} field="heroTagline" onEdit={onEdit} editable={editable} className="font-[Lora] italic text-stone-500" placeholder="A quarter century of beautiful moments" />
          {m.partyTheme && <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-100 border border-pink-200"><Flower2 className="w-3.5 h-3.5 text-pink-500" /><Editable tag="span" value={m.partyTheme} field="partyTheme" onEdit={onEdit} editable={editable} className="text-pink-600 text-xs font-bold uppercase tracking-wider" placeholder="Theme" /></div>}
          <div className="flex items-center justify-center gap-3 text-stone-500 text-sm pt-2">
            <Calendar className="w-4 h-4 text-pink-400" />
            <Editable tag="span" value={m.birthdayDate} field="birthdayDate" onEdit={onEdit} editable={editable} className="font-semibold" placeholder="Date" />
            <span>•</span>
            <Clock className="w-4 h-4 text-pink-400" />
            <Editable tag="span" value={m.birthdayTime} field="birthdayTime" onEdit={onEdit} editable={editable} className="font-semibold" placeholder="Time" />
          </div>
        </div>
      </section>

      {/* Countdown */}
      <section className="py-12 px-4">
        <div className="max-w-lg mx-auto text-center space-y-5">
          <Editable tag="h2" value={m.countdownTitle} field="countdownTitle" onEdit={onEdit} editable={editable} className="font-[Playfair_Display] text-xl font-bold text-pink-600" placeholder="Counting Down" />
          {isExpired ? (
            <div className="space-y-2"><PartyPopper className="w-10 h-10 text-pink-500 mx-auto animate-bounce" /><p className="text-pink-600 font-bold">Happy Birthday! 🎉</p></div>
          ) : (
            <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto" role="timer" aria-live="polite" aria-label="Countdown timer">
              {[{ l: 'Days', v: timeLeft.days }, { l: 'Hours', v: timeLeft.hours }, { l: 'Min', v: timeLeft.minutes }, { l: 'Sec', v: timeLeft.seconds }].map(i => (
                <div key={i.l} className="bg-white rounded-2xl border border-pink-100 p-3 shadow-sm">
                  <div className="font-[Playfair_Display] text-2xl font-bold text-pink-600">{i.v}</div>
                  <div className="text-[10px] text-stone-400 uppercase tracking-wider mt-1">{i.l}</div>
                </div>
              ))}
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
              <div className="text-center"><div className="font-[Playfair_Display] text-2xl font-bold text-pink-600">{m.eventDay}</div><div className="text-[10px] text-stone-400 uppercase">Day</div></div>
              <div className="h-10 w-px bg-pink-100" />
              <div className="text-center"><div className="font-[Playfair_Display] text-2xl font-bold text-pink-600">{m.birthdayDate}</div><div className="text-[10px] text-stone-400 uppercase">Date</div></div>
            </div>
            <div className="flex items-center justify-center gap-2 text-stone-500 text-sm"><Clock className="w-4 h-4 text-pink-400" /><span>{m.birthdayTime}</span></div>
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
