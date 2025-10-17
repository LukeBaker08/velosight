
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { Edit2, Download, Trash2 } from "lucide-react";
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { deleteDocument } from '@/lib/file-operations';
import { downloadFile } from '@/lib/file-operations';
import { handleError, getErrorMessage } from '@/lib/errors';

interface Document {
  id: string;
  name: string;
  type: string;
  category: string;
  file_path?: string;
  uploadDate: string;
  uploader_id?: string;
}

interface DocumentManagementProps {
  document: Document;
  onUpdate: () => void;
  onEdit: (document: Document) => void;
  canEdit?: boolean;
}

const DocumentManagement: React.FC<DocumentManagementProps> = ({ 
  document, 
  onUpdate, 
  onEdit,
  canEdit = true 
}) => {
  const { user } = useAuth();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canManageDocument = canEdit && user && document.uploader_id === user.id;

  const handleDownload = async () => {
    if (!document.file_path) {
      toast.error('No file available for download');
      return;
    }

    try {
      await downloadFile('documents', document.file_path, document.name);
    } catch (error) {
      handleError(error, 'Document download');
      toast.error('Failed to download file');
    }
  };

  const handleDelete = async () => {
    if (!user) {
      toast.error('Authentication required');
      return;
    }

    try {
      setIsDeleting(true);
      await deleteDocument(document.id);
      toast.success('Document deleted successfully');
      onUpdate();
    } catch (error: any) {
      const errorMessage = handleError(error, 'Document deletion');
      toast.error(getErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1">
        {document.file_path && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            title="Download file"
          >
            <Download className="h-4 w-4" />
            <span className="sr-only">Download</span>
          </Button>
        )}
        {canManageDocument && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(document)}
              title="Edit document"
            >
              <Edit2 className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              title="Delete document"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
              <span className="sr-only">Delete</span>
            </Button>
          </>
        )}
      </div>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Document"
        description={`Are you sure you want to delete "${document.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </>
  );
};

export default DocumentManagement;
