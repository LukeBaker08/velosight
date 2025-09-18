
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { project_id, file_path, category, type, document_id } = await req.json();

    console.log('Document webhook triggered:', {
      project_id,
      document_id,
      file_path,
      category,
      type,
      timestamp: new Date().toISOString()
    });

    // Get webhook URL dynamically from database
    const { data: webhook, error: webhookError } = await supabase
      .from('webhooks')
      .select('target_url, enabled, uid')
      .eq('event_type', 'document.upload')
      .eq('enabled', true)
      .maybeSingle();

    if (webhookError) {
      console.error('Error fetching webhook:', webhookError);
      throw new Error('Failed to fetch webhook configuration');
    }

    if (!webhook) {
      console.warn('No enabled webhook found for event type: document.upload');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No webhook configured for document.upload - skipping external call' 
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    console.log(`Using webhook for document.upload: ${webhook.uid} -> ${webhook.target_url}`);
    
    try {
      const response = await fetch(webhook.target_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id,
          document_id,
          file_path,
          category,
          type,
          timestamp: new Date().toISOString()
        })
      });
      
      console.log('External webhook response:', response.status);
      
      if (!response.ok) {
        console.error('External webhook failed:', response.statusText);
      }
    } catch (webhookError) {
      console.error('Failed to call external webhook:', webhookError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Document webhook processed successfully' 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Document webhook error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
