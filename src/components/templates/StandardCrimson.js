'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

/* =============================================================================
   TEMPLATE: CrimsonIvoryRibbon
   Aesthetic : Ivory parchment + deep crimson silk ribbon + gold filigree
               + creamy white peonies & berry clusters
   Theme key : "crimson"
   Follows architecture of StandardCrimson.js
============================================================================= */

// ---------------------------------------------------------------------------
// Shared sub-components (replace with real project imports in production)
// ---------------------------------------------------------------------------
const CelebrationsSection = ({
  showEvents = true,
  theme = 'crimson',
  editable = false,
  onEdit = () => {},
  subtitle = 'PROGRAM OF CELEBRATIONS',
  title = 'Wedding Celebrations',
  dateLabel = 'The Date',
  dateValue = 'Saturday, 12 December 2026',
  dateNote = 'Auspicious day of celebration',
  ceremonyLabel = 'Ceremony & Nikah',
  ceremonyTime = '10:00 AM – 11:30 AM',
  ceremonyNote = 'Solemnization of marriage & blessings',
  receptionLabel = 'Reception & Feast',
  receptionTime = '12:30 PM Onwards',
  receptionNote = 'Followed by lunch & celebration',
}) => {
  if (!showEvents) return null;
  return (
    <section className="cir-section cir-celebrations" data-theme={theme}>
      <div className="cir-section-inner">
        <p className="cir-eyebrow">{subtitle}</p>
        <h2 className="cir-section-title">{title}</h2>
        <div className="cir-divider-ornament" />
        <div className="cir-event-grid">
          <div className="cir-event-card">
            <span className="cir-event-label">{dateLabel}</span>
            <strong className="cir-event-value">{dateValue}</strong>
            <span className="cir-event-note">{dateNote}</span>
          </div>
          <div className="cir-event-card">
            <span className="cir-event-label">{ceremonyLabel}</span>
            <strong className="cir-event-value">{ceremonyTime}</strong>
            <span className="cir-event-note">{ceremonyNote}</span>
          </div>
          <div className="cir-event-card">
            <span className="cir-event-label">{receptionLabel}</span>
            <strong className="cir-event-value">{receptionTime}</strong>
            <span className="cir-event-note">{receptionNote}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

const CouplePhotoSection = ({
  photoUrl = '',
  groomName = 'Groom',
  brideName = 'Bride',
  photoTag = 'Memories',
  photoTitle = 'Moments of Love',
  photoSubtitle = 'Captured memories on our journey to forever',
  showPhotoSection = true,
  theme = 'crimson',
  editable = false,
  onEdit = () => {},
}) => {
  if (!showPhotoSection) return null;
  return (
    <section className="cir-section cir-photo" data-theme={theme}>
      <div className="cir-section-inner">
        <p className="cir-eyebrow">{photoTag}</p>
        <h2 className="cir-section-title">{photoTitle}</h2>
        <p className="cir-section-sub">{photoSubtitle}</p>
        <div className="cir-photo-frame">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt={`${groomName} & ${brideName}`} className="cir-couple-img" />
          ) : (
            <div className="cir-photo-placeholder">
              <span>{groomName[0]} & {brideName[0]}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const RsvpSection = ({
  groomName = 'Groom',
  brideName = 'Bride',
  whatsappNumber = '',
  theme = 'crimson',
}) => {
  const msg = encodeURIComponent(
    `Assalamu'alaikum / Hello,\nI would like to RSVP for the wedding of ${groomName} & ${brideName}.`
  );
  const waLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${msg}`
    : '#';

  return (
    <section className="cir-section cir-rsvp" data-theme={theme}>
      <div className="cir-section-inner">
        <p className="cir-eyebrow">KINDLY RESPOND</p>
        <h2 className="cir-section-title">RSVP</h2>
        <p className="cir-section-sub">
          We would be honoured by your presence. Please let us know if you will be joining us.
        </p>
        {whatsappNumber ? (
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="cir-btn cir-btn-primary">
            Reply via WhatsApp
          </a>
        ) : (
          <span className="cir-btn cir-btn-disabled">WhatsApp number not set</span>
        )}
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// Inline Editable component
// ---------------------------------------------------------------------------
function Editable({
  tag: Tag = 'span',
  value = '',
  field = '',
  onEdit = () => {},
  editable = false,
  className = '',
  placeholder = 'Click to edit',
  multiline = false,
  style = {},
}) {
  const ref = useRef(null);
  const [isEditing, setIsEditing] = useState(false);

  const commit = useCallback(() => {
    if (!ref.current) return;
    const text = ref.current.innerText.trim();
    if (text !== value) onEdit(field, text);
    setIsEditing(false);
  }, [field, onEdit, value]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      ref.current?.blur();
    }
    if (e.key === 'Escape') {
      if (ref.current) ref.current.innerText = value;
      setIsEditing(false);
      ref.current?.blur();
    }
  };

  useEffect(() => {
    if (isEditing && ref.current) {
      ref.current.focus();
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isEditing]);

  if (!editable) {
    return (
      <Tag className={className} style={style}>
        {value || placeholder}
      </Tag>
    );
  }

  return (
    <Tag
      ref={ref}
      className={`${className} cir-editable ${isEditing ? 'is-editing' : ''}`}
      style={style}
      contentEditable
      suppressContentEditableWarning
      onFocus={() => setIsEditing(true)}
      onBlur={commit}
      onKeyDown={onKeyDown}
      data-placeholder={placeholder}
    >
      {value || ''}
    </Tag>
  );
}

// ---------------------------------------------------------------------------
// Countdown helpers
// ---------------------------------------------------------------------------
function useCountdown(targetDate) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return useMemo(() => {
    const target = new Date(targetDate).getTime();
    const diff = Math.max(0, target - now);
    const expired = diff <= 0;
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return { days, hours, minutes, seconds, expired };
  }, [targetDate, now]);
}

function pad(n) {
  return String(n).padStart(2, '0');
}

// ---------------------------------------------------------------------------
// Calendar helpers
// ---------------------------------------------------------------------------
function buildGoogleCalendarUrl({ title, start, end, details, location }) {
  const fmt = (d) =>
    new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${fmt(start)}/${fmt(end || start)}`,
    details: details || '',
    location: location || '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function downloadICS({ title, start, end, details, location }) {
  const fmt = (d) =>
    new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CrimsonIvoryRibbon//EN',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end || start)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${(details || '').replace(/\n/g, '\\n')}`,
    `LOCATION:${location || ''}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'wedding-invitation.ics';
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Decorative SVG elements
// ---------------------------------------------------------------------------
const RibbonBowSVG = () => (
  <svg viewBox="0 0 320 90" className="cir-ribbon-svg" aria-hidden="true">
    <defs>
      <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#7a0f1a" />
        <stop offset="35%" stopColor="#9e1b2a" />
        <stop offset="70%" stopColor="#c41e3a" />
        <stop offset="100%" stopColor="#6b0d16" />
      </linearGradient>
      <linearGradient id="ribbonHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
        <stop offset="50%" stopColor="#ffffff" stopOpacity="0.08" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0.15" />
      </linearGradient>
    </defs>
    <path d="M160 28 C120 8 70 12 55 32 C40 52 70 70 110 58 C130 52 145 42 160 28Z" fill="url(#ribbonGrad)" />
    <path d="M160 28 C200 8 250 12 265 32 C280 52 250 70 210 58 C190 52 175 42 160 28Z" fill="url(#ribbonGrad)" />
    <ellipse cx="160" cy="32" rx="18" ry="14" fill="url(#ribbonGrad)" />
    <path d="M148 40 C130 70 90 95 60 110 C55 95 80 70 110 55 Z" fill="url(#ribbonGrad)" opacity="0.95" />
    <path d="M172 40 C190 70 230 95 260 110 C265 95 240 70 210 55 Z" fill="url(#ribbonGrad)" opacity="0.95" />
    <path d="M160 28 C130 12 90 18 75 35 C95 28 130 22 160 28Z" fill="url(#ribbonHighlight)" />
  </svg>
);

const PeonySVG = ({ className = '' }) => (
  <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
    <defs>
      <radialGradient id="petalGrad" cx="40%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#fffdf8" />
        <stop offset="55%" stopColor="#f5efe3" />
        <stop offset="100%" stopColor="#e8d9c0" />
      </radialGradient>
      <radialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#f0d78c" />
        <stop offset="100%" stopColor="#c9a227" />
      </radialGradient>
    </defs>
    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
      <ellipse key={i} cx="40" cy="28" rx="14" ry="22" fill="url(#petalGrad)" transform={`rotate(${deg} 40 40)`} opacity={0.95} />
    ))}
    {[22, 67, 112, 157, 202, 247, 292, 337].map((deg, i) => (
      <ellipse key={`i${i}`} cx="40" cy="32" rx="9" ry="15" fill="url(#petalGrad)" transform={`rotate(${deg} 40 40)`} />
    ))}
    <circle cx="40" cy="40" r="8" fill="url(#centerGrad)" />
    <circle cx="40" cy="40" r="3.5" fill="#8b6914" opacity="0.6" />
  </svg>
);

const BerryClusterSVG = ({ className = '' }) => (
  <svg viewBox="0 0 60 70" className={className} aria-hidden="true">
    <g fill="#9e1b2a">
      <circle cx="22" cy="18" r="5.5" />
      <circle cx="34" cy="14" r="4.5" />
      <circle cx="28" cy="28" r="5" />
      <circle cx="18" cy="32" r="4" />
      <circle cx="38" cy="30" r="4.5" />
      <circle cx="25" cy="42" r="4" />
      <circle cx="35" cy="44" r="3.5" />
      <circle cx="15" cy="48" r="3.5" />
    </g>
    <g fill="#c41e3a" opacity="0.85">
      <circle cx="30" cy="20" r="3" />
      <circle cx="20" cy="38" r="2.5" />
    </g>
    <path d="M28 50 Q30 58 32 65" stroke="#5a3a1a" strokeWidth="1.2" fill="none" />
    <path d="M22 48 Q18 58 16 66" stroke="#5a3a1a" strokeWidth="1" fill="none" />
  </svg>
);

const GoldLeafSVG = ({ className = '' }) => (
  <svg viewBox="0 0 40 50" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="goldLeaf" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f5e6b8" />
        <stop offset="50%" stopColor="#d4af37" />
        <stop offset="100%" stopColor="#a67c00" />
      </linearGradient>
    </defs>
    <path d="M20 2 C28 12 36 22 32 34 C28 44 20 48 20 48 C20 48 12 44 8 34 C4 22 12 12 20 2Z" fill="url(#goldLeaf)" />
    <path d="M20 8 L20 44" stroke="#8b6914" strokeWidth="0.8" opacity="0.5" />
  </svg>
);

// ---------------------------------------------------------------------------
// Main Template Component
// ---------------------------------------------------------------------------
export default function CrimsonIvoryRibbon({
  data = {},
  onEdit = () => {},
  editable = false,
  className = '',
  previewMode = false,
}) {
  const groomName = data.groomName || data.groom || 'Ahmad';
  const brideName = data.brideName || data.bride || 'Aisha';
  const weddingDate = data.weddingDate || '2026-12-12';
  const weddingTime = data.weddingTime || '10:00 AM';
  const groomParents = data.groomParents || 'Mr. & Mrs. Rahman';
  const brideParents = data.brideParents || 'Mr. & Mrs. Hassan';
  const heroEventText =
    data.heroEventText || data.quote || "are entering into Nikah, insha'Allah";
  const venue = data.venue || data.venueName || 'Grand Orchid Ballroom';
  const venueAddress =
    data.venueAddress || data.address || '123 Harmony Avenue, Garden City';
  const canonicalMapUrl =
    data.mapsUrl ||
    data.directionsUrl ||
    data.mapUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${venue}, ${venueAddress}`
    )}`;

  const monogram = useMemo(() => {
    const g = (groomName || 'G')[0].toUpperCase();
    const b = (brideName || 'B')[0].toUpperCase();
    return `${g} & ${b}`;
  }, [groomName, brideName]);

  const weddingTarget = useMemo(() => {
    const d = data.weddingDateTime || `${weddingDate}T10:00:00`;
    return new Date(d).toISOString();
  }, [data.weddingDateTime, weddingDate]);

  const { days, hours, minutes, seconds, expired } = useCountdown(weddingTarget);

  const countdownEndedTitle =
    data.countdownEndedTitle || 'The Blessed Day Has Arrived';

  const calPayload = {
    title: `Wedding of ${groomName} & ${brideName}`,
    start: weddingTarget,
    end: new Date(new Date(weddingTarget).getTime() + 4 * 3600000).toISOString(),
    details: `${heroEventText}\nVenue: ${venue}\n${venueAddress}`,
    location: `${venue}, ${venueAddress}`,
  };

  const googleCalUrl = buildGoogleCalendarUrl(calPayload);

  return (
    <div
      className={`cir-root ${className} ${previewMode ? 'preview' : ''}`}
      style={{ containerType: 'inline-size', width: '100%' }}
      data-theme="crimson"
    >
      <div className="cir-frame">
        {/* Top decorative artwork */}
        <div className="cir-top-artwork">
          <div className="cir-artwork-overlay">
            <div className="cir-vector-cluster left">
              <PeonySVG className="cir-peony large" />
              <BerryClusterSVG className="cir-berries" />
              <GoldLeafSVG className="cir-leaf a" />
              <GoldLeafSVG className="cir-leaf b" />
            </div>
            <div className="cir-ribbon-center">
              <RibbonBowSVG />
            </div>
            <div className="cir-vector-cluster right">
              <PeonySVG className="cir-peony large" />
              <BerryClusterSVG className="cir-berries" />
              <GoldLeafSVG className="cir-leaf a" />
              <GoldLeafSVG className="cir-leaf b" />
            </div>
          </div>
          <div
            className="cir-photo-artwork"
            style={{
              backgroundImage: `url(${
                data.frameArtworkUrl ||
                'https://i.pinimg.com/736x/04/2a/cc/042acc1d572d9a6f79a5d479c18fdf22.jpg'
              })`,
            }}
          />
        </div>

        {/* HERO */}
        <header className="cir-hero">
          <p className="cir-bismillah">
            <Editable
              tag="span"
              value={data.bismillah || "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ"}
              field="bismillah"
              onEdit={onEdit}
              editable={editable}
              className="cir-bismillah-text"
            />
          </p>

          <p className="cir-parents">
            <Editable
              tag="span"
              value={data.parentsBlessing || `With the blessings of\n${groomParents}\n& ${brideParents}`}
              field="parentsBlessing"
              onEdit={onEdit}
              editable={editable}
              multiline
              className="cir-parents-text"
            />
          </p>

          <div className="cir-names">
            <Editable
              tag="h1"
              value={groomName}
              field="groomName"
              onEdit={onEdit}
              editable={editable}
              className="cir-name groom"
            />
            <div className="cir-monogram-badge">
              <span className="cir-monogram">{monogram}</span>
            </div>
            <Editable
              tag="h1"
              value={brideName}
              field="brideName"
              onEdit={onEdit}
              editable={editable}
              className="cir-name bride"
            />
          </div>

          <div className="cir-hero-banner">
            <Editable
              tag="p"
              value={heroEventText}
              field="heroEventText"
              onEdit={onEdit}
              editable={editable}
              className="cir-hero-quote"
            />
          </div>

          <p className="cir-date-line">
            <Editable
              tag="span"
              value={
                data.weddingDateFormatted ||
                new Date(weddingDate).toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              }
              field="weddingDateFormatted"
              onEdit={onEdit}
              editable={editable}
            />
            {' · '}
            <Editable
              tag="span"
              value={weddingTime}
              field="weddingTime"
              onEdit={onEdit}
              editable={editable}
            />
          </p>
        </header>

        {/* COUNTDOWN */}
        <section className="cir-section cir-countdown">
          <div className="cir-section-inner">
            <p className="cir-eyebrow">
              {expired ? 'Alhamdulillah' : 'Counting Down to Forever'}
            </p>
            <h2 className="cir-section-title">
              {expired ? countdownEndedTitle : 'The Blessed Day'}
            </h2>

            <div className={`cir-timer ${expired ? 'expired' : ''}`}>
              {[
                { label: 'Days', value: days },
                { label: 'Hours', value: hours },
                { label: 'Minutes', value: minutes },
                { label: 'Seconds', value: seconds },
              ].map((u) => (
                <div key={u.label} className="cir-timer-card">
                  <span className="cir-timer-value">{pad(u.value)}</span>
                  <span className="cir-timer-label">{u.label}</span>
                </div>
              ))}
            </div>

            {!expired && (
              <div className="cir-cal-actions">
                <a
                  href={googleCalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cir-btn cir-btn-outline"
                >
                  Google Calendar
                </a>
                <button
                  type="button"
                  className="cir-btn cir-btn-primary"
                  onClick={() => downloadICS(calPayload)}
                >
                  Download .ics
                </button>
              </div>
            )}
          </div>
        </section>

        {/* VENUE */}
        <section className="cir-section cir-venue">
          <div className="cir-section-inner">
            <p className="cir-eyebrow">THE VENUE</p>
            <h2 className="cir-section-title">
              <Editable
                tag="span"
                value={venue}
                field="venue"
                onEdit={onEdit}
                editable={editable}
              />
            </h2>
            <p className="cir-venue-address">
              <Editable
                tag="span"
                value={venueAddress}
                field="venueAddress"
                onEdit={onEdit}
                editable={editable}
                multiline
              />
            </p>
            <a
              href={canonicalMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="cir-btn cir-btn-primary"
            >
              Open in Google Maps
            </a>
          </div>
        </section>

        {/* CELEBRATIONS */}
        <CelebrationsSection
          showEvents={data?.showEvents !== false}
          theme="crimson"
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
          ceremonyLabel={data?.ceremonyLabel || 'Ceremony & Nikah'}
          ceremonyTime={data?.weddingTime || '10:00 AM – 11:30 AM'}
          ceremonyNote={data?.ceremonyNote || 'Solemnization of marriage & blessings'}
          receptionLabel={data?.receptionLabel || 'Reception & Feast'}
          receptionTime={data?.receptionTime || '12:30 PM Onwards'}
          receptionNote={data?.receptionNote || 'Followed by lunch & celebration'}
        />

        {/* COUPLE PHOTO */}
        <CouplePhotoSection
          photoUrl={data?.photoUrl || data?.heroImage || data?.couplePhoto || ''}
          groomName={groomName}
          brideName={brideName}
          photoTag={data?.photoTag || 'Memories'}
          photoTitle={data?.photoTitle || 'Moments of Love'}
          photoSubtitle={
            data?.photoSubtitle || 'Captured memories on our journey to forever'
          }
          showPhotoSection={data?.showPhotoSection !== false}
          theme="crimson"
          editable={editable}
          onEdit={onEdit}
        />

        {/* RSVP */}
        <RsvpSection
          groomName={groomName}
          brideName={brideName}
          whatsappNumber={data.whatsappNumber || data.phone || data.whatsapp || ''}
          theme="crimson"
        />

        {/* FOOTER */}
        <footer className="cir-footer">
          <div className="cir-footer-seal">
            <span className="cir-monogram-lg">{monogram}</span>
          </div>
          <p className="cir-closing">
            <Editable
              tag="span"
              value={
                data.closingPrayer ||
                'May Allah bless this union with love, mercy and lifelong companionship.'
              }
              field="closingPrayer"
              onEdit={onEdit}
              editable={editable}
              multiline
            />
          </p>
          <p className="cir-copyright">
            {data.hostedBy || `With love · ${groomName} & ${brideName}`}
          </p>
        </footer>
      </div>

      {/* Styles */}
      <style jsx global>{`
        .cir-root {
          --cir-bg: #f8f1e3;
          --cir-bg-soft: #f3ead8;
          --cir-ink: #3a2a1f;
          --cir-ink-soft: #6b5344;
          --cir-crimson: #9e1b2a;
          --cir-crimson-deep: #6b0d16;
          --cir-crimson-light: #c41e3a;
          --cir-gold: #c9a227;
          --cir-gold-light: #e8d48b;
          --cir-gold-dark: #8b6914;
          --cir-border: #d4af37;
          --cir-card: rgba(255, 252, 245, 0.72);
          --cir-shadow: 0 12px 40px rgba(107, 13, 22, 0.08);
          font-family: 'Playfair Display', 'Cinzel', 'Georgia', serif;
          color: var(--cir-ink);
          background: var(--cir-bg);
          line-height: 1.55;
          -webkit-font-smoothing: antialiased;
        }
        .cir-root * { box-sizing: border-box; }

        .cir-frame {
          position: relative;
          max-width: 720px;
          margin: 0 auto;
          background: var(--cir-bg);
          border: 1.5px solid var(--cir-border);
          box-shadow:
            inset 0 0 0 6px var(--cir-bg),
            inset 0 0 0 7.5px var(--cir-gold-light),
            var(--cir-shadow);
          overflow: hidden;
        }

        .cir-top-artwork {
          position: relative;
          height: clamp(140px, 28cqw, 220px);
          overflow: hidden;
        }
        .cir-photo-artwork {
          position: absolute;
          inset: 0;
          background-size: 100% auto;
          background-position: top center;
          background-repeat: no-repeat;
          opacity: 0.92;
          pointer-events: none;
        }
        .cir-artwork-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 8px 4% 0;
          z-index: 2;
          pointer-events: none;
          background: linear-gradient(to bottom, transparent 55%, var(--cir-bg) 100%);
        }
        .cir-vector-cluster {
          display: flex;
          align-items: flex-start;
          gap: 2px;
          opacity: 0;
        }
        .cir-ribbon-center {
          flex: 1;
          display: flex;
          justify-content: center;
          margin-top: 4px;
          opacity: 0;
        }
        .cir-ribbon-svg {
          width: clamp(180px, 42cqw, 280px);
          height: auto;
          filter: drop-shadow(0 4px 8px rgba(107, 13, 22, 0.25));
        }
        .cir-peony { width: clamp(48px, 12cqw, 78px); height: auto; }
        .cir-peony.large { width: clamp(56px, 14cqw, 90px); }
        .cir-berries { width: clamp(28px, 7cqw, 44px); margin-top: 18px; }
        .cir-leaf { width: clamp(18px, 5cqw, 30px); margin-top: 8px; }
        .cir-leaf.b { transform: scaleX(-1) rotate(12deg); }

        .cir-hero {
          text-align: center;
          padding: clamp(1.5rem, 5cqw, 2.75rem) clamp(1.25rem, 5cqw, 2.5rem) clamp(1.75rem, 5cqw, 2.5rem);
        }
        .cir-bismillah {
          font-family: 'Amiri', 'Scheherazade New', serif;
          font-size: clamp(1.15rem, 4.2cqw, 1.55rem);
          color: var(--cir-crimson-deep);
          margin: 0 0 1.1rem;
          letter-spacing: 0.02em;
        }
        .cir-parents {
          font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
          font-size: clamp(0.78rem, 2.6cqw, 0.92rem);
          color: var(--cir-ink-soft);
          white-space: pre-line;
          margin: 0 0 1.6rem;
          line-height: 1.7;
        }
        .cir-names {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.35rem;
          margin-bottom: 1.4rem;
        }
        .cir-name {
          font-family: 'Great Vibes', 'Playfair Display', cursive;
          font-weight: 400;
          font-size: clamp(2.4rem, 9cqw, 3.6rem);
          color: var(--cir-crimson-deep);
          margin: 0;
          line-height: 1.15;
          letter-spacing: 0.01em;
        }
        .cir-monogram-badge {
          width: clamp(52px, 12cqw, 68px);
          height: clamp(52px, 12cqw, 68px);
          border-radius: 50%;
          border: 1.5px solid var(--cir-gold);
          background: linear-gradient(145deg, var(--cir-gold-light), var(--cir-gold));
          display: grid;
          place-items: center;
          box-shadow: 0 4px 14px rgba(201, 162, 39, 0.35);
          margin: 0.35rem 0;
        }
        .cir-monogram {
          font-family: 'Cinzel', 'Playfair Display', serif;
          font-size: clamp(0.85rem, 2.8cqw, 1.05rem);
          font-weight: 600;
          color: var(--cir-crimson-deep);
          letter-spacing: 0.04em;
        }
        .cir-hero-banner {
          display: inline-block;
          background: linear-gradient(90deg, transparent, rgba(158, 27, 42, 0.08), transparent);
          border-top: 1px solid rgba(201, 162, 39, 0.45);
          border-bottom: 1px solid rgba(201, 162, 39, 0.45);
          padding: 0.65rem 1.5rem;
          margin-bottom: 1rem;
        }
        .cir-hero-quote {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: clamp(0.95rem, 3.2cqw, 1.15rem);
          color: var(--cir-ink);
          margin: 0;
        }
        .cir-date-line {
          font-family: 'Cinzel', serif;
          font-size: clamp(0.78rem, 2.5cqw, 0.92rem);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--cir-gold-dark);
          margin: 0;
        }

        .cir-section {
          padding: clamp(1.75rem, 5.5cqw, 2.75rem) clamp(1.25rem, 5cqw, 2.5rem);
          text-align: center;
        }
        .cir-section-inner { max-width: 520px; margin: 0 auto; }
        .cir-eyebrow {
          font-family: 'Cinzel', serif;
          font-size: clamp(0.65rem, 2.1cqw, 0.75rem);
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--cir-crimson);
          margin: 0 0 0.45rem;
        }
        .cir-section-title {
          font-family: 'Playfair Display', serif;
          font-weight: 600;
          font-size: clamp(1.35rem, 4.8cqw, 1.75rem);
          color: var(--cir-ink);
          margin: 0 0 0.5rem;
        }
        .cir-section-sub {
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          font-size: clamp(0.82rem, 2.6cqw, 0.95rem);
          color: var(--cir-ink-soft);
          margin: 0 0 1.4rem;
        }
        .cir-divider-ornament {
          width: 64px;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--cir-gold), transparent);
          margin: 0.75rem auto 1.5rem;
          position: relative;
        }
        .cir-divider-ornament::before {
          content: '◆';
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          font-size: 0.55rem;
          color: var(--cir-gold);
          background: var(--cir-bg);
          padding: 0 6px;
        }

        .cir-timer {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: clamp(0.4rem, 2cqw, 0.75rem);
          margin: 1.4rem 0 1.5rem;
        }
        .cir-timer-card {
          background: var(--cir-card);
          border: 1px solid rgba(201, 162, 39, 0.45);
          border-radius: 10px;
          padding: clamp(0.65rem, 2.5cqw, 0.95rem) 0.25rem;
          backdrop-filter: blur(6px);
          box-shadow: 0 4px 16px rgba(107, 13, 22, 0.06);
        }
        .cir-timer-value {
          display: block;
          font-family: 'Cinzel', serif;
          font-size: clamp(1.35rem, 5.5cqw, 1.85rem);
          font-weight: 600;
          color: var(--cir-crimson-deep);
          line-height: 1.1;
        }
        .cir-timer-label {
          display: block;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          font-size: clamp(0.58rem, 1.9cqw, 0.68rem);
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--cir-ink-soft);
          margin-top: 0.25rem;
        }
        .cir-timer.expired .cir-timer-value { color: var(--cir-gold-dark); }
        .cir-cal-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.65rem;
          justify-content: center;
        }

        .cir-venue-address {
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          font-size: clamp(0.88rem, 2.8cqw, 1rem);
          color: var(--cir-ink-soft);
          white-space: pre-line;
          margin: 0 0 1.35rem;
        }

        .cir-event-grid {
          display: grid;
          gap: 0.9rem;
          margin-top: 0.5rem;
        }
        .cir-event-card {
          background: var(--cir-card);
          border: 1px solid rgba(201, 162, 39, 0.35);
          border-radius: 12px;
          padding: 1.1rem 1rem;
          text-align: center;
        }
        .cir-event-label {
          display: block;
          font-family: 'Cinzel', serif;
          font-size: 0.68rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--cir-crimson);
          margin-bottom: 0.35rem;
        }
        .cir-event-value {
          display: block;
          font-family: 'Playfair Display', serif;
          font-size: clamp(1rem, 3.4cqw, 1.2rem);
          color: var(--cir-ink);
          margin-bottom: 0.25rem;
        }
        .cir-event-note {
          display: block;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          font-size: 0.78rem;
          color: var(--cir-ink-soft);
        }

        .cir-photo-frame {
          margin-top: 1rem;
          border: 1.5px solid var(--cir-gold);
          padding: 6px;
          background: #fff;
          box-shadow: var(--cir-shadow);
          display: inline-block;
          max-width: 100%;
        }
        .cir-couple-img {
          display: block;
          width: min(100%, 360px);
          height: auto;
          object-fit: cover;
        }
        .cir-photo-placeholder {
          width: min(100%, 320px);
          aspect-ratio: 4/5;
          background: linear-gradient(145deg, #f3ead8, #e8d9c0);
          display: grid;
          place-items: center;
          font-family: 'Great Vibes', cursive;
          font-size: 2.4rem;
          color: var(--cir-crimson-deep);
        }

        .cir-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: 'Cinzel', serif;
          font-size: clamp(0.7rem, 2.3cqw, 0.8rem);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          padding: 0.75rem 1.4rem;
          border-radius: 999px;
          border: 1.5px solid transparent;
          cursor: pointer;
          transition: all 0.22s ease;
        }
        .cir-btn-primary {
          background: linear-gradient(145deg, var(--cir-crimson-light), var(--cir-crimson-deep));
          color: #fffaf5;
          border-color: var(--cir-crimson-deep);
          box-shadow: 0 4px 14px rgba(158, 27, 42, 0.28);
        }
        .cir-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(158, 27, 42, 0.38);
        }
        .cir-btn-outline {
          background: transparent;
          color: var(--cir-crimson-deep);
          border-color: var(--cir-gold);
        }
        .cir-btn-outline:hover { background: rgba(201, 162, 39, 0.12); }
        .cir-btn-disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #ddd;
          color: #666;
        }

        .cir-footer {
          text-align: center;
          padding: 2.25rem 1.5rem 2.5rem;
          border-top: 1px solid rgba(201, 162, 39, 0.35);
          background: linear-gradient(to bottom, transparent, rgba(158, 27, 42, 0.04));
        }
        .cir-footer-seal {
          width: 64px;
          height: 64px;
          margin: 0 auto 1rem;
          border-radius: 50%;
          border: 1.5px solid var(--cir-gold);
          display: grid;
          place-items: center;
          background: linear-gradient(145deg, var(--cir-gold-light), var(--cir-gold));
        }
        .cir-monogram-lg {
          font-family: 'Cinzel', serif;
          font-weight: 600;
          font-size: 1.05rem;
          color: var(--cir-crimson-deep);
        }
        .cir-closing {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: clamp(0.9rem, 3cqw, 1.05rem);
          color: var(--cir-ink-soft);
          max-width: 380px;
          margin: 0 auto 1rem;
          line-height: 1.65;
        }
        .cir-copyright {
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          font-size: 0.72rem;
          letter-spacing: 0.08em;
          color: var(--cir-ink-soft);
          opacity: 0.75;
          margin: 0;
        }

        .cir-editable {
          outline: none;
          border-radius: 3px;
          transition: box-shadow 0.15s ease, background 0.15s ease;
          cursor: text;
        }
        .cir-editable:hover { box-shadow: 0 0 0 2px rgba(201, 162, 39, 0.35); }
        .cir-editable.is-editing {
          background: rgba(255, 252, 245, 0.9);
          box-shadow: 0 0 0 2px var(--cir-gold);
        }

        @container (max-width: 420px) {
          .cir-timer { grid-template-columns: repeat(2, 1fr); }
          .cir-name { font-size: clamp(2rem, 11cqw, 2.6rem); }
        }
      `}</style>
    </div>
  );
}