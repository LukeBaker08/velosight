import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AnalysisResult, RiskAssessmentData } from '@/components/project/insights/types';
import { Project } from '@/types/project';
import { Progress } from "@/components/ui/progress";
import { format } from 'date-fns';
import SelfAwarenessSection from '../common/SelfAwarenessSection';
import ProjectContextSection from '../common/ProjectContextSection';
import UnifiedProjectInfoCards from '../common/UnifiedProjectInfoCards';
import { getConfidenceBadgeVariant, formatDimensionKey, getRiskRatingBadgeVariant, extractModelUsed } from '../common/helpers';
import { TrendingUp, Shield, Eye, AlertTriangle, Zap, FileText } from 'lucide-react';

interface RiskAssessmentContentProps {
  analysis: AnalysisResult | null;
  project: Project | null;
}

// Helper function to extract risk assessment data from raw_result
const extractRiskData = (analysis: AnalysisResult | null): RiskAssessmentData | null => {
  if (!analysis || !analysis.raw_result) return null;
  
  try {
    console.log('Raw result type:', typeof analysis.raw_result);
    console.log('Raw result structure:', JSON.stringify(analysis.raw_result, null, 2));
    
    let extractedData = null;
    
    // Handle array format with output field
    if (Array.isArray(analysis.raw_result) && analysis.raw_result.length > 0) {
      const firstItem = analysis.raw_result[0];
      if (firstItem?.output) {
        extractedData = firstItem.output;
      }
    }
    // Handle direct object format
    else if (typeof analysis.raw_result === 'object' && analysis.raw_result?.output) {
      extractedData = analysis.raw_result.output;
    }
    // Handle already extracted format
    else if (typeof analysis.raw_result === 'object') {
      extractedData = analysis.raw_result;
    }
    
    if (!extractedData) {
      console.error('Could not find risk assessment data in raw_result', analysis.raw_result);
      return null;
    }
    
    // Transform the structure to match the expected interface
    const transformedData: RiskAssessmentData = {};
    
    // Map SelfAwareness section
    if (extractedData.SelfAwareness) {
      transformedData.SelfAwareness = {
        EvidenceCompletenessCheck: {
          assessment: extractedData.SelfAwareness.EvidenceCompletenessCheck?.summary,
          missingInformation: extractedData.SelfAwareness.EvidenceCompletenessCheck?.missingInformation
        },
        DocumentationGaps: {
          gaps: extractedData.SelfAwareness.DocumentationGaps?.gaps,
          expectedGaps: extractedData.SelfAwareness.DocumentationGaps?.summary
        },
        ConfidenceLevelRating: {
          rating: extractedData.SelfAwareness.ConfidenceLevelRating?.rating,
          rationale: extractedData.SelfAwareness.ConfidenceLevelRating?.justification
        }
      };
    }
    
    // Map Context section - Updated to handle ProjectOverviewAndContextScan
    if (extractedData.Context?.ProjectOverviewAndContextScan) {
      transformedData.Context = {
        ProjectOverviewAndContextScan: {
          type: extractedData.Context.ProjectOverviewAndContextScan.type,
          objectives: extractedData.Context.ProjectOverviewAndContextScan.objectives || [],
          deliveryApproach: extractedData.Context.ProjectOverviewAndContextScan.deliveryApproach,
          lifecyclePhase: extractedData.Context.ProjectOverviewAndContextScan.lifecyclePhase,
          strategicRelevance: extractedData.Context.ProjectOverviewAndContextScan.strategicRelevance,
          environmentalContext: extractedData.Context.ProjectOverviewAndContextScan.environmentalContext
        }
      };
    }
    
    // Map OverallRiskRating from OverallRating
    if (extractedData.OverallRating) {
      transformedData.OverallRiskRating = {
        rating: extractedData.OverallRating.riskRating,
        rationale: extractedData.OverallRating.justification
      };
    }
    
    // Map StrategicBigPicture
    if (extractedData.StrategicBigPicture) {
      transformedData.StrategicBigPicture = {
        OverallRiskScan: {
          analysis: extractedData.StrategicBigPicture.OverallRiskScan?.summary,
          rating: extractedData.OverallRating?.riskRating // Use overall rating
        },
        AlignmentToStrategicOutcomes: {
          analysis: extractedData.StrategicBigPicture.AlignmentToStrategicOutcomes?.summary
        },
        ReadinessToDeliver: {
          analysis: extractedData.StrategicBigPicture.ReadinessToDeliver?.summary
        }
      };
    }
    
    // Map DomainSpecific (handles both array and object formats)
    if (extractedData.DomainSpecific) {
      transformedData.DomainSpecific = {};
      if (Array.isArray(extractedData.DomainSpecific)) {
        // New schema: array of { domain, summary }
        extractedData.DomainSpecific.forEach((item: any) => {
          if (transformedData.DomainSpecific && item.domain) {
            transformedData.DomainSpecific[item.domain] = {
              analysis: item.summary
            };
          }
        });
      } else {
        // Legacy: object with named keys
        Object.entries(extractedData.DomainSpecific).forEach(([key, value]: [string, any]) => {
          if (transformedData.DomainSpecific) {
            transformedData.DomainSpecific[key] = {
              analysis: value?.summary || value
            };
          }
        });
      }
    }

    // Map ProjectSpecific (handles both array and object formats)
    if (extractedData.ProjectSpecific) {
      transformedData.ProjectSpecific = {};
      if (Array.isArray(extractedData.ProjectSpecific)) {
        // New schema: array of { area, summary }
        extractedData.ProjectSpecific.forEach((item: any) => {
          if (transformedData.ProjectSpecific && item.area) {
            transformedData.ProjectSpecific[item.area] = {
              analysis: item.summary
            };
          }
        });
      } else {
        // Legacy: object with named keys
        Object.entries(extractedData.ProjectSpecific).forEach(([key, value]: [string, any]) => {
          if (transformedData.ProjectSpecific) {
            transformedData.ProjectSpecific[key] = {
              analysis: value?.summary || value
            };
          }
        });
      }
    }
    
    // Map SentimentAnalysis - Updated to include implications
    if (extractedData.SentimentAnalysis) {
      transformedData.SentimentAnalysis = {
        MeetingSentimentAnalysis: {
          analysis: extractedData.SentimentAnalysis.MeetingSentimentAnalysis?.summary,
          implications: extractedData.SentimentAnalysis.MeetingSentimentAnalysis?.implications
        }
      };
    }
    
    // Map EarlyWarningPrompts
    if (extractedData.EarlyWarningPrompts) {
      transformedData.EarlyWarningPrompts = {
        EarlyIndicatorsOfFailure: extractedData.EarlyWarningPrompts.EarlyIndicatorsOfFailure?.signs || [],
        ExternalEnvironmentSensitivities: extractedData.EarlyWarningPrompts.ExternalEnvironmentSensitivities?.sensitivity?.join(', ') || '',
        SpeedToRiskInsight: extractedData.EarlyWarningPrompts.SpeedToRiskInsight?.topRisksRequiringAttention?.map((item: any) => ({
          description: item.description,
          rating: item.rating,
          mitigation: Array.isArray(item.mitigations) ? item.mitigations.join('; ') : item.mitigations
        })) || []
      };
    }
    
    // Map SummaryOfFindingsAndRecommendations to SummaryOfFindings
    if (extractedData.SummaryOfFindingsAndRecommendations?.findings) {
      transformedData.SummaryOfFindings = extractedData.SummaryOfFindingsAndRecommendations.findings.map((finding: any) => ({
        summary: finding.summary,
        source: Array.isArray(finding.sources) ? finding.sources.join(', ') : finding.sources,
        deviation: finding.nature,
        impact: finding.potentialImpact,
        recommendation: finding.recommendation
      }));
    }
    
    console.log('Transformed risk data:', transformedData);
    return transformedData;
  } catch (error) {
    console.error('Error extracting risk assessment data:', error);
    return null;
  }
};


