/*Webhook utilities for consistent API interactions*/

import { handleError, NetworkError } from './errors';
import { API_CONFIG } from './constants';

interface WebhookResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

const RAG_API_URL = import.meta.env.VITE_RAG_API_URL || 'http://localhost:8002';

/*Generic webhook caller with error handling and retries*/
export const callWebhook = async <T = any>(
  url: string,
  options: RequestInit = {},
  retries: number = API_CONFIG.RETRY_ATTEMPTS
): Promise<WebhookResponse<T>> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const isFormData = options.body instanceof FormData;

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: isFormData
        ? options.headers // ✅ let browser set Content-Type for FormData
        : {
            'Content-Type': 'application/json',
            ...options.headers,
          },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new NetworkError(`HTTP ${response.status}: ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    let data: T;

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = (await response.text()) as T;
    }

    return { success: true, data };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new NetworkError('Request timeout');
    }
    if (retries > 0 && error instanceof NetworkError) {
      console.warn(`Webhook call failed, retrying... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return callWebhook(url, options, retries - 1);
    }
    const errorMessage = handleError(error, 'Webhook call');
    return { success: false, error: errorMessage };
  }
};

/*Document webhook utilities*/
export const documentWebhooks = {
  async upload(
    projectId: string,
    documentId: string,
    data: {
      name: string;
      type: string;
      category: string;
      uploader_id: string;
      file_path: string;
      bucket?: string;
    }
  ): Promise<WebhookResponse> {
    const fd = new FormData();
    fd.append('project_id', projectId);
    fd.append('document_id', documentId);
    fd.append('category', data.category);
    fd.append('type', data.type);
    fd.append('uploader_id', data.uploader_id);
    fd.append('name', data.name);
    fd.append('file_path', data.file_path);
    if (data.bucket) fd.append('bucket', data.bucket);

    return callWebhook(`${RAG_API_URL}/documents/project/upload`, {
      method: 'POST',
      body: fd,   // let the browser set multipart headers
    });
  },

  async delete(projectId: string, documentId: string): Promise<WebhookResponse> {
    return callWebhook(`${RAG_API_URL}/documents/project/delete`, {
      method: 'DELETE',
      body: JSON.stringify({ document_id: documentId }),
    });
  },
};

/*Material webhook utilities*/
export const materialWebhooks = {
  async upload(
    materialId: string,
    data: {
      name: string;
      type: string;
      uploader_id: string;
      file_path: string;      // <-- pointer
      bucket?: string;        // defaults server-side
    }
  ): Promise<WebhookResponse> {
    const fd = new FormData();
    fd.append('document_id', materialId);
    fd.append('type', data.type);
    fd.append('uploader_id', data.uploader_id);
    fd.append('name', data.name);
    fd.append('file_path', data.file_path);
    if (data.bucket) fd.append('bucket', data.bucket);

    return callWebhook(`${RAG_API_URL}/documents/framework/upload`, {
      method: 'POST',
      body: fd,
    });
  },

  async delete(materialId: string): Promise<WebhookResponse> {
    return callWebhook(`${RAG_API_URL}/documents/framework/delete`, {
      method: 'DELETE',
      body: JSON.stringify({ document_id: materialId }),
    });
  },
};
