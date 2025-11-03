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
import { supabase } from '@/integrations/supabase/client';

export const DEFAULT_PROJECT_STAGES = [
  'planning',
  'initiation',
  'execution',
  'monitoring',
  'closure'
] as const;

/**
 * Fetch project stages from dropdown tables in Supabase.
 * Returns string[] or falls back to DEFAULT_PROJECT_STAGES on error.
 */
export async function fetchProjectStages(): Promise<string[]> {
  try {
    // Try to find a category whose name includes 'stage'
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

// Backwards-compatible synchronous fallback used in UI when async fetch isn't available
export const PROJECT_STAGES = DEFAULT_PROJECT_STAGES;

// Risk Levels
// Risk Levels (dynamic + fallback)
export const DEFAULT_RISK_LEVELS = ['low', 'medium', 'high', 'critical'] as const;

/**
 * Fetch risk levels from dropdown tables in Supabase.
 * Returns string[] or falls back to DEFAULT_RISK_LEVELS on error.
 */
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

// Backwards-compatible synchronous fallback used in UI when async fetch isn't available
export const RISK_LEVELS = DEFAULT_RISK_LEVELS;