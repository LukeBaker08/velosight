
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Copy, Edit, Trash2, Plus } from "lucide-react"; 
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Prompt {
  id: string;
  category: string;
  prompt: string;
}

const PromptLibrary = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [newPrompt, setNewPrompt] = useState<Prompt>({
    id: "",
    category: "",
    prompt: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch prompts from Supabase
  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('prompts')
          .select('*')
          .order('category');
        
        if (error) {
          console.error('Error fetching prompts:', error);
          toast.error('Failed to load prompts');
          return;
        }
        
        setPrompts(data || []);
      } catch (err) {
        console.error('Error in prompt fetching:', err);
        toast.error('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrompts();
  }, []);

  const handleEdit = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setNewPrompt({ ...prompt });
    setEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting prompt:', error);
        toast.error('Failed to delete prompt');
        return;
      }
      
      setPrompts(prompts.filter((prompt) => prompt.id !== id));
      toast.success('Prompt deleted successfully');
    } catch (err) {
      console.error('Error in prompt deletion:', err);
      toast.error('An unexpected error occurred');
    }
  };

  const handleSave = async () => {
    if (!selectedPrompt) return;

    try {
      const { error } = await supabase
        .from('prompts')
        .update({
          category: newPrompt.category,
          prompt: newPrompt.prompt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedPrompt.id);
      
      if (error) {
        console.error('Error updating prompt:', error);
        toast.error('Failed to update prompt');
        return;
      }
      
      setPrompts(
        prompts.map((prompt) =>
          prompt.id === selectedPrompt.id ? { ...newPrompt } : prompt
        )
      );
      setEditDialogOpen(false);
      toast.success('Prompt updated successfully');
    } catch (err) {
      console.error('Error in prompt update:', err);
      toast.error('An unexpected error occurred');
    }
  };

  const handleCreate = async () => {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .insert({
          category: newPrompt.category,
          prompt: newPrompt.prompt,
        })
        .select();
      
      if (error) {
        console.error('Error creating prompt:', error);
        toast.error('Failed to create prompt');
        return;
      }
      
      if (data && data.length > 0) {
        setPrompts([...prompts, data[0]]);
        setCreateDialogOpen(false);
        setNewPrompt({
          id: "",
          category: "",
          prompt: "",
        });
        toast.success('Prompt created successfully');
      }
    } catch (err) {
      console.error('Error in prompt creation:', err);
      toast.error('An unexpected error occurred');
    }
  };

  const handleOpenCreateDialog = () => {
    setNewPrompt({
      id: "",
      category: "",
      prompt: "",
    });
    setCreateDialogOpen(true);
  };

  const handleCopy = (promptText: string) => {
    navigator.clipboard.writeText(promptText);
    toast.success('Prompt copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">AI Prompts</h2>
          <p className="text-muted-foreground">
            Unleash the power of AI with these pre-built prompts.
          </p>
        </div>
        <Button onClick={handleOpenCreateDialog} className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Create Prompt
        </Button>
      </div>
      
      <div>
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading prompts...
          </div>
        ) : prompts.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No prompts found. Create your first prompt to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prompts.map((prompt) => (
                <TableRow key={prompt.id}>
                  <TableCell className="font-medium">{prompt.category}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopy(prompt.prompt)}
                    >
                      <Copy className="h-4 w-4" />
                      <span className="sr-only">Copy</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(prompt)}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(prompt.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Prompt</DialogTitle>
            <DialogDescription>
              Make changes to your AI prompt. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={newPrompt.category}
                onChange={(e) =>
                  setNewPrompt({ ...newPrompt, category: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="prompt">Prompt</Label>
              <Input
                id="prompt"
                value={newPrompt.prompt}
                onChange={(e) =>
                  setNewPrompt({ ...newPrompt, prompt: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleSave}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Prompt</DialogTitle>
            <DialogDescription>
              Add a new prompt to your library. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-category">Category</Label>
              <Input
                id="new-category"
                value={newPrompt.category}
                onChange={(e) =>
                  setNewPrompt({ ...newPrompt, category: e.target.value })
                }
                placeholder="E.g., Code Generation"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-prompt">Prompt</Label>
              <Input
                id="new-prompt"
                value={newPrompt.prompt}
                onChange={(e) =>
                  setNewPrompt({ ...newPrompt, prompt: e.target.value })
                }
                placeholder="Enter your prompt text here"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleCreate}>
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromptLibrary;
