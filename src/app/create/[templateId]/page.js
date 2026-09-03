'use client';

import React, { Suspense, useState, useMemo, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { templates } from '@/components/templates';
import PaymentBanner from '@/components/PaymentBanner';
import SiteNavbar, { UserAccountButton } from '@/components/SiteNavbar';
import { useAuth } from '@/lib/auth';
import { peekStagedEditsForRestore, discardStagedEdits } from '@/lib/stage-edits';
import { ChevronLeft, Palette, MousePointerClick, RotateCcw, Sparkles, CheckCircle2, Eye, ChevronDown, ChevronUp, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import LiveEditorToolbar from '@/components/editor/LiveEditorToolbar';
import { getEditorCSSVars } from '@/lib/editor-css';
import usePersistedState from '@/lib/use-persisted-state';
import RingLoader from '@/components/ui/RingLoader';
import { formatDayOfWeek } from '@/lib/utils';

// ── Template type detection ──────────────────────────────────────────────
function getTemplateType(slug) {
  if (slug?.startsWith('birthday-')) return 'birthday';
  if (slug?.startsWith('housewarming-')) return 'housewarming';
  return 'wedding';
}

// Helper to get default event date string (2 days after today) in YYYY-MM-DD format
function getDefaultEventDateIso(daysAhead = 2) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Shared defaults (used by all template types)
const sharedDefaults = {
  venue: "Grand Palace Auditorium",
  venueAddress: "Beach Road, Calicut, Kerala 673001, India",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Calicut+Kerala",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=Calicut+Kerala",
  directionsUrl: "https://www.google.com/maps/search/?api=1&query=Calicut+Kerala",
  whatsappNumber: "919876543210",
  heroTagline: "With the blessings of our families, we invite you to share in our joy",
  countdownTitle: "Counting Every Moment",
  templateData: {},
};

// Wedding-specific defaults
const weddingDefaults = {
  ...sharedDefaults,
  groomName: "Rizwan",
  brideName: "Ayesha",
  weddingDate: getDefaultEventDateIso(2),
  weddingTime: "10:00 AM",
  groomParents: "",
  brideParents: "",
  heroEventText: "as we embark on this beautiful journey together",
  receptionTime: "12:30 PM Onwards",
};

// Birthday-specific defaults
const birthdayDefaults = {
  ...sharedDefaults,
  celebrantName: "Aarav",
  age: "5",
  birthdayDate: getDefaultEventDateIso(2),
  birthdayTime: "4:00 PM",
  hostsName: "",
  partyTheme: "",
  heroIntro: "You're invited to celebrate",
  // Standard DB fallbacks
  weddingDate: getDefaultEventDateIso(2),
  weddingTime: "4:00 PM",
  groomName: "Aarav",
  brideName: "5th Birthday",
};

// House warming-specific defaults
const housewarmingDefaults = {
  ...sharedDefaults,
  familyName: "The Sharma Family",
  eventDate: getDefaultEventDateIso(2),
  eventTime: "11:00 AM",
  hostsName: "",
  ceremonyTime: "",
  lunchTime: "",
  findOurHome: "",
  heroIntro: "You're cordially invited to",
  // Standard DB fallbacks
  weddingDate: getDefaultEventDateIso(2),
  weddingTime: "11:00 AM",
  groomName: "The Sharma Family",
  brideName: "Housewarming",
};

function getDefaultsForType(type) {
  const defaultDate = getDefaultEventDateIso(2);
  if (type === 'birthday') return { ...birthdayDefaults, birthdayDate: defaultDate, weddingDate: defaultDate };
  if (type === 'housewarming') return { ...housewarmingDefaults, eventDate: defaultDate, weddingDate: defaultDate };
  return { ...weddingDefaults, weddingDate: defaultDate };
}

// Standard fields that have dedicated DB columns
const STANDARD_FIELDS = new Set([
  'templateId', 'groomName', 'brideName', 'weddingDate', 'weddingTime',
  'venue', 'venueAddress', 'mapsUrl', 'mapUrl', 'directionsUrl',
  'whatsappNumber', 'groomParents', 'brideParents', 'heroTagline',
  'heroEventText', 'countdownTitle', 'eventDay',
  // Birthday fields
  'celebrantName', 'age', 'birthdayDate', 'birthdayTime', 'hostsName', 'partyTheme', 'heroIntro',
  // House warming fields
  'familyName', 'eventDate', 'eventTime', 'ceremonyTime', 'lunchTime', 'receptionTime', 'findOurHome',
]);

export default function CreatePage() {
  const { templateId } = useParams();
  const templateExists = Boolean(templates[templateId]);
  const TemplateComponent = templates[templateId] || templates['standard-crimson'];
  const templateType = getTemplateType(templateId);
  const defaults = getDefaultsForType(templateType);

  const { user, session } = useAuth();
  const [formData, setFormData] = useState(defaults);
  const [step, setStep] = useState(1); // 1 = Phone preview + live editor, 2 = Details form + Payment
  const [detailsOpen, setDetailsOpen] = useState(true);
  const restoreRef = useRef({ ran: false, claimed: false });
  const [editorSettings, setEditorSettings] = usePersistedState(
    `editor-settings-v2-${templateId}`,
    { heroFontFamily: 'cinzel', fontFamily: 'cinzel', fontSize: 14, showRsvp: true, showPhotoSection: true, showEvents: true },
  );

  // On mount (and whenever signed-in session becomes available):
  //   1. Restore the LIVE EDITOR form state from localStorage-staged edits
  //      (instant, no-flicker groom/bride/date restoration).
  //   2. If the stage also contains a tempOwnerToken (saved by PaymentBanner
  //      before Google OAuth redirect) AND we have a signed-in user, call
  //      /api/claim-draft to permanently flip owner_id = user.id on the
  //      Supabase draft row so the invitation shows up on their Dashboard.
  //
  // This guarantees the edited template data the user typed before hitting
  // Publish Now → Google sign-in is not lost; instead it's saved both in
  // localStorage (UI restore) and in the user's Supabase account forever.
  useEffect(() => {
    if (restoreRef.current.ran) return;
    const stagedForTemplate = peekStagedEditsForRestore({ templateIdFilter: templateId || null });
    if (!stagedForTemplate) return;
    const formToRestore = stagedForTemplate.formData;
    if (formToRestore && typeof formToRestore === 'object') {
      setFormData((prev) => {
        const merged = { ...prev };
        // Restore all keys from staged edits so no custom fields are lost
        Object.keys(formToRestore).forEach((k) => {
          if (k === 'templateData') return;
          if (formToRestore[k] !== undefined && formToRestore[k] !== null) {
            merged[k] = formToRestore[k];
          }
        });
        if (formToRestore.templateData && typeof formToRestore.templateData === 'object') {
          merged.templateData = { ...(prev.templateData || {}), ...formToRestore.templateData };
        }
        const photo = formToRestore.photoUrl || formToRestore.heroImage || formToRestore.templateData?.photoUrl || formToRestore.templateData?.heroImage;
        if (photo) {
          merged.photoUrl = photo;
          merged.templateData = { ...(merged.templateData || {}), photoUrl: photo, heroImage: photo };
        }
        return merged;
      });
    }
    restoreRef.current.ran = true;

    // Step auto-advance: if user just came back from sign-in redirect, skip
    // them straight to Step 2 so the PaymentBanner auto-launch flow
    // opens seamlessly.
    const autoAdvance = Boolean(
      stagedForTemplate.at && Date.now() - stagedForTemplate.at < 20 * 60 * 1000,
    );
    if (autoAdvance) {
      setStep(2);
      setDetailsOpen(true);
    }

    // Claim draft (server-side) if a signed-in user returns with a token.
    const token = stagedForTemplate.tempOwnerToken || null;
    if (token && user && session?.access_token && !restoreRef.current.claimed) {
      restoreRef.current.claimed = true;
      (async () => {
        try {
          const headers = { 'Content-Type': 'application/json' };
          headers.Authorization = `Bearer ${session.access_token}`;
          const res = await fetch('/api/claim-draft', {
            method: 'POST',
            headers,
            credentials: 'same-origin',
            body: JSON.stringify({ tempOwnerToken: token }),
          });
          const body = await res.json().catch(() => ({}));
          if (res.ok && body?.claimed) {
            // Best-effort: restore DB-written fields (in case server has
            // better data than what's in localStorage). This also lets us
            // re-populate fields that weren't captured in the old stage format.
            const inv = body.invitation;
            if (inv && typeof inv === 'object') {
              const invTd = inv.template_data || {};
              const photo = inv.photo_url || invTd.photoUrl || invTd.heroImage || '';
              setFormData((prev) => ({
                ...prev,
                groomName: inv.groom_name ?? prev.groomName,
                brideName: inv.bride_name ?? prev.brideName,
                weddingDate: inv.wedding_date ?? prev.weddingDate,
                weddingTime: inv.wedding_time ?? prev.weddingTime,
                venue: inv.venue ?? prev.venue,
                venueAddress: inv.venue_address ?? prev.venueAddress,
                mapsUrl: inv.maps_url ?? prev.mapsUrl,
                mapUrl: inv.maps_url ?? prev.mapUrl,
                directionsUrl: inv.maps_url ?? prev.directionsUrl,
                whatsappNumber: inv.whatsapp_number ?? prev.whatsappNumber,
                groomParents: inv.groom_parents ?? prev.groomParents,
                brideParents: inv.bride_parents ?? prev.brideParents,
                heroTagline: inv.hero_tagline ?? prev.heroTagline,
                heroEventText: inv.hero_event_text ?? prev.heroEventText,
                countdownTitle: inv.countdown_title ?? prev.countdownTitle,
                photoUrl: photo || prev.photoUrl || '',
                templateData: {
                  ...(prev.templateData || {}),
                  ...invTd,
                  ...(photo ? { photoUrl: photo, heroImage: photo } : {}),
                },
              }));
            }
          } else if (process.env.NODE_ENV !== 'production' && body?.error) {
            console.warn('[create-page] claim-draft returned non-ok:', body.code, body.error);
          }
        } catch (e) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('[create-page] claim-draft threw:', e?.message || e);
          }
        }
      })();
    }

    // If the stage is older than 20 minutes (edge case) — discard so it
    // doesn't linger / auto-restore on a later unrelated visit to this template.
    if (stagedForTemplate.at && Date.now() - stagedForTemplate.at > 20 * 60 * 1000) {
      discardStagedEdits();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, user, session?.access_token]);

  const handleInlineEdit = (field, value) => {
    setFormData(prev => {
      // Standard fields → top-level formData (saved in dedicated DB columns)
      // Template-specific fields (heroTitle, monogram, eyebrowMal, etc.)
      // → templateData sub-object (saved in template_data JSONB)
      if (STANDARD_FIELDS.has(field)) {
        const next = { ...prev, [field]: value };
        if (field === 'mapsUrl' || field === 'mapUrl' || field === 'directionsUrl') {
          next.mapsUrl = value;
          next.mapUrl = value;
          next.directionsUrl = value;
        }
        if (field === 'birthdayDate' || field === 'eventDate' || field === 'weddingDate') {
          next.weddingDate = value;
          next.birthdayDate = value;
          next.eventDate = value;
          const computedDay = formatDayOfWeek(value);
          if (computedDay) next.eventDay = computedDay;
        }
        if (field === 'birthdayTime' || field === 'eventTime') {
          next.weddingTime = value;
        }
        if (field === 'celebrantName' || field === 'familyName') {
          next.groomName = value;
        }
        return next;
      }
      if (field === 'photoUrl' || field === 'heroImage' || field === 'couplePhoto') {
        return {
          ...prev,
          photoUrl: value,
          heroImage: value,
          couplePhoto: value,
          templateData: {
            ...(prev.templateData || {}),
            photoUrl: value,
            heroImage: value,
            couplePhoto: value,
          },
        };
      }
      // Template-specific field — merge into templateData sub-object
      return { ...prev, templateData: { ...(prev.templateData || {}), [field]: value } };
    });
  };

  const resetAll = () => {
    if (typeof window !== 'undefined' && window.confirm("Reset all edited text to defaults?")) {
      discardStagedEdits();
      setFormData({ ...defaults });
    }
  };

  const editsCount = useMemo(() => {
    let n = 0;
    Object.keys(defaults).forEach(k => {
      if (k === 'templateData') return;
      if (String(formData[k] ?? "") !== String(defaults[k] ?? "")) n++;
    });
    // Count template-specific field changes
    const origTd = defaults.templateData || {};
    const currTd = formData.templateData || {};
    const allTdKeys = new Set([...Object.keys(origTd), ...Object.keys(currTd)]);
    allTdKeys.forEach(k => {
      if (String(origTd[k] ?? '') !== String(currTd[k] ?? '')) n++;
    });
    return n;
  }, [formData]);

  const templateData = useMemo(() => {
    const canonicalMapUrl = formData.mapsUrl || formData.mapUrl || formData.directionsUrl;
    const td = formData.templateData || {};
    const base = {
      ...td,
      ...formData,
      photoUrl: td.photoUrl || formData.photoUrl || td.heroImage || formData.heroImage || '',
      showPhotoSection: editorSettings.showPhotoSection !== false,
      showRsvp: editorSettings.showRsvp !== false,
      showEvents: editorSettings.showEvents !== false,
      heroFontFamily: editorSettings.heroFontFamily || td.heroFontFamily || 'cinzel',
      fontFamily: editorSettings.heroFontFamily || td.fontFamily || 'cinzel',
      fontSize: editorSettings.fontSize || td.fontSize || 14,
      mapsUrl: canonicalMapUrl,
      mapUrl: canonicalMapUrl,
      directionsUrl: canonicalMapUrl,
    };

    // ── Map form fields → template-expected field names ──
    if (templateType === 'birthday') {
      const bDate = formData.birthdayDate || formData.weddingDate || base.birthdayDate || '2026-12-20';
      const bTime = formData.birthdayTime || formData.weddingTime || base.birthdayTime || '4:00 PM';
      const cName = formData.celebrantName || formData.groomName || base.celebrantName || 'Aarav';
      return {
        ...base,
        // Birthday templates expect: celebrantName, birthdayDate, birthdayTime, age, hostsName, partyTheme
        celebrantName: cName,
        age: formData.age || base.age || '5',
        birthdayDate: bDate,
        birthdayTime: bTime,
        hostsName: formData.hostsName || base.hostsName || '',
        partyTheme: formData.partyTheme || base.partyTheme || '',
        heroIntro: formData.heroIntro || base.heroIntro || "You're invited to celebrate",
        // Critical: Provide weddingDate & groomName / brideName fallbacks so backend schemas & DB work
        weddingDate: bDate,
        weddingTime: bTime,
        groomName: cName,
        brideName: formData.age ? `${formData.age}th Birthday` : 'Birthday Party',
      };
    }

    if (templateType === 'housewarming') {
      const eDate = formData.eventDate || formData.weddingDate || base.eventDate || '2026-12-20';
      const eTime = formData.eventTime || formData.weddingTime || base.eventTime || '11:00 AM';
      const fName = formData.familyName || formData.groomName || base.familyName || 'The Sharma Family';
      return {
        ...base,
        // House warming templates expect: familyName, eventDate, eventTime, hostsName, etc.
        familyName: fName,
        eventDate: eDate,
        eventTime: eTime,
        hostsName: formData.hostsName || base.hostsName || '',
        ceremonyTime: formData.ceremonyTime || base.ceremonyTime || '',
        lunchTime: formData.lunchTime || base.lunchTime || '',
        findOurHome: formData.findOurHome || base.findOurHome || '',
        heroIntro: formData.heroIntro || base.heroIntro || "You're cordially invited to",
        // Critical: Provide weddingDate & groomName / brideName fallbacks so backend schemas & DB work
        weddingDate: eDate,
        weddingTime: eTime,
        groomName: fName,
        brideName: 'Housewarming',
      };
    }

    // Wedding — no mapping needed, fields match directly
    return base;
  }, [formData, editorSettings, templateType]);

  const summaryFields = useMemo(() => {
    const common = [
      { label: "Venue", value: formData.venue, field: "venue", placeholder: "Hall, Auditorium, Mosque" },
      { label: "Full Address", value: formData.venueAddress, field: "venueAddress", multiline: true, placeholder: "Street, City, State, Pincode" },
      { label: "Google Maps URL", value: formData.mapsUrl, field: "mapsUrl", type: "url", placeholder: "https://www.google.com/maps/search/?api=1&query=..." },
      { label: "WhatsApp Number", value: formData.whatsappNumber, field: "whatsappNumber", type: "tel", placeholder: "91XXXXXXXXXX" },
      { label: "Countdown Heading", value: formData.countdownTitle, field: "countdownTitle", placeholder: "Counting Every Moment" },
    ];

    if (templateType === 'birthday') {
      return [
        { label: "Celebrant's Name", value: formData.celebrantName, field: "celebrantName", placeholder: "e.g. Aarav" },
        { label: "Age", value: formData.age, field: "age", placeholder: "e.g. 5" },
        { label: "Party Theme", value: formData.partyTheme, field: "partyTheme", placeholder: "e.g. Unicorn Magic" },
        { label: "Tagline", value: formData.heroTagline, field: "heroTagline", placeholder: "Join us for a magical celebration" },
        { label: "Birthday Date", value: formData.birthdayDate, field: "birthdayDate", type: "date", placeholder: "YYYY-MM-DD" },
        { label: "Party Time", value: formData.birthdayTime, field: "birthdayTime", placeholder: "e.g. 4:00 PM" },
        { label: "Hosted By", value: formData.hostsName, field: "hostsName", placeholder: "e.g. The Sharma Family" },
        ...common,
      ];
    }

    if (templateType === 'housewarming') {
      return [
        { label: "Family Name", value: formData.familyName, field: "familyName", placeholder: "e.g. The Sharma Family" },
        { label: "Tagline", value: formData.heroTagline, field: "heroTagline", placeholder: "We're blessed to have a new home" },
        { label: "Event Date", value: formData.eventDate, field: "eventDate", type: "date", placeholder: "YYYY-MM-DD" },
        { label: "Event Time", value: formData.eventTime, field: "eventTime", placeholder: "e.g. 11:00 AM" },
        { label: "Ceremony Time", value: formData.ceremonyTime, field: "ceremonyTime", placeholder: "e.g. 11:00 AM — Griha Pravesh Puja" },
        { label: "Lunch Time", value: formData.lunchTime, field: "lunchTime", placeholder: "e.g. 1:00 PM — Lunch is Served" },
        { label: "Hosted By", value: formData.hostsName, field: "hostsName", placeholder: "e.g. Raj & Sunita Sharma" },
        { label: "How to Find Us", value: formData.findOurHome, field: "findOurHome", multiline: true, placeholder: "Look for the yellow balloons at the entrance..." },
        ...common,
      ];
    }

    // Wedding (default)
    return [
      { label: "Bride/groom's Full Name", value: formData.brideName, field: "brideName", placeholder: "e.g. Ayesha Fathima" },
      { label: "Groom/bride's Full Name", value: formData.groomName, field: "groomName", placeholder: "e.g. Rizwan Ahmed" },
      { label: "Tagline (above names)", value: formData.heroTagline, field: "heroTagline", placeholder: "Together with their families…" },
      { label: "Hero Event Text", value: formData.heroEventText, field: "heroEventText", placeholder: "as we embark on this beautiful journey together" },
      { label: "Wedding Date", value: formData.weddingDate, field: "weddingDate", type: "date", placeholder: "YYYY-MM-DD" },
      { label: "Wedding Time", value: formData.weddingTime, field: "weddingTime", placeholder: "e.g. 10:00 AM" },
      { label: "Reception Time", value: formData.receptionTime, field: "receptionTime", placeholder: "e.g. 12:30 PM Onwards" },
      ...common,
      { label: "Bride/groom's Parents", value: formData.brideParents, field: "brideParents", placeholder: "Smt. Mariam & Sri. Fathima Ali" },
      { label: "Groom/bride's Parents", value: formData.groomParents, field: "groomParents", placeholder: "Smt. Zohra & Sri. Ahmed Khan" },
    ];
  }, [formData, templateType]);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#FAF8F5] text-[var(--ink)] selection:bg-[var(--emerald-primary)]/30">
      {/* WYSIWYG Editor Header */}
      <header className="bg-white/95 backdrop-blur-xl border-b border-[var(--border-subtle)] sticky top-0 z-[90] px-3 sm:px-4 md:px-8 py-2.5 sm:py-3 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="p-2 sm:p-2.5 -ml-1 hover:bg-gray-100 rounded-full transition-colors text-[var(--ink-soft)] shrink-0 active:scale-95 cursor-pointer"
                aria-label="Go back to design editor"
                title="Go back to design editor"
              >
                <ChevronLeft className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
              </button>
            ) : (
              <Link
                href="/"
                className="p-2 sm:p-2.5 -ml-1 hover:bg-gray-100 rounded-full transition-colors text-[var(--ink-soft)] shrink-0 active:scale-95"
                aria-label="Back to templates"
                title="Back to templates"
              >
                <ChevronLeft className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
              </Link>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-0.5 sm:mb-1">
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-[var(--ink)] leading-none truncate">
                  Live Editor
                </h2>
              </div>
              <p className="text-[10px] sm:text-[11px] md:text-xs text-[var(--ink-muted)] font-medium uppercase tracking-[0.12em] truncate">
                {String(templateId).replace(/-/g, ' ')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
            {/* Step Indicator */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100 min-h-[38px]">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${step >= 1 ? 'bg-[var(--emerald-primary)] text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
              <div className={`w-6 h-[2px] rounded-full ${step >= 2 ? 'bg-[var(--emerald-primary)]' : 'bg-gray-200'}`}></div>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${step >= 2 ? 'bg-[var(--emerald-primary)] text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
            </div>

            {step === 1 && (
              <button
                onClick={resetAll}
                className="inline-flex items-center justify-center gap-1 p-2 sm:px-3 sm:py-2 text-xs md:text-sm font-bold text-[var(--ink-soft)] hover:bg-gray-100 rounded-xl transition-all active:scale-95 shrink-0"
                title="Reset to defaults"
                aria-label="Reset edits"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden md:inline">Reset</span>
              </button>
            )}

            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100 min-h-[38px]">
              {editsCount > 0 ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--emerald-primary)] shrink-0" />
                  <span className="text-[11px] sm:text-xs md:text-sm font-bold text-[var(--ink)] leading-none">
                    {editsCount}
                  </span>
                </>
              ) : (
                <>
                  <MousePointerClick className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--ink-muted)] shrink-0 hidden sm:block" />
                  <span className="text-[10px] sm:text-xs md:text-sm font-bold text-[var(--ink-muted)] leading-none whitespace-nowrap">
                    {step === 1 ? 'Tap to edit' : 'Fill details'}
                  </span>
                </>
              )}
            </div>

            {/* Account Icon Button */}
            <UserAccountButton />
          </div>
        </div>
      </header>

      {!templateExists && (
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 md:px-8 pt-4 sm:pt-6">
          <div className="relative bg-amber-50 border-2 border-amber-300/70 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[0_16px_40px_rgba(180,83,9,0.12)] overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/4 w-40 sm:w-56 h-40 sm:h-56 bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex items-start gap-3 sm:gap-4 pr-8 sm:pr-10">
              <div className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white border border-amber-200 shadow-inner flex items-center justify-center text-amber-700">
                <Sparkles className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-amber-900 text-[15px] sm:text-base md:text-lg leading-tight mb-1">
                  Showing a template preview from our gallery
                </h3>
                <p className="text-[12px] sm:text-sm md:text-[15px] text-amber-800/90 leading-relaxed">
                  The template you selected is no longer available. You're now previewing our popular{" "}
                  <strong className="font-semibold">Standard Crimson</strong> design with the exact same live editor.
                </p>
                <div className="mt-3 sm:mt-4 flex flex-wrap gap-2 sm:gap-3">
                  <Link
                    href="/templates"
                    className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-700/20 transition-all active:scale-[0.98]"
                  >
                    <Palette className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                    Choose a different template
                  </Link>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-white hover:bg-amber-50 text-amber-800 font-semibold text-xs sm:text-sm border border-amber-200 transition-colors active:scale-[0.98]"
                  >
                    Back to home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className={`max-w-[1400px] mx-auto px-3 sm:px-4 md:px-8 pt-4 sm:pt-6 md:pt-8 ${step === 1 ? 'pb-[280px]' : 'pb-[260px]'}`}>

        {/* =============================== */}
        {/* STEP 1 — Phone Preview + Live Editor */}
        {/* =============================== */}
        {step === 1 && (
          <div className="flex flex-col items-center">
            {/* Step 1 intro */}
            <div className="w-full text-center mb-5 sm:mb-7 md:mb-8 max-w-2xl mx-auto">
              
            </div>

           {/* Phone Preview — the STAR of Step 1 */}
            <div className="w-full flex justify-center">
              <div className="relative w-full px-4 sm:px-0">
                {/* Glow background */}
                <div className="hidden md:block absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-[var(--emerald-primary)]/20 via-[var(--champagne-500)]/15 to-transparent blur-3xl pointer-events-none"></div>

                <div
                  className="
                    relative
                    bg-[#111]
                    shadow-[0_60px_120px_-20px_rgba(0,0,0,0.35)]
                    rounded-[2.4rem] sm:rounded-[3rem]
                    overflow-hidden
                    w-full
                    max-w-[400px]
                    h-[76vh]
                    max-h-[780px]
                    mx-auto
                    sm:max-w-none
                    sm:w-[400px]
                    sm:h-[860px]
                    sm:max-h-none
                    border-[5px] sm:border-[8px] border-[#0d0d0d]
                    ring-1 ring-white/10
                  "
                >
                  {/* Status bar */}
                  <div className="absolute top-0 left-0 right-0 h-[26px] sm:h-8 z-[65] flex items-center justify-between px-3.5 sm:px-6 text-white/80 text-[9px] sm:text-[11px] font-semibold bg-gradient-to-b from-black/30 to-transparent pointer-events-none">

                  </div>

                  {/* Dynamic Island */}
                  <div className="absolute top-[10px] sm:top-2 left-1/2 -translate-x-1/2 w-[100px] sm:w-28 h-[25px] sm:h-7 bg-black rounded-full z-[70] flex items-center justify-center">
                    <div className="w-1 h-1 sm:w-2 sm:h-2 rounded-full bg-[#1a1a1a] mr-1 sm:mr-2"></div>
                  </div>

                  {/* Scrollable Template Content */}
                  <div className="absolute inset-0 overflow-y-auto hide-scrollbar pt-[34px] sm:pt-[42px] pb-5 sm:pb-8 [-webkit-overflow-scrolling:touch]">
                    <div
                      className="WebInvitesPreviewContainer editor-preview-wrapper"
                      data-hide-rsvp={editorSettings.showRsvp === false ? 'true' : 'false'}
                      data-hide-photo={editorSettings.showPhotoSection === false ? 'true' : 'false'}
                      data-hide-events={editorSettings.showEvents === false ? 'true' : 'false'}
                      style={{
                        containerType: 'inline-size',
                        width: '100%',
                        maxWidth: '100%',
                        ...getEditorCSSVars(editorSettings).vars,
                      }}
                    >
                      <Suspense fallback={<TemplateSkeletonFallback />}>
                        <TemplateComponent
                          key={templateId}
                          data={templateData}
                          isDraft={false}
                          editable={true}
                          onEdit={handleInlineEdit}
                        />
                      </Suspense>
                    </div>
                  </div>

                  {/* Home Indicator */}
                  <div className="absolute bottom-[10px] sm:bottom-2 left-1/2 -translate-x-1/2 w-[100px] sm:w-28 h-[6px] sm:h-1 rounded-full bg-white/40 z-[70]"></div>
                </div>

                {/* Phone Caption */}
                <div className="mt-5 sm:mt-6 flex items-center justify-center gap-2 text-[var(--ink-muted)] text-[12px] sm:text-sm font-medium">
                  <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--emerald-primary)]" />
                  Live preview · tap any text to edit · changes are instant
                </div>
              </div>
            </div>

            {/* Step 1 Next Button — positioned above the toolbar */}
            <div className="fixed bottom-[80px] left-0 right-0 z-[94] bg-white/95 backdrop-blur-xl border-t border-[var(--border-subtle)] shadow-[0_-8px_30px_rgba(15,56,44,0.06)] p-3 sm:p-3.5 pb-[calc(env(safe-area-inset-bottom)+10px)] pointer-events-auto">
              <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-3">
                <div className="hidden sm:flex items-center gap-2.5 text-left">
                  <div className="w-9 h-9 rounded-xl bg-[var(--emerald-light)] flex items-center justify-center shrink-0">
                    <Palette className="w-4 h-4 text-[var(--emerald-primary)]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[var(--ink)]">Happy with your design?</div>
                    <div className="text-[10px] text-[var(--ink-muted)]">Fill details & publish</div>
                  </div>
                </div>
                <div className="sm:hidden flex-1 text-center">
                  <p className="text-[10px] font-bold text-[var(--ink-muted)] uppercase tracking-[0.08em]">Ready to proceed?</p>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-[var(--emerald-primary)] text-white rounded-2xl font-bold text-xs sm:text-sm hover:bg-[var(--emerald-dark)] transition-all shadow-lg shadow-[var(--emerald-primary)]/20 active:scale-[0.98] group shrink-0"
                >
                  Next — Details
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =============================== */}
        {/* STEP 2 — Final Details Form + Payment */}
        {/* =============================== */}
        {step === 2 && (
          <div className="flex flex-col lg:flex-row gap-5 sm:gap-8 lg:gap-12 items-start">
            {/* Live Data Panel */}
            <div className="flex-1 w-full space-y-4 sm:space-y-6 order-1 lg:order-none">
              {/* Step 2 intro */}
              <div className="bg-gradient-to-br from-[var(--emerald-light)]/60 to-white border border-[var(--emerald-primary)]/15 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-40 h-40 bg-[var(--emerald-primary)]/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white border border-[var(--emerald-primary)]/20 shadow-inner flex items-center justify-center text-[var(--emerald-primary)] shrink-0">
                    <CheckCircle2 className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1 sm:mb-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--emerald-primary)] text-white text-[10px] font-bold uppercase tracking-[0.12em]">
                        Step 2 of 2
                      </span>
                    </div>
                    <h3 className="font-display text-lg sm:text-xl md:text-2xl text-[var(--ink)] mb-1 leading-tight">
                      Review &amp; confirm your invitation details
                    </h3>
                    <p className="text-[12px] sm:text-sm md:text-[15px] text-[var(--ink-muted)] leading-relaxed">
                      Double-check the information below. Once published, your invitation will be live on a shareable WhatsApp-ready link — you can still edit anytime after purchase.
                    </p>
                  </div>
                </div>
              </div>

              {/* Live Summary accordion */}
              <details open={detailsOpen} className={detailsOpen ? "bg-white rounded-3xl border border-[var(--border-subtle)] shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden" : "bg-white rounded-3xl border border-[var(--border-subtle)] shadow-sm overflow-hidden"}>
                <summary
                  onClick={(e) => { e.preventDefault(); setDetailsOpen(o => !o); }}
                  className="cursor-pointer list-none select-none"
                >
                  <div className="p-5 sm:p-6 md:p-7 flex items-center justify-between gap-3 bg-gradient-to-r from-white to-[var(--emerald-light)]/30 hover:from-[var(--emerald-light)]/10 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[var(--emerald-light)] text-[var(--emerald-primary)] flex items-center justify-center shadow-inner shrink-0">
                        <Palette className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display text-lg md:text-xl text-[var(--ink)] truncate">Invitation Details</h3>
                        <p className="text-xs sm:text-sm text-[var(--ink-muted)] truncate">
                          <span className="lg:hidden">Tap to {detailsOpen ? 'collapse' : 'expand'} · </span>
                          Verify {templateType === 'birthday' ? 'celebrant' : templateType === 'housewarming' ? 'family' : 'bride & groom'} details, venue, and contact info
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {detailsOpen ? (
                        <ChevronUp className="w-5 h-5 text-[var(--emerald-primary)]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[var(--ink-muted)]" />
                      )}
                    </div>
                  </div>
                </summary>

                {detailsOpen && (
                  <div className="p-4 sm:p-6 md:p-7 border-t border-[var(--border-subtle)] space-y-2 sm:space-y-3 animate-in slide-in-from-top-4 fade-in duration-300">
                    {summaryFields.map(row => (
                      <div
                        key={row.field}
                        className="grid grid-cols-1 sm:grid-cols-[180px_1fr] md:grid-cols-[220px_1fr] items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-[10px] sm:text-[11px] font-bold text-[var(--ink-muted)] uppercase tracking-[0.15em] pt-1.5 shrink-0">{row.label}</span>
                        <div className="min-w-0">
                          {row.multiline ? (
                            <textarea
                              value={row.value ?? ""}
                              onChange={(e) => handleInlineEdit(row.field, e.target.value)}
                              rows={Math.max(2, String(row.value ?? "").split("\n").length)}
                              className="w-full resize-y bg-transparent font-semibold text-[13px] sm:text-sm md:text-base text-[var(--ink)] placeholder:text-[var(--ink-muted)]/60 outline-none focus:ring-2 focus:ring-[var(--emerald-primary)]/40 rounded-lg px-2 py-1.5 -mx-2 transition-all border border-transparent focus:border-[var(--emerald-primary)]/30 focus:bg-white min-h-[64px]"
                              placeholder={row.placeholder || `Enter ${row.label.toLowerCase()}`}
                            />
                          ) : (
                            <input
                              type={row.type || "text"}
                              value={row.value ?? ""}
                              onChange={(e) => handleInlineEdit(row.field, e.target.value)}
                              className="w-full bg-transparent font-semibold text-[13px] sm:text-sm md:text-base text-[var(--ink)] placeholder:text-[var(--ink-muted)]/60 outline-none focus:ring-2 focus:ring-[var(--emerald-primary)]/40 rounded-lg px-2 py-1.5 -mx-2 transition-all border border-transparent focus:border-[var(--emerald-primary)]/30 focus:bg-white min-h-[40px]"
                              placeholder={row.placeholder || `Enter ${row.label.toLowerCase()}`}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </details>

              


            </div>

            {/* Phone Preview (compact sidebar on Step 2) */}
            <div className="w-full lg:w-auto mx-auto lg:mx-0 shrink-0 order-2 lg:order-none">
              <div className="relative">
                {/* Glow background on desktop */}
                <div className="hidden md:block absolute -inset-4 md:-inset-6 rounded-[3rem] bg-gradient-to-br from-[var(--emerald-primary)]/15 via-[var(--champagne-500)]/10 to-transparent blur-2xl pointer-events-none"></div>

                <div
                  className="
                    relative
                    bg-[#111]
                    shadow-[0_60px_120px_-20px_rgba(0,0,0,0.35)]
                    rounded-[2.2rem] sm:rounded-[3rem]
                    overflow-hidden
                    /* MOBILE: wider and proportionally less tall */
                    aspect-[9/16]
                    w-full
                    max-w-[400px]
                    mx-auto
                    /* DESKTOP */
                    sm:max-w-none
                    sm:w-[340px]
                    sm:h-[737px]
                    sm:aspect-auto
                    border-[5px] sm:border-[9px] border-[#0d0d0d]
                    ring-1 ring-white/10
                  "
                >
                  {/* Status bar */}
                  <div className="absolute top-0 left-0 right-0 h-[22px] sm:h-[26px] z-[65] flex items-center justify-between px-3 sm:px-5 text-white/80 text-[8px] sm:text-[10px] font-semibold bg-gradient-to-b from-black/30 to-transparent pointer-events-none">

                  </div>

                  {/* Dynamic Island */}
                  <div className="absolute top-[10px] sm:top-[5px] left-1/2 -translate-x-1/2 w-[100px] sm:w-[72px] h-[30px] sm:h-[18px] bg-black rounded-full z-[70] flex items-center justify-center">
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#1a1a1a] mr-1 sm:mr-1.5"></div>
                  </div>

                  {/* Scrollable Template Content */}
                  <div className="absolute inset-0 overflow-y-auto hide-scrollbar pt-[28px] sm:pt-[34px] pb-4 sm:pb-6 [-webkit-overflow-scrolling:touch]">
                    <div className="WebInvitesPreviewContainer editor-preview-wrapper" style={{ containerType: 'inline-size', width: '100%', maxWidth: '100%', ...getEditorCSSVars(editorSettings).vars }}>                      <Suspense fallback={<div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading template…</div>}>
                        <TemplateComponent
                          key={templateId}
                          data={templateData}
                          isDraft={false}
                          editable={true}
                          onEdit={handleInlineEdit}
                        />
                      </Suspense>
                    </div>
                  </div>




                  {/* Home Indicator */}
                  <div className="absolute bottom-[10px] sm:bottom-[5px] left-1/2 -translate-x-1/2 w-[100px] sm:w-[72px] h-[7px] sm:h-[2.5px] rounded-full bg-white/40 z-[70]"></div>
                </div>

                {/* Phone Caption */}
                <div className="mt-4 sm:mt-5 flex items-center justify-center gap-2 text-[var(--ink-muted)] text-[11px] sm:text-xs font-medium">
                  <Eye className="w-3.5 h-3.5 text-[var(--emerald-primary)]" />
                  Reference preview · confirm details then publish
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Payment Banner — ONLY visible in Step 2 */}
      {step === 2 && (
        <div
          className="
            fixed bottom-0 left-0 right-0 z-[95]
            animate-in slide-in-from-bottom-8 fade-in duration-500
            pb-[env(safe-area-inset-bottom)]
            supports-[padding-bottom:env(safe-area-inset-bottom)]:pb-[max(0px,env(safe-area-inset-bottom))]
            pointer-events-auto
          "
        >
          <PaymentBanner formData={templateData} templateId={templateId} />
        </div>
      )}

      {/* Live Editor Toolbar — only in Step 1 */}
      {step === 1 && (
        <LiveEditorToolbar
          editorSettings={editorSettings}
          onSettingsChange={setEditorSettings}
          photoUrl={templateData.photoUrl || ''}
          onPhotoChange={(url) => handleInlineEdit('photoUrl', url)}
          draftId={templateId}
        />
      )}

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

/**
 * Skeleton for the template Suspense fallback inside the phone frame.
 * Pure CSS shimmer — no client JS needed.
 */
function TemplateSkeletonFallback() {
  const shimmerBg = 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 40%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0.55) 60%, transparent 100%)';
  const Bar = ({ className }) => (
    <div className={`relative overflow-hidden bg-stone-200/70 ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_ease-in-out_infinite]" style={{ background: shimmerBg }} />
    </div>
  );
  return (
    <div className="flex items-center justify-center min-h-[350px] w-full px-6">
      <div className="w-full max-w-[260px] space-y-4">
        <Bar className="w-full h-36 rounded-2xl" />
        <div className="space-y-2 text-center">
          <Bar className="h-5 w-40 mx-auto rounded-lg" />
          <Bar className="h-3 w-28 mx-auto rounded" />
        </div>
        <div className="space-y-2">
          <Bar className="h-3 w-full rounded" />
          <Bar className="h-3 w-5/6 mx-auto rounded" />
        </div>
        <Bar className="w-full h-24 rounded-2xl" />
      </div>
    </div>
  );
}
