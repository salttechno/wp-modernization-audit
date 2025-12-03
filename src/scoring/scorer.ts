/**
 * Scorer - Applies scoring rules to analysis results
 */

import {
  scorePerformance,
  scoreSeo,
  scoreSecurity,
  scoreModernization,
  getRating,
} from "./rules.js";
import type {
  PerformanceAnalysis,
  SeoAnalysis,
  SecurityAnalysis,
  ModernizationAnalysis,
  ScoringResult,
} from "../types.js";

export function calculateScores(
  performanceAnalysis: PerformanceAnalysis,
  seoAnalysis: SeoAnalysis,
  securityAnalysis: SecurityAnalysis,
  modernizationAnalysis: ModernizationAnalysis
): ScoringResult {
  const performance = scorePerformance(performanceAnalysis);
  const seo = scoreSeo(seoAnalysis);
  const security = scoreSecurity(securityAnalysis);
  const modernization = scoreModernization(modernizationAnalysis);

  const overall = performance + seo + security + modernization;
  const rating = getRating(overall);

  return {
    performance,
    seo,
    security,
    modernization,
    overall,
    rating,
  };
}
