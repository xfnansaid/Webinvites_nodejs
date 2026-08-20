'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, Sparkles } from 'lucide-react';

// ==========================================
// REUSABLE EDITABLE COMPONENT
// ==========================================
const Editable = ({
  tag: Tag = 'span',
  value,
  field,
  onEdit,
  editable = false,
  className = '',
  placeholder = '',
  multiline = false
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const elementRef = React.useRef(null);

  React.useEffect(() => {
    if (!isEditing && elementRef.current) {
      const current = elementRef.current.textContent || '';
      const next = value ?? '';
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
      const text = elementRef.current.innerText || elementRef.current.textContent || '';
      onEdit(field, text.replace(/\u00a0/g, ' '));
    }
  };

  const cancel = () => {
    if (elementRef.current) {
      elementRef.current.textContent = value ?? '';
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
          if (!multiline && e.key === 'Enter') {
            e.preventDefault();
            commit();
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            cancel();
          }
        }
      }}
      className={`
        ${isEditing
          ? 'outline-none ring-2 ring-amber-400/60 rounded bg-white/10'
          : 'cursor-pointer ring-0 hover:ring-2 hover:ring-amber-400/40 rounded transition-all'
        }
        ${className}
      `}
      title={!isEditing ? 'Click to edit' : undefined}
    >
      {value || (placeholder && !isEditing ? <span className="opacity-40">{placeholder}</span> : placeholder)}
    </Tag>
  );
};

// ==========================================
// DEFAULT FALLBACK DATA
// ==========================================
const DEFAULT_DATA = {
  groomName: 'FAHAD',
  brideName: 'AYESHA',
  eyebrowMalayalam: 'വിവാഹ ക്ഷണം',
  eyebrowEnglish: 'Royal Malabar Nikah',
  weddingDate: '2026-10-18T10:30:00',
  dateDisplay: 'October 18, 2026',
  locationDisplay: 'Kozhikode, Kerala',
  heroImage: 'https://i.pinimg.com/474x/24/0f/5b/240f5bef281adfd33597e641f448654f.jpg',
  sealText: '• BLESSINGS • ALHAMDULILLAH ',
  venueTag: 'Royal Venue',
  venueName: 'The Raviz Kadavu',
  venueCity: 'Kozhikode (Calicut), Kerala',
  venueAddress: 'NH 66, Bypass Road, Azhinjilam, Kerala 673632.\nJoin us as we celebrate love, heritage, and togetherness.',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=The+Raviz+Kadavu+Kozhikode',
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=The+Raviz+Kadavu+Kozhikode',
  directionsUrl: 'https://www.google.com/maps/search/?api=1&query=The+Raviz+Kadavu+Kozhikode',
  countdownTitle: 'Counting Down To Forever',
  footerBlessing: 'With blessings from family & friends • Malabar, Kerala • October 2026'
};

