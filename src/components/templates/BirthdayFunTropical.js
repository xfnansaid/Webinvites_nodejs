'use client';
import { formatDayOfWeek } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Copy, Check, ExternalLink, Star, PartyPopper, Trophy, Zap, Sun, Palmtree } from 'lucide-react';
import RsvpSection from './RsvpSection';
import SharedEditable from './_Editable';

const D = {
  celebrantName: "Rohan", age: "21", heroTagline: "Cheers to legal adulthood!", heroIntro: "You're invited to",
  eventDay: "Saturday", birthdayDate: "2026-12-20", birthdayTime: "6:00 PM",
  venue: "The Deckhouse", venueAddress: "42 Beach Road, Goa 403001",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Deckhouse+Goa",
  whatsappNumber: "919876543210", hostsName: "The D'Souza Family", countdownTitle: "Countdown to the Party", partyTheme: "Beach Bash",
};

export default function BirthdayFunTropical({ data = {}, isDraft, editable, onEdit, onStyleChange, templateData, }) {
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
  const displayDay = data.eventDay || formatDayOfWeek(m.birthdayDate, m.eventDay || 'Saturday');
  const mapUrl = m.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.venue)}`;
  const [tl, setTl] = useState({ d: "00", h: "00", m: "00", s: "00" });
  const [expired, setExpired] = useState(false);
  useEffect(() => { const parseDate = (d, t) => { if (!d) return NaN; let v = new Date(`${d}T${t || '18:00:00'}`).getTime(); if (!isNaN(v)) return v; v = new Date(d).getTime(); return v; }; const target = parseDate(m.birthdayDate, m.birthdayTime); if (isNaN(target)) { setExpired(true); return; } const tick = () => { const d = target - Date.now(); if (d <= 0) { setExpired(true); return; } setTl({ d: String(Math.floor(d/86400000)).padStart(2,"0"), h: String(Math.floor((d%86400000)/3600000)).padStart(2,"0"), m: String(Math.floor((d%3600000)/60000)).padStart(2,"0"), s: String(Math.floor((d%60000)/1000)).padStart(2,"0") }); }; tick(); const i = setInterval(tick,1000); return () => clearInterval(i); }, [m.birthdayDate, m.birthdayTime]);
  useEffect(() => { if (!document.getElementById('tropic-fonts')) { const l = document.createElement('link'); l.id = 'tropic-fonts'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&family=Nunito:wght@400;600;700&display=swap'; document.head.appendChild(l); } }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FF6B6B] via-[#FFA07A] to-[#FFD93D] text-white font-sans" style={{ containerType: 'inline-size', width: '100%', maxWidth: '100%' }}>
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden px-4 py-16">
        <div className="relative z-10 text-center max-w-lg mx-auto space-y-5">
          <div className="text-4xl animate-bounce">🌴</div>
          <Editable tag="p" value={m.heroIntro} field="heroIntro" onEdit={onEdit} editable={editable} className="text-white/80 text-xs tracking-[0.3em] uppercase font-bold" placeholder="Join us in paradise" />
          <Editable tag="h1" value={m.celebrantName} field="celebrantName" onEdit={onEdit} editable={editable} className="font-[Fredoka] text-[clamp(2.2rem,11cqw,3.8rem)] font-bold leading-[1] text-white drop-shadow-md break-words" placeholder="Name" />
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white font-[Fredoka] text-2xl font-bold">
            <Sun className="w-5 h-5 text-yellow-200 animate-spin" style={{ animationDuration: '8s' }} />
            <Editable tag="span" value={`Turning ${m.age}!`} field="age" onEdit={onEdit} editable={editable} placeholder="Turning 21!" />
          </div>
          <Editable tag="p" value={m.heroTagline} field="heroTagline" onEdit={onEdit} editable={editable} className="text-white/90 text-lg font-medium" placeholder="Sun, sand & celebration" />
          {m.partyTheme && <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm"><Palmtree className="w-3.5 h-3.5 text-yellow-200" /><Editable tag="span" value={m.partyTheme} field="partyTheme" onEdit={onEdit} editable={editable} className="text-white text-xs font-bold uppercase tracking-wider" placeholder="Theme" /></div>}
          <div className="flex items-center justify-center gap-3 text-white/80 text-sm pt-2">
            <Calendar className="w-4 h-4 text-yellow-200" /><Editable tag="span" value={m.birthdayDate} field="birthdayDate" onEdit={onEdit} editable={editable} className="font-semibold" placeholder="Date" />
            <span>•</span><Clock className="w-4 h-4 text-yellow-200" /><Editable tag="span" value={m.birthdayTime} field="birthdayTime" onEdit={onEdit} editable={editable} className="font-semibold" placeholder="Time" />
          </div>
        </div>
      </section>

      {/* Countdown */}
      <section className="py-12 px-4">
        <div className="max-w-lg mx-auto text-center space-y-5">
          <Editable tag="h2" value={m.countdownTitle} field="countdownTitle" onEdit={onEdit} editable={editable} className="font-[Fredoka] text-xl font-bold text-white uppercase tracking-wider" placeholder="Countdown" />
          {expired ? <div className="text-2xl font-bold text-yellow-200 animate-bounce">Party Time! 🍹</div> : (
            <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto" role="timer" aria-live="polite" aria-label="Countdown timer">
              {[{l:'Days',v:tl.d},{l:'Hrs',v:tl.h},{l:'Min',v:tl.m},{l:'Sec',v:tl.s}].map(i=>(
                <div key={i.l} className="bg-white/20 border border-white/30 rounded-2xl p-3 backdrop-blur-sm">
                  <div className="font-[Fredoka] text-2xl font-bold">{i.v}</div>
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
          <div className="inline-flex items-center gap-2 text-white/80 text-xs font-bold tracking-[0.2em] uppercase"><Calendar className="w-4 h-4" /> Save the Date</div>
          <div className="bg-white/15 border border-white/20 rounded-3xl p-6 backdrop-blur-sm space-y-3">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <Editable tag="div" value={displayDay} field="eventDay" onEdit={onEdit} editable={editable} className="font-[Fredoka] text-2xl font-bold text-white" placeholder="Day" />
                <div className="text-[10px] text-white/50 uppercase">Day</div>
              </div>
              <div className="h-10 w-px bg-white/20" />
              <div className="text-center">
                <Editable tag="div" value={m.birthdayDate} field="birthdayDate" onEdit={onEdit} editable={editable} className="font-[Fredoka] text-2xl font-bold text-white" placeholder="Date" />
                <div className="text-[10px] text-white/50 uppercase">Date</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-white/70 text-sm">
              <Clock className="w-4 h-4" />
              <Editable tag="span" value={m.birthdayTime} field="birthdayTime" onEdit={onEdit} editable={editable} className="font-semibold" placeholder="Time" />
            </div>
          </div>
        </div>
      </section>

      {/* Venue */}
      <section className="py-10 px-4">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-white/80 text-xs font-bold tracking-[0.2em] uppercase"><MapPin className="w-4 h-4" /> Party Venue</div>
          <div className="bg-white/15 border border-white/20 rounded-3xl p-6 backdrop-blur-sm space-y-3">
            <Editable tag="h3" value={m.venue} field="venue" onEdit={onEdit} editable={editable} className="font-[Fredoka] text-lg font-bold" placeholder="Venue" />
            <Editable tag="p" value={m.venueAddress} field="venueAddress" onEdit={onEdit} editable={editable} className="text-white/70 text-sm" placeholder="Address" />
            <div className="flex gap-3 justify-center">
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-orange-600 font-bold text-xs shadow-lg hover:bg-white/90 transition-all"><ExternalLink className="w-4 h-4" /> Directions</a>
              <button onClick={() => { navigator.clipboard.writeText(`${m.venue}, ${m.venueAddress}`); }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/20 border border-white/30 text-white font-bold text-xs hover:bg-white/30 transition-all"><Copy className="w-4 h-4" /> Copy</button>
            </div>
          </div>
        </div>
      </section>

      {/* RSVP */}
      <section className="py-10 px-4"><div className="max-w-lg mx-auto"><RsvpSection groomName={m.celebrantName} brideName={`${m.age}th Birthday`} whatsappNumber={m.whatsappNumber} theme="light" /></div></section>

      <footer className="py-8 px-4 text-center border-t border-white/10">
        <p className="text-white/50 text-xs">Hosted by <Editable tag="span" value={m.hostsName} field="hostsName" onEdit={onEdit} editable={editable} className="text-white/70 font-semibold" placeholder="Host" /></p>
      </footer>
    </div>
  );
}
