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
import { webhookService } from "@/services/webhookService";

interface PromptPanelProps {
  onAnalysisComplete?: (results: any) => void;
}

interface Prompt {
  id: string;
  category: string;
  prompt: string;
}


// Function to generate a unique session ID
const generateSessionId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const PromptPanel: React.FC<PromptPanelProps> = ({ onAnalysisComplete }) => {
  const [availablePrompts, setAvailablePrompts] = useState<{id: string, name: string, prompt: string}[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState('');
  const [promptText, setPromptText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);
  const [sessionId, setSessionId] = useState<string>('');
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
          
          // Try to fall back to localStorage if database query fails
          const savedPrompts = localStorage.getItem('promptLibrary');
          if (savedPrompts) {
            try {
              const libraryPrompts = JSON.parse(savedPrompts);
              const transformed = libraryPrompts.map((p: any) => ({
                id: p.id,
                name: p.category,
                prompt: p.prompt
              }));
              
              transformed.push({
                id: 'custom',
                name: 'Custom Prompt',
                prompt: ''
              });
              
              setAvailablePrompts(transformed);
              return;
            } catch (e) {
              console.error('Error parsing localStorage prompts:', e);
            }
          }
          
          // If both database and localStorage fail, set a default
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
        // Fallback to empty prompts with just the custom option
        setAvailablePrompts([{
          id: 'custom',
          name: 'Custom Prompt',
          prompt: ''
        }]);
      } finally {
        setIsLoadingPrompts(false);
      }
    };
    
    // Create a new session ID when component mounts
    setSessionId(generateSessionId());
    
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
    
    setIsProcessing(true);
    setShowAnalysisModal(true);
    
    try {
      const response = await sendWebhookRequest();
      console.log('Webhook response:', response);
      
      if (response) {
        // Save the analysis result to Supabase
        if (projectId) {
          try {
            // Determine the analysis type - always use "Custom Prompt Analysis" for consistency
            const analysisType = 'Custom Prompt Analysis';
            
            // Extract content based on response structure
            let confidence = 'Medium';
            let rating = '';
            let analysisContent = '';
            
            // Handle different response formats
            if (typeof response === 'string') {
              analysisContent = response;
            } else if (typeof response === 'object' && response !== null) {
              // Extract values from the response object
              confidence = response.confidence || response.insightConfidence || 'Medium';
              rating = response.rating || response.overall_rating || '';
              
              // Try to extract the main content
              if (response.output) {
                analysisContent = response.output;
              } else if (response.analysis_content) {
                analysisContent = response.analysis_content;
              } else if (response.overview) {
                analysisContent = response.overview;
              } else if (response.summary) {
                analysisContent = response.summary;
              } else if (response.message) {
                analysisContent = response.message;
              } else {
                analysisContent = JSON.stringify(response, null, 2);
              }
            }
            
            // Log what we're saving to help with debugging
            console.log('Saving custom prompt analysis to database:', {
              project_id: projectId,
              analysis_type: analysisType,
              confidence,
              overall_rating: rating,
              analysis_subtype: 'Custom Prompt',
              raw_result: response // Store the complete response as JSON
            });
            
            // Insert the analysis result to the database
            const { data: insertedData, error } = await supabase
              .from('analysis_results')
              .insert({
                project_id: projectId,
                analysis_type: analysisType,
                analysis_subtype: 'Custom Prompt',
                confidence,
                overall_rating: rating,
                raw_result: response // This should store the complete JSON response
              })
              .select()
              .single();
            
            if (error) {
              console.error('Supabase error when saving custom prompt analysis:', error);
              throw error;
            }
            
            console.log('Custom prompt analysis result saved to database:', insertedData);
            
            // Redirect to the custom analysis report
            if (insertedData?.id) {
              toast.success('Analysis complete! Redirecting to report...');
              navigate(`/reports/custom-analysis/${projectId}/${insertedData.id}`);
              return; // Exit early since we're redirecting
            }
          } catch (dbError) {
            console.error('Error saving analysis to database:', dbError);
            // Continue with the flow even if saving fails
            toast.error('Analysis completed but failed to save to database');
          }
        }
        
        // Add analysis type to the response
        const responseWithType = {
          ...response,
          analysisType: 'Custom Prompt Analysis'
        };
        
        // Call the onAnalysisComplete callback if provided
        if (onAnalysisComplete) {
          onAnalysisComplete(responseWithType);
        }
        
        toast.success('Custom analysis complete! Results available in the Insights tab.');
      } else {
        toast.error('No response received from the webhook. Please try again.');
      }
    } catch (error) {
      console.error('Webhook error:', error);
      toast.error('Error connecting to webhook. Please try again.');
      
      // Notify parent of the error
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

  const sendWebhookRequest = async () => {
    // Create a new session ID for this request
    const currentSessionId = sessionId || generateSessionId();

    try {
      // Get webhook URL dynamically
      const webhookUrl = await webhookService.getWebhookUrl('prompt.custom');
      
      if (!webhookUrl) {
        throw new Error('No webhook configured for custom prompts');
      }

      // Using GET method as required by the webhook
      const url = new URL(webhookUrl);
      
      // Add query parameters including project_id
      url.searchParams.append('session', currentSessionId);
      url.searchParams.append('prompt', encodeURIComponent(promptText));
      
      // Add project_id to the webhook call
      if (projectId) {
        url.searchParams.append('project_id', projectId);
      }
      
      // Set a longer timeout (60 seconds)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout - the server is taking too long to respond')), 60000)
      );
      
      const fetchPromise = fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

      if (response.ok) {
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const jsonResponse = await response.json();
            console.log('Parsed JSON response:', jsonResponse);
            return jsonResponse;
          } else {
            const text = await response.text();
            console.log('Non-JSON response:', text);
            // Return a structured response even for text
            return { 
              output: text,
              message: 'Analysis completed',
              rawResponse: text 
            };
          }
        } catch (e) {
          console.error('Error parsing response:', e);
          const text = await response.text();
          return { 
            output: text || 'Analysis completed but response could not be parsed',
            message: 'Analysis completed but response could not be parsed' 
          };
        }
      } else {
        const errorText = await response.text();
        console.error('Error response:', response.status, response.statusText, errorText);
        throw new Error(`Server responded with status: ${response.status}. ${errorText}`);
      }
    } catch (e) {
      console.error('Error sending webhook request:', e);
      throw e;
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
              Be specific about what you want to analyze. Include any relevant context.
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
