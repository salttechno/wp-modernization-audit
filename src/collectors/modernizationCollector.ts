/**
 * Modernization Collector - Checks REST API availability and modern features
 */

import { fetchPage } from "./httpCollector.js";
import type { ModernizationResult } from "../types.js";

export async function collectModernizationData(
  baseUrl: string,
  html: string,
  verbose = false
): Promise<ModernizationResult> {
  let hasRestApi = false;
  let hasPostsEndpoint = false;
  let hasPagesEndpoint = false;

  // Check wp-json root endpoint
  try {
    const wpJsonUrl = new URL("/wp-json/", baseUrl).toString();
    const wpJsonResult = await fetchPage(wpJsonUrl, verbose);

    if (wpJsonResult.status === 200) {
      try {
        const jsonData = JSON.parse(wpJsonResult.body);
        if (jsonData.namespaces || jsonData.routes) {
          hasRestApi = true;
        }
      } catch {
        // Not valid JSON
      }
    }
  } catch {
    // REST API not available
  }

  // Check posts endpoint
  try {
    const postsUrl = new URL("/wp-json/wp/v2/posts", baseUrl).toString();
    const postsResult = await fetchPage(postsUrl, false);
    hasPostsEndpoint = postsResult.status === 200;
  } catch {
    hasPostsEndpoint = false;
  }

  // Check pages endpoint
  try {
    const pagesUrl = new URL("/wp-json/wp/v2/pages", baseUrl).toString();
    const pagesResult = await fetchPage(pagesUrl, false);
    hasPagesEndpoint = pagesResult.status === 200;
  } catch {
    hasPagesEndpoint = false;
  }

  // Check for pretty permalinks vs query strings
  // Look for patterns like ?p=123, ?page_id=456
  const hasQueryParams = /\?(p|page_id|cat)=\d+/.test(html);
  const hasPrettyUrls =
    /href="https?:\/\/[^"]+\/[^"?]+\/?"/i.test(html) && !html.includes("?p=");
  const hasPrettyPermalinks = hasPrettyUrls && !hasQueryParams;

  // Detect CDN usage by checking if assets are served from different domains
  const cdnDomains = new Set<string>();
  const mainDomain = new URL(baseUrl).hostname;

  // Extract all src and href attributes
  const srcMatches = html.match(/(?:src|href)="(https?:\/\/[^"]+)"/gi) || [];

  for (const match of srcMatches) {
    const urlMatch = match.match(/https?:\/\/([^/"]+)/);
    if (urlMatch) {
      const domain = urlMatch[1];
      // Check if it's a CDN (different domain, or common CDN pattern)
      if (
        domain !== mainDomain &&
        (domain.includes("cdn") ||
          domain.includes("cloudfront") ||
          domain.includes("cloudflare") ||
          domain.includes("fastly") ||
          domain.includes("akamai"))
      ) {
        cdnDomains.add(domain);
      }
    }
  }

  const usesCdn = cdnDomains.size > 0;

  if (verbose) {
    console.log(
      `Modernization: REST=${hasRestApi}, Posts=${hasPostsEndpoint}, Pages=${hasPagesEndpoint}, Pretty=${hasPrettyPermalinks}, CDN=${usesCdn}`
    );
  }

  return {
    hasRestApi,
    hasPostsEndpoint,
    hasPagesEndpoint,
    hasPrettyPermalinks,
    usesCdn,
    cdnDomains: Array.from(cdnDomains),
  };
}
