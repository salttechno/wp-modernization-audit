/**
 * Performance Collector - Gathers performance-related metrics from HTML
 */

import * as cheerio from "cheerio";
import type { PerformanceResult } from "../types.js";

export function collectPerformanceData(
  html: string,
  headers: Record<string, string>
): PerformanceResult {
  const $ = cheerio.load(html);

  // Calculate HTML size in bytes
  const htmlSizeBytes = Buffer.byteLength(html, "utf8");

  // Count scripts
  let numScripts = 0;
  let blockingScripts = 0;
  $("script").each((_, elem) => {
    numScripts++;
    const src = $(elem).attr("src");
    const async = $(elem).attr("async");
    const defer = $(elem).attr("defer");

    // Scripts in head without async/defer are blocking
    if ($(elem).closest("head").length > 0 && !async && !defer && src) {
      blockingScripts++;
    }
  });

  // Count stylesheets
  let numStylesheets = 0;
  let blockingStylesheets = 0;
  $('link[rel="stylesheet"]').each((_, elem) => {
    numStylesheets++;
    // All stylesheets in head are potentially blocking
    if ($(elem).closest("head").length > 0) {
      blockingStylesheets++;
    }
  });

  // Analyze image formats
  const imageFormats = {
    jpeg: 0,
    png: 0,
    webp: 0,
    avif: 0,
    svg: 0,
    gif: 0,
  };

  $("img").each((_, elem) => {
    const src = $(elem).attr("src") || "";
    const srcset = $(elem).attr("srcset") || "";
    const allSrcs = src + " " + srcset;

    if (/\.jpe?g/i.test(allSrcs)) imageFormats.jpeg++;
    if (/\.png/i.test(allSrcs)) imageFormats.png++;
    if (/\.webp/i.test(allSrcs)) imageFormats.webp++;
    if (/\.avif/i.test(allSrcs)) imageFormats.avif++;
    if (/\.svg/i.test(allSrcs)) imageFormats.svg++;
    if (/\.gif/i.test(allSrcs)) imageFormats.gif++;
  });

  // Check for cache-control header
  const cacheControlValue = headers["cache-control"];
  const hasCacheControl =
    !!cacheControlValue && !cacheControlValue.includes("no-store");

  return {
    htmlSizeBytes,
    numScripts,
    numStylesheets,
    blockingScripts,
    blockingStylesheets,
    imageFormats,
    hasCacheControl,
    cacheControlValue,
  };
}
