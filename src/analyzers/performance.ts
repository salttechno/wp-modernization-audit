/**
 * Performance Analyzer - Interprets performance data into actionable analysis
 */

import type {
  PerformanceResult,
  PerformanceAnalysis,
  LighthouseData,
} from "../types.js";

export function analyzePerformance(
  perfData: PerformanceResult,
  lighthouseData?: LighthouseData
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

  // Analyze Core Web Vitals (v0.4.0) - if PageSpeed data available
  let coreWebVitals: PerformanceAnalysis["coreWebVitals"] | undefined;

  if (lighthouseData) {
    // LCP (Largest Contentful Paint) - Good: <2.5s, Needs work: 2.5-4s, Poor: >4s
    const lcpStatus =
      lighthouseData.lcp < 2500
        ? "good"
        : lighthouseData.lcp < 4000
        ? "needs-improvement"
        : "poor";

    if (lcpStatus === "poor") {
      issues.push(
        `Poor LCP: ${(lighthouseData.lcp / 1000).toFixed(2)}s (target: <2.5s)`
      );
      recommendations.push(
        "Improve Largest Contentful Paint by optimizing images, removing render-blocking resources, and using CDN"
      );
    } else if (lcpStatus === "needs-improvement") {
      recommendations.push(
        `LCP could be better: ${(lighthouseData.lcp / 1000).toFixed(
          2
        )}s (target: <2.5s)`
      );
    }

    // CLS (Cumulative Layout Shift) - Good: <0.1, Needs work: 0.1-0.25, Poor: >0.25
    const clsStatus =
      lighthouseData.cls < 0.1
        ? "good"
        : lighthouseData.cls < 0.25
        ? "needs-improvement"
        : "poor";

    if (clsStatus === "poor") {
      issues.push(`Poor CLS: ${lighthouseData.cls.toFixed(3)} (target: <0.1)`);
      recommendations.push(
        "Reduce Cumulative Layout Shift by setting image dimensions, avoiding injected content, and using CSS transforms"
      );
    } else if (clsStatus === "needs-improvement") {
      recommendations.push(
        `CLS could be better: ${lighthouseData.cls.toFixed(3)} (target: <0.1)`
      );
    }

    // INP (Interaction to Next Paint) - Good: <200ms, Needs work: 200-500ms, Poor: >500ms
    const inpStatus =
      lighthouseData.inp < 200
        ? "good"
        : lighthouseData.inp < 500
        ? "needs-improvement"
        : "poor";

    if (inpStatus === "poor") {
      issues.push(`Poor INP: ${lighthouseData.inp}ms (target: <200ms)`);
      recommendations.push(
        "Improve Interaction to Next Paint by reducing JavaScript execution time and optimizing event handlers"
      );
    } else if (inpStatus === "needs-improvement") {
      recommendations.push(
        `INP could be better: ${lighthouseData.inp}ms (target: <200ms)`
      );
    }

    // TTFB (Time to First Byte) - Good: <800ms, Needs work: 800-1800ms, Poor: >1800ms
    const ttfbStatus =
      lighthouseData.ttfb < 800
        ? "good"
        : lighthouseData.ttfb < 1800
        ? "needs-improvement"
        : "poor";

    if (ttfbStatus === "poor") {
      issues.push(`Slow TTFB: ${lighthouseData.ttfb}ms (target: <800ms)`);
      recommendations.push(
        "Improve Time to First Byte by optimizing server response time, using CDN, and enabling caching"
      );
    } else if (ttfbStatus === "needs-improvement") {
      recommendations.push(
        `TTFB could be faster: ${lighthouseData.ttfb}ms (target: <800ms)`
      );
    }

    coreWebVitals = {
      lcpStatus,
      clsStatus,
      inpStatus,
      ttfbStatus,
    };
  }

  return {
    htmlSizeCategory,
    scriptLoadCategory,
    imageOptimization,
    caching,
    coreWebVitals,
    issues,
    recommendations,
  };
}
