'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  Heart,
  Navigation,
  CalendarCheck,
} from 'lucide-react';
import CelebrationsSection from './CelebrationsSection';
import CouplePhotoSection from './CouplePhotoSection';
import RsvpSection from './RsvpSection';

// ======================================================================
// EDITABLE INLINE TEXT COMPONENT
// ======================================================================

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
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(range);
        }
      } catch (e) { }
    }
  }, [isEditing]);

  const commit = () => {
    setIsEditing(false);
    if (elementRef.current && onEdit) {
      const text = elementRef.current.innerText || elementRef.current.textContent || '';
      onEdit(field, text.replace(/\u00a0/g, ' '));
    }
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
      onKeyDown={(e) => {
        if (!multiline && e.key === 'Enter') {
          e.preventDefault();
          commit();
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          if (elementRef.current) elementRef.current.textContent = value ?? '';
          setIsEditing(false);
        }
      }}
      className={`
        ${className}
        cursor-pointer
        outline-none
        transition-all duration-200
        ${isEditing
          ? 'ring-2 ring-amber-400 bg-white/20 px-1.5 py-0.5 rounded shadow-sm'
          : 'hover:outline-dashed hover:outline-1 hover:outline-amber-400/70 hover:bg-white/10 rounded'
        }
      `}
      title={!isEditing ? 'Click to edit' : undefined}
    >
      {value || (placeholder && !isEditing ? <span className="opacity-40">{placeholder}</span> : placeholder)}
    </Tag>
  );
};

// ======================================================================
// APPLE DESIGN SPRING PHYSICS (Fluid & Interruptible)
// ======================================================================

const springPhysics = {
  type: 'spring',
  damping: 24,
  stiffness: 260,
  mass: 0.8,
};

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      ...springPhysics,
      delay: i * 0.07,
    },
  }),
};

// ======================================================================
// MAIN COMPONENT: CrimsonGoldNikah (StandardCrimson)
// ======================================================================

