import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { documentWebhooks, materialWebhooks } from '@/lib/webhooks';
import { NetworkError } from '@/lib/errors';

/*Storage helpers*/

export const uploadFileToStorage = async (
  file: File,
  bucket: string,
  userId: string
): Promise<string | null> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage.from(bucket).upload(fileName, file);

  if (error) {
    console.error('Error uploading file:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  return data.path;
};

export const deleteFileFromStorage = async (
  bucket: string,
  filePath: string
): Promise<void> => {
  const { error } = await supabase.storage.from(bucket).remove([filePath]);

  if (error) {
    console.error('Error deleting file:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

export const getFileUrl = async (
  bucket: string,
  filePath: string,
  expiresIn: number = 3600
): Promise<string> => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    console.error('Error creating signed URL:', error);
    throw new Error(`Failed to create file URL: ${error.message}`);
  }

  return data.signedUrl;
};

export const downloadFile = async (
  bucket: string,
  filePath: string,
  fileName: string
): Promise<void> => {
  try {
    const signedUrl = await getFileUrl(bucket, filePath);

    const response = await fetch(signedUrl);
    if (!response.ok) {
      throw new Error('Failed to download file');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast.success('File downloaded successfully');
  } catch (error) {
    console.error('Error downloading file:', error);
    toast.error('Failed to download file');
  }
};

export const processProjectDocForRag = async (args: {
  projectId: string;
  documentId: string;   // id from `documents`
  filePath: string;     // storage key from uploadFileToStorage
  name: string;
  type: string;
  category: string;
  uploaderId: string;
  bucket?: string;      // defaults to 'documents' server-side
}): Promise<void> => {
  const {
    projectId,
    documentId,
    filePath,
    name,
    type,
    category,
    uploaderId,
    bucket = 'documents',
  } = args;

  const res = await documentWebhooks.upload(projectId, documentId, {
    name,
    type,
    category,
    uploader_id: uploaderId,
    file_path: filePath,   // 👈 pointer (NOT a File)
    bucket,
  });

  if (!res.success) {
    throw new NetworkError(`RAG (project) pointer upload failed: ${res.error ?? 'Unknown error'}`);
  }
};

export const processMaterialForRag = async (args: {
  materialId: string;   // id from `framework_materials`
  filePath: string;     // storage key from upload
  title: string;
  type: string;
  uploaderId: string;
  bucket?: string;      // defaults to 'materials' server-side
}): Promise<void> => {
  const {
    materialId,
    filePath,
    title,
    type,
    uploaderId,
    bucket = 'materials',
  } = args;

  const res = await materialWebhooks.upload(materialId, {
    title,
    type,
    uploader_id: uploaderId,
    file_path: filePath,  // 👈 pointer (NOT a File)
    bucket,
  });

  if (!res.success) {
    throw new NetworkError(`RAG (material) pointer upload failed: ${res.error ?? 'Unknown error'}`);
  }
};