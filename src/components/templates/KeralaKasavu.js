'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  ChevronDown, 
  Send, 
  Heart,
  CheckCircle2,
  Users,
  Phone,
  MessageSquare
} from 'lucide-react';

/**
 * Reusable Editable wrapper component for inline text editing in website builders.
 */
const Editable = ({ 
  tag: Tag = "span", 
  value, 
  field, 
  onEdit, 
  editable = false, 
  className = "", 
  placeholder = "", 
  multiline = false 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    if (!isEditing && elementRef.current) {
      const current = elementRef.current.textContent || "";
      const next = value ?? "";
      if (current !== next) elementRef.current.textContent = next;
    }
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing && elementRef.current) {
      elementRef.current.focus();
      try {
        const range = document.createRange();
        range.selectNodeContents(elementRef.current);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (e) {}
    }
  }, [isEditing]);

  const commit = () => {
    setIsEditing(false);
    if (elementRef.current && onEdit) {
      const text = elementRef.current.innerText || elementRef.current.textContent || "";
      onEdit(field, text.replace(/\u00a0/g, " "));
    }
  };

  const cancel = () => {
    if (elementRef.current) {
      elementRef.current.textContent = value ?? "";
    }
    setIsEditing(false);
  };

  if (!editable) return <Tag className={className}>{value || placeholder}</Tag>;

  return (
    <Tag
      ref={elementRef}
      contentEditable={isEditing}
      suppressContentEditableWarning={true}
      onClick={() => !isEditing && setIsEditing(true)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (isEditing) {
          if (!multiline && e.key === "Enter") { e.preventDefault(); commit(); }
          if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); cancel(); }
        }
      }}
      className={`
        ${isEditing
          ? "outline-none ring-2 ring-amber-600/60 rounded bg-amber-500/10"
          : "cursor-pointer ring-0 hover:ring-2 hover:ring-amber-500/50 rounded transition-all"
        }
        ${className}
      `}
      title={!isEditing ? "Click to edit" : undefined}
    >
      {value || (placeholder && !isEditing ? <span className="opacity-40">{placeholder}</span> : placeholder)}
    </Tag>
  );
};

// Default template data
const DEFAULT_DATA = {
  brideName: "Sreelakshmi",
  groomName: "Vijay",
  monogram: "S&V",
  eyebrowMal: "വിവാഹ ക്ഷണം",
  eyebrowEn: "Wedding Invitation",
  brideParents: "Daughter of Smt. Radhika & Sri. K. Narayanan",
  groomParents: "Son of Smt. Lakshmi & Sri. R. Menon",
  tagline: "Together with their families, request the honour of your presence as they begin their journey as one.",
  taglineMal: "സ്നേഹപൂർവ്വം ക്ഷണിക്കുന്നു",
  
  // Date & Time
  weddingDate: "2026-09-12",
  weddingDateFormatted: "Saturday, 12 September 2026",
  muhurthamTime: "8:00 AM",
  muhurthamNote: "Ceremony begins promptly at the auspicious hour",
  receptionTime: "7:00 PM onwards",
  receptionNote: "Dinner & Celebration",
  
  // Venue
  venue: "The Leela Raviz Kovalam",
  venueAddress: "Beach Road, Kovalam, Thiruvananthapuram, Kerala 695527",
  venueCity: "Thiruvananthapuram, Kerala",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=The+Leela+Raviz+Kovalam",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=The+Leela+Raviz+Kovalam",
  directionsUrl: "https://www.google.com/maps/search/?api=1&query=The+Leela+Raviz+Kovalam",
  dressCode: "Traditional Kerala Kasavu or Formal Ethnic",
  
  // Titles & Headings
  ceremonyTitle: "Ceremony Details",
  ceremonySubtitle: "Important Information",
  countdownTitle: "Counting down to forever",
  saveTheDateText: "Save The Date",
  saveTheDateNote: "Save the date adds the wedding schedule directly to your calendar app",
  
  // RSVP Section
  rsvpTitle: "RSVP via WhatsApp",
  rsvpSubtitle: "Kindly confirm your presence by August 30, 2026",
  rsvpWhatsAppNumber: "919876543210",
  
  // Footer
  footerLogo: "S & V",
  footerMark: "സ്നേഹപൂർവ്വം",
  footerSub: "WE LOOK FORWARD TO CELEBRATING WITH YOU",
  
  // Optional Background Audio
  audioUrl: "https://actions.google.com/sounds/v1/ambiences/outdoor_garden_peaceful.ogg"
};

