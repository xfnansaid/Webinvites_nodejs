'use client';

import CelebrationsSection from './CelebrationsSection';
import CouplePhotoSection from './CouplePhotoSection';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Sparkles
} from 'lucide-react';
import RsvpSection from './RsvpSection';
import SharedEditable from './_Editable';

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
  countdownEndedTitle: "Wedding in Progress!",
  countdownEndedSubtitle: "Thank you for celebrating this memorable day with us.",

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

function parseTargetDateTime(dateInput, timeInput) {
  if (!dateInput && !timeInput) return null;

  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    return dateInput;
  }

  const rawDate = String(dateInput || '').trim();
  const cleanTime = String(timeInput || '').trim().replace(/^at\s+/i, '').trim();

  // If already an ISO timestamp or includes T
  if (rawDate.includes('T') || (rawDate.length > 10 && (rawDate.includes(':') || rawDate.endsWith('Z')))) {
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) return d;
  }

  let hours = 10;
  let minutes = 0;
  let seconds = 0;

  if (cleanTime) {
    const matchTime = cleanTime.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/i);
    if (matchTime) {
      let h = parseInt(matchTime[1], 10);
      const m = parseInt(matchTime[2], 10);
      const s = matchTime[3] ? parseInt(matchTime[3], 10) : 0;
      const meridiem = matchTime[4] ? matchTime[4].toUpperCase() : null;

      if (meridiem === 'PM' && h < 12) h += 12;
      else if (meridiem === 'AM' && h === 12) h = 0;

      hours = h;
      minutes = m;
      seconds = s;
    }
  }

  // Handle YYYY-MM-DD
  const ymdMatch = rawDate.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const d = new Date(year, month, day, hours, minutes, seconds);
    if (!isNaN(d.getTime())) return d;
  }

  // Handle DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = rawDate.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (dmyMatch) {
    let day = parseInt(dmyMatch[1], 10);
    let month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    if (month > 11 && day <= 12) {
      const temp = day - 1;
      day = month + 1;
      month = temp;
    }
    const d = new Date(year, month, day, hours, minutes, seconds);
    if (!isNaN(d.getTime())) return d;
  }

  // Text date e.g. "DECEMBER 21, 2026" or "21 December 2026"
  if (rawDate) {
    const timeFragment = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const tryCombined = new Date(`${rawDate} ${timeFragment}`);
    if (!isNaN(tryCombined.getTime())) return tryCombined;

    const tryDateOnly = new Date(rawDate);
    if (!isNaN(tryDateOnly.getTime())) {
      tryDateOnly.setHours(hours, minutes, seconds, 0);
      return tryDateOnly;
    }
  }

  return null;
}

