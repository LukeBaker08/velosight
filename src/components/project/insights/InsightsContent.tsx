import React from 'react';
import { AnalysisResult, DeliveryConfidenceData, RiskAssessmentData } from './types';
import { Badge } from "@/components/ui/badge";
import { FileChartLine, FileChartPie, FileText, Calendar } from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';
import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getConfidenceBadgeVariant, getRatingBadgeVariant } from '@/lib/badge-helpers';

interface InsightsContentProps {
  content: string;
  wordTemplate: File | null;
  analysisResult?: AnalysisResult;
  analysisHistory: AnalysisResult[];
  projectId: string;
}

// Helper function to extract data from raw_result for different analysis types
const extractAnalysisData = (analysis: AnalysisResult) => {
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
      // Try OverallRiskRating first, then fall back to StrategicBigPicture
      rating = data.OverallRiskRating?.rating || data.StrategicBigPicture?.OverallRiskScan?.rating;
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

// Helper function to get the most recent result for a specific analysis type
const getMostRecentAnalysis = (analysisHistory: AnalysisResult[], analysisType: string): AnalysisResult | undefined => {
  return analysisHistory
    .filter(analysis => analysis.analysis_type === analysisType)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
};

// Helper function to get icon for analysis type
const getAnalysisIcon = (analysisType: string) => {
  switch (analysisType) {
    case 'Risk Analysis':
      return <FileChartLine className="h-4 w-4" />;
    case 'Delivery Confidence Assessment':
      return <FileChartPie className="h-4 w-4" />;
    case 'Gateway Review':
      return <FileText className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

// Helper function to get route for analysis type - Fixed to match App.tsx routes
const getAnalysisRoute = (analysisType: string) => {
  switch (analysisType) {
    case 'Risk Analysis':
      return 'risk-assessment';
    case 'Delivery Confidence Assessment':
      return 'delivery-confidence-assessment'; // Fixed: was missing '-assessment'
    case 'Gateway Review':
      return 'gateway-review';
    case 'Hypothesis':
      return 'hypothesis';
    case 'Custom Prompt Analysis':
    case 'Custom Analysis':
      return 'custom-analysis';
    default:
      return 'delivery-confidence-assessment'; // Default fallback
  }
};

// Helper function to extract Risk Analysis data
const extractRiskAnalysisData = (analysis: AnalysisResult) => {
  try {
    if (!analysis || !analysis.raw_result) return null;
    
    console.log('Extracting risk analysis data from:', JSON.stringify(analysis.raw_result, null, 2));
    
    // Handle array format (common in webhook responses)
    if (Array.isArray(analysis.raw_result) && analysis.raw_result[0]?.output) {
      return analysis.raw_result[0].output;
    }
    
    // Handle direct object format with output property
    if (typeof analysis.raw_result === 'object' && analysis.raw_result.output) {
      // If output is a string, try to parse it as JSON
      if (typeof analysis.raw_result.output === 'string') {
        try {
          return JSON.parse(analysis.raw_result.output);
        } catch (e) {
          console.error('Error parsing output as JSON:', e);
        }
      } else {
        // Output is already an object
        return analysis.raw_result.output;
      }
    }
    
    // Try direct access if the structure is already at the root level
    if (typeof analysis.raw_result === 'object' && 
        (analysis.raw_result.SelfAwareness || 
         analysis.raw_result.Context || 
         analysis.raw_result.StrategicBigPicture || 
         analysis.raw_result.OverallRiskRating ||
         analysis.raw_result.SummaryOfFindings)) {
      return analysis.raw_result;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting Risk Analysis data:', error);
    return null;
  }
};

// Function to extract confidence from Risk Analysis
const extractRiskConfidenceRating = (riskData: any): string | null => {
  if (!riskData) return null;
  
  if (riskData.SelfAwareness?.ConfidenceLevelRating?.rating) {
    return riskData.SelfAwareness.ConfidenceLevelRating.rating;
  }
  
  return null;
};

// Function to extract overall risk rating from Risk Analysis
const extractRiskOverallRating = (riskData: any): string | null => {
  if (!riskData) return null;
  
  // First try to get it from the dedicated OverallRiskRating object
  if (riskData.OverallRiskRating?.rating) {
    return riskData.OverallRiskRating.rating;
  }
  
  // Fall back to the rating in StrategicBigPicture
  if (riskData.StrategicBigPicture?.OverallRiskScan?.rating) {
    return riskData.StrategicBigPicture.OverallRiskScan.rating;
  }
  
  return null;
};

// Helper function to extract DCA data
const extractDCAData = (analysis: AnalysisResult) => {
  try {
    if (!analysis || !analysis.raw_result) return null;
    
    console.log('Extracting DCA data from:', JSON.stringify(analysis.raw_result, null, 2));
    
    // Handle array format (common in webhook responses)
    if (Array.isArray(analysis.raw_result) && analysis.raw_result[0]?.output) {
      return analysis.raw_result[0].output;
    }
    
    // Handle direct object format with output property
    if (typeof analysis.raw_result === 'object' && analysis.raw_result.output) {
      // If output is a string, try to parse it as JSON
      if (typeof analysis.raw_result.output === 'string') {
        try {
          return JSON.parse(analysis.raw_result.output);
        } catch (e) {
          console.error('Error parsing output as JSON:', e);
        }
      } else {
        // Output is already an object
        return analysis.raw_result.output;
      }
    }
    
    // Try direct access if the structure is already at the root level
    if (typeof analysis.raw_result === 'object' && 
        (analysis.raw_result.SelfAwareness || 
         analysis.raw_result.DeliveryConfidenceAssessment || 
         analysis.raw_result.Context)) {
      return analysis.raw_result;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting DCA data:', error);
    return null;
  }
};

// Function to extract overall rating from DCA
const extractDCAOverallRating = (dcaData: any): string | null => {
  if (!dcaData) return null;
  
  if (dcaData.DeliveryConfidenceAssessment?.overallDeliveryConfidenceRating) {
    return dcaData.DeliveryConfidenceAssessment.overallDeliveryConfidenceRating;
  }
  
  return null;
};

// Helper function to extract Gateway Review data
const extractGatewayReviewData = (analysis: AnalysisResult) => {
  try {
    if (!analysis || !analysis.raw_result) return null;
    
    console.log('Extracting Gateway Review data from:', JSON.stringify(analysis.raw_result, null, 2));
    
    // Handle array format (common in webhook responses)
    if (Array.isArray(analysis.raw_result) && analysis.raw_result[0]?.output) {
      if (typeof analysis.raw_result[0].output === 'string') {
        try {
          return JSON.parse(analysis.raw_result[0].output);
        } catch (e) {
          console.error('Error parsing Gateway Review output as JSON:', e);
          return null;
        }
      } else {
        return analysis.raw_result[0].output;
      }
    }
    
    // Handle direct object format with output property
    if (typeof analysis.raw_result === 'object' && analysis.raw_result.output) {
      if (typeof analysis.raw_result.output === 'string') {
        try {
          return JSON.parse(analysis.raw_result.output);
        } catch (e) {
          console.error('Error parsing Gateway Review output as JSON:', e);
          return null;
        }
      } else {
        return analysis.raw_result.output;
      }
    }
    
    // Try direct access if the structure is already at the root level
    if (typeof analysis.raw_result === 'object' && 
        (analysis.raw_result.SelfAwareness || 
         analysis.raw_result.Context || 
         analysis.raw_result.GatewayReviewAssessment)) {
      return analysis.raw_result;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting Gateway Review data:', error);
    return null;
  }
};

// Function to extract confidence from Gateway Review
const extractGatewayConfidenceRating = (gatewayData: any): string | null => {
  if (!gatewayData) return null;
  
  if (gatewayData.SelfAwareness?.ConfidenceLevelRating?.rating) {
    return gatewayData.SelfAwareness.ConfidenceLevelRating.rating;
  }
  
  return null;
};

// Function to extract overall rating from Gateway Review
const extractGatewayOverallRating = (gatewayData: any): string | null => {
  if (!gatewayData) return null;
  
  if (gatewayData.GatewayReviewAssessment?.overallRating) {
    return gatewayData.GatewayReviewAssessment.overallRating;
  }
  
  return null;
};

// Function to get display name for analysis type with gateway info
const getAnalysisDisplayName = (analysisType: string, analysis: AnalysisResult | undefined): string => {
  if (analysisType === 'Gateway Review' && analysis) {
    const { gatewayType } = extractGatewayInfo(analysis);
    if (gatewayType) {
      return `Gateway Review - ${gatewayType}`;
    }
  }
  return analysisType;
};

// Helper function to extract gateway type from Gateway Review analysis
const extractGatewayInfo = (analysis: AnalysisResult) => {
  try {
    if (!analysis || !analysis.raw_result) return { gatewayType: null };
    
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
    if (!data && typeof analysis.raw_result === 'object' && analysis.raw_result.GatewayReviewAssessment) {
      data = analysis.raw_result;
    }
    
    const gatewayType = data?.GatewayReviewAssessment?.gateway || null;
    return { gatewayType };
  } catch (error) {
    console.error('Error extracting Gateway Review info:', error);
    return { gatewayType: null };
  }
};

const InsightsContent: React.FC<InsightsContentProps> = ({ 
  content, 
  wordTemplate,
  analysisResult,
  analysisHistory,
  projectId
}) => {
  // Analysis types we want to display in the table
  const analysisTypes = [
    'Risk Analysis',
    'Delivery Confidence Assessment',
    'Gateway Review',
    'Hypothesis'
  ];

  return (
    <div className="border border-border p-6 rounded-lg bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Analysis Type</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Overall Rating</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {analysisTypes.map((type) => {
            const analysis = getMostRecentAnalysis(analysisHistory, type);
            const route = getAnalysisRoute(type);
            const displayName = getAnalysisDisplayName(type, analysis);
            
            let confidence = null;
            let rating = null;
            
            if (analysis) {
              const extractedData = extractAnalysisData(analysis);
              confidence = extractedData.confidence;
              rating = extractedData.rating;
            }
            
            return (
              <TableRow key={type}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {getAnalysisIcon(type)}
                    <span>{displayName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {analysis ? (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(analysis.created_at)}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Not yet analyzed</span>
                  )}
                </TableCell>
                <TableCell>
                  {confidence ? (
                    <Badge variant={getConfidenceBadgeVariant(confidence)}>
                      {confidence}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {rating ? (
                    <Badge variant={getRatingBadgeVariant(rating)}>
                      {rating}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {analysis ? (
                    <Link 
                      to={`/reports/${route}/${projectId}/${analysis.id}`}
                      className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      View Report
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground">No report</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {wordTemplate && (
        <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-md">
          <p className="text-sm text-primary">
            Template loaded: <span className="font-medium">{wordTemplate.name}</span> ({(wordTemplate.size / 1024).toFixed(1)} KB)
          </p>
        </div>
      )}
    </div>
  );
};

export default InsightsContent;
