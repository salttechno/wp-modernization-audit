/**
 * Security Collector - Checks security headers and HTTPS usage
 */

import type { SecurityResult } from "../types.js";

export function collectSecurityData(
  url: string,
  headers: Record<string, string>,
  html: string
): SecurityResult {
  // Check if HTTPS
  const isHttps = url.startsWith("https://");

  // Check security headers (case-insensitive)
  const headersLower: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    headersLower[key.toLowerCase()] = value;
  }

  const hasXContentTypeOptions = "x-content-type-options" in headersLower;
  const hasXFrameOptions = "x-frame-options" in headersLower;
  const hasContentSecurityPolicy =
    "content-security-policy" in headersLower ||
    "content-security-policy-report-only" in headersLower;

  // Check if WordPress version is exposed
  let exposedWpVersion = false;

  // Check in meta generator
  if (html.includes("WordPress") && /WordPress\s+[\d.]+/i.test(html)) {
    exposedWpVersion = true;
  }

  // Check in comments
  if (html.includes("<!-- WordPress")) {
    exposedWpVersion = true;
  }

  // Collect relevant security headers
  const securityHeaders: Record<string, string> = {};
  const securityHeaderKeys = [
    "strict-transport-security",
    "x-content-type-options",
    "x-frame-options",
    "content-security-policy",
    "x-xss-protection",
    "referrer-policy",
    "permissions-policy",
  ];

  for (const key of securityHeaderKeys) {
    if (headersLower[key]) {
      securityHeaders[key] = headersLower[key];
    }
  }

  return {
    isHttps,
    hasXContentTypeOptions,
    hasXFrameOptions,
    hasContentSecurityPolicy,
    exposedWpVersion,
    securityHeaders,
  };
}
