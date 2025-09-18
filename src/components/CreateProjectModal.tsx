
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { validateProject, sanitizeInput } from '@/lib/validators';
import { handleError, getErrorMessage } from '@/lib/errors';
import { PROJECT_STAGES, RISK_LEVELS } from '@/lib/constants';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (projectData: any) => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onCreateProject }) => {
  const [projectData, setProjectData] = useState({
    name: '',
    client: '',
    description: '',
    risk_level: 'medium',
    stage: 'planning'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProjectData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setProjectData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate and sanitize input data
      const sanitizedData = {
        name: sanitizeInput(projectData.name),
        client: sanitizeInput(projectData.client),
        description: sanitizeInput(projectData.description),
        risk_level: projectData.risk_level,
        stage: projectData.stage
      };

      validateProject(sanitizedData);

      // Insert the new project into Supabase
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: sanitizedData.name,
          client: sanitizedData.client,
          description: sanitizedData.description,
          risk_level: sanitizedData.risk_level,
          stage: sanitizedData.stage,
          documents_count: 0
        })
        .select();

      if (error) {
        throw error;
      }

      // Display success toast
      toast({
        title: "Project Created",
        description: "Your new project has been created successfully.",
      });

      // Call the callback function from parent component
      if (data && data.length > 0) {
        onCreateProject(data[0]);
        
        // Navigate to the new project page
        navigate(`/project/${data[0].id}`);
      }

      // Close the modal
      onClose();
    } catch (error: any) {
      const errorMessage = handleError(error, 'Project creation');
      
      toast({
        title: "Error Creating Project",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Set up a new engagement for your client. You can add documents and context later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                name="name"
                value={projectData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="client">Client</Label>
              <Input
                id="client"
                name="client"
                value={projectData.client}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={projectData.description}
                onChange={handleChange}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="risk_level">Risk Level</Label>
                <Select 
                  value={projectData.risk_level} 
                  onValueChange={(value) => handleSelectChange('risk_level', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select risk level" />
                  </SelectTrigger>
                  <SelectContent>
                    {RISK_LEVELS.map(level => (
                      <SelectItem key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stage">Project Stage</Label>
                <Select 
                  value={projectData.stage} 
                  onValueChange={(value) => handleSelectChange('stage', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STAGES.map(stage => (
                      <SelectItem key={stage} value={stage}>
                        {stage.charAt(0).toUpperCase() + stage.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectModal;
