# Planning Prompt: re:liverecordings Site Optimization for Lighthouse Compliance

Analyze and optimize the re:liverecordings static site to achieve Lighthouse scores ≥90 in Performance, Accessibility, Best Practices, and SEO. The site consists of:

## Current State

- `index.html`: single-page site with YouTube + Spotify embeds, cookie toast, animated CSS background
- `css/style.css`: ~580 lines, uses CSS variables, has unused `.privacy-notice` rules, responsive breakpoints
- Images: PNG logos + 5 hero backgrounds in `/images_50/` (~50% quality) and `/hi-res/` (full resolution); no WebP/AVIF variants
- `js/`: empty folder (all JS inline in HTML)
- Broken HTML in `<head>`: meta description tag is malformed (text leaking between attributes)

## Lighthouse Issues to Address

### 1. Performance

- Convert PNGs to WebP/AVIF with `<picture>` fallbacks; serve appropriately sized images
- Background animation loads 5 large images upfront via CSS keyframes — consider lazy/deferred loading or reduced set
- Third-party embeds (YouTube, Spotify, Font Awesome CDN) block render; defer or facade
- Inline critical CSS; defer non-critical
- Add `font-display: swap` to Google Fonts import
- Minify CSS/JS for production

### 2. Accessibility

- Fix broken meta description (invalid HTML)
- Add `title` to YouTube iframe
- Ensure focus-visible outlines on all interactive elements (some already done)
- Verify color contrast for muted text (`--color-muted: #ccc` on dark background)
- Add skip-to-content link
- Ensure cookie toast is keyboard-operable (already has Escape support)

### 3. Best Practices

- Remove unused `.privacy-notice` CSS rules (replaced by `.cookie-toast`)
- Avoid `@import` for Google Fonts; use `<link>` with `preconnect`
- Ensure all external links have `rel="noopener"` (most do)
- Consider Content Security Policy headers (hosting-dependent)

### 4. SEO

- Fix malformed meta description tag
- Add canonical URL
- Ensure OG/Twitter images use absolute URLs
- Add structured data (Organization or WebSite schema)

## Deliverables

1. Fix the broken `<meta name="description">` tag immediately
2. Convert logo PNGs to WebP with PNG fallback; add explicit `width`/`height` to prevent CLS
3. Replace `@import url(...)` for Google Fonts with `<link rel="preload">` + `font-display: swap`
4. Add `title` attribute to YouTube iframe
5. Add skip-to-content link
6. Remove dead `.privacy-notice` CSS
7. Provide image optimization script/commands (e.g., `cwebp`, `squoosh-cli`)
8. Outline optional: YouTube/Spotify lite facades for deferred embed loading
9. Run Lighthouse audit before/after and document score improvements

## Constraints

- No build tools required (static HTML/CSS/JS)
- Maintain current visual design and functionality
- Keep all changes backward-compatible with current hosting (GitHub Pages or similar)
