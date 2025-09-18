
-- Create the materials storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('materials', 'materials', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on framework_materials table
ALTER TABLE public.framework_materials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Authenticated users can upload materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view materials" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own material files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own material files" ON storage.objects;

-- Create RLS policies for the materials storage bucket
CREATE POLICY "Authenticated users can upload materials" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'materials');

CREATE POLICY "Authenticated users can view materials" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'materials');

CREATE POLICY "Users can update their own material files" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'materials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own material files" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'materials' AND auth.uid()::text = (storage.foldername(name))[1]);
