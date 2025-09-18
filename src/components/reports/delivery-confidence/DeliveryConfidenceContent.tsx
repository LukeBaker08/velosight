
import React from 'react';
import { format } from 'date-fns';
import { AnalysisResult } from '@/components/project/insights/types';
import { Project } from '@/types/project';
import UnifiedProjectInfoCards from '../common/UnifiedProjectInfoCards';
import SelfAwarenessSection from '../common/SelfAwarenessSection';
import ProjectContextSection from '../common/ProjectContextSection';
import AssessmentSection from './AssessmentSection';
import { extractDCAData } from '../common/helpers';

interface DeliveryConfidenceContentProps {
  analysis: AnalysisResult | null;
  project: Project | null;
}

const DeliveryConfidenceContent: React.FC<DeliveryConfidenceContentProps> = ({ analysis, project }) => {
  if (!analysis) return null;

  // Extract structured data from raw_result
  const dcaData = extractDCAData(analysis.raw_result);
  console.log("Extracted DCA data:", dcaData);
  console.log("DCA Assessment data:", dcaData?.DeliveryConfidenceAssessment);
  console.log("DCA Key Recommendations:", dcaData?.DeliveryConfidenceAssessment?.keyRecommendations);
  
  // Extract confidence rating from the structure
  const confidenceRating = dcaData?.SelfAwareness?.ConfidenceLevelRating?.rating || null;
  const confidenceRationale = dcaData?.SelfAwareness?.ConfidenceLevelRating?.rationale || null;
  
  // Extract overall rating from the structure
  const overallRating = dcaData?.DeliveryConfidenceAssessment?.overallDeliveryConfidenceRating || analysis.rating;
  const overallRationale = dcaData?.DeliveryConfidenceAssessment?.assessmentDimensions?.Overall?.rationale || null;
  
  // Extract project type and approach
  const projectType = dcaData?.Context?.ProjectOverview?.type || 'Not Specified';
  const deliveryApproach = dcaData?.Context?.ProjectOverview?.deliveryApproach || '';
  const lifecyclePhase = dcaData?.Context?.ProjectOverview?.lifecyclePhase || '';
  
  return (
    <div className="space-y-6">
      {/* Last Updated Info */}
      <div>
        {project && analysis && (
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Last updated: {format(new Date(analysis.created_at), 'dd MMM yyyy, HH:mm')}
          </p>
        )}
      </div>

      {/* Project Information Cards */}
      <UnifiedProjectInfoCards
        projectType={projectType}
        deliveryApproach={deliveryApproach}
        lifecyclePhase={lifecyclePhase}
        confidenceRating={confidenceRating}
        confidenceRationale={confidenceRationale}
        overallRating={overallRating}
        overallRationale={overallRationale}
        analysis={analysis}
        reportType="delivery-confidence"
      />

      {/* Self-Awareness Section */}
      {dcaData?.SelfAwareness && (
        <SelfAwarenessSection selfAwareness={dcaData.SelfAwareness} />
      )}

      {/* Project Context Section */}
      {dcaData?.Context && (
        <ProjectContextSection context={dcaData.Context} />
      )}

      {/* Assessment Dimensions Section */}
      {dcaData?.DeliveryConfidenceAssessment && (
        <AssessmentSection assessmentData={dcaData.DeliveryConfidenceAssessment} />
      )}
    </div>
  );
};

export default DeliveryConfidenceContent;
