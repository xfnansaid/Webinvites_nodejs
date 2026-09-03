'use client';

import React from 'react';

// Try to load the enhanced WYSIWYG InlineEditable from the editor module.
// SAFE: If the file is missing for any reason (e.g. mid-rollback, partial deploy)
// we fall back to BasicEditable (original behavior — no crash, no errors).
let loaded = null;
try {
  // eslint-disable-next-line global-require
  loaded = require('@/components/editor/InlineEditable');
} catch (_err) { /* module not available — safe fallback */ }
const InlineEditable = loaded?.default || null;

/**
 * BasicEditable — the original simple inline editor (preserved).
 * Matches the exact API that every template file already uses:
 *   tag, value, field, onEdit, editable, className, placeholder, multiline
 *
 * This is ALWAYS available as a fallback.
 */
function BasicEditable({
  tag: Tag = 'span',
  value,
  field,
  onEdit,
  editable = false,
  className = '',
  placeholder = '',
  multiline = false,
}) {
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
      } catch { /* ignore selection errors */ }
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
    return <Tag className={`wi-editable-text ${className}`}>{value || placeholder}</Tag>;
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
        wi-editable-text
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
}

/**
 * Smart router used by ALL templates now.
 *
 * Picks the enhanced InlineEditable if the caller has opted in
 * (i.e. onStyleChange OR templateData are passed — which only happens on the
 * editor page via EditClient.js).
 *
 * On live routes (/i/[slug]) these props are undefined, so we fall through
 * to BasicEditable (original lightweight behavior, no toolbar / coach marks).
 */
function EditableRouter(props) {
  if (InlineEditable && (props.onStyleChange !== undefined || props.templateData !== undefined)) {
    return React.createElement(InlineEditable, props);
  }
  return React.createElement(BasicEditable, props);
}

export default EditableRouter;
export { BasicEditable };
