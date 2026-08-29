'use client';
import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Copy, Check, ExternalLink, Star, PartyPopper, Gift, Sparkles } from 'lucide-react';
import RsvpSection from './RsvpSection';

const Editable = ({ tag: Tag = "span", value, field, onEdit, editable = false, className = "", placeholder = "" }) => {
  const [editing, setEditing] = React.useState(false);
  const r = React.useRef(null);
  React.useEffect(() => { if (!editing && r.current && r.current.textContent !== (value ?? "")) r.current.textContent = value ?? ""; }, [value, editing]);
  const commit = () => { setEditing(false); if (r.current && onEdit) onEdit(field, (r.current.innerText || "").replace(/\u00a0/g, " ")); };
  if (!editable) return <Tag className={className}>{value || placeholder}</Tag>;
  return <Tag ref={r} contentEditable={editing} suppressContentEditableWarning onClick={() => !editing && setEditing(true)} onBlur={commit} onKeyDown={(e) => { if (editing && (e.key === "Enter" || e.key === "Escape")) { e.preventDefault(); commit(); } }} className={`${editing ? "outline-none ring-2 ring-yellow-400/60 rounded" : "cursor-pointer hover:ring-2 hover:ring-yellow-400/40 rounded transition-all"} ${className}`} title={!editing ? "Click to edit" : undefined}>{value || placeholder}</Tag>;
};

const D = {
  celebrantName: "Aanya", age: "7", heroTagline: "Come join the fun!", heroIntro: "You're invited to",
  eventDay: "Sunday", birthdayDate: "2026-12-21", birthdayTime: "3:00 PM",
  venue: "Rainbow Play Zone", venueAddress: "15 Sunshine Colony, Delhi 110001",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Rainbow+Play+Zone+Delhi",
  whatsappNumber: "919876543210", hostsName: "The Gupta Family", countdownTitle: "Days Until the Party!", partyTheme: "Unicorn Magic",
};

