import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to extract DCA data from various response formats
export function extractDCAData(rawResult: any) {
  if (!rawResult) return null;
  
  try {
    // Handle array format (common in webhook responses)
    if (Array.isArray(rawResult) && rawResult[0]?.output) {
      return rawResult[0].output;
    }
    
    // Handle direct object format with output property
    if (typeof rawResult === 'object' && rawResult.output) {
      return rawResult.output;
    }
    
    // Try direct access if the structure is already at the root level
    if (typeof rawResult === 'object' && 
        (rawResult.SelfAwareness || 
         rawResult.DeliveryConfidenceAssessment || 
         rawResult.Context)) {
      return rawResult;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting data:', error);
    return null;
  }
}

// Helper function to extract confidence rating from DCA data
export function extractConfidenceRating(dcaData: any) {
  if (!dcaData) return null;
  
  try {
    if (dcaData.SelfAwareness?.ConfidenceLevelRating?.rating) {
      return dcaData.SelfAwareness.ConfidenceLevelRating.rating;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting confidence rating:', error);
    return null;
  }
}

// Helper function to extract overall delivery rating from DCA data
export function extractOverallRating(dcaData: any) {
  if (!dcaData) return null;
  
  try {
    if (dcaData.DeliveryConfidenceAssessment?.overallDeliveryConfidenceRating) {
      return dcaData.DeliveryConfidenceAssessment.overallDeliveryConfidenceRating;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting overall rating:', error);
    return null;
  }
}

// Helper function to get confidence badge color
export function getConfidenceBadgeColor(confidence: string | null) {
  if (!confidence) return "default";
  
  const confidenceLower = confidence?.toLowerCase();
  if (confidenceLower?.includes('high')) return "default";
  if (confidenceLower?.includes('medium')) return "secondary";
  if (confidenceLower?.includes('low')) return "destructive";
  return "outline";
}

// Helper function to extract confidence percentage
export function extractConfidencePercentage(confidence: string | null | number): number {
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
}
