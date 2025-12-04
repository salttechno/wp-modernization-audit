# Scoring Rules

This document describes how `wp-modernization-audit` calculates the **Modernization Score (0–100)** and its category breakdown.

The design goals:

- Scores must be **explainable**.
- Scores must be **configurable** (via `rules.ts`).
- Reports should translate scores into clear recommendations.

---

## Categories & weights

Total: **100 points**

- **Performance** – 30 points
- **SEO Foundations** – 25 points
- **WP Health & Security** – 25 points
- **Modernization Readiness** – 20 points

---

## Multi-Page Scoring _(v0.3.0)_

When auditing multiple pages (using `--pages` or `--auto-pages`), scores are aggregated to provide a comprehensive site-wide assessment:

### Weighted SEO Scoring

- Homepage receives **2× weight** for SEO metrics
- Other pages receive **1× weight**
- Coverage percentage = (weighted pages with feature) / (total weighted pages)

**Example:** Site with homepage + 2 other pages

- Homepage has title ✅ (weight: 2)
- Page 2 has title ✅ (weight: 1)
- Page 3 missing title ❌ (weight: 1)
- **Title coverage** = (2 + 1) / (2 + 1 + 1) = **75%**

This weighting reflects the homepage's outsized importance for SEO and user first impressions.

### Performance Averaging

- HTML size, scripts, stylesheets, images: **arithmetic mean** across all pages
- Provides representative snapshot of typical page weight
- Prevents outliers from dominating the score

### Security & Modernization

- Security headers: Evaluated from first page (assumes site-wide configuration)
- REST API & modernization features: Checked once (site-level capabilities)

---

## 1. Performance (30 points + up to 11 bonus points)

Assessed per key page, then aggregated (e.g., average or weighted by page type).

### 1.1 HTML size (0–6 pts)

- `< 100 KB` → 6 pts
- `100–200 KB` → 4 pts
- `200–300 KB` → 2 pts
- `> 300 KB` → 0 pts

### 1.2 Total JS payload (0–8 pts) _(approximate)_

- `< 10 scripts` → 8 pts
- `10–20 scripts` → 5 pts
- `> 20 scripts` → 1 pt (heavy)

If exact bytes are not determinable, use script count as a proxy and assign conservative scores.

### 1.3 Total CSS payload (0–4 pts) _(approximate)_

- Baseline score for MVP → 4 pts

### 1.4 Caching headers (0–6 pts)

- For each key page:
  - If `cache-control` exists and is not `no-store`, and static assets (CSS/JS) also have caching headers:
    - Add 6 pts (perfect).
  - If only some assets/pages have proper cache headers:
    - Add 3–4 pts (partial).
  - Otherwise:
    - 0 pts.

### 1.5 Image optimization (0–6 pts)

Based on `<img>` tags:

- If a meaningful portion of images use WebP/AVIF and dimensions look appropriate:
  - 6 pts.
- If images are mostly legacy formats (JPG/PNG) but not obviously overscaled:
  - 3 pts.
- If there are many large images with no WebP/AVIF:
  - 0 pts.

### 1.6 Core Web Vitals Bonus (v0.4.0)

If a PageSpeed API key is provided, bonus points are awarded for passing Core Web Vitals. This allows the performance score to exceed 30 (up to 41), rewarding high-performing sites without penalizing those without API access.

| Metric   | Bonus Points | Criteria                                               |
| :------- | :----------- | :----------------------------------------------------- |
| **LCP**  | +3 pts       | Good (< 2.5s) = +3, Needs Improvement (< 4s) = +1      |
| **CLS**  | +3 pts       | Good (< 0.1) = +3, Needs Improvement (< 0.25) = +1     |
| **INP**  | +3 pts       | Good (< 200ms) = +3, Needs Improvement (< 500ms) = +1  |
| **TTFB** | +2 pts       | Good (< 800ms) = +2, Needs Improvement (< 1800ms) = +1 |

---

## 2. SEO Foundations (25 points)

Focuses on must-have basics.

### 2.1 Title tags (0–6 pts)

Evaluate key pages:

- All key pages have `<title>` with non-empty value and reasonable length:
  - 6 pts.
- Some key pages missing or generic titles:
  - 3–4 pts.
- Many missing or “Untitled”:
  - 0–2 pts.

