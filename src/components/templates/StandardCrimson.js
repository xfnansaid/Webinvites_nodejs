'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  ExternalLink,
  Heart,
  Navigation,
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
      className={`${className} outline-none ring-2 ring-amber-300/50 rounded px-1 transition-all cursor-text bg-white/10 hover:bg-white/15 min-w-[20px] inline-block`}
      data-placeholder={placeholder}
    >
      {value}
    </Tag>
  );
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.85,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export default function CrimsonGoldNikah({
  data = {},
  onEdit = () => {},
  editable = false,
  className = '',
  previewMode = false,
}) {
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

  // Soft floating petals
  const petals = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      left: `${(i * 8.3 + 4) % 100}%`,
      size: 5 + ((i * 2.5) % 7),
      duration: 10 + ((i * 1.4) % 7),
      delay: (i * 0.8) % 6,
    }));
  }, []);

  return (
    <div
      className={`relative min-h-screen w-full overflow-x-hidden ${className}`}
      style={{
        backgroundColor: '#F7EEDD',
        fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
      }}
    >
      {/* ===================== HERO ===================== */}
      <section id="hero-section" className="relative w-full overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://one-tawny-two.vercel.app/0001/img/crimson-scroll-bg.webp"
            alt=""
            className="h-full w-full object-cover object-center"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#1E0508]/50 via-[#140406]/70 to-[#F7EEDD]" />
        </div>

        {/* Soft floating petals */}
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          {petals.map((petal) => (
            <motion.div
              key={petal.id}
              initial={{ y: '-10%', rotate: 0, opacity: 0 }}
              animate={{
                y: '120%',
                rotate: [0, 120, 240],
                opacity: [0, 0.7, 0.7, 0],
              }}
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
                  'radial-gradient(circle at 35% 35%, #B23A44, #6E1420)',
                borderRadius: '60% 5% 60% 5%',
              }}
              className="absolute"
            />
          ))}
        </div>

        {/* Content pushed lower */}
        <div className="relative z-20 mx-auto flex min-h-[94vh] max-w-lg flex-col items-center justify-end px-5 pb-36 pt-24 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            className="flex w-full flex-col items-center"
          >
            {/* Top ornament */}
            <motion.div
              variants={fadeUp}
              custom={0}
              className="mb-6 flex items-center gap-3"
            >
              <div className="h-px w-10 bg-amber-300/50" />
              <Sparkles size={13} className="text-amber-300" />
              <div className="h-px w-10 bg-amber-300/50" />
            </motion.div>

            {/* ===== GROOM + PARENTS ===== */}
            <motion.div variants={fadeUp} custom={1}>
              <Editable
                tag="h1"
                value={groomName}
                field="groomName"
                onEdit={onEdit}
                editable={editable}
                className="text-[2.1rem] font-medium tracking-wide text-[#FBF3E4] sm:text-[2.5rem]"
                placeholder="Groom Name"
              />
            </motion.div>

            <motion.div variants={fadeUp} custom={2}>
              <Editable
                tag="p"
                value={groomParents}
                field="groomParents"
                onEdit={onEdit}
                editable={editable}
                className="mt-1.5 text-[12.5px] font-light tracking-wide text-amber-200/70"
                placeholder="Son of Mr. & Mrs. Rahman"
              />
            </motion.div>

            {/* Divider */}
            <motion.div
              variants={fadeUp}
              custom={3}
              className="my-4 flex items-center gap-3"
            >
              <div className="h-px w-8 bg-amber-300/40" />
              <span className="text-amber-300 text-lg font-light">&</span>
              <div className="h-px w-8 bg-amber-300/40" />
            </motion.div>

            {/* ===== BRIDE + PARENTS ===== */}
            <motion.div variants={fadeUp} custom={4}>
              <Editable
                tag="h1"
                value={brideName}
                field="brideName"
                onEdit={onEdit}
                editable={editable}
                className="text-[2.1rem] font-medium tracking-wide text-[#FBF3E4] sm:text-[2.5rem]"
                placeholder="Bride Name"
              />
            </motion.div>

            <motion.div variants={fadeUp} custom={5}>
              <Editable
                tag="p"
                value={brideParents}
                field="brideParents"
                onEdit={onEdit}
                editable={editable}
                className="mt-1.5 text-[12.5px] font-light tracking-wide text-amber-200/70"
                placeholder="Daughter of Mr. & Mrs. Ibrahim"
              />
            </motion.div>

            {/* Event text */}
            <motion.div variants={fadeUp} custom={6} className="mt-5">
              <Editable
                tag="p"
                value={heroEventText}
                field="heroEventText"
                onEdit={onEdit}
                editable={editable}
                className="max-w-[280px] text-[14px] font-light italic leading-relaxed tracking-wide text-amber-100/85"
                placeholder="are entering into Nikah, insha'Allah"
              />
            </motion.div>

            {/* Date & Time */}
            <motion.div
              variants={fadeUp}
              custom={7}
              className="mt-8 flex flex-col items-center gap-2.5 sm:flex-row sm:gap-4"
            >
              <div className="flex items-center gap-2 rounded-full border border-amber-300/30 bg-black/30 px-4 py-1.5 backdrop-blur-sm">
                <Calendar size={13} className="text-amber-300" />
                <Editable
                  tag="span"
                  value={formatDate(weddingDate)}
                  field="weddingDate"
                  onEdit={onEdit}
                  editable={editable}
                  className="text-[12px] font-medium tracking-wide text-amber-50"
                  placeholder="Wedding Date"
                />
              </div>
              <div className="flex items-center gap-2 rounded-full border border-amber-300/30 bg-black/30 px-4 py-1.5 backdrop-blur-sm">
                <Clock size={13} className="text-amber-300" />
                <Editable
                  tag="span"
                  value={weddingTime}
                  field="weddingTime"
                  onEdit={onEdit}
                  editable={editable}
                  className="text-[12px] font-medium tracking-wide text-amber-50"
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
          className="mt-2 text-center"
        >
          <motion.div variants={fadeUp} custom={0}>
            <Editable
              tag="h2"
              value={countdownTitle}
              field="countdownTitle"
              onEdit={onEdit}
              editable={editable}
              className="mb-7 text-[11px] font-medium uppercase tracking-[0.28em] text-stone-600"
              placeholder="Counting Down to Forever"
            />
          </motion.div>

          <div className="grid grid-cols-4 gap-2.5">
            {[
              { label: 'Days', value: timeLeft.days },
              { label: 'Hrs', value: timeLeft.hours },
              { label: 'Min', value: timeLeft.minutes },
              { label: 'Sec', value: timeLeft.seconds },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                variants={fadeUp}
                custom={i}
                className="flex flex-col items-center rounded-2xl border border-stone-200 bg-white py-3.5 shadow-sm"
              >
                <span className="text-xl font-medium tabular-nums text-stone-800 sm:text-2xl">
                  {String(item.value).padStart(2, '0')}
                </span>
                <span className="mt-1 text-[10px] uppercase tracking-wider text-stone-500">
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
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          className="mt-12 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"
        >
          <motion.div
            variants={fadeUp}
            custom={0}
            className="mb-4 flex items-center justify-center gap-2"
          >
            <MapPin size={15} className="text-stone-600" />
            <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-stone-600">
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
              className="text-center text-lg font-medium tracking-wide text-stone-800"
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
              className="mt-1.5 text-center text-[13px] font-light text-stone-500"
              placeholder="Full Address"
              multiline
            />
          </motion.div>

          <motion.div variants={fadeUp} custom={3}>
            <a
              href={canonicalMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-stone-800 py-2.5 text-[13px] font-medium tracking-wide text-white transition hover:bg-stone-700 active:scale-[0.98]"
            >
              <Navigation size={14} />
              Get Directions
            </a>
          </motion.div>
        </motion.section>

        {/* RSVP Section */}
        <RsvpSection
          groomName={groomName}
          brideName={brideName}
          whatsappNumber={data.whatsappNumber || data.phone || data.whatsapp}
        />

        {/* Footer */}
        <motion.footer
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mt-14 flex flex-col items-center text-center"
        >
          <motion.div
            variants={fadeUp}
            className="mb-4 flex items-center justify-center rounded-full border border-stone-300 bg-white text-sm font-medium tracking-widest text-stone-700 shadow-sm"
            style={{ width: '52px', height: '52px' }}
          >
            {monogram}
          </motion.div>

          <motion.p
            variants={fadeUp}
            custom={1}
            className="max-w-[240px] text-[12.5px] font-light leading-relaxed text-stone-500"
          >
            We can’t wait to celebrate this beautiful beginning with you.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={2}
            className="mt-5 flex items-center gap-2 text-stone-400"
          >
            <span className="text-sm">✦</span>
            <Heart size={12} className="fill-current" />
            <span className="text-sm">✦</span>
          </motion.div>
        </motion.footer>
      </div>
    </div>
  );
}