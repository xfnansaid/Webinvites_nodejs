'use client';
import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Copy, Check, ExternalLink, Sparkles, Star, PartyPopper, Cake } from 'lucide-react';
import RsvpSection from './RsvpSection';

const Editable = ({ tag: Tag = "span", value, field, onEdit, editable = false, className = "", placeholder = "", multiline = false }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => { if (!isEditing && ref.current) { const c = ref.current.textContent || ""; if (c !== (value ?? "")) ref.current.textContent = value ?? ""; } }, [value, isEditing]);
  React.useEffect(() => { if (isEditing && ref.current) { ref.current.focus(); try { const r = document.createRange(); r.selectNodeContents(ref.current); window.getSelection().removeAllRanges(); window.getSelection().addRange(r); } catch(e){} } }, [isEditing]);
  const commit = () => { setIsEditing(false); if (ref.current && onEdit) onEdit(field, (ref.current.innerText || "").replace(/\u00a0/g, " ")); };
  if (!editable) return <Tag className={className}>{value || placeholder}</Tag>;
  return <Tag ref={ref} contentEditable={isEditing} suppressContentEditableWarning onClick={() => !isEditing && setIsEditing(true)} onBlur={commit} onKeyDown={(e) => { if (isEditing) { if (!multiline && e.key === "Enter") { e.preventDefault(); commit(); } if (e.key === "Escape") { e.preventDefault(); setIsEditing(false); } } }} className={`${isEditing ? "outline-none ring-2 ring-violet-400/60 rounded" : "cursor-pointer hover:ring-2 hover:ring-violet-400/40 rounded transition-all"} ${className}`} title={!isEditing ? "Click to edit" : undefined}>{value || placeholder}</Tag>;
};

const D = {
  celebrantName: "Arjun", age: "30", heroTagline: "Three decades of awesome", heroIntro: "You're invited to",
  eventDay: "Friday", birthdayDate: "2026-12-25", birthdayTime: "7:00 PM",
  venue: "Sky Lounge Rooftop", venueAddress: "12 MG Road, Mumbai, Maharashtra 400001",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Sky+Lounge+Mumbai",
  whatsappNumber: "919876543210", hostsName: "The Patel Family", countdownTitle: "Until the Bash", partyTheme: "Neon Night",
};

