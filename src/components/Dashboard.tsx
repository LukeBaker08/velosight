
/**
 * Dashboard component that provides the main landing page with quick actions and recent projects.
 * Displays navigation cards for core features and shows recently updated projects.
 */
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Link } from 'react-router-dom';
import ProjectCard from './ProjectCard';
import { ArrowRight, FilePlus, Book, Folder, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Project } from '@/types/project';
import { getRecentProjects } from '@/lib/project-service';
import { useToast } from "@/hooks/use-toast";
import CreateProjectModal from './CreateProjectModal';
import { ProjectCardSkeleton } from './ui/skeleton';
import { NoProjectsEmpty } from './ui/empty-state';

interface DashboardProps {
  onNewProject: () => void;
}

/**
 * Main dashboard component displaying quick actions and recent projects overview
 * @param onNewProject - Callback function when new project action is triggered
 * @returns JSX element with dashboard layout and content
 */
const Dashboard: React.FC<DashboardProps> = ({ onNewProject }) => {
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchRecentProjects = async () => {
      try {
        setIsLoading(true);
        const data = await getRecentProjects(3);
        setRecentProjects(data);
      } catch (error) {
        console.error('Error fetching recent projects:', error);
        toast({
          title: 'Error',
          description: 'Failed to load recent projects. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentProjects();
  }, [toast]);

  /**
   * Handles successful project creation by updating the recent projects list
   * @param newProject - The newly created project to add to recent projects
   */
  const handleProjectCreated = (newProject: Project) => {
    setRecentProjects(prev => [newProject, ...prev.slice(0, 2)]); // Keep only the 3 most recent
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground">Here's an overview of your projects and recent activities.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card
          className="bg-primary/5 hover:bg-primary/10 border-border/50 transition-colors cursor-pointer h-full"
          onClick={() => setShowModal(true)}
        >
          <div className="p-6 flex flex-col items-center justify-center text-center h-full">
            <FilePlus className="h-8 w-8 mb-3 text-primary" />
            <h3 className="font-medium">New Project</h3>
            <p className="text-sm text-muted-foreground mt-1">Create a new project</p>
          </div>
        </Card>
        <Link to="/projects" className="block">
          <Card className="bg-primary/5 hover:bg-primary/10 border-border/50 transition-colors cursor-pointer h-full">
            <div className="p-6 flex flex-col items-center justify-center text-center h-full">
              <Folder className="h-8 w-8 mb-3 text-primary" />
              <h3 className="font-medium">Projects</h3>
              <p className="text-sm text-muted-foreground mt-1">View all projects</p>
            </div>
          </Card>
        </Link>
        <Link to="/knowledge" className="block">
          <Card className="bg-primary/5 hover:bg-primary/10 border-border/50 transition-colors cursor-pointer h-full">
            <div className="p-6 flex flex-col items-center justify-center text-center h-full">
              <Book className="h-8 w-8 mb-3 text-primary" />
              <h3 className="font-medium">Knowledge Library</h3>
              <p className="text-sm text-muted-foreground mt-1">Browse materials and guides</p>
            </div>
          </Card>
        </Link>
        <Link to="/settings" className="block">
          <Card className="bg-primary/5 hover:bg-primary/10 border-border/50 transition-colors cursor-pointer h-full">
            <div className="p-6 flex flex-col items-center justify-center text-center h-full">
              <Settings className="h-8 w-8 mb-3 text-primary" />
              <h3 className="font-medium">Settings</h3>
              <p className="text-sm text-muted-foreground mt-1">Configure preferences</p>
            </div>
          </Card>
        </Link>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Recent Projects</h2>
          <Link to="/projects">
            <Button variant="link" className="flex items-center gap-1 text-primary">
              View all projects <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <>
              <ProjectCardSkeleton />
              <ProjectCardSkeleton />
              <ProjectCardSkeleton />
            </>
          ) : recentProjects.length === 0 ? (
            <div className="col-span-full">
              <NoProjectsEmpty
                action={
                  <Button variant="outline" onClick={() => setShowModal(true)}>
                    Create Your First Project
                  </Button>
                }
              />
            </div>
          ) : (
            recentProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))
          )}
        </div>
      </div>

      <CreateProjectModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        onCreateProject={handleProjectCreated}
      />
    </div>
  );
};

export default Dashboard;
