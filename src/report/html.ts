/**
 * HTML Report Generator - Creates professional HTML reports with embedded CSS
 */

import type { AuditResult } from "../types";

export function generateHtmlReport(result: AuditResult): string {
  const ratingColor = getRatingColor(result.scores.rating);
  const ratingLabel = getRatingLabel(result.scores.rating);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WordPress Modernization Audit - ${result.url}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f7fa;
      padding: 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 20px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    
    header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
      font-weight: 700;
    }
    
    header .url {
      font-size: 1.2em;
      opacity: 0.9;
      margin-bottom: 5px;
    }
    
    header .timestamp {
      opacity: 0.7;
      font-size: 0.9em;
    }
    
    .executive-summary {
      padding: 40px;
      text-align: center;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .overall-score {
      display: inline-block;
      background: ${ratingColor};
      color: white;
      padding: 30px 50px;
      border-radius: 12px;
      margin: 20px 0;
      box-shadow: 0 4px 15px rgba(0,0,0,0.15);
    }
    
    .overall-score .score {
      font-size: 4em;
      font-weight: 700;
      line-height: 1;
    }
    
    .overall-score .label {
      font-size: 1.2em;
      margin-top: 10px;
      opacity: 0.9;
    }
    
    .rating-badge {
      display: inline-block;
      padding: 8px 20px;
      background: ${ratingColor};
      color: white;
      border-radius: 20px;
      font-weight: 600;
      margin: 10px 0;
    }
    
    .wp-info {
      margin: 20px 0;
      padding: 20px;
      background: #f9fafb;
      border-radius: 8px;
      text-align: left;
      display: inline-block;
    }
    
    .wp-info h3 {
      margin-bottom: 10px;
      color: #667eea;
    }
    
    .category-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      padding: 40px;
      background: #f9fafb;
    }
    
    .category-card {
      background: white;
      border-radius: 10px;
      padding: 25px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.08);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .category-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0,0,0,0.12);
    }
    
    .category-card h3 {
      color: #1f2937;
      margin-bottom: 15px;
      font-size: 1.2em;
    }
    
    .score-bar-container {
      background: #e5e7eb;
      height: 30px;
      border-radius: 15px;
      position: relative;
      margin: 15px 0;
      overflow: hidden;
    }
    
    .score-bar {
      height: 100%;
      background: linear-gradient(90deg, #10b981, #059669);
      border-radius: 15px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 12px;
      color: white;
      font-weight: 700;
      transition: width 0.5s ease-out;
    }
    
    .score-bar.warning {
      background: linear-gradient(90deg, #f59e0b, #d97706);
    }
    
    .score-bar.critical {
      background: linear-gradient(90deg, #ef4444, #dc2626);
    }
    
    .section {
      padding: 40px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .section h2 {
      color: #1f2937;
      margin-bottom: 20px;
      font-size: 1.8em;
      border-left: 4px solid #667eea;
      padding-left: 15px;
    }
    
    .issues-list, .recommendations-list {
      list-style: none;
      margin: 20px 0;
    }
    
    .issues-list li {
      padding: 12px 15px;
      margin: 8px 0;
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      border-radius: 4px;
    }
    
    .issues-list li::before {
      content: '⚠️ ';
      margin-right: 8px;
    }
    
    .recommendations-list li {
      padding: 12px 15px;
      margin: 8px 0;
      background: #f0fdf4;
      border-left: 4px solid #10b981;
      border-radius: 4px;
    }
    
    .recommendations-list li::before {
      content: '💡 ';
      margin-right: 8px;
    }
    
    .top-issues {
      background: #fef2f2;
      padding: 25px;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    .top-issues h3 {
      color: #dc2626;
      margin-bottom: 15px;
    }
    
    .top-issues ol {
      margin-left: 20px;
    }
    
    .top-issues li {
      margin: 8px 0;
      color: #991b1b;
    }
    
    footer {
      padding: 30px;
      text-align: center;
      background: #f9fafb;
      color: #6b7280;
      font-size: 0.9em;
    }
    
    footer a {
      color: #667eea;
      text-decoration: none;
    }
    
    footer a:hover {
      text-decoration: underline;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .container {
        box-shadow: none;
      }
      
      .category-card {
        break-inside: avoid;
      }
    }
    
    @media (max-width: 768px) {
      header h1 {
        font-size: 1.8em;
      }
      
      .overall-score {
        padding: 20px 30px;
      }
      
      .overall-score .score {
        font-size: 3em;
      }
      
      .category-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🔍 WordPress Modernization Audit</h1>
      <div class="url">${escapeHtml(result.url)}</div>
      <div class="timestamp">Generated: ${new Date(
        result.timestamp
      ).toLocaleString()}</div>
    </header>
    
    <div class="executive-summary">
      <h2>Executive Summary</h2>
      
      <div class="overall-score">
        <div class="score">${result.scores.overall}/100</div>
        <div class="label">Overall Modernization Score</div>
      </div>
      
      <div class="rating-badge">${ratingLabel}</div>
      
      ${
        result.wpDetection.isWordPress
          ? `
        <div class="wp-info">
          <h3>✅ WordPress Detected</h3>
          ${
            result.wpDetection.wpVersion
              ? `<p><strong>Version:</strong> ${result.wpDetection.wpVersion}</p>`
              : ""
          }
          ${
            result.wpDetection.themeName
              ? `<p><strong>Theme:</strong> ${result.wpDetection.themeName}</p>`
              : ""
          }
          ${
            result.wpDetection.plugins.length > 0
              ? `<p><strong>Plugins:</strong> ${result.wpDetection.plugins
                  .slice(0, 5)
                  .join(", ")}${
                  result.wpDetection.plugins.length > 5 ? "..." : ""
                }</p>`
              : ""
          }
        </div>
      `
          : "<p>⚠️ Could not confirm this is a WordPress site</p>"
      }
      
      ${
        result.topIssues.length > 0
          ? `
        <div class="top-issues">
          <h3>🚨 Top Issues to Address</h3>
          <ol>
            ${result.topIssues
              .map((issue) => `<li>${escapeHtml(issue)}</li>`)
              .join("")}
          </ol>
        </div>
      `
          : ""
      }
    </div>
    
    <div class="category-grid">
      ${renderCategoryCard("Performance", result.scores.performance, 30)}
      ${renderCategoryCard("SEO Foundations", result.scores.seo, 25)}
      ${renderCategoryCard("Security", result.scores.security, 25)}
      ${renderCategoryCard("Modernization", result.scores.modernization, 20)}
    </div>
    
    <div class="section">
      <h2>1. Performance (${result.scores.performance}/30)</h2>
      ${renderAnalysisSection(result.analyses.performance)}
    </div>
    
    <div class="section">
      <h2>2. SEO Foundations (${result.scores.seo}/25)</h2>
      ${renderAnalysisSection(result.analyses.seo)}
    </div>
    
    <div class="section">
      <h2>3. WordPress Health & Security (${result.scores.security}/25)</h2>
      ${renderAnalysisSection(result.analyses.security)}
    </div>
    
    <div class="section">
      <h2>4. Modernization Readiness (${result.scores.modernization}/20)</h2>
      ${renderAnalysisSection(result.analyses.modernization)}
    </div>
    
    <footer>
      <p>Generated by <a href="https://github.com/yourusername/wp-modernization-audit" target="_blank">wp-modernization-audit</a> v0.2.0</p>
      <p>This is an automated audit. For detailed analysis, consult with a web development professional.</p>
    </footer>
  </div>
</body>
</html>`;
}

// Helper functions

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function getRatingColor(rating: string): string {
  switch (rating) {
    case "healthy":
      return "#10b981";
    case "needs-optimization":
      return "#f59e0b";
    case "needs-modernization":
      return "#f97316";
    case "legacy":
      return "#ef4444";
    default:
      return "#6b7280";
  }
}

function getRatingLabel(rating: string): string {
  switch (rating) {
    case "healthy":
      return "✅ Healthy - Room for Targeted Improvements";
    case "needs-optimization":
      return "⚠️ Needs Optimization";
    case "needs-modernization":
      return "🔧 Modernization Recommended";
    case "legacy":
      return "🚨 Legacy - Modernization Strongly Recommended";
    default:
      return rating;
  }
}

function renderCategoryCard(
  name: string,
  score: number,
  maxScore: number
): string {
  const percentage = (score / maxScore) * 100;
  const barClass =
    percentage >= 80 ? "" : percentage >= 60 ? "warning" : "critical";
  const status =
    percentage >= 80
      ? "✅ Good"
      : percentage >= 60
      ? "⚠️ Needs Work"
      : "🚨 Critical";

  return `
    <div class="category-card">
      <h3>${name}</h3>
      <div class="score-bar-container">
        <div class="score-bar ${barClass}" style="width: ${percentage}%">
          ${score}/${maxScore}
        </div>
      </div>
      <p style="margin-top: 10px; color: #6b7280;">${status}</p>
    </div>
  `;
}

function renderAnalysisSection(analysis: any): string {
  let html = "";

  if (analysis.issues && analysis.issues.length > 0) {
    html += '<h3>Issues Found</h3><ul class="issues-list">';
    analysis.issues.forEach((issue: string) => {
      html += `<li>${escapeHtml(issue)}</li>`;
    });
    html += "</ul>";
  }

  if (analysis.recommendations && analysis.recommendations.length > 0) {
    html += '<h3>Recommendations</h3><ul class="recommendations-list">';
    analysis.recommendations.forEach((rec: string) => {
      html += `<li>${escapeHtml(rec)}</li>`;
    });
    html += "</ul>";
  }

  return html || "<p>No issues found in this category.</p>";
}
