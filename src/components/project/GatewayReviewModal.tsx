
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

interface GatewayReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (gatewayType: string) => void;
}

const GatewayReviewModal: React.FC<GatewayReviewModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [gatewayTypes, setGatewayTypes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGatewayTypes = async () => {
      try {
        setIsLoading(true);
        
        // Get the category ID for gateway review types
        const { data: categories, error: categoryError } = await supabase
          .from('dropdown_categories')
          .select('id')
          .eq('name', 'Gateway Review Types')
          .single();

        if (categoryError) {
          console.error('Error fetching category:', categoryError);
          return;
        }

        // Get the dropdown values
        const { data: values, error: valuesError } = await supabase
          .from('dropdown_values')
          .select('value')
          .eq('category_id', categories.id)
          .order('sort_order');

        if (valuesError) {
          console.error('Error fetching values:', valuesError);
          return;
        }

        setGatewayTypes(values.map(v => v.value));
      } catch (error) {
        console.error('Error fetching gateway types:', error);
        toast.error('Failed to load gateway types');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchGatewayTypes();
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!selectedType) {
      toast.error('Please select a gateway type');
      return;
    }
    
    onSubmit(selectedType);
    setSelectedType('');
    onClose();
  };

  const handleCancel = () => {
    setSelectedType('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gateway Review Configuration</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="gateway-type">Gateway Type</Label>
            <Select value={selectedType} onValueChange={setSelectedType} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? "Loading..." : "Select a gateway type"} />
              </SelectTrigger>
              <SelectContent>
                {gatewayTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedType || isLoading}>
            Start Analysis
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GatewayReviewModal;
