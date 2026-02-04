/*Webhook utilities for consistent API interactions*/

import { handleError, NetworkError } from './errors';
import { API_CONFIG } from './constants';

interface WebhookResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Backend API URL (runs on port 3001)
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001/api';

/*Generic webhook caller with error handling and retries*/
export const callWebhook = async <T = any>(
  url: string,
  options: RequestInit = {},
  retries: number = API_CONFIG.RETRY_ATTEMPTS,
  timeout: number = API_CONFIG.TIMEOUT
): Promise<WebhookResponse<T>> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

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
      return callWebhook(url, options, retries - 1, timeout);
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
    return callWebhook(`${BACKEND_API_URL}/documents/project/upload`, {
      method: 'POST',
      body: JSON.stringify({
        projectId,
        documentId,
        ...data
      })
    });
  },

  async delete(projectId: string, documentId: string): Promise<WebhookResponse> {
    return callWebhook(`${BACKEND_API_URL}/documents/project/delete`, {
      method: 'DELETE',
      body: JSON.stringify({ document_id: documentId })
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
    return callWebhook(`${BACKEND_API_URL}/documents/framework/upload`, {
      method: 'POST',
      body: JSON.stringify({
        documentId: materialId,
        ...data
      })
    });
  },

  async delete(materialId: string): Promise<WebhookResponse> {
    return callWebhook(`${BACKEND_API_URL}/documents/framework/delete`, {
      method: 'DELETE',
      body: JSON.stringify({ document_id: materialId })
    });
  },
};

/*Analysis type from backend*/
export interface AnalysisTypeConfig {
  id: string;
  key: string;
  name: string;
  description: string | null;
  icon: string;
  iconColor: string;
  sortOrder: number;
  requiresSubtype: boolean;
  subtypes: string[] | null;
}

/*Analysis result from backend*/
export interface AnalysisRunResult {
  success: boolean;
  analysisType: string;
  analysisSubtype?: string;
  output: any;
  confidence?: string;
  overallRating?: string;
  contextCounts: {
    framework: number;
    context: number;
    project: number;
    sentiment: number;
  };
  error?: string;
}

/*Analysis webhook utilities*/
export const analysisWebhooks = {
  /**
   * Fetch all enabled analysis types from the backend
   */
  async getTypes(): Promise<WebhookResponse<AnalysisTypeConfig[]>> {
    return callWebhook<AnalysisTypeConfig[]>(`${BACKEND_API_URL}/analysis/types`, {
      method: 'GET'
    });
  },

  /**
   * Run an analysis - single endpoint for all analysis types
   * @param projectId - Project to analyze
   * @param analysisTypeKey - e.g., 'risk-analysis', 'delivery-confidence'
   * @param options - Optional query, subtype, and topK
   */
  async run(
    projectId: string,
    analysisTypeKey: string,
    options?: {
      query?: string;
      subtype?: string;
      topK?: number;
    }
  ): Promise<WebhookResponse<AnalysisRunResult>> {
    return callWebhook<AnalysisRunResult>(
      `${BACKEND_API_URL}/analysis/run`,
      {
        method: 'POST',
        body: JSON.stringify({
          projectId,
          analysisTypeKey,
          ...options
        })
      },
      API_CONFIG.RETRY_ATTEMPTS,
      API_CONFIG.TIMEOUT_LONG
    );
  }
};
