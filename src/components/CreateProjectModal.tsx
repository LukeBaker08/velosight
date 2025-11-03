
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
import { PROJECT_STAGES, RISK_LEVELS, fetchProjectStages, fetchRiskLevels } from '@/lib/constants';
import { useEffect } from 'react';

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
    risk_level: '',
    stage: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [stages, setStages] = useState<string[]>(PROJECT_STAGES as unknown as string[]);
  const [riskLevels, setRiskLevels] = useState<string[]>(RISK_LEVELS as unknown as string[]);
  const [isLoadingStages, setIsLoadingStages] = useState(false);
  const [isLoadingRiskLevels, setIsLoadingRiskLevels] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setIsLoadingStages(true);
        const s = await fetchProjectStages();
        if (mounted && s && s.length > 0) setStages(s);
      } catch (e) {
        // keep fallback
        console.warn('Failed to load project stages', e);
      } finally {
        if (mounted) setIsLoadingStages(false);
      }

      try {
        setIsLoadingRiskLevels(true);
        const r = await fetchRiskLevels();
        if (mounted && r && r.length > 0) setRiskLevels(r);
      } catch (e) {
        console.warn('Failed to load risk levels', e);
      } finally {
        if (mounted) setIsLoadingRiskLevels(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

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
                    {(isLoadingRiskLevels ? RISK_LEVELS : riskLevels).map(level => (
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
                    {(isLoadingStages ? PROJECT_STAGES : stages).map(stage => (
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
