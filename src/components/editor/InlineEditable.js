'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Edit3, Type, Bold, Minus, Plus, X } from 'lucide-react';

/**
 * Enhanced WYSIWYG InlineEditable component — UX improvements:
 *   1. ✏️  "Tap to edit" floating chip on hover (users instantly know what's clickable)
 *   2. 🎛️  Per-field popup mini-toolbar: A- / A+ (font size) and Bold + Italic
 *   3. 💾  Per-field styles persisted into template_data[`style_<field>`]
 *   4. 🪄  First-time coach mark on groomName/celebrantName to guide new users:
 *          "Try clicking the name to personalize!" (shown once per session)
 *   5. 🎯  Click feedback: amber pulse on first interaction per page-load
 *
 * Fully backwards compatible with existing <Editable> call sites since the
 * props signature is identical.
 */
export default function InlineEditable({
  tag: Tag = 'span',
  value,
  field,
  onEdit,
  onStyleChange,
  editable = false,
  className = '',
  placeholder = '',
  multiline = false,
  templateData = {},
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(() => {
    try {
      return typeof window !== 'undefined' && sessionStorage.getItem('wi_edit_try') === '1';
    } catch {
      return false;
    }
  });
  const elementRef = useRef(null);
  const wrapRef = useRef(null);

  // ---- Per-field style overrides: fontSize delta + weight + italic ----
  const styleKey = `style_${field}`;
  const styleRaw = templateData?.[styleKey];
  const styleObj = typeof styleRaw === 'string' ? (() => {
    try { return JSON.parse(styleRaw); } catch { return {}; }
  })() : (typeof styleRaw === 'object' && styleRaw ? styleRaw : {});

  const fontSizeDelta = typeof styleObj.size === 'number' ? styleObj.size : 0;
  const weightOverride  = typeof styleObj.weight === 'number' ? styleObj.weight : null;
  const italicOverride  = Boolean(styleObj.italic);

  const applyStyleChange = useCallback((patch) => {
    if (!field || !onStyleChange) return;
    const next = { ...styleObj, ...patch };
    if (next.size === 0) delete next.size;
    if (next.weight === null || next.weight === undefined) delete next.weight;
    if (next.italic === false || next.italic === undefined) delete next.italic;

    const hasAny = Object.keys(next).length > 0;
    onStyleChange(styleKey, hasAny ? JSON.stringify(next) : null);
  }, [field, styleKey, styleObj, onStyleChange]);

  // Sync text when not editing
  useEffect(() => {
    if (!isEditing && elementRef.current) {
      const current = elementRef.current.textContent || '';
      const next = value ?? '';
      if (current !== next) elementRef.current.textContent = next;
    }
  }, [value, isEditing]);

  // Auto-focus caret on edit start
  useEffect(() => {
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
      } catch {}
    }
  }, [isEditing]);

  // Close toolbar / commit on outside click
  useEffect(() => {
    if (!showToolbar && !isEditing) return;
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setShowToolbar(false);
        commit();
      }
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('touchstart', onDocClick, { passive: true });
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('touchstart', onDocClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showToolbar, isEditing]);

  const commit = useCallback(() => {
    setIsEditing(false);
    if (elementRef.current && onEdit) {
      const text = elementRef.current.innerText || elementRef.current.textContent || '';
      onEdit(field, text.replace(/\u00a0/g, ' '));
    }
  }, [field, onEdit]);

  const isDateField = field === 'weddingDate' || field === 'birthdayDate' || field === 'eventDate';
  const dateInputRef = useRef(null);

  const getDefaultEventDateIso = (daysAhead = 2) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isoValue = useMemo(() => {
    if (!isDateField) return '';
    const s = String(value || '').trim();
    const match = s.match(/\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
    return getDefaultEventDateIso(2);
  }, [isDateField, value]);

  const onDateChange = (e) => {
    const newDate = e.target.value;
    if (newDate && onEdit) {
      onEdit(field, newDate);
    }
  };

  const markInteracted = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      try {
        if (typeof window !== 'undefined') sessionStorage.setItem('wi_edit_try', '1');
      } catch {}
    }
  };

  const onStartEdit = () => {
    if (isDateField && dateInputRef.current) {
      try {
        if (typeof dateInputRef.current.showPicker === 'function') {
          dateInputRef.current.showPicker();
          markInteracted();
          return;
        }
      } catch {}
    }
    if (!isEditing) {
      setIsEditing(true);
      setShowToolbar(true);
      markInteracted();
    }
  };

  const inlineWrapStyle = {};
  if (fontSizeDelta !== 0) inlineWrapStyle['--inline-size-delta'] = `${fontSizeDelta}px`;
  if (weightOverride) inlineWrapStyle['--inline-weight'] = String(weightOverride);
  if (italicOverride) inlineWrapStyle['--inline-italic'] = 'italic';

  const isCoachField = field === 'groomName' || field === 'celebrantName' || field === 'familyName' || field === 'birthdayChildName' || field === 'hostName' || field === 'homeOwnerName';
  const showCoach = editable && !hasInteracted && isCoachField;

  if (!editable) {
    return <Tag className={`wi-editable-text ${className}`}>{value || placeholder}</Tag>;
  }

  return (
    <span
      ref={wrapRef}
      className="wi-inline-edit-wrap inline-flex flex-col relative align-baseline"
      style={inlineWrapStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <style>{`
        .wi-inline-edit-wrap .wi-editable-root {
          cursor: pointer;
          outline: none;
          transition: filter 180ms ease, background-color 180ms ease, border-radius 180ms ease, box-shadow 180ms ease, padding 180ms ease;
          border-radius: 8px;
        }
        .wi-inline-edit-wrap[style*="--inline-size-delta"] .wi-editable-root {
          font-size: calc(1em + var(--inline-size-delta));
          line-height: 1.25;
        }
        .wi-inline-edit-wrap[style*="--inline-weight"] .wi-editable-root {
          font-weight: var(--inline-weight) !important;
        }
        .wi-inline-edit-wrap[style*="--inline-italic"] .wi-editable-root {
          font-style: italic !important;
        }
        .wi-inline-edit-wrap:hover .wi-editable-root,
        .wi-inline-edit-wrap:focus-within .wi-editable-root {
          filter: brightness(1.06) saturate(1.1);
          background: rgba(255, 255, 255, 0.12);
          box-shadow: inset 0 0 0 1px rgba(251, 191, 36, 0.65), 0 0 0 3px rgba(251, 191, 36, 0.15);
          padding: 2px 6px;
          margin: -2px -6px;
        }
        .wi-inline-edit-wrap.is-editing .wi-editable-root {
          outline: 2px solid #fbbf24;
          background: rgba(255,255,255,0.2);
          padding: 2px 8px;
          margin: -2px -8px;
          box-shadow: 0 4px 14px rgba(0,0,0,0.12);
        }
        .wi-hover-chip {
          opacity: 0;
          transform: translateY(4px) scale(0.96);
          pointer-events: none;
          transition: opacity 160ms ease, transform 160ms ease;
        }
        .wi-inline-edit-wrap:hover .wi-hover-chip,
        .wi-inline-edit-wrap:focus-within .wi-hover-chip {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }
        .wi-coach-mark {
          animation: wi-coach-bounce 2.6s ease-in-out infinite;
        }
        @keyframes wi-coach-bounce {
          0%, 100% { transform: translateY(0) scale(1); }
          45% { transform: translateY(-8px) scale(1.03); }
          55% { transform: translateY(-4px) scale(1.01); }
        }
      `}</style>

      {(hovered || showCoach) && !isEditing && (
        <span className="wi-hover-chip absolute -top-8 left-1/2 -translate-x-1/2 z-[70] pointer-events-none whitespace-nowrap">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 text-amber-950 px-3 py-1 shadow-lg shadow-amber-400/25 text-[11px] font-bold ring-1 ring-amber-500/20 backdrop-blur">
            <Edit3 className="w-3.5 h-3.5" />
            {hovered ? 'Click to edit' : 'Try clicking to edit!'}
          </span>
        </span>
      )}

      {showCoach && !hovered && !isEditing && (
        <span className="wi-coach-mark absolute -bottom-7 left-1/2 -translate-x-1/2 z-[70] whitespace-nowrap pointer-events-none">
          <span className="inline-flex items-center gap-1 rounded-2xl bg-[var(--emerald-primary)] text-white px-3 py-1.5 shadow-2xl shadow-emerald-900/25 text-[10px] font-black uppercase tracking-widest">
            👆 Start here!
          </span>
        </span>
      )}

      {showToolbar && isEditing && onStyleChange && (
        <span className="absolute -top-11 left-1/2 -translate-x-1/2 z-[90]">
          <span className="inline-flex items-center gap-1 rounded-2xl bg-white ring-1 ring-black/5 shadow-2xl shadow-black/15 px-1.5 py-1">
            <MiniBtn title="Smaller" onClick={(e) => { e.stopPropagation(); applyStyleChange({ size: Math.max(-8, fontSizeDelta - 1) }); }}>
              <Minus className="w-3.5 h-3.5" />
            </MiniBtn>
            <span className="px-1.5 text-[10px] font-bold text-gray-500 tabular-nums min-w-[36px] text-center">
              {fontSizeDelta > 0 ? `+${fontSizeDelta}` : fontSizeDelta}
            </span>
            <MiniBtn title="Larger" onClick={(e) => { e.stopPropagation(); applyStyleChange({ size: Math.min(12, fontSizeDelta + 1) }); }}>
              <Plus className="w-3.5 h-3.5" />
            </MiniBtn>
            <span className="w-px h-5 bg-gray-200 mx-0.5" aria-hidden />
            <MiniBtn active={weightOverride === 700} title="Bold" onClick={(e) => { e.stopPropagation(); applyStyleChange({ weight: weightOverride === 700 ? null : 700 }); }}>
              <Bold className="w-3.5 h-3.5" />
            </MiniBtn>
            <MiniBtn active={italicOverride} title="Italic" onClick={(e) => { e.stopPropagation(); applyStyleChange({ italic: !italicOverride }); }}>
              <Type className="w-3.5 h-3.5" style={{ fontStyle: 'italic' }} />
            </MiniBtn>
            <span className="w-px h-5 bg-gray-200 mx-0.5" aria-hidden />
            <MiniBtn title="Done" accent onClick={(e) => { e.stopPropagation(); commit(); setShowToolbar(false); }}>
              <X className="w-3.5 h-3.5" />
            </MiniBtn>
          </span>
        </span>
      )}

      <Tag
        ref={elementRef}
        className={`wi-editable-root wi-editable-text ${className} ${isEditing ? 'is-editing' : ''}`}
        contentEditable={isDateField ? false : isEditing}
        suppressContentEditableWarning
        onClick={onStartEdit}
        onBlur={commit}
        onKeyDown={(e) => {
          if (!multiline && e.key === 'Enter') {
            e.preventDefault();
            commit();
            setShowToolbar(false);
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            if (elementRef.current) elementRef.current.textContent = value ?? '';
            setIsEditing(false);
            setShowToolbar(false);
          }
        }}
        title={!isEditing ? 'Click to edit date' : undefined}
      >
        {value || (placeholder && !isEditing ? <span className="opacity-40">{placeholder}</span> : placeholder)}
      </Tag>

      {isDateField && editable && (
        <input
          ref={dateInputRef}
          type="date"
          value={isoValue}
          onChange={onDateChange}
          className="absolute inset-0 opacity-0 pointer-events-none w-0 h-0 -z-10"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}
    </span>
  );
}

function MiniBtn({ children, onClick, active = false, accent = false, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`inline-flex items-center justify-center w-7 h-7 rounded-xl transition-colors
        ${accent
          ? 'text-white bg-[var(--emerald-primary)] hover:bg-[var(--emerald-dark)]'
          : active
            ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300'
            : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
        }`}
    >
      {children}
    </button>
  );
}
