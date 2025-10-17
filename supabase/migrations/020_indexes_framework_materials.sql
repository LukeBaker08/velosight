-- framework_materials indexes
CREATE INDEX IF NOT EXISTS idx_framework_materials_embedding
  ON public.framework_vector USING ivfflat (embedding vector_cosine_ops) WITH (lists=100);

CREATE INDEX IF NOT EXISTS idx_framework_materials_type
  ON public.framework_vector ((metadata->>'type'));