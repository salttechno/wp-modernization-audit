/**
 * Security Analyzer - Assesses security posture and provides recommendations
 */

import type { SecurityResult, SecurityAnalysis } from "../types.js";

export function analyzeSecurity(secData: SecurityResult): SecurityAnalysis {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Analyze HTTPS
  const httpsStatus: SecurityAnalysis["httpsStatus"] = secData.isHttps
    ? "secure"
    : "insecure";
  if (!secData.isHttps) {
    issues.push("Site is not using HTTPS");
    recommendations.push(
      "CRITICAL: Migrate to HTTPS immediately for security and SEO"
    );
  }

  // Analyze headers coverage
  let headersCoverage: SecurityAnalysis["headersCoverage"];
  const requiredHeaders = [
    secData.hasXContentTypeOptions,
    secData.hasXFrameOptions,
    secData.hasContentSecurityPolicy,
  ];
  const presentCount = requiredHeaders.filter(Boolean).length;

  if (presentCount === 3) {
    headersCoverage = "excellent";
  } else if (presentCount >= 1) {
    headersCoverage = "partial";
    if (!secData.hasXContentTypeOptions) {
      issues.push("Missing X-Content-Type-Options header");
      recommendations.push("Add X-Content-Type-Options: nosniff header");
    }
    if (!secData.hasXFrameOptions) {
      issues.push("Missing X-Frame-Options header");
      recommendations.push(
        "Add X-Frame-Options header to prevent clickjacking"
      );
    }
    if (!secData.hasContentSecurityPolicy) {
      issues.push("Missing Content-Security-Policy header");
      recommendations.push(
        "Implement Content-Security-Policy to mitigate XSS attacks"
      );
    }
  } else {
    headersCoverage = "none";
    issues.push("Critical security headers are missing");
    recommendations.push(
      "Implement essential security headers (CSP, X-Frame-Options, X-Content-Type-Options)"
    );
  }

  // Analyze version exposure
  const versionExposure: SecurityAnalysis["versionExposure"] =
    secData.exposedWpVersion ? "exposed" : "hidden";
  if (secData.exposedWpVersion) {
    issues.push("WordPress version is publicly exposed");
    recommendations.push("Hide WordPress version to reduce attack surface");
  }

  // Overall posture
  let overallPosture: SecurityAnalysis["overallPosture"];
  if (
    httpsStatus === "secure" &&
    headersCoverage === "excellent" &&
    versionExposure === "hidden"
  ) {
    overallPosture = "strong";
  } else if (httpsStatus === "insecure" || headersCoverage === "none") {
    overallPosture = "weak";
  } else {
    overallPosture = "moderate";
  }

  return {
    httpsStatus,
    headersCoverage,
    versionExposure,
    overallPosture,
    issues,
    recommendations,
  };
}
