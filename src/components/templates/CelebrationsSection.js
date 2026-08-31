'use client';

import React from 'react';
import { Calendar, Clock, Heart, Sparkles } from 'lucide-react';

const THEME_STYLES = {
  gold: {
    cardBg: 'bg-[#1A1309] border-[#D4AF37]/40 text-[#F5EBE0] shadow-2xl',
    innerBorder: 'border-[#D4AF37]/25',
    dividerColor: 'text-[#D4AF37]/40',
    iconCircle: 'border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#F4E096]',
    titleColor: 'text-[#F4E096]',
    labelColor: 'text-[#D4AF37]',
    valueColor: 'text-[#FFFFFF]',
    noteColor: 'text-[#D8C7A5]',
    sparkleColor: 'text-[#E5C158]',
  },
  'dark-gold': {
    cardBg: 'bg-[#0C1B17] border-[#D4AF37]/35 text-[#F7F5F0] shadow-2xl',
    innerBorder: 'border-[#D4AF37]/20',
    dividerColor: 'text-[#D4AF37]/35',
    iconCircle: 'border-[#D4AF37]/35 bg-[#D4AF37]/15 text-[#F4E096]',
    titleColor: 'text-[#F4E096]',
    labelColor: 'text-[#D4AF37]',
    valueColor: 'text-[#FFFFFF]',
    noteColor: 'text-[#B0C4BF]',
    sparkleColor: 'text-[#D4AF37]',
  },
  crimson: {
    cardBg: 'bg-[#FFFDFB] border-rose-900/25 text-[#2B1B17] shadow-xl',
    innerBorder: 'border-rose-900/15',
    dividerColor: 'text-rose-900/30',
    iconCircle: 'border-rose-900/25 bg-rose-50 text-rose-900',
    titleColor: 'text-rose-950',
    labelColor: 'text-rose-900',
    valueColor: 'text-[#1E080B]',
    noteColor: 'text-[#6E4B43]',
    sparkleColor: 'text-rose-800',
  },
  emerald: {
    cardBg: 'bg-[#0B211A] border-emerald-500/35 text-[#E6F4F0] shadow-2xl',
    innerBorder: 'border-emerald-500/25',
    dividerColor: 'text-emerald-500/35',
    iconCircle: 'border-emerald-500/35 bg-emerald-500/15 text-emerald-300',
    titleColor: 'text-emerald-100',
    labelColor: 'text-emerald-400',
    valueColor: 'text-[#FFFFFF]',
    noteColor: 'text-emerald-200',
    sparkleColor: 'text-emerald-400',
  },
  rose: {
    cardBg: 'bg-[#FFFBFB] border-rose-200/90 text-stone-800 shadow-xl',
    innerBorder: 'border-rose-200/70',
    dividerColor: 'text-rose-400/40',
    iconCircle: 'border-rose-200 bg-rose-50 text-rose-700',
    titleColor: 'text-rose-950',
    labelColor: 'text-rose-800',
    valueColor: 'text-stone-900',
    noteColor: 'text-stone-600',
    sparkleColor: 'text-rose-500',
  },
  navy: {
    cardBg: 'bg-[#0A1628] border-amber-400/35 text-slate-100 shadow-2xl',
    innerBorder: 'border-amber-400/25',
    dividerColor: 'text-amber-400/35',
    iconCircle: 'border-amber-400/35 bg-amber-400/15 text-amber-300',
    titleColor: 'text-amber-100',
    labelColor: 'text-amber-400',
    valueColor: 'text-[#FFFFFF]',
    noteColor: 'text-slate-300',
    sparkleColor: 'text-amber-400',
  },
  dark: {
    cardBg: 'bg-[#18181B] border-amber-500/35 text-zinc-100 shadow-2xl',
    innerBorder: 'border-amber-500/25',
    dividerColor: 'text-amber-500/35',
    iconCircle: 'border-amber-500/35 bg-amber-500/15 text-amber-300',
    titleColor: 'text-amber-100',
    labelColor: 'text-amber-400',
    valueColor: 'text-[#FFFFFF]',
    noteColor: 'text-zinc-300',
    sparkleColor: 'text-amber-400',
  },
  light: {
    cardBg: 'bg-white border-stone-200/90 text-stone-800 shadow-xl',
    innerBorder: 'border-stone-200/80',
    dividerColor: 'text-stone-400/40',
    iconCircle: 'border-stone-200 bg-stone-50 text-stone-700',
    titleColor: 'text-stone-900',
    labelColor: 'text-stone-700',
    valueColor: 'text-stone-900',
    noteColor: 'text-stone-600',
    sparkleColor: 'text-amber-500',
  },
};

