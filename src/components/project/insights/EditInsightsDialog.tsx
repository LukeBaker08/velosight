
import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";

interface EditInsightsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent: string;
  onSave: (data: { content: string }) => void;
}

const EditInsightsDialog: React.FC<EditInsightsDialogProps> = ({
  isOpen,
  onClose,
  initialContent,
  onSave
}) => {
  const form = useForm({
    defaultValues: {
      content: initialContent
    }
  });
  
  React.useEffect(() => {
    if (isOpen) {
      form.setValue('content', initialContent);
    }
  }, [isOpen, initialContent, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Insights</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
          <Textarea 
            {...form.register('content')}
            className="min-h-[400px] font-mono"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditInsightsDialog;
