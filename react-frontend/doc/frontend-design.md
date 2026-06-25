# Frontend Design Documentation

## Overview
This project includes two static frontend prototype HTML files for UI reference, plus a Figma source-of-truth design.

## Design Files

### 1. Recruiter Dashboard
Path: `react-frontend/design/recruiter-dashboard.html`

Description:
Contains recruiter job management UI, organization setup, and invitation flow.

### 2. Candidate Flow
Path: `react-frontend/design/candidate-flow.html`

Description:
Contains candidate upload flow, assessment interface, and evaluation process.

## Figma Reference
Figma Link:
https://www.figma.com/design/TaOgWINAnWhxziI4Wuzbxh/EquiHire_Design?node-id=0-1&t=QUCryU1bJ3jgnGnA-1

## In-App Documentation Viewer

The React app renders this `doc/` folder's content live, inside the authenticated app shell, via two pages:

| Route | Component | Source |
|---|---|---|
| `/documentation/guide` | `src/components/documentation/UserGuide.tsx` | Concatenates `introduction.md`, `getting-started.md`, `identity-lifecycle.md`, `frontend-design.md` |
| `/documentation/api` | `src/components/documentation/ApiDocs.tsx` | Renders `api-endpoints.md` |

Both components import the markdown files as raw strings (Vite's `?raw` import suffix) and render them with `MarkdownRenderer` (`src/components/documentation/MarkdownRenderer.tsx`).

> **Implementation detail:** these imports point at `react-frontend/doc/`, a copy of this top-level `doc/` folder bundled inside the frontend package — not this file directly. Whenever you edit the canonical docs in the project-root `doc/` folder, re-sync `react-frontend/doc/` (copy the files across) so the in-app viewer doesn't go stale.

## Notes
- HTML files are static prototypes; the live implementation uses React components under `react-frontend/src/`.
- Design tokens should follow the project's Tailwind theme (`react-frontend/tailwind.config.js`).
