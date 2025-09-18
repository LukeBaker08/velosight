
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DropdownCategory {
  id: string;
  name: string;
  description: string | null;
}

interface DropdownValue {
  id: string;
  category_id: string;
  value: string;
  description: string | null;
  sort_order: number | null;
}

interface CategoryWithValues {
  id: string;
  name: string;
  description: string | null;
  values: string[];
}

export const useAllDropdownCategories = () => {
  const [categories, setCategories] = useState<CategoryWithValues[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('dropdown_categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;

      // Fetch values
      const { data: valuesData, error: valuesError } = await supabase
        .from('dropdown_values')
        .select('*')
        .order('sort_order');

      if (valuesError) throw valuesError;

      // Combine categories with their values
      const categoriesWithValues: CategoryWithValues[] = (categoriesData || []).map(category => ({
        id: category.id,
        name: category.name,
        description: category.description,
        values: (valuesData || [])
          .filter(value => value.category_id === category.id)
          .map(value => value.value)
      }));

      setCategories(categoriesWithValues);
    } catch (err: any) {
      console.error('Error fetching dropdown categories:', err);
      setError(err.message || 'Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const updateCategoryValues = (categoryId: string, newValues: string[]) => {
    setCategories(prev => 
      prev.map(category => 
        category.id === categoryId 
          ? { ...category, values: newValues }
          : category
      )
    );
  };

  return {
    categories,
    isLoading,
    error,
    refetch: fetchCategories,
    updateCategoryValues
  };
};
