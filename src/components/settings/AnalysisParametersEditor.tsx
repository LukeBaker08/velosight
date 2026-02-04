import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001/api';

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
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [editedFields, setEditedFields] = useState<Record<string, {
    system_prompt: string;
    user_prompt_template: string;
    output_schema: string;
  }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [schemaErrors, setSchemaErrors] = useState<Record<string, string | null>>({});

  useEffect(() => {
    fetchAnalysisTypes();
  }, []);

  const fetchAnalysisTypes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_API_URL}/analysis/types/admin/all`);
      const result = await response.json();

      if (!result.success) {
        console.error('Error fetching analysis types:', result.error);
        toast.error('Failed to load analysis types');
        setIsLoading(false);
        return;
      }

      const data: AnalysisType[] = result.data || [];

      setAnalysisTypes(data);

      // Initialise editable state for each type
      const fields: typeof editedFields = {};
      data.forEach((at: AnalysisType) => {
        fields[at.id] = {
          system_prompt: at.system_prompt,
          user_prompt_template: at.user_prompt_template,
          output_schema: at.output_schema ? JSON.stringify(at.output_schema, null, 2) : '',
        };
      });
      setEditedFields(fields);

      // Auto-select first type
      if (data.length > 0) {
        setSelectedTypeId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching analysis types:', err);
      toast.error('Failed to load analysis types. Is the backend server running?');
    }

    setIsLoading(false);
  };

  const handleFieldChange = (id: string, field: 'system_prompt' | 'user_prompt_template' | 'output_schema', value: string) => {
    setEditedFields(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));

    // Validate JSON for output_schema
    if (field === 'output_schema') {
      if (!value.trim()) {
        setSchemaErrors(prev => ({ ...prev, [id]: null }));
        return;
      }
      try {
        JSON.parse(value);
        setSchemaErrors(prev => ({ ...prev, [id]: null }));
      } catch (e: any) {
        setSchemaErrors(prev => ({ ...prev, [id]: e.message }));
      }
    }
  };

  const handleReset = (id: string) => {
    const at = analysisTypes.find(a => a.id === id);
    if (!at) return;

    setEditedFields(prev => ({
      ...prev,
      [id]: {
        system_prompt: at.system_prompt,
        user_prompt_template: at.user_prompt_template,
        output_schema: at.output_schema ? JSON.stringify(at.output_schema, null, 2) : '',
      }
    }));
    setSchemaErrors(prev => ({ ...prev, [id]: null }));
  };

  const handleSave = async (id: string) => {
    const edited = editedFields[id];
    if (!edited) return;

    // Validate schema JSON before saving
    let parsedSchema: any = null;
    if (edited.output_schema.trim()) {
      try {
        parsedSchema = JSON.parse(edited.output_schema);
      } catch {
        toast.error('Output schema is not valid JSON. Please fix before saving.');
        return;
      }
    }

    setSavingId(id);

    try {
      const response = await fetch(`${BACKEND_API_URL}/analysis/types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_prompt: edited.system_prompt,
          user_prompt_template: edited.user_prompt_template,
          output_schema: parsedSchema,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        console.error('Error saving analysis type:', result.error);
        toast.error(`Failed to save: ${result.error}`);
        setSavingId(null);
        return;
      }

      // Update local state to reflect saved values
      setAnalysisTypes(prev => prev.map(at =>
        at.id === id
          ? { ...at, system_prompt: edited.system_prompt, user_prompt_template: edited.user_prompt_template, output_schema: parsedSchema }
          : at
      ));

      toast.success('Analysis parameters saved');
    } catch (err) {
      console.error('Error saving analysis type:', err);
      toast.error('Failed to save. Is the backend server running?');
    }

    setSavingId(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading analysis types...</p>
        </CardContent>
      </Card>
    );
  }

  const selectedType = analysisTypes.find(at => at.id === selectedTypeId);
  const edited = selectedTypeId ? editedFields[selectedTypeId] : null;
  const schemaError = selectedTypeId ? schemaErrors[selectedTypeId] : null;
  const isSaving = selectedTypeId ? savingId === selectedTypeId : false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis Parameters</CardTitle>
        <CardDescription>
          Configure system prompts, user prompt templates, and JSON output schemas for each analysis type.
          Changes take effect on the next analysis run.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Analysis Type Selector */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label htmlFor="analysis-type-select" className="mb-2 block">Analysis Type</Label>
            <Select
              value={selectedTypeId || ''}
              onValueChange={(value) => setSelectedTypeId(value)}
            >
              <SelectTrigger id="analysis-type-select" className="w-full">
                <SelectValue placeholder="Select an analysis type..." />
              </SelectTrigger>
              <SelectContent>
                {analysisTypes.map(at => (
                  <SelectItem key={at.id} value={at.id}>
                    <div className="flex items-center gap-2">
                      <span>{at.name}</span>
                      {!at.enabled && (
                        <Badge variant="secondary" className="text-xs ml-1">Disabled</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedType && (
            <div className="pt-6">
              <Badge variant={selectedType.enabled ? "default" : "secondary"}>
                {selectedType.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          )}
        </div>

        {selectedType?.description && (
          <p className="text-sm text-muted-foreground -mt-2">{selectedType.description}</p>
        )}

        {/* Fields for selected type */}
        {selectedTypeId && edited && (
          <>
            <Separator />

            {/* System Prompt */}
            <div>
              <Label className="mb-2 block">System Prompt</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Instructions sent as the system message to the LLM. Defines the AI's role and behaviour.
              </p>
              <Textarea
                value={edited.system_prompt}
                onChange={e => handleFieldChange(selectedTypeId, 'system_prompt', e.target.value)}
                className="font-mono text-xs min-h-[400px]"
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
                value={edited.user_prompt_template}
                onChange={e => handleFieldChange(selectedTypeId, 'user_prompt_template', e.target.value)}
                className="font-mono text-xs min-h-[400px]"
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
                value={edited.output_schema}
                onChange={e => handleFieldChange(selectedTypeId, 'output_schema', e.target.value)}
                className={`font-mono text-xs min-h-[400px] ${schemaError ? 'border-red-500' : ''}`}
                placeholder='{"name": "...", "strict": true, "schema": { ... }}'
              />
              {schemaError && (
                <p className="text-xs text-red-500 mt-1">Invalid JSON: {schemaError}</p>
              )}
            </div>

            {/* Actions */}
            <Separator />
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => handleReset(selectedTypeId)}
                disabled={isSaving}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={() => handleSave(selectedTypeId)}
                disabled={!!schemaError || isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AnalysisParametersEditor;
