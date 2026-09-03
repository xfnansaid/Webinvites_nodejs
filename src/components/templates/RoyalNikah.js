'use client';

import CelebrationsSection from './CelebrationsSection';
import CouplePhotoSection from './CouplePhotoSection';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Sparkles } from 'lucide-react';
import RsvpSection from './RsvpSection';
import SharedEditable from './_Editable';

// ==========================================
// DEFAULT DATA
// ==========================================
const DEFAULT_DATA = {
  groomName: 'FAHAD',
  brideName: 'AYESHA',

  eyebrowMalayalam: 'വിവാഹ ക്ഷണം',
  eyebrowEnglish: 'Royal Malabar Nikah',

  weddingDate: '2026-10-18T10:30:00',
  dateDisplay: 'October 18, 2026',
  locationDisplay: 'Kozhikode, Kerala',

  heroImage:
    'https://i.pinimg.com/474x/24/0f/5b/240f5bef281adfd33597e641f448654f.jpg',

  sealText: '• BLESSINGS • ALHAMDULILLAH ',

  venueTag: 'Royal Venue',
  venueName: 'The Raviz Kadavu',
  venueCity: 'Kozhikode (Calicut), Kerala',

  venueAddress:
    'NH 66, Bypass Road, Azhinjilam, Kerala 673632.\nJoin us as we celebrate love, heritage, and togetherness.',

  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=The+Raviz+Kadavu+Kozhikode',

  mapUrl:
    'https://www.google.com/maps/search/?api=1&query=The+Raviz+Kadavu+Kozhikode',

  directionsUrl:
    'https://www.google.com/maps/search/?api=1&query=The+Raviz+Kadavu+Kozhikode',

  countdownTitle: 'Counting Down To Forever',

  countdownEndedTitle: 'Wedding in Progress!',

  countdownEndedSubtitle:
    'Thank you for celebrating this blessed occasion with us.',

  footerBlessing:
    'With blessings from family & friends • Malabar, Kerala • October 2026'
};

