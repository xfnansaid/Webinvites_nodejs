'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  MapPin,
  ExternalLink,
  Sparkles,
  ArrowDown,
  Heart,
  Navigation,
  Clock3,
} from 'lucide-react';

import CelebrationsSection from './CelebrationsSection';
import CouplePhotoSection from './CouplePhotoSection';
import RsvpSection from './RsvpSection';
import SharedEditable from './_Editable';

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function WeddingInvitationTemplate({
  data,
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
  /* -------------------------------------------------------
     DEFAULT DATA
  ------------------------------------------------------- */

  const defaults = {
    groomName: 'Arjun',
    brideName: 'Meera',

    heroPre: 'JOIN US TO CELEBRATE',
    heroTitle: 'Our Reception',
    heroTagline: 'A celebration of love by the ocean waves',

    weddingDate: 'Thursday, Dec 1, 2026',
    weddingDateFull: 'Thursday, 1st December 2026',
    weddingTime: '6:00 PM Onwards',

    venue: 'Manthan Beach Resort',
    venueAddress: 'Kapu, Udupi, Karnataka',
    heroLocation: 'Kapu Beach, Udupi',

    countdownTitle: 'Counting Down To The Big Day',
    countdownSubtitle:
      "We can't wait to share this magical moment with you!",

    celebrationStartedText: 'Wedding in Progress!',
    celebrationStartedSubtitle:
      'Thank you for being part of our special celebration!',

    detailsTitle: 'When & Where',
    dateTimeLabel: 'Date & Time',
    venueLabel: 'Venue',

    mapButtonText: 'View on Google Maps',

    mapUrl:
      'https://maps.google.com/?q=Manthan+Beach+Resort+Kapu+Udupi',

    mapsUrl:
      'https://maps.google.com/?q=Manthan+Beach+Resort+Kapu+Udupi',

    directionsUrl:
      'https://maps.google.com/?q=Manthan+Beach+Resort+Kapu+Udupi',

    footerTitle:
      'We look forward to celebrating with you!',

    footerLocation:
      'Kapu Beach • Udupi • Karnataka',

    saveTheDateText: 'Explore The Details',

    rsvpText: 'RSVP',

    musicUrl: '',

    backgroundImage:
      'https://one-tawny-two.vercel.app/0008/img/ivory-arch-thumb.jpg',
  };

  const baseInvitation = {
    ...defaults,
    ...(data || {}),
  };

  /* -------------------------------------------------------
     MAP URL
  ------------------------------------------------------- */

  const mapDefault =
    baseInvitation.venue || baseInvitation.venueAddress
      ? `https://maps.google.com/?q=${encodeURIComponent(
          `${baseInvitation.venue || ''} ${
            baseInvitation.venueAddress || ''
          }`
        )}`
      : '';

  const canonicalMapUrl =
    baseInvitation.mapsUrl ||
    baseInvitation.mapUrl ||
    baseInvitation.directionsUrl ||
    mapDefault;

  const invitation = {
    ...baseInvitation,
    mapsUrl: canonicalMapUrl,
    mapUrl: canonicalMapUrl,
    directionsUrl: canonicalMapUrl,
  };

  /* -------------------------------------------------------
     DATE PARSER
  ------------------------------------------------------- */

  const parseWeddingDate = React.useCallback(() => {
    const combined = `${invitation.weddingDate} ${invitation.weddingTime}`;

    const parsed = new Date(combined);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }

    return new Date('December 1, 2026 18:00:00');
  }, [
    invitation.weddingDate,
    invitation.weddingTime,
  ]);

  /* -------------------------------------------------------
     COUNTDOWN
  ------------------------------------------------------- */

  const [timeLeft, setTimeLeft] = React.useState({
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00',
    finished: false,
  });

  React.useEffect(() => {
    const updateCountdown = () => {
      const target = parseWeddingDate().getTime();
      const distance = target - Date.now();

      if (distance <= 0) {
        setTimeLeft({
          days: '00',
          hours: '00',
          minutes: '00',
          seconds: '00',
          finished: true,
        });

        return;
      }

      const days = Math.floor(
        distance / (1000 * 60 * 60 * 24)
      );

      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) /
          (1000 * 60 * 60)
      );

      const minutes = Math.floor(
        (distance % (1000 * 60 * 60)) /
          (1000 * 60)
      );

      const seconds = Math.floor(
        (distance % (1000 * 60)) / 1000
      );

      setTimeLeft({
        days: String(Math.max(0, days)).padStart(2, '0'),
        hours: String(Math.max(0, hours)).padStart(2, '0'),
        minutes: String(Math.max(0, minutes)).padStart(2, '0'),
        seconds: String(Math.max(0, seconds)).padStart(2, '0'),
        finished: false,
      });
    };

    updateCountdown();

    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [parseWeddingDate]);

  /* -------------------------------------------------------
     SCROLL HELPERS
  ------------------------------------------------------- */

  const scrollToDetails = () => {
    document
      .getElementById('details')
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
  };

  const scrollToCountdown = () => {
    document
      .getElementById('countdown-section')
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
  };

  /* -------------------------------------------------------
     ANIMATION VARIANTS
  ------------------------------------------------------- */

  const fadeUp = {
    hidden: {
      opacity: 0,
      y: 32,
    },

    visible: {
      opacity: 1,
      y: 0,

      transition: {
        duration: 0.75,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const fadeLeft = {
    hidden: {
      opacity: 0,
      x: -30,
    },

    visible: {
      opacity: 1,
      x: 0,

      transition: {
        duration: 0.75,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const fadeRight = {
    hidden: {
      opacity: 0,
      x: 30,
    },

    visible: {
      opacity: 1,
      x: 0,

      transition: {
        duration: 0.75,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const stagger = {
    hidden: {},

    visible: {
      transition: {
        staggerChildren: 0.11,
      },
    },
  };

  const sectionViewport = {
    once: true,
    amount: 0.15,
  };

  /* -------------------------------------------------------
     COUNTDOWN ITEMS
  ------------------------------------------------------- */

  const countdownItems = [
    {
      key: 'days',
      value: timeLeft.days,
      label: 'Days',
    },
    {
      key: 'hours',
      value: timeLeft.hours,
      label: 'Hours',
    },
    {
      key: 'minutes',
      value: timeLeft.minutes,
      label: 'Minutes',
    },
    {
      key: 'seconds',
      value: timeLeft.seconds,
      label: 'Seconds',
    },
  ];

  /* -------------------------------------------------------
     RETURN
  ------------------------------------------------------- */

  return (
    <main
      className="
        relative
        min-h-screen
        w-full
        overflow-x-hidden
        bg-[#f8f5ef]
        text-[#17243a]
        selection:bg-[#c8a96b]
        selection:text-white
      "
      style={{
        containerType: 'inline-size',
        width: '100%',
        maxWidth: '100%',
        width: '100%',
        maxWidth: '100%',
      }}
    >
      {/* ===================================================
          GLOBAL DECORATION
      =================================================== */}

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="
            absolute
            -left-32
            top-20
            h-72
            w-72
            rounded-full
            bg-[#d8c5a0]/10
            blur-3xl
          "
        />

        <div
          className="
            absolute
            -right-32
            top-[45%]
            h-80
            w-80
            rounded-full
            bg-[#1c3557]/5
            blur-3xl
          "
        />
      </div>

      {/* ===================================================
          HERO
      =================================================== */}

      <header
        className="
          relative
          flex
          min-h-[100svh]
          w-full
          items-center
          justify-center
          overflow-hidden
          bg-[#132640]
          px-4
          py-8
          text-white
          sm:px-6
          lg:px-10
        "
        style={{
          backgroundImage: `
            linear-gradient(
              180deg,
              rgba(12,28,48,0.34) 0%,
              rgba(12,28,48,0.48) 50%,
              rgba(12,28,48,0.82) 100%
            ),
            url("${invitation.backgroundImage}")
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark overlay */}

        <div className="absolute inset-0 bg-[#07111f]/15" />

        {/* Decorative glow */}

        <div
          className="
            absolute
            left-1/2
            top-1/2
            h-[420px]
            w-[420px]
            -translate-x-1/2
            -translate-y-1/2
            rounded-full
            border
            border-white/10
            sm:h-[600px]
            sm:w-[600px]
          "
        />

        <div
          className="
            absolute
            left-1/2
            top-1/2
            h-[300px]
            w-[300px]
            -translate-x-1/2
            -translate-y-1/2
            rounded-full
            border
            border-[#d7bb7c]/20
            sm:h-[440px]
            sm:w-[440px]
          "
        />

        {/* Floating particles */}

        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: 12 }).map((_, index) => (
            <motion.span
              key={index}
              className="
                absolute
                h-1
                w-1
                rounded-full
                bg-[#ead7ad]/70
              "
              style={{
                left: `${(index * 29) % 100}%`,
                top: `${70 + ((index * 17) % 30)}%`,
              }}
              animate={{
                y: [-10, -120],
                opacity: [0, 0.7, 0],
              }}
              transition={{
                duration: 5 + (index % 4),
                delay: index * 0.4,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>

        {/* HERO CONTENT */}

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="
            relative
            z-10
            flex
            w-full
            max-w-5xl
            flex-col
            items-center
            text-center
          "
        >
          {/* Top label */}

          <motion.div
            variants={fadeUp}
            className="
              mb-5
              flex
              items-center
              gap-3
              text-[10px]
              font-medium
              uppercase
              tracking-[0.32em]
              text-[#e3cf9f]
              sm:text-xs
              sm:tracking-[0.42em]
            "
          >
            <span className="h-px w-8 bg-[#c8a96b]/80 sm:w-12" />

            <Editable
              value={invitation.heroPre}
              field="heroPre"
              onEdit={onEdit}
              editable={editable}
              placeholder="JOIN US TO CELEBRATE"
            />

            <span className="h-px w-8 bg-[#c8a96b]/80 sm:w-12" />
          </motion.div>

          {/* Couple names */}

          <motion.div
            variants={fadeUp}
            className="
              mb-5
              flex
              max-w-full
              flex-col
              items-center
              justify-center
              leading-none
            "
          >
            <div
              className="
                font-['Playfair_Display']
                text-[clamp(2.4rem,12cqw,4.5rem)]
                break-words
                font-normal
                tracking-[-0.05em]
                text-white
              "
            >
              <Editable
                value={invitation.brideName}
                field="brideName"
                onEdit={onEdit}
                editable={editable}
                placeholder="Meera"
              />
            </div>

            <div
              className="
                -my-1
                flex
                items-center
                gap-3
                text-[#d8bd80]
                sm:-my-2
                sm:gap-5
              "
            >
              <span className="h-px w-8 bg-[#d8bd80]/60 sm:w-14" />

              <Heart
                size={18}
                strokeWidth={1.2}
                className="fill-[#d8bd80]/20"
              />

              <span className="h-px w-8 bg-[#d8bd80]/60 sm:w-14" />
            </div>

            <div
              className="
                font-['Playfair_Display']
                text-[clamp(2.4rem,12cqw,4.5rem)]
                break-words
                font-normal
                tracking-[-0.05em]
                text-white
              "
            >
              <Editable
                value={invitation.groomName}
                field="groomName"
                onEdit={onEdit}
                editable={editable}
                placeholder="Arjun"
              />
            </div>
          </motion.div>

          {/* Reception title */}

          <motion.div
            variants={fadeUp}
            className="
              mb-4
              font-['Great_Vibes']
              text-[clamp(1.8rem,8cqw,3.5rem)]
              break-words
              leading-none
              text-[#d8bd80]
            "
          >
            <Editable
              value={invitation.heroTitle}
              field="heroTitle"
              onEdit={onEdit}
              editable={editable}
              placeholder="Our Reception"
            />
          </motion.div>

          {/* Tagline */}

          <motion.div
            variants={fadeUp}
            className="
              mb-7
              max-w-[580px]
              px-3
              font-['Playfair_Display']
              text-sm
              italic
              leading-7
              text-white/80
              sm:text-lg
              sm:leading-8
            "
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

          {/* Date / location */}

          <motion.div
            variants={fadeUp}
            className="
              mb-8
              grid
              w-full
              max-w-[430px]
              grid-cols-1
              overflow-hidden
              rounded-2xl
              border
              border-white/15
              bg-white/10
              backdrop-blur-md
              sm:grid-cols-2
            "
          >
            <div
              className="
                flex
                min-h-[68px]
                items-center
                justify-center
                gap-3
                border-b
                border-white/10
                px-4
                py-3
                sm:border-b-0
                sm:border-r
              "
            >
              <CalendarDays
                size={18}
                strokeWidth={1.5}
                className="shrink-0 text-[#d8bd80]"
              />

              <Editable
                value={invitation.weddingDate}
                field="weddingDate"
                onEdit={onEdit}
                editable={editable}
                className="text-xs font-medium sm:text-sm"
              />
            </div>

            <div
              className="
                flex
                min-h-[68px]
                items-center
                justify-center
                gap-3
                px-4
                py-3
              "
            >
              <MapPin
                size={18}
                strokeWidth={1.5}
                className="shrink-0 text-[#d8bd80]"
              />

              <Editable
                value={invitation.heroLocation}
                field="heroLocation"
                onEdit={onEdit}
                editable={editable}
                className="text-xs font-medium sm:text-sm"
              />
            </div>
          </motion.div>

          {/* Buttons */}

          <motion.div
            variants={fadeUp}
            className="
              flex
              w-full
              max-w-[430px]
              flex-col
              gap-3
              sm:flex-row
              sm:max-w-none
              sm:justify-center
            "
          >
            <motion.button
              type="button"
              onClick={scrollToDetails}
              whileTap={{ scale: 0.97 }}
              className="
                flex
                min-h-12
                items-center
                justify-center
                gap-2
                rounded-full
                bg-[#d0b477]
                px-7
                text-sm
                font-semibold
                text-[#14253d]
                shadow-[0_12px_35px_rgba(0,0,0,0.22)]
                transition
                hover:bg-[#e0c991]
              "
            >
              <Editable
                value={invitation.saveTheDateText}
                field="saveTheDateText"
                onEdit={onEdit}
                editable={editable}
                placeholder="Explore The Details"
              />

              <ArrowDown size={16} />
            </motion.button>

            <motion.button
              type="button"
              onClick={scrollToCountdown}
              whileTap={{ scale: 0.97 }}
              className="
                flex
                min-h-12
                items-center
                justify-center
                rounded-full
                border
                border-white/40
                bg-white/5
                px-7
                text-sm
                font-medium
                text-white
                backdrop-blur-sm
                transition
                hover:bg-white
                hover:text-[#14253d]
              "
            >
              <Editable
                value={invitation.rsvpText}
                field="rsvpText"
                onEdit={onEdit}
                editable={editable}
                placeholder="RSVP"
              />
            </motion.button>
          </motion.div>

          {/* Scroll hint */}

          <motion.div
            variants={fadeUp}
            className="
              mt-10
              hidden
              items-center
              gap-2
              text-[9px]
              uppercase
              tracking-[0.35em]
              text-white/50
              sm:flex
            "
          >
            <span>Scroll to discover</span>
            <ArrowDown size={12} />
          </motion.div>
        </motion.div>
      </header>

      {/* ===================================================
          INTRO / COUNTDOWN
      =================================================== */}

      <section
        id="countdown-section"
        className="
          relative
          overflow-hidden
          bg-[#f8f5ef]
          px-4
          py-16
          sm:px-6
          sm:py-24
        "
      >
        <div
          className="
            pointer-events-none
            absolute
            left-1/2
            top-0
            h-40
            w-[80%]
            -translate-x-1/2
            rounded-full
            bg-[#d4bd8c]/10
            blur-3xl
          "
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={sectionViewport}
          variants={stagger}
          className="
            relative
            z-10
            mx-auto
            max-w-5xl
            text-center
          "
        >
          <motion.div
            variants={fadeUp}
            className="
              mb-4
              text-[10px]
              font-semibold
              uppercase
              tracking-[0.4em]
              text-[#a38343]
              sm:text-xs
            "
          >
            THE COUNTDOWN
          </motion.div>

          <motion.h2
            variants={fadeUp}
            className="
              mx-auto
              max-w-2xl
              font-['Playfair_Display']
              text-3xl
              font-normal
              leading-tight
              text-[#172b45]
              sm:text-5xl
            "
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
            className="
              mx-auto
              my-6
              flex
              items-center
              justify-center
              gap-3
            "
          >
            <span className="h-px w-10 bg-[#c8a96b]" />

            <Sparkles
              size={15}
              strokeWidth={1.2}
              className="text-[#b39150]"
            />

            <span className="h-px w-10 bg-[#c8a96b]" />
          </motion.div>

          <motion.p
            variants={fadeUp}
            className="
              mx-auto
              mb-10
              max-w-xl
              font-['Playfair_Display']
              text-sm
              italic
              leading-7
              text-[#697386]
              sm:text-base
            "
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
            <motion.div
              variants={fadeUp}
              className="
                mx-auto
                max-w-2xl
                rounded-3xl
                bg-[#172f4e]
                px-6
                py-10
                text-white
                shadow-[0_25px_70px_rgba(23,47,78,0.18)]
                sm:px-10
              "
            >
              <div
                className="
                  mb-3
                  flex
                  items-center
                  justify-center
                  gap-3
                "
              >
                <Sparkles
                  size={18}
                  className="text-[#d5bb7e]"
                />

                <Editable
                  tag="h3"
                  value={
                    invitation.celebrationStartedText ||
                    invitation.countdownEndedTitle
                  }
                  field="celebrationStartedText"
                  onEdit={onEdit}
                  editable={editable}
                  className="
                    font-['Playfair_Display']
                    text-2xl
                    text-[#d5bb7e]
                    sm:text-3xl
                  "
                  placeholder="Wedding in Progress!"
                />

                <Sparkles
                  size={18}
                  className="text-[#d5bb7e]"
                />
              </div>

              <Editable
                tag="p"
                value={
                  invitation.celebrationStartedSubtitle ||
                  invitation.countdownEndedSubtitle
                }
                field="celebrationStartedSubtitle"
                onEdit={onEdit}
                editable={editable}
                className="
                  mx-auto
                  max-w-md
                  text-sm
                  leading-7
                  text-white/75
                "
                placeholder="Thank you for being part of our special celebration!"
                multiline
              />
            </motion.div>
          ) : (
            <motion.div
              variants={stagger}
              className="
                grid
                grid-cols-2
                gap-3
                sm:grid-cols-4
                sm:gap-5
              "
            >
              {countdownItems.map(
                ({ key, value, label }) => (
                  <motion.div
                    key={key}
                    variants={fadeUp}
                    whileHover={{
                      y: -5,
                    }}
                    className="
                      relative
                      overflow-hidden
                      rounded-2xl
                      border
                      border-[#cdb77f]/25
                      bg-white
                      px-3
                      py-5
                      shadow-[0_12px_35px_rgba(23,43,69,0.07)]
                      sm:rounded-3xl
                      sm:px-5
                      sm:py-7
                    "
                  >
                    <div
                      className="
                        absolute
                        left-0
                        top-0
                        h-1
                        w-full
                        bg-gradient-to-r
                        from-[#a9874b]
                        via-[#e3cf9f]
                        to-[#a9874b]
                      "
                    />

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={value}
                        initial={{
                          opacity: 0,
                          y: 8,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        className="
                          font-['Playfair_Display']
                          text-4xl
                          font-medium
                          tracking-tight
                          text-[#172f4e]
                          sm:text-6xl
                        "
                      >
                        {value}
                      </motion.div>
                    </AnimatePresence>

                    <div
                      className="
                        mt-2
                        text-[9px]
                        font-semibold
                        uppercase
                        tracking-[0.22em]
                        text-[#a38343]
                        sm:text-[10px]
                      "
                    >
                      {label}
                    </div>
                  </motion.div>
                )
              )}
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* ===================================================
          EVENT DETAILS
      =================================================== */}

      <section
        id="details"
        className="
          relative
          overflow-hidden
          bg-white
          px-4
          py-16
          sm:px-6
          sm:py-24
        "
      >
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={sectionViewport}
            variants={stagger}
          >
            {/* Section heading */}

            <motion.div
              variants={fadeUp}
              className="mb-10 text-center sm:mb-14"
            >
              <div
                className="
                  mb-4
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.4em]
                  text-[#a38343]
                "
              >
                THE CELEBRATION
              </div>

              <h2
                className="
                  font-['Playfair_Display']
                  text-4xl
                  font-normal
                  text-[#172f4e]
                  sm:text-5xl
                "
              >
                <Editable
                  value={invitation.detailsTitle}
                  field="detailsTitle"
                  onEdit={onEdit}
                  editable={editable}
                />
              </h2>

              <div className="mx-auto mt-5 flex items-center justify-center gap-3">
                <span className="h-px w-10 bg-[#c8a96b]" />
                <Heart
                  size={14}
                  className="text-[#b39150]"
                  strokeWidth={1.2}
                />
                <span className="h-px w-10 bg-[#c8a96b]" />
              </div>
            </motion.div>

            {/* Desktop editorial card */}

            <div
              className="
                grid
                overflow-hidden
                rounded-[28px]
                border
                border-[#e7dfcf]
                bg-[#f8f5ef]
                shadow-[0_25px_70px_rgba(23,43,69,0.08)]
                md:grid-cols-2
              "
            >
              {/* Date */}

              <motion.div
                variants={fadeLeft}
                className="
                  relative
                  flex
                  min-h-[300px]
                  flex-col
                  justify-center
                  px-6
                  py-10
                  text-center
                  md:px-12
                  lg:px-16
                "
              >
                <div
                  className="
                    pointer-events-none
                    absolute
                    right-0
                    top-1/2
                    hidden
                    h-32
                    w-px
                    -translate-y-1/2
                    bg-[#d9c8a5]
                    md:block
                  "
                />

                <div className="mb-5 flex justify-center">
                  <div
                    className="
                      flex
                      h-14
                      w-14
                      items-center
                      justify-center
                      rounded-full
                      border
                      border-[#c8a96b]/40
                      bg-white
                      text-[#a38343]
                    "
                  >
                    <CalendarDays
                      size={22}
                      strokeWidth={1.3}
                    />
                  </div>
                </div>

                <div
                  className="
                    mb-3
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[0.32em]
                    text-[#a38343]
                  "
                >
                  <Editable
                    value={invitation.dateTimeLabel}
                    field="dateTimeLabel"
                    onEdit={onEdit}
                    editable={editable}
                  />
                </div>

                <div
                  className="
                    font-['Playfair_Display']
                    text-2xl
                    leading-snug
                    text-[#172f4e]
                    sm:text-3xl
                  "
                >
                  <Editable
                    value={invitation.weddingDateFull}
                    field="weddingDateFull"
                    onEdit={onEdit}
                    editable={editable}
                  />
                </div>

                <div
                  className="
                    mt-3
                    flex
                    items-center
                    justify-center
                    gap-2
                    text-sm
                    text-[#697386]
                  "
                >
                  <Clock3
                    size={15}
                    strokeWidth={1.4}
                  />

                  <Editable
                    value={invitation.weddingTime}
                    field="weddingTime"
                    onEdit={onEdit}
                    editable={editable}
                  />
                </div>
              </motion.div>

              {/* Venue */}

              <motion.div
                variants={fadeRight}
                className="
                  relative
                  flex
                  min-h-[300px]
                  flex-col
                  justify-center
                  bg-[#172f4e]
                  px-6
                  py-10
                  text-center
                  text-white
                  md:px-12
                  lg:px-16
                "
              >
                <div className="mb-5 flex justify-center">
                  <div
                    className="
                      flex
                      h-14
                      w-14
                      items-center
                      justify-center
                      rounded-full
                      border
                      border-[#d8bd80]/40
                      bg-white/5
                      text-[#d8bd80]
                    "
                  >
                    <MapPin
                      size={22}
                      strokeWidth={1.3}
                    />
                  </div>
                </div>

                <div
                  className="
                    mb-3
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[0.32em]
                    text-[#d8bd80]
                  "
                >
                  <Editable
                    value={invitation.venueLabel}
                    field="venueLabel"
                    onEdit={onEdit}
                    editable={editable}
                  />
                </div>

                <div
                  className="
                    font-['Playfair_Display']
                    text-2xl
                    leading-snug
                    text-white
                    sm:text-3xl
                  "
                >
                  <Editable
                    value={invitation.venue}
                    field="venue"
                    onEdit={onEdit}
                    editable={editable}
                  />
                </div>

                <div
                  className="
                    mx-auto
                    mt-3
                    max-w-sm
                    text-sm
                    leading-6
                    text-white/65
                  "
                >
                  <Editable
                    value={invitation.venueAddress}
                    field="venueAddress"
                    onEdit={onEdit}
                    editable={editable}
                    multiline
                  />
                </div>

                <motion.a
                  href={invitation.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileTap={{ scale: 0.97 }}
                  className="
                    mx-auto
                    mt-7
                    inline-flex
                    min-h-12
                    items-center
                    justify-center
                    gap-2
                    rounded-full
                    border
                    border-[#d8bd80]/60
                    bg-[#d8bd80]
                    px-6
                    text-sm
                    font-semibold
                    text-[#172f4e]
                    transition
                    hover:bg-[#ead6a5]
                  "
                >
                  <Navigation
                    size={16}
                    strokeWidth={1.8}
                  />

                  <Editable
                    value={invitation.mapButtonText}
                    field="mapButtonText"
                    onEdit={onEdit}
                    editable={editable}
                  />

                  <ExternalLink
                    size={14}
                    strokeWidth={1.8}
                  />
                </motion.a>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===================================================
          CELEBRATIONS
      =================================================== */}

      <section className="relative bg-[#f8f5ef]">
        <CelebrationsSection
          showEvents={data?.showEvents !== false}
          theme="light"
          editable={editable}
          onEdit={onEdit}
          subtitle={
            data?.ceremonySubtitle ||
            'PROGRAM OF CELEBRATIONS'
          }
          title={
            data?.ceremonyTitle ||
            'Wedding Celebrations'
          }
          dateLabel={
            data?.eventDateLabel ||
            'The Date'
          }
          dateValue={
            data?.weddingDateFormatted ||
            data?.weddingDate ||
            'Saturday, 12 December 2026'
          }
          dateNote={
            data?.eventDateNote ||
            'Auspicious day of celebration'
          }
          ceremonyLabel={
            data?.ceremonyLabel ||
            'Ceremony & Muhurtham'
          }
          ceremonyTime={
            data?.weddingTime ||
            data?.muhurthamTime ||
            '10:00 AM – 11:30 AM'
          }
          ceremonyNote={
            data?.ceremonyNote ||
            'Solemnization of marriage & blessings'
          }
          receptionLabel={
            data?.receptionLabel ||
            'Reception & Feast'
          }
          receptionTime={
            data?.receptionTime ||
            '12:30 PM Onwards'
          }
          receptionNote={
            data?.receptionNote ||
            'Followed by lunch & celebration'
          }
        />
      </section>

      {/* ===================================================
          COUPLE PHOTO
      =================================================== */}

      <section className="relative bg-white">
        <CouplePhotoSection
          photoUrl={
            data?.photoUrl ||
            data?.heroImage ||
            data?.couplePhoto ||
            ''
          }
          groomName={
            data?.groomName ||
            invitation.groomName ||
            'Groom'
          }
          brideName={
            data?.brideName ||
            invitation.brideName ||
            'Bride'
          }
          photoTag={
            data?.photoTag ||
            'Memories'
          }
          photoTitle={
            data?.photoTitle ||
            'Moments of Love'
          }
          photoSubtitle={
            data?.photoSubtitle ||
            'Captured memories on our journey to forever'
          }
          showPhotoSection={
            data?.showPhotoSection !== false
          }
          theme="light"
          editable={editable}
          onEdit={onEdit}
        />
      </section>

      {/* ===================================================
          RSVP
      =================================================== */}

      <section
        id="rsvp"
        className="
          relative
          overflow-hidden
          bg-[#172f4e]
        "
      >
        <div
          className="
            pointer-events-none
            absolute
            left-1/2
            top-0
            h-80
            w-80
            -translate-x-1/2
            -translate-y-1/2
            rounded-full
            bg-[#d8bd80]/10
            blur-3xl
          "
        />

        <div className="relative z-10">
          <RsvpSection
            groomName={
              data?.groomName ||
              invitation.groomName ||
              'Groom'
            }
            brideName={
              data?.brideName ||
              invitation.brideName ||
              'Bride'
            }
            whatsappNumber={
              (data &&
                (
                  data.whatsappNumber ||
                  data.phone ||
                  data.whatsapp
                )) ||
              invitation.whatsappNumber ||
              ''
            }
            theme="light"
          />
        </div>
      </section>

      {/* ===================================================
          FOOTER
      =================================================== */}

      <motion.footer
        initial={{
          opacity: 0,
          y: 25,
        }}
        whileInView={{
          opacity: 1,
          y: 0,
        }}
        viewport={{
          once: true,
          amount: 0.2,
        }}
        transition={{
          duration: 0.8,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="
          relative
          overflow-hidden
          bg-[#0d1d31]
          px-5
          py-14
          text-center
          text-white
          sm:py-20
        "
      >
        <div
          className="
            pointer-events-none
            absolute
            left-1/2
            top-0
            h-px
            w-24
            -translate-x-1/2
            bg-[#d8bd80]
          "
        />

        <div className="mx-auto max-w-2xl">
          <div
            className="
              mb-5
              flex
              items-center
              justify-center
              gap-3
            "
          >
            <span className="h-px w-10 bg-[#d8bd80]/40" />

            <Heart
              size={16}
              className="text-[#d8bd80]"
              strokeWidth={1.2}
            />

            <span className="h-px w-10 bg-[#d8bd80]/40" />
          </div>

          <h2
            className="
              font-['Playfair_Display']
              text-2xl
              font-normal
              leading-relaxed
              text-white
              sm:text-3xl
            "
          >
            <Editable
              value={invitation.footerTitle}
              field="footerTitle"
              onEdit={onEdit}
              editable={editable}
              multiline
            />
          </h2>

          <p
            className="
              mt-4
              text-[10px]
              uppercase
              tracking-[0.28em]
              text-white/45
              sm:text-xs
            "
          >
            <Editable
              value={invitation.footerLocation}
              field="footerLocation"
              onEdit={onEdit}
              editable={editable}
            />
          </p>

          <div
            className="
              mt-8
              text-[9px]
              uppercase
              tracking-[0.3em]
              text-white/25
            "
          >
            With love • Always
          </div>
        </div>
      </motion.footer>
    </main>
  );
}