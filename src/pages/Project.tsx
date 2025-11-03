import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectHeader from '@/components/project/ProjectHeader';
import ProjectMetrics from '@/components/project/ProjectMetrics';
import ProjectOverview from '@/components/project/ProjectOverview';
import ProjectDocuments from '@/components/project/ProjectDocuments';
import ProjectInsights from '@/components/project/ProjectInsights';
import PromptPanel from '@/components/PromptPanel';
import AnalysisTiles from '@/components/project/AnalysisTiles';
import { getProjectById } from '@/services/projectService';
import { Project as ProjectType } from '@/types/project';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { PROJECT_STAGES, RISK_LEVELS, fetchProjectStages, fetchRiskLevels } from '@/lib/constants';

const Project = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('overview');
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [project, setProject] = useState<ProjectType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stages, setStages] = useState<string[]>(PROJECT_STAGES as unknown as string[]);
  const [riskLevels, setRiskLevels] = useState<string[]>(RISK_LEVELS as unknown as string[]);
  const [isLoadingStages, setIsLoadingStages] = useState(false);
  const [isLoadingRiskLevels, setIsLoadingRiskLevels] = useState(false);
  
  // Form for editing project
  const form = useForm({
    defaultValues: {
      name: '',
      engagementOverview: '',
      client: '',
      riskLevel: '',
      stage: ''
    }
  });
  
  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const projectData = await getProjectById(id);
        setProject(projectData);
        
        // Set the form default values
        form.reset({
          name: projectData.name,
          engagementOverview: projectData.description,
          client: projectData.client,
          riskLevel: projectData.riskLevel,
          stage: projectData.stage
        });
        
        // Also fetch documents for this project
        const { data: documentsData, error: documentsError } = await supabase
          .from('documents')
          .select('*')
          .eq('project_id', id);
          
        if (documentsError) {
          console.error('Error fetching documents:', documentsError);
        } else {
        }
      } catch (error) {
        console.error('Error fetching project:', error);
        toast({
          title: 'Error',
          description: 'Failed to load project details. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
    // Also load dropdown lists for stages and risk levels
    let mounted = true;
    (async () => {
      try {
        setIsLoadingStages(true);
        const s = await fetchProjectStages();
        if (mounted && s && s.length > 0) setStages(s);
      } catch (e) {
        console.warn('Failed to load project stages', e);
      } finally {
        setIsLoadingStages(false);
      }

      try {
        setIsLoadingRiskLevels(true);
        const r = await fetchRiskLevels();
        if (mounted && r && r.length > 0) setRiskLevels(r);
      } catch (e) {
        console.warn('Failed to load risk levels', e);
      } finally {
        setIsLoadingRiskLevels(false);
      }
    })();

    return () => { mounted = false; };
  }, [id, toast, form]);
  
  // Handler for when analysis completes
  const handleAnalysisComplete = (results: any) => {
    try {
      // Check if results is an array with output property containing JSON string
      if (Array.isArray(results) && results[0]?.output) {
        // Extract JSON string from the output
        const jsonString = results[0].output;
        
        // Find JSON content between triple backticks if present
        let jsonContent = jsonString;
        const jsonMatch = jsonString.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
          jsonContent = jsonMatch[1];
        }
        
        try {
          // Parse the JSON content
          const parsedResults = JSON.parse(jsonContent);
          
          // Create processed results object
          const processedResults: any = {
            confidence: parsedResults.confidence || 'Medium',
            // Handle overview field - could be string or object
            overview: typeof parsedResults.overview === 'string' 
              ? parsedResults.overview 
              : JSON.stringify(parsedResults.overview) || '',
            // Handle domain field - could be string or object
            domain: typeof parsedResults.domain === 'string'
              ? parsedResults.domain
              : JSON.stringify(parsedResults.domain) || '',
            // Handle project field
            project: typeof parsedResults.project === 'string'
              ? parsedResults.project
              : JSON.stringify(parsedResults.project) || '',
            // Handle sentiment field
            sentiment: typeof parsedResults.sentiment === 'string'
              ? parsedResults.sentiment 
              : JSON.stringify(parsedResults.sentiment) || '',
            // Handle warning field - could be string or object
            warning: typeof parsedResults.warning === 'string'
              ? parsedResults.warning
              : JSON.stringify(parsedResults.warning) || '',
            // Handle findings field
            findings: Array.isArray(parsedResults.findings)
              ? parsedResults.findings.map((finding: any) => 
                  `Summary: ${finding.summary}\nSource: ${finding.source}\nNature: ${finding.nature}\nImpact: ${finding.potential_impact}\nRecommendation: ${finding.recommendation}`
                ).join('\n\n')
              : typeof parsedResults.findings === 'string'
                ? parsedResults.findings
                : JSON.stringify(parsedResults.findings) || ''
          };
          
          // Set the processed results
          setAnalysisResults(processedResults);
        } catch (error) {
          console.error('Error parsing JSON:', error);
          // If JSON parsing failed, set the raw output as results
          setAnalysisResults({
            overview: jsonString,
            confidence: 'Low'
          });
        }
      } else {
        // Handle simple object response
        const processedResults: any = {};
        
        if (results) {
          // Map results to the appropriate categories
          processedResults.confidence = results.confidence || results.insightConfidence || 'Medium';
          processedResults.overview = typeof results.overview === 'object' ? JSON.stringify(results.overview) : (results.overview || results.projectOverview || '');
          processedResults.domain = typeof results.domain === 'object' ? JSON.stringify(results.domain) : (results.domain || results.domainSpecific || '');
          processedResults.project = typeof results.project === 'object' ? JSON.stringify(results.project) : (results.project || results.projectSpecific || '');
          processedResults.sentiment = typeof results.sentiment === 'object' ? JSON.stringify(results.sentiment) : (results.sentiment || '');
          processedResults.warning = typeof results.warning === 'object' ? JSON.stringify(results.warning) : (results.warning || results.earlyWarning || '');
          processedResults.findings = typeof results.findings === 'object' ? JSON.stringify(results.findings) : (results.findings || results.summary || '');
          
          // Set the processed results
          setAnalysisResults(processedResults);
        }
      }
      
      // Automatically switch to insights tab when analysis is complete
      setActiveTab('insights');
    } catch (error) {
      console.error('Error processing analysis results:', error);
    }
  };

  // Handler for quick analysis tiles
  const handleQuickAnalysis = (results: any) => {
    // If there's an error, don't update the insights
    if (results && !results.error) {
      // Try to process the results for the insights tab as well
      handleAnalysisComplete(results);
    }
  };
  
  // Handle form submission for project edit
  const handleSubmit = async (data: any) => {
    if (!project || !id) return;
    
    setIsSubmitting(true);
    
    try {
      // Update the project in Supabase
      const { error } = await supabase
        .from('projects')
        .update({
          name: data.name,
          description: data.engagementOverview,
          client: data.client,
          risk_level: data.riskLevel,
          stage: data.stage,
          last_updated: new Date().toISOString() // Update the lastUpdated timestamp
        })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      // Create payload for logging purposes
      const jsonPayload = {
        action: "edit_project",
        project_id: id,
        changes: {
          name: data.name,
          description: data.engagementOverview,
          client: data.client,
          risk_level: data.riskLevel,
          stage: data.stage
        },
        timestamp: new Date().toISOString()
      };
      
      console.log("Update project payload:", jsonPayload);
      
      // Update local state with the new project data
      setProject({
        ...project,
        name: data.name,
        description: data.engagementOverview,
        client: data.client,
        riskLevel: data.riskLevel,
        stage: data.stage,
        lastUpdated: new Date().toISOString()
      });
      
      // Show success message
      toast({
        title: "Project Updated",
        description: "Project details have been successfully updated.",
      });
      
      // Close the dialog
      setIsEditDialogOpen(false);
    } catch (error: any) {
      console.error('Error updating project:', error);
      
      toast({
        title: "Update Failed",
        description: error.message || "Could not update the project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <h2 className="text-xl font-semibold">Loading project...</h2>
        </div>
      </Layout>
    );
  }
  
  if (!project) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <h2 className="text-xl font-semibold">Project not found</h2>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <ProjectHeader project={project} />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsEditDialogOpen(true)}
            className="gap-1"
          >
            <Pencil className="h-4 w-4" /> Edit Project
          </Button>
        </div>
        
        <ProjectMetrics project={project} />
        
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full md:w-[600px] grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4 mt-6">
            <ProjectOverview project={project} />
          </TabsContent>
          
          <TabsContent value="documents" className="space-y-4 mt-6">
            {id && <ProjectDocuments projectId={id} />}
          </TabsContent>
          
          <TabsContent value="analysis" className="space-y-6 mt-6">
            <AnalysisTiles onAnalysisComplete={handleQuickAnalysis} setIsProcessing={setIsProcessing} />
            <PromptPanel onAnalysisComplete={handleAnalysisComplete} />
          </TabsContent>
          
          <TabsContent value="insights" className="mt-6">
            <ProjectInsights onAnalyzeClick={() => setActiveTab('analysis')} analysisResults={analysisResults} />
          </TabsContent>
        </Tabs>
        
        {/* Edit Project Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Project Details</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="client"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="riskLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Risk Level</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                            {...field}
                          >
                            {(isLoadingRiskLevels ? RISK_LEVELS : riskLevels).map(level => (
                              <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="stage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Stage</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                            {...field}
                          >
                            {(isLoadingStages ? PROJECT_STAGES : stages).map(stage => (
                              <option key={stage} value={stage}>{stage.charAt(0).toUpperCase() + stage.slice(1)}</option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="engagementOverview"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Engagement Overview</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={5} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Project;
