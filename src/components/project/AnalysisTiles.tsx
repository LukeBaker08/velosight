import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CheckCircle, Milestone, AlertTriangle, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import { useParams, useNavigate } from 'react-router-dom';
import { extractDCAData, extractConfidenceRating, extractOverallRating } from '@/lib/utils';
import GatewayReviewModal from './GatewayReviewModal';
import { webhookService } from '@/services/webhookService';

interface AnalysisTilesProps {
  onAnalysisComplete: (results: any) => void;
  setIsProcessing: (isProcessing: boolean) => void;
}

interface AnalysisTile {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  analysisContent: string;
  eventType: string;
  comingSoon?: boolean;
}

const analysisTiles: AnalysisTile[] = [
  {
    id: 'risk-analysis',
    title: 'Risk Analysis',
    description: 'Analyse project risks and identify potential issues.',
    icon: <Shield className="h-10 w-10 text-amber-500" />,
    analysisContent: 'undertake a risk analysis on the project',
    eventType: 'analysis.risk'
  },
  {
    id: 'delivery-confidence',
    title: 'Delivery Confidence Assessment',
    description: 'Assess the confidence level in project delivery.',
    icon: <CheckCircle className="h-10 w-10 text-green-500" />,
    analysisContent: 'undertake a DCA on the project',
    eventType: 'analysis.delivery-confidence'
  },
  {
    id: 'gateway-review',
    title: 'Gateway Review',
    description: 'Conduct a Gateway Review of the project status.',
    icon: <Milestone className="h-10 w-10 text-blue-500" />,
    analysisContent: 'undertake a gateway review on the project',
    eventType: 'analysis.gateway-review'
  },
  {
    id: 'hypothesis',
    title: 'Hypothesis',
    description: 'Generate and test project hypotheses.',
    icon: <Lightbulb className="h-10 w-10 text-purple-500" />,
    analysisContent: 'generate hypotheses for the project',
    eventType: 'analysis.hypothesis',
    comingSoon: false
  }
];

