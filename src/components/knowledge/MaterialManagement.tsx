
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Edit2, Download, Trash2, FileText } from "lucide-react";
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { downloadFile, deleteFileFromStorage } from '@/utils/fileOperations';

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

interface MaterialManagementProps {
  material: AssuranceDocument;
  onUpdate: () => void;
  onEdit: (material: AssuranceDocument) => void;
  canEdit?: boolean;
}

const MaterialManagement: React.FC<MaterialManagementProps> = ({ 
  material, 
  onUpdate, 
  onEdit,
  canEdit = true 
}) => {
  const { user } = useAuth();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Show edit/delete buttons if user is authenticated and can edit
  const canManageMaterial = canEdit && user && (material.uploader_id === user.id || !material.uploader_id);

  const handleDownload = async () => {
    if (material.file_path) {
      try {
        await downloadFile('materials', material.file_path, material.title);
      } catch (error) {
        console.error('Download error:', error);
        toast.error('Failed to download file');
      }
    } else if (material.content) {
      // Download text content as a file
      const blob = new Blob([material.content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${material.title}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Content downloaded successfully');
    } else {
      toast.error('No content available for download');
    }
  };

  const handleDelete = async () => {
    if (!user) {
      toast.error('Authentication required');
      return;
    }

    try {
      setIsDeleting(true);

      // Delete file from storage if it exists
      if (material.file_path) {
        await deleteFileFromStorage('materials', material.file_path);
      }

      // Delete database record
      const { error } = await supabase
        .from('framework_materials')
        .delete()
        .eq('id', material.id);

      if (error) {
        throw error;
      }

      // Trigger deletion webhook via Supabase Edge function
      try {
        const { error: webhookError } = await supabase.functions.invoke('material-deletion-webhook', {
          body: {
            document_id: material.id
          }
        });
        
        if (webhookError) {
          console.error('Material deletion webhook error:', webhookError);
        } else {
          console.log('Material deletion webhook triggered successfully');
        }
      } catch (webhookError) {
        console.error('Failed to trigger material deletion webhook:', webhookError);
      }

      toast.success('Material deleted successfully');
      onUpdate();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete material');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1">
        {(material.file_path || material.content) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            title="Download content"
          >
            <Download className="h-4 w-4" />
            <span className="sr-only">Download</span>
          </Button>
        )}
        {canManageMaterial && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(material)}
              title="Edit material"
            >
              <Edit2 className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              title="Delete material"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
              <span className="sr-only">Delete</span>
            </Button>
          </>
        )}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Material</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{material.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MaterialManagement;
