'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState, useCallback, Suspense } from 'react';
import { templates } from '@/components/templates';
import PaymentBanner from '@/components/PaymentBanner';
import SiteNavbar, { UserAccountButton } from '@/components/SiteNavbar';
import LiveEditorToolbar, { getEditorCSSVars } from '@/components/editor/LiveEditorToolbar';
import usePersistedState from '@/lib/use-persisted-state';
import {
  ArrowLeft,
  CheckCircle2,
  Edit3,
  Eye,
  Loader2,
  Save,
  Sparkles,
  XCircle,
  ExternalLink,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  Lock,
  ShieldAlert,
} from 'lucide-react';
import { useAuth, prettyPhone } from '@/lib/auth';

const DEFAULT_TEMPLATE_ID = 'standard-crimson';

// ---------- Helpers ----------
const mapDBtoForm = (dbRow) => {
  const td = dbRow?.template_data || {};
  const photo = dbRow?.photo_url || td?.photoUrl || td?.heroImage || '';
  return {
    templateId: dbRow?.template_id,
    groomName: dbRow?.groom_name,
    brideName: dbRow?.bride_name,
    weddingDate: dbRow?.wedding_date,
    weddingTime: dbRow?.wedding_time,
    venue: dbRow?.venue,
    venueAddress: dbRow?.venue_address || dbRow?.venue,
    mapsUrl: dbRow?.maps_url,
    mapUrl: dbRow?.maps_url,
    directionsUrl: dbRow?.maps_url,
    whatsappNumber: dbRow?.whatsapp_number,
    groomParents: dbRow?.groom_parents,
    brideParents: dbRow?.bride_parents,
    heroTagline: dbRow?.hero_tagline,
    heroEventText: dbRow?.hero_event_text,
    countdownTitle: dbRow?.countdown_title,
    photoUrl: photo,
    heroImage: photo,
    templateData: {
      ...td,
      ...(photo ? { photoUrl: photo, heroImage: photo } : {}),
    },
  };
};

/**
 * Interactive editor client component.
 * Receives server-fetched invitation as prop — no loading waterfall on initial render.
 *
 * Props:
 *   initialInvitation – The invitation row from Supabase (server-fetched)
 *   invitationId      – The invitation ID from params
 */
