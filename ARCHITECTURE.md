# Architecture & Design

This document explains how `wp-modernization-audit` is structured and how a URL flows through collectors, analyzers, scoring, and reporting.

---

## High-level flow

1. **CLI** parses user options (URL, pages, format, output).
2. **Collectors** fetch and parse HTML/HTTP metadata for requested pages.
3. **Analyzers** interpret this data into structured findings.
4. **Scoring engine** applies rules to produce numeric scores.
5. **Report generator** produces Markdown, HTML, or JSON output.

---

## Tech stack

- **Language**: TypeScript
- **Runtime**: Node.js
- **CLI framework**: `commander`
- **HTTP**: `undici`
- **HTML parsing**: `cheerio`
- **Build**: `tsc`
- **Testing**: `vitest`

---

## Module structure

Folder layout:

```text
src/
  cli/
    index.ts            # CLI entrypoint, argument parsing
  collectors/
  │   ├── httpCollector.ts      # Fetch pages & headers
  │   ├── lighthouseCollector.ts # Google PageSpeed Insights API (v0.4.0)
  │   ├── modernizationCollector.ts # Check API & features
  │   ├── performanceCollector.ts # Analyze assets & timing
  │   ├── securityCollector.ts  # Check headers & SSL
  │   ├── seoCollector.ts       # Parse meta tags
  │   ├── sitemapCollector.ts   # Parse sitemap.xml (v0.3.0)
  │   └── wpDetector.ts         # Identify WP version/theme
  analyzers/
    performance.ts
    seo.ts
    security.ts
    modernization.ts
  scoring/
    rules.ts            # Scoring configuration
    scorer.ts           # Aggregates category scores
  report/
    markdown.ts
    html.ts
    json.ts
  types.ts
bin/
  wp-modernization-audit.js  # Compiled CLI (with shebang)
```

---

## Core components

### 1. CLI Layer (`src/cli/index.ts`)

Responsibilities:

- Parse CLI options.
- Validate required arguments (e.g., `--url`).
- Set sensible defaults (e.g., pages = [`/`]).
- Call the orchestration function with a typed config object.
- Handle error logging and exit codes.

Output: A `Config` object, e.g.:

```ts
interface AuditConfig {
  url: string;
  pages: string[];
  autoPages: boolean;
  maxPages: number;
  psApiKey?: string; // v0.4.0
  psStrategy?: "mobile" | "desktop" | "both"; // v0.4.0
  apiUrl?: string;
  format: "md" | "html" | "json";
  outputPath: string;
  verbose: boolean;
}
```

---

### 2. Collectors

Collectors are thin wrappers around HTTP + parsing. They should do **no scoring**.

#### `httpCollector.ts`

- Fetches each requested page (`/`, `/blog`, etc.) relative to `url`.
- Returns:
  - Response status
  - Headers
  - HTML body
  - Final URL after redirects

#### `wpDetector.ts`

- Uses:
  - HTML meta tags (e.g., `<meta name="generator">`)
  - URLs like `/wp-content/`, `/wp-includes/`
  - `/wp-json/` endpoint response
- Attempts to determine:
  - `isWordPress`
  - `wpVersion` (if revealed)
  - `themeName` (from theme directory)
  - A list of **known plugins** based on asset paths

#### `seoCollector.ts`

For each page:

- Extracts:
  - `<title>`
  - `<meta name="description">`
  - `<link rel="canonical">`
  - H1 tags
- Checks for `robots.txt` and `sitemap.xml` at root.

#### `performanceCollector.ts`

For each page:

- Derives:
  - HTML size (bytes)
  - Number of `<script>` and `<link rel="stylesheet">`
  - Approximate total JS/CSS bytes if possible
  - Presence of blocking CSS/JS in `<head>`
  - `<img>` tags and extensions (JPG, PNG, WebP, AVIF, etc.)
  - Key headers (`cache-control`, `etag`, etc.)

#### `securityCollector.ts`

- Checks:
  - Presence of security headers:
    - `X-Content-Type-Options`
    - `X-Frame-Options`
    - `Content-Security-Policy`
  - HTTPS vs HTTP.
  - Exposed WordPress version.

