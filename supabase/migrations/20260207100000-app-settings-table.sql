-- Create app_settings table for storing application configuration
-- This table stores key-value pairs for various settings like retrieval parameters

CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read settings
CREATE POLICY "Allow authenticated users to read settings"
  ON public.app_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to update settings
CREATE POLICY "Allow authenticated users to update settings"
  ON public.app_settings
  FOR UPDATE
  TO authenticated
  USING (true);

-- Allow authenticated users to insert settings
CREATE POLICY "Allow authenticated users to insert settings"
  ON public.app_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert default retrieval settings
INSERT INTO public.app_settings (key, value, description)
VALUES (
  'retrieval_settings',
  '{
    "framework_topk": 5,
    "context_topk": 5,
    "project_topk": 5,
    "sentiment_topk": 5
  }'::jsonb,
  'Number of chunks to retrieve per category during RAG analysis'
)
ON CONFLICT (key) DO NOTHING;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_app_settings_updated_at();
