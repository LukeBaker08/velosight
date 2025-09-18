-- Create webhooks table for dynamic webhook management
CREATE TABLE public.webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL UNIQUE,
  target_url TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

-- Create policies for webhook access
CREATE POLICY "Admin users can manage webhooks" 
ON public.webhooks 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

CREATE POLICY "Enable read access for all users" 
ON public.webhooks 
FOR SELECT 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_webhooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_webhooks_updated_at
BEFORE UPDATE ON public.webhooks
FOR EACH ROW
EXECUTE FUNCTION public.update_webhooks_updated_at();

-- Insert default webhook entries for existing functionality
INSERT INTO public.webhooks (uid, event_type, target_url, description, enabled) VALUES
('risk-analysis-webhook', 'analysis.risk', 'https://fidere.app.n8n.cloud/webhook/6cd65a52-c28a-41b0-8019-a6a7142e2760', 'Risk analysis webhook for project assessments', true),
('delivery-confidence-webhook', 'analysis.delivery-confidence', 'https://fidere.app.n8n.cloud/webhook/8b55e7cf-d8b2-4596-9b52-df12746a17d7', 'Delivery confidence assessment webhook', true),
('gateway-review-webhook', 'analysis.gateway-review', 'https://fidere.app.n8n.cloud/webhook/bfcbb2e8-7e0d-428e-b191-13d7806edef7', 'Gateway review analysis webhook', true),
('hypothesis-webhook', 'analysis.hypothesis', 'https://fidere.app.n8n.cloud/webhook/59a1b234-a512-45de-82eb-1eaba1439761', 'Hypothesis generation webhook', true),
('document-upload-webhook', 'document.upload', 'https://fidere.app.n8n.cloud/webhook/b1db0df4-46e9-4433-b02a-fd8b133daeb4', 'Document upload processing webhook', true),
('document-deletion-webhook', 'document.delete', 'https://fidere.app.n8n.cloud/webhook/0c1c0751-a660-4562-bbc5-aadc29ece950', 'Document deletion webhook', true),
('material-upload-webhook', 'material.upload', 'https://fidere.app.n8n.cloud/webhook/0c1c0751-a660-4562-bbc5-aadc29ece950', 'Material upload processing webhook', true),
('material-deletion-webhook', 'material.delete', 'https://fidere.app.n8n.cloud/webhook/0c1c0751-a660-4562-bbc5-aadc29ece950', 'Material deletion webhook', true);