// ==========================================
// MAIN TEMPLATE COMPONENT
// ==========================================
export default function WeddingTemplate({
  data = {},
  isDraft = false,
  editable = false,
  onEdit
}) {
  // Merge user provided data with default fallbacks
  const baseData = { ...DEFAULT_DATA, ...data };
  // Resolve canonical map URL from any field name
  const mapDefault = (baseData.venueName || baseData.venueCity || baseData.venueAddress)
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((baseData.venueName || '') + ' ' + (baseData.venueCity || '') + ' ' + (baseData.venueAddress || ''))}`
    : "";
  const canonicalMapUrl = baseData.mapsUrl || baseData.mapUrl || baseData.directionsUrl || mapDefault;
  const mergedData = { ...baseData, mapsUrl: canonicalMapUrl, mapUrl: canonicalMapUrl, directionsUrl: canonicalMapUrl };

  // Generate dynamic initials for monogram / seal / footer logo
  const groomInitial = mergedData.groomName ? mergedData.groomName.trim().charAt(0).toUpperCase() : 'F';
  const brideInitial = mergedData.brideName ? mergedData.brideName.trim().charAt(0).toUpperCase() : 'A';
  const monogram = `${groomInitial} & ${brideInitial}`;
  const sealMonogram = `${groomInitial}&${brideInitial}`;

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    days: '00',
    hours: '00',
    mins: '00',
    secs: '00'
  });

  useEffect(() => {
    const targetDate = new Date(mergedData.weddingDate || '2026-10-18T10:30:00').getTime();

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (isNaN(difference) || difference <= 0) {
        setTimeLeft({ days: '00', hours: '00', mins: '00', secs: '00' });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({
        days: String(days).padStart(2, '0'),
        hours: String(hours).padStart(2, '0'),
        mins: String(mins).padStart(2, '0'),
        secs: String(secs).padStart(2, '0')
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [mergedData.weddingDate]);

  return (
    <div style={{ containerType: 'inline-size', width: '100%', maxWidth: '100%', margin: 0, padding: 0 }}  className="relative min-h-screen bg-[#061412] text-[#F7F5F0] font-sans overflow-x-hidden antialiased selection:bg-[#D4AF37]/30 selection:text-[#F4E096]">

      {/* Ambient Arabesque Repeating Gold Geometric Texture */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(30deg, #D4AF37 12%, transparent 12.5%, transparent 87%, #D4AF37 87.5%, #D4AF37),
            linear-gradient(150deg, #D4AF37 12%, transparent 12.5%, transparent 87%, #D4AF37 87.5%, #D4AF37),
            linear-gradient(30deg, #D4AF37 12%, transparent 12.5%, transparent 87%, #D4AF37 87.5%, #D4AF37),
            linear-gradient(150deg, #D4AF37 12%, transparent 12.5%, transparent 87%, #D4AF37 87.5%, #D4AF37),
            linear-gradient(60deg, #8A6F1C 25%, transparent 25.5%, transparent 75%, #8A6F1C 75%, #8A6F1C),
            linear-gradient(60deg, #8A6F1C 25%, transparent 25.5%, transparent 75%, #8A6F1C 75%, #8A6F1C)
          `,
          backgroundSize: '40px 70px',
          backgroundPosition: '0 0, 0 0, 20px 35px, 20px 35px, 0 0, 20px 35px'
        }}
      />

      {/* ==========================================
          SECTION 1: ASYMMETRIC EDITORIAL HERO
          ========================================== */}
      <section className="relative z-10 min-h-screen flex items-center px-[6%] py-20 lg:py-0 bg-[radial-gradient(circle_at_20%_50%,_#0B2420_0%,_#061412_70%)]">
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Editorial Typography */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center lg:items-start text-center lg:text-left"
          >
            {/* Eyebrow Malayalam & English */}
            <div className="flex items-center gap-4 mb-5">
              <Editable
                tag="span"
                value={mergedData.eyebrowMalayalam}
                field="eyebrowMalayalam"
                onEdit={onEdit}
                editable={editable}
                className="font-malayalam text-[#D4AF37] text-[1.1rem]"
                placeholder="വിവാഹ ക്ഷണം"
              />
              <div className="h-[1px] w-10 bg-[#D4AF37] opacity-60" />
              <Editable
                tag="span"
                value={mergedData.eyebrowEnglish}
                field="eyebrowEnglish"
                onEdit={onEdit}
                editable={editable}
                className="text-[0.75rem] tracking-[4px] uppercase text-[#A3B8B5] font-medium font-jakarta"
                placeholder="Royal Malabar Nikah"
              />
            </div>

            {/* Couple Names Block */}
            <div className="my-2 flex flex-col items-center lg:items-start w-full">
              <h1 className="font-cinzel text-[clamp(2.8rem,7cqw,5.5rem)] font-semibold leading-[0.95] text-[#F7F5F0] tracking-tight">
                <Editable
                  tag="span"
                  value={mergedData.groomName}
                  field="groomName"
                  onEdit={onEdit}
                  editable={editable}
                  placeholder="GROOM"
                />
              </h1>

              <div className="font-amiri italic text-[2.2rem] text-[#F4E096] my-2 lg:my-2 lg:ml-10">
                &amp;
              </div>

              <h1 className="font-cinzel text-[clamp(2.8rem,7cqw,5.5rem)] font-semibold leading-[0.95] text-[#F7F5F0] tracking-tight">
                <Editable
                  tag="span"
                  value={mergedData.brideName}
                  field="brideName"
                  onEdit={onEdit}
                  editable={editable}
                  placeholder="BRIDE"
                />
              </h1>
            </div>

            {/* Date & Location Subtitle */}
            <div className="mt-4 flex flex-wrap items-center justify-center lg:justify-start gap-2 text-[0.8rem] tracking-[2px] uppercase text-[#A3B8B5] font-normal font-jakarta">
              <Editable
                tag="span"
                value={mergedData.dateDisplay}
                field="dateDisplay"
                onEdit={onEdit}
                editable={editable}
                placeholder="October 18, 2026"
              />
              <span>•</span>
              <Editable
                tag="span"
                value={mergedData.locationDisplay}
                field="locationDisplay"
                onEdit={onEdit}
                editable={editable}
                placeholder="Kozhikode, Kerala"
              />
            </div>
          </motion.div>

          {/* Right Column: Arched Image Frame + Rotating Seal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex justify-center items-center mt-6 lg:mt-0"
          >
            {/* Arched Gradient Border Frame */}
            <div className="relative w-full max-w-[340px] sm:max-w-[400px] lg:max-w-[440px] h-[460px] sm:h-[520px] lg:h-[580px] rounded-t-[220px] rounded-b-[16px] p-3 bg-gradient-to-br from-[#D4AF37] via-transparent to-[#8A6F1C] shadow-[0_30px_60px_rgba(0,0,0,0.6)] group">
              {/* Inner Frame */}
              <div className="w-full h-full rounded-t-[208px] rounded-b-[8px] overflow-hidden relative bg-[#0B2420]">
                <img
                  src={mergedData.heroImage}
                  alt={`${mergedData.groomName} & ${mergedData.brideName} Royal Nikah`}
                  className="w-full h-full object-cover filter contrast-105 brightness-95 transition-transform duration-1000 ease-out group-hover:scale-105"
                />
              </div>
            </div>

            {/* 360 Rotating Gold Seal Badge */}
            <div className="absolute -bottom-5 left-2 sm:left-4 lg:-bottom-6 lg:-left-6 w-[90px] h-[90px] lg:w-[110px] lg:h-[110px] z-20 bg-[#061412] border border-[#D4AF37] rounded-full flex items-center justify-center shadow-[0_10px_25px_rgba(0,0,0,0.5)]">
              {/* Rotating Circular Text */}
              <motion.svg
                animate={{ rotate: 360 }}
                transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 100 100"
              >
                <path
                  id="circlePathReact"
                  d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
                  fill="none"
                />
                <text
                  fontSize="11"
                  fontFamily="'Plus Jakarta Sans', sans-serif"
                  fontWeight="600"
                  fill="#D4AF37"
                  letterSpacing="2"
                >
                  <textPath href="#circlePathReact">
                    {mergedData.sealText}
                  </textPath>
                </text>
              </motion.svg>

              {/* Seal Center Initials */}
              <span className="font-amiri text-[#F4E096] text-[1.1rem] lg:text-[1.4rem] font-bold select-none z-10">
                {sealMonogram}
              </span>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ==========================================
          SECTION 2: GLASS DASHBOARD & COUNTDOWN
          ========================================== */}
      <section className="relative z-10 px-[6%] py-24 lg:py-32 bg-[radial-gradient(circle_at_80%_50%,_#0B2420_0%,_#061412_70%)] border-t border-[#D4AF37]/20 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-4xl bg-[#12332E]/40 backdrop-blur-xl border border-[#D4AF37]/30 rounded-[24px] p-8 md:p-12 lg:p-[60px_40px] shadow-[0_30px_60px_rgba(0,0,0,0.5)] grid grid-cols-1 md:grid-cols-2 gap-10 items-center"
        >
          {/* Left: Venue & Invitation Details */}
          <div className="flex flex-col text-center md:text-left">
            <Editable
              tag="span"
              value={mergedData.venueTag}
              field="venueTag"
              onEdit={onEdit}
              editable={editable}
              className="text-[0.75rem] tracking-[4px] uppercase text-[#D4AF37] font-semibold mb-4 block font-jakarta"
              placeholder="Royal Venue"
            />

            <h3 className="font-cinzel text-2xl md:text-3xl lg:text-[2.2rem] text-[#F7F5F0] font-semibold mb-4 leading-snug">
              <Editable
                tag="span"
                value={mergedData.venueName}
                field="venueName"
                onEdit={onEdit}
                editable={editable}
                placeholder="The Raviz Kadavu"
              />
            </h3>

            <p className="text-[1.1rem] text-[#F4E096] font-medium mb-2 font-jakarta">
              <Editable
                tag="span"
                value={mergedData.venueCity}
                field="venueCity"
                onEdit={onEdit}
                editable={editable}
                placeholder="Kozhikode (Calicut), Kerala"
              />
            </p>

            <p className="text-[0.95rem] text-[#A3B8B5] leading-[1.6] font-light font-jakarta whitespace-pre-line">
              <Editable
                tag="span"
                value={mergedData.venueAddress}
                field="venueAddress"
                onEdit={onEdit}
                editable={editable}
                multiline={true}
                placeholder="NH 66, Bypass Road, Azhinjilam, Kerala 673632. Join us as we celebrate love, heritage, and togetherness."
              />
            </p>
            {/* Get Directions Button */}
            <a
              href={mergedData.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#F4E096] font-jakarta font-semibold text-[11px] uppercase tracking-[0.15em] hover:bg-[#D4AF37]/20 transition-colors mx-auto md:mx-0"
            >
              <MapPin size={14} />
              View on Google Maps
            </a>
          </div>

          {/* Right: Live Countdown Dashboard */}
          <div className="flex flex-col items-center justify-center bg-black/30 p-6 md:p-8 rounded-[16px] border border-[#D4AF37]/15 shadow-inner">
            <Editable
              tag="span"
              value={mergedData.countdownTitle}
              field="countdownTitle"
              onEdit={onEdit}
              editable={editable}
              className="text-[0.75rem] tracking-[3px] uppercase text-[#A3B8B5] font-medium mb-6 font-jakarta"
              placeholder="Counting Down To Forever"
            />

            {/* Countdown Grid (Days, Hours, Mins, Secs) */}
            <div className="grid grid-cols-4 gap-3 md:gap-4 w-full text-center">
              <div className="flex flex-col items-center">
                <span className="font-cinzel text-2xl md:text-3xl lg:text-[2.4rem] text-[#F4E096] font-bold leading-none">
                  {timeLeft.days}
                </span>
                <span className="text-[0.65rem] tracking-[2px] uppercase text-[#A3B8B5] mt-2 font-jakarta">
                  Days
                </span>
              </div>

              <div className="flex flex-col items-center">
                <span className="font-cinzel text-2xl md:text-3xl lg:text-[2.4rem] text-[#F4E096] font-bold leading-none">
                  {timeLeft.hours}
                </span>
                <span className="text-[0.65rem] tracking-[2px] uppercase text-[#A3B8B5] mt-2 font-jakarta">
                  Hours
                </span>
              </div>

              <div className="flex flex-col items-center">
                <span className="font-cinzel text-2xl md:text-3xl lg:text-[2.4rem] text-[#F4E096] font-bold leading-none">
                  {timeLeft.mins}
                </span>
                <span className="text-[0.65rem] tracking-[2px] uppercase text-[#A3B8B5] mt-2 font-jakarta">
                  Mins
                </span>
              </div>

              <div className="flex flex-col items-center">
                <span className="font-cinzel text-2xl md:text-3xl lg:text-[2.4rem] text-[#F4E096] font-bold leading-none">
                  {timeLeft.secs}
                </span>
                <span className="text-[0.65rem] tracking-[2px] uppercase text-[#A3B8B5] mt-2 font-jakarta">
                  Secs
                </span>
              </div>
            </div>
          </div>

        </motion.div>
      </section>

      {/* ==========================================
          FOOTER
          ========================================== */}
      <footer className="relative z-10 py-14 px-[6%] text-center bg-[#030A09] border-t border-[#D4AF37]/15">
        <div className="font-cinzel text-2xl lg:text-3xl text-[#D4AF37] tracking-[4px] mb-3 font-semibold">
          {monogram}
        </div>
        <p className="text-[0.75rem] text-[#A3B8B5] tracking-[2px] uppercase font-jakarta">
          <Editable
            tag="span"
            value={mergedData.footerBlessing}
            field="footerBlessing"
            onEdit={onEdit}
            editable={editable}
            placeholder="With blessings from family & friends • Malabar, Kerala • October 2026"
          />
        </p>
      </footer>
    </div>
  );
}
