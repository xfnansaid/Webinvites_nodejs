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

const fadeUp = {
  hidden: { opacity: 0, y: 34 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.78,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const softScale = {
  hidden: { opacity: 0, scale: 0.91 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.82, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function MaroonPeonyRomance({
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
    data.heroEventText || 'together with their families joyfully invite you';
  const countdownTitle =
    data.countdownTitle || 'A Beautiful Beginning';
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
        backgroundColor: '#f9f4ee',
        fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
      }}
    >
      {/* ===================== HERO ===================== */}
      <section id="hero-section" className="relative w-full overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://i.pinimg.com/736x/ae/07/6f/ae076f97dede906b6075a21619838ec0.jpg"
            alt=""
            className="h-full w-full object-cover object-top"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-[#f9f4ee]" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[90vh] max-w-lg flex-col items-center justify-center px-5 pb-28 pt-14 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            className="flex w-full flex-col items-center"
          >
            {/* Top ornament */}
            <motion.div
              variants={fadeUp}
              custom={0}
              className="mb-7 flex items-center gap-2.5"
            >
              <div className="h-px w-9 bg-rose-800/35" />
              <Sparkles size={13} className="text-rose-800/70" />
              <div className="h-px w-9 bg-rose-800/35" />
            </motion.div>

            {/* Names */}
            <motion.div variants={fadeUp} custom={1}>
              <Editable
                tag="h1"
                value={groomName}
                field="groomName"
                onEdit={onEdit}
                editable={editable}
                className="text-[2.15rem] font-medium tracking-wide text-rose-950 sm:text-[2.5rem]"
                placeholder="Groom Name"
              />
            </motion.div>

            <motion.div
              variants={fadeUp}
              custom={2}
              className="my-1.5 text-xl font-light text-rose-800/75"
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
                className="text-[2.15rem] font-medium tracking-wide text-rose-950 sm:text-[2.5rem]"
                placeholder="Bride Name"
              />
            </motion.div>

            {/* Event text */}
            <motion.div variants={fadeUp} custom={4} className="mt-5">
              <Editable
                tag="p"
                value={heroEventText}
                field="heroEventText"
                onEdit={onEdit}
                editable={editable}
                className="max-w-[270px] text-[13.5px] font-light leading-relaxed text-rose-900/80"
                placeholder="together with their families joyfully invite you"
              />
            </motion.div>

            {/* Date & Time */}
            <motion.div
              variants={fadeUp}
              custom={5}
              className="mt-9 flex flex-col items-center gap-2.5 sm:flex-row sm:gap-4"
            >
              <div className="flex items-center gap-2 rounded-full border border-rose-800/20 bg-white/75 px-4 py-1.5 backdrop-blur-sm">
                <Calendar size={13} className="text-rose-800" />
                <Editable
                  tag="span"
                  value={formatDate(weddingDate)}
                  field="weddingDate"
                  onEdit={onEdit}
                  editable={editable}
                  className="text-[12px] font-medium text-rose-950"
                  placeholder="Wedding Date"
                />
              </div>
              <div className="flex items-center gap-2 rounded-full border border-rose-800/20 bg-white/75 px-4 py-1.5 backdrop-blur-sm">
                <Clock size={13} className="text-rose-800" />
                <Editable
                  tag="span"
                  value={weddingTime}
                  field="weddingTime"
                  onEdit={onEdit}
                  editable={editable}
                  className="text-[12px] font-medium text-rose-950"
                  placeholder="Time"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ===================== CONTENT ===================== */}
      <div className="relative z-10 mx-auto max-w-lg px-5 pb-20">
        {/* Parents */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          className="-mt-5 rounded-3xl border border-rose-900/12 bg-white/95 p-6 shadow-sm"
        >
          <motion.div
            variants={fadeUp}
            custom={0}
            className="mb-5 flex items-center justify-center gap-3"
          >
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-rose-800/25" />
            <span className="text-[10px] uppercase tracking-[0.28em] text-rose-800/70">
              With Love & Blessings
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-rose-800/25" />
          </motion.div>

          <div className="space-y-5 text-center">
            <motion.div variants={fadeUp} custom={1}>
              <Editable
                tag="p"
                value={groomParents}
                field="groomParents"
                onEdit={onEdit}
                editable={editable}
                className="text-[14px] font-light leading-relaxed text-rose-950"
                placeholder="Son of Mr. & Mrs. Rahman"
                multiline
              />
            </motion.div>

            <motion.div
              variants={fadeUp}
              custom={2}
              className="mx-auto h-px w-11 bg-rose-800/20"
            />

            <motion.div variants={fadeUp} custom={3}>
              <Editable
                tag="p"
                value={brideParents}
                field="brideParents"
                onEdit={onEdit}
                editable={editable}
                className="text-[14px] font-light leading-relaxed text-rose-950"
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
          viewport={{ once: true, margin: '-50px' }}
          className="mt-12 text-center"
        >
          <motion.div variants={fadeUp} custom={0}>
            <Editable
              tag="h2"
              value={countdownTitle}
              field="countdownTitle"
              onEdit={onEdit}
              editable={editable}
              className="mb-7 text-[11px] font-medium uppercase tracking-[0.3em] text-rose-800/80"
              placeholder="A Beautiful Beginning"
            />
          </motion.div>

          {isExpired ? (
            <motion.div
              variants={fadeUp}
              custom={1}
              className="rounded-2xl border border-rose-300/30 bg-white/90 p-6 shadow-sm"
            >
              <div className="mb-2 flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-rose-600" />
                <Editable
                  tag="h3"
                  value={countdownEndedTitle}
                  field="countdownEndedTitle"
                  onEdit={onEdit}
                  editable={editable}
                  className="text-lg font-medium tracking-wide text-rose-950 sm:text-xl"
                  placeholder="Wedding in Progress!"
                />
                <Sparkles className="h-5 w-5 text-rose-600" />
              </div>
              <Editable
                tag="p"
                value={countdownEndedSubtitle}
                field="countdownEndedSubtitle"
                onEdit={onEdit}
                editable={editable}
                className="mx-auto max-w-sm text-xs leading-relaxed text-rose-900/70 sm:text-sm"
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
                variants={softScale}
                custom={i}
                className="flex flex-col items-center rounded-2xl border border-rose-900/12 bg-white py-3.5 shadow-sm"
              >
                <span className="text-xl font-medium tabular-nums text-rose-950 sm:text-2xl">
                  {String(item.value).padStart(2, '0')}
                </span>
                <span className="mt-1 text-[10px] uppercase tracking-wider text-rose-800/60">
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
          variants={fadeUp}
          className="mt-12 rounded-3xl border border-rose-900/12 bg-white p-6 shadow-sm"
        >
          <motion.div
            variants={fadeUp}
            custom={0}
            className="mb-4 flex items-center justify-center gap-2"
          >
            <MapPin size={15} className="text-rose-800" />
            <span className="text-[10px] font-medium uppercase tracking-[0.26em] text-rose-800/80">
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
              className="text-center text-lg font-medium tracking-wide text-rose-950"
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
              className="mt-1.5 text-center text-[13px] font-light text-rose-900/70"
              placeholder="Full Address"
              multiline
            />
          </motion.div>

          <motion.div variants={fadeUp} custom={3}>
            <a
              href={canonicalMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-rose-900 py-2.5 text-[13px] font-medium tracking-wide text-white transition hover:bg-rose-800 active:scale-[0.98]"
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
          theme="rose"
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
          theme="rose"
          editable={editable}
          onEdit={onEdit}
        />

        <RsvpSection
          groomName={groomName}
          brideName={brideName}
          whatsappNumber={data.whatsappNumber || data.phone || data.whatsapp || ''}
          theme="rose"
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
            variants={softScale}
            className="mb-4 flex items-center justify-center rounded-full border border-rose-800/25 bg-white text-sm font-medium tracking-widest text-rose-900 shadow-sm"
            style={{ width: '52px', height: '52px' }}
          >
            {monogram}
          </motion.div>

          <motion.p
            variants={fadeUp}
            custom={1}
            className="max-w-[240px] text-[12.5px] font-light leading-relaxed text-rose-900/70"
          >
            We look forward to sharing this special day with you.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={2}
            className="mt-5 flex items-center gap-2.5 text-rose-800/40"
          >
            <div className="h-px w-7 bg-rose-800/25" />
            <Heart size={12} className="fill-current" />
            <div className="h-px w-7 bg-rose-800/25" />
          </motion.div>
        </motion.footer>
      </div>
    </div>
  );
}
