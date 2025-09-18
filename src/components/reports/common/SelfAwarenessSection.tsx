
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeliveryConfidenceData } from '@/components/project/insights/types';
import { CheckCircle } from 'lucide-react';

interface SelfAwarenessSectionProps {
  selfAwareness: DeliveryConfidenceData['SelfAwareness'];
}

const SelfAwarenessSection: React.FC<SelfAwarenessSectionProps> = ({ selfAwareness }) => {
  if (!selfAwareness) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-blue-500" />
          Evidence Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {selfAwareness.EvidenceCompletenessCheck?.assessment && (
          <div>
            <h3 className="text-sm font-medium mb-1">Assessment</h3>
            <p className="text-sm text-muted-foreground">
              {selfAwareness.EvidenceCompletenessCheck.assessment}
            </p>
          </div>
        )}
        
        {selfAwareness.EvidenceCompletenessCheck?.missingInformation && 
         selfAwareness.EvidenceCompletenessCheck.missingInformation.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-1">Missing Information</h3>
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              {selfAwareness.EvidenceCompletenessCheck.missingInformation.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Documentation Gaps section with matching structure to DCA report */}
        {selfAwareness.DocumentationGaps && (
          <div>
            <h3 className="text-sm font-medium mb-1">Documentation Gaps</h3>
            {selfAwareness.DocumentationGaps.gaps && 
            selfAwareness.DocumentationGaps.gaps.length > 0 && (
              <div className="mt-2">
                <h4 className="text-xs font-medium mb-1">Identified Gaps</h4>
                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                  {selfAwareness.DocumentationGaps.gaps.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {selfAwareness.DocumentationGaps.expectedGaps && (
              <div className="mt-3">
                <h4 className="text-xs font-medium mb-1">Expected Documentation</h4>
                <p className="text-sm text-muted-foreground">
                  {selfAwareness.DocumentationGaps.expectedGaps}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SelfAwarenessSection;
