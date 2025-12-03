/**
 * Scoring Rules - Declarative configuration for scoring logic
 * Based on SCORING_RULES.md
 */

import type {
  PerformanceAnalysis,
  SeoAnalysis,
  SecurityAnalysis,
  ModernizationAnalysis,
} from "../types.js";

// ============================================================================
// Performance Scoring (30 points total)
// ============================================================================

export function scorePerformance(analysis: PerformanceAnalysis): number {
  let score = 0;

  // HTML size (0-6 pts)
  switch (analysis.htmlSizeCategory) {
    case "excellent":
      score += 6;
      break;
    case "good":
      score += 4;
      break;
    case "fair":
      score += 2;
      break;
    case "poor":
      score += 0;
      break;
  }

  // Script load (0-8 pts)
  switch (analysis.scriptLoadCategory) {
    case "excellent":
      score += 8;
      break;
    case "good":
      score += 5;
      break;
    case "heavy":
      score += 1;
      break;
  }

  // Image optimization (0-6 pts)
  switch (analysis.imageOptimization) {
    case "excellent":
      score += 6;
      break;
    case "good":
      score += 3;
      break;
    case "poor":
      score += 0;
      break;
  }

  // Caching (0-6 pts)
  switch (analysis.caching) {
    case "excellent":
      score += 6;
      break;
    case "partial":
      score += 3;
      break;
    case "none":
      score += 0;
      break;
  }

  // CSS/Stylesheets (0-4 pts) - inferred from overall performance
  // For MVP, we'll give a baseline score
  score += 4;

  return Math.min(score, 30);
}

// ============================================================================
// SEO Scoring (25 points total)
// ============================================================================

export function scoreSeo(analysis: SeoAnalysis): number {
  let score = 0;

  // Title tags (0-6 pts)
  switch (analysis.titleQuality) {
    case "excellent":
      score += 6;
      break;
    case "good":
      score += 4;
      break;
    case "missing":
      score += 0;
      break;
  }

  // Meta descriptions (0-6 pts)
  switch (analysis.metaDescriptionQuality) {
    case "excellent":
      score += 6;
      break;
    case "good":
      score += 4;
      break;
    case "missing":
      score += 0;
      break;
  }

  // H1 usage (0-5 pts)
  switch (analysis.h1Quality) {
    case "excellent":
      score += 5;
      break;
    case "issues":
      score += 2;
      break;
    case "missing":
      score += 0;
      break;
  }

  // Canonical tags (0-4 pts)
  if (analysis.hasCanonical) {
    score += 4;
  }

  // Robots & Sitemap (0-4 pts)
  if (analysis.hasRobotsTxt && analysis.hasSitemap) {
    score += 4;
  } else if (analysis.hasRobotsTxt || analysis.hasSitemap) {
    score += 2;
  }

  return Math.min(score, 25);
}

// ============================================================================
// Security Scoring (25 points total)
// ============================================================================

export function scoreSecurity(analysis: SecurityAnalysis): number {
  let score = 0;

  // HTTPS usage (0-5 pts)
  if (analysis.httpsStatus === "secure") {
    score += 5;
  }

  // Security headers (0-10 pts)
  switch (analysis.headersCoverage) {
    case "excellent":
      score += 10;
      break;
    case "partial":
      score += 5;
      break;
    case "none":
      score += 0;
      break;
  }

  // Exposed WP version (0-5 pts)
  if (analysis.versionExposure === "hidden") {
    score += 5;
  }

  // Update posture (0-5 pts) - for MVP, give baseline score
  // In future versions, this could check actual WP version against known latest
  score += 5;

  return Math.min(score, 25);
}

// ============================================================================
// Modernization Scoring (20 points total)
// ============================================================================

export function scoreModernization(analysis: ModernizationAnalysis): number {
  let score = 0;

  // REST API availability (0-6 pts)
  switch (analysis.restApiStatus) {
    case "full":
      score += 6;
      break;
    case "partial":
      score += 3;
      break;
    case "none":
      score += 0;
      break;
  }

  // Content endpoints (0-5 pts) - covered by restApiStatus
  if (analysis.restApiStatus === "full") {
    score += 5;
  } else if (analysis.restApiStatus === "partial") {
    score += 2;
  }

  // URL structure (0-5 pts)
  switch (analysis.permalinkModernity) {
    case "modern":
      score += 5;
      break;
    case "mixed":
      score += 2;
      break;
    case "legacy":
      score += 0;
      break;
  }

  // CDN usage (0-4 pts)
  switch (analysis.cdnUsage) {
    case "yes":
      score += 4;
      break;
    case "partial":
      score += 2;
      break;
    case "no":
      score += 0;
      break;
  }

  return Math.min(score, 20);
}

// ============================================================================
// Overall Rating
// ============================================================================

export function getRating(
  overallScore: number
): "healthy" | "needs-optimization" | "needs-modernization" | "legacy" {
  if (overallScore >= 80) return "healthy";
  if (overallScore >= 60) return "needs-optimization";
  if (overallScore >= 40) return "needs-modernization";
  return "legacy";
}
