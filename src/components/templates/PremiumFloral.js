'use client';

import CelebrationsSection from './CelebrationsSection';
import CouplePhotoSection from './CouplePhotoSection';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Heart,
} from 'lucide-react';
import RsvpSection from './RsvpSection';
import SharedEditable from './_Editable';

// Default Fallback Data Object
const defaultData = {
  groomName: "ADITYA",
  brideName: "ANANYA",
  eventType: "Haldi & Wedding Ceremony",
  heroEyebrow: "You're invited to the Haldi & Wedding Ceremony",
  heroIntro: "in honor of",
  weddingDay: "Saturday",
  weddingDate: "December 19, 2026",
  weddingTime: "3:00 PM EST",
  setting: "By the Pool",
  venue: "The Lyle Hotel",
  venueAddress: "1731 New Hampshire Ave NW, Washington, DC 20009",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=The+Lyle+Hotel+Washington+DC",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=The+Lyle+Hotel+Washington+DC",
  directionsUrl: "https://www.google.com/maps/search/?api=1&query=The+Lyle+Hotel+Washington+DC",
  countdownSubtitle: "Interactive Countdown Timer",
  countdownTitle: "Build excitement for the big day",
  countdownEndedTitle: "Wedding in Progress!",
  countdownEndedSubtitle: "Thank you for celebrating this beautiful occasion with us.",
  locationSubtitle: "Google Maps Navigation",
  locationTitle: "One-click directions to the venue",
  calendarSubtitle: "Save to Calendar",
  calendarTitle: "Guests can instantly add to Google Calendar",
  calendarDescription: "Never miss a moment of our celebration. Save the date directly to your digital calendar!",
  footerTagline: "Crafted with love for our friends & family",
  heroBgImage: "https://one-tawny-two.vercel.app/0005/img/floral-arch-thumb.jpg",
  musicUrl: "https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939b43936.mp3?filename=romantic-wedding-122421.mp3"
};

