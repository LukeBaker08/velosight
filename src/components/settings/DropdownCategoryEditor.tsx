
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, Edit2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface DropdownCategoryEditorProps {
  categoryId: string;
  categoryName: string;
  categoryDescription?: string;
  values: string[];
  onValuesChange: (categoryId: string, newValues: string[]) => void;
  isLoading?: boolean;
}

const DropdownCategoryEditor: React.FC<DropdownCategoryEditorProps> = ({
  categoryId,
  categoryName,
  categoryDescription,
  values,
  onValuesChange,
  isLoading = false
}) => {
  const [localValues, setLocalValues] = useState<string[]>(values);
  const [newValue, setNewValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  // Update local values when props change
  useEffect(() => {
    setLocalValues(values);
  }, [values]);

  const addValue = () => {
    if (newValue.trim() && !localValues.includes(newValue.trim())) {
      const updatedValues = [...localValues, newValue.trim()];
      setLocalValues(updatedValues);
      setNewValue('');
    }
  };

  const removeValue = (index: number) => {
    const updatedValues = localValues.filter((_, i) => i !== index);
    setLocalValues(updatedValues);
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditingValue(localValues[index]);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingValue('');
  };

  const saveEdit = () => {
    if (editingIndex !== null && editingValue.trim() && !localValues.includes(editingValue.trim())) {
      const updatedValues = [...localValues];
      updatedValues[editingIndex] = editingValue.trim();
      setLocalValues(updatedValues);
      setEditingIndex(null);
      setEditingValue('');
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Delete existing values for this category
      const { error: deleteError } = await supabase
        .from('dropdown_values')
        .delete()
        .eq('category_id', categoryId);
        
      if (deleteError) throw deleteError;
      
      // Insert new values
      if (localValues.length > 0) {
        const newDropdownValues = localValues.map((value, index) => ({
          category_id: categoryId,
          value: value,
          sort_order: index
        }));
        
        const { error: insertError } = await supabase
          .from('dropdown_values')
          .insert(newDropdownValues);
          
        if (insertError) throw insertError;
      }
      
      // Update parent component
      onValuesChange(categoryId, localValues);
      
      toast.success(`${categoryName} updated successfully`);
    } catch (error) {
      console.error(`Error updating ${categoryName}:`, error);
      toast.error(`Failed to update ${categoryName}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{categoryName}</CardTitle>
          <CardDescription>{categoryDescription || `Manage ${categoryName.toLowerCase()} options`}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{categoryName}</CardTitle>
        <CardDescription>{categoryDescription || `Manage ${categoryName.toLowerCase()} options`}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            {localValues.map((value, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-secondary rounded">
                {editingIndex === index ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                      className="flex-1"
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={saveEdit}
                      className="h-8 w-8 p-0"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={cancelEdit}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="capitalize flex-1">{value}</span>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => startEdit(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeValue(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Input
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder={`Add new ${categoryName.toLowerCase()} option...`}
              onKeyPress={(e) => e.key === 'Enter' && addValue()}
            />
            <Button onClick={addValue} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <Separator />
          
          <Button 
            className="w-full" 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DropdownCategoryEditor;
