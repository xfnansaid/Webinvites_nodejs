// ============================================================================
// WEB INVITES — TEMPLATES REGISTRY (single source of truth)
// ============================================================================
// This file is the ONLY place where templates are enumerated / registered.
// It exports THREE things, all used across the codebase:
//
//   1. `templates`       — object keyed by slug -> React.lazy component.
//                          Components are CODE-SPLIT: the actual template code
//                          is only fetched when the component is first rendered.
//                          Client components must wrap usage in <Suspense>.
//
//   2. `templatesList`   — flat array of 25 metadata objects (re-exported
//                          from ./metadata.js, NO component imports):
//                          { slug, title, bgImageUrl, accentColor, url }.
//
//   3. `getTemplateMeta(slug)` — helper returns metadata for a slug; falls
//                          back to "standard-crimson" if slug is unknown.
//
//   4. `templateImporters` — raw import functions { slug: () => import('./X') }
//                          for use with next/dynamic or await in server components.
//
// IF YOU ADD A NEW TEMPLATE:
//   1. Put its .js file in this same folder (components/templates/).
//   2. Add an entry in metadata.js (metadata only, no import needed there).
//   3. Add a lazy import entry in templateImporters below.
// ============================================================================

import React from 'react';
import { templatesList, getTemplateMeta } from './metadata';
import templateImporters from './importers';

// ---------------------------------------------------------------------------
// Build `templates = { slug: React.lazy(Component) }` object.
// Each wrapper is lightweight — the actual import runs only on first render.
// Client components that use templates MUST wrap them in <Suspense>.
// ---------------------------------------------------------------------------
const templates = {};
for (const [slug, importer] of Object.entries(templateImporters)) {
  templates[slug] = React.lazy(importer);
}

export { templates, templatesList, getTemplateMeta, templateImporters };
export default templates;
