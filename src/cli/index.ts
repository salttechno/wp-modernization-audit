#!/usr/bin/env node

/**
 * CLI Entry Point for wp-modernization-audit
 */

import { Command } from "commander";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import chalk from "chalk";
import { fetchPage } from "../collectors/httpCollector";
import { detectWordPress } from "../collectors/wpDetector";
import { collectSeoData } from "../collectors/seoCollector";
import { collectPerformanceData } from "../collectors/performanceCollector";
import { collectSecurityData } from "../collectors/securityCollector";
import { collectModernizationData } from "../collectors/modernizationCollector";
import { collectLighthouseData } from "../collectors/lighthouseCollector";
import { analyzePerformance } from "../analyzers/performance";
import { analyzeSeo } from "../analyzers/seo";
import { analyzeSecurity } from "../analyzers/security";
import { analyzeModernization } from "../analyzers/modernization";
import { calculateScores } from "../scoring/scorer";
import { generateMarkdownReport } from "../report/markdown";
import { generateHtmlReport } from "../report/html";
import { generateJsonReport } from "../report/json";
import { fetchSitemap, selectTopPages } from "../collectors/sitemapCollector";
import type { AuditConfig, AuditResult, PageResult } from "../types";

const program = new Command();

program
  .name("wp-modernization-audit")
  .description("Audit a WordPress site and generate a modernization report")
  .version("0.4.0")
  .requiredOption("--url <url>", "Base URL of the website to audit")
  .option("--pages <pages...>", "List of paths to audit (relative to URL)", [
    "/",
  ])
  .option("--api-url <apiUrl>", "Override WordPress REST API root URL")
  .option("--format <format>", "Output format: md, html, json", "md")
  .option("--out <path>", "Output file path")
  .option(
    "--auto-pages",
    "Automatically discover pages from sitemap.xml",
    false
  )
  .option(
    "--max-pages <number>",
    "Maximum number of pages to audit (default: 10 with --auto-pages)",
    "10"
  )
  .option(
    "--ps-api-key <key>",
    "Google PageSpeed Insights API key (optional, enables Core Web Vitals)"
  )
  .option(
    "--ps-strategy <strategy>",
    "PageSpeed strategy: mobile, desktop, or both (default: mobile)",
    "mobile"
  )
  .option("--verbose", "Print additional debug information", false)
  .option("--no-color", "Disable ANSI colors in output");

program.parse();

const options = program.opts();

// Validate format
if (!["md", "html", "json"].includes(options.format)) {
  console.error(
    chalk.red(
      `Invalid format: ${options.format}. Must be one of: md, html, json`
    )
  );
  process.exit(1);
}

// Generate default output path with domain name if not provided
let outPath = options.out;
if (!outPath) {
  try {
    const urlObj = new URL(options.url);
    // Extract hostname and sanitize for filename (remove www., replace dots with hyphens)
    const domain = urlObj.hostname.replace(/^www\./, "").replace(/\./g, "-");
    const extension =
      options.format === "json"
        ? "json"
        : options.format === "html"
        ? "html"
        : "md";
    outPath = `./reports/wp-modernization-report-${domain}.${extension}`;
  } catch (error) {}
}

// Validate maxPages
const maxPages = parseInt(options.maxPages, 10);
if (isNaN(maxPages) || maxPages < 1) {
  console.error(chalk.red("--max-pages must be a positive integer"));
  process.exit(1);
}

// Get PageSpeed API key from CLI option or environment variable
const psApiKey = options.psApiKey || process.env.PAGESPEED_API_KEY;

// Validate ps-strategy
const psStrategy = options.psStrategy as "mobile" | "desktop" | "both";
if (!["mobile", "desktop", "both"].includes(psStrategy)) {
  console.error(
    chalk.red(
      `Invalid --ps-strategy: ${psStrategy}. Must be one of: mobile, desktop, both`
    )
  );
  process.exit(1);
}

// Create config (auto-pages discovery will happen inside runAudit)
const config: AuditConfig = {
  url: options.url,
  pages: options.pages,
  apiUrl: options.apiUrl,
  format: options.format as "md" | "html" | "json",
  outPath,
  verbose: options.verbose,
  autoPages: options.autoPages,
  maxPages,
  psApiKey,
  psStrategy,
};

