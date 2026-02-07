import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, Edit2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedLoadingSpinner } from '@/components/ui/enhanced-loading';
import { BADGE_COLORS, getBadgeColorClasses } from '@/lib/badge-helpers';
import type { DropdownValueWithColor } from '@/hooks/useAllDropdownCategories';

interface DropdownCategoryEditorProps {
  categoryId: string;
  categoryName: string;
  categoryDescription?: string;
  values: DropdownValueWithColor[];
  onValuesChange: (categoryId: string, newValues: DropdownValueWithColor[]) => void;
  onSaveComplete?: () => void;
  isLoading?: boolean;
}

const DropdownCategoryEditor: React.FC<DropdownCategoryEditorProps> = ({
  categoryId,
  categoryName,
  categoryDescription,
  values,
  onValuesChange,
  onSaveComplete,
  isLoading = false
}) => {
  const [localValues, setLocalValues] = useState<DropdownValueWithColor[]>(values);
  const [newValue, setNewValue] = useState('');
  const [newColor, setNewColor] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [editingColor, setEditingColor] = useState<string | null>(null);

  useEffect(() => {
    setLocalValues(values);
  }, [values]);

  const addValue = () => {
    const trimmedValue = newValue.trim();
    if (trimmedValue && !localValues.some(v => v.value === trimmedValue)) {
      const updatedValues = [...localValues, { value: trimmedValue, color: newColor }];
      setLocalValues(updatedValues);
      setNewValue('');
      setNewColor(null);
    }
  };

  const removeValue = (index: number) => {
    const updatedValues = localValues.filter((_, i) => i !== index);
    setLocalValues(updatedValues);
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditingValue(localValues[index].value);
    setEditingColor(localValues[index].color);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingValue('');
    setEditingColor(null);
  };

  const saveEdit = () => {
    const trimmedValue = editingValue.trim();
    if (editingIndex !== null && trimmedValue) {
      // Allow saving if value unchanged (just color change) or if new value doesn't exist
      const isDuplicate = localValues.some((v, i) => i !== editingIndex && v.value === trimmedValue);
      if (!isDuplicate) {
        const updatedValues = [...localValues];
        updatedValues[editingIndex] = { value: trimmedValue, color: editingColor };
        setLocalValues(updatedValues);
        setEditingIndex(null);
        setEditingValue('');
        setEditingColor(null);
      }
    }
  };

  const updateColor = (index: number, color: string | null) => {
    const updatedValues = [...localValues];
    updatedValues[index] = { ...updatedValues[index], color };
    setLocalValues(updatedValues);
  };

  // TODO: Replace delete-then-insert with a Supabase RPC for atomic category value updates
  const handleSave = async () => {
    const previousValues = values;
    try {
      setIsSaving(true);

      const { error: deleteError } = await supabase
        .from('dropdown_values')
        .delete()
        .eq('category_id', categoryId);

      if (deleteError) throw deleteError;

      if (localValues.length > 0) {
        const newDropdownValues = localValues.map((item, index) => ({
          category_id: categoryId,
          value: item.value,
          color: item.color,
          sort_order: index,
        }));

        const { error: insertError } = await supabase
          .from('dropdown_values')
          .insert(newDropdownValues);

        if (insertError) {
          const restoreValues = previousValues.map((item, index) => ({
            category_id: categoryId,
            value: item.value,
            color: item.color,
            sort_order: index,
          }));
          await supabase.from('dropdown_values').insert(restoreValues);
          throw insertError;
        }
      }

      onValuesChange(categoryId, localValues);
      toast.success(`${categoryName} updated successfully`);
      onSaveComplete?.();
    } catch (error) {
      console.error(`Error updating ${categoryName}:`, error);
      toast.error(`Failed to update ${categoryName}`);
      setLocalValues(previousValues);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <EnhancedLoadingSpinner size="md" text="Loading..." component="DropdownCategoryEditor" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {localValues.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No values yet. Add one below.
          </p>
        ) : (
          localValues.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-secondary rounded gap-2">
              {editingIndex === index ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                    className="flex-1"
                  />
                  <ColorSelect
                    value={editingColor}
                    onChange={setEditingColor}
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
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="capitalize truncate">{item.value}</span>
                    {item.color && (
                      <span className={`px-2 py-0.5 text-xs rounded ${getBadgeColorClasses(item.color)}`}>
                        {item.color}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <ColorSelect
                      value={item.color}
                      onChange={(color) => updateColor(index, color)}
                    />
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
          ))
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder={`Add new ${categoryName.toLowerCase()} option...`}
          onKeyDown={(e) => e.key === 'Enter' && addValue()}
          className="flex-1"
        />
        <ColorSelect
          value={newColor}
          onChange={setNewColor}
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
  );
};

/** Color picker select component */
interface ColorSelectProps {
  value: string | null;
  onChange: (color: string | null) => void;
}

const ColorSelect: React.FC<ColorSelectProps> = ({ value, onChange }) => {
  return (
    <Select
      value={value || 'none'}
      onValueChange={(val) => onChange(val === 'none' ? null : val)}
    >
      <SelectTrigger className="w-[100px] h-8">
        <SelectValue placeholder="Color">
          {value ? (
            <span className="flex items-center gap-1.5">
              <span
                className={`w-3 h-3 rounded-full ${getColorDotClass(value)}`}
              />
              <span className="capitalize text-xs">{value}</span>
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">No color</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <span className="text-muted-foreground">No color</span>
        </SelectItem>
        {BADGE_COLORS.map((color) => (
          <SelectItem key={color} value={color}>
            <span className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${getColorDotClass(color)}`}
              />
              <span className="capitalize">{color}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

/** Get a solid background class for the color dot indicator */
function getColorDotClass(color: string): string {
  const dotClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    indigo: 'bg-indigo-500',
    gray: 'bg-gray-500',
  };
  return dotClasses[color.toLowerCase()] || 'bg-gray-400';
}

export default DropdownCategoryEditor;
