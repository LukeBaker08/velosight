-- Add missing custom prompt webhook
INSERT INTO public.webhooks (uid, event_type, target_url, description, enabled) VALUES
('custom-prompt-webhook', 'prompt.custom', 'https://fidere.app.n8n.cloud/webhook/3aac2238-5b6f-4e42-9d2c-1e283636d486', 'Webhook for processing custom prompt analysis', true);