const formatDisplayDate = (val) => {
  if (!val) return 'Saturday, 12 December 2026';
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
    try {
      const [y, m, d] = val.trim().split('-').map(Number);
      const dateObj = new Date(Date.UTC(y, m - 1, d));
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: 'UTC',
        });
      }
    } catch (e) {
      return val;
    }
  }
  return val;
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

  const resolvedDateValue = formatDisplayDate(dateValue);

  const events = [
    {
      id: 'date',
      icon: Calendar,
      label: dateLabel,
      labelField: 'eventDateLabel',
      value: resolvedDateValue,
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
      valueField: 'receptionTime',
      note: receptionNote,
      noteField: 'receptionNote',
    },
  ];

  return (
    <section id="celebrations-section" className={`w-full my-8 sm:my-14 px-2.5 sm:px-5 ${className}`}>
      <div className="mx-auto max-w-lg text-center">
        
        {/* Section Header */}
        <div className="mb-6 sm:mb-8 flex flex-col items-center">
          <div className="mb-2.5 flex items-center justify-center gap-2.5">
            <span className="h-px w-8 sm:w-12 bg-gradient-to-r from-transparent via-current to-transparent opacity-40" />
            <Sparkles className={`h-3.5 w-3.5 ${currentTheme.sparkleColor}`} />
            <span className="h-px w-8 sm:w-12 bg-gradient-to-r from-transparent via-current to-transparent opacity-40" />
          </div>

          <Editable
            tag="p"
            value={subtitle}
            field="ceremonySubtitle"
            onEdit={onEdit}
            editable={editable}
            className={`text-[9.5px] sm:text-[10.5px] font-bold uppercase tracking-[0.28em] ${currentTheme.labelColor}`}
            placeholder="PROGRAM OF CELEBRATIONS"
          />

          <Editable
            tag="h2"
            value={title}
            field="ceremonyTitle"
            onEdit={onEdit}
            editable={editable}
            className={`mt-1.5 font-display text-xl sm:text-2xl md:text-3xl font-bold tracking-tight ${currentTheme.titleColor}`}
            placeholder="Wedding Celebrations"
          />
        </div>

        {/* Solid Royal Celebrations Card without any white haze/fog overlays */}
        <div className={`relative rounded-[28px] sm:rounded-[34px] border p-5 sm:p-7 md:p-8 transition-all ${currentTheme.cardBg}`}>
          
          {/* Inner Ornate Card Frame */}
          <div className={`rounded-2xl sm:rounded-3xl border ${currentTheme.innerBorder} p-4 sm:p-6`}>
            
            {events.map((item, idx) => {
              const Icon = item.icon;
              return (
                <React.Fragment key={item.id}>
                  {idx > 0 && (
                    <div className="flex items-center justify-center gap-2.5 my-4 sm:my-5 opacity-70">
                      <span className={`h-px w-14 sm:w-20 bg-gradient-to-r from-transparent to-current ${currentTheme.dividerColor}`} />
                      <span className={`text-[9px] sm:text-[10px] ${currentTheme.sparkleColor}`}>✦</span>
                      <span className={`h-px w-14 sm:w-20 bg-gradient-to-l from-transparent to-current ${currentTheme.dividerColor}`} />
                    </div>
                  )}

                  <div className="flex flex-col items-center text-center group">
                    {/* Ornate Icon Badge */}
                    <div className={`mb-2.5 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border transition-transform duration-300 group-hover:scale-105 ${currentTheme.iconCircle}`}>
                      <Icon className="h-4 w-4" strokeWidth={1.6} />
                    </div>

                    {/* Event Tag Label */}
                    <Editable
                      tag="span"
                      value={item.label}
                      field={item.labelField}
                      onEdit={onEdit}
                      editable={editable}
                      className={`text-[9.5px] sm:text-[10.5px] font-bold uppercase tracking-[0.22em] ${currentTheme.labelColor}`}
                      placeholder="Event Name"
                    />

                    {/* Event Main Value (Date/Time) */}
                    <Editable
                      tag="span"
                      value={item.value}
                      field={item.valueField}
                      onEdit={onEdit}
                      editable={editable}
                      className={`mt-1 font-serif text-lg sm:text-xl md:text-2xl font-bold tracking-tight leading-snug ${currentTheme.valueColor}`}
                      placeholder="Date or Time"
                    />

                    {/* Event Note / Description */}
                    {item.note && (
                      <Editable
                        tag="p"
                        value={item.note}
                        field={item.noteField}
                        onEdit={onEdit}
                        editable={editable}
                        multiline
                        className={`mt-1 max-w-xs text-[11px] sm:text-[12.5px] font-medium leading-relaxed italic ${currentTheme.noteColor}`}
                        placeholder="Optional details or note"
                      />
                    )}
                  </div>
                </React.Fragment>
              );
            })}

          </div>
        </div>

      </div>
    </section>
  );
}
