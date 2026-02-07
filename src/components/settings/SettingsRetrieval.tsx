import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001/api';

interface RetrievalSettings {
  framework_topk: number;
  context_topk: number;
  project_topk: number;
  sentiment_topk: number;
}

const DEFAULT_SETTINGS: RetrievalSettings = {
  framework_topk: 5,
  context_topk: 5,
  project_topk: 5,
  sentiment_topk: 5
};

const SettingsRetrieval: React.FC = () => {
  const [settings, setSettings] = useState<RetrievalSettings>(DEFAULT_SETTINGS);
  const [originalSettings, setOriginalSettings] = useState<RetrievalSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch current settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_API_URL}/analysis/settings/retrieval`);
      const data = await response.json();

      if (data.success && data.data) {
        setSettings(data.data);
        setOriginalSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching retrieval settings:', error);
      toast.error('Failed to load retrieval settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${BACKEND_API_URL}/analysis/settings/retrieval`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      const data = await response.json();

      if (data.success) {
        setOriginalSettings(data.data);
        toast.success('Retrieval settings saved successfully');
      } else {
        throw new Error(data.error || 'Failed to save settings');
      }
    } catch (error: any) {
      console.error('Error saving retrieval settings:', error);
      toast.error(error.message || 'Failed to save retrieval settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(originalSettings);
  };

  const handleChange = (field: keyof RetrievalSettings, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 20) {
      setSettings(prev => ({ ...prev, [field]: numValue }));
    }
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Retrieval Settings</CardTitle>
        <CardDescription>
          Configure the number of document chunks retrieved per category during RAG analysis.
          Higher values provide more context but increase processing time and token usage.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="framework_topk">Framework Chunks</Label>
            <Input
              id="framework_topk"
              type="number"
              min={1}
              max={20}
              value={settings.framework_topk}
              onChange={(e) => handleChange('framework_topk', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Best practices and methodology documents
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="context_topk">Context Chunks</Label>
            <Input
              id="context_topk"
              type="number"
              min={1}
              max={20}
              value={settings.context_topk}
              onChange={(e) => handleChange('context_topk', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Organisational environment documents
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project_topk">Project Chunks</Label>
            <Input
              id="project_topk"
              type="number"
              min={1}
              max={20}
              value={settings.project_topk}
              onChange={(e) => handleChange('project_topk', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Project-specific documents and artifacts
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sentiment_topk">Sentiment Chunks</Label>
            <Input
              id="sentiment_topk"
              type="number"
              min={1}
              max={20}
              value={settings.sentiment_topk}
              onChange={(e) => handleChange('sentiment_topk', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Meeting notes and stakeholder feedback
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges || isSaving}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SettingsRetrieval;
