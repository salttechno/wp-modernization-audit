# Changelog

All notable changes to wp-modernization-audit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-12-03

### Added

- **HTML Report Generator**: Professional HTML reports with embedded CSS, responsive design, and visual score indicators
- **JSON Report Generator**: Structured JSON output for automation and integration with external tools
- Domain name automatically included in default report filename
- Enhanced error handling with better error messages

### Changed

- CLI now fully supports `--format html` and `--format json` options
- Report filename extension now matches the selected format
- Updated documentation with HTML and JSON usage examples

### Fixed

- Improved module import paths for better CommonJS compatibility

## [0.1.0] - 2025-12-03

### Added

- Initial MVP release
- WordPress detection via multiple methods (meta tags, paths, REST API, theme/plugin detection)
- Four-category scoring system:
  - Performance (0-30 points)
  - SEO Foundations (0-25 points)
  - WordPress Health & Security (0-25 points)
  - Modernization Readiness (0-20 points)
- Overall Modernization Score (0-100)
- Markdown report generation with:
  - Executive summary
  - Category breakdowns
  - Issue identification
  - Actionable recommendations
- CLI with comprehensive options:
  - `--url` (required): Site to audit
  - `--pages`: Custom page paths
  - `--api-url`: Override REST API URL
  - `--format`: Output format selection
  - `--out`: Custom output path
  - `--verbose`: Debug logging
- Transparent, configurable scoring rules
- Comprehensive TypeScript type definitions
- Professional documentation (README, ARCHITECTURE, CLI_USAGE, SCORING_RULES, ROADMAP, CONTRIBUTING)

[0.2.0]: https://github.com/salttechno/wp-modernization-audit/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/salttechno/wp-modernization-audit/releases/tag/v0.1.0
