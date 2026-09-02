'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Type,
  SlidersHorizontal,
  Layers,
  X,
  Check,
  MessageCircle,
  Clock,
  MapPin,
  Sparkles,
  Image as ImageIcon,
  Camera,
  Upload,
  Trash2,
  Loader2,
  Calendar,
  CalendarClock,
  Wand2,
  RotateCcw,
  LetterText,
} from 'lucide-react';
import { compressImage } from '@/lib/compressImage';
import { FONT_OPTIONS, FONT_SIZES, getEditorCSSVars } from '@/lib/editor-css';

export { FONT_OPTIONS, FONT_SIZES, getEditorCSSVars };

/* ======================================================================
   ONE-TAP STYLE PRESETS — whole-template typography + spacing makeovers.
   Each preset describes: heroFontFamily, global fontSize.
   When user taps a preset, the editor's onSettingsChange writes the keys.
   ====================================================================== */
export const SECTION_PRESETS = [
  {
    id: 'classic',
    name: 'Classic Royal',
    tagline: 'Timeless serif, balanced spacing',
    heroFontFamily: 'cinzel',
    fontSize: 14,
    accent: 'from-amber-400 to-rose-500',
  },
  {
    id: 'romantic',
    name: 'Romantic Script',
    tagline: 'Brush-script names, soft body',
    heroFontFamily: 'alex',
    fontSize: 14,
    accent: 'from-pink-400 to-fuchsia-500',
  },
  {
    id: 'modern',
    name: 'Modern Minimal',
    tagline: 'Clean sans-serif, tight type',
    heroFontFamily: 'jost',
    fontSize: 14,
    accent: 'from-slate-400 to-emerald-500',
  },
  {
    id: 'elegant',
    name: 'Elegant Didot',
    tagline: 'Hairline serifs, luxury look',
    heroFontFamily: 'italiana',
    fontSize: 14,
    accent: 'from-indigo-400 to-amber-400',
  },
  {
    id: 'festive',
    name: 'Festive Bold',
    tagline: 'Larger names, bolder impact',
    heroFontFamily: 'cormorant',
    fontSize: 14,
    accent: 'from-orange-400 to-red-500',
  },
];

export const COLOR_PALETTES = [
  { id: 'crimson',    label: 'Crimson Gold',  primary: '#781B28', accent: '#E8C882' },
  { id: 'emerald',    label: 'Emerald Mist',  primary: '#0f382c', accent: '#c8b98e' },
  { id: 'royal',      label: 'Royal Ivory',   primary: '#1e2a5a', accent: '#e4d8a7' },
  { id: 'blush',      label: 'Blush Rose',    primary: '#882244', accent: '#f4c2c2' },
  { id: 'saffron',    label: 'Saffron',       primary: '#7c2d12', accent: '#facc15' },
  { id: 'midnight',   label: 'Midnight Blue', primary: '#0a1533', accent: '#c7a77c' },
];

/* ======================================================================
   SLIDE-UP PANEL SHEET
   ====================================================================== */

function Panel({ open, onClose, title, icon: Icon, children }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] animate-fadeIn"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="fixed bottom-0 left-0 right-0 z-[101] animate-slideUp"
      >
        <div className="max-w-lg mx-auto bg-white rounded-t-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.15)] max-h-[70vh] flex flex-col overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              {Icon && <Icon className="w-4.5 h-4.5 text-[var(--emerald-primary)]" />}
              <h3 className="text-sm font-bold text-[var(--ink)]">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              aria-label="Close panel"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="overflow-y-auto overscroll-contain px-5 py-4 flex-1">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

/* ======================================================================
   HERO FONT PANEL
   ====================================================================== */

