import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { uploadFileToStorage } from '@/utils/fileOperations';
import { useAllDropdownCategories } from '@/hooks/useAllDropdownCategories';
import { validateFile, sanitizeInput } from '@/lib/validators';
import { handleError, getErrorMessage } from '@/lib/errors';

interface UploadAssuranceMaterialPanelProps {
  onSuccess?: () => void;
  existingMaterial?: {
    id: string;
    title: string;
    type: string;
    file_path?: string | null;
    content?: string | null;
  };
  mode?: 'create' | 'edit';
}

const UploadAssuranceMaterialPanel: React.FC<UploadAssuranceMaterialPanelProps> = ({ 
  onSuccess, 
  existingMaterial,
  mode = 'create'
}) => {
  const { user } = useAuth();
  const { categories } = useAllDropdownCategories();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState(existingMaterial?.title || '');
  const [category, setCategory] = useState(existingMaterial?.type || '');
  const [content, setContent] = useState(existingMaterial?.content || '');
  const [contentType, setContentType] = useState<'file' | 'text'>(
    existingMaterial?.file_path ? 'file' : 'file'
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Find the Framework Material Types category and get its values
  const frameworkMaterialCategory = categories.find(cat => 
    cat.name.toLowerCase().includes('framework') && cat.name.toLowerCase().includes('material')
  );
  
  // Use values from database, fallback to default values if category not found
  const availableCategories = frameworkMaterialCategory?.values?.length > 0 
    ? frameworkMaterialCategory.values 
    : ['Framework', 'Governance', 'Checklist', 'Template', 'Reference', 'Other'];
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      try {
        validateFile(selectedFile);
        setFile(selectedFile);
        
        // Auto-populate title if empty
        if (!title && mode === 'create') {
          setTitle(selectedFile.name.split('.')[0]);
        }
      } catch (error) {
        toast.error(getErrorMessage(error));
        e.target.value = ''; // Clear the input
      }
    }
  };

  // Function to trigger webhook for materials
  const triggerMaterialWebhook = async (document_id: string, file_path: string, type: string, action: 'create' | 'update') => {
    try {
      const { error } = await supabase.functions.invoke('material-webhook', {
        body: {
          document_id,
          file_path,
          type,
          action
        }
      });
      
      if (error) {
        console.error('Material webhook error:', error);
      } else {
        console.log(`Material ${action} webhook triggered successfully`);
      }
    } catch (error) {
      console.error(`Failed to trigger material ${action} webhook:`, error);
    }
  };
  
  const handleSubmit = async () => {
    // Basic validation
    const trimmedTitle = title.trim();
    if (!trimmedTitle || !category) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (contentType === 'file' && mode === 'create' && !file) {
      toast.error('Please select a file to upload');
      return;
    }

    if (contentType === 'text' && !content.trim()) {
      toast.error('Please provide text content');
      return;
    }

    if (!user) {
      toast.error('Please log in to upload materials');
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      let filePath = existingMaterial?.file_path;
      let finalContent = contentType === 'text' ? content.trim() : null;
      
      // Upload file if provided
      if (file && contentType === 'file') {
        setUploadProgress(10);
        filePath = await uploadFileToStorage(file, 'materials', user.id);
        finalContent = null; // Clear content when uploading file
        setUploadProgress(50);
      } else if (contentType === 'text') {
        filePath = null; // Clear file path when using text content
      }
      
      if (mode === 'edit' && existingMaterial) {
        // Update existing material
        setUploadProgress(70);
        const { error } = await supabase
          .from('framework_materials')
          .update({
            title: sanitizeInput(trimmedTitle),
            type: category,
            file_path: filePath,
            content: finalContent,
            updated_at: new Date().toISOString(),
            uploader_id: user.id
          })
          .eq('id', existingMaterial.id);
        
        if (error) {
          throw new Error(`Error updating material: ${error.message}`);
        }

        // Trigger webhook for updated material
        if (filePath) {
          await triggerMaterialWebhook(existingMaterial.id, filePath, category, 'update');
        }
        
        toast.success('Material updated successfully');
      } else {
        // Create new material
        setUploadProgress(70);
        const { data, error } = await supabase
          .from('framework_materials')
          .insert({
            title: sanitizeInput(trimmedTitle),
            type: category,
            file_path: filePath,
            content: finalContent,
            uploader_id: user.id,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) {
          throw new Error(`Error creating material: ${error.message}`);
        }

        // Trigger webhook for new material
        if (filePath && data) {
          await triggerMaterialWebhook(data.id, filePath, category, 'create');
        }
        
        toast.success('Material uploaded successfully');
      }
      
      setUploadProgress(100);
      
      // Reset form
      resetForm();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      const errorMessage = handleError(error, 'Material processing');
      toast.error(getErrorMessage(error));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  
  const resetForm = () => {
    setFile(null);
    setTitle('');
    setCategory('');
    setContent('');
    setContentType('text');
    setUploadProgress(0);
  };
  
  return (
    <div className="space-y-4 py-2">
      {!user && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            ⚠️ You need to log in to upload materials. Please sign in first.
          </p>
        </div>
      )}
      
      <div className="grid gap-2">
        <Label>Content Source</Label>
        <div className="flex gap-4">
          <Button 
            type="button" 
            variant={contentType === 'file' ? "default" : "outline"}
            onClick={() => {
              setContentType('file');
              setContent('');
            }}
          >
            File Upload
          </Button>
          <Button 
            type="button" 
            variant={contentType === 'text' ? "default" : "outline"}
            onClick={() => {
              setContentType('text');
              setFile(null);
            }}
          >
            Text Content
          </Button>
        </div>
      </div>
      
      {contentType === 'file' && (
        <>
          <input
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md"
            className="hidden"
          />
          
          <div className="grid gap-2">
            <Label>File</Label>
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('file-upload')?.click()}
              className="w-full"
              disabled={!user}
            >
              {file ? `Selected: ${file.name}` : (mode === 'edit' ? 'Replace File (optional)' : 'Choose File')}
            </Button>
            {file && (
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
            {mode === 'edit' && existingMaterial?.file_path && !file && (
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
        </>
      )}
      
      {contentType === 'text' && (
        <div className="grid gap-2">
          <Label htmlFor="content">Text Content</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your material content here..."
            rows={6}
          />
        </div>
      )}
      
      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Material title"
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="category">Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {availableCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleSubmit} 
          disabled={isUploading || !user}
        >
          {isUploading ? (mode === 'edit' ? 'Updating...' : 'Uploading...') : (mode === 'edit' ? 'Update Material' : 'Upload Material')}
        </Button>
      </div>
    </div>
  );
};

export default UploadAssuranceMaterialPanel;