// ==========================================
// MAIN TEMPLATE COMPONENT
// ==========================================
export default function WeddingTemplate({
  data = {},
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

  // ==========================================
  // MERGE DATA
  // ==========================================
  const baseData = {
    ...DEFAULT_DATA,
    ...data
  };

  // ==========================================
  // CANONICAL MAP URL
  // ==========================================
  const mapDefault =
    baseData.venueName ||
    baseData.venueCity ||
    baseData.venueAddress
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${baseData.venueName || ''} ${baseData.venueCity || ''} ${baseData.venueAddress || ''}`
        )}`
      : '';

  const canonicalMapUrl =
    baseData.mapsUrl ||
    baseData.mapUrl ||
    baseData.directionsUrl ||
    mapDefault;

  const mergedData = {
    ...baseData,
    mapsUrl: canonicalMapUrl,
    mapUrl: canonicalMapUrl,
    directionsUrl: canonicalMapUrl
  };

  // ==========================================
  // INITIALS
  // ==========================================
  const groomInitial = mergedData.groomName
    ? mergedData.groomName.trim().charAt(0).toUpperCase()
    : 'F';

  const brideInitial = mergedData.brideName
    ? mergedData.brideName.trim().charAt(0).toUpperCase()
    : 'A';

  const monogram = `${groomInitial} & ${brideInitial}`;
  const sealMonogram = `${groomInitial}&${brideInitial}`;

  // ==========================================
  // COUNTDOWN
  // ==========================================
  const [timeLeft, setTimeLeft] = useState({
    days: '00',
    hours: '00',
    mins: '00',
    secs: '00'
  });

  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const targetDate = new Date(
      mergedData.weddingDate || '2026-10-18T10:30:00'
    ).getTime();

    const calculateTimeLeft = () => {
      const now = Date.now();
      const difference = targetDate - now;

      if (Number.isNaN(difference) || difference <= 0) {
        setIsExpired(true);
        setTimeLeft({
          days: '00',
          hours: '00',
          mins: '00',
          secs: '00'
        });
        return;
      }

      setIsExpired(false);

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const mins = Math.floor(
        (difference % (1000 * 60 * 60)) / (1000 * 60)
      );
      const secs = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({
        days: String(days).padStart(2, '0'),
        hours: String(hours).padStart(2, '0'),
        mins: String(mins).padStart(2, '0'),
        secs: String(secs).padStart(2, '0')
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [mergedData.weddingDate]);

  // ==========================================
  // COUNTDOWN DATA
  // ==========================================
  const countdownItems = [
    { key: 'days', label: 'Days' },
    { key: 'hours', label: 'Hours' },
    { key: 'mins', label: 'Mins' },
    { key: 'secs', label: 'Secs' }
  ];

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div
      style={{
        containerType: 'inline-size',
        width: '100%',
        maxWidth: '100%',
        margin: 0,
        padding: 0,
        overflowX: 'clip'
      }}
      className="
        relative min-h-[100dvh]
        overflow-x-clip
        bg-[#061412]
        text-[#F7F5F0]
        antialiased
        selection:bg-[#D4AF37]/30
        selection:text-[#F4E096]
      "
    >
      {/* ==================================================
          HERO SECTION
          ================================================== */}
      <section
        id="hero-section"
        className="
          relative z-10 w-full overflow-hidden
          bg-[radial-gradient(circle_at_50%_15%,_#0B2420_0%,_#061412_58%,_#040D0B_100%)]
          px-4 py-10
          sm:px-6 sm:py-14
          md:px-8 md:py-18
          lg:flex lg:min-h-[100dvh] lg:items-center lg:px-[6%] lg:py-16
        "
      >
        <div
          className="
            mx-auto flex w-full max-w-7xl flex-col items-center
            gap-8
            sm:gap-10
            md:gap-12
            lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12
          "
        >
          {/* LEFT SIDE — NAMES */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1]
            }}
            className="
              flex w-full min-w-0 flex-col items-center text-center
              lg:items-start lg:text-left
            "
          >
            {/* EYEBROW */}
            <div
              className="
                flex max-w-full flex-wrap items-center justify-center gap-2
                sm:gap-3
                lg:justify-start lg:gap-4
              "
            >
              <Editable
                tag="span"
                value={mergedData.eyebrowMalayalam}
                field="eyebrowMalayalam"
                onEdit={onEdit}
                editable={editable}
                className="
                  max-w-[48cqw] break-words font-malayalam
                  text-[0.8rem] text-[#D4AF37]
                  sm:text-[1rem]
                  md:text-[1.1rem]
                "
                placeholder="വിവാഹ ക്ഷണം"
              />

              <div
                className="
                  h-px w-4 shrink-0 bg-[#D4AF37]/60
                  sm:w-8
                  md:w-10
                "
              />

              <Editable
                tag="span"
                value={mergedData.eyebrowEnglish}
                field="eyebrowEnglish"
                onEdit={onEdit}
                editable={editable}
                className="
                  max-w-[48cqw] break-words font-jakarta
                  text-[0.55rem] font-medium uppercase tracking-[1.8px] text-[#A3B8B5]
                  sm:text-[0.65rem] sm:tracking-[3px]
                  md:text-[0.75rem] md:tracking-[4px]
                "
                placeholder="Royal Malabar Nikah"
              />
            </div>

            {/* COUPLE NAMES */}
            <div
              className="
                mt-5 flex w-full min-w-0 flex-col items-center
                sm:mt-6
                lg:items-start
              "
            >
              {/* GROOM */}
              <h1
                className="
                  m-0 max-w-full break-words text-center
                  font-cinzel font-semibold leading-[0.95] tracking-[-0.02em] text-[#F7F5F0]
                  text-[clamp(2rem,10.5cqw,3.8rem)]
                  lg:text-left lg:text-[clamp(2.5rem,10cqw,4.2rem)]
                "
              >
                <Editable
                  tag="span"
                  value={mergedData.groomName}
                  field="groomName"
                  onEdit={onEdit}
                  editable={editable}
                  placeholder="GROOM"
                />
              </h1>

              {/* AMPERSAND */}
              <div
                className="
                  my-1.5 font-amiri italic text-[#F4E096]
                  text-[1.6rem]
                  sm:my-2 sm:text-[2rem]
                  md:text-[2.2rem]
                  lg:ml-8
                "
              >
                &amp;
              </div>

              {/* BRIDE */}
              <h1
                className="
                  m-0 max-w-full break-words text-center
                  font-cinzel font-semibold leading-[0.95] tracking-[-0.02em] text-[#F7F5F0]
                  text-[clamp(2rem,10.5cqw,3.8rem)]
                  lg:text-left lg:text-[clamp(2.5rem,10cqw,4.2rem)]
                "
              >
                <Editable
                  tag="span"
                  value={mergedData.brideName}
                  field="brideName"
                  onEdit={onEdit}
                  editable={editable}
                  placeholder="BRIDE"
                />
              </h1>
            </div>

            {/* DATE / LOCATION */}
            <div
              className="
                mt-5 flex w-full max-w-[95cqw] flex-wrap items-center justify-center
                gap-x-1.5 gap-y-1 break-words
                font-jakarta text-[0.58rem] font-normal uppercase tracking-[1.2px] text-[#A3B8B5]
                sm:mt-6 sm:text-[0.7rem] sm:tracking-[1.8px]
                md:text-[0.8rem] md:tracking-[2px]
                lg:justify-start
              "
            >
              <Editable
                tag="span"
                value={mergedData.dateDisplay}
                field="dateDisplay"
                onEdit={onEdit}
                editable={editable}
                className="break-words"
                placeholder="October 18, 2026"
              />

              <span className="shrink-0">•</span>

              <Editable
                tag="span"
                value={mergedData.locationDisplay}
                field="locationDisplay"
                onEdit={onEdit}
                editable={editable}
                className="break-words"
                placeholder="Kozhikode, Kerala"
              />
            </div>
          </motion.div>

          {/* RIGHT SIDE — IMAGE */}
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.9,
              delay: 0.12,
              ease: [0.16, 1, 0.3, 1]
            }}
            className="relative flex w-full min-w-0 justify-center"
          >
            {/* IMAGE FRAME */}
            <div
              className="
                relative w-[min(86cqw,360px)] aspect-[0.76/1]
                rounded-t-[45%] rounded-b-[16px]
                bg-gradient-to-br from-[#D4AF37] via-[#8A6F1C] to-[#5C4812]
                p-[2.5px]
                shadow-[0_20px_40px_rgba(0,0,0,0.55)]
                sm:w-[min(88cqw,380px)] sm:rounded-b-[18px] sm:p-[3px]
                sm:shadow-[0_25px_50px_rgba(0,0,0,0.55)]
              "
            >
              <div
                className="
                  relative h-full w-full overflow-hidden
                  rounded-t-[43%] rounded-b-[13px]
                  bg-[#0B2420]
                  sm:rounded-b-[15px]
                "
              >
                <img
                  src={mergedData.heroImage}
                  alt={`${mergedData.groomName} & ${mergedData.brideName} Royal Nikah`}
                  className="
                    h-full w-full object-cover contrast-105 brightness-95
                    transition-transform duration-1000 ease-out
                    lg:hover:scale-105
                  "
                />

                <div
                  className="
                    pointer-events-none absolute inset-0
                    bg-gradient-to-t from-[#061412]/35 via-transparent to-[#D4AF37]/5
                  "
                />
              </div>
            </div>

            {/* ROTATING SEAL */}
            <div
              className="
                absolute bottom-[-18px] left-[calc(50%-42%)] z-20
                flex aspect-square w-[74px] items-center justify-center
                rounded-full border border-[#D4AF37] bg-[#061412]
                shadow-[0_8px_20px_rgba(0,0,0,0.55)]
                sm:bottom-[-22px] sm:left-[calc(50%-38%)] sm:w-[90px]
                md:w-[100px]
                lg:bottom-[-22px] lg:left-[calc(50%-34%)] lg:w-[110px]
              "
            >
              <motion.svg
                animate={{ rotate: 360 }}
                transition={{
                  duration: 16,
                  repeat: Infinity,
                  ease: 'linear'
                }}
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 100 100"
                aria-hidden="true"
              >
                <path
                  id="circlePathReact"
                  d="M 50,50 m -37,0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
                  fill="none"
                />
                <text
                  fontSize="10"
                  fontFamily="'Plus Jakarta Sans', sans-serif"
                  fontWeight="600"
                  fill="#D4AF37"
                  letterSpacing="1.5"
                >
                  <textPath href="#circlePathReact">
                    {mergedData.sealText}
                  </textPath>
                </text>
              </motion.svg>

              <span
                className="
                  relative z-10 select-none font-amiri font-bold text-[#F4E096]
                  text-[0.9rem]
                  sm:text-[1.1rem]
                  md:text-[1.25rem]
                "
              >
                {sealMonogram}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==================================================
          VENUE + COUNTDOWN SECTION
          ================================================== */}
      <section
        className="
          relative z-10 w-full overflow-hidden
          border-t border-[#D4AF37]/20
          bg-[radial-gradient(circle_at_80%_20%,_#0B2420_0%,_#061412_65%,_#040D0B_100%)]
          px-4 py-12
          sm:px-6 sm:py-20
          md:px-8 md:py-24
          lg:px-[6%] lg:py-32
        "
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{
            duration: 0.8,
            ease: [0.16, 1, 0.3, 1]
          }}
          className="
            mx-auto grid w-full max-w-5xl min-w-0
            grid-cols-1 gap-4
            rounded-[18px] border border-[#D4AF37]/30
            bg-[#12332E]/45 p-3.5
            shadow-[0_20px_50px_rgba(0,0,0,0.45)]
            backdrop-blur-xl
            sm:gap-5 sm:rounded-[22px] sm:p-5
            md:gap-6 md:rounded-[26px] md:p-7
            lg:grid-cols-2 lg:gap-8 lg:p-10
          "
        >
          {/* VENUE */}
          <div
            className="
              flex min-w-0 flex-col
              rounded-[14px] border border-[#D4AF37]/10
              bg-black/10 p-4 text-center
              sm:rounded-[16px] sm:p-6
              md:p-7
              lg:text-left
            "
          >
            <Editable
              tag="span"
              value={mergedData.venueTag}
              field="venueTag"
              onEdit={onEdit}
              editable={editable}
              className="
                mb-2.5 block font-jakarta
                text-[0.58rem] font-semibold uppercase tracking-[2px] text-[#D4AF37]
                sm:mb-3 sm:text-[0.7rem] sm:tracking-[3px]
                md:text-[0.75rem] md:tracking-[4px]
              "
              placeholder="Royal Venue"
            />

            <h3
              className="
                mb-2.5 min-w-0 break-words font-cinzel font-semibold leading-snug text-[#F7F5F0]
                text-[1.35rem]
                sm:mb-3 sm:text-[1.7rem]
                md:text-2xl
                lg:text-[2.2rem]
              "
            >
              <Editable
                tag="span"
                value={mergedData.venueName}
                field="venueName"
                onEdit={onEdit}
                editable={editable}
                placeholder="The Raviz Kadavu"
              />
            </h3>

            <p
              className="
                mb-1.5 break-words font-jakarta font-medium text-[#F4E096]
                text-[0.9rem]
                sm:mb-2 sm:text-[1rem]
                md:text-[1.1rem]
              "
            >
              <Editable
                tag="span"
                value={mergedData.venueCity}
                field="venueCity"
                onEdit={onEdit}
                editable={editable}
                placeholder="Kozhikode (Calicut), Kerala"
              />
            </p>

            <p
              className="
                break-words whitespace-pre-line font-jakarta font-light leading-[1.6] text-[#A3B8B5]
                text-[0.8rem]
                sm:text-[0.88rem]
                md:text-[0.95rem]
              "
            >
              <Editable
                tag="span"
                value={mergedData.venueAddress}
                field="venueAddress"
                onEdit={onEdit}
                editable={editable}
                multiline
                placeholder="NH 66, Bypass Road, Azhinjilam, Kerala 673632. Join us as we celebrate love, heritage, and togetherness."
              />
            </p>

            {/* GOOGLE MAPS */}
            <a
              href={mergedData.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="
                mt-4 inline-flex min-h-[46px] w-full items-center justify-center gap-2
                rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10
                px-4 py-3
                font-jakarta text-[10px] font-semibold uppercase tracking-[0.12em] text-[#F4E096]
                transition-colors duration-300
                hover:bg-[#D4AF37]/20
                active:scale-[0.98]
                sm:mt-5 sm:text-[11px] sm:tracking-[0.15em]
                lg:w-fit lg:justify-start
              "
            >
              <MapPin size={14} className="shrink-0" />
              <span>View on Google Maps</span>
            </a>
          </div>

          {/* COUNTDOWN */}
          <div
            className="
              flex min-w-0 flex-col items-center justify-center
              rounded-[14px] border border-[#D4AF37]/15
              bg-black/30 p-4 text-center shadow-inner
              sm:rounded-[16px] sm:p-6
              md:p-7
            "
          >
            <Editable
              tag="span"
              value={mergedData.countdownTitle}
              field="countdownTitle"
              onEdit={onEdit}
              editable={editable}
              className="
                mb-4 max-w-full break-words font-jakarta
                text-[0.58rem] font-medium uppercase tracking-[1.8px] text-[#A3B8B5]
                sm:mb-5 sm:text-[0.7rem] sm:tracking-[2.5px]
                md:text-[0.75rem] md:tracking-[3px]
              "
              placeholder="Counting Down To Forever"
            />

            {isExpired ? (
              <div className="w-full py-1.5 text-center sm:py-2">
                <div className="mb-2 flex items-center justify-center gap-1.5 sm:gap-2">
                  <Sparkles className="h-4 w-4 shrink-0 text-[#D4AF37] sm:h-5 sm:w-5" />
                  <Editable
                    tag="h3"
                    value={mergedData.countdownEndedTitle}
                    field="countdownEndedTitle"
                    onEdit={onEdit}
                    editable={editable}
                    className="
                      max-w-[72%] break-words font-cinzel font-bold text-[#F4E096]
                      text-base
                      sm:text-xl
                      md:text-2xl
                    "
                    placeholder="Wedding in Progress!"
                  />
                  <Sparkles className="h-4 w-4 shrink-0 text-[#D4AF37] sm:h-5 sm:w-5" />
                </div>

                <Editable
                  tag="p"
                  value={mergedData.countdownEndedSubtitle}
                  field="countdownEndedSubtitle"
                  onEdit={onEdit}
                  editable={editable}
                  multiline
                  className="
                    mx-auto max-w-xs break-words font-jakarta leading-relaxed text-[#A3B8B5]
                    text-[0.7rem]
                    sm:text-xs
                    md:text-sm
                  "
                  placeholder="Thank you for celebrating this blessed occasion with us."
                />
              </div>
            ) : (
              <div
                className="
                  grid w-full grid-cols-4
                  gap-1.5
                  sm:gap-2.5
                  md:gap-3.5
                "
              >
                {countdownItems.map(({ key, label }) => (
                  <div
                    key={key}
                    className="
                      flex min-w-0 flex-col items-center
                      rounded-lg border border-[#D4AF37]/10
                      bg-[#061412]/60
                      px-1 py-2.5
                      sm:rounded-xl sm:px-2 sm:py-3.5
                    "
                  >
                    <span
                      className="
                        font-cinzel font-bold leading-none text-[#F4E096]
                        text-[1.25rem]
                        sm:text-[1.7rem]
                        md:text-[2.1rem]
                        lg:text-[2.2rem]
                      "
                    >
                      {timeLeft[key]}
                    </span>

                    <span
                      className="
                        mt-1.5 font-jakarta uppercase text-[#A3B8B5]
                        text-[0.45rem] tracking-[0.8px]
                        sm:mt-2 sm:text-[0.55rem] sm:tracking-[1.3px]
                        md:text-[0.62rem] md:tracking-[1.8px]
                      "
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {/* ==================================================
          RSVP / PHOTO / CELEBRATIONS
          ================================================== */}
      <div className="w-full min-w-0 overflow-hidden">
        <CelebrationsSection
          showEvents={data?.showEvents !== false}
          theme="royal-nikah"
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
          groomName={mergedData.groomName || 'Groom'}
          brideName={mergedData.brideName || 'Bride'}
          photoTag={data?.photoTag || 'Memories'}
          photoTitle={data?.photoTitle || 'Moments of Love'}
          photoSubtitle={
            data?.photoSubtitle || 'Captured memories on our journey to forever'
          }
          showPhotoSection={data?.showPhotoSection !== false}
          theme="royal-nikah"
          editable={editable}
          onEdit={onEdit}
        />

        <RsvpSection
          groomName={mergedData.groomName || 'Groom'}
          brideName={mergedData.brideName || 'Bride'}
          whatsappNumber={
            data?.whatsappNumber ||
            data?.phone ||
            data?.whatsapp ||
            mergedData?.whatsappNumber ||
            ''
          }
          theme="royal-nikah"
        />
      </div>

      {/* ==================================================
          FOOTER
          ================================================== */}
      <footer
        className="
          relative z-10 w-full overflow-hidden
          border-t border-[#D4AF37]/15 bg-[#030A09]
          px-4 py-8 text-center
          sm:px-6 sm:py-11
          md:py-13
        "
      >
        <div
          className="
            mb-2.5 break-words font-cinzel font-semibold tracking-[1.8px] text-[#D4AF37]
            text-lg
            sm:mb-3 sm:text-2xl sm:tracking-[3px]
            lg:text-3xl lg:tracking-[4px]
          "
        >
          {monogram}
        </div>

        <p
          className="
            mx-auto max-w-2xl break-words font-jakarta uppercase leading-relaxed text-[#A3B8B5]
            text-[0.55rem] tracking-[1px]
            sm:text-[0.65rem] sm:tracking-[1.5px]
            md:text-[0.75rem] md:tracking-[2px]
          "
        >
          <Editable
            tag="span"
            value={mergedData.footerBlessing}
            field="footerBlessing"
            onEdit={onEdit}
            editable={editable}
            placeholder="With blessings from family & friends • Malabar, Kerala • October 2026"
          />
        </p>
      </footer>
    </div>
  );
}