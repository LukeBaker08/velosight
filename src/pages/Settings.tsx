import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SettingsAccount from '@/components/settings/SettingsAccount';
import AnalysisParametersEditor from '@/components/settings/AnalysisParametersEditor';
import SettingsCategories from '@/components/settings/SettingsCategories';
import SettingsUsers from '@/components/settings/SettingsUsers';
import SettingsRetrieval from '@/components/settings/SettingsRetrieval';
import { usePermissions } from '@/hooks/usePermissions';

const Settings: React.FC = () => {
  const { canManageSettings, canManageUsers } = usePermissions();

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and system configuration.
          </p>
        </div>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="inline-flex h-10 w-full md:w-auto flex-wrap md:flex-nowrap overflow-x-auto">
            <TabsTrigger value="account" className="flex-1 md:flex-none">Account</TabsTrigger>
            {canManageSettings && (
              <>
                <TabsTrigger value="analysis" className="flex-1 md:flex-none whitespace-nowrap">Analysis Parameters</TabsTrigger>
                <TabsTrigger value="retrieval" className="flex-1 md:flex-none">Retrieval</TabsTrigger>
                <TabsTrigger value="categories" className="flex-1 md:flex-none">Categories</TabsTrigger>
              </>
            )}
            {canManageUsers && (
              <TabsTrigger value="users" className="flex-1 md:flex-none">Users</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="account" className="space-y-6 mt-6">
            <SettingsAccount />
          </TabsContent>

          {canManageSettings && (
            <>
              <TabsContent value="analysis" className="space-y-6 mt-6">
                <AnalysisParametersEditor />
              </TabsContent>

              <TabsContent value="retrieval" className="space-y-6 mt-6">
                <SettingsRetrieval />
              </TabsContent>

              <TabsContent value="categories" className="space-y-6 mt-6">
                <SettingsCategories />
              </TabsContent>
            </>
          )}

          {canManageUsers && (
            <TabsContent value="users" className="space-y-6 mt-6">
              <SettingsUsers />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;
