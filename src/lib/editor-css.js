// ============================================================================
// PURE TYPOGRAPHY & CSS VARS HELPER
// ============================================================================
// This file is SAFE to import in both Server Components and Client Components
// because it contains NO React hooks, NO browser DOM APIs, and NO 'use client'.
// ============================================================================

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

/**
 * Returns CSS variable map for applying font family and font scale to template containers.
 * Base size is 14px (Small).
 */
export function getEditorCSSVars(settings = {}) {
  const {
    heroFontFamily = 'cinzel',
    fontFamily,
    fontSize = 14,
  } = settings || {};

  const activeFontId = heroFontFamily || fontFamily || 'cinzel';
  const font = FONT_OPTIONS.find(f => f.id === activeFontId) || FONT_OPTIONS[0];
  const sizeNum = Number(fontSize) || 14;
  const fontScale = (sizeNum / 14).toFixed(4);

  const vars = {
    '--editor-hero-font-family': font.family,
    '--editor-font-size': `${sizeNum}px`,
    '--editor-font-scale': `${fontScale}`,
  };

  return { vars, heroFontFamily: font.family, fontScale: Number(fontScale) };
}
