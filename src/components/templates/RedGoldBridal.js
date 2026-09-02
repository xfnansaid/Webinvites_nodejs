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
import SharedEditable from './_Editable';

// Distinct animation style
const festiveRise = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.12,
      duration: 0.85,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const warmPop = {
  hidden: { opacity: 0, scale: 0.82 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.7, ease: [0.34, 1.45, 0.64, 1] },
  },
};

export default function RedGoldBridalCarry({
  data = {},
  onEdit = () => {},
  editable = false,
  className = '',
  previewMode = false,
  onStyleChange,
  templateData,
}) {
  // Inject per-field style props into every <Editable /> JSX site below.
  // Avoids touching every individual <Editable ... /> call. Safe: if props
  // are undefined (live /i/[slug] page), SharedEditable falls back to BasicEditable.
  const Editable = React.useMemo(() => {
    return function ScopedEditable(props) {
      return React.createElement(SharedEditable, {
        ...props,
        onStyleChange: props.onStyleChange === undefined ? onStyleChange : props.onStyleChange,
        templateData: props.templateData === undefined ? templateData : props.templateData,
      });
    };
  }, [onStyleChange, templateData]);
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
    data.countdownTitle || 'The Auspicious Day';
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
        containerType: 'inline-size',
        width: '100%',
        maxWidth: '100%',
        backgroundColor: '#fdf8f0',
        fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
      }}
    >
      {/* ===================== HERO ===================== */}
      <section id="hero-section" className="relative w-full overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://i.pinimg.com/736x/fa/9c/ac/fa9cac1813abf59df06e52698420ecea.jpg"
            alt=""
            className="h-full w-full object-cover object-top"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-[#fdf8f0]" />
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
              variants={festiveRise}
              custom={0}
              className="mb-5 flex items-center gap-2"
            >
              <div className="h-px w-8 bg-red-300/70" />
              <span className="text-red-600 text-base">❀</span>
              <div className="h-px w-8 bg-red-300/70" />
            </motion.div>

            {/* ===== GROOM + PARENTS ===== */}
            <motion.div variants={festiveRise} custom={1}>
              <Editable
                tag="h1"
                value={groomName}
                field="groomName"
                onEdit={onEdit}
                editable={editable}
                className="text-[clamp(1.85rem,9.5cqw,2.5rem)] font-medium tracking-wide text-stone-800 break-words leading-[1.1]"
                placeholder="Groom Name"
              />
            </motion.div>

            <motion.div variants={festiveRise} custom={2}>
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
              variants={festiveRise}
              custom={3}
              className="my-4 flex items-center gap-2 text-red-500"
            >
              <span className="text-sm">✦</span>
              <span className="text-lg font-light text-stone-400">&</span>
              <span className="text-sm">✦</span>
            </motion.div>

            {/* ===== BRIDE + PARENTS ===== */}
            <motion.div variants={festiveRise} custom={4}>
              <Editable
                tag="h1"
                value={brideName}
                field="brideName"
                onEdit={onEdit}
                editable={editable}
                className="text-[clamp(1.85rem,9.5cqw,2.5rem)] font-medium tracking-wide text-stone-800 break-words leading-[1.1]"
                placeholder="Bride Name"
              />
            </motion.div>

            <motion.div variants={festiveRise} custom={5}>
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
            <motion.div variants={festiveRise} custom={6} className="mt-5">
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
              variants={festiveRise}
              custom={7}
              className="mt-7 flex flex-col items-center gap-2.5 sm:flex-row sm:gap-4"
            >
              <div className="flex items-center gap-2 rounded-full border border-red-200/80 bg-white/75 px-4 py-1.5 backdrop-blur-sm">
                <Calendar size={13} className="text-red-600" />
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
              <div className="flex items-center gap-2 rounded-full border border-red-200/80 bg-white/75 px-4 py-1.5 backdrop-blur-sm">
                <Clock size={13} className="text-red-600" />
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
          <motion.div variants={festiveRise} custom={0}>
            <Editable
              tag="h2"
              value={countdownTitle}
              field="countdownTitle"
              onEdit={onEdit}
              editable={editable}
              className="mb-7 text-[11px] font-medium uppercase tracking-[0.28em] text-red-700"
              placeholder="The Auspicious Day"
            />
          </motion.div>

          {isExpired ? (
            <motion.div
              variants={festiveRise}
              custom={1}
              className="rounded-2xl border border-red-800/20 bg-red-50/80 p-6 shadow-sm"
            >
              <div className="mb-2 flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-red-700" />
                <Editable
                  tag="h3"
                  value={countdownEndedTitle}
                  field="countdownEndedTitle"
                  onEdit={onEdit}
                  editable={editable}
                  className="text-lg font-medium tracking-wide text-red-950 sm:text-xl"
                  placeholder="Wedding in Progress!"
                />
                <Sparkles className="h-5 w-5 text-red-700" />
              </div>
              <Editable
                tag="p"
                value={countdownEndedSubtitle}
                field="countdownEndedSubtitle"
                onEdit={onEdit}
                editable={editable}
                className="mx-auto max-w-sm text-xs leading-relaxed text-red-900/70 sm:text-sm"
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
                variants={warmPop}
                custom={i}
                className="flex flex-col items-center rounded-2xl border border-red-100 bg-white py-3.5 shadow-sm"
              >
                <span className="text-xl font-medium tabular-nums text-stone-800 sm:text-2xl">
                  {String(item.value).padStart(2, '0')}
                </span>
                <span className="mt-1 text-[10px] uppercase tracking-wider text-red-600">
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
          variants={festiveRise}
          className="mt-12 rounded-3xl border border-red-100 bg-white p-6 shadow-sm"
        >
          <motion.div
            variants={festiveRise}
            custom={0}
            className="mb-4 flex items-center justify-center gap-2"
          >
            <MapPin size={15} className="text-red-600" />
            <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-red-700">
              Venue
            </span>
          </motion.div>

          <motion.div variants={festiveRise} custom={1}>
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

          <motion.div variants={festiveRise} custom={2}>
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

          <motion.div variants={festiveRise} custom={3}>
            <a
              href={canonicalMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-red-700 py-2.5 text-[13px] font-medium tracking-wide text-white transition hover:bg-red-800 active:scale-[0.98]"
            >
              <ExternalLink size={14} />
              Get Directions
            </a>
          </motion.div>
        </motion.section>

        {/* Celebrations & Program Details Section */}
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
          ceremonyLabel={data?.ceremonyLabel || 'Ceremony & Muhurtham'}
          ceremonyTime={data?.weddingTime || data?.muhurthamTime || '10:00 AM – 11:30 AM'}
          ceremonyNote={data?.ceremonyNote || 'Solemnization of marriage & blessings'}
          receptionLabel={data?.receptionLabel || 'Reception & Feast'}
          receptionTime={data?.receptionTime || '12:30 PM Onwards'}
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
          theme="crimson"
          editable={editable}
          onEdit={onEdit}
        />

        <RsvpSection
          groomName={groomName}
          brideName={brideName}
          whatsappNumber={data.whatsappNumber || data.phone || data.whatsapp || ''}
          theme="crimson"
        />

        {/* Footer */}
        <motion.footer
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={festiveRise}
          className="mt-14 flex flex-col items-center text-center"
        >
          <motion.div
            variants={warmPop}
            className="mb-4 flex items-center justify-center rounded-full border border-red-200 bg-white text-sm font-medium tracking-widest text-red-800 shadow-sm"
            style={{ width: '52px', height: '52px' }}
          >
            {monogram}
          </motion.div>

          <motion.p
            variants={festiveRise}
            custom={1}
            className="max-w-[240px] text-[12.5px] font-light leading-relaxed text-stone-500"
          >
            We look forward to celebrating this sacred and joyous occasion with you.
          </motion.p>
        </motion.footer>
      </div>
    </div>
  );
}
