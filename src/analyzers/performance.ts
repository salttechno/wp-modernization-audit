/**
 * Performance Analyzer - Interprets performance data into actionable analysis
 */

import type { PerformanceResult, PerformanceAnalysis } from "../types.js";

export function analyzePerformance(
  perfData: PerformanceResult
): PerformanceAnalysis {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Analyze HTML size
  let htmlSizeCategory: PerformanceAnalysis["htmlSizeCategory"];
  if (perfData.htmlSizeBytes < 100_000) {
    htmlSizeCategory = "excellent";
  } else if (perfData.htmlSizeBytes < 200_000) {
    htmlSizeCategory = "good";
  } else if (perfData.htmlSizeBytes < 300_000) {
    htmlSizeCategory = "fair";
    issues.push(`HTML size is ${Math.round(perfData.htmlSizeBytes / 1024)} KB`);
    recommendations.push(
      "Consider reducing HTML size through minification and removing unused code"
    );
  } else {
    htmlSizeCategory = "poor";
    issues.push(
      `Large HTML size: ${Math.round(perfData.htmlSizeBytes / 1024)} KB`
    );
    recommendations.push(
      "Significantly reduce HTML payload - consider lazy loading content"
    );
  }

  // Analyze script load
  let scriptLoadCategory: PerformanceAnalysis["scriptLoadCategory"];
  if (perfData.numScripts < 10) {
    scriptLoadCategory = "excellent";
  } else if (perfData.numScripts < 20) {
    scriptLoadCategory = "good";
  } else {
    scriptLoadCategory = "heavy";
    issues.push(`${perfData.numScripts} JavaScript files loaded`);
    recommendations.push("Consolidate and minify JavaScript files");
  }

  if (perfData.blockingScripts > 0) {
    issues.push(`${perfData.blockingScripts} blocking scripts in <head>`);
    recommendations.push(
      "Add async or defer attributes to scripts, or move them to bottom of page"
    );
  }

  // Analyze image optimization
  let imageOptimization: PerformanceAnalysis["imageOptimization"];
  const totalImages = Object.values(perfData.imageFormats).reduce(
    (sum, count) => sum + count,
    0
  );
  const modernFormats = perfData.imageFormats.webp + perfData.imageFormats.avif;

  if (totalImages === 0) {
    imageOptimization = "excellent";
  } else if (modernFormats / totalImages > 0.7) {
    imageOptimization = "excellent";
  } else if (modernFormats / totalImages > 0.3) {
    imageOptimization = "good";
    recommendations.push("Increase usage of WebP/AVIF image formats");
  } else {
    imageOptimization = "poor";
    issues.push(
      `Most images use legacy formats (JPEG/PNG: ${
        perfData.imageFormats.jpeg + perfData.imageFormats.png
      })`
    );
    recommendations.push(
      "Convert images to WebP or AVIF for better compression"
    );
  }

  // Analyze caching
  let caching: PerformanceAnalysis["caching"];
  if (perfData.hasCacheControl && perfData.cacheControlValue) {
    caching = "excellent";
  } else if (perfData.hasCacheControl) {
    caching = "partial";
    recommendations.push("Review and optimize cache-control headers");
  } else {
    caching = "none";
    issues.push("No caching headers detected");
    recommendations.push("Implement cache-control headers for static assets");
  }

  return {
    htmlSizeCategory,
    scriptLoadCategory,
    imageOptimization,
    caching,
    issues,
    recommendations,
  };
}
