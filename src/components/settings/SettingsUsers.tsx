import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Construction } from 'lucide-react';

const SettingsUsers: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage user accounts, roles, and permissions.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-48 space-y-4">
          <Construction className="h-12 w-12 text-muted-foreground" />
          <div className="text-center space-y-2">
            <p className="text-muted-foreground font-medium">
              User management is coming soon.
            </p>
            <p className="text-sm text-muted-foreground">
              In the meantime, users can be managed via the{' '}
              <Badge variant="outline">Supabase Dashboard</Badge>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SettingsUsers;
