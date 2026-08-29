'use client';
import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Copy, Check, ExternalLink, Home, Minus } from 'lucide-react';
import RsvpSection from './RsvpSection';

const Editable = ({ tag: Tag = "span", value, field, onEdit, editable = false, className = "", placeholder = "" }) => {
  const [editing, setEditing] = React.useState(false);
  const r = React.useRef(null);
  React.useEffect(() => { if (!editing && r.current && r.current.textContent !== (value ?? "")) r.current.textContent = value ?? ""; }, [value, editing]);
  const commit = () => { setEditing(false); if (r.current && onEdit) onEdit(field, (r.current.innerText || "").replace(/\u00a0/g, " ")); };
  if (!editable) return <Tag className={className}>{value || placeholder}</Tag>;
  return <Tag ref={r} contentEditable={editing} suppressContentEditableWarning onClick={() => !editing && setEditing(true)} onBlur={commit} onKeyDown={(e) => { if (editing && (e.key === "Enter" || e.key === "Escape")) { e.preventDefault(); commit(); } }} className={`${editing ? "outline-none ring-2 ring-stone-400/60 rounded" : "cursor-pointer hover:ring-2 hover:ring-stone-400/40 rounded transition-all"} ${className}`} title={!editing ? "Click to edit" : undefined}>{value || placeholder}</Tag>;
};

const D = {
  familyName: "The Kapoor Family", heroTagline: "Home is where the heart is", heroIntro: "We'd love to have you over",
  eventDay: "Saturday", eventDate: "2026-12-20", eventTime: "12:00 PM",
  venue: "Kapoor Residence", venueAddress: "56 Lotus Enclave, Hauz Khas, New Delhi 110016",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Kapoor+Residence+Hauz+Khas",
  whatsappNumber: "919876543210", hostsName: "Vikram & Neha Kapoor",
  countdownTitle: "Until You Visit",
  findOurHome: "Corner apartment on the 3rd floor. The building has a blue gate and a jasmine plant by the door.",
};

