'use client';
import { formatDayOfWeek } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Copy, Check, ExternalLink, Home, TreePine, Leaf, Sparkles, Coffee } from 'lucide-react';
import RsvpSection from './RsvpSection';
import SharedEditable from './_Editable';

const D = {
  familyName: "The Menon Family", heroTagline: "A new chapter begins", heroIntro: "Please join us at",
  eventDay: "Sunday", eventDate: "2026-12-21", eventTime: "10:00 AM",
  venue: "Menon Residence", venueAddress: "18 Green Valley Lane, Kochi, Kerala 682011",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Menon+Residence+Kochi",
  whatsappNumber: "919876543210", hostsName: "Suresh & Lakshmi Menon",
  countdownTitle: "Until We Welcome You Home",
  findOurHome: "Take a left at the Signal after Ernakulam South Metro. The house is the green one with the brass lamp outside.",
};

export default function HouseWarmingModernGreen({ data = {}, isDraft, editable, onEdit, onStyleChange, templateData, }) {
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
  const displayDay = data.eventDay || formatDayOfWeek(m.eventDate, m.eventDay || 'Sunday');
  const mapUrl = m.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.venue)}`;
  const [tl, setTl] = useState({ d: "00", h: "00", m: "00", s: "00" });
  const [expired, setExpired] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => { const parseDate = (d, t) => { if (!d) return NaN; let v = new Date(`${d}T${t || '10:00:00'}`).getTime(); if (!isNaN(v)) return v; v = new Date(d).getTime(); return v; }; const target = parseDate(m.eventDate, m.eventTime); if (isNaN(target)) { setExpired(true); return; } const tick = () => { const d = target - Date.now(); if (d <= 0) { setExpired(true); return; } setTl({ d: String(Math.floor(d/86400000)).padStart(2,"0"), h: String(Math.floor((d%86400000)/3600000)).padStart(2,"0"), m: String(Math.floor((d%3600000)/60000)).padStart(2,"0"), s: String(Math.floor((d%60000)/1000)).padStart(2,"0") }); }; tick(); const i = setInterval(tick,1000); return () => clearInterval(i); }, [m.eventDate, m.eventTime]);
  useEffect(() => { if (!document.getElementById('hw-mg-fonts')) { const l = document.createElement('link'); l.id = 'hw-mg-fonts'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap'; document.head.appendChild(l); } }, []);

  return (
    <div className="min-h-screen bg-[#F4F9F5] text-stone-800 font-sans" style={{ containerType: 'inline-size', width: '100%', maxWidth: '100%' }}>
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden px-4 py-16">
        <div className="relative z-10 text-center max-w-lg mx-auto space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 flex items-center justify-center mx-auto text-emerald-700 shadow-sm"><Home className="w-6 h-6" /></div>
          <Editable tag="p" value={m.heroIntro} field="heroIntro" onEdit={onEdit} editable={editable} className="text-emerald-700 text-xs tracking-[0.3em] uppercase font-bold" placeholder="New Beginnings" />
          <Editable tag="h1" value={m.familyName} field="familyName" onEdit={onEdit} editable={editable} className="font-[DM_Serif_Display] text-[clamp(2.1rem,10cqw,3.6rem)] text-emerald-900 leading-[1] break-words" placeholder="Family Name" />
          <Editable tag="p" value={m.heroTagline} field="heroTagline" onEdit={onEdit} editable={editable} className="text-stone-600 text-sm max-w-sm mx-auto" placeholder="Tagline" multiline />
          <div className="flex items-center justify-center gap-3 text-stone-500 text-sm pt-2">
            <Calendar className="w-4 h-4 text-emerald-600" /><Editable tag="span" value={m.eventDate} field="eventDate" onEdit={onEdit} editable={editable} className="font-semibold" placeholder="Date" />
            <span>•</span><Clock className="w-4 h-4 text-emerald-600" /><Editable tag="span" value={m.eventTime} field="eventTime" onEdit={onEdit} editable={editable} className="font-semibold" placeholder="Time" />
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-emerald-50/50">
        <div className="max-w-lg mx-auto text-center space-y-5">
          <Editable tag="h2" value={m.countdownTitle} field="countdownTitle" onEdit={onEdit} editable={editable} className="font-[DM_Serif_Display] text-xl text-emerald-800" placeholder="Countdown" />
          {expired ? <p className="font-[DM_Serif_Display] text-emerald-800 text-xl">Our Doors Are Open! 🏡</p> : (
            <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto" role="timer" aria-live="polite" aria-label="Countdown timer">
              {[{l:'Days',v:tl.d},{l:'Hrs',v:tl.h},{l:'Min',v:tl.m},{l:'Sec',v:tl.s}].map(i=>(
                <div key={i.l} className="bg-white rounded-2xl p-3 shadow-sm border border-emerald-100">
                  <div className="font-[DM_Serif_Display] text-2xl sm:text-3xl text-emerald-800">{i.v}</div>
                  <div className="text-[10px] text-stone-400 uppercase tracking-wider mt-1">{i.l}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-10 px-4">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-emerald-600 text-xs font-bold tracking-[0.2em] uppercase"><Calendar className="w-4 h-4" /> Save the Date</div>
          <div className="bg-white rounded-3xl border border-emerald-100 p-6 shadow-sm">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <Editable tag="div" value={displayDay} field="eventDay" onEdit={onEdit} editable={editable} className="font-[DM_Serif_Display] text-2xl text-emerald-700" placeholder="Day" />
                <div className="text-[10px] text-stone-400 uppercase">Day</div>
              </div>
              <div className="h-10 w-px bg-emerald-100" />
              <div className="text-center">
                <Editable tag="div" value={m.eventDate} field="eventDate" onEdit={onEdit} editable={editable} className="font-[DM_Serif_Display] text-2xl text-emerald-700" placeholder="Date" />
                <div className="text-[10px] text-stone-400 uppercase">Date</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-stone-500 text-sm mt-3">
              <Clock className="w-4 h-4 text-emerald-500" />
              <Editable tag="span" value={m.eventTime} field="eventTime" onEdit={onEdit} editable={editable} className="font-semibold" placeholder="Time" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 px-4">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-emerald-600 text-xs font-bold tracking-[0.2em] uppercase"><MapPin className="w-4 h-4" /> Find Our Home</div>
          <div className="bg-white rounded-3xl border border-emerald-100 p-6 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto"><Home className="w-6 h-6 text-emerald-600" /></div>
            <Editable tag="h3" value={m.venue} field="venue" onEdit={onEdit} editable={editable} className="font-[DM_Serif_Display] text-lg text-stone-800" placeholder="Home Name" />
            <Editable tag="p" value={m.venueAddress} field="venueAddress" onEdit={onEdit} editable={editable} className="text-stone-500 text-sm" placeholder="Address" />
            {m.findOurHome && <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3"><Editable tag="p" value={m.findOurHome} field="findOurHome" onEdit={onEdit} editable={editable} className="text-xs text-emerald-800 leading-relaxed" placeholder="How to find us" /></div>}
            <div className="flex gap-3 justify-center">
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 text-white font-bold text-xs shadow-lg hover:bg-emerald-700 transition-all"><ExternalLink className="w-4 h-4" /> Directions</a>
              <button onClick={() => { navigator.clipboard.writeText(`${m.venue}, ${m.venueAddress}`); setCopied(true); setTimeout(()=>setCopied(false),2500); }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs hover:bg-emerald-100 transition-all">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? 'Copied!' : 'Copy'}</button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 px-4"><div className="max-w-lg mx-auto"><RsvpSection groomName={m.familyName} brideName="Housewarming" whatsappNumber={m.whatsappNumber} theme="light" /></div></section>
      <footer className="py-8 px-4 text-center border-t border-emerald-100"><p className="text-stone-400 text-xs">With love, <Editable tag="span" value={m.hostsName} field="hostsName" onEdit={onEdit} editable={editable} className="text-emerald-600 font-semibold" placeholder="Host" /></p></footer>
    </div>
  );
}
