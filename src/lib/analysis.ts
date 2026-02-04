/**
 * Analysis utilities for consistent data extraction and formatting
 */

import { extractDCAData, extractAnalysisData } from '@/components/reports/common/helpers';
import { ANALYSIS_TYPES } from './constants';

export interface AnalysisResult {
  id: string;
  project_id: string;
  analysis_type: string;
  analysis_subtype?: string;
  confidence: string | null;
  rating: string | null;
  created_at: string;
  status: 'Draft' | 'Final';
  raw_result?: any;
}

/**
 * Get analysis route based on type
 */
export const getAnalysisRoute = (analysisType: string): string => {
  switch (analysisType) {
    case ANALYSIS_TYPES.DELIVERY_CONFIDENCE:
      return 'delivery-confidence-assessment';
    case ANALYSIS_TYPES.RISK_ASSESSMENT:
      return 'risk-assessment';
    case ANALYSIS_TYPES.GATEWAY_REVIEW:
      return 'gateway-review';
    case ANALYSIS_TYPES.HYPOTHESIS:
      return 'hypothesis';
    case ANALYSIS_TYPES.CUSTOM:
    default:
      return 'custom-analysis';
  }
};

/**
 * Extract structured data from analysis results
 */
export const extractStructuredData = (analysis: AnalysisResult) => {
  if (!analysis.raw_result) return null;

  switch (analysis.analysis_type) {
    case ANALYSIS_TYPES.DELIVERY_CONFIDENCE:
      return extractDCAData(analysis.raw_result);
    default:
      return extractAnalysisData(analysis.raw_result);
  }
};

/**
 * Get analysis status badge variant
 */
export const getAnalysisStatusVariant = (status: 'Draft' | 'final'): string => {
  return status === 'Final' ? 'default' : 'secondary';
};

/**
 * Format analysis confidence for display
 */
export const formatAnalysisConfidence = (confidence: string | null): string => {
  if (!confidence) return 'Not specified';
  
  // Handle percentage values
  const percentageMatch = confidence.match(/(\d+)%/);
  if (percentageMatch) {
    return `${percentageMatch[1]}%`;
  }
  
  // Handle text confidence levels
  return confidence.charAt(0).toUpperCase() + confidence.slice(1);
};

/**
 * Get analysis type display name
 */
export const getAnalysisTypeDisplayName = (type: string): string => {
  switch (type) {
    case ANALYSIS_TYPES.DELIVERY_CONFIDENCE:
      return 'Delivery Confidence Assessment';
    case ANALYSIS_TYPES.RISK_ASSESSMENT:
      return 'Risk Assessment';
    case ANALYSIS_TYPES.GATEWAY_REVIEW:
      return 'Gateway Review';
    case ANALYSIS_TYPES.HYPOTHESIS:
      return 'Hypothesis Generation';
    case ANALYSIS_TYPES.CUSTOM:
      return 'Custom Analysis';
    default:
      return type.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
  }
};