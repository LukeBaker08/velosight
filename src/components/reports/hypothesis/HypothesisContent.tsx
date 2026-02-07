
import React from 'react';
import { format } from 'date-fns';
import { AnalysisResult } from '@/components/project/insights/types';
import { Project } from '@/types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Lightbulb, FileText, CheckCircle } from 'lucide-react';

interface HypothesisContentProps {
  analysis: AnalysisResult | null;
  project: Project | null;
}

import { extractAnalysisData, getConfidenceBadgeVariant, extractModelUsed } from '../common/helpers';
import SelfAwarenessSection from '../common/SelfAwarenessSection';
import ProjectContextSection from '../common/ProjectContextSection';
import UnifiedProjectInfoCards from '../common/UnifiedProjectInfoCards';

const HypothesisContent: React.FC<HypothesisContentProps> = ({ analysis, project }) => {
  if (!analysis) return null;

  // Extract structured data from raw_result
  const hypothesisData = extractAnalysisData(analysis.raw_result);
  console.log("Extracted Hypothesis data:", hypothesisData);
  
  // Extract confidence rating from the structure
  const confidenceRating = hypothesisData?.SelfAwareness?.ConfidenceLevelRating?.rating || null;
  const confidenceRationale = hypothesisData?.SelfAwareness?.ConfidenceLevelRating?.rationale || null;
  const confidencePercentage = 50;


  
  // Extract project context
  const projectOverview = hypothesisData?.Context?.ProjectOverview || null;
  const hypotheses = hypothesisData?.hypotheses || [];
  const projectType = hypothesisData?.Context?.ProjectOverview?.type || [];
  const deliveryApproach = hypothesisData?.Context?.ProjectOverview?.deliveryApproach || [];
  const lifecyclePhase = hypothesisData?.Context?.ProjectOverview?.lifecyclePhase || [];
  
  
  return (
    <div className="space-y-6">
      {/* Last Updated Info */}
      <div>
        {project && analysis && (
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {extractModelUsed(analysis.raw_result) && (
              <span>Model: {extractModelUsed(analysis.raw_result)} | </span>
            )}
            Last updated: {format(new Date(analysis.created_at), 'dd MMM yyyy, HH:mm')}
          </p>
        )}
      </div>

      {/* Overview Cards - Using unified component */}
      <UnifiedProjectInfoCards
        projectType={projectType}
        deliveryApproach={deliveryApproach}
        lifecyclePhase={lifecyclePhase}
        confidenceRating={confidenceRating}
        confidenceRationale={confidenceRationale}
        analysis={analysis}
        reportType="hypothesis"
        hypothesesCount={hypotheses.length}
      />

      {/* Self-Awareness Section */}
      {hypothesisData?.SelfAwareness && (
        <SelfAwarenessSection selfAwareness={hypothesisData.SelfAwareness} />
      )}

      {/* Project Context */}
      {projectOverview && (
        <ProjectContextSection context={{ ProjectOverview: projectOverview }} />
      )}

      {/* Hypotheses */}
      {hypotheses.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Generated Hypotheses</h2>
          {hypotheses.map((hypothesis, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Lightbulb className="h-5 w-5 text-purple-500" />
                  Hypothesis {index + 1}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Hypothesis Statement */}
                <div>
                  <h4 className="font-semibold mb-2 text-foreground">Statement</h4>
                  <p className="text-sm p-3 rounded-md border text-muted-foreground">
                    {hypothesis.hypothesis_statement}
                  </p>
                </div>

                {/* Rationale */}
                {hypothesis.rationale && (
                  <div>
                    <h4 className="font-semibold mb-2 text-foreground">Rationale</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {hypothesis.rationale.map((reason, reasonIndex) => (
                        <li key={reasonIndex} className="text-sm text-muted-foreground">{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Supporting Evidence */}
                {hypothesis.supporting_evidence && hypothesis.supporting_evidence.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-foreground">Supporting Evidence</h4>
                    <div className="space-y-2">
                      {hypothesis.supporting_evidence.map((evidence, evidenceIndex) => (
                        <div key={evidenceIndex} className="border-l-4 border-blue-200 pl-4">
                          <div className="font-medium text-sm text-foreground">{evidence.document}</div>
                          <div className="text-xs text-muted-foreground">{evidence.reference}</div>
                          <div className="text-sm mt-1 text-muted-foreground">{evidence.note}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Testing and Validation */}
                {hypothesis.testing_and_validation && (
                  <div>
                    <h4 className="font-semibold mb-2 text-foreground">Testing & Validation</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {hypothesis.testing_and_validation.map((test, testIndex) => (
                        <li key={testIndex} className="text-sm text-muted-foreground">{test}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default HypothesisContent;
