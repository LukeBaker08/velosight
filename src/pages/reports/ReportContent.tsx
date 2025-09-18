
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnalysisResult } from '@/components/project/insights/types';
import { Project } from '@/types/project';
import { format } from 'date-fns';
import { CircleGauge } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

interface ReportContentProps {
  analysis?: AnalysisResult | null;
  project?: Project | null;
}

// Helper function to extract data from raw_result for different analysis types
const extractAnalysisData = (analysis: AnalysisResult | null) => {
  if (!analysis || !analysis.raw_result) return { confidence: null, rating: null };
  
  try {
    let data = null;
    
    // Handle array format (common in webhook responses)
    if (Array.isArray(analysis.raw_result) && analysis.raw_result[0]?.output) {
      if (typeof analysis.raw_result[0].output === 'string') {
        try {
          data = JSON.parse(analysis.raw_result[0].output);
        } catch (e) {
          data = null;
        }
      } else {
        data = analysis.raw_result[0].output;
      }
    }
    
    // Handle direct object format with output property
    if (!data && typeof analysis.raw_result === 'object' && analysis.raw_result.output) {
      if (typeof analysis.raw_result.output === 'string') {
        try {
          data = JSON.parse(analysis.raw_result.output);
        } catch (e) {
          data = null;
        }
      } else {
        data = analysis.raw_result.output;
      }
    }
    
    // Try direct access if the structure is already at the root level
    if (!data && typeof analysis.raw_result === 'object' && 
        (analysis.raw_result.SelfAwareness || 
         analysis.raw_result.Context || 
         analysis.raw_result.DeliveryConfidenceAssessment ||
         analysis.raw_result.StrategicBigPicture ||
         analysis.raw_result.GatewayReviewAssessment)) {
      data = analysis.raw_result;
    }
    
    if (!data) return { confidence: null, rating: null };
    
    // Extract confidence from SelfAwareness section (common across all types)
    let confidence = null;
    if (data.SelfAwareness?.ConfidenceLevelRating?.rating) {
      confidence = data.SelfAwareness.ConfidenceLevelRating.rating;
    }
    
    // Extract rating based on analysis type
    let rating = null;
    
    if (analysis.analysis_type === 'Delivery Confidence Assessment') {
      rating = data.DeliveryConfidenceAssessment?.overallDeliveryConfidenceRating;
    } else if (analysis.analysis_type === 'Risk Analysis') {
      // Try OverallRating.riskRating first (new structure), then OverallRiskRating, then fall back to StrategicBigPicture
      rating = data.OverallRating?.riskRating || data.OverallRiskRating?.rating || data.StrategicBigPicture?.OverallRiskScan?.rating;
    } else if (analysis.analysis_type === 'Gateway Review') {
      rating = data.GatewayReviewAssessment?.overallRating;
    }
    
    return { 
      confidence: confidence || analysis.confidence, // Fallback to DB value if not found
      rating: rating || analysis.rating // Fallback to DB value if not found
    };
  } catch (error) {
    console.error('Error extracting analysis data:', error);
    return { 
      confidence: analysis.confidence, 
      rating: analysis.rating 
    };
  }
};

// Helper function to get confidence badge variant
const getConfidenceBadgeVariant = (confidence: string | number | null) => {
  if (!confidence) return "outline";
  
  // Convert to string if it's a number
  const confidenceStr = typeof confidence === 'string' ? confidence : String(confidence);
  const confidenceLower = confidenceStr.toLowerCase();
  
  if (confidenceLower.includes('high') || confidenceLower.includes('good')) return "confidence-high";
  if (confidenceLower.includes('medium') || confidenceLower.includes('satisfactory')) return "confidence-medium";
  if (confidenceLower.includes('low') || confidenceLower.includes('poor')) return "confidence-low";
  return "outline";
};

// Helper function to get rating badge variant
const getRatingBadgeVariant = (rating: string | number | null) => {
  if (!rating) return "outline";
  
  // Convert to string if it's a number
  const ratingStr = typeof rating === 'string' ? rating : String(rating);
  const ratingLower = ratingStr.toLowerCase();
  
  if (ratingLower.includes('high') || ratingLower.includes('good')) return "confidence-high";
  if (ratingLower.includes('medium') || ratingLower.includes('satisfactory')) return "confidence-medium";
  if (ratingLower.includes('low') || ratingLower.includes('poor')) return "confidence-low";
  return "outline";
};