// ============================================================================
// MAIN WEDDING INVITATION TEMPLATE COMPONENT
// ============================================================================
export default function WeddingTemplate({
  data = {},
  isDraft = false,
  editable = false,
  onEdit = () => { },
  onStyleChange,
  templateData,
}) {
  const Editable = React.useMemo(() => {
    return function ScopedEditable(props) {
      return React.createElement(SharedEditable, {
        ...props,
        onStyleChange: props.onStyleChange === undefined ? onStyleChange : props.onStyleChange,
        templateData: props.templateData === undefined ? templateData : props.templateData,
      });
    };
  }, [onStyleChange, templateData]);

  const baseData = { ...defaultData, ...data };

  // If weddingDate is provided in data (e.g. from database "2026-11-20" or user edit),
  // and specific date parts (month/day/year) were not individually customized in data,
  // derive them accurately from weddingDate.
  if (data?.weddingDate && (!data?.weddingMonth || !data?.weddingDayNum || !data?.weddingYear)) {
    const parsed = parseTargetDateTime(data.weddingDate, data.weddingTime || baseData.weddingTime);
    if (parsed) {
      const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
      if (!data.weddingDay) baseData.weddingDay = days[parsed.getDay()];
      if (!data.weddingMonth) baseData.weddingMonth = months[parsed.getMonth()];
      if (!data.weddingDayNum) baseData.weddingDayNum = String(parsed.getDate());
      if (!data.weddingYear) baseData.weddingYear = String(parsed.getFullYear());
    }
  }

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
  const [isExpired, setIsExpired] = useState(false);

  // Countdown calculation
  useEffect(() => {
    const calculateTime = () => {
      const dateSource = data?.targetDate || data?.weddingDate || `${mergedData.weddingMonth} ${mergedData.weddingDayNum}, ${mergedData.weddingYear}`;
      const targetObj = parseTargetDateTime(dateSource, mergedData.weddingTime);

      if (!targetObj || Number.isNaN(targetObj.getTime())) {
        setIsExpired(false);
        setTimeLeft({ days: "00", hours: "00", minutes: "00", seconds: "00" });
        return;
      }

      const now = Date.now();
      const difference = targetObj.getTime() - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft({ days: "00", hours: "00", minutes: "00", seconds: "00" });
        return;
      }

      setIsExpired(false);

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
    data?.targetDate,
    data?.weddingDate,
    mergedData.weddingDay,
    mergedData.weddingMonth,
    mergedData.weddingDayNum,
    mergedData.weddingYear,
    mergedData.weddingTime
  ]);

  // Animation variants
  const fadeInVariants = {
    hidden: { opacity: 0, y: 28 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <div
      style={{ containerType: 'inline-size', width: '100%', maxWidth: '100%', margin: 0, padding: 0 }}
      className="
        relative flex min-h-[100dvh] justify-center overflow-x-hidden
        bg-[#FDFBF7] p-3 font-serif text-[#3A322D] select-auto
        sm:p-4
      "
    >
      <style>{`
        @keyframes pulseGold {
          0%, 100% { opacity: 0.65; }
          50% { opacity: 1; }
        }
        .animate-pulse-gold {
          animation: pulseGold 3.5s infinite ease-in-out;
        }

        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .animate-float-slow {
          animation: floatSlow 4s ease-in-out infinite;
        }
      `}</style>

      {/* MOBILE-FIRST MAIN CONTAINER */}
      <main className="relative w-full max-w-[440px] overflow-hidden bg-[#FDFBF7]">

        {/* ====================================================================
            SECTION 1: HERO POSTCARD
            ==================================================================== */}
        <motion.section
          id="hero-section"
          variants={fadeInVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="
            relative mb-8 overflow-hidden rounded-[16px]
            border border-[#CBAE82] bg-[#F5EBE0]
            px-4 pb-5 pt-7 text-center
            shadow-[0_10px_24px_rgba(110,26,36,0.08)]
            before:pointer-events-none before:absolute before:inset-[8px]
            before:rounded-[12px] before:border before:border-[#D4B28C]
            sm:mb-10 sm:rounded-[18px] sm:px-5 sm:pb-6 sm:pt-8
            sm:before:inset-[10px] sm:before:rounded-[14px]
          "
        >
          {/* Top ornament */}
          <div className="mb-2 select-none text-[1.15rem] tracking-[3px] text-[#B58D57] animate-pulse-gold sm:mb-2.5 sm:text-[1.3rem] sm:tracking-[4px]">
            ❀ ❖ ❀
          </div>

          {/* Tagline */}
          <div className="mb-2.5 font-cinzel text-[0.62rem] uppercase tracking-[2px] text-[#3A322D] sm:mb-3 sm:text-[0.68rem] sm:tracking-[2.5px]">
            <Editable
              value={mergedData.heroTagline}
              field="heroTagline"
              onEdit={onEdit}
              editable={editable}
              placeholder="Together With Their Families"
            />
          </div>

          {/* Bride Name */}
          <h1 className="my-0.5 font-alex text-[clamp(2.8rem,12cqw,3.6rem)] font-normal leading-none text-[#6E1A24]">
            <Editable
              value={mergedData.brideName}
              field="brideName"
              onEdit={onEdit}
              editable={editable}
              placeholder="Ayesha"
            />
          </h1>

          {/* And */}
          <div className="relative my-0.5 inline-block font-cormorant text-[1.15rem] italic text-[#B58D57] before:mx-1.5 before:content-['—'] before:text-[#D4B28C] after:mx-1.5 after:content-['—'] after:text-[#D4B28C] sm:text-[1.25rem]">
            and
          </div>

          {/* Groom Name */}
          <h1 className="my-0.5 font-alex text-[clamp(2.8rem,12cqw,3.6rem)] font-normal leading-none text-[#6E1A24]">
            <Editable
              value={mergedData.groomName}
              field="groomName"
              onEdit={onEdit}
              editable={editable}
              placeholder="Hamza"
            />
          </h1>

          {/* Invitation text */}
          <div className="my-3.5 whitespace-pre-line font-cinzel text-[0.65rem] leading-[1.55] tracking-[1.5px] text-[#3A322D] sm:my-4 sm:text-[0.7rem] sm:tracking-[1.8px]">
            <Editable
              value={mergedData.invitationText}
              field="invitationText"
              onEdit={onEdit}
              editable={editable}
              multiline={true}
              placeholder="REQUEST THE HONOR OF YOUR PRESENCE\nAT THEIR WEDDING"
            />
          </div>

          {/* Date box */}
          <div className="my-4 sm:my-5">
            <p className="mb-1 font-cinzel text-[0.75rem] tracking-[2.5px] text-[#3A322D] sm:mb-1.5 sm:text-[0.8rem] sm:tracking-[3px]">
              <Editable
                value={mergedData.weddingDay}
                field="weddingDay"
                onEdit={onEdit}
                editable={editable}
                placeholder="SUNDAY"
              />
            </p>
            <div className="mx-auto flex max-w-[250px] items-center justify-center gap-3 border-y border-[#D4B28C] py-1.5 sm:max-w-[270px] sm:gap-[15px] sm:py-2">
              <span className="font-cinzel text-[0.72rem] tracking-[1.6px] text-[#3A322D] sm:text-[0.8rem] sm:tracking-[2px]">
                <Editable
                  value={mergedData.weddingMonth}
                  field="weddingMonth"
                  onEdit={onEdit}
                  editable={editable}
                  placeholder="DECEMBER"
                />
              </span>
              <span className="font-cormorant text-[2.3rem] font-semibold leading-none text-[#6E1A24] sm:text-[2.6rem]">
                <Editable
                  value={mergedData.weddingDayNum}
                  field="weddingDayNum"
                  onEdit={onEdit}
                  editable={editable}
                  placeholder="21"
                />
              </span>
              <span className="font-cinzel text-[0.72rem] tracking-[1.6px] text-[#3A322D] sm:text-[0.8rem] sm:tracking-[2px]">
                <Editable
                  value={mergedData.weddingYear}
                  field="weddingYear"
                  onEdit={onEdit}
                  editable={editable}
                  placeholder="2026"
                />
              </span>
            </div>
            <p className="mt-2.5 font-cinzel text-[0.72rem] tracking-[1.6px] text-[#3A322D] sm:mt-3 sm:text-[0.78rem] sm:tracking-[2px]">
              <Editable
                value={mergedData.weddingTime}
                field="weddingTime"
                onEdit={onEdit}
                editable={editable}
                placeholder="AT 05:30 PM"
              />
            </p>
          </div>

          {/* Venue */}
          <div className="mt-3 sm:mt-4">
            <div className="mb-0.5 text-[0.9rem] text-[#B58D57]">❖</div>
            <h2 className="mt-1.5 font-alex text-[clamp(1.9rem,9cqw,2.3rem)] text-[#6E1A24] sm:mt-2">
              <Editable
                value={mergedData.venueName}
                field="venueName"
                onEdit={onEdit}
                editable={editable}
                placeholder="The Raviz Kadavu"
              />
            </h2>
            <div className="mt-1 whitespace-pre-line font-cinzel text-[0.62rem] leading-[1.55] tracking-[1.2px] text-[#3A322D] sm:text-[0.68rem] sm:tracking-[1.5px]">
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

          {/* Illustration – slightly smaller on mobile */}
          <div
            className="
              mx-auto my-4 flex h-[140px] w-[140px] items-center justify-center
              animate-float-slow
              [filter:drop-shadow(0_6px_12px_rgba(110,26,36,0.12))]
              sm:my-5 sm:h-[160px] sm:w-[160px]
            "
            aria-label="Bride and Groom Traditional Illustration"
          >
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
              <circle cx="100" cy="100" r="85" fill="#F0E2D0" opacity="0.6" />
              <circle cx="100" cy="100" r="75" stroke="#D4B28C" strokeWidth="1" strokeDasharray="4 4" />
              <path d="M110 80 C110 65 130 65 130 80 L145 170 L100 170 Z" fill="#231F20" />
              <path d="M118 80 L118 130" stroke="#B58D57" strokeWidth="1.5" />
              <circle cx="120" cy="55" r="14" fill="#E5C29F" />
              <path d="M106 53 C106 40 134 40 134 53 Z" fill="#1A1A1A" />
              <path d="M55 170 C65 110 85 85 95 80 L110 170 Z" fill="#6E1A24" />
              <path d="M50 170 C60 100 85 65 95 65 L105 170 Z" fill="#88202D" opacity="0.85" />
              <path d="M55 160 Q80 155 108 160" stroke="#B58D57" strokeWidth="2" fill="none" />
              <path d="M60 145 Q80 140 105 145" stroke="#B58D57" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
              <circle cx="85" cy="58" r="13" fill="#E5C29F" />
              <path d="M72 58 C72 42 98 42 98 58 C98 70 75 70 72 58 Z" fill="#6E1A24" />
              <path d="M72 58 Q85 40 98 58" stroke="#B58D57" strokeWidth="1.5" fill="none" />
              <circle cx="105" cy="105" r="4" fill="#D4B28C" />
            </svg>
          </div>

          {/* Quick RSVP link */}
          <a
            href="#rsvp-section"
            className="mt-3 block font-cinzel text-[0.68rem] tracking-[1.8px] text-[#3A322D] no-underline transition-opacity hover:opacity-90 sm:mt-4 sm:text-[0.72rem] sm:tracking-[2px]"
          >
            RSVP NOW
            <span className="mt-1 block font-bold text-[#6E1A24]">
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
            SECTION 2: MEET THE COUPLE
            ==================================================================== */}
        <motion.section
          variants={fadeInVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="px-2 py-7 text-center sm:px-2.5 sm:py-9"
        >
          <h2 className="mb-0.5 font-cormorant text-[1.9rem] font-semibold text-[#6E1A24] sm:text-[2.2rem]">
            <Editable
              value={mergedData.coupleSectionTitle}
              field="coupleSectionTitle"
              onEdit={onEdit}
              editable={editable}
              placeholder="Meet the Couple"
            />
          </h2>
          <div className="mb-5 animate-pulse-gold text-[1.05rem] text-[#B58D57] sm:mb-6 sm:text-[1.15rem]">
            <Editable
              value={mergedData.coupleSectionDivider}
              field="coupleSectionDivider"
              onEdit={onEdit}
              editable={editable}
              placeholder="— ❀ —"
            />
          </div>

          <div className="flex flex-col gap-3.5 sm:gap-4">
            {/* Bride Card */}
            <div className="
              rounded-[12px] border border-[#CBAE82] bg-[#F5EBE0]
              px-4 py-5 text-center
              shadow-[0_4px_14px_rgba(0,0,0,0.03)]
              transition-all duration-300
              hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(110,26,36,0.07)]
              sm:rounded-[14px] sm:px-5 sm:py-6
            ">
              <h3 className="mb-1 font-cinzel text-[1rem] font-semibold uppercase tracking-[2px] text-[#6E1A24] sm:mb-1.5 sm:text-[1.1rem] sm:tracking-[2.5px]">
                <Editable
                  value={mergedData.brideName}
                  field="brideName"
                  onEdit={onEdit}
                  editable={editable}
                  placeholder="AYESHA"
                />
              </h3>
              <p className="mb-2.5 font-cormorant text-[1.05rem] italic text-[#B58D57] sm:mb-3 sm:text-[1.1rem]">
                <Editable
                  value={mergedData.brideRole}
                  field="brideRole"
                  onEdit={onEdit}
                  editable={editable}
                  placeholder="The Bride"
                />
              </p>
              <p className="font-cormorant text-[0.9rem] leading-[1.55] text-[#3A322D] sm:text-[0.95rem] sm:leading-[1.6]">
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
            <div className="
              rounded-[12px] border border-[#CBAE82] bg-[#F5EBE0]
              px-4 py-5 text-center
              shadow-[0_4px_14px_rgba(0,0,0,0.03)]
              transition-all duration-300
              hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(110,26,36,0.07)]
              sm:rounded-[14px] sm:px-5 sm:py-6
            ">
              <h3 className="mb-1 font-cinzel text-[1rem] font-semibold uppercase tracking-[2px] text-[#6E1A24] sm:mb-1.5 sm:text-[1.1rem] sm:tracking-[2.5px]">
                <Editable
                  value={mergedData.groomName}
                  field="groomName"
                  onEdit={onEdit}
                  editable={editable}
                  placeholder="HAMZA"
                />
              </h3>
              <p className="mb-2.5 font-cormorant text-[1.05rem] italic text-[#B58D57] sm:mb-3 sm:text-[1.1rem]">
                <Editable
                  value={mergedData.groomRole}
                  field="groomRole"
                  onEdit={onEdit}
                  editable={editable}
                  placeholder="The Groom"
                />
              </p>
              <p className="font-cormorant text-[0.9rem] leading-[1.55] text-[#3A322D] sm:text-[0.95rem] sm:leading-[1.6]">
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
            SECTION 3: COUNTDOWN
            ==================================================================== */}
        <motion.section
          variants={fadeInVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="
            my-6 mb-8 rounded-[16px] border border-[#CBAE82]
            bg-[#F5EBE0] px-3.5 py-6 text-center
            shadow-[0_6px_18px_rgba(110,26,36,0.05)]
            sm:my-7 sm:mb-10 sm:rounded-[18px] sm:px-4 sm:py-7
          "
        >
          <h2 className="mb-0.5 font-cormorant text-[1.9rem] font-semibold text-[#6E1A24] sm:text-[2.2rem]">
            <Editable
              value={mergedData.countdownTitle}
              field="countdownTitle"
              onEdit={onEdit}
              editable={editable}
              placeholder="The Countdown"
            />
          </h2>
          <div className="mb-1.5 select-none animate-pulse-gold text-[1rem] text-[#B58D57] sm:mb-2 sm:text-[1.1rem]">
            ❖
          </div>
          <p className="font-cormorant text-[0.9rem] text-[#3A322D] sm:text-[0.95rem]">
            <Editable
              value={mergedData.countdownSubtitle}
              field="countdownSubtitle"
              onEdit={onEdit}
              editable={editable}
              placeholder="Counting every moment until our big day"
            />
          </p>

          {isExpired ? (
            <div className="mt-4 rounded-[12px] border border-[#D4B28C] bg-[#FDFBF7] p-4 text-center shadow-sm sm:mt-5 sm:p-5">
              <div className="mb-1.5 flex items-center justify-center gap-1.5 sm:mb-2 sm:gap-2">
                <Sparkles className="h-4 w-4 shrink-0 text-[#B58D57] sm:h-5 sm:w-5" />
                <Editable
                  tag="h3"
                  value={mergedData.countdownEndedTitle}
                  field="countdownEndedTitle"
                  onEdit={onEdit}
                  editable={editable}
                  className="font-cormorant text-xl font-bold text-[#6E1A24] sm:text-2xl"
                  placeholder="Wedding in Progress!"
                />
                <Sparkles className="h-4 w-4 shrink-0 text-[#B58D57] sm:h-5 sm:w-5" />
              </div>
              <Editable
                tag="p"
                value={mergedData.countdownEndedSubtitle}
                field="countdownEndedSubtitle"
                onEdit={onEdit}
                editable={editable}
                className="mx-auto max-w-sm font-cormorant text-[13px] leading-relaxed text-[#3A322D] sm:text-sm"
                placeholder="Thank you for celebrating this memorable day with us."
                multiline
              />
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-4 gap-1.5 sm:mt-6 sm:gap-2">
              {[
                { value: timeLeft.days, label: "Days" },
                { value: timeLeft.hours, label: "Hours" },
                { value: timeLeft.minutes, label: "Mins" },
                { value: timeLeft.seconds, label: "Secs" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="
                    rounded-[10px] border border-[#D4B28C] bg-[#FDFBF7]
                    px-1 py-3 text-center
                    shadow-[0_3px_8px_rgba(0,0,0,0.03)]
                    sm:py-3.5
                  "
                >
                  <div className="font-cormorant text-[1.55rem] font-bold leading-none text-[#6E1A24] sm:text-[1.8rem]">
                    {item.value}
                  </div>
                  <div className="mt-1 font-cinzel text-[0.52rem] uppercase tracking-[0.8px] text-[#3A322D] sm:mt-1.5 sm:text-[0.58rem] sm:tracking-[1px]">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.section>

        {/* ====================================================================
            SECTION 4: FIND US
            ==================================================================== */}
        <motion.section
          variants={fadeInVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="px-2 py-7 text-center sm:px-2.5 sm:py-9"
        >
          <h2 className="mb-0.5 font-cormorant text-[1.9rem] font-semibold text-[#6E1A24] sm:text-[2.2rem]">
            <Editable
              value={mergedData.findUsTitle}
              field="findUsTitle"
              onEdit={onEdit}
              editable={editable}
              placeholder="Find Us"
            />
          </h2>
          <div className="mb-5 animate-pulse-gold text-[1.05rem] text-[#B58D57] sm:mb-6 sm:text-[1.15rem]">
            — ❀ —
          </div>

          <div className="
            mb-6 overflow-hidden rounded-[16px] border border-[#CBAE82]
            bg-[#F5EBE0] p-4
            shadow-[0_6px_18px_rgba(110,26,36,0.05)]
            sm:mb-7 sm:rounded-[18px] sm:p-5
          ">
            <p className="mb-0.5 font-cinzel text-[0.68rem] font-bold uppercase tracking-[1.3px] text-[#3A322D] sm:mb-1 sm:text-[0.72rem] sm:tracking-[1.5px]">
              <Editable
                value={mergedData.venueMapTitle}
                field="venueMapTitle"
                onEdit={onEdit}
                editable={editable}
                placeholder="THE RAVIZ KADAVU RESORT"
              />
            </p>
            <p className="mb-3.5 font-cinzel text-[0.62rem] leading-[1.55] tracking-[1.2px] text-[#3A322D] sm:mb-4 sm:text-[0.68rem] sm:tracking-[1.5px]">
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
              className="
                mt-1 inline-flex min-h-[44px] items-center gap-2
                rounded-full bg-[#6E1A24] px-5 py-3
                font-cinzel text-[0.68rem] tracking-[1.6px] text-white
                no-underline shadow-[0_3px_10px_rgba(110,26,36,0.25)]
                transition-all duration-300
                hover:-translate-y-0.5 hover:bg-[#4A1017]
                active:translate-y-0
                sm:min-h-[46px] sm:px-6 sm:text-[0.72rem] sm:tracking-[2px]
              "
            >
              <MapPin className="h-3.5 w-3.5 shrink-0" />
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
            SHARED SECTIONS + FOOTER
            ==================================================================== */}
        <CelebrationsSection
          showEvents={data?.showEvents !== false}
          theme="light"
          editable={editable}
          onEdit={onEdit}
          subtitle={data?.ceremonySubtitle || 'PROGRAM OF CELEBRATIONS'}
          title={data?.ceremonyTitle || 'Wedding Celebrations'}
          dateLabel={data?.eventDateLabel || 'The Date'}
          dateValue={data?.weddingDateFormatted || data?.weddingDate || 'Saturday, 12 December 2026'}
          dateNote={data?.eventDateNote || 'Auspicious day of celebration'}
          ceremonyLabel={data?.ceremonyLabel || 'Ceremony & Muhurtham'}
          ceremonyTime={data?.weddingTime || data?.muhurthamTime || '10:00 AM – 11:30 AM'}
          ceremonyNote={data?.ceremonyNote || 'Solemnization of marriage & blessings'}
          receptionLabel={data?.receptionLabel || 'Reception & Feast'}
          receptionTime={data?.receptionTime || '12:30 PM Onwards'}
          receptionNote={data?.receptionNote || 'Followed by lunch & celebration'}
        />

        <CouplePhotoSection
          photoUrl={data?.photoUrl || data?.heroImage || data?.couplePhoto || ''}
          groomName={mergedData.groomName || 'Groom'}
          brideName={mergedData.brideName || 'Bride'}
          photoTag={data?.photoTag || 'Memories'}
          photoTitle={data?.photoTitle || 'Moments of Love'}
          photoSubtitle={data?.photoSubtitle || 'Captured memories on our journey to forever'}
          showPhotoSection={data?.showPhotoSection !== false}
          theme="light"
          editable={editable}
          onEdit={onEdit}
        />

        <RsvpSection
          groomName={mergedData.groomName || 'Groom'}
          brideName={mergedData.brideName || 'Bride'}
          whatsappNumber={data?.whatsappNumber || data?.phone || data?.whatsapp || mergedData?.whatsappNumber || ''}
          theme="light"
        />

        <motion.footer
          variants={fadeInVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-20px" }}
          className="px-0 pb-4 pt-5 text-center font-alex text-[1.7rem] text-[#6E1A24] sm:pb-5 sm:pt-6 sm:text-[1.9rem]"
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