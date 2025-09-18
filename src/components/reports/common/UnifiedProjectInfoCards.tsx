import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AnalysisResult } from '@/components/project/insights/types';
import { getConfidenceBadgeVariant, extractConfidencePercentage } from './helpers';

interface UnifiedProjectInfoCardsProps {
  projectType: string;
  deliveryApproach: string;
  lifecyclePhase: string;
  confidenceRating: string | null;
  confidenceRationale: string | null;
  analysis: AnalysisResult | null;
  reportType: 'delivery-confidence' | 'gateway-review' | 'risk-assessment' | 'hypothesis';
  // For overall rating reports (DCA, Gateway, Risk)
  overallRating?: string | null;
  overallRationale?: string | null;
  // For hypothesis reports
  hypothesesCount?: number;
}

const UnifiedProjectInfoCards: React.FC<UnifiedProjectInfoCardsProps> = ({
  projectType,
  deliveryApproach,
  lifecyclePhase,
  confidenceRating,
  confidenceRationale,
  analysis,
  reportType,
  overallRating,
  overallRationale,
  hypothesesCount = 0
}) => {
  // Calculate confidence percentage from rating
  const confidencePercentage = extractConfidencePercentage(confidenceRating);
  
  const renderThirdCard = () => {
    switch (reportType) {
      case 'hypothesis':
        return (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Hypotheses Generated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {hypothesesCount}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Total hypotheses
              </div>
            </CardContent>
          </Card>
        );
      
      case 'risk-assessment':
        return (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Overall Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <div>
                  <Badge variant={getConfidenceBadgeVariant(overallRating)} className="text-lg px-2 py-1">
                    {overallRating || 'Not Available'}
                  </Badge>
                </div>
                {overallRationale && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {overallRationale}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      
      default: // delivery-confidence, gateway-review
        return (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Overall Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <div>
                  <Badge variant={getConfidenceBadgeVariant(overallRating)} className="text-lg px-2 py-1">
                    {overallRating || 'Not Available'}
                  </Badge>
                </div>
                {overallRationale && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {overallRationale}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Project Type */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Project Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-semibold">
            {projectType}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {deliveryApproach}
            {lifecyclePhase && (
              <span> | {lifecyclePhase}</span>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Confidence Level */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Confidence Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <div>
              <Badge 
                variant={getConfidenceBadgeVariant(confidenceRating)} 
                className="text-lg px-2 py-1"
              >
                {confidenceRating || analysis?.confidence || 'N/A'}
              </Badge>
            </div>
            {confidencePercentage > 0 && (
              <Progress value={confidencePercentage} className="h-2 mt-1" />
            )}
            {confidenceRationale && (
              <p className="text-sm text-muted-foreground mt-2">
                {confidenceRationale}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Dynamic Third Card */}
      {renderThirdCard()}
    </div>
  );
};

export default UnifiedProjectInfoCards;