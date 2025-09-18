import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, FileText, Loader2 } from "lucide-react";
import UploadDocumentPanel from '@/components/UploadDocumentPanel';
import DocumentManagement from '@/components/DocumentManagement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/utils/dateUtils';

interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  category: string;
  file_path?: string;
  uploader_id?: string;
}

interface ProjectDocumentsProps {
  projectId: string;
}

const ProjectDocuments: React.FC<ProjectDocumentsProps> = ({ projectId }) => {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch documents for this project
  const fetchDocuments = async () => {
    if (!projectId) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('id, name, type, category, upload_date, file_path, uploader_id')
        .eq('project_id', projectId)
        .order('upload_date', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      const formattedDocs = data.map(doc => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        uploadDate: doc.upload_date,
        category: doc.category || 'project',
        file_path: doc.file_path || undefined,
        uploader_id: doc.uploader_id || undefined
      }));
      
      setDocuments(formattedDocs);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch documents on mount and when projectId changes
  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  const handleUploadSuccess = () => {
    setIsDialogOpen(false);
    setEditingDocument(null);
    fetchDocuments();
  };

  const handleEditDocument = (document: Document) => {
    setEditingDocument(document);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingDocument(null);
  };

  const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  // Function to get document type icon
  const getDocumentTypeIcon = (type: string) => {
    return <FileText className="h-4 w-4 text-blue-500" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Project Documents</CardTitle>
          <Button onClick={() => setIsDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Document
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Type</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="hidden md:table-cell">Date Added</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading documents...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No documents have been uploaded yet.
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="truncate max-w-[500px]" title={doc.name}>
                          {doc.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell capitalize">
                      {doc.type.replace(/-/g, ' ')}
                    </TableCell>
                    <TableCell className="hidden md:table-cell capitalize">
                      {formatCategory(doc.category)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatDate(doc.uploadDate)}
                    </TableCell>
                    <TableCell>
                      <DocumentManagement
                        document={doc}
                        onUpdate={fetchDocuments}
                        onEdit={handleEditDocument}
                        canEdit={user ? doc.uploader_id === user.id : false}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDocument ? 'Edit Document' : 'Upload Document'}
            </DialogTitle>
          </DialogHeader>
          <UploadDocumentPanel 
            projectId={projectId} 
            onSuccess={handleUploadSuccess}
            existingDocument={editingDocument ? {
              id: editingDocument.id,
              name: editingDocument.name,
              type: editingDocument.type as any,
              category: editingDocument.category as any,
              file_path: editingDocument.file_path
            } : undefined}
            mode={editingDocument ? 'edit' : 'create'}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectDocuments;
