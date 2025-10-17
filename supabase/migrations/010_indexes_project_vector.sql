-- project_vector indexes
CREATE INDEX IF NOT EXISTS idx_project_vector_embedding
  ON public.project_vector USING ivfflat (embedding vector_cosine_ops) WITH (lists=100);

CREATE INDEX IF NOT EXISTS idx_project_vector_category
  ON public.project_vector ((metadata->>'category'));

CREATE INDEX IF NOT EXISTS idx_project_vector_project_id
  ON public.project_vector ((metadata->>'project_id'));