#### `modernizationCollector.ts`

- Checks for:
  - `/wp-json/` endpoint existence.
  - `/wp-json/wp/v2/posts` availability.
  - URL style (clean permalinks vs `?p=123`).
  - Uses CDN or serves assets from origin only.

#### `sitemapCollector.ts` _(v0.3.0)_

- Fetches and parses `sitemap.xml` from the site root.
- Handles sitemap index files (multiple sitemaps).
- Extracts URLs with priority and last modification dates.
- Implements intelligent page selection:
  - Prioritizes pages with higher sitemap priority.
  - Considers freshness (lastmod dates).
  - Always includes homepage.
  - Limits results to `maxPages` (default: 10).

---

### Multi-Page Aggregation _(v0.3.0)_

When auditing multiple pages, the CLI aggregates results intelligently:

**Performance Metrics:**

- HTML size, scripts, stylesheets, images: **averaged** across all pages.
- Caching: If **any** page has cache-control, it's marked as present.

**SEO Metrics:**

- **Weighted averaging** with homepage receiving **2× weight**.
- Coverage calculated for titles, meta descriptions, H1 tags, canonical tags.
- Example: If 2/3 pages have titles, but one is the homepage, coverage = (2×1 + 1×1) / (2+1+1) = 3/4 = 75%.

**Security Metrics:**

- Taken from the **first page** (typically homepage).
- Assumes security headers are site-wide.

**Modernization Metrics:**

- REST API and modernization features checked once (not per-page).

This approach provides a comprehensive assessment while preventing any single page from dominating the scores.

---

### 3. Analyzers

Analyzers interpret collected data into category-specific findings.

Each analyzer takes raw collected data and returns a structured result, e.g.:

```ts
interface PerformanceResult {
  htmlSizeBytes: number;
  totalJsBytes?: number;
  totalCssBytes?: number;
  numScripts: number;
  numStylesheets: number;
  cacheHeadersPresent: boolean;
  imageOptimizationQuality: "good" | "ok" | "poor";
}
```

There will be one analyzer per category:

- `performance.ts`
- `seo.ts`
- `security.ts`
- `modernization.ts`

---

### 4. Scoring Engine

Defined in detail in `SCORING_RULES.md`.

Responsibilities:

- Accepts analyzer results.
- Applies rules in `rules.ts` (configurable, easy to tune).
- Produces:
  - Category scores (0–30, 0–25, etc.).
  - Overall Modernization Score (0–100).

Design principle: **no magic inside the code**. Rules should be declarative, and non-devs should be able to understand them by reading `SCORING_RULES.md`.

---

### 5. Report Generators

Three main generators:

- `markdown.ts`
- `html.ts`
- `json.ts`

They all take the same `AuditResult` structure:

```ts
interface AuditResult {
  url: string;
  pages: PageResult[];
  timestamp: string;
  scores: {
    overall: number;
    performance: number;
    seo: number;
    healthSecurity: number;
    modernization: number;
  };
  summary: {
    rating: "healthy" | "needs-optimization" | "needs-modernization";
    topIssues: string[];
  };
  details: {
    performance: PerformanceResult;
    seo: SeoResult;
    healthSecurity: HealthSecurityResult;
    modernization: ModernizationResult;
  };
}
```

Markdown and HTML generators should produce **narrative, client-friendly reports**; JSON stays raw.

---

## Error handling principles

- Network failures to individual pages:
  - Log clearly.
  - Continue with what’s available if possible, but reflect missing data in the report.
- Site not detected as WordPress:
  - Return a clear message: “Target does not appear to be a WordPress site.”
  - Optional: still produce a partial report, but mark WP-related checks as N/A.

---

## Extensibility

- Adding a new check:

  1. Extend the appropriate collector to gather necessary data.
  2. Update the relevant analyzer.
  3. Add scoring logic in `rules.ts`.
  4. Update `SCORING_RULES.md` and report templates.

- Adding a new output format:
  - Implement another generator (e.g., `pdf.ts` using HTML → PDF pipeline).
  - Wire it through the CLI.

---
