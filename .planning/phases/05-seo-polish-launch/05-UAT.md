---
status: testing
phase: 05-seo-polish-launch
source: 05-02-SUMMARY.md, 05-03-SUMMARY.md, 05-04-SUMMARY.md, 05-05-SUMMARY.md, 05-06-SUMMARY.md
started: 2026-03-15T15:06:54.170Z
updated: 2026-03-15T15:06:54.170Z
---

## Current Test

number: 1
name: Page title & meta description
expected: |
  Open the site in a browser. Check the browser tab — it should read
  "Borina Keo — ERP & WMS AI Integration Leader | AI Consultant".
  View page source and search for <meta name="description"> — it should
  contain ERP/AI keywords and be noticeably longer than a single sentence.
awaiting: user response

## Tests

### 1. Page title & meta description
expected: Browser tab shows "Borina Keo — ERP & WMS AI Integration Leader | AI Consultant"; page source has a keyword-rich meta description (>100 chars, ERP/AI terminology)
result: [pending]

### 2. Open Graph tags in source
expected: View source (Cmd+U) and search for "og:title" — you should find og:title, og:description, og:image, and og:type meta tags in the <head>. og:image should contain an absolute URL ending in /og-image.png
result: [pending]

### 3. JSON-LD structured data
expected: Open DevTools → Elements → search for "application/ld+json" — a script tag should appear with "@type": "Person", your name, LinkedIn URL, and GitHub URL in the sameAs array
result: [pending]

### 4. Canonical link tag
expected: View source and search for rel="canonical" — a link tag should point to the site's primary URL (https://borinakeo.vercel.app or similar)
result: [pending]

### 5. robots.txt accessible
expected: Visit /robots.txt in the browser — it should load a plain text file with "User-agent: *", "Allow: /", and a "Sitemap:" line pointing to the sitemap URL
result: [pending]

### 6. OG image loads
expected: Visit /og-image.png in the browser — the branded PNG (dark navy background, "Borina Keo" in white, "ERP & WMS AI Integration Leader" in emerald) should display at 2402×1254px
result: [pending]

### 7. Hero heading load animation
expected: Hard-refresh the page (Cmd+Shift+R). The hero heading ("Borina Keo" or your name) should fade in and slide up from slightly below over about 600ms. The subheading should follow ~150ms later. The animation should play once on load — no scroll needed.
result: [pending]

### 8. Section scroll animations
expected: Start at the top of the page. As you scroll down, each section (About, Skills, Experience, Projects, Contact) should fade in and slide up as it enters the viewport. Each section animates once and stays visible.
result: [pending]

### 9. Card hover states
expected: Hover over a skill card, then an experience entry card, then a project card. Each should lift up ~4px and show a soft emerald green glow around it. The lift and glow should animate smoothly (~200ms) and reverse when you move the mouse away.
result: [pending]

### 10. Emerald accent consistency
expected: Scroll through the page — you should see the emerald green (#10B981) color consistently on chip borders (skill tags, project tags), social icon links on hover, and card glows. The accent should appear in at least 3 different element types.
result: [pending]

### 11. Custom 404 page
expected: Visit any nonexistent URL (e.g., /this-does-not-exist). You should see a styled page — NOT the browser's default 404 — with the site's navigation bar, an ERP-themed message (something like "Even ERP migrations hit a wrong path"), and a button/link back to the home page.
result: [pending]

### 12. Lighthouse mobile score
expected: Open Chrome DevTools → Lighthouse tab → select "Mobile" and "Performance" → Run analysis on the live Vercel URL. Score should be 90 or above.
result: [pending]

### 13. WCAG AA contrast
expected: On the live site, body text (paragraphs, labels) on the dark background should be clearly readable. Running axe DevTools or Lighthouse Accessibility should show no contrast failures on body text. (The emerald accent is fine on decorative elements — the check is specifically for paragraph/label text.)
result: [pending]

## Summary

total: 13
passed: 0
issues: 0
pending: 13
skipped: 0

## Gaps

[none yet]
