/**
 * SEO Collector - Extracts SEO-related data from HTML
 */

import * as cheerio from "cheerio";
import { fetchPage } from "./httpCollector.js";
import type { SeoResult } from "../types.js";

export async function collectSeoData(
  baseUrl: string,
  html: string,
  verbose = false
): Promise<SeoResult> {
  const $ = cheerio.load(html);

  // Extract title
  const title = $("title").first().text().trim() || undefined;

  // Extract meta description
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() || undefined;

  // Extract canonical URL
  const canonicalUrl =
    $('link[rel="canonical"]').attr("href")?.trim() || undefined;

  // Extract all H1 tags
  const h1Tags: string[] = [];
  $("h1").each((_, elem) => {
    const text = $(elem).text().trim();
    if (text) {
      h1Tags.push(text);
    }
  });

  // Check for robots.txt
  let hasRobotsTxt = false;
  try {
    const robotsUrl = new URL("/robots.txt", baseUrl).toString();
    const robotsResult = await fetchPage(robotsUrl, false);
    hasRobotsTxt = robotsResult.status === 200;
  } catch {
    hasRobotsTxt = false;
  }

  // Check for sitemap.xml
  let hasSitemap = false;
  try {
    const sitemapUrl = new URL("/sitemap.xml", baseUrl).toString();
    const sitemapResult = await fetchPage(sitemapUrl, false);
    hasSitemap = sitemapResult.status === 200;
  } catch {
    hasSitemap = false;
  }

  if (verbose) {
    console.log(
      `SEO Data: title=${!!title}, meta=${!!metaDescription}, h1s=${
        h1Tags.length
      }, robots=${hasRobotsTxt}, sitemap=${hasSitemap}`
    );
  }

  return {
    title,
    metaDescription,
    canonicalUrl,
    h1Tags,
    hasRobotsTxt,
    hasSitemap,
  };
}
