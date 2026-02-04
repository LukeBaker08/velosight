import React from 'react';
import ReportLayout from './ReportLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDateTime } from '@/utils/dateUtils';

const CustomAnalysis = () => {
  const { projectId, analysisId } = useParams<{ projectId: string; analysisId: string }>();

  const { data: analysis, isLoading, error } = useQuery({
    queryKey: ['analysis', analysisId],
    queryFn: async () => {
      if (!analysisId) throw new Error('Analysis ID is required');
      
      const { data, error } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('id', analysisId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!analysisId
  });

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId
  });

  // Helper function to extract and format analysis content
  const getAnalysisContent = (rawResult: any) => {
    if (!rawResult) return 'No analysis content available.';
    
    try {
      console.log('Processing raw_result:', rawResult);
      
      // Handle string responses
      if (typeof rawResult === 'string') {
        return rawResult;
      }
      
      // Handle object responses
      if (typeof rawResult === 'object' && rawResult !== null) {
        // Helper to ensure a value is a renderable string
        const ensureString = (val: any): string => {
          if (typeof val === 'string') return val;
          if (val && typeof val === 'object') return JSON.stringify(val, null, 2);
          return String(val);
        };

        // Handle array format (like the provided example)
        if (Array.isArray(rawResult) && rawResult.length > 0) {
          const firstItem = rawResult[0];
          if (typeof firstItem === 'object' && firstItem.output) {
            return ensureString(firstItem.output);
          }
          if (typeof firstItem === 'string') {
            return firstItem;
          }
        }

        // Try various common field names for the main content
        if (rawResult.output != null) {
          return ensureString(rawResult.output);
        }
        if (rawResult.analysis_content != null) {
          return ensureString(rawResult.analysis_content);
        }
        if (rawResult.content != null) {
          return ensureString(rawResult.content);
        }
        if (rawResult.message != null) {
          return ensureString(rawResult.message);
        }
        if (rawResult.summary != null) {
          return ensureString(rawResult.summary);
        }
        if (rawResult.overview != null) {
          return ensureString(rawResult.overview);
        }
        if (rawResult.text != null) {
          return ensureString(rawResult.text);
        }

        // If none of the above, stringify the object nicely
        return JSON.stringify(rawResult, null, 2);
      }
      
      return 'Unable to parse analysis content.';
    } catch (error) {
      console.error('Error parsing analysis content:', error);
      return 'Error parsing analysis content.';
    }
  };

  // Helper function to extract prompt from raw result
  const getPrompt = (rawResult: any) => {
    if (!rawResult) return null;
    
    try {
      if (typeof rawResult === 'object' && rawResult !== null) {
        // Handle array format (like the provided example)
        if (Array.isArray(rawResult) && rawResult.length > 0) {
          const firstItem = rawResult[0];
          if (typeof firstItem === 'object' && firstItem.prompt) {
            // Decode URL-encoded prompt
            return decodeURIComponent(firstItem.prompt);
          }
        }
        
        // Handle direct object format
        if (rawResult.prompt) {
          // Decode URL-encoded prompt
          return decodeURIComponent(rawResult.prompt);
        }
      }
    } catch (error) {
      console.error('Error extracting prompt:', error);
    }
    
    return null;
  };

  return (
    <ReportLayout 
      title="Custom Analysis Report" 
      analysisType="Custom Prompt Analysis"
    >
      {(analysisData, projectData) => {
        // Use the passed analysis and project data, or fall back to our queries
        const currentAnalysis = analysisData || analysis;
        const currentProject = projectData || project;

        if (isLoading) {
          return (
            <div className="flex items-center justify-center py-12">
              <p>Loading analysis...</p>
            </div>
          );
        }

        if (error || !currentAnalysis) {
          return (
            <div className="flex items-center justify-center py-12">
              <p className="text-destructive">Failed to load analysis. Please try again.</p>
            </div>
          );
        }

        const analysisContent = getAnalysisContent(currentAnalysis.raw_result);
        const prompt = getPrompt(currentAnalysis.raw_result);

        return (
          <div className="space-y-6">
            {/* Analysis Header */}
            <div className="space-y-2">
              <p className="text-muted-foreground">
                Created on {formatDateTime(currentAnalysis.created_at)}
              </p>
            </div>

            {/* Prompt Section - Display the prompt that was used */}
            {prompt && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Analysis Prompt</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{prompt}</p>
                </CardContent>
              </Card>
            )}

            {/* Analysis Results */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {analysisContent}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }}
    </ReportLayout>
  );
};

export default CustomAnalysis;
