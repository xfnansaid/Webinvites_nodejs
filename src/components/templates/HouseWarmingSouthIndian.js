'use client';
import { formatDayOfWeek } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Copy, Check, ExternalLink, Home, Flower2, Sparkles } from 'lucide-react';
import RsvpSection from './RsvpSection';
import SharedEditable from './_Editable';

const D = {
  familyName: "The Iyer Family", heroTagline: "With the blessings of the Almighty", heroIntro: "Sri Ganeshaya Namah — You're invited to",
  eventDay: "Thursday", eventDate: "2026-12-18", eventTime: "7:30 AM",
  venue: "Iyer Residence", venueAddress: "23 Temple Street, Mylapore, Chennai, Tamil Nadu 600004",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Iyer+Residence+Mylapore+Chennai",
  whatsappNumber: "919876543210", hostsName: "Karthik & Devika Iyer",
  countdownTitle: "Days to Griha Pravesham",
  findOurHome: "Right opposite the Kapaleeshwarar Temple tower. Look for the traditional brass lamp (kuthu vilakku) at the entrance.",
};

export default function HouseWarmingSouthIndian({ data = {}, isDraft, editable, onEdit, onStyleChange, templateData, }) {
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
  const displayDay = data.eventDay || formatDayOfWeek(m.eventDate, m.eventDay || 'Thursday');
  const mapUrl = m.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.venue)}`;
  const [tl, setTl] = useState({ d: "00", h: "00", m: "00", s: "00" });
  const [expired, setExpired] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => { const parseDate = (d, t) => { if (!d) return NaN; let v = new Date(`${d}T${t || '07:30:00'}`).getTime(); if (!isNaN(v)) return v; v = new Date(d).getTime(); return v; }; const target = parseDate(m.eventDate, m.eventTime); if (isNaN(target)) { setExpired(true); return; } const tick = () => { const d = target - Date.now(); if (d <= 0) { setExpired(true); return; } setTl({ d: String(Math.floor(d/86400000)).padStart(2,"0"), h: String(Math.floor((d%86400000)/3600000)).padStart(2,"0"), m: String(Math.floor((d%3600000)/60000)).padStart(2,"0"), s: String(Math.floor((d%60000)/1000)).padStart(2,"0") }); }; tick(); const i = setInterval(tick,1000); return () => clearInterval(i); }, [m.eventDate, m.eventTime]);

  return (
    <div className="min-h-screen bg-[#FFFDF7] text-stone-800 font-sans" style={{ containerType: 'inline-size', width: '100%', maxWidth: '100%' }}>
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden px-4 py-16">
        <div className="relative z-10 text-center max-w-lg mx-auto space-y-5">
          <div className="text-4xl">🪔</div>
          <Editable tag="p" value={m.heroIntro} field="heroIntro" onEdit={onEdit} editable={editable} className="text-orange-700 text-xs tracking-[0.3em] uppercase font-bold" placeholder="Griha Pravesham" />
          <Editable tag="h1" value={m.familyName} field="familyName" onEdit={onEdit} editable={editable} className="text-[clamp(2.1rem,10cqw,3.6rem)] font-extrabold text-orange-900 leading-[1] break-words" placeholder="Family" />
          <Editable tag="p" value={m.heroTagline} field="heroTagline" onEdit={onEdit} editable={editable} className="text-stone-600 text-sm font-medium max-w-sm mx-auto" placeholder="Tagline" multiline />
          <div className="flex items-center justify-center gap-3 text-stone-500 text-sm pt-2">
            <Calendar className="w-4 h-4 text-orange-600" /><Editable tag="span" value={m.eventDate} field="eventDate" onEdit={onEdit} editable={editable} className="font-semibold" placeholder="Date" />
            <span>•</span><Clock className="w-4 h-4 text-orange-600" /><Editable tag="span" value={m.eventTime} field="eventTime" onEdit={onEdit} editable={editable} className="font-semibold" placeholder="Time" />
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-orange-50/50">
        <div className="max-w-lg mx-auto text-center space-y-5">
          <Editable tag="h2" value={m.countdownTitle} field="countdownTitle" onEdit={onEdit} editable={editable} className="text-xl font-bold text-orange-800" placeholder="Countdown" />
          {expired ? <div className="text-2xl font-bold text-orange-700">Welcome to Our New Home! 🏡</div> : (
            <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto" role="timer" aria-live="polite" aria-label="Countdown timer">
              {[{l:'Days',v:tl.d},{l:'Hrs',v:tl.h},{l:'Min',v:tl.m},{l:'Sec',v:tl.s}].map(i=>(
                <div key={i.l} className="bg-white rounded-2xl p-3 shadow-sm border border-orange-100">
                  <div className="text-2xl sm:text-3xl font-extrabold text-orange-800">{i.v}</div>
                  <div className="text-[10px] text-stone-400 uppercase tracking-wider mt-1">{i.l}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-10 px-4">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-orange-600 text-xs font-bold tracking-[0.2em] uppercase"><Calendar className="w-4 h-4" /> Save the Date</div>
          <div className="bg-white rounded-3xl border border-orange-100 p-6 shadow-sm">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <Editable tag="div" value={displayDay} field="eventDay" onEdit={onEdit} editable={editable} className="text-2xl font-bold text-orange-700" placeholder="Day" />
                <div className="text-[10px] text-stone-400 uppercase">Day</div>
              </div>
              <div className="h-10 w-px bg-orange-100" />
              <div className="text-center">
                <Editable tag="div" value={m.eventDate} field="eventDate" onEdit={onEdit} editable={editable} className="text-2xl font-bold text-orange-700" placeholder="Date" />
                <div className="text-[10px] text-stone-400 uppercase">Date</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-stone-500 text-sm mt-3">
              <Clock className="w-4 h-4 text-orange-500" />
              <Editable tag="span" value={m.eventTime} field="eventTime" onEdit={onEdit} editable={editable} className="font-semibold" placeholder="Time" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 px-4">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-orange-600 text-xs font-bold tracking-[0.2em] uppercase"><MapPin className="w-4 h-4" /> Find Our Home</div>
          <div className="bg-white rounded-3xl border border-orange-100 p-6 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto"><Home className="w-6 h-6 text-orange-600" /></div>
            <Editable tag="h3" value={m.venue} field="venue" onEdit={onEdit} editable={editable} className="text-lg font-bold text-stone-800" placeholder="Home Name" />
            <Editable tag="p" value={m.venueAddress} field="venueAddress" onEdit={onEdit} editable={editable} className="text-stone-500 text-sm" placeholder="Address" />
            {m.findOurHome && <div className="bg-orange-50 border border-orange-100 rounded-xl p-3"><Editable tag="p" value={m.findOurHome} field="findOurHome" onEdit={onEdit} editable={editable} className="text-xs text-orange-800 leading-relaxed" placeholder="How to find us" /></div>}
            <div className="flex gap-3 justify-center">
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-600 text-white font-bold text-xs shadow-lg hover:bg-orange-700 transition-all"><ExternalLink className="w-4 h-4" /> Directions</a>
              <button onClick={() => { navigator.clipboard.writeText(`${m.venue}, ${m.venueAddress}`); setCopied(true); setTimeout(()=>setCopied(false),2500); }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 font-bold text-xs hover:bg-orange-100 transition-all">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? 'Copied!' : 'Copy'}</button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 px-4"><div className="max-w-lg mx-auto"><RsvpSection groomName={m.familyName} brideName="Housewarming" whatsappNumber={m.whatsappNumber} theme="light" /></div></section>
      <footer className="py-8 px-4 text-center border-t border-orange-100"><p className="text-stone-400 text-xs">With blessings, <Editable tag="span" value={m.hostsName} field="hostsName" onEdit={onEdit} editable={editable} className="text-orange-600 font-semibold" placeholder="Host" /></p></footer>
    </div>
  );
}
