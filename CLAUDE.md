# Claude Code Instructions

## Capability Verification Protocol

Before asserting that a requested action cannot be performed:

1. **Consult authoritative sources** - Search current documentation, official references, or reliable technical sources to verify the limitation exists
2. **Cite evidence** - If the limitation is genuine, provide specific references (documentation links, error codes, technical constraints) that substantiate the claim
3. **Exhaust alternatives** - Attempt reasonable workarounds or alternative approaches before concluding impossibility

If the user demonstrates that the action is in fact possible, acknowledge the correction and proceed with execution immediately rather than defending the initial position.

The goal is accuracy over confidence. An incorrect "I cannot do this" wastes the user's time and money.

## Project Overview
**reliverecordings.com** — Static HTML/CSS/JS website for a live event recording business. Deployed on Netlify, auto-deploys from `master` branch.

- **Owner:** Rob Baldock. Simon manages the site on his behalf.
- **No framework** — vanilla HTML, CSS, JavaScript
- **Branch:** `master` (not `main`)

## Deployment
- **Platform:** Netlify (GitHub auto-deploy from `master`)
- **Config:** `netlify.toml` in repo root (security headers, CSP for YouTube/Spotify/Google Fonts)
- Push to `master` triggers automatic deploy

## Netlify Forms
- Contact form uses `data-netlify="true"` with `netlify-honeypot="bot-field"`
- Netlify detects forms **at deploy time** by parsing HTML — a redeploy is needed after adding/modifying forms
- Honeypot field hidden via `.sr-only` class
- Form submission handled via JavaScript `fetch()` POST to `/`

## CSS Architecture
- `.background-container` — page wrapper, `display: flex; flex-direction: column; min-height: 100vh`
- `main` — flex child with `flex-shrink: 0` to prevent embed collapse
- `footer` — `flex: 1` with `justify-content: center` to vertically center between content and page bottom
- `.socials ul` — `display: flex; flex-wrap: nowrap; gap: clamp(0.75rem, 4vw, 2rem)` to keep social icons on one row at all viewport widths
- **Copyright year** — set dynamically via JS in `main.js`

## Adaptive Nav Link Color System

Desktop nav links (ABOUT, CONTACT) adapt their color based on background image brightness to maintain contrast during the crossfade rotation.

**How it works:**
- During image preload (`js/main.js`), each image is drawn to a tiny offscreen canvas and the nav region (top-center strip) is sampled for WCAG relative luminance
- Results stored in `navColorMap`: luminance >= 0.5 → `#1a1a1a` (dark text), else → `#fff` (white text)
- Applied via CSS custom property `--nav-link-color` on `<html>`, consumed by desktop `nav a` rules
- `setNavColor()` is guarded by `matchMedia('(min-width: 800px)')` — mobile nav has dark overlay, unaffected
- CSS `text-shadow: 0 1px 3px rgba(0,0,0,0.6)` on desktop nav links provides fallback contrast if JS fails
- Color transition is 1s (half the 2s image crossfade) so it reaches target as the new image becomes dominant

**Key files:**
- `css/style.css`: `--nav-link-color` custom property in `:root`, desktop `nav a` uses it with text-shadow safety net
- `js/main.js`: `analyzeNavRegion()`, `setNavColor()`, `navColorMap` — all inside the background rotation IIFE

**If images change:** No manual updates needed — luminance is auto-detected from pixel data during preload.

## Known Issues
- Spotify embed shows blank white in Safari private browsing — Spotify limitation (requires cookies/localStorage), not a site bug
- Embeds (YouTube/Spotify) are inside `.embed-container` → `.embed-block` — **do not add flexbox to `.background-container` without testing embeds still render correctly**
