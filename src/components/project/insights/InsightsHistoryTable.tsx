import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Eye, Check, Trash2 } from 'lucide-react';
import { AnalysisResult } from './types';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '@/utils/dateUtils';

interface InsightsHistoryTableProps {
  analysisHistory: AnalysisResult[];
  projectId: string;
  onAnalysisSelect: (analysis: AnalysisResult) => void;
  onAnalysisDeleted: () => void;
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

const InsightsHistoryTable: React.FC<InsightsHistoryTableProps> = ({
  analysisHistory,
  projectId,
  onAnalysisSelect,
  onAnalysisDeleted,
}) => {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const handleDeleteAnalysis = async (analysisId: string) => {
    if (!confirm('Are you sure you want to delete this analysis?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('analysis_results')
        .delete()
        .eq('id', analysisId);

      if (error) {
        console.error('Error deleting analysis:', error);
        toast.error('Failed to delete analysis');
        return;
      }

      toast.success('Analysis deleted successfully');
      onAnalysisDeleted();
    } catch (error) {
      console.error('Error deleting analysis:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleFinalizeAnalysis = async (analysisId: string) => {
    setProcessingIds(prev => new Set(prev).add(analysisId));
    
    try {
      const { error } = await supabase
        .from('analysis_results')
        .update({ status: 'final' })
        .eq('id', analysisId);

      if (error) {
        console.error('Error finalizing analysis:', error);
        toast.error('Failed to finalize analysis');
        return;
      }

      toast.success('Analysis finalized successfully');
      onAnalysisDeleted(); // Refresh the data
    } catch (error) {
      console.error('Error finalizing analysis:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(analysisId);
        return newSet;
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'final':
        return 'default';
      case 'draft':
        return 'secondary';
      default:
        return 'outline';
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

  // Helper function to get rating badge variant - updated for Gateway Review and Risk Analysis ratings
  const getRatingBadgeVariant = (rating: string | number | null, analysisType: string) => {
    if (!rating) return "outline";
    
    // Convert to string if it's a number
    const ratingStr = typeof rating === 'string' ? rating : String(rating);
    const ratingLower = ratingStr.toLowerCase();
    
    // Special handling for Gateway Review ratings
    if (analysisType === 'Gateway Review') {
      if (ratingLower?.includes('green') && !ratingLower?.includes('amber')) return "confidence-high";
      if (ratingLower?.includes('green/amber') || ratingLower?.includes('green-amber')) return "confidence-medium";
      if (ratingLower?.includes('amber') && !ratingLower?.includes('red') && !ratingLower?.includes('green')) return "confidence-medium";
      if (ratingLower?.includes('amber/red') || ratingLower?.includes('amber-red')) return "confidence-low";
      if (ratingLower?.includes('red') && !ratingLower?.includes('amber')) return "destructive";
    } 
    // Special handling for Risk Analysis ratings - updated for moderate
    else if (analysisType === 'Risk Analysis') {
      if (ratingLower?.includes('low')) return "confidence-high"; // Low risk = green
      if (ratingLower?.includes('moderate') || ratingLower?.includes('medium')) return "confidence-medium"; // Moderate risk = amber
      if (ratingLower?.includes('high')) return "confidence-low"; // High risk = red
    } 
    else {
      // Standard rating logic for other analysis types
      if (ratingLower.includes('high') || ratingLower.includes('good')) return "confidence-high";
      if (ratingLower.includes('medium') || ratingLower.includes('satisfactory')) return "confidence-medium";
      if (ratingLower.includes('low') || ratingLower.includes('poor')) return "confidence-low";
    }
    
    return "outline";
  };

  // Helper function to get the display name for analysis type
  const getAnalysisDisplayName = (analysis: AnalysisResult): string => {
    const baseType = analysis.analysis_type;
    
    // If there's an analysis_subtype, concatenate it with the base type
    if (analysis.analysis_subtype) {
      return `${baseType} - ${analysis.analysis_subtype}`;
    }
    
    return baseType;
  };

  const getReportUrl = (analysis: AnalysisResult) => {
    // Fixed to match the actual routes in App.tsx
    switch (analysis.analysis_type) {
      case 'Delivery Confidence Assessment':
        return `/reports/delivery-confidence-assessment/${projectId}/${analysis.id}`;
      case 'Risk Analysis':
        return `/reports/risk-assessment/${projectId}/${analysis.id}`;
      case 'Gateway Review':
        return `/reports/gateway-review/${projectId}/${analysis.id}`;
      case 'Hypothesis':
        return `/reports/hypothesis/${projectId}/${analysis.id}`;
      case 'Custom Prompt Analysis':
      case 'Custom Analysis':
        return `/reports/custom-analysis/${projectId}/${analysis.id}`;
      default:
        // For any other custom analysis types, use the custom analysis route
        if (analysis.analysis_type.toLowerCase().includes('custom') || 
            analysis.analysis_type.toLowerCase().includes('prompt')) {
          return `/reports/custom-analysis/${projectId}/${analysis.id}`;
        }
        // Default fallback - use delivery confidence assessment route
        return `/reports/delivery-confidence-assessment/${projectId}/${analysis.id}`;
    }
  };

  const handleViewReport = (analysis: AnalysisResult) => {
    const url = getReportUrl(analysis);
    navigate(url);
  };

  if (!analysisHistory.length) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>No analysis history available.</p>
        <p className="text-sm mt-2">Run an analysis to see results here.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Analysis Type</TableHead>
          <TableHead>Date Created</TableHead>
          <TableHead>Confidence</TableHead>
          <TableHead>Rating</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {analysisHistory.map((analysis) => {
          const { confidence, rating } = extractAnalysisData(analysis);
          
          return (
            <TableRow key={analysis.id}>
              <TableCell className="font-medium">
                {getAnalysisDisplayName(analysis)}
              </TableCell>
              <TableCell>
                {formatDate(analysis.created_at)}
              </TableCell>
              <TableCell>
                <Badge variant={getConfidenceBadgeVariant(confidence)}>
                  {confidence || 'N/A'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={getRatingBadgeVariant(rating, analysis.analysis_type)}>
                  {rating || 'N/A'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(analysis.status)}>
                  {analysis.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewReport(analysis)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {analysis.status === 'draft' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFinalizeAnalysis(analysis.id)}
                      disabled={processingIds.has(analysis.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAnalysis(analysis.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default InsightsHistoryTable;
