/**
 * Global configuration management
 * Centralizes environment variables and app configuration
 */

// API Configuration
export const API_CONFIG = {
  // Supabase Configuration (from client.ts)
  SUPABASE_URL: "https://supabase.fidere.au",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE",
  
  // Request Configuration
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
} as const;

// Application Configuration
export const APP_CONFIG = {
  NAME: 'VeloSight',
  VERSION: '1.0.0',
  DESCRIPTION: 'Project delivery confidence assessment platform',
  
  // Features flags
  FEATURES: {
    ANALYTICS: true,
    DEBUG_MODE: process.env.NODE_ENV === 'development',
    ERROR_REPORTING: true,
  },
  
  // UI Configuration
  UI: {
    DEFAULT_PAGE_SIZE: 20,
    TOAST_DURATION: 5000,
    LOADING_DELAY: 200, // ms before showing loading spinner
  },
  
  // File Upload Configuration
  UPLOAD: {
    MAX_SIZE: API_CONFIG.MAX_FILE_SIZE,
    ALLOWED_TYPES: ['pdf', 'doc', 'docx', 'txt', 'xlsx', 'xls', 'pptx'] as const,
    CHUNK_SIZE: 1024 * 1024, // 1MB chunks for large files
  },
  
  // Cache Configuration
  CACHE: {
    USER_SESSION_TTL: 30 * 60 * 1000, // 30 minutes
    PROJECT_DATA_TTL: 5 * 60 * 1000,  // 5 minutes
    ANALYSIS_DATA_TTL: 10 * 60 * 1000, // 10 minutes
  }
} as const;

// Document Categories and Types
export const DOCUMENT_CONFIG = {
  CATEGORIES: {
    PROJECT: 'project',
    CONTEXT: 'context', 
    SENTIMENT: 'sentiment'
  } as const,
  
  TYPES: {
    PROJECT: [
      'assurance-report',
      'planning-document', 
      'risk-assessment',
      'governance-document',
      'environment-scan',
      'other'
    ],
    CONTEXT: [
      'org-chart',
      'strategic-plan', 
      'environment-scan',
      'other'
    ],
    SENTIMENT: [
      'meeting-notes',
      'survey-results',
      'feedback', 
      'other'
    ]
  } as const
} as const;

// Analysis Configuration
export const ANALYSIS_CONFIG = {
  TYPES: {
    DELIVERY_CONFIDENCE: 'delivery-confidence-assessment',
    RISK_ASSESSMENT: 'risk-assessment', 
    GATEWAY_REVIEW: 'gateway-review',
    HYPOTHESIS: 'hypothesis',
    CUSTOM: 'custom-analysis'
  } as const,
  
  STATUS: {
    DRAFT: 'draft',
    FINAL: 'final'
  } as const,
  
  CONFIDENCE_LEVELS: ['low', 'medium', 'high', 'very-high'] as const
} as const;

// Project Configuration
export const PROJECT_CONFIG = {
  STAGES: [
    'planning',
    'initiation', 
    'execution',
    'monitoring',
    'closure'
  ] as const,
  
  RISK_LEVELS: [
    'low',
    'medium',
    'high', 
    'critical'
  ] as const
} as const;

// User Roles
export const USER_CONFIG = {
  ROLES: {
    ADMIN: 'admin',
    USER: 'user',
    AUTHENTICATED: 'authenticated'
  } as const
} as const;

// Validation Rules
export const VALIDATION_CONFIG = {
  PROJECT: {
    NAME_MIN_LENGTH: 3,
    NAME_MAX_LENGTH: 100,
    CLIENT_MIN_LENGTH: 2,
    CLIENT_MAX_LENGTH: 100,
    DESCRIPTION_MAX_LENGTH: 500
  },
  
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true, 
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL: false
  },
  
  FILE: {
    NAME_MAX_LENGTH: 255,
    PATH_MAX_LENGTH: 500
  }
} as const;

// Environment Detection
export const ENV = {
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_TEST: process.env.NODE_ENV === 'test'
} as const;

// Export all configurations as a single object for easy access
export const CONFIG = {
  API: API_CONFIG,
  APP: APP_CONFIG,
  DOCUMENT: DOCUMENT_CONFIG,
  ANALYSIS: ANALYSIS_CONFIG,
  PROJECT: PROJECT_CONFIG,
  USER: USER_CONFIG,
  VALIDATION: VALIDATION_CONFIG,
  ENV
} as const;

export default CONFIG;