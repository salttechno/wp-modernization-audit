/**
 * HTTP Collector - Fetches pages and returns HTTP metadata
 */

import { request } from "undici";
import type { HttpResult } from "../types.js";

export async function fetchPage(
  url: string,
  verbose = false
): Promise<HttpResult> {
  try {
    if (verbose) {
      console.log(`Fetching: ${url}`);
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
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    if (verbose) {
      console.error(`Failed to fetch ${url}: ${errorMessage}`);
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
}