export default function HouseWarmingMinimalCream({ data = {}, isDraft, editable, onEdit }) {
  const m = { ...D, ...data };
  const mapUrl = m.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.venue)}`;
  const [tl, setTl] = useState({ d: "00", h: "00", m: "00", s: "00" });
  const [expired, setExpired] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => { const parseDate = (d, t) => { if (!d) return NaN; let v = new Date(`${d}T${t || '12:00:00'}`).getTime(); if (!isNaN(v)) return v; v = new Date(d).getTime(); return v; }; const target = parseDate(m.eventDate, m.eventTime); if (isNaN(target)) { setExpired(true); return; } const tick = () => { const d = target - Date.now(); if (d <= 0) { setExpired(true); return; } setTl({ d: String(Math.floor(d/86400000)).padStart(2,"0"), h: String(Math.floor((d%86400000)/3600000)).padStart(2,"0"), m: String(Math.floor((d%3600000)/60000)).padStart(2,"0"), s: String(Math.floor((d%60000)/1000)).padStart(2,"0") }); }; tick(); const i = setInterval(tick,1000); return () => clearInterval(i); }, [m.eventDate, m.eventTime]);

  return (
    <div className="min-h-screen text-stone-800 font-sans">
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden px-4 py-16">
        <div className="absolute inset-0 pointer-events-none">
          <img src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&auto=format&fit=crop&q=80" alt="" className="absolute inset-0 w-full h-full object-cover opacity-15" aria-hidden="true" />
          <div className="absolute inset-0 bg-[#FAF8F5]/85" />
        </div>
        <div className="relative z-10 text-center max-w-lg mx-auto space-y-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="h-px w-16 bg-stone-300" />
            <Home className="w-4 h-4 text-stone-400" />
            <span className="h-px w-16 bg-stone-300" />
          </div>
          <Editable tag="p" value={m.heroIntro} field="heroIntro" onEdit={onEdit} editable={editable} className="text-stone-400 text-xs tracking-[0.4em] uppercase font-medium" placeholder="We'd love to have you over" />
          <Editable tag="h1" value={m.familyName} field="familyName" onEdit={onEdit} editable={editable} className="text-[clamp(2rem,6vw,3.2rem)] font-light text-stone-800 leading-[1.15] tracking-tight" placeholder="Family Name" />
          <Editable tag="p" value={m.heroTagline} field="heroTagline" onEdit={onEdit} editable={editable} className="text-stone-400 text-base italic" placeholder="Home is where the heart is" />
          <div className="flex items-center justify-center gap-3 text-stone-500 text-sm pt-4">
            <Calendar className="w-4 h-4" /><Editable tag="span" value={m.eventDate} field="eventDate" onEdit={onEdit} editable={editable} className="font-medium" placeholder="Date" />
            <span className="text-stone-300">·</span><Clock className="w-4 h-4" /><Editable tag="span" value={m.eventTime} field="eventTime" onEdit={onEdit} editable={editable} className="font-medium" placeholder="Time" />
          </div>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-lg mx-auto text-center space-y-5">
          <Editable tag="h2" value={m.countdownTitle} field="countdownTitle" onEdit={onEdit} editable={editable} className="text-lg font-light text-stone-600" placeholder="Until You Visit" />
          {expired ? <p className="text-stone-600 font-medium">We're home! 🏠</p> : (
            <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto" role="timer" aria-live="polite" aria-label="Countdown timer">
              {[{l:'Days',v:tl.d},{l:'Hrs',v:tl.h},{l:'Min',v:tl.m},{l:'Sec',v:tl.s}].map(i=>(
                <div key={i.l} className="bg-white border border-stone-100 rounded-xl p-3">
                  <div className="text-2xl font-light text-stone-800">{i.v}</div>
                  <div className="text-[10px] text-stone-400 uppercase tracking-wider mt-1">{i.l}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-10 px-4">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-stone-500 text-xs tracking-[0.3em] uppercase"><Calendar className="w-3.5 h-3.5" /> Save the Date</div>
          <div className="bg-white rounded-2xl border border-stone-100 p-6">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center"><div className="text-xl font-medium text-stone-800">{m.eventDay}</div><div className="text-[10px] text-stone-400 uppercase">Day</div></div>
              <div className="h-8 w-px bg-stone-100" />
              <div className="text-center"><div className="text-xl font-medium text-stone-800">{m.eventDate}</div><div className="text-[10px] text-stone-400 uppercase">Date</div></div>
            </div>
            <div className="flex items-center justify-center gap-2 text-stone-500 text-sm mt-3"><Clock className="w-4 h-4" /><span className="font-medium">{m.eventTime}</span></div>
          </div>
        </div>
      </section>

      <section className="py-10 px-4">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-stone-500 text-xs tracking-[0.3em] uppercase"><MapPin className="w-3.5 h-3.5" /> Find Our Home</div>
          <div className="bg-white rounded-2xl border border-stone-100 p-6 space-y-4">
            <Editable tag="h3" value={m.venue} field="venue" onEdit={onEdit} editable={editable} className="text-lg font-medium text-stone-800" placeholder="Home" />
            <Editable tag="p" value={m.venueAddress} field="venueAddress" onEdit={onEdit} editable={editable} className="text-stone-500 text-sm" placeholder="Address" />
            {m.findOurHome && <div className="bg-stone-50 rounded-lg p-3"><Editable tag="p" value={m.findOurHome} field="findOurHome" onEdit={onEdit} editable={editable} className="text-xs text-stone-600 leading-relaxed" placeholder="Directions" /></div>}
            <div className="flex gap-3 justify-center">
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-stone-800 text-white font-medium text-xs hover:bg-stone-900 transition-all"><ExternalLink className="w-4 h-4" /> Directions</a>
              <button onClick={() => { navigator.clipboard.writeText(`${m.venue}, ${m.venueAddress}`); setCopied(true); setTimeout(()=>setCopied(false),2500); }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-stone-50 border border-stone-200 text-stone-600 font-medium text-xs hover:bg-stone-100 transition-all">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? 'Copied' : 'Copy'}</button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 px-4"><div className="max-w-lg mx-auto"><RsvpSection groomName={m.familyName} brideName="Housewarming" whatsappNumber={m.whatsappNumber} theme="light" /></div></section>
      <footer className="py-8 px-4 text-center border-t border-stone-100"><p className="text-stone-400 text-xs">— <Editable tag="span" value={m.hostsName} field="hostsName" onEdit={onEdit} editable={editable} className="text-stone-600 font-medium" placeholder="Host" /></p></footer>
    </div>
  );
}
