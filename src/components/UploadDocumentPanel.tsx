import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from 'sonner';
import { DocumentCategory, DocumentType } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { uploadDocument } from '@/lib/file-operations';
import { validateFile, sanitizeInput } from '@/lib/validators';
import { handleError, getErrorMessage } from '@/lib/errors';
import { DOCUMENT_CONFIG } from '@/lib/constants';

interface UploadDocumentPanelProps {
  projectId: string;
  onSuccess?: () => void;
  existingDocument?: {
    id: string;
    name: string;
    type: DocumentType;
    category: DocumentCategory;
    file_path?: string;
  };
  mode?: 'create' | 'edit';
}

const UploadDocumentPanel: React.FC<UploadDocumentPanelProps> = ({ 
  projectId, 
  onSuccess, 
  existingDocument,
  mode = 'create'
}) => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>(existingDocument?.type || 'other');
  const [category, setCategory] = useState<DocumentCategory>(existingDocument?.category || 'project');
  const [name, setName] = useState(existingDocument?.name || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      try {
        validateFile(selectedFile);
        setFile(selectedFile);
        
        if (!name && mode === 'create') {
          setName(selectedFile.name);
        }
      } catch (error) {
        toast.error(getErrorMessage(error));
        e.target.value = ''; // Clear the input
      }
    }
  };

  const handleSubmit = async () => {
    if (mode === 'create' && !file) {
      toast.error('Please select a file to upload');
      return;
    }
    const trimmedName = name.trim();
    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Use centralized uploadDocument for both create and edit
      await uploadDocument(
        file!,
        projectId,
        {
          name: sanitizeInput(trimmedName),
          type: documentType,
          category: category,
          uploader_id: user.id
        },
        setUploadProgress
      );

      toast.success(mode === 'edit' ? 'Document updated successfully!' : 'Document uploaded successfully!');

      // Reset form
      setFile(null);
      setDocumentType('other');
      setCategory('project');
      setName('');
      setUploadProgress(0);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const errorMessage = handleError(error, 'Document processing');
      toast.error(getErrorMessage(error));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const projectDocTypes: DocumentType[] = [
    'assurance-report',
    'planning-document',
    'risk-assessment',
    'governance-document',
    'environment-scan',
    'other'
  ];

  const contextDocTypes: DocumentType[] = [
    'org-chart',
    'strategic-plan',
    'environment-scan',
    'other'
  ];
  
  const sentimentDocTypes: DocumentType[] = [
    'meeting-notes',
    'survey-results',
    'feedback',
    'other'
  ];
  
  const docTypes = category === 'project' ? projectDocTypes : 
                   category === 'context' ? contextDocTypes : 
                   sentimentDocTypes;
  
  return (
    <div className="space-y-4 py-2">
      <div className="grid gap-2">
        <Label htmlFor="file">
          {mode === 'edit' ? 'Replace File (optional)' : 'File'}
        </Label>
        <input
          id="file-upload"
          type="file"
          onChange={handleFileChange}
          accept={DOCUMENT_CONFIG.ALLOWED_TYPES.map(type => `.${type}`).join(',')}
          className="hidden"
          disabled={isUploading}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('file-upload')?.click()}
          className="w-full"
          disabled={isUploading}
        >
          {file ? `Selected: ${file.name}` : (mode === 'edit' ? 'Replace File (optional)' : 'Choose File')}
        </Button>
        {file && (
          <p className="text-sm text-muted-foreground">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        )}
        {mode === 'edit' && existingDocument?.file_path && !file && (
          <p className="text-sm text-muted-foreground">
            Current file will be kept if no new file is selected
          </p>
        )}
        {isUploading && uploadProgress > 0 && (
          <div className="text-sm text-muted-foreground">
            Upload progress: {Math.round(uploadProgress)}%
          </div>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="name">Document Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter document name"
        />
      </div>

      <div className="space-y-2">
        <Label>Document Category</Label>
        <RadioGroup 
          value={category} 
          onValueChange={(value) => {
            setCategory(value as DocumentCategory);
            setDocumentType('other');
          }}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="project" id="project" />
            <Label htmlFor="project">Project Document</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="context" id="context" />
            <Label htmlFor="context">Context Document</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sentiment" id="sentiment" />
            <Label htmlFor="sentiment">Sentiment Document</Label>
          </div>
        </RadioGroup>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="document-type">Document Type</Label>
        <Select value={documentType} onValueChange={(value) => setDocumentType(value as DocumentType)}>
          <SelectTrigger>
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>
          <SelectContent>
            {docTypes.map(type => (
              <SelectItem key={type} value={type}>
                {type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-end pt-4">
        <Button onClick={handleSubmit} disabled={isUploading}>
          {isUploading ? (mode === 'edit' ? 'Updating...' : 'Uploading...') : (mode === 'edit' ? 'Update Document' : 'Upload Document')}
        </Button>
      </div>
    </div>
  );
};

export default UploadDocumentPanel;
