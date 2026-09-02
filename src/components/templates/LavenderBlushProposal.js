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
  hidden: { opacity: 0, y: 36 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.75,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const softScale = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function LavenderBlushProposal({
  data = {},
  onEdit = () => {},
  editable = false,
  className = '',
  previewMode = false,
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

  const groomName = data.groomName || 'Rizwan';
  const brideName = data.brideName || 'Ayesha';
  const weddingDate = data.weddingDate || '2026-12-25';
  const weddingTime = data.weddingTime || '10:00 AM';
  const venue = data.venue || 'Grand Palace Hall';
  const venueAddress = data.venueAddress || 'Calicut, Kerala';
  const groomParents = data.groomParents || 'Son of Mr. & Mrs. Rahman';
  const brideParents = data.brideParents || 'Daughter of Mr. & Mrs. Ibrahim';
  const heroEventText =
    data.heroEventText || 'joyfully invite you to celebrate their wedding';
  const countdownTitle =
    data.countdownTitle || 'Counting the Moments';
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
        backgroundColor: '#fdf6f0',
        fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
      }}
    >
      {/* ===================== HERO ===================== */}
      <section id="hero-section" className="relative w-full overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://i.pinimg.com/736x/7a/6e/06/7a6e06b270dc24eb85fb83113f9c6c6c.jpg"
            alt=""
            className="h-full w-full object-cover object-top"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-[#fdf6f0]" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[90vh] max-w-lg flex-col items-center justify-center px-5 pb-28 pt-14 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            className="flex w-full flex-col items-center"
          >
            {/* Decorative top */}
            <motion.div
              variants={fadeUp}
              custom={0}
              className="mb-7 flex items-center gap-2.5"
            >
              <div className="h-px w-8 bg-violet-300/70" />
              <Sparkles size={13} className="text-violet-400" />
              <div className="h-px w-8 bg-violet-300/70" />
            </motion.div>

            {/* Names */}
            <motion.div variants={fadeUp} custom={1}>
              <Editable
                tag="h1"
                value={groomName}
                field="groomName"
                onEdit={onEdit}
                editable={editable}
                className="text-[2rem] font-medium tracking-wide text-stone-800 sm:text-[2.4rem]"
                placeholder="Groom Name"
              />
            </motion.div>

            <motion.div
              variants={fadeUp}
              custom={2}
              className="my-1.5 text-lg font-light text-violet-400"
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
                className="text-[2rem] font-medium tracking-wide text-stone-800 sm:text-[2.4rem]"
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
                className="max-w-[270px] text-[13.5px] font-light leading-relaxed text-stone-600"
                placeholder="joyfully invite you to celebrate their wedding"
              />
            </motion.div>

            {/* Date & Time */}
            <motion.div
              variants={fadeUp}
              custom={5}
              className="mt-9 flex flex-col items-center gap-2.5 sm:flex-row sm:gap-4"
            >
              <div className="flex items-center gap-2 rounded-full border border-violet-200/80 bg-white/70 px-4 py-1.5 backdrop-blur-sm">
                <Calendar size={13} className="text-violet-500" />
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
              <div className="flex items-center gap-2 rounded-full border border-violet-200/80 bg-white/70 px-4 py-1.5 backdrop-blur-sm">
                <Clock size={13} className="text-violet-500" />
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
        {/* Parents */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          className="-mt-6 rounded-3xl border border-violet-100 bg-white/95 p-6 shadow-sm backdrop-blur-sm"
        >
          <motion.div
            variants={fadeUp}
            custom={0}
            className="mb-5 flex items-center justify-center gap-3"
          >
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-violet-200" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-violet-400">
              With Love & Blessings
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-violet-200" />
          </motion.div>

          <div className="space-y-5 text-center">
            <motion.div variants={fadeUp} custom={1}>
              <Editable
                tag="p"
                value={groomParents}
                field="groomParents"
                onEdit={onEdit}
                editable={editable}
                className="text-[14px] font-light leading-relaxed text-stone-700"
                placeholder="Son of Mr. & Mrs. Rahman"
                multiline
              />
            </motion.div>

            <motion.div
              variants={fadeUp}
              custom={2}
              className="mx-auto h-px w-10 bg-violet-200"
            />

            <motion.div variants={fadeUp} custom={3}>
              <Editable
                tag="p"
                value={brideParents}
                field="brideParents"
                onEdit={onEdit}
                editable={editable}
                className="text-[14px] font-light leading-relaxed text-stone-700"
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
              className="mb-7 text-[11px] font-medium uppercase tracking-[0.28em] text-violet-500"
              placeholder="Counting the Moments"
            />
          </motion.div>

          {isExpired ? (
            <motion.div
              variants={fadeUp}
              custom={1}
              className="rounded-2xl border border-purple-300/30 bg-white/85 p-6 shadow-sm"
            >
              <div className="mb-2 flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <Editable
                  tag="h3"
                  value={countdownEndedTitle}
                  field="countdownEndedTitle"
                  onEdit={onEdit}
                  editable={editable}
                  className="text-lg font-medium tracking-wide text-purple-950 sm:text-xl"
                  placeholder="Wedding in Progress!"
                />
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <Editable
                tag="p"
                value={countdownEndedSubtitle}
                field="countdownEndedSubtitle"
                onEdit={onEdit}
                editable={editable}
                className="mx-auto max-w-sm text-xs leading-relaxed text-purple-900/70 sm:text-sm"
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
                className="flex flex-col items-center rounded-2xl border border-violet-100 bg-white py-3.5 shadow-sm"
              >
                <span className="text-xl font-medium tabular-nums text-stone-800 sm:text-2xl">
                  {String(item.value).padStart(2, '0')}
                </span>
                <span className="mt-1 text-[10px] uppercase tracking-wider text-violet-400">
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
          className="mt-12 rounded-3xl border border-violet-100 bg-white p-6 shadow-sm"
        >
          <motion.div
            variants={fadeUp}
            custom={0}
            className="mb-4 flex items-center justify-center gap-2"
          >
            <MapPin size={15} className="text-violet-500" />
            <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-violet-500">
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
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-violet-500 py-2.5 text-[13px] font-medium tracking-wide text-white transition hover:bg-violet-600 active:scale-[0.98]"
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
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-violet-200 bg-white text-sm font-medium tracking-widest text-violet-700 shadow-sm"
          >
            {monogram}
          </motion.div>

          <motion.p
            variants={fadeUp}
            custom={1}
            className="max-w-[230px] text-[12.5px] font-light leading-relaxed text-stone-500"
          >
            We can’t wait to celebrate this beautiful day with you.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={2}
            className="mt-5 flex items-center gap-2.5 text-violet-300"
          >
            <div className="h-px w-7 bg-violet-200" />
            <Heart size={12} className="fill-current" />
            <div className="h-px w-7 bg-violet-200" />
          </motion.div>
        </motion.footer>
      </div>
    </div>
  );
}