export default function WeddingInvitation({ 
  data = {}, 
  isDraft = false, 
  editable = false, 
  onEdit 
}) {
  // Merge prop data with fallbacks
  const baseData = { ...DEFAULT_DATA, ...data };
  // Resolve canonical map URL from any field name
  const mapDefault = (baseData.venue || baseData.venueAddress)
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((baseData.venue || '') + ' ' + (baseData.venueAddress || ''))}`
    : "";
  const canonicalMapUrl = baseData.mapsUrl || baseData.mapUrl || baseData.directionsUrl || mapDefault;
  const mergedData = { ...baseData, mapsUrl: canonicalMapUrl, mapUrl: canonicalMapUrl, directionsUrl: canonicalMapUrl };

  // Helper to handle edits
  const handleEdit = (field, value) => {
    if (onEdit) {
      onEdit(field, value);
    }
  };

  // Dynamic Monogram derivation if not explicitly set
  const displayMonogram = mergedData.monogram || 
    `${(mergedData.brideName || 'S').charAt(0)}&${(mergedData.groomName || 'V').charAt(0)}`;

  // Real-time Countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00"
  });

  useEffect(() => {
    const calculateTime = () => {
      // Default to 8:00 AM on the wedding date
      const dateStr = mergedData.weddingDate || "2026-09-12";
      const targetDate = new Date(`${dateStr}T08:00:00`).getTime();
      const now = new Date().getTime();
      const diff = targetDate - now;

      if (isNaN(diff) || diff <= 0) {
        setTimeLeft({ days: "00", hours: "00", minutes: "00", seconds: "00" });
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({
        days: String(d).padStart(2, '0'),
        hours: String(h).padStart(2, '0'),
        minutes: String(m).padStart(2, '0'),
        seconds: String(s).padStart(2, '0')
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [mergedData.weddingDate]);

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.warn("Audio playback prevented:", e);
      });
    }
  };

  // Add to Calendar .ics generator
  const handleSaveTheDate = () => {
    const startIso = (mergedData.weddingDate || "2026-09-12").replace(/-/g, '') + "T080000";
    const endIso = (mergedData.weddingDate || "2026-09-12").replace(/-/g, '') + "T220000";
    
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      `PRODID:-//${mergedData.brideName}-${mergedData.groomName}-Wedding//EN`,
      "BEGIN:VEVENT",
      `UID:${Date.now()}@wedding-invite`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${startIso}`,
      `DTEND:${endIso}`,
      `SUMMARY:${mergedData.brideName} & ${mergedData.groomName}'s Wedding`,
      `DESCRIPTION:Join us as ${mergedData.brideName} and ${mergedData.groomName} begin their journey together. Muhurtham at ${mergedData.muhurthamTime}, reception from ${mergedData.receptionTime}.`,
      `LOCATION:${mergedData.venue}, ${mergedData.venueAddress}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${mergedData.brideName}-${mergedData.groomName}-Wedding.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // WhatsApp RSVP Form State
  const [rsvpState, setRsvpState] = useState({
    name: '',
    attendance: 'Joyfully Accepts',
    guests: '1',
    phone: '',
    attendingEvents: ['Ceremony', 'Reception'],
    note: ''
  });

  const handleEventCheckbox = (eventName) => {
    setRsvpState(prev => {
      const exists = prev.attendingEvents.includes(eventName);
      return {
        ...prev,
        attendingEvents: exists 
          ? prev.attendingEvents.filter(e => e !== eventName)
          : [...prev.attendingEvents, eventName]
      };
    });
  };

  const handleRsvpSubmit = (e) => {
    e.preventDefault();
    let message = `*RSVP for ${mergedData.brideName} & ${mergedData.groomName}'s Wedding*\n\n`;
    message += `👤 *Name:* ${rsvpState.name || 'Guest'}\n`;
    message += `💌 *Attendance:* ${rsvpState.attendance}\n`;

    if (rsvpState.attendance === 'Joyfully Accepts') {
      message += `👥 *Number of Guests:* ${rsvpState.guests}\n`;
      if (rsvpState.attendingEvents.length > 0) {
        message += `🎉 *Events Attending:* ${rsvpState.attendingEvents.join(', ')}\n`;
      }
    }

    if (rsvpState.phone) {
      message += `📞 *Phone:* ${rsvpState.phone}\n`;
    }

    if (rsvpState.note) {
      message += `📝 *Note/Wishes:* ${rsvpState.note}\n`;
    }

    const cleanNumber = (mergedData.rsvpWhatsAppNumber || '').replace(/[^0-9]/g, '');
    const encodedMsg = encodeURIComponent(message);
    const whatsappUrl = cleanNumber 
      ? `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodedMsg}`
      : `https://api.whatsapp.com/send?text=${encodedMsg}`;
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div style={{ containerType: 'inline-size', width: '100%', maxWidth: '100%', margin: 0, padding: 0 }}  className="relative min-h-screen bg-[#FAF7F2] text-[#2C2A29] font-serif overflow-x-hidden selection:bg-[#5E2129] selection:text-[#DFD3BA]">
      
      {/* Subtle background dot pattern */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.035] z-0"
        style={{
          backgroundImage: 'radial-gradient(#B89758 1px, transparent 1px), radial-gradient(#B89758 1px, #FAF7F2 1px)',
          backgroundSize: '32px 32px',
          backgroundPosition: '0 0, 16px 16px'
        }}
      />

      {/* Falling Petals Background Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[2]">
        {[
          { left: '8%', delay: 0, duration: 18 },
          { left: '24%', delay: 3, duration: 22 },
          { left: '46%', delay: 1, duration: 16 },
          { left: '68%', delay: 4, duration: 20 },
          { left: '82%', delay: 2, duration: 19 },
          { left: '94%', delay: 5, duration: 23 },
        ].map((petal, i) => (
          <motion.span
            key={i}
            className="absolute -top-10 w-2.5 h-3.5 rounded-[15%_85%_15%_85%] opacity-40"
            style={{
              left: petal.left,
              background: 'linear-gradient(135deg, #EAD5D7, #DFD3BA)'
            }}
            animate={{
              y: ['0cqh', '110cqh'],
              rotate: [0, 360],
              scale: [0.8, 1, 0.9],
              opacity: [0, 0.5, 0.5, 0]
            }}
            transition={{
              duration: petal.duration,
              delay: petal.delay,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}

        {/* Twinkling Golden Sparkles */}
        {[
          { top: '18%', left: '14%', delay: 0.5 },
          { top: '34%', left: '86%', delay: 1.2 },
          { top: '58%', left: '22%', delay: 2.5 },
          { top: '74%', left: '72%', delay: 0.8 },
        ].map((sp, i) => (
          <motion.span
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-[#B89758]"
            style={{ top: sp.top, left: sp.left }}
            animate={{
              scale: [0.5, 1.8, 0.5],
              opacity: [0, 0.7, 0],
              boxShadow: [
                '0 0 0px #B89758',
                '0 0 10px #B89758',
                '0 0 0px #B89758'
              ]
            }}
            transition={{
              duration: 4,
              delay: sp.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Floating Background Audio Control */}
      {mergedData.audioUrl && (
        <>
          <audio ref={audioRef} src={mergedData.audioUrl} loop preload="auto" />
          <motion.button
            onClick={toggleAudio}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#F3EFEA] text-[#B89758] border border-[#B89758]/40 shadow-xl flex items-center justify-center transition-colors hover:bg-white"
            title={isPlaying ? "Mute Background Music" : "Play Background Music"}
            aria-label="Toggle Music"
          >
            {isPlaying ? (
              <div className="relative flex items-center justify-center">
                <Volume2 className="w-6 h-6 text-[#5E2129]" />
                <motion.span 
                  className="absolute -top-3 -right-2 text-[10px] text-[#B89758] font-bold"
                  animate={{ y: [-2, -18], opacity: [0, 1, 0], x: [0, 6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                >
                  ♪
                </motion.span>
              </div>
            ) : (
              <VolumeX className="w-6 h-6 text-[#6C6863]" />
            )}
          </motion.button>
        </>
      )}

      {/* ================= SECTION 1: HERO ================= */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-6 py-24 sm:py-32">
        
        {/* Traditional Arch Frame */}
        <div className="absolute inset-4 sm:inset-8 border border-[#DFD3BA] rounded-t-[140px] sm:rounded-t-[180px] pointer-events-none z-0">
          <div className="absolute inset-2 border-[0.5px] border-[#B89758]/30 rounded-t-[132px] sm:rounded-t-[172px]" />
        </div>

        {/* Hanging Traditional Golden Bells */}
        <div className="absolute top-0 left-0 right-0 flex justify-center gap-14 sm:gap-24 px-6 pointer-events-none z-10">
          {[0, 0.5, 1].map((delay, index) => (
            <motion.div
              key={index}
              className="origin-top flex flex-col items-center"
              animate={{ rotate: [-3.5, 3.5, -3.5] }}
              transition={{ duration: 4, delay, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg viewBox="0 0 24 40" className="w-4 sm:w-5 opacity-75">
                <path d="M12 0v6" stroke="#B89758" strokeWidth="1.2" />
                <path d="M6 10c0-4 3-6 6-6s6 2 6 6l2 10H4z" fill="#DFD3BA" />
                <circle cx="12" cy="24" r="2.2" fill="#5E2129" />
              </svg>
            </motion.div>
          ))}
        </div>

        {/* Monogram Seal */}
        <motion.div 
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative z-10 w-16 h-16 rounded-full border border-[#B89758] flex items-center justify-center text-xl font-normal text-[#B89758] mb-6 bg-[#FAF7F2]/90 shadow-[0_4px_16px_rgba(184,151,88,0.18)]"
          style={{ fontFamily: "'Marcellus', serif, Georgia" }}
        >
          <Editable
            value={displayMonogram}
            field="monogram"
            onEdit={handleEdit}
            editable={editable}
            placeholder="S&V"
          />
        </motion.div>

        {/* Eyebrows */}
        <motion.div
          initial={{ y: -15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
          className="relative z-10 space-y-1.5"
        >
          <p className="text-lg sm:text-xl text-[#5E2129] font-medium tracking-wide">
            <Editable
              value={mergedData.eyebrowMal}
              field="eyebrowMal"
              onEdit={handleEdit}
              editable={editable}
              placeholder="വിവാഹ ക്ഷണം"
            />
          </p>
          <p className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-[#6C6863] font-sans font-semibold mb-6">
            <Editable
              value={mergedData.eyebrowEn}
              field="eyebrowEn"
              onEdit={handleEdit}
              editable={editable}
              placeholder="Wedding Invitation"
            />
          </p>
        </motion.div>

        {/* Couple Names & Traditional Centerpiece */}
        <div className="relative z-10 my-4 flex flex-col items-center">
          
          {/* Bride */}
          <motion.div
            initial={{ y: 35, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.1, delay: 0.2, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <h1 
              className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-[#3A1218] font-normal leading-tight tracking-tight"
              style={{ fontFamily: "'Marcellus', serif, Georgia" }}
            >
              <Editable
                value={mergedData.brideName}
                field="brideName"
                onEdit={handleEdit}
                editable={editable}
                placeholder="Bride Name"
              />
            </h1>
            <p className="text-xs uppercase tracking-wider text-[#6C6863] font-sans mt-1 mb-3">
              <Editable
                value={mergedData.brideParents}
                field="brideParents"
                onEdit={handleEdit}
                editable={editable}
                placeholder="Daughter of..."
              />
            </p>
          </motion.div>

          {/* Traditional Ampersand / Nilavilakku & Peacocks Row */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 my-3">
            {/* Left Peacock */}
            <svg className="w-8 sm:w-10 opacity-85" viewBox="0 0 60 60" fill="none">
              <path d="M30 40c-4-10-2-20 4-26" stroke="#3D5A47" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="35" cy="12" r="4" fill="#3D5A47" />
              <circle cx="35" cy="12" r="1.5" fill="#B89758" />
              <path d="M30 40c6-8 14-10 22-6M30 40c6-4 15-3 20 2" stroke="#B89758" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M28 42c-3-3-9-3-12 0" stroke="#5E2129" strokeWidth="2" strokeLinecap="round" />
            </svg>

            {/* Sacred Lamp (Nilavilakku) with Animated Flickering Flame */}
            <svg className="w-8 sm:w-10" viewBox="0 0 60 90" fill="none">
              <motion.path 
                className="origin-bottom"
                d="M30 8c5 7 6 12 2 17-2-2-4-2-6 0-3-5-2-11 4-17z" 
                fill="#D4AF37"
                animate={{ 
                  scaleY: [1, 1.15, 0.95, 1],
                  scaleX: [1, 0.94, 1.05, 1],
                  opacity: [0.9, 1, 0.85, 0.9] 
                }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
              <ellipse cx="30" cy="34" rx="8" ry="4" fill="#B89758" />
              <path d="M16 40h28l-3 8H19z" fill="#DFD3BA" />
              <rect x="28" y="48" width="4" height="24" fill="#B89758" />
              <ellipse cx="30" cy="74" rx="16" ry="4" fill="#DFD3BA" />
            </svg>

            {/* Right Peacock (Flipped) */}
            <svg className="w-8 sm:w-10 opacity-85 scale-x-[-1]" viewBox="0 0 60 60" fill="none">
              <path d="M30 40c-4-10-2-20 4-26" stroke="#3D5A47" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="35" cy="12" r="4" fill="#3D5A47" />
              <circle cx="35" cy="12" r="1.5" fill="#B89758" />
              <path d="M30 40c6-8 14-10 22-6M30 40c6-4 15-3 20 2" stroke="#B89758" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M28 42c-3-3-9-3-12 0" stroke="#5E2129" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          {/* Groom */}
          <motion.div
            initial={{ y: 35, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.1, delay: 0.35, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <h1 
              className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-[#3A1218] font-normal leading-tight tracking-tight"
              style={{ fontFamily: "'Marcellus', serif, Georgia" }}
            >
              <Editable
                value={mergedData.groomName}
                field="groomName"
                onEdit={handleEdit}
                editable={editable}
                placeholder="Groom Name"
              />
            </h1>
            <p className="text-xs uppercase tracking-wider text-[#6C6863] font-sans mt-1 mb-2">
              <Editable
                value={mergedData.groomParents}
                field="groomParents"
                onEdit={handleEdit}
                editable={editable}
                placeholder="Son of..."
              />
            </p>
          </motion.div>
        </div>

        {/* Tagline */}
        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.45, ease: "easeOut" }}
          className="relative z-10 max-w-lg mt-6"
        >
          <p className="text-lg sm:text-xl italic text-[#2C2A29] leading-relaxed">
            <Editable
              value={mergedData.tagline}
              field="tagline"
              onEdit={handleEdit}
              editable={editable}
              multiline
              placeholder="Together with their families..."
            />
          </p>
          <p className="text-base sm:text-lg text-[#5E2129] font-medium mt-3">
            <Editable
              value={mergedData.taglineMal}
              field="taglineMal"
              onEdit={handleEdit}
              editable={editable}
              placeholder="സ്നേഹപൂർവ്വം ക്ഷണിക്കുന്നു"
            />
          </p>
        </motion.div>

        {/* Elegant Dot & Line Divider */}
        <div className="flex items-center gap-3 my-7">
          <span className="w-10 h-[1px] bg-[#DFD3BA]" />
          <i className="w-1.5 h-1.5 rounded-full bg-[#B89758] inline-block" />
          <span className="w-10 h-[1px] bg-[#DFD3BA]" />
        </div>

        {/* Scroll Prompt */}
        <motion.a 
          href="#details"
          className="relative z-10 flex flex-col items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-[#6C6863] font-sans font-medium hover:text-[#5E2129] transition-colors"
        >
          <span>Discover More</span>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="w-4 h-4 text-[#B89758]" />
          </motion.div>
        </motion.a>
      </section>

      {/* ================= MARQUEE SLIDER BANNER ================= */}
      <div className="relative z-20 w-full overflow-hidden bg-[#3A1218] text-[#DFD3BA] py-4 border-y border-[#B89758] shadow-md">
        <motion.div
          className="flex whitespace-nowrap gap-8 text-sm sm:text-base font-normal tracking-[0.2em] uppercase"
          style={{ fontFamily: "'Marcellus', serif, Georgia" }}
          animate={{ x: [0, -1000] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        >
          {Array(4).fill(null).map((_, idx) => (
            <div key={idx} className="flex items-center gap-8">
              <span>{mergedData.brideName} & {mergedData.groomName}</span>
              <span className="text-[#B89758]">✦</span>
              <span>{mergedData.weddingDateFormatted}</span>
              <span className="text-[#B89758]">✦</span>
              <span>{mergedData.venue}</span>
              <span className="text-[#B89758]">✦</span>
              <span>{mergedData.venueCity}</span>
              <span className="text-[#B89758]">✦</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ================= SECTION 2: CEREMONY DETAILS & COUNTDOWN ================= */}
      <section id="details" className="relative z-10 py-24 sm:py-32 px-6 bg-[#F3EFEA] flex flex-col items-center text-center">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <h2 
            className="text-3xl sm:text-4xl md:text-5xl text-[#3A1218] mb-2"
            style={{ fontFamily: "'Marcellus', serif, Georgia" }}
          >
            <Editable
              value={mergedData.ceremonyTitle}
              field="ceremonyTitle"
              onEdit={handleEdit}
              editable={editable}
              placeholder="Ceremony Details"
            />
          </h2>
          <p className="text-xs uppercase tracking-[0.25em] text-[#3D5A47] font-sans font-semibold">
            <Editable
              value={mergedData.ceremonySubtitle}
              field="ceremonySubtitle"
              onEdit={handleEdit}
              editable={editable}
              placeholder="Important Information"
            />
          </p>
        </motion.div>

        {/* Info Card */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="w-full max-w-xl bg-white/80 backdrop-blur-md border border-[#B89758]/30 rounded-2xl p-7 sm:p-11 mb-12 shadow-[0_15px_40px_rgba(0,0,0,0.04)]"
        >
          
          {/* Date Row */}
          <div className="flex flex-col py-5 border-b border-[#B89758]/15 first:pt-0">
            <span className="text-[11px] uppercase tracking-[0.25em] text-[#3D5A47] font-sans font-semibold mb-1">
              Date
            </span>
            <span className="text-xl sm:text-2xl text-[#2C2A29] font-semibold">
              <Editable
                value={mergedData.weddingDateFormatted}
                field="weddingDateFormatted"
                onEdit={handleEdit}
                editable={editable}
                placeholder="Saturday, 12 September 2026"
              />
            </span>
          </div>

          {/* Muhurtham Row */}
          <div className="flex flex-col py-5 border-b border-[#B89758]/15">
            <span className="text-[11px] uppercase tracking-[0.25em] text-[#3D5A47] font-sans font-semibold mb-1">
              Muhurtham
            </span>
            <span className="text-xl sm:text-2xl text-[#2C2A29] font-semibold">
              <Editable
                value={mergedData.muhurthamTime}
                field="muhurthamTime"
                onEdit={handleEdit}
                editable={editable}
                placeholder="8:00 AM"
              />
            </span>
            <small className="font-sans font-normal text-xs text-[#6C6863] mt-1">
              <Editable
                value={mergedData.muhurthamNote}
                field="muhurthamNote"
                onEdit={handleEdit}
                editable={editable}
                placeholder="Ceremony begins promptly at the auspicious hour"
              />
            </small>
          </div>

          {/* Reception Row */}
          <div className="flex flex-col py-5 border-b border-[#B89758]/15">
            <span className="text-[11px] uppercase tracking-[0.25em] text-[#3D5A47] font-sans font-semibold mb-1">
              Reception
            </span>
            <span className="text-xl sm:text-2xl text-[#2C2A29] font-semibold">
              <Editable
                value={mergedData.receptionTime}
                field="receptionTime"
                onEdit={handleEdit}
                editable={editable}
                placeholder="7:00 PM onwards"
              />
            </span>
            {mergedData.receptionNote && (
              <small className="font-sans font-normal text-xs text-[#6C6863] mt-1">
                <Editable
                  value={mergedData.receptionNote}
                  field="receptionNote"
                  onEdit={handleEdit}
                  editable={editable}
                  placeholder="Dinner & Celebration"
                />
              </small>
            )}
          </div>

          {/* Venue Row */}
          <div className="flex flex-col py-5 border-b border-[#B89758]/15">
            <span className="text-[11px] uppercase tracking-[0.25em] text-[#3D5A47] font-sans font-semibold mb-1">
              Venue
            </span>
            <span className="text-xl sm:text-2xl text-[#2C2A29] font-semibold">
              <Editable
                value={mergedData.venue}
                field="venue"
                onEdit={handleEdit}
                editable={editable}
                placeholder="The Leela Raviz Kovalam"
              />
            </span>
            <small className="font-sans font-normal text-xs text-[#6C6863] mt-1 max-w-md mx-auto leading-relaxed">
              <Editable
                value={mergedData.venueAddress}
                field="venueAddress"
                onEdit={handleEdit}
                editable={editable}
                multiline
                placeholder="Beach Road, Kovalam, Thiruvananthapuram, Kerala 695527"
              />
            </small>
            {/* Get Directions Button */}
            <a
              href={mergedData.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5E2129] text-[#F5EFE0] font-sans font-semibold text-[11px] uppercase tracking-[0.15em] hover:bg-[#4a1a21] transition-colors shadow-sm mx-auto"
            >
              <MapPin size={14} />
              Get Directions
            </a>
          </div>

          {/* Dress Code Row */}
          <div className="flex flex-col pt-5">
            <span className="text-[11px] uppercase tracking-[0.25em] text-[#3D5A47] font-sans font-semibold mb-1">
              Dress Code
            </span>
            <span className="text-lg text-[#2C2A29] font-normal">
              <Editable
                value={mergedData.dressCode}
                field="dressCode"
                onEdit={handleEdit}
                editable={editable}
                placeholder="Traditional Kerala Kasavu or Formal Ethnic"
              />
            </span>
          </div>

        </motion.div>

        {/* Countdown Timer */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="w-full flex flex-col items-center"
        >
          <p className="text-xs uppercase tracking-[0.25em] text-[#6C6863] font-sans font-semibold mb-6">
            <Editable
              value={mergedData.countdownTitle}
              field="countdownTitle"
              onEdit={handleEdit}
              editable={editable}
              placeholder="Counting down to forever"
            />
          </p>

          <div className="flex items-center justify-center gap-3 sm:gap-6 mb-10 flex-wrap">
            
            {/* Days */}
            <div className="flex flex-col items-center min-w-[65px] sm:min-w-[80px]">
              <span 
                className="text-3xl sm:text-5xl text-[#3A1218] font-normal leading-none mb-1.5"
                style={{ fontFamily: "'Marcellus', serif, Georgia" }}
              >
                {timeLeft.days}
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#B89758] font-sans font-semibold">
                Days
              </span>
            </div>

            <span className="hidden sm:inline text-2xl text-[#DFD3BA] font-light -mt-4">:</span>

            {/* Hours */}
            <div className="flex flex-col items-center min-w-[65px] sm:min-w-[80px]">
              <span 
                className="text-3xl sm:text-5xl text-[#3A1218] font-normal leading-none mb-1.5"
                style={{ fontFamily: "'Marcellus', serif, Georgia" }}
              >
                {timeLeft.hours}
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#B89758] font-sans font-semibold">
                Hours
              </span>
            </div>

            <span className="hidden sm:inline text-2xl text-[#DFD3BA] font-light -mt-4">:</span>

            {/* Minutes */}
            <div className="flex flex-col items-center min-w-[65px] sm:min-w-[80px]">
              <span 
                className="text-3xl sm:text-5xl text-[#3A1218] font-normal leading-none mb-1.5"
                style={{ fontFamily: "'Marcellus', serif, Georgia" }}
              >
                {timeLeft.minutes}
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#B89758] font-sans font-semibold">
                Mins
              </span>
            </div>

            <span className="hidden sm:inline text-2xl text-[#DFD3BA] font-light -mt-4">:</span>

            {/* Seconds */}
            <div className="flex flex-col items-center min-w-[65px] sm:min-w-[80px]">
              <span 
                className="text-3xl sm:text-5xl text-[#3A1218] font-normal leading-none mb-1.5"
                style={{ fontFamily: "'Marcellus', serif, Georgia" }}
              >
                {timeLeft.seconds}
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#B89758] font-sans font-semibold">
                Secs
              </span>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <motion.button
              onClick={handleSaveTheDate}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="w-full sm:w-auto px-9 py-4 rounded-full bg-[#5E2129] text-white font-sans text-xs font-semibold tracking-[0.2em] uppercase shadow-[0_10px_25px_rgba(94,33,41,0.25)] hover:bg-[#3A1218] transition-colors"
            >
              <Editable
                value={mergedData.saveTheDateText}
                field="saveTheDateText"
                onEdit={handleEdit}
                editable={editable}
                placeholder="Save The Date"
              />
            </motion.button>
          </div>

          <p className="mt-4 text-xs font-sans text-[#6C6863] max-w-sm">
            <Editable
              value={mergedData.saveTheDateNote}
              field="saveTheDateNote"
              onEdit={handleEdit}
              editable={editable}
              placeholder="Save the date adds the wedding schedule directly to your calendar app"
            />
          </p>

        </motion.div>

      </section>


      {/* ================= FOOTER ================= */}
      <footer className="relative z-10 py-16 px-6 bg-[#3A1218] text-[#FAF7F2] text-center flex flex-col items-center">
        
        {/* Footer Monogram */}
        <div 
          className="text-3xl sm:text-4xl text-[#DFD3BA] mb-3"
          style={{ fontFamily: "'Marcellus', serif, Georgia" }}
        >
          <Editable
            value={mergedData.footerLogo}
            field="footerLogo"
            onEdit={handleEdit}
            editable={editable}
            placeholder="S & V"
          />
        </div>

        {/* Malayalam Blessing */}
        <p className="text-xl text-[#DFD3BA] mb-5 font-normal">
          <Editable
            value={mergedData.footerMark}
            field="footerMark"
            onEdit={handleEdit}
            editable={editable}
            placeholder="സ്നേഹപൂർവ്വം"
          />
        </p>

        {/* Footer Sub */}
        <p className="text-[11px] uppercase tracking-[0.25em] text-[#FAF7F2]/60 font-sans font-medium max-w-sm">
          <Editable
            value={mergedData.footerSub}
            field="footerSub"
            onEdit={handleEdit}
            editable={editable}
            placeholder="WE LOOK FORWARD TO CELEBRATING WITH YOU"
          />
        </p>

      </footer>

    </div>
  );
}
