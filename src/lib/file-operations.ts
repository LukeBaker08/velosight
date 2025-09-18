/**
 * Centralized file operations for uploads, downloads, and validation
 */

import { supabase } from '@/integrations/supabase/client';
import { validateFile } from './validators';
import { handleError, ValidationError, NetworkError } from './errors';
import { documentWebhooks, materialWebhooks } from './webhooks';

export interface UploadOptions {
  bucket: string;
  folder?: string;
  filename?: string;
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  path: string;
  publicUrl?: string;
}

/**
 * Upload file to Supabase storage with validation and progress tracking
 */
export const uploadFile = async (
  file: File,
  options: UploadOptions
): Promise<UploadResult> => {
  try {
    // Validate file before upload
    validateFile(file);

    const { bucket, folder = '', filename } = options;
    const finalFilename = filename || `${Date.now()}-${file.name}`;
    const filePath = folder ? `${folder}/${finalFilename}` : finalFilename;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new NetworkError(`Upload failed: ${error.message}`);
    }

    // Get public URL if bucket is public
    let publicUrl: string | undefined;
    if (bucket === 'materials') {
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);
      publicUrl = urlData.publicUrl;
    }

    return {
      path: data.path,
      publicUrl
    };

  } catch (error) {
    throw new Error(handleError(error, 'File upload'));
  }
};

/**
 * Download file from Supabase storage
 */
export const downloadFile = async (bucket: string, path: string): Promise<Blob> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);

    if (error) {
      throw new NetworkError(`Download failed: ${error.message}`);
    }

    return data;
  } catch (error) {
    throw new Error(handleError(error, 'File download'));
  }
};

/**
 * Delete file from Supabase storage
 */
export const deleteFile = async (bucket: string, path: string): Promise<void> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw new NetworkError(`Delete failed: ${error.message}`);
    }
  } catch (error) {
    throw new Error(handleError(error, 'File deletion'));
  }
};

/**
 * Complete document upload process with webhook notification
 */
export const uploadDocument = async (
  file: File,
  projectId: string,
  documentData: {
    name: string;
    type: string;
    category: string;
    uploader_id: string;
  },
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    onProgress?.(10);

    // Upload file to storage
    const uploadResult = await uploadFile(file, {
      bucket: 'documents',
      folder: projectId,
      onProgress: (progress) => onProgress?.(10 + progress * 0.6)
    });

    onProgress?.(70);

    // Save document metadata to database
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        ...documentData,
        project_id: projectId,
        file_path: uploadResult.path,
      })
      .select()
      .single();

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await deleteFile('documents', uploadResult.path).catch(() => {});
      throw new NetworkError(`Database error: ${dbError.message}`);
    }

    onProgress?.(85);

    // Trigger webhook for document processing
    const webhookResult = await documentWebhooks.upload(projectId, document.id);
    if (!webhookResult.success) {
      console.warn('Document webhook failed:', webhookResult.error);
    }

    onProgress?.(100);
    return document.id;

  } catch (error) {
    throw new Error(handleError(error, 'Document upload'));
  }
};

/**
 * Complete material upload process with webhook notification
 */
export const uploadMaterial = async (
  file: File | null,
  materialData: {
    title: string;
    type: string;
    content?: string;
    uploader_id: string;
  },
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    onProgress?.(10);

    let filePath: string | null = null;

    // Upload file if provided
    if (file) {
      const uploadResult = await uploadFile(file, {
        bucket: 'materials',
        onProgress: (progress) => onProgress?.(10 + progress * 0.6)
      });
      filePath = uploadResult.path;
    }

    onProgress?.(70);

    // Save material metadata to database
    const { data: material, error: dbError } = await supabase
      .from('framework_materials')
      .insert({
        ...materialData,
        file_path: filePath,
      })
      .select()
      .single();

    if (dbError) {
      // Clean up uploaded file if database insert fails
      if (filePath) {
        await deleteFile('materials', filePath).catch(() => {});
      }
      throw new NetworkError(`Database error: ${dbError.message}`);
    }

    onProgress?.(85);

    // Trigger webhook for material processing
    const webhookResult = await materialWebhooks.upload(material.id);
    if (!webhookResult.success) {
      console.warn('Material webhook failed:', webhookResult.error);
    }

    onProgress?.(100);
    return material.id;

  } catch (error) {
    throw new Error(handleError(error, 'Material upload'));
  }
};

/**
 * Delete document with file cleanup and webhook notification
 */
export const deleteDocument = async (documentId: string): Promise<void> => {
  try {
    // Get document info
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('file_path, project_id')
      .eq('id', documentId)
      .single();

    if (fetchError) {
      throw new NetworkError(`Failed to fetch document: ${fetchError.message}`);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      throw new NetworkError(`Database error: ${dbError.message}`);
    }

    // Delete file from storage
    if (document.file_path) {
      await deleteFile('documents', document.file_path);
    }

    // Trigger webhook
    const webhookResult = await documentWebhooks.delete(document.project_id, documentId);
    if (!webhookResult.success) {
      console.warn('Document deletion webhook failed:', webhookResult.error);
    }

  } catch (error) {
    throw new Error(handleError(error, 'Document deletion'));
  }
};

/**
 * Delete material with file cleanup and webhook notification
 */
export const deleteMaterial = async (materialId: string): Promise<void> => {
  try {
    // Get material info
    const { data: material, error: fetchError } = await supabase
      .from('framework_materials')
      .select('file_path')
      .eq('id', materialId)
      .single();

    if (fetchError) {
      throw new NetworkError(`Failed to fetch material: ${fetchError.message}`);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('framework_materials')
      .delete()
      .eq('id', materialId);

    if (dbError) {
      throw new NetworkError(`Database error: ${dbError.message}`);
    }

    // Delete file from storage
    if (material.file_path) {
      await deleteFile('materials', material.file_path);
    }

    // Trigger webhook
    const webhookResult = await materialWebhooks.delete(materialId);
    if (!webhookResult.success) {
      console.warn('Material deletion webhook failed:', webhookResult.error);
    }

  } catch (error) {
    throw new Error(handleError(error, 'Material deletion'));
  }
};