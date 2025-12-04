/**
 * Sitemap Collector - Fetches and parses sitemap.xml files
 */

import { XMLParser } from "fast-xml-parser";
import { fetchPage } from "./httpCollector.js";

export interface SitemapUrl {
  loc: string;
  priority?: number;
  lastmod?: string;
  changefreq?: string;
}

const COMMON_SITEMAP_PATHS = [
  "/sitemap_index.xml",
  "/sitemap.xml",
  "/wp-sitemap.xml",
  "/sitemap-index.xml",
];

/**
 * Fetch and parse sitemap.xml from a WordPress site
 */
export async function fetchSitemap(
  baseUrl: string,
  verbose = false
): Promise<SitemapUrl[]> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
  });

  // Try common sitemap locations
  for (const sitemapPath of COMMON_SITEMAP_PATHS) {
    const sitemapUrl = new URL(sitemapPath, baseUrl).toString();

    if (verbose) {
      console.log(`Looking for sitemap at: ${sitemapUrl}`);
    }

    const result = await fetchPage(sitemapUrl, false);

    if (result.status === 200 && result.body) {
      try {
        const parsed = parser.parse(result.body);

        // Check if this is a sitemap index
        if (parsed.sitemapindex) {
          if (verbose) {
            console.log("Found sitemap index, fetching nested sitemaps...");
          }
          return await parseSitemapIndex(parsed.sitemapindex, verbose, parser);
        }

        // Regular sitemap
        if (parsed.urlset) {
          if (verbose) {
            console.log(`Found sitemap with URLs`);
          }
          return parseSitemapUrlset(parsed.urlset);
        }
      } catch (error) {
        if (verbose) {
          console.warn(`Failed to parse sitemap at ${sitemapUrl}:`, error);
        }
        continue;
      }
    }
  }

  if (verbose) {
    console.log("No sitemap found at common locations");
  }

  return [];
}

/**
 * Parse a sitemap index and fetch nested sitemaps
 */
async function parseSitemapIndex(
  sitemapindex: any,
  verbose: boolean,
  parser: XMLParser
): Promise<SitemapUrl[]> {
  const allUrls: SitemapUrl[] = [];
  const sitemaps = Array.isArray(sitemapindex.sitemap)
    ? sitemapindex.sitemap
    : [sitemapindex.sitemap];

  // Fetch up to 5 nested sitemaps (to avoid excessive requests)
  const limit = Math.min(sitemaps.length, 5);

  for (let i = 0; i < limit; i++) {
    const sitemap = sitemaps[i];
    const loc = sitemap.loc;

    if (loc) {
      if (verbose) {
        console.log(`Fetching nested sitemap: ${loc}`);
      }

      const result = await fetchPage(loc, false);

      if (result.status === 200 && result.body) {
        try {
          const parsed = parser.parse(result.body);
          if (parsed.urlset) {
            const urls = parseSitemapUrlset(parsed.urlset);
            allUrls.push(...urls);
          }
        } catch (error) {
          if (verbose) {
            console.warn(`Failed to parse nested sitemap ${loc}:`, error);
          }
        }
      }
    }
  }

  return allUrls;
}

/**
 * Parse a urlset from sitemap XML
 */
function parseSitemapUrlset(urlset: any): SitemapUrl[] {
  if (!urlset.url) {
    return [];
  }

  const urls = Array.isArray(urlset.url) ? urlset.url : [urlset.url];

  return urls
    .map((url: any): SitemapUrl | null => {
      const loc = url.loc;
      if (!loc || typeof loc !== "string") {
        return null;
      }

      // Filter out non-HTML URLs (images, videos, etc.)
      if (loc.match(/\.(jpg|jpeg|png|gif|svg|webp|mp4|avi|mov|pdf|zip)$/i)) {
        return null;
      }

      return {
        loc,
        priority: url.priority ? parseFloat(url.priority) : undefined,
        lastmod: url.lastmod || undefined,
        changefreq: url.changefreq || undefined,
      };
    })
    .filter((url: SitemapUrl | null): url is SitemapUrl => url !== null);
}

/**
 * Select top N pages from sitemap based on priority and freshness
 */
export function selectTopPages(urls: SitemapUrl[], maxPages: number): string[] {
  // Sort by priority (highest first), then by lastmod (most recent first)
  const sorted = [...urls].sort((a, b) => {
    // Priority comparison (higher is better)
    const priorityA = a.priority ?? 0.5;
    const priorityB = b.priority ?? 0.5;

    if (priorityA !== priorityB) {
      return priorityB - priorityA;
    }

    // If priorities are equal, sort by lastmod (most recent first)
    if (a.lastmod && b.lastmod) {
      return new Date(b.lastmod).getTime() - new Date(a.lastmod).getTime();
    }

    return 0;
  });

  // Prefer homepage first
  const homepageUrl = sorted.find((url) => {
    try {
      const urlObj = new URL(url.loc);
      return urlObj.pathname === "/" || urlObj.pathname === "";
    } catch {
      return false;
    }
  });

  const selected: string[] = [];

  if (homepageUrl) {
    selected.push(homepageUrl.loc);
  }

  // Add remaining pages
  for (const url of sorted) {
    if (selected.length >= maxPages) {
      break;
    }

    if (url.loc !== homepageUrl?.loc) {
      selected.push(url.loc);
    }
  }

  return selected;
}
