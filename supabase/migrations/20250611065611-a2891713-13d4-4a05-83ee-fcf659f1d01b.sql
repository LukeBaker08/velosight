
-- Insert the dropdown category for Gateway Review types
INSERT INTO public.dropdown_categories (id, name, description) 
VALUES (gen_random_uuid(), 'gateway_review_types', 'Types of Gateway Reviews available for analysis')
ON CONFLICT (name) DO NOTHING;

-- Get the category ID and insert the dropdown values
WITH category AS (
  SELECT id FROM public.dropdown_categories WHERE name = 'gateway_review_types'
)
INSERT INTO public.dropdown_values (category_id, value, description, sort_order)
SELECT 
  category.id,
  unnest(ARRAY['Gate 0 - Strategic Assessment', 'Gate 1 - Business Justification', 'Gate 2 - Delivery Strategy', 'Gate 3 - Investment Decision', 'Gate 4 - Readiness for Service', 'Gate 5 - Operations Review and Benefits Realisation']),
  unnest(ARRAY['Strategic assessment and alignment with organizational goals', 'Business case validation and justification', 'Delivery approach and strategy validation', 'Final investment decision checkpoint', 'Operational readiness assessment', 'Post-implementation review and benefits assessment']),
  unnest(ARRAY[1, 2, 3, 4, 5, 6])
FROM category
ON CONFLICT DO NOTHING;