export default function BirthdayKidsColorful({ data = {}, isDraft, editable, onEdit }) {
  const m = { ...D, ...data };
  const mapUrl = m.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.venue)}`;
  const [tl, setTl] = useState({ d: "00", h: "00", m: "00", s: "00" });
  const [expired, setExpired] = useState(false);
  useEffect(() => { const parseDate = (d, t) => { if (!d) return NaN; let v = new Date(`${d}T${t || '15:00:00'}`).getTime(); if (!isNaN(v)) return v; v = new Date(d).getTime(); return v; }; const target = parseDate(m.birthdayDate, m.birthdayTime); if (isNaN(target)) { setExpired(true); return; } const tick = () => { const d = target - Date.now(); if (d <= 0) { setExpired(true); return; } setTl({ d: String(Math.floor(d/86400000)).padStart(2,"0"), h: String(Math.floor((d%86400000)/3600000)).padStart(2,"0"), m: String(Math.floor((d%3600000)/60000)).padStart(2,"0"), s: String(Math.floor((d%60000)/1000)).padStart(2,"0") }); }; tick(); const i = setInterval(tick,1000); return () => clearInterval(i); }, [m.birthdayDate, m.birthdayTime]);

  return (
    <div className="min-h-screen font-sans" style={{ background: 'linear-gradient(180deg, #FFE4F0 0%, #FFF0DB 30%, #E8F5E9 60%, #E3F2FD 100%)' }}>
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden px-4 py-16">
        <div className="absolute inset-0 pointer-events-none">
          {[...'🎈🎁🎉⭐✨🎊'].map((e, i) => (
            <div key={i} className="absolute text-4xl opacity-20 animate-bounce" style={{ top: `${15 + (i * 12) % 70}%`, left: `${5 + (i * 17) % 85}%`, animationDelay: `${i * 0.3}s` }}>{e}</div>
          ))}
        </div>
        <div className="relative z-10 text-center max-w-lg mx-auto space-y-5">
          <Editable tag="p" value={m.heroIntro} field="heroIntro" onEdit={onEdit} editable={editable} className="text-pink-500 text-xs tracking-[0.3em] uppercase font-bold" placeholder="You're invited to" />
          <Editable tag="h1" value={m.celebrantName} field="celebrantName" onEdit={onEdit} editable={editable} className="text-[clamp(2.8rem,8vw,5rem)] font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-500 leading-[0.95]" placeholder="Name" />
          <div className="flex items-center justify-center gap-3">
            <Gift className="w-6 h-6 text-pink-400" />
            <Editable tag="span" value={`${m.age}`} field="age" onEdit={onEdit} editable={editable} className="text-5xl font-black text-purple-500" placeholder="7" />
            <Sparkles className="w-6 h-6 text-yellow-400" />
          </div>
          <Editable tag="p" value={m.heroTagline} field="heroTagline" onEdit={onEdit} editable={editable} className="text-lg text-stone-600 font-semibold" placeholder="Come join the fun!" />
          {m.partyTheme && <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 border border-purple-200"><Star className="w-3.5 h-3.5 text-purple-500 fill-purple-500" /><Editable tag="span" value={m.partyTheme} field="partyTheme" onEdit={onEdit} editable={editable} className="text-purple-600 text-xs font-bold uppercase tracking-wider" placeholder="Theme" /></div>}
          <div className="flex items-center justify-center gap-3 text-stone-500 text-sm pt-2">
            <Calendar className="w-4 h-4 text-pink-400" /><Editable tag="span" value={m.birthdayDate} field="birthdayDate" onEdit={onEdit} editable={editable} className="font-semibold" placeholder="Date" />
            <span>•</span><Clock className="w-4 h-4 text-purple-400" /><Editable tag="span" value={m.birthdayTime} field="birthdayTime" onEdit={onEdit} editable={editable} className="font-semibold" placeholder="Time" />
          </div>
        </div>
      </section>

      {/* Countdown */}
      <section className="py-12 px-4">
        <div className="max-w-lg mx-auto text-center space-y-5">
          <Editable tag="h2" value={m.countdownTitle} field="countdownTitle" onEdit={onEdit} editable={editable} className="text-xl font-bold text-purple-600" placeholder="Days Until the Party!" />
          {expired ? <div className="space-y-2"><PartyPopper className="w-10 h-10 text-pink-500 mx-auto animate-bounce" /><p className="text-xl font-bold text-purple-600">Happy Birthday! 🎉</p></div> : (
            <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto" role="timer" aria-live="polite" aria-label="Countdown timer">
              {[{l:'Days',v:tl.d,color:'from-pink-400 to-pink-500'},{l:'Hrs',v:tl.h,color:'from-purple-400 to-purple-500'},{l:'Min',v:tl.m,color:'from-yellow-400 to-yellow-500'},{l:'Sec',v:tl.s,color:'from-green-400 to-green-500'}].map(i=>(
                <div key={i.l} className={`bg-gradient-to-br ${i.color} rounded-2xl p-3 text-white shadow-lg`}>
                  <div className="text-2xl font-black">{i.v}</div>
                  <div className="text-[10px] text-white/70 uppercase tracking-wider mt-1">{i.l}</div>
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
          <div className="bg-white rounded-3xl border border-pink-100 p-6 shadow-lg space-y-3">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center"><div className="text-2xl font-bold text-purple-600">{m.eventDay}</div><div className="text-[10px] text-stone-400 uppercase">Day</div></div>
              <div className="h-10 w-px bg-pink-100" />
              <div className="text-center"><div className="text-2xl font-bold text-purple-600">{m.birthdayDate}</div><div className="text-[10px] text-stone-400 uppercase">Date</div></div>
            </div>
            <div className="flex items-center justify-center gap-2 text-stone-500 text-sm"><Clock className="w-4 h-4 text-pink-400" /><span>{m.birthdayTime}</span></div>
          </div>
        </div>
      </section>

      {/* Venue */}
      <section className="py-10 px-4">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-pink-500 text-xs font-bold tracking-[0.2em] uppercase"><MapPin className="w-4 h-4" /> Party Venue</div>
          <div className="bg-white rounded-3xl border border-pink-100 p-6 shadow-lg space-y-3">
            <Editable tag="h3" value={m.venue} field="venue" onEdit={onEdit} editable={editable} className="text-lg font-bold text-stone-800" placeholder="Venue" />
            <Editable tag="p" value={m.venueAddress} field="venueAddress" onEdit={onEdit} editable={editable} className="text-stone-500 text-sm" placeholder="Address" />
            <div className="flex gap-3 justify-center">
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-xs shadow-lg hover:opacity-90 transition-all"><ExternalLink className="w-4 h-4" /> Directions</a>
              <button onClick={() => { navigator.clipboard.writeText(`${m.venue}, ${m.venueAddress}`); }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-pink-50 border border-pink-200 text-pink-600 font-bold text-xs hover:bg-pink-100 transition-all"><Copy className="w-4 h-4" /> Copy</button>
            </div>
          </div>
        </div>
      </section>

      {/* RSVP */}
      <section className="py-10 px-4"><div className="max-w-lg mx-auto"><RsvpSection groomName={m.celebrantName} brideName={`${m.age}th Birthday`} whatsappNumber={m.whatsappNumber} theme="light" /></div></section>

      <footer className="py-8 px-4 text-center">
        <p className="text-stone-400 text-xs">Hosted by <Editable tag="span" value={m.hostsName} field="hostsName" onEdit={onEdit} editable={editable} className="text-pink-500 font-semibold" placeholder="Host" /></p>
        <p className="text-stone-300 text-[10px] mt-2">Created with Web Invites</p>
      </footer>
    </div>
  );
}
