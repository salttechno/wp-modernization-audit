# Contributing

Thank you for your interest in contributing to `wp-modernization-audit`!  
This project aims to be a practical, transparent tool that helps teams understand when and how to modernize WordPress sites.

---

## Ways to contribute

- Report bugs and issues.
- Suggest new checks or refinements to scoring.
- Improve documentation and examples.
- Submit pull requests for:
  - New analyzers.
  - Additional output formats.
  - Performance improvements.

---

## Getting started (development)

1. **Fork and clone**

```bash
git clone https://github.com/salttechno/wp-modernization-audit.git
cd wp-modernization-audit
```

2. **Install dependencies**

```bash
npm install
```

3. **Run tests**

```bash
npm test
```

4. **Build**

```bash
npm run build
```

5. **Run CLI from source**

```bash
npm run dev -- --url https://example.com
```

(Implementation detail: `npm run dev` should be configured to run `ts-node` or similar on the CLI entry.)

---

## Coding guidelines

- Use **TypeScript** for all source files.
- Keep modules **small and focused**:
  - Collectors only collect data.
  - Analyzers interpret collected data.
  - Scoring uses rules defined in `rules.ts`.
- Avoid hard-coding large rule sets directly in analyzers; prefer configuration in a single place.
- Provide **tests** for non-trivial logic.

---

## Scoring changes

If you change how scoring works:

1. Update the configuration in `scoring/rules.ts`.
2. Update `SCORING_RULES.md` to match the new behavior.
3. Add or adjust tests for scoring.
4. Mention the change in the changelog / release notes if applicable.

The goal is to keep scoring **transparent** and **understandable**.

---

## Documentation changes

- Keep `README.md` friendly and concise.
- Detailed topics belong in:
  - `ARCHITECTURE.md`
  - `CLI_USAGE.md`
  - `SCORING_RULES.md`
  - `ROADMAP.md`

If you add new features, please document:

- New CLI flags.
- New report sections.
- Any breaking changes.

---

## Issue reporting

When opening an issue, please include:

- URL you tested (if you can share it).
- Exact CLI command used.
- CLI output (with `--verbose` if relevant).
- Expected vs actual behavior.

This helps maintainers reproduce and fix issues faster.

---

## Code of Conduct

- Be respectful and constructive.
- Assume good intent.
- Focus on making the tool better for everyone.

---

Thank you for helping improve `wp-modernization-audit`!