runAudit(config).catch((error) => {
  console.error(chalk.red("Audit failed:"), error.message);
  if (config.verbose) {
    console.error(error);
  }
  process.exit(2);
});

async function runAudit(config: AuditConfig): Promise<void> {
  // Handle auto-pages discovery if enabled
  let pagesToAudit = config.pages;

  if (config.autoPages) {
    if (config.verbose) {
      console.log(
        chalk.blue("\n🔍 Auto-discovering pages from sitemap.xml...\n")
      );
    }

    const sitemapUrls = await fetchSitemap(config.url, config.verbose);

    if (sitemapUrls.length > 0) {
      const selectedUrls = selectTopPages(sitemapUrls, config.maxPages || 10);

      // Convert full URLs to paths relative to base URL
      pagesToAudit = selectedUrls.map((url) => {
        try {
          const urlObj = new URL(url);
          return urlObj.pathname + urlObj.search || "/";
        } catch {
          return "/";
        }
      });

      if (config.verbose) {
        console.log(chalk.green(`Found ${sitemapUrls.length} URLs in sitemap`));
        console.log(
          chalk.green(`Selected ${pagesToAudit.length} pages to audit\n`)
        );
      }
    } else {
      if (config.verbose) {
        console.log(
          chalk.yellow("No sitemap found, falling back to homepage\n")
        );
      }
      pagesToAudit = ["/"];
    }
  }

  console.log(chalk.blue.bold("\n🔍 WordPress Modernization Audit\n"));
  console.log(`Auditing: ${chalk.cyan(config.url)}`);
  console.log(`Pages: ${chalk.cyan(pagesToAudit.join(", "))}\n`);

  // Audit each page
  const pageResults: PageResult[] = [];

  for (const pagePath of pagesToAudit) {
    const pageUrl = new URL(pagePath, config.url).toString();

    if (config.verbose) {
      console.log(chalk.gray(`\nAuditing page: ${pageUrl}`));
    } else {
      console.log(chalk.gray(`Auditing: ${pagePath}`));
    }

    // Fetch the page
    const httpResult = await fetchPage(pageUrl, config.verbose);

    if (httpResult.error || httpResult.status !== 200) {
      console.warn(
        chalk.yellow(
          `⚠️  Warning: Could not fetch ${pagePath} (status: ${httpResult.status})`
        )
      );
      continue;
    }

    // Collect data
    const seoResult = await collectSeoData(
      config.url,
      httpResult.body,
      config.verbose
    );
    const performanceResult = collectPerformanceData(
      httpResult.body,
      httpResult.headers
    );
    const securityResult = collectSecurityData(
      pageUrl,
      httpResult.headers,
      httpResult.body
    );

    // Collect PageSpeed Insights data if API key is provided (v0.4.0)
    let lighthouseData = undefined;
    if (config.psApiKey) {
      // Only fetch PageSpeed data for homepage or first few pages to avoid rate limits
      const shouldFetchPageSpeed = pagePath === "/" || pageResults.length < 3; // Limit to 3 pages max

      if (shouldFetchPageSpeed) {
        lighthouseData = await collectLighthouseData(pageUrl, {
          apiKey: config.psApiKey,
          strategy: config.psStrategy === "both" ? "mobile" : config.psStrategy,
          verbose: config.verbose,
        });

        // If strategy is "both", also fetch desktop data
        // For now, we'll just use mobile. Desktop can be added later.
      }
    }

    pageResults.push({
      path: pagePath,
      url: pageUrl,
      httpResult,
      seoResult,
      performanceResult,
      securityResult,
      lighthouseData: lighthouseData || undefined,
    });
  }

  if (pageResults.length === 0) {
    console.error(chalk.red("\n❌ No pages could be successfully audited."));
    process.exit(2);
  }

  // Detect WordPress (using first successful page)
  const firstPage = pageResults[0];
  console.log(chalk.gray("\nDetecting WordPress..."));
  const wpDetection = await detectWordPress(
    config.url,
    firstPage.httpResult.body,
    config.verbose
  );

  if (!wpDetection.isWordPress) {
    console.warn(
      chalk.yellow("\n⚠️  Warning: Could not confirm this is a WordPress site.")
    );
    console.warn(
      chalk.yellow("The audit will continue, but results may be inaccurate.\n")
    );
  } else {
    console.log(chalk.green("✅ WordPress detected"));
    if (wpDetection.wpVersion) {
      console.log(chalk.gray(`   Version: ${wpDetection.wpVersion}`));
    }
    if (wpDetection.themeName) {
      console.log(chalk.gray(`   Theme: ${wpDetection.themeName}`));
    }
  }

  // Collect modernization data
  console.log(chalk.gray("\nChecking modernization features..."));
  const modernizationResult = await collectModernizationData(
    config.url,
    firstPage.httpResult.body,
    config.verbose
  );

  // Aggregate results across all pages with weighted averaging
  // Homepage (/) gets 2x weight for SEO metrics, other pages get 1x
  const isHomepage = (path: string) => path === "/" || path === "";

  // Aggregate Performance Data (average across all pages)
  const aggregatedPerf = {
    htmlSizeBytes: Math.round(
      pageResults.reduce(
        (sum, p) => sum + p.performanceResult.htmlSizeBytes,
        0
      ) / pageResults.length
    ),
    numScripts: Math.round(
      pageResults.reduce((sum, p) => sum + p.performanceResult.numScripts, 0) /
        pageResults.length
    ),
    numStylesheets: Math.round(
      pageResults.reduce(
        (sum, p) => sum + p.performanceResult.numStylesheets,
        0
      ) / pageResults.length
    ),
    blockingScripts: Math.round(
      pageResults.reduce(
        (sum, p) => sum + p.performanceResult.blockingScripts,
        0
      ) / pageResults.length
    ),
    blockingStylesheets: Math.round(
      pageResults.reduce(
        (sum, p) => sum + p.performanceResult.blockingStylesheets,
        0
      ) / pageResults.length
    ),
    imageFormats: {
      jpeg: Math.round(
        pageResults.reduce(
          (sum, p) => sum + p.performanceResult.imageFormats.jpeg,
          0
        ) / pageResults.length
      ),
      png: Math.round(
        pageResults.reduce(
          (sum, p) => sum + p.performanceResult.imageFormats.png,
          0
        ) / pageResults.length
      ),
      webp: Math.round(
        pageResults.reduce(
          (sum, p) => sum + p.performanceResult.imageFormats.webp,
          0
        ) / pageResults.length
      ),
      avif: Math.round(
        pageResults.reduce(
          (sum, p) => sum + p.performanceResult.imageFormats.avif,
          0
        ) / pageResults.length
      ),
      svg: Math.round(
        pageResults.reduce(
          (sum, p) => sum + p.performanceResult.imageFormats.svg,
          0
        ) / pageResults.length
      ),
      gif: Math.round(
        pageResults.reduce(
          (sum, p) => sum + p.performanceResult.imageFormats.gif,
          0
        ) / pageResults.length
      ),
    },
    hasCacheControl: pageResults.some(
      (p) => p.performanceResult.hasCacheControl
    ),
    cacheControlValue: pageResults.find(
      (p) => p.performanceResult.cacheControlValue
    )?.performanceResult.cacheControlValue,
  };

  // Aggregate SEO Data (weighted average - homepage gets 2x weight)
  const seoScores = pageResults.map((p) => ({
    page: p,
    weight: isHomepage(p.path) ? 2 : 1,
  }));

  const totalSeoWeight = seoScores.reduce((sum, s) => sum + s.weight, 0);

  // Count pages with good SEO elements (weighted)
  const pagesWithTitle = seoScores
    .filter((s) => s.page.seoResult.title)
    .reduce((sum, s) => sum + s.weight, 0);
  const pagesWithMeta = seoScores
    .filter((s) => s.page.seoResult.metaDescription)
    .reduce((sum, s) => sum + s.weight, 0);
  const pagesWithCanonical = seoScores
    .filter((s) => s.page.seoResult.canonicalUrl)
    .reduce((sum, s) => sum + s.weight, 0);
  const pagesWithGoodH1 = seoScores
    .filter((s) => s.page.seoResult.h1Tags.length === 1)
    .reduce((sum, s) => sum + s.weight, 0);

  const aggregatedSeo = {
    title: pagesWithTitle > 0 ? pageResults[0].seoResult.title : undefined, // Use first page's title for display
    metaDescription:
      pagesWithMeta > 0 ? pageResults[0].seoResult.metaDescription : undefined,
    canonicalUrl:
      pagesWithCanonical > 0
        ? pageResults[0].seoResult.canonicalUrl
        : undefined,
    h1Tags: pagesWithGoodH1 > 0 ? pageResults[0].seoResult.h1Tags : [],
    hasRobotsTxt: pageResults.some((p) => p.seoResult.hasRobotsTxt),
    hasSitemap: pageResults.some((p) => p.seoResult.hasSitemap),
    // Add aggregation metadata for analyzer
    _aggregation: {
      titleCoverage: pagesWithTitle / totalSeoWeight,
      metaCoverage: pagesWithMeta / totalSeoWeight,
      canonicalCoverage: pagesWithCanonical / totalSeoWeight,
      h1Coverage: pagesWithGoodH1 / totalSeoWeight,
      totalPages: pageResults.length,
    },
  };

  const aggregatedSecurity = firstPage.securityResult;

  // Get lighthouse data from homepage if available (v0.4.0)
  const lighthouseData =
    pageResults.find((p) => p.path === "/")?.lighthouseData ||
    firstPage.lighthouseData;

  // Run analyzers
  console.log(chalk.gray("\nAnalyzing results..."));
  const performanceAnalysis = analyzePerformance(
    aggregatedPerf,
    lighthouseData
  );
  const seoAnalysis = analyzeSeo(aggregatedSeo);
  const securityAnalysis = analyzeSecurity(aggregatedSecurity);
  const modernizationAnalysis = analyzeModernization(modernizationResult);

  // Calculate scores
  const scores = calculateScores(
    performanceAnalysis,
    seoAnalysis,
    securityAnalysis,
    modernizationAnalysis
  );

  // Collect top issues
  const topIssues: string[] = [];
  if (securityAnalysis.issues.length > 0) {
    topIssues.push(...securityAnalysis.issues.slice(0, 2));
  }
  if (performanceAnalysis.issues.length > 0) {
    topIssues.push(...performanceAnalysis.issues.slice(0, 2));
  }
  if (seoAnalysis.issues.length > 0) {
    topIssues.push(...seoAnalysis.issues.slice(0, 1));
  }
  if (modernizationAnalysis.issues.length > 0) {
    topIssues.push(...modernizationAnalysis.issues.slice(0, 1));
  }

  // Create final result
  const auditResult: AuditResult = {
    url: config.url,
    pages: pageResults,
    timestamp: new Date().toISOString(),
    wpDetection,
    scores,
    analyses: {
      performance: performanceAnalysis,
      seo: seoAnalysis,
      security: securityAnalysis,
      modernization: modernizationAnalysis,
    },
    topIssues: topIssues.slice(0, 5),
  };

  // Print summary
  console.log(chalk.blue.bold("\n📊 Audit Complete!\n"));
  console.log(`Overall Score: ${chalk.bold(scores.overall.toString())}/100`);
  console.log(
    `Rating: ${chalk.bold(
      getRatingColor(scores.rating)(scores.rating.replace(/-/g, " "))
    )}\n`
  );
  console.log("Category Scores:");
  console.log(`  Performance:      ${scores.performance}/30`);
  console.log(`  SEO:              ${scores.seo}/25`);
  console.log(`  Security:         ${scores.security}/25`);
  console.log(`  Modernization:    ${scores.modernization}/20\n`);

  // Generate report
  console.log(chalk.gray("Generating report..."));

  let reportContent: string;
  switch (config.format) {
    case "md":
      reportContent = generateMarkdownReport(auditResult);
      break;
    case "html":
      reportContent = generateHtmlReport(auditResult);
      break;
    case "json":
      reportContent = generateJsonReport(auditResult);
      break;
    default:
      reportContent = generateMarkdownReport(auditResult);
  }

  // Ensure output directory exists
  const outDir = path.dirname(config.outPath);
  try {
    await mkdir(outDir, { recursive: true });
  } catch (error) {
    // Ignore error if directory already exists
  }

  // Write report to file
  await writeFile(config.outPath, reportContent, "utf-8");
  console.log(
    chalk.green(`\n✅ Report saved to: ${chalk.bold(config.outPath)}\n`)
  );

  process.exit(0);
}

function getRatingColor(rating: string): typeof chalk {
  switch (rating) {
    case "healthy":
      return chalk.green;
    case "needs-optimization":
      return chalk.yellow;
    case "needs-modernization":
      return chalk.hex("#FFA500");
    case "legacy":
      return chalk.red;
    default:
      return chalk.white;
  }
}
