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
} from 'lucide-react';
import { compressImage } from '@/lib/compressImage';

/* ======================================================================
   FONTS CONFIGURATION — Google Fonts loaded in globals.css
   ====================================================================== */

export const FONT_OPTIONS = [
  { id: 'cinzel', name: 'Cinzel', family: "'Cinzel', serif", style: 'serif', label: 'Classic' },
  { id: 'cormorant', name: 'Cormorant Garamond', family: "'Cormorant Garamond', serif", style: 'serif', label: 'Elegant' },
  { id: 'italiana', name: 'Italiana', family: "'Italiana', serif", style: 'serif', label: 'Italian' },
  { id: 'pinyon', name: 'Pinyon Script', family: "'Pinyon Script', cursive", style: 'cursive', label: 'Script' },
  { id: 'alex', name: 'Alex Brush', family: "'Alex Brush', cursive", style: 'cursive', label: 'Brush' },
  { id: 'jost', name: 'Jost', family: "'Jost', sans-serif", style: 'sans', label: 'Modern' },
  { id: 'jakarta', name: 'Plus Jakarta Sans', family: "'Plus Jakarta Sans', sans-serif", style: 'sans', label: 'Clean' },
  { id: 'amiri', name: 'Amiri', family: "'Amiri', serif", style: 'serif', label: 'Arabic' },
  { id: 'malayalam', name: 'Noto Serif Malayalam', family: "'Noto Serif Malayalam', serif", style: 'serif', label: 'Malayalam' },
];

