'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { MapPin, Navigation, Compass, Calendar, Clock, ExternalLink } from 'lucide-react';

/* =========================================================================
   EDITABLE WRAPPER COMPONENT
   Uses contentEditable on the original tag to preserve layout (no <input> swap)
   ========================================================================= */
const Editable = ({
  tag: Tag = "span",
  value,
  field,
  onEdit,
  editable = false,
  className = "",
  placeholder = "",
  multiline = false
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const elementRef = React.useRef(null);

  React.useEffect(() => {
    if (!isEditing && elementRef.current) {
      const current = elementRef.current.textContent || "";
      const next = value ?? "";
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

  const commit = () => {
    setIsEditing(false);
    if (elementRef.current && onEdit) {
      const text = elementRef.current.innerText || elementRef.current.textContent || "";
      onEdit(field, text.replace(/\u00a0/g, " "));
    }
  };

  const cancel = () => {
    if (elementRef.current) {
      elementRef.current.textContent = value ?? "";
    }
    setIsEditing(false);
  };

  if (!editable) return <Tag className={className}>{value || placeholder}</Tag>;

  return (
    <Tag
      ref={elementRef}
      contentEditable={isEditing}
      suppressContentEditableWarning={true}
      onClick={() => !isEditing && setIsEditing(true)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (isEditing) {
          if (!multiline && e.key === "Enter") {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            cancel();
          }
        }
      }}
      className={`
        ${isEditing
          ? "outline-none ring-2 ring-blue-400/60 rounded bg-white/10"
          : "cursor-pointer ring-0 hover:ring-2 hover:ring-blue-400/40 rounded transition-all"
        }
        ${className}
      `}
      title={!isEditing ? "Click to edit" : undefined}
    >
      {value || (placeholder && !isEditing ? <span className="opacity-40">{placeholder}</span> : placeholder)}
    </Tag>
  );
};

/* =========================================================================
   DEFAULT TEMPLATE DATA
   ========================================================================= */
const DEFAULT_DATA = {
  heroEyebrow: "Together with their families",
  brideName: "Ayesha Fathima",
  groomName: "Rizwan Ahmed",
  heroTagline: "are entering into Nikah, insha'Allah",
  dateDisplay: "Sat, 12 Dec 2026",
  ceremonyName: "Nikah",
  locationShort: "Kozhikode, Kerala",
  weddingDate: "2026-12-12T10:00:00+05:30",
  countdownEyebrow: "Save the Date",
  countdownTitle: "Counting Down to Forever",
  venueEyebrow: "Find Us",
  venueTitle: "The Venue",
  venueName: "Kadaloram Convention Centre",
  venueAddress: "Beach Road, Kozhikode (Calicut), Kerala 673032 — ample parking on site, 10 minutes from Kozhikode Railway Station.",
  directionsBtnText: "Get Directions",
  directionsUrl: "https://www.google.com/maps/search/?api=1&query=Kadaloram+Convention+Centre+Beach+Road+Kozhikode+Kerala",
  bgImage: "https://one-tawny-two.vercel.app/0001/img/crimson-scroll-bg.webp"
};

/* =========================================================================
   MAIN TEMPLATE COMPONENT
   ========================================================================= */
export default function WeddingInvitationTemplate({
  data = {},
  isDraft = false,
  editable = false,
  onEdit
}) {
  const mergedData = { ...DEFAULT_DATA, ...data };

  // Countdown timer logic
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    const calculateTime = () => {
      const targetDate = new Date(mergedData.weddingDate || "2026-12-12T10:00:00+05:30");
      const now = new Date();
      const diff = Math.max(0, targetDate.getTime() - now.getTime());

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);

      setTimeLeft({ days, hours, minutes });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [mergedData.weddingDate]);

  // Petals generation for floating animation
  const petals = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      left: `${(i * 7.1 + 3.5) % 100}%`,
      size: 6 + ((i * 3) % 9),
      duration: 8 + ((i * 1.7) % 8),
      delay: (i * 0.7) % 7
    }));
  }, []);

  return (
    <div style={{ containerType: 'inline-size', width: '100%', maxWidth: '100%', margin: 0, padding: 0 }}  className="relative w-full min-h-screen bg-[#F7EEDD] text-[#2A1810] font-serif overflow-x-hidden selection:bg-[#E8C97A] selection:text-[#3E0A10]">
      {/* Import Google Fonts dynamically for self-contained rendering */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Italiana&family=Pinyon+Script&family=Jost:wght@300;400;500;600&display=swap');

        .font-cinzel { font-family: 'Cinzel', serif; }
        .font-pinyon { font-family: 'Pinyon Script', cursive; }
        .font-cormorant { font-family: 'Cormorant Garamond', serif; }
        .font-italiana { font-family: 'Italiana', serif; }
        .font-jost { font-family: 'Jost', sans-serif; }
      `}</style>

      {/* =========================================================================
          HERO SECTION
          ========================================================================= */}
      <section className="relative min-h-screen w-full flex items-center justify-center bg-black px-6 pt-24 pb-20 overflow-hidden">
        {/* Hero Background with Rich Crimson Gradient Overlay */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-[center_18%] opacity-90"
          style={{
            backgroundImage: `url('${mergedData.bgImage}')`,
            backgroundColor: '#1E0508'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#1E0508]/45 via-[#140406]/65 to-[#0F0305]/85" />
        </div>

        {/* Floating Petals Animation */}
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          {petals.map((petal) => (
            <motion.div
              key={petal.id}
              initial={{ y: "-10%", rotate: 0, opacity: 0 }}
              animate={{
                y: "115cqh",
                rotate: [0, 90, 180, 260],
                opacity: [0, 0.8, 0.8, 0]
              }}
              transition={{
                duration: petal.duration,
                repeat: Infinity,
                delay: petal.delay,
                ease: "linear"
              }}
              style={{
                left: petal.left,
                width: `${petal.size}px`,
                height: `${petal.size}px`,
                background: "radial-gradient(circle at 35% 35%, #B23A44, #6E1420)",
                borderRadius: "60% 5% 60% 5%"
              }}
              className="absolute"
            />
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-20 w-full max-w-[680px] mx-auto text-center text-[#FBF6EB] flex flex-col items-center">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="font-cinzel text-[clamp(0.75rem,2cqw,0.88rem)] tracking-[0.25em] uppercase text-[#E8C97A] font-medium"
          >
            <Editable
              value={mergedData.heroEyebrow}
              field="heroEyebrow"
              editable={editable}
              onEdit={onEdit}
              placeholder="Together with their families"
            />
          </motion.div>

          {/* Names */}
          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.45 }}
            className="font-pinyon text-[clamp(2.8rem,7.5cqw,4.6rem)] text-[#FBF3E4] leading-[1.15] my-4 [text-shadow:0_4px_24px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3"
          >
            <Editable
              value={mergedData.brideName}
              field="brideName"
              editable={editable}
              onEdit={onEdit}
              placeholder="Bride's Name"
            />
            <span className="text-[0.75em] text-[#E8C97A] [text-shadow:none] font-serif font-light">&amp;</span>
            <Editable
              value={mergedData.groomName}
              field="groomName"
              editable={editable}
              onEdit={onEdit}
              placeholder="Groom's Name"
            />
          </motion.h1>

          {/* Tagline / Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="font-cormorant italic text-[1.15rem] tracking-[0.04em] text-[#F0D6B8] mb-7"
          >
            <Editable
              value={mergedData.heroTagline}
              field="heroTagline"
              editable={editable}
              onEdit={onEdit}
              placeholder="are entering into Nikah, insha'Allah"
            />
          </motion.div>

          {/* Structured Details Glass Card */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.95 }}
            className="w-full max-w-[580px] flex flex-col sm:flex-row items-center justify-around bg-[#1C060A]/60 backdrop-blur-md border border-[#E8C97A]/35 rounded-2xl p-4 sm:p-5 shadow-[0_12px_32px_rgba(0,0,0,0.35)] gap-3 sm:gap-0"
          >
            <div className="flex flex-col items-center gap-1 flex-1 px-2 py-1">
              <span className="font-cinzel text-[0.65rem] tracking-[0.22em] uppercase text-[#E8C97A]/85 font-medium">
                Date
              </span>
              <span className="font-cinzel text-[clamp(0.78rem,1.8cqw,0.92rem)] tracking-[0.08em] text-[#FBF3E4] font-medium text-center">
                <Editable
                  value={mergedData.dateDisplay}
                  field="dateDisplay"
                  editable={editable}
                  onEdit={onEdit}
                  placeholder="Sat, 12 Dec 2026"
                />
              </span>
            </div>

            <div className="w-3/5 sm:w-px h-px sm:h-9 bg-gradient-to-r sm:bg-gradient-to-b from-transparent via-[#E8C97A]/45 to-transparent" />

            <div className="flex flex-col items-center gap-1 flex-1 px-2 py-1">
              <span className="font-cinzel text-[0.65rem] tracking-[0.22em] uppercase text-[#E8C97A]/85 font-medium">
                Ceremony
              </span>
              <span className="font-cinzel text-[clamp(0.78rem,1.8cqw,0.92rem)] tracking-[0.08em] text-[#FBF3E4] font-medium text-center">
                <Editable
                  value={mergedData.ceremonyName}
                  field="ceremonyName"
                  editable={editable}
                  onEdit={onEdit}
                  placeholder="Nikah"
                />
              </span>
            </div>

            <div className="w-3/5 sm:w-px h-px sm:h-9 bg-gradient-to-r sm:bg-gradient-to-b from-transparent via-[#E8C97A]/45 to-transparent" />

            <div className="flex flex-col items-center gap-1 flex-1 px-2 py-1">
              <span className="font-cinzel text-[0.65rem] tracking-[0.22em] uppercase text-[#E8C97A]/85 font-medium">
                Location
              </span>
              <span className="font-cinzel text-[clamp(0.78rem,1.8cqw,0.92rem)] tracking-[0.08em] text-[#FBF3E4] font-medium text-center">
                <Editable
                  value={mergedData.locationShort}
                  field="locationShort"
                  editable={editable}
                  onEdit={onEdit}
                  placeholder="City, State"
                />
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* =========================================================================
          COUNTDOWN SECTION
          ========================================================================= */}
      <section className="relative py-24 px-6 text-center text-[#FBF6EB] overflow-hidden bg-[radial-gradient(ellipse_at_top,#F7EEDD_0%,#F7EEDD_65%,#F7EEDD_100%)]">
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
          className="max-w-[1100px] mx-auto"
        >
          <div className="font-cinzel text-[0.72rem] tracking-[0.28em] uppercase text-[#000000] font-medium">
            <Editable
              value={mergedData.countdownEyebrow}
              field="countdownEyebrow"
              editable={editable}
              onEdit={onEdit}
              placeholder="Save the Date"
            />
          </div>

          <h2 className="font-cinzel text-[clamp(2.1rem,5cqw,3.1rem)] text-[#C9A227] font-medium tracking-[0.06em] mt-2">
            <Editable
              value={mergedData.countdownTitle}
              field="countdownTitle"
              editable={editable}
              onEdit={onEdit}
              placeholder="Counting Down to Forever"
            />
          </h2>

          <div className="flex justify-center items-center gap-[clamp(14px,3cqw,34px)] mt-11 flex-wrap">
            {/* Days */}
            <div className="min-w-[84px] flex flex-col items-center">
              <div className="font-italiana text-[clamp(2.6rem,6cqw,4rem)] text-[#000000] leading-none [font-variant-numeric:tabular-nums] [text-shadow:0_0_24px_rgba(232,201,122,0.35)]">
                {String(timeLeft.days).padStart(2, '0')}
              </div>
              <div className="text-[0.68rem] tracking-[0.2em] uppercase text-[#000000] mt-2 opacity-80 font-cinzel">
                Days
              </div>
            </div>

            {/* Separator */}
            <div className="font-italiana text-[2.2rem] text-[#000000] self-start mt-1.5 opacity-50 select-none">
              :
            </div>

            {/* Hours */}
            <div className="min-w-[84px] flex flex-col items-center">
              <div className="font-italiana text-[clamp(2.6rem,6cqw,4rem)] text-[#000000] leading-none [font-variant-numeric:tabular-nums] [text-shadow:0_0_24px_rgba(232,201,122,0.35)]">
                {String(timeLeft.hours).padStart(2, '0')}
              </div>
              <div className="text-[0.68rem] tracking-[0.2em] uppercase text-[#000000] mt-2 opacity-80 font-cinzel">
                Hours
              </div>
            </div>

            {/* Separator */}
            <div className="font-italiana text-[2.2rem] text-[#000000] self-start mt-1.5 opacity-50 select-none">
              :
            </div>

            {/* Minutes */}
            <div className="min-w-[84px] flex flex-col items-center">
              <div className="font-italiana text-[clamp(2.6rem,6cqw,4rem)] text-[#000000] leading-none [font-variant-numeric:tabular-nums] [text-shadow:0_0_24px_rgba(232,201,122,0.35)]">
                {String(timeLeft.minutes).padStart(2, '0')}
              </div>
              <div className="text-[0.68rem] tracking-[0.2em] uppercase text-[#000000] mt-2 opacity-80 font-cinzel">
                Minutes
              </div>
            </div>
          </div>
        </motion.div>
      </section>






    {/* =========================================================================
    CELEBRATION DESTINATION SECTION
    ========================================================================= */}
<section className="relative min-h-screen py-28 px-6 overflow-hidden bg-[#21050A]">

  {/* Background gradients */}
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(122,18,32,0.8),transparent_32%),radial-gradient(circle_at_80%_75%,rgba(201,162,39,0.18),transparent_28%),linear-gradient(135deg,#21050A_0%,#3E0A10_48%,#160306_100%)]" />

  {/* Decorative glowing orbs */}
  <motion.div
    animate={{
      y: [0, -30, 0],
      x: [0, 15, 0],
      scale: [1, 1.08, 1]
    }}
    transition={{
      duration: 8,
      repeat: Infinity,
      ease: "easeInOut"
    }}
    className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-[#B23A44]/20 blur-3xl"
  />

  <motion.div
    animate={{
      y: [0, 25, 0],
      x: [0, -20, 0],
      scale: [1, 1.12, 1]
    }}
    transition={{
      duration: 10,
      repeat: Infinity,
      ease: "easeInOut"
    }}
    className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#C9A227]/10 blur-3xl"
  />

  {/* Decorative grid */}
  <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(rgba(232,201,122,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(232,201,122,0.5)_1px,transparent_1px)] bg-[size:42px_42px]" />

  <div className="relative z-10 max-w-[1100px] mx-auto">

    {/* SECTION HEADER */}
    <motion.div
      initial={{ opacity: 0, y: 45 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{
        duration: 0.9,
        ease: [0.2, 0.8, 0.2, 1]
      }}
      className="text-center"
    >

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.15 }}
        className="inline-flex items-center gap-3"
      >
        <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#E8C97A]" />

        <span className="font-cinzel text-[0.7rem] tracking-[0.35em] uppercase text-[#E8C97A]">
          <Editable
            value={mergedData.venueEyebrow}
            field="venueEyebrow"
            editable={editable}
            onEdit={onEdit}
            placeholder="Find Us"
          />
        </span>

        <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#E8C97A]" />
      </motion.div>

      <h2 className="font-cinzel text-[clamp(2.4rem,6cqw,4rem)] text-[#FBF6EB] font-medium tracking-[0.05em] mt-5">
        <Editable
          value="A Journey to Our Forever"
          field="venueTitle"
          editable={editable}
          onEdit={onEdit}
          placeholder="A Journey to Our Forever"
        />
      </h2>

      <motion.p
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.25 }}
        className="font-cormorant italic text-[#F0D6B8] text-lg sm:text-xl mt-4"
      >
        Follow the path and celebrate this beautiful beginning with us
      </motion.p>

    </motion.div>


    {/* MAIN DESTINATION CARD */}
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 1,
        delay: 0.15,
        ease: [0.2, 0.8, 0.2, 1]
      }}
      className="relative mt-16 rounded-[2rem] border border-[#E8C97A]/25 bg-[#FBF6EB]/[0.06] backdrop-blur-xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.4)]"
    >

      {/* Top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-px bg-gradient-to-r from-transparent via-[#E8C97A] to-transparent" />


      <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr]">

        {/* LOCATION VISUAL */}
        <motion.div
          initial={{ opacity: 0, x: -45 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.25 }}
          className="relative min-h-[360px] flex items-center justify-center overflow-hidden"
        >

          {/* Inner background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(178,58,68,0.5),transparent_38%),linear-gradient(135deg,#5B0D17,#25050A)]" />

          {/* Animated rings */}
          <motion.div
            animate={{
              scale: [1, 1.35, 1],
              opacity: [0.35, 0.05, 0.35]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeOut"
            }}
            className="absolute w-44 h-44 rounded-full border border-[#E8C97A]/40"
          />

          <motion.div
            animate={{
              scale: [1, 1.7, 1],
              opacity: [0.2, 0.02, 0.2]
            }}
            transition={{
              duration: 3,
              delay: 0.5,
              repeat: Infinity,
              ease: "easeOut"
            }}
            className="absolute w-44 h-44 rounded-full border border-[#E8C97A]/25"
          />


          {/* Compass decoration */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute w-[250px] h-[250px] rounded-full border border-dashed border-[#E8C97A]/20"
          />

          {/* Compass icon */}
          <motion.div
            animate={{
              y: [0, -8, 0],
              rotate: [-2, 2, -2]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative z-10"
          >
            <div className="w-28 h-28 rounded-full flex items-center justify-center bg-gradient-to-br from-[#E8C97A] to-[#B98B3D] shadow-[0_0_50px_rgba(232,201,122,0.45)]">
              <MapPin className="w-12 h-12 text-[#3E0A10] stroke-[1.5]" />
            </div>
          </motion.div>


          {/* Coordinates style decoration */}
          <div className="absolute bottom-8 left-8 font-jost text-[0.6rem] tracking-[0.25em] uppercase text-[#E8C97A]/60">
            Destination · Celebration · Forever
          </div>

        </motion.div>


        {/* VENUE INFORMATION */}
        <motion.div
          initial={{ opacity: 0, x: 45 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.35 }}
          className="relative p-8 sm:p-14 flex flex-col justify-center"
        >

          {/* Icon */}
          <motion.div
            initial={{ opacity: 0, rotate: -20, scale: 0.7 }}
            whileInView={{ opacity: 1, rotate: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.7,
              delay: 0.45,
              type: "spring"
            }}
            className="w-12 h-12 rounded-full border border-[#E8C97A]/40 flex items-center justify-center mb-7"
          >
            <Compass className="w-5 h-5 text-[#E8C97A]" />
          </motion.div>


          <div className="font-cinzel text-[0.65rem] tracking-[0.3em] uppercase text-[#E8C97A]/75 mb-3">
            Our Celebration Awaits
          </div>


          <h3 className="font-cinzel text-[clamp(1.7rem,4cqw,2.5rem)] leading-tight text-[#FBF6EB] font-medium">
            <Editable
              value={mergedData.venueName}
              field="venueName"
              editable={editable}
              onEdit={onEdit}
              placeholder="Venue Name"
            />
          </h3>


          {/* Gold divider */}
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: 90 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="h-px bg-gradient-to-r from-[#E8C97A] to-transparent mt-6 mb-6"
          />


          <p className="font-cormorant text-lg sm:text-xl leading-[1.65] text-[#F0D6B8]/90">
            <Editable
              tag="span"
              multiline
              value={mergedData.venueAddress}
              field="venueAddress"
              editable={editable}
              onEdit={onEdit}
              placeholder="Venue Address and Directions"
            />
          </p>


          {/* Info strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="flex items-center gap-4 mt-8 py-4 border-y border-[#E8C97A]/15"
          >

            <div className="w-10 h-10 rounded-full bg-[#E8C97A]/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-[#E8C97A]" />
            </div>

            <div>
              <div className="font-cinzel text-[0.58rem] tracking-[0.2em] uppercase text-[#E8C97A]/60">
                Location
              </div>

              <div className="font-jost text-sm text-[#FBF6EB]/85 mt-1">
                <Editable
                  value={mergedData.locationShort}
                  field="locationShort"
                  editable={editable}
                  onEdit={onEdit}
                  placeholder="City, State"
                />
              </div>
            </div>

          </motion.div>


          {/* DIRECTIONS BUTTON */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.65 }}
            className="mt-9"
          >

            <a
              href={mergedData.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center gap-4 px-7 py-4 overflow-hidden rounded-full border border-[#E8C97A]/50 bg-[#E8C97A] text-[#3E0A10] transition-all duration-500 hover:scale-[1.04] hover:shadow-[0_0_40px_rgba(232,201,122,0.35)]"
            >

              {/* Animated background */}
              <span className="absolute inset-0 translate-y-full bg-[#FBF6EB] transition-transform duration-500 ease-out group-hover:translate-y-0" />

              <span className="relative z-10 w-9 h-9 rounded-full bg-[#3E0A10] text-[#E8C97A] flex items-center justify-center transition-transform duration-500 group-hover:rotate-45">
                <Navigation className="w-4 h-4 fill-current" />
              </span>

              <span className="relative z-10 font-cinzel text-[0.72rem] tracking-[0.2em] uppercase font-semibold">
                <Editable
                  value={mergedData.directionsBtnText}
                  field="directionsBtnText"
                  editable={editable}
                  onEdit={onEdit}
                  placeholder="Get Directions"
                />
              </span>

              <ExternalLink className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />

            </a>

          </motion.div>

        </motion.div>

      </div>

    </motion.div>


    {/* FINAL MESSAGE */}
    <motion.div
      initial={{ opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.9 }}
      className="text-center mt-20"
    >

      <motion.div
        animate={{
          rotate: [0, 4, -4, 0],
          scale: [1, 1.08, 1]
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="inline-flex"
      >
        ✦
      </motion.div>

      <p className="font-pinyon text-[clamp(2.2rem,6cqw,3.6rem)] text-[#E8C97A] mt-3">
        We can't wait to celebrate with you
      </p>

      <div className="w-24 h-px bg-gradient-to-r from-transparent via-[#E8C97A]/70 to-transparent mx-auto mt-6" />

    </motion.div>

  </div>
</section>



    </div>
  );
}