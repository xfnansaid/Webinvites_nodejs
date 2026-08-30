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
  Send,
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
      className={`${className} outline-none ring-2 ring-rose-400/50 rounded px-1 transition-all cursor-text bg-white/30 hover:bg-white/40 min-w-[20px] inline-block`}
      data-placeholder={placeholder}
    >
      {value}
    </Tag>
  );
};

export default function RomanticBlushIslamic({
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
  const heroTagline = data.heroTagline || 'Together with their families';
  const heroEventText =
    data.heroEventText || 'invite you to celebrate their wedding';
  const countdownTitle =
    data.countdownTitle || 'Counting Down To The Big Day';
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

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Hi! Responding to the wedding invitation of ${groomName} & ${brideName}. Looking forward to celebrating with you!`
  )}`;

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
      className={`relative min-h-screen w-full overflow-x-hidden font-serif ${className}`}
      style={{
        containerType: 'inline-size',
        width: '100%',
        maxWidth: '100%',
        backgroundColor: '#f9f1e9',
      }}
    >
      {/* ===================== HERO SECTION ===================== */}
      <section id="hero-section" className="relative w-full overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://i.pinimg.com/736x/fc/de/91/fcde911ed948280ff339ff1701382479.jpg"
            alt=""
            className="h-full w-full object-cover object-top"
            loading="eager"
          />
          {/* Soft light overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-[#f9f1e9]" />
        </div>

        {/* Hero Content – centered in the middle of the image */}
        <div className="relative z-10 mx-auto flex min-h-[88vh] max-w-lg flex-col items-center justify-center px-4 pb-20 pt-10 text-center sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
            className="flex w-full flex-col items-center"
          >
            {/* Decorative line */}
            <div className="mb-20 flex items-center gap-10 text-rose-600/80">
              <Sparkles size={1} />
              <span className="h-px w-12 bg-gradient-to-r from-transparent to-rose-400/70" />
              <Heart size={1} className="fill-rose-500 text-rose-500" />
              <span className="h-px w-12 bg-gradient-to-l from-transparent to-rose-400/70" />
              <Sparkles size={1} />
            </div>

            {/* Couple Names */}
            <div className="mb-3 flex flex-col items-center gap-1">
              <Editable
                tag="h1"
                value={groomName}
                field="groomName"
                onEdit={onEdit}
                editable={editable}
                className="text-[clamp(1.85rem,9.5cqw,2.6rem)] font-medium tracking-wide text-rose-950 break-words leading-[1.1]"
                placeholder="Groom Name"
              />
              <span className="text-xl font-light text-rose-600">&</span>
              <Editable
                tag="h1"
                value={brideName}
                field="brideName"
                onEdit={onEdit}
                editable={editable}
                className="text-[clamp(1.85rem,9.5cqw,2.6rem)] font-medium tracking-wide text-rose-950 break-words leading-[1.1]"
                placeholder="Bride Name"
              />
            </div>

            {/* Event Text */}
            <Editable
              tag="p"
              value={heroEventText}
              field="heroEventText"
              onEdit={onEdit}
              editable={editable}
              className="mt-2 max-w-xs text-sm leading-relaxed text-rose-900/90"
              placeholder="invite you to celebrate their wedding"
            />

            {/* Date & Time badges */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <div className="flex items-center gap-1.5 rounded-full bg-white/75 px-3.5 py-1.5 backdrop-blur-md border border-rose-200/60 shadow-sm">
                <Calendar size={14} className="text-rose-600" />
                <Editable
                  tag="span"
                  value={formatDate(weddingDate)}
                  field="weddingDate"
                  onEdit={onEdit}
                  editable={editable}
                  className="text-xs font-medium text-rose-950"
                  placeholder="Wedding Date"
                />
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-white/75 px-3.5 py-1.5 backdrop-blur-md border border-rose-200/60 shadow-sm">
                <Clock size={14} className="text-rose-600" />
                <Editable
                  tag="span"
                  value={weddingTime}
                  field="weddingTime"
                  onEdit={onEdit}
                  editable={editable}
                  className="text-xs font-medium text-rose-950"
                  placeholder="Time"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===================== REST OF THE INVITATION ===================== */}
      <div className="relative z-10 mx-auto max-w-lg px-4 pb-16 sm:px-6">
        {/* Parents & Blessings */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.7 }}
          className="-mt-6 rounded-2xl bg-white/95 p-5 shadow-lg backdrop-blur-sm border border-rose-100/80"
        >
          <div className="mb-4 flex items-center justify-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-rose-200" />
            <Heart size={14} className="fill-rose-300 text-rose-400" />
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-rose-200" />
          </div>
          <div className="space-y-4 text-center">
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-widest text-rose-400">
                Groom&apos;s Family
              </p>
              <Editable
                tag="p"
                value={groomParents}
                field="groomParents"
                onEdit={onEdit}
                editable={editable}
                className="text-sm leading-relaxed text-rose-900"
                placeholder="Son of Mr. & Mrs. Rahman"
                multiline
              />
            </div>
            <div className="mx-auto h-px w-12 bg-rose-200" />
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-widest text-rose-400">
                Bride&apos;s Family
              </p>
              <Editable
                tag="p"
                value={brideParents}
                field="brideParents"
                onEdit={onEdit}
                editable={editable}
                className="text-sm leading-relaxed text-rose-900"
                placeholder="Daughter of Mr. & Mrs. Ibrahim"
                multiline
              />
            </div>
          </div>
        </motion.section>

        {/* Countdown */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.7 }}
          className="mt-8 text-center"
        >
          <Editable
            tag="h2"
            value={countdownTitle}
            field="countdownTitle"
            onEdit={onEdit}
            editable={editable}
            className="mb-5 text-sm font-medium uppercase tracking-[0.2em] text-rose-800"
            placeholder="Counting Down To The Big Day"
          />
          {isExpired ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border border-rose-200 bg-white/90 p-6 shadow-sm"
            >
              <div className="mb-2 flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-rose-500" />
                <Editable
                  tag="h3"
                  value={countdownEndedTitle}
                  field="countdownEndedTitle"
                  onEdit={onEdit}
                  editable={editable}
                  className="text-lg font-medium tracking-wide text-rose-950 sm:text-xl"
                  placeholder="Wedding in Progress!"
                />
                <Sparkles className="h-5 w-5 text-rose-500" />
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
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {[
              { label: 'Days', value: timeLeft.days },
              { label: 'Hours', value: timeLeft.hours },
              { label: 'Mins', value: timeLeft.minutes },
              { label: 'Secs', value: timeLeft.seconds },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center rounded-xl bg-white py-3 shadow-md border border-rose-100"
              >
                <span className="text-xl font-semibold tabular-nums text-rose-900 sm:text-2xl">
                  {String(item.value).padStart(2, '0')}
                </span>
                <span className="mt-0.5 text-[10px] uppercase tracking-wider text-rose-500">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
          )}
        </motion.section>

        {/* Venue */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.7 }}
          className="mt-8 rounded-2xl bg-white p-5 shadow-lg border border-rose-100/80"
        >
          <div className="mb-3 flex items-center justify-center gap-2 text-rose-600">
            <MapPin size={16} />
            <span className="text-xs font-semibold uppercase tracking-widest">
              Venue
            </span>
          </div>
          <Editable
            tag="h3"
            value={venue}
            field="venue"
            onEdit={onEdit}
            editable={editable}
            className="text-center text-lg font-medium text-rose-950"
            placeholder="Venue Name"
          />
          <Editable
            tag="p"
            value={venueAddress}
            field="venueAddress"
            onEdit={onEdit}
            editable={editable}
            className="mt-1 text-center text-sm text-rose-700/90"
            placeholder="Full Address"
            multiline
          />
          <a
            href={canonicalMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 py-2.5 text-sm font-medium text-white shadow-md transition hover:from-rose-600 hover:to-rose-700 active:scale-[0.98]"
          >
            <ExternalLink size={15} />
            Get Directions
          </a>
        </motion.section>

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
          theme="rose"
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
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-12 mb-6 flex flex-col items-center text-center"
        >
          <p className="max-w-[240px] text-xs leading-relaxed text-rose-700/90">
            With love & blessings, we look forward to celebrating this joyous
            occasion with you.
          </p>
          <div className="mt-4 flex items-center gap-1.5 text-rose-300">
            <Sparkles size={12} />
            <Heart size={11} className="fill-current" />
            <Sparkles size={12} />
          </div>
        </motion.footer>
      </div>
    </div>
  );
}
