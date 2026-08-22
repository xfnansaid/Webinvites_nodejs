'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  ChevronDown,
  Heart,
  Users,
} from 'lucide-react';

/**
 * Reusable inline editable text component.
 */
const Editable = ({
  tag: Tag = 'span',
  value,
  field,
  onEdit,
  editable = false,
  className = '',
  placeholder = '',
  multiline = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    if (!isEditing && elementRef.current) {
      const current = elementRef.current.textContent || '';
      const next = value ?? '';

      if (current !== next) {
        elementRef.current.textContent = next;
      }
    }
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing && elementRef.current) {
      elementRef.current.focus();

      try {
        const range = document.createRange();
        range.selectNodeContents(elementRef.current);

        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      } catch (error) {}
    }
  }, [isEditing]);

  const commit = () => {
    setIsEditing(false);

    if (elementRef.current && onEdit) {
      const text =
        elementRef.current.innerText ||
        elementRef.current.textContent ||
        '';

      onEdit(field, text.replace(/\u00a0/g, ' '));
    }
  };

  const cancel = () => {
    if (elementRef.current) {
      elementRef.current.textContent = value ?? '';
    }

    setIsEditing(false);
  };

  if (!editable) {
    return <Tag className={className}>{value || placeholder}</Tag>;
  }

  return (
    <Tag
      ref={elementRef}
      contentEditable={isEditing}
      suppressContentEditableWarning
      onClick={() => !isEditing && setIsEditing(true)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (!isEditing) return;

        if (!multiline && event.key === 'Enter') {
          event.preventDefault();
          commit();
        }

        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          cancel();
        }
      }}
      className={`
        ${isEditing
          ? 'outline-none ring-2 ring-[#C6A66A]/70 rounded-lg bg-[#C6A66A]/10'
          : 'cursor-pointer hover:ring-1 hover:ring-[#C6A66A]/50 rounded-lg transition-all'
        }
        ${className}
      `}
      title={!isEditing ? 'Click to edit' : undefined}
    >
      {value ||
        (placeholder && !isEditing ? (
          <span className="opacity-40">{placeholder}</span>
        ) : (
          placeholder
        ))}
    </Tag>
  );
};

const DEFAULT_DATA = {
  brideName: 'Sreelakshmi',
  groomName: 'Vijay',
  monogram: 'S & V',

  eyebrowMal: 'വിവാഹ ക്ഷണം',
  eyebrowEn: 'A CELEBRATION OF LOVE',

  brideParents: 'Daughter of Smt. Radhika & Sri. K. Narayanan',
  groomParents: 'Son of Smt. Lakshmi & Sri. R. Menon',

  tagline:
    'Together with their families, request the honour of your presence as they begin their beautiful journey as one.',

  taglineMal: 'സ്നേഹപൂർവ്വം ക്ഷണിക്കുന്നു',

  weddingDate: '2026-09-12',
  weddingDateFormatted: 'Saturday, 12 September 2026',

  muhurthamTime: '8:00 AM',
  muhurthamNote: 'The sacred ceremony begins at the auspicious hour',

  receptionTime: '7:00 PM onwards',
  receptionNote: 'An evening of celebration, dinner & togetherness',

  venue: 'The Leela Raviz Kovalam',
  venueAddress:
    'Beach Road, Kovalam, Thiruvananthapuram, Kerala 695527',
  venueCity: 'Thiruvananthapuram, Kerala',

  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=The+Leela+Raviz+Kovalam',

  dressCode: 'Traditional Kerala Kasavu or Formal Ethnic',

  ceremonyTitle: 'The Celebration',
  ceremonySubtitle: 'SAVE THE DATE',

  countdownTitle: 'Counting down to our forever',

  saveTheDateText: 'Save The Date',
  saveTheDateNote:
    'Add our special day directly to your calendar and celebrate with us.',

  footerLogo: 'S & V',
  footerMark: 'സ്നേഹപൂർവ്വം',
  footerSub: 'WE LOOK FORWARD TO CELEBRATING THIS BEAUTIFUL DAY WITH YOU',

  audioUrl:
    'https://actions.google.com/sounds/v1/ambiences/outdoor_garden_peaceful.ogg',
};

