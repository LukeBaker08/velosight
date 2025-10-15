
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Project } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { handleError } from '@/lib/errors';
import InfoCard from '@/components/ui/info-card';

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
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
        
        if (count !== null) {
          setDocumentsCount(count);
        }
      } catch (error) {
        console.error('Error in document count fetch:', error);
      }
    };
    
    fetchDocumentCount();
  }, [project.id]);

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Link to={`/project/${project.id}`}>
      <Card className="card-hover-effect h-full flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-semibold">{project.name}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="flex items-center text-sm text-muted-foreground mb-3">
            <User className="mr-2 h-4 w-4" />
            <span>{project.client}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground mb-4">
            <Calendar className="mr-2 h-4 w-4" />
            <span>Updated {formatDate(project.updated_at)}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {project.riskLevel && (
              <Badge 
                variant={getRiskBadgeVariant(project.riskLevel)}
                className="px-2.5 py-1"
              >
                {project.riskLevel.charAt(0).toUpperCase() + project.riskLevel.slice(1)} Risk
              </Badge>
            )}
            {project.stage && (
              <Badge 
                variant={getStageBadgeVariant(project.stage)}
                className="px-2.5 py-1"
              >
                {project.stage.charAt(0).toUpperCase() + project.stage.slice(1)}
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-2 text-sm text-muted-foreground">
          {documentsCount} documents uploaded
        </CardFooter>
      </Card>
    </Link>
  );
};

export default ProjectCard;
