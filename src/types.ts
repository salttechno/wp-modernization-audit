/**
 * Core types for wp-modernization-audit
 */

// ============================================================================
// Configuration Types
// ============================================================================

export interface AuditConfig {
  url: string;
  pages: string[];
  apiUrl?: string;
  format: "md" | "html" | "json";
  outPath: string;
  verbose: boolean;
  autoPages?: boolean;
  maxPages?: number;
  psApiKey?: string; // v0.4.0: PageSpeed Insights API key
  psStrategy?: "mobile" | "desktop" | "both"; // v0.4.0: PageSpeed strategy
}

// ============================================================================
// Collector Result Types
// ============================================================================

export interface HttpResult {
  url: string;
  status: number;
  headers: Record<string, string>;
  body: string;
  finalUrl: string;
  error?: string;
}

export interface WpDetectionResult {
  isWordPress: boolean;
  wpVersion?: string;
  themeName?: string;
  plugins: string[];
  detectionMethods: string[];
}

export interface SeoResult {
  title?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  h1Tags: string[];
  hasRobotsTxt: boolean;
  hasSitemap: boolean;
}

export interface PerformanceResult {
  htmlSizeBytes: number;
  numScripts: number;
  numStylesheets: number;
  blockingScripts: number;
  blockingStylesheets: number;
  imageFormats: {
    jpeg: number;
    png: number;
    webp: number;
    avif: number;
    svg: number;
    gif: number;
  };
  hasCacheControl: boolean;
  cacheControlValue?: string;
}

export interface SecurityResult {
  isHttps: boolean;
  hasXContentTypeOptions: boolean;
  hasXFrameOptions: boolean;
  hasContentSecurityPolicy: boolean;
  exposedWpVersion: boolean;
  securityHeaders: Record<string, string>;
}

export interface ModernizationResult {
  hasRestApi: boolean;
  hasPostsEndpoint: boolean;
  hasPagesEndpoint: boolean;
  hasPrettyPermalinks: boolean;
  usesCdn: boolean;
  cdnDomains: string[];
}

// v0.4.0: PageSpeed Insights / Lighthouse Data
export interface LighthouseData {
  lcp: number; // Largest Contentful Paint (ms)
  fid?: number; // First Input Delay (ms) - field data only
  cls: number; // Cumulative Layout Shift (score)
  inp: number; // Interaction to Next Paint (ms)
  ttfb: number; // Time to First Byte (ms)
  performanceScore: number; // Overall Lighthouse performance score (0-100)
  strategy: "mobile" | "desktop";
  fetchedAt: string; // ISO timestamp
}

// ============================================================================
// Analyzer Result Types
// ============================================================================

export interface PerformanceAnalysis {
  htmlSizeCategory: "excellent" | "good" | "fair" | "poor";
  scriptLoadCategory: "excellent" | "good" | "heavy";
  imageOptimization: "excellent" | "good" | "poor";
  caching: "excellent" | "partial" | "none";
  coreWebVitals?: {
    // v0.4.0: Optional PageSpeed data
    lcpStatus: "good" | "needs-improvement" | "poor";
    clsStatus: "good" | "needs-improvement" | "poor";
    inpStatus: "good" | "needs-improvement" | "poor";
    ttfbStatus: "good" | "needs-improvement" | "poor";
  };
  issues: string[];
  recommendations: string[];
}

export interface SeoAnalysis {
  titleQuality: "excellent" | "good" | "missing";
  metaDescriptionQuality: "excellent" | "good" | "missing";
  h1Quality: "excellent" | "issues" | "missing";
  hasCanonical: boolean;
  hasRobotsTxt: boolean;
  hasSitemap: boolean;
  issues: string[];
  recommendations: string[];
}

export interface SecurityAnalysis {
  httpsStatus: "secure" | "insecure";
  headersCoverage: "excellent" | "partial" | "none";
  versionExposure: "hidden" | "exposed";
  overallPosture: "strong" | "moderate" | "weak";
  issues: string[];
  recommendations: string[];
}

export interface ModernizationAnalysis {
  restApiStatus: "full" | "partial" | "none";
  permalinkModernity: "modern" | "mixed" | "legacy";
  cdnUsage: "yes" | "partial" | "no";
  headlessReadiness: "ready" | "needs-work" | "not-ready";
  issues: string[];
  recommendations: string[];
}

// ============================================================================
// Page-Level Result
// ============================================================================

export interface PageResult {
  path: string;
  url: string;
  httpResult: HttpResult;
  seoResult: SeoResult;
  performanceResult: PerformanceResult;
  securityResult: SecurityResult;
  lighthouseData?: LighthouseData; // v0.4.0: Optional PageSpeed data
}

// ============================================================================
// Scoring Types
// ============================================================================

export interface CategoryScores {
  performance: number; // 0-30 baseline, up to 41 with Core Web Vitals bonus (v0.4.0)
  seo: number; // 0-25
  security: number; // 0-25
  modernization: number; // 0-20
}

export interface ScoringResult extends CategoryScores {
  overall: number; // 0-100 baseline, up to 111 with Core Web Vitals bonus (v0.4.0)
  rating: "healthy" | "needs-optimization" | "needs-modernization" | "legacy";
}

// ============================================================================
// Final Audit Result
// ============================================================================

export interface AuditResult {
  url: string;
  pages: PageResult[];
  timestamp: string;
  wpDetection: WpDetectionResult;
  scores: ScoringResult;
  analyses: {
    performance: PerformanceAnalysis;
    seo: SeoAnalysis;
    security: SecurityAnalysis;
    modernization: ModernizationAnalysis;
  };
  topIssues: string[];
}
