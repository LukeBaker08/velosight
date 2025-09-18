
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Project } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';

interface ProjectMetricsProps {
  project: Project;
}

const ProjectMetrics: React.FC<ProjectMetricsProps> = ({ project }) => {
  const [documentsCount, setDocumentsCount] = useState(project.documentsCount);

  // Fetch actual document count from the database
  useEffect(() => {
    const fetchDocumentCount = async () => {
      try {
        const { count, error } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', project.id);
        
        if (error) {
          console.error('Error fetching document count:', error);
          return;
        }
        
        if (count !== null && count !== documentsCount) {
          setDocumentsCount(count);
          
          // Update the project's documents_count in the database if it's different
          if (count !== project.documentsCount) {
            const { error: updateError } = await supabase
              .from('projects')
              .update({ documents_count: count })
              .eq('id', project.id);
              
            if (updateError) {
              console.error('Error updating document count in project:', updateError);
            }
          }
        }
      } catch (error) {
        console.error('Error in document count fetch:', error);
      }
    };
    
    fetchDocumentCount();
  }, [project.id, project.documentsCount]);

  const getRiskBadgeVariant = (risk: string) => {
    switch(risk) {
      case 'high': return 'risk-high';
      case 'medium': return 'risk-medium';
      case 'low': return 'risk-low';
      default: return 'outline';
    }
  };

  const getStageBadgeVariant = (stage: string) => {
    switch(stage?.toLowerCase()) {
      case 'planning': return 'planning';
      case 'discovery': return 'discovery';
      case 'development': return 'development';
      case 'implementation': return 'implementation';
      case 'complete': return 'complete';
      default: return 'outline';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Project Stage</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge 
            variant={getStageBadgeVariant(project.stage)}
            className="px-2.5 py-1"
          >
            {project.stage.charAt(0).toUpperCase() + project.stage.slice(1)}
          </Badge>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge 
            variant={getRiskBadgeVariant(project.riskLevel)}
            className="px-2.5 py-1"
          >
            {project.riskLevel.charAt(0).toUpperCase() + project.riskLevel.slice(1)}
          </Badge>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="font-semibold">{documentsCount}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectMetrics;
