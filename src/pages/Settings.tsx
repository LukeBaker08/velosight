import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from '@/context/AuthContext';
import { useAllDropdownCategories } from '@/hooks/useAllDropdownCategories';
import DropdownCategoryEditor from '@/components/settings/DropdownCategoryEditor';
import AnalysisParametersEditor from '@/components/settings/AnalysisParametersEditor';
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { User, UserMinus } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { formatDate } from '@/utils/dateUtils';

// Interface for application users (read-only)
interface AppUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}

const Settings = () => {
  const { user /*, isAdmin */} = useAuth();
  const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;  
  const { categories, isLoading, error, updateCategoryValues, refetch } = useAllDropdownCategories();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [isSystemLoading, setIsSystemLoading] = useState(true);

  // Fetch users from Supabase Edge Function (secure)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsUserLoading(true);
        console.log('Settings: Starting user fetch...');
        console.log('Settings: Current user:', user?.email);
        //console.log('Settings: Is admin:', isAdmin);
        
        // Only admins can fetch users
//        if (!user || !isAdmin) {
//          console.log('Settings: User is not admin, skipping user fetch');
//          setIsUserLoading(false);
//          return;
//        }
        
        // Get the current session token
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          console.error('Settings: Error getting session:', sessionError);
          toast({
            title: "Authentication Error",
            description: "Unable to get your session token.",
            variant: "destructive"
          });
          setIsUserLoading(false);
          return;
        }

        console.log('Settings: Attempting to fetch users via edge function');
        
        // Call the edge function with authorization header
        const response = await fetch(`${functionsUrl}/list-users`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          if (response.status === 403) {
            console.error('Settings: Access denied - user is not admin');
            toast({
              title: "Access Denied",
              description: "You don't have admin privileges to view users.",
              variant: "destructive"
            });
            setIsUserLoading(false);
            return;
          } else if (response.status === 500) {
            console.error('Settings: Server error when fetching users');
            toast({
              title: "Server Error",
              description: "Unable to fetch users due to a server error.",
              variant: "destructive"
            });
            setIsUserLoading(false);
            return;
          }
          
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const { users: userData, profiles } = await response.json();
        
        console.log('Settings: Successfully fetched', userData.length, 'users');
        console.log('Settings: Successfully fetched', profiles?.length || 0, 'profiles');

        // Map users with their profiles (read-only data)
        const mappedUsers = userData.map((authUser: any) => {
          const profile = profiles?.find((p: any) => p.id === authUser.id);
          return {
            id: authUser.id,
            email: authUser.email || 'No email',
            role: profile?.role || 'viewer',
            created_at: authUser.created_at || '',
            last_sign_in_at: authUser.last_sign_in_at,
            email_confirmed_at: authUser.email_confirmed_at
          };
        });

        console.log('Settings: Mapped users:', mappedUsers);
        setUsers(mappedUsers);
      } catch (error) {
        console.error('Settings: Error fetching users:', error);
        toast({
          title: "Error loading users",
          description: "You may not have the necessary permissions to view all users.",
          variant: "destructive"
        });
      } finally {
        console.log('Settings: Setting user loading to false');
        setIsUserLoading(false);
      }
    };

    fetchUsers();
  }, [user /*, isAdmin*/]);

  // Check if current user has admin access
  //if (!isAdmin) {
  //  return (
  //    <Layout>
  //      <div className="flex items-center justify-center h-64">
  //        <Card>
  //          <CardContent className="pt-6">
  //            <p className="text-center text-muted-foreground">
  //              You don't have permission to access the settings panel.
  //            </p>
  //          </CardContent>
  //        </Card>
  //      </div>
  //    </Layout>
  //  );
  //}

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and system configuration.</p>
        </div>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="analysis">Analysis Parameters</TabsTrigger>
            <TabsTrigger value="architecture">Architecture</TabsTrigger>
            <TabsTrigger value="system">System Status</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">User ID</label>
                  <p className="text-sm text-muted-foreground font-mono">{user?.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <p className="text-sm text-muted-foreground">User</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6 mt-6">
            <AnalysisParametersEditor />
          </TabsContent>

          <TabsContent value="architecture" className="space-y-6">
            
            <Card>
              <CardHeader>
                <CardTitle>System Architecture Documentation</CardTitle>
                <CardDescription>Comprehensive documentation of VeloSight's architecture and implementation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Overview Section */}
                <div>
                  <h2 className="text-2xl font-bold mb-4">System Overview</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">High-Level Architecture</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        VeloSight follows a modern three-tier architecture pattern with clear separation of concerns:
                      </p>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="text-center p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">Presentation Layer</h4>
                          <p className="text-xs text-muted-foreground">React-based SPA with responsive UI components</p>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">Application Layer</h4>
                          <p className="text-xs text-muted-foreground">Business logic and API services via Supabase</p>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">Data Layer</h4>
                          <p className="text-xs text-muted-foreground">PostgreSQL database with structured schemas</p>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Core Principles</h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• <strong>Modularity:</strong> Component-based architecture for maintainability</li>
                        <li>• <strong>Scalability:</strong> Designed to handle growing data and user loads</li>
                        <li>• <strong>Security:</strong> Authentication and authorization at every layer</li>
                        <li>• <strong>Performance:</strong> Optimized queries and efficient data loading</li>
                        <li>• <strong>Accessibility:</strong> WCAG compliant UI components</li>
                      </ul>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Technology Stack</h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-3">Frontend Technologies</h4>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">React 18</Badge>
                            <Badge variant="secondary">TypeScript</Badge>
                            <Badge variant="secondary">Vite</Badge>
                            <Badge variant="secondary">Tailwind CSS</Badge>
                            <Badge variant="secondary">Shadcn/ui</Badge>
                            <Badge variant="secondary">React Router</Badge>
                            <Badge variant="secondary">React Query</Badge>
                            <Badge variant="secondary">Lucide Icons</Badge>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-3">Backend & Infrastructure</h4>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">Supabase</Badge>
                            <Badge variant="secondary">PostgreSQL</Badge>
                            <Badge variant="secondary">Row Level Security</Badge>
                            <Badge variant="secondary">Real-time Subscriptions</Badge>
                            <Badge variant="secondary">File Storage</Badge>
                            <Badge variant="secondary">Edge Functions</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Frontend Architecture */}
                <div>
                  <h2 className="text-2xl font-bold mb-4">Frontend Architecture</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Project Structure</h3>
                      <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                        <div>src/</div>
                        <div className="ml-2">├── components/          # Reusable UI components</div>
                        <div className="ml-2">├── pages/              # Route-level components</div>
                        <div className="ml-2">├── context/            # React context providers</div>
                        <div className="ml-2">├── hooks/              # Custom React hooks</div>
                        <div className="ml-2">├── services/           # API service layers</div>
                        <div className="ml-2">├── types/              # TypeScript type definitions</div>
                        <div className="ml-2">├── lib/                # Utility functions</div>
                        <div className="ml-2">└── integrations/       # External service integrations</div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Component Architecture</h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• <strong>Atomic Design:</strong> Components organized from atoms to pages</li>
                        <li>• <strong>Compound Components:</strong> Complex UI patterns using composition</li>
                        <li>• <strong>Controlled Components:</strong> Form state managed at appropriate levels</li>
                        <li>• <strong>Error Boundaries:</strong> Graceful error handling in component tree</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">State Management</h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• <strong>React Context:</strong> Global state (auth, theme) via context providers</li>
                        <li>• <strong>React Query:</strong> Server state management and caching</li>
                        <li>• <strong>Local State:</strong> Component-level state with useState/useReducer</li>
                        <li>• <strong>Form State:</strong> React Hook Form for complex form management</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Backend Architecture */}
                <div>
                  <h2 className="text-2xl font-bold mb-4">Backend Architecture</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Supabase Backend Services</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">Authentication</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Email/password authentication</li>
                            <li>• JWT token-based sessions</li>
                            <li>• Role-based access control</li>
                            <li>• Password reset functionality</li>
                          </ul>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">Database API</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Auto-generated REST API</li>
                            <li>• Real-time subscriptions</li>
                            <li>• Filtered queries with RLS</li>
                            <li>• Batch operations support</li>
                          </ul>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">File Storage</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Document upload/download</li>
                            <li>• Image optimization</li>
                            <li>• Access control policies</li>
                            <li>• CDN distribution</li>
                          </ul>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">Edge Functions</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Server-side logic</li>
                            <li>• API integrations</li>
                            <li>• Data processing</li>
                            <li>• Scheduled tasks</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Database Schema */}
                <div>
                  <h2 className="text-2xl font-bold mb-4">Database Schema</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Core Tables</h3>
                      <div className="space-y-3">
                        <div className="p-3 border rounded">
                          <h4 className="font-medium">profiles</h4>
                          <p className="text-sm text-muted-foreground">User profile information and roles</p>
                        </div>
                        <div className="p-3 border rounded">
                          <h4 className="font-medium">projects</h4>
                          <p className="text-sm text-muted-foreground">Project metadata, status, and configuration</p>
                        </div>
                        <div className="p-3 border rounded">
                          <h4 className="font-medium">project_documents</h4>
                          <p className="text-sm text-muted-foreground">Document metadata and file references</p>
                        </div>
                        <div className="p-3 border rounded">
                          <h4 className="font-medium">analysis_responses</h4>
                          <p className="text-sm text-muted-foreground">Analysis results and insights</p>
                        </div>
                        <div className="p-3 border rounded">
                          <h4 className="font-medium">dropdown_categories & dropdown_values</h4>
                          <p className="text-sm text-muted-foreground">Configurable dropdown options</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Security Model</h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• <strong>Row Level Security (RLS):</strong> Data access based on user context</li>
                        <li>• <strong>Role-based Policies:</strong> Different access levels for different user types</li>
                        <li>• <strong>Audit Logging:</strong> Track data changes and access patterns</li>
                        <li>• <strong>Data Encryption:</strong> Sensitive data encrypted at rest and in transit</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Integrations */}
                <div>
                  <h2 className="text-2xl font-bold mb-4">Key Integrations</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Authentication Integration</h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Supabase Auth for user management</li>
                        <li>• JWT token validation</li>
                        <li>• Session management</li>
                        <li>• Role-based access control</li>
                      </ul>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">File Processing</h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Document upload/storage</li>
                        <li>• File type validation</li>
                        <li>• Content analysis</li>
                        <li>• Metadata extraction</li>
                      </ul>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Analytics & Reporting</h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Recharts for data visualization</li>
                        <li>• Custom report generation</li>
                        <li>• Export functionality</li>
                        <li>• Performance metrics</li>
                      </ul>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">UI/UX Framework</h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Shadcn/ui component library</li>
                        <li>• Tailwind CSS styling</li>
                        <li>• Responsive design system</li>
                        <li>• Accessibility compliance</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Deployment */}
                <div>
                  <h2 className="text-2xl font-bold mb-4">Deployment Architecture</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Development Workflow</h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• <strong>Development:</strong> Local development with Vite dev server</li>
                        <li>• <strong>Build Process:</strong> TypeScript compilation and asset optimization</li>
                        <li>• <strong>Testing:</strong> Component testing and integration tests</li>
                        <li>• <strong>Deployment:</strong> Static site generation and CDN distribution</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Environment Configuration</h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-3 border rounded">
                          <h4 className="font-medium text-sm">Development</h4>
                          <ul className="text-xs text-muted-foreground mt-2">
                            <li>• Local Vite server</li>
                            <li>• Hot module replacement</li>
                            <li>• Development database</li>
                          </ul>
                        </div>
                        <div className="p-3 border rounded">
                          <h4 className="font-medium text-sm">Staging</h4>
                          <ul className="text-xs text-muted-foreground mt-2">
                            <li>• Preview deployments</li>
                            <li>• Testing environment</li>
                            <li>• Production-like data</li>
                          </ul>
                        </div>
                        <div className="p-3 border rounded">
                          <h4 className="font-medium text-sm">Production</h4>
                          <ul className="text-xs text-muted-foreground mt-2">
                            <li>• Optimized builds</li>
                            <li>• CDN distribution</li>
                            <li>• Production database</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Monitoring & Maintenance</h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• <strong>Performance Monitoring:</strong> Core Web Vitals and user experience metrics</li>
                        <li>• <strong>Error Tracking:</strong> JavaScript error monitoring and reporting</li>
                        <li>• <strong>Database Monitoring:</strong> Query performance and resource usage</li>
                        <li>• <strong>Security Scanning:</strong> Dependency vulnerability checks</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
                <CardDescription>General system settings and information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Application Version</label>
                    <p className="text-sm text-muted-foreground">VeloSight Beta</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Database Status</label>
                    <p className="text-sm text-muted-foreground">Connected</p>
                  </div>
                  <div className="pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => refetch()}
                      disabled={isLoading}
                    >
                      Refresh System Status
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="categories" className="space-y-6 mt-6">
            {error && (
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
            )}

            {isLoading ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <Card key={i}>
                    <CardHeader>
                      <CardTitle>Loading...</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-center items-center h-32">
                        <p className="text-muted-foreground">Loading categories...</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : categories.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    No dropdown categories found. Please check your database configuration.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {categories.map(category => (
                  <DropdownCategoryEditor
                    key={category.id}
                    categoryId={category.id}
                    categoryName={category.name}
                    categoryDescription={category.description || undefined}
                    values={category.values}
                    onValuesChange={(categoryId, newValues) => {
                      updateCategoryValues(categoryId, newValues);
                      // Optionally refresh data after update
                      setTimeout(() => refetch(), 1000);
                    }}
                    isLoading={false}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>User Information</CardTitle>
                  <CardDescription>
                    View active users and their authentication details. User management is done via Supabase admin panel.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {isUserLoading ? (
                  <div className="flex justify-center items-center h-48">
                    <p className="text-muted-foreground">Loading users...</p>
                  </div>
                ) : users.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Account Created</TableHead>
                        <TableHead>Last Sign In</TableHead>
                        <TableHead>Email Confirmed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map(user => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <User className="mr-2 h-4 w-4" />
                              {user.email}
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">{user.role.replace('_', ' ')}</TableCell>
                          <TableCell>{formatDate(user.created_at)}</TableCell>
                          <TableCell>
                            {user.last_sign_in_at 
                              ? formatDate(user.last_sign_in_at) 
                              : 'Never'}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              user.email_confirmed_at 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {user.email_confirmed_at ? 'Confirmed' : 'Pending'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 space-y-4">
                    <p className="text-muted-foreground">No users found.</p>
                    <p className="text-sm text-muted-foreground">
                      Users can be managed via the Supabase admin panel.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;
