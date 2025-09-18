
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const uploadFileToStorage = async (
  file: File,
  bucket: string,
  userId: string
): Promise<string | null> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file);
  
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
  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);
  
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
