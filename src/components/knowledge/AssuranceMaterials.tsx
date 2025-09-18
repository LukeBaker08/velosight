
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Upload, Folder, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/context/AuthContext';
import UploadAssuranceMaterialPanel from './UploadAssuranceMaterialPanel';
import MaterialManagement from './MaterialManagement';
import { formatDate } from '@/utils/dateUtils';

interface AssuranceDocument {
  id: string;
  title: string;
  type: string;
  file_path: string | null;
  content: string | null;
  created_at: string;
  updated_at: string;
  uploader_id?: string;
}

const AssuranceMaterials: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<AssuranceDocument[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<AssuranceDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch framework materials from Supabase
  useEffect(() => {
    fetchMaterials();
  }, []);
  
  const fetchMaterials = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching framework materials...');
      
      const { data, error } = await supabase
        .from('framework_materials')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching materials:', error);
        toast.error('Failed to load framework materials');
        return;
      }
      
      console.log('Fetched materials:', data);
      setDocuments(data || []);
    } catch (err) {
      console.error('Error in materials fetching:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditMaterial = (material: AssuranceDocument) => {
    console.log('Editing material:', material);
    setEditingMaterial(material);
    setIsDialogOpen(true);
  };

  const handleOpenUploadDialog = () => {
    console.log('Opening upload dialog...');
    setEditingMaterial(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    console.log('Closing dialog...');
    setIsDialogOpen(false);
    setEditingMaterial(null);
  };

  const handleSuccess = () => {
    console.log('Upload/edit successful, refreshing materials...');
    setIsDialogOpen(false);
    setEditingMaterial(null);
    fetchMaterials();
  };
  
  const getFileIcon = (contentType: string) => {
    switch (contentType.toLowerCase()) {
      case 'framework':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'governance':
        return <FileText className="h-5 w-5 text-green-500" />;
      case 'checklist':
        return <FileText className="h-5 w-5 text-amber-500" />;
      case 'template':
        return <FileText className="h-5 w-5 text-purple-500" />;
      case 'reference':
        return <FileText className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Framework Materials</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenUploadDialog}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Material
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>
                {editingMaterial ? 'Edit Material' : 'Upload Framework Material'}
              </DialogTitle>
              <DialogDescription>
                {editingMaterial 
                  ? 'Update the material information and content.' 
                  : 'Upload a new document or create text content for your framework materials library.'
                }
              </DialogDescription>
            </DialogHeader>
            <UploadAssuranceMaterialPanel 
              onSuccess={handleSuccess}
              existingMaterial={editingMaterial || undefined}
              mode={editingMaterial ? 'edit' : 'create'}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead className="hidden md:table-cell">Date Added</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <div className="flex justify-center items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading materials...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No materials found. Create your first one by clicking the "Upload Material" button.
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getFileIcon(doc.type)}
                      <span className="truncate max-w-[500px]" title={doc.title}>
                        {doc.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1">
                      <Folder className="h-4 w-4 text-muted-foreground" />
                      {doc.type}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(doc.created_at)}
                  </TableCell>
                  <TableCell>
                    <MaterialManagement
                      material={doc}
                      onUpdate={fetchMaterials}
                      onEdit={handleEditMaterial}
                      canEdit={true}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AssuranceMaterials;
