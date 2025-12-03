/**
 * Markdown Report Generator - Creates human-readable audit reports
 */

import type { AuditResult } from "../types.js";

export function generateMarkdownReport(result: AuditResult): string {
  const sections: string[] = [];

  // Header
  sections.push("# WordPress Modernization Audit Report\n");
  sections.push(`**Site:** ${result.url}`);
  sections.push(
    `**Generated:** ${new Date(result.timestamp).toLocaleString()}`
  );
  sections.push(`**Pages Audited:** ${result.pages.length}\n`);

  // Executive Summary
  sections.push("---\n");
  sections.push("## Executive Summary\n");
  sections.push(
    `### Overall Modernization Score: ${result.scores.overall}/100\n`
  );
  sections.push(
    getRatingEmoji(result.scores.rating) +
      " **" +
      getRatingLabel(result.scores.rating) +
      "**\n"
  );

  if (result.wpDetection.isWordPress) {
    sections.push("✅ WordPress site detected");
    if (result.wpDetection.wpVersion) {
      sections.push(` (Version: ${result.wpDetection.wpVersion})`);
    }
    if (result.wpDetection.themeName) {
      sections.push(`\n**Theme:** ${result.wpDetection.themeName}`);
    }
    if (result.wpDetection.plugins.length > 0) {
      sections.push(
        `\n**Plugins detected:** ${result.wpDetection.plugins
          .slice(0, 5)
          .join(", ")}${result.wpDetection.plugins.length > 5 ? "..." : ""}`
      );
    }
  } else {
    sections.push(
      "⚠️  **Warning:** Could not confirm this is a WordPress site"
    );
  }
  sections.push("\n");

  // Category Scores
  sections.push("### Category Breakdown\n");
  sections.push("| Category | Score | Status |");
  sections.push("|----------|-------|--------|");
  sections.push(
    `| Performance | ${result.scores.performance}/30 | ${getScoreStatus(
      result.scores.performance,
      30
    )} |`
  );
  sections.push(
    `| SEO Foundations | ${result.scores.seo}/25 | ${getScoreStatus(
      result.scores.seo,
      25
    )} |`
  );
  sections.push(
    `| WordPress Health & Security | ${
      result.scores.security
    }/25 | ${getScoreStatus(result.scores.security, 25)} |`
  );
  sections.push(
    `| Modernization Readiness | ${
      result.scores.modernization
    }/20 | ${getScoreStatus(result.scores.modernization, 20)} |`
  );
  sections.push("");

  // Top Issues
  if (result.topIssues.length > 0) {
    sections.push("### 🚨 Top Issues to Address\n");
    result.topIssues.forEach((issue, idx) => {
      sections.push(`${idx + 1}. ${issue}`);
    });
    sections.push("");
  }

  // Performance Section
  sections.push("---\n");
  sections.push(`## 1. Performance (${result.scores.performance}/30)\n`);
  sections.push(
    `**Assessment:** ${getPerformanceAssessment(result.analyses.performance)}\n`
  );

  if (result.analyses.performance.issues.length > 0) {
    sections.push("**Issues Found:**\n");
    result.analyses.performance.issues.forEach((issue) => {
      sections.push(`- ⚠️  ${issue}`);
    });
    sections.push("");
  }

  if (result.analyses.performance.recommendations.length > 0) {
    sections.push("**Recommendations:**\n");
    result.analyses.performance.recommendations.forEach((rec) => {
      sections.push(`- 💡 ${rec}`);
    });
    sections.push("");
  }

  // SEO Section
  sections.push("---\n");
  sections.push(`## 2. SEO Foundations (${result.scores.seo}/25)\n`);
  sections.push(`**Assessment:** ${getSeoAssessment(result.analyses.seo)}\n`);

  if (result.analyses.seo.issues.length > 0) {
    sections.push("**Issues Found:**\n");
    result.analyses.seo.issues.forEach((issue) => {
      sections.push(`- ⚠️  ${issue}`);
    });
    sections.push("");
  }

  if (result.analyses.seo.recommendations.length > 0) {
    sections.push("**Recommendations:**\n");
    result.analyses.seo.recommendations.forEach((rec) => {
      sections.push(`- 💡 ${rec}`);
    });
    sections.push("");
  }

  // Security Section
  sections.push("---\n");
  sections.push(
    `## 3. WordPress Health & Security (${result.scores.security}/25)\n`
  );
  sections.push(
    `**Security Posture:** ${result.analyses.security.overallPosture.toUpperCase()}\n`
  );

  if (result.analyses.security.issues.length > 0) {
    sections.push("**Issues Found:**\n");
    result.analyses.security.issues.forEach((issue) => {
      sections.push(`- 🔒 ${issue}`);
    });
    sections.push("");
  }

  if (result.analyses.security.recommendations.length > 0) {
    sections.push("**Recommendations:**\n");
    result.analyses.security.recommendations.forEach((rec) => {
      sections.push(`- 💡 ${rec}`);
    });
    sections.push("");
  }

  // Modernization Section
  sections.push("---\n");
  sections.push(
    `## 4. Modernization Readiness (${result.scores.modernization}/20)\n`
  );
  sections.push(
    `**Headless Readiness:** ${result.analyses.modernization.headlessReadiness.toUpperCase()}\n`
  );

  if (result.analyses.modernization.issues.length > 0) {
    sections.push("**Issues Found:**\n");
    result.analyses.modernization.issues.forEach((issue) => {
      sections.push(`- ⚠️  ${issue}`);
    });
    sections.push("");
  }

  if (result.analyses.modernization.recommendations.length > 0) {
    sections.push("**Recommendations:**\n");
    result.analyses.modernization.recommendations.forEach((rec) => {
      sections.push(`- 💡 ${rec}`);
    });
    sections.push("");
  }

  // Final Recommendations
  sections.push("---\n");
  sections.push("## Next Steps\n");
  sections.push(getNextSteps(result.scores.rating));

  // Footer
  sections.push("\n---\n");
  sections.push(
    "*Generated by [wp-modernization-audit](https://github.com/salttechno/wp-modernization-audit)*"
  );

  return sections.join("\n");
}

