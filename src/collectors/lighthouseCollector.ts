/**
 * Lighthouse / PageSpeed Insights Collector (v0.4.0)
 * Fetches Core Web Vitals from Google PageSpeed Insights API
 */

import { request } from "undici";
import type { LighthouseData } from "../types.js";

const PAGESPEED_API_URL =
  "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

// Cache to avoid redundant API calls within the same run
const cache = new Map<string, LighthouseData>();

export interface PageSpeedOptions {
  apiKey: string;
  strategy?: "mobile" | "desktop";
  verbose?: boolean;
}

export async function collectLighthouseData(
  url: string,
  options: PageSpeedOptions
): Promise<LighthouseData | null> {
  const { apiKey, strategy = "mobile", verbose = false } = options;

  // Check cache first
  const cacheKey = `${url}-${strategy}`;
  if (cache.has(cacheKey)) {
    if (verbose) {
      console.log(`Using cached PageSpeed data for ${url} (${strategy})`);
    }
    return cache.get(cacheKey)!;
  }

  try {
    if (verbose) {
      console.log(`Fetching PageSpeed data for ${url} (${strategy})...`);
    }

    const apiUrl = new URL(PAGESPEED_API_URL);
    apiUrl.searchParams.set("url", url);
    apiUrl.searchParams.set("key", apiKey);
    apiUrl.searchParams.set("strategy", strategy);
    apiUrl.searchParams.set("category", "PERFORMANCE");

    const response = await request(apiUrl.toString(), {
      method: "GET",
      headersTimeout: 60000, // 60s timeout
      bodyTimeout: 60000,
    });

    if (response.statusCode !== 200) {
      // Handle error responses
      const body = await response.body.text();

      if (response.statusCode === 429) {
        console.warn(
          `⚠️  PageSpeed API rate limit exceeded. Skipping PageSpeed data.`
        );
        return null;
      }

      if (response.statusCode === 400) {
        const error = JSON.parse(body);
        console.warn(
          `⚠️  PageSpeed API error: ${
            error.error?.message || "Invalid request"
          }`
        );
        return null;
      }

      if (response.statusCode === 403) {
        console.warn(
          `⚠️  PageSpeed API key is invalid or doesn't have permission.`
        );
        return null;
      }

      throw new Error(`PageSpeed API returned status ${response.statusCode}`);
    }

    const body = await response.body.json();
    const data = body as any; // PageSpeed API response type

    // Extract Core Web Vitals from the response
    const lighthouseResult = data.lighthouseResult;
    if (!lighthouseResult || !lighthouseResult.audits) {
      console.warn(`⚠️  No Lighthouse data found in PageSpeed response`);
      return null;
    }

    const audits = lighthouseResult.audits;

    // Extract metrics (in milliseconds or scores)
    const lcp = audits["largest-contentful-paint"]?.numericValue || 0;
    const cls = audits["cumulative-layout-shift"]?.numericValue || 0;
    const ttfb = audits["server-response-time"]?.numericValue || 0;

    // INP is newer, might not always be available
    const inp =
      audits["interaction-to-next-paint"]?.numericValue ||
      audits["max-potential-fid"]?.numericValue ||
      0;

    // FID is only available from field data (not lab data)
    const fid =
      data.loadingExperience?.metrics?.FIRST_INPUT_DELAY_MS?.percentile;

    const performanceScore = lighthouseResult.categories?.performance?.score
      ? lighthouseResult.categories.performance.score * 100
      : 0;

    const lighthouseData: LighthouseData = {
      lcp,
      fid,
      cls,
      inp,
      ttfb,
      performanceScore,
      strategy,
      fetchedAt: new Date().toISOString(),
    };

    // Cache the result
    cache.set(cacheKey, lighthouseData);

    if (verbose) {
      console.log(
        `✅ PageSpeed data fetched: LCP=${lcp}ms, CLS=${cls.toFixed(
          3
        )}, INP=${inp}ms, TTFB=${ttfb}ms`
      );
    }

    return lighthouseData;
  } catch (error: any) {
    if (verbose) {
      console.error(`Error fetching PageSpeed data:`, error.message);
    }

    // Check for specific error types
    if (error.code === "ETIMEDOUT" || error.code === "ECONNRESET") {
      console.warn(
        `⚠️  PageSpeed API request timed out. Network may be slow or unstable.`
      );
    } else if (error.message?.includes("rate limit")) {
      console.warn(`⚠️  PageSpeed API rate limit hit.`);
    } else {
      console.warn(
        `⚠️  Could not fetch PageSpeed data: ${
          error.message || "Unknown error"
        }`
      );
    }

    return null;
  }
}

/**
 * Clear the cache (useful for testing)
 */
export function clearCache(): void {
  cache.clear();
}
