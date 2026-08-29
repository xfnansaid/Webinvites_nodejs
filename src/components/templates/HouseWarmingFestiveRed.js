'use client';
import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Copy, Check, ExternalLink, Home, Sparkles, Star, PartyPopper } from 'lucide-react';
import RsvpSection from './RsvpSection';

const Editable = ({ tag: Tag = "span", value, field, onEdit, editable = false, className = "", placeholder = "" }) => {
  const [editing, setEditing] = React.useState(false);
  const r = React.useRef(null);
  React.useEffect(() => { if (!editing && r.current && r.current.textContent !== (value ?? "")) r.current.textContent = value ?? ""; }, [value, editing]);
  const commit = () => { setEditing(false); if (r.current && onEdit) onEdit(field, (r.current.innerText || "").replace(/\u00a0/g, " ")); };
  if (!editable) return <Tag className={className}>{value || placeholder}</Tag>;
  return <Tag ref={r} contentEditable={editing} suppressContentEditableWarning onClick={() => !editing && setEditing(true)} onBlur={commit} onKeyDown={(e) => { if (editing && (e.key === "Enter" || e.key === "Escape")) { e.preventDefault(); commit(); } }} className={`${editing ? "outline-none ring-2 ring-amber-400/60 rounded" : "cursor-pointer hover:ring-2 hover:ring-amber-400/40 rounded transition-all"} ${className}`} title={!editing ? "Click to edit" : undefined}>{value || placeholder}</Tag>;
};

const D = {
  familyName: "The Nair Family", heroTagline: "Come celebrate our new beginning", heroIntro: "With great joy, we invite you to",
  eventDay: "Monday", eventDate: "2026-12-22", eventTime: "10:00 AM",
  venue: "Nair Heritage Home", venueAddress: "88 jasmine Lane, Trivandrum, Kerala 695001",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Nair+Heritage+Home+Trivandrum",
  whatsappNumber: "919876543210", hostsName: "Anil & Sreedevi Nair",
  countdownTitle: "Days Until the Celebration",
  findOurHome: "Behind the Sree Padmanabhaswamy Temple, second right. You'll see a red-tile roof house with a brass lamp outside.",
};

