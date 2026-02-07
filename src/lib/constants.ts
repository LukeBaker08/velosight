/**
 * Application-wide constants and configuration.
 * Single source of truth — replaces the former config.ts and constants.ts split.
 */

import { supabase } from '@/integrations/supabase/client';

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------
export const API_CONFIG = {
  TIMEOUT: 10000,
  TIMEOUT_LONG: 120000, // 2 minutes – for LLM generation calls
  RETRY_ATTEMPTS: 3,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
} as const;

// ---------------------------------------------------------------------------
// Application
// ---------------------------------------------------------------------------
export const APP_CONFIG = {
  NAME: 'VeloSight',
  VERSION: '1.0.0',
  DESCRIPTION: 'Project delivery confidence assessment platform',

  FEATURES: {
    ANALYTICS: true,
    DEBUG_MODE: import.meta.env.DEV,
    ERROR_REPORTING: true,
  },

  UI: {
    DEFAULT_PAGE_SIZE: 20,
    TOAST_DURATION: 5000,
    LOADING_DELAY: 200, // ms before showing loading spinner
  },

  UPLOAD: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB (mirrors API_CONFIG.MAX_FILE_SIZE)
    ALLOWED_TYPES: ['pdf', 'doc', 'docx', 'txt', 'xlsx', 'xls', 'pptx'] as const,
    CHUNK_SIZE: 1024 * 1024, // 1MB chunks for large files
  },

  CACHE: {
    USER_SESSION_TTL: 30 * 60 * 1000,  // 30 minutes
    PROJECT_DATA_TTL: 5 * 60 * 1000,   // 5 minutes
    ANALYSIS_DATA_TTL: 10 * 60 * 1000, // 10 minutes
  },
} as const;

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------
export const DOCUMENT_CONFIG = {
  MAX_FILE_SIZE: API_CONFIG.MAX_FILE_SIZE,
  ALLOWED_TYPES: ['pdf', 'doc', 'docx', 'txt', 'xlsx', 'xls', 'pptx'] as const,

  CATEGORIES: {
    PROJECT: 'project',
    CONTEXT: 'context',
    SENTIMENT: 'sentiment',
  } as const,

  TYPES: {
    PROJECT: [
      'assurance-report',
      'planning-document',
      'risk-assessment',
      'governance-document',
      'environment-scan',
      'other',
    ],
    CONTEXT: [
      'org-chart',
      'strategic-plan',
      'environment-scan',
      'other',
    ],
    SENTIMENT: [
      'meeting-notes',
      'survey-results',
      'feedback',
      'other',
    ],
  } as const,
} as const;

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------
export const ANALYSIS_TYPES = {
  DELIVERY_CONFIDENCE: 'delivery-confidence-assessment',
  RISK_ASSESSMENT: 'risk-assessment',
  GATEWAY_REVIEW: 'gateway-review',
  HYPOTHESIS: 'hypothesis',
  CUSTOM: 'custom-analysis',
} as const;

export const ANALYSIS_CONFIG = {
  TYPES: ANALYSIS_TYPES,

  STATUS: {
    DRAFT: 'draft',
    FINAL: 'final',
  } as const,

  CONFIDENCE_LEVELS: ['low', 'medium', 'high', 'very-high'] as const,
} as const;

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  AUTHENTICATED: 'authenticated',
} as const;

export const USER_CONFIG = {
  ROLES: USER_ROLES,
} as const;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
export const VALIDATION_CONFIG = {
  PROJECT: {
    NAME_MIN_LENGTH: 3,
    NAME_MAX_LENGTH: 100,
    CLIENT_MIN_LENGTH: 2,
    CLIENT_MAX_LENGTH: 100,
    DESCRIPTION_MAX_LENGTH: 500,
  },

  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL: false,
  },

  FILE: {
    NAME_MAX_LENGTH: 255,
    PATH_MAX_LENGTH: 500,
  },
} as const;

// ---------------------------------------------------------------------------
// Project Stages (dynamic from DB, with fallback)
// ---------------------------------------------------------------------------
export const DEFAULT_PROJECT_STAGES = [
  'Planning',
  'Contestability',
  'Prioritisation',
  'Implementation',
  'Closure',
] as const;

