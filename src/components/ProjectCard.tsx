
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Project } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { useProjectBadgeColors } from '@/hooks/useDropdownColors';
import { getBadgeColorClasses } from '@/lib/badge-helpers';

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
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

        if (count !== null) {
          setDocumentsCount(count);
        }
      } catch (error) {
        console.error('Error in document count fetch:', error);
      }
    };

    fetchDocumentCount();
  }, [project.id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const riskColor = getRiskColor(project.risk_level);
  const stageColor = getStageColor(project.stage);

  return (
    <Link to={`/project/${project.id}`}>
      <Card className="card-hover-effect h-full flex flex-col border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">{project.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pt-0">
          <div className="flex items-center text-sm text-muted-foreground mb-2">
            <User className="mr-2 h-4 w-4" />
            <span>{project.client}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground mb-4">
            <Calendar className="mr-2 h-4 w-4" />
            <span>Updated {formatDate(project.updated_at)}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {project.risk_level && (
              <Badge
                variant="outline"
                className={`px-2.5 py-1 ${getBadgeColorClasses(riskColor)}`}
              >
                {project.risk_level.charAt(0).toUpperCase() + project.risk_level.slice(1)} Risk
              </Badge>
            )}
            {project.stage && (
              <Badge
                variant="outline"
                className={`px-2.5 py-1 ${getBadgeColorClasses(stageColor)}`}
              >
                {project.stage.charAt(0).toUpperCase() + project.stage.slice(1)}
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-4 text-sm text-muted-foreground border-t border-border/50">
          {documentsCount} documents uploaded
        </CardFooter>
      </Card>
    </Link>
  );
};

export default ProjectCard;
