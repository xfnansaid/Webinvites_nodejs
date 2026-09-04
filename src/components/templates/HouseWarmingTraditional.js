'use client';
import { formatDayOfWeek } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Copy, Check, ExternalLink, Home, Sparkles, Star, Key, Coffee, Users } from 'lucide-react';
import RsvpSection from './RsvpSection';
import SharedEditable from './_Editable';

const D = {
  familyName: "The Sharma Family", heroTagline: "We're blessed to have a new home", heroIntro: "You're cordially invited to",
  eventDay: "Saturday", eventDate: "2026-12-20", eventTime: "11:00 AM",
  venue: "Sharma Residence", venueAddress: "42 Sunshine Apartments, Sector 5, Noida, UP 201301",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Sharma+Residence+Noida",
  whatsappNumber: "919876543210", hostsName: "Raj & Sunita Sharma",
  countdownTitle: "Days Until the Housewarming",
  ceremonyTime: "11:00 AM — Griha Pravesh Puja",
  lunchTime: "1:00 PM — Lunch is Served",
  findOurHome: "Look for the yellow balloons at the entrance of Sector 5, Gate 2. Free parking available inside the complex.",
};

export default function HouseWarmingTraditional({ data = {}, isDraft, editable, onEdit, onStyleChange, templateData, }) {
  const Editable = React.useMemo(() => {
    return function ScopedEditable(props) {
      return React.createElement(SharedEditable, {
        ...props,
        onStyleChange: props.onStyleChange === undefined ? onStyleChange : props.onStyleChange,
        templateData: props.templateData === undefined ? templateData : props.templateData,
      });
    };
  }, [onStyleChange, templateData]);
  const m = { ...D, ...data };
  const displayDay = data.eventDay || formatDayOfWeek(m.eventDate, m.eventDay || 'Saturday');
  const mapUrl = m.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.venue + ' ' + m.venueAddress)}`;
  const [tl, setTl] = useState({ d: "00", h: "00", m: "00", s: "00" });
  const [expired, setExpired] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => { const parseDate = (d, t) => { if (!d) return NaN; let v = new Date(`${d}T${t || '11:00:00'}`).getTime(); if (!isNaN(v)) return v; v = new Date(d).getTime(); return v; }; const target = parseDate(m.eventDate, m.eventTime); if (isNaN(target)) { setExpired(true); return; } const tick = () => { const d = target - Date.now(); if (d <= 0) { setExpired(true); return; } setTl({ d: String(Math.floor(d/86400000)).padStart(2,"0"), h: String(Math.floor((d%86400000)/3600000)).padStart(2,"0"), m: String(Math.floor((d%3600000)/60000)).padStart(2,"0"), s: String(Math.floor((d%60000)/1000)).padStart(2,"0") }); }; tick(); const i = setInterval(tick,1000); return () => clearInterval(i); }, [m.eventDate, m.eventTime]);
  useEffect(() => { if (!document.getElementById('hw-trad-fonts')) { const l = document.createElement('link'); l.id = 'hw-trad-fonts'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap'; document.head.appendChild(l); } }, []);

  return (
    <div className="min-h-screen bg-[#FFFDF5] text-stone-800 font-sans" style={{ containerType: 'inline-size', width: '100%', maxWidth: '100%' }}>
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden px-4 py-16">
        <div className="absolute inset-0 pointer-events-none">
          <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80" alt="" className="absolute inset-0 w-full h-full object-cover opacity-15" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#FFFDF5]/90 via-[#FFF8E7]/85 to-[#FFFDF5]/95" />
          <div className="absolute top-10 left-1/4 w-[400px] h-[400px] rounded-full bg-amber-200/30 blur-[100px]" />
          <div className="absolute bottom-10 right-1/4 w-[300px] h-[300px] rounded-full bg-orange-100/30 blur-[80px]" />
        </div>
        <div className="relative z-10 text-center max-w-lg mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100/80 border border-amber-200 text-amber-800 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <Editable tag="span" value={m.heroIntro} field="heroIntro" onEdit={onEdit} editable={editable} placeholder="Intro" />
          </div>
          <Editable tag="h1" value={m.familyName} field="familyName" onEdit={onEdit} editable={editable} className="font-[Cinzel] text-[clamp(2rem,9.5cqw,3.5rem)] font-bold text-amber-900 leading-[1.05] break-words" placeholder="Family Name" />
          <Editable tag="p" value={m.heroTagline} field="heroTagline" onEdit={onEdit} editable={editable} className="font-[Cormorant_Garamond] italic text-stone-600 text-lg max-w-sm mx-auto" placeholder="Tagline" multiline />
          <div className="flex items-center justify-center gap-3 text-stone-600 text-sm">
            <Calendar className="w-4 h-4 text-amber-700" /><Editable tag="span" value={m.eventDate} field="eventDate" onEdit={onEdit} editable={editable} className="font-semibold" placeholder="Date" />
            <span>•</span><Clock className="w-4 h-4 text-amber-700" /><Editable tag="span" value={m.eventTime} field="eventTime" onEdit={onEdit} editable={editable} className="font-semibold" placeholder="Time" />
          </div>
        </div>
      </section>

      {/* Countdown */}
      <section className="py-12 px-4 bg-gradient-to-b from-[#FFFDF5] to-[#FFF8E7]">
        <div className="max-w-lg mx-auto text-center space-y-5">
          <Editable tag="h2" value={m.countdownTitle} field="countdownTitle" onEdit={onEdit} editable={editable} className="font-[Cinzel] text-xl font-bold text-amber-800" placeholder="Countdown Title" />
          {expired ? <p className="font-[Cinzel] text-amber-800 font-bold text-xl">We Have Moved In! 🏡</p> : (
            <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto" role="timer" aria-live="polite" aria-label="Countdown timer">
              {[{l:'Days',v:tl.d},{l:'Hrs',v:tl.h},{l:'Min',v:tl.m},{l:'Sec',v:tl.s}].map(i=>(
                <div key={i.l} className="bg-white/80 border border-amber-200/80 rounded-2xl p-3 shadow-sm backdrop-blur-sm">
                  <div className="font-[Cinzel] text-2xl sm:text-3xl font-bold text-amber-800">{i.v}</div>
                  <div className="text-[10px] text-stone-400 uppercase tracking-wider mt-1">{i.l}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Save the Date */}
      <section className="relative py-10 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <img src="https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&auto=format&fit=crop&q=60" alt="" className="absolute inset-0 w-full h-full object-cover opacity-10" aria-hidden="true" />
        </div>
        <div className="relative max-w-lg mx-auto space-y-4">
          <div className="text-center"><div className="inline-flex items-center gap-2 text-amber-700 text-xs font-bold tracking-[0.2em] uppercase"><Calendar className="w-4 h-4" /> Save the Date</div></div>
          <div className="bg-white rounded-3xl border border-amber-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <Editable tag="div" value={displayDay} field="eventDay" onEdit={onEdit} editable={editable} className="font-[Cinzel] text-2xl font-bold text-amber-700" placeholder="Day" />
                <div className="text-[10px] text-stone-400 uppercase">Day</div>
              </div>
              <div className="h-10 w-px bg-amber-100" />
              <div className="text-center">
                <Editable tag="div" value={m.eventDate} field="eventDate" onEdit={onEdit} editable={editable} className="font-[Cinzel] text-2xl font-bold text-amber-700" placeholder="Date" />
                <div className="text-[10px] text-stone-400 uppercase">Date</div>
              </div>
            </div>
            <div className="border-t border-amber-50 pt-4 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0"><Sparkles className="w-4 h-4 text-amber-600" /></div>
                <Editable tag="span" value={m.ceremonyTime} field="ceremonyTime" onEdit={onEdit} editable={editable} className="text-sm text-stone-700 font-medium" placeholder="11:00 AM — Griha Pravesh Puja" />
              </div>
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0"><Coffee className="w-4 h-4 text-amber-600" /></div>
                <Editable tag="span" value={m.lunchTime} field="lunchTime" onEdit={onEdit} editable={editable} className="text-sm text-stone-700 font-medium" placeholder="1:00 PM — Lunch is Served" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Find Our Home */}
      <section className="relative py-10 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <img src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format&fit=crop&q=60" alt="" className="absolute inset-0 w-full h-full object-cover opacity-10" aria-hidden="true" />
        </div>
        <div className="relative max-w-lg mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-amber-700 text-xs font-bold tracking-[0.2em] uppercase"><MapPin className="w-4 h-4" /> Find Our Home</div>
          <div className="bg-white rounded-3xl border border-amber-100 p-6 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto"><Home className="w-6 h-6 text-amber-600" /></div>
            <Editable tag="h3" value={m.venue} field="venue" onEdit={onEdit} editable={editable} className="font-[Cinzel] text-lg font-bold text-stone-800" placeholder="Home Name" />
            <Editable tag="p" value={m.venueAddress} field="venueAddress" onEdit={onEdit} editable={editable} className="text-stone-500 text-sm" placeholder="Full address" />
            {m.findOurHome && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <Editable tag="p" value={m.findOurHome} field="findOurHome" onEdit={onEdit} editable={editable} className="text-xs text-amber-800 leading-relaxed" placeholder="Directions hint for guests" />
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-600 text-white font-bold text-xs shadow-lg hover:bg-amber-700 transition-all"><ExternalLink className="w-4 h-4" /> Get Directions</a>
              <button onClick={() => { navigator.clipboard.writeText(`${m.venue}, ${m.venueAddress}`); setCopied(true); setTimeout(()=>setCopied(false),2500); }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-bold text-xs hover:bg-amber-100 transition-all">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? 'Copied!' : 'Copy Address'}</button>
            </div>
          </div>
        </div>
      </section>

      {/* RSVP */}
      <section className="py-10 px-4"><div className="max-w-lg mx-auto"><RsvpSection groomName={m.familyName} brideName="Housewarming" whatsappNumber={m.whatsappNumber} theme="light" /></div></section>

      <footer className="py-8 px-4 text-center border-t border-amber-100">
        <p className="text-stone-400 text-xs">With love, <Editable tag="span" value={m.hostsName} field="hostsName" onEdit={onEdit} editable={editable} className="text-amber-600 font-semibold" placeholder="Host" /></p>
        <p className="text-stone-300 text-[10px] mt-2">Created with Web Invites</p>
      </footer>
    </div>
  );
}
