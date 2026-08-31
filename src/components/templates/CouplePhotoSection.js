'use client';

import React, { useRef, useState } from 'react';
import { Camera, Upload, Trash2, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { compressImage } from '@/lib/compressImage';

const THEME_STYLES = {
  gold: {
    cardBg: 'bg-[#18130B]/80 border-[#D4AF37]/30 text-[#F5EBE0]',
    accent: 'text-[#D4AF37]',
    border: 'border-[#D4AF37]/40',
    tagBg: 'bg-[#D4AF37]/10 text-[#F4E096]',
    titleColor: 'text-[#F4E096]',
    subtitleColor: 'text-[#F5EBE0]/70',
    sparkleColor: 'text-[#D4AF37]',
    btnBg: 'bg-[#D4AF37] hover:bg-[#b89528] text-black',
  },
  'dark-gold': {
    cardBg: 'bg-[#0B1E1A]/90 border-[#D4AF37]/25 text-[#F7F5F0]',
    accent: 'text-[#D4AF37]',
    border: 'border-[#D4AF37]/35',
    tagBg: 'bg-[#D4AF37]/10 text-[#F4E096]',
    titleColor: 'text-[#F4E096]',
    subtitleColor: 'text-[#A3B8B5]',
    sparkleColor: 'text-[#D4AF37]',
    btnBg: 'bg-[#D4AF37] hover:bg-[#b89528] text-black',
  },
  dark: {
    cardBg: 'bg-zinc-900/90 border-amber-500/25 text-zinc-100',
    accent: 'text-amber-400',
    border: 'border-amber-500/30',
    tagBg: 'bg-amber-500/10 text-amber-300',
    titleColor: 'text-amber-100',
    subtitleColor: 'text-zinc-400',
    sparkleColor: 'text-amber-400',
    btnBg: 'bg-amber-500 hover:bg-amber-600 text-black',
  },
  rose: {
    cardBg: 'bg-[#FFF9F9] border-rose-200/80 text-stone-800 shadow-sm',
    accent: 'text-rose-600',
    border: 'border-rose-300/60',
    tagBg: 'bg-rose-50 text-rose-800',
    titleColor: 'text-rose-950',
    subtitleColor: 'text-rose-800/70',
    sparkleColor: 'text-rose-500',
    btnBg: 'bg-rose-700 hover:bg-rose-800 text-white',
  },
  crimson: {
    cardBg: 'bg-[#FDFBF7] border-rose-900/20 text-stone-800 shadow-sm',
    accent: 'text-rose-900',
    border: 'border-rose-900/30',
    tagBg: 'bg-rose-50 text-rose-950',
    titleColor: 'text-rose-950',
    subtitleColor: 'text-rose-900/70',
    sparkleColor: 'text-rose-800',
    btnBg: 'bg-rose-900 hover:bg-rose-950 text-white',
  },
  emerald: {
    cardBg: 'bg-[#0E241E]/80 border-emerald-500/25 text-emerald-50',
    accent: 'text-emerald-400',
    border: 'border-emerald-500/35',
    tagBg: 'bg-emerald-500/10 text-emerald-300',
    titleColor: 'text-emerald-100',
    subtitleColor: 'text-emerald-200/70',
    sparkleColor: 'text-emerald-400',
    btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  navy: {
    cardBg: 'bg-[#0A1628]/90 border-amber-400/25 text-slate-100',
    accent: 'text-amber-400',
    border: 'border-amber-400/35',
    tagBg: 'bg-amber-400/10 text-amber-300',
    titleColor: 'text-amber-200',
    subtitleColor: 'text-slate-300',
    sparkleColor: 'text-amber-400',
    btnBg: 'bg-amber-500 hover:bg-amber-600 text-slate-950',
  },
  light: {
    cardBg: 'bg-white/90 border-stone-200 text-stone-800 shadow-md backdrop-blur-sm',
    accent: 'text-stone-700',
    border: 'border-stone-300',
    tagBg: 'bg-stone-100 text-stone-700',
    titleColor: 'text-stone-900',
    subtitleColor: 'text-stone-600',
    sparkleColor: 'text-amber-500',
    btnBg: 'bg-stone-900 hover:bg-black text-white',
  },
};

const DEFAULT_COUPLE_PHOTO = 'https://images.pexels.com/photos/32519470/pexels-photo-32519470/free-photo-of-traditional-indian-wedding-couple-embrace.jpeg?cs=tinysrgb&dpr=1&w=500';

const Editable = ({
  tag: Tag = 'span',
  value,
  field,
  onEdit,
  editable = false,
  className = '',
  placeholder = '',
  multiline = false,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const elementRef = React.useRef(null);

  React.useEffect(() => {
    if (!isEditing && elementRef.current) {
      const current = elementRef.current.textContent || '';
      const next = value ?? '';
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
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(range);
        }
      } catch (e) { }
    }
  }, [isEditing]);

  const commit = () => {
    setIsEditing(false);
    if (elementRef.current && onEdit) {
      const text = elementRef.current.innerText || elementRef.current.textContent || '';
      onEdit(field, text.replace(/\u00a0/g, ' '));
    }
  };

  if (!editable) {
    return <Tag className={className}>{value || placeholder}</Tag>;
  }

  return (
    <Tag
      ref={elementRef}
      contentEditable={isEditing}
      suppressContentEditableWarning
      onClick={() => !isEditing && setIsEditing(true)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (!multiline && e.key === 'Enter') {
          e.preventDefault();
          commit();
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          if (elementRef.current) elementRef.current.textContent = value ?? '';
          setIsEditing(false);
        }
      }}
      className={`
        ${className}
        cursor-pointer
        outline-none
        transition-all duration-200
        ${isEditing
          ? 'ring-2 ring-amber-400 bg-white/20 px-1.5 py-0.5 rounded shadow-sm'
          : 'hover:outline-dashed hover:outline-1 hover:outline-amber-400/70 hover:bg-white/10 rounded'
        }
      `}
      title={!isEditing ? 'Click to edit' : undefined}
    >
      {value || (placeholder && !isEditing ? <span className="opacity-40">{placeholder}</span> : placeholder)}
    </Tag>
  );
};

