/**
 * WordPress Detector - Detects WordPress and extracts version/theme/plugin info
 */

import * as cheerio from "cheerio";
import { fetchPage } from "./httpCollector.js";
import type { WpDetectionResult } from "../types.js";

export async function detectWordPress(
  baseUrl: string,
  html: string,
  verbose = false
): Promise<WpDetectionResult> {
  const $ = cheerio.load(html);
  const detectionMethods: string[] = [];
  let wpVersion: string | undefined;
  let themeName: string | undefined;
  const plugins = new Set<string>();

  // Method 1: Check meta generator tag
  const generator = $('meta[name="generator"]').attr("content");
  if (generator && generator.toLowerCase().includes("wordpress")) {
    detectionMethods.push("meta-generator");
    const versionMatch = generator.match(/WordPress\s+([\d.]+)/i);
    if (versionMatch) {
      wpVersion = versionMatch[1];
    }
  }

  // Method 2: Check for wp-content and wp-includes in HTML
  if (html.includes("/wp-content/") || html.includes("/wp-includes/")) {
    detectionMethods.push("wp-paths");
  }

  // Method 3: Extract theme from stylesheet links
  $('link[rel="stylesheet"]').each((_, elem) => {
    const href = $(elem).attr("href");
    if (href) {
      const themeMatch = href.match(/\/wp-content\/themes\/([^/]+)\//);
      if (themeMatch && !themeName) {
        themeName = themeMatch[1];
        detectionMethods.push("theme-detection");
      }
    }
  });

  // Method 4: Extract plugins from script/link URLs
  $("script[src], link[href]").each((_, elem) => {
    const src = $(elem).attr("src") || $(elem).attr("href");
    if (src) {
      const pluginMatch = src.match(/\/wp-content\/plugins\/([^/]+)\//);
      if (pluginMatch) {
        plugins.add(pluginMatch[1]);
      }
    }
  });

  // Method 5: Try wp-json endpoint
  try {
    const wpJsonUrl = new URL("/wp-json/", baseUrl).toString();
    const wpJsonResult = await fetchPage(wpJsonUrl, verbose);

    if (wpJsonResult.status === 200 && wpJsonResult.body) {
      try {
        const jsonData = JSON.parse(wpJsonResult.body);
        if (jsonData.namespaces || jsonData.routes) {
          detectionMethods.push("rest-api");
        }
        // Try to get version from REST API namespace
        if (jsonData.namespaces && Array.isArray(jsonData.namespaces)) {
          const wpNamespace = jsonData.namespaces.find((ns: string) =>
            ns.startsWith("wp/v")
          );
          if (wpNamespace && !wpVersion) {
            // This doesn't give us exact version, but confirms WP
            detectionMethods.push("rest-api-namespace");
          }
        }
      } catch {
        // JSON parse failed, not a valid API response
      }
    }
  } catch {
    // wp-json endpoint not accessible
  }

  const isWordPress = detectionMethods.length > 0;

  if (verbose && isWordPress) {
    console.log(`WordPress detected via: ${detectionMethods.join(", ")}`);
    if (wpVersion) console.log(`Version: ${wpVersion}`);
    if (themeName) console.log(`Theme: ${themeName}`);
    if (plugins.size > 0)
      console.log(`Plugins found: ${Array.from(plugins).join(", ")}`);
  }

  return {
    isWordPress,
    wpVersion,
    themeName,
    plugins: Array.from(plugins),
    detectionMethods,
  };
}