// Helper functions

function getRatingEmoji(rating: string): string {
  switch (rating) {
    case "healthy":
      return "✅";
    case "needs-optimization":
      return "⚠️ ";
    case "needs-modernization":
      return "🔧";
    case "legacy":
      return "🚨";
    default:
      return "";
  }
}

function getRatingLabel(rating: string): string {
  switch (rating) {
    case "healthy":
      return "Healthy - Room for Targeted Improvements";
    case "needs-optimization":
      return "Needs Optimization";
    case "needs-modernization":
      return "Modernization Recommended";
    case "legacy":
      return "Legacy - Modernization Strongly Recommended";
    default:
      return rating;
  }
}

function getScoreStatus(score: number, maxScore: number): string {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 80) return "✅ Good";
  if (percentage >= 60) return "⚠️  Needs Work";
  return "🚨 Critical";
}

function getPerformanceAssessment(analysis: any): string {
  const assessments = [];
  if (
    analysis.htmlSizeCategory === "excellent" ||
    analysis.htmlSizeCategory === "good"
  ) {
    assessments.push("Good HTML size");
  }
  if (
    analysis.scriptLoadCategory === "excellent" ||
    analysis.scriptLoadCategory === "good"
  ) {
    assessments.push("Reasonable script load");
  }
  if (analysis.imageOptimization === "excellent") {
    assessments.push("Modern image formats");
  }
  if (analysis.caching === "excellent") {
    assessments.push("Caching enabled");
  }

  return assessments.length > 0
    ? assessments.join(", ")
    : "Performance needs improvement";
}

function getSeoAssessment(analysis: any): string {
  const good = [];
  if (analysis.titleQuality === "excellent") good.push("titles");
  if (analysis.metaDescriptionQuality === "excellent")
    good.push("meta descriptions");
  if (analysis.h1Quality === "excellent") good.push("heading structure");
  if (analysis.hasCanonical) good.push("canonical tags");

  return good.length > 0
    ? `Strong foundation with ${good.join(", ")}`
    : "SEO fundamentals need attention";
}

function getNextSteps(rating: string): string {
  switch (rating) {
    case "healthy":
      return `Your WordPress site is in good shape! Focus on:
- Continue monitoring and optimizing performance
- Keep WordPress core and plugins updated
- Consider implementing a headless architecture for enhanced scalability

This site is well-maintained and ready for targeted enhancements.`;

    case "needs-optimization":
      return `Your site has a solid foundation but needs optimization:
- Address the critical issues identified above
- Implement recommended security headers
- Optimize images and reduce JavaScript payload
- Consider modernization for long-term performance gains

With focused improvements, this site can achieve excellent scores.`;

    case "needs-modernization":
      return `Your site shows significant opportunities for modernization:
- Address security vulnerabilities immediately
- Enable and configure WordPress REST API
- Migrate to pretty permalinks
- Implement CDN for static assets
- Consider a phased migration to a modern architecture (Next.js + headless CMS)

This site would benefit greatly from strategic modernization.`;

    case "legacy":
      return `Your site is in a legacy state and strongly needs modernization:
- **URGENT:** Migrate to HTTPS if not already done
- Implement critical security headers
- Enable WordPress REST API
- Update WordPress core and plugins
- Plan a comprehensive modernization strategy

We strongly recommend consulting with a web development team to plan a migration to a modern stack.`;

    default:
      return "Review the recommendations above and prioritize based on your business needs.";
  }
}