export default function EditClient({ initialInvitation, invitationId }) {
  const router = useRouter();
  const { user, loading: authLoading, userPhone, signOut, session } = useAuth();

  const authHeaders = useMemo(() => {
    const h = {};
    const t = session?.access_token;
    if (t) h.Authorization = `Bearer ${t}`;
    return Object.keys(h).length ? h : undefined;
  }, [session]);

  const [invitation, setInvitation] = useState(initialInvitation);
  const [loadError, setLoadError] = useState('');

  const resolvedTemplateId = invitation?.template_id || DEFAULT_TEMPLATE_ID;
  const TemplateComponent = templates[resolvedTemplateId] || templates[DEFAULT_TEMPLATE_ID];
  const templateLabel = String(resolvedTemplateId).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const STANDARD_FIELDS = new Set([
    'templateId', 'groomName', 'brideName', 'weddingDate', 'weddingTime',
    'venue', 'venueAddress', 'mapsUrl', 'mapUrl', 'directionsUrl',
    'whatsappNumber', 'groomParents', 'brideParents', 'heroTagline', 'heroEventText', 'countdownTitle',
  ]);

  const defaults = useMemo(() => {
    const td = invitation?.template_data || {};
    const photo = invitation?.photo_url || td?.photoUrl || td?.heroImage || '';
    return {
      groomName: invitation?.groom_name || "Rizwan",
      brideName: invitation?.bride_name || "Ayesha",
      weddingDate: invitation?.wedding_date || "2026-12-25",
      weddingTime: invitation?.wedding_time || "10:00 AM",
      venue: invitation?.venue || "Grand Palace Auditorium",
      venueAddress: invitation?.venue_address || "Beach Road, Calicut, Kerala 673001, India",
      mapsUrl: invitation?.maps_url || "https://www.google.com/maps/search/?api=1&query=Calicut+Kerala",
      mapUrl: invitation?.maps_url || "https://www.google.com/maps/search/?api=1&query=Calicut+Kerala",
      directionsUrl: invitation?.maps_url || "https://www.google.com/maps/search/?api=1&query=Calicut+Kerala",
      whatsappNumber: invitation?.whatsapp_number || "919876543210",
      groomParents: invitation?.groom_parents || "",
      brideParents: invitation?.bride_parents || "",
      heroTagline: invitation?.hero_tagline || "With the blessings of our families, we invite you to share in our joy",
      heroEventText: invitation?.hero_event_text || "as we embark on this beautiful journey together",
      countdownTitle: invitation?.countdown_title || "Counting Every Moment",
      photoUrl: photo,
      heroImage: photo,
      templateData: {
        ...td,
        ...(photo ? { photoUrl: photo, heroImage: photo } : {}),
      },
    };
  }, [invitation]);

  const [formData, setFormData] = useState(defaults);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState({ tone: '', text: '' });
  const [editorSettings, setEditorSettings] = usePersistedState(
    `editor-settings-${invitationId}`,
    { heroFontFamily: 'cinzel', fontFamily: 'cinzel', fontSize: 16, showRsvp: true, showPhotoSection: true, showEvents: true },
  );

  useEffect(() => {
    const td = invitation?.template_data || defaults.templateData || {};
    const photo = invitation?.photo_url || td?.photoUrl || td?.heroImage || defaults.photoUrl || '';
    setFormData({
      groomName: invitation?.groom_name || defaults.groomName,
      brideName: invitation?.bride_name || defaults.brideName,
      weddingDate: invitation?.wedding_date || defaults.weddingDate,
      weddingTime: invitation?.wedding_time || defaults.weddingTime,
      venue: invitation?.venue || defaults.venue,
      venueAddress: invitation?.venue_address || defaults.venueAddress,
      mapsUrl: invitation?.maps_url || defaults.mapsUrl,
      mapUrl: invitation?.maps_url || defaults.mapUrl,
      directionsUrl: invitation?.maps_url || defaults.directionsUrl,
      whatsappNumber: invitation?.whatsapp_number || defaults.whatsappNumber,
      groomParents: invitation?.groom_parents || defaults.groomParents,
      brideParents: invitation?.bride_parents || defaults.brideParents,
      heroTagline: invitation?.hero_tagline || defaults.heroTagline,
      heroEventText: invitation?.hero_event_text || defaults.heroEventText,
      countdownTitle: invitation?.countdown_title || defaults.countdownTitle,
      photoUrl: photo,
      heroImage: photo,
      templateData: {
        ...td,
        ...(photo ? { photoUrl: photo, heroImage: photo } : {}),
      },
    });
  }, [invitation?.id]);

  const MAX_EDITS = 3;
  const editCount = typeof invitation?.edit_count === 'number'
    ? invitation.edit_count
    : (Number(invitation?.template_data?._edit_count) || 0);
  const isPaid = !!invitation?.is_paid;
  const editsRemaining = Math.max(0, MAX_EDITS - editCount);
  const isEditLimitReached = isPaid && editsRemaining <= 0;

  const handleInlineEdit = useCallback((field, value) => {
    if (isEditLimitReached) return;
    setFormData(prev => {
      if (STANDARD_FIELDS.has(field)) {
        const next = { ...prev, [field]: value };
        if (field === 'mapsUrl' || field === 'mapUrl' || field === 'directionsUrl') {
          next.mapsUrl = value;
          next.mapUrl = value;
          next.directionsUrl = value;
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
      return { ...prev, templateData: { ...(prev.templateData || {}), [field]: value } };
    });
  }, [isEditLimitReached]);

  const templateData = useMemo(() => {
    const canonical = formData.mapsUrl || formData.mapUrl || formData.directionsUrl;
    const td = formData.templateData || {};
    return {
      ...td,
      ...formData,
      photoUrl: td.photoUrl || formData.photoUrl || td.heroImage || formData.heroImage || '',
      showPhotoSection: editorSettings.showPhotoSection !== false,
      showRsvp: editorSettings.showRsvp !== false,
      showEvents: editorSettings.showEvents !== false,
      mapsUrl: canonical,
      mapUrl: canonical,
      directionsUrl: canonical,
    };
  }, [formData, editorSettings]);

  const editsCount = useMemo(() => {
    const left = mapDBtoForm(invitation || {});
    let n = 0;
    Object.keys(left).forEach(k => {
      if (k === 'templateId') return;
      if (String(formData[k] ?? '') !== String(left[k] ?? '')) n++;
    });
    const origTd = left.templateData || {};
    const currTd = formData.templateData || {};
    const allTdKeys = new Set([...Object.keys(origTd), ...Object.keys(currTd)]);
    allTdKeys.forEach(k => {
      if (String(origTd[k] ?? '') !== String(currTd[k] ?? '')) n++;
    });
    return n;
  }, [formData, invitation]);

  const bannerFormData = useMemo(() => ({
    ...templateData,
    templateId: resolvedTemplateId,
  }), [templateData, resolvedTemplateId]);

  const handleSaveChanges = async () => {
    if (isEditLimitReached) {
      setSaveMsg({
        tone: 'red',
        text: 'You have reached the maximum limit of 3 edits for this invitation. Please contact support if you need further changes.',
      });
      return;
    }

    setSaving(true);
    setSaveMsg({ tone: '', text: '' });
    try {
      const canonical = formData.mapsUrl || formData.mapUrl || formData.directionsUrl;
      const photo = formData.photoUrl || formData.heroImage || formData.templateData?.photoUrl || formData.templateData?.heroImage || '';
      const res = await fetch(`/api/invitations/${encodeURIComponent(invitationId)}`, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: {
          ...(authHeaders || {}),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: resolvedTemplateId,
          groomName: formData.groomName,
          brideName: formData.brideName,
          weddingDate: formData.weddingDate,
          weddingTime: formData.weddingTime,
          venue: formData.venue,
          venueAddress: formData.venueAddress,
          mapsUrl: canonical,
          whatsappNumber: formData.whatsappNumber,
          groomParents: formData.groomParents,
          brideParents: formData.brideParents,
          heroTagline: formData.heroTagline,
          heroEventText: formData.heroEventText,
          countdownTitle: formData.countdownTitle,
          photoUrl: photo || undefined,
          templateData: {
            ...(formData.templateData || {}),
            ...(photo ? { photoUrl: photo, heroImage: photo } : {}),
            ...(editorSettings.showPhotoSection !== undefined ? { showPhotoSection: editorSettings.showPhotoSection } : {}),
            ...(editorSettings.showRsvp !== undefined ? { showRsvp: editorSettings.showRsvp } : {}),
            ...(editorSettings.showEvents !== undefined ? { showEvents: editorSettings.showEvents } : {}),
          },
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Failed to save');
      if (body.invitation) {
        setInvitation(body.invitation);
      }
      const remainingAfter = body.edits_remaining !== undefined
        ? body.edits_remaining
        : Math.max(0, editsRemaining - 1);
      setSaveMsg({
        tone: 'emerald',
        text: isPaid
          ? `Saved! Your live invitation link is updated. (${remainingAfter} of ${MAX_EDITS} edits remaining)`
          : 'Saved! Your draft has been updated.',
      });
    } catch (e) {
      setSaveMsg({ tone: 'red', text: e?.message || 'Could not save. Please try again.' });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg({ tone: '', text: '' }), 6000);
    }
  };

  const PaymentBannerWithExisting = invitationId ? (
    <PaymentBanner
      formData={bannerFormData}
      templateId={resolvedTemplateId}
      existingInvitationId={invitationId}
      invitationAlreadyPaid={!!invitation?.is_paid}
      onAfterSignInAutoPublish={invitation?.is_paid ? handleSaveChanges : undefined}
    />
  ) : null;

  const handleResetToDB = () => {
    if (!invitation) return;
    setFormData({
      groomName: invitation.groom_name || defaults.groomName,
      brideName: invitation.bride_name || defaults.brideName,
      weddingDate: invitation.wedding_date || defaults.weddingDate,
      weddingTime: invitation.wedding_time || defaults.weddingTime,
      venue: invitation.venue || defaults.venue,
      venueAddress: invitation.venue_address || defaults.venueAddress,
      mapsUrl: invitation.maps_url || defaults.mapsUrl,
      mapUrl: invitation.maps_url || defaults.mapUrl,
      directionsUrl: invitation.maps_url || defaults.directionsUrl,
      whatsappNumber: invitation.whatsapp_number || defaults.whatsappNumber,
      groomParents: invitation.groom_parents || defaults.groomParents,
      brideParents: invitation.bride_parents || defaults.brideParents,
      heroTagline: invitation.hero_tagline || defaults.heroTagline,
      heroEventText: invitation.hero_event_text || defaults.heroEventText,
      countdownTitle: invitation.countdown_title || defaults.countdownTitle,
    });
  };

  // While auth is loading, show skeleton
  if (authLoading) {
    const { default: EditPageSkeleton } = require('@/components/skeletons/EditPageSkeleton');
    return <EditPageSkeleton />;
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[var(--cream)] via-white to-[var(--emerald-light)]/40">
        <div className="max-w-xl mx-auto px-4 sm:px-6 pt-16 pb-24 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-red-50 ring-1 ring-red-200 text-red-600 flex items-center justify-center mb-4">
            <XCircle className="w-7 h-7" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl text-[var(--ink)] mb-2 tracking-tight">
            Could not load invitation
          </h1>
          <p className="text-sm sm:text-base text-[var(--ink-muted)] leading-relaxed mb-6">{loadError}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white ring-1 ring-black/5 hover:bg-[var(--emerald-light)]/60 text-[var(--ink)] font-bold text-sm transition-colors">
              ← Back to Dashboard
            </Link>
            <button
              onClick={() => router.refresh()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[var(--emerald-primary)] text-white font-bold text-sm shadow-md shadow-[var(--emerald-primary)]/20 hover:bg-[var(--emerald-dark)] transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  const inviteLink =
    typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.host}/i/${encodeURIComponent(invitation?.slug || '')}`
      : '';

  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--cream)] via-white to-[var(--emerald-light)]/40">
      {/* Header */}
      <div className="sticky top-0 z-[120] backdrop-blur bg-white/75 border-b border-black/5">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[var(--ink-soft)] hover:text-[var(--emerald-primary)] hover:bg-[var(--emerald-light)]/60 text-xs sm:text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Dashboard</span>
          </Link>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white ring-1 ring-black/5 shadow-sm">
            <Sparkles className="w-4 h-4 text-[var(--champagne-500)]" />
            <div className="leading-tight">
              <div className="text-[10px] uppercase tracking-widest font-bold text-[var(--ink-muted)]">Editing</div>
              <div className="text-[12px] font-bold text-[var(--ink)] truncate max-w-[180px] sm:max-w-none">
                {invitation?.bride_name || 'Bride'} &amp; {invitation?.groom_name || 'Groom'} 
              </div>
            </div>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2 sm:gap-2.5">
            {isPaid && (
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold ring-1 transition-all ${
                isEditLimitReached
                  ? 'bg-rose-50 text-rose-800 ring-rose-200'
                  : editsRemaining === 1
                    ? 'bg-amber-50 text-amber-900 ring-amber-300'
                    : 'bg-emerald-50 text-emerald-800 ring-emerald-200'
              }`}>
                {isEditLimitReached ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-rose-600" />
                    <span>0 of 3 edits left (Locked)</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{editsRemaining} of 3 edits remaining</span>
                  </>
                )}
              </div>
            )}

            {!isEditLimitReached && editsCount > 0 && (
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 ring-1 ring-amber-200 text-amber-800 text-[11px] font-bold">
                <Edit3 className="w-3.5 h-3.5" /> {editsCount} change{editsCount === 1 ? '' : 's'} unsaved
              </div>
            )}

            <button
              onClick={handleSaveChanges}
              disabled={saving || isEditLimitReached}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold shadow-md transition-all ${
                isEditLimitReached
                  ? 'bg-slate-300 text-slate-600 cursor-not-allowed shadow-none'
                  : 'bg-[var(--emerald-primary)] text-white shadow-[var(--emerald-primary)]/15 hover:bg-[var(--emerald-dark)] active:scale-[0.98] disabled:opacity-70'
              }`}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isEditLimitReached ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving
                ? 'Saving…'
                : isEditLimitReached
                  ? 'Edits Locked (3/3 used)'
                  : `Save Changes (${editsRemaining} left)`}
            </button>

            {invitation?.slug && (
              <Link
                href={`/i/${encodeURIComponent(invitation.slug)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white ring-1 ring-black/5 hover:bg-[var(--emerald-light)]/60 text-[var(--ink-soft)] hover:text-[var(--ink)] font-semibold text-xs transition-colors"
              >
                <Eye className="w-4 h-4" /> View Live
              </Link>
            )}

            <UserAccountButton />
          </div>
        </div>

        {saveMsg.text && (
          <div className={`max-w-7xl mx-auto px-3 sm:px-6 pb-3`}>
            <div className={`rounded-2xl px-4 py-2.5 flex items-start gap-2 text-xs sm:text-sm font-semibold ${
              saveMsg.tone === 'emerald'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {saveMsg.tone === 'emerald' ? (
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
              )}
              <span className="leading-relaxed">{saveMsg.text}</span>
            </div>
          </div>
        )}
      </div>

      {/* EDITOR LAYOUT */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-[230px] sm:pb-[250px]">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px] gap-4 sm:gap-6 items-start">
          {/* LEFT: Live phone preview */}
          <section className="order-2 lg:order-1 w-full pb-24 sm:pb-28">
            <div className="w-full flex justify-center lg:justify-end">
              <div
                className={`relative w-full max-w-[400px] sm:max-w-[400px] lg:max-w-[440px] shrink-0 rounded-[54px] sm:rounded-[58px] border-[10px] sm:border-[12px] border-[#0f172a] shadow-2xl shadow-slate-900/40 overflow-hidden transition-all`}
                style={{ aspectRatio: '393 / 852' }}
              >
                <div className="absolute top-[6px] sm:top-2 left-1/2 -translate-x-1/2 w-[90px] sm:w-[100px] h-[23px] sm:h-7 bg-black rounded-full z-[90]"></div>

                <div className="absolute inset-0 overflow-y-auto hide-scrollbar pt-[28px] sm:pt-[34px] pb-4 sm:pb-6 [-webkit-overflow-scrolling:touch]">
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
                    <Suspense fallback={
                      <div className="flex items-center justify-center min-h-[350px] w-full">
                        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                      </div>
                    }>
                      <TemplateComponent
                        key={resolvedTemplateId}
                        data={templateData}
                        isDraft={!invitation?.is_paid}
                        editable={!isEditLimitReached}
                        onInlineEdit={handleInlineEdit}
                      />
                    </Suspense>
                  </div>
                </div>

                <div className="absolute bottom-[10px] sm:bottom-[5px] left-1/2 -translate-x-1/2 w-[100px] sm:w-[72px] h-[7px] sm:h-[2.5px] rounded-full bg-white/40 z-[70]"></div>
              </div>
            </div>
          </section>

          {/* RIGHT: Details form */}
          <section className="order-1 lg:order-2 w-full space-y-4 sm:space-y-5 pb-36 sm:pb-40">
            {/* Edit Policy Banner */}
            <div className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-sm ${
              isEditLimitReached
                ? 'bg-rose-50/90 border-rose-200 text-rose-950'
                : editsRemaining === 1
                  ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                  : 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  isEditLimitReached
                    ? 'bg-rose-100 text-rose-600'
                    : editsRemaining === 1
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {isEditLimitReached ? (
                    <Lock className="w-5 h-5" />
                  ) : editsRemaining === 1 ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <Info className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5">
                      <span>Edit Policy Disclaimer</span>
                      <span className="font-normal opacity-70">·</span>
                      <span>Max 3 Edits Allowed</span>
                    </h3>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                      isEditLimitReached
                        ? 'bg-rose-200/80 text-rose-800'
                        : editsRemaining === 1
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-emerald-200/80 text-emerald-900'
                    }`}>
                      {isEditLimitReached ? (
                        <>0 of 3 Edits Left (Locked)</>
                      ) : (
                        <>{editsRemaining} of 3 Edits Remaining</>
                      )}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm opacity-90 leading-relaxed">
                    {isEditLimitReached ? (
                      <>You have used all <strong>3 allowed edits</strong> for this invitation. To protect published invite integrity, further live updates are locked. For emergency corrections, please contact support.</>
                    ) : (
                      <>Clients can make edits up to <strong>3 times</strong> after publishing. Each time you click &quot;Save Changes&quot;, your live invitation updates instantly.</>
                    )}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    {[1, 2, 3].map((step) => {
                      const isUsed = editCount >= step;
                      return (
                        <div key={step} className="flex-1 flex items-center gap-1.5">
                          <div className={`h-2 flex-1 rounded-full transition-all ${
                            isUsed
                              ? isEditLimitReached ? 'bg-rose-500' : 'bg-emerald-600'
                              : 'bg-black/10'
                          }`} />
                          <span className="text-[10px] font-bold opacity-75">
                            {isUsed ? `Edit ${step} ✓` : `Edit ${step}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <LiveEditorToolbar
              formData={formData}
              onInlineEdit={handleInlineEdit}
              editorSettings={editorSettings}
              onSettingsChange={setEditorSettings}
              isEditLimitReached={isEditLimitReached}
              onResetToDB={handleResetToDB}
            />

            {/* Payment Banner */}
            {PaymentBannerWithExisting}
          </section>
        </div>
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}
