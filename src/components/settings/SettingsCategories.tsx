import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Pencil } from 'lucide-react';
import { useAllDropdownCategories, CategoryWithValues } from '@/hooks/useAllDropdownCategories';
import { EnhancedLoadingSpinner } from '@/components/ui/enhanced-loading';
import DropdownCategoryEditor from '@/components/settings/DropdownCategoryEditor';

const SettingsCategories: React.FC = () => {
  const { categories, isLoading, error, refetch, updateCategoryValues } =
    useAllDropdownCategories();
  const [editingCategory, setEditingCategory] = useState<CategoryWithValues | null>(null);

  const handleSaveComplete = async () => {
    setEditingCategory(null);
    await refetch();
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-destructive">
            Error loading categories: {error}
          </p>
          <div className="flex justify-center mt-4">
            <Button onClick={() => refetch()} variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <EnhancedLoadingSpinner
          size="lg"
          text="Loading categories..."
          component="SettingsCategories"
        />
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No dropdown categories found. Please check your database configuration.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Dropdown Categories</CardTitle>
          <CardDescription>
            Manage the values available in dropdown menus throughout the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Values</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {cat.description || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {cat.values.length} {cat.values.length === 1 ? 'value' : 'values'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingCategory(cat)}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit {cat.name}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          {editingCategory && (
            <>
              <SheetHeader>
                <SheetTitle>{editingCategory.name}</SheetTitle>
                <SheetDescription>
                  {editingCategory.description || `Manage ${editingCategory.name.toLowerCase()} options`}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <DropdownCategoryEditor
                  categoryId={editingCategory.id}
                  categoryName={editingCategory.name}
                  categoryDescription={editingCategory.description || undefined}
                  values={editingCategory.values}
                  onValuesChange={(categoryId, newValues) => {
                    updateCategoryValues(categoryId, newValues);
                  }}
                  onSaveComplete={handleSaveComplete}
                  isLoading={false}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default SettingsCategories;
