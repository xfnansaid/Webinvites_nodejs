'use client';
import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Copy, Check, ExternalLink, Home, Flower2, Sparkles } from 'lucide-react';
import RsvpSection from './RsvpSection';

const Editable = ({ tag: Tag = "span", value, field, onEdit, editable = false, className = "", placeholder = "" }) => {
  const [editing, setEditing] = React.useState(false);
  const r = React.useRef(null);
  React.useEffect(() => { if (!editing && r.current && r.current.textContent !== (value ?? "")) r.current.textContent = value ?? ""; }, [value, editing]);
  const commit = () => { setEditing(false); if (r.current && onEdit) onEdit(field, (r.current.innerText || "").replace(/\u00a0/g, " ")); };
  if (!editable) return <Tag className={className}>{value || placeholder}</Tag>;
  return <Tag ref={r} contentEditable={editing} suppressContentEditableWarning onClick={() => !editing && setEditing(true)} onBlur={commit} onKeyDown={(e) => { if (editing && (e.key === "Enter" || e.key === "Escape")) { e.preventDefault(); commit(); } }} className={`${editing ? "outline-none ring-2 ring-red-400/60 rounded" : "cursor-pointer hover:ring-2 hover:ring-red-400/40 rounded transition-all"} ${className}`} title={!editing ? "Click to edit" : undefined}>{value || placeholder}</Tag>;
};

const D = {
  familyName: "The Iyer Family", heroTagline: "With the blessings of the Almighty", heroIntro: "Sri Ganeshaya Namah — You're invited to",
  eventDay: "Thursday", eventDate: "2026-12-18", eventTime: "7:30 AM",
  venue: "Iyer Residence", venueAddress: "23 Temple Street, Mylapore, Chennai, Tamil Nadu 600004",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Iyer+Residence+Mylapore+Chennai",
  whatsappNumber: "919876543210", hostsName: "Karthik & Devika Iyer",
  countdownTitle: "Days to Griha Pravesham",
  findOurHome: "Right opposite the Kapaleeshwarar Temple tower. Look for the traditional brass lamp (kuthu vilakku) at the entrance.",
};

export default function HouseWarmingSouthIndian({ data = {}, isDraft, editable, onEdit }) {
  const m = { ...D, ...data };
  const mapUrl = m.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.venue)}`;
  const [tl, setTl] = useState({ d: "00", h: "00", m: "00", s: "00" });
  const [expired, setExpired] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => { const parseDate = (d, t) => { if (!d) return NaN; let v = new Date(`${d}T${t || '07:30:00'}`).getTime(); if (!isNaN(v)) return v; v = new Date(d).getTime(); return v; }; const target = parseDate(m.eventDate, m.eventTime); if (isNaN(target)) { setExpired(true); return; } const tick = () => { const d = target - Date.now(); if (d <= 0) { setExpired(true); return; } setTl({ d: String(Math.floor(d/86400000)).padStart(2,"0"), h: String(Math.floor((d%86400000)/3600000)).padStart(2,"0"), m: String(Math.floor((d%3600000)/60000)).padStart(2,"0"), s: String(Math.floor((d%60000)/1000)).padStart(2,"0") }); }; tick(); const i = setInterval(tick,1000); return () => clearInterval(i); }, [m.eventDate, m.eventTime]);

  return (
    <div className="min-h-screen text-stone-800 font-sans">
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden px-4 py-16">
        <div className="absolute inset-0 pointer-events-none">
          <img src="https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&auto=format&fit=crop&q=80" alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#FFF5F0]/90 via-[#FFF0E8]/85 to-[#FFF8F2]/95" />
          <div className="absolute top-10 left-1/4 w-[400px] h-[400px] rounded-full bg-orange-200/30 blur-[100px]" />
          <div className="absolute bottom-10 right-1/4 w-[300px] h-[300px] rounded-full bg-red-100/30 blur-[80px]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #c2410c 1px, transparent 0)', backgroundSize: '20px 20px' }} />
        </div>
        <div className="relative z-10 text-center max-w-lg mx-auto space-y-5">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Flower2 className="w-5 h-5 text-orange-500" />
            <Sparkles className="w-4 h-4 text-amber-500" />
            <Flower2 className="w-5 h-5 text-orange-500" />
          </div>
          <Editable tag="p" value={m.heroIntro} field="heroIntro" onEdit={onEdit} editable={editable} className="text-orange-600 text-xs tracking-[0.2em] font-bold" placeholder="Sri Ganeshaya Namah — You're invited to" />
          <Editable tag="h1" value={m.familyName} field="familyName" onEdit={onEdit} editable={editable} className="text-[clamp(2rem,6vw,3.2rem)] font-bold text-orange-800 leading-[1.1]" placeholder="Family Name" />
          <Editable tag="p" value={m.heroTagline} field="heroTagline" onEdit={onEdit} editable={editable} className="italic text-stone-600" placeholder="With the blessings of the Almighty" />
          <div className="flex items-center justify-center gap-3 text-stone-500 text-sm pt-2">
            <Calendar className="w-4 h-4 text-orange-500" /><Editable tag="span" value={m.eventDate} field="eventDate" onEdit={onEdit} editable={editable} className="font-semibold" placeholder="Date" />
            <span>•</span><Clock className="w-4 h-4 text-orange-500" /><Editable tag="span" value={m.eventTime} field="eventTime" onEdit={onEdit} editable={editable} className="font-semibold" placeholder="Time" />
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-gradient-to-b from-[#FFF5F0] to-[#FFEDE0]">
        <div className="max-w-lg mx-auto text-center space-y-5">
          <Editable tag="h2" value={m.countdownTitle} field="countdownTitle" onEdit={onEdit} editable={editable} className="text-xl font-bold text-orange-700" placeholder="Days to Griha Pravesham" />
          {expired ? <p className="text-orange-700 font-bold">Welcome! 🏠</p> : (
            <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto" role="timer" aria-live="polite" aria-label="Countdown timer">
              {[{l:'Days',v:tl.d},{l:'Hrs',v:tl.h},{l:'Min',v:tl.m},{l:'Sec',v:tl.s}].map(i=>(
                <div key={i.l} className="bg-white border border-orange-200 rounded-2xl p-3 shadow-sm">
                  <div className="text-2xl font-bold text-orange-700">{i.v}</div>
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
              <div className="text-center"><div className="text-2xl font-bold text-orange-700">{m.eventDay}</div><div className="text-[10px] text-stone-400 uppercase">Day</div></div>
              <div className="h-10 w-px bg-orange-100" />
              <div className="text-center"><div className="text-2xl font-bold text-orange-700">{m.eventDate}</div><div className="text-[10px] text-stone-400 uppercase">Date</div></div>
            </div>
            <div className="flex items-center justify-center gap-2 text-stone-500 text-sm mt-3"><Clock className="w-4 h-4 text-orange-500" /><span>{m.eventTime}</span></div>
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
