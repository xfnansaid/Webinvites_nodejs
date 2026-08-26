'use client';

import React from 'react';
import { Calendar, Clock, Heart, Sparkles, MapPin, PartyPopper } from 'lucide-react';

const THEME_STYLES = {
  gold: {
    cardBg: 'bg-[#18130B]/85 border-[#D4AF37]/30 text-[#F5EBE0]',
    divider: 'bg-[#D4AF37]/40',
    itemBorder: 'border-[#D4AF37]/20',
    iconCircle: 'border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#F4E096]',
    tagBg: 'bg-[#D4AF37]/10 text-[#F4E096]',
    titleColor: 'text-[#F4E096]',
    labelColor: 'text-[#D4AF37]',
    valueColor: 'text-[#F5EBE0]',
    noteColor: 'text-[#F5EBE0]/70',
    sparkleColor: 'text-[#D4AF37]',
  },
  'dark-gold': {
    cardBg: 'bg-[#0B1E1A]/90 border-[#D4AF37]/25 text-[#F7F5F0]',
    divider: 'bg-[#D4AF37]/35',
    itemBorder: 'border-[#D4AF37]/15',
    iconCircle: 'border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#F4E096]',
    tagBg: 'bg-[#D4AF37]/10 text-[#F4E096]',
    titleColor: 'text-[#F4E096]',
    labelColor: 'text-[#D4AF37]',
    valueColor: 'text-[#F7F5F0]',
    noteColor: 'text-[#A3B8B5]',
    sparkleColor: 'text-[#D4AF37]',
  },
  dark: {
    cardBg: 'bg-zinc-900/90 border-amber-500/25 text-zinc-100',
    divider: 'bg-amber-500/30',
    itemBorder: 'border-amber-500/15',
    iconCircle: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    tagBg: 'bg-amber-500/10 text-amber-300',
    titleColor: 'text-amber-100',
    labelColor: 'text-amber-400',
    valueColor: 'text-zinc-100',
    noteColor: 'text-zinc-400',
    sparkleColor: 'text-amber-400',
  },
  rose: {
    cardBg: 'bg-[#FFF9F9]/95 border-rose-200/80 text-stone-800 shadow-sm',
    divider: 'bg-rose-300/60',
    itemBorder: 'border-rose-100',
    iconCircle: 'border-rose-200 bg-rose-50 text-rose-700',
    tagBg: 'bg-rose-50 text-rose-800',
    titleColor: 'text-rose-950',
    labelColor: 'text-rose-700',
    valueColor: 'text-stone-900',
    noteColor: 'text-rose-800/70',
    sparkleColor: 'text-rose-500',
  },
  crimson: {
    cardBg: 'bg-[#FFFDF9]/90 border-rose-900/20 text-stone-800 shadow-sm',
    divider: 'bg-rose-900/30',
    itemBorder: 'border-rose-900/10',
    iconCircle: 'border-rose-900/20 bg-rose-50 text-rose-900',
    tagBg: 'bg-rose-50 text-rose-950',
    titleColor: 'text-rose-950',
    labelColor: 'text-rose-900',
    valueColor: 'text-stone-900',
    noteColor: 'text-rose-900/70',
    sparkleColor: 'text-rose-800',
  },
  emerald: {
    cardBg: 'bg-[#0E241E]/90 border-emerald-500/25 text-emerald-50',
    divider: 'bg-emerald-500/35',
    itemBorder: 'border-emerald-500/15',
    iconCircle: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
    tagBg: 'bg-emerald-500/10 text-emerald-300',
    titleColor: 'text-emerald-100',
    labelColor: 'text-emerald-400',
    valueColor: 'text-emerald-50',
    noteColor: 'text-emerald-200/70',
    sparkleColor: 'text-emerald-400',
  },
  navy: {
    cardBg: 'bg-[#0A1628]/90 border-amber-400/25 text-slate-100',
    divider: 'bg-amber-400/35',
    itemBorder: 'border-amber-400/15',
    iconCircle: 'border-amber-400/25 bg-amber-400/10 text-amber-300',
    tagBg: 'bg-amber-400/10 text-amber-300',
    titleColor: 'text-amber-200',
    labelColor: 'text-amber-400',
    valueColor: 'text-slate-100',
    noteColor: 'text-slate-300',
    sparkleColor: 'text-amber-400',
  },
  light: {
    cardBg: 'bg-white/95 border-stone-200 text-stone-800 shadow-md backdrop-blur-sm',
    divider: 'bg-stone-300',
    itemBorder: 'border-stone-100',
    iconCircle: 'border-stone-200 bg-stone-50 text-stone-700',
    tagBg: 'bg-stone-100 text-stone-700',
    titleColor: 'text-stone-900',
    labelColor: 'text-stone-600',
    valueColor: 'text-stone-900',
    noteColor: 'text-stone-600',
    sparkleColor: 'text-amber-500',
  },
};

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
      } catch (e) {}
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

