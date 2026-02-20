
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Project } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { useProjectBadgeColors } from '@/hooks/useDropdownColors';
import { getBadgeColorClasses } from '@/lib/badge-helpers';

interface ProjectMetricsProps {
  project: Project;
}

const ProjectMetrics: React.FC<ProjectMetricsProps> = ({ project }) => {
  const [documentsCount, setDocumentsCount] = useState(project.documents_count);
  const { getStageColor, getRiskColor } = useProjectBadgeColors();

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
          if (count !== project.documents_count) {
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
  }, [project.id, project.documents_count]);

  const stageColor = getStageColor(project.stage);
  const riskColor = getRiskColor(project.risk_level);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Project Stage</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Badge
            variant="outline"
            className={`px-2.5 py-1 ${getBadgeColorClasses(stageColor)}`}
          >
            {project.stage.charAt(0).toUpperCase() + project.stage.slice(1)}
          </Badge>
        </CardContent>
      </Card>
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Risk Level</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Badge
            variant="outline"
            className={`px-2.5 py-1 ${getBadgeColorClasses(riskColor)}`}
          >
            {project.risk_level.charAt(0).toUpperCase() + project.risk_level.slice(1)}
          </Badge>
        </CardContent>
      </Card>
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Documents</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-semibold">{documentsCount}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectMetrics;