// Helper function to extract confidence percentage
const extractConfidencePercentage = (confidence: string | number | null): number => {
  if (!confidence) return 50;
  
  // If it's already a number, return it (capped at 100)
  if (typeof confidence === 'number') {
    return Math.min(confidence, 100);
  }
  
  // Convert to string for processing
  const confidenceStr = String(confidence);
  
  // Try to extract a percentage value if present
  const percentMatch = confidenceStr.match(/(\d+)%/);
  if (percentMatch && percentMatch[1]) {
    return parseInt(percentMatch[1], 10);
  }
  
  // Otherwise map confidence levels to percentages
  const confidenceLower = confidenceStr.toLowerCase();
  if (confidenceLower.includes('very high') || confidenceLower.includes('excellent')) return 95;
  if (confidenceLower.includes('high') || confidenceLower.includes('good')) return 80;
  if (confidenceLower.includes('medium')) return 60;
  if (confidenceLower.includes('low')) return 40;
  if (confidenceLower.includes('very low') || confidenceLower.includes('poor')) return 20;
  
  return 50; // Default value
};

// Helper function to format markdown-like text for better display
const formatContent = (content: string | null | any): string => {
  if (!content) return '';
  
  // If content is not a string, try to convert it
  if (typeof content !== 'string') {
    try {
      // First try to convert to string if it's JSON
      content = JSON.stringify(content);
    } catch (error) {
      // If that fails, use an empty string
      console.error('Error converting content to string:', error);
      return '';
    }
  }
  
  // Replace markdown-style headers
  let formatted = content
    .replace(/^# (.*$)/gm, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
    .replace(/^## (.*$)/gm, '<h3 class="text-lg font-semibold mt-3 mb-1">$1</h3>')
    .replace(/^### (.*$)/gm, '<h4 class="text-base font-medium mt-2 mb-1">$1</h4>')
    // Replace bold text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Replace bullet points
    .replace(/^\* (.*$)/gm, '<li>$1</li>')
    // Replace line breaks with paragraph tags
    .replace(/\n\n/g, '</p><p class="mb-2">');
  
  // Wrap with paragraph tags
  formatted = `<p class="mb-2">${formatted}</p>`;
  
  // Fix any consecutive paragraph tags
  formatted = formatted.replace(/<\/p><p class="mb-2">/g, '</p><p class="mb-2">');
  
  return formatted;
};

// Extract analysis content from raw_result if available
const getAnalysisContent = (analysis: AnalysisResult | null) => {
  if (!analysis) return null;
  
  // If not available, try to extract from raw_result
  if (analysis.raw_result) {
    try {
      // Check if raw_result contains an output field (common in webhook responses)
      if (Array.isArray(analysis.raw_result) && analysis.raw_result[0]?.output) {
        return analysis.raw_result[0].output;
      }
      
      // Check if raw_result is an object with an output property
      if (typeof analysis.raw_result === 'object' && analysis.raw_result?.output) {
        return analysis.raw_result.output;
      }
      
      // If raw_result has analysis_content property
      if (typeof analysis.raw_result === 'object' && analysis.raw_result?.analysis_content) {
        return analysis.raw_result.analysis_content;
      }
    } catch (error) {
      console.error('Error extracting analysis content from raw_result:', error);
    }
  }
  
  return null;
};

const ReportContent: React.FC<ReportContentProps> = ({ analysis, project }) => {
  if (!analysis) return null;
  
  const { confidence, rating } = extractAnalysisData(analysis);
  const confidencePercentage = extractConfidencePercentage(confidence);
  const analysisContent = getAnalysisContent(analysis);
  
  return (
    <div className="space-y-6">
      {/* Report metadata */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {format(new Date(analysis.created_at), 'dd MMM yyyy')}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {format(new Date(analysis.created_at), 'HH:mm:ss')}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Confidence Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Badge variant={getConfidenceBadgeVariant(confidence)} className="text-lg px-2 py-1">
                  {confidence || 'N/A'}
                </Badge>
                <span className="text-sm font-medium text-muted-foreground">
                  {confidencePercentage}%
                </span>
              </div>
              <div className="relative pt-1">
                <div className="flex items-center justify-between">
                  <CircleGauge className="h-4 w-4 text-muted-foreground" />
                </div>
                <Progress value={confidencePercentage} className="h-2 mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Badge variant={getRatingBadgeVariant(rating)} className="text-lg px-2 py-1">
                {rating || 'Not Available'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Analysis content section */}
      {analysisContent && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="prose prose-sm max-w-none" 
              dangerouslySetInnerHTML={{ __html: formatContent(analysisContent) }}
            />
          </CardContent>
        </Card>
      )}
      
      {/* Raw Output section - for debugging */}
      {analysis.raw_result && (
        <Card>
          <CardHeader>
            <CardTitle>Raw Analysis Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-md overflow-auto max-h-[400px]">
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(analysis.raw_result, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReportContent;
