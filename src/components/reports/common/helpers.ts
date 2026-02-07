import { DeliveryConfidenceData } from "@/components/project/insights/types";

// Re-export badge helpers from centralized location
export {
  getConfidenceBadgeVariant,
  extractConfidencePercentage,
  getRiskRatingBadgeVariant,
  getStatusBadgeVariant,
  getPriorityBadgeVariant,
  getAssessmentRatingBadgeVariant,
  getBadgeColorClasses,
} from '@/lib/badge-helpers';

// Helper function to format dimension keys with proper spacing
export const formatDimensionKey = (key: string | null | undefined): string => {
  // If key is null, undefined, or not a string, return a safe value
  if (key === null || key === undefined || typeof key !== 'string') {
    console.log('Invalid dimension key:', key);
    return String(key || 'Unknown');
  }

  // Skip formatting for the "Overall" key
  if (key === "Overall") return key;

  // Add spaces before capital letters and trim any extra spaces
  return key.replace(/([A-Z])/g, ' $1').trim();
};

// Helper function to extract structured data from raw_result for DCA
export const extractDCAData = (analysisRawResult: any): DeliveryConfidenceData | null => {
  try {
    if (!analysisRawResult) return null;

    // Handle array format (common in webhook responses)
    if (Array.isArray(analysisRawResult) && analysisRawResult[0]?.output) {
      return analysisRawResult[0].output as DeliveryConfidenceData;
    }

    // Handle direct object format with output property
    if (typeof analysisRawResult === 'object' && analysisRawResult.output) {
      return analysisRawResult.output as DeliveryConfidenceData;
    }

    // Try direct access if the structure is already at the root level
    if (typeof analysisRawResult === 'object' &&
        (analysisRawResult.SelfAwareness ||
         analysisRawResult.DeliveryConfidenceAssessment ||
         analysisRawResult.Context)) {
      return analysisRawResult as DeliveryConfidenceData;
    }

    return null;
  } catch (error) {
    console.error('Error extracting DCA data:', error);
    return null;
  }
};

// Helper function to extract the AI model used from raw_result metadata
export const extractModelUsed = (rawResult: any): string | null => {
  try {
    if (!rawResult) return null;

    // Model is stored in _meta.model
    if (rawResult._meta?.model) {
      return rawResult._meta.model;
    }

    return null;
  } catch (error) {
    console.error('Error extracting model:', error);
    return null;
  }
};

// Helper function to extract analysis data from raw_result - generic version
export const extractAnalysisData = (rawResult: any) => {
  try {
    if (!rawResult) return null;

    // Handle array format (common in webhook responses)
    if (Array.isArray(rawResult) && rawResult[0]?.output) {
      if (typeof rawResult[0].output === 'string') {
        try {
          return JSON.parse(rawResult[0].output);
        } catch (e) {
          console.error('Error parsing output as JSON:', e);
          return null;
        }
      } else {
        return rawResult[0].output;
      }
    }

    // Handle direct object format with output property
    if (typeof rawResult === 'object' && rawResult.output) {
      if (typeof rawResult.output === 'string') {
        try {
          return JSON.parse(rawResult.output);
        } catch (e) {
          console.error('Error parsing output as JSON:', e);
          return null;
        }
      } else {
        return rawResult.output;
      }
    }

    // Try direct access if the structure is already at the root level
    if (typeof rawResult === 'object' &&
        (rawResult.SelfAwareness ||
         rawResult.Context ||
         rawResult.DeliveryConfidenceAssessment ||
         rawResult.StrategicBigPicture ||
         rawResult.GatewayReviewAssessment ||
         rawResult.hypotheses)) {
      return rawResult;
    }

    return null;
  } catch (error) {
    console.error('Error extracting analysis data:', error);
    return null;
  }
};
