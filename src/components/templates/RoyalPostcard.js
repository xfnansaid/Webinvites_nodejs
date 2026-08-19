'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Volume2, 
  VolumeX, 
  MapPin, 
  Calendar, 
  Clock, 
  Heart, 
  Plus, 
  Minus, 
  Send,
  ExternalLink,
  Music
} from 'lucide-react';

// ============================================================================
// EDITABLE COMPONENT (Exact Specification)
// ============================================================================
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
  const [isEditing, setIsEditing] = React.useState(false);
  const elementRef = React.useRef(null);

  React.useEffect(() => {
    if (!isEditing && elementRef.current) {
      const current = elementRef.current.textContent || "";
      const next = value ?? "";
      if (current !== next) elementRef.current.textContent = next;
    }
  }, [value, isEditing]);

  React.useEffect(() => {
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
          ? "outline-none rounded bg-white/40"
          : "cursor-pointer ring-0 hover:ring-2 hover:ring-[#B58D57]/60 rounded transition-all"
        }
        ${className}
      `}
      style={isEditing ? { boxShadow: "0 0 0 2px rgba(181,141,87,0.8)" } : undefined}
      title={!isEditing ? "Click to edit" : undefined}
    >
      {value || (placeholder && !isEditing ? <span className="opacity-40">{placeholder}</span> : placeholder)}
    </Tag>
  );
};

// ============================================================================
// DEFAULT DATA & FALLBACK VALUES
// ============================================================================
const defaultData = {
  // Couple Names
  brideName: "Ayesha",
  groomName: "Hamza",

  // Hero Section
  heroTagline: "Together With Their Families",
  invitationText: "REQUEST THE HONOR OF YOUR PRESENCE\nAT THEIR WEDDING",
  
  // Date & Time
  weddingDay: "SUNDAY",
  weddingMonth: "DECEMBER",
  weddingDayNum: "21",
  weddingYear: "2026",
  weddingTime: "AT 05:30 PM",
  targetDate: "2026-12-21T17:30:00",

  // Venue Information
  venueName: "The Raviz Kadavu",
  venueAddress: "BYPASS ROAD, CALICUT (KOZHIKODE),\nMALABAR, KERALA",
  venueMapTitle: "THE RAVIZ KADAVU RESORT",
  venueMapAddress: "NH 66, Bypass Road, Calicut (Kozhikode), Kerala 673633",
  mapsUrl: "https://maps.google.com/?q=The+Raviz+Kadavu+Kozhikode+Kerala",
  mapUrl: "https://maps.google.com/?q=The+Raviz+Kadavu+Kozhikode+Kerala",
  directionsUrl: "https://maps.google.com/?q=The+Raviz+Kadavu+Kozhikode+Kerala",

  // Contact / RSVP
  phone: "+91 98460 12345",
  rsvpPhoneRaw: "919846012345",

  // Meet the Couple Section
  coupleSectionTitle: "Meet the Couple",
  coupleSectionDivider: "— ❀ —",
  brideRole: "The Bride",
  brideDescription: "Daughter of Mr. & Mrs. Rahman, bringing grace, warmth, and timeless traditions from the heart of Malabar into this beautiful union.",
  groomRole: "The Groom",
  groomDescription: "Son of Mr. & Mrs. Abdullah, stepping forward with devotion and joy to begin a lifelong journey shared in love and companionship.",

  // Countdown Section
  countdownTitle: "The Countdown",
  countdownSubtitle: "Counting every moment until our big day",

  // Find Us Section
  findUsTitle: "Find Us",
  findUsButtonText: "Open in Google Maps",

  // RSVP Form Section
  rsvpSectionTitle: "RSVP",
  rsvpSubtitle: "Kindly reply by letting us know if you will celebrate with us",
  rsvpButtonText: "Confirm via WhatsApp",

  // Background Music
  audioUrl: "https://assets.mixkit.co/music/preview/mixkit-wedding-invitation-waltz-541.mp3"
};

// ============================================================================
// MAIN WEDDING INVITATION TEMPLATE COMPONENT
// ============================================================================
export default function WeddingTemplate({ 
  data = {}, 
  isDraft = false, 
  editable = false, 
  onEdit = () => {} 
}) {
  // Merge prop data with fallbacks
  const baseData = { ...defaultData, ...data };
  // Resolve canonical map URL from any field name
  const mapDefault = (baseData.venueName || baseData.venueMapTitle || baseData.venueAddress)
    ? `https://maps.google.com/?q=${encodeURIComponent((baseData.venueName || '') + ' ' + (baseData.venueMapAddress || baseData.venueAddress || ''))}`
    : "";
  const canonicalMapUrl = baseData.mapsUrl || baseData.mapUrl || baseData.directionsUrl || mapDefault;
  const mergedData = { ...baseData, mapsUrl: canonicalMapUrl, mapUrl: canonicalMapUrl, directionsUrl: canonicalMapUrl };

  // Countdown state
  const [timeLeft, setTimeLeft] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00"
  });

  // Audio playing state
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // RSVP Form state
  const [guestName, setGuestName] = useState("");
  const [attendance, setAttendance] = useState("Attending");
  const [guestCount, setGuestCount] = useState(1);
  const [guestNote, setGuestNote] = useState("");

  // Countdown calculation
  useEffect(() => {
    const calculateTime = () => {
      let target;
      if (mergedData.targetDate) {
        target = new Date(mergedData.targetDate).getTime();
      } else {
        const dateString = `${mergedData.weddingMonth} ${mergedData.weddingDayNum}, ${mergedData.weddingYear} ${mergedData.weddingTime.replace('AT ', '')}`;
        target = new Date(dateString).getTime();
      }

      if (isNaN(target)) {
        target = new Date("2026-12-21T17:30:00").getTime();
      }

      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ days: "00", hours: "00", minutes: "00", seconds: "00" });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({
        days: String(days).padStart(2, "0"),
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0")
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [
    mergedData.targetDate, 
    mergedData.weddingMonth, 
    mergedData.weddingDayNum, 
    mergedData.weddingYear, 
    mergedData.weddingTime
  ]);

  // Audio Toggle
  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.log("Audio playback error:", err);
      });
    }
  };

  // WhatsApp RSVP Handler
  const handleRsvpSubmit = (e) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    let message = `*WEDDING RSVP - ${mergedData.brideName} & ${mergedData.groomName}*\n\n`;
    message += `👤 *Guest Name:* ${guestName.trim()}\n`;

    if (attendance === "Attending") {
      message += `✨ *Status:* Joyfully Attending 🎉\n`;
      message += `👨‍👩‍👧‍👦 *Number of Guests:* ${guestCount}\n`;
    } else {
      message += `💐 *Status:* Regrettably Declining\n`;
    }

    if (guestNote.trim()) {
      message += `📝 *Note / Message:* ${guestNote.trim()}\n`;
    }

    const cleanPhone = (mergedData.rsvpPhoneRaw || mergedData.phone || "919846012345").replace(/[^0-9]/g, "");
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

    window.open(whatsappUrl, "_blank");
  };

  // Animation variants
  const fadeInVariants = {
    hidden: { opacity: 0, y: 35 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
    }
  };

  return (
    <div style={{ containerType: 'inline-size', width: '100%', maxWidth: '100%', margin: 0, padding: 0 }}  className="min-h-screen bg-[#FDFBF7] text-[#3A322D] flex justify-center p-[15px_10px] overflow-x-hidden relative select-auto font-serif">
      
      {/* Embedded Google Fonts & Keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap');
        
        .font-alex { font-family: 'Alex Brush', cursive; }
        .font-cinzel { font-family: 'Cinzel', serif; }
        .font-cormorant { font-family: 'Cormorant Garamond', serif; }

        @keyframes pulseGold {
          0%, 100% { opacity: 0.65; }
          50% { opacity: 1; }
        }
        .animate-pulse-gold {
          animation: pulseGold 3.5s infinite ease-in-out;
        }

        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .animate-float-slow {
          animation: floatSlow 4s ease-in-out infinite;
        }

        @keyframes noteFloat {
          0% {
            opacity: 0;
            transform: translateY(0) translateX(0);
          }
          15% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(-26px) translateX(8px);
          }
        }
        .animate-note-float {
          animation: noteFloat 2.2s ease-in infinite;
        }
      `}} />

      {/* MOBILE-FIRST MAIN CONTAINER */}
      <main className="w-full max-w-[460px] bg-[#FDFBF7] relative overflow-hidden">
        
        {/* ====================================================================
            SECTION 1: HERO POSTCARD REPLICA
            ==================================================================== */}
        <motion.section 
          variants={fadeInVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="bg-[#F5EBE0] border-[1.5px] border-[#CBAE82] rounded-[18px] p-[35px_20px_25px] text-center relative shadow-[0_12px_30px_rgba(110,26,36,0.1)] mb-10 overflow-hidden before:content-[''] before:absolute before:inset-[10px] before:border before:border-[#D4B28C] before:rounded-[14px] before:pointer-events-none"
        >
          {/* Top Decorative Ornament */}
          <div className="text-[#B58D57] text-[1.4rem] tracking-[4px] mb-2.5 animate-pulse-gold select-none">
            ❀ ❖ ❀
          </div>

          {/* Subheading */}
          <div className="font-cinzel text-[0.68rem] tracking-[2.5px] text-[#3A322D] uppercase mb-3">
            <Editable
              value={mergedData.heroTagline}
              field="heroTagline"
              onEdit={onEdit}
              editable={editable}
              placeholder="Together With Their Families"
            />
          </div>

          {/* Bride Name */}
          <h1 className="font-alex text-[3.8rem] text-[#6E1A24] leading-none my-1 font-normal">
            <Editable
              value={mergedData.brideName}
              field="brideName"
              onEdit={onEdit}
              editable={editable}
              placeholder="Ayesha"
            />
          </h1>

          {/* And Text */}
          <div className="font-cormorant italic text-[#B58D57] text-[1.3rem] relative inline-block my-0.5 before:content-['—'] before:mx-2 before:text-[#D4B28C] after:content-['—'] after:mx-2 after:text-[#D4B28C]">
            and
          </div>

          {/* Groom Name */}
          <h1 className="font-alex text-[3.8rem] text-[#6E1A24] leading-none my-1 font-normal">
            <Editable
              value={mergedData.groomName}
              field="groomName"
              onEdit={onEdit}
              editable={editable}
              placeholder="Hamza"
            />
          </h1>

          {/* Invitation Text */}
          <div className="font-cinzel text-[0.7rem] tracking-[1.8px] text-[#3A322D] my-[18px] leading-[1.6] whitespace-pre-line">
            <Editable
              value={mergedData.invitationText}
              field="invitationText"
              onEdit={onEdit}
              editable={editable}
              multiline={true}
              placeholder="REQUEST THE HONOR OF YOUR PRESENCE\nAT THEIR WEDDING"
            />
          </div>

          {/* Date Display Box */}
          <div className="my-[22px]">
            <p className="font-cinzel text-[0.82rem] tracking-[3px] text-[#3A322D] mb-1.5">
              <Editable
                value={mergedData.weddingDay}
                field="weddingDay"
                onEdit={onEdit}
                editable={editable}
                placeholder="SUNDAY"
              />
            </p>
            <div className="flex justify-center items-center gap-[15px] border-t border-b border-[#D4B28C] py-2 max-w-[270px] mx-auto">
              <span className="font-cinzel text-[0.8rem] tracking-[2px] text-[#3A322D]">
                <Editable
                  value={mergedData.weddingMonth}
                  field="weddingMonth"
                  onEdit={onEdit}
                  editable={editable}
                  placeholder="DECEMBER"
                />
              </span>
              <span className="font-cormorant text-[2.7rem] text-[#6E1A24] leading-none font-semibold">
                <Editable
                  value={mergedData.weddingDayNum}
                  field="weddingDayNum"
                  onEdit={onEdit}
                  editable={editable}
                  placeholder="21"
                />
              </span>
              <span className="font-cinzel text-[0.8rem] tracking-[2px] text-[#3A322D]">
                <Editable
                  value={mergedData.weddingYear}
                  field="weddingYear"
                  onEdit={onEdit}
                  editable={editable}
                  placeholder="2026"
                />
              </span>
            </div>
            <p className="font-cinzel text-[0.78rem] tracking-[2px] text-[#3A322D] mt-3">
              <Editable
                value={mergedData.weddingTime}
                field="weddingTime"
                onEdit={onEdit}
                editable={editable}
                placeholder="AT 05:30 PM"
              />
            </p>
          </div>

          {/* Venue & Location */}
          <div className="mt-4">
            <div className="text-[#B58D57] text-[1rem] mb-1">❖</div>
            <h2 className="font-alex text-[2.4rem] text-[#6E1A24] mt-2.5">
              <Editable
                value={mergedData.venueName}
                field="venueName"
                onEdit={onEdit}
                editable={editable}
                placeholder="The Raviz Kadavu"
              />
            </h2>
            <div className="font-cinzel text-[0.68rem] tracking-[1.5px] text-[#3A322D] leading-[1.6] mt-1 whitespace-pre-line">
              <Editable
                value={mergedData.venueAddress}
                field="venueAddress"
                onEdit={onEdit}
                editable={editable}
                multiline={true}
                placeholder="BYPASS ROAD, CALICUT (KOZHIKODE),\nMALABAR, KERALA"
              />
            </div>
          </div>

          {/* Traditional Kerala Bride & Groom Avatar SVG */}
          <div 
            className="my-[20px] mx-auto w-[175px] h-[175px] flex justify-center items-center animate-float-slow [filter:drop-shadow(0_8px_15px_rgba(110,26,36,0.15))]"
            aria-label="Bride and Groom Traditional Illustration"
          >
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              {/* Decorative Aura */}
              <circle cx="100" cy="100" r="85" fill="#F0E2D0" opacity="0.6"/>
              <circle cx="100" cy="100" r="75" stroke="#D4B28C" strokeWidth="1" strokeDasharray="4 4"/>
              
              {/* Groom Silky Black Attire */}
              <path d="M110 80 C110 65 130 65 130 80 L145 170 L100 170 Z" fill="#231F20"/>
              <path d="M118 80 L118 130" stroke="#B58D57" strokeWidth="1.5"/>
              
              {/* Groom Head */}
              <circle cx="120" cy="55" r="14" fill="#E5C29F"/>
              <path d="M106 53 C106 40 134 40 134 53 Z" fill="#1A1A1A"/>
              
              {/* Bride Deep Maroon Attire & Dupatta */}
              <path d="M55 170 C65 110 85 85 95 80 L110 170 Z" fill="#6E1A24"/>
              <path d="M50 170 C60 100 85 65 95 65 L105 170 Z" fill="#88202D" opacity="0.85"/>
              
              {/* Gold Zari Embroidery */}
              <path d="M55 160 Q80 155 108 160" stroke="#B58D57" strokeWidth="2" fill="none"/>
              <path d="M60 145 Q80 140 105 145" stroke="#B58D57" strokeWidth="1.5" strokeDasharray="3 3" fill="none"/>
              
              {/* Bride Head & Dupatta Drape */}
              <circle cx="85" cy="58" r="13" fill="#E5C29F"/>
              <path d="M72 58 C72 42 98 42 98 58 C98 70 75 70 72 58 Z" fill="#6E1A24"/>
              <path d="M72 58 Q85 40 98 58" stroke="#B58D57" strokeWidth="1.5" fill="none"/>
              
              {/* Holding Hands Center Gold Detail */}
              <circle cx="105" cy="105" r="4" fill="#D4B28C"/>
            </svg>
          </div>

          {/* Quick RSVP Button */}
          <a 
            href="#rsvp-section" 
            className="block mt-5 font-cinzel text-[0.72rem] tracking-[2px] text-[#3A322D] no-underline hover:opacity-90 transition-opacity"
          >
            RSVP NOW
            <span className="block text-[#6E1A24] font-bold mt-[3px]">
              <Editable
                value={mergedData.phone}
                field="phone"
                onEdit={onEdit}
                editable={editable}
                placeholder="+91 98460 12345"
              />
            </span>
          </a>
        </motion.section>

        {/* ====================================================================
            FLOATING MUSIC BUTTON & AUDIO TAG
            ==================================================================== */}
        <div className="fixed bottom-[26px] right-[22px] z-[600]">
          <button 
            onClick={toggleMusic} 
            className="relative w-[56px] h-[56px] rounded-full bg-[#6E1A24] text-[#FDFBF7] shadow-[0_8px_20px_rgba(110,26,36,0.35)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all outline-none"
            aria-label="Toggle background music"
          >
            {isPlaying && (
              <span className="absolute -top-1.5 -right-0.5 text-[0.65rem] text-[#D4B28C] animate-note-float select-none">
                ♪
              </span>
            )}
            {isPlaying ? (
              <Volume2 className="w-[26px] h-[26px]" />
            ) : (
              <VolumeX className="w-[26px] h-[26px]" />
            )}
          </button>
        </div>

        <audio ref={audioRef} loop preload="auto">
          <source src={mergedData.audioUrl || "music/leberch-invitation-wedding-375839.mp3"} type="audio/mpeg" />
        </audio>

        {/* ====================================================================
            SECTION 2: BRIDE & GROOM DETAILS
            ==================================================================== */}
        <motion.section 
          variants={fadeInVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="p-[35px_10px] text-center"
        >
          <h2 className="font-cormorant text-[2.3rem] text-[#6E1A24] font-semibold mb-1">
            <Editable
              value={mergedData.coupleSectionTitle}
              field="coupleSectionTitle"
              onEdit={onEdit}
              editable={editable}
              placeholder="Meet the Couple"
            />
          </h2>
          <div className="text-[#B58D57] text-[1.2rem] mb-[25px] animate-pulse-gold">
            <Editable
              value={mergedData.coupleSectionDivider}
              field="coupleSectionDivider"
              onEdit={onEdit}
              editable={editable}
              placeholder="— ❀ —"
            />
          </div>

          <div className="flex flex-col gap-5">
            {/* Bride Card */}
            <div className="bg-[#F5EBE0] border border-[#CBAE82] rounded-[14px] p-[25px_20px] text-center shadow-[0_6px_18px_rgba(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-[0_10px_24px_rgba(110,26,36,0.08)] transition-all duration-300">
              <h3 className="font-cinzel text-[1.15rem] tracking-[2.5px] text-[#6E1A24] mb-1.5 uppercase font-semibold">
                <Editable
                  value={mergedData.brideName}
                  field="brideName"
                  onEdit={onEdit}
                  editable={editable}
                  placeholder="AYESHA"
                />
              </h3>
              <p className="font-cormorant italic text-[#B58D57] text-[1.15rem] mb-3">
                <Editable
                  value={mergedData.brideRole}
                  field="brideRole"
                  onEdit={onEdit}
                  editable={editable}
                  placeholder="The Bride"
                />
              </p>
              <p className="font-cormorant text-[0.98rem] text-[#3A322D] leading-[1.6]">
                <Editable
                  value={mergedData.brideDescription}
                  field="brideDescription"
                  onEdit={onEdit}
                  editable={editable}
                  multiline={true}
                  placeholder="Daughter of Mr. & Mrs. Rahman, bringing grace, warmth, and timeless traditions from the heart of Malabar into this beautiful union."
                />
              </p>
            </div>

            {/* Groom Card */}
            <div className="bg-[#F5EBE0] border border-[#CBAE82] rounded-[14px] p-[25px_20px] text-center shadow-[0_6px_18px_rgba(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-[0_10px_24px_rgba(110,26,36,0.08)] transition-all duration-300">
              <h3 className="font-cinzel text-[1.15rem] tracking-[2.5px] text-[#6E1A24] mb-1.5 uppercase font-semibold">
                <Editable
                  value={mergedData.groomName}
                  field="groomName"
                  onEdit={onEdit}
                  editable={editable}
                  placeholder="HAMZA"
                />
              </h3>
              <p className="font-cormorant italic text-[#B58D57] text-[1.15rem] mb-3">
                <Editable
                  value={mergedData.groomRole}
                  field="groomRole"
                  onEdit={onEdit}
                  editable={editable}
                  placeholder="The Groom"
                />
              </p>
              <p className="font-cormorant text-[0.98rem] text-[#3A322D] leading-[1.6]">
                <Editable
                  value={mergedData.groomDescription}
                  field="groomDescription"
                  onEdit={onEdit}
                  editable={editable}
                  multiline={true}
                  placeholder="Son of Mr. & Mrs. Abdullah, stepping forward with devotion and joy to begin a lifelong journey shared in love and companionship."
                />
              </p>
            </div>
          </div>
        </motion.section>

        {/* ====================================================================
            SECTION 3: COUNTDOWN TIMER
            ==================================================================== */}
        <motion.section 
          variants={fadeInVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="bg-[#F5EBE0] border border-[#CBAE82] rounded-[18px] p-[30px_15px] my-[25px] mb-10 shadow-[0_8px_22px_rgba(110,26,36,0.06)] text-center"
        >
          <h2 className="font-cormorant text-[2.3rem] text-[#6E1A24] font-semibold mb-1">
            <Editable
              value={mergedData.countdownTitle}
              field="countdownTitle"
              onEdit={onEdit}
              editable={editable}
              placeholder="The Countdown"
            />
          </h2>
          <div className="text-[#B58D57] text-[1.1rem] mb-2 animate-pulse-gold select-none">
            ❖
          </div>
          <p className="font-cormorant text-[0.98rem] text-[#3A322D]">
            <Editable
              value={mergedData.countdownSubtitle}
              field="countdownSubtitle"
              onEdit={onEdit}
              editable={editable}
              placeholder="Counting every moment until our big day"
            />
          </p>

          <div className="grid grid-cols-4 gap-2 mt-[22px]">
            {/* Days */}
            <div className="bg-[#FDFBF7] border border-[#D4B28C] rounded-[10px] p-[14px_4px] text-center shadow-[0_4px_10px_rgba(0,0,0,0.03)]">
              <div className="font-cormorant text-[1.9rem] font-bold text-[#6E1A24] leading-none">
                {timeLeft.days}
              </div>
              <div className="font-cinzel text-[0.58rem] tracking-[1px] text-[#3A322D] uppercase mt-1.5">
                Days
              </div>
            </div>

            {/* Hours */}
            <div className="bg-[#FDFBF7] border border-[#D4B28C] rounded-[10px] p-[14px_4px] text-center shadow-[0_4px_10px_rgba(0,0,0,0.03)]">
              <div className="font-cormorant text-[1.9rem] font-bold text-[#6E1A24] leading-none">
                {timeLeft.hours}
              </div>
              <div className="font-cinzel text-[0.58rem] tracking-[1px] text-[#3A322D] uppercase mt-1.5">
                Hours
              </div>
            </div>

            {/* Minutes */}
            <div className="bg-[#FDFBF7] border border-[#D4B28C] rounded-[10px] p-[14px_4px] text-center shadow-[0_4px_10px_rgba(0,0,0,0.03)]">
              <div className="font-cormorant text-[1.9rem] font-bold text-[#6E1A24] leading-none">
                {timeLeft.minutes}
              </div>
              <div className="font-cinzel text-[0.58rem] tracking-[1px] text-[#3A322D] uppercase mt-1.5">
                Mins
              </div>
            </div>

            {/* Seconds */}
            <div className="bg-[#FDFBF7] border border-[#D4B28C] rounded-[10px] p-[14px_4px] text-center shadow-[0_4px_10px_rgba(0,0,0,0.03)]">
              <div className="font-cormorant text-[1.9rem] font-bold text-[#6E1A24] leading-none">
                {timeLeft.seconds}
              </div>
              <div className="font-cinzel text-[0.58rem] tracking-[1px] text-[#3A322D] uppercase mt-1.5">
                Secs
              </div>
            </div>
          </div>
        </motion.section>

        {/* ====================================================================
            SECTION 4: FIND US (MAP & VENUE DETAILS)
            ==================================================================== */}
        <motion.section 
          variants={fadeInVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="p-[35px_10px] text-center"
        >
          <h2 className="font-cormorant text-[2.3rem] text-[#6E1A24] font-semibold mb-1">
            <Editable
              value={mergedData.findUsTitle}
              field="findUsTitle"
              onEdit={onEdit}
              editable={editable}
              placeholder="Find Us"
            />
          </h2>
          <div className="text-[#B58D57] text-[1.2rem] mb-[25px] animate-pulse-gold">
            — ❀ —
          </div>

          <div className="bg-[#F5EBE0] border border-[#CBAE82] rounded-[18px] p-[22px] overflow-hidden mb-[30px] shadow-[0_8px_22px_rgba(110,26,36,0.06)]">
            <p className="font-cinzel text-[0.72rem] tracking-[1.5px] text-[#3A322D] font-bold mb-1 uppercase">
              <Editable
                value={mergedData.venueMapTitle}
                field="venueMapTitle"
                onEdit={onEdit}
                editable={editable}
                placeholder="THE RAVIZ KADAVU RESORT"
              />
            </p>
            <p className="font-cinzel text-[0.68rem] tracking-[1.5px] text-[#3A322D] mb-4 leading-[1.6]">
              <Editable
                value={mergedData.venueMapAddress}
                field="venueMapAddress"
                onEdit={onEdit}
                editable={editable}
                multiline={true}
                placeholder="NH 66, Bypass Road, Calicut (Kozhikode), Kerala 673633"
              />
            </p>

            <a 
              href={mergedData.mapsUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-2 mt-2 px-[26px] py-[13px] bg-[#6E1A24] hover:bg-[#4A1017] text-white font-cinzel text-[0.72rem] tracking-[2px] rounded-full transition-all duration-300 shadow-[0_4px_12px_rgba(110,26,36,0.3)] hover:-translate-y-0.5 active:translate-y-0 no-underline"
            >
              <MapPin className="w-3.5 h-3.5" />
              <Editable
                value={mergedData.findUsButtonText}
                field="findUsButtonText"
                onEdit={onEdit}
                editable={editable}
                placeholder="Open in Google Maps"
              />
            </a>
          </div>
        </motion.section>



        {/* ====================================================================
            FOOTER: BRIDE & GROOM CALLIGRAPHY
            ==================================================================== */}
        <motion.footer 
          variants={fadeInVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-20px" }}
          className="text-center p-[25px_0_15px] font-alex text-[2rem] text-[#6E1A24]"
        >
          <Editable
            value={mergedData.brideName}
            field="brideName"
            onEdit={onEdit}
            editable={editable}
            placeholder="Ayesha"
          />
          {" "}&{" "}
          <Editable
            value={mergedData.groomName}
            field="groomName"
            onEdit={onEdit}
            editable={editable}
            placeholder="Hamza"
          />
        </motion.footer>

      </main>
    </div>
  );
}
