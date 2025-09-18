/**
 * Application-wide constants and configuration values.
 * Centralizes all constant values used throughout the application for consistency and maintainability.
 */

// API Configuration
export const API_CONFIG = {
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
} as const;

// Document Configuration
export const DOCUMENT_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['pdf', 'doc', 'docx', 'txt', 'xlsx', 'xls'] as const,
  CATEGORIES: ['project', 'contract', 'specification', 'report', 'other'] as const,
} as const;

// Analysis Types
export const ANALYSIS_TYPES = {
  DELIVERY_CONFIDENCE: 'delivery-confidence-assessment',
  RISK_ASSESSMENT: 'risk-assessment',
  GATEWAY_REVIEW: 'gateway-review',
  HYPOTHESIS: 'hypothesis',
  CUSTOM: 'custom-analysis',
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  AUTHENTICATED: 'authenticated',
} as const;

// Project Stages
export const PROJECT_STAGES = [
  'planning',
  'initiation',
  'execution',
  'monitoring',
  'closure'
] as const;

// Risk Levels
export const RISK_LEVELS = [
  'low',
  'medium',
  'high',
  'critical'
] as const;