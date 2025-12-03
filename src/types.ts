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

// ============================================================================
// Analyzer Result Types
// ============================================================================

export interface PerformanceAnalysis {
  htmlSizeCategory: "excellent" | "good" | "fair" | "poor";
  scriptLoadCategory: "excellent" | "good" | "heavy";
  imageOptimization: "excellent" | "good" | "poor";
  caching: "excellent" | "partial" | "none";
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
}

// ============================================================================
// Scoring Types
// ============================================================================

export interface CategoryScores {
  performance: number; // 0-30
  seo: number; // 0-25
  security: number; // 0-25
  modernization: number; // 0-20
}

export interface ScoringResult extends CategoryScores {
  overall: number; // 0-100
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
