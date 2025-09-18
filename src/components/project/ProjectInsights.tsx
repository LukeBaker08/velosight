
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from 'react-router-dom';

// Import refactored components
import AnalysisHistoryGrid from './insights/AnalysisHistoryGrid';
import AnalysisDetailsDialog from './insights/AnalysisDetailsDialog';
import InsightsHistoryTable from './insights/InsightsHistoryTable';
import { AnalysisResult } from './insights/types';

interface ProjectInsightsProps {
  onAnalyzeClick: () => void;
  analysisResults?: any;
}

const ProjectInsights: React.FC<ProjectInsightsProps> = ({ onAnalyzeClick, analysisResults }) => {
  const [insights, setInsights] = useState<string>('');
  const [savedAnalysis, setSavedAnalysis] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const { id: projectId } = useParams<{ id: string }>();
  
  // Fetch saved analysis from Supabase for this project
  const fetchSavedAnalysis = async () => {
    if (!projectId) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching analysis results:', error);
        return;
      }
      
      console.log('Fetched analysis results:', data);
      
      // Transform the data to match our AnalysisResult type
      const transformedData = data.map((item: any) => ({
        id: item.id,
        project_id: item.project_id,
        analysis_type: item.analysis_type,
        analysis_subtype: item.analysis_subtype, // Include the new field
        confidence: item.confidence,
        rating: item.overall_rating, // Map from overall_rating in DB to rating in interface
        created_at: item.created_at,
        status: item.status || 'draft', // Default to draft if not set
        raw_result: item.raw_result
      }));
      
      setSavedAnalysis(transformedData);
    } catch (err) {
      console.error('Error in analysis fetching:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedAnalysis();
  }, [projectId]);
  
  // Update with new analysis results when they come in
  useEffect(() => {
    if (analysisResults && !insights) {
      const formattedContent = formatAnalysisResults();
      if (formattedContent !== 'No analysis results available.') {
        setInsights(formattedContent);
      }
    }
  }, [analysisResults]);
  
  // Function to format the analysis results into a single text
  const formatAnalysisResults = () => {
    if (insights) {
      return insights;
    }
    
    if (analysisResults) {
      try {
        let formattedContent = '';
        
        // Add analysis type if available
        if (analysisResults.analysisType) {
          formattedContent += `# ${analysisResults.analysisType}\n\n`;
        }
        
        // Add confidence level if available
        if (analysisResults.confidence) {
          formattedContent += `**Confidence Level:** ${analysisResults.confidence}\n\n`;
        }
        
        // Add rating if available
        if (analysisResults.rating) {
          formattedContent += `**Overall Rating:** ${analysisResults.rating}\n\n`;
        }
        
        // Add analysis content from raw_result if available
        if (analysisResults.raw_result && analysisResults.raw_result.output) {
          formattedContent += `${analysisResults.raw_result.output}\n\n`;
        } else if (analysisResults.overview) {
          formattedContent += `${analysisResults.overview}\n\n`;
        }
        
        console.log('Formatted content from analysis results:', formattedContent);
        return formattedContent || 'No analysis results available.';
      } catch (error) {
        console.error('Error formatting analysis results:', error);
        return 'Error formatting analysis results.';
      }
    } else if (savedAnalysis.length > 0) {
      // Use the most recent saved analysis
      const latest = savedAnalysis[0];
      let formattedContent = `# ${latest.analysis_type}\n\n`;
      
      if (latest.confidence) {
        formattedContent += `**Confidence Level:** ${latest.confidence}\n\n`;
      }
      
      if (latest.rating) {
        formattedContent += `**Overall Rating:** ${latest.rating}\n\n`;
      }
      
      // Extract content from raw_result if available
      const analysisContent = getAnalysisContentFromRawResult(latest);
      if (analysisContent) {
        formattedContent += `${analysisContent}\n\n`;
      }
      
      console.log('Formatted content from saved analysis:', formattedContent);
      return formattedContent;
    }
    
    return 'No analysis results available.';
  };

  // Helper function to extract content from raw_result
  const getAnalysisContentFromRawResult = (analysis: AnalysisResult) => {
    if (!analysis || !analysis.raw_result) return null;
    
    try {
      // Check if raw_result contains an output field (common in webhook responses)
      if (Array.isArray(analysis.raw_result) && analysis.raw_result[0]?.output) {
        return analysis.raw_result[0].output;
      }
      
      // Check if raw_result is an object with an output property
      if (typeof analysis.raw_result === 'object' && analysis.raw_result?.output) {
        return analysis.raw_result.output;
      }
      
      // If raw_result has analysis_content property
      if (typeof analysis.raw_result === 'object' && analysis.raw_result?.analysis_content) {
        return analysis.raw_result.analysis_content;
      }
    } catch (error) {
      console.error('Error extracting analysis content from raw_result:', error);
    }
    
    return null;
  };

  // Open analysis details dialog
  const handleOpenAnalysisDetails = (analysis: AnalysisResult) => {
    setSelectedAnalysis(analysis);
    setIsAnalysisDialogOpen(true);
  };

  // Set insights content from a selected analysis
  const handleUseAnalysis = (formattedContent: string) => {
    setInsights(formattedContent);
    setIsAnalysisDialogOpen(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Insight History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <p>Loading project insights...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysisResults && savedAnalysis.length === 0 && !insights) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Insight History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p className="mb-4">Run an analysis from the Analysis tab to generate insights.</p>
            <button 
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              onClick={onAnalyzeClick}
            >
              Go to Analysis
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Insight History</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <InsightsHistoryTable 
          analysisHistory={savedAnalysis}
          projectId={projectId || ''}
          onAnalysisSelect={handleOpenAnalysisDetails}
          onAnalysisDeleted={fetchSavedAnalysis}
        />
      </CardContent>
      
      {/* Analysis details dialog */}
      <AnalysisDetailsDialog
        isOpen={isAnalysisDialogOpen}
        onClose={() => setIsAnalysisDialogOpen(false)}
        selectedAnalysis={selectedAnalysis}
        onUseAnalysis={handleUseAnalysis}
      />
    </Card>
  );
};

export default ProjectInsights;
