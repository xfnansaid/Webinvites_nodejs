'use client';

import CelebrationsSection from './CelebrationsSection';
import CouplePhotoSection from './CouplePhotoSection';
import RsvpSection from './RsvpSection';
import React from "react";
import { motion, useInView } from "framer-motion";
import { MapPin, CalendarDays, Sparkles } from "lucide-react";
import SharedEditable from './_Editable';

/* =========================================================
   SCROLL REVEAL
========================================================= */

const revealVariants = {
  hidden: {
    opacity: 0,
    y: 28,
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

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({
        days: String(days).padStart(2, "0"),
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0"),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [values.weddingDate, values.weddingTime]);

  /* =======================================================
     GOOGLE CALENDAR
  ======================================================= */

  const calendarUrl = React.useMemo(() => {
    const start = new Date(`${values.weddingDate} ${values.weddingTime}`);
    if (Number.isNaN(start.getTime())) return "#";

    const end = new Date(start.getTime() + 5 * 60 * 60 * 1000);

    const formatGoogleDate = (date) =>
      date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: values.calendarEventTitle,
      dates: `${formatGoogleDate(start)}/${formatGoogleDate(end)}`,
      details: values.calendarEventDetails,
      location: values.venueAddress || values.venue,
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

  const TimerBox = ({ value, label, labelField }) => (
    <motion.div
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="
        flex min-h-[96px] flex-col items-center justify-center
        rounded-2xl border border-[rgba(212,175,55,0.35)]
        bg-white/90 px-2 py-4
        shadow-[0_3px_12px_rgba(90,60,38,0.05)]
        sm:min-h-[110px] sm:py-5
      "
    >
      <span
        className="
          mb-1 font-['Lora'] text-[clamp(1.6rem,7.5cqw,2.3rem)]
          font-bold leading-none tabular-nums text-[#7a2021]
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
          font-['Lora'] text-[0.6rem] font-semibold uppercase
          tracking-[1.2px] text-[#8c684d]
          sm:text-[0.68rem] sm:tracking-[1.6px]
        "
      />
    </motion.div>
  );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main
      style={{ containerType: 'inline-size', width: '100%', maxWidth: '100%', margin: 0, padding: 0 }}
      className="
        relative min-h-[100dvh] w-full overflow-x-hidden
        bg-[#fdf8f4] font-['Lora'] text-[#5a3c26] antialiased
      "
    >
      {/* ================================================
          HERO SECTION
      ================================================= */}
      <section
        id="hero"
        className="
          relative flex min-h-[100dvh] w-full items-center justify-center
          overflow-hidden bg-cover bg-center bg-no-repeat
          px-4 py-10
          sm:px-6 sm:py-14
          md:px-8
        "
        style={{
          backgroundImage: `url("${values.heroBackgroundImage}")`,
          backgroundPosition: "center center",
        }}
      >
        {/* Soft overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[rgba(253,248,244,0.12)]" />

        <ScrollReveal className="relative z-10 mx-auto flex w-full max-w-[440px] justify-center">
          <div
            className="
              relative w-full overflow-hidden
              rounded-t-[70px] rounded-b-[20px]
              border border-[rgba(212,175,55,0.35)]
              bg-[rgba(253,248,244,0.94)]
              px-5 pb-6 pt-7 text-center
              shadow-[0_8px_28px_rgba(90,60,38,0.1)]
              backdrop-blur-[8px]
              after:pointer-events-none after:absolute after:inset-[7px]
              after:rounded-t-[64px] after:rounded-b-[14px]
              after:border after:border-[rgba(184,134,11,0.2)]
              sm:rounded-t-[100px] sm:rounded-b-[24px]
              sm:px-7 sm:pb-8 sm:pt-10
              sm:after:inset-[9px] sm:after:rounded-t-[92px] sm:after:rounded-b-[16px]
            "
          >
            {/* Monogram */}
            <div
              className="
                relative z-[1] mb-3 inline-flex h-[48px] w-[48px]
                items-center justify-center rounded-full
                border border-[#d4af37] bg-white/70
                shadow-[0_3px_10px_rgba(212,175,55,0.12)]
                sm:mb-3.5 sm:h-[54px] sm:w-[54px]
              "
            >
              <Editable
                value={values.monogram}
                field="monogram"
                onEdit={onEdit}
                editable={editable}
                className="
                  font-['Lora'] text-[0.8rem] font-semibold
                  tracking-[1.8px] text-[#5a3c26]
                  sm:text-[0.92rem]
                "
              />
            </div>

            {/* Tagline */}
            <Editable
              tag="p"
              value={values.heroTagline}
              field="heroTagline"
              onEdit={onEdit}
              editable={editable}
              className="
                relative z-[1] mb-2.5 text-[0.65rem] font-semibold
                uppercase tracking-[1.6px] text-[#8c684d]
                sm:mb-3 sm:text-[0.78rem] sm:tracking-[2.2px]
              "
            />

            {/* Names */}
            <h1
              className="
                relative z-[1] mb-2.5 font-['Great_Vibes']
                text-[clamp(2.4rem,11cqw,4rem)] leading-[1.08]
                text-[#5a3c26]
                [text-shadow:0_1px_2px_rgba(255,255,255,0.85)]
                sm:mb-3 sm:leading-[1.15]
              "
            >
              <Editable
                value={values.brideName}
                field="brideName"
                onEdit={onEdit}
                editable={editable}
                className="font-['Great_Vibes']"
              />
              <span className="my-[-4px] block text-[0.6em] text-[#d4af37]">
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

            {/* Invitation text */}
            <Editable
              tag="p"
              value={values.invitationText}
              field="invitationText"
              onEdit={onEdit}
              editable={editable}
              multiline
              className="
                relative z-[1] mx-auto mb-4 max-w-[280px]
                text-[0.8rem] italic leading-[1.5] text-[#5a3c26]
                sm:mb-5 sm:max-w-[320px] sm:text-[0.92rem]
              "
            />

            {/* Date card – simplified */}
            <div
              className="
                relative z-[1] mb-3.5 rounded-xl
                border border-[rgba(212,175,55,0.3)]
                bg-white/70 px-3 py-2.5
                sm:mb-4 sm:px-4 sm:py-3.5
              "
            >
              <Editable
                tag="div"
                value={values.weddingMonthYear}
                field="weddingMonthYear"
                onEdit={onEdit}
                editable={editable}
                className="
                  mb-1.5 text-[0.68rem] font-semibold uppercase
                  tracking-[1.8px] text-[#8c684d]
                  sm:mb-2 sm:text-[0.78rem] sm:tracking-[2.4px]
                "
              />

              <div className="flex items-center justify-around">
                {/* Day */}
                <div className="flex min-w-0 flex-1 flex-col items-center">
                  <span className="mb-0.5 text-[0.52rem] uppercase tracking-[1px] text-[#8c684d] sm:text-[0.6rem]">
                    DAY
                  </span>
                  <Editable
                    value={values.weddingDay}
                    field="weddingDay"
                    onEdit={onEdit}
                    editable={editable}
                    className="
                      text-[0.65rem] font-semibold tracking-[0.8px] text-[#5a3c26]
                      sm:text-[0.82rem] sm:tracking-[1.2px]
                    "
                  />
                </div>

                <div className="h-7 w-px bg-[rgba(212,175,55,0.35)] sm:h-8" />

                {/* Date number */}
                <div className="flex flex-[0.9] justify-center sm:flex-[1.1]">
                  <Editable
                    value={values.weddingDayNumber}
                    field="weddingDayNumber"
                    onEdit={onEdit}
                    editable={editable}
                    className="text-[1.75rem] font-bold leading-none text-[#5a3c26] sm:text-[2.2rem]"
                  />
                </div>

                <div className="h-7 w-px bg-[rgba(212,175,55,0.35)] sm:h-8" />

                {/* Time */}
                <div className="flex min-w-0 flex-1 flex-col items-center">
                  <span className="mb-0.5 text-[0.52rem] uppercase tracking-[1px] text-[#8c684d] sm:text-[0.6rem]">
                    TIME
                  </span>
                  <Editable
                    value={values.weddingTime}
                    field="weddingTime"
                    onEdit={onEdit}
                    editable={editable}
                    className="
                      whitespace-nowrap text-[0.65rem] font-semibold
                      tracking-[0.8px] text-[#5a3c26]
                      sm:text-[0.82rem] sm:tracking-[1.2px]
                    "
                  />
                </div>
              </div>
            </div>

            {/* Venue – cleaner */}
            <div
              className="
                relative z-[1] mb-3.5 inline-flex max-w-full items-center
                justify-center gap-1.5 rounded-2xl
                border border-dashed border-[rgba(212,175,55,0.35)]
                bg-[rgba(253,248,244,0.85)] px-3 py-2
                sm:gap-2 sm:px-4 sm:py-2.5
              "
            >
              <MapPin
                size={14}
                fill="#8c684d"
                className="shrink-0 text-[#8c684d] sm:h-4 sm:w-4"
              />
              <Editable
                value={values.venueAddress || values.venue}
                field="venueAddress"
                onEdit={onEdit}
                editable={editable}
                multiline
                className="
                  text-center text-[0.65rem] font-medium uppercase
                  tracking-[0.4px] leading-[1.35] text-[#5a3c26]
                  sm:text-[0.8rem] sm:tracking-[0.7px]
                "
              />
            </div>

            {/* Directions button */}
            <a
              href={values.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="
                relative z-[1] mt-1 inline-flex min-h-[42px] items-center
                gap-1.5 rounded-2xl border border-[rgba(212,175,55,0.45)]
                bg-[rgba(212,175,55,0.1)] px-4 py-2
                text-[0.65rem] font-semibold uppercase tracking-[0.12em]
                text-[#5a3c26] transition-colors
                hover:bg-[rgba(212,175,55,0.2)] active:scale-[0.98]
                sm:min-h-[46px] sm:px-5 sm:py-2.5 sm:text-[0.75rem]
              "
            >
              <MapPin size={13} className="shrink-0" />
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
          border-y border-[rgba(212,175,55,0.18)]
          bg-[linear-gradient(180deg,#fdf8f4_0%,#f9f0e8_100%)]
          px-4 py-12 text-center
          sm:px-5 sm:py-16
        "
      >
        <ScrollReveal className="mx-auto max-w-[720px]">
          <div className="mb-6 sm:mb-8">
            <Editable
              tag="h2"
              value={values.countdownTitle}
              field="countdownTitle"
              onEdit={onEdit}
              editable={editable}
              className="
                mb-1 block font-['Great_Vibes']
                text-[clamp(2.3rem,9cqw,3.4rem)] text-[#5a3c26]
              "
            />
            <Editable
              tag="p"
              value={values.countdownSubtitle}
              field="countdownSubtitle"
              onEdit={onEdit}
              editable={editable}
              className="
                block text-[0.68rem] font-semibold uppercase
                tracking-[1.3px] text-[#8c684d]
                sm:text-[0.82rem] sm:tracking-[1.8px]
              "
            />
          </div>

          {isExpired ? (
            <div className="mx-auto max-w-[480px] rounded-2xl border border-[#d6a57c]/25 bg-white/85 p-5 text-center shadow-sm backdrop-blur-sm sm:p-7">
              <div className="mb-2 flex items-center justify-center gap-1.5 sm:gap-2">
                <Sparkles className="h-4 w-4 shrink-0 text-[#c5a059] sm:h-5 sm:w-5" />
                <Editable
                  tag="h3"
                  value={values.countdownEndedTitle}
                  field="countdownEndedTitle"
                  onEdit={onEdit}
                  editable={editable}
                  className="font-['Playfair_Display'] text-xl font-semibold text-[#3d271d] sm:text-2xl"
                  placeholder="Wedding in Progress!"
                />
                <Sparkles className="h-4 w-4 shrink-0 text-[#c5a059] sm:h-5 sm:w-5" />
              </div>
              <Editable
                tag="p"
                value={values.countdownEndedSubtitle}
                field="countdownEndedSubtitle"
                onEdit={onEdit}
                editable={editable}
                className="mx-auto max-w-sm text-[11px] leading-relaxed text-[#7d685d] sm:text-sm"
                placeholder="Thank you for being part of our special celebration!"
                multiline
              />
            </div>
          ) : (
            <div className="mx-auto grid max-w-[480px] grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
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
        className="bg-[#fdf8f4] px-4 py-12 text-center sm:px-5 sm:py-16"
      >
        <ScrollReveal className="mx-auto max-w-[720px]">
          <div
            className="
              mx-auto max-w-[480px] rounded-2xl
              border border-[rgba(212,175,55,0.35)]
              bg-white/90 px-5 py-6
              shadow-[0_8px_24px_rgba(90,60,38,0.08)]
              sm:px-6 sm:py-8
            "
          >
            <div className="mb-4">
              <Editable
                tag="h2"
                value={values.saveTheDateText}
                field="saveTheDateText"
                onEdit={onEdit}
                editable={editable}
                className="
                  mb-1 block font-['Great_Vibes']
                  text-[clamp(2.3rem,9cqw,3.4rem)] text-[#5a3c26]
                "
              />
              <Editable
                tag="p"
                value={values.calendarSubtitle}
                field="calendarSubtitle"
                onEdit={onEdit}
                editable={editable}
                className="
                  block text-[0.68rem] font-semibold uppercase
                  tracking-[1.3px] text-[#8c684d]
                  sm:text-[0.82rem] sm:tracking-[1.8px]
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
                mb-5 block text-[0.84rem] leading-[1.55] text-[#5a3c26]
                sm:text-[0.9rem]
              "
            />

            <div className="flex flex-wrap items-center justify-center">
              <motion.a
                href={calendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -2, backgroundColor: "#5d1718" }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="
                  inline-flex min-h-[46px] items-center justify-center gap-2
                  rounded-full bg-[#7a2021] px-5 py-2.5
                  text-[0.72rem] font-semibold uppercase tracking-[1px]
                  text-white no-underline
                  shadow-[0_3px_10px_rgba(122,32,33,0.18)]
                  sm:min-h-[48px] sm:px-6 sm:text-[0.8rem] sm:tracking-[1.3px]
                "
              >
                <CalendarDays size={16} strokeWidth={2} className="shrink-0" />
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
          SECTIONS + FOOTER
      ================================================= */}
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
        receptionTime={data?.receptionTime || '12:30 PM Onwards'}
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
        theme="light"
      />

      <footer
        className="
          border-t border-[rgba(212,175,55,0.3)]
          bg-[#f4eadf] px-4 py-7 text-center
          text-[0.75rem] text-[#8c684d]
          sm:px-5 sm:py-9 sm:text-[0.82rem]
        "
      >
        <p className="mb-1.5 font-['Great_Vibes'] text-[1.8rem] text-[#5a3c26] sm:text-[2rem]">
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

        <p className="leading-relaxed">
          <Editable
            value={values.rsvpText}
            field="rsvpText"
            onEdit={onEdit}
            editable={editable}
            className="font-['Lora']"
          />
          {" • "}
          <Editable
            value={values.footerDate || values.weddingDate}
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