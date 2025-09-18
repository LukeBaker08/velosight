
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import Dashboard from '@/components/Dashboard';
import CreateProjectModal from '@/components/CreateProjectModal';
import { toast } from 'sonner';

const Index = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateProject = (projectData: any) => {
    console.log('Creating new project:', projectData);
    toast.success(`Project "${projectData.name}" created successfully!`);
    // In a real app, we would save this to a database
  };

  return (
    <Layout>
      <Dashboard onNewProject={() => setIsCreateModalOpen(true)} />
      <CreateProjectModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onCreateProject={handleCreateProject}
      />
    </Layout>
  );
};

export default Index;
