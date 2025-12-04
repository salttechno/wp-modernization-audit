#!/usr/bin/env node

/**
 * Score Comparison Tool
 * Analyzes and compares audit results from multiple test runs
 */

import { readFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface ScoreData {
  testName: string;
  pageCount: number;
  overall: number;
  performance: number;
  seo: number;
  security: number;
  modernization: number;
  rating: string;
}

async function extractScores(
  filePath: string,
  testName: string
): Promise<ScoreData | null> {
  try {
    const content = await readFile(filePath, "utf-8");

    // Extract scores using regex
    const overallMatch = content.match(/Overall Score[:\s]+(\d+)\/100/i);
    const perfMatch = content.match(/Performance[:\s]+(\d+)\s*\/\s*30/i);
    const seoMatch = content.match(/SEO[:\s]+(\d+)\s*\/\s*25/i);
    const secMatch = content.match(/Security[:\s]+(\d+)\s*\/\s*25/i);
    const modMatch = content.match(/Modernization[:\s]+(\d+)\s*\/\s*20/i);
    const ratingMatch = content.match(/Rating[:\s]+([a-z-]+)/i);

    // Count pages audited
    const pagesMatch = content.match(/Pages audited[:\s]+(\d+)/i);
    const pageCount = pagesMatch ? parseInt(pagesMatch[1], 10) : 1;

    if (!overallMatch || !perfMatch || !seoMatch || !secMatch || !modMatch) {
      console.error(`Could not extract all scores from ${filePath}`);
      return null;
    }

    return {
      testName,
      pageCount,
      overall: parseInt(overallMatch[1], 10),
      performance: parseInt(perfMatch[1], 10),
      seo: parseInt(seoMatch[1], 10),
      security: parseInt(secMatch[1], 10),
      modernization: parseInt(modMatch[1], 10),
      rating: ratingMatch ? ratingMatch[1] : "unknown",
    };
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

async function compareScores() {
  const reportsDir = join(__dirname, "../reports/validation");

  const tests = [
    { file: "test-1-homepage.md", name: "1 Page (Homepage)" },
    { file: "test-2-three-pages.md", name: "3 Pages" },
    { file: "test-3-five-pages.md", name: "5 Pages" },
    { file: "test-4-auto-10-pages.md", name: "Auto (10 Pages)" },
  ];

  console.log("\n🔍 Multi-Page Scoring Validation Results\n");
  console.log("=".repeat(80));
  console.log("\n");

  const scores: ScoreData[] = [];

  for (const test of tests) {
    const filePath = join(reportsDir, test.file);
    const scoreData = await extractScores(filePath, test.name);
    if (scoreData) {
      scores.push(scoreData);
    }
  }

  if (scores.length === 0) {
    console.error(
      "❌ No valid score data found. Please run the validation script first."
    );
    process.exit(1);
  }

  // Display scores in a table
  console.log(
    "Test Case                Pages   Overall   Perf   SEO   Security   Mod   Rating"
  );
  console.log("-".repeat(80));

  scores.forEach((s) => {
    const testName = s.testName.padEnd(20);
    const pages = s.pageCount.toString().padStart(5);
    const overall = s.overall.toString().padStart(7);
    const perf = s.performance.toString().padStart(6);
    const seo = s.seo.toString().padStart(5);
    const security = s.security.toString().padStart(8);
    const mod = s.modernization.toString().padStart(5);
    const rating = s.rating.padEnd(20);

    console.log(
      `${testName}  ${pages}   ${overall}    ${perf}   ${seo}   ${security}     ${mod}   ${rating}`
    );
  });

  console.log("\n");

  // Analyze changes
  if (scores.length > 1) {
    console.log("📊 Score Changes Analysis\n");
    console.log("-".repeat(80));

    const baseline = scores[0];

    for (let i = 1; i < scores.length; i++) {
      const current = scores[i];
      const overallDiff = current.overall - baseline.overall;
      const perfDiff = current.performance - baseline.performance;
      const seoDiff = current.seo - baseline.seo;
      const secDiff = current.security - baseline.security;
      const modDiff = current.modernization - baseline.modernization;

      console.log(`\n${current.testName} vs ${baseline.testName}:`);
      console.log(
        `  Overall:        ${formatDiff(overallDiff)} (${baseline.overall} → ${
          current.overall
        })`
      );
      console.log(
        `  Performance:    ${formatDiff(perfDiff)} (${baseline.performance} → ${
          current.performance
        })`
      );
      console.log(
        `  SEO:            ${formatDiff(seoDiff)} (${baseline.seo} → ${
          current.seo
        })`
      );
      console.log(
        `  Security:       ${formatDiff(secDiff)} (${baseline.security} → ${
          current.security
        })`
      );
      console.log(
        `  Modernization:  ${formatDiff(modDiff)} (${
          baseline.modernization
        } → ${current.modernization})`
      );
    }
  }

  console.log("\n");
  console.log("=".repeat(80));

  // Validation checks
  console.log("\n✅ Validation Checks\n");

  let hasChanges = false;

  if (scores.length > 1) {
    const baseline = scores[0];

    for (let i = 1; i < scores.length; i++) {
      const current = scores[i];

      if (current.overall !== baseline.overall) {
        hasChanges = true;
        console.log(
          `✓ Overall score changed: ${baseline.overall} → ${current.overall}`
        );
      }

      if (current.seo !== baseline.seo) {
        console.log(
          `✓ SEO score changed: ${baseline.seo} → ${current.seo} (weighted averaging working)`
        );
      }

      if (current.performance !== baseline.performance) {
        console.log(
          `✓ Performance score changed: ${baseline.performance} → ${current.performance} (averaging working)`
        );
      }
    }

    if (!hasChanges) {
      console.log(
        "⚠️  WARNING: Scores did not change between different page counts!"
      );
      console.log(
        "   This suggests multi-page aggregation may not be working correctly."
      );
    } else {
      console.log(
        "\n✅ SUCCESS: Scores are changing based on the number of pages analyzed."
      );
      console.log("   Multi-page scoring appears to be working correctly.");
    }
  }

  console.log("\n");
}

function formatDiff(diff: number): string {
  if (diff > 0) return `+${diff}`;
  if (diff < 0) return `${diff}`;
  return "0";
}

compareScores().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