export default function CouplePhotoSection({
  photoUrl = '',
  defaultPhoto = DEFAULT_COUPLE_PHOTO,
  groomName = 'Groom',
  brideName = 'Bride',
  photoTag = 'Memories',
  photoTitle = 'Moments of Love',
  photoSubtitle = 'Captured memories on our journey to forever',
  showPhotoSection = true,
  theme = 'light',
  editable = false,
  onEdit,
  draftId = 'draft',
  className = '',
}) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // If section is toggled off and not in editable mode, do not render
  if (showPhotoSection === false) {
    return null;
  }

  const currentTheme = THEME_STYLES[theme] || THEME_STYLES.light;
  const activePhoto = photoUrl || defaultPhoto;

  const handleFileChange = async (e) => {
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

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Upload failed');
      }

      if (resData.photoUrl && onEdit) {
        onEdit('photoUrl', resData.photoUrl);
        onEdit('heroImage', resData.photoUrl);
      }
    } catch (err) {
      console.error('[Photo Upload Error]', err);
      setUploadError(err.message || 'Could not upload photo');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (e) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit('photoUrl', '');
    }
  };

  return (
    <section id="couple-photo-section" className={`w-full my-10 sm:my-14 px-2 sm:px-4 ${className}`}>
      <div className={`relative mx-auto max-w-lg rounded-3xl border p-5 sm:p-7 text-center transition-all ${currentTheme.cardBg}`}>

        {/* Hidden File Input */}
        {editable && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            className="hidden"
            onChange={handleFileChange}
          />
        )}

        {/* Section Header */}
        <div className="mb-5 flex flex-col items-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <Sparkles className={`h-4 w-4 ${currentTheme.sparkleColor}`} />
            <Editable
              tag="span"
              value={photoTag}
              field="photoTag"
              onEdit={onEdit}
              editable={editable}
              className={`rounded-full px-3 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest ${currentTheme.tagBg}`}
              placeholder="Memories"
            />
            <Sparkles className={`h-4 w-4 ${currentTheme.sparkleColor}`} />
          </div>

          <Editable
            tag="h3"
            value={photoTitle}
            field="photoTitle"
            onEdit={onEdit}
            editable={editable}
            className={`font-display text-xl sm:text-2xl font-bold tracking-tight ${currentTheme.titleColor}`}
            placeholder="Moments of Love"
          />

          <Editable
            tag="p"
            value={photoSubtitle}
            field="photoSubtitle"
            onEdit={onEdit}
            editable={editable}
            multiline
            className={`mt-1 text-xs sm:text-sm font-light max-w-xs leading-relaxed ${currentTheme.subtitleColor}`}
            placeholder="Captured memories on our journey to forever"
          />
        </div>

        {/* Themed Photo Frame */}
        <div className="relative mx-auto w-full max-w-[320px] sm:max-w-[360px] aspect-[4/5] rounded-2xl sm:rounded-3xl overflow-hidden p-2 border shadow-lg group">
          <div className={`relative h-full w-full rounded-xl sm:rounded-2xl overflow-hidden border ${currentTheme.border}`}>
            <img
              src={activePhoto}
              alt={`${groomName} & ${brideName}`}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            {/* Subtle Gradient Overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

            {/* Editable Controls Overlay */}
            {editable && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2.5 p-4 backdrop-blur-[2px]">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition-all active:scale-[0.98] ${currentTheme.btnBg}`}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading…</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <span>{photoUrl ? 'Change Photo' : 'Upload Your Photo'}</span>
                    </>
                  )}
                </button>

                {photoUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600/90 text-white text-[11px] font-semibold hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove Custom Photo
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Quick Action for Touch Devices */}
        {editable && (
          <div className="mt-4 flex sm:hidden items-center justify-center gap-2">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-sm ${currentTheme.btnBg}`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading…</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>{photoUrl ? 'Change Photo' : 'Upload Photo'}</span>
                </>
              )}
            </button>
            {photoUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="p-2 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 transition-colors text-xs font-bold"
                title="Reset to default photo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {uploadError && (
          <div className="mt-3 text-xs font-semibold text-rose-500">
            {uploadError}
          </div>
        )}

      </div>
    </section>
  );
}