export default function CrimsonGoldNikah({
  data = {},
  onEdit = () => { },
  editable = false,
  className = '',
  previewMode = false,
}) {
  const shouldReduceMotion = useReducedMotion();

  const groomName = data.groomName || 'Rizwan Ahmed';
  const brideName = data.brideName || 'Ayesha Fathima';
  const weddingDate = data.weddingDate || '2026-12-12';
  const weddingTime = data.weddingTime || '10:00 AM';
  const venue = data.venue || 'Kadaloram Convention Centre';
  const venueAddress =
    data.venueAddress ||
    'Beach Road, Kozhikode (Calicut), Kerala 673032';
  const groomParents = data.groomParents || 'Son of Mr. & Mrs. Rahman';
  const brideParents = data.brideParents || 'Daughter of Mr. & Mrs. Ibrahim';
  const heroEventText =
    data.heroEventText || 'are entering into Nikah, insha\'Allah';
  const countdownTitle =
    data.countdownTitle || 'Counting Down to Forever';
  const countdownEndedTitle =
    data.countdownEndedTitle || 'Wedding in Progress!';
  const countdownEndedSubtitle =
    data.countdownEndedSubtitle || 'Thank you for celebrating this blessed union with us!';

  const canonicalMapUrl =
    data.mapsUrl ||
    data.directionsUrl ||
    data.mapUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      (venue || '') + ' ' + (venueAddress || '')
    )}`;

  const groomInitial = (groomName || 'R').trim().charAt(0).toUpperCase();
  const brideInitial = (brideName || 'A').trim().charAt(0).toUpperCase();
  const monogram = `${groomInitial} & ${brideInitial}`;

  const weddingTarget = useMemo(() => {
    const date = new Date(`${weddingDate} ${weddingTime || '10:00 AM'}`);
    return !isNaN(date.getTime())
      ? date
      : new Date(`${weddingDate}T10:00:00`);
  }, [weddingDate, weddingTime]);

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const diff = weddingTarget.getTime() - new Date().getTime();
      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setIsExpired(false);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [weddingTarget]);

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Calendar .ics download generator
  const handleAddToCalendar = () => {
    try {
      const dateMatch = String(weddingDate).match(/\d{4}-\d{2}-\d{2}/);
      const dateValue = dateMatch ? dateMatch[0].replace(/-/g, '') : '20261212';
      const startIso = `${dateValue}T100000`;
      const endIso = `${dateValue}T220000`;

      const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        `PRODID:-//${groomName}-${brideName}-Wedding//EN`,
        'BEGIN:VEVENT',
        `UID:${Date.now()}@webinvites.in`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART:${startIso}`,
        `DTEND:${endIso}`,
        `SUMMARY:${groomName} & ${brideName}'s Wedding`,
        `DESCRIPTION:Wedding celebration of ${groomName} and ${brideName}.`,
        `LOCATION:${venue}, ${venueAddress}`,
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n');

      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', `${groomName}-${brideName}-Wedding.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.warn('Calendar download error:', e);
    }
  };

  // Soft floating ambient petals
  const petals = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      left: `${(i * 7.1 + 3) % 100}%`,
      size: 6 + ((i * 2.2) % 6),
      duration: 12 + ((i * 1.5) % 8),
      delay: (i * 0.7) % 6,
    }));
  }, []);

  return (
    <div
      style={{
        containerType: 'inline-size',
        width: '100%',
        maxWidth: '100%',
        margin: 0,
        padding: 0,
        backgroundColor: '#F9F5EE',
        fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
      }}
      className={`relative min-h-screen w-full overflow-x-hidden text-[#2C2220] selection:bg-[#781B28] selection:text-[#FDFBF7] ${className}`}
    >
      {/* ===================== HERO SECTION ===================== */}
      <section id="hero-section" className="relative w-full overflow-hidden">
        {/* Background Image & Vignette */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://one-tawny-two.vercel.app/0001/img/crimson-scroll-bg.webp"
            alt="Royal Crimson Background"
            className="h-full w-full object-cover object-center scale-[1.02]"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#1C0407]/60 via-[#120305]/75 to-[#F9F5EE]" />
        </div>

        {/* Floating Ambient Petals */}
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
          {petals.map((petal) => (
            <motion.div
              key={petal.id}
              initial={{ y: '-10%', rotate: 0, opacity: 0 }}
              animate={
                shouldReduceMotion
                  ? { opacity: 0.3 }
                  : {
                    y: '120%',
                    rotate: [0, 120, 240],
                    opacity: [0, 0.75, 0.75, 0],
                  }
              }
              transition={{
                duration: petal.duration,
                repeat: Infinity,
                delay: petal.delay,
                ease: 'linear',
              }}
              style={{
                left: petal.left,
                width: `${petal.size}px`,
                height: `${petal.size}px`,
                background:
                  'radial-gradient(circle at 35% 35%, #C23B47, #5C101A)',
                borderRadius: '60% 5% 60% 5%',
              }}
              className="absolute shadow-sm"
            />
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-20 mx-auto flex min-h-[92vh] max-w-lg flex-col items-center justify-end px-5 pb-24 pt-20 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            className="flex w-full flex-col items-center"
          >
            {/* Top Ornamental Divider */}
            <motion.div
              variants={fadeUp}
              custom={0}
              className="mb-5 flex items-center justify-center gap-3 text-[#E8C882]"
            >
              <div className="h-px w-10 bg-gradient-to-r from-transparent to-[#E8C882]/70" />
              <Sparkles size={14} className="text-[#E8C882]" />
              <div className="h-px w-10 bg-gradient-to-l from-transparent to-[#E8C882]/70" />
            </motion.div>

            {/* Tagline */}
            <motion.div variants={fadeUp} custom={1} className="mb-2">
              <Editable
                tag="p"
                value={data.heroTagline || "Together with their families"}
                field="heroTagline"
                onEdit={onEdit}
                editable={editable}
                className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.28em] text-[#E8C882]/90"
                placeholder="Together with their families"
              />
            </motion.div>

            {/* Groom Name (Optical Typography: tight display tracking) */}
            <motion.div variants={fadeUp} custom={2}>
              <Editable
                tag="h1"
                value={groomName}
                field="groomName"
                onEdit={onEdit}
                editable={editable}
                className="font-display text-[clamp(2rem,9.5cqw,3rem)] font-normal tracking-tight leading-[1.1] text-[#FFFDF8] drop-shadow-md break-words"
                placeholder="Groom Name"
              />
            </motion.div>

            {/* Groom Parents */}
            <motion.div variants={fadeUp} custom={3}>
              <Editable
                tag="p"
                value={groomParents}
                field="groomParents"
                onEdit={onEdit}
                editable={editable}
                className="mt-1 text-[12px] font-light tracking-wide text-[#E8C882]/75"
                placeholder="Son of Mr. & Mrs. Rahman"
              />
            </motion.div>

            {/* Ampersand Divider */}
            <motion.div
              variants={fadeUp}
              custom={4}
              className="my-3 flex items-center justify-center gap-3 text-[#E8C882]"
            >
              <div className="h-px w-8 bg-[#E8C882]/35" />
              <span className="text-xl font-light italic text-[#E8C882]">&</span>
              <div className="h-px w-8 bg-[#E8C882]/35" />
            </motion.div>

            {/* Bride Name */}
            <motion.div variants={fadeUp} custom={5}>
              <Editable
                tag="h1"
                value={brideName}
                field="brideName"
                onEdit={onEdit}
                editable={editable}
                className="font-display text-[clamp(2rem,9.5cqw,3rem)] font-normal tracking-tight leading-[1.1] text-[#FFFDF8] drop-shadow-md break-words"
                placeholder="Bride Name"
              />
            </motion.div>

            {/* Bride Parents */}
            <motion.div variants={fadeUp} custom={6}>
              <Editable
                tag="p"
                value={brideParents}
                field="brideParents"
                onEdit={onEdit}
                editable={editable}
                className="mt-1 text-[12px] font-light tracking-wide text-[#E8C882]/75"
                placeholder="Daughter of Mr. & Mrs. Ibrahim"
              />
            </motion.div>

            {/* Hero Event Text */}
            <motion.div variants={fadeUp} custom={7} className="mt-4">
              <Editable
                tag="p"
                value={heroEventText}
                field="heroEventText"
                onEdit={onEdit}
                editable={editable}
                className="max-w-[290px] text-[13.5px] font-light italic leading-relaxed tracking-wide text-[#FFF4DF]/90"
                placeholder="are entering into Nikah, insha'Allah"
              />
            </motion.div>

            {/* Date & Time Badges (Translucent Material with border highlight) */}
            <motion.div
              variants={fadeUp}
              custom={8}
              className="mt-7 flex flex-col items-center gap-2.5 sm:flex-row sm:gap-3.5"
            >
              <div className="flex items-center gap-2 rounded-full border border-[#E8C882]/30 bg-black/40 px-4 py-1.5 shadow-lg backdrop-blur-md">
                <Calendar size={13} className="text-[#E8C882]" />
                <Editable
                  tag="span"
                  value={formatDate(weddingDate)}
                  field="weddingDate"
                  onEdit={onEdit}
                  editable={editable}
                  className="text-[11.5px] font-medium tracking-wide text-[#FFFDF8]"
                  placeholder="Wedding Date"
                />
              </div>

              <div className="flex items-center gap-2 rounded-full border border-[#E8C882]/30 bg-black/40 px-4 py-1.5 shadow-lg backdrop-blur-md">
                <Clock size={13} className="text-[#E8C882]" />
                <Editable
                  tag="span"
                  value={weddingTime}
                  field="weddingTime"
                  onEdit={onEdit}
                  editable={editable}
                  className="text-[11.5px] font-medium tracking-wide text-[#FFFDF8]"
                  placeholder="Time"
                />
              </div>
            </motion.div>

            {/* Add to Calendar Interactive Action */}
            <motion.button
              type="button"
              onClick={handleAddToCalendar}
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              transition={springPhysics}
              variants={fadeUp}
              custom={9}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#E8C882]/40 bg-[#E8C882]/15 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[#FFF4DF] backdrop-blur-md transition-all hover:bg-[#E8C882]/25"
            >
              <CalendarCheck size={13} className="text-[#E8C882]" />
              <span>Add to Calendar</span>
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ===================== MAIN BODY CONTENT ===================== */}
      <div className="relative z-10 mx-auto max-w-lg px-4 sm:px-5 pb-20">
        
        {/* ================= COUNTDOWN SECTION ================= */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="mt-4 text-center"
        >
          <motion.div variants={fadeUp} custom={0}>
            <Editable
              tag="h2"
              value={countdownTitle}
              field="countdownTitle"
              onEdit={onEdit}
              editable={editable}
              className="mb-5 text-[10.5px] sm:text-[11px] font-bold uppercase tracking-[0.28em] text-[#7A5836]"
              placeholder="Counting Down to Forever"
            />
          </motion.div>

          {isExpired ? (
            /* Celebratory Banner when wedding time arrives */
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springPhysics}
              className="rounded-3xl border border-[#C6A66A]/35 bg-white/85 p-6 sm:p-7 text-center shadow-[0_20px_50px_rgba(74,23,31,0.06)] backdrop-blur-xl"
            >
              <div className="mb-2 flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-[#8A212E]" />
                <Editable
                  tag="h3"
                  value={countdownEndedTitle}
                  field="countdownEndedTitle"
                  onEdit={onEdit}
                  editable={editable}
                  className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#5C101A]"
                  placeholder="Wedding in Progress!"
                />
                <Sparkles className="h-5 w-5 text-[#8A212E]" />
              </div>
              <Editable
                tag="p"
                value={countdownEndedSubtitle}
                field="countdownEndedSubtitle"
                onEdit={onEdit}
                editable={editable}
                className="mx-auto max-w-xs text-xs sm:text-sm text-[#7A6458] leading-relaxed"
                placeholder="Thank you for celebrating this blessed union with us!"
                multiline
              />
            </motion.div>
          ) : (
            /* Tactile Translucent Countdown Tiles */
            <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
              {[
                { label: 'Days', value: timeLeft.days },
                { label: 'Hours', value: timeLeft.hours },
                { label: 'Mins', value: timeLeft.minutes },
                { label: 'Secs', value: timeLeft.seconds },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  variants={fadeUp}
                  custom={i}
                  className="flex flex-col items-center rounded-2xl border border-stone-200/80 bg-white/90 py-3.5 shadow-[0_8px_20px_rgba(0,0,0,0.03)] backdrop-blur-sm transition-all"
                >
                  <span className="font-display text-2xl sm:text-3xl font-semibold tabular-nums text-[#4A171F]">
                    {String(item.value).padStart(2, '0')}
                  </span>
                  <span className="mt-1 text-[9.5px] sm:text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    {item.label}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* ================= CELEBRATIONS / PROGRAM SECTION ================= */}
        <CelebrationsSection
          showEvents={data?.showEvents !== false}
          theme="crimson"
          editable={editable}
          onEdit={onEdit}
          subtitle={data?.ceremonySubtitle || 'PROGRAM OF CELEBRATIONS'}
          title={data?.ceremonyTitle || 'Wedding Celebrations'}
          dateLabel={data?.eventDateLabel || 'The Date'}
          dateValue={data?.weddingDateFormatted || data?.weddingDate || 'Saturday, 12 December 2026'}
          dateNote={data?.eventDateNote || 'Auspicious day of celebration'}
          ceremonyLabel={data?.ceremonyLabel || 'Ceremony & Nikah'}
          ceremonyTime={data?.weddingTime || '10:00 AM – 11:30 AM'}
          ceremonyNote={data?.ceremonyNote || 'Solemnization of marriage & blessings'}
          receptionLabel={data?.receptionLabel || 'Reception & Feast'}
          receptionTime={data?.heroEventText || '12:30 PM Onwards'}
          receptionNote={data?.receptionNote || 'Followed by lunch & celebration'}
        />

        {/* ================= COUPLE PHOTO SECTION ================= */}
        <CouplePhotoSection
          photoUrl={data?.photoUrl || data?.heroImage || data?.couplePhoto || ''}
          groomName={groomName}
          brideName={brideName}
          photoTag={data?.photoTag || 'Memories'}
          photoTitle={data?.photoTitle || 'Moments of Love'}
          photoSubtitle={data?.photoSubtitle || 'Captured memories on our journey to forever'}
          showPhotoSection={data?.showPhotoSection !== false}
          theme="crimson"
          editable={editable}
          onEdit={onEdit}
        />

        {/* ================= VENUE & MAP NAVIGATION SECTION ================= */}
        <motion.section
          id="venue-section"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={fadeUp}
          className="mt-10 overflow-hidden rounded-[2rem] border border-rose-900/15 bg-white/90 p-6 sm:p-7 shadow-[0_20px_50px_rgba(74,23,31,0.05)] backdrop-blur-xl"
        >
          <motion.div
            variants={fadeUp}
            custom={0}
            className="mb-4 flex items-center justify-center gap-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-[#8A212E]">
              <MapPin size={15} />
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.25em] text-[#8A212E]">
              The Venue
            </span>
          </motion.div>

          <motion.div variants={fadeUp} custom={1}>
            <Editable
              tag="h3"
              value={venue}
              field="venue"
              onEdit={onEdit}
              editable={editable}
              className="text-center font-display text-xl sm:text-2xl font-bold tracking-tight text-[#4A171F]"
              placeholder="Venue Name"
            />
          </motion.div>

          <motion.div variants={fadeUp} custom={2}>
            <Editable
              tag="p"
              value={venueAddress}
              field="venueAddress"
              onEdit={onEdit}
              editable={editable}
              className="mt-1.5 text-center text-xs sm:text-sm font-light text-stone-600 leading-relaxed"
              placeholder="Full Address"
              multiline
            />
          </motion.div>

          {/* Interactive Get Directions Spring Button */}
          <motion.div variants={fadeUp} custom={3}>
            <motion.a
              href={canonicalMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.015, y: -1 }}
              transition={springPhysics}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#4A171F] py-3 text-xs sm:text-sm font-bold tracking-wide text-white shadow-lg shadow-[#4A171F]/20 hover:bg-[#3B0A11] active:scale-[0.98]"
            >
              <Navigation size={14} />
              <span>Get Directions on Google Maps</span>
            </motion.a>
          </motion.div>
        </motion.section>

        {/* ================= RSVP SECTION ================= */}
        <RsvpSection
          groomName={groomName}
          brideName={brideName}
          weddingDate={weddingDate}
          whatsappNumber={data.whatsappNumber || data.phone || data.whatsapp}
          venue={venue}
          editable={editable}
        />

        {/* ================= FOOTER ================= */}
        <motion.footer
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mt-14 flex flex-col items-center text-center"
        >
          {/* Monogram Badge */}
          <motion.div
            variants={fadeUp}
            whileHover={{ scale: 1.06, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            transition={springPhysics}
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#C6A66A]/40 bg-white font-display text-sm font-bold tracking-widest text-[#4A171F] shadow-md shadow-stone-900/5"
          >
            {monogram}
          </motion.div>

          <motion.p
            variants={fadeUp}
            custom={1}
            className="max-w-[260px] text-xs sm:text-sm font-light leading-relaxed text-stone-600"
          >
            We can’t wait to celebrate this beautiful beginning with you.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={2}
            className="mt-5 flex items-center gap-2 text-[#C6A66A]"
          >
            <span className="text-xs">✦</span>
            <Heart size={12} className="fill-current text-[#8A212E]" />
            <span className="text-xs">✦</span>
          </motion.div>
        </motion.footer>
      </div>
    </div>
  );
}