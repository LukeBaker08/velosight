
import React from 'react';
import { Project } from '@/types/project';
import { formatDateTime } from '@/utils/dateUtils';

interface ProjectHeaderProps {
  project: Project;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({ project }) => {
  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{project.name}</h1>
        </div>
        <p className="text-muted-foreground mt-1">Client: {project.client}</p>
        {project.lastUpdated && (
          <p className="text-xs text-muted-foreground mt-1">
            Last updated: {formatDateTime(project.lastUpdated)}
          </p>
        )}
      </div>
      
    </div>
  );
};

export default ProjectHeader;