export default function HouseWarmingFestiveRed({ data = {}, isDraft, editable, onEdit }) {
  const m = { ...D, ...data };
  const mapUrl = m.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.venue)}`;
  const [tl, setTl] = useState({ d: "00", h: "00", m: "00", s: "00" });
  const [expired, setExpired] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => { const parseDate = (d, t) => { if (!d) return NaN; let v = new Date(`${d}T${t || '10:00:00'}`).getTime(); if (!isNaN(v)) return v; v = new Date(d).getTime(); return v; }; const target = parseDate(m.eventDate, m.eventTime); if (isNaN(target)) { setExpired(true); return; } const tick = () => { const d = target - Date.now(); if (d <= 0) { setExpired(true); return; } setTl({ d: String(Math.floor(d/86400000)).padStart(2,"0"), h: String(Math.floor((d%86400000)/3600000)).padStart(2,"0"), m: String(Math.floor((d%3600000)/60000)).padStart(2,"0"), s: String(Math.floor((d%60000)/1000)).padStart(2,"0") }); }; tick(); const i = setInterval(tick,1000); return () => clearInterval(i); }, [m.eventDate, m.eventTime]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#8B0000] via-[#A52A2A] to-[#8B0000] text-white font-sans">
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden px-4 py-16">
        <div className="absolute inset-0 pointer-events-none">
          <img src="https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&auto=format&fit=crop&q=80" alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#8B0000]/80 via-[#A52A2A]/85 to-[#8B0000]/90" />
          <div className="absolute top-20 left-1/3 w-[400px] h-[400px] rounded-full bg-amber-500/10 blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, gold 1px, transparent 0)', backgroundSize: '18px 18px' }} />
        </div>
        <div className="relative z-10 text-center max-w-lg mx-auto space-y-5">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <Sparkles className="w-5 h-5 text-amber-300" />
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <Editable tag="p" value={m.heroIntro} field="heroIntro" onEdit={onEdit} editable={editable} className="text-amber-300/80 text-xs tracking-[0.3em] uppercase font-bold" placeholder="With great joy, we invite you to" />
          <Editable tag="h1" value={m.familyName} field="familyName" onEdit={onEdit} editable={editable} className="text-[clamp(2rem,6vw,3.2rem)] font-bold text-amber-200 leading-[1.1]" placeholder="Family Name" />
          <Editable tag="p" value={m.heroTagline} field="heroTagline" onEdit={onEdit} editable={editable} className="text-white/70 italic" placeholder="Come celebrate our new beginning" />
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15">
            <Home className="w-4 h-4 text-amber-400" />
            <Editable tag="span" value="Housewarming & Griha Pravesh" field="partyTheme" onEdit={onEdit} editable={editable} className="text-amber-300 text-xs font-bold uppercase tracking-wider" placeholder="Housewarming & Griha Pravesh" />
          </div>
          <div className="flex items-center justify-center gap-3 text-white/60 text-sm pt-2">
            <Calendar className="w-4 h-4 text-amber-400" /><Editable tag="span" value={m.eventDate} field="eventDate" onEdit={onEdit} editable={editable} className="font-semibold" placeholder="Date" />
            <span>•</span><Clock className="w-4 h-4 text-amber-400" /><Editable tag="span" value={m.eventTime} field="eventTime" onEdit={onEdit} editable={editable} className="font-semibold" placeholder="Time" />
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-gradient-to-b from-[#8B0000] to-[#6B0000]">
        <div className="max-w-lg mx-auto text-center space-y-5">
          <Editable tag="h2" value={m.countdownTitle} field="countdownTitle" onEdit={onEdit} editable={editable} className="text-xl font-bold text-amber-300" placeholder="Days Until the Celebration" />
          {expired ? <div className="space-y-2"><PartyPopper className="w-10 h-10 text-amber-400 mx-auto animate-bounce" /><p className="text-amber-200 font-bold">Welcome! 🏠</p></div> : (
            <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto" role="timer" aria-live="polite" aria-label="Countdown timer">
              {[{l:'Days',v:tl.d},{l:'Hrs',v:tl.h},{l:'Min',v:tl.m},{l:'Sec',v:tl.s}].map(i=>(
                <div key={i.l} className="bg-white/10 border border-white/15 rounded-2xl p-3 backdrop-blur-sm">
                  <div className="text-2xl font-bold text-amber-300">{i.v}</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider mt-1">{i.l}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-10 px-4 bg-[#6B0000]">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-amber-300/80 text-xs font-bold tracking-[0.2em] uppercase"><Calendar className="w-4 h-4" /> Save the Date</div>
          <div className="bg-white/10 border border-white/15 rounded-3xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center"><div className="text-2xl font-bold text-amber-300">{m.eventDay}</div><div className="text-[10px] text-white/40 uppercase">Day</div></div>
              <div className="h-10 w-px bg-white/15" />
              <div className="text-center"><div className="text-2xl font-bold text-amber-300">{m.eventDate}</div><div className="text-[10px] text-white/40 uppercase">Date</div></div>
            </div>
            <div className="flex items-center justify-center gap-2 text-white/60 text-sm mt-3"><Clock className="w-4 h-4 text-amber-400" /><span>{m.eventTime}</span></div>
          </div>
        </div>
      </section>

      <section className="py-10 px-4 bg-gradient-to-b from-[#6B0000] to-[#8B0000]">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-amber-300/80 text-xs font-bold tracking-[0.2em] uppercase"><MapPin className="w-4 h-4" /> Find Our Home</div>
          <div className="bg-white/10 border border-white/15 rounded-3xl p-6 backdrop-blur-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 flex items-center justify-center mx-auto"><Home className="w-6 h-6 text-amber-400" /></div>
            <Editable tag="h3" value={m.venue} field="venue" onEdit={onEdit} editable={editable} className="text-lg font-bold text-amber-200" placeholder="Home" />
            <Editable tag="p" value={m.venueAddress} field="venueAddress" onEdit={onEdit} editable={editable} className="text-white/60 text-sm" placeholder="Address" />
            {m.findOurHome && <div className="bg-white/5 border border-white/10 rounded-xl p-3"><Editable tag="p" value={m.findOurHome} field="findOurHome" onEdit={onEdit} editable={editable} className="text-xs text-amber-200/80 leading-relaxed" placeholder="How to find us" /></div>}
            <div className="flex gap-3 justify-center">
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 text-stone-900 font-bold text-xs shadow-lg hover:bg-amber-400 transition-all"><ExternalLink className="w-4 h-4" /> Directions</a>
              <button onClick={() => { navigator.clipboard.writeText(`${m.venue}, ${m.venueAddress}`); setCopied(true); setTimeout(()=>setCopied(false),2500); }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 border border-white/20 text-white font-bold text-xs hover:bg-white/15 transition-all">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? 'Copied!' : 'Copy'}</button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 px-4 bg-[#8B0000]"><div className="max-w-lg mx-auto"><RsvpSection groomName={m.familyName} brideName="Housewarming" whatsappNumber={m.whatsappNumber} theme="dark" /></div></section>
      <footer className="py-8 px-4 text-center border-t border-white/10 bg-[#6B0000]"><p className="text-white/40 text-xs">With love, <Editable tag="span" value={m.hostsName} field="hostsName" onEdit={onEdit} editable={editable} className="text-amber-300/70 font-semibold" placeholder="Host" /></p></footer>
    </div>
  );
}