function HeroFontPanel({ currentFont, onSelect }) {
  const [filter, setFilter] = useState('all');
  const types = ['all', 'serif', 'sans', 'cursive'];
  const filtered = filter === 'all' ? FONT_OPTIONS : FONT_OPTIONS.filter(f => f.style === filter);

  return (
    <div className="space-y-4">
      <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-3 flex items-center gap-2.5">
        <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
        <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
          Font selection applies <strong>only to the Hero Section</strong> (Bride &amp; Groom names, tagline, parents).
        </p>
      </div>

      <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl">
        {types.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`flex-1 py-2 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
              filter === t
                ? 'bg-white text-[var(--emerald-primary)] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'all' ? 'All' : t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2">
        {filtered.map(font => (
          <button
            key={font.id}
            onClick={() => onSelect(font.id)}
            className={`flex items-center gap-4 p-3.5 rounded-2xl border-2 transition-all text-left ${
              currentFont === font.id
                ? 'border-[var(--emerald-primary)] bg-[var(--emerald-light)]/50 shadow-sm'
                : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex-1 min-w-0">
              <div
                className="text-lg text-[var(--ink)] truncate"
                style={{ fontFamily: font.family }}
              >
                {font.name}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mt-0.5">
                {font.label} · {font.style}
              </div>
            </div>
            {currentFont === font.id && (
              <div className="w-6 h-6 rounded-full bg-[var(--emerald-primary)] flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ======================================================================
   TEXT SIZE PANEL
   ====================================================================== */

function SizePanel({ currentSize = 14, onChange }) {
  const minSize = 12;
  const maxSize = 26;
  const sizeNum = Number(currentSize) || 14;
  const pct = Math.round((sizeNum / 14) * 100);

  const getLabel = (sz) => {
    if (sz <= 14) return 'Small (S)';
    if (sz <= 16) return 'Medium (M)';
    if (sz <= 18) return 'Large (L)';
    if (sz <= 20) return 'Extra Large (XL)';
    return 'Display (XXL)';
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-widest text-gray-400 font-bold">
          Adjust text size for editable fields
        </p>
        <span className="text-[11px] font-bold text-[var(--emerald-primary)] bg-[var(--emerald-light)] px-2.5 py-0.5 rounded-full">
          {getLabel(sizeNum)} · {pct}%
        </span>
      </div>

      <div className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100/80">
        <div
          className="text-[var(--ink)] font-medium leading-snug transition-all duration-200"
          style={{ fontSize: `${sizeNum}px` }}
        >
          {sizeNum}px — Preview Text Size
        </div>
        <p className="text-[10px] text-gray-400 mt-1">
          Applies to all editable invitation texts (Names, Dates, Venue, Family &amp; Quotes)
        </p>
      </div>

      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {FONT_SIZES.map(size => {
          const isSelected = sizeNum === size.value;
          return (
            <button
              key={size.value}
              type="button"
              onClick={() => onChange(size.value)}
              className={`py-2.5 sm:py-3 rounded-xl border-2 transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                isSelected
                  ? 'border-[var(--emerald-primary)] bg-[var(--emerald-light)]/60 text-[var(--emerald-primary)] shadow-sm scale-[1.02]'
                  : 'border-gray-100 bg-white hover:border-gray-200 text-gray-600'
              }`}
            >
              <span className={`text-[12px] sm:text-[13px] font-black ${isSelected ? 'text-[var(--emerald-primary)]' : 'text-gray-800'}`}>
                {size.label}
              </span>
              <span className="text-[9px] text-gray-400 font-semibold">{size.value}px</span>
            </button>
          );
        })}
      </div>

      <div className="px-1 pt-1">
        <div className="flex items-center justify-between mb-1.5 text-xs text-gray-500 font-medium">
          <span>Fine-tune Slider</span>
          <span className="font-bold text-[var(--ink)]">{sizeNum}px</span>
        </div>
        <input
          type="range"
          min={minSize}
          max={maxSize}
          step={1}
          value={sizeNum}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-200 accent-[var(--emerald-primary)]"
        />
        <div className="flex justify-between mt-1 text-[10px] text-gray-400 font-semibold">
          <span>{minSize}px (S)</span>
          <span>14px (Default S)</span>
          <span>{maxSize}px (XXL)</span>
        </div>
      </div>
    </div>
  );
}

/* ======================================================================
   COMBINED SECTIONS & VISIBILITY PANEL
   ====================================================================== */

function SectionsPanel({
  showPhotoSection = true,
  photoUrl = '',
  onTogglePhoto,
  onPhotoChange,
  showEvents = true,
  onToggleEvents,
  showRsvp = true,
  onToggleRsvp,
  draftId = 'draft',
}) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setIsUploading(true);

    try {
      // 1. Client-side compression
      const compressedBlob = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.82,
        mimeType: 'image/webp',
        targetSizeKB: 200,
      });

      // 2. Upload to /api/upload-photo
      const formData = new FormData();
      formData.append('photo', compressedBlob, 'couple-photo.webp');
      formData.append('draftId', draftId);

      const res = await fetch('/api/upload-photo', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      if (data.photoUrl && onPhotoChange) {
        onPhotoChange(data.photoUrl);
      }
    } catch (err) {
      console.error('[Photo Upload Error]', err);
      setUploadError(err.message || 'Could not upload photo');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const activeCount = [showPhotoSection, showEvents, showRsvp].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif"
        className="hidden"
        onChange={handleFileSelect}
      />

      <div className="flex items-center justify-between pb-0.5">
        <p className="text-[11px] uppercase tracking-widest text-gray-400 font-bold">
          Toggle Sections On or Off
        </p>
        <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full">
          {activeCount} of 3 Visible
        </span>
      </div>

      {/* ── 1. COUPLE PHOTO SECTION ── */}
      <div className={`bg-white border rounded-2xl p-4 shadow-sm space-y-3 transition-all ${
        showPhotoSection ? 'border-amber-200/80 ring-1 ring-amber-400/20' : 'border-gray-150'
      }`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              showPhotoSection ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'
            }`}>
              <ImageIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-[var(--ink)] flex items-center gap-1.5">
                <span>Couple Photo</span>
                {showPhotoSection ? (
                  <span className="text-[9.5px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                    ON
                  </span>
                ) : (
                  <span className="text-[9.5px] font-extrabold text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded-full">
                    OFF
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 truncate">Display couple photo &amp; romantic memories</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onTogglePhoto(!showPhotoSection)}
            className={`w-12 h-7 rounded-full transition-all relative shrink-0 cursor-pointer ${
              showPhotoSection ? 'bg-amber-500' : 'bg-gray-300'
            }`}
          >
            <div
              className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all ${
                showPhotoSection ? 'left-[22px]' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Photo Upload & Preview actions if Photo is ON */}
        {showPhotoSection && (
          <div className="pt-2.5 border-t border-gray-100 flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              {photoUrl ? (
                <div className="relative w-11 h-11 rounded-xl overflow-hidden ring-2 ring-amber-400 shrink-0 shadow-sm">
                  <img src={photoUrl} alt="Couple thumbnail" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--emerald-primary)] hover:bg-[var(--emerald-dark)] text-white text-xs font-bold shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading…</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>{photoUrl ? 'Change Photo' : 'Upload Couple Photo'}</span>
                    </>
                  )}
                </button>
              </div>

              {photoUrl && (
                <button
                  type="button"
                  onClick={() => onPhotoChange && onPhotoChange('')}
                  title="Remove photo"
                  className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            {uploadError && (
              <p className="text-[11px] text-red-600 font-semibold">{uploadError}</p>
            )}
          </div>
        )}
      </div>

      {/* ── 2. CELEBRATIONS PROGRAM SECTION ── */}
      <div className={`bg-white border rounded-2xl p-4 shadow-sm space-y-3 transition-all ${
        showEvents ? 'border-purple-200/80 ring-1 ring-purple-400/20' : 'border-gray-150'
      }`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              showEvents ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-400'
            }`}>
              <CalendarClock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-[var(--ink)] flex items-center gap-1.5">
                <span>Celebrations Program</span>
                {showEvents ? (
                  <span className="text-[9.5px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                    ON
                  </span>
                ) : (
                  <span className="text-[9.5px] font-extrabold text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded-full">
                    OFF
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 truncate">Date, Ceremony &amp; Reception timings</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onToggleEvents(!showEvents)}
            className={`w-12 h-7 rounded-full transition-all relative shrink-0 cursor-pointer ${
              showEvents ? 'bg-purple-600' : 'bg-gray-300'
            }`}
          >
            <div
              className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all ${
                showEvents ? 'left-[22px]' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* ── 3. RSVP SECTION ── */}
      <div className={`bg-white border rounded-2xl p-4 shadow-sm space-y-3 transition-all ${
        showRsvp ? 'border-emerald-200/80 ring-1 ring-emerald-400/20' : 'border-gray-150'
      }`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              showRsvp ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
            }`}>
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-[var(--ink)] flex items-center gap-1.5">
                <span>WhatsApp RSVP</span>
                {showRsvp ? (
                  <span className="text-[9.5px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                    ON
                  </span>
                ) : (
                  <span className="text-[9.5px] font-extrabold text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded-full">
                    OFF
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 truncate">Collect guest confirmations via WhatsApp</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onToggleRsvp(!showRsvp)}
            className={`w-12 h-7 rounded-full transition-all relative shrink-0 cursor-pointer ${
              showRsvp ? 'bg-emerald-600' : 'bg-gray-300'
            }`}
          >
            <div
              className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all ${
                showRsvp ? 'left-[22px]' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ======================================================================
   STYLE PRESETS PANEL (1-tap whole-template makeovers)
   ====================================================================== */

function PresetsPanel({
  currentHeroFont,
  currentSize,
  onPickPreset,
  onResetDefaults,
}) {
  const activePresetId = SECTION_PRESETS.find(p =>
    p.heroFontFamily === currentHeroFont && p.fontSize === currentSize
  )?.id || null;

  return (
    <div className="space-y-4">
      <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-2xl p-3 flex items-start gap-2.5">
        <Wand2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
          One-tap makeovers for the whole invitation. Still editable afterwards —
          adjust <strong>any</strong> word by clicking it.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {SECTION_PRESETS.map(p => {
          const active = activePresetId === p.id;
          const font = FONT_OPTIONS.find(f => f.id === p.heroFontFamily) || FONT_OPTIONS[0];
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onPickPreset(p)}
              className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all
                ${active
                  ? 'border-[var(--emerald-primary)] bg-[var(--emerald-light)]/50 shadow-sm'
                  : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br ${p.accent} flex items-center justify-center shadow-inner`}>
                  <LetterText className="w-5 h-5 text-white/90" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-[var(--ink)]">{p.name}</span>
                    {active && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--emerald-primary)] text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider">
                        <Check className="w-2.5 h-2.5" /> Applied
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{p.tagline}</div>
                  <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mt-1">
                    {font.name} · {p.fontSize}px
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onResetDefaults}
        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Reset to template defaults
      </button>
    </div>
  );
}

/* ======================================================================
   MAIN TOOLBAR COMPONENT
   ====================================================================== */

export default function LiveEditorToolbar({
  editorSettings,
  onSettingsChange,
  photoUrl = '',
  onPhotoChange,
  draftId = 'draft',
  className = '',
  onResetStyles,
}) {
  const [activePanel, setActivePanel] = useState(null);

  const {
    heroFontFamily = 'cinzel',
    fontFamily,
    fontSize = 14,
    showRsvp = true,
    showPhotoSection = true,
    showEvents = true,
  } = editorSettings || {};

  // Support backwards compatibility if fontFamily was set previously
  const currentHeroFont = heroFontFamily || fontFamily || 'cinzel';

  const update = useCallback((keyOrObj, value) => {
    if (typeof keyOrObj === 'object') {
      onSettingsChange(prev => ({ ...(prev || {}), ...keyOrObj }));
    } else {
      onSettingsChange(prev => ({ ...(prev || {}), [keyOrObj]: value }));
    }
  }, [onSettingsChange]);

  const togglePanel = useCallback((panel) => {
    setActivePanel(prev => prev === panel ? null : panel);
  }, []);

  const handlePickPreset = useCallback((preset) => {
    update({
      heroFontFamily: preset.heroFontFamily,
      fontFamily: preset.heroFontFamily,
      fontSize: preset.fontSize,
    });
  }, [update]);

  const handleResetDefaults = useCallback(() => {
    if (onResetStyles) onResetStyles();
    update({
      heroFontFamily: 'cinzel',
      fontFamily: 'cinzel',
      fontSize: 14,
    });
  }, [update, onResetStyles]);

  const tools = [
    { id: 'preset',   icon: Wand2,             label: 'Presets',   panel: 'preset' },
    { id: 'font',     icon: Type,              label: 'Hero Font', panel: 'font' },
    { id: 'size',     icon: SlidersHorizontal, label: 'Text Size', panel: 'size' },
    { id: 'sections', icon: Layers,            label: 'Sections',  panel: 'sections' },
  ];

  return (
    <>
      {/* ===== BOTTOM TOOLBAR BAR ===== */}
      <div className={`fixed bottom-0 left-0 right-0 z-[95] pointer-events-auto ${className}`}>
        <div className="max-w-md mx-auto px-3 pb-[max(env(safe-area-inset-bottom,0px),8px)]">
          <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-[0_-8px_40px_rgba(0,0,0,0.12)] border border-gray-200/60 p-2 flex items-center justify-between gap-1.5 sm:gap-2">
            {tools.map(tool => {
              const Icon = tool.icon;
              const isActive = activePanel === tool.panel;
              return (
                <button
                  key={tool.id}
                  onClick={() => togglePanel(tool.panel)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all flex-1 min-w-0 cursor-pointer ${
                    isActive
                      ? 'bg-[var(--emerald-primary)] text-white shadow-md shadow-[var(--emerald-primary)]/20'
                      : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[11px] font-bold leading-none truncate">{tool.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== PANELS ===== */}
      <Panel
        open={activePanel === 'preset'}
        onClose={() => setActivePanel(null)}
        title="1-Tap Style Presets"
        icon={Wand2}
      >
        <PresetsPanel
          currentHeroFont={currentHeroFont}
          currentSize={fontSize}
          onPickPreset={handlePickPreset}
          onResetDefaults={handleResetDefaults}
        />
      </Panel>

      <Panel
        open={activePanel === 'font'}
        onClose={() => setActivePanel(null)}
        title="Hero Section Font"
        icon={Type}
      >
        <HeroFontPanel
          currentFont={currentHeroFont}
          onSelect={(id) => {
            update({ heroFontFamily: id, fontFamily: id });
          }}
        />
      </Panel>

      <Panel
        open={activePanel === 'size'}
        onClose={() => setActivePanel(null)}
        title="Global Text Size"
        icon={SlidersHorizontal}
      >
        <SizePanel
          currentSize={fontSize}
          onChange={(val) => update('fontSize', val)}
        />
      </Panel>

      <Panel
        open={activePanel === 'sections'}
        onClose={() => setActivePanel(null)}
        title="Sections & Visibility"
        icon={Layers}
      >
        <SectionsPanel
          showPhotoSection={showPhotoSection !== false}
          photoUrl={photoUrl}
          onTogglePhoto={(val) => update('showPhotoSection', val)}
          onPhotoChange={onPhotoChange}
          showEvents={showEvents !== false}
          onToggleEvents={(val) => update('showEvents', val)}
          showRsvp={showRsvp !== false}
          onToggleRsvp={(val) => update('showRsvp', val)}
          draftId={draftId}
        />
      </Panel>
    </>
  );
}

