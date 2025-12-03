/**
 * HTTP Collector - Fetches pages and returns HTTP metadata
 */

import { request } from "undici";
import type { HttpResult } from "../types.js";

export async function fetchPage(
  url: string,
  verbose = false,
  retries = 2
): Promise<HttpResult> {
  let lastError: Error | unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (verbose) {
        const retryMsg =
          attempt > 0 ? ` (Attempt ${attempt + 1}/${retries + 1})` : "";
        console.log(`Fetching: ${url}${retryMsg}`);
      }

      const { statusCode, headers, body } = await request(url, {
        method: "GET",
        maxRedirections: 5,
        headersTimeout: 30000,
        bodyTimeout: 30000,
      });

      // Convert headers to plain object
      const headerObj: Record<string, string> = {};
      for (const [key, value] of Object.entries(headers)) {
        if (typeof value === "string") {
          headerObj[key] = value;
        } else if (Array.isArray(value)) {
          headerObj[key] = value.join(", ");
        }
      }

      // Read body as text
      const bodyText = await body.text();

      // Get final URL (after redirects)
      const finalUrl = headerObj.location || url;

      return {
        url,
        status: statusCode,
        headers: headerObj,
        body: bodyText,
        finalUrl,
      };
    } catch (error) {
      lastError = error;
      const isLastAttempt = attempt === retries;

      if (verbose) {
        const msg = error instanceof Error ? error.message : String(error);
        console.warn(`Attempt ${attempt + 1} failed: ${msg}`);
      }

      if (!isLastAttempt) {
        // Exponential backoff: 1s, 2s, 4s...
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  const errorMessage =
    lastError instanceof Error ? lastError.message : "Unknown error";

  if (verbose) {
    console.error(
      `Failed to fetch ${url} after ${retries + 1} attempts: ${errorMessage}`
    );
  }

  return {
    url,
    status: 0,
    headers: {},
    body: "",
    finalUrl: url,
    error: errorMessage,
  };
}
