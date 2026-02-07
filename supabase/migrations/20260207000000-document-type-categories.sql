-- Add document type categories for upload panel dynamic filtering
-- Categories: Project Document Types, Context Document Types, Sentiment Document Types

-- Insert Project Document Types category (if not exists)
INSERT INTO public.dropdown_categories (name, description)
SELECT 'Project Document Types', 'Document types available when uploading project-related documents'
WHERE NOT EXISTS (
  SELECT 1 FROM public.dropdown_categories WHERE name = 'Project Document Types'
);

-- Insert Context Document Types category (if not exists)
INSERT INTO public.dropdown_categories (name, description)
SELECT 'Context Document Types', 'Document types available when uploading context/organizational documents'
WHERE NOT EXISTS (
  SELECT 1 FROM public.dropdown_categories WHERE name = 'Context Document Types'
);

-- Insert Sentiment Document Types category (if not exists)
INSERT INTO public.dropdown_categories (name, description)
SELECT 'Sentiment Document Types', 'Document types available when uploading sentiment/feedback documents'
WHERE NOT EXISTS (
  SELECT 1 FROM public.dropdown_categories WHERE name = 'Sentiment Document Types'
);

-- Seed Project Document Type values (only if category has no values yet)
INSERT INTO public.dropdown_values (category_id, value, description, sort_order)
SELECT
  dc.id,
  v.value,
  v.description,
  v.sort_order
FROM public.dropdown_categories dc
CROSS JOIN (VALUES
  ('Assurance Report', 'Independent assurance or audit reports', 1),
  ('Planning Document', 'Project plans, schedules, and planning materials', 2),
  ('Risk Assessment', 'Risk registers and assessment documents', 3),
  ('Governance Document', 'Governance frameworks and decision records', 4),
  ('Environment Scan', 'Environmental analysis and context documents', 5),
  ('Status Report', 'Progress and status update reports', 6),
  ('Other', 'Other project-related documents', 99)
) AS v(value, description, sort_order)
WHERE dc.name = 'Project Document Types'
  AND NOT EXISTS (
    SELECT 1 FROM public.dropdown_values dv WHERE dv.category_id = dc.id
  );

-- Seed Context Document Type values (only if category has no values yet)
INSERT INTO public.dropdown_values (category_id, value, description, sort_order)
SELECT
  dc.id,
  v.value,
  v.description,
  v.sort_order
FROM public.dropdown_categories dc
CROSS JOIN (VALUES
  ('Org Chart', 'Organizational structure and hierarchy charts', 1),
  ('Strategic Plan', 'Strategic plans and organizational objectives', 2),
  ('Policy Document', 'Policies, procedures, and guidelines', 3),
  ('Environment Scan', 'Environmental analysis documents', 4),
  ('Capability Assessment', 'Organizational capability and maturity assessments', 5),
  ('Other', 'Other context-related documents', 99)
) AS v(value, description, sort_order)
WHERE dc.name = 'Context Document Types'
  AND NOT EXISTS (
    SELECT 1 FROM public.dropdown_values dv WHERE dv.category_id = dc.id
  );

-- Seed Sentiment Document Type values (only if category has no values yet)
INSERT INTO public.dropdown_values (category_id, value, description, sort_order)
SELECT
  dc.id,
  v.value,
  v.description,
  v.sort_order
FROM public.dropdown_categories dc
CROSS JOIN (VALUES
  ('Meeting Notes', 'Notes and minutes from stakeholder meetings', 1),
  ('Survey Results', 'Survey responses and analysis', 2),
  ('Feedback', 'Stakeholder feedback and comments', 3),
  ('Interview Notes', 'Notes from stakeholder interviews', 4),
  ('Communication', 'Emails and correspondence', 5),
  ('Other', 'Other sentiment-related documents', 99)
) AS v(value, description, sort_order)
WHERE dc.name = 'Sentiment Document Types'
  AND NOT EXISTS (
    SELECT 1 FROM public.dropdown_values dv WHERE dv.category_id = dc.id
  );
