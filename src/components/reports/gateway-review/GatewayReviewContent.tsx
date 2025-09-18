
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AnalysisResult } from '@/components/project/insights/types';
import { Project } from '@/types/project';
import { format } from 'date-fns';
import UnifiedProjectInfoCards from '../common/UnifiedProjectInfoCards';
import SelfAwarenessSection from '../common/SelfAwarenessSection';
import ProjectContextSection from '../common/ProjectContextSection';
import { Shield, Lightbulb } from 'lucide-react';

interface GatewayReviewContentProps {
  analysis: AnalysisResult | null;
  project: Project | null;
}

// Helper function to extract Gateway Review data
const extractGatewayReviewData = (analysis: AnalysisResult | null) => {
  if (!analysis || !analysis.raw_result) return null;
  
  try {
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

// Helper function to get assessment rating badge variant - updated for new ratings
const getAssessmentRatingBadgeVariant = (rating: string) => {
  const ratingLower = rating?.toLowerCase();
  if (ratingLower?.includes('green') && !ratingLower?.includes('amber')) return "confidence-high";
  if (ratingLower?.includes('green/amber') || ratingLower?.includes('green-amber')) return "confidence-medium";
  if (ratingLower?.includes('amber') && !ratingLower?.includes('red') && !ratingLower?.includes('green')) return "confidence-medium";
  if (ratingLower?.includes('amber/red') || ratingLower?.includes('amber-red')) return "confidence-low";
  if (ratingLower?.includes('red') && !ratingLower?.includes('amber')) return "destructive";
  return "outline";
};

// Helper function to get priority badge variant
const getPriorityBadgeVariant = (priority: string) => {
  const priorityLower = priority?.toLowerCase();
  if (priorityLower?.includes('critical')) return "destructive";
  if (priorityLower?.includes('essential')) return "confidence-medium";
  if (priorityLower?.includes('recommended')) return "secondary";
  return "outline";
};

// Helper function to format criteria titles by adding spaces before capital letters
const formatCriteriaTitle = (title: string) => {
  return title.replace(/([A-Z])/g, ' $1').trim();
};

const GatewayReviewContent: React.FC<GatewayReviewContentProps> = ({ analysis, project }) => {
  const gatewayData = extractGatewayReviewData(analysis);
  
  if (!analysis || !gatewayData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <p>No Gateway Review data available.</p>
              <p className="text-sm mt-2">Run a Gateway Review analysis to see detailed results here.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract data for the project info cards
  const projectType = gatewayData.Context?.ProjectOverview?.type || 'Not Specified';
  const deliveryApproach = gatewayData.Context?.ProjectOverview?.deliveryApproach || '';
  const lifecyclePhase = gatewayData.Context?.ProjectOverview?.lifecyclePhase || '';
  const confidenceRating = gatewayData.SelfAwareness?.ConfidenceLevelRating?.rating || null;
  const confidenceRationale = gatewayData.SelfAwareness?.ConfidenceLevelRating?.rationale || null;
  const overallRating = gatewayData.GatewayReviewAssessment?.overallRating || null;
  const overallRatingRationale = gatewayData.GatewayReviewAssessment?.overallRatingRationale || null;
  const gatewayType = gatewayData.GatewayReviewAssessment?.gateway || null;

  return (
    <div className="space-y-6">
      {/* Project Info Section */}
      <div>
        {project && analysis && (
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Last updated: {format(new Date(analysis.created_at), 'dd MMM yyyy, HH:mm')}
          </p>
        )}
      </div>

      {/* Project Info Cards - Using the shared component */}
      <UnifiedProjectInfoCards
        projectType={projectType}
        deliveryApproach={deliveryApproach}
        lifecyclePhase={lifecyclePhase}
        confidenceRating={confidenceRating}
        confidenceRationale={confidenceRationale}
        overallRating={overallRating}
        overallRationale={overallRatingRationale}
        analysis={analysis}
        reportType="gateway-review"
      />

      {/* Self-Awareness Section */}
      {gatewayData.SelfAwareness && (
        <SelfAwarenessSection selfAwareness={gatewayData.SelfAwareness} />
      )}

      {/* Project Context Section */}
      {gatewayData.Context?.ProjectOverview && (
        <ProjectContextSection context={{ ProjectOverview: gatewayData.Context.ProjectOverview }} />
      )}

      {/* Gateway Review Assessment */}
      {gatewayData.GatewayReviewAssessment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              Gateway Review Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm mb-1">Gateway Type</h4>
                <p className="text-sm text-muted-foreground">{gatewayData.GatewayReviewAssessment.gateway}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Overall Rating</h4>
                <Badge variant="confidence-medium">
                  {gatewayData.GatewayReviewAssessment.overallRating}
                </Badge>
              </div>
            </div>

            {/* Overall Rating Rationale */}
            {overallRatingRationale && (
              <div>
                <h4 className="font-medium text-sm mb-2">Overall Rating Rationale</h4>
                <p className="text-sm text-muted-foreground">{overallRatingRationale}</p>
              </div>
            )}

            {/* Gateway Criteria - Moved here between rationale and recommendations */}
            {gatewayData.GatewayReviewAssessment.gatewayCriteria && (
              <div>
                <Separator className="my-4" />
                <h4 className="font-medium text-sm mb-3">Gateway Criteria Assessment</h4>
                <div className="space-y-3">
                  {Object.entries(gatewayData.GatewayReviewAssessment.gatewayCriteria)
                    .filter(([key]) => key !== '*') // Filter out the template entry
                    .map(([key, criteria]: [string, any], index: number) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-medium text-sm">{formatCriteriaTitle(key)}</h5>
                        <Badge variant={getAssessmentRatingBadgeVariant(criteria.rating)}>
                          {criteria.rating}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{criteria.rationale}</p>
                      {criteria.weakSignals && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-bold">Weak Signals:</span> {criteria.weakSignals}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Recommendations - Now appears after gateway criteria */}
            {gatewayData.GatewayReviewAssessment.keyRecommendations && (
              <div>
                <Separator className="my-4" />
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  Key Recommendations
                </h4>
                <div className="space-y-3">
                  {gatewayData.GatewayReviewAssessment.keyRecommendations.map((rec: any, index: number) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getPriorityBadgeVariant(rec.priority)}>
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GatewayReviewContent;
