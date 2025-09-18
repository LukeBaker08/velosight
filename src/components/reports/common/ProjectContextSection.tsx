
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeliveryConfidenceData } from '@/components/project/insights/types';

interface ProjectContextSectionProps {
  context?: DeliveryConfidenceData['Context'];
}

const ProjectContextSection: React.FC<ProjectContextSectionProps> = ({ context }) => {
  if (!context?.ProjectOverview) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Context</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-1">Project Type</h3>
              <p className="text-sm text-muted-foreground">
                {context.ProjectOverview.type || 'Not specified'}
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-1">Delivery Approach</h3>
              <p className="text-sm text-muted-foreground">
                {context.ProjectOverview.deliveryApproach || 'Not specified'}
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-1">Lifecycle Phase</h3>
              <p className="text-sm text-muted-foreground">
                {context.ProjectOverview.lifecyclePhase || 'Not specified'}
              </p>
            </div>
          </div>
          
          {/* Right Column */}
          <div className="space-y-4">
            {context.ProjectOverview.objectives && (
              <div>
                <h3 className="font-semibold mb-1">Project Objectives</h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                  {context.ProjectOverview.objectives.map((objective, index) => (
                    <li key={index}>{objective}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {context.ProjectOverview.strategicRelevance && (
              <div>
                <h3 className="font-semibold mb-1">Strategic Relevance</h3>
                <p className="text-sm text-muted-foreground">
                  {context.ProjectOverview.strategicRelevance}
                </p>
              </div>
            )}
            
            {context.ProjectOverview.environmentalContext && (
              <div>
                <h3 className="font-semibold mb-1">Environmental Context</h3>
                <p className="text-sm text-muted-foreground">
                  {context.ProjectOverview.environmentalContext}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectContextSection;
