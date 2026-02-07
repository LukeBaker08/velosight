import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Save, RotateCcw, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedLoadingSpinner } from '@/components/ui/enhanced-loading';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001/api';

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
};

interface AnalysisType {
  id: string;
  key: string;
  name: string;
  description: string | null;
  icon: string;
  icon_color: string;
  system_prompt: string;
  user_prompt_template: string;
  output_schema: any;
  enabled: boolean;
  sort_order: number;
}

const AnalysisParametersEditor: React.FC = () => {
  const [analysisTypes, setAnalysisTypes] = useState<AnalysisType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingType, setEditingType] = useState<AnalysisType | null>(null);
  const [editedFields, setEditedFields] = useState<{
    system_prompt: string;
    user_prompt_template: string;
    output_schema: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalysisTypes();
  }, []);

  useEffect(() => {
    if (editingType) {
      setEditedFields({
        system_prompt: editingType.system_prompt,
        user_prompt_template: editingType.user_prompt_template,
        output_schema: editingType.output_schema ? JSON.stringify(editingType.output_schema, null, 2) : '',
      });
      setSchemaError(null);
    } else {
      setEditedFields(null);
    }
  }, [editingType]);

  const fetchAnalysisTypes = async () => {
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${BACKEND_API_URL}/analysis/types/admin/all`, { headers });
      const result = await response.json();

      if (!result.success) {
        console.error('Error fetching analysis types:', result.error);
        toast.error('Failed to load analysis types');
        setIsLoading(false);
        return;
      }

      setAnalysisTypes(result.data || []);
    } catch (err) {
      console.error('Error fetching analysis types:', err);
      toast.error('Failed to load analysis types. Is the backend server running?');
    }
    setIsLoading(false);
  };

  const handleFieldChange = (field: 'system_prompt' | 'user_prompt_template' | 'output_schema', value: string) => {
    if (!editedFields) return;
    setEditedFields(prev => prev ? { ...prev, [field]: value } : null);

    if (field === 'output_schema') {
      if (!value.trim()) {
        setSchemaError(null);
        return;
      }
      try {
        JSON.parse(value);
        setSchemaError(null);
      } catch (e: any) {
        setSchemaError(e.message);
      }
    }
  };

  const handleReset = () => {
    if (!editingType) return;
    setEditedFields({
      system_prompt: editingType.system_prompt,
      user_prompt_template: editingType.user_prompt_template,
      output_schema: editingType.output_schema ? JSON.stringify(editingType.output_schema, null, 2) : '',
    });
    setSchemaError(null);
  };

  const handleSave = async () => {
    if (!editingType || !editedFields) return;

    let parsedSchema: any = null;
    if (editedFields.output_schema.trim()) {
      try {
        parsedSchema = JSON.parse(editedFields.output_schema);
      } catch {
        toast.error('Output schema is not valid JSON. Please fix before saving.');
        return;
      }
    }

    setIsSaving(true);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${BACKEND_API_URL}/analysis/types/${editingType.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          system_prompt: editedFields.system_prompt,
          user_prompt_template: editedFields.user_prompt_template,
          output_schema: parsedSchema,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        console.error('Error saving analysis type:', result.error);
        toast.error(`Failed to save: ${result.error}`);
        setIsSaving(false);
        return;
      }

      setAnalysisTypes(prev => prev.map(at =>
        at.id === editingType.id
          ? {
              ...at,
              system_prompt: editedFields.system_prompt,
              user_prompt_template: editedFields.user_prompt_template,
              output_schema: parsedSchema
            }
          : at
      ));

      toast.success('Analysis parameters saved');
      setEditingType(null);
    } catch (err) {
      console.error('Error saving analysis type:', err);
      toast.error('Failed to save. Is the backend server running?');
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-48">
            <EnhancedLoadingSpinner
              size="lg"
              text="Loading analysis types..."
              component="AnalysisParametersEditor"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Analysis Parameters</CardTitle>
          <CardDescription>
            Configure system prompts, user prompt templates, and JSON output schemas for each analysis type.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Analysis Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysisTypes.map((at) => (
                <TableRow key={at.id}>
                  <TableCell className="font-medium">{at.name}</TableCell>
                  <TableCell>
                    <Badge variant={at.enabled ? 'default' : 'secondary'}>
                      {at.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[300px] truncate">
                    {at.description || '—'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingType(at)}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit {at.name}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!editingType} onOpenChange={(open) => !open && setEditingType(null)}>
        <SheetContent className="sm:max-w-3xl overflow-y-auto">
          {editingType && editedFields && (
            <>
              <SheetHeader>
                <SheetTitle>{editingType.name}</SheetTitle>
                <SheetDescription>
                  Edit prompts and output schema for this analysis type.
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* System Prompt */}
                <div>
                  <Label className="mb-2 block">System Prompt</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Instructions sent as the system message to the LLM. Defines the AI's role and behaviour.
                  </p>
                  <Textarea
                    value={editedFields.system_prompt}
                    onChange={e => handleFieldChange('system_prompt', e.target.value)}
                    className="font-mono text-xs min-h-[250px]"
                    placeholder="Enter system prompt..."
                  />
                </div>

                {/* User Prompt Template */}
                <div>
                  <Label className="mb-2 block">User Prompt Template</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Template for the user message. Use <code className="bg-muted px-1 rounded">{'{context}'}</code> for
                    retrieved RAG context, <code className="bg-muted px-1 rounded">{'{query}'}</code> for the
                    analysis query, and <code className="bg-muted px-1 rounded">{'{subtype}'}</code> for the
                    subtype (e.g. gateway type).
                  </p>
                  <Textarea
                    value={editedFields.user_prompt_template}
                    onChange={e => handleFieldChange('user_prompt_template', e.target.value)}
                    className="font-mono text-xs min-h-[250px]"
                    placeholder="Enter user prompt template..."
                  />
                </div>

                {/* Output Schema */}
                <div>
                  <Label className="mb-2 block">Output Schema (JSON)</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    JSON Schema enforced by Azure OpenAI structured outputs. Must include <code className="bg-muted px-1 rounded">name</code>,{' '}
                    <code className="bg-muted px-1 rounded">strict</code>, and <code className="bg-muted px-1 rounded">schema</code> fields.
                    Leave empty to use basic JSON mode.
                  </p>
                  <Textarea
                    value={editedFields.output_schema}
                    onChange={e => handleFieldChange('output_schema', e.target.value)}
                    className={`font-mono text-xs min-h-[250px] ${schemaError ? 'border-red-500' : ''}`}
                    placeholder='{"name": "...", "strict": true, "schema": { ... }}'
                  />
                  {schemaError && (
                    <p className="text-xs text-red-500 mt-1">Invalid JSON: {schemaError}</p>
                  )}
                </div>

                <Separator />

                <SheetFooter>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={isSaving}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!!schemaError || isSaving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </SheetFooter>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default AnalysisParametersEditor;
