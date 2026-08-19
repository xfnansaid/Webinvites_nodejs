'use client';

import React from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  MapPin,
  ExternalLink,
  Volume2,
  VolumeX,
} from "lucide-react";

const Editable = ({ tag: Tag = "span", value, field, onEdit, editable = false, className = "", placeholder = "", multiline = false }) => {
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
          if (!multiline && e.key === "Enter") { e.preventDefault(); commit(); }
          if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); cancel(); }
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

export default function WeddingInvitationTemplate({
  data,
  isDraft = false,
  editable = false,
  onEdit
}) {
  const defaults = {
    groomName: "Arjun",
    brideName: "Meera",

    heroPre: "JOIN US TO CELEBRATE",
    heroTitle: "Our Reception",
    heroTagline: "A celebration of love by the ocean waves",

    weddingDate: "Thursday, Dec 1, 2026",
    weddingDateFull: "Thursday, 1st December 2026",
    weddingTime: "6:00 PM Onwards",

    venue: "Manthan Beach Resort",
    venueAddress: "Kapu, Udupi, Karnataka",
    heroLocation: "Kapu Beach, Udupi",

    countdownTitle: "Counting Down To The Big Day",
    countdownSubtitle: "We can't wait to share this magical moment with you!",
    celebrationStartedText: "The Celebration Has Begun!",

    detailsTitle: "When & Where",
    dateTimeLabel: "Date & Time",
    venueLabel: "Venue",

    mapButtonText: "View on Google Maps",
    mapUrl:
      "https://maps.google.com/?q=Manthan+Beach+Resort+Kapu+Udupi",
    mapsUrl:
      "https://maps.google.com/?q=Manthan+Beach+Resort+Kapu+Udupi",
    directionsUrl:
      "https://maps.google.com/?q=Manthan+Beach+Resort+Kapu+Udupi",

    footerTitle: "We look forward to celebrating with you!",
    footerLocation: "Kapu Beach • Udupi • Karnataka",

    saveTheDateText: "Save the Date",
    rsvpText: "We can't wait to celebrate with you!",

    musicUrl: "",
  };

  const baseInvitation = {
    ...defaults,
    ...(data || {}),
  };
  // Resolve canonical map URL from any field name
  const mapDefault = baseInvitation.venue || baseInvitation.venueAddress
    ? `https://maps.google.com/?q=${encodeURIComponent((baseInvitation.venue || '') + ' ' + (baseInvitation.venueAddress || ''))}`
    : "";
  const canonicalMapUrl = baseInvitation.mapsUrl || baseInvitation.mapUrl || baseInvitation.directionsUrl || mapDefault;
  const invitation = { ...baseInvitation, mapsUrl: canonicalMapUrl, mapUrl: canonicalMapUrl, directionsUrl: canonicalMapUrl };

  const parseWeddingDate = React.useCallback(() => {
    const combined = `${invitation.weddingDate} ${invitation.weddingTime}`;

    const parsed = new Date(combined);

    if (!Number.isNaN(parsed.getTime())) return parsed;

    return new Date("December 1, 2026 18:00:00");
  }, [invitation.weddingDate, invitation.weddingTime]);

  const [timeLeft, setTimeLeft] = React.useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
    finished: false,
  });

  const [musicPlaying, setMusicPlaying] = React.useState(false);
  const audioRef = React.useRef(null);

  React.useEffect(() => {
    const updateCountdown = () => {
      const target = parseWeddingDate().getTime();
      const distance = target - Date.now();

      if (distance <= 0) {
        setTimeLeft({
          days: "00",
          hours: "00",
          minutes: "00",
          seconds: "00",
          finished: true,
        });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor(
        (distance % (1000 * 60 * 60)) / (1000 * 60)
      );
      const seconds = Math.floor(
        (distance % (1000 * 60)) / 1000
      );

      setTimeLeft({
        days: String(Math.max(0, days)).padStart(2, "0"),
        hours: String(Math.max(0, hours)).padStart(2, "0"),
        minutes: String(Math.max(0, minutes)).padStart(2, "0"),
        seconds: String(Math.max(0, seconds)).padStart(2, "0"),
        finished: false,
      });
    };

    updateCountdown();

    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [parseWeddingDate]);

  const toggleMusic = async () => {
    if (!audioRef.current || !invitation.musicUrl) return;

    try {
      if (audioRef.current.paused) {
        await audioRef.current.play();
        setMusicPlaying(true);
      } else {
        audioRef.current.pause();
        setMusicPlaying(false);
      }
    } catch {
      setMusicPlaying(false);
    }
  };

  const scrollToDetails = () => {
    document
      .getElementById("details")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToCountdown = () => {
    document
      .getElementById("countdown-section")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const fadeUp = {
    hidden: {
      opacity: 0,
      y: 40,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const staggerContainer = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const backgroundImage =
    "https://one-tawny-two.vercel.app/0008/img/ivory-arch-thumb.jpg";

  return (
    <main style={{ containerType: 'inline-size', width: '100%', maxWidth: '100%', margin: 0, padding: 0 }}  className="relative min-h-screen overflow-x-hidden bg-[#f8f9fa] font-['Poppins'] text-[#333333]">

      

      {invitation.musicUrl && (
        <audio
          ref={audioRef}
          src={invitation.musicUrl}
          loop
          onEnded={() => setMusicPlaying(false)}
        />
      )}

      {/* HERO */}
      <header
        className="relative flex min-h-[650px] h-screen items-center justify-center overflow-hidden bg-cover bg-center bg-fixed px-5 text-center text-white"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(15,44,89,0.75) 0%, rgba(29,93,155,0.6) 50%, rgba(197,160,89,0.4) 100%), url("${backgroundImage}")`,
        }}
      >
        {/* Decorative floating particles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 18 }).map((_, index) => (
            <motion.span
              key={index}
              className="absolute h-1 w-1 rounded-full bg-[#f1e4c3]/70"
              initial={{
                x: `${(index * 17) % 100}vw`,
                y: "110cqh",
                opacity: 0,
              }}
              animate={{
                y: "-10cqh",
                opacity: [0, 0.8, 0],
              }}
              transition={{
                duration: 8 + (index % 6) * 1.2,
                repeat: Infinity,
                delay: index * 0.35,
                ease: "linear",
              }}
            />
          ))}
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative z-10 w-full max-w-[700px] rounded-[24px] border border-white/20 bg-white/10 px-5 py-[35px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-[12px] sm:px-10 sm:py-[50px]"
        >
          <motion.div
            variants={fadeUp}
            className="mb-[15px] text-[0.85rem] font-medium uppercase tracking-[5px] text-[#c5a059]"
          >
            <Editable
              value={invitation.heroPre}
              field="heroPre"
              onEdit={onEdit}
              editable={editable}
              placeholder="JOIN US TO CELEBRATE"
            />
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mb-[10px] bg-gradient-to-r from-white via-[#f1e4c3] to-[#c5a059] bg-clip-text font-['Great_Vibes'] text-[3.8rem] font-normal leading-none text-transparent drop-shadow-[0_5px_15px_rgba(0,0,0,0.1)] sm:text-[5.5rem]"
          >
            <Editable
              value={invitation.heroTitle}
              field="heroTitle"
              onEdit={onEdit}
              editable={editable}
              placeholder="Our Reception"
            />
          </motion.h1>

          <motion.div
            variants={fadeUp}
            className="mb-[25px] font-['Playfair_Display'] text-[1.1rem] italic text-[#e0e0e0] sm:text-[1.3rem]"
          >
            <Editable
              value={invitation.heroTagline}
              field="heroTagline"
              onEdit={onEdit}
              editable={editable}
              placeholder="A celebration of love by the ocean waves"
              multiline
            />
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mb-[35px] flex flex-col items-center justify-center gap-[10px] text-[0.95rem] sm:flex-row sm:gap-5"
          >
            <motion.div
              whileHover={{ y: -2, scale: 1.02 }}
              className="flex items-center gap-2 rounded-[20px] border border-[#c5a059] bg-[#0f2c59]/60 px-[18px] py-2"
            >
              <CalendarDays size={16} className="text-[#f1e4c3]" />
              <Editable
                value={invitation.weddingDate}
                field="weddingDate"
                onEdit={onEdit}
                editable={editable}
              />
            </motion.div>

            <motion.div
              whileHover={{ y: -2, scale: 1.02 }}
              className="flex items-center gap-2 rounded-[20px] border border-[#c5a059] bg-[#0f2c59]/60 px-[18px] py-2"
            >
              <MapPin size={16} className="text-[#f1e4c3]" />
              <Editable
                value={invitation.heroLocation}
                field="heroLocation"
                onEdit={onEdit}
                editable={editable}
              />
            </motion.div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="flex flex-wrap justify-center gap-[15px]"
          >
            <motion.button
              type="button"
              onClick={scrollToDetails}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              className="rounded-[30px] border-2 border-[#c5a059] bg-[#c5a059] px-8 py-[14px] text-[0.95rem] font-medium tracking-[1px] text-white shadow-[0_0_20px_rgba(197,160,89,0.4)] transition hover:bg-transparent hover:text-[#c5a059] hover:shadow-[0_5px_25px_rgba(197,160,89,0.6)]"
            >
              <Editable
                value={invitation.saveTheDateText}
                field="saveTheDateText"
                onEdit={onEdit}
                editable={editable}
              />
            </motion.button>

            <motion.button
              type="button"
              onClick={scrollToCountdown}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              className="rounded-[30px] border-2 border-white/60 bg-transparent px-8 py-[14px] text-[0.95rem] font-medium tracking-[1px] text-white transition hover:border-white hover:bg-white hover:text-[#0f2c59]"
            >
              <Editable
                value={invitation.rsvpText}
                field="rsvpText"
                onEdit={onEdit}
                editable={editable}
              />
            </motion.button>
          </motion.div>
        </motion.div>
      </header>

      {/* COUNTDOWN */}
      <section
        id="countdown-section"
        className="max-w-none bg-gradient-to-b from-[#f8f9fa] to-[#edf2f7] px-5 py-[70px] text-center"
      >
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={staggerContainer}
          className="mx-auto max-w-[900px]"
        >
          <motion.h2
            variants={fadeUp}
            className="mb-[10px] font-['Playfair_Display'] text-[2.1rem] text-[#0f2c59] sm:text-[2.5rem]"
          >
            <Editable
              value={invitation.countdownTitle}
              field="countdownTitle"
              onEdit={onEdit}
              editable={editable}
              multiline
            />
          </motion.h2>

          <motion.div
            variants={fadeUp}
            className="mx-auto mb-10 h-[3px] w-[60px] bg-[#c5a059]"
          />

          <motion.p
            variants={fadeUp}
            className="mb-[25px] font-['Playfair_Display'] text-[1.1rem] italic text-[#1d5d9b]"
          >
            <Editable
              value={invitation.countdownSubtitle}
              field="countdownSubtitle"
              onEdit={onEdit}
              editable={editable}
              multiline
            />
          </motion.p>

          {timeLeft.finished ? (
            <motion.h3
              variants={fadeUp}
              className="font-['Playfair_Display'] text-2xl text-[#c5a059]"
            >
              <Editable
                value={invitation.celebrationStartedText}
                field="celebrationStartedText"
                onEdit={onEdit}
                editable={editable}
              />
            </motion.h3>
          ) : (
            <motion.div
              variants={staggerContainer}
              className="mt-[25px] flex flex-wrap justify-center gap-3 sm:gap-6"
            >
              {[
                ["days", timeLeft.days, "Days"],
                ["hours", timeLeft.hours, "Hours"],
                ["minutes", timeLeft.minutes, "Minutes"],
                ["seconds", timeLeft.seconds, "Seconds"],
              ].map(([key, value, label]) => (
                <motion.div
                  key={key}
                  variants={fadeUp}
                  whileHover={{
                    y: -6,
                    scale: 1.04,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 18,
                  }}
                  className="relative flex h-[80px] w-[75px] flex-col items-center justify-center overflow-hidden rounded-[16px] border border-[#c5a059]/40 bg-gradient-to-br from-[#0f2c59] to-[#1a4175] px-[5px] py-[10px] shadow-[0_10px_25px_rgba(15,44,89,0.25)] before:absolute before:left-0 before:top-0 before:h-1 before:w-full before:bg-gradient-to-r before:from-[#c5a059] before:to-[#f1e4c3] hover:border-[#c5a059] hover:shadow-[0_15px_30px_rgba(197,160,89,0.35)] sm:h-[115px] sm:w-[115px] sm:px-[10px] sm:py-[18px]"
                >
                  <motion.span
                    key={value}
                    initial={{ opacity: 0.3, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-['Playfair_Display'] text-[1.6rem] font-semibold leading-none text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.2)] sm:text-[2.5rem]"
                  >
                    {value}
                  </motion.span>

                  <span className="mt-1 text-[0.65rem] font-medium uppercase tracking-[1px] text-[#c5a059] sm:mt-2 sm:text-[0.75rem] sm:tracking-[2px]">
                    {label}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* EVENT DETAILS */}
      <section
        id="details"
        className="mx-auto max-w-[900px] px-5 py-[80px] text-center"
      >
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          <motion.h2
            variants={fadeUp}
            className="mb-[10px] font-['Playfair_Display'] text-[2.1rem] text-[#0f2c59] sm:text-[2.5rem]"
          >
            <Editable
              value={invitation.detailsTitle}
              field="detailsTitle"
              onEdit={onEdit}
              editable={editable}
            />
          </motion.h2>

          <motion.div
            variants={fadeUp}
            className="mx-auto mb-10 h-[3px] w-[60px] bg-[#c5a059]"
          />

          <motion.div
            variants={fadeUp}
            className="rounded-[15px] border-t-[5px] border-[#1d5d9b] bg-white p-[25px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] sm:p-10"
          >
            <div className="mb-[25px]">
              <h4 className="mb-[5px] text-[0.85rem] uppercase tracking-[2px] text-[#c5a059]">
                <Editable
                  value={invitation.dateTimeLabel}
                  field="dateTimeLabel"
                  onEdit={onEdit}
                  editable={editable}
                />
              </h4>

              <p className="text-[1.2rem] font-medium text-[#0f2c59]">
                <Editable
                  value={invitation.weddingDateFull}
                  field="weddingDateFull"
                  onEdit={onEdit}
                  editable={editable}
                />
              </p>

              <span className="block text-[0.95rem] text-[#666666]">
                <Editable
                  value={invitation.weddingTime}
                  field="weddingTime"
                  onEdit={onEdit}
                  editable={editable}
                />
              </span>
            </div>

            <div className="mb-[25px]">
              <h4 className="mb-[5px] text-[0.85rem] uppercase tracking-[2px] text-[#c5a059]">
                <Editable
                  value={invitation.venueLabel}
                  field="venueLabel"
                  onEdit={onEdit}
                  editable={editable}
                />
              </h4>

              <p className="text-[1.2rem] font-medium text-[#0f2c59]">
                <Editable
                  value={invitation.venue}
                  field="venue"
                  onEdit={onEdit}
                  editable={editable}
                />
              </p>

              <span className="block text-[0.95rem] text-[#666666]">
                <Editable
                  value={invitation.venueAddress}
                  field="venueAddress"
                  onEdit={onEdit}
                  editable={editable}
                  multiline
                />
              </span>
            </div>

            <motion.a
              href={invitation.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="mt-[10px] inline-flex items-center gap-2 rounded-[30px] bg-[#1d5d9b] px-[30px] py-3 font-medium text-white transition hover:bg-[#174a7b]"
            >
              <ExternalLink size={17} />

              <Editable
                value={invitation.mapButtonText}
                field="mapButtonText"
                onEdit={onEdit}
                editable={editable}
              />
            </motion.a>
          </motion.div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <motion.footer
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{
          duration: 0.7,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="bg-[#0f2c59] px-5 py-10 text-center text-white"
      >
        <h2 className="font-['Playfair_Display'] text-[1.6rem] sm:text-[2rem]">
          <Editable
            value={invitation.footerTitle}
            field="footerTitle"
            onEdit={onEdit}
            editable={editable}
            multiline
          />
        </h2>

        <p className="mt-[10px] font-['Poppins'] text-[0.85rem] text-[#cccccc]">
          <Editable
            value={invitation.footerLocation}
            field="footerLocation"
            onEdit={onEdit}
            editable={editable}
          />
        </p>
      </motion.footer>

      {/* MUSIC TOGGLE */}
      {invitation.musicUrl && (
        <motion.button
          type="button"
          onClick={toggleMusic}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          aria-label="Toggle background music"
          className="fixed bottom-[26px] right-[22px] z-[600] flex h-[56px] w-[56px] items-center justify-center rounded-full bg-[#1d5d9b] text-[#f1e4c3] shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
        >
          {musicPlaying ? (
            <>
              <Volume2 size={26} />

              <motion.span
                initial={{ opacity: 0, x: 0, y: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  x: [0, 8],
                  y: [0, -26],
                }}
                transition={{
                  duration: 2.2,
                  ease: "easeIn",
                  repeat: Infinity,
                }}
                className="absolute right-[-2px] top-[-6px] text-[0.6rem] text-[#f1e4c3]"
              >
                ♪
              </motion.span>
            </>
          ) : (
            <VolumeX size={26} />
          )}
        </motion.button>
      )}
    </main>
  );
}