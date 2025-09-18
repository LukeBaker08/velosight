
-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('materials', 'materials', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Add uploader_id column to documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS uploader_id uuid REFERENCES auth.users(id);

-- Add file_path column to documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS file_path text;

-- Add uploader_id column to assurance_materials table
ALTER TABLE public.assurance_materials 
ADD COLUMN IF NOT EXISTS uploader_id uuid REFERENCES auth.users(id);

-- Enable RLS on documents table
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Enable RLS on assurance_materials table  
ALTER TABLE public.assurance_materials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and create new ones for documents
DROP POLICY IF EXISTS "Authenticated users can view all documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated users can insert documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;

CREATE POLICY "Authenticated users can view all documents" 
ON public.documents FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert documents" 
ON public.documents FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = uploader_id);

CREATE POLICY "Users can update their own documents" 
ON public.documents FOR UPDATE 
TO authenticated 
USING (auth.uid() = uploader_id);

CREATE POLICY "Users can delete their own documents" 
ON public.documents FOR DELETE 
TO authenticated 
USING (auth.uid() = uploader_id);

-- Drop existing policies if they exist and create new ones for assurance_materials
DROP POLICY IF EXISTS "Authenticated users can view all materials" ON public.assurance_materials;
DROP POLICY IF EXISTS "Authenticated users can insert materials" ON public.assurance_materials;
DROP POLICY IF EXISTS "Users can update their own materials" ON public.assurance_materials;
DROP POLICY IF EXISTS "Users can delete their own materials" ON public.assurance_materials;

CREATE POLICY "Authenticated users can view all materials" 
ON public.assurance_materials FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert materials" 
ON public.assurance_materials FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = uploader_id);

CREATE POLICY "Users can update their own materials" 
ON public.assurance_materials FOR UPDATE 
TO authenticated 
USING (auth.uid() = uploader_id);

CREATE POLICY "Users can delete their own materials" 
ON public.assurance_materials FOR DELETE 
TO authenticated 
USING (auth.uid() = uploader_id);

-- Drop existing storage policies if they exist and create new ones for documents bucket
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents in storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents in storage" ON storage.objects;

CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can view documents"
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'documents');

CREATE POLICY "Users can update their own documents in storage"
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents in storage"
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Drop existing storage policies if they exist and create new ones for materials bucket
DROP POLICY IF EXISTS "Authenticated users can upload materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view materials" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own materials in storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own materials in storage" ON storage.objects;

CREATE POLICY "Authenticated users can upload materials"
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'materials');

CREATE POLICY "Authenticated users can view materials"
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'materials');

CREATE POLICY "Users can update their own materials in storage"
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'materials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own materials in storage"
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'materials' AND auth.uid()::text = (storage.foldername(name))[1]);
