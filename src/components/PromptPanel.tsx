import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from 'react-router-dom';
import { analysisWebhooks } from "@/lib/webhooks";

interface PromptPanelProps {
  onAnalysisComplete?: (results: any) => void;
}

const PromptPanel: React.FC<PromptPanelProps> = ({ onAnalysisComplete }) => {
  const [availablePrompts, setAvailablePrompts] = useState<{id: string, name: string, prompt: string}[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState('');
  const [promptText, setPromptText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Load prompts from Supabase on mount
  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        setIsLoadingPrompts(true);

        // Fetch prompts from database
        const { data, error } = await supabase
          .from('prompts')
          .select('id, category, prompt');

        if (error) {
          console.error('Error loading prompts from database:', error);

          // Fallback to just custom option
          setAvailablePrompts([{
            id: 'custom',
            name: 'Custom Prompt',
            prompt: ''
          }]);
          return;
        }

        // Transform prompts to compatible format
        const transformed = data.map(p => ({
          id: p.id,
          name: p.category,
          prompt: p.prompt
        }));

        // Always add the custom prompt option
        transformed.push({
          id: 'custom',
          name: 'Custom Prompt',
          prompt: ''
        });

        setAvailablePrompts(transformed);
      } catch (error) {
        console.error('Error in prompt fetching:', error);
        setAvailablePrompts([{
          id: 'custom',
          name: 'Custom Prompt',
          prompt: ''
        }]);
      } finally {
        setIsLoadingPrompts(false);
      }
    };

    fetchPrompts();
  }, []);

  const handlePromptChange = (value: string) => {
    setSelectedPromptId(value);

    if (value === 'custom') {
      setPromptText('');
    } else {
      const selectedPrompt = availablePrompts.find(p => p.id === value);
      if (selectedPrompt) {
        setPromptText(selectedPrompt.prompt);
      }
    }
  };

  const handleRunAnalysis = async () => {
    if (!promptText.trim()) {
      toast.error('Please enter a prompt for analysis');
      return;
    }

    if (!projectId) {
      toast.error('No project selected');
      return;
    }

    setIsProcessing(true);
    setShowAnalysisModal(true);

    try {
      console.log(`Running custom prompt analysis for project ${projectId}`);

      // Use the unified analysis endpoint with 'custom-prompt' type
      const response = await analysisWebhooks.run(
        projectId,
        'custom-prompt',
        {
          query: promptText
        }
      );

      if (response.success && response.data?.success) {
        const result = response.data;
        console.log('Custom prompt analysis completed:', result);

        // Redirect to the custom analysis report
        if (result.output?.id) {
          toast.success('Analysis complete! Redirecting to report...');
          navigate(`/reports/custom-analysis/${projectId}/${result.output.id}`);
          return;
        }

        // Fallback success
        toast.success('Custom analysis complete!');
        if (onAnalysisComplete) {
          onAnalysisComplete(result);
        }
      } else {
        const errorMessage = response.data?.error || response.error || 'Analysis failed';
        throw new Error(errorMessage);
      }

    } catch (error) {
      console.error('Custom prompt analysis error:', error);
      toast.error('Analysis failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });

      if (onAnalysisComplete) {
        onAnalysisComplete({
          error: true,
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          analysisType: 'Custom Prompt Analysis'
        });
      }
    } finally {
      setIsProcessing(false);
      setShowAnalysisModal(false);
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Custom Analysis</CardTitle>
          <CardDescription>
            Run analysis on your project documents using predefined or custom prompts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Select value={selectedPromptId} onValueChange={handlePromptChange} disabled={isLoadingPrompts}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingPrompts ? "Loading prompts..." : "Select a prompt template"} />
              </SelectTrigger>
              <SelectContent>
                {availablePrompts.map(prompt => (
                  <SelectItem key={prompt.id} value={prompt.id}>
                    {prompt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Textarea
              placeholder="Enter your analysis prompt here..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground">
              Be specific about what you want to analyse. Include any relevant context.
            </p>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button onClick={handleRunAnalysis} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Run Analysis'}
          </Button>
        </CardFooter>
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
              Custom prompt analysis is being performed. This may take a minute or two.
              <br />Please don't close this window.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PromptPanel;
