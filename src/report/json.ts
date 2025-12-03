/**
 * JSON Report Generator - Exports structured audit data
 */

import type { AuditResult } from "../types";

export function generateJsonReport(result: AuditResult): string {
  const jsonOutput = {
    meta: {
      version: "0.2.0",
      generatedAt: result.timestamp,
      url: result.url,
      pagesAudited: result.pages.length,
    },
    wordpress: {
      detected: result.wpDetection.isWordPress,
      version: result.wpDetection.wpVersion || null,
      theme: result.wpDetection.themeName || null,
      plugins: result.wpDetection.plugins,
      detectionMethods: result.wpDetection.detectionMethods,
    },
    scores: {
      overall: result.scores.overall,
      performance: result.scores.performance,
      seo: result.scores.seo,
      security: result.scores.security,
      modernization: result.scores.modernization,
      rating: result.scores.rating,
    },
    findings: {
      performance: {
        category: "Performance",
        score: result.scores.performance,
        maxScore: 30,
        issues: result.analyses.performance.issues,
        recommendations: result.analyses.performance.recommendations,
        details: {
          htmlSizeCategory: result.analyses.performance.htmlSizeCategory,
          scriptLoadCategory: result.analyses.performance.scriptLoadCategory,
          imageOptimization: result.analyses.performance.imageOptimization,
          caching: result.analyses.performance.caching,
        },
      },
      seo: {
        category: "SEO Foundations",
        score: result.scores.seo,
        maxScore: 25,
        issues: result.analyses.seo.issues,
        recommendations: result.analyses.seo.recommendations,
        details: {
          titleQuality: result.analyses.seo.titleQuality,
          metaDescriptionQuality: result.analyses.seo.metaDescriptionQuality,
          h1Quality: result.analyses.seo.h1Quality,
          hasCanonical: result.analyses.seo.hasCanonical,
          hasRobotsTxt: result.analyses.seo.hasRobotsTxt,
          hasSitemap: result.analyses.seo.hasSitemap,
        },
      },
      security: {
        category: "WordPress Health & Security",
        score: result.scores.security,
        maxScore: 25,
        issues: result.analyses.security.issues,
        recommendations: result.analyses.security.recommendations,
        details: {
          httpsStatus: result.analyses.security.httpsStatus,
          headersCoverage: result.analyses.security.headersCoverage,
          versionExposure: result.analyses.security.versionExposure,
          overallPosture: result.analyses.security.overallPosture,
        },
      },
      modernization: {
        category: "Modernization Readiness",
        score: result.scores.modernization,
        maxScore: 20,
        issues: result.analyses.modernization.issues,
        recommendations: result.analyses.modernization.recommendations,
        details: {
          restApiStatus: result.analyses.modernization.restApiStatus,
          permalinkModernity: result.analyses.modernization.permalinkModernity,
          cdnUsage: result.analyses.modernization.cdnUsage,
          headlessReadiness: result.analyses.modernization.headlessReadiness,
        },
      },
    },
    topIssues: result.topIssues,
    rawData: {
      pages: result.pages.map((page) => ({
        path: page.path,
        url: page.url,
        status: page.httpResult.status,
        seo: {
          title: page.seoResult.title,
          metaDescription: page.seoResult.metaDescription,
          canonicalUrl: page.seoResult.canonicalUrl,
          h1Tags: page.seoResult.h1Tags,
        },
        performance: {
          htmlSizeBytes: page.performanceResult.htmlSizeBytes,
          numScripts: page.performanceResult.numScripts,
          numStylesheets: page.performanceResult.numStylesheets,
          imageFormats: page.performanceResult.imageFormats,
          cacheControl: page.performanceResult.cacheControlValue,
        },
        security: {
          isHttps: page.securityResult.isHttps,
          securityHeaders: page.securityResult.securityHeaders,
        },
      })),
    },
  };

  return JSON.stringify(jsonOutput, null, 2);
}
