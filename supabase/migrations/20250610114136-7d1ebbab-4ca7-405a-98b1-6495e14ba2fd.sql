
-- Update RLS policies to use authenticated users instead of admin role checks
-- This ensures consistent behavior across all components

-- Update documents policies to allow all authenticated users full access
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

-- Update assurance_materials policies to allow all authenticated users full access
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

-- Ensure storage policies are also consistent for all authenticated users
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
