'use client';

import CelebrationsSection from './CelebrationsSection';

import CouplePhotoSection from './CouplePhotoSection';

import RsvpSection from './RsvpSection';
import React from "react";
import { motion, useInView } from "framer-motion";
import { MapPin, CalendarDays, Sparkles } from "lucide-react";

/* =========================================================
   EDITABLE COMPONENT — DO NOT MODIFY
========================================================= */

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


/* =========================================================
   SCROLL REVEAL
========================================================= */

const revealVariants = {
  hidden: {
    opacity: 0,
    y: 35,
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

function ScrollReveal({
  children,
  className = "",
  amount = 0.15,
}) {
  const ref = React.useRef(null);

  const isInView = useInView(ref, {
    once: true,
    amount,
  });

  return (
    <motion.div
      ref={ref}
      variants={revealVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}


/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function WeddingInvitationTemplate({
  data,
  isDraft = false,
  editable = false,
  onEdit
}) {

  /* =======================================================
     DEFAULT DATA
  ======================================================= */

  const defaults = {
    groomName: "Sumit Gupta",
    brideName: "Prerna Singh",

    weddingDate: "July 25, 2027",
    weddingMonthYear: "JULY 2027",
    weddingDayNumber: "25",
    weddingDay: "SUNDAY",
    weddingTime: "8:00 AM",

    venue: "123 Anywhere St, Any City, ST 12345",
    venueAddress: "123 Anywhere St, Any City, ST 12345",

    heroTagline: "Together with their families",

    invitationText:
      "cordially invite you to join the occasion of their joyous commitment",

    monogram: "P & S",

    countdownTitle: "Counting Down",
    countdownSubtitle: "Build excitement for the big day",
    countdownEndedTitle: "Wedding in Progress!",
    countdownEndedSubtitle: "Thank you for being part of our special celebration!",

    daysLabel: "Days",
    hoursLabel: "Hours",
    minutesLabel: "Minutes",
    secondsLabel: "Seconds",

    saveTheDateText: "Save to Calendar",

    calendarSubtitle:
      "Guests can instantly add to Calendar",

    calendarDescription:
      "Never miss a moment. Add Prerna & Sumit's wedding celebration to your personal calendar in one click.",

    calendarButtonLabel: "Save the date",

    rsvpText: "With Love & Joy",

    footerDate: "July 25, 2027",

    calendarEventTitle:
      "Prerna & Sumit's Wedding",

    calendarEventDetails:
      "Join us for the joyous wedding celebration of Prerna Singh and Sumit Gupta!",

    heroBackgroundImage:
      "https://one-tawny-two.vercel.app/0007/Beige%20and%20Pink%20Watercolor%20Wedding%20Invitation.png",

    mapsUrl: "https://www.google.com/maps/search/?api=1&query=123+Anywhere+St+Any+City+ST+12345",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=123+Anywhere+St+Any+City+ST+12345",
    directionsUrl: "https://www.google.com/maps/search/?api=1&query=123+Anywhere+St+Any+City+ST+12345",
  };

  const baseValues = {
    ...defaults,
    ...(data || {}),
  };
  // Resolve canonical map URL from any field name
  const mapDefault = (baseValues.venue || baseValues.venueAddress)
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((baseValues.venue || '') + ' ' + (baseValues.venueAddress || ''))}`
    : "";
  const canonicalMapUrl = baseValues.mapsUrl || baseValues.mapUrl || baseValues.directionsUrl || mapDefault;
  const values = { ...baseValues, mapsUrl: canonicalMapUrl, mapUrl: canonicalMapUrl, directionsUrl: canonicalMapUrl };


  /* =======================================================
     COUNTDOWN
  ======================================================= */

  const [countdown, setCountdown] = React.useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });
  const [isExpired, setIsExpired] = React.useState(false);

  React.useEffect(() => {

    const updateCountdown = () => {

      const targetDate = new Date(
        `${values.weddingDate} ${values.weddingTime}`
      ).getTime();

      const now = Date.now();

      const diff = targetDate - now;

      if (!Number.isFinite(targetDate) || diff <= 0) {

        setIsExpired(true);
        setCountdown({
          days: "00",
          hours: "00",
          minutes: "00",
          seconds: "00",
        });

        return;
      }

      setIsExpired(false);

      const days = Math.floor(
        diff / (1000 * 60 * 60 * 24)
      );

      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) /
        (1000 * 60 * 60)
      );

      const minutes = Math.floor(
        (diff % (1000 * 60 * 60)) /
        (1000 * 60)
      );

      const seconds = Math.floor(
        (diff % (1000 * 60)) / 1000
      );

      setCountdown({
        days: String(days).padStart(2, "0"),
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0"),
      });
    };

    updateCountdown();

    const interval = setInterval(
      updateCountdown,
      1000
    );

    return () => clearInterval(interval);

  }, [
    values.weddingDate,
    values.weddingTime
  ]);


  /* =======================================================
     GOOGLE CALENDAR
  ======================================================= */

  const calendarUrl = React.useMemo(() => {

    const start = new Date(
      `${values.weddingDate} ${values.weddingTime}`
    );

    if (Number.isNaN(start.getTime())) {
      return "#";
    }

    const end = new Date(
      start.getTime() +
      5 * 60 * 60 * 1000
    );

    const formatGoogleDate = (date) =>
      date
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}Z$/, "Z");

    const params = new URLSearchParams({
      action: "TEMPLATE",

      text:
        values.calendarEventTitle,

      dates:
        `${formatGoogleDate(start)}/${formatGoogleDate(end)}`,

      details:
        values.calendarEventDetails,

      location:
        values.venueAddress || values.venue,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;

  }, [
    values.weddingDate,
    values.weddingTime,
    values.calendarEventTitle,
    values.calendarEventDetails,
    values.venueAddress,
    values.venue,
  ]);


  /* =======================================================
     TIMER BOX
  ======================================================= */

  const TimerBox = ({
    value,
    label,
    labelField,
  }) => (

    <motion.div
      whileHover={{
        y: -4,
      }}

      whileTap={{
        scale: 0.98,
      }}

      transition={{
        duration: 0.3,
        ease: "easeOut",
      }}

      className="
        flex
        min-h-[110px]
        flex-col
        items-center
        justify-center

        rounded-[16px]

        border
        border-[rgba(212,175,55,0.4)]

        bg-white/90

        px-[10px]
        py-5

        shadow-[0_4px_15px_rgba(90,60,38,0.06)]

        sm:min-h-[125px]
      "
    >

      <span
        className="
          mb-[6px]

          font-['Lora']

          text-[clamp(1.8rem,8cqw,2.6rem)]

          font-bold

          leading-none

          tabular-nums

          text-[#7a2021]
        "
      >
        {value}
      </span>

      <Editable
        value={label}
        field={labelField}
        onEdit={onEdit}
        editable={editable}

        className="
          font-['Lora']

          text-[0.65rem]

          font-semibold

          uppercase

          tracking-[1.5px]

          text-[#8c684d]

          sm:text-[0.72rem]

          sm:tracking-[2px]
        "
      />

    </motion.div>
  );


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <main style={{ containerType: 'inline-size', width: '100%', maxWidth: '100%', margin: 0, padding: 0 }} 
      className="
        relative
        min-h-screen
        w-full
        overflow-x-hidden

        bg-[#fdf8f4]

        font-['Lora']

        text-[#5a3c26]

        antialiased
      "
    >

      {/* ================================================
          PREVIEW WATERMARK
      ================================================= */}

      


      {/* ================================================
          HERO SECTION
      ================================================= */}

      <section id="hero-section"
        id="hero"

        className="
          relative

          flex

          min-h-[100sqh]

          w-full

          items-center
          justify-center

          overflow-hidden

          bg-cover
          bg-center
          bg-no-repeat

          px-3
          py-6

          sm:px-5
          sm:py-10

          md:px-8
        "

        style={{
          backgroundImage:
            `url("${values.heroBackgroundImage}")`,

          backgroundPosition:
            "center center",
        }}
      >

        {/* LIGHT OVERLAY */}

        <div
          className="
            pointer-events-none

            absolute
            inset-0

            bg-[rgba(253,248,244,0.08)]
          "
        />


        {/* HERO CARD */}

        <ScrollReveal
          className="
            relative
            z-10

            mx-auto

            flex
            w-full

            max-w-[480px]

            justify-center
          "
        >

          <div
            className="
              relative

              w-full

              overflow-hidden

              rounded-t-[90px]
              rounded-b-[24px]

              border
              border-[rgba(212,175,55,0.4)]

              bg-[rgba(253,248,244,0.92)]

              px-5
              pb-7
              pt-8

              text-center

              shadow-[0_10px_30px_rgba(90,60,38,0.12)]

              backdrop-blur-[10px]

              after:pointer-events-none

              after:absolute

              after:inset-[8px]

              after:rounded-t-[82px]
              after:rounded-b-[17px]

              after:border

              after:border-[rgba(184,134,11,0.25)]

              sm:rounded-t-[120px]
              sm:rounded-b-[28px]

              sm:px-7
              sm:pb-9
              sm:pt-[45px]

              sm:after:inset-[10px]

              sm:after:rounded-t-[112px]
              sm:after:rounded-b-[20px]
            "
          >

            {/* MONOGRAM */}

            <div
              className="
                relative
                z-[1]

                mb-3

                inline-flex

                h-[52px]
                w-[52px]

                items-center
                justify-center

                rounded-full

                border
                border-[#d4af37]

                bg-white/65

                shadow-[0_4px_12px_rgba(212,175,55,0.15)]

                sm:mb-4

                sm:h-[60px]
                sm:w-[60px]
              "
            >

              <Editable
                value={values.monogram}
                field="monogram"
                onEdit={onEdit}
                editable={editable}

                className="
                  font-['Lora']

                  text-[0.85rem]

                  font-semibold

                  tracking-[2px]

                  text-[#5a3c26]

                  sm:text-[1rem]
                "
              />

            </div>


            {/* HERO TAGLINE */}

            <Editable
              tag="p"

              value={values.heroTagline}

              field="heroTagline"

              onEdit={onEdit}

              editable={editable}

              className="
                relative
                z-[1]

                mb-3

                text-[0.68rem]

                font-semibold

                uppercase

                tracking-[1.8px]

                text-[#8c684d]

                sm:mb-[14px]

                sm:text-[0.85rem]

                sm:tracking-[2.5px]
              "
            />


            {/* NAMES */}

            <h1
              className="
                relative
                z-[1]

                mb-3

                font-['Great_Vibes']

                text-[clamp(2.7rem,12cqw,4.5rem)]

                leading-[1.05]

                text-[#5a3c26]

                [text-shadow:0_1px_2px_rgba(255,255,255,0.9)]

                sm:mb-4

                sm:leading-[1.25]
              "
            >

              <Editable
                value={values.brideName}
                field="brideName"
                onEdit={onEdit}
                editable={editable}
                className="font-['Great_Vibes']"
              />

              <span
                className="
                  my-[-2px]

                  block

                  text-[0.65em]

                  text-[#d4af37]
                "
              >
                &
              </span>

              <Editable
                value={values.groomName}
                field="groomName"
                onEdit={onEdit}
                editable={editable}
                className="font-['Great_Vibes']"
              />

            </h1>


            {/* INVITATION TEXT */}

            <Editable
              tag="p"

              value={values.invitationText}

              field="invitationText"

              onEdit={onEdit}

              editable={editable}

              multiline

              className="
                relative
                z-[1]

                mx-auto

                mb-5

                max-w-[320px]

                text-[0.82rem]

                italic

                leading-[1.55]

                text-[#5a3c26]

                sm:mb-6

                sm:max-w-[360px]

                sm:text-[1rem]
              "
            />


            {/* DATE CARD */}

            <div
              className="
                relative
                z-[1]

                mb-4

                rounded-[14px]

                border

                border-[rgba(212,175,55,0.35)]

                bg-white/65

                px-3
                py-3

                sm:mb-[22px]

                sm:px-[14px]
                sm:py-4
              "
            >

              <Editable
                tag="div"

                value={values.weddingMonthYear}

                field="weddingMonthYear"

                onEdit={onEdit}

                editable={editable}

                className="
                  mb-2

                  text-[0.72rem]

                  font-semibold

                  uppercase

                  tracking-[2px]

                  text-[#8c684d]

                  sm:mb-[10px]

                  sm:text-[0.85rem]

                  sm:tracking-[3px]
                "
              />

              <div
                className="
                  flex

                  items-center

                  justify-around
                "
              >

                {/* DAY */}

                <div
                  className="
                    flex

                    min-w-0
                    flex-1

                    flex-col

                    items-center
                  "
                >

                  <span
                    className="
                      mb-[2px]

                      text-[0.55rem]

                      uppercase

                      tracking-[1px]

                      text-[#8c684d]

                      sm:text-[0.65rem]

                      sm:tracking-[1.5px]
                    "
                  >
                    DAY
                  </span>

                  <Editable
                    value={values.weddingDay}

                    field="weddingDay"

                    onEdit={onEdit}

                    editable={editable}

                    className="
                      text-[0.68rem]

                      font-semibold

                      tracking-[1px]

                      text-[#5a3c26]

                      sm:text-[0.9rem]

                      sm:tracking-[1.5px]
                    "
                  />

                </div>


                <div
                  className="
                    h-8
                    w-px

                    bg-[rgba(212,175,55,0.4)]

                    sm:h-9
                  "
                />


                {/* DATE */}

                <div
                  className="
                    flex

                    flex-[0.8]

                    justify-center

                    sm:flex-[1.2]
                  "
                >

                  <Editable
                    value={values.weddingDayNumber}

                    field="weddingDayNumber"

                    onEdit={onEdit}

                    editable={editable}

                    className="
                      text-[2rem]

                      font-bold

                      leading-none

                      text-[#5a3c26]

                      sm:text-[2.5rem]
                    "
                  />

                </div>


                <div
                  className="
                    h-8
                    w-px

                    bg-[rgba(212,175,55,0.4)]

                    sm:h-9
                  "
                />


                {/* TIME */}

                <div
                  className="
                    flex

                    min-w-0
                    flex-1

                    flex-col

                    items-center
                  "
                >

                  <span
                    className="
                      mb-[2px]

                      text-[0.55rem]

                      uppercase

                      tracking-[1px]

                      text-[#8c684d]

                      sm:text-[0.65rem]

                      sm:tracking-[1.5px]
                    "
                  >
                    TIME
                  </span>

                  <Editable
                    value={values.weddingTime}

                    field="weddingTime"

                    onEdit={onEdit}

                    editable={editable}

                    className="
                      whitespace-nowrap

                      text-[0.68rem]

                      font-semibold

                      tracking-[1px]

                      text-[#5a3c26]

                      sm:text-[0.9rem]

                      sm:tracking-[1.5px]
                    "
                  />

                </div>

              </div>

            </div>


            {/* VENUE */}

            <div
              className="
                relative
                z-[1]

                inline-flex

                max-w-full

                items-center

                justify-center

                gap-2

                rounded-[18px]

                border

                border-dashed

                border-[rgba(212,175,55,0.4)]

                bg-[rgba(253,248,244,0.9)]

                px-3
                py-[9px]

                sm:rounded-[20px]

                sm:px-[18px]
                sm:py-[10px]
              "
            >

              <MapPin
                size={16}
                fill="#8c684d"
                className="
                  shrink-0

                  text-[#8c684d]

                  sm:h-[18px]
                  sm:w-[18px]
                "
              />

              <Editable
                value={
                  values.venueAddress ||
                  values.venue
                }

                field="venueAddress"

                onEdit={onEdit}

                editable={editable}

                multiline

                className="
                  text-center

                  text-[0.68rem]

                  font-medium

                  uppercase

                  tracking-[0.5px]

                  leading-[1.4]

                  text-[#5a3c26]

                  sm:text-[0.88rem]

                  sm:tracking-[1px]
                "
              />

            </div>

            {/* Get Directions Button */}
            <a
              href={values.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="
                mt-4
                inline-flex
                items-center
                gap-2
                px-5
                py-2.5

                rounded-[16px]
                border
                border-[rgba(212,175,55,0.5)]
                bg-[rgba(212,175,55,0.12)]

                text-[#5a3c26]
                text-[0.7rem]
                font-semibold
                uppercase
                tracking-[0.15em]

                hover:bg-[rgba(212,175,55,0.22)]
                transition-colors

                sm:text-[0.8rem]
                sm:px-6
                sm:py-3
              "
            >
              <MapPin size={14} />
              Get Directions
            </a>

          </div>

        </ScrollReveal>

      </section>


      {/* ================================================
          COUNTDOWN SECTION
      ================================================= */}

      <section
        id="countdown"

        className="
          border-y

          border-[rgba(212,175,55,0.2)]

          bg-[linear-gradient(180deg,#fdf8f4_0%,#f9f0e8_100%)]

          px-4
          py-14

          text-center

          sm:px-5
          sm:py-[75px]
        "
      >

        <ScrollReveal
          className="
            mx-auto

            max-w-[800px]
          "
        >

          <div
            className="
              mb-8

              sm:mb-10
            "
          >

            <Editable
              tag="h2"

              value={values.countdownTitle}

              field="countdownTitle"

              onEdit={onEdit}

              editable={editable}

              className="
                mb-[6px]

                block

                font-['Great_Vibes']

                text-[clamp(2.6rem,10cqw,3.8rem)]

                text-[#5a3c26]
              "
            />

            <Editable
              tag="p"

              value={values.countdownSubtitle}

              field="countdownSubtitle"

              onEdit={onEdit}

              editable={editable}

              className="
                block

                text-[0.72rem]

                font-semibold

                uppercase

                tracking-[1.5px]

                text-[#8c684d]

                sm:text-[0.92rem]

                sm:tracking-[2px]
              "
            />

          </div>


          {isExpired ? (
            <div className="mx-auto max-w-[540px] rounded-2xl border border-[#d6a57c]/30 bg-white/80 p-6 sm:p-8 text-center shadow-md backdrop-blur-sm">
              <div className="mb-2 flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-[#c5a059]" />
                <Editable
                  tag="h3"
                  value={values.countdownEndedTitle}
                  field="countdownEndedTitle"
                  onEdit={onEdit}
                  editable={editable}
                  className="font-['Playfair_Display'] text-2xl font-semibold text-[#3d271d] sm:text-3xl"
                  placeholder="Wedding in Progress!"
                />
                <Sparkles className="h-5 w-5 text-[#c5a059]" />
              </div>
              <Editable
                tag="p"
                value={values.countdownEndedSubtitle}
                field="countdownEndedSubtitle"
                onEdit={onEdit}
                editable={editable}
                className="mx-auto max-w-sm text-xs leading-relaxed text-[#7d685d] sm:text-sm"
                placeholder="Thank you for being part of our special celebration!"
                multiline
              />
            </div>
          ) : (
            <div
              className="
                mx-auto
                grid
                max-w-[540px]
                grid-cols-2
                gap-3
                sm:grid-cols-4
                sm:gap-4
              "
            >

              <TimerBox
                value={countdown.days}
                label={values.daysLabel}
                labelField="daysLabel"
              />

              <TimerBox
                value={countdown.hours}
                label={values.hoursLabel}
                labelField="hoursLabel"
              />

              <TimerBox
                value={countdown.minutes}
                label={values.minutesLabel}
                labelField="minutesLabel"
              />

              <TimerBox
                value={countdown.seconds}
                label={values.secondsLabel}
                labelField="secondsLabel"
              />

            </div>
          )}

        </ScrollReveal>

      </section>


      {/* ================================================
          SAVE TO CALENDAR
      ================================================= */}

      <section
        id="calendar"

        className="
          bg-[#fdf8f4]

          px-4
          py-14

          text-center

          sm:px-5
          sm:py-[75px]
        "
      >

        <ScrollReveal
          className="
            mx-auto

            max-w-[800px]
          "
        >

          <div
            className="
              mx-auto

              max-w-[540px]

              rounded-[20px]

              border

              border-[rgba(212,175,55,0.4)]

              bg-white/85

              px-5
              py-7

              shadow-[0_10px_30px_rgba(90,60,38,0.12)]

              sm:px-6
              sm:py-[35px]
            "
          >

            <div
              className="
                mb-5
              "
            >

              <Editable
                tag="h2"

                value={values.saveTheDateText}

                field="saveTheDateText"

                onEdit={onEdit}

                editable={editable}

                className="
                  mb-[6px]

                  block

                  font-['Great_Vibes']

                  text-[clamp(2.6rem,10cqw,3.8rem)]

                  text-[#5a3c26]
                "
              />

              <Editable
                tag="p"

                value={values.calendarSubtitle}

                field="calendarSubtitle"

                onEdit={onEdit}

                editable={editable}

                className="
                  block

                  text-[0.72rem]

                  font-semibold

                  uppercase

                  tracking-[1.5px]

                  text-[#8c684d]

                  sm:text-[0.92rem]

                  sm:tracking-[2px]
                "
              />

            </div>


            <Editable
              tag="p"

              value={values.calendarDescription}

              field="calendarDescription"

              onEdit={onEdit}

              editable={editable}

              multiline

              className="
                mb-5

                block

                text-[0.88rem]

                leading-[1.6]

                text-[#5a3c26]

                sm:text-[0.95rem]
              "
            />


            <div
              className="
                mt-5

                flex

                flex-wrap

                items-center

                justify-center

                gap-[14px]
              "
            >

              <motion.a
                href={calendarUrl}

                target="_blank"

                rel="noopener noreferrer"

                whileHover={{
                  y: -2,
                  backgroundColor: "#5d1718",
                }}

                whileTap={{
                  scale: 0.97,
                }}

                transition={{
                  duration: 0.3,
                  ease: "easeOut",
                }}

                className="
                  inline-flex

                  min-h-[48px]

                  items-center

                  justify-center

                  gap-2

                  rounded-[25px]

                  bg-[#7a2021]

                  px-6
                  py-3

                  text-[0.78rem]

                  font-semibold

                  uppercase

                  tracking-[1.2px]

                  text-white

                  no-underline

                  shadow-[0_4px_12px_rgba(122,32,33,0.2)]

                  sm:text-[0.85rem]

                  sm:tracking-[1.5px]
                "
              >

                <CalendarDays
                  size={18}
                  strokeWidth={2}
                />

                <Editable
                  value={values.calendarButtonLabel}

                  field="calendarButtonLabel"

                  onEdit={onEdit}

                  editable={editable}

                  className="font-['Lora']"
                />

              </motion.a>

            </div>

          </div>

        </ScrollReveal>

      </section>


      {/* ================================================
          FOOTER
      ================================================= */}

      
        {/* RSVP Section */}
        
        {/* Couple Photo Section */}
        
        {/* Celebrations & Program Details Section */}
        <CelebrationsSection
          showEvents={data?.showEvents !== false}
          theme="light"
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
          groomName={values.groomName || 'Groom'}
          brideName={values.brideName || 'Bride'}
          photoTag={data?.photoTag || 'Memories'}
          photoTitle={data?.photoTitle || 'Moments of Love'}
          photoSubtitle={data?.photoSubtitle || 'Captured memories on our journey to forever'}
          showPhotoSection={data?.showPhotoSection !== false}
          theme="light"
          editable={editable}
          onEdit={onEdit}
        />

        <RsvpSection
          groomName={values.groomName || 'Groom'}
          brideName={values.brideName || 'Bride'}
          whatsappNumber={data?.whatsappNumber || data?.phone || data?.whatsapp || values?.whatsappNumber || ''}
        />

        <footer
        className="
          border-t

          border-[rgba(212,175,55,0.4)]

          bg-[#f4eadf]

          px-4
          py-8

          text-center

          text-[0.8rem]

          text-[#8c684d]

          sm:px-5
          sm:py-10

          sm:text-[0.88rem]
        "
      >

        <p
          className="
            mb-2

            font-['Great_Vibes']

            text-[2rem]

            text-[#5a3c26]

            sm:text-[2.2rem]
          "
        >

          <Editable
            value={values.brideName}

            field="brideName"

            onEdit={onEdit}

            editable={editable}

            className="font-['Great_Vibes']"
          />

          {" & "}

          <Editable
            value={values.groomName}

            field="groomName"

            onEdit={onEdit}

            editable={editable}

            className="font-['Great_Vibes']"
          />

        </p>


        <p
          className="
            leading-relaxed
          "
        >

          <Editable
            value={values.rsvpText}

            field="rsvpText"

            onEdit={onEdit}

            editable={editable}

            className="font-['Lora']"
          />

          {" • "}

          <Editable
            value={
              values.footerDate ||
              values.weddingDate
            }

            field="footerDate"

            onEdit={onEdit}

            editable={editable}

            className="font-['Lora']"
          />

        </p>

      </footer>

    </main>
  );
}