/**
 * SEO Analyzer - Evaluates SEO fundamentals and provides recommendations
 */

import type { SeoResult, SeoAnalysis } from "../types.js";

export function analyzeSeo(seoData: SeoResult): SeoAnalysis {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Analyze title
  let titleQuality: SeoAnalysis["titleQuality"];
  if (!seoData.title) {
    titleQuality = "missing";
    issues.push("Page title is missing");
    recommendations.push(
      "Add a descriptive, keyword-rich title tag to every page"
    );
  } else if (seoData.title.length < 30 || seoData.title.length > 60) {
    titleQuality = "good";
    if (seoData.title.length < 30) {
      recommendations.push(
        "Title is short - consider adding more descriptive keywords (aim for 50-60 characters)"
      );
    } else {
      recommendations.push(
        "Title is long and may be truncated in search results (aim for 50-60 characters)"
      );
    }
  } else {
    titleQuality = "excellent";
  }

  // Analyze meta description
  let metaDescriptionQuality: SeoAnalysis["metaDescriptionQuality"];
  if (!seoData.metaDescription) {
    metaDescriptionQuality = "missing";
    issues.push("Meta description is missing");
    recommendations.push(
      "Add unique meta descriptions to improve click-through rates (aim for 150-160 characters)"
    );
  } else if (
    seoData.metaDescription.length < 120 ||
    seoData.metaDescription.length > 160
  ) {
    metaDescriptionQuality = "good";
    if (seoData.metaDescription.length < 120) {
      recommendations.push("Meta description could be more detailed");
    } else {
      recommendations.push(
        "Meta description may be truncated (keep under 160 characters)"
      );
    }
  } else {
    metaDescriptionQuality = "excellent";
  }

  // Analyze H1
  let h1Quality: SeoAnalysis["h1Quality"];
  if (seoData.h1Tags.length === 0) {
    h1Quality = "missing";
    issues.push("No H1 heading found");
    recommendations.push(
      "Add exactly one H1 heading per page for better structure"
    );
  } else if (seoData.h1Tags.length > 1) {
    h1Quality = "issues";
    issues.push(`Multiple H1 tags found (${seoData.h1Tags.length})`);
    recommendations.push("Use only one H1 per page; use H2-H6 for subheadings");
  } else {
    h1Quality = "excellent";
  }

  // Check canonical
  const hasCanonical = !!seoData.canonicalUrl;
  if (!hasCanonical) {
    recommendations.push(
      "Add canonical tags to prevent duplicate content issues"
    );
  }

  // Check robots.txt
  if (!seoData.hasRobotsTxt) {
    issues.push("No robots.txt file found");
    recommendations.push("Create robots.txt to guide search engine crawlers");
  }

  // Check sitemap
  if (!seoData.hasSitemap) {
    issues.push("No sitemap.xml found");
    recommendations.push(
      "Generate and submit an XML sitemap to search engines"
    );
  }

  return {
    titleQuality,
    metaDescriptionQuality,
    h1Quality,
    hasCanonical,
    hasRobotsTxt: seoData.hasRobotsTxt,
    hasSitemap: seoData.hasSitemap,
    issues,
    recommendations,
  };
}
