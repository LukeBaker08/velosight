import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { uploadDocument } from '@/lib/file-operations';
import { validateFile, sanitizeInput } from '@/lib/validators';
import { handleError, getErrorMessage } from '@/lib/errors';
import { DOCUMENT_CONFIG } from '@/lib/constants';
import { useDropdownValues } from '@/hooks/useDropdownValues';
import { Skeleton } from '@/components/ui/skeleton';

type DocumentCategory = 'project' | 'context' | 'sentiment';

interface UploadDocumentPanelProps {
  projectId: string;
  onSuccess?: () => void;
  existingDocument?: {
    id: string;
    name: string;
    type: string;
    category: string;
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
  const [documentType, setDocumentType] = useState<string>(existingDocument?.type || '');
  const [category, setCategory] = useState<DocumentCategory>(
    (existingDocument?.category as DocumentCategory) || 'project'
  );
  const [name, setName] = useState(existingDocument?.name || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch document types from database based on category
  const { values: projectDocTypes, isLoading: projectLoading } = useDropdownValues('%project%document%type%');
  const { values: contextDocTypes, isLoading: contextLoading } = useDropdownValues('%context%document%type%');
  const { values: sentimentDocTypes, isLoading: sentimentLoading } = useDropdownValues('%sentiment%document%type%');

  // Get the appropriate document types based on selected category
  const getDocTypesForCategory = () => {
    switch (category) {
      case 'project':
        return projectDocTypes.length > 0 ? projectDocTypes : ['Other'];
      case 'context':
        return contextDocTypes.length > 0 ? contextDocTypes : ['Other'];
      case 'sentiment':
        return sentimentDocTypes.length > 0 ? sentimentDocTypes : ['Other'];
      default:
        return ['Other'];
    }
  };

  const docTypes = getDocTypesForCategory();
  const isLoadingTypes = category === 'project' ? projectLoading :
                         category === 'context' ? contextLoading :
                         sentimentLoading;

  // Reset document type when category changes
  useEffect(() => {
    if (!existingDocument) {
      setDocumentType('');
    }
  }, [category, existingDocument]);

  // Set default document type once types are loaded
  useEffect(() => {
    if (!isLoadingTypes && docTypes.length > 0 && !documentType) {
      setDocumentType(docTypes[0]);
    }
  }, [isLoadingTypes, docTypes, documentType]);

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

    if (!documentType) {
      toast.error('Please select a document type');
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
      setDocumentType('');
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

  // Format document type for display (convert kebab-case to Title Case)
  const formatDocType = (type: string) => {
    return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

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
            setDocumentType(''); // Reset type when category changes
          }}
          className="flex flex-wrap gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="project" id="project" />
            <Label htmlFor="project" className="cursor-pointer">Project</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="context" id="context" />
            <Label htmlFor="context" className="cursor-pointer">Context</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sentiment" id="sentiment" />
            <Label htmlFor="sentiment" className="cursor-pointer">Sentiment</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="document-type">Document Type</Label>
        {isLoadingTypes ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Select
            value={documentType}
            onValueChange={setDocumentType}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              {docTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {formatDocType(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSubmit} disabled={isUploading || isLoadingTypes || !documentType}>
          {isUploading ? (mode === 'edit' ? 'Updating...' : 'Uploading...') : (mode === 'edit' ? 'Update Document' : 'Upload Document')}
        </Button>
      </div>
    </div>
  );
};

export default UploadDocumentPanel;
