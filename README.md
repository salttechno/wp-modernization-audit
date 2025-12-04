# wp-modernization-audit

> A CLI tool that audits WordPress-powered websites and generates modernization reports with performance, SEO, security, and headless-readiness insights.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js >= 18](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

## What is this?

`wp-modernization-audit` is a Node.js + TypeScript CLI that inspects a public WordPress site and produces a structured report with:

- **Modernization Score** (0–100)
- **Category Scores**: Performance, SEO, Security, Modernization Readiness
- **Human-readable Markdown report** with recommendations
- Clear insights on whether to optimize or modernize

Perfect for agencies, consultants, and internal teams evaluating WordPress sites for modernization opportunities.

## Quick Start

### Run with npx (no installation required)

```bash
npx wp-modernization-audit --url https://example.com
```

### Or install globally

```bash
npm install -g wp-modernization-audit
wp-modernization-audit --url https://example.com
```

## Usage

### Basic audit

```bash
wp-modernization-audit --url https://example.com
```

This will:

- Audit the homepage (`/`)
- Generate a Markdown report
- Save to `./reports/wp-modernization-report-example-com.md` (domain name is automatically added)

> **Note:** The report filename automatically includes the domain name (e.g., `wordpress-org.md` for wordpress.org). Use `--out` to specify a custom path.

### Audit multiple pages

```bash
wp-modernization-audit \
  --url https://example.com \
  --pages "/" "/blog" "/about" "/contact"
```

### Customize output

```bash
wp-modernization-audit \
  --url https://example.com \
  --out ./reports/my-audit.md \
  --verbose
```

### Auto-discover pages from sitemap

```bash
wp-modernization-audit \
  --url https://example.com \
  --auto-pages \
  --max-pages 10
```

> **Note:** When auditing multiple pages, scores are aggregated with intelligent weighting. The homepage receives 2× weight for SEO metrics, and performance metrics are averaged across all pages for a comprehensive assessment.

## CLI Options

| Option               | Type             | Default                                         | Description                            |
| -------------------- | ---------------- | ----------------------------------------------- | -------------------------------------- |
| `--url <url>`        | string           | _(required)_                                    | Base URL of the website to audit       |
| `--pages <paths...>` | string[]         | `["/"]`                                         | Paths to audit (relative to URL)       |
| `--auto-pages`       | boolean          | `false`                                         | Auto-discover pages from sitemap.xml   |
| `--max-pages <n>`    | number           | `10`                                            | Max pages to audit (with --auto-pages) |
| `--api-url <url>`    | string           | auto-detected                                   | Override WordPress REST API root       |
| `--format <format>`  | `md\|html\|json` | `md`                                            | Output format _(html/json in v0.2.0)_  |
| `--out <path>`       | string           | `./reports/wp-modernization-report-{domain}.md` | Output file path                       |
| `--verbose`          | boolean          | `false`                                         | Print debug information                |
| `--no-color`         | boolean          | `false`                                         | Disable colored output                 |

## What does it check?

### 1. Performance (30 points)

- HTML size and payload
- JavaScript and CSS load
- Image optimization (WebP/AVIF usage)
- Caching headers

### 2. SEO Foundations (25 points)

- Title tags and meta descriptions
- H1 heading structure
- Canonical tags
- robots.txt and sitemap.xml

### 3. WordPress Health & Security (25 points)

- HTTPS usage
- Security headers (CSP, X-Frame-Options, etc.)
- WordPress version exposure

### 4. Modernization Readiness (20 points)

- REST API availability
- Content endpoints (`/wp-json/wp/v2/posts`)
- URL structure (pretty permalinks)
- CDN usage

## Sample Output

```
🔍 WordPress Modernization Audit

Auditing: https://example.com
Pages: /

✅ WordPress detected
   Version: 6.4.2
   Theme: twentytwentythree

📊 Audit Complete!

Overall Score: 72/100
Rating: needs-optimization

Category Scores:
  Performance:      22/30
  SEO:              20/25
  Security:         20/25
  Modernization:    10/20

✅ Report saved to: ./wp-modernization-report.md
```

## Development

### Setup

```bash
git clone https://github.com/salttechno/wp-modernization-audit.git
cd wp-modernization-audit
npm install
```

### Build

```bash
npm run build
```

### Run from source

```bash
npm run dev -- --url https://example.com
```

### Test

```bash
npm test
```

## Architecture

This tool follows a modular architecture:

- **Collectors**: Fetch and parse raw data (HTTP, HTML, headers)
- **Analyzers**: Interpret data into structured findings
- **Scoring Engine**: Apply transparent, configurable rules
- **Report Generators**: Format output for human or machine consumption

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT © Salt Technologies

## Links

- [Documentation](./README.md)
- [Scoring Rules](./SCORING_RULES.md)
- [Software Outsourcing Company](https://www.salttechno.com/)

---

**Built with ❤️ by the team at Salt Technologies**
