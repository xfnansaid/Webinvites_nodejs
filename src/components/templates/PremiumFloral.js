'use client';

import CelebrationsSection from './CelebrationsSection';

import CouplePhotoSection from './CouplePhotoSection';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink,
  Heart
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

export default function WeddingTemplate({ data = {}, isDraft = false, editable = false, onEdit, onStyleChange, templateData, }) {
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
  // Merge default data with incoming props
  const mergedData = { ...defaultData, ...data };
  // Resolve canonical map URL from any field name, with fallback to auto-construct
  const canonicalMapUrl = mergedData.mapsUrl || mergedData.mapUrl || mergedData.directionsUrl
    || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mergedData.venue + ' ' + mergedData.venueAddress)}`;
  const currentData = { ...mergedData, mapsUrl: canonicalMapUrl, mapUrl: canonicalMapUrl, directionsUrl: canonicalMapUrl };

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Address Copy State
  const [copied, setCopied] = useState(false);
  const handleCopyAddress = () => {
    const fullAddress = `${currentData.venue}, ${currentData.venueAddress}`;
    navigator.clipboard.writeText(fullAddress).then(() => {
      setCopied(true);
      showToast("📍 Venue address copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      showToast(`📍 Address: ${fullAddress}`);
    });
  };

  // Live Countdown State
  const [timeLeft, setTimeLeft] = useState({ days: "00", hours: "00", minutes: "00", seconds: "00" });
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
        seconds: s < 10 ? `0${s}` : `${s}`
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentData.weddingDate]);

  // Inject Google Fonts Dynamically
  useEffect(() => {
    const linkId = 'wedding-google-fonts';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Allura&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  // Save to Calendar Generator Function
  const handleSaveToCalendar = () => {
    const title = encodeURIComponent(`${currentData.groomName} & ${currentData.brideName}'s ${currentData.eventType}`);
    const details = encodeURIComponent(`Join us for the celebration in honor of ${currentData.groomName} and ${currentData.brideName}!`);
    const location = encodeURIComponent(`${currentData.venue}, ${currentData.venueAddress}`);
    
    // Google Calendar URL
    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=20261219T190000Z/20261219T230000Z&details=${details}&location=${location}`;
    
    window.open(googleCalUrl, '_blank');
    showToast("📅 Opening Google Calendar...");
  };

  return (
    <div style={{ containerType: 'inline-size', width: '100%', maxWidth: '100%', margin: 0, padding: 0 }}  className="max-w-md mx-auto w-full min-h-screen bg-[#e8dfd2] text-[#332f2b] font-['Montserrat',sans-serif] relative overflow-x-hidden shadow-2xl selection:bg-[#c5a059]/30">
      
      {/* Animated Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[1000] bg-[#183c36] text-white text-xs font-medium px-6 py-3 rounded-full shadow-2xl border border-[#c5a059]/30 text-center max-w-[90cqw]"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO SECTION */}
      <section id="hero-section" 
        className="min-h-screen relative grid place-items-center overflow-hidden pt-12 pb-16 px-4 border-b border-[#425c4c]/15"
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.85) 0%, rgba(247, 241, 231, 0.75) 50%, rgba(24, 60, 54, 0.3) 100%), url('${currentData.heroBgImage}') center/cover no-repeat`
        }}
      >
        
        {/* Double Inner Borders */}
        <div className="absolute inset-3 border border-[#60584b]/20 pointer-events-none z-1" />
        <div className="absolute inset-6 border border-[#60584b]/10 pointer-events-none z-1" />

        {/* Ornate Corner SVGs */}
        <div className="absolute inset-0 pointer-events-none z-2">
          {/* Top Left */}
          <div className="absolute top-0 left-0 w-24 h-24 opacity-60">
            <svg viewBox="0 0 220 220" className="w-full h-full">
              <path d="M0 0h220v8H36C20 8 8 20 8 36v184H0z" fill="#173a34" />
              <path d="M0 20h200v7H38c-7 0-11 4-11 11v172h-7V38C20 28 28 20 38 20z" fill="#b7a78c" opacity=".75" />
              <path d="M36 9c28 17 54 20 85 7 21-9 42-11 64-6-26 19-53 26-80 20-25-5-47-11-69-3z" fill="#426b58" />
            </svg>
          </div>

          {/* Top Right */}
          <div className="absolute top-0 right-0 w-24 h-24 opacity-60 scale-x-[-1]">
            <svg viewBox="0 0 220 220" className="w-full h-full">
              <path d="M0 0h220v8H36C20 8 8 20 8 36v184H0z" fill="#173a34" />
              <path d="M0 20h200v7H38c-7 0-11 4-11 11v172h-7V38C20 28 28 20 38 20z" fill="#b7a78c" opacity=".75" />
              <path d="M36 9c28 17 54 20 85 7 21-9 42-11 64-6-26 19-53 26-80 20-25-5-47-11-69-3z" fill="#426b58" />
            </svg>
          </div>

          {/* Bottom Left */}
          <div className="absolute bottom-0 left-0 w-24 h-24 opacity-60 scale-y-[-1]">
            <svg viewBox="0 0 220 220" className="w-full h-full">
              <path d="M0 0h220v8H36C20 8 8 20 8 36v184H0z" fill="#173a34" />
              <path d="M0 20h200v7H38c-7 0-11 4-11 11v172h-7V38C20 28 28 20 38 20z" fill="#b7a78c" opacity=".75" />
              <path d="M36 9c28 17 54 20 85 7 21-9 42-11 64-6-26 19-53 26-80 20-25-5-47-11-69-3z" fill="#426b58" />
            </svg>
          </div>

          {/* Bottom Right */}
          <div className="absolute bottom-0 right-0 w-24 h-24 opacity-60 scale-[-1]">
            <svg viewBox="0 0 220 220" className="w-full h-full">
              <path d="M0 0h220v8H36C20 8 8 20 8 36v184H0z" fill="#173a34" />
              <path d="M0 20h200v7H38c-7 0-11 4-11 11v172h-7V38C20 28 28 20 38 20z" fill="#b7a78c" opacity=".75" />
              <path d="M36 9c28 17 54 20 85 7 21-9 42-11 64-6-26 19-53 26-80 20-25-5-47-11-69-3z" fill="#426b58" />
            </svg>
          </div>
        </div>

        {/* Botanical Leaves Vector floating background */}
        <motion.div 
          animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-10 bottom-4 w-28 opacity-30 pointer-events-none z-0"
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
          animate={{ y: [0, -8, 0], rotate: [2, -2, 2] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute -right-8 top-10 w-28 opacity-30 pointer-events-none z-0 scale-x-[-1]"
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

        {/* Hero Content Container */}
        <div className="relative z-10 text-center w-full px-2 py-6 flex flex-col items-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-[10px] tracking-[0.2em] uppercase text-[#3d3a36] font-medium leading-relaxed max-w-[280px]"
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="font-['Allura',cursive] text-2xl text-[#4b4944] mt-3"
          >
            <Editable 
              tag="span" 
              value={currentData.heroIntro} 
              field="heroIntro" 
              onEdit={onEdit} 
              editable={editable} 
            />
          </motion.div>

          {/* Groom Name */}
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.3 }}
            className="font-['Cormorant_Garamond',serif] text-4xl sm:text-5xl font-medium tracking-widest text-[#6a594f] uppercase mt-2"
          >
            <Editable 
              tag="span" 
              value={currentData.groomName} 
              field="groomName" 
              onEdit={onEdit} 
              editable={editable} 
            />
          </motion.h1>

          {/* & Connector */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="font-['Allura',cursive] text-3xl text-[#68635d] my-1"
          >
            and
          </motion.div>

          {/* Bride Name */}
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.6 }}
            className="font-['Cormorant_Garamond',serif] text-4xl sm:text-5xl font-medium tracking-widest text-[#6a594f] uppercase"
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
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.75 }}
            className="font-['Allura',cursive] text-2xl text-[#4e4b46] mt-4"
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
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="mt-3 flex flex-col items-center gap-1 text-[11px] font-medium tracking-[0.14em] uppercase text-[#4e4b46]"
          >
            <strong className="font-['Cormorant_Garamond',serif] text-xl font-medium tracking-wider text-[#183c36]">
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
              /> • <Editable 
                tag="span" 
                value={currentData.venue} 
                field="venue" 
                onEdit={onEdit} 
                editable={editable} 
              />
            </span>
          </motion.div>

        </div>

        {/* Scroll Cue Indicator */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 text-[9px] uppercase tracking-[0.25em] text-[#425c4c] font-medium">
          <span>Scroll</span>
          <motion.span 
            animate={{ scaleY: [0.35, 1, 0.35], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="w-[1px] h-7 bg-[#425c4c] origin-top"
          />
        </div>
      </section>

      {/* EVENT DETAILS SUMMARY GRID */}
      <section className="py-12 px-4 bg-[#e8dfd2]">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.8 }}
          className="bg-white/70 border border-[#425c4c]/20 rounded-xl p-6 shadow-[0_18px_55px_rgba(63,54,43,0.08)] backdrop-blur-md"
        >
          <div className="grid grid-cols-2 gap-4 text-center">
            
            <div className="pb-3 border-b border-r border-[#425c4c]/15">
              <div className="text-[10px] font-semibold tracking-[0.2em] text-[#425c4c] uppercase mb-1 flex items-center justify-center gap-1">
                <Calendar className="w-3 h-3" /> Date
              </div>
              <div className="font-['Cormorant_Garamond',serif] text-lg font-medium text-[#332f2b]">
                <Editable 
                  tag="span" 
                  value={currentData.weddingDate} 
                  field="weddingDate" 
                  onEdit={onEdit} 
                  editable={editable} 
                />
              </div>
            </div>

            <div className="pb-3 border-b border-[#425c4c]/15">
              <div className="text-[10px] font-semibold tracking-[0.2em] text-[#425c4c] uppercase mb-1 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" /> Time
              </div>
              <div className="font-['Cormorant_Garamond',serif] text-lg font-medium text-[#332f2b]">
                <Editable 
                  tag="span" 
                  value={currentData.weddingTime} 
                  field="weddingTime" 
                  onEdit={onEdit} 
                  editable={editable} 
                />
              </div>
            </div>

            <div className="pt-2 border-r border-[#425c4c]/15">
              <div className="text-[10px] font-semibold tracking-[0.2em] text-[#425c4c] uppercase mb-1 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3" /> Setting
              </div>
              <div className="font-['Cormorant_Garamond',serif] text-lg font-medium text-[#332f2b]">
                <Editable 
                  tag="span" 
                  value={currentData.setting} 
                  field="setting" 
                  onEdit={onEdit} 
                  editable={editable} 
                />
              </div>
            </div>

            <div className="pt-2">
              <div className="text-[10px] font-semibold tracking-[0.2em] text-[#425c4c] uppercase mb-1 flex items-center justify-center gap-1">
                <MapPin className="w-3 h-3" /> Venue
              </div>
              <div className="font-['Cormorant_Garamond',serif] text-lg font-medium text-[#332f2b]">
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

      {/* COUNTDOWN TIMER SECTION */}
      <section className="py-14 px-4 bg-gradient-to-b from-[#f5f1ea] to-[#ece4d6]">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <div className="text-[10px] font-semibold tracking-[0.25em] text-[#425c4c] uppercase mb-2">
            <Editable 
              tag="span" 
              value={currentData.countdownSubtitle} 
              field="countdownSubtitle" 
              onEdit={onEdit} 
              editable={editable} 
            />
          </div>
          <h2 className="font-['Cormorant_Garamond',serif] text-3xl font-medium text-[#183c36]">
            <Editable 
              tag="span" 
              value={currentData.countdownTitle} 
              field="countdownTitle" 
              onEdit={onEdit} 
              editable={editable} 
            />
          </h2>
          <p className="text-xs text-[#6e6b65] mt-2 max-w-xs mx-auto">
            Counting down every moment until {currentData.groomName} and {currentData.brideName} say "I Do"!
          </p>
          <div className="w-12 h-[2px] bg-[#c5a059] mx-auto mt-4 opacity-75" />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-white/80 border border-[#c5a059]/40 rounded-xl p-5 shadow-lg backdrop-blur-md"
        >
          {isExpired ? (
            <div className="py-3 text-center">
              <div className="mb-2 flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-[#c5a059]" />
                <Editable
                  tag="h3"
                  value={currentData.countdownEndedTitle}
                  field="countdownEndedTitle"
                  onEdit={onEdit}
                  editable={editable}
                  className="font-['Cormorant_Garamond',serif] text-2xl font-semibold text-[#183c36] sm:text-3xl"
                  placeholder="Wedding in Progress!"
                />
                <Sparkles className="h-5 w-5 text-[#c5a059]" />
              </div>
              <Editable
                tag="p"
                value={currentData.countdownEndedSubtitle}
                field="countdownEndedSubtitle"
                onEdit={onEdit}
                editable={editable}
                className="mx-auto max-w-sm text-xs leading-relaxed text-[#6e6b65] sm:text-sm"
                placeholder="Thank you for celebrating this beautiful occasion with us."
                multiline
              />
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 text-center">
              
              <div className="bg-white/90 border border-[#c5a059]/30 rounded-lg p-3 shadow-sm">
                <div className="font-['Cormorant_Garamond',serif] text-2xl sm:text-3xl font-semibold text-[#183c36]">
                  {timeLeft.days}
                </div>
                <div className="text-[9px] font-semibold tracking-wider text-[#997836] uppercase mt-1">
                  Days
                </div>
              </div>

              <div className="bg-white/90 border border-[#c5a059]/30 rounded-lg p-3 shadow-sm">
                <div className="font-['Cormorant_Garamond',serif] text-2xl sm:text-3xl font-semibold text-[#183c36]">
                  {timeLeft.hours}
                </div>
                <div className="text-[9px] font-semibold tracking-wider text-[#997836] uppercase mt-1">
                  Hours
                </div>
              </div>

              <div className="bg-white/90 border border-[#c5a059]/30 rounded-lg p-3 shadow-sm">
                <div className="font-['Cormorant_Garamond',serif] text-2xl sm:text-3xl font-semibold text-[#183c36]">
                  {timeLeft.minutes}
                </div>
                <div className="text-[9px] font-semibold tracking-wider text-[#997836] uppercase mt-1">
                  Mins
                </div>
              </div>

              <div className="bg-white/90 border border-[#c5a059]/30 rounded-lg p-3 shadow-sm">
                <div className="font-['Cormorant_Garamond',serif] text-2xl sm:text-3xl font-semibold text-[#183c36]">
                  {timeLeft.seconds}
                </div>
                <div className="text-[9px] font-semibold tracking-wider text-[#997836] uppercase mt-1">
                  Secs
                </div>
              </div>

            </div>
          )}
        </motion.div>
      </section>

      {/* GOOGLE MAPS NAVIGATION SECTION */}
      <section className="py-14 px-4 bg-[#e8dfd2]">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <div className="text-[10px] font-semibold tracking-[0.25em] text-[#425c4c] uppercase mb-2">
            <Editable 
              tag="span" 
              value={currentData.locationSubtitle} 
              field="locationSubtitle" 
              onEdit={onEdit} 
              editable={editable} 
            />
          </div>
          <h2 className="font-['Cormorant_Garamond',serif] text-3xl font-medium text-[#183c36]">
            <Editable 
              tag="span" 
              value={currentData.locationTitle} 
              field="locationTitle" 
              onEdit={onEdit} 
              editable={editable} 
            />
          </h2>
          <p className="text-xs text-[#6e6b65] mt-2 max-w-xs mx-auto">
            Easily navigate to <Editable tag="span" value={currentData.venue} field="venue" onEdit={onEdit} editable={editable} /> for the celebration.
          </p>
          <div className="w-12 h-[2px] bg-[#c5a059] mx-auto mt-4 opacity-75" />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-white/80 border border-[#425c4c]/20 rounded-xl overflow-hidden shadow-lg backdrop-blur-md"
        >
          <div className="p-5 border-b border-[#425c4c]/15 flex flex-col gap-3">
            <div>
              <h3 className="font-['Cormorant_Garamond',serif] text-2xl font-semibold text-[#183c36]">
                <Editable 
                  tag="span" 
                  value={currentData.venue} 
                  field="venue" 
                  onEdit={onEdit} 
                  editable={editable} 
                />
              </h3>
              <p className="text-xs text-[#6e6b65] mt-1 flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#425c4c] shrink-0 mt-0.5" />
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
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCopyAddress}
              className="w-full py-2.5 px-4 rounded-md border border-[#183c36] text-[#183c36] text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#183c36]/10 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {copied ? "Address Copied!" : "Copy Address"}
            </motion.button>
          </div>

          <div className="p-4 bg-white/90 flex flex-col items-center">
            <motion.a 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href={currentData.mapsUrl}
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-md bg-[#183c36] text-white text-xs font-semibold uppercase tracking-widest flex items-center justify-center gap-2 shadow-md hover:bg-[#112c28] transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Open Directions on Google Maps
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </motion.a>
          </div>
        </motion.div>
      </section>

      {/* SAVE TO CALENDAR SECTION - SINGLE BUTTON ONLY */}
      <section className="py-14 px-4 bg-[#f7f1e7]">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <div className="text-[10px] font-semibold tracking-[0.25em] text-[#425c4c] uppercase mb-2">
            <Editable 
              tag="span" 
              value={currentData.calendarSubtitle} 
              field="calendarSubtitle" 
              onEdit={onEdit} 
              editable={editable} 
            />
          </div>
          <h2 className="font-['Cormorant_Garamond',serif] text-3xl font-medium text-[#183c36]">
            <Editable 
              tag="span" 
              value={currentData.calendarTitle} 
              field="calendarTitle" 
              onEdit={onEdit} 
              editable={editable} 
            />
          </h2>
          <p className="text-xs text-[#6e6b65] mt-2 max-w-xs mx-auto">
            <Editable 
              tag="span" 
              value={currentData.calendarDescription} 
              field="calendarDescription" 
              onEdit={onEdit} 
              editable={editable} 
            />
          </p>
          <div className="w-12 h-[2px] bg-[#c5a059] mx-auto mt-4 opacity-75" />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-white/80 border border-[#c5a059]/35 rounded-xl p-6 shadow-md backdrop-blur-md text-center"
        >
          {/* SINGLE SAVE TO CALENDAR BUTTON AS REQUESTED */}
          <motion.button 
            whileHover={{ scale: 1.03, translateY: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSaveToCalendar}
            className="w-full py-4 px-6 rounded-lg bg-gradient-to-r from-[#183c36] to-[#2a524a] text-[#f3e6c8] text-sm font-semibold tracking-wider uppercase flex items-center justify-center gap-3 shadow-lg border border-[#c5a059]/40 hover:shadow-xl transition-all"
          >
            <Calendar className="w-5 h-5 text-[#c5a059]" />
            Save Date to Calendar
          </motion.button>
        </motion.div>
      </section>

      {/* FOOTER */}
      
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
          receptionTime={data?.receptionTime || '12:30 PM Onwards'}
          receptionNote={data?.receptionNote || 'Followed by lunch & celebration'}
        />

        <CouplePhotoSection
          photoUrl={data?.photoUrl || data?.heroImage || data?.couplePhoto || ''}
          groomName={currentData.groomName || 'Groom'}
          brideName={currentData.brideName || 'Bride'}
          photoTag={data?.photoTag || 'Memories'}
          photoTitle={data?.photoTitle || 'Moments of Love'}
          photoSubtitle={data?.photoSubtitle || 'Captured memories on our journey to forever'}
          showPhotoSection={data?.showPhotoSection !== false}
          theme="emerald"
          editable={editable}
          onEdit={onEdit}
        />

        <RsvpSection
          groomName={currentData.groomName || 'Groom'}
          brideName={currentData.brideName || 'Bride'}
          whatsappNumber={data?.whatsappNumber || data?.phone || data?.whatsapp || currentData?.whatsappNumber || ''}
          theme="emerald"
        />

        <footer className="bg-[#183c36] text-[#ded6c9] text-center py-12 px-4 relative overflow-hidden border-t border-[#c5a059]/20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative z-10 flex flex-col items-center"
        >
          <Heart className="w-5 h-5 text-[#c5a059] mb-3 animate-pulse" />
          <h3 className="font-['Allura',cursive] text-4xl text-[#f3e6c8] mb-2">
            {currentData.groomName} & {currentData.brideName}
          </h3>
          <p className="text-[11px] tracking-[0.2em] uppercase opacity-80 font-medium">
            <Editable 
              tag="span" 
              value={currentData.weddingDate} 
              field="weddingDate" 
              onEdit={onEdit} 
              editable={editable} 
            /> • <Editable 
              tag="span" 
              value={currentData.venue} 
              field="venue" 
              onEdit={onEdit} 
              editable={editable} 
            />
          </p>
          <p className="mt-4 text-[10px] opacity-50 font-light">
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