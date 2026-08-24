'use client';

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
      className={`${className} outline-none ring-2 ring-amber-400/40 rounded px-1 transition-all cursor-text bg-white/10 hover:bg-white/15 min-w-[20px] inline-block`}
      data-placeholder={placeholder}
    >
      {value}
    </Tag>
  );
};

// Reusable scroll animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.12,
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function BlackGoldSilhouette({
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
  const whatsappNumber = data.whatsappNumber || '919876543210';
  const groomParents = data.groomParents || 'Son of Mr. & Mrs. Rahman';
  const brideParents = data.brideParents || 'Daughter of Mr. & Mrs. Ibrahim';
  const heroEventText =
    data.heroEventText || 'request the honour of your presence';
  const countdownTitle =
    data.countdownTitle || 'The Countdown Begins';

  const canonicalMapUrl =
    data.mapsUrl ||
    data.directionsUrl ||
    data.mapUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      (venue || '') + ' ' + (venueAddress || '')
    )}`;

  const groomInitial = (groomName || 'R').trim().charAt(0).toUpperCase();
  const brideInitial = (brideName || 'A').trim().charAt(0).toUpperCase();
  const monogram = `${groomInitial}  &  ${brideInitial}`;

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

  useEffect(() => {
    const updateCountdown = () => {
      const diff = weddingTarget.getTime() - new Date().getTime();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
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
      className={`relative min-h-screen w-full overflow-x-hidden bg-black text-amber-50 ${className}`}
      style={{
        fontFamily: "'Cinzel', 'Playfair Display', 'Times New Roman', serif",
      }}
    >
      {/* ===================== HERO ===================== */}
      <section id="hero-section" className="relative w-full overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://i.pinimg.com/736x/a7/33/41/a7334147da51bbc26c3e278c65d54c08.jpg"
            alt=""
            className="h-full w-full object-cover object-center"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-lg flex-col items-center justify-center px-5 pb-28 pt-16 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            className="flex w-full flex-col items-center"
          >
            {/* Top ornament */}
            <motion.div
              variants={fadeUp}
              custom={0}
              className="mb-8 flex items-center gap-3"
            >
              <div className="h-px w-10 bg-gradient-to-r from-transparent to-amber-500/70" />
              <Sparkles size={14} className="text-amber-400" />
              <div className="h-px w-10 bg-gradient-to-l from-transparent to-amber-500/70" />
            </motion.div>

            {/* Names */}
            <motion.div variants={fadeUp} custom={1} className="mb-2">
              <Editable
                tag="h1"
                value={groomName}
                field="groomName"
                onEdit={onEdit}
                editable={editable}
                className="text-3xl font-normal tracking-[0.15em] text-amber-100 sm:text-4xl"
                placeholder="Groom Name"
              />
            </motion.div>

            <motion.div
              variants={fadeUp}
              custom={2}
              className="my-1 text-lg tracking-[0.3em] text-amber-500/90"
            >
              &
            </motion.div>

            <motion.div variants={fadeUp} custom={3}>
              <Editable
                tag="h1"
                value={brideName}
                field="brideName"
                onEdit={onEdit}
                editable={editable}
                className="text-3xl font-normal tracking-[0.15em] text-amber-100 sm:text-4xl"
                placeholder="Bride Name"
              />
            </motion.div>

            {/* Event text */}
            <motion.div variants={fadeUp} custom={4} className="mt-6">
              <Editable
                tag="p"
                value={heroEventText}
                field="heroEventText"
                onEdit={onEdit}
                editable={editable}
                className="max-w-[280px] text-[13px] font-light tracking-wide text-amber-200/80"
                placeholder="request the honour of your presence"
              />
            </motion.div>

            {/* Date & Time */}
            <motion.div
              variants={fadeUp}
              custom={5}
              className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-5"
            >
              <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-black/50 px-4 py-1.5 backdrop-blur-sm">
                <Calendar size={13} className="text-amber-400" />
                <Editable
                  tag="span"
                  value={formatDate(weddingDate)}
                  field="weddingDate"
                  onEdit={onEdit}
                  editable={editable}
                  className="text-[12px] tracking-wide text-amber-100"
                  placeholder="Wedding Date"
                />
              </div>
              <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-black/50 px-4 py-1.5 backdrop-blur-sm">
                <Clock size={13} className="text-amber-400" />
                <Editable
                  tag="span"
                  value={weddingTime}
                  field="weddingTime"
                  onEdit={onEdit}
                  editable={editable}
                  className="text-[12px] tracking-wide text-amber-100"
                  placeholder="Time"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ===================== CONTENT ===================== */}
      <div className="relative z-10 mx-auto max-w-lg px-5 pb-24">
        {/* Parents */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={fadeUp}
          className="rounded-2xl border border-amber-500/20 bg-gradient-to-b from-zinc-900/80 to-black p-6"
        >
          <motion.div
            variants={fadeUp}
            custom={0}
            className="mb-6 flex items-center justify-center gap-3"
          >
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-600/40" />
            <span className="text-[10px] uppercase tracking-[0.35em] text-amber-500/80">
              With Blessings
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-600/40" />
          </motion.div>

          <div className="space-y-5 text-center">
            <motion.div variants={fadeUp} custom={1}>
              <Editable
                tag="p"
                value={groomParents}
                field="groomParents"
                onEdit={onEdit}
                editable={editable}
                className="text-[14px] font-light leading-relaxed tracking-wide text-amber-100/90"
                placeholder="Son of Mr. & Mrs. Rahman"
                multiline
              />
            </motion.div>

            <motion.div
              variants={fadeUp}
              custom={2}
              className="mx-auto h-px w-12 bg-amber-600/40"
            />

            <motion.div variants={fadeUp} custom={3}>
              <Editable
                tag="p"
                value={brideParents}
                field="brideParents"
                onEdit={onEdit}
                editable={editable}
                className="text-[14px] font-light leading-relaxed tracking-wide text-amber-100/90"
                placeholder="Daughter of Mr. & Mrs. Ibrahim"
                multiline
              />
            </motion.div>
          </div>
        </motion.section>

        {/* Countdown */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="mt-14 text-center"
        >
          <motion.div variants={fadeUp} custom={0}>
            <Editable
              tag="h2"
              value={countdownTitle}
              field="countdownTitle"
              onEdit={onEdit}
              editable={editable}
              className="mb-8 text-[11px] font-medium uppercase tracking-[0.4em] text-amber-500/90"
              placeholder="The Countdown Begins"
            />
          </motion.div>

          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Days', value: timeLeft.days },
              { label: 'Hours', value: timeLeft.hours },
              { label: 'Mins', value: timeLeft.minutes },
              { label: 'Secs', value: timeLeft.seconds },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                variants={scaleIn}
                custom={i}
                className="flex flex-col items-center rounded-xl border border-amber-500/25 bg-zinc-900/60 py-4"
              >
                <span className="text-2xl font-medium tabular-nums tracking-tight text-amber-100">
                  {String(item.value).padStart(2, '0')}
                </span>
                <span className="mt-1.5 text-[10px] uppercase tracking-[0.2em] text-amber-500/70">
                  {item.label}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Venue */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={fadeUp}
          className="mt-14 rounded-2xl border border-amber-500/20 bg-gradient-to-b from-zinc-900/80 to-black p-6"
        >
          <motion.div
            variants={fadeUp}
            custom={0}
            className="mb-5 flex items-center justify-center gap-2"
          >
            <MapPin size={15} className="text-amber-400" />
            <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-amber-500/80">
              Venue
            </span>
          </motion.div>

          <motion.div variants={fadeUp} custom={1}>
            <Editable
              tag="h3"
              value={venue}
              field="venue"
              onEdit={onEdit}
              editable={editable}
              className="text-center text-xl font-normal tracking-wide text-amber-50"
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
              className="mt-2 text-center text-[13px] font-light tracking-wide text-amber-200/70"
              placeholder="Full Address"
              multiline
            />
          </motion.div>

          <motion.div variants={fadeUp} custom={3}>
            <a
              href={canonicalMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-amber-500/50 bg-amber-500/10 py-2.5 text-[13px] font-medium tracking-wider text-amber-200 transition hover:bg-amber-500/20 active:scale-[0.98]"
            >
              <ExternalLink size={14} />
              Get Directions
            </a>
          </motion.div>
        </motion.section>

        
        {/* RSVP Section */}
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
          variants={fadeUp}
          className="mt-16 flex flex-col items-center text-center"
        >
          <motion.div
            variants={scaleIn}
            className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-amber-500/40 bg-zinc-900 text-sm tracking-[0.2em] text-amber-200"
          >
            {monogram}
          </motion.div>

          <motion.p
            variants={fadeUp}
            custom={1}
            className="max-w-[240px] text-[12px] font-light leading-relaxed tracking-wide text-amber-200/60"
          >
            We look forward to sharing this beautiful moment with you.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={2}
            className="mt-6 flex items-center gap-3 text-amber-600/50"
          >
            <div className="h-px w-8 bg-amber-600/40" />
            <Heart size={12} className="fill-current" />
            <div className="h-px w-8 bg-amber-600/40" />
          </motion.div>
        </motion.footer>
      </div>
    </div>
  );
}