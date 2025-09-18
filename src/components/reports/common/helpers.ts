import { DeliveryConfidenceData } from "@/components/project/insights/types";

// Helper function to get confidence badge variant
export const getConfidenceBadgeVariant = (confidence: string | number | null) => {
  if (!confidence) return "outline";
  
  // Convert to string if it's a number
  const confidenceStr = typeof confidence === 'string' ? confidence : String(confidence);
  const confidenceLower = confidenceStr.toLowerCase();
  
  if (confidenceLower.includes('high') || confidenceLower.includes('good')) return "confidence-high";
  if (confidenceLower.includes('medium') || confidenceLower.includes('satisfactory')) return "confidence-medium";
  if (confidenceLower.includes('low') || confidenceLower.includes('poor')) return "confidence-low";
  return "outline";
};

// Helper function to extract confidence percentage
export const extractConfidencePercentage = (confidence: string | null | number): number => {
  if (confidence === null) return 50;
  
  // If it's already a number, return it (capped at 100)
  if (typeof confidence === 'number') {
    return Math.min(confidence, 100);
  }
  
  // Try to extract a percentage value if present
  const percentMatch = confidence.match(/(\d+)%/);
  if (percentMatch && percentMatch[1]) {
    return parseInt(percentMatch[1], 10);
  }
  
  // Otherwise map confidence levels to percentages
  const confidenceLower = confidence.toLowerCase();
  if (confidenceLower.includes('very high') || confidenceLower.includes('excellent')) return 95;
  if (confidenceLower.includes('high') || confidenceLower.includes('good')) return 80;
  if (confidenceLower.includes('medium')) return 60;
  if (confidenceLower.includes('low')) return 40;
  if (confidenceLower.includes('very low') || confidenceLower.includes('poor')) return 20;
  
  return 50; // Default value
};

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
