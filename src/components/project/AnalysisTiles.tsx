import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CheckCircle, Milestone, AlertTriangle, Lightbulb, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useParams, useNavigate } from 'react-router-dom';
import GatewayReviewModal from './GatewayReviewModal';
import { analysisWebhooks, AnalysisTypeConfig } from '@/lib/webhooks';

interface AnalysisTilesProps {
  onAnalysisComplete: (results: any) => void;
  setIsProcessing: (isProcessing: boolean) => void;
}

// Icon mapping from string names to Lucide components
const iconMap: Record<string, React.ReactNode> = {
  'Shield': <Shield className="h-10 w-10" />,
  'CheckCircle': <CheckCircle className="h-10 w-10" />,
  'Milestone': <Milestone className="h-10 w-10" />,
  'Lightbulb': <Lightbulb className="h-10 w-10" />,
  'AlertTriangle': <AlertTriangle className="h-10 w-10" />
};

// Color mapping from Tailwind classes
const colorMap: Record<string, string> = {
  'amber-500': 'text-amber-500',
  'green-500': 'text-green-500',
  'blue-500': 'text-blue-500',
  'purple-500': 'text-purple-500',
  'red-500': 'text-red-500'
};

// Helper function to get report URL based on analysis type
const getReportUrl = (analysisKey: string, projectId: string, analysisId: string): string => {
  switch (analysisKey) {
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
  const [analysisTypes, setAnalysisTypes] = useState<AnalysisTypeConfig[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch analysis types on mount
  useEffect(() => {
    async function fetchAnalysisTypes() {
      try {
        const response = await analysisWebhooks.getTypes();
        console.log('Analysis types response:', response);

        if (response.success && response.data) {
          // Backend returns { success, data: [...] } and callWebhook wraps it
          // So response.data could be the array or { success, data: [...] }
          const types = Array.isArray(response.data)
            ? response.data
            : (response.data as any).data || [];
          // Filter out custom-prompt — it's handled by the PromptPanel
          setAnalysisTypes(types.filter((t: AnalysisTypeConfig) => t.key !== 'custom-prompt'));
        } else {
          console.error('Failed to fetch analysis types:', response.error);
          toast.error('Failed to load analysis types');
        }
      } catch (error) {
        console.error('Error fetching analysis types:', error);
      } finally {
        setLoadingTypes(false);
      }
    }

    fetchAnalysisTypes();
  }, []);

  const handleRunAnalysis = async (analysisType: AnalysisTypeConfig, subtype?: string) => {
    if (!projectId) {
      toast.error('No project selected');
      return;
    }

    // Set processing state for this specific tile
    setProcessingTiles(prev => ({ ...prev, [analysisType.key]: true }));
    setIsProcessing(true);
    setCurrentAnalysis(analysisType.name);
    setShowAnalysisModal(true);

    try {
      console.log(`Running analysis: ${analysisType.key} for project ${projectId}`);

      // Call the unified analysis endpoint
      const response = await analysisWebhooks.run(
        projectId,
        analysisType.key,
        {
          query: `Perform ${analysisType.name}`,
          subtype
        }
      );

      if (response.success && response.data?.success) {
        const result = response.data;

        console.log('Analysis completed:', result);

        // Reset processing states
        setProcessingTiles(prev => ({ ...prev, [analysisType.key]: false }));
        setIsProcessing(false);
        setShowAnalysisModal(false);

        // Redirect to the appropriate report page
        if (result.output?.id) {
          const reportUrl = getReportUrl(analysisType.key, projectId, result.output.id);
          toast.success(`${analysisType.name} completed! Redirecting to report...`);
          navigate(reportUrl);
          return;
        }

        // Fallback success message
        toast.success(`${analysisType.name} completed successfully!`);
        onAnalysisComplete(result);

      } else {
        // Handle error response
        const errorMessage = response.data?.error || response.error || 'Analysis failed';
        throw new Error(errorMessage);
      }

    } catch (error) {
      console.error(`Analysis error:`, error);

      toast.error(`${analysisType.name} failed`, {
        description: error instanceof Error ? error.message : 'Unknown error'
      });

      // Reset processing state
      setProcessingTiles(prev => ({ ...prev, [analysisType.key]: false }));
      setIsProcessing(false);
      setShowAnalysisModal(false);

      onAnalysisComplete({
        error: true,
        message: `Error running ${analysisType.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        analysisType: analysisType.name
      });
    }
  };

  const handleTileClick = (analysisType: AnalysisTypeConfig) => {
    if (analysisType.requiresSubtype) {
      // Show subtype selection modal (e.g., Gateway Review)
      if (analysisType.key === 'gateway-review') {
        setShowGatewayModal(true);
      } else {
        // For other types with subtypes, we could add more modals
        toast.info('Please select a subtype');
      }
    } else {
      handleRunAnalysis(analysisType);
    }
  };

  const handleGatewaySubmit = (gatewayType: string) => {
    const gatewayAnalysisType = analysisTypes.find(t => t.key === 'gateway-review');
    if (gatewayAnalysisType) {
      handleRunAnalysis(gatewayAnalysisType, gatewayType);
    }
  };

  // Render icon with color
  const renderIcon = (iconName: string, colorClass: string) => {
    const IconComponent = iconMap[iconName] || iconMap['Shield'];
    const color = colorMap[colorClass] || 'text-gray-500';

    return (
      <div className={color}>
        {IconComponent}
      </div>
    );
  };

  if (loadingTypes) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Quick Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading analysis types...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Quick Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {analysisTypes.map((analysisType) => (
              <Button
                key={analysisType.key}
                variant="outline"
                className="h-auto p-6 flex flex-col items-center justify-center text-center space-y-3 hover:bg-muted"
                onClick={() => handleTileClick(analysisType)}
                disabled={processingTiles[analysisType.key]}
              >
                <div className="mb-3">
                  {processingTiles[analysisType.key] ? (
                    <div className="animate-spin">
                      <AlertTriangle className="h-10 w-10 text-amber-500" />
                    </div>
                  ) : (
                    renderIcon(analysisType.icon, analysisType.iconColor)
                  )}
                </div>
                <div className="font-medium text-lg break-words">{analysisType.name}</div>
                <div className="text-sm text-muted-foreground break-words whitespace-normal">
                  {analysisType.description}
                </div>
              </Button>
            ))}
          </div>

          {analysisTypes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No analysis types configured. Please check the database.
            </div>
          )}
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
