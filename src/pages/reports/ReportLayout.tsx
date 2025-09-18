
import React from 'react';
import Layout from '@/components/Layout';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getProjectById } from '@/services/projectService';
import { Project } from '@/types/project';
import { AnalysisResult } from '@/components/project/insights/types';

interface ReportLayoutProps {
  title: string;
  analysisType: string;
  children: (analysis: AnalysisResult | null, project: Project | null) => React.ReactNode;
}

// Helper function to get status badge variant
const getStatusBadgeVariant = (status: 'draft' | 'final') => {
  return status === 'final' ? "default" : "secondary";
};

const ReportLayout: React.FC<ReportLayoutProps> = ({ title, analysisType, children }) => {
  const params = useParams<{ id?: string; projectId?: string; analysisId?: string }>();
  
  // Handle both old and new URL formats
  const projectId = params.projectId || params.id;
  const analysisId = params.analysisId;

  // Fetch project details
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProjectById(projectId as string),
    enabled: !!projectId,
  });

  // Fetch specific analysis if analysisId is provided, otherwise fetch the most recent
  const { data: analysis, isLoading: analysisLoading } = useQuery({
    queryKey: ['analysis', projectId, analysisType, analysisId],
    queryFn: async () => {
      let query = supabase
        .from('analysis_results')
        .select('*')
        .eq('project_id', projectId)
        .eq('analysis_type', analysisType);

      if (analysisId) {
        // Fetch specific analysis
        query = query.eq('id', analysisId);
      } else {
        // Fetch most recent analysis
        query = query.order('created_at', { ascending: false }).limit(1);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Map database fields to AnalysisResult interface
      if (data && data[0]) {
        // Safely cast status with fallback
        const dbStatus = data[0].status;
        const status: 'draft' | 'final' = (dbStatus === 'final' || dbStatus === 'draft') ? dbStatus : 'draft';
        
        const result: AnalysisResult = {
          id: data[0].id,
          project_id: data[0].project_id,
          analysis_type: data[0].analysis_type,
          analysis_subtype: data[0].analysis_subtype,
          confidence: data[0].confidence,
          rating: data[0].overall_rating, // Map from overall_rating in DB to rating in interface
          created_at: data[0].created_at || new Date().toISOString(),
          status: status,
          raw_result: data[0].raw_result
        };
        return result;
      }
      
      return null;
    },
    enabled: !!projectId,
  });

  const isLoading = projectLoading || analysisLoading;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link to={`/project/${projectId}`}>
              <Button variant="outline" size="sm" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Project
              </Button>
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              {analysis && (
                <Badge variant={getStatusBadgeVariant(analysis.status)}>
                  {analysis.status.charAt(0).toUpperCase() + analysis.status.slice(1)}
                </Badge>
              )}
            </div>
            {project && (
              <div className="text-muted-foreground mt-1">
                <span className="font-medium">{project.name}</span>
                {project.client && <span> • {project.client}</span>}
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <p>Loading report data...</p>
          </div>
        ) : !analysis ? (
          <div className="border border-border rounded-md p-6 text-center">
            <h3 className="text-lg font-medium mb-2">No Analysis Available</h3>
            <p className="text-muted-foreground mb-4">
              {analysisId 
                ? `The requested ${analysisType} report could not be found.`
                : `There is no ${analysisType} report available for this project yet.`
              }
            </p>
            <Link to={`/project/${projectId}`}>
              <Button>Run Analysis</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {children(analysis, project)}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ReportLayout;