const RiskAssessmentContent: React.FC<RiskAssessmentContentProps> = ({ analysis, project }) => {
  const riskData = extractRiskData(analysis);
  console.log('Extracted risk data:', riskData);
  
  const confidenceRating = riskData?.SelfAwareness?.ConfidenceLevelRating?.rating;
  
  // Get overall risk rating from OverallRiskRating object first, 
  // then fall back to StrategicBigPicture if that's not available
  const overallRiskRating = riskData?.OverallRiskRating?.rating || 
                            riskData?.StrategicBigPicture?.OverallRiskScan?.rating || 
                            "Not Available";
  
  // Get overall risk rationale from OverallRiskRating object first,
  // then fall back to StrategicBigPicture if that's not available
  const overallRiskRationale = riskData?.OverallRiskRating?.rationale || 
                              riskData?.StrategicBigPicture?.OverallRiskScan?.analysis || 
                              null;
  
  // Extract confidence percentage
  let confidencePercentage = 0;
  if (confidenceRating) {
    const match = typeof confidenceRating === 'string' ? confidenceRating.match(/(\d+)%?/) : null;
    if (match && match[1]) {
      confidencePercentage = parseInt(match[1], 10);
    } else if (typeof confidenceRating === 'string') {
      if (confidenceRating.toLowerCase().includes('high')) {
        confidencePercentage = 80;
      } else if (confidenceRating.toLowerCase().includes('medium')) {
        confidencePercentage = 60;
      } else if (confidenceRating.toLowerCase().includes('low')) {
        confidencePercentage = 30;
      }
    }
  }
  
  if (!analysis) return null;
  
  return (
    <div className="space-y-6">
      {/* Project Info Section */}
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

      {/* Project Information Cards - Using unified component */}
      <UnifiedProjectInfoCards
        projectType={riskData?.Context?.ProjectOverviewAndContextScan?.type || 'Digital Transformation'}
        deliveryApproach={riskData?.Context?.ProjectOverviewAndContextScan?.deliveryApproach || ''}
        lifecyclePhase={riskData?.Context?.ProjectOverviewAndContextScan?.lifecyclePhase || ''}
        confidenceRating={confidenceRating}
        confidenceRationale={riskData?.SelfAwareness?.ConfidenceLevelRating?.rationale}
        overallRating={overallRiskRating}
        overallRationale={overallRiskRationale}
        analysis={analysis}
        reportType="risk-assessment"
      />
      
      {/* Self-Awareness Section */}
      {riskData?.SelfAwareness && (
        <SelfAwarenessSection selfAwareness={riskData.SelfAwareness} />
      )}
      
      {/* Project Context Section - Updated to use shared component */}
      {riskData?.Context?.ProjectOverviewAndContextScan && (
        <ProjectContextSection context={{
          ProjectOverview: {
            type: riskData.Context.ProjectOverviewAndContextScan.type,
            deliveryApproach: riskData.Context.ProjectOverviewAndContextScan.deliveryApproach,
            lifecyclePhase: riskData.Context.ProjectOverviewAndContextScan.lifecyclePhase,
            objectives: riskData.Context.ProjectOverviewAndContextScan.objectives,
            strategicRelevance: riskData.Context.ProjectOverviewAndContextScan.strategicRelevance,
            environmentalContext: riskData.Context.ProjectOverviewAndContextScan.environmentalContext
          }
        }} />
      )}
      
      {/* Strategic Assessment */}
      {riskData?.StrategicBigPicture && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Strategic Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(riskData.StrategicBigPicture).map(([key, value], index) => (
              <div key={key}>
                {index > 0 && <Separator className="my-4" />}
                <h3 className="font-semibold mb-2">{formatDimensionKey(key)}</h3>
                <p className="text-sm text-muted-foreground">{value.analysis}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* Domain Specific Risks */}
      {riskData?.DomainSpecific && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-500" />
              Domain Specific Risks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(riskData.DomainSpecific).map(([key, value], index) => (
              <div key={key}>
                {index > 0 && <Separator className="my-4" />}
                <h3 className="font-semibold mb-2">{formatDimensionKey(key)}</h3>
                <p className="text-sm text-muted-foreground">{value.analysis}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* Project Specific Risks - Updated to match Domain section structure */}
      {riskData?.ProjectSpecific && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-500" />
              Project Specific Risks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(riskData.ProjectSpecific).map(([key, value], index) => (
              <div key={key}>
                {index > 0 && <Separator className="my-4" />}
                <h3 className="font-semibold mb-2">{formatDimensionKey(key)}</h3>
                <p className="text-sm text-muted-foreground">{value.analysis}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* Sentiment Analysis - Updated to match Project/Domain section format */}
      {riskData?.SentimentAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-yellow-500" />
              Sentiment Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {riskData.SentimentAnalysis.MeetingSentimentAnalysis?.analysis && (
              <div>
                <h3 className="font-semibold mb-2">Summary</h3>
                <p className="text-sm text-muted-foreground">{riskData.SentimentAnalysis.MeetingSentimentAnalysis.analysis}</p>
              </div>
            )}
            
            {riskData.SentimentAnalysis.MeetingSentimentAnalysis?.implications && (
              <div>
                <Separator className="my-4" />
                <h3 className="font-semibold mb-2">Implications</h3>
                <p className="text-sm text-muted-foreground">{riskData.SentimentAnalysis.MeetingSentimentAnalysis.implications}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Early Warning Indicators */}
      {riskData?.EarlyWarningPrompts && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Early Warning Indicators
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Failure Indicators */}
            {riskData.EarlyWarningPrompts.EarlyIndicatorsOfFailure && (
              <div>
                <h3 className="font-semibold mb-2">Indicators of Failure</h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                  {riskData.EarlyWarningPrompts.EarlyIndicatorsOfFailure.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Environment Sensitivities */}
            {riskData.EarlyWarningPrompts.ExternalEnvironmentSensitivities && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">External Environment Sensitivities</h3>
                <p className="text-sm text-muted-foreground">
                  {riskData.EarlyWarningPrompts.ExternalEnvironmentSensitivities}
                </p>
              </div>
            )}
            
            {/* Speed to Risk Insight */}
            {riskData.EarlyWarningPrompts.SpeedToRiskInsight && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Speed to Risk Insight
                </h3>
                <div className="space-y-3">
                  {riskData.EarlyWarningPrompts.SpeedToRiskInsight.map((item, index) => (
                    <div key={index} className="border rounded-md p-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">{item.description}</span>
                        <Badge variant={getRiskRatingBadgeVariant(item.rating)}>
                          {item.rating}
                        </Badge>
                      </div>
                      {item.mitigation && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Mitigation:</span> {item.mitigation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Summary of Findings - Updated to use the new structure */}
      {riskData?.SummaryOfFindings && riskData.SummaryOfFindings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-500" />
              Summary of Findings & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {riskData.SummaryOfFindings.map((finding, index) => (
                <div key={index} className="border rounded-md p-4">
                  <h3 className="font-semibold mb-2">{finding.summary || 'Finding ' + (index + 1)}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {finding.source && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Source:</span> {finding.source}
                      </div>
                    )}
                    {finding.deviation && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Nature:</span> {finding.deviation}
                      </div>
                    )}
                    {finding.impact && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Potential Impact:</span> {finding.impact}
                      </div>
                    )}
                    {finding.recommendation && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Recommendation:</span> {finding.recommendation}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RiskAssessmentContent;