export default function BirthdayModernNeon({ data = {}, isDraft, editable, onEdit }) {
  const m = { ...D, ...data };
  const mapUrl = m.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.venue)}`;
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [tl, setTl] = useState({ d: "00", h: "00", m: "00", s: "00" });
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    // Robust date parsing — handle YYYY-MM-DD, MM/DD/YYYY, and other formats
    const parseDate = (dateStr, timeStr) => {
      if (!dateStr) return NaN;
      // Try ISO format first (YYYY-MM-DD)
      let t = new Date(`${dateStr}T${timeStr || '19:00:00'}`).getTime();
      if (!isNaN(t)) return t;
      // Try with T separator only
      t = new Date(dateStr).getTime();
      if (!isNaN(t)) return t;
      return NaN;
    };
    const t = parseDate(m.birthdayDate, m.birthdayTime);
    if (isNaN(t)) { setExpired(true); return; }
    const tick = () => { const d = t - Date.now(); if (d <= 0) { setExpired(true); return; } setTl({ d: String(Math.floor(d/86400000)).padStart(2,"0"), h: String(Math.floor((d%86400000)/3600000)).padStart(2,"0"), m: String(Math.floor((d%3600000)/60000)).padStart(2,"0"), s: String(Math.floor((d%60000)/1000)).padStart(2,"0") }); };
    tick(); const i = setInterval(tick,1000); return () => clearInterval(i);
  }, [m.birthdayDate, m.birthdayTime]);
  useEffect(() => { if (!document.getElementById('neon-fonts')) { const l = document.createElement('link'); l.id = 'neon-fonts'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&display=swap'; document.head.appendChild(l); } }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans">
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-5 py-2.5 rounded-2xl bg-violet-600 text-white text-xs font-bold shadow-xl">{toast}</div>}

      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden px-4 py-16">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] rounded-full bg-violet-600/20 blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/3 w-[250px] h-[250px] rounded-full bg-cyan-500/15 blur-[80px] animate-pulse" style={{animationDelay:'1s'}} />
        </div>
        <div className="relative z-10 text-center max-w-lg mx-auto space-y-5">
          <Editable tag="p" value={m.heroIntro} field="heroIntro" onEdit={onEdit} editable={editable} className="text-violet-400 text-xs tracking-[0.4em] uppercase font-bold" placeholder="You're invited to" />
          <Editable tag="h1" value={m.celebrantName} field="celebrantName" onEdit={onEdit} editable={editable} className="font-[Space_Grotesk] text-[clamp(2.8rem,8vw,5rem)] font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 leading-[0.95]" placeholder="Name" />
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-violet-500/30" />
            <Editable tag="span" value={`${m.age}th`} field="age" onEdit={onEdit} editable={editable} className="font-[Space_Grotesk] text-4xl font-black text-cyan-400" placeholder="30th" />
            <span className="h-px w-10 bg-violet-500/30" />
          </div>
          <Editable tag="p" value={m.heroTagline} field="heroTagline" onEdit={onEdit} editable={editable} className="text-stone-400 text-lg" placeholder="Three decades of awesome" />
          {m.partyTheme && <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20"><Sparkles className="w-3.5 h-3.5 text-violet-400" /><Editable tag="span" value={m.partyTheme} field="partyTheme" onEdit={onEdit} editable={editable} className="text-violet-300 text-xs font-bold uppercase tracking-wider" placeholder="Theme" /></div>}
          <div className="flex items-center justify-center gap-3 text-stone-500 text-sm pt-2">
            <Calendar className="w-4 h-4 text-violet-400" /><Editable tag="span" value={m.birthdayDate} field="birthdayDate" onEdit={onEdit} editable={editable} className="font-semibold" placeholder="Date" />
            <span>•</span><Clock className="w-4 h-4 text-cyan-400" /><Editable tag="span" value={m.birthdayTime} field="birthdayTime" onEdit={onEdit} editable={editable} className="font-semibold" placeholder="Time" />
          </div>
        </div>
      </section>

      {/* Countdown */}
      <section className="py-12 px-4 bg-gradient-to-b from-[#0a0a0f] to-[#12121a]">
        <div className="max-w-lg mx-auto text-center space-y-5">
          <Editable tag="h2" value={m.countdownTitle} field="countdownTitle" onEdit={onEdit} editable={editable} className="font-[Space_Grotesk] text-xl font-bold text-violet-400" placeholder="Until the Bash" />
          {expired ? <div className="space-y-2"><PartyPopper className="w-10 h-10 text-violet-400 mx-auto animate-bounce" /><p className="text-violet-300 font-bold">Let's Party! 🎉</p></div> : (
            <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto" role="timer" aria-live="polite" aria-label="Countdown timer">
              {[{l:'Days',v:tl.d},{l:'Hrs',v:tl.h},{l:'Min',v:tl.m},{l:'Sec',v:tl.s}].map(i=>(
                <div key={i.l} className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-3 backdrop-blur-sm">
                  <div className="font-[Space_Grotesk] text-2xl font-black text-violet-300">{i.v}</div>
                  <div className="text-[10px] text-stone-500 uppercase tracking-wider mt-1">{i.l}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Save the Date */}
      <section className="py-10 px-4 bg-[#12121a]">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-violet-400 text-xs font-bold tracking-[0.2em] uppercase"><Calendar className="w-4 h-4" /> Save the Date</div>
          <div className="bg-white/5 border border-violet-500/15 rounded-3xl p-6 space-y-3">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center"><div className="font-[Space_Grotesk] text-2xl font-bold text-violet-300">{m.eventDay}</div><div className="text-[10px] text-stone-500 uppercase">Day</div></div>
              <div className="h-10 w-px bg-violet-500/20" />
              <div className="text-center"><div className="font-[Space_Grotesk] text-2xl font-bold text-violet-300">{m.birthdayDate}</div><div className="text-[10px] text-stone-500 uppercase">Date</div></div>
            </div>
            <div className="flex items-center justify-center gap-2 text-stone-400 text-sm"><Clock className="w-4 h-4 text-cyan-400" /><span>{m.birthdayTime}</span></div>
          </div>
        </div>
      </section>

      {/* Venue */}
      <section className="py-10 px-4 bg-gradient-to-b from-[#12121a] to-[#0a0a0f]">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-violet-400 text-xs font-bold tracking-[0.2em] uppercase"><MapPin className="w-4 h-4" /> Party Venue</div>
          <div className="bg-white/5 border border-violet-500/15 rounded-3xl p-6 space-y-3">
            <Editable tag="h3" value={m.venue} field="venue" onEdit={onEdit} editable={editable} className="font-[Space_Grotesk] text-lg font-bold" placeholder="Venue" />
            <Editable tag="p" value={m.venueAddress} field="venueAddress" onEdit={onEdit} editable={editable} className="text-stone-400 text-sm" placeholder="Address" multiline />
            <div className="flex gap-3 justify-center">
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold text-xs shadow-lg hover:opacity-90 transition-all"><ExternalLink className="w-4 h-4" /> Directions</a>
              <button onClick={() => { navigator.clipboard.writeText(`${m.venue}, ${m.venueAddress}`); setCopied(true); setTimeout(()=>setCopied(false),2500); }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 border border-white/15 text-white font-bold text-xs hover:bg-white/15 transition-all">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? 'Copied!' : 'Copy'}</button>
            </div>
          </div>
        </div>
      </section>

      {/* RSVP */}
      <section className="py-10 px-4 bg-[#0a0a0f]">
        <div className="max-w-lg mx-auto"><RsvpSection groomName={m.celebrantName} brideName={`${m.age}th Birthday`} whatsappNumber={m.whatsappNumber} theme="dark" /></div>
      </section>

      <footer className="py-8 px-4 text-center border-t border-white/5">
        <p className="text-stone-600 text-xs">Hosted by <Editable tag="span" value={m.hostsName} field="hostsName" onEdit={onEdit} editable={editable} className="text-violet-400/70 font-semibold" placeholder="Host" /></p>
      </footer>
    </div>
  );
}
