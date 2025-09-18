
/**
 * Type definitions for project-related data structures.
 * Defines core project entity and related types used throughout the application.
 */

export type RiskLevel = 'low' | 'medium' | 'high';

/**
 * Main project interface representing a project entity
 * Includes backward compatibility getters for legacy property access patterns
 */
export interface Project {
  id: string;
  name: string;
  description: string | null;
  client: string;
  stage: string | null;
  risk_level: string | null;
  created_at: string;
  last_updated: string | null;
  documents_count: number | null;
  
  // Backward compatibility getters for legacy code
  get riskLevel(): string | null;
  get lastUpdated(): string | null;
  get documentsCount(): number | null;
}

/**
 * Document interface representing uploaded project documents
 */
export interface Document {
  id: string;
  name: string;
  type: string;
  category: string | null;
  project_id: string;
  upload_date: string;
}

/**
 * Enumeration of supported document types for categorization and processing
 */
export type DocumentType = 
  | 'contract' 
  | 'report' 
  | 'presentation' 
  | 'spreadsheet'
  | 'assurance-report'
  | 'planning-document'
  | 'risk-assessment'
  | 'governance-document'
  | 'environment-scan'
  | 'org-chart'
  | 'strategic-plan'
  | 'meeting-notes'
  | 'survey-results'
  | 'feedback'
  | 'other';

/**
 * Document category classification for organizing uploaded documents
 */
export type DocumentCategory = 
  | 'financial' 
  | 'legal' 
  | 'technical' 
  | 'requirements'
  | 'planning'
  | 'project'
  | 'context'
  | 'other';
