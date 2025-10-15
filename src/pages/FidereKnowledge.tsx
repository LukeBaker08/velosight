
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import PromptLibrary from '@/components/knowledge/PromptLibrary';
import AssuranceMaterials from '@/components/knowledge/AssuranceMaterials';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FidereKnowledge: React.FC = () => {
  const [activeTab, setActiveTab] = useState('materials');
  
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Repository</h1>
          <p className="text-muted-foreground mt-2">
            Manage your prompts and reference materials in one place.
          </p>
        </div>
        
        <Tabs defaultValue="prompts" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2 bg-secondary">
            <TabsTrigger value="materials">Reference Materials</TabsTrigger>
            <TabsTrigger value="prompts">Prompts</TabsTrigger>
          </TabsList>

          <TabsContent value="materials" className="mt-6">
            <AssuranceMaterials />
          </TabsContent>

          <TabsContent value="prompts" className="mt-6">
            <PromptLibrary />
          </TabsContent>
          

        </Tabs>
      </div>
    </Layout>
  );
};

export default FidereKnowledge;