export default function CelebrationsSection({
  showEvents = true,
  theme = 'light',
  editable = false,
  onEdit,
  className = '',
  // Section Headings
  subtitle = 'PROGRAM OF CELEBRATIONS',
  title = 'Wedding Celebrations',
  // Event 1: Date
  dateLabel = 'The Date',
  dateValue = 'Saturday, 12 December 2026',
  dateNote = 'Auspicious day of celebration',
  // Event 2: Ceremony / Muhurtham / Nikkah
  ceremonyLabel = 'Ceremony & Muhurtham',
  ceremonyTime = '10:00 AM – 11:30 AM',
  ceremonyNote = 'Solemnization of marriage & blessings',
  // Event 3: Reception / Feast
  receptionLabel = 'Reception & Feast',
  receptionTime = '12:30 PM Onwards',
  receptionNote = 'Followed by lunch & celebration',
}) {
  if (showEvents === false) {
    return null;
  }

  const currentTheme = THEME_STYLES[theme] || THEME_STYLES.light;

  const events = [
    {
      id: 'date',
      icon: Calendar,
      label: dateLabel,
      labelField: 'eventDateLabel',
      value: dateValue,
      valueField: 'weddingDateFormatted',
      note: dateNote,
      noteField: 'eventDateNote',
    },
    {
      id: 'ceremony',
      icon: Clock,
      label: ceremonyLabel,
      labelField: 'ceremonyLabel',
      value: ceremonyTime,
      valueField: 'weddingTime',
      note: ceremonyNote,
      noteField: 'ceremonyNote',
    },
    {
      id: 'reception',
      icon: Heart,
      label: receptionLabel,
      labelField: 'receptionLabel',
      value: receptionTime,
      valueField: 'heroEventText',
      note: receptionNote,
      noteField: 'receptionNote',
    },
  ];

  return (
    <section id="celebrations-section" className={`w-full my-10 sm:my-16 px-3 sm:px-6 ${className}`}>
      <div className="mx-auto max-w-lg text-center">
        {/* Section Header */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex items-center justify-center gap-3">
            <span className={`h-px w-8 sm:w-12 ${currentTheme.divider}`} />
            <Sparkles className={`h-4 w-4 ${currentTheme.sparkleColor}`} />
            <span className={`h-px w-8 sm:w-12 ${currentTheme.divider}`} />
          </div>

          <Editable
            tag="p"
            value={subtitle}
            field="ceremonySubtitle"
            onEdit={onEdit}
            editable={editable}
            className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.28em] ${currentTheme.labelColor}`}
            placeholder="PROGRAM OF CELEBRATIONS"
          />

          <Editable
            tag="h2"
            value={title}
            field="ceremonyTitle"
            onEdit={onEdit}
            editable={editable}
            className={`mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight ${currentTheme.titleColor}`}
            placeholder="Wedding Celebrations"
          />
        </div>

        {/* Celebrations Card */}
        <div className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 shadow-xl backdrop-blur-xl ${currentTheme.cardBg}`}>
          {/* Subtle Top Gradient Line */}
          <div className="absolute left-0 top-0 h-0.5 w-full bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

          <div className="divide-y divide-inherit">
            {events.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className={`flex flex-col items-center py-6 first:pt-2 last:pb-2 ${currentTheme.itemBorder}`}
                >
                  <div className={`mb-3 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border shadow-sm ${currentTheme.iconCircle}`}>
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.75} />
                  </div>

                  <Editable
                    tag="span"
                    value={item.label}
                    field={item.labelField}
                    onEdit={onEdit}
                    editable={editable}
                    className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.24em] ${currentTheme.labelColor}`}
                    placeholder="Event Name"
                  />

                  <Editable
                    tag="span"
                    value={item.value}
                    field={item.valueField}
                    onEdit={onEdit}
                    editable={editable}
                    className={`mt-1.5 font-display text-xl sm:text-2xl font-semibold tracking-tight ${currentTheme.valueColor}`}
                    placeholder="Date or Time"
                  />

                  <Editable
                    tag="p"
                    value={item.note}
                    field={item.noteField}
                    onEdit={onEdit}
                    editable={editable}
                    multiline
                    className={`mt-1 max-w-xs text-xs sm:text-sm font-light leading-relaxed ${currentTheme.noteColor}`}
                    placeholder="Optional details or note"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
