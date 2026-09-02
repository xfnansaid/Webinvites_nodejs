'use client';
import { formatDayOfWeek } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Copy, Check, ExternalLink, Star, PartyPopper, Gift, Sparkles, Cake } from 'lucide-react';
import RsvpSection from './RsvpSection';
import SharedEditable from './_Editable';

const D = {
  celebrantName: "Aanya", age: "7", heroTagline: "Come join the fun!", heroIntro: "You're invited to",
  eventDay: "Sunday", birthdayDate: "2026-12-21", birthdayTime: "3:00 PM",
  venue: "Rainbow Play Zone", venueAddress: "15 Sunshine Colony, Delhi 110001",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Rainbow+Play+Zone+Delhi",
  whatsappNumber: "919876543210", hostsName: "The Gupta Family", countdownTitle: "Days Until the Party!", partyTheme: "Unicorn Magic",
};

export default function BirthdayKidsColorful({ data = {}, isDraft, editable, onEdit, onStyleChange, templateData, }) {
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
  const displayDay = data.eventDay || formatDayOfWeek(m.birthdayDate, m.eventDay || 'Sunday');
  const mapUrl = m.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.venue)}`;
  const [tl, setTl] = useState({ d: "00", h: "00", m: "00", s: "00" });
  const [expired, setExpired] = useState(false);
  useEffect(() => { const parseDate = (d, t) => { if (!d) return NaN; let v = new Date(`${d}T${t || '15:00:00'}`).getTime(); if (!isNaN(v)) return v; v = new Date(d).getTime(); return v; }; const target = parseDate(m.birthdayDate, m.birthdayTime); if (isNaN(target)) { setExpired(true); return; } const tick = () => { const d = target - Date.now(); if (d <= 0) { setExpired(true); return; } setTl({ d: String(Math.floor(d/86400000)).padStart(2,"0"), h: String(Math.floor((d%86400000)/3600000)).padStart(2,"0"), m: String(Math.floor((d%3600000)/60000)).padStart(2,"0"), s: String(Math.floor((d%60000)/1000)).padStart(2,"0") }); }; tick(); const i = setInterval(tick,1000); return () => clearInterval(i); }, [m.birthdayDate, m.birthdayTime]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF5F8] via-[#F8F0FF] to-[#F0F8FF] text-stone-800 font-sans" style={{ containerType: 'inline-size', width: '100%', maxWidth: '100%' }}>
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden px-4 py-16">
        <div className="relative z-10 text-center max-w-lg mx-auto space-y-5">
          <div className="text-4xl animate-bounce">🎈</div>
          <Editable tag="p" value={m.heroIntro} field="heroIntro" onEdit={onEdit} editable={editable} className="text-pink-500 text-xs tracking-[0.3em] uppercase font-bold" placeholder="Join us for fun" />
          <Editable tag="h1" value={m.celebrantName} field="celebrantName" onEdit={onEdit} editable={editable} className="text-[clamp(2.2rem,11cqw,3.8rem)] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 leading-[1] break-words" placeholder="Name" />
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-yellow-300 text-purple-900 font-black text-xl shadow-md transform -rotate-1">
            <Cake className="w-5 h-5" />
            <Editable tag="span" value={`Turning ${m.age}!`} field="age" onEdit={onEdit} editable={editable} placeholder="Turning 5!" />
          </div>
          <Editable tag="p" value={m.heroTagline} field="heroTagline" onEdit={onEdit} editable={editable} className="text-stone-500 text-base" placeholder="Games, cake & lots of fun!" />
          {m.partyTheme && <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold uppercase tracking-wider"><Sparkles className="w-3.5 h-3.5" /><Editable tag="span" value={m.partyTheme} field="partyTheme" onEdit={onEdit} editable={editable} placeholder="Theme" /></div>}
          <div className="flex items-center justify-center gap-3 text-stone-500 text-sm">
            <Calendar className="w-4 h-4 text-pink-500" /><Editable tag="span" value={m.birthdayDate} field="birthdayDate" onEdit={onEdit} editable={editable} className="font-semibold" placeholder="Date" />
            <span>•</span>
            <Clock className="w-4 h-4 text-purple-500" /><Editable tag="span" value={m.birthdayTime} field="birthdayTime" onEdit={onEdit} editable={editable} className="font-semibold" placeholder="Time" />
          </div>
        </div>
      </section>

      {/* Countdown */}
      <section className="py-12 px-4">
        <div className="max-w-lg mx-auto text-center space-y-5">
          <Editable tag="h2" value={m.countdownTitle} field="countdownTitle" onEdit={onEdit} editable={editable} className="text-xl font-bold text-purple-600" placeholder="Countdown" />
          {expired ? <div className="text-2xl font-bold text-pink-500 animate-bounce">Party Time! 🥳</div> : (
            <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto" role="timer" aria-live="polite" aria-label="Countdown timer">
              {[{l:'Days',v:tl.d,c:'bg-pink-100 text-pink-600'},{l:'Hours',v:tl.h,c:'bg-purple-100 text-purple-600'},{l:'Min',v:tl.m,c:'bg-blue-100 text-blue-600'},{l:'Sec',v:tl.s,c:'bg-yellow-100 text-yellow-700'}].map(i=>(
                <div key={i.l} className={`${i.c} rounded-2xl p-3 shadow-sm`}>
                  <div className="text-2xl sm:text-3xl font-extrabold">{i.v}</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider mt-1 opacity-70">{i.l}</div>
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
              <div className="text-center">
                <Editable tag="div" value={displayDay} field="eventDay" onEdit={onEdit} editable={editable} className="text-2xl font-bold text-purple-600" placeholder="Day" />
                <div className="text-[10px] text-stone-400 uppercase">Day</div>
              </div>
              <div className="h-10 w-px bg-pink-100" />
              <div className="text-center">
                <Editable tag="div" value={m.birthdayDate} field="birthdayDate" onEdit={onEdit} editable={editable} className="text-2xl font-bold text-purple-600" placeholder="Date" />
                <div className="text-[10px] text-stone-400 uppercase">Date</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-stone-500 text-sm">
              <Clock className="w-4 h-4 text-pink-400" />
              <Editable tag="span" value={m.birthdayTime} field="birthdayTime" onEdit={onEdit} editable={editable} className="font-semibold" placeholder="Time" />
            </div>
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
