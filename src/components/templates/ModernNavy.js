'use client';

import RsvpSection from './RsvpSection';
import React from "react";
import { motion, useInView } from "framer-motion";
import {
  CalendarDays,
  Clock3,
  MapPin,
  Navigation,
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
  onEdit
}) {
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
        setCountdown({
          days: "00",
          hours: "00",
          minutes: "00",
          seconds: "00",
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
    <main style={{ containerType: 'inline-size', width: '100%', maxWidth: '100%', margin: 0, padding: 0 }} 
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
      <section id="hero-section"
        id="hero"
        className="relative flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat px-5 py-[60px]"
        style={{
          backgroundImage: `url("${values.backgroundImage}")`,
        }}
      >
        <Reveal className="w-full max-w-[680px]">
          <div className="mx-auto w-full rounded-[24px] border border-white/70 bg-white/[0.88] px-5 py-[35px] text-center shadow-[0_20px_40px_rgba(43,62,85,0.12)] backdrop-blur-md sm:px-[30px] sm:py-[45px]">
            <Editable
              tag="p"
              value={values.heroIntro}
              field="heroIntro"
              onEdit={onEdit}
              editable={editable}
              className="mb-3 font-['Montserrat'] text-[0.85rem] uppercase tracking-[3px] text-[#6c7e93]"
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
              className="mb-[15px] block font-['Great_Vibes'] text-[clamp(3.2rem,8cqw,5.2rem)] leading-[1.1] text-[#3b4d66]"
            />

            <Editable
              tag="p"
              value={values.heroTagline}
              field="heroTagline"
              onEdit={onEdit}
              editable={editable}
              className="mb-[30px] block text-[1.15rem] italic text-[#4a5d73]"
            />

            <div className="mb-[35px] flex flex-col justify-center gap-3 rounded-2xl border border-dashed border-[#c5a059]/40 bg-[#f4f8fb]/70 p-5 sm:flex-row sm:flex-wrap sm:gap-5">
              <div className="flex items-center gap-2.5 font-medium text-[#3b4d66]">
                <CalendarDays className="h-[22px] w-[22px] shrink-0 text-[#c5a059]" />

                <Editable
                  value={values.weddingDate}
                  field="weddingDate"
                  onEdit={onEdit}
                  editable={editable}
                  className="text-[1rem]"
                />
              </div>

              <div className="flex items-center gap-2.5 font-medium text-[#3b4d66]">
                <Clock3 className="h-[22px] w-[22px] shrink-0 text-[#c5a059]" />

                <Editable
                  value={values.weddingTime}
                  field="weddingTime"
                  onEdit={onEdit}
                  editable={editable}
                  className="text-[1rem]"
                />
              </div>

              <div className="flex items-center gap-2.5 font-medium text-[#3b4d66]">
                <MapPin className="h-[22px] w-[22px] shrink-0 text-[#c5a059]" />

                <Editable
                  value={values.venue}
                  field="venue"
                  onEdit={onEdit}
                  editable={editable}
                  className="text-[1rem]"
                />
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* COUNTDOWN */}
      <section
        id="countdown"
        className="bg-gradient-to-b from-white to-[#f4f8fb] px-5 py-[90px] text-center"
      >
        <div className="mx-auto w-full max-w-[1200px]">
          <Reveal>
            <Editable
              tag="span"
              value={values.countdownBadge}
              field="countdownBadge"
              onEdit={onEdit}
              editable={editable}
              className="mb-2 inline-block font-['Montserrat'] text-[0.8rem] font-semibold uppercase tracking-[2px] text-[#c5a059]"
            />
          </Reveal>

          <Reveal delay={0.08}>
            <Editable
              tag="h2"
              value={values.countdownTitle}
              field="countdownTitle"
              onEdit={onEdit}
              editable={editable}
              className="mb-3 block font-['Great_Vibes'] text-[2.8rem] font-medium text-[#3b4d66] sm:text-[3.5rem]"
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
              className="mx-auto mb-10 block max-w-[600px] text-[1.1rem] text-[#6c7e93]"
            />
          </Reveal>

          <Reveal delay={0.24}>
            <div className="mx-auto flex max-w-[750px] flex-wrap justify-center gap-3 sm:gap-5">
              {[
                ["days", countdown.days, "Days"],
                ["hours", countdown.hours, "Hours"],
                ["minutes", countdown.minutes, "Minutes"],
                ["seconds", countdown.seconds, "Seconds"],
              ].map(([key, number, label]) => (
                <motion.div
                  key={key}
                  whileHover={{
                    y: -5,
                  }}
                  transition={{
                    duration: 0.3,
                  }}
                  className="min-w-[42%] flex-1 rounded-2xl border border-[#c5a059]/20 bg-white px-[10px] py-4 shadow-[0_12px_32px_rgba(59,77,102,0.08)] hover:border-[#c5a059] sm:min-w-[130px] sm:px-[18px] sm:py-6"
                >
                  <motion.div
                    key={number}
                    initial={{
                      opacity: 0.55,
                      y: 4,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 0.25,
                    }}
                    className="mb-1.5 font-['Montserrat'] text-[2.2rem] font-bold leading-none text-[#3b4d66] sm:text-[2.8rem]"
                  >
                    {number}
                  </motion.div>

                  <div className="font-['Montserrat'] text-[0.8rem] uppercase tracking-[1px] text-[#6c7e93]">
                    {label}
                  </div>
                </motion.div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* SAVE TO CALENDAR */}
      <section
        id="calendar"
        className="bg-white px-5 py-20"
      >
        <Reveal>
          <div className="mx-auto max-w-[800px] rounded-[20px] border border-[#3b4d66]/10 bg-[#f4f8fb] px-5 py-10 text-center shadow-[0_12px_32px_rgba(59,77,102,0.08)] sm:px-[30px]">
            <Editable
              tag="span"
              value={values.saveTheDateBadge}
              field="saveTheDateBadge"
              onEdit={onEdit}
              editable={editable}
              className="mb-2 inline-block font-['Montserrat'] text-[0.8rem] font-semibold uppercase tracking-[2px] text-[#c5a059]"
            />

            <Editable
              tag="h2"
              value={values.saveTheDateTitle}
              field="saveTheDateTitle"
              onEdit={onEdit}
              editable={editable}
              className="mb-3 block font-['Great_Vibes'] text-[2.7rem] font-medium text-[#3b4d66] sm:text-[3rem]"
            />

            <Editable
              tag="p"
              value={saveTheDateDescription}
              field="saveTheDateText"
              onEdit={onEdit}
              editable={editable}
              multiline
              className="mx-auto mb-[25px] block max-w-[600px] text-[1.1rem] text-[#6c7e93]"
            />

            <div className="flex flex-wrap justify-center gap-[15px]">
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
                whileHover={{
                  y: -2,
                }}
                whileTap={{
                  scale: 0.98,
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#c5a059] px-[26px] py-3 font-['Montserrat'] text-[0.9rem] font-semibold tracking-[0.5px] text-white shadow-[0_4px_15px_rgba(197,160,89,0.3)] transition hover:bg-[#b08c46] hover:shadow-[0_6px_20px_rgba(197,160,89,0.4)]"
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
        className="bg-[#f4f8fb] px-5 py-[90px]"
      >
        <Reveal>
          <Editable
            tag="h2"
            value={values.venueSectionTitle}
            field="venueSectionTitle"
            onEdit={onEdit}
            editable={editable}
            className="mb-3 block text-center font-['Great_Vibes'] text-[2.8rem] font-medium text-[#3b4d66] sm:text-[3.5rem]"
          />
        </Reveal>

        <Reveal delay={0.08}>
          <Editable
            tag="p"
            value={values.venueSectionText}
            field="venueSectionText"
            onEdit={onEdit}
            editable={editable}
            className="mx-auto mb-10 block max-w-[600px] text-center text-[1.1rem] text-[#6c7e93]"
          />
        </Reveal>

        <Reveal delay={0.16}>
          <div className="mx-auto grid max-w-[950px] overflow-hidden rounded-[24px] bg-white shadow-[0_12px_32px_rgba(59,77,102,0.08)] md:grid-cols-[1fr_1.2fr]">
            <div className="flex flex-col justify-center px-5 py-10 sm:px-[30px]">
              <Editable
                tag="span"
                value={values.locationDetailsTitle}
                field="locationDetailsTitle"
                onEdit={onEdit}
                editable={editable}
                className="mb-2 inline-block font-['Montserrat'] text-[0.8rem] font-semibold uppercase tracking-[2px] text-[#c5a059]"
              />

              <Editable
                tag="h3"
                value={values.venue}
                field="venue"
                onEdit={onEdit}
                editable={editable}
                className="mb-[15px] block text-[1.8rem] font-medium text-[#3b4d66]"
              />

              <div className="mb-[15px] flex items-start gap-3 text-[#4a5d73]">
                <MapPin className="mt-0.5 h-[21px] w-[21px] shrink-0 text-[#c5a059]" />

                <div>
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
                    className="block"
                  />
                </div>
              </div>

              <div className="mb-[15px] flex items-start gap-3 text-[#4a5d73]">
                <Clock3 className="mt-0.5 h-[21px] w-[21px] shrink-0 text-[#c5a059]" />

                <div>
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

              <div className="mb-[25px] flex items-start gap-3 text-[#4a5d73]">
                <Navigation className="mt-0.5 h-[21px] w-[21px] shrink-0 text-[#c5a059]" />

                <div>
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
                whileHover={{
                  y: -2,
                }}
                whileTap={{
                  scale: 0.98,
                }}
                className="inline-flex w-fit items-center justify-center gap-2 self-start rounded-full bg-[#c5a059] px-[26px] py-3 font-['Montserrat'] text-[0.9rem] font-semibold tracking-[0.5px] text-white shadow-[0_4px_15px_rgba(197,160,89,0.3)] transition hover:bg-[#b08c46]"
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

      {/* FOOTER */}
      
        {/* RSVP Section */}
        <RsvpSection
          groomName={data?.groomName || values.groomName || 'Groom'}
          brideName={data?.brideName || values.brideName || 'Bride'}
          whatsappNumber={(data && (data.whatsappNumber || data.phone || data.whatsapp)) || values.whatsappNumber || ''}
        />

        <footer className="bg-[#3b4d66] px-5 py-10 text-center text-[0.9rem] text-white/80">
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
          className="mb-2 block font-['Great_Vibes'] text-[2.5rem] text-white"
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
          className="mt-2.5 block text-[0.8rem] opacity-60"
        />
      </footer>

    </main>
  );
}