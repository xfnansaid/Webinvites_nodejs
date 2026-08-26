'use client';

import CelebrationsSection from './CelebrationsSection';

import CouplePhotoSection from './CouplePhotoSection';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  ExternalLink,
  Heart,
} from 'lucide-react';
import RsvpSection from './RsvpSection';

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
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (e) {}
    }
  }, [isEditing]);

  if (!editable) {
    return <Tag className={className}>{value || placeholder}</Tag>;
  }

  return (
    <Tag
      ref={elementRef}
      contentEditable
      suppressContentEditableWarning
      onFocus={() => setIsEditing(true)}
      onBlur={(e) => {
        setIsEditing(false);
        const newValue = e.currentTarget.textContent || '';
        if (onEdit && newValue !== value) {
          onEdit(field, newValue);
        }
      }}
      onKeyDown={(e) => {
        if (!multiline && e.key === 'Enter') {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      className={`${className} outline-none ring-2 ring-emerald-300/50 rounded px-1 transition-all cursor-text bg-white/40 hover:bg-white/50 min-w-[20px] inline-block`}
      data-placeholder={placeholder}
    >
      {value}
    </Tag>
  );
};

// New animation style for this version
const softSlide = {
  hidden: { opacity: 0, y: 45, x: -8 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    x: 0,
    transition: {
      delay: i * 0.11,
      duration: 0.85,
      ease: [0.25, 0.1, 0.25, 1],
    },
  }),
};

const gentleZoom = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.7, ease: [0.34, 1.3, 0.64, 1] },
  },
};

