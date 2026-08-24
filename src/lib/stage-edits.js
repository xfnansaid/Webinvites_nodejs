// Shared client-side storage helpers for the "staged edits" flow.
//
// Flow when an anonymous user tries to publish:
//   1. [Client] PaymentBanner calls stageEditsAndRedirect → saveStagedEdits(...)
//      (and optionally saves a server-side draft via /api/save-draft → draftId)
//   2. [Client] User redirected to Google OAuth.
//   3. [Client] Google returns → signin page routes them back to the editor page.
//   4. [Client] create/[templateId]/page.js MOUNTS → calls
//      peekStagedEditsForRestore() to restore formData instantly (no flicker),
//      then optionally claims any server-side draft via /api/claim-draft.
//   5. [Client] PaymentBanner mounts → consumeForPublishStagedEdits() to resume
//      the Publish flow.
//
// Key principle:
//   The LIVE EDITOR form state must survive the Google OAuth round trip. We
//   use two storage tiers to guarantee this for the user:
//
//     Tier 1: localStorage (wi_publish_stage_v1) → survives page refresh,
//             used for INSTANT visual restore on mount; cleared when user
//             navigates to another template or explicitly discards.
//
//     Tier 2: Supabase drafts table (via /api/save-draft + /api/claim-draft)
//             → permanent, survives browser cache clears, auto-associated
//             with the user's Google account on claim.

export const STAGE_KEY = 'wi_publish_stage_v1';
export const STAGE_MAX_AGE_MS = 20 * 60 * 1000; // 20 minutes

function isWindow() {
  return typeof window !== 'undefined';
}

function safeParse(raw) {
  try {
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function ageValid(parsed) {
  if (!parsed || typeof parsed.at !== 'number') return false;
  const age = Date.now() - parsed.at;
  return age >= 0 && age <= STAGE_MAX_AGE_MS;
}

export function saveStagedEdits(stage) {
  if (!isWindow()) return null;
  if (!stage || typeof stage !== 'object') return null;
  const payload = {
    at: Date.now(),
    ...stage,
  };
  try {
    localStorage.setItem(STAGE_KEY, JSON.stringify(payload));
    return payload;
  } catch {
    return null;
  }
}

// Return the staged edits WITHOUT removing them. Used by the Live Editor on
// mount so the user sees all their groom/bride/venue edits restored instantly
// after the Google redirect round trip.
export function peekStagedEditsForRestore({ templateIdFilter = null } = {}) {
  if (!isWindow()) return null;
  try {
    const raw = localStorage.getItem(STAGE_KEY);
    const parsed = safeParse(raw);
    if (!parsed) return null;
    if (!ageValid(parsed)) {
      localStorage.removeItem(STAGE_KEY);
      return null;
    }
    if (templateIdFilter && parsed.templateId !== templateIdFilter) {
      return null;
    }
    // Deep-clone so mutations in caller don't affect cached data.
    return JSON.parse(JSON.stringify(parsed));
  } catch {
    try { localStorage.removeItem(STAGE_KEY); } catch {}
    return null;
  }
}

// Consume (read + remove) the staged edits. Used by PaymentBanner just before
// calling handlePay with the staged form so we don't accidentally re-publish
// twice when the user navigates back.
export function consumeForPublishStagedEdits({ templateIdFilter = null } = {}) {
  if (!isWindow()) return null;
  try {
    const raw = localStorage.getItem(STAGE_KEY);
    const parsed = safeParse(raw);
    if (!parsed) return null;
    if (!ageValid(parsed)) {
      localStorage.removeItem(STAGE_KEY);
      return null;
    }
    if (templateIdFilter && parsed.templateId !== templateIdFilter) {
      return null;
    }
    localStorage.removeItem(STAGE_KEY);
    return JSON.parse(JSON.stringify(parsed));
  } catch {
    try { localStorage.removeItem(STAGE_KEY); } catch {}
    return null;
  }
}

// Explicit discard (for example when user clicks Reset All, or navigates away
// to a different template, or the publish operation succeeds and we don't
// want stale form data lingering in localStorage).
export function discardStagedEdits() {
  if (!isWindow()) return;
  try { localStorage.removeItem(STAGE_KEY); } catch {}
}