export const FONT_SIZES = [
  { label: 'S', value: 14, description: 'Small' },
  { label: 'M', value: 16, description: 'Medium' },
  { label: 'L', value: 18, description: 'Large' },
  { label: 'XL', value: 20, description: 'Extra Large' },
  { label: 'XXL', value: 22, description: 'Display' },
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

function SizePanel({ currentSize, onChange }) {
  const minSize = 12;
  const maxSize = 26;

  return (
    <div className="space-y-5">
      <p className="text-[11px] uppercase tracking-widest text-gray-400 font-bold">
        Adjust base font size for the invitation
      </p>

      <div className="bg-gray-50 rounded-2xl p-4 text-center">
        <div
          className="text-[var(--ink)] font-medium leading-snug transition-all duration-200"
          style={{ fontSize: `${currentSize}px` }}
        >
          {currentSize}px — Preview Text Size
        </div>
      </div>

      <div className="flex gap-2">
        {FONT_SIZES.map(size => (
          <button
            key={size.value}
            onClick={() => onChange(size.value)}
            className={`flex-1 py-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
              currentSize === size.value
                ? 'border-[var(--emerald-primary)] bg-[var(--emerald-light)]/50 shadow-sm'
                : 'border-gray-100 hover:border-gray-200'
            }`}
          >
            <span className="text-[11px] font-bold text-[var(--ink)]">{size.label}</span>
            <span className="text-[9px] text-gray-400 font-semibold">{size.value}px</span>
          </button>
        ))}
      </div>

      <div className="px-1">
        <input
          type="range"
          min={minSize}
          max={maxSize}
          step={1}
          value={currentSize}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-200 accent-[var(--emerald-primary)]"
        />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-gray-400 font-semibold">{minSize}px</span>
          <span className="text-[10px] text-gray-400 font-semibold">{maxSize}px</span>
        </div>
      </div>
    </div>
  );
}

/* ======================================================================
   RSVP SECTION PANEL (Single RSVP Toggle)
   ====================================================================== */

function RsvpTogglePanel({ showRsvp = true, onToggle }) {
  return (
    <div className="space-y-4">
      <p className="text-[11px] uppercase tracking-widest text-gray-400 font-bold">
        RSVP Section Visibility
      </p>

      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-[var(--ink)]">WhatsApp RSVP Form</div>
              <div className="text-xs text-gray-500">Collect guest responses directly to WhatsApp</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onToggle(!showRsvp)}
            className={`w-12 h-7 rounded-full transition-all relative shrink-0 ${
              showRsvp ? 'bg-emerald-600' : 'bg-gray-300'
            }`}
          >
            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all ${
              showRsvp ? 'left-[22px]' : 'left-1'
            }`} />
          </button>
        </div>

        <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          showRsvp ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-gray-100 text-gray-600'
        }`}>
          {showRsvp ? (
            <>
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>RSVP Section is <strong>Visible</strong> on your invitation</span>
            </>
          ) : (
            <>
              <X className="w-4 h-4 text-gray-500 shrink-0" />
              <span>RSVP Section is <strong>Hidden</strong> from your invitation</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ======================================================================
   CELEBRATIONS / EVENTS SECTION PANEL (Toggle)
   ====================================================================== */

function EventsTogglePanel({ showEvents = true, onToggle }) {
  return (
    <div className="space-y-4">
      <p className="text-[11px] uppercase tracking-widest text-gray-400 font-bold">
        Celebrations &amp; Program Section
      </p>

      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-[var(--ink)]">Celebrations Program</div>
              <div className="text-xs text-gray-500">Date, Muhurtham/Nikkah &amp; Reception timings</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onToggle(!showEvents)}
            className={`w-12 h-7 rounded-full transition-all relative shrink-0 ${
              showEvents ? 'bg-purple-600' : 'bg-gray-300'
            }`}
          >
            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all ${
              showEvents ? 'left-[22px]' : 'left-1'
            }`} />
          </button>
        </div>

        <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          showEvents ? 'bg-purple-50 text-purple-900 border border-purple-200' : 'bg-gray-100 text-gray-600'
        }`}>
          {showEvents ? (
            <>
              <Check className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Celebrations Section is <strong>Visible</strong> on your invitation</span>
            </>
          ) : (
            <>
              <X className="w-4 h-4 text-gray-500 shrink-0" />
              <span>Celebrations Section is <strong>Hidden</strong> from your invitation</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ======================================================================
   COUPLE PHOTO SECTION PANEL (Photo Upload + Toggle)
   ====================================================================== */

function PhotoTogglePanel({
  showPhotoSection = true,
  photoUrl = '',
  onToggle,
  onPhotoChange,
  draftId = 'draft'
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

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif"
        className="hidden"
        onChange={handleFileSelect}
      />

      <p className="text-[11px] uppercase tracking-widest text-gray-400 font-bold">
        Couple Photo Section
      </p>

      {/* Visibility Toggle */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-[var(--ink)]">Couple Photo Section</div>
              <div className="text-xs text-gray-500">Display or hide the photo section in your invitation</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onToggle(!showPhotoSection)}
            className={`w-12 h-7 rounded-full transition-all relative shrink-0 ${
              showPhotoSection ? 'bg-amber-500' : 'bg-gray-300'
            }`}
          >
            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all ${
              showPhotoSection ? 'left-[22px]' : 'left-1'
            }`} />
          </button>
        </div>

        <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          showPhotoSection ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-gray-100 text-gray-600'
        }`}>
          {showPhotoSection ? (
            <>
              <Check className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Photo Section is <strong>Visible</strong> on your invitation</span>
            </>
          ) : (
            <>
              <X className="w-4 h-4 text-gray-500 shrink-0" />
              <span>Photo Section is <strong>Hidden</strong> from your invitation</span>
            </>
          )}
        </div>

        {/* Upload Action */}
        {showPhotoSection && (
          <div className="pt-2 border-t border-gray-100 flex flex-col gap-2.5">
            <div className="flex items-center gap-3">
              {photoUrl ? (
                <div className="relative w-12 h-12 rounded-xl overflow-hidden ring-2 ring-amber-400 shrink-0 shadow-sm">
                  <img src={photoUrl} alt="Couple thumbnail" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[var(--emerald-primary)] hover:bg-[var(--emerald-dark)] text-white text-xs font-bold shadow-sm transition-all active:scale-[0.98]"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Compressing & Uploading…</span>
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
                  title="Remove custom photo"
                  className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <p className="text-[10px] text-gray-500 font-medium">
              ✨ Auto-compressed in browser (Max 1200px / ~200KB WebP) for instant loading.
            </p>

            {uploadError && (
              <p className="text-[11px] font-semibold text-rose-600">
                {uploadError}
              </p>
            )}
          </div>
        )}
      </div>
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
}) {
  const [activePanel, setActivePanel] = useState(null);

  const {
    heroFontFamily = 'cinzel',
    fontFamily,
    fontSize = 16,
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

  const tools = [
    { id: 'font', icon: Type, label: 'Hero Font', panel: 'font' },
    { id: 'size', icon: SlidersHorizontal, label: 'Text Size', panel: 'size' },
    { id: 'events', icon: CalendarClock, label: 'Program', panel: 'events' },
    { id: 'photo', icon: ImageIcon, label: 'Couple Photo', panel: 'photo' },
    { id: 'rsvp', icon: Layers, label: 'RSVP Form', panel: 'rsvp' },
  ];

  return (
    <>
      {/* ===== BOTTOM TOOLBAR BAR ===== */}
      <div className={`fixed bottom-0 left-0 right-0 z-[95] pointer-events-auto ${className}`}>
        <div className="max-w-md mx-auto px-3 pb-[max(env(safe-area-inset-bottom,0px),8px)]">
          <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-[0_-8px_40px_rgba(0,0,0,0.12)] border border-gray-200/60 p-2 flex items-center justify-between gap-1">
            {tools.map(tool => {
              const Icon = tool.icon;
              const isActive = activePanel === tool.panel;
              return (
                <button
                  key={tool.id}
                  onClick={() => togglePanel(tool.panel)}
                  className={`flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl transition-all flex-1 min-w-0 ${
                    isActive
                      ? 'bg-[var(--emerald-primary)] text-white shadow-md shadow-[var(--emerald-primary)]/20'
                      : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-bold leading-none truncate">{tool.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== PANELS ===== */}
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
        title="Text Size"
        icon={SlidersHorizontal}
      >
        <SizePanel
          currentSize={fontSize}
          onChange={(val) => update('fontSize', val)}
        />
      </Panel>

      <Panel
        open={activePanel === 'events'}
        onClose={() => setActivePanel(null)}
        title="Celebrations Program Section"
        icon={CalendarClock}
      >
        <EventsTogglePanel
          showEvents={showEvents !== false}
          onToggle={(val) => update('showEvents', val)}
        />
      </Panel>

      <Panel
        open={activePanel === 'photo'}
        onClose={() => setActivePanel(null)}
        title="Couple Photo Section"
        icon={ImageIcon}
      >
        <PhotoTogglePanel
          showPhotoSection={showPhotoSection !== false}
          photoUrl={photoUrl}
          onToggle={(val) => update('showPhotoSection', val)}
          onPhotoChange={onPhotoChange}
          draftId={draftId}
        />
      </Panel>

      <Panel
        open={activePanel === 'rsvp'}
        onClose={() => setActivePanel(null)}
        title="RSVP Section Option"
        icon={Layers}
      >
        <RsvpTogglePanel
          showRsvp={showRsvp !== false}
          onToggle={(val) => update('showRsvp', val)}
        />
      </Panel>
    </>
  );
}

/* ======================================================================
   CSS VARIABLE HELPER
   ====================================================================== */

export function getEditorCSSVars(settings = {}) {
  const {
    heroFontFamily = 'cinzel',
    fontFamily,
    fontSize = 16,
  } = settings;

  const activeFontId = heroFontFamily || fontFamily || 'cinzel';
  const font = FONT_OPTIONS.find(f => f.id === activeFontId) || FONT_OPTIONS[0];

  const vars = {
    '--editor-hero-font-family': font.family,
    '--editor-font-size': `${fontSize}px`,
  };

  return { vars, heroFontFamily: font.family };
}