/** Fetch project stages from dropdown tables. Falls back to DEFAULT_PROJECT_STAGES. */
export async function fetchProjectStages(): Promise<string[]> {
  try {
    const { data: cats, error: catErr } = await supabase
      .from('dropdown_categories')
      .select('id, name')
      .ilike('name', '%stage%')
      .limit(1);

    if (catErr) {
      console.error('Error fetching dropdown category for project stages:', catErr);
      return Array.from(DEFAULT_PROJECT_STAGES);
    }

    const categoryId = cats && cats.length > 0 ? (cats[0] as any).id : null;
    if (!categoryId) return Array.from(DEFAULT_PROJECT_STAGES);

    const { data: values, error: valErr } = await supabase
      .from('dropdown_values')
      .select('value')
      .eq('category_id', categoryId)
      .order('sort_order', { ascending: true });

    if (valErr) {
      console.error('Error fetching dropdown values for project stages:', valErr);
      return Array.from(DEFAULT_PROJECT_STAGES);
    }

    if (!values || values.length === 0) return Array.from(DEFAULT_PROJECT_STAGES);
    return (values as any[]).map(v => v.value as string);
  } catch (err) {
    console.error('Unexpected error fetching project stages:', err);
    return Array.from(DEFAULT_PROJECT_STAGES);
  }
}

/** Synchronous fallback for UI that can't await */
export const PROJECT_STAGES = DEFAULT_PROJECT_STAGES;

// ---------------------------------------------------------------------------
// Risk Levels (dynamic from DB, with fallback)
// ---------------------------------------------------------------------------
export const DEFAULT_RISK_LEVELS = ['low', 'medium', 'high', 'critical'] as const;

/** Fetch risk levels from dropdown tables. Falls back to DEFAULT_RISK_LEVELS. */
export async function fetchRiskLevels(): Promise<string[]> {
  try {
    const { data: cats, error: catErr } = await supabase
      .from('dropdown_categories')
      .select('id, name')
      .ilike('name', '%Risk%')
      .limit(1);

    if (catErr) {
      console.error('Error fetching dropdown category for risk levels:', catErr);
      return Array.from(DEFAULT_RISK_LEVELS);
    }

    const categoryId = cats && cats.length > 0 ? (cats[0] as any).id : null;
    if (!categoryId) return Array.from(DEFAULT_RISK_LEVELS);

    const { data: values, error: valErr } = await supabase
      .from('dropdown_values')
      .select('value')
      .eq('category_id', categoryId)
      .order('sort_order', { ascending: true });

    if (valErr) {
      console.error('Error fetching dropdown values for risk levels:', valErr);
      return Array.from(DEFAULT_RISK_LEVELS);
    }

    if (!values || values.length === 0) return Array.from(DEFAULT_RISK_LEVELS);
    return (values as any[]).map(v => v.value as string);
  } catch (err) {
    console.error('Unexpected error fetching risk levels:', err);
    return Array.from(DEFAULT_RISK_LEVELS);
  }
}

/** Synchronous fallback for UI that can't await */
export const RISK_LEVELS = DEFAULT_RISK_LEVELS;

// ---------------------------------------------------------------------------
// Project Configuration (static)
// ---------------------------------------------------------------------------
export const PROJECT_CONFIG = {
  STAGES: DEFAULT_PROJECT_STAGES,
  RISK_LEVELS: DEFAULT_RISK_LEVELS,
} as const;

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------
export const ENV = {
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
  IS_TEST: import.meta.env.MODE === 'test',
} as const;

// ---------------------------------------------------------------------------
// Aggregated CONFIG export (for consumers that prefer a single import)
// ---------------------------------------------------------------------------
export const CONFIG = {
  API: API_CONFIG,
  APP: APP_CONFIG,
  DOCUMENT: DOCUMENT_CONFIG,
  ANALYSIS: ANALYSIS_CONFIG,
  PROJECT: PROJECT_CONFIG,
  USER: USER_CONFIG,
  VALIDATION: VALIDATION_CONFIG,
  ENV,
} as const;

export default CONFIG;