export default function SageGoldHarmony({
  data = {},
  onEdit = () => {},
  editable = false,
  className = '',
  previewMode = false,
}) {
  const groomName = data.groomName || 'Rizwan';
  const brideName = data.brideName || 'Ayesha';
  const weddingDate = data.weddingDate || '2026-12-25';
  const weddingTime = data.weddingTime || '10:00 AM';
  const venue = data.venue || 'Grand Palace Hall';
  const venueAddress = data.venueAddress || 'Calicut, Kerala';
  const groomParents = data.groomParents || 'Son of Mr. & Mrs. Rahman';
  const brideParents = data.brideParents || 'Daughter of Mr. & Mrs. Ibrahim';
  const heroEventText =
    data.heroEventText || 'with the blessings of their families invite you';
  const countdownTitle =
    data.countdownTitle || 'A Lifetime of Love Begins';
  const countdownEndedTitle =
    data.countdownEndedTitle || 'Wedding in Progress!';
  const countdownEndedSubtitle =
    data.countdownEndedSubtitle ||
    'Thank you for celebrating this joyful occasion with us.';

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

  return (
    <div
      className={`relative min-h-screen w-full overflow-x-hidden ${className}`}
      style={{
        backgroundColor: '#f8f6f1',
        fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
      }}
    >
      {/* ===================== HERO ===================== */}
      <section id="hero-section" className="relative w-full overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://i.pinimg.com/736x/8a/fa/e2/8afae2680457d0877f464dab7b4f3240.jpg"
            alt=""
            className="h-full w-full object-cover object-top"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-[#f8f6f1]" />
        </div>

        {/* Content pushed lower */}
        <div className="relative z-10 mx-auto flex min-h-[94vh] max-w-lg flex-col items-center justify-end px-5 pb-40 pt-28 text-center sm:pb-44">
          <motion.div
            initial="hidden"
            animate="visible"
            className="flex w-full flex-col items-center"
          >
            {/* Decorative top */}
            <motion.div
              variants={softSlide}
              custom={0}
              className="mb-5 flex items-center gap-2"
            >
              <div className="h-px w-8 bg-emerald-300/70" />
              <span className="text-emerald-500 text-base">❀</span>
              <div className="h-px w-8 bg-emerald-300/70" />
            </motion.div>

            {/* ===== GROOM + PARENTS ===== */}
            <motion.div variants={softSlide} custom={1}>
              <Editable
                tag="h1"
                value={groomName}
                field="groomName"
                onEdit={onEdit}
                editable={editable}
                className="text-[2.1rem] font-medium tracking-wide text-stone-800 sm:text-[2.45rem]"
                placeholder="Groom Name"
              />
            </motion.div>

            <motion.div variants={softSlide} custom={2}>
              <Editable
                tag="p"
                value={groomParents}
                field="groomParents"
                onEdit={onEdit}
                editable={editable}
                className="mt-1.5 text-[12.5px] font-light tracking-wide text-stone-500"
                placeholder="Son of Mr. & Mrs. Rahman"
              />
            </motion.div>

            {/* Divider */}
            <motion.div
              variants={softSlide}
              custom={3}
              className="my-4 flex items-center gap-2 text-emerald-500"
            >

              <span className="text-lg font-light text-stone-400">&</span>

            </motion.div>

            {/* ===== BRIDE + PARENTS ===== */}
            <motion.div variants={softSlide} custom={4}>
              <Editable
                tag="h1"
                value={brideName}
                field="brideName"
                onEdit={onEdit}
                editable={editable}
                className="text-[2.1rem] font-medium tracking-wide text-stone-800 sm:text-[2.45rem]"
                placeholder="Bride Name"
              />
            </motion.div>

            <motion.div variants={softSlide} custom={5}>
              <Editable
                tag="p"
                value={brideParents}
                field="brideParents"
                onEdit={onEdit}
                editable={editable}
                className="mt-1.5 text-[12.5px] font-light tracking-wide text-stone-500"
                placeholder="Daughter of Mr. & Mrs. Ibrahim"
              />
            </motion.div>

            {/* Event text */}
            <motion.div variants={softSlide} custom={6} className="mt-5">
              <Editable
                tag="p"
                value={heroEventText}
                field="heroEventText"
                onEdit={onEdit}
                editable={editable}
                className="max-w-[270px] text-[13.5px] font-light leading-relaxed text-stone-600"
                placeholder="with the blessings of their families invite you"
              />
            </motion.div>

            {/* Date & Time */}
            <motion.div
              variants={softSlide}
              custom={7}
              className="mt-7 flex flex-col items-center gap-2.5 sm:flex-row sm:gap-4"
            >
              <div className="flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/75 px-4 py-1.5 backdrop-blur-sm">
                <Calendar size={13} className="text-emerald-600" />
                <Editable
                  tag="span"
                  value={formatDate(weddingDate)}
                  field="weddingDate"
                  onEdit={onEdit}
                  editable={editable}
                  className="text-[12px] font-medium text-stone-700"
                  placeholder="Wedding Date"
                />
              </div>
              <div className="flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/75 px-4 py-1.5 backdrop-blur-sm">
                <Clock size={13} className="text-emerald-600" />
                <Editable
                  tag="span"
                  value={weddingTime}
                  field="weddingTime"
                  onEdit={onEdit}
                  editable={editable}
                  className="text-[12px] font-medium text-stone-700"
                  placeholder="Time"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ===================== CONTENT ===================== */}
      <div className="relative z-10 mx-auto max-w-lg px-5 pb-20">
        {/* Countdown */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="mt-4 text-center"
        >
          <motion.div variants={softSlide} custom={0}>
            <Editable
              tag="h2"
              value={countdownTitle}
              field="countdownTitle"
              onEdit={onEdit}
              editable={editable}
              className="mb-7 text-[11px] font-medium uppercase tracking-[0.28em] text-emerald-700"
              placeholder="A Lifetime of Love Begins"
            />
          </motion.div>

          {isExpired ? (
            <motion.div
              variants={softSlide}
              custom={1}
              className="rounded-2xl border border-emerald-900/20 bg-emerald-50/70 p-6 shadow-sm"
            >
              <div className="mb-2 flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-700" />
                <Editable
                  tag="h3"
                  value={countdownEndedTitle}
                  field="countdownEndedTitle"
                  onEdit={onEdit}
                  editable={editable}
                  className="text-lg font-medium tracking-wide text-emerald-950 sm:text-xl"
                  placeholder="Wedding in Progress!"
                />
                <Sparkles className="h-5 w-5 text-emerald-700" />
              </div>
              <Editable
                tag="p"
                value={countdownEndedSubtitle}
                field="countdownEndedSubtitle"
                onEdit={onEdit}
                editable={editable}
                className="mx-auto max-w-sm text-xs leading-relaxed text-emerald-900/70 sm:text-sm"
                placeholder="Thank you for celebrating this joyful occasion with us."
                multiline
              />
            </motion.div>
          ) : (
            <div className="grid grid-cols-4 gap-2.5">
            {[
              { label: 'Days', value: timeLeft.days },
              { label: 'Hrs', value: timeLeft.hours },
              { label: 'Min', value: timeLeft.minutes },
              { label: 'Sec', value: timeLeft.seconds },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                variants={gentleZoom}
                custom={i}
                className="flex flex-col items-center rounded-2xl border border-emerald-100 bg-white py-3.5 shadow-sm"
              >
                <span className="text-xl font-medium tabular-nums text-stone-800 sm:text-2xl">
                  {String(item.value).padStart(2, '0')}
                </span>
                <span className="mt-1 text-[10px] uppercase tracking-wider text-emerald-600">
                  {item.label}
                </span>
              </motion.div>
            ))}
          </div>
          )}
        </motion.section>

        {/* Venue */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={softSlide}
          className="mt-12 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm"
        >
          <motion.div
            variants={softSlide}
            custom={0}
            className="mb-4 flex items-center justify-center gap-2"
          >
            <MapPin size={15} className="text-emerald-600" />
            <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-emerald-700">
              Venue
            </span>
          </motion.div>

          <motion.div variants={softSlide} custom={1}>
            <Editable
              tag="h3"
              value={venue}
              field="venue"
              onEdit={onEdit}
              editable={editable}
              className="text-center text-lg font-medium tracking-wide text-stone-800"
              placeholder="Venue Name"
            />
          </motion.div>

          <motion.div variants={softSlide} custom={2}>
            <Editable
              tag="p"
              value={venueAddress}
              field="venueAddress"
              onEdit={onEdit}
              editable={editable}
              className="mt-1.5 text-center text-[13px] font-light text-stone-500"
              placeholder="Full Address"
              multiline
            />
          </motion.div>

          <motion.div variants={softSlide} custom={3}>
            <a
              href={canonicalMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-700 py-2.5 text-[13px] font-medium tracking-wide text-white transition hover:bg-emerald-800 active:scale-[0.98]"
            >
              <ExternalLink size={14} />
              Get Directions
            </a>
          </motion.div>
        </motion.section>

        
        {/* RSVP Section */}
        
        {/* Couple Photo Section */}
        
        {/* Celebrations & Program Details Section */}
        <CelebrationsSection
          showEvents={data?.showEvents !== false}
          theme="emerald"
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
          receptionTime={data?.heroEventText || data?.receptionTime || '12:30 PM Onwards'}
          receptionNote={data?.receptionNote || 'Followed by lunch & celebration'}
        />

        <CouplePhotoSection
          photoUrl={data?.photoUrl || data?.heroImage || data?.couplePhoto || ''}
          groomName={groomName}
          brideName={brideName}
          photoTag={data?.photoTag || 'Memories'}
          photoTitle={data?.photoTitle || 'Moments of Love'}
          photoSubtitle={data?.photoSubtitle || 'Captured memories on our journey to forever'}
          showPhotoSection={data?.showPhotoSection !== false}
          theme="emerald"
          editable={editable}
          onEdit={onEdit}
        />

        <RsvpSection
          groomName={groomName}
          brideName={brideName}
          whatsappNumber={data.whatsappNumber || data.phone || data.whatsapp || ''}
        />

        {/* Footer */}
        <motion.footer
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={softSlide}
          className="mt-14 flex flex-col items-center text-center"
        >
          <motion.div
            variants={gentleZoom}
            className="mb-4 flex items-center justify-center rounded-full border border-emerald-200 bg-white text-sm font-medium tracking-widest text-emerald-800 shadow-sm"
            style={{ width: '52px', height: '52px' }}
          >
            {monogram}
          </motion.div>

          <motion.p
            variants={softSlide}
            custom={1}
            className="max-w-[240px] text-[12.5px] font-light leading-relaxed text-stone-500"
          >
            We look forward to celebrating this beautiful journey with you.
          </motion.p>


        </motion.footer>
      </div>
    </div>
  );
}
