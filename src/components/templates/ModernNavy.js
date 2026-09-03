'use client';

import CelebrationsSection from './CelebrationsSection';
import CouplePhotoSection from './CouplePhotoSection';
import RsvpSection from './RsvpSection';
import React from "react";
import { motion, useInView } from "framer-motion";
import {
  CalendarDays,
  Clock3,
  MapPin,
  Navigation,
  Sparkles,
} from "lucide-react";
import SharedEditable from './_Editable';

const Reveal = ({
  children,
  delay = 0,
  className = "",
  y = 30,
}) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, {
    once: true,
    amount: 0.15,
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.8,
        delay,
        ease: "easeOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default function WeddingInvitationTemplate({
  data,
  isDraft = false,
  editable = false,
  onEdit,
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

  const defaults = {
    groomName: "Daniel",
    brideName: "Olivia",
    weddingDate: "Saturday, June 17, 2028",
    weddingDateShort: "June 17, 2028",
    weddingTime: "4:00 PM",
    venue: "Borcelle Ballroom",
    venueAddress: "123 Celebration Boulevard, Grand City",

    heroIntro: "Together With Their Families",
    heroTagline: "joyfully invite you to celebrate their wedding day",

    countdownBadge: "Build Excitement",
    countdownTitle: "Counting Down to the Big Day",
    countdownText:
      "Every second brings us closer to celebrating our love together with you!",
    countdownEndedTitle: "Wedding in Progress!",
    countdownEndedSubtitle:
      "Thank you for being part of our special celebration!",

    saveTheDateBadge: "Save to Calendar",
    saveTheDateTitle: "Don't Miss the Celebration",
    saveTheDateText:
      "Instantly add Olivia & Daniel's wedding to your personal calendar so you don't miss a moment.",
    saveTheDateButton: "Save the date",

    venueSectionTitle: "Venue & Directions",
    venueSectionText:
      "We can't wait to welcome you to our wedding venue",
    locationDetailsTitle: "Location Details",

    addressLabel: "Address:",
    ceremonyLabel: "Ceremony Start:",
    parkingLabel: "Guest Parking:",
    parkingText:
      "Complimentary valet parking available at venue entrance.",
    directionsButton: "Get Directions in Google Maps",

    footerMessage: "We look forward to seeing you!",
    backgroundImage:
      "https://one-tawny-two.vercel.app/0009/Blue%20Watercolor%20Illustration%20Wedding%20Invitation.png",

    mapUrl:
      "https://maps.google.com/?q=Borcelle+Ballroom",
    mapsUrl:
      "https://maps.google.com/?q=Borcelle+Ballroom",
    directionsUrl:
      "https://maps.google.com/?q=Borcelle+Ballroom",

    musicUrl: "",
  };

  const baseValues = {
    ...defaults,
    ...(data || {}),
  };
  // Resolve canonical map URL from any field name
  const mapDefaults = baseValues.venue ? `https://maps.google.com/?q=${encodeURIComponent(baseValues.venue)}` : "";
  const canonicalMapUrl = baseValues.mapsUrl || baseValues.mapUrl || baseValues.directionsUrl || mapDefaults;
  const values = { ...baseValues, mapsUrl: canonicalMapUrl, mapUrl: canonicalMapUrl, directionsUrl: canonicalMapUrl };

  const [countdown, setCountdown] = React.useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });
  const [isExpired, setIsExpired] = React.useState(false);

  React.useEffect(() => {
    const updateCountdown = () => {
      const parsedDate = new Date(
        `${values.weddingDate} ${values.weddingTime}`
      ).getTime();

      if (Number.isNaN(parsedDate)) {
        setCountdown({
          days: "00",
          hours: "00",
          minutes: "00",
          seconds: "00",
        });
        return;
      }

      const distance = parsedDate - Date.now();

      if (distance <= 0) {
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
    values.weddingTime,
  ]);

  const coupleNames =
    `${values.brideName} & ${values.groomName}`;

  const saveTheDateDescription =
    values.saveTheDateText
      .replace(
        "Olivia & Daniel",
        coupleNames
      );

  const footerDetails =
    `${values.weddingDateShort} • ${values.venue}`;

  return (
    <main
      style={{ containerType: 'inline-size', width: '100%', maxWidth: '100%', margin: 0, padding: 0 }}
      className="relative min-h-screen overflow-x-hidden bg-[#f4f8fb] font-['Lora'] leading-relaxed text-[#4a5d73]"
    >
      {isDraft && (
        <div className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden">
          <Editable
            tag="div"
            value={values.previewText}
            field="previewText"
            onEdit={onEdit}
            editable={editable}
            className="rotate-[-35deg] select-none whitespace-nowrap text-[18cqw] font-bold tracking-[0.1em] text-[#3b4d66]/[0.07]"
          />
        </div>
      )}

      {/* HERO */}
      <section
        id="hero"
        className="relative flex min-h-[100dvh] items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-12 sm:px-5 sm:py-[60px]"
        style={{
          backgroundImage: `url("${values.backgroundImage}")`,
        }}
      >
        <Reveal className="w-full max-w-[680px]">
          <div className="mx-auto w-full rounded-[20px] border border-white/70 bg-white/[0.88] px-4 py-8 text-center shadow-[0_20px_40px_rgba(43,62,85,0.12)] backdrop-blur-md sm:rounded-[24px] sm:px-[30px] sm:py-[45px]">
            <Editable
              tag="p"
              value={values.heroIntro}
              field="heroIntro"
              onEdit={onEdit}
              editable={editable}
              className="mb-2 font-['Montserrat'] text-[0.75rem] uppercase tracking-[2.5px] text-[#6c7e93] sm:mb-3 sm:text-[0.85rem] sm:tracking-[3px]"
            />

            <Editable
              tag="h1"
              value={coupleNames}
              field="coupleNames"
              onEdit={(field, value) => {
                if (!onEdit) return;

                const parts = value
                  .split("&")
                  .map((part) => part.trim());

                if (parts.length === 2) {
                  onEdit("brideName", parts[0]);
                  onEdit("groomName", parts[1]);
                } else {
                  onEdit(field, value);
                }
              }}
              editable={editable}
              className="mb-3 block font-['Great_Vibes'] text-[clamp(2.6rem,11cqw,5.2rem)] leading-[1.15] text-[#3b4d66] sm:mb-[15px]"
            />

            <Editable
              tag="p"
              value={values.heroTagline}
              field="heroTagline"
              onEdit={onEdit}
              editable={editable}
              className="mb-6 block text-[1rem] italic leading-snug text-[#4a5d73] sm:mb-[30px] sm:text-[1.15rem]"
            />

            <div className="mb-6 flex flex-col justify-center gap-2.5 rounded-2xl border border-dashed border-[#c5a059]/40 bg-[#f4f8fb]/70 p-4 sm:mb-[35px] sm:flex-row sm:flex-wrap sm:gap-5 sm:p-5">
              <div className="flex items-center justify-center gap-2 font-medium text-[#3b4d66] sm:justify-start">
                <CalendarDays className="h-5 w-5 shrink-0 text-[#c5a059] sm:h-[22px] sm:w-[22px]" />
                <Editable
                  value={values.weddingDate}
                  field="weddingDate"
                  onEdit={onEdit}
                  editable={editable}
                  className="text-[0.95rem] sm:text-[1rem]"
                />
              </div>

              <div className="flex items-center justify-center gap-2 font-medium text-[#3b4d66] sm:justify-start">
                <Clock3 className="h-5 w-5 shrink-0 text-[#c5a059] sm:h-[22px] sm:w-[22px]" />
                <Editable
                  value={values.weddingTime}
                  field="weddingTime"
                  onEdit={onEdit}
                  editable={editable}
                  className="text-[0.95rem] sm:text-[1rem]"
                />
              </div>

              <div className="flex items-center justify-center gap-2 font-medium text-[#3b4d66] sm:justify-start">
                <MapPin className="h-5 w-5 shrink-0 text-[#c5a059] sm:h-[22px] sm:w-[22px]" />
                <Editable
                  value={values.venue}
                  field="venue"
                  onEdit={onEdit}
                  editable={editable}
                  className="text-[0.95rem] sm:text-[1rem]"
                />
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* COUNTDOWN */}
      <section
        id="countdown"
        className="bg-gradient-to-b from-white to-[#f4f8fb] px-4 py-14 text-center sm:px-5 sm:py-[90px]"
      >
        <div className="mx-auto w-full max-w-[1200px]">
          <Reveal>
            <Editable
              tag="span"
              value={values.countdownBadge}
              field="countdownBadge"
              onEdit={onEdit}
              editable={editable}
              className="mb-1.5 inline-block font-['Montserrat'] text-[0.75rem] font-semibold uppercase tracking-[2px] text-[#c5a059] sm:mb-2 sm:text-[0.8rem]"
            />
          </Reveal>

          <Reveal delay={0.08}>
            <Editable
              tag="h2"
              value={values.countdownTitle}
              field="countdownTitle"
              onEdit={onEdit}
              editable={editable}
              className="mb-2 block font-['Great_Vibes'] text-[2.4rem] font-medium leading-tight text-[#3b4d66] sm:mb-3 sm:text-[3.5rem]"
            />
          </Reveal>

          <Reveal delay={0.16}>
            <Editable
              tag="p"
              value={values.countdownText}
              field="countdownText"
              onEdit={onEdit}
              editable={editable}
              multiline
              className="mx-auto mb-8 block max-w-[600px] text-[1rem] leading-relaxed text-[#6c7e93] sm:mb-10 sm:text-[1.1rem]"
            />
          </Reveal>

          <Reveal delay={0.24}>
            {isExpired ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mx-auto max-w-[650px] rounded-2xl border border-[#c5a059]/30 bg-white p-5 text-center shadow-[0_12px_32px_rgba(59,77,102,0.08)] sm:p-8"
              >
                <div className="mb-2 flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#c5a059]" />
                  <Editable
                    tag="h3"
                    value={values.countdownEndedTitle}
                    field="countdownEndedTitle"
                    onEdit={onEdit}
                    editable={editable}
                    className="font-['Montserrat'] text-lg font-bold text-[#3b4d66] sm:text-2xl"
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
                  className="mx-auto max-w-[500px] font-['Montserrat'] text-xs leading-relaxed text-[#6c7e93] sm:text-sm"
                  placeholder="Thank you for being part of our special celebration!"
                  multiline
                />
              </motion.div>
            ) : (
              <div className="mx-auto flex max-w-[750px] flex-wrap justify-center gap-2.5 sm:gap-5">
                {[
                  ["days", countdown.days, "Days"],
                  ["hours", countdown.hours, "Hours"],
                  ["minutes", countdown.minutes, "Minutes"],
                  ["seconds", countdown.seconds, "Seconds"],
                ].map(([key, number, label]) => (
                  <motion.div
                    key={key}
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.3 }}
                    className="min-w-[calc(50%-6px)] flex-1 rounded-2xl border border-[#c5a059]/20 bg-white px-2 py-3.5 shadow-[0_12px_32px_rgba(59,77,102,0.08)] hover:border-[#c5a059] sm:min-w-[130px] sm:px-[18px] sm:py-6"
                  >
                    <motion.div
                      key={number}
                      initial={{ opacity: 0.55, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="mb-1 font-['Montserrat'] text-[1.9rem] font-bold leading-none text-[#3b4d66] sm:mb-1.5 sm:text-[2.8rem]"
                    >
                      {number}
                    </motion.div>

                    <div className="font-['Montserrat'] text-[0.7rem] uppercase tracking-[1px] text-[#6c7e93] sm:text-[0.8rem]">
                      {label}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* SAVE TO CALENDAR */}
      <section
        id="calendar"
        className="bg-white px-4 py-12 sm:px-5 sm:py-20"
      >
        <Reveal>
          <div className="mx-auto max-w-[800px] rounded-[16px] border border-[#3b4d66]/10 bg-[#f4f8fb] px-4 py-8 text-center shadow-[0_12px_32px_rgba(59,77,102,0.08)] sm:rounded-[20px] sm:px-[30px] sm:py-10">
            <Editable
              tag="span"
              value={values.saveTheDateBadge}
              field="saveTheDateBadge"
              onEdit={onEdit}
              editable={editable}
              className="mb-1.5 inline-block font-['Montserrat'] text-[0.75rem] font-semibold uppercase tracking-[2px] text-[#c5a059] sm:mb-2 sm:text-[0.8rem]"
            />

            <Editable
              tag="h2"
              value={values.saveTheDateTitle}
              field="saveTheDateTitle"
              onEdit={onEdit}
              editable={editable}
              className="mb-2 block font-['Great_Vibes'] text-[2.3rem] font-medium leading-tight text-[#3b4d66] sm:mb-3 sm:text-[3rem]"
            />

            <Editable
              tag="p"
              value={saveTheDateDescription}
              field="saveTheDateText"
              onEdit={onEdit}
              editable={editable}
              multiline
              className="mx-auto mb-6 block max-w-[600px] text-[1rem] leading-relaxed text-[#6c7e93] sm:mb-[25px] sm:text-[1.1rem]"
            />

            <div className="flex flex-wrap justify-center gap-3">
              <motion.a
                href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                  `${coupleNames}'s Wedding`
                )}&details=${encodeURIComponent(
                  `Join us for a celebration at the wedding of ${coupleNames}!`
                )}&location=${encodeURIComponent(
                  `${values.venue}, ${values.venueAddress}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex min-h-[48px] w-full max-w-[280px] items-center justify-center gap-2 rounded-full bg-[#c5a059] px-6 py-3.5 font-['Montserrat'] text-[0.9rem] font-semibold tracking-[0.5px] text-white shadow-[0_4px_15px_rgba(197,160,89,0.3)] transition hover:bg-[#b08c46] hover:shadow-[0_6px_20px_rgba(197,160,89,0.4)] sm:w-auto sm:px-[26px] sm:py-3"
              >
                <CalendarDays size={18} />
                <Editable
                  value={values.saveTheDateButton}
                  field="saveTheDateButton"
                  onEdit={onEdit}
                  editable={editable}
                  className="text-inherit"
                />
              </motion.a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* VENUE */}
      <section
        id="location"
        className="bg-[#f4f8fb] px-4 py-14 sm:px-5 sm:py-[90px]"
      >
        <Reveal>
          <Editable
            tag="h2"
            value={values.venueSectionTitle}
            field="venueSectionTitle"
            onEdit={onEdit}
            editable={editable}
            className="mb-2 block text-center font-['Great_Vibes'] text-[2.4rem] font-medium leading-tight text-[#3b4d66] sm:mb-3 sm:text-[3.5rem]"
          />
        </Reveal>

        <Reveal delay={0.08}>
          <Editable
            tag="p"
            value={values.venueSectionText}
            field="venueSectionText"
            onEdit={onEdit}
            editable={editable}
            className="mx-auto mb-8 block max-w-[600px] text-center text-[1rem] leading-relaxed text-[#6c7e93] sm:mb-10 sm:text-[1.1rem]"
          />
        </Reveal>

        <Reveal delay={0.16}>
          <div className="mx-auto grid max-w-[950px] overflow-hidden rounded-[20px] bg-white shadow-[0_12px_32px_rgba(59,77,102,0.08)] sm:rounded-[24px] md:grid-cols-[1fr_1.2fr]">
            <div className="flex flex-col justify-center px-4 py-8 sm:px-[30px] sm:py-10">
              <Editable
                tag="span"
                value={values.locationDetailsTitle}
                field="locationDetailsTitle"
                onEdit={onEdit}
                editable={editable}
                className="mb-1.5 inline-block font-['Montserrat'] text-[0.75rem] font-semibold uppercase tracking-[2px] text-[#c5a059] sm:mb-2 sm:text-[0.8rem]"
              />

              <Editable
                tag="h3"
                value={values.venue}
                field="venue"
                onEdit={onEdit}
                editable={editable}
                className="mb-3 block text-[1.5rem] font-medium leading-snug text-[#3b4d66] sm:mb-[15px] sm:text-[1.8rem]"
              />

              <div className="mb-3 flex items-start gap-2.5 text-[#4a5d73] sm:mb-[15px] sm:gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#c5a059] sm:h-[21px] sm:w-[21px]" />
                <div className="min-w-0">
                  <Editable
                    tag="strong"
                    value={values.addressLabel}
                    field="addressLabel"
                    onEdit={onEdit}
                    editable={editable}
                    className="block"
                  />
                  <Editable
                    tag="span"
                    value={values.venueAddress}
                    field="venueAddress"
                    onEdit={onEdit}
                    editable={editable}
                    className="block break-words"
                  />
                </div>
              </div>

              <div className="mb-3 flex items-start gap-2.5 text-[#4a5d73] sm:mb-[15px] sm:gap-3">
                <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-[#c5a059] sm:h-[21px] sm:w-[21px]" />
                <div className="min-w-0">
                  <Editable
                    tag="strong"
                    value={values.ceremonyLabel}
                    field="ceremonyLabel"
                    onEdit={onEdit}
                    editable={editable}
                    className="block"
                  />
                  <Editable
                    tag="span"
                    value={`${values.weddingDate} at ${values.weddingTime}`}
                    field="ceremonyDateTime"
                    onEdit={onEdit}
                    editable={editable}
                    className="block"
                  />
                </div>
              </div>

              <div className="mb-6 flex items-start gap-2.5 text-[#4a5d73] sm:mb-[25px] sm:gap-3">
                <Navigation className="mt-0.5 h-5 w-5 shrink-0 text-[#c5a059] sm:h-[21px] sm:w-[21px]" />
                <div className="min-w-0">
                  <Editable
                    tag="strong"
                    value={values.parkingLabel}
                    field="parkingLabel"
                    onEdit={onEdit}
                    editable={editable}
                    className="block"
                  />
                  <Editable
                    tag="span"
                    value={values.parkingText}
                    field="parkingText"
                    onEdit={onEdit}
                    editable={editable}
                    multiline
                    className="block"
                  />
                </div>
              </div>

              <motion.a
                href={
                  values.mapUrl ||
                  `https://maps.google.com/?q=${encodeURIComponent(
                    values.venue
                  )}`
                }
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 self-start rounded-full bg-[#c5a059] px-6 py-3.5 font-['Montserrat'] text-[0.9rem] font-semibold tracking-[0.5px] text-white shadow-[0_4px_15px_rgba(197,160,89,0.3)] transition hover:bg-[#b08c46] sm:w-fit sm:px-[26px] sm:py-3"
              >
                <MapPin size={18} />
                <Editable
                  value={values.directionsButton}
                  field="directionsButton"
                  onEdit={onEdit}
                  editable={editable}
                />
              </motion.a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FOOTER + SECTIONS */}
      <CelebrationsSection
        showEvents={data?.showEvents !== false}
        theme="navy"
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
        groomName={data?.groomName || values.groomName || 'Groom'}
        brideName={data?.brideName || values.brideName || 'Bride'}
        photoTag={data?.photoTag || 'Memories'}
        photoTitle={data?.photoTitle || 'Moments of Love'}
        photoSubtitle={data?.photoSubtitle || 'Captured memories on our journey to forever'}
        showPhotoSection={data?.showPhotoSection !== false}
        theme="navy"
        editable={editable}
        onEdit={onEdit}
      />

      <RsvpSection
        groomName={data?.groomName || values.groomName || 'Groom'}
        brideName={data?.brideName || values.brideName || 'Bride'}
        whatsappNumber={(data && (data.whatsappNumber || data.phone || data.whatsapp)) || values.whatsappNumber || ''}
        theme="navy"
      />

      <footer className="bg-[#3b4d66] px-4 py-8 text-center text-[0.85rem] text-white/80 sm:px-5 sm:py-10 sm:text-[0.9rem]">
        <Editable
          tag="h3"
          value={coupleNames}
          field="coupleNamesFooter"
          onEdit={(field, value) => {
            if (!onEdit) return;

            const parts = value
              .split("&")
              .map((part) => part.trim());

            if (parts.length === 2) {
              onEdit("brideName", parts[0]);
              onEdit("groomName", parts[1]);
            } else {
              onEdit(field, value);
            }
          }}
          editable={editable}
          className="mb-1.5 block font-['Great_Vibes'] text-[2.1rem] text-white sm:mb-2 sm:text-[2.5rem]"
        />

        <Editable
          tag="p"
          value={footerDetails}
          field="footerDetails"
          onEdit={onEdit}
          editable={editable}
          className="block"
        />

        <Editable
          tag="p"
          value={values.footerMessage}
          field="footerMessage"
          onEdit={onEdit}
          editable={editable}
          className="mt-2 block text-[0.75rem] opacity-60 sm:mt-2.5 sm:text-[0.8rem]"
        />
      </footer>
    </main>
  );
}