export default function WeddingTemplate({
  data = {},
  isDraft = false,
  editable = false,
  onEdit,
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

  const mergedData = { ...defaultData, ...data };
  const canonicalMapUrl =
    mergedData.mapsUrl ||
    mergedData.mapUrl ||
    mergedData.directionsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      mergedData.venue + ' ' + mergedData.venueAddress
    )}`;
  const currentData = {
    ...mergedData,
    mapsUrl: canonicalMapUrl,
    mapUrl: canonicalMapUrl,
    directionsUrl: canonicalMapUrl,
  };

  // Toast
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Address copy
  const [copied, setCopied] = useState(false);
  const handleCopyAddress = () => {
    const fullAddress = `${currentData.venue}, ${currentData.venueAddress}`;
    navigator.clipboard
      .writeText(fullAddress)
      .then(() => {
        setCopied(true);
        showToast("📍 Venue address copied to clipboard!");
        setTimeout(() => setCopied(false), 2500);
      })
      .catch(() => {
        showToast(`📍 Address: ${fullAddress}`);
      });
  };

  // Countdown
  const [timeLeft, setTimeLeft] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const parseTargetDate = () => {
      const parsed = Date.parse(currentData.weddingDate);
      if (!isNaN(parsed)) return parsed;
      return new Date('December 19, 2026 15:00:00 EST').getTime();
    };

    const targetTime = parseTargetDate();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = targetTime - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft({ days: "00", hours: "00", minutes: "00", seconds: "00" });
        return;
      }

      setIsExpired(false);

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({
        days: d < 10 ? `0${d}` : `${d}`,
        hours: h < 10 ? `0${h}` : `${h}`,
        minutes: m < 10 ? `0${m}` : `${m}`,
        seconds: s < 10 ? `0${s}` : `${s}`,
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentData.weddingDate]);

  // Google Fonts
  useEffect(() => {
    const linkId = 'wedding-google-fonts';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Allura&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  // Save to Calendar
  const handleSaveToCalendar = () => {
    const title = encodeURIComponent(
      `${currentData.groomName} & ${currentData.brideName}'s ${currentData.eventType}`
    );
    const details = encodeURIComponent(
      `Join us for the celebration in honor of ${currentData.groomName} and ${currentData.brideName}!`
    );
    const location = encodeURIComponent(
      `${currentData.venue}, ${currentData.venueAddress}`
    );

    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=20261219T190000Z/20261219T230000Z&details=${details}&location=${location}`;

    window.open(googleCalUrl, '_blank');
    showToast("📅 Opening Google Calendar...");
  };

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
        relative mx-auto min-h-[100dvh] w-full max-w-md
        overflow-x-hidden bg-[#e8dfd2] font-['Montserrat',sans-serif]
        text-[#332f2b] shadow-2xl selection:bg-[#c5a059]/30
      "
    >
      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 40, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 16, x: "-50%" }}
            className="
              fixed bottom-6 left-1/2 z-[1000] max-w-[90cqw]
              -translate-x-1/2 rounded-full border border-[#c5a059]/30
              bg-[#183c36] px-5 py-2.5 text-center text-[11px]
              font-medium text-white shadow-2xl
            "
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================== HERO ===================== */}
      <section
        id="hero-section"
        className="
          relative grid min-h-[100dvh] place-items-center overflow-hidden
          border-b border-[#425c4c]/15 px-4 pb-14 pt-10
        "
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.85) 0%, rgba(247, 241, 231, 0.75) 50%, rgba(24, 60, 54, 0.3) 100%), url('${currentData.heroBgImage}') center/cover no-repeat`,
        }}
      >
        {/* Soft double borders – lighter on mobile */}
        <div className="pointer-events-none absolute inset-2.5 z-[1] border border-[#60584b]/15 sm:inset-3 sm:border-[#60584b]/20" />
        <div className="pointer-events-none absolute inset-5 z-[1] border border-[#60584b]/8 sm:inset-6 sm:border-[#60584b]/10" />

        {/* Corner ornaments – smaller on mobile */}
        <div className="pointer-events-none absolute inset-0 z-[2]">
          <div className="absolute left-0 top-0 h-16 w-16 opacity-50 sm:h-24 sm:w-24 sm:opacity-60">
            <svg viewBox="0 0 220 220" className="h-full w-full">
              <path d="M0 0h220v8H36C20 8 8 20 8 36v184H0z" fill="#173a34" />
              <path d="M0 20h200v7H38c-7 0-11 4-11 11v172h-7V38C20 28 28 20 38 20z" fill="#b7a78c" opacity=".75" />
              <path d="M36 9c28 17 54 20 85 7 21-9 42-11 64-6-26 19-53 26-80 20-25-5-47-11-69-3z" fill="#426b58" />
            </svg>
          </div>
          <div className="absolute right-0 top-0 h-16 w-16 scale-x-[-1] opacity-50 sm:h-24 sm:w-24 sm:opacity-60">
            <svg viewBox="0 0 220 220" className="h-full w-full">
              <path d="M0 0h220v8H36C20 8 8 20 8 36v184H0z" fill="#173a34" />
              <path d="M0 20h200v7H38c-7 0-11 4-11 11v172h-7V38C20 28 28 20 38 20z" fill="#b7a78c" opacity=".75" />
              <path d="M36 9c28 17 54 20 85 7 21-9 42-11 64-6-26 19-53 26-80 20-25-5-47-11-69-3z" fill="#426b58" />
            </svg>
          </div>
          <div className="absolute bottom-0 left-0 h-16 w-16 scale-y-[-1] opacity-50 sm:h-24 sm:w-24 sm:opacity-60">
            <svg viewBox="0 0 220 220" className="h-full w-full">
              <path d="M0 0h220v8H36C20 8 8 20 8 36v184H0z" fill="#173a34" />
              <path d="M0 20h200v7H38c-7 0-11 4-11 11v172h-7V38C20 28 28 20 38 20z" fill="#b7a78c" opacity=".75" />
              <path d="M36 9c28 17 54 20 85 7 21-9 42-11 64-6-26 19-53 26-80 20-25-5-47-11-69-3z" fill="#426b58" />
            </svg>
          </div>
          <div className="absolute bottom-0 right-0 h-16 w-16 scale-[-1] opacity-50 sm:h-24 sm:w-24 sm:opacity-60">
            <svg viewBox="0 0 220 220" className="h-full w-full">
              <path d="M0 0h220v8H36C20 8 8 20 8 36v184H0z" fill="#173a34" />
              <path d="M0 20h200v7H38c-7 0-11 4-11 11v172h-7V38C20 28 28 20 38 20z" fill="#b7a78c" opacity=".75" />
              <path d="M36 9c28 17 54 20 85 7 21-9 42-11 64-6-26 19-53 26-80 20-25-5-47-11-69-3z" fill="#426b58" />
            </svg>
          </div>
        </div>

        {/* Floating leaves – quieter */}
        <motion.div
          animate={{ y: [0, -6, 0], rotate: [-1.5, 1.5, -1.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -left-8 bottom-2 z-0 w-20 opacity-20 sm:-left-10 sm:bottom-4 sm:w-28 sm:opacity-30"
        >
          <svg viewBox="0 0 240 260" xmlns="http://www.w3.org/2000/svg">
            <path d="M25 250C56 203 83 157 121 111c26-32 53-61 88-88" stroke="#526653" strokeWidth="3" fill="none" />
            <g fill="#65785e">
              <ellipse cx="50" cy="211" rx="10" ry="28" transform="rotate(-34 50 211)" />
              <ellipse cx="71" cy="184" rx="10" ry="27" transform="rotate(25 71 184)" />
              <ellipse cx="99" cy="147" rx="10" ry="28" transform="rotate(32 99 147)" />
              <ellipse cx="130" cy="111" rx="10" ry="27" transform="rotate(35 130 111)" />
            </g>
          </svg>
        </motion.div>

        <motion.div
          animate={{ y: [0, -6, 0], rotate: [1.5, -1.5, 1.5] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="pointer-events-none absolute -right-6 top-8 z-0 w-20 scale-x-[-1] opacity-20 sm:-right-8 sm:top-10 sm:w-28 sm:opacity-30"
        >
          <svg viewBox="0 0 240 260" xmlns="http://www.w3.org/2000/svg">
            <path d="M25 250C56 203 83 157 121 111c26-32 53-61 88-88" stroke="#526653" strokeWidth="3" fill="none" />
            <g fill="#65785e">
              <ellipse cx="50" cy="211" rx="10" ry="28" transform="rotate(-34 50 211)" />
              <ellipse cx="71" cy="184" rx="10" ry="27" transform="rotate(25 71 184)" />
              <ellipse cx="99" cy="147" rx="10" ry="28" transform="rotate(32 99 147)" />
              <ellipse cx="130" cy="111" rx="10" ry="27" transform="rotate(35 130 111)" />
            </g>
          </svg>
        </motion.div>

        {/* Hero content */}
        <div className="relative z-10 flex w-full flex-col items-center px-2 py-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-[260px] text-[9px] font-medium uppercase leading-relaxed tracking-[0.18em] text-[#3d3a36] sm:max-w-[280px] sm:text-[10px] sm:tracking-[0.2em]"
          >
            <Editable
              tag="span"
              value={currentData.heroEyebrow}
              field="heroEyebrow"
              onEdit={onEdit}
              editable={editable}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12 }}
            className="mt-2.5 font-['Allura',cursive] text-xl text-[#4b4944] sm:mt-3 sm:text-2xl"
          >
            <Editable
              tag="span"
              value={currentData.heroIntro}
              field="heroIntro"
              onEdit={onEdit}
              editable={editable}
            />
          </motion.div>

          {/* Groom */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="mt-1.5 font-['Cormorant_Garamond',serif] text-[2rem] font-medium uppercase tracking-[0.12em] text-[#6a594f] sm:mt-2 sm:text-4xl sm:tracking-widest"
          >
            <Editable
              tag="span"
              value={currentData.groomName}
              field="groomName"
              onEdit={onEdit}
              editable={editable}
            />
          </motion.h1>

          {/* and */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.38 }}
            className="my-0.5 font-['Allura',cursive] text-2xl text-[#68635d] sm:my-1 sm:text-3xl"
          >
            and
          </motion.div>

          {/* Bride */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="font-['Cormorant_Garamond',serif] text-[2rem] font-medium uppercase tracking-[0.12em] text-[#6a594f] sm:text-4xl sm:tracking-widest"
          >
            <Editable
              tag="span"
              value={currentData.brideName}
              field="brideName"
              onEdit={onEdit}
              editable={editable}
            />
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65 }}
            className="mt-3 font-['Allura',cursive] text-xl text-[#4e4b46] sm:mt-4 sm:text-2xl"
          >
            <Editable
              tag="span"
              value={currentData.weddingDay}
              field="weddingDay"
              onEdit={onEdit}
              editable={editable}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.78 }}
            className="mt-2.5 flex flex-col items-center gap-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[#4e4b46] sm:mt-3 sm:gap-1 sm:text-[11px] sm:tracking-[0.14em]"
          >
            <strong className="font-['Cormorant_Garamond',serif] text-lg font-medium tracking-wider text-[#183c36] sm:text-xl">
              <Editable
                tag="span"
                value={currentData.weddingDate}
                field="weddingDate"
                onEdit={onEdit}
                editable={editable}
              />
            </strong>
            <span>
              <Editable
                tag="span"
                value={currentData.weddingTime}
                field="weddingTime"
                onEdit={onEdit}
                editable={editable}
              />
            </span>
            <span className="opacity-90">
              <Editable
                tag="span"
                value={currentData.setting}
                field="setting"
                onEdit={onEdit}
                editable={editable}
              />{" "}
              •{" "}
              <Editable
                tag="span"
                value={currentData.venue}
                field="venue"
                onEdit={onEdit}
                editable={editable}
              />
            </span>
          </motion.div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-2.5 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 text-[8px] font-medium uppercase tracking-[0.22em] text-[#425c4c] sm:bottom-3 sm:gap-1.5 sm:text-[9px] sm:tracking-[0.25em]">
          <span>Scroll</span>
          <motion.span
            animate={{ scaleY: [0.35, 1, 0.35], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="h-5 w-[1px] origin-top bg-[#425c4c] sm:h-7"
          />
        </div>
      </section>

      {/* ===================== EVENT DETAILS ===================== */}
      <section className="bg-[#e8dfd2] px-4 py-9 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.7 }}
          className="
            rounded-xl border border-[#425c4c]/15 bg-white/70 p-4
            shadow-[0_12px_40px_rgba(63,54,43,0.06)] backdrop-blur-md
            sm:p-6 sm:shadow-[0_18px_55px_rgba(63,54,43,0.08)]
          "
        >
          <div className="grid grid-cols-2 gap-3 text-center sm:gap-4">
            <div className="border-b border-r border-[#425c4c]/12 pb-2.5 sm:pb-3">
              <div className="mb-0.5 flex items-center justify-center gap-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#425c4c] sm:mb-1 sm:text-[10px] sm:tracking-[0.2em]">
                <Calendar className="h-3 w-3 shrink-0" /> Date
              </div>
              <div className="font-['Cormorant_Garamond',serif] text-base font-medium text-[#332f2b] sm:text-lg">
                <Editable
                  tag="span"
                  value={currentData.weddingDate}
                  field="weddingDate"
                  onEdit={onEdit}
                  editable={editable}
                />
              </div>
            </div>

            <div className="border-b border-[#425c4c]/12 pb-2.5 sm:pb-3">
              <div className="mb-0.5 flex items-center justify-center gap-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#425c4c] sm:mb-1 sm:text-[10px] sm:tracking-[0.2em]">
                <Clock className="h-3 w-3 shrink-0" /> Time
              </div>
              <div className="font-['Cormorant_Garamond',serif] text-base font-medium text-[#332f2b] sm:text-lg">
                <Editable
                  tag="span"
                  value={currentData.weddingTime}
                  field="weddingTime"
                  onEdit={onEdit}
                  editable={editable}
                />
              </div>
            </div>

            <div className="border-r border-[#425c4c]/12 pt-1.5 sm:pt-2">
              <div className="mb-0.5 flex items-center justify-center gap-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#425c4c] sm:mb-1 sm:text-[10px] sm:tracking-[0.2em]">
                <Sparkles className="h-3 w-3 shrink-0" /> Setting
              </div>
              <div className="font-['Cormorant_Garamond',serif] text-base font-medium text-[#332f2b] sm:text-lg">
                <Editable
                  tag="span"
                  value={currentData.setting}
                  field="setting"
                  onEdit={onEdit}
                  editable={editable}
                />
              </div>
            </div>

            <div className="pt-1.5 sm:pt-2">
              <div className="mb-0.5 flex items-center justify-center gap-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#425c4c] sm:mb-1 sm:text-[10px] sm:tracking-[0.2em]">
                <MapPin className="h-3 w-3 shrink-0" /> Venue
              </div>
              <div className="font-['Cormorant_Garamond',serif] text-base font-medium text-[#332f2b] sm:text-lg">
                <Editable
                  tag="span"
                  value={currentData.venue}
                  field="venue"
                  onEdit={onEdit}
                  editable={editable}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ===================== COUNTDOWN ===================== */}
      <section className="bg-gradient-to-b from-[#f5f1ea] to-[#ece4d6] px-4 py-11 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.7 }}
          className="mb-6 text-center sm:mb-8"
        >
          <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#425c4c] sm:mb-2 sm:text-[10px] sm:tracking-[0.25em]">
            <Editable
              tag="span"
              value={currentData.countdownSubtitle}
              field="countdownSubtitle"
              onEdit={onEdit}
              editable={editable}
            />
          </div>
          <h2 className="font-['Cormorant_Garamond',serif] text-[1.65rem] font-medium text-[#183c36] sm:text-3xl">
            <Editable
              tag="span"
              value={currentData.countdownTitle}
              field="countdownTitle"
              onEdit={onEdit}
              editable={editable}
            />
          </h2>
          <p className="mx-auto mt-1.5 max-w-xs text-[11px] text-[#6e6b65] sm:mt-2 sm:text-xs">
            Counting down every moment until {currentData.groomName} and{" "}
            {currentData.brideName} say &quot;I Do&quot;!
          </p>
          <div className="mx-auto mt-3 h-[2px] w-10 bg-[#c5a059] opacity-70 sm:mt-4 sm:w-12 sm:opacity-75" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="rounded-xl border border-[#c5a059]/35 bg-white/80 p-4 shadow-md backdrop-blur-md sm:p-5 sm:shadow-lg"
        >
          {isExpired ? (
            <div className="py-2 text-center sm:py-3">
              <div className="mb-1.5 flex items-center justify-center gap-1.5 sm:mb-2 sm:gap-2">
                <Sparkles className="h-4 w-4 shrink-0 text-[#c5a059] sm:h-5 sm:w-5" />
                <Editable
                  tag="h3"
                  value={currentData.countdownEndedTitle}
                  field="countdownEndedTitle"
                  onEdit={onEdit}
                  editable={editable}
                  className="font-['Cormorant_Garamond',serif] text-xl font-semibold text-[#183c36] sm:text-2xl"
                  placeholder="Wedding in Progress!"
                />
                <Sparkles className="h-4 w-4 shrink-0 text-[#c5a059] sm:h-5 sm:w-5" />
              </div>
              <Editable
                tag="p"
                value={currentData.countdownEndedSubtitle}
                field="countdownEndedSubtitle"
                onEdit={onEdit}
                editable={editable}
                className="mx-auto max-w-sm text-[11px] leading-relaxed text-[#6e6b65] sm:text-sm"
                placeholder="Thank you for celebrating this beautiful occasion with us."
                multiline
              />
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-1.5 text-center sm:gap-2">
              {[
                { value: timeLeft.days, label: "Days" },
                { value: timeLeft.hours, label: "Hours" },
                { value: timeLeft.minutes, label: "Mins" },
                { value: timeLeft.seconds, label: "Secs" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-[#c5a059]/25 bg-white/90 p-2.5 shadow-sm sm:p-3"
                >
                  <div className="font-['Cormorant_Garamond',serif] text-xl font-semibold text-[#183c36] sm:text-3xl">
                    {item.value}
                  </div>
                  <div className="mt-0.5 text-[8px] font-semibold uppercase tracking-wider text-[#997836] sm:mt-1 sm:text-[9px]">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </section>

      {/* ===================== MAPS ===================== */}
      <section className="bg-[#e8dfd2] px-4 py-11 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.7 }}
          className="mb-6 text-center sm:mb-8"
        >
          <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#425c4c] sm:mb-2 sm:text-[10px] sm:tracking-[0.25em]">
            <Editable
              tag="span"
              value={currentData.locationSubtitle}
              field="locationSubtitle"
              onEdit={onEdit}
              editable={editable}
            />
          </div>
          <h2 className="font-['Cormorant_Garamond',serif] text-[1.65rem] font-medium text-[#183c36] sm:text-3xl">
            <Editable
              tag="span"
              value={currentData.locationTitle}
              field="locationTitle"
              onEdit={onEdit}
              editable={editable}
            />
          </h2>
          <p className="mx-auto mt-1.5 max-w-xs text-[11px] text-[#6e6b65] sm:mt-2 sm:text-xs">
            Easily navigate to{" "}
            <Editable
              tag="span"
              value={currentData.venue}
              field="venue"
              onEdit={onEdit}
              editable={editable}
            />{" "}
            for the celebration.
          </p>
          <div className="mx-auto mt-3 h-[2px] w-10 bg-[#c5a059] opacity-70 sm:mt-4 sm:w-12 sm:opacity-75" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="overflow-hidden rounded-xl border border-[#425c4c]/15 bg-white/80 shadow-md backdrop-blur-md sm:shadow-lg"
        >
          <div className="flex flex-col gap-2.5 border-b border-[#425c4c]/12 p-4 sm:gap-3 sm:p-5">
            <div>
              <h3 className="font-['Cormorant_Garamond',serif] text-xl font-semibold text-[#183c36] sm:text-2xl">
                <Editable
                  tag="span"
                  value={currentData.venue}
                  field="venue"
                  onEdit={onEdit}
                  editable={editable}
                />
              </h3>
              <p className="mt-1 flex items-start gap-1.5 text-[11px] text-[#6e6b65] sm:text-xs">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#425c4c]" />
                <Editable
                  tag="span"
                  value={currentData.venueAddress}
                  field="venueAddress"
                  onEdit={onEdit}
                  editable={editable}
                />
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCopyAddress}
              className="
                flex min-h-[42px] w-full items-center justify-center gap-2
                rounded-md border border-[#183c36] px-4 py-2.5
                text-[11px] font-semibold uppercase tracking-wider text-[#183c36]
                transition-colors hover:bg-[#183c36]/8
                sm:min-h-[44px] sm:text-xs
              "
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Address Copied!" : "Copy Address"}
            </motion.button>
          </div>

          <div className="flex flex-col items-center bg-white/90 p-3.5 sm:p-4">
            <motion.a
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              href={currentData.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="
                flex min-h-[46px] w-full items-center justify-center gap-2
                rounded-md bg-[#183c36] px-4 py-3 text-[11px] font-semibold
                uppercase tracking-widest text-white shadow-md
                transition-colors hover:bg-[#112c28]
                sm:min-h-[48px] sm:text-xs
              "
            >
              <MapPin className="h-4 w-4 shrink-0" />
              Open Directions on Google Maps
              <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" />
            </motion.a>
          </div>
        </motion.div>
      </section>

      {/* ===================== SAVE TO CALENDAR ===================== */}
      <section className="bg-[#f7f1e7] px-4 py-11 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.7 }}
          className="mb-6 text-center sm:mb-8"
        >
          <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#425c4c] sm:mb-2 sm:text-[10px] sm:tracking-[0.25em]">
            <Editable
              tag="span"
              value={currentData.calendarSubtitle}
              field="calendarSubtitle"
              onEdit={onEdit}
              editable={editable}
            />
          </div>
          <h2 className="font-['Cormorant_Garamond',serif] text-[1.65rem] font-medium text-[#183c36] sm:text-3xl">
            <Editable
              tag="span"
              value={currentData.calendarTitle}
              field="calendarTitle"
              onEdit={onEdit}
              editable={editable}
            />
          </h2>
          <p className="mx-auto mt-1.5 max-w-xs text-[11px] text-[#6e6b65] sm:mt-2 sm:text-xs">
            <Editable
              tag="span"
              value={currentData.calendarDescription}
              field="calendarDescription"
              onEdit={onEdit}
              editable={editable}
            />
          </p>
          <div className="mx-auto mt-3 h-[2px] w-10 bg-[#c5a059] opacity-70 sm:mt-4 sm:w-12 sm:opacity-75" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="rounded-xl border border-[#c5a059]/3 bg-white/80 p-5 text-center shadow-md backdrop-blur-md sm:p-6"
        >
          <motion.button
            whileHover={{ scale: 1.02, translateY: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSaveToCalendar}
            className="
              flex min-h-[48px] w-full items-center justify-center gap-2.5
              rounded-lg border border-[#c5a059]/35
              bg-gradient-to-r from-[#183c36] to-[#2a524a]
              px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wider
              text-[#f3e6c8] shadow-lg transition-all hover:shadow-xl
              sm:min-h-[52px] sm:gap-3 sm:text-sm
            "
          >
            <Calendar className="h-4 w-4 shrink-0 text-[#c5a059] sm:h-5 sm:w-5" />
            Save Date to Calendar
          </motion.button>
        </motion.div>
      </section>

      {/* ===================== SECTIONS + FOOTER ===================== */}
      <CelebrationsSection
        showEvents={data?.showEvents !== false}
        theme="emerald"
        editable={editable}
        onEdit={onEdit}
        subtitle={data?.ceremonySubtitle || 'PROGRAM OF CELEBRATIONS'}
        title={data?.ceremonyTitle || 'Wedding Celebrations'}
        dateLabel={data?.eventDateLabel || 'The Date'}
        dateValue={
          data?.weddingDateFormatted ||
          data?.weddingDate ||
          'Saturday, 12 December 2026'
        }
        dateNote={data?.eventDateNote || 'Auspicious day of celebration'}
        ceremonyLabel={data?.ceremonyLabel || 'Ceremony & Muhurtham'}
        ceremonyTime={
          data?.weddingTime || data?.muhurthamTime || '10:00 AM – 11:30 AM'
        }
        ceremonyNote={
          data?.ceremonyNote || 'Solemnization of marriage & blessings'
        }
        receptionLabel={data?.receptionLabel || 'Reception & Feast'}
        receptionTime={data?.receptionTime || '12:30 PM Onwards'}
        receptionNote={
          data?.receptionNote || 'Followed by lunch & celebration'
        }
      />

      <CouplePhotoSection
        photoUrl={
          data?.photoUrl || data?.heroImage || data?.couplePhoto || ''
        }
        groomName={currentData.groomName || 'Groom'}
        brideName={currentData.brideName || 'Bride'}
        photoTag={data?.photoTag || 'Memories'}
        photoTitle={data?.photoTitle || 'Moments of Love'}
        photoSubtitle={
          data?.photoSubtitle || 'Captured memories on our journey to forever'
        }
        showPhotoSection={data?.showPhotoSection !== false}
        theme="emerald"
        editable={editable}
        onEdit={onEdit}
      />

      <RsvpSection
        groomName={currentData.groomName || 'Groom'}
        brideName={currentData.brideName || 'Bride'}
        whatsappNumber={
          data?.whatsappNumber ||
          data?.phone ||
          data?.whatsapp ||
          currentData?.whatsappNumber ||
          ''
        }
        theme="emerald"
      />

      <footer className="relative overflow-hidden border-t border-[#c5a059]/20 bg-[#183c36] px-4 py-9 text-center text-[#ded6c9] sm:py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative z-10 flex flex-col items-center"
        >
          <Heart className="mb-2.5 h-4 w-4 animate-pulse text-[#c5a059] sm:mb-3 sm:h-5 sm:w-5" />
          <h3 className="mb-1.5 font-['Allura',cursive] text-3xl text-[#f3e6c8] sm:mb-2 sm:text-4xl">
            {currentData.groomName} & {currentData.brideName}
          </h3>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] opacity-80 sm:text-[11px] sm:tracking-[0.2em]">
            <Editable
              tag="span"
              value={currentData.weddingDate}
              field="weddingDate"
              onEdit={onEdit}
              editable={editable}
            />{" "}
            •{" "}
            <Editable
              tag="span"
              value={currentData.venue}
              field="venue"
              onEdit={onEdit}
              editable={editable}
            />
          </p>
          <p className="mt-3 text-[9px] font-light opacity-50 sm:mt-4 sm:text-[10px]">
            <Editable
              tag="span"
              value={currentData.footerTagline}
              field="footerTagline"
              onEdit={onEdit}
              editable={editable}
            />
          </p>
        </motion.div>
      </footer>
    </div>
  );
}