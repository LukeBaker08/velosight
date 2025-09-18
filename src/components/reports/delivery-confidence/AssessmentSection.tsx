
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeliveryConfidenceData } from '@/components/project/insights/types';
import { getConfidenceBadgeVariant, formatDimensionKey } from '../common/helpers';
import { Target } from 'lucide-react';

interface AssessmentSectionProps {
  assessmentData?: DeliveryConfidenceData['DeliveryConfidenceAssessment'];
}

const AssessmentSection: React.FC<AssessmentSectionProps> = ({ assessmentData }) => {
  console.log('AssessmentSection - assessmentData:', assessmentData);
  console.log('AssessmentSection - keyRecommendations:', assessmentData?.keyRecommendations);
  
  if (!assessmentData?.assessmentDimensions) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-purple-500" />
          Delivery Confidence Assessment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(assessmentData.assessmentDimensions).map(([key, dimension]) => {
            if (!dimension || typeof dimension !== 'object') return null;
            
            return (
              <div key={key} className="border-b pb-4 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{formatDimensionKey(key)}</h3>
                  <Badge variant={getConfidenceBadgeVariant(dimension.rating || null)}>
                    {dimension.rating || 'Not Rated'}
                  </Badge>
                </div>
                {dimension.rationale && (
                  <p className="text-sm text-muted-foreground">{dimension.rationale}</p>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Key Recommendations Section */}
        {assessmentData.keyRecommendations && assessmentData.keyRecommendations.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold mb-3">Key Recommendations</h3>
            <ul className="list-disc pl-5 space-y-2">
              {assessmentData.keyRecommendations.map((recommendation, index) => (
                <li key={index} className="text-sm leading-relaxed">{recommendation}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Debug info for recommendations */}
        {!assessmentData.keyRecommendations && (
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-muted-foreground italic">No recommendations found in assessment data</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AssessmentSection;
