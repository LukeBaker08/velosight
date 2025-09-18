
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from '@/types/project';

interface ProjectOverviewProps {
  project: Project;
}

// Helper function to format text with line breaks and basic formatting
const formatDescription = (text: string) => {
  if (!text) return '';
  
  // Split by line breaks and filter out empty lines
  const paragraphs = text.split('\n').filter(line => line.trim() !== '');
  
  return paragraphs.map((paragraph, index) => {
    // Handle bullet points
    if (paragraph.trim().startsWith('•') || paragraph.trim().startsWith('-') || paragraph.trim().startsWith('*')) {
      return (
        <li key={index} className="ml-4 mb-1">
          {paragraph.trim().substring(1).trim()}
        </li>
      );
    }
    
    // Handle numbered lists
    const numberedMatch = paragraph.trim().match(/^\d+\.\s+(.+)/);
    if (numberedMatch) {
      return (
        <li key={index} className="ml-4 mb-1 list-decimal">
          {numberedMatch[1]}
        </li>
      );
    }
    
    // Regular paragraphs
    return (
      <p key={index} className="mb-3 last:mb-0">
        {paragraph.trim()}
      </p>
    );
  });
};

const ProjectOverview: React.FC<ProjectOverviewProps> = ({ project }) => {
  const formattedDescription = formatDescription(project.description);
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Engagement Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            {formattedDescription}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectOverview;