// Function to generate a session ID
const generateSessionId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Helper function to extract Gateway Review data
const extractGatewayReviewData = (result: any) => {
  try {
    if (!result) return null;
    
    console.log('Extracting Gateway Review data from:', JSON.stringify(result, null, 2));
    
    // Handle array format (common in webhook responses)
    if (Array.isArray(result) && result[0]?.output) {
      // Try to parse the output as JSON
      if (typeof result[0].output === 'string') {
        try {
          return JSON.parse(result[0].output);
        } catch (e) {
          console.error('Error parsing Gateway Review output as JSON:', e);
          return null;
        }
      } else {
        return result[0].output;
      }
    }
    
    // Handle direct object format with output property
    if (typeof result === 'object' && result.output) {
      if (typeof result.output === 'string') {
        try {
          return JSON.parse(result.output);
        } catch (e) {
          console.error('Error parsing Gateway Review output as JSON:', e);
          return null;
        }
      } else {
        return result.output;
      }
    }
    
    // Try direct access if the structure is already at the root level
    if (typeof result === 'object' && 
        (result.SelfAwareness || 
         result.Context || 
         result.GatewayReviewAssessment)) {
      return result;
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

// Helper function to extract Hypothesis data
const extractHypothesisData = (result: any) => {
  try {
    if (!result) return null;
    
    console.log('Extracting Hypothesis data from:', JSON.stringify(result, null, 2));
    
    // Handle array format (common in webhook responses)
    if (Array.isArray(result) && result[0]?.output) {
      if (typeof result[0].output === 'string') {
        try {
          return JSON.parse(result[0].output);
        } catch (e) {
          console.error('Error parsing Hypothesis output as JSON:', e);
          return null;
        }
      } else {
        return result[0].output;
      }
    }
    
    // Handle direct object format with output property
    if (typeof result === 'object' && result.output) {
      if (typeof result.output === 'string') {
        try {
          return JSON.parse(result.output);
        } catch (e) {
          console.error('Error parsing Hypothesis output as JSON:', e);
          return null;
        }
      } else {
        return result.output;
      }
    }
    
    // Try direct access if the structure is already at the root level
    if (typeof result === 'object' && 
        (result.SelfAwareness || 
         result.Context || 
         result.hypotheses)) {
      return result;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting Hypothesis data:', error);
    return null;
  }
};

// Function to extract confidence from Hypothesis
const extractHypothesisConfidenceRating = (hypothesisData: any): string | null => {
  if (!hypothesisData) return null;
  
  if (hypothesisData.SelfAwareness?.ConfidenceLevelRating?.rating) {
    return hypothesisData.SelfAwareness.ConfidenceLevelRating.rating;
  }
  
  return null;
};

// Helper function to get report URL based on analysis type
const getReportUrl = (tileId: string, projectId: string, analysisId: string): string => {
  switch (tileId) {
    case 'delivery-confidence':
      return `/reports/delivery-confidence-assessment/${projectId}/${analysisId}`;
    case 'risk-analysis':
      return `/reports/risk-assessment/${projectId}/${analysisId}`;
    case 'gateway-review':
      return `/reports/gateway-review/${projectId}/${analysisId}`;
    case 'hypothesis':
      return `/reports/hypothesis/${projectId}/${analysisId}`;
    default:
      return `/reports/custom-analysis/${projectId}/${analysisId}`;
  }
};

const AnalysisTiles: React.FC<AnalysisTilesProps> = ({ onAnalysisComplete, setIsProcessing }) => {
  const [processingTiles, setProcessingTiles] = useState<Record<string, boolean>>({});
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<string>('');
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const handleRunAnalysis = async (tile: AnalysisTile, gatewayType?: string) => {
    // Set processing state for this specific tile
    setProcessingTiles(prev => ({ ...prev, [tile.id]: true }));
    setIsProcessing(true);
    setCurrentAnalysis(tile.title);
    setShowAnalysisModal(true);
    
    const maxRetries = 2;
    let retries = 0;
    
    while (retries <= maxRetries) {
      try {
        // Get webhook URL dynamically from the service
        const webhookUrl = await webhookService.getWebhookUrl(tile.eventType);
        
        if (!webhookUrl) {
          throw new Error(`No webhook URL found for event type: ${tile.eventType}`);
        }
        
        // Create a new URL with the webhook URL specific to this analysis type
        const url = new URL(webhookUrl);
        
        // Add query parameters including project_id
        url.searchParams.append('session', generateSessionId());
        url.searchParams.append('analysisType', tile.id);
        url.searchParams.append('content', tile.analysisContent);
        
        // Add project_id to all webhook calls
        if (projectId) {
          url.searchParams.append('project_id', projectId);
        }
        
        // Add gateway type if provided
        if (gatewayType) {
          url.searchParams.append('gatewayType', gatewayType);
        }
        
        // Increase timeout to 120 seconds
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout - the server is taking too long to respond')), 120000)
        );
        
        const fetchPromise = fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        // Race between fetch and timeout
        const response: Response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

        if (response.ok) {
          let result;
          const contentType = response.headers.get('content-type');
          
          if (contentType && contentType.includes('application/json')) {
            result = await response.json();
          } else {
            const text = await response.text();
            // Return text response as is without trying to parse as JSON
            result = { output: text, rawFormat: true };
          }
          
          // Add the analysis type to the result
          if (Array.isArray(result)) {
            result[0].analysisType = tile.title;
          } else {
            result.analysisType = tile.title;
          }
          
          console.log('Full API response received:', JSON.stringify(result, null, 2));
          
          // Save the analysis result to the database
          if (projectId) {
            try {
              // Store the complete raw result
              const rawOutput = result;
              
              // Extract confidence and rating based on analysis type
              let confidence = null;
              let rating = null;
              let analysisSubtype = null;
              
              if (tile.id === 'delivery-confidence') {
                // For DCA, extract from the new structured output
                try {
                  console.log("Processing DCA specific extraction");
                  
                  // Extract DCA data using utility function
                  const dcaData = extractDCAData(result);
                  console.log("Extracted DCA data:", dcaData);
                  
                  if (dcaData) {
                    // Get confidence rating and overall rating
                    confidence = extractConfidenceRating(dcaData);
                    rating = extractOverallRating(dcaData);
                    
                    console.log("Extracted confidence:", confidence);
                    console.log("Extracted rating:", rating);
                  }
                  
                  // Fallback to default values if extraction failed
                  if (!confidence) confidence = 'Medium';
                  if (!rating) rating = '';
                  
                } catch (parseError) {
                  console.error('Error extracting DCA data:', parseError);
                  // Use fallback values
                  confidence = 'Medium';
                  rating = '';
                }
              } else if (tile.id === 'gateway-review') {
                // For Gateway Review, extract from the new structured output
                try {
                  console.log("Processing Gateway Review specific extraction");
                  
                  // Extract Gateway Review data
                  const gatewayData = extractGatewayReviewData(result);
                  console.log("Extracted Gateway Review data:", gatewayData);
                  
                  if (gatewayData) {
                    // Get confidence rating and overall rating
                    confidence = extractGatewayConfidenceRating(gatewayData);
                    rating = extractGatewayOverallRating(gatewayData);
                    
                    // Extract the gateway type for analysis_subtype
                    analysisSubtype = gatewayData.GatewayReviewAssessment?.gateway || gatewayType;
                    
                    console.log("Extracted Gateway confidence:", confidence);
                    console.log("Extracted Gateway rating:", rating);
                    console.log("Extracted Gateway subtype:", analysisSubtype);
                  }
                  
                  // Fallback to default values if extraction failed
                  if (!confidence) confidence = 'Medium';
                  if (!rating) rating = '';
                  if (!analysisSubtype && gatewayType) analysisSubtype = gatewayType;
                  
                } catch (parseError) {
                  console.error('Error extracting Gateway Review data:', parseError);
                  // Use fallback values
                  confidence = 'Medium';
                  rating = '';
                  analysisSubtype = gatewayType;
                }
              } else if (tile.id === 'hypothesis') {
                // For Hypothesis, extract from the new structured output
                try {
                  console.log("Processing Hypothesis specific extraction");
                  
                  // Extract Hypothesis data
                  const hypothesisData = extractHypothesisData(result);
                  console.log("Extracted Hypothesis data:", hypothesisData);
                  
                  if (hypothesisData) {
                    // Get confidence rating
                    confidence = extractHypothesisConfidenceRating(hypothesisData);
                    rating = 'Generated'; // Default rating for hypothesis
                    
                    console.log("Extracted Hypothesis confidence:", confidence);
                  }
                  
                  // Fallback to default values if extraction failed
                  if (!confidence) confidence = 'Medium';
                  if (!rating) rating = 'Generated';
                  
                } catch (parseError) {
                  console.error('Error extracting Hypothesis data:', parseError);
                  // Use fallback values
                  confidence = 'Medium';
                  rating = 'Generated';
                }
              } else {
                // For other analysis types, use previous extraction logic
                if (Array.isArray(result) && result[0]?.output) {
                  // Extract output from the result array
                  let analysisContent = '';
                  
                  // Try to parse the output as JSON if it looks like JSON
                  try {
                    // Find JSON content between triple backticks if present
                    const jsonMatch = typeof result[0].output === 'string' ? result[0].output.match(/```json\n([\s\S]*?)\n```/) : null;
                    if (jsonMatch && jsonMatch[1]) {
                      const parsedJson = JSON.parse(jsonMatch[1]);
                      confidence = parsedJson.confidence || 'Medium';
                      rating = parsedJson.rating || '';
                    }
                  } catch (parseError) {
                    console.log('Output is not JSON or failed to parse:', parseError);
                    // Continue with the raw output
                  }
                } else if (typeof result === 'object') {
                  // Handle simple object response
                  confidence = result.confidence || result.insightConfidence || 'Medium';
                  rating = result.rating || '';
                }
              }
              
              console.log('Saving analysis to database with:', {
                project_id: projectId,
                analysis_type: tile.title,
                analysis_subtype: analysisSubtype,
                confidence,
                rating,
                raw_result: rawOutput
              });
              
              // Save to database using our updated schema
              const { data: insertedData, error } = await supabase
                .from('analysis_results')
                .insert({
                  project_id: projectId,
                  analysis_type: tile.title,
                  analysis_subtype: analysisSubtype,
                  confidence,
                  overall_rating: rating,
                  raw_result: rawOutput
                })
                .select()
                .single();
                
              if (error) {
                console.error('Supabase error when saving:', error);
                throw error;
              }
              
              console.log('Analysis result saved to database:', insertedData);
              
              // Reset processing states
              setProcessingTiles(prev => ({ ...prev, [tile.id]: false }));
              setIsProcessing(false);
              setShowAnalysisModal(false);
              
              // Redirect to the appropriate report page
              if (insertedData?.id) {
                const reportUrl = getReportUrl(tile.id, projectId, insertedData.id);
                toast.success(`${tile.title} completed! Redirecting to report...`);
                navigate(reportUrl);
                return; // Exit early since we're redirecting
              }
              
            } catch (dbError) {
              console.error('Error saving to database:', dbError);
              // Continue with the flow even if DB save fails
              // Reset processing states
              setProcessingTiles(prev => ({ ...prev, [tile.id]: false }));
              setIsProcessing(false);
              setShowAnalysisModal(false);
              
              toast.error(`${tile.title} completed but failed to save to database`);
            }
          }
          
          // Fallback - if we reach here, something went wrong with DB save but analysis completed
          // Reset processing states
          setProcessingTiles(prev => ({ ...prev, [tile.id]: false }));
          setIsProcessing(false);
          setShowAnalysisModal(false);
          
          toast.success(`${tile.title} completed successfully!`);
          onAnalysisComplete(result);
          return; // Success, exit the retry loop
        } else {
          const errorText = await response.text();
          console.error('Error response from webhook:', response.status, errorText);
          throw new Error(`Server responded with status: ${response.status}. ${errorText}`);
        }
      } catch (error) {
        console.error(`Analysis error (attempt ${retries + 1}/${maxRetries + 1}):`, error);
        
        retries++;
        
        if (retries > maxRetries) {
          // All retries failed
          toast.error(`${tile.title} failed after ${maxRetries + 1} attempts`, {
            description: error instanceof Error ? error.message : 'Network error'
          });
          
          // Reset processing state
          setProcessingTiles(prev => ({ ...prev, [tile.id]: false }));
          setIsProcessing(false);
          setShowAnalysisModal(false);
          
          onAnalysisComplete({
            error: true,
            message: `Error running ${tile.title}: ${error instanceof Error ? error.message : 'Network error'}`,
            analysisType: tile.title
          });
          return;
        } else {
          // Retry after a short delay
          toast.warning(`Retrying ${tile.title}... (${retries}/${maxRetries})`, {
            description: error instanceof Error ? error.message : 'Network error'
          });
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
        }
      }
    }
  };

  const handleTileClick = (tile: AnalysisTile) => {
    if (tile.comingSoon) {
      toast.info(`${tile.title} is coming soon!`);
      return;
    }
    
    if (tile.id === 'gateway-review') {
      setShowGatewayModal(true);
    } else {
      handleRunAnalysis(tile);
    }
  };

  const handleGatewaySubmit = (gatewayType: string) => {
    const gatewayTile = analysisTiles.find(tile => tile.id === 'gateway-review');
    if (gatewayTile) {
      handleRunAnalysis(gatewayTile, gatewayType);
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Quick Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {analysisTiles.map((tile) => (
              <Button
                key={tile.id}
                variant="outline"
                className={`h-auto p-6 flex flex-col items-center justify-center text-center space-y-3 hover:bg-muted ${
                  tile.comingSoon ? 'opacity-60 cursor-default' : ''
                }`}
                onClick={() => handleTileClick(tile)}
                disabled={processingTiles[tile.id] || tile.comingSoon}
              >
                <div className="mb-3 relative">
                  {processingTiles[tile.id] ? (
                    <div className="animate-spin">
                      <AlertTriangle className="h-10 w-10 text-amber-500" />
                    </div>
                  ) : (
                    tile.icon
                  )}
                  {tile.comingSoon && (
                    <div className="absolute -top-2 -right-2">
                      <Lightbulb className="h-4 w-4 text-yellow-500" />
                    </div>
                  )}
                </div>
                <div className="font-medium text-lg break-words">{tile.title}</div>
                <div className="text-sm text-muted-foreground break-words whitespace-normal">
                  {tile.comingSoon ? 'Coming Soon' : tile.description}
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Analysis Processing Modal */}
      <Dialog open={showAnalysisModal} onOpenChange={setShowAnalysisModal}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin mb-4">
              <AlertTriangle className="h-12 w-12 text-amber-500" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Analysis in Progress</h3>
            <p className="text-center text-muted-foreground">
              {currentAnalysis} is being performed. This may take a minute or two.
              <br />Please don't close this window.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gateway Review Modal */}
      <GatewayReviewModal
        isOpen={showGatewayModal}
        onClose={() => setShowGatewayModal(false)}
        onSubmit={handleGatewaySubmit}
      />
    </>
  );
};

export default AnalysisTiles;
