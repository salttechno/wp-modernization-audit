# CLI Usage

This document describes how to install and run `wp-modernization-audit`, along with available flags and example commands.

---

## Installation

### Option 1 – Run with `npx` (recommended for first-time use)

```bash
npx wp-modernization-audit --url https://example.com
```

This uses the latest published version from npm without a global install.

---

### Option 2 – Global install

```bash
npm install -g wp-modernization-audit

wp-modernization-audit --url https://example.com
```

---

## Basic command

```bash
wp-modernization-audit --url https://example.com
```

Defaults:

- Pages: `["/"]`
- Format: `md`
- Output path: `./reports/wp-modernization-report-{domain}.md`

---

## CLI options

| Flag         | Type                 | Required | Default                                         | Description                                                                 |
| ------------ | -------------------- | -------- | ----------------------------------------------- | --------------------------------------------------------------------------- |
| `--url`      | string               | ✅       | –                                               | Base URL of the website to audit (e.g., `https://example.com`).             |
| `--pages`    | string[]             | ❌       | `["/"]`                                         | List of paths to audit relative to `--url`.                                 |
| `--api-url`  | string               | ❌       | auto-detected                                   | Override for WordPress REST API root (e.g., `https://example.com/wp-json`). |
| `--format`   | `md \| html \| json` | ❌       | `md`                                            | Output format.                                                              |
| `--out`      | string               | ❌       | `./reports/wp-modernization-report-{domain}.md` | Output file path.                                                           |
| `--verbose`  | boolean              | ❌       | `false`                                         | Print additional debug information to stdout.                               |
| `--no-color` | boolean              | ❌       | `false`                                         | Disable ANSI colors in CLI logs.                                            |

---

## Examples

### 1. Simple audit in Markdown (default)

```bash
wp-modernization-audit --url https://example.com
```

Output:

- `./reports/wp-modernization-report-example-com.md`

---

### 2. Audit multiple key pages

```bash
wp-modernization-audit \
  --url https://example.com \
  --pages "/" "/blog" "/contact" "/product"
```

The tool will:

- Fetch each page.
- Aggregate results into a single report.
- Compute scores taking all pages into account.

---

### 3. Generate an HTML report

```bash
wp-modernization-audit \
  --url https://example.com \
  --pages "/" "/blog" \
  --format html \
  --out ./reports/example-report.html
```

Use the HTML report in:

- Internal portals.
- Embeds in dashboards.
- Links shared with teammates.

---

### 4. JSON output for automation

```bash
wp-modernization-audit \
  --url https://example.com \
  --pages "/" "/pricing" \
  --format json \
  --out ./reports/example.json
```

You can then parse the JSON and:

- Show scores in a dashboard.
- Trigger internal alerts when scores fall below thresholds.
- Store snapshots in a database.

---

### 5. Using a custom WordPress API URL

```bash
wp-modernization-audit \
  --url https://example.com \
  --api-url https://api.example.com/wp-json \
  --format md
```

Use this if:

- WordPress is behind a proxy.
- The public domain differs from the WP backend domain.

---

## Exit codes

- `0` – Audit completed successfully.
- `1` – CLI usage error (missing `--url`, invalid flag, etc.).
- `2` – Network or HTTP error that prevented the audit from completing.
- `3` – The target does not appear to be a WordPress site.

---

## Logging

- By default, the tool prints:

  - A short summary of what it is doing.
  - Where the report was written.

- `--verbose` adds:
  - Per-page fetch logs.
  - Info about which checks passed/failed.

---

## Notes

- The audit is **read-only**. It does not attempt to modify the site in any way.
- The tool assumes public accessibility (no authentication).
- For password-protected staging sites, you may need to configure additional options (to be defined in future versions).

---