### 2.2 Meta descriptions (0–6 pts)

- All key pages have non-empty `<meta name="description">`:
  - 6 pts.
- Some missing:
  - 3–4 pts.
- Most missing:
  - 0–2 pts.

### 2.3 H1 usage (0–5 pts)

- Each key page has **exactly one** meaningful `<h1>`:
  - 5 pts.
- Some pages missing H1 or multiple H1s:
  - 2–3 pts.
- Widespread issues:
  - 0–1 pt.

### 2.4 Canonical tags (0–4 pts)

- All key pages have `<link rel="canonical">`:
  - 4 pts.
- Partial coverage:
  - 2 pts.
- Largely missing:
  - 0 pts.

### 2.5 Robots & Sitemap (0–4 pts)

- `robots.txt` accessible and `sitemap.xml` present:
  - 4 pts.
- Only one of them present:
  - 2 pts.
- Both missing:
  - 0 pts.

---

## 3. WP Health & Security (25 points)

Surface-level but important signals.

### 3.1 Exposed WordPress version (0–5 pts)

- If version is **not exposed** in meta tags and obvious headers:
  - 5 pts.
- If version is exposed:
  - 0 pts.

### 3.2 Security headers (0–10 pts)

Check for:

- `X-Content-Type-Options`
- `X-Frame-Options`
- `Content-Security-Policy`

Scoring:

- All three present (with reasonable values):
  - 10 pts.
- One or two present:
  - 4–7 pts.
- None present:
  - 0 pts.

### 3.3 HTTPS usage (0–5 pts)

- All pages tested are served via HTTPS with no obvious downgrade:
  - 5 pts.
- Mixed content or HTTP redirects within key paths:
  - 2–3 pts.
- Primarily HTTP:
  - 0 pts.

### 3.4 Update posture (0–5 pts) _(heuristic)_

Because we cannot directly see the admin, infer via:

- If WP version is significantly outdated (based on known latest at implementation time) → 0–2 pts.
- If plugins/themes suggest very old tech (e.g., outdated major versions, known legacy builders) → subtract.
- If version appears recent or not easily identifiable → grant more pts.

Exact thresholds to be defined in `rules.ts`.

---

## 4. Modernization Readiness (20 points)

Indicates how “ready” the site is to shift into a modern/headless architecture.

### 4.1 WordPress REST API availability (0–6 pts)

- `/wp-json/` responds with valid JSON + expected structure:
  - 6 pts.
- `/wp-json/` limited or non-standard:
  - 3–4 pts.
- No REST API accessible:
  - 0 pts.

### 4.2 Content endpoints (0–5 pts)

Check:

- `/wp-json/wp/v2/posts`
- `/wp-json/wp/v2/pages`

- If both are available and responsive:
  - 5 pts.
- Only one available:
  - 2–3 pts.
- None available:
  - 0 pts.

### 4.3 URL structure (0–5 pts)

- “Pretty” permalinks (e.g., `/blog/some-post`) across key pages:
  - 5 pts.
- Mix of pretty and query-string (`?p=123`):
  - 2–3 pts.
- Primarily parameter-based URLs:
  - 0 pts.

### 4.4 Asset & CDN usage (0–4 pts)

- Uses CDN or separate asset domain for static assets:
  - 4 pts.
- Some CDN usage:
  - 2 pts.
- All assets served from origin with no caching/CDN:
  - 0 pts.

---

## 5. Overall Modernization Score

The **overall score** is the weighted sum:

```text
Overall = Performance (0–30)
        + SEO Foundations (0–25)
        + WP Health & Security (0–25)
        + Modernization Readiness (0–20)
```

Interpretation guidelines for reports:

- **80–100**: “Healthy with room for targeted improvements”
- **60–79**: “Needs optimization; modernization recommended for long-term gains”
- **40–59**: “Significant issues; strong candidate for modernization”
- **0–39**: “Legacy state; modernization strongly recommended”

Reports should **always** include a short narrative explaining what the score means and recommended next steps.

---

## Implementation notes

- The actual numeric thresholds and points will be defined in `scoring/rules.ts`.
- This document should be kept in sync with `rules.ts` so that non-developers can understand how scores are derived.
- Future versions may:
  - Integrate Lighthouse / PageSpeed API.
  - Add accessibility checks.
  - Provide more granular scoring for large sites.

---
