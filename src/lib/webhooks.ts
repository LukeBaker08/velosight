/**
 * Webhook utilities for consistent API interactions
 */

import { handleError, NetworkError } from './errors';
import { API_CONFIG } from './constants';

interface WebhookResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Generic webhook caller with error handling and retries
 */
export const callWebhook = async <T = any>(
  url: string,
  options: RequestInit = {},
  retries: number = API_CONFIG.RETRY_ATTEMPTS
): Promise<WebhookResponse<T>> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      return callWebhook(url, options, retries - 1);
    }

    const errorMessage = handleError(error, 'Webhook call');
    return { success: false, error: errorMessage };
  }
};

/**
 * Document webhook utilities
 */
export const documentWebhooks = {
  async upload(projectId: string, documentId: string): Promise<WebhookResponse> {
    return callWebhook('/functions/v1/document-webhook', {
      method: 'POST',
      body: JSON.stringify({
        action: 'upload',
        project_id: projectId,
        document_id: documentId,
      }),
    });
  },

  async delete(projectId: string, documentId: string): Promise<WebhookResponse> {
    return callWebhook('/functions/v1/document-deletion-webhook', {
      method: 'POST',
      body: JSON.stringify({
        project_id: projectId,
        document_id: documentId,
      }),
    });
  },
};

/**
 * Material webhook utilities
 */
export const materialWebhooks = {
  async upload(materialId: string): Promise<WebhookResponse> {
    return callWebhook('/functions/v1/material-webhook', {
      method: 'POST',
      body: JSON.stringify({
        action: 'upload',
        material_id: materialId,
      }),
    });
  },

  async update(materialId: string): Promise<WebhookResponse> {
    return callWebhook('/functions/v1/material-webhook', {
      method: 'POST',
      body: JSON.stringify({
        action: 'update',
        material_id: materialId,
      }),
    });
  },

  async delete(materialId: string): Promise<WebhookResponse> {
    return callWebhook('/functions/v1/material-deletion-webhook', {
      method: 'POST',
      body: JSON.stringify({
        material_id: materialId,
      }),
    });
  },
};