#!/usr/bin/env node

/**
 * CLI Entry Point for wp-modernization-audit
 */

import { Command } from "commander";
import { writeFile } from "fs/promises";
import chalk from "chalk";
import { fetchPage } from "../collectors/httpCollector";
import { detectWordPress } from "../collectors/wpDetector";
import { collectSeoData } from "../collectors/seoCollector";
import { collectPerformanceData } from "../collectors/performanceCollector";
import { collectSecurityData } from "../collectors/securityCollector";
import { collectModernizationData } from "../collectors/modernizationCollector";
import { analyzePerformance } from "../analyzers/performance";
import { analyzeSeo } from "../analyzers/seo";
import { analyzeSecurity } from "../analyzers/security";
import { analyzeModernization } from "../analyzers/modernization";
import { calculateScores } from "../scoring/scorer";
import { generateMarkdownReport } from "../report/markdown";
import { generateHtmlReport } from "../report/html";
import { generateJsonReport } from "../report/json";
import type { AuditConfig, AuditResult, PageResult } from "../types";

const program = new Command();

program
  .name("wp-modernization-audit")
  .description("Audit a WordPress site and generate a modernization report")
  .version("0.1.0")
  .requiredOption("--url <url>", "Base URL of the website to audit")
  .option("--pages <pages...>", "List of paths to audit (relative to URL)", [
    "/",
  ])
  .option("--api-url <apiUrl>", "Override WordPress REST API root URL")
  .option("--format <format>", "Output format: md, html, json", "md")
  .option("--out <path>", "Output file path")
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
    outPath = `./wp-modernization-report-${domain}.${extension}`;
  } catch (error) {
    // Fallback if URL parsing fails
    outPath = "./wp-modernization-report.md";
  }
}

// Create config
const config: AuditConfig = {
  url: options.url,
  pages: options.pages,
  apiUrl: options.apiUrl,
  format: options.format as "md" | "html" | "json",
  outPath,
  verbose: options.verbose,
};

// Run the audit
runAudit(config).catch((error) => {
  console.error(chalk.red("Audit failed:"), error.message);
  if (config.verbose) {
    console.error(error);
  }
  process.exit(2);
});

async function runAudit(config: AuditConfig): Promise<void> {
  console.log(chalk.blue.bold("\n🔍 WordPress Modernization Audit\n"));
  console.log(`Auditing: ${chalk.cyan(config.url)}`);
  console.log(`Pages: ${chalk.cyan(config.pages.join(", "))}\n`);

  // Audit each page
  const pageResults: PageResult[] = [];

  for (const pagePath of config.pages) {
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

    pageResults.push({
      path: pagePath,
      url: pageUrl,
      httpResult,
      seoResult,
      performanceResult,
      securityResult,
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

  // Aggregate results across pages (for MVP, we'll use the first page as representative)
  // In future versions, this could be more sophisticated
  const aggregatedPerf = firstPage.performanceResult;
  const aggregatedSeo = firstPage.seoResult;
  const aggregatedSec = firstPage.securityResult;

  // Run analyzers
  console.log(chalk.gray("\nAnalyzing results..."));
  const performanceAnalysis = analyzePerformance(aggregatedPerf);
  const seoAnalysis = analyzeSeo(aggregatedSeo);
  const securityAnalysis = analyzeSecurity(aggregatedSec);
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
