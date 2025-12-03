/**
 * Modernization Analyzer - Evaluates headless/modern architecture readiness
 */

import type { ModernizationResult, ModernizationAnalysis } from "../types.js";

export function analyzeModernization(
  modData: ModernizationResult
): ModernizationAnalysis {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Analyze REST API status
  let restApiStatus: ModernizationAnalysis["restApiStatus"];
  if (
    modData.hasRestApi &&
    modData.hasPostsEndpoint &&
    modData.hasPagesEndpoint
  ) {
    restApiStatus = "full";
  } else if (modData.hasRestApi) {
    restApiStatus = "partial";
    if (!modData.hasPostsEndpoint) {
      issues.push("Posts endpoint not accessible");
    }
    if (!modData.hasPagesEndpoint) {
      issues.push("Pages endpoint not accessible");
    }
    recommendations.push(
      "Ensure all necessary REST API endpoints are enabled and accessible"
    );
  } else {
    restApiStatus = "none";
    issues.push("WordPress REST API is not accessible");
    recommendations.push(
      "Enable WordPress REST API for headless/modern architecture compatibility"
    );
  }

  // Analyze permalink modernity
  let permalinkModernity: ModernizationAnalysis["permalinkModernity"];
  if (modData.hasPrettyPermalinks) {
    permalinkModernity = "modern";
  } else {
    permalinkModernity = "legacy";
    issues.push("Using query-string based URLs instead of pretty permalinks");
    recommendations.push(
      "Enable pretty permalinks for better SEO and modern URL structure"
    );
  }

  // Analyze CDN usage
  let cdnUsage: ModernizationAnalysis["cdnUsage"];
  if (modData.usesCdn && modData.cdnDomains.length > 0) {
    cdnUsage = "yes";
  } else {
    cdnUsage = "no";
    issues.push("No CDN detected for static assets");
    recommendations.push(
      "Implement a CDN to improve global performance and reduce origin server load"
    );
  }

  // Overall headless readiness
  let headlessReadiness: ModernizationAnalysis["headlessReadiness"];
  if (restApiStatus === "full" && permalinkModernity === "modern") {
    headlessReadiness = "ready";
  } else if (restApiStatus === "none" || permalinkModernity === "legacy") {
    headlessReadiness = "not-ready";
  } else {
    headlessReadiness = "needs-work";
  }

  // Add overall modernization recommendations
  if (headlessReadiness === "not-ready") {
    recommendations.push(
      "Site requires significant modernization before considering headless architecture"
    );
  } else if (headlessReadiness === "needs-work") {
    recommendations.push(
      "Address REST API and permalink issues to improve headless readiness"
    );
  } else {
    recommendations.push(
      "Site is well-positioned for modern/headless architecture migration"
    );
  }

  return {
    restApiStatus,
    permalinkModernity,
    cdnUsage,
    headlessReadiness,
    issues,
    recommendations,
  };
}