const CountdownCard = ({ value, label }) => (
  <motion.div
    whileHover={{
      y: -5,
      scale: 1.02,
    }}
    transition={{
      duration: 0.3,
    }}
    className="
      relative
      flex
      min-w-[72px]
      sm:min-w-[105px]
      flex-col
      items-center
      justify-center
      overflow-hidden
      rounded-2xl
      border
      border-[#C6A66A]/25
      bg-[#FFFDF9]/75
      px-4
      py-5
      shadow-[0_15px_45px_rgba(75,40,30,0.06)]
      backdrop-blur-xl
    "
  >
    <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-[#C6A66A]/70 to-transparent" />

    <span
      className="text-4xl font-light leading-none text-[#4A171F] sm:text-6xl"
      style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
      }}
    >
      {value}
    </span>

    <span className="mt-3 text-[9px] font-semibold uppercase tracking-[0.25em] text-[#A18452]">
      {label}
    </span>
  </motion.div>
);

function formatWeddingDate(dateStr) {
  if (!dateStr) return '';
  if (dateStr.includes(',')) return dateStr;
  const clean = dateStr.trim();
  const d = new Date(clean.includes('T') ? clean : `${clean}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatWeddingTime(timeStr) {
  if (!timeStr) return '10:00 AM';
  const s = String(timeStr).trim();
  if (/am|pm/i.test(s)) return s;
  const match = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  }
  return s;
}

export default function WeddingInvitation({
  data = {},
  editable = false,
  onEdit,
}) {
  const brideName = data.brideName || DEFAULT_DATA.brideName;
  const groomName = data.groomName || DEFAULT_DATA.groomName;
  const weddingDate = data.weddingDate || DEFAULT_DATA.weddingDate;
  const weddingTime =
    data.weddingTime || data.muhurthamTime || DEFAULT_DATA.muhurthamTime;
  const formattedTime = formatWeddingTime(weddingTime);
  const receptionTime =
    data.heroEventText || data.receptionTime || DEFAULT_DATA.receptionTime;
  const venue = data.venue || DEFAULT_DATA.venue;
  const venueAddress = data.venueAddress || DEFAULT_DATA.venueAddress;
  const brideParents = data.brideParents || DEFAULT_DATA.brideParents;
  const groomParents = data.groomParents || DEFAULT_DATA.groomParents;
  const tagline = data.heroTagline || data.tagline || DEFAULT_DATA.tagline;
  const countdownTitle = data.countdownTitle || DEFAULT_DATA.countdownTitle;
  const weddingDateFormatted =
    data.weddingDateFormatted ||
    (data.weddingDate
      ? formatWeddingDate(data.weddingDate)
      : DEFAULT_DATA.weddingDateFormatted);

  const baseData = {
    ...DEFAULT_DATA,
    ...data,
    brideName,
    groomName,
    weddingDate,
    weddingTime,
    muhurthamTime: formattedTime,
    receptionTime,
    heroEventText: receptionTime,
    venue,
    venueAddress,
    brideParents,
    groomParents,
    tagline,
    heroTagline: tagline,
    countdownTitle,
    weddingDateFormatted,
  };

  const generatedMapUrl =
    baseData.venue || baseData.venueAddress
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${baseData.venue || ''} ${baseData.venueAddress || ''}`.trim()
        )}`
      : '';

  const canonicalMapUrl =
    data.mapsUrl ||
    data.mapUrl ||
    data.directionsUrl ||
    baseData.mapsUrl ||
    generatedMapUrl;

  const mergedData = {
    ...baseData,
    mapsUrl: canonicalMapUrl,
    mapUrl: canonicalMapUrl,
    directionsUrl: canonicalMapUrl,
  };

  const handleEdit = (field, value) => {
    if (!onEdit) return;

    onEdit(field, value);

    if (field === 'weddingDateFormatted' || field === 'weddingDate') {
      onEdit('weddingDate', value);
      onEdit('weddingDateFormatted', formatWeddingDate(value));
    } else if (field === 'muhurthamTime' || field === 'weddingTime') {
      onEdit('weddingTime', value);
      onEdit('muhurthamTime', value);
    } else if (field === 'receptionTime' || field === 'heroEventText') {
      onEdit('heroEventText', value);
      onEdit('receptionTime', value);
    } else if (field === 'tagline' || field === 'heroTagline') {
      onEdit('heroTagline', value);
      onEdit('tagline', value);
    } else if (field === 'venue') {
      onEdit('venue', value);
    } else if (field === 'venueAddress') {
      onEdit('venueAddress', value);
    } else if (field === 'brideName') {
      onEdit('brideName', value);
    } else if (field === 'groomName') {
      onEdit('groomName', value);
    } else if (field === 'brideParents') {
      onEdit('brideParents', value);
    } else if (field === 'groomParents') {
      onEdit('groomParents', value);
    } else if (field === 'countdownTitle') {
      onEdit('countdownTitle', value);
    }
  };

  const displayMonogram =
    data.monogram ||
    mergedData.monogram ||
    `${(mergedData.brideName || 'S').charAt(0)} & ${(mergedData.groomName || 'V').charAt(0)}`;

  const [timeLeft, setTimeLeft] = useState({
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00',
  });

  useEffect(() => {
    const calculateTime = () => {
      const dateStr = String(mergedData.weddingDate || '2026-09-12').trim();
      const timeStr = String(mergedData.weddingTime || '08:00:00').trim();

      let targetDate;
      const isoDateMatch = dateStr.match(/\d{4}-\d{2}-\d{2}/);
      const isoDate = isoDateMatch ? isoDateMatch[0] : '2026-09-12';

      let hh = '08';
      let mm = '00';
      const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const minutes = timeMatch[2];
        const ampm = timeMatch[3];
        if (ampm) {
          if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
          if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
        }
        hh = String(hours).padStart(2, '0');
        mm = minutes;
      }

      targetDate = new Date(`${isoDate}T${hh}:${mm}:00`).getTime();

      if (Number.isNaN(targetDate)) {
        targetDate = new Date(`${isoDate}T08:00:00`).getTime();
      }

      const now = new Date().getTime();
      const difference = targetDate - now;

      if (Number.isNaN(difference) || difference <= 0) {
        setTimeLeft({
          days: '00',
          hours: '00',
          minutes: '00',
          seconds: '00',
        });

        return;
      }

      const days = Math.floor(
        difference / (1000 * 60 * 60 * 24)
      );

      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) /
          (1000 * 60 * 60)
      );

      const minutes = Math.floor(
        (difference % (1000 * 60 * 60)) /
          (1000 * 60)
      );

      const seconds = Math.floor(
        (difference % (1000 * 60)) / 1000
      );

      setTimeLeft({
        days: String(days).padStart(2, '0'),
        hours: String(hours).padStart(2, '0'),
        minutes: String(minutes).padStart(2, '0'),
        seconds: String(seconds).padStart(2, '0'),
      });
    };

    calculateTime();

    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [mergedData.weddingDate, mergedData.weddingTime]);

  const handleSaveTheDate = () => {
    const rawDate = mergedData.weddingDate || '2026-09-12';
    const dateMatch = String(rawDate).match(/\d{4}-\d{2}-\d{2}/);
    const dateValue = dateMatch
      ? dateMatch[0].replace(/-/g, '')
      : '20260912';

    const timeStr = String(mergedData.weddingTime || '08:00:00').trim();
    let hh = '08';
    let mm = '00';
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2];
      const ampm = timeMatch[3];
      if (ampm) {
        if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
      }
      hh = String(hours).padStart(2, '0');
      mm = minutes;
    }

    const startIso = `${dateValue}T${hh}${mm}00`;
    const endIso = `${dateValue}T220000`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      `PRODID:-//${mergedData.brideName}-${mergedData.groomName}-Wedding//EN`,
      'BEGIN:VEVENT',
      `UID:${Date.now()}@wedding-invite`,
      `DTSTAMP:${new Date()
        .toISOString()
        .replace(/[-:]/g, '')
        .split('.')[0]}Z`,
      `DTSTART:${startIso}`,
      `DTEND:${endIso}`,
      `SUMMARY:${mergedData.brideName} & ${mergedData.groomName}'s Wedding`,
      `DESCRIPTION:Join us as ${mergedData.brideName} and ${mergedData.groomName} begin their journey together.`,
      `LOCATION:${mergedData.venue}, ${mergedData.venueAddress}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], {
      type: 'text/calendar;charset=utf-8',
    });

    const link = document.createElement('a');

    link.href = URL.createObjectURL(blob);

    link.download = `${mergedData.brideName}-${mergedData.groomName}-Wedding.ics`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(link.href);
  };

  const details = [
    {
      icon: Calendar,
      label: 'The Date',
      value: mergedData.weddingDateFormatted,
      field: 'weddingDate',
      note: null,
    },
    {
      icon: Clock,
      label: 'Muhurtham',
      value: mergedData.muhurthamTime,
      field: 'weddingTime',
      note: mergedData.muhurthamNote,
      noteField: 'muhurthamNote',
    },
    {
      icon: Heart,
      label: 'Reception',
      value: mergedData.receptionTime,
      field: 'heroEventText',
      note: mergedData.receptionNote,
      noteField: 'receptionNote',
    },
  ];

  return (
    <div
      style={{
        containerType: 'inline-size',
        width: '100%',
        maxWidth: '100%',
        margin: 0,
        padding: 0,
      }}
      className="
        relative
        min-h-screen
        overflow-x-hidden
        bg-[#F8F4EE]
        text-[#2C2423]
        selection:bg-[#6B2631]
        selection:text-[#F7EAD3]
      "
    >
      {/* ================= BACKGROUND ================= */}

      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.055]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 20%, rgba(184,151,88,.4) 0.7px, transparent 0.8px),
            radial-gradient(circle at 80% 60%, rgba(94,33,41,.25) 0.6px, transparent 0.8px)
          `,
          backgroundSize: '28px 28px, 42px 42px',
        }}
      />

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[#E8D7BD]/30 blur-[140px]" />

        <div className="absolute top-[45%] -left-40 h-[450px] w-[450px] rounded-full bg-[#EAD5D7]/25 blur-[130px]" />

        <div className="absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-[#DFD3BA]/25 blur-[150px]" />
      </div>

      {/* ================= FLOATING PETALS ================= */}

      <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden">
        {[
          { left: '7%', delay: 0, duration: 18 },
          { left: '20%', delay: 4, duration: 23 },
          { left: '38%', delay: 2, duration: 20 },
          { left: '62%', delay: 5, duration: 25 },
          { left: '78%', delay: 1, duration: 19 },
          { left: '93%', delay: 6, duration: 22 },
        ].map((petal, index) => (
          <motion.span
            key={index}
            className="absolute -top-10 h-4 w-2.5 rounded-[20%_80%_20%_80%]"
            style={{
              left: petal.left,
              background:
                'linear-gradient(135deg, #E8CED0, #E6D7BE)',
            }}
            animate={{
              y: ['0vh', '110vh'],
              rotate: [0, 180, 360],
              x: [0, 25, -15, 0],
              opacity: [0, 0.45, 0.45, 0],
            }}
            transition={{
              duration: petal.duration,
              delay: petal.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* ================= HERO ================= */}

      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-28 text-center sm:py-32">
        {/* Decorative Frame */}

        <div className="pointer-events-none absolute inset-3 sm:inset-6">
          <div className="absolute inset-0 rounded-t-[180px] border border-[#C6A66A]/50 sm:rounded-t-[260px]" />

          <div className="absolute inset-3 rounded-t-[170px] border border-[#C6A66A]/20 sm:rounded-t-[250px]" />

          <div className="absolute left-8 top-8 h-12 w-12 border-l border-t border-[#C6A66A]/60" />

          <div className="absolute right-8 top-8 h-12 w-12 border-r border-t border-[#C6A66A]/60" />

          <div className="absolute bottom-8 left-8 h-12 w-12 border-b border-l border-[#C6A66A]/60" />

          <div className="absolute bottom-8 right-8 h-12 w-12 border-b border-r border-[#C6A66A]/60" />
        </div>

        {/* Hanging Bells */}

        <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 flex justify-center gap-14 px-6 sm:gap-28">
          {[0, 0.5, 1].map((delay, index) => (
            <motion.div
              key={index}
              className="origin-top"
              animate={{
                rotate: [-3, 3, -3],
              }}
              transition={{
                duration: 4,
                delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <svg
                viewBox="0 0 24 45"
                className="w-5 opacity-70"
              >
                <path
                  d="M12 0V8"
                  stroke="#C6A66A"
                  strokeWidth="1.2"
                />

                <path
                  d="M6 11C6 6 8.5 4 12 4s6 2 6 7l2 11H4z"
                  fill="#E5D3AF"
                />

                <circle
                  cx="12"
                  cy="25"
                  r="2.3"
                  fill="#6B2631"
                />
              </svg>
            </motion.div>
          ))}
        </div>

        {/* Monogram */}

        <motion.div
          initial={{
            opacity: 0,
            scale: 0.7,
            y: -25,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
          }}
          transition={{
            duration: 1.2,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative z-10 mb-9"
        >
          <div className="absolute inset-[-9px] rounded-full border border-[#C6A66A]/25" />

          <div className="absolute inset-[-4px] rounded-full border border-[#C6A66A]/50" />

          <div
            className="
              relative
              flex
              h-20
              w-20
              items-center
              justify-center
              rounded-full
              border
              border-[#C6A66A]
              bg-[#FFFDF9]/80
              text-2xl
              text-[#7A2634]
              shadow-[0_15px_45px_rgba(94,33,41,0.12)]
              backdrop-blur-xl
            "
            style={{
              fontFamily:
                "'Cormorant Garamond', Georgia, serif",
            }}
          >
            <Editable
              value={displayMonogram}
              field="monogram"
              onEdit={handleEdit}
              editable={editable}
              placeholder="S & V"
            />
          </div>
        </motion.div>

        {/* Eyebrow */}

        <motion.div
          initial={{
            opacity: 0,
            y: -15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.8,
            delay: 0.15,
          }}
          className="relative z-10"
        >
          <p className="text-xl font-medium text-[#7A2634]">
            <Editable
              value={mergedData.eyebrowMal}
              field="eyebrowMal"
              onEdit={handleEdit}
              editable={editable}
            />
          </p>

          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-[#C6A66A]/50" />

            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#8E7B61]">
              <Editable
                value={mergedData.eyebrowEn}
                field="eyebrowEn"
                onEdit={handleEdit}
                editable={editable}
              />
            </p>

            <span className="h-px w-8 bg-[#C6A66A]/50" />
          </div>
        </motion.div>

        {/* Couple */}

        <div className="relative z-10 my-8 flex flex-col items-center">
          {/* Bride */}

          <motion.div
            initial={{
              opacity: 0,
              y: 40,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 1,
              delay: 0.25,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <h1
              className="
                text-[3.7rem]
                font-light
                leading-[0.85]
                tracking-[-0.04em]
                text-[#4A171F]
                sm:text-7xl
                md:text-8xl
                lg:text-9xl
              "
              style={{
                fontFamily:
                  "'Cormorant Garamond', Georgia, serif",
              }}
            >
              <Editable
                value={mergedData.brideName}
                field="brideName"
                onEdit={handleEdit}
                editable={editable}
                placeholder="Bride"
              />
            </h1>

            <p className="mx-auto mt-4 max-w-sm text-[9px] font-medium uppercase tracking-[0.16em] text-[#80756E] sm:text-[10px]">
              <Editable
                value={mergedData.brideParents}
                field="brideParents"
                onEdit={handleEdit}
                editable={editable}
                multiline
              />
            </p>
          </motion.div>

          {/* Decorative Center */}

          <motion.div
            initial={{
              opacity: 0,
              scale: 0.8,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              duration: 1,
              delay: 0.5,
            }}
            className="relative my-8 flex items-center justify-center"
          >
            <div className="absolute h-px w-32 -translate-x-24 bg-gradient-to-r from-transparent to-[#C6A66A]/70" />

            <div className="absolute h-px w-32 translate-x-24 bg-gradient-to-l from-transparent to-[#C6A66A]/70" />

            <div className="relative z-10 flex items-center gap-5 rounded-full bg-[#F8F4EE] px-6 py-2">
              {/* Left Peacock */}

              <svg
                className="w-9 opacity-85"
                viewBox="0 0 60 60"
                fill="none"
              >
                <path
                  d="M30 40c-4-10-2-20 4-26"
                  stroke="#4D6A58"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                />

                <circle
                  cx="35"
                  cy="12"
                  r="4"
                  fill="#4D6A58"
                />

                <circle
                  cx="35"
                  cy="12"
                  r="1.4"
                  fill="#C6A66A"
                />

                <path
                  d="M30 40c6-8 14-10 22-6M30 40c6-4 15-3 20 2"
                  stroke="#C6A66A"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>

              {/* Nilavilakku */}

              <svg
                className="w-9"
                viewBox="0 0 60 90"
                fill="none"
              >
                <motion.path
                  d="M30 8c5 7 6 12 2 17-2-2-4-2-6 0-3-5-2-11 4-17z"
                  fill="#D4AF37"
                  animate={{
                    scaleY: [1, 1.15, 0.95, 1],
                    scaleX: [1, 0.94, 1.05, 1],
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />

                <ellipse
                  cx="30"
                  cy="34"
                  rx="8"
                  ry="4"
                  fill="#C6A66A"
                />

                <path
                  d="M16 40h28l-3 8H19z"
                  fill="#E6D6B7"
                />

                <rect
                  x="28"
                  y="48"
                  width="4"
                  height="24"
                  fill="#C6A66A"
                />

                <ellipse
                  cx="30"
                  cy="74"
                  rx="16"
                  ry="4"
                  fill="#E6D6B7"
                />
              </svg>

              {/* Right Peacock */}

              <svg
                className="w-9 scale-x-[-1] opacity-85"
                viewBox="0 0 60 60"
                fill="none"
              >
                <path
                  d="M30 40c-4-10-2-20 4-26"
                  stroke="#4D6A58"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                />

                <circle
                  cx="35"
                  cy="12"
                  r="4"
                  fill="#4D6A58"
                />

                <circle
                  cx="35"
                  cy="12"
                  r="1.4"
                  fill="#C6A66A"
                />

                <path
                  d="M30 40c6-8 14-10 22-6M30 40c6-4 15-3 20 2"
                  stroke="#C6A66A"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </motion.div>

          {/* Groom */}

          <motion.div
            initial={{
              opacity: 0,
              y: 40,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 1,
              delay: 0.4,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <h1
              className="
                text-[3.7rem]
                font-light
                leading-[0.85]
                tracking-[-0.04em]
                text-[#4A171F]
                sm:text-7xl
                md:text-8xl
                lg:text-9xl
              "
              style={{
                fontFamily:
                  "'Cormorant Garamond', Georgia, serif",
              }}
            >
              <Editable
                value={mergedData.groomName}
                field="groomName"
                onEdit={handleEdit}
                editable={editable}
                placeholder="Groom"
              />
            </h1>

            <p className="mx-auto mt-4 max-w-sm text-[9px] font-medium uppercase tracking-[0.16em] text-[#80756E] sm:text-[10px]">
              <Editable
                value={mergedData.groomParents}
                field="groomParents"
                onEdit={handleEdit}
                editable={editable}
                multiline
              />
            </p>
          </motion.div>
        </div>

        {/* Tagline */}

        <motion.div
          initial={{
            opacity: 0,
            y: 30,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 1,
            delay: 0.7,
          }}
          className="relative z-10 max-w-2xl px-4"
        >
          <Sparkles
            className="mx-auto mb-5 text-[#C6A66A]"
            size={18}
            strokeWidth={1.3}
          />

          <p
            className="text-xl font-light italic leading-relaxed text-[#4B3B39] sm:text-2xl"
            style={{
              fontFamily:
                "'Cormorant Garamond', Georgia, serif",
            }}
          >
            <Editable
              value={mergedData.tagline}
              field="tagline"
              onEdit={handleEdit}
              editable={editable}
              multiline
            />
          </p>

          <p className="mt-5 text-lg tracking-wide text-[#7A2634]">
            <Editable
              value={mergedData.taglineMal}
              field="taglineMal"
              onEdit={handleEdit}
              editable={editable}
            />
          </p>
        </motion.div>

        {/* Scroll */}

        <motion.a
          href="#details"
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            delay: 1.2,
          }}
          className="relative z-10 mt-12 flex flex-col items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.3em] text-[#8B7A67]"
        >
          <span>Discover Our Celebration</span>

          <motion.div
            animate={{
              y: [0, 6, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            <ChevronDown
              size={17}
              className="text-[#C6A66A]"
            />
          </motion.div>
        </motion.a>
      </section>

      {/* ================= MARQUEE ================= */}

      <div className="relative z-20 overflow-hidden border-y border-[#C6A66A]/50 bg-[#40151B] py-4 text-[#EADBBF]">
        <motion.div
          className="flex whitespace-nowrap text-xs uppercase tracking-[0.22em] sm:text-sm"
          animate={{
            x: [0, -1200],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-8 pr-8"
            >
              <span>
                {mergedData.brideName} & {mergedData.groomName}
              </span>

              <span className="text-[#C6A66A]">✦</span>

              <span>
                {mergedData.weddingDateFormatted}
              </span>

              <span className="text-[#C6A66A]">✦</span>

              <span>{mergedData.venue}</span>

              <span className="text-[#C6A66A]">✦</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ================= DETAILS ================= */}

      <section
        id="details"
        className="relative z-10 flex flex-col items-center px-6 py-24 text-center sm:py-32"
      >
        {/* Heading */}

        <motion.div
          initial={{
            opacity: 0,
            y: 30,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.3,
          }}
          transition={{
            duration: 0.8,
          }}
          className="mb-14"
        >
          <div className="mb-5 flex items-center justify-center gap-4 text-[#C6A66A]">
            <span className="h-px w-12 bg-[#C6A66A]/50" />

            <Sparkles
              size={16}
              strokeWidth={1.3}
            />

            <span className="h-px w-12 bg-[#C6A66A]/50" />
          </div>

          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#9A8155]">
            <Editable
              value={mergedData.ceremonySubtitle}
              field="ceremonySubtitle"
              onEdit={handleEdit}
              editable={editable}
            />
          </p>

          <h2
            className="text-5xl font-light tracking-tight text-[#4A171F] sm:text-6xl"
            style={{
              fontFamily:
                "'Cormorant Garamond', Georgia, serif",
            }}
          >
            <Editable
              value={mergedData.ceremonyTitle}
              field="ceremonyTitle"
              onEdit={handleEdit}
              editable={editable}
            />
          </h2>
        </motion.div>

        {/* Details Card */}

        <motion.div
          initial={{
            opacity: 0,
            y: 50,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.2,
          }}
          transition={{
            duration: 0.9,
          }}
          className="
            relative
            mb-20
            w-full
            max-w-2xl
            overflow-hidden
            rounded-[2rem]
            border
            border-[#C6A66A]/30
            bg-[#FFFDF9]/75
            px-7
            pb-10
            pt-16
            shadow-[0_30px_80px_rgba(63,38,30,0.08)]
            backdrop-blur-xl
            sm:px-14
            sm:pb-14
          "
        >
          <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-[#C6A66A] to-transparent" />

          <div className="absolute left-1/2 top-5 -translate-x-1/2 text-xs tracking-[0.5em] text-[#C6A66A]">
            ✦ ✦ ✦
          </div>

          {details.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.label}
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{
                  once: true,
                }}
                transition={{
                  delay: index * 0.1,
                  duration: 0.6,
                }}
                className="relative flex flex-col items-center border-b border-[#C6A66A]/15 py-8 last:border-none"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-[#C6A66A]/25 bg-[#F8F1E7] text-[#9B7845]">
                  <Icon
                    size={18}
                    strokeWidth={1.4}
                  />
                </div>

                <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#9B8256]">
                  {item.label}
                </span>

                <span
                  className="mt-3 text-3xl font-light text-[#3D2A2A]"
                  style={{
                    fontFamily:
                      "'Cormorant Garamond', Georgia, serif",
                  }}
                >
                  <Editable
                    value={item.value}
                    field={item.field}
                    onEdit={handleEdit}
                    editable={editable}
                  />
                </span>

                {item.note && (
                  <p className="mt-2 max-w-md text-xs leading-relaxed text-[#82756E]">
                    <Editable
                      value={item.note}
                      field={item.noteField}
                      onEdit={handleEdit}
                      editable={editable}
                      multiline
                    />
                  </p>
                )}
              </motion.div>
            );
          })}

          {/* Venue */}

          <div className="flex flex-col items-center border-b border-[#C6A66A]/15 py-8">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-[#C6A66A]/25 bg-[#F8F1E7] text-[#9B7845]">
              <MapPin
                size={18}
                strokeWidth={1.4}
              />
            </div>

            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#9B8256]">
              The Venue
            </span>

            <span
              className="mt-3 text-3xl font-light text-[#3D2A2A]"
              style={{
                fontFamily:
                  "'Cormorant Garamond', Georgia, serif",
              }}
            >
              <Editable
                value={mergedData.venue}
                field="venue"
                onEdit={handleEdit}
                editable={editable}
              />
            </span>

            <p className="mt-3 max-w-md text-xs leading-relaxed text-[#82756E]">
              <Editable
                value={mergedData.venueAddress}
                field="venueAddress"
                onEdit={handleEdit}
                editable={editable}
                multiline
              />
            </p>

            <motion.a
              href={mergedData.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{
                y: -2,
                scale: 1.02,
              }}
              whileTap={{
                scale: 0.98,
              }}
              className="
                mt-6
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-[#C6A66A]/50
                bg-[#5E2129]
                px-6
                py-3
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.2em]
                text-[#FFF9EF]
                shadow-[0_10px_25px_rgba(94,33,41,0.18)]
              "
            >
              <MapPin
                size={14}
                strokeWidth={1.5}
              />

              Get Directions
            </motion.a>
          </div>

          {/* Dress Code */}

          <div className="flex flex-col items-center pt-8">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-[#C6A66A]/25 bg-[#F8F1E7] text-[#9B7845]">
              <Users
                size={18}
                strokeWidth={1.4}
              />
            </div>

            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#9B8256]">
              Dress Code
            </span>

            <p
              className="mt-3 text-xl font-light text-[#3D2A2A]"
              style={{
                fontFamily:
                  "'Cormorant Garamond', Georgia, serif",
              }}
            >
              <Editable
                value={mergedData.dressCode}
                field="dressCode"
                onEdit={handleEdit}
                editable={editable}
                multiline
              />
            </p>
          </div>
        </motion.div>

        {/* Countdown */}

        <motion.div
          initial={{
            opacity: 0,
            scale: 0.95,
            y: 25,
          }}
          whileInView={{
            opacity: 1,
            scale: 1,
            y: 0,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.8,
          }}
          className="flex w-full max-w-4xl flex-col items-center"
        >
          <div className="mb-7 flex items-center gap-4">
            <span className="h-px w-10 bg-[#C6A66A]/40" />

            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8B7A67]">
              <Editable
                value={mergedData.countdownTitle}
                field="countdownTitle"
                onEdit={handleEdit}
                editable={editable}
              />
            </p>

            <span className="h-px w-10 bg-[#C6A66A]/40" />
          </div>

          <div className="mb-12 flex flex-wrap justify-center gap-3 sm:gap-5">
            <CountdownCard
              value={timeLeft.days}
              label="Days"
            />

            <CountdownCard
              value={timeLeft.hours}
              label="Hours"
            />

            <CountdownCard
              value={timeLeft.minutes}
              label="Minutes"
            />

            <CountdownCard
              value={timeLeft.seconds}
              label="Seconds"
            />
          </div>

          {/* Save Date */}

          <motion.button
            onClick={handleSaveTheDate}
            whileHover={{
              scale: 1.03,
              y: -3,
              boxShadow:
                '0 20px 40px rgba(94,33,41,0.25)',
            }}
            whileTap={{
              scale: 0.97,
            }}
            className="
              relative
              overflow-hidden
              rounded-full
              border
              border-[#C6A66A]/40
              bg-[#5E2129]
              px-10
              py-4
              text-xs
              font-semibold
              uppercase
              tracking-[0.22em]
              text-[#FFF9EF]
              shadow-[0_12px_30px_rgba(94,33,41,0.18)]
            "
          >
            <span className="relative z-10 flex items-center gap-3">
              <Calendar
                size={16}
                strokeWidth={1.4}
              />

              <Editable
                value={mergedData.saveTheDateText}
                field="saveTheDateText"
                onEdit={handleEdit}
                editable={editable}
              />
            </span>
          </motion.button>

          <p className="mt-5 max-w-sm text-xs leading-relaxed text-[#82756E]">
            <Editable
              value={mergedData.saveTheDateNote}
              field="saveTheDateNote"
              onEdit={handleEdit}
              editable={editable}
              multiline
            />
          </p>
        </motion.div>
      </section>

      {/* ================= FOOTER ================= */}

      <footer className="relative z-10 overflow-hidden bg-[#351116] px-6 py-20 text-center text-[#FAF7F2]">
        <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-[#C6A66A] to-transparent" />

        <div className="absolute -left-32 -top-32 h-64 w-64 rounded-full bg-[#6B2631]/30 blur-[100px]" />

        <div className="absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-[#C6A66A]/10 blur-[100px]" />

        <div className="relative mx-auto flex max-w-xl flex-col items-center">
          <div className="mb-8 flex items-center gap-4 text-[#C6A66A]">
            <span className="h-px w-16 bg-[#C6A66A]/50" />

            <Sparkles
              size={16}
              strokeWidth={1.3}
            />

            <span className="h-px w-16 bg-[#C6A66A]/50" />
          </div>

          <div
            className="text-5xl font-light tracking-tight text-[#EADBBF] sm:text-6xl"
            style={{
              fontFamily:
                "'Cormorant Garamond', Georgia, serif",
            }}
          >
            <Editable
              value={mergedData.footerLogo}
              field="footerLogo"
              onEdit={handleEdit}
              editable={editable}
            />
          </div>

          <p className="mt-4 text-2xl text-[#D9C29A]">
            <Editable
              value={mergedData.footerMark}
              field="footerMark"
              onEdit={handleEdit}
              editable={editable}
            />
          </p>

          <div className="my-8 h-px w-24 bg-[#C6A66A]/40" />

          <p className="max-w-sm text-[10px] font-medium uppercase leading-6 tracking-[0.28em] text-[#FAF7F2]/55">
            <Editable
              value={mergedData.footerSub}
              field="footerSub"
              onEdit={handleEdit}
              editable={editable}
              multiline
            />
          </p>

          <div className="mt-10 flex items-center gap-3 text-xs text-[#C6A66A]">
            <span>✦</span>
            <span className="h-px w-10 bg-[#C6A66A]/40" />
            <span>✦</span>
            <span className="h-px w-10 bg-[#C6A66A]/40" />
            <span>✦</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
