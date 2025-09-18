import { supabase } from '@/integrations/supabase/client';

export interface Webhook {
  id: string;
  uid: string;
  event_type: string;
  target_url: string;
  description?: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

class WebhookService {
  private webhookCache = new Map<string, Webhook>();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private lastCacheUpdate = 0;

  /**
   * Get webhook URL for a specific event type
   */
  async getWebhookUrl(eventType: string): Promise<string | null> {
    try {
      const webhook = await this.getWebhook(eventType);
      
      if (!webhook) {
        console.warn(`No webhook found for event type: ${eventType}`);
        return null;
      }

      if (!webhook.enabled) {
        console.warn(`Webhook disabled for event type: ${eventType} (uid: ${webhook.uid})`);
        return null;
      }

      console.log(`Using webhook for ${eventType}: ${webhook.uid} -> ${webhook.target_url}`);
      return webhook.target_url;
    } catch (error) {
      console.error(`Error retrieving webhook for event type ${eventType}:`, error);
      return null;
    }
  }

  /**
   * Get webhook by event type with caching
   */
  private async getWebhook(eventType: string): Promise<Webhook | null> {
    // Check cache first
    if (this.isCacheValid() && this.webhookCache.has(eventType)) {
      return this.webhookCache.get(eventType) || null;
    }

    // Refresh cache if needed
    if (!this.isCacheValid()) {
      await this.refreshCache();
    }

    return this.webhookCache.get(eventType) || null;
  }

  /**
   * Refresh the webhook cache
   */
  private async refreshCache(): Promise<void> {
    try {
      const { data: webhooks, error } = await supabase
        .from('webhooks')
        .select('*');

      if (error) {
        throw error;
      }

      // Clear and rebuild cache
      this.webhookCache.clear();
      webhooks?.forEach(webhook => {
        this.webhookCache.set(webhook.event_type, webhook);
      });

      this.lastCacheUpdate = Date.now();
      console.log(`Webhook cache refreshed with ${webhooks?.length || 0} entries`);
    } catch (error) {
      console.error('Error refreshing webhook cache:', error);
      throw error;
    }
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    return Date.now() - this.lastCacheUpdate < this.cacheExpiry;
  }

  /**
   * Create or update a webhook (idempotent operation)
   */
  async upsertWebhook(webhook: Omit<Webhook, 'id' | 'created_at' | 'updated_at'>): Promise<Webhook> {
    try {
      const { data, error } = await supabase
        .from('webhooks')
        .upsert(
          {
            uid: webhook.uid,
            event_type: webhook.event_type,
            target_url: webhook.target_url,
            description: webhook.description,
            enabled: webhook.enabled
          },
          {
            onConflict: 'event_type',
            ignoreDuplicates: false
          }
        )
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Invalidate cache to force refresh
      this.lastCacheUpdate = 0;
      
      console.log(`Webhook upserted: ${webhook.event_type} (${webhook.uid})`);
      return data;
    } catch (error) {
      console.error('Error upserting webhook:', error);
      throw error;
    }
  }

  /**
   * Get all webhooks
   */
  async getAllWebhooks(): Promise<Webhook[]> {
    try {
      const { data: webhooks, error } = await supabase
        .from('webhooks')
        .select('*')
        .order('event_type');

      if (error) {
        throw error;
      }

      return webhooks || [];
    } catch (error) {
      console.error('Error fetching all webhooks:', error);
      throw error;
    }
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(eventType: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('event_type', eventType);

      if (error) {
        throw error;
      }

      // Invalidate cache
      this.lastCacheUpdate = 0;
      
      console.log(`Webhook deleted: ${eventType}`);
    } catch (error) {
      console.error('Error deleting webhook:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const webhookService = new WebhookService();